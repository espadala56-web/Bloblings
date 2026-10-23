import math, sys
sys.path.insert(0, '/home/claude/bloblings/tools')
from art_common import *
OUT = '/home/claude/bloblings/web/assets/blobs/'

# ---- Lv6 Balonbalığı: dikenli, şişkin, yanakları kocaman ----
spikes = []
for i in range(16):
    a = 2 * math.pi * i / 16 + math.pi / 16
    if 1.2 < a < 1.95:  # alt orta: kuyruk/ayak boşluğu
        continue
    cx, cy, R = 60, 68, 37
    a1, a2 = a - 0.13, a + 0.13
    p1 = (cx + R * math.cos(a1), cy + R * math.sin(a1))
    p2 = (cx + (R + 10) * math.cos(a), cy + (R + 10) * math.sin(a))
    p3 = (cx + R * math.cos(a2), cy + R * math.sin(a2))
    spikes.append(f'M{p1[0]:.1f} {p1[1]:.1f}L{p2[0]:.1f} {p2[1]:.1f}L{p3[0]:.1f} {p3[1]:.1f}Z')
water6 = svg(
  f'<path d="{"".join(spikes)}" fill="#D7F1FF" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>',
  f'<path d="M96 70L114 56Q112 70 116 84Z" fill="#4FB6FF" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>',
  f'<circle cx="60" cy="68" r="38" fill="#4FB6FF" stroke="{INK}" stroke-width="5"/>',
  f'<path d="M26 74Q60 112 94 74Q92 104 60 106Q28 104 26 74Z" fill="#FFF1B8"/>',
  f'<path d="M40 92l3 4M52 98l2 4M66 98l-2 4M80 92l-3 4" stroke="#E8C86A" stroke-width="2.4" stroke-linecap="round"/>',
  f'<path d="M30 44Q38 34 50 32" fill="none" stroke="#B5E3FF" stroke-width="4.5" stroke-linecap="round"/>',
  f'<path d="M22 80Q12 82 10 92Q18 92 24 88Z" fill="#8FD0FF" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>',
  f'<path d="M98 80Q108 82 110 92Q102 92 96 88Z" fill="#8FD0FF" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>',
  eyes(x1=46, x2=74, y=60, rx=9.5, ry=11, pr=5.4),
  blush(x1=34, x2=86, y=76, rx=8, ry=5, op=.55),
  f'<ellipse cx="60" cy="80" rx="5.5" ry="5" fill="#FF7A9A" stroke="{INK}" stroke-width="3.2"/>',
  f'<circle cx="18" cy="26" r="4.5" fill="#D7F1FF" stroke="{INK}" stroke-width="2.5"/>',
  f'<circle cx="10" cy="40" r="2.8" fill="#D7F1FF" stroke="{INK}" stroke-width="2"/>',
)

