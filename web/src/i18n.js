// Metinler. Oyuncu ayarlardan dil seçmediyse Telegram dili Türkçeyse Türkçe, değilse İngilizce.

import { ART } from './config.js';

const STRINGS = {
  tr: {
    perSec: 'Saniyede',
    goldUnit: 'altın',
    full: 'Dolu',
    openEgg: 'Yumurta aç',
    upgrade: 'Geliştir',
    hintFirstMerge: 'Aynı iki canavarı sürükleyip üst üste bırak.',
    hintOpenEgg: 'Yumurta aç, yeni canavarlar gelsin.',
    hintBoardFull: 'Tahta dolu! Birleştirerek yer aç.',
    hintNoEnergy: 'Enerjin bitti. Birleştirmeye devam et, enerji kendiliğinden dolar.',
    hintKeepMerging: 'Birleştirdikçe saniyelik gelirin artar.',
    hintSynergy: 'İpucu: Su ormanı, orman ateşi, ateş de suyu besler. Onları yan yana koy!',
    hintUpgrade: 'Yeterince altının var! Geliştir butonuna dokun.',
    noEnergy: 'Enerjin yok. Bir sonraki enerji: {t}',
    boardFull: 'Tahtada boş yer yok.',
    welcomeTitle: 'Hoş geldin!',
    welcomeBody: 'Sen yokken canavarların {h} boyunca çalıştı ve şunu biriktirdi:',
    collect: 'Topla',
    collectDouble: '2 katını al',
    adTest: 'Test reklamı gösterildi (gerçek reklamlar yayında açılacak).',
    collected: '{n} altın kasana eklendi.',
    hours: '{n} saat',
    minutes: '{n} dakika',
    energyLabel: 'Enerji',
    goldLabel: 'Altın',
    crystalLabel: 'Kristal',
    newDiscovery: 'Yeni keşif!',
    awesome: 'Harika!',
    upgradesTitle: 'Geliştirmeler',
    eggQualityTitle: 'Yumurta kalitesi',
    eggQualityDesc: 'Yumurtalardan Lv{a} yerine Lv{b} çıksın.',
    slotTitle: 'Yeni yuva',
    slotDesc: 'Tahtada {n} kilitli yuva kaldı.',
    maxed: 'Tamamlandı',
    needGold: '{n} altın daha gerek.',
    slotUnlocked: 'Yeni yuva açıldı!',
    eggUpgraded: 'Yumurtalar artık Lv{n} çıkarıyor!',
    synergyTitle: 'Element zinciri',
    synergyDesc: 'Su ormanı, orman ateşi, ateş de suyu besler. Besleyen her komşu +%25 gelir verir.',
    close: 'Kapat',
    lockedSlot: 'Kilitli yuva',
    offlineMode: 'Sunucuya bağlanılamadı. İlerlemen bu cihazda saklanıyor, bağlantı gelince gönderilecek.',
    sessionExpired: 'Oturum süresi doldu. İlerlemeni kaydetmek için oyunu kapatıp yeniden aç.',
    settingsTitle: 'Ayarlar',
    soundLabel: 'Ses efektleri',
    hapticsLabel: 'Titreşim',
    langLabel: 'Dil',
    albumTitle: 'Albüm',
    albumLabel: 'Albüm',
    albumProgress: '{n}/{m} keşfedildi',
    albumLocked: 'Henüz keşfedilmedi',
    albumHowEgg: 'Yumurtadan çıkar.',
    albumHowMerge: 'İki Lv{n} {el} canavarını birleştir.',
    albumTap: 'Bir canavara dokun, hikâyesini oku.',
    dailyTitle: 'Günlük ödül',
    dailyLabel: 'Günlük ödül',
    dailyBody: 'Her gün gel, serin büyüsün. 2 gün gelmezsen seri baştan başlar.',
    dayN: '{n}. gün',
    claim: 'Topla',
    dailyNext: 'Sonraki ödül {t} sonra',
    dailyGot: '{n}. gün ödülü alındı!',
    rareEgg: 'Nadir yumurta',
    energyTitle: 'Enerji',
    energyBody: 'Her 5 dakikada 1 enerji dolar.',
    energyNext: 'Sonraki enerji: {t}',
    energyFullIn: 'Tamamen dolmasına {t}',
    watchAd: 'Reklam izle',
    adsLeft: 'Bugün {n} hakkın kaldı',
    adsNone: 'Bugünlük reklam hakkın bitti, yarın yenilenir.',
    energyAdded: '+{n} enerji!',
    energyTip: 'Beklerken birleştirmeye devam et; canavarların altın üretmeyi sürdürür.',
    needCrystals: '{n} kristal daha gerek.',
    settingsLabel: 'Ayarlar',
    durHM: '{h} sa {m} dk',
    fire: 'Ateş',
    water: 'Su',
    forest: 'Orman',
  },
  en: {
    perSec: 'Per second',
    goldUnit: 'gold',
    full: 'Full',
    openEgg: 'Open egg',
    upgrade: 'Upgrade',
    hintFirstMerge: 'Drag one blob onto its twin to merge them.',
    hintOpenEgg: 'Open an egg to hatch new blobs.',
    hintBoardFull: 'Board is full! Merge to make room.',
    hintNoEnergy: 'Out of energy. Keep merging, it refills on its own.',
    hintKeepMerging: 'Every merge boosts your gold per second.',
    hintSynergy: 'Tip: water feeds forest, forest feeds fire, fire feeds water. Place them side by side!',
    hintUpgrade: 'You have enough gold! Tap Upgrade.',
    noEnergy: 'No energy. Next one in {t}',
    boardFull: 'No empty slots on the board.',
    welcomeTitle: 'Welcome back!',
    welcomeBody: 'Your blobs worked for {h} while you were away and collected:',
    collect: 'Collect',
    collectDouble: 'Collect 2x',
    adTest: 'Test ad shown (real ads turn on at launch).',
    collected: '{n} gold added to your vault.',
    hours: '{n} hours',
    minutes: '{n} minutes',
    energyLabel: 'Energy',
    goldLabel: 'Gold',
    crystalLabel: 'Crystals',
    newDiscovery: 'New discovery!',
    awesome: 'Awesome!',
    upgradesTitle: 'Upgrades',
    eggQualityTitle: 'Egg quality',
    eggQualityDesc: 'Eggs hatch Lv{b} instead of Lv{a}.',
    slotTitle: 'New slot',
    slotDesc: '{n} locked slots left on the board.',
    maxed: 'Maxed',
    needGold: 'You need {n} more gold.',
    slotUnlocked: 'New slot unlocked!',
    eggUpgraded: 'Eggs now hatch Lv{n}!',
    synergyTitle: 'Element chain',
    synergyDesc: 'Water feeds forest, forest feeds fire, fire feeds water. Each feeding neighbor gives +25% gold.',
    close: 'Close',
    lockedSlot: 'Locked slot',
    offlineMode: 'Could not reach the server. Your progress is saved on this device and will sync later.',
    sessionExpired: 'Session expired. Close and reopen the game to keep saving your progress.',
    settingsTitle: 'Settings',
    soundLabel: 'Sound effects',
    hapticsLabel: 'Vibration',
    langLabel: 'Language',
    albumTitle: 'Album',
    albumLabel: 'Album',
    albumProgress: '{n}/{m} discovered',
    albumLocked: 'Not discovered yet',
    albumHowEgg: 'Hatches from eggs.',
    albumHowMerge: 'Merge two Lv{n} {el} blobs.',
    albumTap: 'Tap a blob to read its story.',
    dailyTitle: 'Daily reward',
    dailyLabel: 'Daily reward',
    dailyBody: 'Come back every day to grow your streak. Miss 2 days and it starts over.',
    dayN: 'Day {n}',
    claim: 'Claim',
    dailyNext: 'Next reward in {t}',
    dailyGot: 'Day {n} reward claimed!',
    rareEgg: 'Rare egg',
    energyTitle: 'Energy',
    energyBody: 'You get 1 energy every 5 minutes.',
    energyNext: 'Next energy in {t}',
    energyFullIn: 'Full in {t}',
    watchAd: 'Watch ad',
    adsLeft: '{n} left today',
    adsNone: 'No more ads today. Resets tomorrow.',
    energyAdded: '+{n} energy!',
    energyTip: 'Keep merging while you wait. Your blobs keep making gold.',
    needCrystals: 'You need {n} more crystals.',
    settingsLabel: 'Settings',
    durHM: '{h}h {m}m',
    fire: 'Fire',
    water: 'Water',
    forest: 'Forest',
  },
};

