// HTML arayüz katmanı: üst bilgi çubuğu, ipucu, butonlar, bildirimler ve pencereler.

import { CFG, ELEMENTS, ART, artKey, HYBRIDS, HYBRID_LIST, HYBRID_START, RECIPE_LV, isHybrid, PALS, PAL_NEED, PAL_MULT, isPal } from './config.js';
import { utcDay, clockNow } from './store.js';
import { t, formatNum, formatDuration, formatClock, getLang, setLang, blobName, blobFlavor } from './i18n.js';
import { haptic, setBackButton, inviteLink, shareLink, copyText, tgUserId, CHANNEL_URL, openTgLink } from './telegram.js';
import { makeGold } from './gold.js';
import { showRewarded, adsDebug } from './ads.js';
import { sfx } from './sound.js';
import { getPref, setPref } from './prefs.js';

const $ = (id) => document.getElementById(id);
const VERSION_LABEL = 'Bloblings · v0.4';

const coinSvg = (n = 16) =>
  `<svg width="${n}" height="${n}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#FFC93C" stroke="#9A6A00" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="#C98A00" stroke-width="2"/></svg>`;
const energySvg = (n = 16) =>
  `<svg width="${n}" height="${n}" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="#4FD1E8" stroke="#0E3A44" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
const crystalSvg = (n = 16) =>
  `<svg width="${n}" height="${n}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l8 7-8 13-8-13z" fill="#FF6FB5" stroke="#8C1F57" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
const PLAY_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg>';
const COIN_SVG = coinSvg();

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

// Albümdeki her canavar: temel elementlerde Lv1-10, gizli karışımlarda Lv4-6.
function albumLevels(el) {
  if (isHybrid(el)) return Array.from({ length: ART[el] }, (_, i) => HYBRID_START + i);
  return Array.from({ length: ART[el] }, (_, i) => i + 1);
}
const ALBUM_ELS = [...ELEMENTS, ...HYBRID_LIST, ...PALS];
const ALBUM_TOTAL = ALBUM_ELS.reduce((n, el) => n + ART[el], 0);
const ELEMENT_CSS = { fire: '#FF9A6B', water: '#7CC8FF', forest: '#7FDB88', steam: '#C7B3FF', lotus: '#6FE0D0', autumn: '#FFB86B', pals: '#FF8FC0' };
const potionSvg = (n = 18) =>
  `<svg width="${n}" height="${n}" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 2.5h6M10 2.5v5L5.2 16a4.6 4.6 0 0 0 4 6.5h5.6a4.6 4.6 0 0 0 4-6.5L14 7.5v-5" fill="#B49BFF" stroke="#1A1430" stroke-width="1.8" stroke-linejoin="round"/><path d="M7 15.5h10" stroke="#E2D8FF" stroke-width="1.6"/><circle cx="10.5" cy="18" r="1.2" fill="#fff"/></svg>`;

// Bir sonraki UTC gece yarısı ve pazartesi (görev ve haftalık sıralama yenilenmesi).
function msToUtcMidnight(now) {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - now;
}
function msToMonday(now) {
  const d = new Date(now);
  const dow = (d.getUTCDay() + 6) % 7;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 7 - dow) - now;
}

