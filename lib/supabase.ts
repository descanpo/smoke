import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          country: string;
          language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      quit_journeys: {
        Row: {
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
          relapse_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['quit_journeys']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['quit_journeys']['Insert']>;
      };
      craving_logs: {
        Row: {
          id: string;
          user_id: string;
          journey_id: string | null;
          logged_at: string;
          intensity: number | null;
          trigger_type: string | null;
          trigger_notes: string | null;
          resisted: boolean;
          coping_strategy: string | null;
          mood: string | null;
          location: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['craving_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['craving_logs']['Insert']>;
      };
      health_milestones: {
        Row: {
          id: string;
          minutes_elapsed: number;
          title_tr: string;
          title_en: string;
          description_tr: string;
          description_en: string;
          body_system: string;
          icon: string;
          severity: string;
        };
      };
      achievements: {
        Row: {
          id: string;
          code: string;
          title_tr: string;
          title_en: string;
          description_tr: string;
          description_en: string;
          icon: string;
          condition_type: string;
          condition_value: number;
          points: number;
          rarity: string;
        };
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          journey_id: string | null;
          unlocked_at: string;
          notified: boolean;
        };
        Insert: Omit<Database['public']['Tables']['user_achievements']['Row'], 'id' | 'unlocked_at'>;
      };
      community_posts: {
        Row: {
          id: string;
          user_id: string;
          journey_id: string | null;
          content: string;
          post_type: string;
          likes_count: number;
          comments_count: number;
          is_anonymous: boolean;
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['community_posts']['Row'], 'id' | 'likes_count' | 'comments_count' | 'created_at' | 'updated_at'>;
      };
      daily_check_ins: {
        Row: {
          id: string;
          user_id: string;
          journey_id: string | null;
          check_date: string;
          mood: string | null;
          energy_level: number | null;
          craving_level: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['daily_check_ins']['Row'], 'id' | 'created_at'>;
      };
      motivational_quotes: {
        Row: {
          id: string;
          text_tr: string;
          text_en: string;
          author: string | null;
          category: string;
        };
      };
    };
  };
};
