# Smoke — App Store Yayın Öncesi Denetim Raporu

**Tarih:** 2026-06-27  
**Bundle ID:** `com.descanpo.smoke`  
**Expo SDK:** 52.0.28  
**Denetim Kapsamı:** `src/`, `App.tsx`, `app.json`, `babel.config.js`, `package.json`, `tsconfig.json`, `supabase/migrations/`, `docs/`, `.env*`, `.gitignore`

---

## Özet

| Kategori | Durum | Not |
|---|---|---|
| Supabase Güvenliği | ⚠️ | Anon key fallback hardcode; orijinal tablo RLS'i doğrulanamadı |
| Apple Uygunluğu | ❌ | Hesap silme YOK; buildNumber YOK; bildirim izin metni eksik |
| Expo/EAS Yapılandırması | ❌ | eas.json YOK; assets/ klasörü YOK (build tamamen engellenir) |
| Gizlilik & Yasal | ⚠️ | GitHub Pages aktif değil; aktif onay UI'ı eksik |
| Hata Yönetimi | ⚠️ | ErrorBoundary yok; crash reporting yok; console.warn'lar var |
| Performans | ⚠️ | Assets eksik (build blocker); ESLint yapılandırması yok |
| Mağaza Metadata | ⚠️ | buildNumber eksik; ekran görüntüsü/açıklama hazırlanmamış |

**Genel Sonuç: ❌ Hazır Değil**  
Yayın öncesinde 4 kritik sorun giderilmeli; 7 önemli iyileştirme şiddetle önerilir.

---

## Kritik Sorunlar (yayın öncesi mutlaka çözülmeli)

- [ ] **[C1] `assets/` klasörü mevcut değil** — `app.json`'da referans verilen `./assets/icon.png`, `./assets/splash.png`, `./assets/adaptive-icon.png` dosyaları bulunamadı. EAS build tamamen başarısız olur.
- [ ] **[C2] `eas.json` dosyası mevcut değil** — App Store'a EAS ile build göndermek için `production` profilli bir `eas.json` şart. Expo Go üzerinden native auth çalışmaz; gerçek build zorunlu.
- [ ] **[C3] Hesap silme özelliği uygulanmamış** — Apple, Haziran 2023'ten itibaren hesap oluşturan tüm uygulamalarda uygulama içi hesap silme seçeneğini zorunlu kılmaktadır. `ProfileScreen.tsx`'te veya başka hiçbir yerde `deleteUser` / hesap silme akışı bulunmuyor. Reddedilme garantisi.
- [ ] **[C4] `ios.buildNumber` tanımlanmamış** — `app.json:5`'te `"version": "1.0.0"` var, ancak `ios.buildNumber` (App Store Connect'in gerektirdiği) eksik. Build gönderimi bloke olur.

---

## Önemli Sorunlar (çözülmesi şiddetle önerilir)

