import { Ionicons } from '@expo/vector-icons';

export type MilestoneIcon = keyof typeof Ionicons.glyphMap;

export interface HealthMilestone {
  id: number;
  /** Bırakmadan bu yana geçmesi gereken dakika. */
  minutes: number;
  titleTr: string;
  titleEn: string;
  descTr: string;
  descEn: string;
  /** Çizgi ikon (kart/zaman çizelgesi). */
  icon: MilestoneIcon;
  /** Emoji (bildirim/rozet bağlamı). */
  emoji: string;
  bodySystemTr: string;
  bodySystemEn: string;
  severity: 'minor' | 'moderate' | 'major' | 'life_changing';
}

/**
 * Sağlık iyileşme kilometre taşları — uygulamadaki TEK kaynak.
 * HomeScreen, ProgressScreen ve notifications buradan okur.
 */
export const HEALTH_MILESTONES: HealthMilestone[] = [
  { id: 1,  minutes: 20,      titleTr: '20 Dakika', titleEn: '20 Minutes', descTr: 'Nabız ve tansiyon normale döndü.',                 descEn: 'Heart rate and blood pressure normalized.',   icon: 'pulse-outline',             emoji: '❤️', bodySystemTr: 'Kardiyovasküler', bodySystemEn: 'Cardiovascular', severity: 'minor' },
  { id: 2,  minutes: 480,     titleTr: '8 Saat',    titleEn: '8 Hours',    descTr: 'Kandaki karbon monoksit düştü, oksijen arttı.',    descEn: 'Carbon monoxide drops, blood oxygen improves.', icon: 'water-outline',            emoji: '🫁', bodySystemTr: 'Solunum',          bodySystemEn: 'Respiratory',    severity: 'minor' },
  { id: 3,  minutes: 1440,    titleTr: '1 Gün',     titleEn: '1 Day',      descTr: 'Kalp krizi riskin azalmaya başladı.',              descEn: 'Your heart attack risk begins to fall.',       icon: 'sparkles-outline',          emoji: '💪', bodySystemTr: 'Kardiyovasküler', bodySystemEn: 'Cardiovascular', severity: 'moderate' },
  { id: 4,  minutes: 2880,    titleTr: '2 Gün',     titleEn: '2 Days',     descTr: 'Koku ve tat alma duyun güçlendi.',                 descEn: 'Your sense of smell and taste improve.',       icon: 'restaurant-outline',        emoji: '👃', bodySystemTr: 'Sinir Sistemi',    bodySystemEn: 'Nervous System', severity: 'moderate' },
  { id: 5,  minutes: 4320,    titleTr: '3 Gün',     titleEn: '3 Days',     descTr: 'Nikotin vücudundan tamamen atıldı, bronşlar gevşedi.', descEn: 'Nicotine is fully gone; bronchi relax.',   icon: 'leaf-outline',              emoji: '🌬️', bodySystemTr: 'Solunum',         bodySystemEn: 'Respiratory',    severity: 'major' },
  { id: 6,  minutes: 20160,   titleTr: '2 Hafta',   titleEn: '2 Weeks',    descTr: 'Akciğer fonksiyonun ve kan dolaşımın iyileşti.',   descEn: 'Lung function and circulation improve.',       icon: 'walk-outline',              emoji: '🫀', bodySystemTr: 'Solunum',          bodySystemEn: 'Respiratory',    severity: 'major' },
  { id: 7,  minutes: 43200,   titleTr: '1 Ay',      titleEn: '1 Month',    descTr: 'Öksürük ve nefes darlığı azaldı.',                 descEn: 'Coughing and shortness of breath decrease.',   icon: 'cloud-outline',             emoji: '🛡️', bodySystemTr: 'Bağışıklık',       bodySystemEn: 'Immune',         severity: 'major' },
  { id: 8,  minutes: 131400,  titleTr: '3 Ay',      titleEn: '3 Months',   descTr: 'Akciğer kapasiten arttı, egzersiz kolaylaştı.',    descEn: 'Lung capacity rises; exercise gets easier.',   icon: 'fitness-outline',           emoji: '🚶', bodySystemTr: 'Kardiyovasküler', bodySystemEn: 'Cardiovascular', severity: 'major' },
  { id: 9,  minutes: 262800,  titleTr: '6 Ay',      titleEn: '6 Months',   descTr: 'Ciddi enfeksiyon riskin belirgin düştü.',          descEn: 'Risk of serious infection drops notably.',     icon: 'shield-checkmark-outline',  emoji: '🩺', bodySystemTr: 'Bağışıklık',       bodySystemEn: 'Immune',         severity: 'major' },
  { id: 10, minutes: 525600,  titleTr: '1 Yıl',     titleEn: '1 Year',     descTr: 'Koroner kalp hastalığı riskin yarıya indi!',       descEn: 'Coronary heart disease risk cut in half!',     icon: 'heart-outline',             emoji: '🏆', bodySystemTr: 'Kardiyovasküler', bodySystemEn: 'Cardiovascular', severity: 'life_changing' },
  { id: 11, minutes: 2628000, titleTr: '5 Yıl',     titleEn: '5 Years',    descTr: 'İnme riskin sigara içmeyenlerle eşitlendi.',       descEn: 'Stroke risk equals that of a non-smoker.',     icon: 'happy-outline',             emoji: '🌟', bodySystemTr: 'Kanser Önleme',    bodySystemEn: 'Cancer Prevention', severity: 'life_changing' },
  { id: 12, minutes: 5256000, titleTr: '10 Yıl',    titleEn: '10 Years',   descTr: 'Akciğer kanseri riskin yarıya düştü.',             descEn: 'Lung cancer risk is halved.',                  icon: 'trophy-outline',            emoji: '💎', bodySystemTr: 'Kanser Önleme',    bodySystemEn: 'Cancer Prevention', severity: 'life_changing' },
];

