-- =====================================================================
-- Smoke — Profesyonelleştirme migration'ı (2026-06-20)
-- Onboarding (Fagerström + plan tipi), SOS/panik, günlük check-in,
-- relaps kurtarma ve profil alanları için şema.
--
-- Tümü idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS) — birden fazla
-- kez güvenle çalıştırılabilir. Supabase Dashboard > SQL Editor'da çalıştır.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) quit_journeys — kişiselleştirme alanları
-- ---------------------------------------------------------------------
alter table public.quit_journeys
  add column if not exists cigarettes_per_pack integer not null default 20,
  add column if not exists plan_type text not null default 'cold_turkey',
  add column if not exists fagerstrom_score integer,
  add column if not exists dependence_level text,
  add column if not exists target_quit_date date;

-- plan_type ve dependence_level için makul değer kısıtları
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'quit_journeys_plan_type_chk') then
    alter table public.quit_journeys
      add constraint quit_journeys_plan_type_chk
      check (plan_type in ('cold_turkey', 'gradual'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quit_journeys_dependence_chk') then
    alter table public.quit_journeys
      add constraint quit_journeys_dependence_chk
      check (dependence_level is null or dependence_level in ('low', 'moderate', 'high', 'very_high'));
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2) profiles — görünen ad, dil, tema
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists display_name text,
  add column if not exists locale text default 'tr',
  add column if not exists theme text default 'dark';

-- Yeni kullanıcı kaydında profiles satırı otomatik oluşsun.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'tr'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 3) community_posts — yorum sayacı
-- ---------------------------------------------------------------------
alter table public.community_posts
  add column if not exists comments_count integer not null default 0;

-- ---------------------------------------------------------------------
-- 4) daily_check_ins — günlük check-in (varsa genişlet, yoksa oluştur)
-- ---------------------------------------------------------------------
create table if not exists public.daily_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journey_id uuid references public.quit_journeys(id) on delete set null,
  check_in_date date not null default current_date,
  mood text,
  craving_count integer default 0,
  smoked boolean default false,
  note text,
  created_at timestamptz not null default now()
);

alter table public.daily_check_ins
  add column if not exists mood text,
  add column if not exists craving_count integer default 0,
  add column if not exists smoked boolean default false,
  add column if not exists note text,
  add column if not exists check_in_date date default current_date,
  add column if not exists journey_id uuid;

-- Günde tek check-in
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'daily_check_ins_user_date_uniq') then
    alter table public.daily_check_ins
      add constraint daily_check_ins_user_date_uniq unique (user_id, check_in_date);
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 5) panic_events — SOS / panik modu kayıtları
-- ---------------------------------------------------------------------
create table if not exists public.panic_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journey_id uuid references public.quit_journeys(id) on delete set null,
  -- panik anında seçilen / kullanılan araç: breathing | distraction | call | quote | passed
  resolved_with text,
  -- istek geçti mi (kullanıcı "geçti" dediyse true)
  passed boolean default true,
  duration_seconds integer,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6) relapse_logs — nazik relaps kurtarma kayıtları
-- ---------------------------------------------------------------------
create table if not exists public.relapse_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journey_id uuid references public.quit_journeys(id) on delete set null,
  -- streak korundu mu yoksa yolculuk yeniden mi başladı
  action text not null default 'kept_streak', -- kept_streak | restarted
  trigger_type text,
  note text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 7) İndeksler
-- ---------------------------------------------------------------------
create index if not exists idx_daily_check_ins_user on public.daily_check_ins(user_id, check_in_date desc);
create index if not exists idx_panic_events_user on public.panic_events(user_id, created_at desc);
create index if not exists idx_relapse_logs_user on public.relapse_logs(user_id, created_at desc);

-- ---------------------------------------------------------------------
-- 8) RLS — sahip-bazlı erişim
-- ---------------------------------------------------------------------
alter table public.daily_check_ins enable row level security;
alter table public.panic_events    enable row level security;
alter table public.relapse_logs     enable row level security;

drop policy if exists "own check-ins" on public.daily_check_ins;
create policy "own check-ins" on public.daily_check_ins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own panic events" on public.panic_events;
create policy "own panic events" on public.panic_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own relapse logs" on public.relapse_logs;
create policy "own relapse logs" on public.relapse_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