- [ ] **[O1] Bildirim izin metni (`NSUserNotificationsUsageDescription`) eksik** — `expo-notifications` kullanıldığı hâlde `app.json` içinde `ios.infoPlist.NSUserNotificationsUsageDescription` tanımlanmamış. Apple bu metni `prebuild` sırasında InfoPlist'e eklemezse review'da reddedebilir.
- [ ] **[O2] Supabase anon key kod içinde hardcode edilmiş** — `src/services/supabase.ts:8-10` satırlarında `.env` okunamazsa kullanılacak bir fallback olarak gerçek anon key değeri gömülü. `.env` dosyası `.gitignore`'da mevcut olduğundan repo'ya sızmıyor; yine de iyi pratik değil. Fallback değeri kaldırılmalı, eksik `.env` açık bir hata fırlatmalı.
- [ ] **[O3] Orijinal tabloların RLS durumu doğrulanamıyor** — `supabase/migrations/20260620_001_pro_upgrade.sql` sadece yeni eklenen 3 tabloyu (`daily_check_ins`, `panic_events`, `relapse_logs`) enable ediyor. İlk kurulumda oluşturulan tablolar (`profiles`, `quit_journeys`, `craving_logs`, `smoke_logs`, `health_milestones`, `community_posts`, `post_likes`, `post_comments`, `breathing_exercise_logs`, `user_settings`, `motivational_quotes`, `achievements`, `user_achievements`, `user_milestone_progress`) için RLS ve politikaların aktif olduğu Supabase Dashboard'dan / ilk migration dosyasından teyit edilmeli.
- [ ] **[O4] Global `ErrorBoundary` bileşeni yok** — `src/` altında hiçbir `ErrorBoundary` bulunamadı. Render sırasında atılan herhangi bir exception uygulamayı boş ekranla çökertiyor; kullanıcıya hata mesajı gösterilmiyor.
- [ ] **[O5] Crash/analitik raporlama servisi entegre değil** — Sentry, Bugsnag veya benzeri bir servis yok. Production sorunları tespit edilemez.
- [ ] **[O6] GitHub Pages aktif değil** — `docs/privacy.html`, `docs/kvkk.html`, `docs/terms.html` var; ancak `WelcomeScreen.tsx:196-203`'te ve `ProfileScreen.tsx:220-222`'de bu URL'ler kullanıcıya sunuluyor. GitHub repo Settings > Pages aktif edilmedikçe bu URL'ler 404 döndürür. App Store Connect de Privacy Policy URL'sini zorunlu kılıyor.
- [ ] **[O7] KVKK/GDPR aktif onay UI'ı eksik** — `WelcomeScreen.tsx:194-205`'te yalnızca "devam ederek kabul etmiş sayılırsın" şeklinde pasif metin var. KVKK kapsamında açık rıza alınması için bir onay kutusu veya eşdeğer etkileşim önerilir.

---

## Tavsiyeler (iyileştirme önerisi, blocker değil)

- [ ] **[T1] Production build'de `console.*` çağrılarını kaldır** — `src/services/notifications.ts:43,66,95` ve `src/components/BreathingModal.tsx:184`'te `console.warn()` çağrıları var. `babel.config.js`'e `'transform-remove-console'` plugin'i eklenebilir (`env.production` kapsamında).
- [ ] **[T2] ESLint yapılandırması ekle** — Proje kökünde ESLint yapılandırması yok (`web/` alt dizininde mevcut, native için değil). Kod kalitesini artırmak için `npx expo lint` ile scaffold edilebilir.
- [ ] **[T3] `expo-updates` OTA güncellemesi yapılandır** — `app.json` içinde `expo-updates` kanalı/branch tanımlı değil. Production crash'ler için hotfix imkânı sağlar.
- [ ] **[T4] App Store Connect metadata hazırlığı** — Ekran görüntüleri (iPhone 6.9", 6.5", iPad), kısa açıklama, tam açıklama, anahtar kelimeler, promosyon metni, destek URL'si ve uygulama kategorisi (Health & Fitness) hazırlanmamış. Manuel olarak App Store Connect'te oluşturulmalı.
- [ ] **[T5] Auth hata mesajlarında `e.message` gösterimi** — `WelcomeScreen.tsx:46,61`'de Supabase'den gelen ham hata mesajı (`e.message`) kullanıcıya gösteriliyor. Teknik mesajlar (ör. "invalid_client", "redirect_uri_mismatch") son kullanıcıya anlamlı gelmez. Daha kullanıcı dostu jenerik mesaj göstermek tercih edilebilir.
- [ ] **[T6] `expo-updates` ve OTA kanalı** — `eas.json` oluşturulduktan sonra production channel'ı tanımla ve `app.json`'a `"updates"` bloğu ekle.

---

## Detaylı Bulgular

### 1. Supabase Güvenliği

