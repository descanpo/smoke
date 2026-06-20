export interface Badge {
  id: string;
  icon: string;
  /** Kazanmak için bırakmadan bu yana geçmesi gereken dakika. */
  minutesNeeded: number;
  nameTr: string;
  nameEn: string;
  descTr: string;
  descEn: string;
}

/** Süre tabanlı başarı rozetleri — uygulamadaki tek kaynak. */
export const BADGES: Badge[] = [
  { id: 'first_day',    icon: '🌟', minutesNeeded: 1440,    nameTr: 'İlk Gün',         nameEn: 'First Day',  descTr: '1 gün temiz',   descEn: '1 day clean' },
  { id: 'one_week',     icon: '💪', minutesNeeded: 10080,   nameTr: 'İlk Hafta',       nameEn: 'First Week', descTr: '7 gün temiz',   descEn: '7 days clean' },
  { id: 'two_weeks',    icon: '🏃', minutesNeeded: 20160,   nameTr: '2 Hafta',         nameEn: '2 Weeks',    descTr: '14 gün temiz',  descEn: '14 days clean' },
  { id: 'one_month',    icon: '🫁', minutesNeeded: 43200,   nameTr: 'Bir Ay',          nameEn: 'One Month',  descTr: '30 gün temiz',  descEn: '30 days clean' },
  { id: 'three_months', icon: '🧠', minutesNeeded: 131400,  nameTr: 'Üç Ay',           nameEn: 'Three Months', descTr: '90 gün temiz', descEn: '90 days clean' },
  { id: 'six_months',   icon: '🛡️', minutesNeeded: 262800,  nameTr: 'Altı Ay',         nameEn: 'Six Months', descTr: '180 gün temiz', descEn: '180 days clean' },
  { id: 'one_year',     icon: '🏆', minutesNeeded: 525600,  nameTr: 'Yıllık Kahraman', nameEn: 'Year Hero',  descTr: '365 gün temiz', descEn: '365 days clean' },
];
