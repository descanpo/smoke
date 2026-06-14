export interface HealthMilestone {
  minutesElapsed: number;
  titleTr: string;
  descriptionTr: string;
  icon: string;
  bodySystem: string;
  severity: 'minor' | 'moderate' | 'major' | 'life_changing';
}

export const HEALTH_MILESTONES: HealthMilestone[] = [
  {
    minutesElapsed: 20,
    titleTr: '20 Dakika',
    descriptionTr: 'Kalp atış hızın ve kan basıncın normale dönmeye başladı.',
    icon: '❤️',
    bodySystem: 'Kardiyovasküler',
    severity: 'minor',
  },
  {
    minutesElapsed: 480,
    titleTr: '8 Saat',
    descriptionTr: 'Kandaki karbon monoksit seviyesi normale indi. Oksijenlenme arttı.',
    icon: '🫁',
    bodySystem: 'Solunum',
    severity: 'minor',
  },
  {
    minutesElapsed: 1440,
    titleTr: '24 Saat',
    descriptionTr: 'Kalp krizi riskin azalmaya başladı.',
    icon: '💪',
    bodySystem: 'Kardiyovasküler',
    severity: 'moderate',
  },
  {
    minutesElapsed: 2880,
    titleTr: '48 Saat',
    descriptionTr: 'Koku ve tat alma duyun iyileşmeye başladı. Sinir uçları yenileniyor.',
    icon: '👃',
    bodySystem: 'Sinir Sistemi',
    severity: 'moderate',
  },
  {
    minutesElapsed: 4320,
    titleTr: '72 Saat',
    descriptionTr: 'Nikotin vücudundan tamamen atıldı. Bronşlar gevşedi.',
    icon: '🌬️',
    bodySystem: 'Solunum',
    severity: 'major',
  },
  {
    minutesElapsed: 20160,
    titleTr: '2 Hafta',
    descriptionTr: 'Akciğer fonksiyonun %30 arttı. Dolaşım iyileşti.',
    icon: '🫀',
    bodySystem: 'Solunum',
    severity: 'major',
  },
  {
    minutesElapsed: 43200,
    titleTr: '1 Ay',
    descriptionTr: 'Öksürük ve nefes darlığı azaldı. Bağışıklık sistemi güçlendi.',
    icon: '🛡️',
    bodySystem: 'Bağışıklık',
    severity: 'major',
  },
  {
    minutesElapsed: 129600,
    titleTr: '3 Ay',
    descriptionTr: 'Dolaşım iyileşti. Egzersiz daha kolay hale geldi.',
    icon: '🚶',
    bodySystem: 'Kardiyovasküler',
    severity: 'major',
  },
  {
    minutesElapsed: 525600,
    titleTr: '1 Yıl',
    descriptionTr: 'Koroner kalp hastalığı riski yarıya indi!',
    icon: '🏆',
    bodySystem: 'Kardiyovasküler',
    severity: 'life_changing',
  },
  {
    minutesElapsed: 2628000,
    titleTr: '5 Yıl',
    descriptionTr: 'İnme riski hiç sigara içmeyenle aynı seviyeye geldi.',
    icon: '🌟',
    bodySystem: 'Kanser Önleme',
    severity: 'life_changing',
  },
  {
    minutesElapsed: 5256000,
    titleTr: '10 Yıl',
    descriptionTr: 'Akciğer kanseri riski yarıya indi.',
    icon: '💎',
    bodySystem: 'Kanser Önleme',
    severity: 'life_changing',
  },
  {
    minutesElapsed: 7884000,
    titleTr: '15 Yıl',
    descriptionTr: 'Kalp hastalığı riski hiç sigara içmemiş biriyle aynı seviyeye geldi!',
    icon: '👑',
    bodySystem: 'Kardiyovasküler',
    severity: 'life_changing',
  },
];

export const TRIGGER_TYPES = [
  { key: 'stress', label: 'Stres', icon: '😰' },
  { key: 'boredom', label: 'Sıkıntı', icon: '😑' },
  { key: 'social', label: 'Sosyal ortam', icon: '👥' },
  { key: 'after_meal', label: 'Yemek sonrası', icon: '🍽️' },
  { key: 'coffee', label: 'Kahve ile', icon: '☕' },
  { key: 'alcohol', label: 'Alkol ile', icon: '🍺' },
  { key: 'habit', label: 'Alışkanlık', icon: '🔄' },
  { key: 'emotion', label: 'Duygusal', icon: '💔' },
  { key: 'other', label: 'Diğer', icon: '❓' },
];

export const COPING_STRATEGIES = [
  'Nefes egzersizi yaptım',
  'Su içtim',
  'Yürüyüşe çıktım',
  'Arkadaşımı aradım',
  'Müzik dinledim',
  'Diş fırçaladım',
  'Uygulamayı açtım',
  'Meditasyon yaptım',
  'Elimi/ağzımı meşgul ettim',
];