**Anon Key — Client Tarafı Kullanımı**  
`src/services/supabase.ts:4-10`: Yalnızca `EXPO_PUBLIC_SUPABASE_ANON_KEY` kullanılıyor. `service_role` key tüm kaynak kod ve `.env*` dosyalarında taranmış, bulunmamıştır. ✅

**Anon Key Hardcode Fallback**  
`src/services/supabase.ts:9-10`:
```ts
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';  // ← hardcode
```
Anon key teknik olarak "gizli" değil; ancak `.env` eksik bırakılırsa hardcode değer sessizce devreye girer. Fallback kaldırılmalı, eksik key'de açık hata fırlatılmalı.

**RLS — Yeni Tablolar**  
`supabase/migrations/20260620_001_pro_upgrade.sql:143-157`: `daily_check_ins`, `panic_events`, `relapse_logs` için RLS enable + sahip-bazlı policy tanımlı. ✅

**RLS — Orijinal Tablolar**  
Repo'da yalnızca bir migration dosyası (`20260620_001_pro_upgrade.sql`) mevcut. Orijinal şema migration'ı bulunmadığından `profiles`, `quit_journeys`, `community_posts` vb. tabloların RLS durumu kod tabanından doğrulanamıyor. **Supabase Dashboard > Table Editor'da her tablo için RLS'in aktif olduğu teyit edilmeli.**

**Storage**  
Proje genelinde dosya yükleme / storage bucket kullanımı tespit edilmedi. ✅

---

### 2. Apple App Store Uygunluğu

**Bundle Identifier & Version**  
`app.json:17`: `"bundleIdentifier": "com.descanpo.smoke"` ✅  
`app.json:5`: `"version": "1.0.0"` ✅  
`app.json`'da `"buildNumber"` yok ❌ — App Store Connect her submission için artan bir buildNumber zorunlu kılar. Örnek: `"ios": { "buildNumber": "1" }` eklenmeli.

**İzin Açıklamaları (infoPlist)**  
`expo-notifications` (`package.json:21`) kullanılmasına karşın `app.json`'da `ios.infoPlist.NSUserNotificationsUsageDescription` yok.  
Kamera, fotoğraf kütüphanesi, konum erişimi kullanılmıyor → ilgili açıklamalar gerekmiyor. ✅

Eklenecek minimum:
```json
"ios": {
  "infoPlist": {
    "NSUserNotificationsUsageDescription": "Streak hatırlatmaları ve sağlık kilometre taşı bildirimleri için bildirim iznine ihtiyacımız var."
  }
}
```

