// HTML arayüz katmanı: üst bilgi çubuğu, ipucu, butonlar, bildirimler ve pencereler.

import { CFG, artKey } from './config.js';
import { t, formatNum, formatDuration, getLang, blobName, blobFlavor } from './i18n.js';
import { haptic } from './telegram.js';
import { showRewarded, ADS_LIVE } from './ads.js';

const $ = (id) => document.getElementById(id);

const COIN_SVG =
  '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#FFC93C" stroke="#9A6A00" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="#C98A00" stroke-width="2"/></svg>';

function mmss(ms) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function formatRate(r) {
  if (r < 100) return r.toLocaleString(getLang() === 'tr' ? 'tr-TR' : 'en-US', { maximumFractionDigits: 1 });
  return formatNum(r);
}

function h(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) if (c) node.append(c);
  return node;
}

export function createUI(store) {
  const el = {
    energyVal: $('energy-val'),
    energySub: $('energy-sub'),
    goldVal: $('gold-val'),
    crystalVal: $('crystal-val'),
    rateVal: $('rate-val'),
    hint: $('hint'),
    eggBtn: $('egg-btn'),
    upBtn: $('up-btn'),
    toast: $('toast'),
    modal: $('modal'),
  };
  let scene = null;
  let toastTimer = null;
  let sheetOpen = false;

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-label]').forEach((node) => {
    node.setAttribute('aria-label', t(node.dataset.i18nLabel));
  });

  // ---- Pencere sırası: aynı anda tek pencere, diğerleri sırada bekler ----
  const queue = [];
  let current = null;

  function openModal(build) {
    if (current) {
      queue.push(build);
      return;
    }
    current = build;
    el.modal.innerHTML = '';
    const card = build(closeModal);
    el.modal.append(card);
    el.modal.hidden = false;
    const focusable = card.querySelector('button');
    if (focusable) focusable.focus();
  }

  function closeModal() {
    el.modal.hidden = true;
    el.modal.innerHTML = '';
    current = null;
    sheetOpen = false;
    const next = queue.shift();
    if (next) setTimeout(() => openModal(next), 120);
    refresh();
  }

  // ---- İpucu ----
  function hintText() {
    const s = store.s;
    const empty = store.emptyCells().length;
    if (s.stats.merges === 0 && store.hasMergePair()) return t('hintFirstMerge');
    if (s.stats.merges > 0 && store.canAffordUpgrade()) return t('hintUpgrade');
    if (empty === 0 && !store.hasMergePair()) return t('hintBoardFull');
    if (s.energy < CFG.eggCost && empty > 0) return t('hintNoEnergy');
    if (s.stats.eggs === 0 && empty > 0) return t('hintOpenEgg');
    if (s.stats.merges >= 1 && store.synergyLinks().length === 0) return t('hintSynergy');
    return t('hintKeepMerging');
  }

  function refresh() {
    const s = store.s;
    const now = Date.now();
    el.energyVal.textContent = `${s.energy}/${CFG.energyCap}`;
    el.energySub.textContent = s.energy >= CFG.energyCap ? t('full') : `+1 · ${mmss(store.nextEnergyIn(now))}`;
    el.goldVal.textContent = formatNum(s.gold);
    el.crystalVal.textContent = formatNum(s.crystals);
    el.rateVal.textContent = `+${formatRate(store.goldRate())} ${t('goldUnit')}`;
    const hint = hintText();
    if (el.hint.textContent !== hint) el.hint.textContent = hint;
    el.eggBtn.classList.toggle('is-empty', s.energy < CFG.eggCost);
    el.upBtn.classList.toggle('has-dot', store.canAffordUpgrade());
    if (sheetOpen && current && current.update) current.update();
  }

  function toast(msg, ms = 2200) {
    el.toast.textContent = msg;
    el.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove('show'), ms);
  }

  // ---- Yumurta ----
  el.eggBtn.addEventListener('click', () => {
    if (!scene) return;
    const res = store.openEgg();
    if (res.error === 'energy') {
      haptic('error');
      toast(t('noEnergy', { t: mmss(store.nextEnergyIn()) }));
    } else if (res.error === 'full') {
      haptic('warning');
      toast(t('boardFull'));
    } else {
      scene.spawn(res);
    }
    refresh();
  });

  // ---- Geliştirmeler ----
  function tryUnlock() {
    const res = store.unlockSlot();
    if (res.error === 'gold') {
      haptic('error');
      toast(t('needGold', { n: formatNum(res.need) }));
      return false;
    }
    if (res.error) return false;
    haptic('success');
    toast(t('slotUnlocked'));
    if (scene) scene.onSlotUnlocked(res.cell);
    refresh();
    return true;
  }

  function tryEgg() {
    const res = store.upgradeEgg();
    if (res.error === 'gold') {
      haptic('error');
      toast(t('needGold', { n: formatNum(res.need) }));
      return false;
    }
    if (res.error) return false;
    haptic('success');
    toast(t('eggUpgraded', { n: res.level }));
    refresh();
    return true;
  }

  function buyButton(cost, onBuy) {
    const btn = h('button', { type: 'button', class: 'btn-buy' });
    const paint = (c) => {
      if (c === null) {
        btn.innerHTML = '';
        btn.textContent = t('maxed');
        btn.disabled = true;
        return;
      }
      btn.innerHTML = `${COIN_SVG}<span>${formatNum(c)}</span>`;
      btn.classList.toggle('cant', store.s.gold < c);
    };
    paint(cost);
    btn.addEventListener('click', onBuy);
    btn.paint = paint;
    return btn;
  }

  function openUpgrades() {
    const build = (close) => {
      sheetOpen = true;
      const eggDesc = h('small');
      const slotDesc = h('small');
      const eggBtn = buyButton(store.nextEggCost(), () => {
        tryEgg();
        update();
      });
      const slotBtn = buyButton(store.nextSlotCost(), () => {
        tryUnlock();
        update();
      });
      function update() {
        const q = store.s.eggQuality;
        eggDesc.textContent = t('eggQualityDesc', { a: q + 1, b: q + 2 });
        const left = CFG.cols * CFG.rows - store.s.slotsOpen;
        slotDesc.textContent = t('slotDesc', { n: left });
        eggBtn.paint(store.nextEggCost());
        slotBtn.paint(store.nextSlotCost());
      }
      build.update = update;
      update();

      const chain = h('div', { class: 'chain', 'aria-hidden': 'true' }, [
        h('img', { src: './assets/blobs/water-1.svg', alt: '' }),
        h('span', { text: '→' }),
        h('img', { src: './assets/blobs/forest-1.svg', alt: '' }),
        h('span', { text: '→' }),
        h('img', { src: './assets/blobs/fire-1.svg', alt: '' }),
        h('span', { text: '→' }),
        h('img', { src: './assets/blobs/water-1.svg', alt: '' }),
      ]);

      return h('div', { class: 'modal-card sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'up-title' }, [
        h('h2', { id: 'up-title', text: t('upgradesTitle') }),
        h('div', { class: 'up-row' }, [
          h('img', { src: './assets/egg-rare.svg', alt: '', width: '44', height: '44' }),
          h('div', { class: 'up-text' }, [h('b', { text: t('eggQualityTitle') }), eggDesc]),
          eggBtn,
        ]),
        h('div', { class: 'up-row' }, [
          h('span', {
            class: 'up-lock',
            html: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#B8B0DD" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
          }),
          h('div', { class: 'up-text' }, [h('b', { text: t('slotTitle') }), slotDesc]),
          slotBtn,
        ]),
        h('div', { class: 'synergy-box' }, [h('b', { text: t('synergyTitle') }), chain, h('small', { text: t('synergyDesc') })]),
        h('button', { type: 'button', class: 'btn btn-ghost', text: t('close'), onclick: close }),
      ]);
    };
    openModal(build);
  }

  el.upBtn.addEventListener('click', () => {
    haptic('light');
    openUpgrades();
  });

  // ---- Keşif kartı ----
  function discover(blob) {
    haptic('success');
    openModal((close) =>
      h('div', { class: 'modal-card discover', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'disc-title' }, [
        h('span', { class: 'tag', text: t('newDiscovery') }),
        h('img', { class: 'discover-img', src: `./assets/blobs/${artKey(blob.el, blob.lv)}.svg`, alt: '', width: '168', height: '168' }),
        h('h2', { id: 'disc-title', text: blobName(blob.el, blob.lv) }),
        h('div', { class: 'meta', text: `Lv${blob.lv} · ${t(blob.el)}` }),
        h('p', { class: 'flavor', text: blobFlavor(blob.el, blob.lv) }),
        h('button', { type: 'button', class: 'btn btn-primary', text: t('awesome'), onclick: close }),
      ]),
    );
  }

  // ---- Hoş geldin (çevrimdışı kazanç) ----
  function showWelcome(report) {
    if (!report) return;
    openModal((close) => {
      const dbl = h('button', {
        type: 'button',
        class: 'btn btn-ad',
        html: '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg><span></span>',
      });
      dbl.querySelector('span').textContent = `${t('collectDouble')} · ${formatNum(report.gold * 2)}`;
      const one = h('button', { type: 'button', class: 'btn btn-ghost', text: t('collect') });
      const finish = (mult) => {
        const got = store.collectOffline(report, mult);
        close();
        haptic('success');
        toast(t('collected', { n: formatNum(got) }));
      };
      one.addEventListener('click', () => finish(1));
      dbl.addEventListener('click', async () => {
        dbl.disabled = true;
        one.disabled = true;
        const r = await showRewarded('offline_x2');
        if (!ADS_LIVE && r.test) toast(t('adTest'));
        finish(r.ok ? 2 : 1);
      });
      return h('div', { class: 'modal-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'welcome-title' }, [
        h('h2', { id: 'welcome-title', text: t('welcomeTitle') }),
        h('p', { text: t('welcomeBody', { h: formatDuration(report.ms) }) }),
        h('div', { class: 'amount', text: `+${formatNum(report.gold)}` }),
        dbl,
        one,
      ]);
    });
  }

  return {
    attachScene(s) {
      scene = s;
      refresh();
    },
    refresh,
    toast,
    showWelcome,
    discover,
    tryUnlock,
    openUpgrades,
  };
}
