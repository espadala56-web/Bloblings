// Oyun durumu ve kuralları. Görselden bağımsızdır, bu yüzden test etmesi kolaydır.
// Not: Şimdilik cihazda (localStorage) saklanır. Supabase'e geçince
// enerji, altın ve birleştirmeler sunucuda doğrulanacak.

import { CFG, ELEMENTS, FED_BY, rateOf } from './config.js';

const KEY = 'bloblings:v1';
const VERSION = 2;

function freshState(now) {
  const board = new Array(CFG.cols * CFG.rows).fill(null);
  // İlk açılışta hemen birleştirilebilecek bir çift: oyuncu ilk 5 saniyede ne yapacağını görsün.
  board[5] = { el: 'fire', lv: 1 };
  board[6] = { el: 'fire', lv: 1 };
  board[10] = { el: 'water', lv: 1 };
  return {
    v: VERSION,
    board,
    slotsOpen: CFG.startOpen,
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

// Eski kayıtları yeni sürüme taşır. Oyuncunun ilerlemesi kaybolmaz.
export function migrate(s) {
  if (!s || !Array.isArray(s.board)) return null;
  if (s.v === 1) {
    // v1: 4x4 tahta. v2: 4x5 tahta, son sıra kilitli.
    while (s.board.length < CFG.cols * CFG.rows) s.board.push(null);
    s.slotsOpen = CFG.startOpen;
    s.v = 2;
  }
  if (s.v !== VERSION) return null;
  if (typeof s.eggQuality !== 'number') s.eggQuality = 0;
  if (!s.stats) s.stats = { merges: 0, eggs: 0 };
  return s;
}

function readStorage() {
  try {
    const raw = globalThis.localStorage && globalThis.localStorage.getItem(KEY);
    if (!raw) return null;
    return migrate(JSON.parse(raw));
  } catch (e) {
    return null;
  }
}

export class Store extends EventTarget {
  constructor(now = Date.now(), initial = undefined) {
    super();
    this.s = (initial && migrate(initial)) || readStorage() || freshState(now);
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

  nextEnergyIn(now = Date.now()) {
    if (this.s.energy >= CFG.energyCap) return 0;
    return Math.max(0, CFG.energyRegenMs - (now - this.s.energyAt));
  }

  // ---- Tahta geometrisi ----
  isOpen(i) {
    return i >= 0 && i < this.s.slotsOpen;
  }

  neighbors(i) {
    const c = i % CFG.cols;
    const r = Math.floor(i / CFG.cols);
    const out = [];
    if (c > 0) out.push(i - 1);
    if (c < CFG.cols - 1) out.push(i + 1);
    if (r > 0) out.push(i - CFG.cols);
    if (r < CFG.rows - 1) out.push(i + CFG.cols);
    return out;
  }

  // i'deki canavarı besleyen komşuların listesi.
  feedersOf(i) {
    const b = this.s.board[i];
    if (!b) return [];
    const want = FED_BY[b.el];
    return this.neighbors(i).filter((j) => {
      const n = this.s.board[j];
      return n && n.el === want;
    });
  }

  // Görsel köprüler için: [besleyen, beslenen] çiftleri.
  synergyLinks() {
    const links = [];
    this.s.board.forEach((b, i) => {
      if (!b) return;
      for (const j of this.feedersOf(i)) links.push([j, i]);
    });
    return links;
  }

  // ---- Altın ----
  blobRate(i) {
    const b = this.s.board[i];
    if (!b) return 0;
    return rateOf(b.lv) * (1 + CFG.synergyBonus * this.feedersOf(i).length);
  }

  goldRate() {
    let r = 0;
    for (let i = 0; i < this.s.board.length; i++) r += this.blobRate(i);
    return r;
  }

  tick(dtMs) {
    this.s.gold += (this.goldRate() * dtMs) / 1000;
  }

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

  // ---- Geliştirmeler ----
  nextSlotCost() {
    const k = this.s.slotsOpen - CFG.startOpen;
    return k < CFG.slotCosts.length ? CFG.slotCosts[k] : null;
  }

  unlockSlot() {
    const cost = this.nextSlotCost();
    if (cost === null) return { error: 'max' };
    if (this.s.gold < cost) return { error: 'gold', need: Math.ceil(cost - this.s.gold) };
    this.s.gold -= cost;
    const cell = this.s.slotsOpen;
    this.s.slotsOpen += 1;
    this.emit('change');
    return { cell, cost };
  }

  nextEggCost() {
    const q = this.s.eggQuality;
    return q < CFG.eggCosts.length ? CFG.eggCosts[q] : null;
  }

  upgradeEgg() {
    const cost = this.nextEggCost();
    if (cost === null) return { error: 'max' };
    if (this.s.gold < cost) return { error: 'gold', need: Math.ceil(cost - this.s.gold) };
    this.s.gold -= cost;
    this.s.eggQuality += 1;
    this.emit('change');
    return { level: this.s.eggQuality + 1, cost };
  }

  canAffordUpgrade() {
    const a = this.nextSlotCost();
    const b = this.nextEggCost();
    return (a !== null && this.s.gold >= a) || (b !== null && this.s.gold >= b);
  }

  // ---- Tahta ----
  emptyCells() {
    const out = [];
    for (let i = 0; i < this.s.slotsOpen; i++) if (!this.s.board[i]) out.push(i);
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

  markDiscovered(blob) {
    const key = `${blob.el}-${blob.lv}`;
    const isNew = !this.s.discovered[key];
    this.s.discovered[key] = true;
    return isNew;
  }

  // Sürükle-bırak sonucunu uygular: taşı, yer değiştir ya da birleştir.
  drop(from, to) {
    const board = this.s.board;
    if (from === to || !this.isOpen(to) || !board[from]) return { type: 'none' };
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
      const discovered = this.markDiscovered(merged);
      this.emit('change');
      return { type: 'merge', blob: merged, discovered };
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
    const discovered = this.markDiscovered(blob);
    this.emit('change');
    return { cell, blob, discovered };
  }
}
