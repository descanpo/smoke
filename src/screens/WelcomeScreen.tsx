import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { supabase } from '../services/supabase';
import { Theme } from '../theme/Theme';

type Mode = 'login' | 'register';

export default function WelcomeScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
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

        <View style={s.toggle}>
          {(['login', 'register'] as Mode[]).map(m => (
            <TouchableOpacity
              key={m} style={[s.toggleBtn, mode === m && s.toggleBtnActive]}
              onPress={() => { setMode(m); setError(''); setSuccess(''); }}
            >
              <Text style={[s.toggleText, mode === m && s.toggleTextActive]}>
                {m === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.form}>
          {mode === 'register' && (
            <TextInput
              style={s.input} placeholder="Ad Soyad"
              placeholderTextColor={Theme.colors.textTertiary}
              value={displayName} onChangeText={setDisplayName} autoCapitalize="words"
            />
          )}
          <TextInput
            style={s.input} placeholder="E-posta"
            placeholderTextColor={Theme.colors.textTertiary}
            value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none"
          />
          <TextInput
            style={s.input} placeholder="Şifre (en az 6 karakter)"
            placeholderTextColor={Theme.colors.textTertiary}
            value={password} onChangeText={setPassword} secureTextEntry
          />

          {!!error && <Text style={s.errorText}>{error}</Text>}
          {!!success && <Text style={s.successText}>{success}</Text>}

          <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>{mode === 'login' ? 'Giriş Yap →' : 'Hesap Oluştur →'}</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={s.legal}>
          Devam ederek{' '}
          <Text style={{ color: Theme.colors.primary }}>Kullanım Koşulları</Text>
          {' '}ve{' '}
          <Text style={{ color: Theme.colors.primary }}>KVKK Aydınlatma Metni</Text>
          'ni kabul etmiş olursunuz.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { padding: 24, paddingTop: 56, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: 32 },
  heroIcon: { fontSize: 72, marginBottom: 12 },
  appName: { fontSize: 40, fontWeight: '800', color: Theme.colors.text, letterSpacing: 3, marginBottom: 8 },
  tagline: { fontSize: 15, color: Theme.colors.textSecondary, textAlign: 'center' },
  features: { marginBottom: 28, gap: 8 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Theme.colors.card, borderRadius: Theme.rounded.md,
    borderWidth: 1, borderColor: Theme.colors.border, padding: 12,
  },
  featureIcon: { fontSize: 20 },
  featureText: { fontSize: 13, color: Theme.colors.textSecondary, flex: 1 },
  toggle: {
    flexDirection: 'row', backgroundColor: Theme.colors.card,
    borderRadius: Theme.rounded.lg, padding: 4, marginBottom: 20,
    borderWidth: 1, borderColor: Theme.colors.border,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: Theme.colors.primary, ...Theme.shadows.glow },
  toggleText: { fontSize: 14, fontWeight: '600', color: Theme.colors.textSecondary },
  toggleTextActive: { color: '#fff' },
  form: { gap: 12, marginBottom: 24 },
  input: {
    backgroundColor: Theme.colors.card, borderRadius: Theme.rounded.md,
    borderWidth: 1, borderColor: Theme.colors.border,
    padding: 14, fontSize: 15, color: Theme.colors.text,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  errorText: { color: Theme.colors.error, fontSize: 14, textAlign: 'center' },
  successText: { color: Theme.colors.success, fontSize: 14, textAlign: 'center' },
  btn: {
    backgroundColor: Theme.colors.primary, borderRadius: Theme.rounded.md,
    padding: 16, alignItems: 'center', marginTop: 4, ...Theme.shadows.glow,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  legal: { textAlign: 'center', fontSize: 12, color: Theme.colors.textTertiary, lineHeight: 18 },
});
