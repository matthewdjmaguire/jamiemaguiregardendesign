"""Generates the Jamie Maguire Garden Design logo options as SVG files (design/logo/*.svg).

Run with a Python that has fonttools, brotli and uharfbuzz installed, from the repo root:
    ~/Developer/.jmgd-work/venv/bin/python design/logo/build_logo.py

The leaf marks are drawn from Bezier curves below; the words are the site's own fonts
(Cormorant Garamond and Jost) turned into outlines, so the SVGs look identical everywhere
and need no fonts installed.

It also writes the CHOSEN option (see CHOSEN below) to public/brand/ under clean names, plus PNGs for
places that cannot use SVG (Word, email signatures, Instagram profile picture, iPhone home screen).
PNGs need Pillow and PyMuPDF as well.
"""
import io
import math
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent

# Brand colours (same values as src/styles/tokens.css)
OLIVE_700, OLIVE_900, INK = '#46583a', '#26331f', '#1e281b'
SAGE_100, SAGE_300, SAGE_500, WHITE = '#e6ecdd', '#c5d1b6', '#8ea27c', '#ffffff'


def num(v: float) -> str:
    return ('%.2f' % v).rstrip('0').rstrip('.')


# ---------------------------------------------------------------- leaf geometry
# A leaf is drawn in local coordinates with its base at (0, 0) and its tip at (0, -100),
# then rotated, scaled and moved into place.
def place(pt, base, angle, scale):
    x, y = pt
    c, s = math.cos(math.radians(angle)), math.sin(math.radians(angle))
    return (base[0] + scale * (x * c - y * s), base[1] + scale * (x * s + y * c))


def path(commands, base, angle, scale):
    parts = []
    for cmd, pts in commands:
        moved = [place(p, base, angle, scale) for p in pts]
        parts.append(cmd + ' '.join(f'{num(x)} {num(y)}' for x, y in moved))
    return ''.join(parts)


G = 4.5  # half-width of the cleft at the base of a leaf
# Version 1: cleft leaves. Each leaf is two halves with a tapering slit between them, open at the base.
CLEFT = [
    [('M', [(-G, 0)]), ('C', [(-46, -16), (-40, -74), (0, -100)]), ('Q', [(-6, -52), (-G, 0)]), ('Z', [])],
    [('M', [(G, 0)]), ('C', [(36, -22), (44, -64), (0, -100)]), ('Q', [(-1, -54), (G, 0)]), ('Z', [])],
]
# Version 2: a solid leaf with a fine vein cut out of it (the vein is a hole, so it stays see-through).
VEINED = [
    [('M', [(0, 0)]), ('C', [(-50, -14), (-44, -78), (0, -100)]), ('C', [(36, -76), (48, -22), (0, 0)]), ('Z', [])],
    [('M', [(-1.4, -10)]), ('Q', [(-1.2, -50), (0, -84)]), ('Q', [(1.8, -50), (1.4, -10)]), ('Z', [])],
]
# Version 3: a symmetrical, slightly narrower cleft leaf for the seedling.
SEEDLING = [
    [('M', [(-G, 0)]), ('C', [(-40, -18), (-36, -72), (0, -100)]), ('Q', [(-5, -52), (-G, 0)]), ('Z', [])],
    [('M', [(G, 0)]), ('C', [(40, -18), (36, -72), (0, -100)]), ('Q', [(-5, -52), (G, 0)]), ('Z', [])],
]


def leaf(commands, base, angle, scale, fill, evenodd=False):
    d = ' '.join(path(sub, base, angle, scale) for sub in commands)
    rule = ' fill-rule="evenodd"' if evenodd else ''
    return f'<path d="{d}" fill="{fill}"{rule}/>'


