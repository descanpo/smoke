export const QUOTES_TR = [
  'Her gün sigara içmediğin, bedenine verdiğin en büyük armağandır.',
  'Bırakma yolculuğun, yarattığın en cesur hikayedir.',
  'Güçlü olmak, başlamakla değil devam etmekle ölçülür.',
  'Bugün içmediğin her sigara, yarın daha derin bir nefes almanı sağlıyor.',
  'Sigara bırakmak bir son değil, gerçek özgürlüğün başlangıcı.',
  'İstek bir dalgadır; gelir ve geçer. Sen kıyıda kalmayı seçtin.',
  'Bugünü kazandın. Yarın da kazanacaksın.',
];

export const QUOTES_EN = [
  'Every smoke-free day is the greatest gift you give to your body.',
  'Your quitting journey is the bravest story you have ever created.',
  'Strength is measured not by starting, but by continuing.',
  'Every cigarette you skip today means a deeper breath tomorrow.',
  'Quitting is not an ending — it is the start of true freedom.',
  'A craving is a wave; it rises and it passes. You chose to stay on shore.',
  'You won today. You will win tomorrow too.',
];

export function getQuotes(lang: 'tr' | 'en') {
  return lang === 'tr' ? QUOTES_TR : QUOTES_EN;
}
