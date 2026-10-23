// Metinler. Oyuncunun Telegram dili Türkçeyse Türkçe, değilse İngilizce gösterilir.

const STRINGS = {
  tr: {
    perSec: 'Saniyede',
    goldUnit: 'altın',
    full: 'Dolu',
    openEgg: 'Yumurta aç',
    hintFirstMerge: 'Aynı iki canavarı sürükleyip üst üste bırak.',
    hintOpenEgg: 'Yumurta aç, yeni canavarlar gelsin.',
    hintBoardFull: 'Tahta dolu! Birleştirerek yer aç.',
    hintNoEnergy: 'Enerjin bitti. Birleştirmeye devam et, enerji kendiliğinden dolar.',
    hintKeepMerging: 'Birleştirdikçe saniyelik gelirin artar.',
    noEnergy: 'Enerjin yok. Bir sonraki enerji: {t}',
    boardFull: 'Tahtada boş yer yok.',
    newDiscovery: 'Yeni keşif: {name}!',
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
  },
  en: {
    perSec: 'Per second',
    goldUnit: 'gold',
    full: 'Full',
    openEgg: 'Open egg',
    hintFirstMerge: 'Drag one blob onto its twin to merge them.',
    hintOpenEgg: 'Open an egg to hatch new blobs.',
    hintBoardFull: 'Board is full! Merge to make room.',
    hintNoEnergy: 'Out of energy. Keep merging, it refills on its own.',
    hintKeepMerging: 'Every merge boosts your gold per second.',
    noEnergy: 'No energy. Next one in {t}',
    boardFull: 'No empty slots on the board.',
    newDiscovery: 'New discovery: {name}!',
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
  },
};

const NAMES = {
  tr: {
    'fire-1': 'Kıvılcık', 'fire-2': 'Közcük', 'fire-3': 'Alevli', 'fire-4': 'Ejderçik',
    'water-1': 'Damlacık', 'water-2': 'Dalgacık', 'water-3': 'Köpükçü', 'water-4': 'Dalgakral',
    'forest-1': 'Filiz', 'forest-2': 'Yapraklı', 'forest-3': 'Çiçekçi',
    steamy: 'Buharcık',
  },
  en: {
    'fire-1': 'Sparky', 'fire-2': 'Ember', 'fire-3': 'Blaze', 'fire-4': 'Drakelet',
    'water-1': 'Droplet', 'water-2': 'Ripple', 'water-3': 'Bubbler', 'water-4': 'Tidelord',
    'forest-1': 'Sprout', 'forest-2': 'Leafy', 'forest-3': 'Blossom',
    steamy: 'Steamy',
  },
};

let lang = 'en';

export function setLang(code) {
  lang = String(code || '').toLowerCase().startsWith('tr') ? 'tr' : 'en';
  document.documentElement.lang = lang;
}

export function getLang() {
  return lang;
}

export function t(key, vars = {}) {
  let s = (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}

export function blobName(el, lv) {
  const key = `${el}-${lv}`;
  const base = NAMES[lang][key] || NAMES.en[key];
  if (base) return base;
  // Çizimi olmayan yüksek seviyeler: en üst ismin yanına seviye yazılır.
  return `${el} Lv${lv}`;
}

export function formatNum(n) {
  const v = Math.floor(n);
  const locale = lang === 'tr' ? 'tr-TR' : 'en-US';
  if (v < 10000) return v.toLocaleString(locale);
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(v);
}

export function formatDuration(ms) {
  const totalMin = Math.max(1, Math.round(ms / 60000));
  if (totalMin < 60) return t('minutes', { n: totalMin });
  const h = Math.round((totalMin / 60) * 10) / 10;
  return t('hours', { n: h.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US') });
}