def mark(version: str, big: str, small: str) -> str:
    """The icon artwork inside a 120 x 120 box. `big`/`small` are the two leaf colours."""
    if version == 'cleft':
        return leaf(CLEFT, (44, 112), -10, 0.94, big) + leaf(CLEFT, (61, 113), 60, 0.5, small)
    if version == 'veined':
        return leaf(VEINED, (44, 112), -10, 0.94, big, True) + leaf(VEINED, (62, 113), 62, 0.5, small, True)
    if version == 'seedling':
        stem = f'<path d="M57.4 112 V78 h5.2 V112 a2.6 2.6 0 0 1 -5.2 0 Z" fill="{big}"/>'
        return (
            leaf(SEEDLING, (60, 84), -40, 0.74, big)
            + leaf(SEEDLING, (60, 84), 44, 0.6, small)
            + stem
        )
    raise ValueError(version)


# ---------------------------------------------------------------- text as outlines
def load_font(woff2: str, weight: int):
    font = TTFont(ROOT / 'public' / 'fonts' / woff2)
    font = instancer.instantiateVariableFont(font, {'wght': weight}, inplace=False)
    font.flavor = None
    buf = io.BytesIO()
    font.save(buf)
    blob = buf.getvalue()
    return TTFont(io.BytesIO(blob)), hb.Font(hb.Face(blob))


FONTS = {
    'serif': load_font('cormorant-garamond.woff2', 500),
    'sans': load_font('jost.woff2', 500),
}


def text_outline(kind: str, text: str, size: float, x: float, baseline: float, tracking: float = 0.0):
    """Returns (svg path data, width). `tracking` is extra space between letters, in output units."""
    tt, hbfont = FONTS[kind]
    upem = tt['head'].unitsPerEm
    scale = size / upem
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hbfont, buf, {'kern': True, 'liga': True})
    glyphset = tt.getGlyphSet()
    pen = SVGPathPen(glyphset, ntos=num)
    cursor = x
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = tt.getGlyphName(info.codepoint)
        tpen = TransformPen(pen, (scale, 0, 0, -scale, cursor + pos.x_offset * scale, baseline - pos.y_offset * scale))
        glyphset[name].draw(tpen)
        cursor += pos.x_advance * scale + tracking
    return pen.getCommands(), cursor - x - tracking


# ---------------------------------------------------------------- files
TITLE = 'Jamie Maguire Garden Design'
COLOURWAYS = {
    # name: (big leaf, small leaf, line 1 colour, line 2 colour, background or None)
    'colour': (OLIVE_700, SAGE_500, OLIVE_900, OLIVE_700, None),
    'reversed': (WHITE, SAGE_300, WHITE, SAGE_300, None),
}


def svg(view_w, view_h, body, label):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {num(view_w)} {num(view_h)}" role="img" aria-label="{label}">\n'
        f'<title>{label}</title>\n{body}\n</svg>\n'
    )


def lockup(version: str, scheme: str) -> str:
    big, small, line1, line2, _ = COLOURWAYS[scheme]
    x0 = 136
    d1, w1 = text_outline('serif', 'Jamie Maguire', 58, x0, 62)
    d2, w2 = text_outline('sans', 'GARDEN DESIGN', 19.5, x0 + 2, 98, tracking=5.2)
    body = (
        mark(version, big, small)
        + f'\n<path d="{d1}" fill="{line1}"/>'
        + f'\n<path d="{d2}" fill="{line2}"/>'
    )
    return svg(x0 + max(w1, w2 + 2) + 6, 120, body, TITLE)


def app_icon(version: str, scheme: str) -> str:
    """The mark on a rounded square, for favicons and app icons."""
    if scheme == 'colour':
        bg, big, small = OLIVE_700, WHITE, SAGE_300
    else:
        bg, big, small = SAGE_100, OLIVE_700, SAGE_500
    body = (
        f'<rect width="120" height="120" rx="26" fill="{bg}"/>\n'
        f'<g transform="translate(17 14) scale(0.74)">{mark(version, big, small)}</g>'
    )
    return svg(120, 120, body, TITLE)


# ---------------------------------------------------------------- preview page
VERSIONS = [
    ('cleft', '1. Cleft leaves', 'Closest to your reference: a slit runs down each leaf, open at the base.'),
    ('veined', '2. Veined leaves', 'Solid leaves with a fine vein cut through them. Softer and more botanical.'),
    ('seedling', '3. Seedling', 'Two leaves rising from a short stem. More symbolic of growth.'),
]


