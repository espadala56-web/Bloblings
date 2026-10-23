import assert from 'node:assert/strict';
import { Store, migrate, rng } from '../web/src/store.js';
import { replay, loadOnServer, newPlayerState } from '../web/src/sync.js';
import { CFG, rateOf, artKey, topLevel, hybridOf, HYBRID_MULT, SHINY_MULT } from '../web/src/config.js';

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

// 9) Günlük ödül: 20 saatte bir, 48 saati geçerse seri sıfırlanır, 7. gün nadir yumurta
const H = 3600_000;
const d = mk(base);
assert.equal(d.dailyStatus(t0).ready, true);
let dr = d.claimDaily(t0 + 1000);
assert.equal(dr.day, 1); assert.equal(dr.energy, 10); assert.equal(d.s.energy, 40); // sınırı aşabilir
assert.equal(d.claimDaily(t0 + 2 * H).error, 'wait');
assert.equal(d.claimDaily(t0 + 21 * H).day, 2);
assert.equal(d.claimDaily(t0 + 42 * H).day, 3);
assert.equal(d.claimDaily(t0 + 100 * H).day, 1, '48 saatten fazla ara seriyi sıfırlar');
const d7 = mk({ ...base, daily: { streak: 6, lastAt: t0 } });
dr = d7.claimDaily(t0 + 21 * H);
assert.equal(dr.day, 7); assert.equal(dr.blob.lv, 2); assert.ok(d7.s.board[dr.cell]);
assert.equal(d7.claimDaily(t0 + 42 * H).day, 1, '7. günden sonra döngü başa döner');
// sunucu da aynı sonuca varır, bekleme süresi dolmadan gelen istek reddedilir
const dsv = replay(clone({ ...base, daily: { streak: 6, lastAt: t0 } }), clone(d7.pending), t0 + 43 * H, t0 + 42 * H);
assert.equal(dsv.rejected, 0); assert.deepEqual(dsv.state.board, d7.s.board); assert.equal(dsv.state.daily.streak, 1);
const dcheat = replay(clone(base), [{ seq: 1, type: 'daily', t: t0 + 1000 }, { seq: 2, type: 'daily', t: t0 + 2000 }], t0 + 3000, t0 + 3000);
assert.equal(dcheat.applied, 1); assert.equal(dcheat.rejected, 1);

// 10) Reklamla enerji: UTC gününde en fazla 3 kez
const e = mk({ ...base, energy: 0, energyAt: t0 });
for (let i = 0; i < CFG.adEnergyPerDay; i++) assert.equal(e.adEnergy(t0 + 1000 + i).energy, CFG.adEnergyAmount);
assert.equal(e.adEnergy(t0 + 2000).error, 'limit');
assert.equal(e.adEnergyLeft(t0 + 2000), 0);
assert.equal(e.adEnergyLeft(t0 + 24 * H), CFG.adEnergyPerDay, 'ertesi gün hak yenilenir');
assert.equal(e.s.energy, CFG.adEnergyAmount * CFG.adEnergyPerDay);
const echeat = replay(clone({ ...base, energy: 0, energyAt: t0 }), [1, 2, 3, 4, 5].map((n) => ({ seq: n, type: 'adEnergy', t: t0 + n })), t0 + 3000, t0 + 3000);
assert.equal(echeat.applied, 3); assert.equal(echeat.rejected, 2);

// 11) Kristalle enerji
const k = mk({ ...base, energy: 0, energyAt: t0, crystals: 45 });
assert.equal(k.buyEnergy(t0 + 1).energy, CFG.crystalEnergyAmount);
assert.equal(k.buyEnergy(t0 + 2).energy, CFG.crystalEnergyAmount);
assert.equal(k.buyEnergy(t0 + 3).error, 'crystals');
assert.equal(k.s.crystals, 5);
const ksv = replay(clone({ ...base, energy: 0, energyAt: t0, crystals: 45 }), [1, 2, 3].map((n) => ({ seq: n, type: 'buyEnergy', t: t0 + n })), t0 + 3000, t0 + 3000);
assert.equal(ksv.applied, 2); assert.equal(ksv.rejected, 1); assert.equal(ksv.state.crystals, 5);

