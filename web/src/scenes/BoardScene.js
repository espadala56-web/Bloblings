// Tahta sahnesi: yuvalar, canavarlar, sürükle-bırak, element köprüleri ve efektler.
// Koordinatlar tasarım boyutunun 2 katıdır (U = 2); Phaser ekrana sığdırırken küçültür,
// böylece yüksek çözünürlüklü telefonlarda görüntü keskin kalır.

import { CFG, ART, ELEMENT_COLOR, artKey } from '../config.js';
import { goldCanvas } from '../gold.js';
import { blobName, formatNum } from '../i18n.js';
import { haptic } from '../telegram.js';
import { sfx } from '../sound.js';

const P = window.Phaser;

export const U = 2;
const TILE = 88 * U;
const GAP = 10 * U;
const PAD = 12 * U;
const BLOB = 74 * U;
const RADIUS = 18 * U;
const BADGE_W = 34 * U;
const BADGE_H = 17 * U;
// Canavar görseli ayak hizasından çizilir; nefes alırken yukarı doğru esner.
const IMG_DY = BLOB * 0.47 - 2 * U;

const COLORS = {
  panel: 0x2a2550,
  panelEdge: 0x3d3670,
  slot: 0x352f63,
  slotEdge: 0x463f7a,
  locked: 0x221e45,
  lockedEdge: 0x3a3368,
  gold: 0xffc93c,
  ink: 0x1a1430,
};

const FONT = 'Fredoka, Nunito, system-ui, sans-serif';

export function boardSize() {
  return {
    w: PAD * 2 + CFG.cols * TILE + (CFG.cols - 1) * GAP,
    h: PAD * 2 + CFG.rows * TILE + (CFG.rows - 1) * GAP,
  };
}

export class BoardScene extends P.Scene {
  constructor() {
    super('board');
  }

  init(data) {
    this.store = data.store;
    this.ui = data.ui;
    this.onReady = data.onReady;
    this.needsRebuild = false;
  }

  // Sunucu farklı bir tahta döndürdüğünde her şeyi baştan çizer.
  rebuild() {
    if (!this.objs) return;
    if (this.objs.some((o) => o && o.dragging)) {
      this.needsRebuild = true; // sürükleme bitince yapılır
      return;
    }
    this.needsRebuild = false;
    this.highlight.clear();
    for (const o of this.objs) this.destroyBlob(o);
    this.objs = new Array(this.store.s.board.length).fill(null);
    this.store.s.board.forEach((b, i) => {
      if (b) this.objs[i] = this.createBlob(i, b);
    });
    for (let i = 0; i < CFG.cols * CFG.rows; i++) this.drawSlot(i);
    this.drawLinks();
  }

  preload() {
    for (const el of Object.keys(ART)) {
      for (let lv = 1; lv <= ART[el]; lv++) {
        this.load.svg(`${el}-${lv}`, `./assets/blobs/${el}-${lv}.svg`, { width: 192, height: 192 });
      }
    }
    this.load.svg('egg', './assets/egg.svg', { width: 192, height: 192 });
  }

