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
    scenes/
      BoardScene.js  Tahta, sürükle-birleştir, efektler (Phaser)
  assets/            Karakter çizimleri (SVG)
  vendor/            Phaser 4.2.1 (MIT lisanslı)
```

Derleme adımı yoktur: dosyalar olduğu gibi yayınlanır.

## Cloudflare Pages kurulumu (bir kez)

1. Cloudflare panelinde **Workers & Pages → Create → Pages → Connect to Git**.
2. `espadala56-web/Bloblings` reposunu seç.
3. Ayarlar:
   - Framework preset: **None**
   - Build command: **(boş bırak)**
   - Build output directory: **web**
4. **Save and Deploy**. Sana `https://bloblings.pages.dev` gibi bir adres verir.

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
- [ ] Supabase: oyuncu kaydı, Telegram doğrulaması, sunucu tarafı ekonomi
- [ ] Albüm ekranı ve keşifler
- [ ] Füzyon ve hediye yumurtası (arkadaş daveti)
- [ ] Adsgram ödüllü reklam (sunucu doğrulamalı)
- [ ] Telegram Stars mağazası ve Kâşif Pası
- [ ] Günlük giriş serisi, görevler, bildirimler