// 12) Gizli karışımlar: Lv3 farklı elementler -> Lv4 karışım; diğer seviyelerde yer değiştirir
const hx = mk({ ...base, board: new Array(20).fill(null) });
hx.s.board[0] = { el: 'fire', lv: 3 }; hx.s.board[1] = { el: 'water', lv: 3 };
hx.s.board[2] = { el: 'fire', lv: 2 }; hx.s.board[3] = { el: 'water', lv: 2 };
assert.equal(hx.knowsRecipe(0, 1), false, 'keşfedilmeden ipucu yok');
let hr = hx.drop(0, 1, t0 + 10);
assert.equal(hr.type, 'merge'); assert.equal(hr.recipe, true); assert.deepEqual(hr.blob, { el: 'steam', lv: 4 }); assert.equal(hr.discovered, true);
assert.equal(hx.drop(2, 3, t0 + 20).type, 'swap', 'Lv2 farklı elementler yer değiştirir');
assert.equal(hx.s.stats.recipes, 1);
assert.ok(Math.abs(hx.blobRate(1) - rateOf(4) * HYBRID_MULT * (1 + CFG.synergyBonus)) < 1e-9, 'karışım: x1.5 ve iki ebeveyn de besler'); // komşu 2'de water(lv2) var
hx.s.board[4] = { el: 'water', lv: 3 }; hx.s.board[5] = { el: 'forest', lv: 3 };
assert.equal(hx.drop(4, 5, t0 + 30).blob.el, 'lotus');
hx.s.board[6] = { el: 'forest', lv: 3 }; hx.s.board[7] = { el: 'fire', lv: 3 };
assert.equal(hx.drop(7, 6, t0 + 40).blob.el, 'autumn');
hx.s.board[8] = { el: 'steam', lv: 4 };
assert.equal(hx.drop(8, 1, t0 + 50).blob.lv, 5, 'karışımlar kendi aralarında birleşir');
assert.equal(hybridOf('fire', 'fire'), null);
const hsv = replay(clone({ ...base, board: (() => { const b = new Array(20).fill(null); b[0] = { el: 'fire', lv: 3 }; b[1] = { el: 'water', lv: 3 }; b[2] = { el: 'fire', lv: 2 }; b[3] = { el: 'water', lv: 2 }; return b; })() }), clone(hx.pending.slice(0, 2)), t0 + 100, t0 + 25);
assert.equal(hsv.rejected, 0); assert.deepEqual(hsv.state.board[1], { el: 'steam', lv: 4 });

// 13) Çizim anahtarları
assert.equal(artKey('fire', 7), 'fire-7'); assert.equal(artKey('fire', 14), 'fire-10');
assert.equal(artKey('steam', 4), 'steam-1'); assert.equal(artKey('steam', 6), 'steam-3'); assert.equal(artKey('steam', 9), 'steam-3');
assert.equal(topLevel('fire'), 10); assert.equal(topLevel('lotus'), 6);

// 14) Parlak canavarlar: gelir x2, birleşince parlaklık kalır, telefon = sunucu
const sh = mk({ ...base, board: new Array(20).fill(null) });
sh.s.board[0] = { el: 'fire', lv: 2, shiny: true }; sh.s.board[1] = { el: 'fire', lv: 2 };
assert.ok(Math.abs(sh.blobRate(0) - rateOf(2) * SHINY_MULT) < 1e-9);
const shr = sh.drop(1, 0, t0 + 5);
assert.equal(shr.blob.shiny, true); assert.equal(shr.shinyNew, true); assert.ok(sh.s.discovered['fire-3*']);
// yeterince yumurtada parlak çıkar ve sunucu aynısını üretir
const sg = mk({ ...base, board: new Array(20).fill(null), seed: 4242, energy: 30 });
const sgStart = clone(sg.s);
let shinies = 0;
for (let i = 0; i < 600; i++) {
  const e = sg.openEgg(t0 + 1000 + i * 10);
  if (e.blob && e.blob.shiny) shinies++;
  sg.s.board.fill(null); sg.s.energy = 30;
}
assert.ok(shinies > 5 && shinies < 40, `parlak oranı makul olmalı: ${shinies}/600`);
const sgc = mk(sgStart);
for (let i = 0; i < 20; i++) sgc.openEgg(t0 + 1000 + i * 10);
const sgsv = replay(clone(sgStart), clone(sgc.pending), t0 + 9000, t0 + 1200);
assert.deepEqual(sgsv.state.board, sgc.s.board);

// 15) Hediye kutusu: yalnızca sunucunun koyduğu hediye alınabilir, bir kez
const gf = mk({ ...base, inbox: [{ id: 'inv', kind: 'invited', name: 'Ali' }, { id: 'f42', kind: 'friend', name: 'Ayşe' }] });
const gr = gf.claimGift('inv', t0 + 1);
assert.equal(gr.kind, 'invited'); assert.ok(gr.blob); assert.equal(gr.blob.lv, 2);
assert.equal(gf.claimGift('inv', t0 + 2).error, 'none');
const cr0 = gf.s.crystals;
const gr2 = gf.claimGift('f42', t0 + 3);
assert.equal(gf.s.crystals - cr0, CFG.giftCrystals); assert.equal(gf.s.stats.friends, 1); assert.equal(gr2.kind, 'friend');
const gsv = replay(clone({ ...base, inbox: [{ id: 'inv', kind: 'invited', name: 'Ali' }] }), [{ seq: 1, type: 'gift', id: 'inv', t: t0 + 1 }, { seq: 2, type: 'gift', id: 'inv', t: t0 + 2 }, { seq: 3, type: 'gift', id: 'fake', t: t0 + 3 }], t0 + 10, t0 + 10);
assert.equal(gsv.applied, 1); assert.equal(gsv.rejected, 2); assert.equal(gsv.state.inbox.length, 0);

console.log('Tüm kural testleri geçti ✔  (telefon = sunucu, hileler reddedildi)');