export interface TriggerType {
  key: string;
  labelTr: string;
  labelEn: string;
  icon: string;
}

export const TRIGGER_TYPES: TriggerType[] = [
  { key: 'stress',     labelTr: 'Stres',          labelEn: 'Stress',       icon: '😰' },
  { key: 'boredom',    labelTr: 'Sıkıntı',        labelEn: 'Boredom',      icon: '😑' },
  { key: 'social',     labelTr: 'Sosyal ortam',   labelEn: 'Social',       icon: '👥' },
  { key: 'after_meal', labelTr: 'Yemek sonrası',  labelEn: 'After meal',   icon: '🍽️' },
  { key: 'coffee',     labelTr: 'Kahve ile',      labelEn: 'With coffee',  icon: '☕' },
  { key: 'alcohol',    labelTr: 'Alkol ile',      labelEn: 'With alcohol', icon: '🍺' },
  { key: 'habit',      labelTr: 'Alışkanlık',     labelEn: 'Habit',        icon: '🔄' },
  { key: 'emotion',    labelTr: 'Duygusal',       labelEn: 'Emotional',    icon: '💔' },
  { key: 'other',      labelTr: 'Diğer',          labelEn: 'Other',        icon: '❓' },
];

export interface CopingStrategy {
  labelTr: string;
  labelEn: string;
}

export const COPING_STRATEGIES: CopingStrategy[] = [
  { labelTr: 'Nefes egzersizi yaptım',     labelEn: 'Did a breathing exercise' },
  { labelTr: 'Su içtim',                    labelEn: 'Drank water' },
  { labelTr: 'Yürüyüşe çıktım',             labelEn: 'Went for a walk' },
  { labelTr: 'Arkadaşımı aradım',           labelEn: 'Called a friend' },
  { labelTr: 'Müzik dinledim',              labelEn: 'Listened to music' },
  { labelTr: 'Diş fırçaladım',              labelEn: 'Brushed my teeth' },
  { labelTr: 'Uygulamayı açtım',            labelEn: 'Opened the app' },
  { labelTr: 'Meditasyon yaptım',           labelEn: 'Meditated' },
  { labelTr: 'Elimi/ağzımı meşgul ettim',   labelEn: 'Kept my hands/mouth busy' },
];
