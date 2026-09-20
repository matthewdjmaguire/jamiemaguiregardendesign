"""Finishes the Word files that build-docs.cjs writes to design/brand/build/.

  * adds a Word theme with the brand colours and fonts, so Word's colour picker shows the palette
    (and the Design tab lists the brand fonts);
  * writes the final files next to this script:
      Jamie-Maguire-Garden-Design-Brand-Guide.docx
      Jamie-Maguire-Garden-Design-Template.dotx   (a real Word template: "New from template")
      Jamie-Maguire-Garden-Design-Template.docx   (the same, as an ordinary document)

Run from the repo root after build-docs.cjs:
    python3 design/brand/finish_docs.py
"""
import re
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
BUILD = HERE / 'build'
THEME_NAME = 'Jamie Maguire Garden Design'

COLOURS = {  # theme slot: hex (matches src/styles/tokens.css)
    'dk1': '1E281B',      # ink
    'lt1': 'FFFFFF',      # white
    'dk2': '26331F',      # deep olive
    'lt2': 'F6F5EF',      # warm white
    'accent1': '46583A',  # olive
    'accent2': '8EA27C',  # mid sage
    'accent3': 'C5D1B6',  # sage
    'accent4': '536048',  # muted olive
    'accent5': 'E6ECDD',  # soft sage
    'accent6': '26331F',  # deep olive
    'hlink': '46583A',
    'folHlink': '536048',
}


def theme_xml() -> str:
    clr = ''.join(f'<a:{k}><a:srgbClr val="{v}"/></a:{k}>' for k, v in COLOURS.items())
    fill = '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
    line = lambda w: f'<a:ln w="{w}" cap="flat" cmpd="sng" algn="ctr">{fill}<a:prstDash val="solid"/></a:ln>'
    effect = '<a:effectStyle><a:effectLst/></a:effectStyle>'
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="{THEME_NAME}">'
        '<a:themeElements>'
        f'<a:clrScheme name="{THEME_NAME}">{clr}</a:clrScheme>'
        f'<a:fontScheme name="{THEME_NAME}">'
        '<a:majorFont><a:latin typeface="Cormorant Garamond"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>'
        '<a:minorFont><a:latin typeface="Jost"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>'
        '</a:fontScheme>'
        f'<a:fmtScheme name="{THEME_NAME}">'
        f'<a:fillStyleLst>{fill}{fill}{fill}</a:fillStyleLst>'
        f'<a:lnStyleLst>{line(9525)}{line(25400)}{line(38100)}</a:lnStyleLst>'
        f'<a:effectStyleLst>{effect}{effect}{effect}</a:effectStyleLst>'
        f'<a:bgFillStyleLst>{fill}{fill}{fill}</a:bgFillStyleLst>'
        '</a:fmtScheme>'
        '</a:themeElements>'
        '</a:theme>'
    )


DOC_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml'
TEMPLATE_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml'


def finish(src: Path, dest: Path, as_template: bool):
    with zipfile.ZipFile(src) as zin:
        parts = {n: zin.read(n) for n in zin.namelist() if not n.endswith('/')}

    types = parts['[Content_Types].xml'].decode()
    assert '/word/theme/theme1.xml' not in types, 'theme already present'
    types = types.replace('</Types>', '<Override PartName="/word/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/></Types>')
    if as_template:
        assert DOC_TYPE in types
        types = types.replace(DOC_TYPE, TEMPLATE_TYPE)
    parts['[Content_Types].xml'] = types.encode()

    rels = parts['word/_rels/document.xml.rels'].decode()
    ids = [int(i) for i in re.findall(r'Id="rId(\d+)"', rels)]
    rels = rels.replace('</Relationships>', f'<Relationship Id="rId{max(ids) + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/></Relationships>')
    parts['word/_rels/document.xml.rels'] = rels.encode()
    parts['word/theme/theme1.xml'] = theme_xml().encode()

    order = ['[Content_Types].xml', '_rels/.rels'] + [n for n in parts if n not in ('[Content_Types].xml', '_rels/.rels')]
    with zipfile.ZipFile(dest, 'w', zipfile.ZIP_DEFLATED) as zout:
        for name in order:
            zout.writestr(name, parts[name])
    print(f'wrote {dest.name} ({dest.stat().st_size // 1024} KB){" [template]" if as_template else ""}')


if __name__ == '__main__':
    finish(BUILD / 'guide.docx', HERE / 'Jamie-Maguire-Garden-Design-Brand-Guide.docx', False)
    finish(BUILD / 'template.docx', HERE / 'Jamie-Maguire-Garden-Design-Template.dotx', True)
    finish(BUILD / 'template.docx', HERE / 'Jamie-Maguire-Garden-Design-Template.docx', False)
