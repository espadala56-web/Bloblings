// OTOMATİK KOPYA: web/src/store.js dosyasını düzenle, sonra scripts/sync-rules.sh çalıştır.
// Oyun durumu ve kuralları. Görselden bağımsızdır.
// Aynı dosya hem telefonda hem sunucuda (Supabase Edge Function) çalışır:
// oyuncunun her hamlesi bir "eylem" olarak kaydedilir, sunucu bu eylemleri
// kendi saatiyle tekrar oynatır ve sonucu doğrular.

import { CFG, ELEMENTS, FED_BY, rateOf, hybridOf, isHybrid, isPal, RECIPE_LV, HYBRID_START, HYBRID_MULT, SHINY_CHANCE, SHINY_CHANCE_RARE, SHINY_MULT, PAL_AT, PAL_MULT } from './config.js';

const VERSION = 3;
let storageKey = 'bloblings:v1';
let timeOffset = 0;

export function setStorageKey(k) {
  storageKey = k;
}

// Sunucu saatiyle telefon saati arasındaki fark. Tüm hesaplar sunucu saatine göre yapılır.
export function setTimeOffset(ms) {
  timeOffset = ms;
}

export function clockNow() {
  return Date.now() + timeOffset;
}

// Deterministik rastgele sayı üreteci (mulberry32).
// Aynı tohum ve sayaçla telefonda ve sunucuda aynı yumurta çıkar.
export function rng(seed, n) {
  let a = (seed ^ Math.imul(n + 1, 0x9e3779b1)) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function newSeed() {
  return Math.floor(Math.random() * 4294967296) >>> 0;
}

export function freshState(now, seed = newSeed()) {
  const board = new Array(CFG.cols * CFG.rows).fill(null);
  // İlk açılışta hemen birleştirilebilecek bir çift: oyuncu ilk 5 saniyede ne yapacağını görsün.
  board[5] = { el: 'fire', lv: 1 };
  board[6] = { el: 'fire', lv: 1 };
  board[10] = { el: 'water', lv: 1 };
  return {
    v: VERSION,
    seed,
    seq: 0,
    clock: now,
    board,
    slotsOpen: CFG.startOpen,
    energy: CFG.energyCap,
    energyAt: now,
    gold: 0,
    crystals: CFG.startCrystals,
    eggQuality: 0,
    discovered: { 'fire-1': true, 'water-1': true },
    stats: { merges: 0, eggs: 0 },
    lastOffline: null,
    daily: { streak: 0, lastAt: 0 },
    ads: { day: '', energy: 0 },
    inbox: [], // sunucunun koyduğu hediyeler: { id, kind: 'invited' | 'friend', name }
    giftSeen: {}, // aynı hediye iki kez gelmesin
    flags: {}, // tek seferlik ödüller (ör. kanal)
    potions: 0, // Sihirli İksir: bir canavarı 1 seviye yükseltir
    wheel: { day: '', free: false, ads: 0 }, // şans çarkı: bugünkü bedava ve reklamlı çevirmeler
    quests: null, // günlük görevler (gün değişince yeniden seçilir)
    week: { id: '', earned: 0 }, // haftalık sıralama için bu hafta üretilen altın
  };
}

export function utcDay(now) {
  return new Date(now).toISOString().slice(0, 10);
}

// ISO hafta kimliği, ör. 2026-W43. Haftalık sıralama pazartesi 00:00 UTC'de sıfırlanır.
export function weekId(now) {
  const d = new Date(now);
  const dow = (d.getUTCDay() + 6) % 7; // pazartesi = 0
  const thu = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow + 3);
  const year = new Date(thu).getUTCFullYear();
  const jan4 = Date.UTC(year, 0, 4);
  const jan4dow = (new Date(jan4).getUTCDay() + 6) % 7;
  const week1Thu = jan4 - jan4dow * 86400000 + 3 * 86400000;
  const week = 1 + Math.round((thu - week1Thu) / (7 * 86400000));
  return `${year}-W${String(week).padStart(2, '0')}`;
}

