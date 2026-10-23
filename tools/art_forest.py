import math, sys
sys.path.insert(0, '/home/claude/bloblings/tools')
from art_common import *
OUT = '/home/claude/bloblings/web/assets/blobs/'

# ---- Lv6 Mantar Bey: benekli şapkalı mantar ----
forest6 = svg(
  f'<path d="M14 112Q22 102 30 112M90 112Q98 100 106 112" fill="none" stroke="#5FCF6A" stroke-width="4" stroke-linecap="round"/>',
  f'<path d="M34 64Q30 92 36 106Q60 114 84 106Q90 92 86 64Z" fill="#FFF1D6" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>',
  f'<ellipse cx="60" cy="99" rx="18" ry="8" fill="#F2DDB6"/>',
  f'<path d="M6 58Q8 16 60 12Q112 16 114 58Q114 68 100 66Q60 60 20 66Q6 68 6 58Z" fill="#E8453C" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>',
  f'<path d="M24 62Q60 56 96 62" fill="none" stroke="#F2DDB6" stroke-width="3" stroke-linecap="round"/>',
  f'<circle cx="34" cy="38" r="7" fill="#fff" stroke="{INK}" stroke-width="2.6"/>',
  f'<circle cx="62" cy="27" r="8" fill="#fff" stroke="{INK}" stroke-width="2.6"/>',
  f'<circle cx="88" cy="40" r="6" fill="#fff" stroke="{INK}" stroke-width="2.6"/>',
  f'<circle cx="18" cy="54" r="3.5" fill="#fff" stroke="{INK}" stroke-width="2"/>',
  f'<circle cx="104" cy="54" r="3.5" fill="#fff" stroke="{INK}" stroke-width="2"/>',
  f'<circle cx="74" cy="48" r="3.5" fill="#fff" stroke="{INK}" stroke-width="2"/>',
  eyes(x1=49, x2=71, y=80, rx=8, ry=9.5, pr=4.6),
  blush(x1=39, x2=81, y=92, rx=5, ry=3.2, op=.5),
  smile(60, 93, 5, 5, 3.2),
  f'<path d="M34 86Q24 88 22 96M86 86Q96 88 98 96" fill="none" stroke="{INK}" stroke-width="3.5" stroke-linecap="round"/>',
)

# ---- Lv7 Yosunayı: sırtında yosun ve çiçekler büyüyen ayı ----
forest7 = svg(
  f'<circle cx="30" cy="40" r="11" fill="#8A5A3B" stroke="{INK}" stroke-width="4.5"/>',
  f'<circle cx="90" cy="40" r="11" fill="#8A5A3B" stroke="{INK}" stroke-width="4.5"/>',
  f'<circle cx="30" cy="40" r="5" fill="#C98E62"/><circle cx="90" cy="40" r="5" fill="#C98E62"/>',
  f'<ellipse cx="42" cy="109" rx="12" ry="7" fill="#6E4630" stroke="{INK}" stroke-width="4"/>',
  f'<ellipse cx="78" cy="109" rx="12" ry="7" fill="#6E4630" stroke="{INK}" stroke-width="4"/>',
  f'<ellipse cx="60" cy="74" rx="40" ry="36" fill="#8A5A3B" stroke="{INK}" stroke-width="5"/>',
  f'<path d="M22 66Q22 38 60 38Q98 38 98 66Q92 58 84 62Q78 52 70 58Q62 50 54 58Q46 52 40 60Q30 56 22 66Z" fill="#5FCF6A" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>',
  f'<circle cx="44" cy="44" r="4" fill="#FF8FC0" stroke="{INK}" stroke-width="2"/><circle cx="44" cy="44" r="1.5" fill="#FFC93C"/>',
  f'<circle cx="80" cy="46" r="3.4" fill="#fff" stroke="{INK}" stroke-width="2"/><circle cx="80" cy="46" r="1.3" fill="#FFC93C"/>',
  f'<path d="M62 40Q62 32 68 30Q70 38 64 40" fill="#A6E86B" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>',
  f'<path d="M64 40Q64 34 58 32Q56 38 62 40" fill="#A6E86B" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>',
  f'<ellipse cx="60" cy="90" rx="17" ry="12" fill="#C98E62"/>',
  f'<ellipse cx="60" cy="84" rx="6" ry="4.2" fill="{INK}"/>',
  eyes(x1=46, x2=74, y=72, rx=8, ry=9, pr=4.6),
  blush(x1=34, x2=86, y=84, rx=6, ry=3.6, op=.5),
  f'<path d="M60 88v4M54 93q6 5 12 0" fill="none" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>',
)

