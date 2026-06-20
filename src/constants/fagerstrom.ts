// Fagerström Nikotin Bağımlılık Testi (FTND) — 6 standart soru.
// Skor 0-10. Onboarding'de bağımlılık düzeyini ve kişisel plan tonunu belirler.

export interface FagerstromOption {
  tr: string;
  en: string;
  score: number;
}

export interface FagerstromQuestion {
  key: string;
  tr: string;
  en: string;
  options: FagerstromOption[];
}

export const FAGERSTROM_QUESTIONS: FagerstromQuestion[] = [
  {
    key: 'first_cig',
    tr: 'Uyandıktan ne kadar sonra ilk sigaranı içersin?',
    en: 'How soon after waking do you smoke your first cigarette?',
    options: [
      { tr: 'İlk 5 dakika içinde', en: 'Within 5 minutes', score: 3 },
      { tr: '6–30 dakika', en: '6–30 minutes', score: 2 },
      { tr: '31–60 dakika', en: '31–60 minutes', score: 1 },
      { tr: '60 dakikadan sonra', en: 'After 60 minutes', score: 0 },
    ],
  },
  {
    key: 'forbidden',
    tr: 'Sigaranın yasak olduğu yerlerde içmemekte zorlanır mısın?',
    en: 'Is it hard to not smoke in places where it is forbidden?',
    options: [
      { tr: 'Evet', en: 'Yes', score: 1 },
      { tr: 'Hayır', en: 'No', score: 0 },
    ],
  },
  {
    key: 'hate_to_give_up',
    tr: 'Vazgeçmesi en zor olan sigara hangisi?',
    en: 'Which cigarette would you most hate to give up?',
    options: [
      { tr: 'Sabah ilk içtiğim', en: 'The first one in the morning', score: 1 },
      { tr: 'Diğer herhangi biri', en: 'Any other', score: 0 },
    ],
  },
  {
    key: 'per_day',
    tr: 'Günde kaç sigara içersin?',
    en: 'How many cigarettes do you smoke per day?',
    options: [
      { tr: '10 veya daha az', en: '10 or fewer', score: 0 },
      { tr: '11–20', en: '11–20', score: 1 },
      { tr: '21–30', en: '21–30', score: 2 },
      { tr: '31 ve üzeri', en: '31 or more', score: 3 },
    ],
  },
  {
    key: 'morning_more',
    tr: 'Günün ilk saatlerinde daha sık mı içersin?',
    en: 'Do you smoke more frequently in the morning?',
    options: [
      { tr: 'Evet', en: 'Yes', score: 1 },
      { tr: 'Hayır', en: 'No', score: 0 },
    ],
  },
  {
    key: 'when_ill',
    tr: 'Gün boyu yatakta hasta olsan bile içer misin?',
    en: 'Do you smoke even when ill in bed all day?',
    options: [
      { tr: 'Evet', en: 'Yes', score: 1 },
      { tr: 'Hayır', en: 'No', score: 0 },
    ],
  },
];

export type DependenceLevel = 'low' | 'moderate' | 'high' | 'very_high';

export function dependenceLevel(score: number): DependenceLevel {
  if (score <= 2) return 'low';
  if (score <= 4) return 'moderate';
  if (score <= 7) return 'high';
  return 'very_high';
}

export function dependenceLabel(level: DependenceLevel, lang: 'tr' | 'en'): string {
  const map: Record<DependenceLevel, { tr: string; en: string }> = {
    low: { tr: 'Düşük bağımlılık', en: 'Low dependence' },
    moderate: { tr: 'Orta bağımlılık', en: 'Moderate dependence' },
    high: { tr: 'Yüksek bağımlılık', en: 'High dependence' },
    very_high: { tr: 'Çok yüksek bağımlılık', en: 'Very high dependence' },
  };
  return lang === 'tr' ? map[level].tr : map[level].en;
}

export function dependenceAdvice(level: DependenceLevel, lang: 'tr' | 'en'): string {
  const map: Record<DependenceLevel, { tr: string; en: string }> = {
    low: {
      tr: 'Bağımlılığın düşük. Kararlılıkla bir anda bırakman çok olası — yanındayız.',
      en: 'Your dependence is low. Quitting at once is very achievable — we’ve got you.',
    },
    moderate: {
      tr: 'Orta düzey bağımlılık. Tetikleyicilerini tanıyıp nefes/SOS araçlarını kullanarak başarabilirsin.',
      en: 'Moderate dependence. Knowing your triggers and using the breathing/SOS tools will carry you through.',
    },
    high: {
      tr: 'Yüksek bağımlılık. ALO 171 ve ücretsiz poliklinik desteğini düşünebilirsin; uygulama her adımda yanında.',
      en: 'High dependence. Consider ALO 171 and free clinic support; the app is with you every step.',
    },
    very_high: {
      tr: 'Çok yüksek bağımlılık. Profesyonel destek (ALO 171 / ücretsiz ilaç) başarı şansını ciddi artırır.',
      en: 'Very high dependence. Professional support (ALO 171 / free medication) greatly boosts your odds.',
    },
  };
  return lang === 'tr' ? map[level].tr : map[level].en;
}
