// Telegram Mini App köprüsü. Oyun Telegram dışında (tarayıcıda) açılınca da çalışır.

const tg = typeof window !== 'undefined' && window.Telegram ? window.Telegram.WebApp : null;

export const inTelegram = Boolean(tg && tg.initData);

function atLeast(v) {
  return Boolean(tg && typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast(v));
}

export function initTelegram(bg) {
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    if (atLeast('6.1')) {
      tg.setHeaderColor(bg);
      tg.setBackgroundColor(bg);
    }
    // Sürükleme sırasında oyunun aşağı kaydırılıp kapanmasını engeller.
    if (atLeast('7.7')) tg.disableVerticalSwipes();
  } catch (e) {
    console.warn('Telegram init', e);
  }
}

export function haptic(kind = 'light') {
  try {
    if (!tg || !atLeast('6.1')) return;
    if (kind === 'success' || kind === 'error' || kind === 'warning') {
      tg.HapticFeedback.notificationOccurred(kind);
    } else {
      tg.HapticFeedback.impactOccurred(kind);
    }
  } catch (e) {
    /* titreşim desteklenmiyorsa sessizce geç */
  }
}

export function userLang() {
  const fromTg = tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.language_code;
  return fromTg || navigator.language || 'en';
}

// Referral ve füzyon linklerinden gelen parametre (t.me/Bot/play?startapp=...).
export function startParam() {
  const fromTg = tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param;
  return fromTg || new URLSearchParams(location.search).get('startapp') || null;
}

// Sunucu doğrulaması için ham initData. Asla istemcide güvenilir sayılmaz.
export function rawInitData() {
  return tg ? tg.initData : '';
}

export function onHide(fn) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') fn();
  });
  window.addEventListener('pagehide', fn);
}
