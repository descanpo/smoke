# Güvenlik Denetim Raporu — Smoke (React Native/Expo + Supabase)

> Tarih: 2026-06-20 · Kapsam: kod tabanı (statik) + canlı Supabase (RLS, advisors, policy'ler)
> Proje ref: `yvuvmpyqunzpnicwjscg`

## Özet

Veritabanı yetkilendirme duruşu **güçlü**: 17 public tablonun tamamında RLS açık ve tüm
kullanıcı-verisi tabloları `auth.uid() = user_id` ile doğru şekilde sınırlandırılmış. Kaynak
kodda `service_role` anahtarı, özel anahtar veya SQL injection bulunmadı; XSS / `eval` /
`dangerouslySetInnerHTML` kullanımı yok. `vite.config.js`/`.env` içindeki anon anahtar
beklenen şekilde herkese açıktır — bulgu değildir.

**Genel risk: Orta** → `.mcp.json` token'ları döndürülünce (rotate) **Düşük**'e iner.

---

## ✅ Bu denetimde UYGULANAN düzeltmeler (DB)

Aşağıdakiler migration olarak canlı projeye uygulandı ve doğrulandı:

| # | Bulgu | Uygulanan düzeltme | Durum |
|---|-------|--------------------|-------|
| 2 | **IDOR** — `get_user_stats`/`get_money_saved`/`get_cigarettes_avoided` SECURITY DEFINER fonksiyonları `p_user_id` alıp RLS'i baypas ediyordu; anon/authenticated herhangi bir UUID ile başkasının istatistiklerini okuyabilirdi. (İstemci bu RPC'leri kullanmıyor — grep ile doğrulandı.) | `PUBLIC, anon, authenticated`'tan `EXECUTE` geri alındı | ✅ Doğrulandı (`anon_exec=false`, `auth_exec=false`) |
| 5 | 5 fonksiyonda değiştirilebilir `search_path` (definer ele geçirme riski) | İlgili fonksiyonlara `SET search_path = public, pg_temp` | ✅ |
| 3 | `community_posts` UPDATE policy'sinde `WITH CHECK` yoktu → sahip, satırın `user_id`'sini başkasına çevirebilirdi | `WITH CHECK (auth.uid() = user_id)` eklendi | ✅ |
| 4 | `daily_check_ins` üzerinde yinelenen, `WITH CHECK`'siz policy (`"Users can manage own check-ins"`) daha sıkı olanı zayıflatıyordu | Yinelenen policy kaldırıldı (`"own check-ins"` kaldı) | ✅ |

---

## ⚠️ SENİN YAPMAN GEREKENLER (kod/panel — koddan yapılamaz)

| # | Önem | Konu | Yapılacak |
|---|------|------|-----------|
| 1 | **Yüksek** | `.mcp.json` içinde düz metin **ayrıcalıklı token'lar**: 2 adet Supabase yönetim token'ı (`sbp_…`), bir GitHub PAT (`ghp_…`), Stitch ve MiniMax API anahtarları. `sbp_` token RLS'i tamamen baypas eder — tüm projeyi okuyup yazabilir, DDL çalıştırabilir. **Dosya `.gitignore`'da ve git geçmişinde yok** (yerel-yalnız risk). | **Beşini de döndür (rotate):** Supabase → Account → Access Tokens (revoke+yeni), GitHub → PAT revoke, Stitch/MiniMax anahtarlarını yenile. Repo dışında (`~/.config`) veya OS env değişkeninde tut. |
| 6 | Düşük | Sızdırılmış parola koruması (HaveIBeenPwned) kapalı; e-posta/parola kaydı açık | Supabase → Authentication → Policies → "Leaked password protection" aç |
| 8 | Bilgi | KVKK/Gizlilik sayfaları davranışsal/sağlık verisini (istek, ruh hali, relaps) kapsamalı | Barındırılan KVKK/gizlilik metnini gözden geçir |

---

## ℹ️ Not edilen, düşük riskli

- **Anonim gönderi** (`is_anonymous`) yalnızca istemcide uygulanıyor; anonim gönderide gerçek
  `user_id` saklanıyor. Bugün `profiles` SELECT policy'si `auth.uid() = id` (özel) olduğundan
  başkasının adı join ile sızmaz — koruma bu policy'nin gevşetilmemesine bağlı. Sertleştirmek
  için anonim gönderiyi `user_id` olmadan saklamayı düşün.

## Zaten iyi yapılanlar

- 17 public tablonun tamamında RLS açık; yeni tabloya RLS'i otomatik açan `rls_auto_enable`
  event trigger'ı var (mükemmel savunma katmanı).
- Kullanıcı-verisi policy'leri doğru: `auth.uid() = user_id` / `= id`. Referans tabloları
  (`achievements`, `health_milestones`, `motivational_quotes`) bilinçli herkese-okunur, yazma yok.
- `profiles` özel — başkalarının e-postası/adı REST üzerinden sızmıyor.
- Injection yüzeyi yok; tüm sorgular Supabase query builder ile parametreli.
- Sırlar gitignore'da ve hiç commit'lenmemiş; oturum yönetimi sağlam (persist/refresh, OAuth
  redirect platforma göre, çıkışta bildirimler iptal + state reset).
