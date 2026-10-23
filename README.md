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
- [ ] Supabase: oyuncu kaydı, Telegram doğrulaması, sunucu tarafı ekonomi
- [ ] Albüm ekranı ve keşifler
- [ ] Füzyon ve hediye yumurtası (arkadaş daveti)
- [ ] Adsgram ödüllü reklam (sunucu doğrulamalı)
- [ ] Telegram Stars mağazası ve Kâşif Pası
- [ ] Günlük giriş serisi, görevler, bildirimler
