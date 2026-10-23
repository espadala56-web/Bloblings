import assert from 'node:assert/strict';
import { Store, migrate, rng } from '../web/src/store.js';
import { replay, loadOnServer, newPlayerState } from '../web/src/sync.js';
import { CFG, rateOf } from '../web/src/config.js';

const t0 = 1_700_000_000_000;
const clone = (x) => JSON.parse(JSON.stringify(x));
const mk = (state, opts = {}) => new Store({ now: t0, initial: clone(state), persist: false, ...opts });

// 1) Temel kurallar
const base = newPlayerState(t0, 12345);
let st = mk(base);
assert.equal(st.s.board.length, 20);
assert.equal(st.goldRate(), 3.25);
let r = st.drop(5, 6, t0 + 1000);
assert.equal(r.type, 'merge'); assert.equal(r.discovered, true);
assert.equal(st.pending.length, 1); assert.equal(st.pending[0].seq, 1);
assert.equal(st.drop(6, 18, t0 + 1100).type, 'none'); // kilitli yuva
assert.equal(st.pending.length, 1); // reddedilen eylem kaydedilmez

// 2) Deterministik yumurta: aynı tohum, aynı sonuç
const a = mk(base), b = mk(base);
const ea = a.openEgg(t0 + 500), eb = b.openEgg(t0 + 500);
assert.deepEqual(ea, eb);
const c = mk({ ...base, seed: 999 });
const outs = new Set(); for (let i = 0; i < 8; i++) outs.add(JSON.stringify(c.openEgg(t0 + 600 + i).blob.el));
assert.ok(outs.size >= 2, 'yumurtalar çeşitli olmalı');

// 3) Telefon ve sunucu aynı sonuca varır
const client = mk(base);
client.drop(5, 6, t0 + 1000);
for (let i = 0; i < 6; i++) client.openEgg(t0 + 2000 + i * 300);
client.drop(0, 1, t0 + 5000); client.drop(1, 2, t0 + 5100);
client.advance(t0 + 60_000 - 1);
client.s.gold += 0; // no-op
const srv = replay(clone(base), clone(client.pending), t0 + 70_000, t0 + 60_000 - 1);
assert.deepEqual(srv.state.board, client.s.board);
assert.equal(srv.state.energy, client.s.energy);
assert.equal(srv.state.seq, client.s.seq);
assert.ok(Math.abs(srv.state.gold - client.s.gold) < 1e-6, `altın ${srv.state.gold} vs ${client.s.gold}`);
assert.equal(srv.rejected, 0);

// 4) Hile denemeleri reddedilir
const cheat = [
  { seq: 1, type: 'unlock', t: t0 + 1000 },            // altın yok
  { seq: 2, type: 'drop', from: 5, to: 19, t: t0 + 2000 }, // kilitli yuva
  { seq: 3, type: 'drop', from: 0, to: 1, t: t0 + 3000 },  // boş yuvadan sürükleme
  { seq: 4, type: 'egg', t: t0 + 999_999_999 },        // gelecekten zaman
  { seq: 5, type: 'hack', t: t0 + 4000 },
];
const res = replay(clone(base), cheat, t0 + 10_000, t0 + 999_999_999);
assert.equal(res.rejected, 4); assert.equal(res.applied, 1);
assert.ok(res.state.clock <= t0 + 10_000 + 5000, 'saat sunucuyu aşamaz');
assert.ok(res.state.gold < 100, 'gelecekten altın kazanılamaz');
assert.equal(res.state.seq, 5);
// aynı eylemler tekrar gelirse (yeniden deneme) ikinci kez uygulanmaz
const again = replay(clone(res.state), cheat, t0 + 11_000, t0 + 11_000);
assert.equal(again.applied + again.rejected, 0);

// 5) Çevrimdışı: 10 saat sonra açılış -> 8 saat sayılır, rapor + 2x bir kez
const offBase = clone(base);
const loaded = loadOnServer(offBase, t0 + 10 * 3600_000);
assert.equal(loaded.lastOffline.ms, CFG.offlineCapMs);
assert.equal(loaded.lastOffline.claimed, false);
const cl = mk(loaded); const before = cl.s.gold;
assert.ok(cl.offlineReport(t0 + 10 * 3600_000 + 1000));
assert.equal(cl.claimOfflineBonus(t0 + 10 * 3600_000 + 2000).gold, loaded.lastOffline.gold);
assert.equal(cl.claimOfflineBonus(t0 + 10 * 3600_000 + 3000).error, 'none');
cl.advance(t0 + 10 * 3600_000 + 3000);
const sv = replay(clone(loaded), clone(cl.pending), t0 + 10 * 3600_000 + 5000, t0 + 10 * 3600_000 + 3000);
assert.ok(Math.abs(sv.state.gold - cl.s.gold) < 1e-6);

// 6) adopt: uçuştaki eylemler sunucu durumunun üstüne yeniden uygulanır
const ph = mk(base);
ph.drop(5, 6, t0 + 1000);           // seq 1 (sunucuya gitti)
const sent = clone(ph.pending);
ph.openEgg(t0 + 2000);              // seq 2 (henüz gitmedi)
const resp = replay(clone(base), sent, t0 + 2500, t0 + 1500);
ph.adopt(clone(resp.state));
assert.equal(ph.pending.length, 1); assert.equal(ph.pending[0].seq, 2);
assert.equal(ph.s.board.filter(Boolean).length, 3);

// 7) Eski kayıtların göçü
const v1 = { v: 1, board: new Array(16).fill(null), energy: 10, energyAt: t0, gold: 77, crystals: 50, eggQuality: 0, lastSeen: t0, discovered: {}, stats: { merges: 4, eggs: 9 } };
v1.board[3] = { el: 'water', lv: 3 };
const m = migrate(clone(v1), t0);
assert.equal(m.v, 3); assert.equal(m.board.length, 20); assert.equal(m.clock, t0); assert.equal(m.gold, 77); assert.equal(m.seq, 0);
assert.deepEqual(m.board[3], { el: 'water', lv: 3 });

// 8) Geliştirmeler ve sinerji
const g = mk({ ...base, board: new Array(20).fill(null), gold: 1500 });
g.s.board[0] = { el: 'forest', lv: 1 }; g.s.board[1] = { el: 'water', lv: 1 };
assert.ok(Math.abs(g.goldRate() - 2.25) < 1e-9);
assert.equal(g.unlockSlot(t0).cell, 16);
assert.equal(g.upgradeEgg(t0).error, 'gold');
console.log('Tüm kural testleri geçti ✔  (telefon = sunucu, hileler reddedildi)');