  create() {
    this.makeTextures();
    this.drawPanel();
    this.slotG = [];
    this.lockObjs = [];
    for (let i = 0; i < CFG.cols * CFG.rows; i++) {
      this.slotG[i] = this.add.graphics().setDepth(1);
      this.lockObjs[i] = null;
      this.drawSlot(i);
    }
    this.links = this.add.graphics().setDepth(3);
    this.tweens.add({ targets: this.links, alpha: { from: 0.65, to: 1 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.highlight = this.add.graphics().setDepth(5);

    this.objs = new Array(this.store.s.board.length).fill(null);
    this.store.s.board.forEach((b, i) => {
      if (b) this.objs[i] = this.createBlob(i, b);
    });
    this.drawLinks();

    this.sparks = this.add
      .particles(0, 0, 'spark', {
        speed: { min: 160, max: 420 },
        lifespan: 550,
        scale: { start: 1.3, end: 0 },
        alpha: { start: 1, end: 0 },
        gravityY: 500,
        tint: [0xffc93c, 0xff6fb5, 0x4fd1e8, 0xffffff],
        emitting: false,
      })
      .setDepth(50);

    this.input.dragDistanceThreshold = 6;
    this.input.on('dragstart', this.onDragStart, this);
    this.input.on('drag', this.onDrag, this);
    this.input.on('dragend', this.onDragEnd, this);

    this.ui.attachScene(this);
    if (this.onReady) this.onReady(this);
  }

  // ---- Dokular ----

  makeTextures() {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 8);
    g.generateTexture('spark', 16, 16);

    g.clear();
    g.fillStyle(COLORS.ink, 1);
    g.fillRoundedRect(0, 0, BADGE_W, BADGE_H, 8 * U);
    g.generateTexture('badge', BADGE_W, BADGE_H);

    // Asma kilit
    g.clear();
    const L = 24 * U;
    g.lineStyle(3.5 * U, 0x8a82bd, 1);
    g.beginPath();
    g.arc(L / 2, 10 * U, 6 * U, Math.PI, 0, false);
    g.strokePath();
    g.fillStyle(0x8a82bd, 1);
    g.fillRoundedRect(2 * U, 10 * U, L - 4 * U, 13 * U, 3 * U);
    g.fillStyle(COLORS.locked, 1);
    g.fillCircle(L / 2, 16 * U, 2 * U);
    g.generateTexture('lock', L, 24 * U);

    // Küçük altın simgesi
    g.clear();
    g.fillStyle(0xffc93c, 1);
    g.fillCircle(8 * U, 8 * U, 7 * U);
    g.lineStyle(1.6 * U, 0xc98a00, 1);
    g.strokeCircle(8 * U, 8 * U, 4 * U);
    g.generateTexture('coin', 16 * U, 16 * U);

    // Parlak canavarların yıldızı
    g.clear();
    const S = 12 * U;
    g.fillStyle(0xfff3b0, 1);
    g.lineStyle(1.6 * U, COLORS.ink, 1);
    const star = [];
    for (let k = 0; k < 8; k++) {
      const r = k % 2 === 0 ? S : S * 0.38;
      const a = -Math.PI / 2 + (k * Math.PI) / 4;
      star.push({ x: S + 2 * U + r * Math.cos(a), y: S + 2 * U + r * Math.sin(a) });
    }
    g.fillPoints(star, true);
    g.strokePoints(star, true, true);
    g.generateTexture('star', 2 * S + 4 * U, 2 * S + 4 * U);
    g.destroy();

    // Parlak canavarların arkasındaki altın ışıltı
    const R = 64 * U;
    const glow = this.textures.createCanvas('glow', R, R);
    const ctx = glow.getContext();
    const grad = ctx.createRadialGradient(R / 2, R / 2, 0, R / 2, R / 2, R / 2);
    grad.addColorStop(0, 'rgba(255,226,120,0.85)');
    grad.addColorStop(0.55, 'rgba(255,201,60,0.35)');
    grad.addColorStop(1, 'rgba(255,201,60,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, R, R);
    glow.refresh();
  }

  // Bir çizimin altın kopyasını bir kez üretir, sonra hep onu kullanır.
  goldKey(key) {
    const gk = `${key}*`;
    if (this.textures.exists(gk)) return gk;
    const src = this.textures.get(key).getSourceImage();
    const w = src.width || 192;
    const h = src.height || 192;
    const ct = this.textures.createCanvas(gk, w, h);
    goldCanvas(src, w, h, ct.getSourceImage());
    ct.refresh();
    return gk;
  }

  // ---- Tahta çizimi ----

  drawPanel() {
    const { w, h } = boardSize();
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(COLORS.panel, 1);
    g.fillRoundedRect(0, 0, w, h, 24 * U);
    g.lineStyle(2, COLORS.panelEdge, 1);
    g.strokeRoundedRect(1, 1, w - 2, h - 2, 24 * U);
  }

  drawSlot(i) {
    const g = this.slotG[i];
    const r = this.cellRect(i);
    g.clear();
    const open = this.store.isOpen(i);
    g.fillStyle(open ? COLORS.slot : COLORS.locked, 1);
    g.fillRoundedRect(r.x, r.y, r.w, r.h, RADIUS);
    g.lineStyle(4, open ? COLORS.slotEdge : COLORS.lockedEdge, 1);
    g.strokeRoundedRect(r.x, r.y, r.w, r.h, RADIUS);

    if (this.lockObjs[i]) {
      this.lockObjs[i].forEach((o) => o.destroy());
      this.lockObjs[i] = null;
    }
    if (open) return;

    const { x, y } = this.cellCenter(i);
    const isNext = i === this.store.s.slotsOpen;
    const objs = [];
    const lock = this.add.image(x, isNext ? y - 14 * U : y, 'lock').setDepth(2).setAlpha(isNext ? 1 : 0.55);
    objs.push(lock);
    if (isNext) {
      const cost = this.store.nextSlotCost();
      const label = this.add
        .text(x + 9 * U, y + 18 * U, formatNum(cost), { fontFamily: FONT, fontSize: `${13 * U}px`, fontStyle: 'bold', color: '#FFC93C' })
        .setOrigin(0.5)
        .setDepth(2);
      const coin = this.add.image(label.x - label.width / 2 - 9 * U, label.y, 'coin').setDepth(2);
      objs.push(label, coin);
    }
    const zone = this.add.zone(x, y, TILE, TILE).setInteractive({ useHandCursor: true }).setDepth(2);
    zone.on('pointerup', () => this.ui.tryUnlock());
    objs.push(zone);
    this.lockObjs[i] = objs;
  }

  onSlotUnlocked(cell) {
    for (let i = cell; i < CFG.cols * CFG.rows; i++) this.drawSlot(i);
    const { x, y } = this.cellCenter(cell);
    this.sparks.explode(26, x, y);
    const g = this.slotG[cell];
    g.setAlpha(0);
    this.tweens.add({ targets: g, alpha: 1, duration: 300 });
  }

  cellRect(i) {
    const c = i % CFG.cols;
    const r = Math.floor(i / CFG.cols);
    return { x: PAD + c * (TILE + GAP), y: PAD + r * (TILE + GAP), w: TILE, h: TILE };
  }

  cellCenter(i) {
    const r = this.cellRect(i);
    return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  }

  cellAt(x, y) {
    for (let i = 0; i < CFG.cols * CFG.rows; i++) {
      const r = this.cellRect(i);
      if (x >= r.x - GAP / 2 && x <= r.x + r.w + GAP / 2 && y >= r.y - GAP / 2 && y <= r.y + r.h + GAP / 2) {
        return i;
      }
    }
    return -1;
  }

  // ---- Element köprüleri ----

  drawLinks() {
    const g = this.links;
    g.clear();
    for (const [from, to] of this.store.synergyLinks()) {
      const a = this.cellCenter(from);
      const b = this.cellCenter(to);
      const color = ELEMENT_COLOR[this.store.s.board[from].el];
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const horiz = a.y === b.y;
      const len = GAP + 26 * U;
      const thick = 12 * U;
      g.fillStyle(COLORS.ink, 1);
      if (horiz) g.fillRoundedRect(mx - len / 2 - 2 * U, my - thick / 2 - 2 * U, len + 4 * U, thick + 4 * U, (thick + 4 * U) / 2);
      else g.fillRoundedRect(mx - thick / 2 - 2 * U, my - len / 2 - 2 * U, thick + 4 * U, len + 4 * U, (thick + 4 * U) / 2);
      g.fillStyle(color, 1);
      if (horiz) g.fillRoundedRect(mx - len / 2, my - thick / 2, len, thick, thick / 2);
      else g.fillRoundedRect(mx - thick / 2, my - len / 2, thick, len, thick / 2);
      // Akış yönünü gösteren küçük ok
      const s = 4 * U;
      const dx = Math.sign(b.x - a.x);
      const dy = Math.sign(b.y - a.y);
      g.fillStyle(0xffffff, 0.95);
      if (horiz) g.fillTriangle(mx + dx * s, my, mx - dx * s, my - s, mx - dx * s, my + s);
      else g.fillTriangle(mx, my + dy * s, mx - s, my - dy * s, mx + s, my - dy * s);
    }
  }

  // ---- Canavar nesneleri ----

  createBlob(i, b) {
    const { x, y } = this.cellCenter(i);
    const key = b.shiny ? this.goldKey(artKey(b.el, b.lv)) : artKey(b.el, b.lv);
    const img = this.add.image(0, 0, key).setDisplaySize(BLOB, BLOB).setOrigin(0.5, 0.97).setDepth(10);
    const badge = this.add.image(0, 0, 'badge').setDepth(11);
    const label = this.add
      .text(0, 0, `Lv${b.lv}`, { fontFamily: FONT, fontSize: `${11 * U}px`, fontStyle: 'bold', color: '#F5F1FF' })
      .setOrigin(0.5)
      .setDepth(12);
    const o = { img, badge, label, fx: [], cell: i, cx: x, cy: y, baseScale: img.scaleX, dragging: false, justDragged: false };
    if (b.shiny) {
      const glow = this.add.image(0, 0, 'glow').setDepth(9).setDisplaySize(BLOB * 1.15, BLOB * 1.15).setAlpha(0.7);
      const star = this.add.image(0, 0, 'star').setDepth(13);
      this.tweens.add({ targets: glow, alpha: { from: 0.45, to: 0.95 }, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: star, angle: 360, duration: 6000, repeat: -1 });
      this.tweens.add({ targets: star, scale: { from: 0.8, to: 1.15 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      o.fx.push(glow, star);
    }
    this.placeAt(o, x, y);
    img.setInteractive({ draggable: true, useHandCursor: true });
    img.setData('o', o);
    img.on('pointerup', () => {
      if (o.dragging || o.justDragged) return;
      this.wiggle(o);
      // Dokununca canavar kartı: sat ya da Sihirli İksir kullan.
      this.time.delayedCall(140, () => {
        if (o.img.scene) this.ui.blobInfo(o.cell);
      });
    });
    this.breathe(o);
    return o;
  }

  placeAt(o, x, y) {
    if (!o.img.scene) return; // yeniden çizimde silinmiş nesne
    o.cx = x;
    o.cy = y;
    o.img.setPosition(x, y + IMG_DY);
    const bx = x + TILE / 2 - BADGE_W / 2 - 5 * U;
    const by = y + TILE / 2 - BADGE_H / 2 - 5 * U;
    o.badge.setPosition(bx, by);
    o.label.setPosition(bx, by);
    if (o.fx.length) {
      o.fx[0].setPosition(x, y + IMG_DY - BLOB * 0.45);
      o.fx[1].setPosition(x - TILE / 2 + 15 * U, y - TILE / 2 + 15 * U);
    }
  }

  setDepths(o, base) {
    o.img.setDepth(base);
    o.badge.setDepth(base + 1);
    o.label.setDepth(base + 2);
    if (o.fx.length) {
      o.fx[0].setDepth(base - 1);
      o.fx[1].setDepth(base + 3);
    }
  }

  destroyBlob(o) {
    if (!o) return;
    this.tweens.killTweensOf(o.img);
    o.img.destroy();
    o.badge.destroy();
    o.label.destroy();
    for (const f of o.fx) {
      this.tweens.killTweensOf(f);
      f.destroy();
    }
  }

  // Hafif nefes alma: her canavar kendi ritminde.
  breathe(o) {
    const s = o.baseScale;
    this.tweens.killTweensOf(o.img);
    o.img.setScale(s).setAngle(0);
    this.tweens.add({
      targets: o.img,
      scaleY: s * 1.045,
      scaleX: s * 0.975,
      duration: 900 + Math.random() * 500,
      delay: Math.random() * 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  tweenTo(o, cell, duration = 170) {
    const { x, y } = this.cellCenter(cell);
    const p = { x: o.cx, y: o.cy };
    this.tweens.add({
      targets: p,
      x,
      y,
      duration,
      ease: 'Cubic.easeOut',
      onUpdate: () => this.placeAt(o, p.x, p.y),
      onComplete: () => this.placeAt(o, x, y),
    });
  }

  pop(o) {
    const s = o.baseScale;
    this.tweens.killTweensOf(o.img);
    o.img.setScale(s * 0.35);
    this.tweens.add({ targets: o.img, scaleX: s, scaleY: s, duration: 320, ease: 'Back.easeOut', onComplete: () => this.breathe(o) });
  }

  wiggle(o) {
    sfx.boop();
    haptic('light');
    this.tweens.add({
      targets: o.img,
      angle: { from: -9, to: 9 },
      duration: 70,
      yoyo: true,
      repeat: 2,
      onComplete: () => o.img.setAngle(0),
    });
  }

  floatText(x, y, text, color = '#FFFFFF') {
    const txt = this.add
      .text(x, y - 30 * U, text, {
        fontFamily: FONT,
        fontSize: `${15 * U}px`,
        fontStyle: 'bold',
        color,
        stroke: '#1A1430',
        strokeThickness: 5 * U,
      })
      .setOrigin(0.5)
      .setDepth(60);
    this.tweens.add({ targets: txt, y: txt.y - 34 * U, alpha: 0, duration: 1000, ease: 'Cubic.easeOut', onComplete: () => txt.destroy() });
  }

  drawHighlights(from, hover = -1) {
    const g = this.highlight;
    g.clear();
    for (let j = 0; j < this.objs.length; j++) {
      if (!this.store.canMerge(from, j) && !this.store.knowsRecipe(from, j)) continue;
      const r = this.cellRect(j);
      if (j === hover) {
        g.fillStyle(COLORS.gold, 0.22);
        g.fillRoundedRect(r.x, r.y, r.w, r.h, RADIUS);
      }
      g.lineStyle(6, COLORS.gold, 1);
      g.strokeRoundedRect(r.x, r.y, r.w, r.h, RADIUS);
    }
  }

  // ---- Sürükle-bırak ----

  onDragStart(pointer, img) {
    const o = img.getData('o');
    if (!o) return;
    o.dragging = true;
    this.setDepths(o, 100);
    this.tweens.killTweensOf(img);
    img.setAngle(0);
    this.tweens.add({ targets: img, scaleX: o.baseScale * 1.12, scaleY: o.baseScale * 1.12, duration: 90 });
    this.drawHighlights(o.cell);
    sfx.pick();
    haptic('light');
  }

  onDrag(pointer, img, dragX, dragY) {
    const o = img.getData('o');
    if (!o) return;
    this.placeAt(o, dragX, dragY - IMG_DY);
    this.drawHighlights(o.cell, this.cellAt(pointer.worldX, pointer.worldY));
  }

  onDragEnd(pointer, img) {
    const o = img.getData('o');
    if (!o) return;
    o.dragging = false;
    o.justDragged = true;
    setTimeout(() => {
      o.justDragged = false;
    }, 0);
    this.highlight.clear();

    const from = o.cell;
    const to = this.cellAt(pointer.worldX, pointer.worldY);
    const res = to >= 0 ? this.store.drop(from, to) : { type: 'none' };

    if (res.type !== 'merge') {
      this.setDepths(o, 10);
      this.breathe(o);
    }

    if (res.type === 'none') {
      this.tweenTo(o, from);
    } else if (res.type === 'move') {
      sfx.drop();
      this.objs[to] = o;
      this.objs[from] = null;
      o.cell = to;
      this.tweenTo(o, to, 110);
    } else if (res.type === 'swap') {
      const other = this.objs[to];
      this.objs[to] = o;
      this.objs[from] = other;
      o.cell = to;
      this.tweenTo(o, to, 110);
      if (other) {
        other.cell = from;
        this.tweenTo(other, from);
      }
      sfx.drop();
      haptic('light');
    } else if (res.type === 'merge') {
      this.destroyBlob(this.objs[to]);
      this.destroyBlob(o);
      this.objs[from] = null;
      const n = this.createBlob(to, res.blob);
      this.objs[to] = n;
      this.pop(n);
      const { x, y } = this.cellCenter(to);
      const big = res.discovered || res.recipe || res.shinyNew;
      this.sparks.explode(big ? 40 : 22, x, y);
      if (res.recipe) this.sparks.explode(30, x, y - 30 * U);
      this.floatText(x, y, blobName(res.blob.el, res.blob.lv), big ? '#FFC93C' : '#FFFFFF');
      sfx.merge(res.blob.lv);
      haptic(big ? 'heavy' : 'medium');
      if (res.discovered || res.shinyNew) {
        this.time.delayedCall(450, () => this.ui.discover(res.blob, { isNew: res.discovered, shinyNew: res.shinyNew, parents: res.parents }));
      }
    }
    this.drawLinks();
    this.ui.refresh();
    if (this.needsRebuild) this.rebuild();
  }

  isDragging() {
    return Boolean(this.objs && this.objs.some((o) => o && o.dragging));
  }

  // Satılan canavar küçülerek kaybolur.
  removeAt(cell) {
    const o = this.objs[cell];
    if (!o) return;
    this.objs[cell] = null;
    const { x, y } = this.cellCenter(cell);
    this.sparks.explode(16, x, y);
    o.badge.setVisible(false);
    o.label.setVisible(false);
    o.fx.forEach((f) => f.setVisible(false));
    this.tweens.killTweensOf(o.img);
    this.tweens.add({ targets: o.img, scaleX: 0, scaleY: 0, duration: 200, ease: 'Back.easeIn', onComplete: () => this.destroyBlob(o) });
    this.drawLinks();
  }

  // İksirle seviye atlayan canavar yenisiyle değişir.
  replaceAt(cell, blob) {
    if (this.objs[cell]) this.destroyBlob(this.objs[cell]);
    const n = this.createBlob(cell, blob);
    this.objs[cell] = n;
    this.pop(n);
    const { x, y } = this.cellCenter(cell);
    this.sparks.explode(30, x, y);
    this.floatText(x, y, blobName(blob.el, blob.lv), '#C7B3FF');
    this.drawLinks();
  }

  // ---- Yumurtadan çıkış ----

  spawn(res) {
    const { cell, blob } = res;
    const { x, y } = this.cellCenter(cell);
    const egg = this.add.image(x, y, 'egg').setDisplaySize(BLOB * 0.85, BLOB * 0.85).setDepth(40);
    const s = egg.scaleX;
    egg.setScale(0);
    const o = this.createBlob(cell, blob);
    this.objs[cell] = o;
    o.img.setVisible(false);
    o.badge.setVisible(false);
    o.label.setVisible(false);
    o.fx.forEach((f) => f.setVisible(false));
    o.img.disableInteractive();

    this.tweens.chain({
      targets: egg,
      tweens: [
        { scaleX: s, scaleY: s, duration: 160, ease: 'Back.easeOut' },
        { angle: { from: -12, to: 12 }, duration: 60, yoyo: true, repeat: 2 },
      ],
      onComplete: () => {
        egg.destroy();
        if (!o.img.scene) return; // bu arada tahta yeniden çizildiyse
        o.img.setVisible(true);
        o.badge.setVisible(true);
        o.label.setVisible(true);
        o.fx.forEach((f) => f.setVisible(true));
        o.img.setInteractive({ draggable: true, useHandCursor: true });
        this.pop(o);
        this.sparks.explode(14, x, y);
        this.drawLinks();
        sfx.hatch();
        haptic('medium');
        if (res.discovered || res.shinyNew) {
          this.floatText(x, y, blobName(blob.el, blob.lv), '#FFC93C');
          this.time.delayedCall(350, () => this.ui.discover(blob, { isNew: res.discovered, shinyNew: res.shinyNew }));
        }
      },
    });
  }
}
