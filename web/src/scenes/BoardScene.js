// Tahta sahnesi: yuvalar, canavarlar, sürükle-bırak ve birleştirme efektleri.
// Koordinatlar tasarım boyutunun 2 katıdır (U = 2); Phaser ekrana sığdırırken küçültür,
// böylece yüksek çözünürlüklü telefonlarda görüntü keskin kalır.

import { CFG, ELEMENTS, ART, artKey } from '../config.js';
import { blobName, t } from '../i18n.js';
import { haptic } from '../telegram.js';

const P = window.Phaser;

export const U = 2;
const TILE = 88 * U;
const GAP = 10 * U;
const PAD = 12 * U;
const BLOB = 74 * U;
const RADIUS = 18 * U;
const BADGE_W = 34 * U;
const BADGE_H = 17 * U;

const COLORS = {
  panel: 0x2a2550,
  panelEdge: 0x3d3670,
  slot: 0x352f63,
  slotEdge: 0x463f7a,
  gold: 0xffc93c,
  ink: 0x1a1430,
};

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
  }

  preload() {
    for (const el of ELEMENTS) {
      for (let lv = 1; lv <= ART[el]; lv++) {
        this.load.svg(`${el}-${lv}`, `./assets/blobs/${el}-${lv}.svg`, { width: 192, height: 192 });
      }
    }
    this.load.svg('egg', './assets/egg.svg', { width: 192, height: 192 });
  }

  create() {
    this.makeTextures();
    this.drawBoard();
    this.highlight = this.add.graphics().setDepth(5);

    this.objs = new Array(this.store.s.board.length).fill(null);
    this.store.s.board.forEach((b, i) => {
      if (b) this.objs[i] = this.createBlob(i, b);
    });

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
  }

  // ---- Görsel yardımcılar ----

  makeTextures() {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 8);
    g.generateTexture('spark', 16, 16);
    g.clear();
    g.fillStyle(COLORS.ink, 1);
    g.fillRoundedRect(0, 0, BADGE_W, BADGE_H, 8 * U);
    g.generateTexture('badge', BADGE_W, BADGE_H);
    g.destroy();
  }

  drawBoard() {
    const { w, h } = boardSize();
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(COLORS.panel, 1);
    g.fillRoundedRect(0, 0, w, h, 24 * U);
    g.lineStyle(2, COLORS.panelEdge, 1);
    g.strokeRoundedRect(1, 1, w - 2, h - 2, 24 * U);
    for (let i = 0; i < CFG.cols * CFG.rows; i++) {
      const r = this.cellRect(i);
      g.fillStyle(COLORS.slot, 1);
      g.fillRoundedRect(r.x, r.y, r.w, r.h, RADIUS);
      g.lineStyle(4, COLORS.slotEdge, 1);
      g.strokeRoundedRect(r.x, r.y, r.w, r.h, RADIUS);
    }
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

  // Parmağın altındaki yuva. Yuvalar arası boşluğun yarısı da sayılır, bırakmak kolay olsun.
  cellAt(x, y) {
    for (let i = 0; i < CFG.cols * CFG.rows; i++) {
      const r = this.cellRect(i);
      if (x >= r.x - GAP / 2 && x <= r.x + r.w + GAP / 2 && y >= r.y - GAP / 2 && y <= r.y + r.h + GAP / 2) {
        return i;
      }
    }
    return -1;
  }

  // ---- Canavar nesneleri ----

  createBlob(i, b) {
    const { x, y } = this.cellCenter(i);
    const img = this.add.image(0, 0, artKey(b.el, b.lv)).setDisplaySize(BLOB, BLOB).setDepth(10);
    const badge = this.add.image(0, 0, 'badge').setDepth(11);
    const label = this.add
      .text(0, 0, `Lv${b.lv}`, {
        fontFamily: 'Fredoka, Nunito, system-ui, sans-serif',
        fontSize: `${11 * U}px`,
        fontStyle: 'bold',
        color: '#F5F1FF',
      })
      .setOrigin(0.5)
      .setDepth(12);
    const o = { img, badge, label, cell: i, cx: x, cy: y, baseScale: img.scaleX, dragging: false, justDragged: false };
    this.placeAt(o, x, y);
    img.setInteractive({ draggable: true, useHandCursor: true });
    img.setData('o', o);
    img.on('pointerup', () => {
      if (!o.dragging && !o.justDragged) this.wiggle(o);
    });
    return o;
  }

  placeAt(o, x, y) {
    o.cx = x;
    o.cy = y;
    o.img.setPosition(x, y - 2 * U);
    const bx = x + TILE / 2 - BADGE_W / 2 - 5 * U;
    const by = y + TILE / 2 - BADGE_H / 2 - 5 * U;
    o.badge.setPosition(bx, by);
    o.label.setPosition(bx, by);
  }

  setDepths(o, base) {
    o.img.setDepth(base);
    o.badge.setDepth(base + 1);
    o.label.setDepth(base + 2);
  }

  destroyBlob(o) {
    if (!o) return;
    o.img.destroy();
    o.badge.destroy();
    o.label.destroy();
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
    o.img.setScale(s * 0.35);
    this.tweens.add({ targets: o.img, scaleX: s, scaleY: s, duration: 320, ease: 'Back.easeOut' });
  }

  wiggle(o) {
    haptic('light');
    this.tweens.add({ targets: o.img, angle: { from: -9, to: 9 }, duration: 70, yoyo: true, repeat: 2, onComplete: () => o.img.setAngle(0) });
  }

  floatText(x, y, text, color = '#FFFFFF') {
    const txt = this.add
      .text(x, y - 30 * U, text, {
        fontFamily: 'Fredoka, Nunito, system-ui, sans-serif',
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
      if (!this.store.canMerge(from, j)) continue;
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
    this.tweens.add({ targets: img, scaleX: o.baseScale * 1.12, scaleY: o.baseScale * 1.12, duration: 90 });
    this.drawHighlights(o.cell);
    haptic('light');
  }

  onDrag(pointer, img, dragX, dragY) {
    const o = img.getData('o');
    if (!o) return;
    this.placeAt(o, dragX, dragY + 2 * U);
    const hover = this.cellAt(pointer.worldX, pointer.worldY);
    this.drawHighlights(o.cell, hover);
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
    this.tweens.add({ targets: img, scaleX: o.baseScale, scaleY: o.baseScale, duration: 90 });

    const from = o.cell;
    const to = this.cellAt(pointer.worldX, pointer.worldY);
    const res = to >= 0 ? this.store.drop(from, to) : { type: 'none' };

    if (res.type === 'none') {
      this.setDepths(o, 10);
      this.tweenTo(o, from);
    } else if (res.type === 'move') {
      this.objs[to] = o;
      this.objs[from] = null;
      o.cell = to;
      this.setDepths(o, 10);
      this.tweenTo(o, to, 110);
    } else if (res.type === 'swap') {
      const other = this.objs[to];
      this.objs[to] = o;
      this.objs[from] = other;
      o.cell = to;
      this.setDepths(o, 10);
      this.tweenTo(o, to, 110);
      if (other) {
        other.cell = from;
        this.tweenTo(other, from);
      }
      haptic('light');
    } else if (res.type === 'merge') {
      this.destroyBlob(this.objs[to]);
      this.destroyBlob(o);
      this.objs[from] = null;
      const n = this.createBlob(to, res.blob);
      this.objs[to] = n;
      this.pop(n);
      const { x, y } = this.cellCenter(to);
      this.sparks.explode(22, x, y);
      this.floatText(x, y, blobName(res.blob.el, res.blob.lv), res.discovered ? '#FFC93C' : '#FFFFFF');
      haptic(res.discovered ? 'heavy' : 'medium');
      if (res.discovered) {
        this.ui.toast(t('newDiscovery', { name: blobName(res.blob.el, res.blob.lv) }));
        haptic('success');
      }
    }
    this.ui.refresh();
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
    o.img.disableInteractive();

    this.tweens.chain({
      targets: egg,
      tweens: [
        { scaleX: s, scaleY: s, duration: 160, ease: 'Back.easeOut' },
        { angle: { from: -12, to: 12 }, duration: 60, yoyo: true, repeat: 2 },
      ],
      onComplete: () => {
        egg.destroy();
        o.img.setVisible(true);
        o.badge.setVisible(true);
        o.label.setVisible(true);
        o.img.setAngle(0);
        o.img.setInteractive({ draggable: true, useHandCursor: true });
        this.pop(o);
        this.sparks.explode(14, x, y);
        haptic('medium');
        if (res.discovered) {
          this.floatText(x, y, blobName(blob.el, blob.lv), '#FFC93C');
          this.ui.toast(t('newDiscovery', { name: blobName(blob.el, blob.lv) }));
        }
      },
    });
  }
}
