// Oyun durumu ve kuralları. Görselden bağımsızdır, bu yüzden test etmesi kolaydır.
// Not: Şimdilik cihazda (localStorage) saklanır. Supabase'e geçince
// enerji, altın ve birleştirmeler sunucuda doğrulanacak.

import { CFG, ELEMENTS, rateOf } from './config.js';

const KEY = 'bloblings:v1';

function freshState(now) {
  const board = new Array(CFG.cols * CFG.rows).fill(null);
  // İlk açılışta hemen birleştirilebilecek bir çift: oyuncu ilk 5 saniyede ne yapacağını görsün.
  board[5] = { el: 'fire', lv: 1 };
  board[6] = { el: 'fire', lv: 1 };
  board[10] = { el: 'water', lv: 1 };
  return {
    v: 1,
    board,
    energy: CFG.energyCap,
    energyAt: now,
    gold: 0,
    crystals: CFG.startCrystals,
    eggQuality: 0,
    lastSeen: now,
    discovered: { 'fire-1': true, 'water-1': true },
    stats: { merges: 0, eggs: 0 },
  };
}

function readStorage() {
  try {
    const raw = globalThis.localStorage && globalThis.localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.v !== 1 || !Array.isArray(s.board)) return null;
    return s;
  } catch (e) {
    return null;
  }
}

export class Store extends EventTarget {
  constructor(now = Date.now(), initial = undefined) {
    super();
    this.s = initial || readStorage() || freshState(now);
    this.syncEnergy(now);
    this.lastSaveAt = now;
  }

  emit(type, detail = {}) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  save(now = Date.now()) {
    this.s.lastSeen = now;
    this.lastSaveAt = now;
    try {
      if (globalThis.localStorage) globalThis.localStorage.setItem(KEY, JSON.stringify(this.s));
    } catch (e) {
      /* depolama kapalıysa oyun yine çalışır */
    }
  }

  // ---- Enerji ----
  syncEnergy(now = Date.now()) {
    const s = this.s;
    const R = CFG.energyRegenMs;
    if (s.energy >= CFG.energyCap) {
      s.energyAt = now;
      return;
    }
    const gained = Math.floor((now - s.energyAt) / R);
    if (gained > 0) {
      s.energy = Math.min(CFG.energyCap, s.energy + gained);
      s.energyAt += gained * R;
      if (s.energy >= CFG.energyCap) s.energyAt = now;
    }
  }

  // Bir sonraki enerjiye kalan süre (ms). Enerji doluysa 0.
  nextEnergyIn(now = Date.now()) {
    if (this.s.energy >= CFG.energyCap) return 0;
    return Math.max(0, CFG.energyRegenMs - (now - this.s.energyAt));
  }

  // ---- Altın ----
  goldRate() {
    let r = 0;
    for (const b of this.s.board) if (b) r += rateOf(b.lv);
    return r;
  }

  tick(dtMs) {
    this.s.gold += (this.goldRate() * dtMs) / 1000;
  }

  // Çevrimdışı kazanç raporu. Gösterildikten sonra collectOffline ile alınır.
  offlineReport(now = Date.now()) {
    const away = Math.max(0, now - this.s.lastSeen);
    if (away < CFG.offlineMinMs) return null;
    const ms = Math.min(away, CFG.offlineCapMs);
    const gold = Math.floor((this.goldRate() * ms) / 1000);
    if (gold <= 0) return null;
    return { ms, gold };
  }

  collectOffline(report, mult = 1) {
    if (!report) return 0;
    const amount = report.gold * mult;
    this.s.gold += amount;
    this.emit('change');
    return amount;
  }

  // ---- Tahta ----
  emptyCells() {
    const out = [];
    this.s.board.forEach((b, i) => {
      if (!b) out.push(i);
    });
    return out;
  }

  hasMergePair() {
    const seen = new Set();
    for (const b of this.s.board) {
      if (!b) continue;
      const k = `${b.el}-${b.lv}`;
      if (seen.has(k)) return true;
      seen.add(k);
    }
    return false;
  }

  canMerge(a, b) {
    const A = this.s.board[a];
    const B = this.s.board[b];
    return Boolean(a !== b && A && B && A.el === B.el && A.lv === B.lv);
  }

  // Sürükle-bırak sonucunu uygular: taşı, yer değiştir ya da birleştir.
  drop(from, to) {
    const board = this.s.board;
    if (from === to || to < 0 || to >= board.length || !board[from]) return { type: 'none' };
    const A = board[from];
    const B = board[to];
    if (!B) {
      board[to] = A;
      board[from] = null;
      this.emit('change');
      return { type: 'move' };
    }
    if (A.el === B.el && A.lv === B.lv) {
      const merged = { el: A.el, lv: A.lv + 1 };
      board[to] = merged;
      board[from] = null;
      this.s.stats.merges += 1;
      const key = `${merged.el}-${merged.lv}`;
      const isNew = !this.s.discovered[key];
      this.s.discovered[key] = true;
      this.emit('change');
      return { type: 'merge', blob: merged, discovered: isNew };
    }
    board[to] = A;
    board[from] = B;
    this.emit('change');
    return { type: 'swap' };
  }

  // Yumurta açar: 1 enerji harcar, rastgele boş bir yuvaya canavar koyar.
  openEgg(now = Date.now(), rnd = Math.random) {
    this.syncEnergy(now);
    if (this.s.energy < CFG.eggCost) return { error: 'energy' };
    const empty = this.emptyCells();
    if (empty.length === 0) return { error: 'full' };
    const wasFull = this.s.energy >= CFG.energyCap;
    this.s.energy -= CFG.eggCost;
    if (wasFull) this.s.energyAt = now; // dolum sayacı ilk harcamada başlar
    const cell = empty[Math.floor(rnd() * empty.length)];
    const el = ELEMENTS[Math.floor(rnd() * ELEMENTS.length)];
    const blob = { el, lv: 1 + this.s.eggQuality };
    this.s.board[cell] = blob;
    this.s.stats.eggs += 1;
    const key = `${el}-${blob.lv}`;
    const isNew = !this.s.discovered[key];
    this.s.discovered[key] = true;
    this.emit('change');
    return { cell, blob, discovered: isNew };
  }
}
