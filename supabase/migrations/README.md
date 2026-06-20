# Supabase Migration'ları

Bu klasördeki SQL dosyaları `smoke` projesinin (`yvuvmpyqunzpnicwjscg`) şemasını
geliştirir. Dosyalar **idempotent**'tir — birden fazla kez güvenle çalıştırılabilir.

## Nasıl uygulanır

### Seçenek A — Supabase Dashboard (en kolay)
1. https://supabase.com/dashboard → `smoke` projesi
2. Sol menü **SQL Editor** → **New query**
3. `20260620_001_pro_upgrade.sql` içeriğini yapıştır → **Run**
4. "Success" mesajını gör.

### Seçenek B — Supabase CLI
```bash
# proje köküne supabase CLI bağlıysa:
supabase db push
# veya tek dosya:
psql "$DATABASE_URL" -f supabase/migrations/20260620_001_pro_upgrade.sql
```

## 20260620_001_pro_upgrade.sql neler ekler

| Alan/Tablo | Açıklama |
|---|---|
| `quit_journeys.cigarettes_per_pack` | Pakette sigara sayısı (tasarruf hesabı) |
| `quit_journeys.plan_type` | `cold_turkey` \| `gradual` |
| `quit_journeys.fagerstrom_score` | Onboarding Fagerström testi skoru (0-10) |
| `quit_journeys.dependence_level` | `low`/`moderate`/`high`/`very_high` |
| `quit_journeys.target_quit_date` | Kademeli plan hedef tarihi |
| `profiles.display_name/locale/theme` | Profil alanları + signup trigger'ı |
| `community_posts.comments_count` | Yorum sayacı |
| `daily_check_ins` | Günlük check-in (mood, craving_count, smoked, note) |
| `panic_events` | SOS/panik modu kayıtları |
| `relapse_logs` | Nazik relaps kurtarma kayıtları |
| RLS + indeksler | Tüm yeni tablolara sahip-bazlı RLS ve indeks |

> Not: Migration uygulanmadan da uygulama çalışır; yalnızca yeni alanlara
> yazan akışlar (Fagerström kaydı, panik/check-in/relaps) DB tarafında
> hata döndürür. Uygulama bu hataları yutar veya kullanıcıya bildirir.