def inline(name: str, size: int = 0) -> str:
    """The SVG file's markup, ready to embed in the page (optionally at a fixed pixel size)."""
    markup = (OUT / name).read_text()
    if size:
        markup = markup.replace('<svg ', f'<svg width="{size}" height="{size}" ', 1)
    return markup


def preview() -> str:
    """One self-contained page: SVGs are embedded (no separate files, no script), so it works in any viewer."""
    css = """
  body { margin: 0; font: 16px/1.5 system-ui, sans-serif; color: #1e281b; background: #f6f5ef; }
  main { max-width: 1100px; margin: 0 auto; padding: 24px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 32px 0 4px; text-transform: uppercase; letter-spacing: .08em; color: #46583a; }
  .sub { color: #536048; margin: 0 0 12px; }
  .row { display: grid; gap: 16px; margin-bottom: 16px; }
  .row.three { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
  .tile { border: 1px solid #c5d1b6; border-radius: 6px; padding: 24px; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 14px; }
  .white { background: #fff; } .dark { background: #26331f; } .sage { background: #e6ecdd; }
  .lockup svg { height: 96px; width: auto; max-width: 100%; } .mark svg { height: 120px; width: auto; }
  figure { margin: 0; text-align: center; } figcaption { color: #536048; font-size: 11px; margin-top: 4px; }
  svg { display: block; }
"""
    out = [
        '<!doctype html>\n<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
        f'<title>Logo options: {TITLE}</title><style>{css}</style></head><body><main>',
        '<h1>Logo options</h1><p class="sub">Three takes on the two-leaf idea. Each shows the lockup (name to the right), the reversed lockup, the icon, and the small-size icon.</p>',
    ]
    for key, title, note in VERSIONS:
        out.append(f'<h2>{title}</h2><p class="sub">{note}</p>')
        out.append(f'<div class="row"><div class="tile white lockup">{inline(f"{key}-lockup.svg")}</div>'
                   f'<div class="tile dark lockup">{inline(f"{key}-lockup-reversed.svg")}</div></div>')
        sizes = ''.join(
            f'<figure>{inline(f"{key}-app-icon.svg", px)}<figcaption>{px}px</figcaption></figure>' for px in (72, 40, 32, 16)
        ) + f'<figure>{inline(f"{key}-app-icon-light.svg", 72)}<figcaption>light</figcaption></figure>'
        out.append(f'<div class="row three"><div class="tile white mark">{inline(f"{key}-mark.svg")}</div>'
                   f'<div class="tile white mark">{inline(f"{key}-mark-mono.svg")}</div>'
                   f'<div class="tile sage">{sizes}</div></div>')
    out.append('</main></body></html>\n')
    return '\n'.join(out)


# ---------------------------------------------------------------- the chosen logo -> public/brand/
CHOSEN = 'seedling'  # Jamie's pick
BRAND_DIR = ROOT / 'public' / 'brand'
BRAND_FILES = {  # option file -> name used by the site
    f'{CHOSEN}-lockup.svg': 'logo-lockup.svg',
    f'{CHOSEN}-lockup-reversed.svg': 'logo-lockup-reversed.svg',
    f'{CHOSEN}-mark.svg': 'logo-mark.svg',
    f'{CHOSEN}-mark-mono.svg': 'logo-mark-mono.svg',
    f'{CHOSEN}-app-icon.svg': 'logo-app-icon.svg',
    f'{CHOSEN}-app-icon-light.svg': 'logo-app-icon-light.svg',
}


