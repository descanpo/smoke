# docs/ — Smoke GitHub Pages

Bu klasör GitHub Pages tarafından `https://descanpo.github.io/smoke/` adresinde yayınlanır.
Yayınlanan **web sitesi** ile **yasal belgeler** ayrı tutulur:

```
docs/
├── index.html            ← Web sitesi (açılış / landing)
├── reset-password.html   ← Şifre sıfırlama redirect sayfası (fonksiyonel)
├── _config.yml           ← GitHub Pages yapılandırması
└── legal/                ← Yasal belgeler (uygulamadan linklenir)
    ├── kvkk.html
    ├── privacy.html
    └── terms.html
```

## Yayınlanan URL'ler
- Site: `https://descanpo.github.io/smoke/`
- Şifre sıfırlama: `https://descanpo.github.io/smoke/reset-password.html`
- KVKK: `https://descanpo.github.io/smoke/legal/kvkk.html`
- Gizlilik: `https://descanpo.github.io/smoke/legal/privacy.html`
- Koşullar: `https://descanpo.github.io/smoke/legal/terms.html`

> Bu URL'ler uygulama kodunda (`src/screens/WelcomeScreen.tsx`, `src/screens/ProfileScreen.tsx`)
> ve App Store / Supabase yapılandırmasında kullanılır. Dosya taşırken bu referansları da güncelle.

## Aktivasyon
Repo **Settings → Pages → Source: `main` / `docs`** seçilmelidir; aksi halde linkler 404 döner.
