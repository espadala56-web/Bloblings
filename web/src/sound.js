// Ses efektleri. Dosya indirmeden Web Audio ile anında üretilir, oyun hafif kalır.
// Notalar pentatonik diziden seçilir: hangi sırayla çalınırsa çalınsın kulağa hoş gelir.

import { getPref } from './prefs.js';

let ctx = null;
let out = null;
let noiseBuf = null;

function audio() {
  if (!getPref('sound')) return null;
  if (!ctx) {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch (e) {
      return null;
    }
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 4;
    out = ctx.createGain();
    out.gain.value = 0.55;
    out.connect(comp);
    comp.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// Tarayıcılar sesi ancak bir dokunuştan sonra açar.
export function unlockAudio() {
  audio();
}

export function suspendAudio() {
  if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
}

function tone(c, { f, to = 0, type = 'sine', at = 0, dur = 0.12, vol = 0.3, attack = 0.005 }) {
  const t0 = c.currentTime + 0.01 + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur * 0.9);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(out);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function noise(c, { at = 0, dur = 0.08, vol = 0.15, freq = 2000, q = 1 }) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.3), c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t0 = c.currentTime + 0.01 + at;
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  bp.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(bp);
  bp.connect(g);
  g.connect(out);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

const PENTA = [0, 2, 4, 7, 9];
function note(step, base = 523.25) {
  const oct = Math.floor(step / 5);
  const semi = PENTA[((step % 5) + 5) % 5] + 12 * oct;
  return base * Math.pow(2, semi / 12);
}

function play(fn) {
  const c = audio();
  if (!c) return;
  try {
    fn(c);
  } catch (e) {
    /* ses çalınamazsa oyun etkilenmez */
  }
}

export const sfx = {
  tap: () => play((c) => tone(c, { f: 880, to: 1046, dur: 0.05, vol: 0.1 })),
  pick: () => play((c) => tone(c, { f: 420, to: 660, dur: 0.08, vol: 0.16 })),
  drop: () => play((c) => tone(c, { f: 360, to: 220, type: 'triangle', dur: 0.09, vol: 0.18 })),
  boop: () =>
    play((c) => {
      tone(c, { f: 300, to: 560, dur: 0.11, vol: 0.2 });
      tone(c, { f: 560, to: 400, at: 0.1, dur: 0.1, vol: 0.14 });
    }),
  // Seviye yükseldikçe ses de yükselir: oyuncu ilerlediğini kulağıyla da duyar.
  merge: (lv = 2) =>
    play((c) => {
      const s = Math.min(Math.max(lv - 2, 0), 12);
      tone(c, { f: 260, to: 720, dur: 0.11, vol: 0.22 });
      tone(c, { f: note(s), type: 'triangle', at: 0.07, dur: 0.24, vol: 0.26 });
      tone(c, { f: note(s + 2), type: 'triangle', at: 0.14, dur: 0.32, vol: 0.2 });
      noise(c, { at: 0.02, dur: 0.12, vol: 0.05, freq: 6000, q: 0.8 });
    }),
  discover: () =>
    play((c) => {
      [0, 2, 4, 5, 7].forEach((s, i) => tone(c, { f: note(s), type: 'triangle', at: i * 0.075, dur: 0.36, vol: 0.2 }));
      tone(c, { f: note(10), at: 0.38, dur: 0.7, vol: 0.12 });
    }),
  egg: () =>
    play((c) => {
      noise(c, { dur: 0.05, vol: 0.16, freq: 2500, q: 2 });
      noise(c, { at: 0.1, dur: 0.05, vol: 0.13, freq: 3200, q: 2 });
    }),
  hatch: () =>
    play((c) => {
      tone(c, { f: 380, to: 920, dur: 0.14, vol: 0.22 });
      noise(c, { dur: 0.06, vol: 0.1, freq: 1800, q: 1.5 });
    }),
  coin: () =>
    play((c) => {
      tone(c, { f: 988, type: 'square', dur: 0.07, vol: 0.05 });
      tone(c, { f: 1319, type: 'square', at: 0.07, dur: 0.26, vol: 0.05 });
    }),
  coins: () =>
    play((c) => {
      for (let i = 0; i < 6; i++) tone(c, { f: note(5 + (i % 3) * 2), type: 'square', at: i * 0.06, dur: 0.12, vol: 0.04 });
      tone(c, { f: note(12), type: 'triangle', at: 0.36, dur: 0.5, vol: 0.16 });
    }),
  unlock: () =>
    play((c) => {
      tone(c, { f: note(0), type: 'triangle', dur: 0.18, vol: 0.22 });
      tone(c, { f: note(3), type: 'triangle', at: 0.1, dur: 0.3, vol: 0.22 });
      tone(c, { f: note(5), at: 0.2, dur: 0.45, vol: 0.14 });
    }),
  energy: () =>
    play((c) => {
      tone(c, { f: 300, to: 1200, type: 'sawtooth', dur: 0.25, vol: 0.04 });
      tone(c, { f: note(5), type: 'triangle', at: 0.2, dur: 0.32, vol: 0.2 });
      tone(c, { f: note(7), type: 'triangle', at: 0.28, dur: 0.4, vol: 0.16 });
    }),
  error: () =>
    play((c) => {
      tone(c, { f: 220, type: 'square', dur: 0.08, vol: 0.05 });
      tone(c, { f: 175, type: 'square', at: 0.09, dur: 0.12, vol: 0.05 });
    }),
};