export function createUI(store) {
  const el = {
    energyPill: $('energy-pill'),
    energyVal: $('energy-val'),
    energySub: $('energy-sub'),
    goldVal: $('gold-val'),
    crystalVal: $('crystal-val'),
    rateVal: $('rate-val'),
    albumBtn: $('album-btn'),
    albumVal: $('album-val'),
    dailyBtn: $('daily-btn'),
    inviteBtn: $('invite-btn'),
    questsBtn: $('quests-btn'),
    wheelBtn: $('wheel-btn'),
    topBtn: $('top-btn'),
    settingsBtn: $('settings-btn'),
    hint: $('hint'),
    eggBtn: $('egg-btn'),
    upBtn: $('up-btn'),
    toast: $('toast'),
    modal: $('modal'),
  };
  let scene = null;
  let net = null;
  let toastTimer = null;
  let lockShown = false; // tahta kilitlenince pencere bir kez çıksın
  const giftSnooze = new Set(); // tahta dolu diye bekletilen hediyeler

  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-label]').forEach((node) => {
      node.setAttribute('aria-label', t(node.dataset.i18nLabel));
    });
  }
  applyI18n();

  // ---- Pencere sırası: aynı anda tek pencere, diğerleri sırada bekler ----
  const queue = [];
  let current = null;

  function openModal(build) {
    if (current) {
      queue.push(build);
      return;
    }
    const entry = {};
    current = entry;
    // Her pencerenin kendi kapatma işlevi: geç gelen bir tıklama başka pencereyi kapatmasın.
    entry.close = () => {
      if (current === entry) closeModal();
    };
    // Pencere açıkken tahta dokunuşları dinlemesin: butona basmak alttaki yuvayı/canavarı tetiklemesin.
    if (scene) scene.input.enabled = false;
    el.modal.innerHTML = '';
    const card = build(entry.close);
    entry.update = card.update || null;
    entry.sticky = Boolean(card.sticky);
    el.modal.append(card);
    el.modal.hidden = false;
    setBackButton(entry.close);
    const focusable = card.querySelector('button:not([disabled])');
    if (focusable) focusable.focus({ preventScroll: true });
  }

  function closeModal() {
    el.modal.hidden = true;
    el.modal.innerHTML = '';
    current = null;
    const next = queue.shift();
    if (next) setTimeout(() => openModal(next), 120);
    else setBackButton(null);
    // Dokunuşun bırakılma olayı tahtaya ulaşmasın diye girişi bir sonraki karede aç.
    if (scene && !next) setTimeout(() => {
      if (!current && scene) scene.input.enabled = true;
    }, 0);
    refresh();
  }

  // Kartın dışına dokununca kapanır (ödül bekleyen pencereler hariç).
  el.modal.addEventListener('click', (e) => {
    if (e.target === el.modal && current && !current.sticky) current.close();
  });

  // ---- İpucu ----
  function hintText() {
    const s = store.s;
    const empty = store.emptyCells().length;
    if (s.stats.merges === 0 && store.hasMergePair()) return t('hintFirstMerge');
    if (s.stats.merges > 0 && store.canAffordUpgrade()) return t('hintUpgrade');
    if (empty === 0 && !store.hasMergePair()) return hasRecipePair() && !s.stats.recipes ? t('hintRecipe') : t('hintBoardFull');
    if (s.energy < CFG.eggCost && empty > 0) return t('hintNoEnergy');
    if (s.stats.eggs === 0 && empty > 0) return t('hintOpenEgg');
    if (s.stats.merges >= 1 && store.synergyLinks().length === 0) return t('hintSynergy');
    if (!s.stats.recipes && hasRecipePair()) return t('hintRecipe');
    return t('hintKeepMerging');
  }

  // Tahtada farklı elementlerden iki Lv3 var mı (gizli tarif ipucu için).
  function hasRecipePair() {
    const els = new Set();
    for (const b of store.s.board) if (b && b.lv === RECIPE_LV && ELEMENTS.includes(b.el)) els.add(b.el);
    return els.size >= 2;
  }

  // Dost canavarlar seviyeden bağımsız tek kart: herhangi bir seviyesi bulunduysa açılmıştır.
  function palKnown(e) {
    return Object.keys(store.s.discovered).some((k) => k.startsWith(`${e}-`) && !k.endsWith('*'));
  }

  // Oyuncunun bildiği hamlelere göre tahta kilitli mi (keşfedilmemiş gizli tarifler sayılmaz).
  function stuck() {
    if (store.emptyCells().length > 0) return false;
    const n = store.s.slotsOpen;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (store.canMerge(i, j) || store.knowsRecipe(i, j)) return false;
    return true;
  }

  // Artık eşi gelmeyecek küçük canavarlar: yumurta seviyesinin altında, tek başına kalmış temel canavarlar.
  function orphanCells() {
    const eggLv = 1 + store.s.eggQuality;
    const b = store.s.board;
    const out = [];
    for (let i = 0; i < store.s.slotsOpen; i++) {
      const x = b[i];
      if (!x || x.shiny || !ELEMENTS.includes(x.el) || x.lv >= eggLv) continue;
      if (x.lv === RECIPE_LV) continue; // gizli tarif için işe yarayabilir
      const twin = b.some((y, j) => j !== i && y && y.el === x.el && y.lv === x.lv);
      if (!twin) out.push(i);
    }
    return out;
  }

  function sellOrphans() {
    let gold = 0;
    let count = 0;
    for (const i of orphanCells()) {
      const res = store.sell(i);
      if (res.error) continue;
      gold += res.gold;
      count += 1;
      if (scene) scene.removeAt(i);
    }
    if (count) {
      sfx.coins();
      haptic('success');
      toast(t('soldSmall', { n: count, g: formatNum(gold) }), 2600);
    }
    refresh();
    return count;
  }

  function albumCount() {
    let n = 0;
    for (const e of ALBUM_ELS) {
      if (isPal(e)) n += palKnown(e) ? 1 : 0;
      else for (const lv of albumLevels(e)) if (store.s.discovered[`${e}-${lv}`]) n++;
    }
    return n;
  }

  function shinyCount() {
    return Object.keys(store.s.discovered).filter((k) => k.endsWith('*')).length;
  }

  function refresh() {
    const s = store.s;
    el.energyVal.textContent = `${s.energy}/${CFG.energyCap}`;
    el.energySub.textContent = s.energy >= CFG.energyCap ? t('full') : `+1 · ${formatClock(store.nextEnergyIn())}`;
    el.energyPill.classList.toggle('low', s.energy < 5);
    el.goldVal.textContent = formatNum(s.gold);
    el.crystalVal.textContent = formatNum(s.crystals);
    el.rateVal.textContent = `+${formatRate(store.goldRate())} ${t('goldPerSec')}`;
    el.albumVal.textContent = `${albumCount()}/${ALBUM_TOTAL}`;
    el.dailyBtn.classList.toggle('has-dot', store.dailyStatus().ready);
    el.wheelBtn.classList.toggle('has-dot', store.wheelStatus().free);
    el.questsBtn.classList.toggle('has-dot', store.questState().some((q) => !q.done && q.have >= q.n) || store.questBonusReady());
    const hint = hintText();
    if (el.hint.textContent !== hint) el.hint.textContent = hint;
    el.eggBtn.classList.toggle('is-empty', s.energy < CFG.eggCost);
    el.upBtn.classList.toggle('has-dot', store.canAffordUpgrade());
    if (current && current.update) current.update();
    if (!scene || current || queue.length || scene.isDragging()) return;
    // Sunucudan hediye geldiyse (ve ekranda başka pencere yoksa) göster.
    if (store.emptyCells().length) giftSnooze.clear();
    const gift = (store.s.inbox || []).find((g) => !giftSnooze.has(g.id));
    if (gift) {
      openGift(gift);
      return;
    }
    // Tahta kilitlendiyse kurtarma penceresi (her kilitlenmede bir kez).
    const locked = stuck();
    if (locked && !lockShown) {
      lockShown = true;
      openLocked();
    } else if (!locked) lockShown = false;
  }

  function toast(msg, ms = 2200) {
    el.toast.textContent = msg;
    el.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove('show'), ms);
  }

  function fail(msg) {
    sfx.error();
    haptic('error');
    toast(msg);
  }

  // Reklam izlenmediyse oyuncuya nedenini söyle; ödül verilmez.
  function adFailed(r) {
    if (r.reason === 'busy') return;
    fail(r.reason === 'skipped' ? t('adSkipped') : t('adUnavailable'));
  }

  // ---- Yumurta ----
  el.eggBtn.addEventListener('click', () => {
    if (!scene) return;
    const res = store.openEgg();
    if (res.error === 'energy') {
      sfx.error();
      haptic('error');
      // Reklam ya da kristalle doldurma imkânı varsa pencereyi aç, yoksa sadece süreyi söyle.
      if (store.adEnergyLeft() > 0 || store.s.crystals >= CFG.crystalEnergyCost) openEnergy();
      else toast(t('noEnergy', { t: formatClock(store.nextEnergyIn()) }));
    } else if (res.error === 'full') {
      sfx.error();
      haptic('warning');
      if (stuck() || orphanCells().length) openLocked();
      else toast(t('boardFull'));
    } else {
      sfx.egg();
      scene.spawn(res);
    }
    refresh();
  });

  // ---- Geliştirmeler ----
  function tryUnlock() {
    const res = store.unlockSlot();
    if (res.error === 'gold') {
      fail(t('needGold', { n: formatNum(res.need) }));
      return false;
    }
    if (res.error) return false;
    sfx.unlock();
    haptic('success');
    toast(t('slotUnlocked'));
    if (scene) scene.onSlotUnlocked(res.cell);
    refresh();
    return true;
  }

  function tryEgg() {
    const res = store.upgradeEgg();
    if (res.error === 'gold') {
      fail(t('needGold', { n: formatNum(res.need) }));
      return false;
    }
    if (res.error) return false;
    sfx.unlock();
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
    openModal((close) => {
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

      const card = h('div', { class: 'modal-card sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'up-title' }, [
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
      card.update = update;
      return card;
    });
  }

  el.upBtn.addEventListener('click', () => {
    sfx.tap();
    haptic('light');
    openUpgrades();
  });

  // ---- Enerji: bekle, reklam izle ya da kristalle doldur ----
  function openEnergy() {
    openModal((close) => {
      const val = h('b');
      const next = h('span');
      const full = h('span');
      const adBtn = h('button', { type: 'button', class: 'btn btn-ad btn-stack' });
      const adMain = h('span', { html: `${PLAY_SVG}<span></span>` });
      adMain.querySelector('span').textContent = `${t('watchAd')} · +${CFG.adEnergyAmount}`;
      adMain.insertAdjacentHTML('beforeend', energySvg(18));
      const adSub = h('span', { class: 'sub' });
      adBtn.append(adMain, adSub);

      const crBtn = h('button', { type: 'button', class: 'btn btn-crystal btn-stack' });
      const crMain = h('span', { html: `${crystalSvg(18)}<span>${CFG.crystalEnergyCost}</span><span>→</span><span>+${CFG.crystalEnergyAmount}</span>${energySvg(18)}` });
      crBtn.append(crMain);

      let busy = false;
      function update() {
        const s = store.s;
        val.textContent = `${s.energy}/${CFG.energyCap}`;
        if (s.energy >= CFG.energyCap) {
          next.textContent = t('full');
          full.textContent = '';
        } else {
          const n = store.nextEnergyIn();
          next.textContent = t('energyNext', { t: formatClock(n) });
          full.textContent = t('energyFullIn', { t: formatClock(n + (CFG.energyCap - s.energy - 1) * CFG.energyRegenMs) });
        }
        const left = store.adEnergyLeft();
        adSub.textContent = left > 0 ? t('adsLeft', { n: left }) : t('adsNone');
        adBtn.disabled = busy || left <= 0;
        crBtn.classList.toggle('cant', s.crystals < CFG.crystalEnergyCost);
        crBtn.disabled = busy;
      }

      adBtn.addEventListener('click', async () => {
        busy = true;
        update();
        const r = await showRewarded('energy');
        busy = false;
        if (!r.ok) {
          adFailed(r);
          update();
          return;
        }
        const res = store.adEnergy();
        if (res.error) {
          fail(t('adsNone'));
          update();
          return;
        }
        sfx.energy();
        haptic('success');
        close();
        toast(r.test ? `${t('energyAdded', { n: res.energy })} (test)` : t('energyAdded', { n: res.energy }));
      });

      crBtn.addEventListener('click', () => {
        const res = store.buyEnergy();
        if (res.error === 'crystals') {
          fail(t('needCrystals', { n: res.need }));
          return;
        }
        sfx.energy();
        haptic('success');
        close();
        toast(t('energyAdded', { n: res.energy }));
      });

      update();
      const card = h('div', { class: 'modal-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'en-title' }, [
        h('div', { class: 'energy-big', html: energySvg(40) }),
        h('h2', { id: 'en-title', text: t('energyTitle') }),
        h('div', { class: 'energy-stats' }, [val, next, full]),
        adBtn,
        crBtn,
        h('p', { class: 'small-note', text: t('energyTip') }),
        h('button', { type: 'button', class: 'btn btn-ghost', text: t('close'), onclick: close }),
      ]);
      card.update = update;
      card.sticky = true;
      return card;
    });
  }

  el.energyPill.addEventListener('click', () => {
    sfx.tap();
    haptic('light');
    openEnergy();
  });

  // ---- Günlük ödül takvimi ----
  function rewardView(r) {
    if (r.energy) return { ico: energySvg(26), txt: `+${r.energy}` };
    if (r.crystals) return { ico: crystalSvg(26), txt: `+${r.crystals}` };
    if (r.goldSec) return { ico: coinSvg(26), txt: `+${formatNum(Math.max(300, store.goldRate() * r.goldSec))}` };
    return { ico: '<img src="./assets/egg-rare.svg" alt="" width="46" height="46">', txt: t('rareEgg') };
  }

  function openDaily() {
    openModal((close) => {
      const grid = h('div', { class: 'daily-grid' });
      const btn = h('button', { type: 'button', class: 'btn btn-primary' });
      let lastKey = '';

      function paint() {
        const st = store.dailyStatus();
        const claimed = st.ready ? st.nextDay - 1 : st.streak;
        const key = `${st.ready}-${claimed}-${getLang()}`;
        if (key !== lastKey) {
          lastKey = key;
          grid.innerHTML = '';
          CFG.dailyRewards.forEach((r, i) => {
            const day = i + 1;
            const v = rewardView(r);
            const big = Boolean(r.rareEgg);
            const cls = ['day', big ? 'big' : '', day <= claimed ? 'done' : '', st.ready && day === st.nextDay ? 'today' : ''];
            const tile = h('div', { class: cls.filter(Boolean).join(' ') });
            const ico = h('span', { class: 'r-ico', html: v.ico });
            if (big) {
              tile.append(ico, h('span', { class: 'r-txt' }, [h('span', { text: t('dayN', { n: day }) }), h('b', { text: v.txt })]));
            } else {
              tile.append(h('span', { text: t('dayN', { n: day }) }), ico, h('b', { text: v.txt }));
            }
            grid.append(tile);
          });
        }
        if (st.ready) {
          btn.disabled = false;
          btn.textContent = t('claim');
        } else {
          btn.disabled = true;
          btn.textContent = t('dailyNext', { t: formatClock(st.nextIn) });
        }
      }

      btn.addEventListener('click', () => {
        const res = store.claimDaily();
        if (res.error) {
          fail(t('dailyNext', { t: formatClock(res.nextIn || 0) }));
          paint();
          return;
        }
        sfx.coins();
        haptic('success');
        close();
        toast(t('dailyGot', { n: res.day }));
        if (res.blob && scene) scene.spawn({ cell: res.cell, blob: res.blob, discovered: res.discovered, shinyNew: res.shinyNew });
        refresh();
      });

      paint();
      const card = h('div', { class: 'modal-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'daily-title' }, [
        h('h2', { id: 'daily-title', text: t('dailyTitle') }),
        h('p', { class: 'small-note', text: t('dailyBody') }),
        grid,
        btn,
        h('button', { type: 'button', class: 'btn btn-ghost', text: t('close'), onclick: close }),
      ]);
      card.update = paint;
      return card;
    });
  }

  el.dailyBtn.addEventListener('click', () => {
    sfx.tap();
    haptic('light');
    openDaily();
  });

  // ---- Albüm ----
  let albumTab = 'fire';

  function albumImg(e, lv, gold) {
    const img = h('img', { src: `./assets/blobs/${artKey(e, lv)}.svg`, alt: '', draggable: 'false' });
    return gold ? makeGold(img) : img;
  }

  function openAlbum() {
    openModal((close) => {
      const n = albumCount();
      const detail = h('div', { class: 'album-detail' }, [h('p', { class: 'small-note', text: t('albumTap') })]);
      const pane = h('div', { class: 'album-pane' });
      const tabs = h('div', { class: 'album-tabs', role: 'tablist' });
      const cells = [];

      function showDetail(e, lv) {
        const d = store.s.discovered;
        const known = Boolean(d[`${e}-${lv}`]);
        detail.innerHTML = '';
        if (isPal(e)) {
          const got = palKnown(e);
          detail.append(
            h('b', { text: got ? blobName(e, 1) : '???' }),
            h('span', { class: 'meta', text: `${t(e)} · x${PAL_MULT}` }),
            h('p', { text: got ? blobFlavor(e, 1) : t('albumHowPal', { n: PAL_NEED[e] }) }),
          );
          return;
        }
        if (known) {
          detail.append(
            h('b', { text: blobName(e, lv) }),
            h('span', { class: 'meta', text: `Lv${lv} · ${t(e)}` }),
            h('p', { text: blobFlavor(e, lv) }),
          );
          if (d[`${e}-${lv}*`]) detail.append(h('span', { class: 'meta', text: `✦ ${t('albumShinyFound')}`, style: 'color:#FFC93C' }));
          return;
        }
        let how;
        if (isHybrid(e)) {
          const [a, b] = HYBRIDS[e];
          how = lv === HYBRID_START ? t('albumHowRecipe', { a: t(a), b: t(b) }) : t('albumHowMerge', { n: lv - 1, el: knownHybrid(e) ? t(e) : '???' });
        } else {
          how = lv === 1 ? t('albumHowEgg') : t('albumHowMerge', { n: lv - 1, el: t(e) });
        }
        detail.append(
          h('b', { text: '???' }),
          h('span', { class: 'meta', text: `Lv${lv} · ${isHybrid(e) && !knownHybrid(e) ? '???' : t(e)} · ${t('albumLocked')}` }),
          h('p', { text: how }),
        );
      }

      function cell(e, lv) {
        const d = store.s.discovered;
        if (isPal(e)) {
          const got = palKnown(e);
          const btn = h('button', { type: 'button', class: `album-cell${got ? '' : ' locked'}`, 'aria-label': got ? blobName(e, 1) : t('albumLocked') }, [
            albumImg(e, 1, false),
            h('small', { text: got ? '♥' : `${PAL_NEED[e]}` }),
          ]);
          btn.addEventListener('click', () => {
            sfx.tap();
            cells.forEach((c) => c.classList.remove('sel'));
            btn.classList.add('sel');
            showDetail(e, 1);
          });
          cells.push(btn);
          return btn;
        }
        const known = Boolean(d[`${e}-${lv}`]);
        const shiny = Boolean(d[`${e}-${lv}*`]);
        const secret = isHybrid(e) && !known;
        const cls = ['album-cell', known ? '' : 'locked', secret ? 'secret' : '', shiny ? 'has-shiny' : ''].filter(Boolean).join(' ');
        const btn = h('button', { type: 'button', class: cls, 'aria-label': known ? blobName(e, lv) : t('albumLocked') }, secret ? [h('span', { text: '?' })] : [albumImg(e, lv, false), h('small', { text: String(lv) })]);
        if (shiny) btn.append(h('span', { class: 'shine', text: '✦', 'aria-hidden': 'true' }));
        btn.addEventListener('click', () => {
          sfx.tap();
          cells.forEach((c) => c.classList.remove('sel'));
          btn.classList.add('sel');
          showDetail(e, lv);
        });
        cells.push(btn);
        return btn;
      }

      function knownHybrid(e) {
        return albumLevels(e).some((lv) => store.s.discovered[`${e}-${lv}`]);
      }

      function paintPane() {
        pane.innerHTML = '';
        cells.length = 0;
        detail.innerHTML = '';
        detail.append(h('p', { class: 'small-note', text: t('albumTap') }));
        if (albumTab === 'secret') {
          for (const e of HYBRID_LIST) {
            const [a, b] = HYBRIDS[e];
            const grid = h('div', { class: 'album-grid three' }, albumLevels(e).map((lv) => cell(e, lv)));
            const label = h('span', { style: `color:${ELEMENT_CSS[e]}` }, [document.createTextNode(knownHybrid(e) ? t(e) : '???'), h('small', { text: `${t(a)} + ${t(b)}` })]);
            pane.append(h('div', { class: 'album-row recipe-row' }, [label, grid]));
          }
        } else if (albumTab === 'pals') {
          pane.append(h('div', { class: 'album-grid three' }, PALS.map((e) => cell(e, 1))));
          pane.append(h('p', { class: 'small-note', text: t('inviteBody', { n: CFG.referralMerges, c: CFG.giftCrystals }) }));
        } else {
          const e = albumTab;
          pane.append(h('div', { class: 'album-grid' }, albumLevels(e).map((lv) => cell(e, lv))));
        }
        for (const b of tabs.children) b.setAttribute('aria-selected', String(b.dataset.tab === albumTab));
      }

      for (const tab of [...ELEMENTS, 'secret', 'pals']) {
        const label = tab === 'secret' ? `✦ ${t('secretTab')}` : tab === 'pals' ? `♥ ${t('palsTab')}` : t(tab);
        const b = h('button', { type: 'button', role: 'tab', text: label, 'data-tab': tab });
        if (tab !== 'secret') b.style.color = ELEMENT_CSS[tab];
        b.addEventListener('click', () => {
          sfx.tap();
          albumTab = tab;
          paintPane();
        });
        tabs.append(b);
      }
      paintPane();

      const bar = h('div', { class: 'album-bar' }, [h('i', { style: `width:${Math.round((n / ALBUM_TOTAL) * 100)}%` })]);
      const shinies = shinyCount();
      return h('div', { class: 'modal-card album', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'album-title' }, [
        h('h2', { id: 'album-title', text: t('albumTitle') }),
        h('div', { class: 'album-meta-row' }, [
          h('span', { class: 'album-meta', text: t('albumProgress', { n, m: ALBUM_TOTAL }) }),
          shinies ? h('span', { class: 'album-meta gold', text: `✦ ${t('albumShiny', { n: shinies })}` }) : null,
        ]),
        bar,
        tabs,
        pane,
        detail,
        h('button', { type: 'button', class: 'btn btn-ghost', text: t('close'), onclick: close }),
      ]);
    });
  }

  el.albumBtn.addEventListener('click', () => {
    sfx.tap();
    haptic('light');
    openAlbum();
  });

  // ---- Canavar kartı: dokununca açılır (sat / Sihirli İksir) ----
  function blobInfo(cell) {
    const b = store.s.board[cell];
    // İlk birleştirmeden önce kart açılmasın: yeni oyuncu yanlışlıkla canavarını satmasın.
    if (!b || current || store.s.stats.merges === 0) return;
    openModal((close) => {
      const img = h('img', { class: 'blob-img', src: `./assets/blobs/${artKey(b.el, b.lv)}.svg`, alt: '' });
      if (b.shiny) makeGold(img);
      const value = store.sellValue(cell);
      const sellBtn = h('button', { type: 'button', class: 'btn btn-sell' });
      const paintSell = () => {
        sellBtn.classList.remove('sure');
        sellBtn.innerHTML = `<span></span>${COIN_SVG}`;
        sellBtn.querySelector('span').textContent = t('sellFor', { n: formatNum(value) });
      };
      paintSell();
      let sure = false;
      let sureTimer = null;
      sellBtn.addEventListener('click', () => {
        // Değerli canavarlar yanlışlıkla satılmasın: ikinci dokunuşta satılır.
        const precious = b.lv >= 4 || b.shiny || isPal(b.el) || isHybrid(b.el);
        if (precious && !sure) {
          sure = true;
          haptic('warning');
          sellBtn.classList.add('sure');
          sellBtn.textContent = t('sellSure');
          clearTimeout(sureTimer);
          sureTimer = setTimeout(() => {
            sure = false;
            paintSell();
          }, 2500);
          return;
        }
        clearTimeout(sureTimer);
        const res = store.sell(cell);
        close();
        if (res.error) return;
        sfx.coin();
        haptic('medium');
        if (scene) scene.removeAt(cell);
        toast(t('sold', { n: formatNum(res.gold) }));
        refresh();
      });

      const potionBtn = h('button', { type: 'button', class: 'btn' });
      const paintPotion = () => {
        if (store.s.potions > 0) {
          potionBtn.className = 'btn btn-primary';
          potionBtn.innerHTML = `${potionSvg(20)}<span></span>`;
          potionBtn.querySelector('span').textContent = t('potionUse', { n: store.s.potions });
          potionBtn.disabled = false;
        } else {
          const left = store.adPotionLeft();
          potionBtn.className = 'btn btn-ad';
          potionBtn.innerHTML = `${PLAY_SVG}<span></span>${potionSvg(18)}`;
          potionBtn.querySelector('span').textContent = left > 0 ? t('potionAd') : t('potionNone');
          potionBtn.disabled = left <= 0;
        }
      };
      paintPotion();
      potionBtn.addEventListener('click', async () => {
        if (store.s.potions > 0) {
          const res = store.usePotion(cell);
          close();
          if (res.error) return;
          sfx.unlock();
          haptic('success');
          if (scene) scene.replaceAt(cell, res.blob);
          if (res.discovered || res.shinyNew) setTimeout(() => discover(res.blob, { isNew: res.discovered, shinyNew: res.shinyNew }), 450);
          refresh();
          return;
        }
        potionBtn.disabled = true;
        const r = await showRewarded('potion');
        if (!r.ok) {
          adFailed(r);
          paintPotion();
          return;
        }
        const res = store.adPotion();
        if (res.error) {
          fail(t('potionNone'));
        } else {
          sfx.energy();
          haptic('success');
          toast(r.test ? `${t('potionGot')} (test)` : t('potionGot'));
        }
        paintPotion();
      });

      return h('div', { class: 'modal-card blob-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'blob-title' }, [
        img,
        h('h2', { id: 'blob-title', text: blobName(b.el, b.lv) }),
        h('div', { class: 'meta', text: `Lv${b.lv} · ${t(b.el)}${b.shiny ? ' · ✦' : ''}` }),
        h('div', { class: 'rate-line', text: `+${formatRate(store.blobRate(cell))} ${t('goldPerSec')}` }),
        h('p', { class: 'small-note', text: t('potionDesc') }),
        potionBtn,
        sellBtn,
        h('button', { type: 'button', class: 'btn btn-ghost', text: t('close'), onclick: close }),
      ]);
    });
  }

  // ---- Tahta kilitlenince kurtarma ----
  function openLocked() {
    openModal((close) => {
      const adBtn = h('button', { type: 'button', class: 'btn btn-ad', html: `${PLAY_SVG}<span></span>${potionSvg(18)}` });
      adBtn.querySelector('span').textContent = t('potionAd');
      adBtn.disabled = store.adPotionLeft() <= 0;
      adBtn.addEventListener('click', async () => {
        adBtn.disabled = true;
        const r = await showRewarded('potion');
        if (!r.ok) {
          adFailed(r);
          adBtn.disabled = false;
          return;
        }
        const res = store.adPotion();
        close();
        if (res.error) {
          fail(t('potionNone'));
          return;
        }
        sfx.energy();
        haptic('success');
        toast(r.test ? `${t('potionGot')} (test)` : t('potionGot'), 3200);
      });
      const orphans = orphanCells();
      let sellSmall = null;
      if (orphans.length) {
        const value = orphans.reduce((a, i) => a + store.sellValue(i), 0);
        sellSmall = h('button', { type: 'button', class: 'btn btn-primary', html: `<span></span>${COIN_SVG}` });
        sellSmall.querySelector('span').textContent = t('sellSmall', { n: orphans.length, g: formatNum(value) });
        sellSmall.addEventListener('click', () => {
          close();
          sellOrphans();
        });
      }
      return h('div', { class: 'modal-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'lock-title' }, [
        h('div', { class: 'energy-big', html: potionSvg(40), style: 'background:#2f2457' }),
        h('h2', { id: 'lock-title', text: t('lockedTitle') }),
        h('p', { text: t('lockedBody') }),
        store.s.potions > 0 ? h('p', { class: 'small-note', text: t('lockedHasPotion', { n: store.s.potions }), style: 'color:#C7B3FF' }) : null,
        orphans.length ? h('p', { class: 'small-note', text: t('orphanNote', { lv: 1 + store.s.eggQuality }) }) : null,
        sellSmall,
        store.adPotionLeft() > 0 ? adBtn : null,
        h('button', { type: 'button', class: sellSmall ? 'btn btn-ghost' : 'btn btn-primary', text: t('ok'), onclick: close }),
      ]);
    });
  }

  // ---- Şans çarkı ----
  let wheelRot = 0;
  const ICONS = {
    coin: '<circle cx="12" cy="12" r="9" fill="#FFC93C" stroke="#1A1430" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="#C98A00" stroke-width="2"/>',
    crystal: '<path d="M12 2l8 7-8 13-8-13z" fill="#FF6FB5" stroke="#1A1430" stroke-width="1.8" stroke-linejoin="round"/>',
    energy: '<path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="#4FD1E8" stroke="#1A1430" stroke-width="1.8" stroke-linejoin="round"/>',
    potion: '<path d="M9 2.5h6M10 2.5v5L5.2 16a4.6 4.6 0 0 0 4 6.5h5.6a4.6 4.6 0 0 0 4-6.5L14 7.5v-5" fill="#B49BFF" stroke="#1A1430" stroke-width="1.8" stroke-linejoin="round"/>',
  };

  function wheelIcon(p) {
    const ic = (name) => `<svg x="-13" y="-27" width="26" height="26" viewBox="0 0 24 24">${ICONS[name]}</svg>`;
    const label = (txt) => `<text y="15" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="15" fill="#1A1430">${txt}</text>`;
    if (p.goldSec) return ic('coin') + label(`${Math.round(p.goldSec / 60)}${t('minShort')}`);
    if (p.crystals) return ic('crystal') + label(p.crystals);
    if (p.energy) return ic('energy') + label(p.energy);
    if (p.potion) return ic('potion') + label(`x${p.potion}`);
    return '<image href="./assets/egg-rare.svg" x="-19" y="-24" width="38" height="38"/>';
  }

  function wheelSvg() {
    const n = CFG.wheel.length;
    const seg = 360 / n;
    const R = 118;
    const c = 125;
    const colors = ['#FF8FC0', '#8FE0FF', '#FFE08A', '#A6E86B'];
    let paths = '';
    let icons = '';
    CFG.wheel.forEach((p, i) => {
      const mid = -90 + i * seg;
      const a0 = ((mid - seg / 2) * Math.PI) / 180;
      const a1 = ((mid + seg / 2) * Math.PI) / 180;
      const p0 = `${(c + R * Math.cos(a0)).toFixed(1)} ${(c + R * Math.sin(a0)).toFixed(1)}`;
      const p1 = `${(c + R * Math.cos(a1)).toFixed(1)} ${(c + R * Math.sin(a1)).toFixed(1)}`;
      paths += `<path d="M${c} ${c}L${p0}A${R} ${R} 0 0 1 ${p1}Z" fill="${colors[i % colors.length]}" stroke="#1A1430" stroke-width="3" stroke-linejoin="round"/>`;
      const r2 = R * 0.66;
      const mx = (c + r2 * Math.cos((mid * Math.PI) / 180)).toFixed(1);
      const my = (c + r2 * Math.sin((mid * Math.PI) / 180)).toFixed(1);
      icons += `<g transform="translate(${mx} ${my}) rotate(${mid + 90})">${wheelIcon(p)}</g>`;
    });
    return `<svg viewBox="0 0 250 250" aria-hidden="true"><circle cx="125" cy="125" r="123" fill="#1A1430"/>${paths}${icons}</svg>`;
  }

  function prizeText(res) {
    const parts = [];
    if (res.gold) parts.push(t('prizeGold', { n: formatNum(res.gold) }));
    if (res.crystals) parts.push(t('prizeCrystals', { n: res.crystals }));
    if (res.energy) parts.push(t('prizeEnergy', { n: res.energy }));
    if (res.potion) parts.push(t('prizePotion'));
    if (res.blob) parts.push(t('prizeEgg'));
    return parts.join(', ');
  }

  function openWheel() {
    openModal((close) => {
      const rot = h('div', { class: 'wheel-rot', html: wheelSvg() });
      rot.style.transform = `rotate(${wheelRot}deg)`;
      const wrap = h('div', { class: 'wheel-wrap' }, [h('div', { class: 'wheel-pin' }), rot, h('div', { class: 'wheel-hub' })]);
      const btn = h('button', { type: 'button', class: 'btn btn-primary' });
      const sub = h('p', { class: 'small-note' });
      let spinning = false;

      function paint() {
        const st = store.wheelStatus();
        if (st.free) {
          btn.className = 'btn btn-primary';
          btn.textContent = t('wheelFree');
          btn.disabled = spinning;
          sub.textContent = t('wheelAdsLeft', { n: st.adsLeft });
        } else if (st.adsLeft > 0) {
          btn.className = 'btn btn-ad';
          btn.innerHTML = `${PLAY_SVG}<span></span>`;
          btn.querySelector('span').textContent = t('wheelAd');
          btn.disabled = spinning;
          sub.textContent = t('wheelAdsLeft', { n: st.adsLeft });
        } else {
          btn.className = 'btn btn-ghost';
          btn.textContent = t('wheelNone');
          btn.disabled = true;
          sub.textContent = '';
        }
      }

      btn.addEventListener('click', async () => {
        if (spinning) return;
        const st = store.wheelStatus();
        let viaAd = false;
        spinning = true;
        paint();
        if (!st.free) {
          if (st.adsLeft <= 0) {
            spinning = false;
            paint();
            return;
          }
          const r = await showRewarded('wheel');
          if (!r.ok) {
            spinning = false;
            adFailed(r);
            paint();
            return;
          }
          viaAd = true;
        }
        const res = store.spin(undefined, viaAd);
        if (res.error) {
          spinning = false;
          paint();
          return;
        }
        // Çark, kazanılan dilim üstteki oka gelecek şekilde döner.
        const seg = 360 / CFG.wheel.length;
        const target = (360 - res.slot * seg) % 360;
        const cur = ((wheelRot % 360) + 360) % 360;
        wheelRot += 360 * 5 + ((target - cur + 360) % 360);
        rot.style.transform = `rotate(${wheelRot}deg)`;
        let k = 0;
        const ticks = setInterval(() => {
          sfx.tap();
          if (++k > 18) clearInterval(ticks);
        }, 150);
        const dur = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches ? 450 : 3500;
        setTimeout(() => {
          clearInterval(ticks);
          spinning = false;
          sfx.coins();
          haptic('success');
          toast(t('wheelWin', { p: prizeText(res) }), 2800);
          if (res.blob && scene) scene.spawn({ cell: res.cell, blob: res.blob, discovered: res.discovered, shinyNew: res.shinyNew });
          refresh();
          paint();
        }, dur);
      });
      paint();
      return h('div', { class: 'modal-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'wheel-title' }, [
        h('h2', { id: 'wheel-title', text: t('wheelTitle') }),
        wrap,
        btn,
        sub,
        h('button', { type: 'button', class: 'btn btn-ghost', text: t('close'), onclick: close }),
      ]);
    });
  }

  // ---- Günlük görevler ----
  function openQuests() {
    openModal((close) => {
      const list = h('div', { style: 'width:100%;display:flex;flex-direction:column;gap:8px' });
      const resetNote = h('p', { class: 'small-note' });
      let lastKey = '';

      function claimBtn(onClick, reward) {
        const b = h('button', { type: 'button', class: 'btn-buy', html: `<span>${t('questClaim')}</span>` });
        if (reward) b.insertAdjacentHTML('beforeend', reward);
        b.addEventListener('click', onClick);
        return b;
      }

      function paint() {
        const qs = store.questState();
        const q = store.s.quests;
        const bonusDone = Boolean(q && q.day === utcDay(clockNow()) && q.bonus);
        const bonusReady = store.questBonusReady();
        resetNote.textContent = t('questsReset', { t: formatClock(msToUtcMidnight(clockNow())) });
        const key = JSON.stringify([qs, bonusDone, bonusReady, getLang()]);
        if (key === lastKey) return;
        lastKey = key;
        list.innerHTML = '';
        for (const x of qs) {
          let right;
          if (x.done) right = h('span', { class: 'q-check', text: '✓' });
          else if (x.have >= x.n) {
            right = claimBtn(() => {
              const res = store.claimQuest(x.i);
              if (res.error) return;
              sfx.coins();
              haptic('success');
              toast(t('crystalsAdded', { n: res.crystals }));
              refresh();
              paint();
            }, crystalSvg(16));
          } else right = h('span', { class: 'q-reward', html: `+${x.r}${crystalSvg(16)}` });
          list.append(
            h('div', { class: `quest${x.done ? ' done' : ''}` }, [
              h('div', { class: 'q-text' }, [
                h('b', { text: t(`q_${x.k}`, { n: x.n }) }),
                h('div', { class: 'q-bar' }, [h('i', { style: `width:${Math.round((x.have / x.n) * 100)}%` })]),
                h('small', { class: 'small-note', text: `${x.have}/${x.n}` }),
              ]),
              right,
            ]),
          );
        }
        let bonusRight;
        if (bonusDone) bonusRight = h('span', { class: 'q-check', text: '✓' });
        else if (bonusReady) {
          bonusRight = claimBtn(() => {
            const res = store.claimQuestBonus();
            if (res.error) return;
            sfx.coins();
            haptic('success');
            toast(t('potionGot'), 3000);
            refresh();
            paint();
          });
        } else bonusRight = h('span', { class: 'q-reward', html: potionSvg(20) });
        list.append(h('div', { class: `quest quest-bonus${bonusDone ? ' done' : ''}` }, [h('div', { class: 'q-text' }, [h('b', { text: t('questBonus', { n: CFG.questBonusCrystals }) })]), bonusRight]));
      }
      paint();
      const card = h('div', { class: 'modal-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'q-title' }, [
        h('h2', { id: 'q-title', text: t('questsTitle') }),
        list,
        resetNote,
        h('button', { type: 'button', class: 'btn btn-ghost', text: t('close'), onclick: close }),
      ]);
      card.update = paint;
      return card;
    });
  }

  // ---- Haftalık sıralama ----
  function openTop() {
    openModal((close) => {
      const body = h('div', { class: 'top-list' }, [h('p', { class: 'small-note', text: t('topLoading') })]);
      const meLine = h('div', { class: 'album-meta' });
      const reset = h('p', { class: 'small-note' });
      const upd = () => {
        reset.textContent = t('topReset', { t: formatClock(msToMonday(clockNow())) });
      };
      upd();
      const show = (r) => {
        body.innerHTML = '';
        if (!r.ok) {
          body.append(h('p', { class: 'small-note', text: r.reason === 'disabled' ? t('topOnlyTg') : t('topError') }));
          return;
        }
        if (!r.top.length) body.append(h('p', { class: 'small-note', text: t('topEmpty') }));
        for (const row of r.top) {
          body.append(
            h('div', { class: `top-row r${row.rank}${row.me ? ' me' : ''}` }, [
              h('span', { class: 'rk', text: String(row.rank) }),
              h('span', { class: 'nm', text: row.me ? `${row.name} (${t('topYou')})` : row.name }),
              h('span', { class: 'gd', text: formatNum(row.earned) }),
            ]),
          );
        }
        if (r.me) meLine.textContent = t('topRank', { n: r.me.rank });
      };
      if (net) net.top().then(show);
      else show({ ok: false, reason: 'disabled' });
      const card = h('div', { class: 'modal-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'top-title' }, [
        h('h2', { id: 'top-title', text: t('topTitle') }),
        h('p', { class: 'small-note', text: t('topSub') }),
        meLine,
        body,
        reset,
        h('button', { type: 'button', class: 'btn btn-ghost', text: t('close'), onclick: close }),
      ]);
      card.update = upd;
      return card;
    });
  }

  for (const [btn, open] of [
    [el.questsBtn, () => openQuests()],
    [el.wheelBtn, () => openWheel()],
    [el.topBtn, () => openTop()],
  ]) {
    btn.addEventListener('click', () => {
      sfx.tap();
      haptic('light');
      open();
    });
  }

  // ---- Ayarlar ----
  function switchRow(label, key, onChange) {
    const sw = h('button', { type: 'button', class: 'switch', role: 'switch', 'aria-checked': String(Boolean(getPref(key))), 'aria-label': label });
    sw.addEventListener('click', () => {
      const v = !getPref(key);
      setPref(key, v);
      sw.setAttribute('aria-checked', String(v));
      if (onChange) onChange(v);
    });
    return h('div', { class: 'set-row' }, [h('b', { text: label }), sw]);
  }

  function openSettings() {
    openModal((close) => {
      const seg = h('div', { class: 'seg', role: 'group', 'aria-label': t('langLabel') });
      for (const [code, name] of [
        ['tr', 'Türkçe'],
        ['en', 'English'],
      ]) {
        const b = h('button', { type: 'button', text: name, 'aria-pressed': String(getLang() === code) });
        b.addEventListener('click', () => {
          if (getLang() === code) return;
          setPref('lang', code);
          setLang(code);
          applyI18n();
          if (scene) scene.rebuild();
          sfx.tap();
          close();
          openSettings();
        });
        seg.append(b);
      }
      return h('div', { class: 'modal-card sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'set-title' }, [
        h('h2', { id: 'set-title', text: t('settingsTitle') }),
        switchRow(t('soundLabel'), 'sound', (on) => on && sfx.tap()),
        switchRow(t('hapticsLabel'), 'haptics', (on) => on && haptic('medium')),
        h('div', { class: 'set-row' }, [h('b', { text: t('langLabel') }), seg]),
        channelButton(),
        h('span', { class: 'version', text: adsDebug() ? `${VERSION_LABEL} · ads debug` : VERSION_LABEL, style: 'text-align:center' }),
        h('button', { type: 'button', class: 'btn btn-ghost', text: t('close'), onclick: close }),
      ]);
    });
  }

  el.settingsBtn.addEventListener('click', () => {
    sfx.tap();
    haptic('light');
    openSettings();
  });

  // ---- Keşif kartı (yeni canavar, gizli tarif ya da parlak) ----
  function discover(blob, opts = {}) {
    const recipe = Array.isArray(opts.parents) && isHybrid(blob.el);
    const shinyOnly = blob.shiny && opts.shinyNew && opts.isNew === false;
    haptic('success');
    sfx.discover();
    if (blob.shiny) setTimeout(() => sfx.coins(), 500);
    openModal((close) => {
      const img = h('img', { class: 'discover-img', src: `./assets/blobs/${artKey(blob.el, blob.lv)}.svg`, alt: '', width: '168', height: '168' });
      if (blob.shiny) makeGold(img);
      let tag = h('span', { class: 'tag', text: t('newDiscovery') });
      if (recipe) tag = h('span', { class: 'tag recipe', text: t('secretRecipe') });
      else if (isPal(blob.el)) tag = h('span', { class: 'tag', text: `♥ ${t('palTag')}` });
      else if (shinyOnly || blob.shiny) tag = h('span', { class: 'tag shiny', text: `✦ ${t('shinyTag')}` });
      const meta = recipe ? `Lv${blob.lv} · ${t(blob.el)} · ${t('recipeMeta', { a: t(opts.parents[0]), b: t(opts.parents[1]) })}` : `Lv${blob.lv} · ${t(blob.el)}`;
      return h('div', { class: 'modal-card discover', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'disc-title' }, [
        tag,
        img,
        h('h2', { id: 'disc-title', text: blobName(blob.el, blob.lv) }),
        h('div', { class: 'meta', text: meta }),
        h('p', { class: 'flavor', text: blobFlavor(blob.el, blob.lv) }),
        blob.shiny ? h('p', { class: 'small-note', text: `✦ ${t('shinyDesc')}`, style: 'color:#FFE08A' }) : null,
        h('button', { type: 'button', class: 'btn btn-primary', text: t('awesome'), onclick: close }),
      ]);
    });
  }

  // ---- Telegram kanalı ----
  // İlk katılışta bir kez kristal verir; sonra sadece kanalı açar.
  function channelButton(cls = 'btn btn-crystal') {
    if (!CHANNEL_URL) return null;
    const btn = h('button', { type: 'button', class: cls });
    const paint = () => {
      const first = !store.s.flags.channel;
      btn.innerHTML = '';
      btn.append(h('span', { text: first ? t('channelJoin') : t('channelGo') }));
      if (first) btn.insertAdjacentHTML('beforeend', `<span>· +${CFG.channelReward}</span>${crystalSvg(18)}`);
    };
    paint();
    btn.addEventListener('click', () => {
      sfx.tap();
      haptic('light');
      openTgLink(CHANNEL_URL);
      if (!store.s.flags.channel) {
        const res = store.joinChannel();
        if (!res.error) {
          sfx.coins();
          toast(t('crystalsAdded', { n: res.crystals }));
        }
      }
      paint();
      refresh();
    });
    return btn;
  }

  // ---- Arkadaş daveti ----
  function openInvite() {
    openModal((close) => {
      const link = inviteLink();
      const hasUser = Boolean(tgUserId());
      const share = h('button', { type: 'button', class: 'btn btn-primary', text: t('inviteShare') });
      const copy = h('button', { type: 'button', class: 'btn btn-ghost', text: t('inviteCopy') });
      share.disabled = !hasUser;
      copy.disabled = !hasUser;
      share.addEventListener('click', () => {
        sfx.tap();
        haptic('light');
        shareLink(link, t('shareText'));
      });
      copy.addEventListener('click', async () => {
        const ok = await copyText(`${t('shareText')} ${link}`);
        sfx.tap();
        toast(ok ? t('inviteCopied') : link, ok ? 1800 : 5000);
      });
      return h('div', { class: 'modal-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'inv-title' }, [
        h('div', { class: 'invite-hero', 'aria-hidden': 'true' }, [
          h('img', { src: './assets/blobs/fire-2.svg', alt: '' }),
          h('img', { class: 'egg', src: './assets/egg-rare.svg', alt: '' }),
          h('img', { src: './assets/blobs/water-2.svg', alt: '' }),
        ]),
        h('h2', { id: 'inv-title', text: t('inviteTitle') }),
        h('p', { text: t('inviteBody', { n: CFG.referralMerges, c: CFG.giftCrystals }) }),
        h('div', { class: 'album-meta', text: t('inviteCount', { n: store.s.stats.friends || 0 }) }),
        h('b', { text: t('invitePalsTitle'), style: 'font-size:14px' }),
        h('div', { class: 'pal-row' }, PALS.map((e) => {
          const got = palKnown(e);
          const tile = h('div', { class: `pal-tile ${got ? 'got' : 'locked'}` }, [
            h('img', { src: `./assets/blobs/${artKey(e, 1)}.svg`, alt: '' }),
            h('span', { text: got ? blobName(e, 1) : t('invitePalNeed', { n: PAL_NEED[e] }) }),
          ]);
          return tile;
        })),
        hasUser ? h('div', { class: 'invite-link', text: link }) : h('p', { class: 'small-note', text: t('inviteNoUser') }),
        share,
        copy,
        channelButton(),
        h('button', { type: 'button', class: 'btn btn-ghost', text: t('close'), onclick: close }),
      ]);
    });
  }

  el.inviteBtn.addEventListener('click', () => {
    sfx.tap();
    haptic('light');
    openInvite();
  });

  // ---- Hediye (davet ödülü) ----
  function openGift(gift) {
    openModal((close) => {
      const name = gift.name || t('aFriend');
      const invited = gift.kind === 'invited';
      const btn = h('button', { type: 'button', class: 'btn btn-primary', text: t('openGift') });
      btn.addEventListener('click', () => {
        const res = store.claimGift(gift.id);
        if (res.error === 'full') {
          giftSnooze.add(gift.id);
          close();
          fail(t('giftFull'));
          return;
        }
        close();
        if (res.error) return;
        sfx.coins();
        haptic('success');
        if (res.blob && scene) scene.spawn({ cell: res.cell, blob: res.blob, discovered: res.discovered, shinyNew: res.shinyNew });
        if (res.crystals) toast(t('crystalsAdded', { n: res.crystals }));
        refresh();
      });
      const card = h('div', { class: 'modal-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'gift-title' }, [
        h('img', { class: 'gift-egg', src: './assets/egg-rare.svg', alt: '' }),
        h('h2', { id: 'gift-title', text: invited ? t('giftInvitedTitle') : t('giftFriendTitle') }),
        h('p', { text: invited ? t('giftInvitedBody', { name }) : t('giftFriendBody', { name, n: CFG.referralMerges, c: CFG.giftCrystals }) }),
        btn,
      ]);
      card.sticky = true;
      return card;
    });
  }

  // ---- Hoş geldin (çevrimdışı kazanç) ----
  function showWelcome(report) {
    if (!report) return;
    openModal((close) => {
      const dbl = h('button', { type: 'button', class: 'btn btn-ad', html: `${PLAY_SVG}<span></span>` });
      dbl.querySelector('span').textContent = `${t('collectDouble')} · ${formatNum(report.gold * 2)}`;
      const one = h('button', { type: 'button', class: 'btn btn-ghost', text: t('collect') });
      // Altın zaten kasaya eklendi; "2 katı" reklam karşılığı aynı miktarı bir kez daha verir.
      const finish = (extra) => {
        close();
        sfx.coins();
        haptic('success');
        toast(t('collected', { n: formatNum(report.gold + extra) }));
      };
      one.addEventListener('click', () => finish(0));
      dbl.addEventListener('click', async () => {
        dbl.disabled = true;
        one.disabled = true;
        const r = await showRewarded('offline_x2');
        if (!r.ok) {
          // Reklam izlenmedi: pencere açık kalır, oyuncu tekrar deneyebilir ya da normal toplar.
          dbl.disabled = false;
          one.disabled = false;
          adFailed(r);
          return;
        }
        const res = store.claimOfflineBonus();
        finish(res.gold || 0);
        if (r.test) setTimeout(() => toast(t('adTest')), 1800);
      });
      const card = h('div', { class: 'modal-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'welcome-title' }, [
        h('h2', { id: 'welcome-title', text: t('welcomeTitle') }),
        h('p', { text: t('welcomeBody', { h: formatDuration(report.ms) }) }),
        h('div', { class: 'amount', text: `+${formatNum(report.gold)}` }),
        dbl,
        one,
      ]);
      card.sticky = true;
      return card;
    });
  }

  // Açılışta günlük ödül hazırsa göster (ilk birleştirmeden önce oyuncunun dikkatini dağıtma).
  function maybeShowDaily() {
    if (store.s.stats.merges > 0 && store.dailyStatus().ready) openDaily();
  }

  return {
    attachScene(s) {
      scene = s;
      if (current) scene.input.enabled = false;
      refresh();
    },
    refresh,
    toast,
    showWelcome,
    maybeShowDaily,
    discover,
    tryUnlock,
    openUpgrades,
    openEnergy,
    openDaily,
    openAlbum,
    openSettings,
    openInvite,
    openWheel,
    openQuests,
    openTop,
    openLocked,
    blobInfo,
    attachNet(n) {
      net = n;
    },
  };
}
