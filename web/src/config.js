// Ekonomi ve oyun ayarları. Dengelemeyi buradan yaparız.

export const CFG = {
  cols: 4,
  rows: 5,
  startOpen: 16, // ilk 16 yuva açık, son sıradaki 4 yuva altınla açılır

  energyCap: 30,
  energyRegenMs: 5 * 60 * 1000, // 5 dakikada 1 enerji
  eggCost: 1,

  baseRate: 1, // Lv1 canavarın saniyelik altın üretimi
  rateMult: 2.3, // her seviyede üretim çarpanı (2'den büyük olmalı)
  synergyBonus: 0.25, // her "besleyen" komşu için +%25 gelir

  slotCosts: [400, 1500, 6000, 24000], // kilitli yuvaların sırayla açılış fiyatı
  eggCosts: [1200, 10000, 80000, 640000, 5120000], // yumurta kalitesi yükseltmeleri

  offlineCapMs: 8 * 60 * 60 * 1000, // en fazla 8 saatlik çevrimdışı birikim
  offlineMinMs: 60 * 1000, // 1 dakikadan kısa yokluklarda karşılama penceresi çıkmaz

  saveEveryMs: 5000,
  startCrystals: 50,

  // Reklam karşılığı enerji: günde en fazla 3 kez, her seferinde +10
  adEnergyAmount: 10,
  adEnergyPerDay: 3,
  // Kristalle enerji: kristallerin ilk kullanım alanı (ileride Stars ile kristal satılacak)
  crystalEnergyCost: 20,
  crystalEnergyAmount: 10,

  // Hediye yumurtası: davet eden ve davet edilen arkadaşa
  giftCrystals: 20, // arkadaş hediyesiyle gelen ek kristal
  referralMerges: 10, // davet edilen bu kadar birleştirme yapınca davet edene hediye gider
  channelReward: 10, // Telegram kanalına ilk katılışta bir kez verilen kristal

  // Satış ve Sihirli İksir
  sellSeconds: 30, // bir canavar satılınca kaç saniyelik üretimi kadar altın verir
  sellMin: 10,
  adPotionPerDay: 5, // reklamla günde en fazla kaç iksir

  // Şans çarkı: günde 1 bedava, reklamla en fazla 5 ekstra
  wheelAdPerDay: 5,
  // Dilimler (sırası çarktaki yerleriyle aynı). w: ağırlık
  wheel: [
    { goldSec: 300, min: 300, w: 22 },
    { crystals: 5, w: 18 },
    { energy: 10, w: 16 },
    { goldSec: 1200, min: 1500, w: 12 },
    { potion: 1, w: 12 },
    { crystals: 20, w: 8 },
    { energy: 25, w: 8 },
    { rareEgg: true, w: 4 },
  ],

  // Günlük görevler: her gün bu havuzdan 3 farklı tür seçilir
  quests: [
    { k: 'merges', n: 10, r: 10 },
    { k: 'merges', n: 25, r: 20 },
    { k: 'eggs', n: 8, r: 10 },
    { k: 'eggs', n: 20, r: 20 },
    { k: 'spins', n: 1, r: 10 },
    { k: 'sells', n: 2, r: 10 },
    { k: 'discover', n: 1, r: 15 },
    { k: 'potions', n: 1, r: 15 },
  ],
  questBonusCrystals: 10, // üç görev de bitince: +1 iksir ve bu kadar kristal

  // Günlük giriş: 20 saatte bir alınabilir, 48 saat geçerse seri sıfırlanır
  dailyMinGapMs: 20 * 60 * 60 * 1000,
  dailyResetMs: 48 * 60 * 60 * 1000,
  // gold: saniyelik gelirin kaç saniyelik karşılığı (en az 300)
  dailyRewards: [
    { energy: 10 },
    { goldSec: 600 },
    { crystals: 20 },
    { energy: 20 },
    { goldSec: 1800 },
    { crystals: 40 },
    { rareEgg: true },
  ],
};

export const ELEMENTS = ['fire', 'water', 'forest']; // yumurtadan çıkan temel elementler

// Gizli karışımlar: iki farklı temel elementin Lv3 canavarı birleşince doğar.
export const HYBRIDS = { steam: ['fire', 'water'], lotus: ['water', 'forest'], autumn: ['forest', 'fire'] };
export const HYBRID_LIST = Object.keys(HYBRIDS);
export const RECIPE_LV = 3; // tarif bu seviyedeki iki canavarla çalışır
export const HYBRID_START = RECIPE_LV + 1; // karışım bu seviyede doğar
export const HYBRID_MULT = 1.5; // karışımlar %50 daha fazla altın üretir

// Parlak (altın) canavarlar
export const SHINY_CHANCE = 0.03; // yumurtadan parlak çıkma ihtimali
export const SHINY_CHANCE_RARE = 0.1; // nadir/hediye yumurtada
export const SHINY_MULT = 2;

// Dost canavarlar: sadece arkadaş davetiyle gelir (1., 3. ve 5. arkadaşta).
export const PALS = ['pal1', 'pal2', 'pal3'];
export const PAL_AT = { 1: 'pal1', 3: 'pal2', 5: 'pal3' };
export const PAL_NEED = { pal1: 1, pal2: 3, pal3: 5 };
export const PAL_MULT = 2; // dost canavarlar 2 kat altın üretir

// Her element için çizilmiş aşama sayısı. Karışımların 3 aşaması var (Lv4, Lv5, Lv6+).
export const ART = { fire: 10, water: 10, forest: 10, steam: 3, lotus: 3, autumn: 3, pal1: 1, pal2: 1, pal3: 1 };

export function isPal(el) {
  return PALS.includes(el);
}

export function isHybrid(el) {
  return Object.prototype.hasOwnProperty.call(HYBRIDS, el);
}

// İki temel elementten hangi karışım doğar (yoksa null).
export function hybridOf(a, b) {
  if (a === b) return null;
  for (const [h, [x, y]] of Object.entries(HYBRIDS)) {
    if ((a === x && b === y) || (a === y && b === x)) return h;
  }
  return null;
}

// Albümde ve isimlerde: bir element için çizimi olan en yüksek seviye.
export function topLevel(el) {
  if (isPal(el)) return Infinity; // dost canavarların tek çizimi var, isimlerine +N eklenmez
  return isHybrid(el) ? HYBRID_START + ART[el] - 1 : ART[el] || 1;
}

// Element zinciri: Su ormanı, orman ateşi, ateş de suyu besler.
// Karışımları iki ebeveyni de besler. FED_BY[x] = x'i besleyen elementler.
export const FED_BY = {
  forest: ['water'],
  fire: ['forest'],
  water: ['fire'],
  steam: ['fire', 'water'],
  lotus: ['water', 'forest'],
  autumn: ['forest', 'fire'],
};

export const ELEMENT_COLOR = { fire: 0xff7a45, water: 0x4fb6ff, forest: 0x5fcf6a, steam: 0xb49bff, lotus: 0x3cc8b4, autumn: 0xff9f43, pal1: 0xff6fb5, pal2: 0xffc93c, pal3: 0x8fe0ff };

export function rateOf(lv) {
  return CFG.baseRate * Math.pow(CFG.rateMult, lv - 1);
}

export function artKey(el, lv) {
  if (isPal(el)) return `${el}-1`;
  if (isHybrid(el)) return `${el}-${Math.max(1, Math.min(lv - HYBRID_START + 1, ART[el]))}`;
  return `${el}-${Math.max(1, Math.min(lv, ART[el] || 1))}`;
}
