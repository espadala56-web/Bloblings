import math, sys, shutil
sys.path.insert(0, '/home/claude/bloblings/tools')
from art_common import *
OUT = '/home/claude/bloblings/web/assets/blobs/'

# ---------------- BUHAR (Ateş + Su) ----------------
shutil.copy(OUT + 'steamy.svg', OUT + 'steam-1.svg')

# Lv2 Çaydanlık: iki katlı Türk çaydanlığı
steam2 = svg(
  f'<circle cx="38" cy="10" r="5" fill="#E2D8FF" stroke="{INK}" stroke-width="2.6"/>',
  f'<circle cx="48" cy="4" r="3.4" fill="#E2D8FF" stroke="{INK}" stroke-width="2.2"/>',
  f'<path d="M14 66Q4 56 8 46" fill="none" stroke="{INK}" stroke-width="10" stroke-linecap="round"/>',
  f'<path d="M14 66Q4 56 8 46" fill="none" stroke="#B49BFF" stroke-width="4.5" stroke-linecap="round"/>',
  f'<path d="M98 62Q114 64 112 80Q110 92 98 92" fill="none" stroke="{INK}" stroke-width="10" stroke-linecap="round"/>',
  f'<path d="M98 62Q114 64 112 80Q110 92 98 92" fill="none" stroke="#FFC93C" stroke-width="4.5" stroke-linecap="round"/>',
  f'<path d="M78 28Q90 30 92 22" fill="none" stroke="{INK}" stroke-width="8" stroke-linecap="round"/>',
  f'<path d="M78 28Q90 30 92 22" fill="none" stroke="#C7B3FF" stroke-width="3.5" stroke-linecap="round"/>',
  f'<path d="M42 44Q40 20 60 18Q80 20 78 44Z" fill="#C7B3FF" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>',
  f'<path d="M50 18Q60 10 70 18" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>',
  f'<path d="M50 18Q60 10 70 18" fill="none" stroke="#FFC93C" stroke-width="3" stroke-linecap="round"/>',
  f'<path d="M44 30h32" stroke="#FFC93C" stroke-width="3.5"/>',
  f'<ellipse cx="60" cy="46" rx="22" ry="5" fill="#FFC93C" stroke="{INK}" stroke-width="3.5"/>',
  f'<path d="M22 62Q22 46 60 46Q98 46 98 62L96 96Q94 108 60 108Q26 108 24 96Z" fill="#B49BFF" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>',
  f'<path d="M24 98Q60 106 96 98" fill="none" stroke="#FFC93C" stroke-width="4"/>',
  f'<path d="M30 58Q36 52 46 52" fill="none" stroke="#E2D8FF" stroke-width="4" stroke-linecap="round"/>',
  eyes(x1=48, x2=72, y=72, rx=8.5, ry=9.5, pr=4.8),
  blush(x1=35, x2=85, y=84, rx=6, ry=3.6, op=.5),
  smile(60, 85, 6, 6),
)

# Lv3 Şimşekbulut: yağmurlu, şimşekli fırtına bulutu
steam3 = svg(
  f'<path d="M30 96l-4 10M48 100l-4 10M74 100l-4 10M92 96l-4 10" stroke="#4FB6FF" stroke-width="4.5" stroke-linecap="round"/>',
  f'<path d="M62 86L52 104L62 104L56 118L74 96L64 96L70 86Z" fill="#FFC93C" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>',
  f'<circle cx="30" cy="54" r="20" fill="#8C7AD9" stroke="{INK}" stroke-width="5"/>',
  f'<circle cx="58" cy="38" r="26" fill="#8C7AD9" stroke="{INK}" stroke-width="5"/>',
  f'<circle cx="88" cy="50" r="21" fill="#8C7AD9" stroke="{INK}" stroke-width="5"/>',
  f'<path d="M12 72Q6 92 28 92L92 92Q114 92 108 70Q104 60 90 60L30 60Q16 60 12 72Z" fill="#7A68C9" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>',
  f'<circle cx="30" cy="54" r="17.5" fill="#8C7AD9"/><circle cx="58" cy="38" r="23.5" fill="#8C7AD9"/><circle cx="88" cy="50" r="18.5" fill="#8C7AD9"/>',
  f'<rect x="16" y="58" width="88" height="14" fill="#8C7AD9"/>',
  f'<path d="M40 22Q48 14 60 14" fill="none" stroke="#B9AAF2" stroke-width="4.5" stroke-linecap="round"/>',
  f'<path d="M78 30L88 24L86 34L96 30" fill="none" stroke="#FFC93C" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>',
  eyes(x1=47, x2=73, y=62, rx=8.5, ry=9.5, pr=4.8),
  f'<path d="M37 48l13 5M83 48l-13 5" stroke="{INK}" stroke-width="3.8" stroke-linecap="round"/>',
  blush(x1=34, x2=86, y=74, rx=6, ry=3.6, op=.5),
  f'<path d="M53 76q7 5 14 0" fill="none" stroke="{INK}" stroke-width="3.4" stroke-linecap="round"/>',
)

