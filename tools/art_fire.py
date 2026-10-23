import math, sys
sys.path.insert(0, '/home/claude/bloblings/tools')
from art_common import *
OUT = '/home/claude/bloblings/web/assets/blobs/'

# ---- Lv6 Lavtaş: tepesinden lav fışkıran taş ----
fire6 = svg(
  f'<path d="M60 32C53 24 55 14 61 6C63 14 70 18 67 30Z" fill="#FFC93C" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>',
  f'<circle cx="40" cy="18" r="4.5" fill="#FF8A3D" stroke="{INK}" stroke-width="2.6"/>',
  f'<circle cx="82" cy="12" r="3.6" fill="#FF8A3D" stroke="{INK}" stroke-width="2.4"/>',
  f'<circle cx="92" cy="26" r="2.6" fill="#FFC93C" stroke="{INK}" stroke-width="2"/>',
  f'<ellipse cx="43" cy="109" rx="11" ry="6.5" fill="#3B3044" stroke="{INK}" stroke-width="4"/>',
  f'<ellipse cx="77" cy="109" rx="11" ry="6.5" fill="#3B3044" stroke="{INK}" stroke-width="4"/>',
  f'<path d="M18 100Q12 80 20 64Q24 50 38 44L46 34L60 38L74 33L84 44Q98 50 102 66Q108 82 102 100Q60 114 18 100Z" fill="#4E4160" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>',
  f'<path d="M22 66Q26 54 38 48M98 66Q96 56 86 50" fill="none" stroke="#6E5F84" stroke-width="5" stroke-linecap="round"/>',
  f'<path d="M37 45L46 34L60 38L74 33L84 45Q80 51 76 48Q74 57 69 54Q67 46 63 50Q61 59 57 55Q55 47 51 50Q49 57 45 53Q43 47 40 49Z" fill="#FF8A3D" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>',
  f'<path d="M48 40Q60 45 72 38" fill="none" stroke="#FFD24A" stroke-width="3.5" stroke-linecap="round"/>',
  f'<ellipse cx="60" cy="94" rx="20" ry="10" fill="#5E4F72"/>',
  f'<path d="M24 74l8 4l-3 7M96 76l-7 4l3 8M38 100l6-6l6 3M82 100l-6-6l-6 3" fill="none" stroke="#FF8A3D" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>',
  eyes(),
  blush(color='#FF7A2E', op=.6),
  f'<path d="M51 86q9 8 18 -1" fill="none" stroke="{INK}" stroke-width="3.5" stroke-linecap="round"/>',
  f'<path d="M62 86.5l2.5 4.5l2.5-5z" fill="#fff" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>',
)

# ---- Lv7 Anka: alev kuyruklu anka kuşu ----
tail = []
for ang, col in [(-62, '#FFC93C'), (-31, '#FF8A3D'), (0, '#FFC93C'), (31, '#FF8A3D'), (62, '#FFC93C')]:
    tail.append(f'<path d="M60 70C52 52 52 30 60 10C68 30 68 52 60 70Z" transform="rotate({ang} 60 76)" fill="{col}" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>')
fire7 = svg(
  *tail,
  f'<path d="M48 107l-4 7M48 107l0 8M48 107l4 7M72 107l-4 7M72 107l0 8M72 107l4 7" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>',
  f'<path d="M48 107l-4 7M48 107l0 8M48 107l4 7M72 107l-4 7M72 107l0 8M72 107l4 7" stroke="#FFC93C" stroke-width="2.6" stroke-linecap="round"/>',
  f'<path d="M33 72Q14 68 6 82Q14 81 16 88Q20 82 24 90Q26 83 34 86Z" fill="#FF8A3D" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>',
  f'<path d="M87 72Q106 68 114 82Q106 81 104 88Q100 82 96 90Q94 83 86 86Z" fill="#FF8A3D" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>',
  f'<ellipse cx="60" cy="80" rx="31" ry="29" fill="#F2492E" stroke="{INK}" stroke-width="5"/>',
  f'<ellipse cx="60" cy="94" rx="18" ry="12" fill="#FFC093"/>',
  f'<path d="M50 54C46 44 48 38 52 32C54 40 58 44 56 53Z" fill="#FFC93C" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>',
  f'<path d="M58 52C56 40 58 32 63 24C65 34 68 42 64 52Z" fill="#FFC93C" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>',
  f'<path d="M66 54C67 46 70 42 74 38C74 46 73 50 70 55Z" fill="#FFC93C" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>',
  eyes(x1=48, x2=72, y=74, rx=8.5, ry=10),
  f'<path d="M54 83Q60 81 66 83L60 91Z" fill="#FFC93C" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>',
  f'<path d="M55 95q5 3 10 0" fill="none" stroke="#F09A6A" stroke-width="2.6" stroke-linecap="round"/>',
  blush(x1=36, x2=84, y=86, rx=6, ry=3.6),
  sparkle(14, 30), sparkle(106, 34, 3), sparkle(101, 108, 2.6),
)