# ---- Lv8 Bilge Baykuş: gözlüklü, yaprak kanatlı baykuş ----
forest8 = svg(
  f'<path d="M8 108Q60 98 112 108" fill="none" stroke="{INK}" stroke-width="12" stroke-linecap="round"/>',
  f'<path d="M8 108Q60 98 112 108" fill="none" stroke="#9A6A3A" stroke-width="6" stroke-linecap="round"/>',
  f'<path d="M100 104Q108 96 114 98Q110 106 102 106Z" fill="#A6E86B" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>',
  f'<path d="M30 30L26 8L44 22Z" fill="#7FB85A" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>',
  f'<path d="M90 30L94 8L76 22Z" fill="#7FB85A" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>',
  f'<path d="M60 18Q98 18 98 58Q98 96 60 102Q22 96 22 58Q22 18 60 18Z" fill="#5E8F4A" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>',
  f'<path d="M24 56Q8 72 18 96Q30 92 34 78Z" fill="#7FB85A" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>',
  f'<path d="M96 56Q112 72 102 96Q90 92 86 78Z" fill="#7FB85A" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>',
  f'<path d="M22 70Q20 80 24 88M98 70Q100 80 96 88" fill="none" stroke="#4E7A3C" stroke-width="2.4" stroke-linecap="round"/>',
  f'<path d="M42 76Q60 70 78 76Q78 98 60 100Q42 98 42 76Z" fill="#E9F5C9"/>',
  f'<path d="M50 84q4 3 8 0M62 84q4 3 8 0M54 92q3 2 6 0q3 2 6 0" fill="none" stroke="#A9C27E" stroke-width="2.2" stroke-linecap="round"/>',
  f'<circle cx="46" cy="50" r="13" fill="#FFE9A8" stroke="{INK}" stroke-width="3.5"/>',
  f'<circle cx="74" cy="50" r="13" fill="#FFE9A8" stroke="{INK}" stroke-width="3.5"/>',
  eyes(x1=46, x2=74, y=50, rx=8, ry=8.5, pr=4.8, look=(1, 1)),
  f'<circle cx="46" cy="50" r="13" fill="none" stroke="#C98A00" stroke-width="2.6"/>',
  f'<circle cx="74" cy="50" r="13" fill="none" stroke="#C98A00" stroke-width="2.6"/>',
  f'<path d="M58 49q2 -2 4 0" fill="none" stroke="#C98A00" stroke-width="2.6"/>',
  f'<path d="M55 64L65 64L60 72Z" fill="#FFC93C" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>',
  blush(x1=34, x2=86, y=68, rx=5, ry=3.2, op=.45),
)

# ---- Lv9 Sarmaşık Ejderi: yaprak kanatlı, çiçekli ejder ----
forest9 = svg(
  f'<path d="M84 100Q106 106 110 88Q112 78 104 76" fill="none" stroke="{INK}" stroke-width="13" stroke-linecap="round"/>',
  f'<path d="M84 100Q106 106 110 88Q112 78 104 76" fill="none" stroke="#3FAF5A" stroke-width="6" stroke-linecap="round"/>',
  f'<circle cx="104" cy="72" r="7" fill="#FF8FC0" stroke="{INK}" stroke-width="3"/><circle cx="104" cy="72" r="2.6" fill="#FFC93C"/>',
  f'<path d="M40 62Q10 50 4 22Q24 26 32 40Q30 26 22 16Q42 22 46 50Z" fill="#A6E86B" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>',
  f'<path d="M80 62Q110 50 116 22Q96 26 88 40Q90 26 98 16Q78 22 74 50Z" fill="#A6E86B" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>',
  f'<path d="M38 56Q22 44 14 28M82 56Q98 44 106 28" fill="none" stroke="#5FAF3A" stroke-width="2.6" stroke-linecap="round"/>',
  f'<path d="M44 46Q34 30 40 16M40 28Q32 26 28 20M76 46Q86 30 80 16M80 28Q88 26 92 20" fill="none" stroke="{INK}" stroke-width="8" stroke-linecap="round"/>',
  f'<path d="M44 46Q34 30 40 16M40 28Q32 26 28 20M76 46Q86 30 80 16M80 28Q88 26 92 20" fill="none" stroke="#9A6A3A" stroke-width="3.5" stroke-linecap="round"/>',
  f'<ellipse cx="43" cy="109" rx="11" ry="6.5" fill="#2E8A46" stroke="{INK}" stroke-width="4"/>',
  f'<ellipse cx="77" cy="109" rx="11" ry="6.5" fill="#2E8A46" stroke="{INK}" stroke-width="4"/>',
  f'<ellipse cx="60" cy="76" rx="36" ry="33" fill="#3FAF5A" stroke="{INK}" stroke-width="5"/>',
  f'<ellipse cx="60" cy="92" rx="21" ry="14" fill="#C9F5DF"/>',
  f'<path d="M50 96q10 5 20 0M53 102q7 4 14 0" fill="none" stroke="#8FD8B0" stroke-width="2.4" stroke-linecap="round"/>',
  f'<path d="M30 76Q26 84 30 94M90 76Q94 84 90 94" fill="none" stroke="#A6E86B" stroke-width="3" stroke-linecap="round" stroke-dasharray="4 4"/>',
  f'<circle cx="60" cy="44" r="7.5" fill="#FF6FB5" stroke="{INK}" stroke-width="3"/>',
  f'<circle cx="54" cy="40" r="5" fill="#FF8FC0" stroke="{INK}" stroke-width="2.6"/><circle cx="66" cy="40" r="5" fill="#FF8FC0" stroke="{INK}" stroke-width="2.6"/>',
  f'<circle cx="60" cy="44" r="3.4" fill="#FFC93C"/>',
  eyes(x1=47, x2=73, y=69, rx=8.5, ry=9.5, pr=4.8),
  blush(x1=35, x2=85, y=82, rx=6, ry=3.6),
  f'<path d="M52 82q8 7 16 0" fill="none" stroke="{INK}" stroke-width="3.5" stroke-linecap="round"/>',
  f'<path d="M54.5 84l2.2 4.4l2.2-4.6zM61.5 84.2l2.2 4.4l2.2-4.6z" fill="#fff" stroke="{INK}" stroke-width="1.9" stroke-linejoin="round"/>',
)

