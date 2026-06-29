import { Platform, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from './supabase';

// Required for the web-browser based OAuth flow to dismiss correctly.
WebBrowser.maybeCompleteAuthSession();

const NATIVE_REDIRECT = 'smoke://auth/callback';

/**
 * Google sign-in.
 * - Web: full-page redirect; `detectSessionInUrl: true` (supabase client) finishes it.
 * - Native: open the OAuth URL in an in-app browser, then exchange the returned
 *   `?code=` for a session (PKCE). Mirrors the proven CallFit flow.
 */
export async function signInWithGoogle() {
  if (Platform.OS === 'web') {
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : '';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, queryParams: { prompt: 'select_account' } },
    });
    if (error) throw new Error(error.message);
    return null;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: NATIVE_REDIRECT,
      skipBrowserRedirect: true,
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) throw new Error(error.message);
  if (!data?.url) throw new Error('Google OAuth URL alınamadı');

  const result = await WebBrowser.openAuthSessionAsync(data.url, NATIVE_REDIRECT);

  if (result.type === 'success' && result.url) {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.exchangeCodeForSession(result.url);
    if (sessionError) throw new Error(sessionError.message);
    return sessionData;
  }

  // User dismissed the browser — not an error, just no session.
  return null;
}

/** Apple Sign-In is only available on a real iOS 13+ build. */
export async function isAppleAuthAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Native "Sign in with Apple" → Supabase signInWithIdToken.
 * Apple returns the user's name ONLY on the very first authorization, so we
 * persist it to auth metadata + profiles when present (the Home greeting and
 * Onboarding prefill both read `user_metadata.display_name`).
 */
export async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error('Apple kimlik doğrulaması başarısız (identityToken alınamadı)');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) throw new Error(error.message);

  const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (fullName && data.user) {
    // Best-effort: only fill the name if it isn't set yet. Never block sign-in.
    supabase.auth.updateUser({ data: { display_name: fullName } }).catch(() => {});
    supabase
      .from('profiles')
      .update({ display_name: fullName })
      .eq('id', data.user.id)
      .is('display_name', null)
      .then(() => {}, () => {});
  }

  return data;
}

/** Email/password sign-up. */
export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName || '' } },
  });
  if (error) throw new Error(error.message);
  return data;
}

/** Email/password sign-in. */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

/** Request password reset email. */
export async function requestPasswordReset(email: string) {
  const redirectUrl = Platform.OS === 'web'
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/reset-password`
    : 'https://descanpo.github.io/smoke/reset-password';

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
  if (error) throw new Error(error.message);
}

/** Local sign-out (clears the persisted session). */
export async function signOut() {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {}
}