# ---- Lv7 Ahtapaşa: bıyıklı, taçlı ahtapot ----
tent = []
for d in ['M36 82Q22 92 26 104Q30 112 38 106',
          'M46 90Q40 104 46 112Q52 116 54 108',
          'M74 90Q80 104 74 112Q68 116 66 108',
          'M84 82Q98 92 94 104Q90 112 82 106']:
    tent.append(f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="15" stroke-linecap="round"/>')
    tent.append(f'<path d="{d}" fill="none" stroke="#6E7CFF" stroke-width="8" stroke-linecap="round"/>')
water7 = svg(
  *tent,
  f'<path d="M30 78Q26 44 60 40Q94 44 90 78Q88 92 60 94Q32 92 30 78Z" fill="#6E7CFF" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>',
  f'<path d="M24 56Q26 22 60 20Q94 22 96 56Q96 72 60 74Q24 72 24 56Z" fill="#6E7CFF" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>',
  f'<path d="M34 36Q42 28 54 26" fill="none" stroke="#A9B2FF" stroke-width="4.5" stroke-linecap="round"/>',
  f'<circle cx="84" cy="44" r="3.4" fill="#A9B2FF"/><circle cx="90" cy="54" r="2.4" fill="#A9B2FF"/><circle cx="32" cy="58" r="2.6" fill="#A9B2FF"/>',
  crown(62, 24, w=24, h=15),
  eyes(x1=47, x2=73, y=56, rx=8.5, ry=10, pr=4.8),
  f'<circle cx="74.5" cy="58" r="11.5" fill="none" stroke="#FFC93C" stroke-width="2.8"/>',
  f'<path d="M85 62Q90 72 86 82" fill="none" stroke="#FFC93C" stroke-width="2" stroke-dasharray="3 2.5"/>',
  f'<path d="M60 74Q52 66 42 72Q46 78 52 76Q56 76 60 74Q64 76 68 76Q74 78 78 72Q68 66 60 74Z" fill="#3B2A5C" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>',
  blush(x1=34, x2=86, y=68, rx=5.5, ry=3.4, op=.5),
  f'<path d="M55 82q5 4 10 0" fill="none" stroke="{INK}" stroke-width="3.2" stroke-linecap="round"/>',
)

# ---- Lv8 Buzboynuz: sarmal boynuzlu, benekli narval ----
water8 = svg(
  f'<path d="M46 42L32 2L62 38Z" fill="#F2FBFF" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>',
  f'<path d="M36 12l7 0M38 20l10 1M41 28l13 2" stroke="#7FB8F0" stroke-width="3" stroke-linecap="round"/>',
  f'<path d="M96 84Q110 74 114 60Q104 62 100 70Q102 58 94 50Q92 64 92 76Z" fill="#7FB8F0" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>',
  f'<ellipse cx="44" cy="109" rx="10" ry="5.5" fill="#5A93D8" stroke="{INK}" stroke-width="3.5"/>',
  f'<ellipse cx="76" cy="109" rx="10" ry="5.5" fill="#5A93D8" stroke="{INK}" stroke-width="3.5"/>',
  f'<ellipse cx="60" cy="74" rx="40" ry="34" fill="#7FB8F0" stroke="{INK}" stroke-width="5"/>',
  f'<path d="M24 86Q60 118 96 86Q90 106 60 107Q30 106 24 86Z" fill="#E6F4FF"/>',
  f'<circle cx="36" cy="58" r="3.4" fill="#5A93D8"/><circle cx="84" cy="54" r="4" fill="#5A93D8"/><circle cx="90" cy="68" r="2.6" fill="#5A93D8"/><circle cx="28" cy="72" r="2.6" fill="#5A93D8"/><circle cx="74" cy="44" r="2.6" fill="#5A93D8"/>',
  f'<path d="M20 82Q8 86 8 98Q16 96 22 92Z" fill="#5A93D8" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>',
  eyes(x1=47, x2=73, y=70, rx=8.5, ry=10, pr=4.8),
  blush(x1=35, x2=85, y=83, rx=6, ry=3.6, op=.5),
  smile(60, 85, 6, 6),
  sparkle(100, 22, 4, '#D7F1FF'), sparkle(110, 36, 2.6, '#D7F1FF'), sparkle(16, 40, 3, '#D7F1FF'),
)

# ---- Lv9 Denizatı Kral: kıvrık kuyruklu, taçlı denizatı ----
water9 = svg(
  f'<path d="M30 60Q14 56 12 70Q20 70 22 78Q28 70 34 74Z" fill="#7FE6D9" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>',
  f'<path d="M44 80Q38 98 52 106Q66 112 72 102Q76 92 66 90Q58 90 60 98" fill="none" stroke="{INK}" stroke-width="17" stroke-linecap="round"/>',
  f'<path d="M44 80Q38 98 52 106Q66 112 72 102Q76 92 66 90Q58 90 60 98" fill="none" stroke="#22B5C9" stroke-width="9" stroke-linecap="round"/>',
  f'<ellipse cx="50" cy="70" rx="20" ry="20" fill="#22B5C9" stroke="{INK}" stroke-width="5"/>',
  f'<path d="M56 62Q66 70 60 86" fill="none" stroke="#9EF0E6" stroke-width="7" stroke-linecap="round"/>',
  f'<path d="M58 64h8M60 71h7M60 78h6" stroke="#22B5C9" stroke-width="2.4" stroke-linecap="round"/>',
  f'<path d="M70 44L86 52Q92 55 90 60Q87 64 82 60L68 54Z" fill="#22B5C9" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>',
  f'<ellipse cx="87.5" cy="58" rx="2.2" ry="2.8" transform="rotate(30 87.5 58)" fill="{INK}"/>',
  f'<circle cx="54" cy="42" r="24" fill="#22B5C9" stroke="{INK}" stroke-width="5"/>',
  f'<path d="M36 30Q42 22 52 20" fill="none" stroke="#9EF0E6" stroke-width="4" stroke-linecap="round"/>',
  crown(52, 21, w=24, h=15, gem='#4FD1E8'),
  eyes(x1=44, x2=63, y=43, rx=7.5, ry=9, pr=4.3, look=(1.5, 1.5)),
  blush(x1=36, x2=72, y=55, rx=4.5, ry=3, op=.5),
  sparkle(100, 72, 3, '#D7F1FF'), sparkle(16, 30, 3, '#D7F1FF'),
  f'<circle cx="104" cy="22" r="4" fill="#D7F1FF" stroke="{INK}" stroke-width="2.4"/>',
  f'<circle cx="96" cy="12" r="2.5" fill="#D7F1FF" stroke="{INK}" stroke-width="2"/>',
)

# ---- Lv10 Derin Hükümdar: ışıklı, taçlı fener balığı ----
water10 = svg(
  f'<circle cx="94" cy="22" r="13" fill="none" stroke="#FFF6A8" stroke-width="3" opacity=".55"/>',
  f'<path d="M58 40Q60 14 84 12Q92 12 94 18" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>',
  f'<path d="M58 40Q60 14 84 12Q92 12 94 18" fill="none" stroke="#3D6BB3" stroke-width="3" stroke-linecap="round"/>',
  f'<circle cx="94" cy="22" r="8" fill="#FFF6A8" stroke="{INK}" stroke-width="3.5"/>',
  f'<circle cx="92" cy="20" r="2.6" fill="#fff"/>',
  f'<path d="M22 70Q6 58 4 76Q4 94 22 86Z" fill="#3D6BB3" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>',
  f'<ellipse cx="60" cy="74" rx="42" ry="36" fill="#24407A" stroke="{INK}" stroke-width="5"/>',
  f'<path d="M30 62Q36 46 52 42" fill="none" stroke="#3D6BB3" stroke-width="5" stroke-linecap="round"/>',
  f'<path d="M98 66Q112 64 114 76Q104 76 98 82Z" fill="#3D6BB3" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>',
  f'<circle cx="28" cy="80" r="2.6" fill="#4FD1E8"/><circle cx="34" cy="92" r="2" fill="#4FD1E8"/><circle cx="92" cy="90" r="2.6" fill="#4FD1E8"/><circle cx="86" cy="100" r="2" fill="#4FD1E8"/><circle cx="96" cy="54" r="2" fill="#4FD1E8"/>',
  crown(42, 44, w=22, h=14, gem='#4FD1E8'),
  eyes(x1=47, x2=73, y=64, rx=8.5, ry=10, pr=4.8),
  blush(x1=34, x2=86, y=78, rx=5.5, ry=3.4, op=.45),
  f'<path d="M40 84Q60 106 80 84Q76 98 60 99Q44 98 40 84Z" fill="#14254A" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>',
  f'<path d="M45 87l3 5l3-4M54 91l3 5l3-5M63 91l3 5l3-5M72 88l3 4l3-5" fill="#fff" stroke="{INK}" stroke-width="1.8" stroke-linejoin="round"/>',
  f'<ellipse cx="44" cy="111" rx="10" ry="5" fill="#3D6BB3" stroke="{INK}" stroke-width="3.5"/>',
  f'<ellipse cx="76" cy="111" rx="10" ry="5" fill="#3D6BB3" stroke="{INK}" stroke-width="3.5"/>',
  sparkle(110, 44, 3, '#FFF6A8'), sparkle(12, 30, 2.8, '#4FD1E8'),
)

for name, s in [('water-6', water6), ('water-7', water7), ('water-8', water8), ('water-9', water9), ('water-10', water10)]:
    write(OUT + name + '.svg', s)
print('ok')
