# Rakip Analizi — Smoke (Sigarayı Bırakma Uygulaması) · 2025–2026

> Web araştırmasına dayalı güncel pazar analizi. Kaynaklar bölümde.

## Özet

Kategori olgun, kalabalık ve giderek abonelik-odaklı. Pazar ~**$588M (2023) → ~$1.34B (2032), ~%9.6 CAGR**.
Üç tüketici lideri: **Smoke Free** (veri/klinik), **QuitNow!** (topluluk), **Kwit** (oyunlaştırma+CBT) —
her biri 4M+ kullanıcı. 2025'te **AI-koç** uygulamaları (QuitBot/Fred Hutch, QuitNic, QuitPath AI)
beklentiyi yeniden şekillendiriyor; **Quit Genius/Pelago** işveren/ödeyici kanalını elinde tutuyor.

**Smoke temellerde rekabetçi** (sayaç, istatistik, rozet, SOS/nefes, ruh hali/istek kaydı, topluluk,
push, dark mode) ve hiçbir global uygulamanın sahip olmadığı **savunulabilir bir Türkiye avantajı** var:
derin yerelleştirme (TR/EN, ALO 171, Fagerström onboarding). En büyük eksikler: **AI koç**,
**sağlık iyileşme zaman çizelgesi**, **tetikleyici analitiği**, **NRT/ilaç takibi**, **widget + Apple
Health/Google Fit**, ve **cilalı premium paywall**.

**Strateji:** Türkiye hendeğini derinleştir (YEDAM/Yeşilay konumlama, KVKK güveni, TRY fiyat) +
en yüksek kaldıraçlı 2-3 global boşluğu kapat (AI koç, iyileşme zaman çizelgesi, tetikleyici analitiği) +
TR pazarına göre fiyatlı freemium abonelik.

## Rakip Karşılaştırması

| Uygulama | Platform | Model | Fiyat | Öne çıkan |
|----------|----------|-------|-------|-----------|
| **Smoke Free** | iOS/Android/Web | Freemium/abonelik | ~$4.99/ay; ~£60 lifetime | En iyi istatistik & sağlık panosu; AI günlük görevler; istek günlüğü + tetikleyici grafikleri; "Quit Coach" chatbot. 4M+ |
| **QuitNow!** | iOS/Android | Freemium (reklam)+Pro | Pro/lifetime | Gerçek-zamanlı **topluluk sohbeti** (asıl hendeği); 70 hedef/başarı |
| **Kwit** | iOS/Android | Freemium/abonelik | ~$59.99 lifetime | **Oyunlaştırma + CBT** (WHO-onaylı); NRT izleme; iyileşme zaman çizelgesi. 4.5M+ |
| **Flamy** | iOS/Android/Watch | Freemium/abonelik | aylık/yıllık | Temiz UI; tetikleyici analizi; dağıtma oyunları; **Apple Watch** |
| **EasyQuit** | iOS/Android | Free/Pro | Pro | **Gizlilik-öncelikli: login yok, yerel veri**; "Slow Mode"; 30+ tema |
| **QuitBot** | iOS/Android | Ücretsiz (STK) | Ücretsiz | **AI chatbot "Ellen"** — 6 hafta/32 konuşma; Fred Hutch, kanıta dayalı |
| **QuitNic / QuitPath AI** | iOS/Android | Free/freemium | Ücretsiz katman | Tetikleyiciye göre **AI koçluk**; günlük iyileşme görseli; 7/24 akran desteği |
| **Quit Genius (Pelago)** | iOS/Android (B2B) | İşveren/ödeyici | Kurumsal | Klinik: CBT + canlı koç + NRT/ilaç + uzaktan izleme; %25 bırakma garantisi |
| **Bırakabilirsin (Yeşilay/YEDAM)** | iOS/Android | Ücretsiz (devlet/STK) | Ücretsiz | Türkiye resmi: Fagerström, başarı günlüğü, **115 YEDAM danışmanlık**, ALO 171 |

## Boşluk Analizi

