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

export const ELEMENTS = ['fire', 'water', 'forest'];

// Her element için çizilmiş en yüksek seviye.
// Daha yüksek seviyeler şimdilik en üst çizimi kullanır.
export const ART = { fire: 5, water: 5, forest: 5 };

// Element zinciri: Su ormanı, orman ateşi, ateş de suyu besler.
// FED_BY[x] = x'i besleyen element.
export const FED_BY = { forest: 'water', fire: 'forest', water: 'fire' };

export const ELEMENT_COLOR = { fire: 0xff7a45, water: 0x4fb6ff, forest: 0x5fcf6a };

export function rateOf(lv) {
  return CFG.baseRate * Math.pow(CFG.rateMult, lv - 1);
}

export function artKey(el, lv) {
  return `${el}-${Math.min(lv, ART[el])}`;
}
