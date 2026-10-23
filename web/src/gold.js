// Parlak (altın) canavar görünümü.
// Çizimin renkleri parlaklığına göre altın tonlarına çevrilir; koyu çerçeve ve göz bebekleri
// ile gözlerin beyazı korunur. Tahtada (Phaser) ve albümde (HTML) aynı işlem kullanılır.

const STOPS = [
  [0.15, [122, 74, 0]],
  [0.45, [224, 154, 16]],
  [0.7, [255, 201, 60]],
  [0.92, [255, 242, 168]],
];

function ramp(L) {
  if (L <= STOPS[0][0]) return STOPS[0][1];
  for (let i = 1; i < STOPS.length; i++) {
    const [b, cb] = STOPS[i];
    const [a, ca] = STOPS[i - 1];
    if (L <= b) {
      const k = (L - a) / (b - a);
      return [ca[0] + (cb[0] - ca[0]) * k, ca[1] + (cb[1] - ca[1]) * k, ca[2] + (cb[2] - ca[2]) * k];
    }
  }
  return STOPS[STOPS.length - 1][1];
}

function smooth(a, b, x) {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
}

export function goldify(data) {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const t = smooth(0.12, 0.22, L) * (1 - smooth(0.9, 0.97, L));
    if (t <= 0) continue;
    const c = ramp(L);
    data[i] = r + (c[0] - r) * t;
    data[i + 1] = g + (c[1] - g) * t;
    data[i + 2] = b + (c[2] - b) * t;
  }
}

// Bir resmi (yüklenmiş img/canvas) altın kopyası olarak bir canvas'a çizer.
export function goldCanvas(src, w = src.width, h = src.height, canvas = null) {
  const c = canvas || document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(src, 0, 0, w, h);
  try {
    const img = ctx.getImageData(0, 0, w, h);
    goldify(img.data);
    ctx.putImageData(img, 0, 0);
  } catch (e) {
    /* tarayıcı izin vermezse normal görünüm kalır */
  }
  return c;
}

// HTML için: SVG adresinden altın PNG adresi üretir (önbellekli).
const cache = new Map();
export function goldUrl(src, size = 240) {
  if (cache.has(src)) return cache.get(src);
  // Safari, boyutu yazılmamış SVG'leri canvas'a çizemeyebilir; boyutu ekleyip öyle yükle.
  const p = fetch(src)
    .then((r) => r.text())
    .then(
      (text) =>
        new Promise((resolve) => {
          const sized = text.replace('<svg ', `<svg width="${size}" height="${size}" `);
          const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }));
          const img = new Image();
          img.onload = () => {
            try {
              resolve(goldCanvas(img, size, size).toDataURL('image/png'));
            } catch (e) {
              resolve(src);
            }
            URL.revokeObjectURL(url);
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(src);
          };
          img.src = url;
        }),
    )
    .catch(() => src);
  cache.set(src, p);
  return p;
}

// <img> elemanını altın görünüme çevirir.
export function makeGold(imgEl) {
  imgEl.classList.add('is-gold');
  goldUrl(imgEl.getAttribute('src')).then((u) => {
    imgEl.src = u;
  });
  return imgEl;
}
