// HTML arayüz katmanı: üst bilgi çubuğu, ipucu, butonlar, bildirimler ve pencereler.

import { CFG, ELEMENTS, ART, artKey } from './config.js';
import { t, formatNum, formatDuration, formatClock, getLang, setLang, blobName, blobFlavor } from './i18n.js';
import { haptic, setBackButton } from './telegram.js';
import { showRewarded, ADS_LIVE } from './ads.js';
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

const ALBUM_TOTAL = ELEMENTS.reduce((n, el) => n + ART[el], 0);

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
    settingsBtn: $('settings-btn'),
    hint: $('hint'),
    eggBtn: $('egg-btn'),
    upBtn: $('up-btn'),
    toast: $('toast'),
    modal: $('modal'),
  };
  let scene = null;
  let toastTimer = null;

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
    if (empty === 0 && !store.hasMergePair()) return t('hintBoardFull');
    if (s.energy < CFG.eggCost && empty > 0) return t('hintNoEnergy');
    if (s.stats.eggs === 0 && empty > 0) return t('hintOpenEgg');
    if (s.stats.merges >= 1 && store.synergyLinks().length === 0) return t('hintSynergy');
    return t('hintKeepMerging');
  }

  function albumCount() {
    let n = 0;
    for (const e of ELEMENTS) for (let lv = 1; lv <= ART[e]; lv++) if (store.s.discovered[`${e}-${lv}`]) n++;
    return n;
  }

  function refresh() {
    const s = store.s;
    el.energyVal.textContent = `${s.energy}/${CFG.energyCap}`;
    el.energySub.textContent = s.energy >= CFG.energyCap ? t('full') : `+1 · ${formatClock(store.nextEnergyIn())}`;
    el.energyPill.classList.toggle('low', s.energy < 5);
    el.goldVal.textContent = formatNum(s.gold);
    el.crystalVal.textContent = formatNum(s.crystals);
    el.rateVal.textContent = `+${formatRate(store.goldRate())} ${t('goldUnit')}`;
    el.albumVal.textContent = `${albumCount()}/${ALBUM_TOTAL}`;
    el.dailyBtn.classList.toggle('has-dot', store.dailyStatus().ready);
    const hint = hintText();
    if (el.hint.textContent !== hint) el.hint.textContent = hint;
    el.eggBtn.classList.toggle('is-empty', s.energy < CFG.eggCost);
    el.upBtn.classList.toggle('has-dot', store.canAffordUpgrade());
    if (current && current.update) current.update();
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
      toast(t('boardFull'));
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
        toast(!ADS_LIVE && r.test ? `${t('energyAdded', { n: res.energy })} (test)` : t('energyAdded', { n: res.energy }));
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
        if (res.blob && scene) scene.spawn({ cell: res.cell, blob: res.blob, discovered: res.discovered });
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
  function openAlbum() {
    openModal((close) => {
      const n = albumCount();
      const detail = h('div', { class: 'album-detail' }, [h('p', { class: 'small-note', text: t('albumTap') })]);
      const cells = [];
      const rows = ELEMENTS.map((e) => {
        const grid = h('div', { class: 'album-grid' });
        for (let lv = 1; lv <= ART[e]; lv++) {
          const known = Boolean(store.s.discovered[`${e}-${lv}`]);
          const cell = h('button', { type: 'button', class: `album-cell${known ? '' : ' locked'}`, 'aria-label': known ? blobName(e, lv) : t('albumLocked') }, [
            h('img', { src: `./assets/blobs/${artKey(e, lv)}.svg`, alt: '', draggable: 'false' }),
            h('small', { text: String(lv) }),
          ]);
          cell.addEventListener('click', () => {
            sfx.tap();
            cells.forEach((c) => c.classList.remove('sel'));
            cell.classList.add('sel');
            detail.innerHTML = '';
            if (known) {
              detail.append(
                h('b', { text: blobName(e, lv) }),
                h('span', { class: 'meta', text: `Lv${lv} · ${t(e)}` }),
                h('p', { text: blobFlavor(e, lv) }),
              );
            } else {
              detail.append(
                h('b', { text: '???' }),
                h('span', { class: 'meta', text: `Lv${lv} · ${t(e)} · ${t('albumLocked')}` }),
                h('p', { text: lv === 1 ? t('albumHowEgg') : t('albumHowMerge', { n: lv - 1, el: t(e) }) }),
              );
            }
          });
          cells.push(cell);
          grid.append(cell);
        }
        const color = { fire: '#FF9A6B', water: '#7CC8FF', forest: '#7FDB88' }[e];
        return h('div', { class: 'album-row' }, [h('span', { text: t(e), style: `color:${color}` }), grid]);
      });
      const bar = h('div', { class: 'album-bar' }, [h('i', { style: `width:${Math.round((n / ALBUM_TOTAL) * 100)}%` })]);
      return h('div', { class: 'modal-card album', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'album-title' }, [
        h('h2', { id: 'album-title', text: t('albumTitle') }),
        h('span', { class: 'album-meta', text: t('albumProgress', { n, m: ALBUM_TOTAL }) }),
        bar,
        ...rows,
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
        h('span', { class: 'version', text: VERSION_LABEL, style: 'text-align:center' }),
        h('button', { type: 'button', class: 'btn btn-ghost', text: t('close'), onclick: close }),
      ]);
    });
  }

  el.settingsBtn.addEventListener('click', () => {
    sfx.tap();
    haptic('light');
    openSettings();
  });

  // ---- Keşif kartı ----
  function discover(blob) {
    haptic('success');
    sfx.discover();
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
        if (!ADS_LIVE && r.test) toast(t('adTest'));
        const res = r.ok ? store.claimOfflineBonus() : { error: 'ad' };
        finish(res.gold || 0);
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
  };
}
