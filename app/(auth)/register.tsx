import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Hata', 'Tüm alanları doldurun.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Hata', 'Parola en az 6 karakter olmalıdır.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Kayıt Hatası', error.message);
    } else {
      Alert.alert(
        'Başarılı!',
        'Hesabın oluşturuldu. E-posta adresini doğrula.',
        [{ text: 'Tamam', onPress: () => router.replace('/onboarding') }]
      );
    }
  };

  return (
    <LinearGradient colors={['#0A0A14', '#1A1A2E']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <TouchableOpacity style={styles.back} onPress={() => router.back()}>
              <Text style={styles.backText}>← Geri</Text>
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.title}>Hesap Oluştur</Text>
              <Text style={styles.subtitle}>Yolculuğunu kaydet ve takip et</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Adın</Text>
              <TextInput
                style={styles.input}
                placeholder="Adı Soyadı"
                placeholderTextColor={Colors.dark.textTertiary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <Text style={styles.label}>E-posta</Text>
              <TextInput
                style={styles.input}
                placeholder="ornek@email.com"
                placeholderTextColor={Colors.dark.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Parola</Text>
              <TextInput
                style={styles.input}
                placeholder="En az 6 karakter"
                placeholderTextColor={Colors.dark.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? 'Kaydediliyor...' : 'Kaydol'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.kvkkText}>
                Kaydolarak{' '}
                <Text style={styles.kvkkLink}>Kullanım Koşulları</Text>
                {'nı ve '}
                <Text style={styles.kvkkLink}>KVKK Aydınlatma Metni</Text>
                {'ni kabul etmiş olursunuz.'}
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: Spacing.lg },
  back: { marginBottom: Spacing.lg },
  backText: { color: Colors.primary, ...Typography.body },
  header: { marginBottom: Spacing.xl },
  title: { ...Typography.h2, color: Colors.dark.text, marginBottom: Spacing.xs },
  subtitle: { ...Typography.body, color: Colors.dark.textSecondary },
  form: { gap: Spacing.sm },
  label: { ...Typography.label, color: Colors.dark.textSecondary },
  input: {
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.dark.text,
    ...Typography.body,
    marginBottom: Spacing.xs,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { ...Typography.label, color: '#fff', fontSize: 16 },
  kvkkText: { ...Typography.caption, color: Colors.dark.textTertiary, textAlign: 'center', marginTop: Spacing.md, lineHeight: 18 },
  kvkkLink: { color: Colors.primary },
});
