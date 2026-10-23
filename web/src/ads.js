// Ödüllü reklam katmanı (AdsGram).
//
// Telegram içinde gerçek AdsGram reklamı gösterilir. Tarayıcıda (Telegram dışında)
// reklam gösterilmiş gibi davranan test modu çalışır.
//
// Deneme modu: oyunu t.me/BloblingsBot/play?startapp=adsdebug linkiyle açan cihazda
// AdsGram'ın deneme reklamı çıkar (sayılmaz, para kazandırmaz). Kapatmak için
// ?startapp=adsreal ile bir kez açmak yeterli.

import { inTelegram, startParam } from './telegram.js';
import { getPref, setPref } from './prefs.js';

const SDK_URL = 'https://sad.adsgram.ai/js/sad.min.js';

// AdsGram panelindeki reklam birimleri (BlockID gizli değildir).
const BLOCKS = {
  energy: '55668', // Enerji
  offline_x2: '55669', // 2x Kazanç
};

export const ADS_LIVE = inTelegram;

const sp = startParam();
if (sp === 'adsdebug') setPref('adsDebug', true);
if (sp === 'adsreal') setPref('adsDebug', false);

export function adsDebug() {
  return Boolean(getPref('adsDebug'));
}

let sdk = null;
function loadSdk() {
  if (window.Adsgram) return Promise.resolve(window.Adsgram);
  if (!sdk) {
    sdk = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SDK_URL;
      s.async = true;
      s.onload = () => (window.Adsgram ? resolve(window.Adsgram) : reject(new Error('sdk')));
      s.onerror = () => {
        sdk = null; // bir dahaki denemede yeniden yükle
        reject(new Error('sdk'));
      };
      document.head.appendChild(s);
    });
  }
  return sdk;
}

// Oyun açıldıktan biraz sonra SDK'yı arka planda yükle: reklam butonuna basınca beklemesin.
export function preloadAds() {
  if (ADS_LIVE) loadSdk().catch(() => {});
}

const controllers = {};
function controller(Adsgram, placement) {
  const blockId = BLOCKS[placement] || BLOCKS.energy;
  if (!controllers[blockId]) controllers[blockId] = Adsgram.init({ blockId, debug: adsDebug() });
  return controllers[blockId];
}

let showing = false;

// Sonuç: { ok: true } izlendi | { ok: false, reason: 'skipped' | 'unavailable' | 'busy' }
export async function showRewarded(placement) {
  if (!ADS_LIVE) {
    // Tarayıcı test modu: kısa bir bekleme, sonra "izlendi".
    await new Promise((r) => setTimeout(r, 600));
    return { ok: true, test: true, placement };
  }
  if (showing) return { ok: false, reason: 'busy', placement };
  showing = true;
  try {
    const Adsgram = await loadSdk();
    const res = await controller(Adsgram, placement).show();
    // show() yalnızca reklam sonuna kadar izlenince başarıyla döner.
    return { ok: Boolean(res && res.done), reason: res && res.done ? undefined : 'skipped', test: adsDebug(), placement };
  } catch (res) {
    // Oyuncu reklamı kapattı ya da gösterilecek reklam yok / hata.
    const reason = res && res.error === false ? 'skipped' : 'unavailable';
    return { ok: false, reason, description: res && res.description, placement };
  } finally {
    showing = false;
  }
}
