import math, sys
sys.path.insert(0, '/home/claude/bloblings/tools')
from art_common import *
OUT = '/home/claude/bloblings/web/assets/blobs/'

# 1. arkadaş: Dostcuk — kalp biçimli, el sallayan pembe canavar
pal1 = svg(
  f'<path d="M60 22L60 8" stroke="{INK}" stroke-width="3.5" stroke-linecap="round"/>',
  f'<path d="M60 10C56 2 46 6 50 13L60 20L70 13C74 6 64 2 60 10Z" fill="#FF4F7B" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>',
  f'<path d="M24 66Q8 56 10 44" fill="none" stroke="{INK}" stroke-width="11" stroke-linecap="round"/>',
  f'<path d="M24 66Q8 56 10 44" fill="none" stroke="#FF8FC0" stroke-width="5" stroke-linecap="round"/>',
  f'<path d="M96 72Q110 76 112 88" fill="none" stroke="{INK}" stroke-width="11" stroke-linecap="round"/>',
  f'<path d="M96 72Q110 76 112 88" fill="none" stroke="#FF8FC0" stroke-width="5" stroke-linecap="round"/>',
  f'<path d="M60 110C30 92 14 78 14 56C14 36 30 24 44 26C52 27 57 32 60 38C63 32 68 27 76 26C90 24 106 36 106 56C106 78 90 92 60 110Z" fill="#FF8FC0" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>',
  f'<path d="M26 46Q30 36 40 34" fill="none" stroke="#FFD1E6" stroke-width="5" stroke-linecap="round"/>',
  f'<ellipse cx="60" cy="86" rx="16" ry="9" fill="#FFD1E6"/>',
  eyes(x1=47, x2=73, y=62, rx=8.5, ry=10, pr=4.8),
  blush(x1=34, x2=86, y=76, rx=6, ry=3.6, color='#FF4F7B', op=.55),
  smile(60, 78, 6, 6),
  sparkle(16, 22, 3), sparkle(104, 30, 3.4), sparkle(100, 104, 2.6),
)

# 3. arkadaş: Yıldız Dost — kanatlı, gülümseyen yıldız
pts = []
for i in range(10):
    r = 50 if i % 2 == 0 else 24
    a = -math.pi / 2 + i * math.pi / 5
    pts.append((60 + r * math.cos(a), 64 + r * math.sin(a)))
star = 'M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + 'Z'
pal2 = svg(
  f'<path d="M30 56Q8 40 4 58Q12 70 30 66Z" fill="#E2F4FF" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>',
  f'<path d="M90 56Q112 40 116 58Q108 70 90 66Z" fill="#E2F4FF" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>',
  f'<path d="{star}" fill="#FFC93C" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>',
  f'<path d="M48 40L56 26" stroke="#FFF2A8" stroke-width="5" stroke-linecap="round"/>',
  f'<circle cx="60" cy="70" r="20" fill="#FFE08A"/>',
  eyes(x1=50, x2=70, y=64, rx=7, ry=8.5, pr=4.2),
  blush(x1=42, x2=78, y=76, rx=4.5, ry=3, op=.5),
  smile(60, 77, 5, 5, 3.2),
  sparkle(14, 20, 3.2, '#FFF2A8'), sparkle(106, 18, 3.6, '#FFF2A8'), sparkle(104, 100, 3, '#FFF2A8'), sparkle(16, 98, 2.6, '#FFF2A8'),
)

# 5. arkadaş: Gökkuşağı Ruhu — gökkuşağı yeleli, altın boynuzlu bulut ruh
arcs = []
for k, col in enumerate(['#FF6B6B', '#FF9F43', '#FFC93C', '#5FCF6A', '#4FB6FF', '#B49BFF']):
    R = 52 - k * 5.2
    arcs.append(f'<path d="M{60 - R:.1f} 74A{R:.1f} {R:.1f} 0 0 1 {60 + R:.1f} 74" fill="none" stroke="{col}" stroke-width="5.6"/>')
pal3 = svg(
  f'<path d="M7 74A53 53 0 0 1 113 74" fill="none" stroke="{INK}" stroke-width="3"/>',
  *arcs,
  f'<path d="M60 38L54 12L66 12Z" fill="#FFC93C" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>',
  f'<path d="M56 30h8M57 22h6" stroke="#E0A020" stroke-width="2.4" stroke-linecap="round"/>',
  f'<circle cx="36" cy="80" r="18" fill="#FFFFFF" stroke="{INK}" stroke-width="5"/>',
  f'<circle cx="84" cy="80" r="18" fill="#FFFFFF" stroke="{INK}" stroke-width="5"/>',
  f'<ellipse cx="60" cy="74" rx="30" ry="32" fill="#FFFFFF" stroke="{INK}" stroke-width="5"/>',
  f'<path d="M22 92Q20 108 40 108L80 108Q100 108 98 92" fill="#FFFFFF" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>',
  f'<circle cx="36" cy="80" r="15.5" fill="#FFFFFF"/><circle cx="84" cy="80" r="15.5" fill="#FFFFFF"/><ellipse cx="60" cy="88" rx="36" ry="17" fill="#FFFFFF"/>',
  f'<path d="M40 54Q46 46 56 44" fill="none" stroke="#E2F4FF" stroke-width="4" stroke-linecap="round"/>',
  eyes(x1=49, x2=71, y=72, rx=8, ry=9.5, pr=4.6),
  blush(x1=38, x2=82, y=84, rx=5.5, ry=3.4, color='#FF8FC0', op=.6),
  smile(60, 86, 5, 5, 3.2),
  sparkle(12, 22, 3), sparkle(108, 26, 3), sparkle(108, 104, 2.6, '#B49BFF'),
)

for name, s in [('pal1-1', pal1), ('pal2-1', pal2), ('pal3-1', pal3)]:
    write(OUT + name + '.svg', s)
print('ok')
