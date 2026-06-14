import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import { supabase } from '../services/supabase';
import { Theme, getColors } from '../theme/Theme';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

type Mode = 'login' | 'register';

const TEST_EMAIL = 'test@smoke.app';
const TEST_PASSWORD = 'Test1234!';

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
  const [email, setEmail] = useState(TEST_EMAIL);
  const [password, setPassword] = useState(TEST_PASSWORD);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    setError(''); setSuccess('');
    if (!email.trim() || !password.trim()) { setError(t.emailRequired); return; }
    if (authMode === 'register' && !displayName.trim()) { setError(t.nameRequired); return; }
    setLoading(true);

    if (authMode === 'login') {
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

  const orbOpacity = isDark ? 0.15 : 0.08;
  const orb2Opacity = isDark ? 0.10 : 0.06;

  const glassCardStyle = {
    backgroundColor: isDark ? 'rgba(18, 18, 42, 0.75)' : colors.cardGlass,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardGlassBorder,
    ...Platform.select({ web: isDark ? { backdropFilter: 'blur(20px)' } as any : {} }),
  };

  const inputStyle = {
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    borderRadius: Theme.rounded.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Background */}
      <View style={[s.bgContainer, { backgroundColor: colors.background }]} pointerEvents="none">
        <View style={[s.orb1, { backgroundColor: `rgba(124,58,237,${orbOpacity})` }]} />
        <View style={[s.orb2, { backgroundColor: `rgba(6,182,212,${orb2Opacity})` }]} />
      </View>

      {/* Language switcher */}
      <View style={s.langSwitcher}>
        {(['tr', 'en'] as const).map(l => (
          <TouchableOpacity
            key={l}
            style={[
              s.langBtn,
              lang === l
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' },
            ]}
            onPress={() => setLang(l)}
            activeOpacity={0.8}
          >
            <Text style={[s.langText, { color: lang === l ? '#fff' : colors.textSecondary }]}>
              {l === 'tr' ? '🇹🇷 TR' : '🇬🇧 EN'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.iconHalo}>
            <View style={s.iconInner}>
              <Text style={s.heroIcon}>🚭</Text>
            </View>
          </View>
          <Text style={[s.appName, { color: colors.text }]}>{t.appName}</Text>
          <Text style={[s.tagline, { color: colors.textSecondary }]}>{t.appTagline}</Text>
        </View>

        {/* Features */}
        <View style={s.features}>
          {[
            { icon: '💰', text: t.feature1 },
            { icon: '❤️', text: t.feature2 },
            { icon: '🇹🇷', text: t.feature3 },
          ].map((f, i) => (
            <View key={i} style={[s.featureRow, glassCardStyle, { borderRadius: Theme.rounded.md }]}>
              <View style={s.featureIconWrap}>
                <Text style={s.featureIcon}>{f.icon}</Text>
              </View>
              <Text style={[s.featureText, { color: colors.textSecondary }]}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Auth Card */}
        <View style={[glassCardStyle, s.authCard]}>
          {/* Toggle */}
          <View style={[s.toggle, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          }]}>
            {(['login', 'register'] as Mode[]).map(m => (
              <TouchableOpacity
                key={m}
                style={[s.toggleBtn, authMode === m && s.toggleBtnActive]}
                onPress={() => { setAuthMode(m); setError(''); setSuccess(''); }}
                activeOpacity={0.8}
              >
                <Text style={[s.toggleText, { color: colors.textSecondary }, authMode === m && s.toggleTextActive]}>
                  {m === 'login' ? t.signIn : t.signUp}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Google */}
          <TouchableOpacity
            style={s.googleBtn}
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
            activeOpacity={0.85}
          >
            {googleLoading ? (
              <ActivityIndicator color="#1a1a1a" size="small" />
            ) : (
              <>
                <View style={s.googleIcon}>
                  <Text style={s.googleG}>G</Text>
                </View>
                <Text style={s.googleBtnText}>{t.continueWithGoogle}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.divider}>
            <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[s.dividerText, { color: colors.textTertiary }]}>{t.or}</Text>
            <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Form */}
          <View style={s.form}>
            {authMode === 'register' && (
              <TextInput
                style={inputStyle}
                placeholder={t.fullName}
                placeholderTextColor={colors.textTertiary}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            )}

            <View style={s.inputWrapper}>
              <TextInput
                style={inputStyle}
                placeholder={t.email}
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {email === TEST_EMAIL && (
                <View style={s.testBadge}>
                  <Text style={[s.testBadgeText, { color: Theme.colors.warning, backgroundColor: Theme.colors.warning + '22' }]}>TEST</Text>
                </View>
              )}
            </View>

            <TextInput
              style={inputStyle}
              placeholder={t.password}
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {authMode === 'login' && (
              <TouchableOpacity activeOpacity={0.7} style={{ alignSelf: 'flex-end' }}>
                <Text style={[s.forgotText, { color: colors.primary }]}>{t.forgotPassword}</Text>
              </TouchableOpacity>
            )}

            {!!error && <Text style={[s.errorText, { color: colors.error }]}>{error}</Text>}
            {!!success && <Text style={[s.successText, { color: colors.success }]}>{success}</Text>}

            <TouchableOpacity
              style={s.submitBtn}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.submitBtnText}>
                  {authMode === 'login' ? `${t.signIn} →` : `${t.createAccount} →`}
                </Text>
              )}
            </TouchableOpacity>

            {authMode === 'login' && email === TEST_EMAIL && (
              <View style={[s.testHint, { backgroundColor: Theme.colors.warning + '18', borderColor: Theme.colors.warning + '44' }]}>
                <Text style={[s.testHintText, { color: Theme.colors.warning }]}>
                  🧪 {lang === 'tr' ? 'Test kullanıcısı otomatik dolduruldu' : 'Test user pre-filled'}
                </Text>
              </View>
            )}
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
  bgContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    overflow: 'hidden',
  },
  orb1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    top: -80,
    left: -80,
    ...Platform.select({ web: { filter: 'blur(80px)' } as any }),
  },
  orb2: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    bottom: 80,
    right: -80,
    ...Platform.select({ web: { filter: 'blur(80px)' } as any }),
  },

  // Language switcher
  langSwitcher: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    right: 20,
    flexDirection: 'row',
    gap: 6,
    zIndex: 10,
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  langText: { fontSize: 12, fontWeight: '600' },

  container: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },

  // Hero
  hero: { alignItems: 'center', marginBottom: 28 },
  iconHalo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(124,58,237,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Platform.select({
      web: { boxShadow: '0 0 40px rgba(124,58,237,0.4)' } as any,
      default: { shadowColor: '#7C3AED', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
    }),
  },
  iconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(124,58,237,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: { fontSize: 38 },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    textAlign: 'center',
  },

  // Features
  features: { marginBottom: 24, gap: 8 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124,58,237,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: { fontSize: 18 },
  featureText: { fontSize: 13, flex: 1 },

  // Auth Card
  authCard: {
    borderRadius: Theme.rounded.xl,
    padding: 20,
    marginBottom: 20,
    gap: 0,
  },

  // Toggle
  toggle: {
    flexDirection: 'row',
    borderRadius: Theme.rounded.lg,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: Theme.colors.primary,
    ...Platform.select({
      web: { boxShadow: '0 0 20px rgba(124,58,237,0.4)' } as any,
      default: { shadowColor: '#7C3AED', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
    }),
  },
  toggleText: { fontSize: 14, fontWeight: '600' },
  toggleTextActive: { color: '#fff' },

  // Google
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: Theme.rounded.md,
    padding: 13,
    marginBottom: 16,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  googleG: { fontSize: 14, fontWeight: '800', color: '#4285F4' },
  googleBtnText: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12 },

  // Form
  form: { gap: 10 },
  inputWrapper: { position: 'relative' },
  testBadge: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  testBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 0.5,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorText: { fontSize: 13, textAlign: 'center' },
  successText: { fontSize: 13, textAlign: 'center' },

  submitBtn: {
    borderRadius: Theme.rounded.md,
    padding: 15,
    alignItems: 'center',
    marginTop: 4,
    ...Platform.select({
      web: {
        background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
        boxShadow: '0 0 30px rgba(124,58,237,0.45)',
      } as any,
      default: {
        backgroundColor: Theme.colors.primary,
        shadowColor: '#7C3AED',
        shadowOpacity: 0.45,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 0 },
        elevation: 6,
      },
    }),
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  testHint: {
    borderRadius: Theme.rounded.md,
    padding: 10,
    borderWidth: 1,
  },
  testHintText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },

  legal: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 17,
  },
});