// O günün görevleri: tohum ve güne göre her zaman aynı 3 görev seçilir.
export function questsFor(seed, day) {
  const dayNum = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86400000);
  const r = rng((seed ^ 0x51ed27) >>> 0, dayNum);
  const idx = CFG.quests.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const ids = [];
  const kinds = new Set();
  for (const i of idx) {
    if (kinds.has(CFG.quests[i].k)) continue;
    kinds.add(CFG.quests[i].k);
    ids.push(i);
    if (ids.length === 3) break;
  }
  return { day, ids, prog: {}, done: [false, false, false], bonus: false };
}

// Eski kayıtları yeni sürüme taşır. Oyuncunun ilerlemesi kaybolmaz.
export function migrate(s, now = clockNow()) {
  if (!s || typeof s !== 'object' || !Array.isArray(s.board)) return null;
  if (s.v === 1) {
    // v1: 4x4 tahta. v2: 4x5 tahta, son sıra kilitli.
    while (s.board.length < CFG.cols * CFG.rows) s.board.push(null);
    s.slotsOpen = CFG.startOpen;
    s.v = 2;
  }
  if (s.v === 2) {
    // v3: eylem günlüğü, deterministik yumurtalar, sunucu saati.
    s.clock = typeof s.lastSeen === 'number' ? s.lastSeen : now;
    delete s.lastSeen;
    s.seed = newSeed();
    s.seq = 0;
    s.lastOffline = null;
    s.v = 3;
  }
  if (s.v !== VERSION) return null;
  if (typeof s.eggQuality !== 'number') s.eggQuality = 0;
  if (!s.stats) s.stats = { merges: 0, eggs: 0 };
  if (!s.discovered) s.discovered = {};
  if (!s.daily) s.daily = { streak: 0, lastAt: 0 };
  if (!s.ads) s.ads = { day: '', energy: 0 };
  if (!Array.isArray(s.inbox)) s.inbox = [];
  if (!s.giftSeen || typeof s.giftSeen !== 'object') s.giftSeen = {};
  if (!s.flags || typeof s.flags !== 'object') s.flags = {};
  if (typeof s.potions !== 'number') s.potions = 0;
  if (!s.wheel || typeof s.wheel !== 'object') s.wheel = { day: '', free: false, ads: 0 };
  if (s.quests === undefined) s.quests = null;
  if (!s.week || typeof s.week !== 'object') s.week = { id: '', earned: 0 };
  return s;
}

function readStorage(now) {
  try {
    const raw = globalThis.localStorage && globalThis.localStorage.getItem(storageKey);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (obj && obj.state) {
      const state = migrate(obj.state, now);
      return state ? { state, pending: Array.isArray(obj.pending) ? obj.pending : [] } : null;
    }
    const state = migrate(obj, now); // eski biçim: doğrudan durum
    return state ? { state, pending: [] } : null;
  } catch (e) {
    return null;
  }
}

export class Store extends EventTarget {
  // persist: cihazda sakla (sunucuda false). record: eylemleri kaydet (sunucuda false).
  constructor({ now = clockNow(), initial = null, persist = true, record = true } = {}) {
    super();
    this.persist = persist;
    this.recording = record;
    this.pending = [];
    let state = initial ? migrate(initial, now) : null;
    if (!state && persist) {
      const saved = readStorage(now);
      if (saved) {
        state = saved.state;
        this.pending = saved.pending;
      }
    }
    this.s = state || freshState(now);
    this.lastSaveAt = now;
  }

  emit(type, detail = {}) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  save(now = clockNow()) {
    this.lastSaveAt = now;
    if (!this.persist) return;
    try {
      if (globalThis.localStorage) {
        globalThis.localStorage.setItem(storageKey, JSON.stringify({ state: this.s, pending: this.pending }));
      }
    } catch (e) {
      /* depolama kapalıysa oyun yine çalışır */
    }
  }

  record(action) {
    if (!this.recording) return;
    this.s.seq += 1;
    action.seq = this.s.seq;
    this.pending.push(action);
  }