# ---------------- NİLÜFER (Su + Orman) ----------------
def lilypad(y=104):
    return '\n'.join([
      f'<path d="M8 {y}Q8 {y-12} 60 {y-12}Q112 {y-12} 112 {y}Q112 {y+12} 60 {y+12}Q8 {y+12} 8 {y}Z" fill="#4FCB6A" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>',
      f'<path d="M60 {y}L74 {y-12}L80 {y-10}Z" fill="#2A6FA8" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>',
      f'<path d="M30 {y+2}Q44 {y+6} 56 {y+4}" fill="none" stroke="#A6E86B" stroke-width="3" stroke-linecap="round"/>',
    ])

def lotus(cx, cy, s=1.0):
    k = s
    return '\n'.join([
      f'<path d="M{cx} {cy}Q{cx-14*k} {cy-6*k} {cx-12*k} {cy-18*k}Q{cx-4*k} {cy-14*k} {cx} {cy}Z" fill="#FF8FC0" stroke="{INK}" stroke-width="{2.6*k:.1f}" stroke-linejoin="round"/>',
      f'<path d="M{cx} {cy}Q{cx+14*k} {cy-6*k} {cx+12*k} {cy-18*k}Q{cx+4*k} {cy-14*k} {cx} {cy}Z" fill="#FF8FC0" stroke="{INK}" stroke-width="{2.6*k:.1f}" stroke-linejoin="round"/>',
      f'<path d="M{cx} {cy}Q{cx-8*k} {cy-14*k} {cx} {cy-24*k}Q{cx+8*k} {cy-14*k} {cx} {cy}Z" fill="#FFC0DE" stroke="{INK}" stroke-width="{2.6*k:.1f}" stroke-linejoin="round"/>',
      f'<circle cx="{cx}" cy="{cy-5*k:.1f}" r="{2.6*k:.1f}" fill="#FFC93C"/>',
    ])

# Lv1 Nilüfercik: yaprakta oturan, başında nilüfer çiçeği olan damla
lotus1 = svg(
  lilypad(104),
  f'<path d="M24 92Q22 54 60 50Q98 54 96 92Q90 104 60 104Q30 104 24 92Z" fill="#3CC8B4" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>',
  f'<ellipse cx="60" cy="92" rx="18" ry="9" fill="#BDF2E8"/>',
  f'<path d="M34 64Q40 56 50 56" fill="none" stroke="#9EF0E6" stroke-width="4" stroke-linecap="round"/>',
  lotus(60, 52, 1.15),
  eyes(x1=48, x2=72, y=76, rx=8, ry=9.5, pr=4.6),
  blush(x1=36, x2=84, y=88, rx=5.5, ry=3.4),
  smile(60, 89, 5, 5, 3.2),
)

# Lv2 Kurbağa Prens: taçlı kurbağa
lotus2 = svg(
  lilypad(106),
  f'<ellipse cx="36" cy="102" rx="12" ry="6" fill="#2FA88A" stroke="{INK}" stroke-width="4"/>',
  f'<ellipse cx="84" cy="102" rx="12" ry="6" fill="#2FA88A" stroke="{INK}" stroke-width="4"/>',
  f'<circle cx="40" cy="46" r="15" fill="#3CC8A0" stroke="{INK}" stroke-width="5"/>',
  f'<circle cx="80" cy="46" r="15" fill="#3CC8A0" stroke="{INK}" stroke-width="5"/>',
  f'<path d="M18 80Q16 50 60 50Q104 50 102 80Q100 102 60 102Q20 102 18 80Z" fill="#3CC8A0" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>',
  f'<circle cx="40" cy="46" r="12.5" fill="#3CC8A0"/><circle cx="80" cy="46" r="12.5" fill="#3CC8A0"/>',
  f'<ellipse cx="60" cy="88" rx="24" ry="11" fill="#C9F5E6"/>',
  eyes(x1=40, x2=80, y=46, rx=9, ry=9.5, pr=5),
  crown(60, 42, w=24, h=16),
  f'<path d="M38 72Q60 86 82 72" fill="none" stroke="{INK}" stroke-width="3.8" stroke-linecap="round"/>',
  blush(x1=30, x2=90, y=66, rx=6, ry=3.6),
  lotus(98, 92, 0.7),
)