const NAMES = {
  tr: {
    'fire-1': 'Kıvılcık', 'fire-2': 'Közcük', 'fire-3': 'Alevli', 'fire-4': 'Ejderçik', 'fire-5': 'Ejderha',
    'water-1': 'Damlacık', 'water-2': 'Dalgacık', 'water-3': 'Köpükçü', 'water-4': 'Dalgakral', 'water-5': 'Deniz Ejderi',
    'forest-1': 'Filiz', 'forest-2': 'Yapraklı', 'forest-3': 'Çiçekçi', 'forest-4': 'Kütükdev', 'forest-5': 'Orman Ruhu',
    steamy: 'Buharcık',
  },
  en: {
    'fire-1': 'Sparky', 'fire-2': 'Ember', 'fire-3': 'Blaze', 'fire-4': 'Drakelet', 'fire-5': 'Dragon',
    'water-1': 'Droplet', 'water-2': 'Ripple', 'water-3': 'Bubbler', 'water-4': 'Tidelord', 'water-5': 'Leviathan',
    'forest-1': 'Sprout', 'forest-2': 'Leafy', 'forest-3': 'Blossom', 'forest-4': 'Oakheart', 'forest-5': 'Grovekeeper',
    steamy: 'Steamy',
  },
};

// Her yaratığın kendine has kısa cümlesi. Keşif kartında görünür.
const FLAVOR = {
  tr: {
    'fire-1': 'Hapşırınca etrafa minik kıvılcımlar saçar.',
    'fire-2': 'Sıcacık sarılır. Gerçekten sıcacık.',
    'fire-3': 'Saçını kendisi şekillendirir. Alevle.',
    'fire-4': 'Henüz kanadı yok ama hayalleri büyük.',
    'fire-5': 'Sonunda uçabiliyor. Gökyüzü artık onun.',
    'water-1': 'Yağmurlu günlerin en mutlu üyesi.',
    'water-2': 'Her kıkırdadığında küçük bir dalga yapar.',
    'water-3': 'Banyo saatini asla kaçırmaz.',
    'water-4': 'Gelgitleri o yönetir. En azından öyle diyor.',
    'water-5': 'Derinlerden yükseldi. Hâlâ çok sevimli.',
    'forest-1': 'Güneşi görünce gülümser.',
    'forest-2': 'Her sonbahar biraz utangaçlaşır.',
    'forest-3': 'Başındaki çiçeği kimseye vermez. Asla.',
    'forest-4': 'Yavaş yürür, sıkı sarılır.',
    'forest-5': 'Ormanın sırlarını boynuzlarında taşır.',
  },
  en: {
    'fire-1': 'Sneezes tiny sparks everywhere.',
    'fire-2': 'Gives warm hugs. Very warm.',
    'fire-3': 'Styles its own hair. With fire.',
    'fire-4': 'No wings yet, but very big dreams.',
    'fire-5': 'Finally airborne. The sky is its now.',
    'water-1': 'The happiest member of every rainy day.',
    'water-2': 'Makes a tiny wave every time it giggles.',
    'water-3': 'Never misses bath time.',
    'water-4': 'Rules the tides. Or so it claims.',
    'water-5': 'Rose from the deep. Still adorable.',
    'forest-1': 'Smiles whenever the sun comes out.',
    'forest-2': 'Gets a little shy every autumn.',
    'forest-3': 'Will not share the flower. Ever.',
    'forest-4': 'Walks slowly, hugs firmly.',
    'forest-5': 'Carries the secrets of the forest in its antlers.',
  },
};