  // Bir eylemi (telefondan gelen) kurallara göre uygular. Sunucu ve yeniden oynatma kullanır.
  apply(a) {
    const prev = this.recording;
    this.recording = false;
    let res;
    const t = Number(a && a.t);
    switch (a && a.type) {
      case 'drop':
        res = this.drop(Number(a.from) | 0, Number(a.to) | 0, t);
        break;
      case 'egg':
        res = this.openEgg(t);
        break;
      case 'unlock':
        res = this.unlockSlot(t);
        break;
      case 'upgradeEgg':
        res = this.upgradeEgg(t);
        break;
      case 'bonus':
        res = this.claimOfflineBonus(t);
        break;
      case 'daily':
        res = this.claimDaily(t);
        break;
      case 'adEnergy':
        res = this.adEnergy(t);
        break;
      case 'buyEnergy':
        res = this.buyEnergy(t);
        break;
      case 'gift':
        res = this.claimGift(String((a && a.id) || ''), t);
        break;
      case 'channel':
        res = this.joinChannel(t);
        break;
      case 'sell':
        res = this.sell(Number(a.from) | 0, t);
        break;
      case 'potion':
        res = this.usePotion(Number(a.from) | 0, t);
        break;
      case 'adPotion':
        res = this.adPotion(t);
        break;
      case 'spin':
        res = this.spin(t, false);
        break;
      case 'adSpin':
        res = this.spin(t, true);
        break;
      case 'quest':
        res = this.claimQuest(Number(a.from) | 0, t);
        break;
      case 'questBonus':
        res = this.claimQuestBonus(t);
        break;
      default:
        res = { error: 'unknown' };
    }
    this.recording = prev;
    if (a && typeof a.seq === 'number' && a.seq > this.s.seq) this.s.seq = a.seq;
    return res;
  }

  // Sunucudan gelen durumu benimser; henüz sunucuya ulaşmamış eylemleri üstüne tekrar uygular.
  adopt(serverState) {
    const state = migrate(serverState);
    if (!state) return false;
    const keep = this.pending.filter((a) => a.seq > state.seq);
    this.s = state;
    this.pending = [];
    for (const a of keep) this.apply(a);
    this.pending = keep;
    this.emit('change');
    return true;
  }

  // ---- Zaman: altın birikimi ve enerji ----

  // Durumu verilen ana kadar ilerletir. Uzun yokluklar en fazla 8 saat sayılır.
  advance(now = clockNow()) {
    const s = this.s;
    if (!Number.isFinite(now)) return 0;
    const dt = now - s.clock;
    if (dt <= 0) return 0;
    const credited = Math.min(dt, CFG.offlineCapMs);
    const gain = (this.goldRate() * credited) / 1000;
    s.gold += gain;
    s.clock = now;
    const wk = weekId(now);
    if (s.week.id !== wk) s.week = { id: wk, earned: 0 };
    s.week.earned += gain;
    this.syncEnergy(now);
    if (dt >= CFG.offlineMinMs) {
      s.lastOffline = { gold: Math.floor(gain), ms: credited, at: now, claimed: false };
    }
    return gain;
  }

  syncEnergy(now = clockNow()) {
    const s = this.s;
    const R = CFG.energyRegenMs;
    if (s.energy >= CFG.energyCap) {
      s.energyAt = Math.max(s.energyAt, now);
      return;
    }
    const gained = Math.floor((now - s.energyAt) / R);
    if (gained > 0) {
      s.energy = Math.min(CFG.energyCap, s.energy + gained);
      s.energyAt += gained * R;
      if (s.energy >= CFG.energyCap) s.energyAt = now;
    }
  }

  nextEnergyIn(now = clockNow()) {
    if (this.s.energy >= CFG.energyCap) return 0;
    return Math.max(0, CFG.energyRegenMs - (now - this.s.energyAt));
  }

  // Açılışta gösterilecek "sen yokken" raporu (taze ve alınmamışsa).
  offlineReport(now = clockNow()) {
    const lo = this.s.lastOffline;
    if (!lo || lo.claimed || lo.gold <= 0) return null;
    if (now - lo.at > 10 * 60 * 1000) return null;
    return { ms: lo.ms, gold: lo.gold };
  }

