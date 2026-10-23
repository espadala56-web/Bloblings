// Ekonomi ve oyun ayarları. Dengelemeyi buradan yaparız.

export const CFG = {
  cols: 4,
  rows: 4,

  energyCap: 30,
  energyRegenMs: 5 * 60 * 1000, // 5 dakikada 1 enerji
  eggCost: 1,

  baseRate: 1, // Lv1 canavarın saniyelik altın üretimi
  rateMult: 2.3, // her seviyede üretim çarpanı (2'den büyük olmalı)

  offlineCapMs: 8 * 60 * 60 * 1000, // en fazla 8 saatlik çevrimdışı birikim
  offlineMinMs: 60 * 1000, // 1 dakikadan kısa yokluklarda karşılama penceresi çıkmaz

  saveEveryMs: 5000,
  startCrystals: 50,
};

export const ELEMENTS = ['fire', 'water', 'forest'];

// Her element için çizilmiş en yüksek seviye.
// Daha yüksek seviyeler şimdilik en üst çizimi kullanır.
export const ART = { fire: 4, water: 4, forest: 3 };

export function rateOf(lv) {
  return CFG.baseRate * Math.pow(CFG.rateMult, lv - 1);
}

export function artKey(el, lv) {
  return `${el}-${Math.min(lv, ART[el])}`;
}