# ---- Lv8 Güneşyele: alev yeleli güneş aslanı ----
rays = []
N = 16
for i in range(N):
    a = 2 * math.pi * i / N
    a1 = a - math.pi / N * 0.75
    a2 = a + math.pi / N * 0.75
    R1, R2 = 36, 50
    cx, cy = 60, 64
    p1 = (cx + R1 * math.cos(a1), cy + R1 * math.sin(a1))
    p2 = (cx + R2 * math.cos(a), cy + R2 * math.sin(a))
    p3 = (cx + R1 * math.cos(a2), cy + R1 * math.sin(a2))
    rays.append(f'M{p1[0]:.1f} {p1[1]:.1f}L{p2[0]:.1f} {p2[1]:.1f}L{p3[0]:.1f} {p3[1]:.1f}')
fire8 = svg(
  f'<path d="{"".join(rays)}" fill="#FFC93C" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>',
  f'<circle cx="60" cy="64" r="40" fill="#FF8A3D" stroke="{INK}" stroke-width="5"/>',
  f'<circle cx="60" cy="64" r="40" fill="none" stroke="#FFB45E" stroke-width="5" stroke-dasharray="7 9"/>',
  f'<circle cx="36" cy="42" r="8" fill="#FFD27A" stroke="{INK}" stroke-width="4"/>',
  f'<circle cx="84" cy="42" r="8" fill="#FFD27A" stroke="{INK}" stroke-width="4"/>',
  f'<circle cx="36" cy="42" r="3.5" fill="#F08A5A"/>',
  f'<circle cx="84" cy="42" r="3.5" fill="#FF9E7A"/>',
  f'<ellipse cx="60" cy="68" rx="29" ry="27" fill="#FFD27A" stroke="{INK}" stroke-width="5"/>',
  f'<ellipse cx="60" cy="82" rx="15" ry="10" fill="#FFF0C9"/>',
  eyes(x1=48, x2=72, y=63, rx=8, ry=9.5, pr=4.6),
  f'<path d="M55 75Q60 72 65 75L60 80Z" fill="#7A3A2A" stroke="{INK}" stroke-width="2.6" stroke-linejoin="round"/>',
  f'<path d="M60 80v3M52 83q4 4 8 0q4 4 8 0" fill="none" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>',
  f'<path d="M40 78l-9-2M40 82l-9 2M80 78l9-2M80 82l9 2" stroke="{INK}" stroke-width="2" stroke-linecap="round"/>',
  blush(x1=40, x2=80, y=73, rx=5, ry=3.2, op=.45),
  f'<ellipse cx="44" cy="107" rx="11" ry="7" fill="#FFD27A" stroke="{INK}" stroke-width="4"/>',
  f'<ellipse cx="76" cy="107" rx="11" ry="7" fill="#FFD27A" stroke="{INK}" stroke-width="4"/>',
  f'<path d="M41 104v5M47 104v5M73 104v5M79 104v5" stroke="{INK}" stroke-width="2" stroke-linecap="round"/>',
)

# ---- Lv9 Ateş Cini: elinde ateş topu, dumandan kuyruklu cin ----
fire9 = svg(
  f'<path d="M46 70C42 86 50 98 64 102C76 105 79 111 72 114C56 117 38 108 36 94C34 84 38 76 46 70Z" fill="#E8365C" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>',
  f'<path d="M48 92Q54 100 64 102" fill="none" stroke="#FF8FA6" stroke-width="3.5" stroke-linecap="round"/>',
  f'<path d="M38 66Q26 62 22 48M84 66Q96 70 92 80Q88 84 84 80" fill="none" stroke="{INK}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>',
  f'<path d="M38 66Q26 62 22 48M84 66Q96 70 92 80Q88 84 84 80" fill="none" stroke="#E8365C" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>',
  f'<path d="M25 56l-6 -2M87 72l6 3" stroke="#FFC93C" stroke-width="4" stroke-linecap="round"/>',
  f'<path d="M20 44C13 38 14 29 21 22C22 30 28 32 27 40C26 44 23 46 20 44Z" fill="#FFC93C" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>',
  f'<path d="M21 41C18 38 19 34 22 31C23 35 25 36 24 39Z" fill="#FF7A45"/>',
  f'<path d="M60 26C54 18 55 9 62 2C64 10 70 14 67 23Z" fill="#FFC93C" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>',
  f'<ellipse cx="60" cy="50" rx="27" ry="26" fill="#E8365C" stroke="{INK}" stroke-width="5"/>',
  f'<path d="M41 36Q47 28 56 27" fill="none" stroke="#FF8FA6" stroke-width="4" stroke-linecap="round"/>',
  f'<circle cx="33" cy="58" r="4.5" fill="#FFC93C" stroke="{INK}" stroke-width="2.5"/>',
  f'<circle cx="87" cy="58" r="4.5" fill="#FFC93C" stroke="{INK}" stroke-width="2.5"/>',
  eyes(x1=49, x2=71, y=49, rx=8, ry=9, pr=4.4, look=(1, 1.5)),
  f'<path d="M41 38l12 4M79 38l-12 4" stroke="{INK}" stroke-width="3.6" stroke-linecap="round"/>',
  blush(x1=40, x2=80, y=61, rx=5, ry=3.2, op=.5, color='#FFC93C'),
  f'<path d="M53 62q8 5 15 -3" fill="none" stroke="{INK}" stroke-width="3.4" stroke-linecap="round"/>',
  sparkle(104, 22, 3), sparkle(108, 98, 2.6), sparkle(12, 74, 2.6),
)