  // Reklam karşılığı çevrimdışı kazancı ikiye katlar (bir kez).
  // TODO(reklam): yayında Adsgram'ın sunucu bildirimiyle doğrulanacak.
  claimOfflineBonus(now = clockNow()) {
    const lo = this.s.lastOffline;
    if (!lo || lo.claimed || lo.gold <= 0) return { error: 'none' };
    lo.claimed = true;
    this.advance(now);
    this.s.gold += lo.gold;
    this.record({ type: 'bonus', t: now });
    this.emit('change');
    return { gold: lo.gold };
  }

  // ---- Günlük giriş ödülü ----
  dailyStatus(now = clockNow()) {
    const d = this.s.daily;
    const since = now - d.lastAt;
    const broken = d.lastAt > 0 && since > CFG.dailyResetMs;
    const streak = broken ? 0 : d.streak;
    const ready = d.lastAt === 0 || since >= CFG.dailyMinGapMs;
    return { ready, streak, nextDay: (streak % 7) + 1, nextIn: ready ? 0 : CFG.dailyMinGapMs - since };
  }

  claimDaily(now = clockNow()) {
    this.advance(now);
    const st = this.dailyStatus(now);
    if (!st.ready) return { error: 'wait', nextIn: st.nextIn };
    const day = st.nextDay;
    const r = CFG.dailyRewards[day - 1];
    const out = { day };
    if (r.energy) {
      this.syncEnergy(now);
      this.s.energy += r.energy;
      out.energy = r.energy;
    }
    if (r.crystals) {
      this.s.crystals += r.crystals;
      out.crystals = r.crystals;
    }
    if (r.goldSec) {
      const g = Math.max(300, Math.floor(this.goldRate() * r.goldSec));
      this.s.gold += g;
      out.gold = g;
    }
    if (r.rareEgg) {
      const h = this.hatch(2 + this.s.eggQuality, SHINY_CHANCE_RARE);
      if (h) Object.assign(out, h);
      else {
        this.s.crystals += 60; // tahta doluysa yumurta yerine kristal
        out.crystals = 60;
      }
    }
    this.s.daily = { streak: day, lastAt: now };
    this.record({ type: 'daily', t: now });
    this.emit('change');
    return out;
  }

  // Boş bir yuvaya tohuma göre bir canavar çıkarır (yumurta, nadir yumurta, hediye).
  // Sıra önemli: 1) yuva 2) element 3) parlak mı. Telefonda ve sunucuda aynı sonuç çıkar.
  hatch(lv, shinyChance) {
    const empty = this.emptyCells();
    if (empty.length === 0) return null;
    const r = rng(this.s.seed, this.s.stats.eggs);
    const cell = empty[Math.floor(r() * empty.length)];
    const el = ELEMENTS[Math.floor(r() * ELEMENTS.length)];
    const blob = { el, lv };
    if (r() < shinyChance) blob.shiny = true;
    this.s.board[cell] = blob;
    this.s.stats.eggs += 1;
    const d = this.markDiscovered(blob);
    return { cell, blob, discovered: d.isNew, shinyNew: d.shinyNew };
  }

  // ---- Hediye kutusu (arkadaş daveti) ----
  claimGift(id, now = clockNow()) {
    this.advance(now);
    const i = this.s.inbox.findIndex((g) => g && g.id === id);
    if (i < 0) return { error: 'none' };
    const g = this.s.inbox[i];
    // 1., 3. ve 5. arkadaşta yumurta yerine o arkadaşa özel bir dost canavar gelir (tahtada yer gerekir).
    const pal = g.kind === 'friend' ? PAL_AT[(this.s.stats.friends || 0) + 1] : null;
    const empty = this.emptyCells();
    if (pal && empty.length === 0) return { error: 'full' };
    this.s.inbox.splice(i, 1);
    const out = { kind: g.kind, name: g.name || '' };
    let h = null;
    if (pal) {
      const r = rng(this.s.seed, this.s.stats.eggs);
      const cell = empty[Math.floor(r() * empty.length)];
      const blob = { el: pal, lv: 3 + this.s.eggQuality };
      this.s.board[cell] = blob;
      this.s.stats.eggs += 1;
      const d = this.markDiscovered(blob);
      h = { cell, blob, discovered: d.isNew, shinyNew: false, pal: true };
    } else {
      h = this.hatch(2 + this.s.eggQuality, SHINY_CHANCE_RARE);
    }
    if (h) Object.assign(out, h);
    let crystals = h ? 0 : 60;
    if (g.kind === 'friend') {
      crystals += CFG.giftCrystals;
      this.s.stats.friends = (this.s.stats.friends || 0) + 1;
    }
    if (crystals) {
      this.s.crystals += crystals;
      out.crystals = crystals;
    }
    this.record({ type: 'gift', id, t: now });
    this.emit('change');
    return out;
  }

