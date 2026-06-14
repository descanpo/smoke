import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useJourneyStore } from '@/store/journeyStore';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

const KVKK_URL = 'https://descanpo.github.io/smoke/kvkk.html';
const PRIVACY_URL = 'https://descanpo.github.io/smoke/privacy.html';
const TERMS_URL = 'https://descanpo.github.io/smoke/terms.html';

export default function ProfileScreen() {
  const { profile, user, signOut } = useAuthStore();
  const { journey, stats } = useJourneyStore();

  const handleSignOut = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabından çıkmak istediine emin misin?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleNewJourney = () => {
    Alert.alert(
      'Yeni Başlangıç',
      'Mevcut yolculuğun sona erecek. Yeni bir başlangıç yapmak istediine emin misin?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Evet, Başla', onPress: () => router.push('/onboarding') },
      ]
    );
  };

  const menuItems = [
    {
      icon: '🗓️',
      label: 'Yeni Yolculuk Başlat',
      onPress: handleNewJourney,
      color: Colors.primary,
    },
    {
      icon: '🔔',
      label: 'Bildirim Ayarları',
      onPress: () => Alert.alert('Yakında', 'Bu özellik yakında gelecek!'),
    },
    {
      icon: '🔒',
      label: 'KVKK Aydınlatma Metni',
      onPress: () => Linking.openURL(KVKK_URL),
    },
    {
      icon: '📧',
      label: 'Gizlilik Politikası',
      onPress: () => Linking.openURL(PRIVACY_URL),
    },
    {
      icon: '📄',
      label: 'Kullanım Koşulları',
      onPress: () => Linking.openURL(TERMS_URL),
    },
    {
      icon: '📧',
      label: 'Geri Bildirim Gönder',
      onPress: () => Linking.openURL('mailto:descanpo2@gmail.com?subject=Smoke App Geri Bildirim'),
    },
  ];

  return (
    <LinearGradient colors={['#0A0A14', '#1A1A2E']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.profileCard}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {profile?.display_name?.[0]?.toUpperCase() ?? '👤'}
              </Text>
            </LinearGradient>
            <Text style={styles.displayName}>
              {profile?.display_name ?? 'Kahraman'}
            </Text>
            <Text style={styles.email}>{user?.email ?? 'Anonim Kullanıcı'}</Text>
            {journey && (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats?.daysSmokeeFree ?? 0}</Text>
                  <Text style={styles.statLabel}>Gün</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats?.achievementCount ?? 0}</Text>
                  <Text style={styles.statLabel}>Rozet</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: Colors.success }]}>
                    {(stats?.moneySaved ?? 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                  </Text>
                  <Text style={styles.statLabel}>TL</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.menuSection}>
            {menuItems.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={[styles.menuLabel, item.color ? { color: item.color } : {}]}>
                  {item.label}
                </Text>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutText}>🚪 Çıkış Yap</Text>
          </TouchableOpacity>

          <Text style={styles.version}>Smoke v1.0.0 • descanpo2@gmail.com</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },
  profileCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: Spacing.sm,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 36, color: '#fff' },
  displayName: { ...Typography.h3, color: Colors.dark.text },
  email: { ...Typography.bodySmall, color: Colors.dark.textSecondary },
  statsRow: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.sm, alignItems: 'center' },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { ...Typography.h4, color: Colors.dark.text },
  statLabel: { ...Typography.caption, color: Colors.dark.textSecondary },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.dark.border },
  menuSection: {
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  menuIcon: { fontSize: 20, width: 28 },
  menuLabel: { ...Typography.body, color: Colors.dark.text, flex: 1 },
  menuArrow: { fontSize: 20, color: Colors.dark.textTertiary },
  signOutBtn: {
    backgroundColor: Colors.error + '22',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.error + '44',
  },
  signOutText: { ...Typography.label, color: Colors.error, fontSize: 16 },
  version: { ...Typography.caption, color: Colors.dark.textTertiary, textAlign: 'center' },
});