# Lv3 Nilüfer Bilgesi: dev nilüferin üstünde huzurla süzülen ruh
lpet = []
for ang in [-80, -52, -26, 26, 52, 80]:
    lpet.append(f'<path d="M60 106Q42 80 60 50Q78 80 60 106Z" transform="rotate({ang} 60 106)" fill="#FF8FC0" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>')
lotus3 = svg(
  f'<circle cx="60" cy="54" r="46" fill="none" stroke="#9EF0E6" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/>',
  *lpet,
  f'<path d="M30 78Q28 42 60 38Q92 42 90 78Q86 94 60 94Q34 94 30 78Z" fill="#3CC8B4" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>',
  f'<path d="M60 104Q50 92 60 80Q70 92 60 104Z" fill="#FFC0DE" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>',
  f'<path d="M38 52Q44 44 54 44" fill="none" stroke="#9EF0E6" stroke-width="4" stroke-linecap="round"/>',
  f'<path d="M60 44L64 50L60 56L56 50Z" fill="#4FD1E8" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>',
  happy_eyes(x1=48, x2=72, y=64, w=7.5),
  blush(x1=38, x2=82, y=74, rx=5.5, ry=3.4, op=.55),
  smile(60, 78, 5, 4, 3.2),
  f'<circle cx="14" cy="40" r="6" fill="#8FE0FF" stroke="{INK}" stroke-width="3"/>',
  f'<circle cx="106" cy="40" r="6" fill="#8FE0FF" stroke="{INK}" stroke-width="3"/>',
  f'<circle cx="60" cy="10" r="5" fill="#8FE0FF" stroke="{INK}" stroke-width="2.6"/>',
)

# ---------------- GÜZ (Orman + Ateş) ----------------
def maple(cx, cy, s=1.0, fill='#FF6B3D', rot=0):
    # sade akçaağaç yaprağı: 5 uç, yuvarlak köşeler
    right = [(0, -14), (3.5, -7), (11, -9), (8, -2), (13, 3), (5, 3), (6, 9), (0, 5)]
    left = [(-x, y) for x, y in reversed(right[1:-1])]
    pts = right + left
    d = 'M' + 'L'.join(f'{cx + x * s:.1f} {cy + y * s:.1f}' for x, y in pts) + 'Z'
    return (f'<g transform="rotate({rot} {cx} {cy})"><path d="{d}" fill="{fill}" stroke="{INK}" stroke-width="{2.4*s:.1f}" stroke-linejoin="round"/>'
            f'<path d="M{cx} {cy-8*s:.1f}L{cx} {cy+12*s:.1f}" stroke="{INK}" stroke-width="{2*s:.1f}" stroke-linecap="round"/></g>')

# Lv1 Güzcük: başında akçaağaç yaprağı olan turuncu yumak
autumn1 = svg(
  maple(20, 30, 0.7, '#FFC93C', -20), maple(102, 52, 0.6, '#FF6B3D', 25),
  f'<ellipse cx="60" cy="78" rx="35" ry="31" fill="#FF9F43" stroke="{INK}" stroke-width="5"/>',
  f'<ellipse cx="60" cy="92" rx="20" ry="11" fill="#FFD9A8"/>',
  maple(62, 40, 1.35, '#E8452A', 12),
  eyes(x1=47, x2=73, y=74, rx=8.5, ry=10, pr=4.8),
  blush(x1=35, x2=85, y=87, rx=6, ry=3.6),
  smile(60, 88, 6, 6),
)