  // ---- Satış ve Sihirli İksir ----
  sellValue(i) {
    const b = this.s.board[i];
    if (!b) return 0;
    let r = rateOf(b.lv);
    if (isHybrid(b.el)) r *= HYBRID_MULT;
    if (isPal(b.el)) r *= PAL_MULT;
    if (b.shiny) r *= SHINY_MULT;
    return Math.max(CFG.sellMin, Math.floor(r * CFG.sellSeconds));
  }

  sell(cell, now = clockNow()) {
    if (!this.isOpen(cell) || !this.s.board[cell]) return { error: 'none' };
    this.advance(now);
    const gold = this.sellValue(cell);
    const blob = this.s.board[cell];
    this.s.board[cell] = null;
    this.s.gold += gold;
    this.bump('sells');
    this.record({ type: 'sell', from: cell, t: now });
    this.emit('change');
    return { gold, blob };
  }

  usePotion(cell, now = clockNow()) {
    if (!this.isOpen(cell) || !this.s.board[cell]) return { error: 'none' };
    if (this.s.potions <= 0) return { error: 'potions' };
    this.advance(now);
    const b = this.s.board[cell];
    const blob = { ...b, lv: b.lv + 1 };
    this.s.board[cell] = blob;
    this.s.potions -= 1;
    const d = this.markDiscovered(blob);
    this.bump('potions');
    this.record({ type: 'potion', from: cell, t: now });
    this.emit('change');
    return { cell, blob, discovered: d.isNew, shinyNew: d.shinyNew };
  }

  // TODO(reklam): yayında Adsgram'ın sunucu bildirimiyle doğrulanacak.
  adPotionLeft(now = clockNow()) {
    const a = this.s.ads;
    return a.day === utcDay(now) ? Math.max(0, CFG.adPotionPerDay - (a.potion || 0)) : CFG.adPotionPerDay;
  }

  adPotion(now = clockNow()) {
    this.advance(now);
    const day = utcDay(now);
    if (this.s.ads.day !== day) this.s.ads = { day, energy: 0 };
    if ((this.s.ads.potion || 0) >= CFG.adPotionPerDay) return { error: 'limit' };
    this.s.ads.potion = (this.s.ads.potion || 0) + 1;
    this.s.potions += 1;
    this.record({ type: 'adPotion', t: now });
    this.emit('change');
    return { potions: this.s.potions };
  }

  // Tahta dolu ve hiçbir birleştirme yapılamıyor mu?
  isLocked() {
    if (this.emptyCells().length > 0) return false;
    const blobs = this.s.board.slice(0, this.s.slotsOpen);
    for (let i = 0; i < blobs.length; i++) {
      for (let j = i + 1; j < blobs.length; j++) if (this.combineType(blobs[i], blobs[j])) return false;
    }
    return true;
  }

  // ---- Şans çarkı ----
  wheelStatus(now = clockNow()) {
    const w = this.s.wheel;
    const today = w.day === utcDay(now);
    return { free: !(today && w.free), adsLeft: today ? Math.max(0, CFG.wheelAdPerDay - w.ads) : CFG.wheelAdPerDay };
  }

