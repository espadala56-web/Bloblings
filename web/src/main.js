// Giriş noktası: Telegram'ı hazırlar, ilerlemeyi sunucudan yükler, Phaser tahtasını başlatır.

import { CFG } from './config.js';
import { Store, setStorageKey, clockNow } from './store.js';
import { BoardScene, boardSize } from './scenes/BoardScene.js';
import { initTelegram, userLang, onHide, inTelegram, tgUserId, rawInitData } from './telegram.js';
import { setLang, t } from './i18n.js';
import { getPref } from './prefs.js';
import { unlockAudio, suspendAudio } from './sound.js';
import { createUI } from './ui.js';
import { createSync, httpTransport } from './net.js';

const P = window.Phaser;
const BG = '#1B1736';
const SYNC_EVERY_MS = 15000;

initTelegram(BG);
setLang(getPref('lang') || userLang());
// Tarayıcılar sesi ancak ilk dokunuştan sonra çalar.
document.addEventListener('pointerdown', unlockAudio, { passive: true });

// Her Telegram hesabının cihazdaki kaydı ayrı tutulur.
const uid = tgUserId();
setStorageKey(uid ? `bloblings:u${uid}` : 'bloblings:v1');

const store = new Store();
const ui = createUI(store);
let scene = null;

const net = createSync(store, {
  post: httpTransport(rawInitData),
  enabled: inTelegram,
  hooks: {
    onCorrected: () => {
      if (scene) scene.rebuild();
      ui.refresh();
    },
    onAuthLost: (reason) => {
      if (reason === 'expired') ui.toast(t('sessionExpired'), 4000);
    },
  },
});

// Yazı tipi gelmeden Phaser yazı çizerse yedek font kullanır; kısa bir süre bekle.
async function fontsReady(ms = 1500) {
  if (!document.fonts || !document.fonts.load) return;
  await Promise.race([
    Promise.all([document.fonts.load('700 24px Fredoka'), document.fonts.load('700 16px Nunito')]),
    new Promise((r) => setTimeout(r, ms)),
  ]).catch(() => {});
}

async function boot() {
  const [loaded] = await Promise.all([net.load(), fontsReady()]);
  if (!loaded.ok) {
    // Sunucuya ulaşılamadı ya da Telegram dışında açıldı: cihazdaki kayıtla devam.
    store.advance(clockNow());
    if (inTelegram) ui.toast(t('offlineMode'), 3500);
  }
  const offline = store.offlineReport();

  const { w, h } = boardSize();
  document.getElementById('game').style.aspectRatio = `${w} / ${h}`;
  const game = new P.Game({
    type: P.AUTO,
    parent: 'game',
    width: w,
    height: h,
    transparent: true,
    banner: false,
    scale: { mode: P.Scale.FIT, autoCenter: P.Scale.CENTER_HORIZONTALLY },
  });
  game.scene.add('board', BoardScene, true, { store, ui, onReady: (s) => (scene = s) });

  // Altın sayacı ve enerji dolumu.
  setInterval(() => {
    store.advance(clockNow());
    ui.refresh();
    if (clockNow() - store.lastSaveAt > CFG.saveEveryMs) store.save();
  }, 100);

  // Hamleleri sunucuya gönder.
  setInterval(() => {
    if (net.online) {
      net.sync();
    } else if (inTelegram) {
      // Bağlantı koptuysa yeniden dene; bekleyen hamleler korunur.
      net.load().then((r) => {
        if (r.ok && scene) scene.rebuild();
        ui.refresh();
      });
    }
  }, SYNC_EVERY_MS);

  onHide(() => {
    suspendAudio();
    store.save();
    net.sync({ keepalive: true });
  });
  store.save();

  if (offline) setTimeout(() => ui.showWelcome(offline), 350);
  setTimeout(() => ui.maybeShowDaily(), 500);

  // Test ve hata ayıklama için.
  window.__bloblings = { store, game, ui, net };
}

boot();
