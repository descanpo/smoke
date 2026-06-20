import { HEALTH_MILESTONES, HealthMilestone } from '../../constants/milestones';

const MS_PER_MIN = 60000;

/** Geçen süreye göre ulaşılan kilometre taşı sayısı. */
export function getAchievedCount(elapsedMs: number): number {
  const mins = elapsedMs / MS_PER_MIN;
  return HEALTH_MILESTONES.filter(m => mins >= m.minutes).length;
}

/** Henüz ulaşılmamış bir sonraki kilometre taşı (yoksa null). */
export function getNextMilestone(
  elapsedMs: number,
): (HealthMilestone & { progress: number }) | null {
  const mins = elapsedMs / MS_PER_MIN;
  const next = HEALTH_MILESTONES.find(m => m.minutes > mins);
  if (!next) return null;
  const prev = [...HEALTH_MILESTONES].reverse().find(m => m.minutes <= mins);
  const progress = prev
    ? (mins - prev.minutes) / (next.minutes - prev.minutes)
    : mins / next.minutes;
  return { ...next, progress: Math.min(Math.max(progress, 0), 1) };
}

/** Bir sonraki kilometre taşına kalan süreyi insan-okur metne çevirir. */
export function remainingToMilestone(
  next: HealthMilestone,
  elapsedMs: number,
  lang: 'tr' | 'en',
): string {
  const minsLeft = Math.max(0, next.minutes - elapsedMs / MS_PER_MIN);
  const u = (tr: string, en: string) => (lang === 'tr' ? tr : en);
  if (minsLeft < 60) return `${Math.round(minsLeft)} ${u('dk', 'min')}`;
  if (minsLeft < 1440) return `${Math.round(minsLeft / 60)} ${u('saat', 'hours')}`;
  if (minsLeft < 10080) return `${Math.round(minsLeft / 1440)} ${u('gün', 'days')}`;
  if (minsLeft < 43200) return `${Math.round(minsLeft / 10080)} ${u('hafta', 'weeks')}`;
  if (minsLeft < 525600) return `${Math.round(minsLeft / 43200)} ${u('ay', 'months')}`;
  return `${Math.round(minsLeft / 525600)} ${u('yıl', 'years')}`;
}
