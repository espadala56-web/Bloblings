# Bloblings çizim yardımcıları: tüm canavarlar aynı göz, yanak ve ağız diliyle çizilir.
INK = '#1A1430'

def svg(*parts):
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">\n' + '\n'.join(p for p in parts if p) + '\n</svg>\n'

def eyes(x1=47, x2=73, y=72, rx=9, ry=10.5, sw=3.5, pr=5, look=(1.5, 2)):
    dx, dy = look
    return '\n'.join([
        f'<ellipse cx="{x1}" cy="{y}" rx="{rx}" ry="{ry}" fill="#fff" stroke="{INK}" stroke-width="{sw}"/>',
        f'<ellipse cx="{x2}" cy="{y}" rx="{rx}" ry="{ry}" fill="#fff" stroke="{INK}" stroke-width="{sw}"/>',
        f'<circle cx="{x1+dx}" cy="{y+dy}" r="{pr}" fill="{INK}"/>',
        f'<circle cx="{x2+dx}" cy="{y+dy}" r="{pr}" fill="{INK}"/>',
        f'<circle cx="{x1+dx-2}" cy="{y+dy-3}" r="{pr*0.36:.1f}" fill="#fff"/>',
        f'<circle cx="{x2+dx-2}" cy="{y+dy-3}" r="{pr*0.36:.1f}" fill="#fff"/>',
    ])

def happy_eyes(x1=47, x2=73, y=72, w=8, sw=3.8):
    # kapalı, mutlu gözler: ^ ^
    return f'<path d="M{x1-w} {y+3}Q{x1} {y-7} {x1+w} {y+3}M{x2-w} {y+3}Q{x2} {y-7} {x2+w} {y+3}" fill="none" stroke="{INK}" stroke-width="{sw}" stroke-linecap="round"/>'

def blush(x1=35, x2=85, y=86, rx=6.5, ry=4, op=.5, color='#FF4F7B'):
    return (f'<ellipse cx="{x1}" cy="{y}" rx="{rx}" ry="{ry}" fill="{color}" opacity="{op}"/>\n'
            f'<ellipse cx="{x2}" cy="{y}" rx="{rx}" ry="{ry}" fill="{color}" opacity="{op}"/>')

def smile(cx=60, y=87, w=7, d=7, sw=3.5):
    return f'<path d="M{cx-w} {y}q{w} {d} {2*w} 0" fill="none" stroke="{INK}" stroke-width="{sw}" stroke-linecap="round"/>'

def sparkle(x, y, s=3.4, color='#FFE08A'):
    a = s; b = s * 0.47
    return (f'<path d="M{x} {y-a*1.0}l{b} {a-b}l{a-b} {b}l-{a-b} {b}l-{b} {a-b}l-{b} -{a-b}l-{a-b} -{b}l{a-b} -{b}z" fill="{color}"/>')

def crown(cx, y, w=24, h=14, fill='#FFC93C', gem='#FF4F7B', sw=3.5):
    # y = taban çizgisi
    x0 = cx - w / 2
    pts = f'M{x0} {y}L{x0} {y-h*0.55}L{x0+w*0.25} {y-h*0.25}L{cx} {y-h}L{x0+w*0.75} {y-h*0.25}L{x0+w} {y-h*0.55}L{x0+w} {y}Z'
    return (f'<path d="{pts}" fill="{fill}" stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round"/>\n'
            f'<circle cx="{cx}" cy="{y-h*0.38:.1f}" r="{w*0.09:.1f}" fill="{gem}" stroke="{INK}" stroke-width="1.8"/>')

def write(path, content):
    with open(path, 'w') as f:
        f.write(content)
