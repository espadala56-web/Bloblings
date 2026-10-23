// Sunucu bağlantısı: ilerlemeyi yükler ve hamleleri düzenli aralıklarla gönderir.
// Bağlantı yoksa oyun cihazda devam eder; bekleyen hamleler bağlantı gelince gönderilir.

import { setTimeOffset, clockNow } from './store.js';

export const API_URL = 'https://hkbgwvvxufukgsjglkdz.supabase.co/functions/v1/game';
const MAX_BATCH = 400;

export function httpTransport(getInitData) {
  return async function post(op, body = {}, { timeout = 8000, keepalive = false } = {}) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ op, initData: getInitData(), ...body }),
        signal: ctrl.signal,
        keepalive,
      });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    } finally {
      clearTimeout(timer);
    }
  };
}

// hooks: onCorrected() -> sunucu farklı bir sonuç verdi, tahtayı yeniden çiz
//        onAuthLost(reason) -> oturum düştü (ör. initData süresi doldu)
export function createSync(store, { post, enabled = true, hooks = {} } = {}) {
  let online = false;
  let inFlight = false;

  async function load() {
    if (!enabled) return { ok: false, reason: 'disabled' };
    try {
      const { status, data } = await post('load', {}, { timeout: 6000 });
      if (status !== 200 || !data || !data.state) return { ok: false, reason: (data && data.error) || status };
      setTimeOffset(data.serverNow - Date.now());
      // Cihazdaki bekleyen hamleler sadece aynı oyuna aitse korunur.
      if (data.isNew || store.s.seed !== data.state.seed) store.pending = [];
      store.adopt(data.state);
      online = true;
      return { ok: true, isNew: Boolean(data.isNew) };
    } catch (e) {
      return { ok: false, reason: 'network' };
    }
  }

  async function sync({ keepalive = false } = {}) {
    if (!online || inFlight || store.pending.length === 0) return { skipped: true };
    inFlight = true;
    const sent = store.pending.slice(0, MAX_BATCH);
    try {
      const { status, data } = await post('sync', { actions: sent, clientNow: clockNow() }, { keepalive, timeout: 8000 });
      if (status === 200 && data && data.state) {
        const drift = data.serverNow - Date.now() - (clockNow() - Date.now());
        if (Math.abs(drift) > 3000) setTimeOffset(data.serverNow - Date.now());
        const before = JSON.stringify(store.s.board);
        store.adopt(data.state);
        const changed = JSON.stringify(store.s.board) !== before;
        if (changed || data.rejected > 0) hooks.onCorrected && hooks.onCorrected(data);
        return { ok: true, applied: data.applied, rejected: data.rejected };
      }
      if (status === 401) {
        online = false;
        hooks.onAuthLost && hooks.onAuthLost(data && data.error);
      } else if (status === 404) {
        await load();
      }
      return { ok: false, status };
    } catch (e) {
      return { ok: false, reason: 'network' }; // hamleler bekler, sonra tekrar denenir
    } finally {
      inFlight = false;
    }
  }

  return {
    load,
    sync,
    get online() {
      return online;
    },
  };
}
