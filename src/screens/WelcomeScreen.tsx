import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Linking, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { Theme, getColors } from '../theme/Theme';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

type Mode = 'login' | 'register';

// Official 4-color Google "G" logo, embedded as an SVG data URI (no extra deps).
const GOOGLE_LOGO = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">' +
  '<path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>' +
  '<path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>' +
  '<path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>' +
  '<path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>' +
  '</svg>'
);

function openURL(url: string) {
  if (Platform.OS === 'web') {
    (window as any).location.href = url;
  } else {
    Linking.openURL(url);
  }
}

export default function WelcomeScreen() {
  const { mode, isDark } = useThemeMode();
  const { lang, t, setLang } = useLanguage();
  const colors = getColors(mode);

  const [authMode, setAuthMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isLogin = authMode === 'login';

  const handleSubmit = async () => {
    setError(''); setSuccess('');
    if (!email.trim() || !password.trim()) { setError(t.emailRequired); return; }
    if (!isLogin && !displayName.trim()) { setError(t.nameRequired); return; }
    setLoading(true);

    if (isLogin) {
      const { error: e } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (e) setError(e.message === 'Invalid login credentials' ? t.invalidCredentials : e.message);
    } else {
      const { error: e } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { data: { display_name: displayName.trim() } },
      });
      if (e) setError(e.message);
      else setSuccess(t.accountCreated);
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    setError(''); setSuccess('');
    if (!email.trim()) {
      setError(lang === 'tr'
        ? 'Önce e-posta adresini gir, sonra sıfırlama bağlantısı gönderelim.'
        : 'Enter your email first, then we’ll send a reset link.');
      return;
    }
    setLoading(true);
    const redirectTo = Platform.OS === 'web' ? (window as any).location.origin : 'smoke://auth/callback';
    const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setLoading(false);
    if (e) { setError(e.message); return; }
    setSuccess(lang === 'tr'
      ? 'Şifre sıfırlama bağlantısı e-postana gönderildi.'
      : 'A password reset link has been sent to your email.');
  };

  const handleGoogleSignIn = async () => {
    setError(''); setGoogleLoading(true);
    const redirectTo = Platform.OS === 'web'
      ? (window as any).location.origin
      : 'smoke://auth/callback';

    const { data, error: e } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { prompt: 'select_account' },
      },
    });

    if (e) {
      setError(t.googleFailed + ': ' + e.message);
      setGoogleLoading(false);
    } else if (data?.url && Platform.OS !== 'web') {
      openURL(data.url);
      setGoogleLoading(false);
    }
  };

  const wrapStyle = (key: string) => [
    s.inputWrap,
    {
      backgroundColor: focused === key ? colors.cardElevated : colors.surface,
      borderColor: focused === key ? colors.primary : colors.border,
    },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Language switcher */}
      <View style={s.langSwitcher}>
        {(['tr', 'en'] as const).map(l => (
          <TouchableOpacity
            key={l}
            style={[
              s.langBtn,
              lang === l
                ? { backgroundColor: colors.primary }
                : { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
            ]}
            onPress={() => setLang(l)}
            activeOpacity={0.8}
          >
            <Text style={[s.langText, { color: lang === l ? '#fff' : colors.textSecondary }]}>
              {l === 'tr' ? 'TR' : 'EN'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={s.brand}>
          <View style={[s.logoMark, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}>
            <Text style={s.logoEmoji}>🚭</Text>
          </View>
          <Text style={[s.appName, { color: colors.text }]}>{t.appName}</Text>
          <Text style={[s.tagline, { color: colors.textSecondary }]}>{t.appTagline}</Text>
        </View>

        {/* Heading (outside the card for a calmer hierarchy) */}
        <View style={s.heading}>
          <Text style={[s.headingTitle, { color: colors.text }]}>
            {isLogin ? t.welcomeBack : t.createAccountTitle}
          </Text>
          <Text style={[s.headingSubtitle, { color: colors.textTertiary }]}>
            {isLogin ? t.loginSubtitle : t.registerSubtitle}
          </Text>
        </View>

        {/* Auth card */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Segmented toggle */}
          <View style={[s.segment, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          }]}>
            {(['login', 'register'] as Mode[]).map(m => {
              const active = authMode === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[s.segmentBtn, active && [{ backgroundColor: colors.card }, Theme.shadows.soft]]}
                  onPress={() => { setAuthMode(m); setError(''); setSuccess(''); }}
                  activeOpacity={0.85}
                >
                  <Text style={[s.segmentText, { color: active ? colors.primary : colors.textSecondary }]}>
                    {m === 'login' ? t.signIn : t.signUp}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Form */}
          <View style={s.form}>
            {!isLogin && (
              <View style={s.fieldGroup}>
                <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>{t.fullName}</Text>
                <View style={wrapStyle('name')}>
                  <TextInput
                    style={[s.input, { color: colors.text }]}
                    placeholder={t.fullName}
                    placeholderTextColor={colors.textTertiary}
                    value={displayName}
                    onChangeText={setDisplayName}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused(null)}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            <View style={s.fieldGroup}>
              <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>{t.email}</Text>
              <View style={wrapStyle('email')}>
                <TextInput
                  style={[s.input, { color: colors.text }]}
                  placeholder="ornek@email.com"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            <View style={s.fieldGroup}>
              <View style={s.labelRow}>
                <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>{t.password}</Text>
                {isLogin && (
                  <TouchableOpacity activeOpacity={0.7} onPress={handleForgotPassword} disabled={loading}>
                    <Text style={[s.forgotText, { color: colors.primary }]}>{t.forgotPassword}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={[wrapStyle('password'), s.passwordWrap]}>
                <TextInput
                  style={[s.input, { color: colors.text, flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={s.eyeBtn}
                  onPress={() => setShowPassword(v => !v)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {!!error && <Text style={[s.errorText, { color: colors.error }]}>{error}</Text>}
            {!!success && <Text style={[s.successText, { color: colors.success }]}>{success}</Text>}

            <TouchableOpacity
              style={[s.submitBtn, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.submitBtnText}>
                  {isLogin ? t.signIn : t.createAccount}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divider}>
              <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[s.dividerText, { color: colors.textTertiary }]}>{t.or}</Text>
              <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Google */}
            <TouchableOpacity
              style={[s.googleBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
              activeOpacity={0.9}
            >
              {googleLoading ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <>
                  <Image source={{ uri: GOOGLE_LOGO }} style={s.googleLogo} resizeMode="contain" />
                  <Text style={[s.googleBtnText, { color: colors.text }]}>{t.continueWithGoogle}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[s.legal, { color: colors.textTertiary }]}>
          {t.termsNotice}{' '}
          <Text style={{ color: colors.primary }}>{t.termsLink}</Text>
          {' '}{t.and}{' '}
          <Text style={{ color: colors.primary }}>{t.kvkkLink}</Text>
          {t.accepted}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  langSwitcher: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 38,
    right: 20,
    flexDirection: 'row',
    gap: 6,
    zIndex: 10,
  },
  langBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  langText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 72,
  },

  // Brand
  brand: { alignItems: 'center', marginBottom: 24 },
  logoMark: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    ...Theme.shadows.soft,
  },
  logoEmoji: { fontSize: 34 },
  appName: { fontSize: 30, fontWeight: '800', letterSpacing: 0.5, marginBottom: 2 },
  tagline: { fontSize: 13, textAlign: 'center' },

  // Heading
  heading: { marginBottom: 18 },
  headingTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4, textAlign: 'center' },
  headingSubtitle: { fontSize: 14, marginTop: 6, textAlign: 'center', lineHeight: 20 },

  // Card
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    ...Theme.shadows.card,
  },

  // Segmented control
  segment: { flexDirection: 'row', borderRadius: 13, padding: 4, marginBottom: 20 },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  segmentText: { fontSize: 14, fontWeight: '700' },

  // Form
  form: { gap: 16 },
  fieldGroup: { gap: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginLeft: 2 },
  inputWrap: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    paddingVertical: 0,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  passwordWrap: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { paddingLeft: 10 },
  forgotText: { fontSize: 12.5, fontWeight: '600' },
  errorText: { fontSize: 13, textAlign: 'center', fontWeight: '500', marginTop: -2 },
  successText: { fontSize: 13, textAlign: 'center', fontWeight: '500', marginTop: -2 },

  submitBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    ...Theme.shadows.primary,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 2 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: '500' },

  // Google
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  googleLogo: { width: 18, height: 18 },
  googleBtnText: { fontSize: 15, fontWeight: '700' },

  legal: { textAlign: 'center', fontSize: 11, lineHeight: 17, marginTop: 22 },
});