**Hesap Silme (Zorunlu)**  
Apple, Haziran 2023 itibarıyla tüm uygulamalarda hesap silme özelliğini zorunlu kılıyor.  
`src/screens/ProfileScreen.tsx` incelendi: Yalnızca "Yolculuğu Sıfırla" (journey'i pasife alma) ve "Çıkış Yap" var. `supabase.auth.admin.deleteUser()` veya Edge Function aracılığıyla hesap silme + tüm kullanıcı verilerini temizleme akışı eklenmeli.

**Sign in with Apple**  
`app.json:18`: `"usesAppleSignIn": true` ✅  
`app.json:44`: `"expo-apple-authentication"` plugin ✅  
`src/screens/WelcomeScreen.tsx:148-166`: iOS'ta Apple butonu gösteriliyor ✅  
`src/services/auth.ts:68-103`: `signInWithApple` doğru implemente edilmiş ✅

**IAP & ATT**  
Uygulama içi satın alma yok → IAP kuralları geçerli değil. ✅  
Analytics / reklam SDK'sı yok → ATT (App Tracking Transparency) gerekli değil. ✅

---

### 3. Expo / EAS Build Yapılandırması

**`eas.json` Eksik**  
`eas.json` dosyası proje kökünde bulunmuyor. Temel bir yapılandırma:
```json
{
  "cli": { "version": ">= 13.0.0" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal" },
    "production": { "autoIncrement": true }
  },
  "submit": {
    "production": {}
  }
}
```

**Assets Klasörü Eksik**  
`app.json:6`: `"icon": "./assets/icon.png"` → dosya yok  
`app.json:11`: `"splash.image": "./assets/splash.png"` → dosya yok  
`app.json:21`: `"adaptiveIcon.foregroundImage": "./assets/adaptive-icon.png"` → dosya yok  

`find` komutuyla proje genelinde (`node_modules` hariç) taranan hiçbir `icon.png`, `splash.png` veya `adaptive-icon.png` bulunamadı. **Build tamamen başarısız olur.**

Gerekli boyutlar:
- `icon.png` → 1024×1024 px, şeffaf arka plan yok (iOS için)
- `splash.png` → minimum 1284×2778 px önerilir
- `adaptive-icon.png` → 1024×1024 px, Android

**Expo SDK Versiyonu**  
`package.json:19`: `"expo": "~52.0.28"` — mevcut desteklenen sürüm ✅

**Native Paket Versiyonları**  
Tüm expo paketleri `~` (compat) versiyonlamasıyla tanımlı, `expo install` protokolüyle uyumlu. ✅

---

### 4. Gizlilik ve Yasal Uygunluk

**Privacy Policy**  
`docs/privacy.html` mevcut ✅  
`WelcomeScreen.tsx:196`: `https://descanpo.github.io/smoke/terms.html` linki var ✅  
Ancak **GitHub Pages henüz aktif değil** → URL 404. App Store Connect de Privacy Policy URL'sini zorunlu kılıyor.

**KVKK / GDPR Onay Akışı**  
`WelcomeScreen.tsx:193-205`: Pasif metin ("devam ederek kabul etmiş olursunuz"). KVKK Madde 5 kapsamında açık rıza gerektiren durumlarda (sağlık verisi kategori olarak değerlendirilebilir) aktif onay (checkbox veya ayrı onay adımı) önerilir.

**App Privacy Nutrition Label — Toplanan Veri Özeti**  
App Store Connect'te beyan edilmesi gereken veri tipleri (kod tabanından çıkarılan):
| Veri Tipi | Kaynak | Kullanıcıyla İlişkilendirilmiş |
|---|---|---|
| Ad | Apple/Google OAuth + profiles tablosu | Evet |
| E-posta | Apple/Google OAuth | Evet |
| Kullanıcı ID | Supabase auth.users | Evet |
| Sigara bırakma tarihi, alışkanlık, maliyet | quit_journeys | Evet |
| İstek kayıtları | craving_logs | Evet |
| Check-in notları, ruh hali | daily_check_ins | Evet |
| Topluluk paylaşımları | community_posts, post_comments | Evet |
| Panik/SOS olayları | panic_events | Evet |
| Nefes egzersizi kayıtları | breathing_exercise_logs | Evet |

---

### 5. Hata Yönetimi ve Kararlılık

**Global ErrorBoundary**  
`src/` altında `ErrorBoundary` kelimesi arandı, hiç eşleşme yok. `App.tsx` ya da herhangi bir sarmalayıcı bileşende hata sınırı bulunmuyor. Eklenmesi gereken örnek:
```tsx
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <FallbackScreen />;
    return this.props.children;
  }
}
```

**Network Hata Yönetimi**  
`App.tsx:118-120`: Supabase sorgu hatası sessizce yakalanıp kullanıcıyı uygun ekranda bırakıyor ✅  
`src/services/auth.ts`: Tüm auth fonksiyonları `try/catch` içinde; UI'a anlamlı mesaj iletiliyor ✅

**console.warn Çağrıları**  
```
src/services/notifications.ts:43  — streak reminder schedule failed
src/services/notifications.ts:66  — evening check-in schedule failed
src/services/notifications.ts:95  — milestone schedule failed
src/components/BreathingModal.tsx:184 — breathing log failed
```
`babel.config.js`'te `transform-remove-console` yok → production build'de bu loglar cihaz konsolunda kalır.

**Crash Raporlama**  
`package.json` içinde Sentry, Bugsnag veya benzeri bir servis yok. Production hataları tespit edilemez.

---

### 6. Performans ve Genel Kalite

**Assets**  
`assets/` klasörü yok → Build başarısız. Önce asset'lar oluşturulmalı.

**TypeScript**  
`tsconfig.json:4`: `"strict": true` ✅  
`tsc --noEmit` bu denetimde çalıştırılmadı — manuel kontrol önerilir: `npx tsc --noEmit`

**Bundle Boyutu**  
`package.json` incelendi: Bağımlılıklar minimal ve amaca uygun. Gereksiz büyük paket tespit edilmedi. ✅

**ESLint**  
Proje kökünde ESLint yapılandırması yok (yalnızca `web/eslint.config.js` var, native için değil).  
Hızlı kurulum: `npx expo lint`

---

### 7. Sürüm ve Mağaza Metadata

**Version / BuildNumber**  
`app.json:5`: `"version": "1.0.0"` ✅  
`ios.buildNumber`: Yok ❌ → App Store Connect her yükleme için benzersiz bir buildNumber zorunlu kılıyor.

**App Store Connect Metadata**  
Kod tabanında ekran görüntüsü, uygulama açıklaması veya anahtar kelime dosyası bulunamadı.  
**Manuel kontrol gerekli:** App Store Connect'te hazırlanması gerekenler:
- iPhone 6.9" (1320×2868) ve 6.5" (1284×2778) ekran görüntüleri (minimum 3'er adet)
- Kısa açıklama (170 karakter), tam açıklama, promosyon metni
- Anahtar kelimeler (100 karakter, virgülle ayrılmış)
- Destek URL'si (önerilir: `https://descanpo.github.io/smoke/`)
- Privacy Policy URL'si (zorunlu)
- Yaş derecelendirmesi (sağlık uygulaması → 4+)
- Kategori: Health & Fitness (birincil), Lifestyle (ikincil önerilir)

---

## Öncelik Sırası — Yayın Yol Haritası

| # | Eylem | Kritiklik | Tahmini Süre |
|---|---|---|---|
| 1 | `assets/` klasörü oluştur + ikon/splash tasarla | ❌ Kritik | 2–4 saat |
| 2 | `eas.json` oluştur | ❌ Kritik | 30 dk |
| 3 | `ios.buildNumber` ekle (app.json) | ❌ Kritik | 5 dk |
| 4 | Hesap silme özelliği (ProfileScreen + Supabase Edge Fn) | ❌ Kritik | 3–5 saat |
| 5 | `NSUserNotificationsUsageDescription` ekle (app.json) | ⚠️ Önemli | 5 dk |
| 6 | GitHub Pages aktif et | ⚠️ Önemli | 10 dk |
| 7 | Orijinal tablo RLS'ini Supabase Dashboard'dan doğrula | ⚠️ Önemli | 30 dk |
| 8 | ErrorBoundary ekle (App.tsx'e sar) | ⚠️ Önemli | 1 saat |
| 9 | Supabase anon key fallback'ini kaldır | ⚠️ Önemli | 5 dk |
| 10 | App Store Connect metadata hazırla | ⚠️ Önemli | 2–3 saat |
| 11 | `transform-remove-console` ekle (babel.config.js) | Tavsiye | 5 dk |
| 12 | ESLint kur ve hataları temizle | Tavsiye | 1–2 saat |

---

*Rapor otomatik olarak Claude Code tarafından oluşturulmuştur. "Manuel kontrol gerekli" olarak işaretlenen maddeler kod tabanından doğrulanamayan, Supabase Dashboard veya App Store Connect gibi harici kaynaklarda teyit edilmesi gereken noktalardır.*
