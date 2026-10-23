// Bloblings oyun sunucusu (Supabase Edge Function).
//
// İstemci her istekte Telegram'ın imzaladığı initData'yı gönderir. İmza, Telegram'ın
// herkese açık Ed25519 anahtarıyla doğrulanır; bu yüzden sunucuda bot token'ı gerekmez.
//
// İşlemler:
//   health -> çalışıyor mu kontrolü
//   load   -> oyuncuyu getirir (yoksa oluşturur), sen yokken biriken altını hesaplar
//   sync   -> telefondan gelen eylemleri ortak kurallarla tekrar oynatır, sonucu kaydeder
//
// Kurallar web/src altındaki dosyaların kopyasıdır (rules/). Güncellemek için:
//   scripts/sync-rules.sh

import { createClient } from 'npm:@supabase/supabase-js@2';
import { replay, loadOnServer, newPlayerState } from './rules/sync.js';
import { newSeed } from './rules/store.js';
import { CFG } from './rules/config.js';

const BOT_ID = Deno.env.get('BOT_ID') ?? '8884399679';
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? ''; // isteğe bağlı yedek doğrulama
const TG_PUBLIC_KEY_HEX = 'e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d'; // Telegram (üretim)
const MAX_AGE_S = 48 * 3600; // initData en fazla 48 saat geçerli
const MAX_BODY = 64 * 1024;

function secretKey(): string {
  try {
    const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}');
    if (keys.default) return keys.default;
  } catch (_) {
    /* eski anahtara düş */
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
}

