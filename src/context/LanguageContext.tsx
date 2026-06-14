import React, { createContext, useContext, useState } from 'react';
import { Platform } from 'react-native';

export type Lang = 'tr' | 'en';

const TR = {
  // App
  appName: 'Smoke',
  appTagline: 'Sigarayı bırakmanın en akıllı yolu',
  // Auth
  signIn: 'Giriş Yap',
  signUp: 'Kayıt Ol',
  email: 'E-posta',
  password: 'Şifre',
  fullName: 'Ad Soyad',
  continueWithGoogle: 'Google ile Devam Et',
  or: 'veya',
  forgotPassword: 'Şifremi Unuttum',
  createAccount: 'Hesap Oluştur',
  emailRequired: 'E-posta ve şifre gerekli',
  nameRequired: 'Ad Soyad gerekli',
  invalidCredentials: 'E-posta veya şifre hatalı',
  accountCreated: 'Hesabınız oluşturuldu! E-postanızı doğrulayın.',
  googleFailed: 'Google girişi başarısız',
  feature1: 'Türk Lirası tasarruf hesabı',
  feature2: 'Sağlık iyileşme zaman çizelgesi',
  feature3: 'KVKK uyumlu — verileriniz güvende',
  termsNotice: 'Devam ederek',
  termsLink: 'Kullanım Koşulları',
  kvkkLink: 'KVKK Aydınlatma Metni',
  and: 've',
  accepted: "'ni kabul etmiş olursunuz.",
  privacyPolicy: 'Gizlilik Politikası',
  // Home
  hello: 'Merhaba',
  day: 'GÜN',
  hour: 'SAAT',
  minute: 'DK',
  notSmoked: 'Sigara İçmedin',
  moneySaved: 'Tasarruf',
  cigarettesAvoided: 'Kurtarılan Sigara',
  healthPoints: 'Sağlık Puanı',
  nextMilestone: 'Sonraki Hedef',
  remaining: 'kaldı',
  logCraving: '🔥 İstek Kaydet',
  breathe: '🫁 Nefes Egzersizi',
  // Progress
  healthTimeline: 'Sağlık Zaman Çizelgesi',
  quittingJourney: 'İyileşme yolculuğunuz',
  achieved: 'Tamamlandı ✓',
  inProgress: 'Devam Ediyor',
  locked: 'Kilitli',
  // Stats
  statistics: 'İstatistikler',
  weeklyActivity: 'Haftalık Aktivite',
  resistanceRate: 'Direnç Oranı',
  longestStreak: 'En Uzun Seri',
  personalRecord: '🏆 Kişisel rekor',
  totalCravings: 'Toplam İstek',
  cravingsLogged: 'istek kaydedildi',
  cleanDays: 'Temiz Gün',
  cleanDaysDesc: 'gün sigara içilmedi',
  triggerAnalysis: 'Tetikleyici Analizi',
  noData: 'Henüz veri yok',
  noTriggersYet: 'Henüz tetikleyici kaydedilmedi',
  days: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
  // Profile
  profile: 'Profil',
  daysClean: 'Gün Temiz',
  savings: 'Tasarruf',
  avoided: 'Sigara',
  journeyInfo: 'Yolculuk Bilgileri',
  quitDate: 'Bırakma Tarihi',
  dailyCigs: 'Günlük Sigara',
  packPrice: 'Paket Fiyatı',
  motivation: 'Motivasyon',
  supportLinks: 'Destek & Bağlantılar',
  quitHelpline: 'ALO 171 Sigara Bırakma Hattı',
  settings: 'Ayarlar',
  darkMode: 'Karanlık Mod',
  lightMode: 'Aydınlık Mod',
  language: 'Dil',
  account: 'Hesap',
  resetJourney: '⚠️ Yolculuğu Sıfırla',
  resetConfirm: 'Tüm verileriniz silinecek. Emin misiniz?',
  signOut: 'Çıkış Yap',
  cancel: 'İptal',
  confirm: 'Onayla',
  // Craving
  cravingTitle: 'İstek Kaydı',
  intensity: 'Yoğunluk',
  trigger: 'Tetikleyici',
  outcome: 'Sonuç',
  resisted: 'Dayanıldı',
  smoked: 'Sigara İçildi',
  notes: 'Notlar',
  notesPlaceholder: 'Ne hissettiniz?',
  save: 'Kaydet',
  saving: 'Kaydediliyor...',
  close: 'Kapat',
  // Breathing
  breathingTitle: 'Nefes Egzersizleri',
  breathingSubtitle: 'Stresi azalt, istekleri yönet',
  start: 'Başla',
  stop: 'Durdur',
  sessions: 'seans',
  inhale: 'Nefes Al',
  hold: 'Tut',
  exhale: 'Nefes Ver',
  rest: 'Dinlen',
  complete: 'Tamamlandı! 🎉',
  // Onboarding
  onboardingTitle: 'Yolculuğunuzu Başlatın',
  onboardingSubtitle: 'Bırakma tarihinizi ve alışkanlıklarınızı kaydedin',
  quitDateLabel: 'Sigarayı bıraktığınız tarih',
  cigPerDayLabel: 'Günlük sigara sayısı (adet)',
  costPerPackLabel: 'Paket fiyatı (₺)',
  motivationLabel: 'Neden bırakmak istiyorsunuz?',
  motivationPlaceholder: 'Motivasyonunuzu yazın...',
  startJourney: 'Yolculuğa Başla',
  required: 'Bu alan zorunludur',
};

