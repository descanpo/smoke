import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Platform-güvenli dokunsal geri bildirim sarmalayıcısı.
// Web'de expo-haptics no-op'tur; yine de hataları yutuyoruz ki
// bir buton dokunuşu asla çökmesin.

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

function safe(fn: () => Promise<unknown>) {
  if (!isNative) return;
  try {
    fn();
  } catch {
    // sessiz — haptics asla akışı bozmamalı
  }
}

export const haptics = {
  /** Hafif dokunuş — sekme/küçük buton seçimleri. */
  tapLight: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Orta dokunuş — birincil aksiyonlar. */
  tapMedium: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** Başarı — kayıt tamamlandı, milestone, rozet. */
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Uyarı — relaps / dikkatli aksiyon. */
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  /** Hata. */
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  /** Seçim değişikliği — segment/chip. */
  selection: () => safe(() => Haptics.selectionAsync()),
};