# Lv2 Balkabağı: yaprak şapkalı, içi sıcacık parlayan balkabağı
autumn2 = svg(
  f'<path d="M64 26Q76 10 92 14Q86 28 70 30" fill="#5FCF6A" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>',
  f'<path d="M58 34Q56 24 62 16" fill="none" stroke="{INK}" stroke-width="10" stroke-linecap="round"/>',
  f'<path d="M58 34Q56 24 62 16" fill="none" stroke="#7A5232" stroke-width="5" stroke-linecap="round"/>',
  f'<path d="M50 30Q36 20 30 28Q28 34 34 34" fill="none" stroke="#5FCF6A" stroke-width="3" stroke-linecap="round"/>',
  f'<ellipse cx="34" cy="72" rx="24" ry="34" fill="#FF8A2B" stroke="{INK}" stroke-width="5"/>',
  f'<ellipse cx="86" cy="72" rx="24" ry="34" fill="#FF8A2B" stroke="{INK}" stroke-width="5"/>',
  f'<ellipse cx="60" cy="72" rx="26" ry="38" fill="#FF9F43" stroke="{INK}" stroke-width="5"/>',
  f'<path d="M22 54Q20 72 24 88M98 54Q100 72 96 88" fill="none" stroke="#FFB868" stroke-width="3.5" stroke-linecap="round"/>',
  f'<ellipse cx="60" cy="96" rx="16" ry="8" fill="#FFD27A" opacity=".8"/>',
  eyes(x1=48, x2=72, y=68, rx=8, ry=9.5, pr=4.6),
  blush(x1=30, x2=90, y=80, rx=7, ry=4.2, op=.55, color='#E8452A'),
  f'<path d="M50 82Q60 92 70 82" fill="none" stroke="{INK}" stroke-width="3.5" stroke-linecap="round"/>',
  sparkle(14, 24, 3), sparkle(108, 96, 2.6),
)

# Lv3 Ateşböceği Kraliçesi: feneri parlayan, yaprak taçlı ateşböceği
autumn3 = svg(
  f'<circle cx="60" cy="96" r="22" fill="none" stroke="#FFE08A" stroke-width="3" stroke-dasharray="3 6" stroke-linecap="round"/>',
  f'<path d="M48 26Q38 10 26 12M72 26Q82 10 94 12" fill="none" stroke="{INK}" stroke-width="3.5" stroke-linecap="round"/>',
  f'<circle cx="25" cy="12" r="5" fill="#FFE08A" stroke="{INK}" stroke-width="2.6"/>',
  f'<circle cx="95" cy="12" r="5" fill="#FFE08A" stroke="{INK}" stroke-width="2.6"/>',
  f'<path d="M44 60Q14 36 6 56Q4 76 40 72Z" fill="#E2F4FF" opacity=".9" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>',
  f'<path d="M76 60Q106 36 114 56Q116 76 80 72Z" fill="#E2F4FF" opacity=".9" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>',
  f'<path d="M14 58Q26 56 36 64M106 58Q94 56 84 64" fill="none" stroke="#9CC9E8" stroke-width="2.4" stroke-linecap="round"/>',
  f'<ellipse cx="60" cy="96" rx="17" ry="15" fill="#FFE066" stroke="{INK}" stroke-width="4.5"/>',
  f'<ellipse cx="60" cy="98" rx="9" ry="7" fill="#FFF7C2"/>',
  f'<path d="M44 90Q60 84 76 90" fill="none" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>',
  f'<ellipse cx="60" cy="52" rx="28" ry="27" fill="#C9542B" stroke="{INK}" stroke-width="5"/>',
  f'<path d="M40 40Q46 32 56 30" fill="none" stroke="#E8875A" stroke-width="4" stroke-linecap="round"/>',
  maple(48, 26, 0.75, '#FFC93C', -15), maple(60, 22, 0.85, '#FF6B3D', 0), maple(72, 26, 0.75, '#FFC93C', 15),
  eyes(x1=48, x2=72, y=52, rx=8, ry=9.5, pr=4.6),
  blush(x1=37, x2=83, y=64, rx=5.5, ry=3.4),
  smile(60, 65, 5, 5, 3.2),
  sparkle(30, 100, 3), sparkle(92, 104, 3), sparkle(104, 82, 2.4),
)

for name, s in [('steam-2', steam2), ('steam-3', steam3), ('lotus-1', lotus1), ('lotus-2', lotus2), ('lotus-3', lotus3),
                ('autumn-1', autumn1), ('autumn-2', autumn2), ('autumn-3', autumn3)]:
    write(OUT + name + '.svg', s)
print('ok')