  // Hangi dilime düşeceği tohumdan belirlenir; telefon ve sunucu aynı sonucu bulur.
  spin(now = clockNow(), viaAd = false) {
    this.advance(now);
    const day = utcDay(now);
    if (this.s.wheel.day !== day) this.s.wheel = { day, free: false, ads: 0 };
    const w = this.s.wheel;
    if (viaAd) {
      if (w.ads >= CFG.wheelAdPerDay) return { error: 'limit' };
      w.ads += 1;
    } else {
      if (w.free) return { error: 'used' };
      w.free = true;
    }
    const spins = this.s.stats.spins || 0;
    const r = rng((this.s.seed ^ 0x9e3779b9) >>> 0, spins);
    const total = CFG.wheel.reduce((a, p) => a + p.w, 0);
    let x = r() * total;
    let slot = 0;
    for (; slot < CFG.wheel.length - 1; slot++) {
      x -= CFG.wheel[slot].w;
      if (x < 0) break;
    }
    this.s.stats.spins = spins + 1;
    const p = CFG.wheel[slot];
    const out = { slot };
    if (p.goldSec) {
      out.gold = Math.max(p.min, Math.floor(this.goldRate() * p.goldSec));
      this.s.gold += out.gold;
    }
    if (p.crystals) {
      this.s.crystals += p.crystals;
      out.crystals = p.crystals;
    }
    if (p.energy) {
      this.syncEnergy(now);
      this.s.energy += p.energy;
      out.energy = p.energy;
    }
    if (p.potion) {
      this.s.potions += p.potion;
      out.potion = p.potion;
    }
    if (p.rareEgg) {
      const h = this.hatch(2 + this.s.eggQuality, SHINY_CHANCE_RARE);
      if (h) Object.assign(out, h);
      else {
        this.s.crystals += 30;
        out.crystals = 30;
      }
    }
    this.bump('spins');
    this.record({ type: viaAd ? 'adSpin' : 'spin', t: now });
    this.emit('change');
    return out;
  }

  // ---- Günlük görevler ----
  // Ekranda göstermek için (durumu değiştirmez).
  questState(now = clockNow()) {
    const day = utcDay(now);
    const q = this.s.quests && this.s.quests.day === day ? this.s.quests : questsFor(this.s.seed, day);
    return q.ids.map((id, i) => {
      const def = CFG.quests[id];
      return { i, k: def.k, n: def.n, r: def.r, have: Math.min(def.n, q.prog[def.k] || 0), done: q.done[i] };
    });
  }

  questBonusReady(now = clockNow()) {
    const day = utcDay(now);
    const q = this.s.quests;
    return Boolean(q && q.day === day && q.done.every(Boolean) && !q.bonus);
  }

  ensureQuests(day) {
    if (!this.s.quests || this.s.quests.day !== day) this.s.quests = questsFor(this.s.seed, day);
    return this.s.quests;
  }

  // Bir görev sayacını artırır (oyunun saatine göre o günün görevleri).
  bump(k) {
    const q = this.ensureQuests(utcDay(this.s.clock));
    q.prog[k] = (q.prog[k] || 0) + 1;
  }

  claimQuest(i, now = clockNow()) {
    this.advance(now);
    const q = this.ensureQuests(utcDay(now));
    if (!(i >= 0 && i < q.ids.length) || q.done[i]) return { error: 'none' };
    const def = CFG.quests[q.ids[i]];
    if ((q.prog[def.k] || 0) < def.n) return { error: 'progress' };
    q.done[i] = true;
    this.s.crystals += def.r;
    this.record({ type: 'quest', from: i, t: now });
    this.emit('change');
    return { crystals: def.r };
  }

  claimQuestBonus(now = clockNow()) {
    this.advance(now);
    const q = this.ensureQuests(utcDay(now));
    if (!q.done.every(Boolean) || q.bonus) return { error: 'none' };
    q.bonus = true;
    this.s.potions += 1;
    this.s.crystals += CFG.questBonusCrystals;
    this.record({ type: 'questBonus', t: now });
    this.emit('change');
    return { potion: 1, crystals: CFG.questBonusCrystals };
  }