let lang = 'en';

export function setLang(code) {
  lang = String(code || '').toLowerCase().startsWith('tr') ? 'tr' : 'en';
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
}

export function getLang() {
  return lang;
}

function locale() {
  return lang === 'tr' ? 'tr-TR' : 'en-US';
}

export function t(key, vars = {}) {
  let s = (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}

export function blobName(el, lv) {
  const top = ART[el] || 1;
  const key = `${el}-${Math.min(lv, top)}`;
  const base = NAMES[lang][key] || NAMES.en[key] || el;
  // Çizimi olmayan yüksek seviyeler: en üst ismin yanına artı yazılır.
  return lv > top ? `${base} +${lv - top}` : base;
}

export function blobFlavor(el, lv) {
  const key = `${el}-${Math.min(lv, ART[el] || 1)}`;
  return FLAVOR[lang][key] || FLAVOR.en[key] || '';
}

export function formatNum(n) {
  const v = Math.floor(n);
  if (v < 10000) return v.toLocaleString(locale());
  return new Intl.NumberFormat(locale(), { notation: 'compact', maximumFractionDigits: 1 }).format(v);
}

// Geri sayım: 1 saatten azsa 4:05, fazlaysa 5 sa 12 dk.
export function formatClock(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s < 3600) return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  return t('durHM', { h: Math.floor(s / 3600), m: Math.floor((s % 3600) / 60) });
}

export function formatDuration(ms) {
  const totalMin = Math.max(1, Math.round(ms / 60000));
  if (totalMin < 60) return t('minutes', { n: totalMin });
  const h = Math.round((totalMin / 60) * 10) / 10;
  return t('hours', { n: h.toLocaleString(locale()) });
}
