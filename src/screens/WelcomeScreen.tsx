import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import { supabase } from '../services/supabase';
import { Theme } from '../theme/Theme';

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
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState(TEST_EMAIL);
  const [password, setPassword] = useState(TEST_PASSWORD);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    setError(''); setSuccess('');
    if (!email.trim() || !password.trim()) { setError('E-posta ve şifre gerekli'); return; }
    if (mode === 'register' && !displayName.trim()) { setError('Ad Soyad gerekli'); return; }
    setLoading(true);

    if (mode === 'login') {
      const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (e) setError(e.message === 'Invalid login credentials' ? 'E-posta veya şifre hatalı' : e.message);
    } else {
      const { error: e } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { data: { display_name: displayName.trim() } },
      });
      if (e) setError(e.message);
      else setSuccess('Hesabınız oluşturuldu! E-postasınızı doğrulayın.');
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
      options: { redirectTo, queryParams: { prompt: 'select_account' } },
    });

    if (e) {
      setError('Google girişi başarısız: ' + e.message);
      setGoogleLoading(false);
    } else if (data?.url && Platform.OS !== 'web') {
      openURL(data.url);
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.hero}>
          <Text style={s.heroIcon}>🛍️</Text>
          <Text style={s.appName}>Smoke</Text>
          <Text style={s.tagline}>Sigaraı bırakmanın en akıllı yolu</Text>
        </View>

        <View style={s.features}>
          {[
            { icon: '💰', text: 'Türk Lirası tasarruf hesabı' },
            { icon: '🏥', text: 'Sağlık iyileşme zaman çizelgesi' },
            { icon: '🇹🇷', text: 'KVKK uyumlu — verileriniz güvende' },
          ].map((f, i) => (
            <View key={i} style={s.featureRow}>
              <Text style={s.featureIcon}>{f.icon}</Text>
              <Text style={s.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.googleBtn} onPress={handleGoogleSignIn} disabled={googleLoading} activeOpacity={0.85}>
          {googleLoading ? (
            <ActivityIndicator color={Theme.colors.text} size="small" />
          ) : (
            <>
              <View style={s.googleIcon}><Text style={s.googleG}>G</Text></View>
              <Text style={s.googleBtnText}>Google ile Giriş Yap</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>veya e-posta ile</Text>
          <View style={s.dividerLine} />
        </View>

        <View style={s.toggle}>
          {(['login', 'register'] as Mode[]).map(m => (
            <TouchableOpacity key={m} style={[s.toggleBtn, mode === m && s.toggleBtnActive]}
              onPress={() => { setMode(m); setError(''); setSuccess(''); }}>
              <Text style={[s.toggleText, mode === m && s.toggleTextActive]}>
                {m === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.form}>
          {mode === 'register' && (
            <TextInput style={s.input} placeholder="Ad Soyad"
              placeholderTextColor={Theme.colors.textTertiary}
              value={displayName} onChangeText={setDisplayName} autoCapitalize="words" />
          )}
          <View style={s.inputWrapper}>
            <TextInput style={s.input} placeholder="E-posta"
              placeholderTextColor={Theme.colors.textTertiary}
              value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            {email === TEST_EMAIL && (
              <View style={s.testBadge}><Text style={s.testBadgeText}>TEST</Text></View>
            )}
          </View>
          <TextInput style={s.input} placeholder="Şifre"
            placeholderTextColor={Theme.colors.textTertiary}
            value={password} onChangeText={setPassword} secureTextEntry />

          {!!error && <Text style={s.errorText}>{error}</Text>}
          {!!success && <Text style={s.successText}>{success}</Text>}

          <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>{mode === 'login' ? 'Giriş Yap →' : 'Hesap Oluştur →'}</Text>
            }
          </TouchableOpacity>

          {mode === 'login' && email === TEST_EMAIL && (
            <View style={s.testHint}>
              <Text style={s.testHintText}>
                🧪 Test kullanıcısı otomatik dolduruldu. Direkt giriş yapabilirsin.
              </Text>
            </View>
          )}
        </View>

        <Text style={s.legal}>
          Devam ederek{' '}
          <Text style={{ color: Theme.colors.primary }}>Kullanım Koşulları</Text>
          {' '}ve{' '}
          <Text style={{ color: Theme.colors.primary }}>KVKK Aydınlatma Metni</Text>
          {"\'ni kabul etmiş olursunuz."}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { padding: 24, paddingTop: 56, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: 28 },
  heroIcon: { fontSize: 64, marginBottom: 10 },
  appName: { fontSize: 40, fontWeight: '800', color: Theme.colors.text, letterSpacing: 3, marginBottom: 6 },
  tagline: { fontSize: 14, color: Theme.colors.textSecondary, textAlign: 'center' },
  features: { marginBottom: 24, gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Theme.colors.card, borderRadius: Theme.rounded.md, borderWidth: 1, borderColor: Theme.colors.border, padding: 11 },
  featureIcon: { fontSize: 18 },
  featureText: { fontSize: 13, color: Theme.colors.textSecondary, flex: 1 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: Theme.colors.card, borderRadius: Theme.rounded.md, borderWidth: 1.5, borderColor: Theme.colors.borderLight, padding: 14, marginBottom: 16, ...Platform.select({ web: { cursor: 'pointer' } as any }) },
  googleIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  googleG: { fontSize: 14, fontWeight: '800', color: '#4285F4' },
  googleBtnText: { fontSize: 15, fontWeight: '600', color: Theme.colors.text },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Theme.colors.border },
  dividerText: { fontSize: 12, color: Theme.colors.textTertiary },
  toggle: { flexDirection: 'row', backgroundColor: Theme.colors.card, borderRadius: Theme.rounded.lg, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: Theme.colors.border },
  toggleBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: Theme.colors.primary, ...Theme.shadows.glow },
  toggleText: { fontSize: 14, fontWeight: '600', color: Theme.colors.textSecondary },
  toggleTextActive: { color: '#fff' },
  form: { gap: 10, marginBottom: 20 },
  inputWrapper: { position: 'relative' },
  input: { backgroundColor: Theme.colors.card, borderRadius: Theme.rounded.md, borderWidth: 1, borderColor: Theme.colors.border, padding: 14, fontSize: 15, color: Theme.colors.text, ...Platform.select({ web: { outlineStyle: 'none' } as any }) },
  testBadge: { position: 'absolute', right: 10, top: 0, bottom: 0, justifyContent: 'center' },
  testBadgeText: { fontSize: 9, fontWeight: '800', color: Theme.colors.warning, backgroundColor: Theme.colors.warning + '22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, letterSpacing: 0.5 },
  errorText: { color: Theme.colors.error, fontSize: 13, textAlign: 'center' },
  successText: { color: Theme.colors.success, fontSize: 13, textAlign: 'center' },
  btn: { backgroundColor: Theme.colors.primary, borderRadius: Theme.rounded.md, padding: 15, alignItems: 'center', marginTop: 2, ...Theme.shadows.glow },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  testHint: { backgroundColor: Theme.colors.warning + '18', borderRadius: Theme.rounded.md, padding: 10, borderWidth: 1, borderColor: Theme.colors.warning + '44' },
  testHintText: { fontSize: 12, color: Theme.colors.warning, textAlign: 'center', lineHeight: 18 },
  legal: { textAlign: 'center', fontSize: 11, color: Theme.colors.textTertiary, lineHeight: 17 },
});
