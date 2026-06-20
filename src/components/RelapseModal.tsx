import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { getColors, Theme } from '../theme/Theme';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { haptics } from '../utils/haptics';

/**
 * Nazik relaps kurtarma akışı. Suçlamayan ton; kullanıcı serini korumayı
 * veya yolculuğu bugünden yeniden başlatmayı seçer.
 */
export default function RelapseModal({
  session, journey, onClose, onJourneyUpdate,
}: {
  session: any;
  journey: any;
  onClose: () => void;
  onJourneyUpdate?: () => void;
}) {
  const { mode } = useThemeMode();
  const { lang } = useLanguage();
  const colors = getColors(mode);
  const L = (tr: string, en: string) => (lang === 'tr' ? tr : en);

  const [saving, setSaving] = useState<null | 'kept' | 'restart'>(null);

  const log = async (action: 'kept_streak' | 'restarted') => {
    await supabase.from('relapse_logs').insert({
      user_id: session.user.id,
      journey_id: journey?.id ?? null,
      action,
    }).then(() => {}, () => {});
  };

  const keepStreak = async () => {
    if (saving) return;
    setSaving('kept');
    await log('kept_streak');
    haptics.success();
    setSaving(null);
    onClose();
  };

  const restart = async () => {
    if (saving) return;
    setSaving('restart');
    if (journey?.id) {
      await supabase.from('quit_journeys')
        .update({ quit_date: new Date().toISOString() })
        .eq('id', journey.id)
        .then(() => {}, () => {});
    }
    await log('restarted');
    haptics.warning();
    setSaving(null);
    onJourneyUpdate?.();
    onClose();
  };

  return (
    <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity activeOpacity={1} style={[s.sheet, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
        <View style={[s.handle, { backgroundColor: colors.border }]} />
        <SafeAreaView>
          <View style={[s.iconWrap, { backgroundColor: colors.primarySoft }]}>
            <Text style={{ fontSize: 34 }}>🤍</Text>
          </View>
          <Text style={[s.title, { color: colors.text }]}>
            {L('Bir kayma, sonun değil.', 'A slip is not the end.')}
          </Text>
          <Text style={[s.desc, { color: colors.textSecondary }]}>
            {L('Bırakmak bir süreç. Kendine karşı nazik ol — bugüne kadar verdiğin emek hâlâ değerli. Nasıl devam etmek istersin?',
               'Quitting is a process. Be kind to yourself — the effort you’ve made still counts. How would you like to continue?')}
          </Text>

          <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.primary, ...Theme.shadows.primary }]} onPress={keepStreak} disabled={!!saving} activeOpacity={0.9}>
            {saving === 'kept' ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="shield-checkmark" size={19} color="#fff" />
                <Text style={s.primaryText}>{L('Serimi koru, devam et', 'Keep my streak, continue')}</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={[s.secondaryBtn, { borderColor: colors.border }]} onPress={restart} disabled={!!saving} activeOpacity={0.8}>
            {saving === 'restart' ? <ActivityIndicator color={colors.text} /> : (
              <>
                <Ionicons name="refresh" size={18} color={colors.textSecondary} />
                <Text style={[s.secondaryText, { color: colors.textSecondary }]}>{L('Bugünden yeniden başla', 'Restart from today')}</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={{ alignSelf: 'center', marginTop: 14, marginBottom: 6 }}>
            <Text style={{ color: colors.textTertiary, fontWeight: '600', fontSize: 14 }}>{L('Kapat', 'Close')}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, borderBottomWidth: 0,
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16,
    ...Platform.select({ web: { boxShadow: '0 -6px 24px rgba(15,23,42,0.10)' } as any, default: { elevation: 12 } }),
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 4, marginBottom: 20 },
  iconWrap: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 18 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3, textAlign: 'center', marginBottom: 10 },
  desc: { fontSize: 14.5, lineHeight: 21, textAlign: 'center', marginBottom: 24 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16, marginBottom: 12 },
  primaryText: { color: '#fff', fontSize: 15.5, fontWeight: '800' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingVertical: 15, borderRadius: 16, borderWidth: 1.5 },
  secondaryText: { fontSize: 15, fontWeight: '700' },
});
