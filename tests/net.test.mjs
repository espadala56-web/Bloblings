import assert from 'node:assert/strict';
import { Store, clockNow } from '../web/src/store.js';
import { createSync } from '../web/src/net.js';
import { replay, loadOnServer, newPlayerState } from '../web/src/sync.js';

const clone = (x) => JSON.parse(JSON.stringify(x));
// Sahte sunucu: Edge Function'ın yaptığını aynı kural dosyalarıyla yapar.
const db = new Map();
let down = false;
let delayHook = null;
async function post(op, body) {
  if (down) throw new Error('network');
  if (delayHook) await delayHook();
  const now = Date.now(), uid = 42;
  if (op === 'load') {
    const row = db.get(uid);
    if (!row) { const state = loadOnServer(newPlayerState(now, 777), now); db.set(uid, clone(state)); return { status: 200, data: { state: clone(state), serverNow: now, isNew: true } }; }
    const state = loadOnServer(clone(row), now); db.set(uid, clone(state)); return { status: 200, data: { state: clone(state), serverNow: now, isNew: false } };
  }
  if (op === 'sync') {
    const row = db.get(uid); if (!row) return { status: 404, data: { error: 'no_player' } };
    const res = replay(clone(row), clone(body.actions), now, body.clientNow); db.set(uid, clone(res.state));
    return { status: 200, data: { state: clone(res.state), serverNow: now, applied: res.applied, rejected: res.rejected } };
  }
}

let corrected = 0;
// Cihazda eski (başka) bir kayıt var
const store = new Store({ persist: false, initial: newPlayerState(clockNow(), 1) });
store.drop(5, 6); assert.equal(store.pending.length, 1);
const net = createSync(store, { post, hooks: { onCorrected: () => corrected++ } });

// 1) İlk yükleme: sunucuda yeni oyuncu -> cihazdaki yabancı hamleler atılır
let r = await net.load();
assert.ok(r.ok && r.isNew); assert.equal(store.pending.length, 0); assert.equal(store.s.seed, 777);

// 2) Oyna ve gönder: sunucu = telefon
store.drop(5, 6);
for (let i = 0; i < 4; i++) store.openEgg();
r = await net.sync();
assert.ok(r.ok); assert.equal(r.applied, 5); assert.equal(r.rejected, 0);
assert.equal(store.pending.length, 0);
assert.deepEqual(db.get(42).board, store.s.board);
assert.equal(corrected, 0);

// 3) Gönderim sürerken yapılan hamle kaybolmaz
delayHook = async () => { store.openEgg(); delayHook = null; };
r = await net.sync.call(null, {}) ; // pending boş -> atlanır
assert.ok(r.skipped);
store.drop(0, 1); store.drop(1, 0);
delayHook = async () => { store.openEgg(); delayHook = null; };
r = await net.sync();
assert.ok(r.ok); assert.equal(store.pending.length, 1, 'uçuştaki yumurta beklemede kalmalı');
r = await net.sync(); assert.ok(r.ok); assert.equal(store.pending.length, 0);
assert.deepEqual(db.get(42).board, store.s.board);

// 4) Hile: telefonda altın uydurulursa sunucu düzeltir
store.s.gold += 1e9;
assert.equal(store.unlockSlot().cell, 16);
r = await net.sync();
assert.equal(r.rejected, 1); assert.equal(store.s.slotsOpen, 16, 'sunucu satın almayı geri aldı');
assert.ok(store.s.gold < 1e6, 'uydurulan altın silindi'); assert.equal(corrected, 1);

// 5) Bağlantı kopukken oyna, sonra gönder
down = true;
store.openEgg(); store.openEgg();
r = await net.sync(); assert.equal(r.reason, 'network'); assert.equal(store.pending.length, 2);
down = false;
r = await net.sync(); assert.ok(r.ok); assert.equal(r.applied, 2); assert.equal(store.pending.length, 0);
assert.deepEqual(db.get(42).board, store.s.board);

// 6) Yeniden açılış: aynı oyuncu, ilerleme sunucudan gelir
const store2 = new Store({ persist: false });
const net2 = createSync(store2, { post });
r = await net2.load(); assert.ok(r.ok && !r.isNew);
assert.deepEqual(store2.s.board, store.s.board);
console.log('Telefon-sunucu senkron testleri geçti ✔');