# ---- Lv10 Dünya Kaplumbağası: sırtında koca bir ağaç taşıyan bilge ----
forest10 = svg(
  f'<path d="M60 56L60 34" stroke="{INK}" stroke-width="13" stroke-linecap="round"/>',
  f'<path d="M60 56L60 34" stroke="#9A6A3A" stroke-width="7" stroke-linecap="round"/>',
  f'<path d="M60 40L46 32M60 44L74 36" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>',
  f'<path d="M60 40L46 32M60 44L74 36" stroke="#9A6A3A" stroke-width="3" stroke-linecap="round"/>',
  f'<path d="M30 30Q22 14 38 10Q44 0 60 4Q76 0 82 10Q98 14 90 30Q96 42 80 42Q72 48 60 42Q48 48 40 42Q24 42 30 30Z" fill="#4FCB6A" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>',
  f'<path d="M40 18Q46 12 54 12" fill="none" stroke="#A6E86B" stroke-width="3.5" stroke-linecap="round"/>',
  f'<circle cx="44" cy="30" r="3.5" fill="#FF6F6F" stroke="{INK}" stroke-width="2"/><circle cx="72" cy="20" r="3.5" fill="#FF6F6F" stroke="{INK}" stroke-width="2"/><circle cx="80" cy="34" r="3.5" fill="#FF6F6F" stroke="{INK}" stroke-width="2"/><circle cx="58" cy="28" r="3" fill="#FFC93C" stroke="{INK}" stroke-width="2"/>',
  f'<ellipse cx="26" cy="106" rx="11" ry="8" fill="#8BC97A" stroke="{INK}" stroke-width="4"/>',
  f'<ellipse cx="94" cy="106" rx="11" ry="8" fill="#8BC97A" stroke="{INK}" stroke-width="4"/>',
  f'<path d="M8 90Q8 54 60 52Q112 54 112 90Q112 98 100 98L20 98Q8 98 8 90Z" fill="#A0703F" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>',
  f'<path d="M36 58L46 74L74 74L84 58M46 74L40 96M74 74L80 96M14 82L40 84M106 82L80 84" fill="none" stroke="#6E4630" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>',
  f'<path d="M8 90Q60 100 112 90" fill="none" stroke="#C99B66" stroke-width="3"/>',
  f'<ellipse cx="60" cy="96" rx="22" ry="18" fill="#8BC97A" stroke="{INK}" stroke-width="4.5"/>',
  eyes(x1=51, x2=69, y=94, rx=6.5, ry=7.5, sw=3, pr=3.8, look=(1, 1.5)),
  blush(x1=43, x2=77, y=104, rx=4, ry=2.6, op=.5),
  smile(60, 105, 4, 4, 2.8),
  sparkle(12, 20, 3), sparkle(108, 18, 3), sparkle(110, 50, 2.4),
)

for name, s in [('forest-6', forest6), ('forest-7', forest7), ('forest-8', forest8), ('forest-9', forest9), ('forest-10', forest10)]:
    write(OUT + name + '.svg', s)
print('ok')