const db = createClient(Deno.env.get('SUPABASE_URL')!, secretKey(), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Max-Age': '86400',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

// ---- Telegram initData doğrulama ----

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

function b64urlToBytes(s: string): Uint8Array {
  let b = s.replace(/-/g, '+').replace(/_/g, '/');
  while (b.length % 4) b += '=';
  const bin = atob(b);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

let pubKey: Promise<CryptoKey> | null = null;
function telegramKey(): Promise<CryptoKey> {
  if (!pubKey) pubKey = crypto.subtle.importKey('raw', hexToBytes(TG_PUBLIC_KEY_HEX), { name: 'Ed25519' }, false, ['verify']);
  return pubKey;
}

function checkString(params: URLSearchParams, exclude: string[]): string {
  const pairs: [string, string][] = [];
  for (const [k, v] of params) if (!exclude.includes(k)) pairs.push([k, v]);
  pairs.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  return pairs.map(([k, v]) => `${k}=${v}`).join('\n');
}

async function verifyEd25519(params: URLSearchParams): Promise<boolean> {
  const sig = params.get('signature');
  if (!sig) return false;
  const data = `${BOT_ID}:WebAppData\n` + checkString(params, ['hash', 'signature']);
  try {
    return await crypto.subtle.verify({ name: 'Ed25519' }, await telegramKey(), b64urlToBytes(sig), new TextEncoder().encode(data));
  } catch (_) {
    return false;
  }
}

async function verifyHmac(params: URLSearchParams): Promise<boolean> {
  const hash = params.get('hash');
  if (!hash || !BOT_TOKEN) return false;
  const enc = new TextEncoder();
  const k1 = await crypto.subtle.importKey('raw', enc.encode('WebAppData'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const secret = await crypto.subtle.sign('HMAC', k1, enc.encode(BOT_TOKEN));
  const k2 = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const check = toHex(await crypto.subtle.sign('HMAC', k2, enc.encode(checkString(params, ['hash']))));
  return check === hash;
}

type TgUser = { id: number; username?: string; first_name?: string; language_code?: string; is_premium?: boolean };

async function authenticate(initData: unknown): Promise<{ user: TgUser; startParam: string | null } | { error: string }> {
  if (typeof initData !== 'string' || !initData || initData.length > 4096) return { error: 'auth' };
  const params = new URLSearchParams(initData);
  const ok = (await verifyEd25519(params)) || (await verifyHmac(params));
  if (!ok) return { error: 'auth' };
  const authDate = Number(params.get('auth_date'));
  if (!authDate || Date.now() / 1000 - authDate > MAX_AGE_S) return { error: 'expired' };
  let user: TgUser | null = null;
  try {
    user = JSON.parse(params.get('user') ?? 'null');
  } catch (_) {
    user = null;
  }
  if (!user || typeof user.id !== 'number') return { error: 'auth' };
  return { user, startParam: params.get('start_param') };
}

// ---- Veritabanı ----

async function logEvent(tgId: number, type: string, data: unknown = null) {
  await db.from('events').insert({ tg_id: tgId, type, data });
}

function profile(user: TgUser) {
  return {
    username: user.username ?? null,
    first_name: user.first_name ?? null,
    lang: user.language_code ?? null,
    is_premium: Boolean(user.is_premium),
  };
}

function parseReferrer(startParam: string | null, selfId: number): number | null {
  // Davet linkleri: r_<telegramId>  (füzyon/hediye linkleri ileride f_..., g_... olacak)
  const m = startParam && /^r_(\d{1,15})$/.exec(startParam);
  if (!m) return null;
  const id = Number(m[1]);
  return id && id !== selfId ? id : null;
}

// ---- Arkadaş daveti ----

type State = Record<string, any>;

function shortName(name: unknown): string {
  return typeof name === 'string' ? name.slice(0, 24) : '';
}

// Davet edilen oyuncu yeterince oynadıysa daveti "hak kazandı" olarak işaretler.
// Durumdaki refDone bayrağı her senkronda veritabanına gitmemek için.
function needsQualify(state: State, referredBy: number | null): boolean {
  return Boolean(referredBy) && !state.refDone && (state.stats?.merges ?? 0) >= CFG.referralMerges;
}

async function markQualified(refereeId: number) {
  await db.from('referrals').update({ qualified_at: new Date().toISOString() }).eq('referee', refereeId).is('qualified_at', null);
  await logEvent(refereeId, 'referral_qualified');
}

// Hak kazanmış ama henüz teslim edilmemiş arkadaş hediyelerini durumun hediye kutusuna koyar.
async function collectFriendGifts(tgId: number, state: State): Promise<number[]> {
  const { data, error } = await db
    .from('referrals')
    .select('referee')
    .eq('referrer', tgId)
    .not('qualified_at', 'is', null)
    .is('delivered_at', null)
    .limit(20);
  if (error || !data || data.length === 0) return [];
  const ids = data.map((r: { referee: number }) => r.referee);
  const { data: names } = await db.from('players').select('tg_id, first_name').in('tg_id', ids);
  const nameOf = new Map((names ?? []).map((p: { tg_id: number; first_name: string | null }) => [p.tg_id, p.first_name]));
  if (!Array.isArray(state.inbox)) state.inbox = [];
  if (!state.giftSeen || typeof state.giftSeen !== 'object') state.giftSeen = {};
  for (const id of ids) {
    const gid = `f${id}`;
    if (state.giftSeen[gid]) continue; // daha önce verildiyse tekrar verme
    state.giftSeen[gid] = 1;
    state.inbox.push({ id: gid, kind: 'friend', name: shortName(nameOf.get(id)) });
  }
  return ids;
}

async function markDelivered(ids: number[]) {
  if (ids.length) await db.from('referrals').update({ delivered_at: new Date().toISOString() }).in('referee', ids);
}

async function load(user: TgUser, startParam: string | null, attempt = 0): Promise<Record<string, unknown>> {
  if (attempt > 2) return { error: 'busy' };
  const now = Date.now();
  const { data: row, error } = await db.from('players').select('state, version, referred_by').eq('tg_id', user.id).maybeSingle();
  if (error) throw error;

  if (!row) {
    const state = loadOnServer(newPlayerState(now, newSeed()), now) as State;
    // Davet linkiyle geldiyse ve davet eden gerçek bir oyuncuysa: hoş geldin hediyesi.
    let referrer: { tg_id: number; first_name: string | null } | null = null;
    const refId = parseReferrer(startParam, user.id);
    if (refId) {
      const { data } = await db.from('players').select('tg_id, first_name').eq('tg_id', refId).maybeSingle();
      referrer = data ?? null;
    }
    if (referrer) {
      state.inbox.push({ id: 'inv', kind: 'invited', name: shortName(referrer.first_name) });
      state.giftSeen.inv = 1;
    }
    const ins = await db.from('players').insert({
      tg_id: user.id,
      ...profile(user),
      state,
      version: 1,
      start_param: startParam,
      referred_by: referrer ? referrer.tg_id : null,
    });
    if (ins.error) {
      if (ins.error.code === '23505') return load(user, startParam, attempt + 1); // aynı anda iki açılış
      throw ins.error;
    }
    if (referrer) await db.from('referrals').insert({ referee: user.id, referrer: referrer.tg_id });
    await logEvent(user.id, 'signup', { start_param: startParam, referrer: referrer ? referrer.tg_id : null });
    return { state, serverNow: now, isNew: true };
  }

  const state = loadOnServer(row.state, now) as State;
  const qualify = needsQualify(state, row.referred_by);
  if (qualify) state.refDone = true;
  const gifts = await collectFriendGifts(user.id, state);
  const upd = await db
    .from('players')
    .update({ state, version: row.version + 1, updated_at: new Date(now).toISOString(), ...profile(user) })
    .eq('tg_id', user.id)
    .eq('version', row.version)
    .select('version');
  if (upd.error) throw upd.error;
  if (!upd.data || upd.data.length === 0) return load(user, startParam, attempt + 1); // başka bir cihaz yazdı, tekrar dene
  await markDelivered(gifts);
  if (qualify) await markQualified(user.id);
  return { state, serverNow: now, isNew: false };
}

async function sync(user: TgUser, actions: unknown, clientNow: unknown, attempt = 0): Promise<unknown> {
  const now = Date.now();
  const { data: row, error } = await db.from('players').select('state, version, referred_by').eq('tg_id', user.id).maybeSingle();
  if (error) throw error;
  if (!row) return { error: 'no_player' };

  const res = replay(row.state, actions, now, clientNow);
  const qualify = needsQualify(res.state as State, row.referred_by);
  if (qualify) (res.state as State).refDone = true;
  const upd = await db
    .from('players')
    .update({ state: res.state, version: row.version + 1, updated_at: new Date(now).toISOString() })
    .eq('tg_id', user.id)
    .eq('version', row.version)
    .select('version');
  if (upd.error) throw upd.error;
  if (!upd.data || upd.data.length === 0) {
    if (attempt < 2) return sync(user, actions, clientNow, attempt + 1);
    return { error: 'busy' };
  }
  if (qualify) await markQualified(user.id);
  if (res.rejected > 0) await logEvent(user.id, 'rejected', { rejected: res.rejected, applied: res.applied });
  return { state: res.state, serverNow: now, applied: res.applied, rejected: res.rejected };
}

// ---- Giriş noktası ----

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  const len = Number(req.headers.get('content-length') ?? '0');
  if (len > MAX_BODY) return json({ error: 'too_large' }, 413);

  let body: Record<string, unknown>;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY) return json({ error: 'too_large' }, 413);
    body = JSON.parse(text || '{}');
  } catch (_) {
    return json({ error: 'bad_json' }, 400);
  }

  try {
    if (body.op === 'health') {
      await telegramKey();
      return json({ ok: true, ed25519: true, serverNow: Date.now() });
    }

    const auth = await authenticate(body.initData);
    if ('error' in auth) return json({ error: auth.error }, 401);

    if (body.op === 'load') {
      const out = await load(auth.user, auth.startParam);
      return json(out, out.error ? 409 : 200);
    }
    if (body.op === 'sync') {
      const out = (await sync(auth.user, body.actions, body.clientNow)) as Record<string, unknown>;
      if (out.error === 'no_player') return json(out, 404);
      if (out.error === 'busy') return json(out, 409);
      return json(out);
    }
    return json({ error: 'unknown_op' }, 400);
  } catch (e) {
    console.error('game error', e);
    return json({ error: 'server' }, 500);
  }
});