  // ---- Telegram kanalı: ilk katılışta bir kez kristal ----
  // Not: katılım Telegram'dan doğrulanmaz (bot anahtarı gerektirir); ödül küçük ve tek seferlik.
  joinChannel(now = clockNow()) {
    this.advance(now);
    if (this.s.flags.channel) return { error: 'done' };
    this.s.flags.channel = true;
    this.s.crystals += CFG.channelReward;
    this.record({ type: 'channel', t: now });
    this.emit('change');
    return { crystals: CFG.channelReward };
  }

  // ---- Reklam karşılığı enerji ----
  // TODO(reklam): yayında Adsgram'ın sunucu bildirimiyle doğrulanacak.
  adEnergyLeft(now = clockNow()) {
    const a = this.s.ads;
    return a.day === utcDay(now) ? Math.max(0, CFG.adEnergyPerDay - a.energy) : CFG.adEnergyPerDay;
  }

  adEnergy(now = clockNow()) {
    this.advance(now);
    const day = utcDay(now);
    if (this.s.ads.day !== day) this.s.ads = { day, energy: 0 };
    if (this.s.ads.energy >= CFG.adEnergyPerDay) return { error: 'limit' };
    this.syncEnergy(now);
    this.s.energy += CFG.adEnergyAmount;
    this.s.ads.energy += 1;
    this.record({ type: 'adEnergy', t: now });
    this.emit('change');
    return { energy: CFG.adEnergyAmount, left: CFG.adEnergyPerDay - this.s.ads.energy };
  }

  // Kristalle enerji satın alma.
  buyEnergy(now = clockNow()) {
    this.advance(now);
    const cost = CFG.crystalEnergyCost;
    if (this.s.crystals < cost) return { error: 'crystals', need: cost - this.s.crystals };
    this.syncEnergy(now);
    this.s.crystals -= cost;
    this.s.energy += CFG.crystalEnergyAmount;
    this.record({ type: 'buyEnergy', t: now });
    this.emit('change');
    return { energy: CFG.crystalEnergyAmount, cost };
  }

