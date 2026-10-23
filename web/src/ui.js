// HTML arayüz katmanı: üst bilgi çubuğu, ipucu, yumurta butonu, bildirimler ve pencereler.

import { CFG } from './config.js';
import { t, formatNum, formatDuration, getLang } from './i18n.js';
import { haptic } from './telegram.js';
import { showRewarded, ADS_LIVE } from './ads.js';

const $ = (id) => document.getElementById(id);

function mmss(ms) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function formatRate(r) {
  if (r < 100) {
    return r.toLocaleString(getLang() === 'tr' ? 'tr-TR' : 'en-US', { maximumFractionDigits: 1 });
  }
  return formatNum(r);
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
    toast: $('toast'),
    modal: $('modal'),
  };
  let scene = null;
  let toastTimer = null;

  // Statik metinleri dile göre doldur.
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-label]').forEach((node) => {
    node.setAttribute('aria-label', t(node.dataset.i18nLabel));
  });

  function hintText() {
    const s = store.s;
    const empty = store.emptyCells().length;
    if (s.stats.merges === 0 && store.hasMergePair()) return t('hintFirstMerge');
    if (empty === 0 && !store.hasMergePair()) return t('hintBoardFull');
    if (s.energy < CFG.eggCost && empty > 0) return t('hintNoEnergy');
    if (s.stats.eggs === 0 && empty > 0) return t('hintOpenEgg');
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
    const h = hintText();
    if (el.hint.textContent !== h) el.hint.textContent = h;
    el.eggBtn.classList.toggle('is-empty', s.energy < CFG.eggCost);
  }

  function toast(msg, ms = 2200) {
    el.toast.textContent = msg;
    el.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove('show'), ms);
  }

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

  function showWelcome(report) {
    if (!report) return;
    const m = el.modal;
    m.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'modal-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-labelledby', 'welcome-title');

    const h = document.createElement('h2');
    h.id = 'welcome-title';
    h.textContent = t('welcomeTitle');
    const p = document.createElement('p');
    p.textContent = t('welcomeBody', { h: formatDuration(report.ms) });
    const amt = document.createElement('div');
    amt.className = 'amount';
    amt.textContent = `+${formatNum(report.gold)}`;

    const dbl = document.createElement('button');
    dbl.type = 'button';
    dbl.className = 'btn btn-ad';
    dbl.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg><span></span>';
    dbl.querySelector('span').textContent = `${t('collectDouble')} · ${formatNum(report.gold * 2)}`;

    const one = document.createElement('button');
    one.type = 'button';
    one.className = 'btn btn-ghost';
    one.textContent = t('collect');

    const close = (mult) => {
      const got = store.collectOffline(report, mult);
      m.hidden = true;
      m.innerHTML = '';
      haptic('success');
      toast(t('collected', { n: formatNum(got) }));
      refresh();
    };
    one.addEventListener('click', () => close(1));
    dbl.addEventListener('click', async () => {
      dbl.disabled = true;
      one.disabled = true;
      const r = await showRewarded('offline_x2');
      if (!ADS_LIVE && r.test) toast(t('adTest'));
      close(r.ok ? 2 : 1);
    });

    card.append(h, p, amt, dbl, one);
    m.append(card);
    m.hidden = false;
    dbl.focus();
  }

  return {
    attachScene(s) {
      scene = s;
      refresh();
    },
    refresh,
    toast,
    showWelcome,
  };
}
