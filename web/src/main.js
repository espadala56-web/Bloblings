// Giriş noktası: Telegram'ı hazırlar, durumu yükler, Phaser tahtasını başlatır.

import { CFG } from './config.js';
import { Store } from './store.js';
import { BoardScene, boardSize } from './scenes/BoardScene.js';
import { initTelegram, userLang, onHide } from './telegram.js';
import { setLang } from './i18n.js';
import { createUI } from './ui.js';

const P = window.Phaser;
const BG = '#1B1736';

initTelegram(BG);
setLang(userLang());

const store = new Store();
// Çevrimdışı kazanç, kayıt güncellenmeden önce hesaplanmalı.
const offline = store.offlineReport();
const ui = createUI(store);

// Yazı tipi gelmeden Phaser yazı çizerse yedek font kullanır; kısa bir süre bekle.
async function fontsReady(ms = 1500) {
  if (!document.fonts || !document.fonts.load) return;
  await Promise.race([
    Promise.all([document.fonts.load('700 24px Fredoka'), document.fonts.load('700 16px Nunito')]),
    new Promise((r) => setTimeout(r, ms)),
  ]).catch(() => {});
}

async function boot() {
  await fontsReady();
  const { w, h } = boardSize();
  const game = new P.Game({
    type: P.AUTO,
    parent: 'game',
    width: w,
    height: h,
    transparent: true,
    banner: false,
    scale: { mode: P.Scale.FIT, autoCenter: P.Scale.CENTER_HORIZONTALLY },
  });
  game.scene.add('board', BoardScene, true, { store, ui });

  // Altın sayacı ve enerji dolumu.
  let last = performance.now();
  setInterval(() => {
    const nowPerf = performance.now();
    const dt = Math.min(nowPerf - last, CFG.offlineCapMs);
    last = nowPerf;
    store.tick(dt);
    store.syncEnergy();
    ui.refresh();
    if (Date.now() - store.lastSaveAt > CFG.saveEveryMs) store.save();
  }, 100);

  onHide(() => store.save());
  store.save();

  if (offline) setTimeout(() => ui.showWelcome(offline), 350);

  // Test ve hata ayıklama için.
  window.__bloblings = { store, game, ui };
}

boot();
