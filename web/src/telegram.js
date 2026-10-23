// Telegram Mini App köprüsü. Oyun Telegram dışında (tarayıcıda) açılınca da çalışır.

import { getPref } from './prefs.js';

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
    if (!tg || !atLeast('6.1') || !getPref('haptics')) return;
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

export function tgUserId() {
  const u = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
  return u && typeof u.id === 'number' ? u.id : null;
}

// Sunucu doğrulaması için ham initData. Asla istemcide güvenilir sayılmaz.
export function rawInitData() {
  return tg ? tg.initData : '';
}

// Oyunun Telegram kanalı. Boşsa kanal butonları gizlenir.
export const CHANNEL_URL = 'https://t.me/+JuinJ4pXb_U1NDU0';

// t.me linklerini Telegram içinde açar (kanala katılma vb.).
export function openTgLink(url) {
  try {
    if (tg && atLeast('6.1') && tg.openTelegramLink) {
      tg.openTelegramLink(url);
      return;
    }
  } catch (e) {
    /* aşağıya düş */
  }
  window.open(url, '_blank');
}

// Davet linki: t.me/BloblingsBot/play?startapp=r_<telegramId>
export const BOT_LINK = 'https://t.me/BloblingsBot/play';

export function inviteLink() {
  const id = tgUserId();
  return id ? `${BOT_LINK}?startapp=r_${id}` : BOT_LINK;
}

// Telegram'ın paylaşım penceresini açar (sohbet seçip gönderme).
export function shareLink(url, text) {
  const share = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  try {
    if (tg && atLeast('6.1') && tg.openTelegramLink) {
      tg.openTelegramLink(share);
      return true;
    }
  } catch (e) {
    /* aşağıdaki yollara düş */
  }
  if (navigator.share) {
    navigator.share({ url, text }).catch(() => {});
    return true;
  }
  window.open(share, '_blank');
  return true;
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    return false;
  }
}

// Telegram'ın üst köşedeki geri tuşu: pencere açıkken pencereyi kapatır.
let backHandler = null;
export function setBackButton(handler) {
  if (!tg || !atLeast('6.1') || !tg.BackButton) return;
  try {
    if (backHandler) tg.BackButton.offClick(backHandler);
    backHandler = handler || null;
    if (handler) {
      tg.BackButton.onClick(handler);
      tg.BackButton.show();
    } else {
      tg.BackButton.hide();
    }
  } catch (e) {
    /* eski Telegram sürümleri */
  }
}

export function onHide(fn) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') fn();
  });
  window.addEventListener('pagehide', fn);
}
