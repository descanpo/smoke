import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform, ScrollView, KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Theme, getColors } from '../theme/Theme';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '../navigation/Navigator';
import { requestPasswordReset } from '../services/auth';
import { supabase } from '../services/supabase';

export default function ForgotPasswordScreen() {
  const { mode, isDark } = useThemeMode();
  const { lang } = useLanguage();
  const { goBack } = useNavigation();
  const colors = getColors(mode);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      setError(lang === 'tr' ? 'E-posta adresinizi girin' : 'Please enter your email');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Check session BEFORE reset
      const { data: sessionBefore } = await supabase.auth.getSession();
      console.log('📧 [BEFORE reset] Session:', sessionBefore?.session ? 'EXISTS' : 'NONE');

      await requestPasswordReset(email);

      // Check session AFTER reset
      const { data: sessionAfter } = await supabase.auth.getSession();
      console.log('📧 [AFTER reset] Session:', sessionAfter?.session ? 'EXISTS' : 'NONE');

      setSuccess(true);
    } catch (e: any) {
      setError(e.message || (lang === 'tr' ? 'Hata oluştu' : 'Error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <LinearGradient
        colors={isDark ? Theme.gradients.auroraDark : Theme.gradients.auroraLight}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={s.container}>
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => goBack()} style={s.backBtn}>
              <Ionicons name="chevron-back" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={[s.title, { color: colors.text }]}>
              {lang === 'tr' ? 'Şifremi Unuttum' : 'Reset Password'}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          {success ? (
            <View style={s.successContainer}>
              <View style={[s.iconCircle, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="checkmark-circle" size={60} color={colors.success} />
              </View>
              <Text style={[s.successTitle, { color: colors.text }]}>
                {lang === 'tr' ? 'E-posta Gönderildi!' : 'Email Sent!'}
              </Text>
              <Text style={[s.successDesc, { color: colors.textSecondary }]}>
                {lang === 'tr'
                  ? `${email} adresine şifre sıfırlama bağlantısı gönderdik.`
                  : `We've sent a password reset link to ${email}.`}
              </Text>
              <Text style={[s.successNote, { color: colors.textTertiary }]}>
                {lang === 'tr'
                  ? 'Lütfen e-postanızı kontrol edin ve verilen talimatları izleyin.'
                  : 'Please check your email and follow the instructions.'}
              </Text>

              <TouchableOpacity
                style={[s.doneBtn, { backgroundColor: colors.primary }]}
                onPress={() => goBack()}
              >
                <Text style={s.doneBtnText}>
                  {lang === 'tr' ? 'Giriş Sayfasına Dön' : 'Back to Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.form}>
              <View style={s.infoBox}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <Text style={[s.infoText, { color: colors.textSecondary }]}>
                  {lang === 'tr'
                    ? 'Hesabınızla ilişkili e-posta adresini girin.'
                    : 'Enter the email address associated with your account.'}
                </Text>
              </View>

              <View style={s.inputGroup}>
                <Text style={[s.label, { color: colors.textSecondary }]}>
                  {lang === 'tr' ? 'E-posta' : 'Email Address'}
                </Text>
                <TextInput
                  style={[
                    s.input,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
                      color: colors.text,
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    },
                  ]}
                  placeholder="example@mail.com"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>

              {error && <Text style={[s.errorText, { color: colors.error }]}>{error}</Text>}

              <TouchableOpacity
                style={[s.submitBtn, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]}
                onPress={handleReset}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.submitBtnText}>
                    {lang === 'tr' ? 'Sıfırlama Bağlantısı Gönder' : 'Send Reset Link'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => goBack()}>
                <Text style={[s.backLink, { color: colors.primary }]}>
                  {lang === 'tr' ? '← Giriş Sayfasına Dön' : '← Back to Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 20 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
    marginTop: Platform.OS === 'ios' ? 16 : 8,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },

  form: { gap: 24 },

  infoBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },

  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
  input: { height: 52, borderRadius: 14, paddingHorizontal: 16, fontSize: 16, borderWidth: 1 },

  errorText: { fontSize: 13, textAlign: 'center', fontWeight: '500' },

  submitBtn: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  backLink: { textAlign: 'center', fontSize: 14, fontWeight: '600', marginTop: 8 },

  successContainer: { alignItems: 'center', paddingVertical: 40, gap: 16 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  successTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  successDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  successNote: { fontSize: 13, textAlign: 'center', lineHeight: 18, marginTop: 8 },
  doneBtn: { width: '100%', height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
