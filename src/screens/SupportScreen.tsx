import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getColors, Theme } from '../theme/Theme';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '../navigation/Navigator';
import { haptics } from '../utils/haptics';

type IconName = keyof typeof Ionicons.glyphMap;

function openURL(url: string) {
  if (Platform.OS === 'web') (window as any).open(url, '_blank', 'noopener,noreferrer');
  else Linking.openURL(url).catch(() => {});
}

export default function SupportScreen() {
  const { mode, isDark } = useThemeMode();
  const { lang } = useLanguage();
  const { goBack } = useNavigation();
  const colors = getColors(mode);
  const L = (tr: string, en: string) => (lang === 'tr' ? tr : en);

  const card = {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 18, ...Theme.shadows.card,
  };

  type Resource = {
    icon: IconName; accent: string; title: string; desc: string;
    actionLabel: string; url: string; primary?: boolean;
  };

  const resources: Resource[] = [
    {
      icon: 'call', accent: colors.success,
      title: L('ALO 171 — Sigara Bırakma Hattı', 'ALO 171 — Quit Smoking Line'),
      desc: L('Sağlık Bakanlığı’nın ücretsiz 7/24 danışma hattı. Kişiye özel plan ve yönlendirme.',
              'Free 24/7 advisory line by the Ministry of Health. Personal guidance and referral.'),
      actionLabel: L('171’i Ara', 'Call 171'), url: 'tel:171', primary: true,
    },
    {
      icon: 'headset', accent: colors.primary,
      title: L('YEDAM 115 — Yeşilay Danışmanlık', 'YEDAM 115 — Green Crescent Support'),
      desc: L('Ücretsiz psikososyal destek ve danışmanlık hattı.',
              'Free psychosocial support and counseling line.'),
      actionLabel: L('115’i Ara', 'Call 115'), url: 'tel:115',
    },
    {
      icon: 'medkit', accent: colors.secondary,
      title: L('Ücretsiz Sigara Bırakma Polikliniği', 'Free Quit-Smoking Clinic'),
      desc: L('81 ilde ücretsiz muayene + ücretsiz ilaç (NRT, Bupropion, Vareniklin). En yakın polikliniği bul.',
              'Free check-ups + free medication across Turkey. Find your nearest clinic.'),
      actionLabel: L('Poliklinik Bul', 'Find a Clinic'),
      url: 'https://www.google.com/maps/search/sigara+b%C4%B1rakma+poliklini%C4%9Fi',
    },
    {
      icon: 'information-circle', accent: colors.warning,
      title: L('Ücretsiz İlaç Hakkın', 'Your Free Medication Right'),
      desc: L('Poliklinik muayenesi sonrası nikotin bandı/sakızı ve reçeteli ilaçlar ücretsiz sağlanır.',
              'After a clinic visit, nicotine patches/gum and prescription meds are provided free.'),
      actionLabel: L('Daha Fazla Bilgi', 'Learn More'),
      url: 'https://www.saglik.gov.tr',
    },
    {
      icon: 'alert-circle', accent: colors.sos,
      title: L('Acil Durum — 112', 'Emergency — 112'),
      desc: L('Tıbbi acil durumda 112’yi ara.', 'In a medical emergency, call 112.'),
      actionLabel: L('112’yi Ara', 'Call 112'), url: 'tel:112',
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity
            style={[s.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
            onPress={() => { haptics.tapLight(); goBack(); }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={[s.eyebrow, { color: colors.primary }]}>{L('DESTEK MERKEZİ', 'SUPPORT CENTER')}</Text>
        <Text style={[s.title, { color: colors.text }]}>{L('Yalnız değilsin', 'You are not alone')}</Text>
        <Text style={[s.subtitle, { color: colors.textSecondary }]}>
          {L('Türkiye’nin ücretsiz, resmi sigara bırakma destek hatlarına tek dokunuşla ulaş.',
             'Reach Turkey’s free, official quit-smoking support — one tap away.')}
        </Text>

        <View style={{ gap: 14, marginTop: 8 }}>
          {resources.map(r => (
            <View key={r.title} style={[card, s.resCard]}>
              <View style={s.resHead}>
                <View style={[s.resIcon, { backgroundColor: r.accent + (isDark ? '22' : '14') }]}>
                  <Ionicons name={r.icon} size={22} color={r.accent} />
                </View>
                <Text style={[s.resTitle, { color: colors.text }]}>{r.title}</Text>
              </View>
              <Text style={[s.resDesc, { color: colors.textSecondary }]}>{r.desc}</Text>
              <TouchableOpacity
                style={[
                  s.resBtn,
                  r.primary
                    ? { backgroundColor: r.accent }
                    : { backgroundColor: 'transparent', borderWidth: 1, borderColor: r.accent + '66' },
                ]}
                onPress={() => { haptics.tapMedium(); openURL(r.url); }}
                activeOpacity={0.85}
              >
                <Ionicons name={r.url.startsWith('tel:') ? 'call-outline' : 'open-outline'} size={17} color={r.primary ? '#fff' : r.accent} />
                <Text style={[s.resBtnText, { color: r.primary ? '#fff' : r.accent }]}>{r.actionLabel}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <Text style={[s.footnote, { color: colors.textTertiary }]}>
          {L('Smoke devletin ücretsiz hizmetlerine bir köprüdür; tıbbi tavsiye yerine geçmez.',
             'Smoke is a bridge to free public services; it is not a substitute for medical advice.')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  content: { padding: 20, paddingTop: 12, paddingBottom: 60 },
  header: { flexDirection: 'row', marginBottom: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.6, marginBottom: 6 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 22 },
  resCard: { padding: 18 },
  resHead: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  resIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  resTitle: { flex: 1, fontSize: 16, fontWeight: '700', letterSpacing: -0.2, lineHeight: 21 },
  resDesc: { fontSize: 13.5, lineHeight: 20, marginBottom: 16 },
  resBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 14, minHeight: 48 },
  resBtnText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
  footnote: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 24, paddingHorizontal: 12 },
});
