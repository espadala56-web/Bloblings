# Bloblings: Merge & Fuse

Telegram'da oynanan bir birleştirme (merge) oyunu. Aynı iki blob'u birleştir, daha güçlü
canavarlar keşfet, sen yokken bile altın biriktir. Arkadaşınla füzyon yaparak gizli melezleri aç.

## Klasörler

```
web/                 Yayına çıkan oyun (Cloudflare bu klasörü yayınlar)
  index.html         Giriş sayfası
  styles.css         Arayüz stilleri
  src/
    main.js          Oyunu başlatır
    config.js        Ekonomi ayarları (enerji, gelir çarpanı...)
    store.js         Oyun kuralları ve kayıt
    ui.js            Üst çubuk, butonlar, pencereler
    i18n.js          Türkçe / İngilizce metinler
    telegram.js      Telegram Mini App bağlantısı
    ads.js           Ödüllü reklam (şimdilik test modu)
    net.js           Sunucu bağlantısı: yükle ve hamleleri gönder
    sync.js          Sunucu doğrulama kuralları (Edge Function da kullanır)
    scenes/
      BoardScene.js  Tahta, sürükle-birleştir, efektler (Phaser)
  assets/            Karakter çizimleri (SVG)
  vendor/            Phaser 4.2.1 (MIT lisanslı)
```

Derleme adımı yoktur: dosyalar olduğu gibi yayınlanır.

```
supabase/
  migrations/        Veritabanı tabloları (players, events)
  functions/game/    Oyun sunucusu (Edge Function)
    index.ts         Telegram doğrulama + load / sync
    rules/           web/src kurallarının kopyası (scripts/sync-rules.sh)
```

## Sunucu nasıl çalışır?

- Oyun açılınca telefon, Telegram'ın imzaladığı `initData` ile sunucudan ilerlemeyi ister.
  İmza, Telegram'ın herkese açık Ed25519 anahtarıyla doğrulanır; sunucuda bot token'ı tutulmaz.
- Oyuncunun her hamlesi (birleştirme, yumurta, satın alma...) sıra numaralı bir eylem olarak kaydedilir
  ve 15 saniyede bir (ve oyun kapanırken) sunucuya gönderilir.
- Sunucu aynı kural dosyalarını (`store.js`) kendi saatiyle tekrar oynatır. Kurala uymayan hamle
  reddedilir, telefon sunucunun sonucunu benimser. Yumurtalar oyuncuya özel bir tohumdan çıkar,
  böylece telefon ve sunucu aynı sonucu bulur.
- Bağlantı yoksa oyun cihazda devam eder; bekleyen hamleler bağlantı gelince gönderilir.

Kurallarda değişiklik yaptıktan sonra: `scripts/sync-rules.sh` çalıştır ve `game` fonksiyonunu yeniden yayınla.

## Cloudflare kurulumu (bir kez)

1. Cloudflare panelinde **Compute → Workers & Pages → Create**.
2. **Import a repository** ile GitHub'ı bağla ve `espadala56-web/Bloblings` reposunu seç.
3. Ayarlar:
   - Project name: **bloblings**
   - Build command: **(boş bırak)**
   - Deploy command: **npx wrangler deploy** (varsayılan)
4. **Deploy**. Sana `https://bloblings.<hesap-adın>.workers.dev` gibi bir adres verir.

Ayarlar repodaki `wrangler.jsonc` dosyasında: Cloudflare `web` klasörünü olduğu gibi yayınlar.
Sonrasında `main` dalına gelen her değişiklik otomatik yayınlanır.

## Telegram'a bağlama

@BotFather'da `/newapp` ile botuna bir Mini App ekle, adres olarak Cloudflare adresini ver,
kısa ad olarak `play` yaz. Oyun linki: `https://t.me/<BotKullaniciAdi>/play`.

## Bilgisayarda deneme

```
python3 -m http.server 8080 -d web
```

Sonra tarayıcıda `http://localhost:8080` aç. Telegram dışında da çalışır.

## Yol haritası

- [x] Tahta: sürükle-birleştir, yumurta, enerji, saniyelik altın
- [x] Çevrimdışı kazanç ve "2 katını al" penceresi (reklam test modunda)
- [x] Türkçe / İngilizce
- [x] Evrimler: Ejderha, Deniz Ejderi, Kütükdev, Orman Ruhu (her element 5 seviye)
- [x] Element zinciri: Su ormanı, orman ateşi, ateş suyu besler (+%25 / komşu)
- [x] Altın harcama: kilitli yuvalar, yumurta kalitesi
- [x] Keşif kartları ve canlı (nefes alan) canavarlar
- [x] Supabase: oyuncu kaydı, Telegram doğrulaması, sunucu tarafı ekonomi
- [x] Albüm ekranı (keşfedilmeyenler için "nasıl bulunur" ipucu)
- [x] Günlük giriş serisi: 7 günlük takvim, 7. gün nadir yumurta
- [x] Enerji penceresi: reklamla +10 (günde 3) ya da kristalle +10
- [x] Ses efektleri (Web Audio, dosya yok) ve ayarlar: ses, titreşim, dil
- [ ] Füzyon ve hediye yumurtası (arkadaş daveti)
- [ ] Adsgram ödüllü reklam (sunucu doğrulamalı)
- [ ] Telegram Stars mağazası ve Kâşif Pası
- [ ] Görevler ve bildirimler