# ---- Lv10 Güneş Ejderi: güneş halesi, taç ve altın kanatlar ----
halo = []
N = 12
for i in range(N):
    a = 2 * math.pi * i / N - math.pi / 2
    x1, y1 = 60 + 44 * math.cos(a), 58 + 44 * math.sin(a)
    x2, y2 = 60 + 54 * math.cos(a), 58 + 54 * math.sin(a)
    halo.append(f'M{x1:.1f} {y1:.1f}L{x2:.1f} {y2:.1f}')
fire10 = svg(
  f'<circle cx="60" cy="58" r="44" fill="none" stroke="#FFC93C" stroke-width="4" opacity=".75"/>',
  f'<path d="{"".join(halo)}" stroke="#FFC93C" stroke-width="5" stroke-linecap="round" opacity=".9"/>',
  f'<path d="M84 102Q108 106 111 86Q112 78 105 76" fill="none" stroke="{INK}" stroke-width="13" stroke-linecap="round"/>',
  f'<path d="M84 102Q108 106 111 86Q112 78 105 76" fill="none" stroke="#D93A22" stroke-width="6" stroke-linecap="round"/>',
  f'<path d="M105 78C99 72 100 64 105 57C110 64 111 72 105 78Z" fill="#FFC93C" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>',
  f'<path d="M40 62L2 14Q12 30 2 40Q15 42 11 54Q22 50 26 64Z" fill="#FFC93C" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>',
  f'<path d="M80 62L118 14Q108 30 118 40Q105 42 109 54Q98 50 94 64Z" fill="#FFC93C" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>',
  f'<path d="M36 60L12 30M34 62L8 46M32 64L18 58M84 60L108 30M86 62L112 46M88 64L102 58" stroke="#E0A020" stroke-width="2.6" stroke-linecap="round"/>',
  f'<path d="M40 54Q24 42 24 24Q34 38 50 45Z" fill="#FFF3D6" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>',
  f'<path d="M80 54Q96 42 96 24Q86 38 70 45Z" fill="#FFF3D6" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>',
  f'<ellipse cx="44" cy="110" rx="11" ry="6.5" fill="#A82A16" stroke="{INK}" stroke-width="4"/>',
  f'<ellipse cx="76" cy="110" rx="11" ry="6.5" fill="#A82A16" stroke="{INK}" stroke-width="4"/>',
  f'<ellipse cx="60" cy="77" rx="36" ry="33" fill="#D93A22" stroke="{INK}" stroke-width="5"/>',
  f'<path d="M47 91Q60 87 73 91L70 105Q60 110 50 105Z" fill="#FFD27A" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>',
  f'<path d="M51 97h18M53 102h14" stroke="#E0A020" stroke-width="2.5" stroke-linecap="round"/>',
  crown(60, 48, w=30, h=19),
  eyes(x1=47, x2=73, y=67, rx=8.5, ry=9.5, pr=4.8),
  f'<path d="M37 54l13 4M83 54l-13 4" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>',
  blush(x1=35, x2=85, y=78, rx=6, ry=3.6),
  f'<path d="M52 78q8 7 16 0" fill="none" stroke="{INK}" stroke-width="3.5" stroke-linecap="round"/>',
  f'<path d="M54.5 80l2.2 4.4l2.2-4.6zM61.5 80.2l2.2 4.4l2.2-4.6z" fill="#fff" stroke="{INK}" stroke-width="1.9" stroke-linejoin="round"/>',
  sparkle(14, 96, 3), sparkle(108, 106, 2.6),
)

for name, s in [('fire-6', fire6), ('fire-7', fire7), ('fire-8', fire8), ('fire-9', fire9), ('fire-10', fire10)]:
    write(OUT + name + '.svg', s)
print('ok')