  // ---- Tahta geometrisi ve element zinciri ----
  isOpen(i) {
    return Number.isInteger(i) && i >= 0 && i < this.s.slotsOpen;
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

  feedersOf(i) {
    const b = this.s.board[i];
    if (!b) return [];
    const want = FED_BY[b.el] || [];
    return this.neighbors(i).filter((j) => {
      const n = this.s.board[j];
      return n && want.includes(n.el);
    });
  }

  synergyLinks() {
    const links = [];
    this.s.board.forEach((b, i) => {
      if (!b) return;
      for (const j of this.feedersOf(i)) links.push([j, i]);
    });
    return links;
  }

  blobRate(i) {
    const b = this.s.board[i];
    if (!b) return 0;
    let r = rateOf(b.lv) * (1 + CFG.synergyBonus * this.feedersOf(i).length);
    if (isHybrid(b.el)) r *= HYBRID_MULT;
    if (isPal(b.el)) r *= PAL_MULT;
    if (b.shiny) r *= SHINY_MULT;
    return r;
  }

  goldRate() {
    let r = 0;
    for (let i = 0; i < this.s.board.length; i++) r += this.blobRate(i);
    return r;
  }

  // ---- Geliştirmeler ----
  nextSlotCost() {
    const k = this.s.slotsOpen - CFG.startOpen;
    return k < CFG.slotCosts.length ? CFG.slotCosts[k] : null;
  }

  unlockSlot(now = clockNow()) {
    this.advance(now);
    const cost = this.nextSlotCost();
    if (cost === null) return { error: 'max' };
    if (this.s.gold < cost) return { error: 'gold', need: Math.ceil(cost - this.s.gold) };
    this.s.gold -= cost;
    const cell = this.s.slotsOpen;
    this.s.slotsOpen += 1;
    this.record({ type: 'unlock', t: now });
    this.emit('change');
    return { cell, cost };
  }

  nextEggCost() {
    const q = this.s.eggQuality;
    return q < CFG.eggCosts.length ? CFG.eggCosts[q] : null;
  }

  upgradeEgg(now = clockNow()) {
    this.advance(now);
    const cost = this.nextEggCost();
    if (cost === null) return { error: 'max' };
    if (this.s.gold < cost) return { error: 'gold', need: Math.ceil(cost - this.s.gold) };
    this.s.gold -= cost;
    this.s.eggQuality += 1;
    this.record({ type: 'upgradeEgg', t: now });
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

  // İki canavar bir araya gelince ne olur: 'merge' (aynı), 'recipe' (gizli karışım) ya da null.
  combineType(A, B) {
    if (!A || !B) return null;
    if (A.el === B.el && A.lv === B.lv) return 'merge';
    if (A.lv === RECIPE_LV && B.lv === RECIPE_LV && hybridOf(A.el, B.el)) return 'recipe';
    return null;
  }

  canMerge(a, b) {
    return a !== b && this.combineType(this.s.board[a], this.s.board[b]) === 'merge';
  }

  // Bu tarif daha önce keşfedildi mi (keşfedilmemiş tarifler tahtada ipucu olarak parlamaz).
  knowsRecipe(a, b) {
    const A = this.s.board[a];
    const B = this.s.board[b];
    if (a === b || this.combineType(A, B) !== 'recipe') return false;
    return Boolean(this.s.discovered[`${hybridOf(A.el, B.el)}-${HYBRID_START}`]);
  }

  markDiscovered(blob) {
    const key = `${blob.el}-${blob.lv}`;
    const isNew = !this.s.discovered[key];
    this.s.discovered[key] = true;
    if (isNew) this.bump('discover');
    let shinyNew = false;
    if (blob.shiny) {
      shinyNew = !this.s.discovered[`${key}*`];
      this.s.discovered[`${key}*`] = true;
    }
    return { isNew, shinyNew };
  }

  // Sürükle-bırak: taşı, yer değiştir ya da birleştir.
  drop(from, to, now = clockNow()) {
    const board = this.s.board;
    if (from === to || !this.isOpen(from) || !this.isOpen(to) || !board[from]) return { type: 'none' };
    this.advance(now);
    const A = board[from];
    const B = board[to];
    let res;
    if (!B) {
      board[to] = A;
      board[from] = null;
      res = { type: 'move' };
    } else if (this.combineType(A, B)) {
      const recipe = this.combineType(A, B) === 'recipe';
      const merged = recipe ? { el: hybridOf(A.el, B.el), lv: HYBRID_START } : { el: A.el, lv: A.lv + 1 };
      if (A.shiny || B.shiny) merged.shiny = true; // parlaklık birleşince kaybolmaz
      board[to] = merged;
      board[from] = null;
      this.s.stats.merges += 1;
      this.bump('merges');
      if (recipe) this.s.stats.recipes = (this.s.stats.recipes || 0) + 1;
      const d = this.markDiscovered(merged);
      res = { type: 'merge', blob: merged, discovered: d.isNew, shinyNew: d.shinyNew, recipe, parents: recipe ? [A.el, B.el] : undefined };
    } else {
      board[to] = A;
      board[from] = B;
      res = { type: 'swap' };
    }
    this.record({ type: 'drop', from, to, t: now });
    this.emit('change');
    return res;
  }

  // Yumurta açar: 1 enerji harcar. Nereye ve hangi elementin çıkacağı tohumdan belirlenir.
  openEgg(now = clockNow()) {
    this.advance(now);
    this.syncEnergy(now);
    if (this.s.energy < CFG.eggCost) return { error: 'energy' };
    const empty = this.emptyCells();
    if (empty.length === 0) return { error: 'full' };
    const wasFull = this.s.energy >= CFG.energyCap;
    this.s.energy -= CFG.eggCost;
    if (wasFull) this.s.energyAt = now; // dolum sayacı ilk harcamada başlar
    const res = this.hatch(1 + this.s.eggQuality, SHINY_CHANCE);
    this.bump('eggs');
    this.record({ type: 'egg', t: now });
    this.emit('change');
    return res;
  }
}
