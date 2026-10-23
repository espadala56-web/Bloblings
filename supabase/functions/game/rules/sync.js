// OTOMATİK KOPYA: web/src/sync.js dosyasını düzenle, sonra scripts/sync-rules.sh çalıştır.
// Sunucu tarafı doğrulama kuralları. Supabase Edge Function bu dosyayı kullanır.
// Telefondan gelen eylemler, sunucu saatiyle sınırlandırılarak sırayla tekrar oynatılır.
// Kurala uymayan eylem (ör. parası yetmeyen satın alma) sessizce reddedilir.

import { Store, freshState } from './store.js';

export const MAX_ACTIONS = 400; // tek senkronda en fazla eylem
export const MAX_SKEW_MS = 5000; // telefon saati sunucudan en fazla bu kadar ileride olabilir

export function newPlayerState(serverNow, seed) {
  return freshState(serverNow, seed);
}

// Oyuncu oyunu açtığında: sen yokken biriken altın ve enerji sunucu saatiyle hesaplanır.
export function loadOnServer(state, serverNow) {
  const st = new Store({ now: serverNow, initial: state, persist: false, record: false });
  st.advance(serverNow);
  return st.s;
}

export function replay(state, actions, serverNow, clientNow) {
  const st = new Store({ now: serverNow, initial: state, persist: false, record: false });
  let last = st.s.clock;
  let applied = 0;
  let rejected = 0;
  const list = (Array.isArray(actions) ? actions : [])
    .filter((a) => a && typeof a === 'object' && Number.isInteger(a.seq) && a.seq > st.s.seq)
    .sort((a, b) => a.seq - b.seq)
    .slice(0, MAX_ACTIONS);

  for (const a of list) {
    let t = Number(a.t);
    if (!Number.isFinite(t)) t = last;
    t = Math.min(Math.max(t, last), serverNow + MAX_SKEW_MS); // zaman geri gidemez, geleceğe kaçamaz
    last = t;
    const id = typeof a.id === 'string' ? a.id.slice(0, 40) : undefined;
    const res = st.apply({ type: a.type, from: a.from, to: a.to, id, seq: a.seq, t });
    if (!res || res.error || res.type === 'none') rejected += 1;
    else applied += 1;
  }

  let target = Number(clientNow);
  if (!Number.isFinite(target)) target = last;
  target = Math.min(Math.max(target, last), serverNow + MAX_SKEW_MS);
  st.advance(target);

  return { state: st.s, applied, rejected };
}