| Eksik özellik | Etki | Efor | Neden önemli |
|----------------|------|------|--------------|
| **AI koç / chatbot** (kanıta dayalı) | Yüksek | Orta | 2025'in tanımlayıcı farkı. Supabase + LLM ile yapılabilir; güçlü premium çıpası. |
| **Sağlık iyileşme zaman çizelgesi** | Yüksek | **Düşük** | Bırakma tarihinden istemci-tarafı hesap; yüksek duygusal getiri, retention. |
| **Tetikleyici/istek analitiği** (ne zaman/nerede/şiddet) | Yüksek | Orta | İstek kaydı zaten var — sadece analitik+grafik gerek. |
| **Fagerström'den kişisel plan çıktısı** | Orta-Yüksek | Orta | Skor toplanıyor ama plana dönüşmüyor (NRT önerisi, taper, başa çıkma paketi). |
| **NRT / ilaç takibi + hatırlatma** | Orta | Orta | Klinik anlamlı; oyuncak takipçiden ayrışır. |
| **Ana ekran widget'ları** | Orta | Orta | Pasif günlük pekiştirme; güçlü retention. |
| **Apple Health / Google Fit** | Orta | Orta | Güvenilirlik + ekosistem yapışkanlığı. |
| **Buddy / hesap-verebilirlik** | Orta | Orta-Yüksek | QuitNow'un hendeğine TR-yerel toplulukla saldırı. |
| **Premium paywall + freemium gating** | Yüksek | Orta | Şu an monetizasyon yok; Health&Fitness ~$0.63 gelir/yükleme (medyanın 2 katı). |
| **Relaps kurtarma akışı** (sadece sayaç sıfırlama değil) | Orta | Düşük | En kırılgan anda retention'ı korur. |
| **Derin oyunlaştırma** (seviye/streak/kilit açma) | Orta | Orta | Kwit'in motoru; rozetleri ilerleme sistemine taşı. |

## Smoke'un zaten kazandığı yerler

- **Türkiye yerelleştirmesi gerçek bir hendek** — TR/EN + **ALO 171** entegrasyonu hiçbir global
  uygulamada yok. Sadece *Bırakabilirsin* (devlet) rekabet ediyor ama cila/oyunlaştırma/UX'te geride.
- **Fagerström onboarding + plan tipi** ön kapıda çoğu rakibe denk/üstün.
- **SOS/panik modu iyi kurgulanmış** — nefes + dağıtma + motivasyon tek akışta.
- **Bugün ücretsiz katmanda tam özellik genişliği** — QuitNow/Flamy ücretsiz katmanıyla kıyaslanabilir.
- **Ruh hali + istek kaydı** rakiplerin "insight" diye sattığı ham veriyi zaten topluyor.
- **Gerçek backend (Supabase) + Google girişi** — cihazlar arası senkron ve ölçekli topluluk mümkün.

## Öncelikli 8 Hamle

### 0–3 ay (parite + kolay kazanç)
1. **Sağlık iyileşme zaman çizelgesi** (Yüksek/Düşük) — bırakma tarihinden vücut iyileşme kilometre taşları, TR yerel.
2. **Tetikleyici & istek analitiği** (Yüksek/Orta) — mevcut kayıtlardan grafik + haftalık "desenlerin" özeti.
3. **Relaps kurtarma akışı** (Orta/Düşük) — sert sıfırlama yerine şefkatli "kaydın, sırada ne var" yolu.
4. **Freemium gating + paywall (RevenueCat)** (Yüksek/Orta) — SOS/nefes ücretsiz kalsın (kanca + güvenlik).

### 3–6 ay (farklılaşma + ölçek)
5. **AI koç / chatbot** (Yüksek/Orta) — TR-öncelikli, CBT temelli; en büyük boşluk + premium çıpa.
6. **Fagerström'den kişisel plan** (Orta-Yüksek/Orta) — taper/NRT/başa çıkma paketi.
7. **Widget + Apple Health/Google Fit** (Orta/Orta).
8. **Topluluk üstüne buddy katmanı** (Orta/Orta-Yüksek).

## Monetizasyon Önerisi

**Model: Freemium abonelik** (kategori standardı).
- **Premium arkası:** AI koç, gelişmiş analitik, tam iyileşme detayı, NRT takibi, sınırsız günlük, premium temalar.
- **Ücretsiz (kanca/güvenlik):** sayaç, temel istatistik, SOS/nefes, rozet, topluluk, ALO 171.
- **TR fiyat:** Türkiye fiyata çok duyarlı (~ABD'nin %29'u). **TRY ile** fiyatla (otomatik çeviri değil):
  ~₺79–99/ay, indirimli yıllık, ve **lifetime** seçeneği (kategoride iyi dönüşüyor).
- **Global:** aylık ~$4.99–7.99, yıllık ~$29.99–39.99, lifetime ~$49.99–59.99; onboarding sonrası deneme→yıllık.

**TR güven kaldıraçları:** KVKK şeffaflığı önde; Yeşilay/YEDAM/ALO 171 çağrışımı; yerel içerik (₺ tasarruf, TR sağlık metni, TR AI koç).

## Kaynaklar
- MobileAppDaily, QuitBeaver, QuitNic (2026 listeleri)
- Smoke Free (app.smokefreeapp.com), Kwit (App Store), QuitNow (App Store), Flamy (mwm.ai), EasyQuit (Google Play)
- QuitBot (Fred Hutch), Frontiers in Digital Health (chatbot etkinliği)
- Pelago/Quit Genius, FierceHealthcare
- Yeşilay "Bırakabilirsin", HSGM ALO 171, Mirava (TR fiyatlama)
- Market Research Store (pazar boyutu), RevenueCat State of Subscription Apps 2025
