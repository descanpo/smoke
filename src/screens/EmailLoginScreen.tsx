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
import { signInWithEmail, signUpWithEmail } from '../services/auth';

export default function EmailLoginScreen() {
  const { mode, isDark } = useThemeMode();
  const { lang, t } = useLanguage();
  const { navigate, goBack } = useNavigation();
  const colors = getColors(mode);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError(lang === 'tr' ? 'Lütfen tüm alanları doldurun' : 'Please fill all fields');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          setError(lang === 'tr' ? 'Adınızı girin' : 'Enter your name');
          setLoading(false);
          return;
        }
        await signUpWithEmail(email, password, displayName);
        setError(lang === 'tr'
          ? 'Kayıt başarılı! Lütfen e-postanızı doğrulayın.'
          : 'Sign up successful! Please verify your email.');
      } else {
        await signInWithEmail(email, password);
      }
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
              {isSignUp ? (lang === 'tr' ? 'Kayıt Ol' : 'Sign Up') : (lang === 'tr' ? 'Giriş Yap' : 'Sign In')}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Form */}
          <View style={s.form}>
            {isSignUp && (
              <View style={s.inputGroup}>
                <Text style={[s.label, { color: colors.textSecondary }]}>
                  {lang === 'tr' ? 'Adınız' : 'Your Name'}
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
                  placeholder={lang === 'tr' ? 'John Doe' : 'John Doe'}
                  placeholderTextColor={colors.textTertiary}
                  value={displayName}
                  onChangeText={setDisplayName}
                  editable={!loading}
                />
              </View>
            )}

            <View style={s.inputGroup}>
              <Text style={[s.label, { color: colors.textSecondary }]}>
                {lang === 'tr' ? 'E-posta' : 'Email'}
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

            <View style={s.inputGroup}>
              <Text style={[s.label, { color: colors.textSecondary }]}>
                {lang === 'tr' ? 'Şifre' : 'Password'}
              </Text>
              <View style={s.passwordContainer}>
                <TextInput
                  style={[
                    s.input,
                    s.passwordInput,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
                      color: colors.text,
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    },
                  ]}
                  placeholder={lang === 'tr' ? 'En az 6 karakter' : 'At least 6 characters'}
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={s.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {error && <Text style={[s.errorText, { color: colors.error }]}>{error}</Text>}

            <TouchableOpacity
              style={[s.submitBtn, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.submitBtnText}>
                  {isSignUp ? (lang === 'tr' ? 'Kayıt Ol' : 'Sign Up') : (lang === 'tr' ? 'Giriş Yap' : 'Sign In')}
                </Text>
              )}
            </TouchableOpacity>

            {!isSignUp && (
              <TouchableOpacity
                onPress={() => navigate('ForgotPassword')}
                style={s.forgotBtn}
              >
                <Text style={[s.forgotText, { color: colors.primary }]}>
                  {lang === 'tr' ? 'Şifremi Unuttum' : 'Forgot Password?'}
                </Text>
              </TouchableOpacity>
            )}

            <View style={s.toggleContainer}>
              <Text style={[s.toggleText, { color: colors.textSecondary }]}>
                {isSignUp
                  ? (lang === 'tr' ? 'Zaten hesabın var mı?' : 'Already have an account?')
                  : (lang === 'tr' ? 'Henüz hesabın yok mu?' : "Don't have an account?")}
              </Text>
              <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} disabled={loading}>
                <Text style={[s.toggleLink, { color: colors.primary }]}>
                  {isSignUp ? (lang === 'tr' ? 'Giriş Yap' : 'Sign In') : (lang === 'tr' ? 'Kayıt Ol' : 'Sign Up')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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

  form: { gap: 20 },

  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
  input: { height: 52, borderRadius: 14, paddingHorizontal: 16, fontSize: 16, borderWidth: 1 },
  passwordContainer: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeIcon: { position: 'absolute', right: 16, top: 16 },

  errorText: { fontSize: 13, textAlign: 'center', fontWeight: '500' },

  submitBtn: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  forgotBtn: { alignItems: 'center', marginTop: 8 },
  forgotText: { fontSize: 14, fontWeight: '600' },

  toggleContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 12 },
  toggleText: { fontSize: 14 },
  toggleLink: { fontWeight: '700', fontSize: 14 },
});