def flatten(commands, base, angle, scale, steps=40):
    """A leaf half as a polygon (list of points), by sampling its Bezier curves."""
    pts, cur = [], None
    for cmd, raw in commands:
        pt = [place(q, base, angle, scale) for q in raw]
        if cmd == 'M':
            cur = pt[0]
            pts.append(cur)
        elif cmd == 'C':
            (x0, y0), (x1, y1), (x2, y2), (x3, y3) = cur, *pt
            for i in range(1, steps + 1):
                t = i / steps
                a, b, c, d = (1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t ** 2, t ** 3
                pts.append((a * x0 + b * x1 + c * x2 + d * x3, a * y0 + b * y1 + c * y2 + d * y3))
            cur = pt[-1]
        elif cmd == 'Q':
            (x0, y0), (x1, y1), (x2, y2) = cur, *pt
            for i in range(1, steps + 1):
                t = i / steps
                a, b, c = (1 - t) ** 2, 2 * (1 - t) * t, t ** 2
                pts.append((a * x0 + b * x1 + c * x2, a * y0 + b * y1 + c * y2))
            cur = pt[-1]
    return pts


def seedling_shapes():
    """The seedling mark as (polygon points, role) in its 120 x 120 box. Mirrors mark('seedling', ...)."""
    big = [flatten(half, (60, 84), -40, 0.74) for half in SEEDLING]
    small = [flatten(half, (60, 84), 44, 0.6) for half in SEEDLING]
    stem = [(57.4, 78), (62.6, 78)] + [
        (60 + 2.6 * math.cos(a), 112 + 2.6 * math.sin(a)) for a in [i * math.pi / 24 for i in range(25)]
    ] + [(57.4, 78)]
    return [(p, 'big') for p in big] + [(p, 'small') for p in small] + [(stem, 'big')]


def app_icon_png(px: int, rounded: bool, out: Path):
    """The app icon as a PNG, drawn at 4x and shrunk for smooth edges."""
    from PIL import Image, ImageDraw

    k = 4
    size = px * k
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    hex_rgb = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
    if rounded:
        draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=size * 26 / 120, fill=hex_rgb(OLIVE_700))
    else:
        draw.rectangle((0, 0, size, size), fill=hex_rgb(OLIVE_700))  # full-bleed: iPhones apply their own corner mask
    tx, ty, sc, unit = 17, 14, 0.74, size / 120
    for pts, role in seedling_shapes():
        poly = [((tx + sc * x) * unit, (ty + sc * y) * unit) for x, y in pts]
        draw.polygon(poly, fill=hex_rgb(WHITE if role == 'big' else SAGE_300))
    img.resize((px, px), Image.LANCZOS).save(out, optimize=True)


def svg_to_png(svg: Path, out: Path, width: int):
    """Renders an SVG to a transparent PNG `width` pixels wide (PyMuPDF draws the vector outlines)."""
    import pymupdf

    page = pymupdf.open(svg)[0]
    zoom = width / page.rect.width
    page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=True).save(out)


def export_brand():
    BRAND_DIR.mkdir(parents=True, exist_ok=True)
    for src, dest in BRAND_FILES.items():
        (BRAND_DIR / dest).write_text((OUT / src).read_text())
    app_icon_png(180, False, BRAND_DIR / 'apple-touch-icon.png')
    app_icon_png(512, True, BRAND_DIR / 'logo-app-icon-512.png')
    for name, width in (('logo-lockup', 2400), ('logo-lockup-reversed', 2400), ('logo-mark', 1200), ('logo-mark-mono', 1200)):
        svg_to_png(BRAND_DIR / f'{name}.svg', BRAND_DIR / f'{name}.png', width)
    print('wrote', len(list(BRAND_DIR.iterdir())), 'files to', BRAND_DIR)


def main():
    for version in ('cleft', 'veined', 'seedling'):
        (OUT / f'{version}-mark.svg').write_text(svg(120, 120, mark(version, OLIVE_700, SAGE_500), TITLE))
        (OUT / f'{version}-mark-mono.svg').write_text(svg(120, 120, mark(version, OLIVE_700, OLIVE_700), TITLE))
        (OUT / f'{version}-lockup.svg').write_text(lockup(version, 'colour'))
        (OUT / f'{version}-lockup-reversed.svg').write_text(lockup(version, 'reversed'))
        (OUT / f'{version}-app-icon.svg').write_text(app_icon(version, 'colour'))
        (OUT / f'{version}-app-icon-light.svg').write_text(app_icon(version, 'light'))
    (OUT / 'preview.html').write_text(preview())
    export_brand()
    print('wrote', len(list(OUT.glob('*.svg'))), 'svg files and preview.html to', OUT)


if __name__ == '__main__':
    main()
