import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface Journey {
  id: string;
  user_id: string;
  quit_date: string;
  cigarettes_per_day: number;
  cost_per_pack: number;
  cigarettes_per_pack: number;
  currency: string;
  brand: string | null;
  motivation: string | null;
  is_active: boolean;
}

interface Stats {
  daysSmokeeFree: number;
  hoursSmokeeFree: number;
  minutesSmokeeFree: number;
  cigarettesAvoided: number;
  moneySaved: number;
  currency: string;
  cravingsTotal: number;
  cravingsResisted: number;
  achievementCount: number;
}

interface JourneyState {
  journey: Journey | null;
  stats: Stats | null;
  loading: boolean;
  fetchJourney: (userId: string) => Promise<void>;
  fetchStats: (userId: string) => Promise<void>;
  createJourney: (data: Omit<Journey, 'id' | 'user_id' | 'is_active'>) => Promise<void>;
  setJourney: (journey: Journey | null) => void;
}

const calculateStats = (journey: Journey): Stats => {
  const now = new Date();
  const quitDate = new Date(journey.quit_date);
  const minutesElapsed = (now.getTime() - quitDate.getTime()) / (1000 * 60);
  const hoursElapsed = minutesElapsed / 60;
  const daysElapsed = hoursElapsed / 24;

  const cigarettesPerMinute = journey.cigarettes_per_day / (24 * 60);
  const cigarettesAvoided = Math.floor(minutesElapsed * cigarettesPerMinute);

  const costPerCigarette = journey.cost_per_pack / journey.cigarettes_per_pack;
  const moneySaved = Math.round(cigarettesAvoided * costPerCigarette * 100) / 100;

  return {
    daysSmokeeFree: Math.floor(daysElapsed),
    hoursSmokeeFree: Math.floor(hoursElapsed),
    minutesSmokeeFree: Math.floor(minutesElapsed),
    cigarettesAvoided,
    moneySaved,
    currency: journey.currency,
    cravingsTotal: 0,
    cravingsResisted: 0,
    achievementCount: 0,
  };
};

export const useJourneyStore = create<JourneyState>((set, get) => ({
  journey: null,
  stats: null,
  loading: false,

  setJourney: (journey) => {
    set({ journey });
    if (journey) {
      set({ stats: calculateStats(journey) });
    }
  },

  fetchJourney: async (userId: string) => {
    set({ loading: true });
    const { data } = await supabase
      .from('quit_journeys')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('quit_date', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      set({ journey: data, stats: calculateStats(data), loading: false });
    } else {
      set({ journey: null, stats: null, loading: false });
    }
  },

  fetchStats: async (userId: string) => {
    const { journey } = get();
    if (!journey) return;

    const [cravingsRes, achievementsRes] = await Promise.all([
      supabase
        .from('craving_logs')
        .select('resisted', { count: 'exact' })
        .eq('user_id', userId)
        .eq('journey_id', journey.id),
      supabase
        .from('user_achievements')
        .select('id', { count: 'exact' })
        .eq('user_id', userId),
    ]);

    const cravingsTotal = cravingsRes.count ?? 0;
    const cravingsResisted = cravingsRes.data?.filter((c) => c.resisted).length ?? 0;
    const achievementCount = achievementsRes.count ?? 0;

    const baseStats = calculateStats(journey);
    set({
      stats: {
        ...baseStats,
        cravingsTotal,
        cravingsResisted,
        achievementCount,
      },
    });
  },

  createJourney: async (data) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('quit_journeys').update({ is_active: false }).eq('user_id', user.id);

    const { data: journey } = await supabase
      .from('quit_journeys')
      .insert({ ...data, user_id: user.id, is_active: true })
      .select()
      .single();

    if (journey) {
      set({ journey, stats: calculateStats(journey) });
    }
  },
}));
