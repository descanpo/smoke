# 🚭 Smoke - Sigarayı Bırakma Uygulaması

> Türkiye'nin ilk KVKK uyumlu, Türkçe-first sigarayı bırakma uygulaması.

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-aktif-brightgreen)](https://descanpo.github.io/smoke/)

## ✨ Özellikler

| Özellik | Detay |
|---------|-------|
| ⏱ Sayac | Gün/saat/dakika bazlı sigarasız süre |
| 💰 TL Tasarruf | Türk Lirası cinsinden gerçek zamanlı hesap |
| ❤️ Sağlık İlerlemesi | 14 bilimsel kilometre taşı |
| 🔥 İstek Takibi | Tetikleyici analizi ve direnç oranı |
| 🌬️ Nefes Egzersizi | Kutu, 4-7-8, Derin nefes |
| 👥 Topluluk | Anonim/isimli paylaşım |
| 🏅 Rozetler | 20+ başarı rozeti |
| 📊 statistikler | Haftalık grafik ve tetikleyici analizi |
| 🔒 KVKK Uyumlu | 6698 Sayılı Kanun uyumlu |

## 🚀 Rakiplerden Farkımız

| Özellik | Smoke Free | QuitNow! | **Smoke** |
|---------|-----------|----------|-----------|
| Türkçe-first | ❌ | ❌ | ✅ |
| TL desteği | ❌ | ❌ | ✅ |
| KVKK uyumu | ❌ | ❌ | ✅ |
| Ücretsiz tam özellik | ❌ | ❌ | ✅ |
| Anonim kullanım | ❌ | ❌ | ✅ |

## 🛠️ Teknoloji Stack

- **React Native** (Expo SDK 52)
- **Expo Router v4** (file-based navigation)
- **Supabase** (Auth + PostgreSQL + Realtime)
- **TypeScript** + **Zustand** + **TanStack Query**
- **React Native Reanimated** (animasyonlar)

## 🗄️ Veritabanı

Supabase `smoke` projesi üzerinde:

| Tablo | Açıklama |
|-------|----------|
| `profiles` | Kullanıcı profilleri |
| `quit_journeys` | Sigarayı bırakma yolculukları |
| `craving_logs` | Sigara içme isteği günlüğü |
| `smoke_logs` | Sigara içme kayıtları |
| `health_milestones` | 14 sağlık kilometre taşı |
| `achievements` | 20+ başarı rozeti tanımları |
| `user_achievements` | Kazanılan rozetler |
| `community_posts` | Topluluk paylaşımları |
| `daily_check_ins` | Günlük ruh hali kaydı |
| `breathing_exercise_logs` | Nefes egzersizi geçmişi |
| `motivational_quotes` | Motivasyon alıntıları |

## 📱 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env

# Expo başlat
npx expo start
```

## 🔒 Yasal

- 🔗 [KVKK Aydınlatma Metni](https://descanpo.github.io/smoke/legal/kvkk.html)
- 🔗 [Gizlilik Politikası](https://descanpo.github.io/smoke/legal/privacy.html)
- 🔗 [Kullanım Koşulları](https://descanpo.github.io/smoke/legal/terms.html)

---

**Geliştirici:** Rıza UZUNKAYA · descanpo2@gmail.com