const EN: typeof TR = {
  appName: 'Smoke',
  appTagline: 'The smartest way to quit smoking',
  signIn: 'Sign In',
  signUp: 'Sign Up',
  email: 'Email',
  password: 'Password',
  fullName: 'Full Name',
  continueWithGoogle: 'Continue with Google',
  or: 'or',
  forgotPassword: 'Forgot Password',
  createAccount: 'Create Account',
  emailRequired: 'Email and password are required',
  nameRequired: 'Full name is required',
  invalidCredentials: 'Invalid email or password',
  accountCreated: 'Account created! Please verify your email.',
  googleFailed: 'Google sign in failed',
  feature1: 'Track your savings in Turkish Lira',
  feature2: 'Health recovery timeline',
  feature3: 'KVKK & GDPR compliant — your data is safe',
  termsNotice: 'By continuing, you agree to our',
  termsLink: 'Terms of Service',
  kvkkLink: 'KVKK Disclosure',
  and: 'and',
  accepted: '.',
  privacyPolicy: 'Privacy Policy',
  hello: 'Hello',
  day: 'DAY',
  hour: 'HR',
  minute: 'MIN',
  notSmoked: "You Haven't Smoked",
  moneySaved: 'Saved',
  cigarettesAvoided: 'Cigarettes Avoided',
  healthPoints: 'Health Points',
  nextMilestone: 'Next Milestone',
  remaining: 'left',
  logCraving: '🔥 Log Craving',
  breathe: '🫁 Breathing',
  healthTimeline: 'Health Timeline',
  quittingJourney: 'Your recovery journey',
  achieved: 'Achieved ✓',
  inProgress: 'In Progress',
  locked: 'Locked',
  statistics: 'Statistics',
  weeklyActivity: 'Weekly Activity',
  resistanceRate: 'Resistance Rate',
  longestStreak: 'Longest Streak',
  personalRecord: '🏆 Personal record',
  totalCravings: 'Total Cravings',
  cravingsLogged: 'cravings logged',
  cleanDays: 'Clean Days',
  cleanDaysDesc: 'days smoke-free',
  triggerAnalysis: 'Trigger Analysis',
  noData: 'No data yet',
  noTriggersYet: 'No triggers recorded yet',
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  profile: 'Profile',
  daysClean: 'Days Clean',
  savings: 'Savings',
  avoided: 'Avoided',
  journeyInfo: 'Journey Info',
  quitDate: 'Quit Date',
  dailyCigs: 'Daily Cigarettes',
  packPrice: 'Pack Price',
  motivation: 'Motivation',
  supportLinks: 'Support & Links',
  quitHelpline: 'Tobacco Quitline 171',
  settings: 'Settings',
  darkMode: 'Dark Mode',
  lightMode: 'Light Mode',
  language: 'Language',
  account: 'Account',
  resetJourney: '⚠️ Reset Journey',
  resetConfirm: 'All your data will be deleted. Are you sure?',
  signOut: 'Sign Out',
  cancel: 'Cancel',
  confirm: 'Confirm',
  cravingTitle: 'Craving Log',
  intensity: 'Intensity',
  trigger: 'Trigger',
  outcome: 'Outcome',
  resisted: 'Resisted',
  smoked: 'Smoked',
  notes: 'Notes',
  notesPlaceholder: 'How did you feel?',
  save: 'Save',
  saving: 'Saving...',
  close: 'Close',
  breathingTitle: 'Breathing Exercises',
  breathingSubtitle: 'Reduce stress, manage cravings',
  start: 'Start',
  stop: 'Stop',
  sessions: 'sessions',
  inhale: 'Inhale',
  hold: 'Hold',
  exhale: 'Exhale',
  rest: 'Rest',
  complete: 'Complete! 🎉',
  onboardingTitle: 'Start Your Journey',
  onboardingSubtitle: 'Record your quit date and habits',
  quitDateLabel: 'Date you quit smoking',
  cigPerDayLabel: 'Cigarettes per day',
  costPerPackLabel: 'Cost per pack (₺)',
  motivationLabel: 'Why do you want to quit?',
  motivationPlaceholder: 'Write your motivation...',
  startJourney: 'Start Journey',
  required: 'This field is required',
};

interface LanguageContextType {
  lang: Lang;
  t: typeof TR;
  setLang: (lang: Lang) => void;
}

const LANG_KEY = 'smoke_lang';

function loadLang(): Lang {
  if (Platform.OS === 'web') {
    try {
      const stored = localStorage.getItem(LANG_KEY);
      if (stored === 'tr' || stored === 'en') return stored;
      // auto-detect from browser
      const browserLang = navigator.language?.toLowerCase();
      if (browserLang && !browserLang.startsWith('tr')) return 'en';
    } catch {}
  }
  return 'tr';
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'tr',
  t: TR,
  setLang: () => {},
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(loadLang);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (Platform.OS === 'web') {
      try { localStorage.setItem(LANG_KEY, l); } catch {}
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, t: lang === 'tr' ? TR : EN, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
};
