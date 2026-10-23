// Oyuncu tercihleri (ses, titreşim, dil). Yalnızca bu cihazda saklanır.

const KEY = 'bloblings:prefs';
const DEFAULTS = { sound: true, haptics: true, lang: '' };

function load() {
  try {
    const raw = globalThis.localStorage && globalThis.localStorage.getItem(KEY);
    return { ...DEFAULTS, ...(raw ? JSON.parse(raw) : {}) };
  } catch (e) {
    return { ...DEFAULTS };
  }
}

const prefs = load();

export function getPref(k) {
  return prefs[k];
}

export function setPref(k, v) {
  prefs[k] = v;
  try {
    if (globalThis.localStorage) globalThis.localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch (e) {
    /* depolama kapalıysa tercih yalnızca bu oturumda geçerli */
  }
}
