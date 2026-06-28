import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform, Image, Linking, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Theme, getColors } from '../theme/Theme';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { signInWithGoogle, signInWithApple, isAppleAuthAvailable } from '../services/auth';

type IconName = keyof typeof Ionicons.glyphMap;

// Official 4-color Google "G" logo, embedded as an SVG data URI (no extra deps).
const GOOGLE_LOGO = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">' +
  '<path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>' +
  '<path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>' +
  '<path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>' +
  '<path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>' +
  '</svg>'
);

export default function WelcomeScreen() {
  const { mode, isDark } = useThemeMode();
  const { lang, t, setLang } = useLanguage();
  const colors = getColors(mode);

  const [appleAvailable, setAppleAvailable] = useState(false);
  const [loading, setLoading] = useState<null | 'google' | 'apple'>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    isAppleAuthAvailable().then(setAppleAvailable);
  }, []);

  const handleGoogle = async () => {
    if (loading) return;
    setError(''); setLoading('google');
    try {
      await signInWithGoogle();
      // onAuthStateChange (App.tsx) handles navigation on success.
    } catch (e: any) {
      setError(t.googleFailed + (e?.message ? `: ${e.message}` : ''));
    } finally {
      setLoading(null);
    }
  };

  const handleApple = async () => {
    if (loading) return;
    setError(''); setLoading('apple');
    try {
      await signInWithApple();
    } catch (e: any) {
      if (e?.code !== 'ERR_REQUEST_CANCELED' && e?.code !== 'ERR_CANCELED') {
        setError(
          (lang === 'tr' ? 'Apple girişi başarısız' : 'Apple sign in failed') +
          (e?.message ? `: ${e.message}` : ''),
        );
      }
    } finally {
      setLoading(null);
    }
  };

  const busy = loading !== null;

  const VALUES: { icon: IconName; text: string; tint: string }[] = [
    { icon: 'leaf-outline', text: t.authValue1, tint: colors.secondary },
    { icon: 'sparkles-outline', text: t.authValue2, tint: colors.primary },
    { icon: 'shield-checkmark-outline', text: t.authValue3, tint: colors.success },
  ];

  return (
    <LinearGradient
      colors={isDark ? Theme.gradients.auroraDark : Theme.gradients.auroraLight}
      style={{ flex: 1 }}
    >
      {/* Soft brand aura behind the logo */}
      <LinearGradient
        colors={Theme.gradients.glow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={s.aura}
        pointerEvents="none"
      />

      {/* Language switcher */}
      <View style={s.langSwitcher}>
        {(['tr', 'en'] as const).map(l => (
          <TouchableOpacity
            key={l}
            style={[
              s.langBtn,
              lang === l
                ? { backgroundColor: colors.primary }
                : { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)' },
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
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Top: brand + value props ── */}
        <View>
          <View style={s.brand}>
            <LinearGradient
              colors={Theme.gradients.brandTeal}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.logoMark}
            >
              <Text style={s.logoEmoji}>🚭</Text>
            </LinearGradient>
            <Text style={[s.appName, { color: colors.text }]}>{t.appName}</Text>
            <Text style={[s.headline, { color: colors.text }]}>{t.authHeadline}</Text>
            <Text style={[s.tagline, { color: colors.textSecondary }]}>{t.appTagline}</Text>
          </View>

          <View style={s.values}>
            {VALUES.map(v => (
              <View key={v.text} style={s.valueRow}>
                <View style={[s.valueIcon, { backgroundColor: v.tint + (isDark ? '26' : '1A') }]}>
                  <Ionicons name={v.icon} size={18} color={v.tint} />
                </View>
                <Text style={[s.valueText, { color: colors.textSecondary }]}>{v.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Bottom: auth + trust + legal ── */}
        <View style={s.bottom}>
          {appleAvailable && (
            loading === 'apple' ? (
              <View style={[s.appleFallback, { backgroundColor: isDark ? '#fff' : '#000' }]}>
                <ActivityIndicator color={isDark ? '#000' : '#fff'} />
              </View>
            ) : (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                buttonStyle={
                  isDark
                    ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                    : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={16}
                style={s.appleBtn}
                onPress={handleApple}
              />
            )
          )}

          {/* Google */}
          <TouchableOpacity
            style={s.googleBtn}
            onPress={handleGoogle}
            disabled={busy}
            activeOpacity={0.9}
          >
            {loading === 'google' ? (
              <ActivityIndicator color="#1f1f1f" size="small" />
            ) : (
              <>
                <Image source={{ uri: GOOGLE_LOGO }} style={s.googleLogo} resizeMode="contain" />
                <Text style={s.googleBtnText}>{t.continueWithGoogle}</Text>
              </>
            )}
          </TouchableOpacity>

          {!!error && <Text style={[s.errorText, { color: colors.error }]}>{error}</Text>}

          {/* Trust line */}
          <View style={s.trustRow}>
            <Ionicons name="lock-closed" size={12} color={colors.textTertiary} />
            <Text style={[s.trustText, { color: colors.textTertiary }]}>{t.authTrust}</Text>
          </View>

          {/* Legal */}
          <Text style={[s.legal, { color: colors.textTertiary }]}>
            {t.authLegalIntro}{' '}
            <Text style={{ color: colors.primary }} onPress={() => Linking.openURL('https://descanpo.github.io/smoke/legal/terms.html')}>
              {t.termsLink}
            </Text>
            {' '}{t.and}{' '}
            <Text style={{ color: colors.primary }} onPress={() => Linking.openURL('https://descanpo.github.io/smoke/legal/kvkk.html')}>
              {t.kvkkLink}
            </Text>
            {t.accepted}
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  aura: { position: 'absolute', top: 0, left: 0, right: 0, height: 380 },

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
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 120 : 104,
    paddingBottom: 28,
  },

  // Brand
  brand: { alignItems: 'center' },
  logoMark: {
    width: 88, height: 88, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 22,
    ...Platform.select({
      web: { boxShadow: '0 12px 30px rgba(124,58,237,0.45)' } as any,
      default: { shadowColor: '#7C3AED', shadowOpacity: 0.45, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 10 },
    }),
  },
  logoEmoji: { fontSize: 42 },
  appName: { fontSize: 30, fontWeight: '800', letterSpacing: 2, marginBottom: 14 },
  headline: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center', lineHeight: 32 },
  tagline: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 8 },

  // Value props
  values: { marginTop: 36, gap: 16, alignSelf: 'stretch' },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  valueIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  valueText: { flex: 1, fontSize: 14.5, fontWeight: '600', lineHeight: 19 },

  // Bottom group
  bottom: { marginTop: 40 },
  appleBtn: { width: '100%', height: 54, marginBottom: 12 },
  appleFallback: {
    width: '100%', height: 54, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    ...Platform.select({
      web: { cursor: 'pointer', boxShadow: '0 6px 18px rgba(0,0,0,0.18)' } as any,
      default: { shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
    }),
  },
  googleLogo: { width: 19, height: 19 },
  googleBtnText: { fontSize: 15.5, fontWeight: '700', color: '#1f1f1f' },

  errorText: { fontSize: 13, textAlign: 'center', fontWeight: '500', marginTop: 14 },

  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 },
  trustText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },

  legal: { textAlign: 'center', fontSize: 11, lineHeight: 17, marginTop: 14, paddingHorizontal: 8 },
});
