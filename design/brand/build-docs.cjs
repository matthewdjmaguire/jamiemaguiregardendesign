// Builds the Word brand guide and the letter/document template for Jamie Maguire Garden Design.
//
// Run from the repo root (docx is a design tool kept OUTSIDE the website's dependencies):
//   NODE_PATH=~/Developer/.jmgd-work/docx-build/node_modules node design/brand/build-docs.cjs
// then finish with:  ~/Developer/.jmgd-work/venv/bin/python design/brand/finish_docs.py
//
// Colours and fonts match src/styles/tokens.css and the website. Logo files come from public/brand/.
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Header, Footer, Table, TableRow, TableCell, PageNumber,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign, LevelFormat, TabStopType, HeadingLevel,
  PageBreak, SectionType,
} = require('docx');

const ROOT = path.resolve(__dirname, '..', '..');
const BRAND = path.join(ROOT, 'public', 'brand');
const OUT = path.join(__dirname, 'build');
fs.mkdirSync(OUT, { recursive: true });
const img = (name) => fs.readFileSync(path.join(BRAND, name));

// ---------------------------------------------------------------- brand constants
const HEAD = 'Cormorant Garamond';
const BODY = 'Jost';
const C = {
  olive: '46583A', deepOlive: '26331F', ink: '1E281B', muted: '536048',
  sage: 'C5D1B6', midSage: '8EA27C', softSage: 'E6ECDD', warmWhite: 'F6F5EF', white: 'FFFFFF',
};
const CONTACT = {
  email: 'jamiemaguiregardendesign@gmail.com',
  web: 'jamiemaguiregardendesign.com',
  instagram: '@jamiemaguiregardendesign',
};
const PAGE = { width: 11906, height: 16838 }; // A4 in twips
const MARGIN = { left: 1418, right: 1418 }; // 2.5 cm
const CONTENT = PAGE.width - MARGIN.left - MARGIN.right; // 9070 twips = 16 cm

// ---------------------------------------------------------------- colour maths for the palette table
const hexToRgb = (h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (h) => {
  const [r, g, b] = hexToRgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
// A simple RGB-to-CMYK estimate. It is NOT colour-managed, so a printer's proof will differ: treat as a starting point.
const cmyk = (h) => {
  const [r, g, b] = hexToRgb(h).map((v) => v / 255);
  const k = 1 - Math.max(r, g, b);
  if (k >= 1) return [0, 0, 0, 100];
  return [(1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k].map((v) => Math.round(v * 100));
};

// ---------------------------------------------------------------- shared styles
const styles = {
  default: { document: { run: { font: BODY, size: 21, color: C.ink }, paragraph: { spacing: { after: 110, line: 276 } } } },
  paragraphStyles: [
    { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { font: HEAD, size: 60, color: C.deepOlive }, paragraph: { spacing: { after: 120, line: 260 } } },
    { id: 'Subtitle', name: 'Subtitle', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { font: BODY, size: 19, color: C.muted, allCaps: true, characterSpacing: 60 }, paragraph: { spacing: { after: 240 } } },
    { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { font: HEAD, size: 44, color: C.deepOlive }, paragraph: { spacing: { before: 360, after: 140, line: 260 }, keepNext: true, outlineLevel: 0 } },
    { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { font: HEAD, size: 30, color: C.olive }, paragraph: { spacing: { before: 260, after: 100, line: 260 }, keepNext: true, outlineLevel: 1 } },
    { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { font: BODY, size: 18, bold: true, color: C.muted, allCaps: true, characterSpacing: 40 }, paragraph: { spacing: { before: 200, after: 60 }, keepNext: true, outlineLevel: 2 } },
    { id: 'Small', name: 'Small', basedOn: 'Normal', quickFormat: true,
      run: { size: 17, color: C.muted }, paragraph: { spacing: { after: 80, line: 260 } } },
    { id: 'Address', name: 'Address', basedOn: 'Normal', quickFormat: true, paragraph: { spacing: { after: 0 } } },
    { id: 'Subject', name: 'Subject', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { bold: true, color: C.olive }, paragraph: { spacing: { before: 200, after: 160 } } },
    { id: 'Placeholder', name: 'Placeholder', basedOn: 'Normal', quickFormat: true,
      run: { italics: true, color: C.muted }, paragraph: { spacing: { after: 120 } } },
    { id: 'Quote', name: 'Quote', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { font: HEAD, size: 30, italics: true, color: C.olive },
      paragraph: { spacing: { before: 200, after: 200, line: 300 }, indent: { left: 360 },
        border: { left: { style: BorderStyle.SINGLE, size: 18, color: C.sage, space: 12 } } } },
    { id: 'HeaderText', name: 'Header Text', basedOn: 'Normal', run: { size: 16, color: C.muted }, paragraph: { spacing: { after: 0 } } },
  ],
  characterStyles: [
    { id: 'Hyperlink', name: 'Hyperlink', basedOn: 'DefaultParagraphFont', run: { color: C.olive, underline: {} } },
  ],
};
const numbering = {
  config: [{ reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 540, hanging: 270 } }, run: { font: 'Arial', size: 22, color: C.olive } } }] }],
};

// ---------------------------------------------------------------- small builders
const t = (text, o = {}) => new TextRun({ text, ...o });
const p = (children, o = {}) => new Paragraph({ children: Array.isArray(children) ? children : [t(children)], ...o });
const h1 = (s, o = {}) => p(s, { heading: HeadingLevel.HEADING_1, ...o });
const h2 = (s) => p(s, { heading: HeadingLevel.HEADING_2 });
const h3 = (s) => p(s, { heading: HeadingLevel.HEADING_3 });
const bullet = (children) => p(children, { numbering: { reference: 'bullets', level: 0 } });
const small = (s) => p(s, { style: 'Small' });
const pic = (file, w, h, title, description, align = AlignmentType.LEFT) => new Paragraph({
  alignment: align, spacing: { after: 0 },
  children: [new ImageRun({ type: 'png', data: img(file), transformation: { width: w, height: h }, altText: { title, description, name: file } })],
});

const hair = { style: BorderStyle.SINGLE, size: 4, color: C.sage };
const borders = { top: hair, bottom: hair, left: hair, right: hair };
const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: none, bottom: none, left: none, right: none };
const cell = (children, width, o = {}) => new TableCell({
  width: { size: width, type: WidthType.DXA },
  borders, margins: { top: 70, bottom: 70, left: 120, right: 120 }, verticalAlign: VerticalAlign.CENTER,
  ...o,
  children: (Array.isArray(children) ? children : [children]).map((c) => (typeof c === 'string' ? p(c, { spacing: { after: 0, line: 260 } }) : c)),
});
const headCell = (s, width) => cell(p(s, { spacing: { after: 0 }, keepNext: true, children: [t(s, { bold: true, color: C.white, size: 18 })] }), width,
  { shading: { type: ShadingType.CLEAR, fill: C.olive, color: 'auto' } });
const table = (widths, rows) => new Table({
  width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths, rows,
});
const row = (cells) => new TableRow({ cantSplit: true, children: cells });
const hrow = (cells) => new TableRow({ cantSplit: true, tableHeader: true, children: cells });

// ---------------------------------------------------------------- headers and footers
const rule = (where) => ({ [where]: { style: BorderStyle.SINGLE, size: 6, color: C.sage, space: 6 } });
const contactLine = () => [t(CONTACT.email), t('   ·   '), t(CONTACT.web), t('   ·   '), t(CONTACT.instagram)];

const markHeader = () => new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 0 },
  children: [new ImageRun({ type: 'png', data: img('logo-mark.png'), transformation: { width: 40, height: 40 },
    altText: { title: 'Jamie Maguire Garden Design logo', description: 'Two leaves on a stem', name: 'logo-mark.png' } })] })] });
const lockupHeader = () => new Header({ children: [new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 0 },
  children: [new ImageRun({ type: 'png', data: img('logo-lockup.png'), transformation: { width: 300, height: 77 },
    altText: { title: 'Jamie Maguire Garden Design', description: 'Logo: two leaves on a stem, with the name to the right', name: 'logo-lockup.png' } })] })] });
const contactFooter = (withPage, leftText) => new Footer({ children: [new Paragraph({
  style: 'HeaderText', border: rule('top'), tabStops: [{ type: TabStopType.RIGHT, position: CONTENT }],
  children: withPage
    ? [t(leftText || CONTACT.email + '   ·   ' + CONTACT.web), t('\tPage '), new TextRun({ children: [PageNumber.CURRENT] })]
    : [...contactLine()],
  alignment: withPage ? AlignmentType.LEFT : AlignmentType.CENTER,
})] });

const pageProps = (top) => ({ page: { size: { width: PAGE.width, height: PAGE.height },
  margin: { top, bottom: 1300, left: MARGIN.left, right: MARGIN.right, header: 851, footer: 600 } } });

// ================================================================ THE TEMPLATE
function buildTemplate() {
  const sample = [
    p('[Date]', { spacing: { after: 240 } }),
    p('[Recipient name]', { style: 'Address' }),
    p('[Address line 1]', { style: 'Address' }),
    p('[Address line 2]', { style: 'Address' }),
    p('[Town / postcode]', { style: 'Address', spacing: { after: 240 } }),
    p('Dear [Name],'),
    p('[Subject of the letter]', { style: 'Subject' }),
    p('Replace this text with your letter. Select it and start typing. Body text is set in Jost at 10.5 pt, with generous line spacing so it reads easily.', { style: 'Placeholder' }),
    p('Keep paragraphs short. Use a new paragraph for each idea, and say what you would like to happen next.', { style: 'Placeholder' }),
    p('Yours sincerely,', { spacing: { before: 240, after: 600 } }),
    p('Jamie Maguire', { style: 'Address', children: [t('Jamie Maguire', { bold: true })] }),
    p('Garden Designer', { style: 'Small' }),

    // ---- a sample continuation page showing every style
    new Paragraph({ children: [new PageBreak()] }),
    p('Sample page: delete before sending', { style: 'Subtitle' }),
    p('This page shows every style in the template, and the smaller logo that appears at the top of pages after the first.', { style: 'Placeholder' }),
    h1('Heading 1 (Cormorant Garamond)'),
    p('Body text is Jost, 10.5 pt, in the dark ink colour. Use the Styles gallery on the Home tab to apply Heading 1, Heading 2, Heading 3, Quote and the others, rather than changing fonts by hand.'),
    h2('Heading 2'),
    p('A second-level heading for a section within a document, such as a design proposal or a planting plan summary.'),
    h3('Heading 3'),
    bullet('Bullet lists pick up the olive colour'),
    bullet('Keep each point short'),
    bullet('Use them for plant lists, next steps and checklists'),
    p('A short quotation or key sentence can stand out like this.', { style: 'Quote' }),
    table([2200, 3435, 3435], [
      hrow([headCell('Item', 2200), headCell('Detail', 3435), headCell('Notes', 3435)]),
      row([cell('Example', 2200), cell('Table text is Jost', 3435), cell('Header row is olive', 3435)]),
      row([cell('Example', 2200, { shading: { type: ShadingType.CLEAR, fill: C.softSage, color: 'auto' } }),
           cell('Alternate rows use soft sage', 3435, { shading: { type: ShadingType.CLEAR, fill: C.softSage, color: 'auto' } }),
           cell('Keep tables simple', 3435, { shading: { type: ShadingType.CLEAR, fill: C.softSage, color: 'auto' } })]),
    ]),
    small('Small text (8.5 pt) is for footnotes, captions and credits.'),
  ];

  return new Document({
    creator: 'Jamie Maguire Garden Design', title: 'Jamie Maguire Garden Design: letter and document template',
    description: 'Letter and document template with the brand fonts, colours and logo.',
    styles, numbering,
    sections: [{
      properties: { ...pageProps(2268), titlePage: true },
      headers: { first: lockupHeader(), default: markHeader() },
      footers: { first: contactFooter(false), default: contactFooter(true) },
      children: sample,
    }],
  });
}

// ================================================================ THE BRAND GUIDE
function buildGuide() {
  // ---- cover
  const cover = [
    p('', { spacing: { before: 1400, after: 0 } }),
    pic('logo-lockup.png', 440, 112, 'Jamie Maguire Garden Design', 'Logo: two leaves on a stem, with the name to the right'),
    p('', { spacing: { before: 1600, after: 0 } }),
    table([CONTENT], [new TableRow({ children: [new TableCell({
      width: { size: CONTENT, type: WidthType.DXA }, borders: noBorders,
      shading: { type: ShadingType.CLEAR, fill: C.softSage, color: 'auto' }, margins: { top: 400, bottom: 400, left: 400, right: 400 },
      children: [p('Brand guide', { style: 'Title' }), p('Logo, colour and typography', { style: 'Subtitle', spacing: { after: 0 } })],
    })] })]),
    p('', { spacing: { before: 3200, after: 0 } }),
    p('Version 1.0  ·  September 2026', { style: 'Small' }),
    p(CONTACT.email + '   ·   ' + CONTACT.web, { style: 'Small' }),
  ];

  // ---- 1. the brand
  const intro = [
    h1('The brand in brief'),
    p('Jamie Maguire Garden Design creates thoughtful, elegant and liveable gardens that suit modern life and a changing environment. The brand should feel the same way: calm, natural and clear, with room to breathe.'),
    table([3023, 3023, 3024], [row([
      cell([p('Thoughtful', { children: [t('Thoughtful', { font: HEAD, size: 32, color: C.olive })], spacing: { after: 40 } }), small('Considered choices, explained simply.')], 3023, { shading: { type: ShadingType.CLEAR, fill: C.softSage, color: 'auto' } }),
      cell([p('Elegant', { children: [t('Elegant', { font: HEAD, size: 32, color: C.olive })], spacing: { after: 40 } }), small('Clean layouts, generous space, few words.')], 3023, { shading: { type: ShadingType.CLEAR, fill: C.softSage, color: 'auto' } }),
      cell([p('Liveable', { children: [t('Liveable', { font: HEAD, size: 32, color: C.olive })], spacing: { after: 40 } }), small('Warm and human, never stiff or showy.')], 3024, { shading: { type: ShadingType.CLEAR, fill: C.softSage, color: 'auto' } }),
    ])]),
    p('', { spacing: { after: 60 } }),
    p('The look is white and sage green, with a deep olive for emphasis. Photography leads; words are kept short. This guide covers the logo, the colours and the two typefaces, so anything Jamie makes, from a business card to a proposal, looks like it belongs together.'),
  ];

  // ---- 2. logo
  const logoRows = [
    ['Lockup (colour)', 'The default. Letterheads, documents, proposals, the website header on white.', 'logo-lockup.svg / .png'],
    ['Lockup (reversed)', 'On dark olive backgrounds or over photographs.', 'logo-lockup-reversed.svg / .png'],
    ['Icon', 'Where space is tight: stamps, stickers, watermarks, small labels.', 'logo-mark.svg / .png'],
    ['Icon (one colour)', 'Single-colour printing and embossing.', 'logo-mark-mono.svg / .png'],
    ['App icon', 'Website tab icon, social profile pictures, phone home screens.', 'logo-app-icon.svg / -512.png'],
  ];
  const logo = [
    h1('The logo'),
    p('Two leaves rising from a short stem: growth, and the start of a garden. The words are set in the brand typefaces and turned into outlines, so the logo files look identical everywhere.'),
    table([CONTENT], [row([cell(p('', { alignment: AlignmentType.CENTER, spacing: { before: 200, after: 200 }, children: [
      new ImageRun({ type: 'png', data: img('logo-lockup.png'), transformation: { width: 420, height: 107 },
        altText: { title: 'Primary logo', description: 'Colour logo lockup', name: 'logo-lockup.png' } })] }), CONTENT, { borders })])]),
    p('', { spacing: { after: 80 } }),
    table([CONTENT], [row([cell(p('', { alignment: AlignmentType.CENTER, spacing: { before: 200, after: 200 }, children: [
      new ImageRun({ type: 'png', data: img('logo-lockup-reversed.png'), transformation: { width: 420, height: 107 },
        altText: { title: 'Reversed logo', description: 'White logo lockup on dark olive', name: 'logo-lockup-reversed.png' } })] }), CONTENT,
      { shading: { type: ShadingType.CLEAR, fill: C.deepOlive, color: 'auto' }, borders: noBorders })])]),
    h2('Which version to use'),
    table([2000, 4500, 2570], [
      hrow([headCell('Version', 2000), headCell('Use it for', 4500), headCell('File', 2570)]),
      ...logoRows.map((r, i) => row(r.map((s, j) => cell(p(s, { spacing: { after: 0, line: 260 }, children: [t(s, { size: j === 2 ? 17 : 19, bold: j === 0 })] }), [2000, 4500, 2570][j],
        i % 2 ? { shading: { type: ShadingType.CLEAR, fill: C.warmWhite, color: 'auto' } } : {})))),
    ]),
    h2('Space and size'),
    bullet([t('Clear space. ', { bold: true }), t('Keep an empty margin around the logo at least as tall as the capital J in “Jamie”. Nothing else, including text and page edges, goes inside it.')]),
    bullet([t('Minimum size. ', { bold: true }), t('The full lockup should never be smaller than 45 mm wide in print or 180 px on screen, or the small line “GARDEN DESIGN” stops being legible. The icon alone can go down to 10 mm or 32 px.')]),
    bullet([t('Backgrounds. ', { bold: true }), t('Use the colour logo on white, warm white or soft sage. Use the reversed logo on deep olive or over a photograph, checking the words can be read.')]),
    h2('Please don’t'),
    bullet('Stretch, squash, rotate or crop the logo.'),
    bullet('Recolour it, or change any of the words or fonts.'),
    bullet('Add shadows, outlines, glows or other effects.'),
    bullet('Rearrange the icon and the name, or use a different icon.'),
    bullet('Enlarge a small or low-quality copy. Use the SVG, or the large PNG.'),
  ];

  // ---- 3. colour
  const palette = [
    ['Olive', C.olive, 'Primary. Buttons, links, headings accents, the large leaf.', C.white],
    ['Deep olive', C.deepOlive, 'Headings, the name in the logo, dark backgrounds.', C.white],
    ['Ink', C.ink, 'Body text.', C.white],
    ['Muted olive', C.muted, 'Secondary text, captions, small print.', C.white],
    ['Sage', C.sage, 'Banners, highlights, panels behind key messages.', C.ink],
    ['Mid sage', C.midSage, 'Decoration only, such as the small leaf. Never for text.', C.ink],
    ['Soft sage', C.softSage, 'Light section backgrounds and table shading.', C.ink],
    ['Warm white', C.warmWhite, 'Alternate page or section tint.', C.ink],
    ['White', C.white, 'The main background.', C.ink],
  ];
  const swatch = (hex, txt) => cell(p('', { spacing: { after: 0 }, children: [t(' ', { color: txt })] }), 700, {
    shading: { type: ShadingType.CLEAR, fill: hex, color: 'auto' }, borders });
  const pairs = [
    ['Ink on white', C.ink, C.white], ['Ink on warm white', C.ink, C.warmWhite], ['Ink on sage', C.ink, C.sage],
    ['Olive on white', C.olive, C.white], ['White on olive', C.white, C.olive], ['White on deep olive', C.white, C.deepOlive],
    ['Muted olive on white', C.muted, C.white], ['Mid sage on white', C.midSage, C.white], ['Sage on white', C.sage, C.white],
  ];
  const colour = [
    h1('Colour', { pageBreakBefore: true }),
    p('A small, natural palette. White and sage do most of the work; olive gives emphasis and structure. The values below are for screens; the print figures are estimates, so ask a printer to proof them.'),
    table([700, 1500, 1500, 1650, 3720], [
      hrow([headCell('', 700), headCell('Name and hex', 1500), headCell('RGB', 1500), headCell('CMYK (approx.)', 1650), headCell('Use', 3720)]),
      ...palette.map(([name, hex, use, txt]) => row([
        swatch(hex, txt),
        cell([p(name, { spacing: { after: 0 }, children: [t(name, { bold: true, size: 19 })] }), p('#' + hex, { spacing: { after: 0 }, children: [t('#' + hex, { size: 17, color: C.muted })] })], 1500),
        cell(p(hexToRgb(hex).join(', '), { spacing: { after: 0 }, children: [t(hexToRgb(hex).join(', '), { size: 17 })] }), 1500),
        cell(p(cmyk(hex).join(' / '), { spacing: { after: 0 }, children: [t(cmyk(hex).join(' / '), { size: 17 })] }), 1650),
        cell(p(use, { spacing: { after: 0, line: 260 }, children: [t(use, { size: 18 })] }), 3720),
      ])),
    ]),
    h2('Readable combinations'),
    p('Text needs enough contrast to be read comfortably. The ratios below use the standard measure (WCAG); 4.5 or more is good for normal text.'),
    table([3500, 1400, 4170], [
      hrow([headCell('Combination', 3500), headCell('Contrast', 1400), headCell('Verdict', 4170)]),
      ...pairs.map(([label, fg, bg]) => {
        const r = contrast(fg, bg);
        const ok = r >= 4.5;
        return row([
          cell(p(label, { spacing: { after: 0 }, children: [t(label, { size: 19, color: fg === C.white ? C.white : fg })] }), 3500, { shading: { type: ShadingType.CLEAR, fill: bg, color: 'auto' } }),
          cell(p(r.toFixed(1) + ' : 1', { spacing: { after: 0 }, children: [t(r.toFixed(1) + ' : 1', { size: 19 })] }), 1400),
          cell(p(ok ? 'Good for text' : 'Not for text: decoration only', { spacing: { after: 0 }, children: [t(ok ? 'Good for text' : 'Not for text: decoration only', { size: 18, bold: !ok, color: ok ? C.ink : '8A1C1C' })] }), 4170),
        ]);
      }),
    ]),
    h2('Proportions'),
    p('Aim for roughly: white and warm white 60%, sage and soft sage 25%, olive and deep olive 15%. Use one strong olive element per page, such as a heading or a button, and let the rest stay calm.'),
  ];

  // ---- 4. type
  const type = [
    h1('Typography'),
    p('Two typefaces, both free to use, including commercially.'),
    table([4535, 4535], [row([
      cell([p('', { children: [t('Cormorant Garamond', { font: HEAD, size: 44, color: C.deepOlive })], spacing: { after: 60 } }),
            p('', { children: [t('Jamie Maguire', { font: HEAD, size: 30, color: C.olive })], spacing: { after: 60 } }),
            small('A refined serif. Headings, the name in the logo, and quotations.')], 4535, { shading: { type: ShadingType.CLEAR, fill: C.softSage, color: 'auto' } }),
      cell([p('', { children: [t('Jost', { font: BODY, size: 44, color: C.deepOlive })], spacing: { after: 60 } }),
            p('', { children: [t('Garden design in London', { font: BODY, size: 22, color: C.olive })], spacing: { after: 60 } }),
            small('A clean, modern sans. Body text, menus, buttons, labels and “GARDEN DESIGN”.')], 4535, { shading: { type: ShadingType.CLEAR, fill: C.softSage, color: 'auto' } }),
    ])]),
    h2('Sizes for documents'),
    table([2300, 2200, 1200, 3370], [
      hrow([headCell('Style', 2300), headCell('Font', 2200), headCell('Size', 1200), headCell('Colour', 3370)]),
      ...[
        ['Title', 'Cormorant Garamond', '30 pt', 'Deep olive'],
        ['Heading 1', 'Cormorant Garamond', '22 pt', 'Deep olive'],
        ['Heading 2', 'Cormorant Garamond', '15 pt', 'Olive'],
        ['Heading 3', 'Jost, bold, capitals', '9 pt', 'Muted olive'],
        ['Body text', 'Jost', '10.5 pt', 'Ink'],
        ['Small text', 'Jost', '8.5 pt', 'Muted olive'],
      ].map((r, i) => row(r.map((s, j) => cell(p(s, { spacing: { after: 0 }, children: [t(s, { size: 19, bold: j === 0 })] }), [2300, 2200, 1200, 3370][j],
        i % 2 ? { shading: { type: ShadingType.CLEAR, fill: C.warmWhite, color: 'auto' } } : {})))),
    ]),
    h2('Getting and installing the fonts'),
    p('Download both for free (on each page choose Get font, then Download all, and unzip it), then install them before opening the Word template, or Word will swap in a different font.'),
    bullet([t('Cormorant Garamond: ', { bold: true }), t('fonts.google.com/specimen/Cormorant+Garamond')]),
    bullet([t('Jost: ', { bold: true }), t('fonts.google.com/specimen/Jost')]),
    bullet([t('Mac: ', { bold: true }), t('open the font files and click Install Font in Font Book.')]),
    bullet([t('Windows: ', { bold: true }), t('select the font files, right-click and choose Install.')]),
    bullet([t('Jost tip: ', { bold: true }), t('if the download has a “static” folder, install the files in that folder. They behave better in Word than the single variable font file.')]),
    bullet('Restart Word afterwards: it only looks for new fonts when it starts.'),
    p('Both fonts use the SIL Open Font License: free for personal and commercial use, including printed stationery, as long as the fonts themselves are not sold on their own. Send documents to other people as PDFs, so they see the right fonts without installing anything.'),
  ];

  // ---- 5. applying
  const apply = [
    h1('Putting it to use'),
    h2('Word template'),
    p('The file “Jamie-Maguire-Garden-Design-Template” is set up with everything above: the fonts, the colour palette in Word’s colour picker, ready-made styles, the logo at the top of the first page and a smaller icon at the top of every page after it, and the contact details in the footer.'),
    bullet('Install the two fonts first (see Typography).'),
    bullet('Double-click the template file. Word opens a new document based on it, and your original stays untouched.'),
    bullet('Type over the sample text. Use the Styles gallery for headings, quotes and lists.'),
    bullet('Delete the “Sample page” before sending. Save as PDF to send to clients.'),
    h2('Email signature'),
    p('Keep it simple. Jamie Maguire, Garden Designer, then the email, website and Instagram on one line each, with the colour lockup (logo-lockup.png) about 220 px wide above or beside them.'),
    h2('Social media'),
    p('Use logo-app-icon-512.png as the profile picture. Instagram crops it to a circle, and the leaves sit safely in the middle.'),
    h2('The website'),
    p('The website uses the same colours, fonts and logo. The logo can be switched on or off in the header, the footer and the browser tab, and the header can sit over a photograph or on a white bar.'),
  ];

  // ---- 6. voice
  const voice = [
    h1('Tone of voice'),
    p('Draft for Jamie to confirm.', { style: 'Placeholder', keepNext: true }),
    bullet([t('Personal and plain. ', { bold: true }), t('Write in the first person (“I”), the way Jamie would explain a garden across a table.')]),
    bullet([t('Few words. ', { bold: true }), t('Short sentences, short pages. If a sentence is not helping, remove it.')]),
    bullet([t('Warm, not chatty. ', { bold: true }), t('Friendly and calm, without exclamation marks or sales talk.')]),
    bullet([t('Everyday words. ', { bold: true }), t('Explain plants and materials in plain language, and describe how a garden will feel through the seasons.')]),
    bullet([t('British English. ', { bold: true }), t('Colour, organise, neighbour.')]),
    p('Thoughtful, elegant gardens for modern life.', { style: 'Quote' }),
    small('The website tagline. Gardens designed around how you live, the site you have and the wildlife you would like to welcome.'),
  ];

  // ---- 7. files
  const files = [
    h1('Files and contacts'),
    p('Logo files (SVG for print and scaling, PNG for Word, email and social) and this guide live together in the brand folder. If you need a different format, ask.'),
    table([4000, 5070], [
      hrow([headCell('File', 4000), headCell('What it is', 5070)]),
      ...[
        ['logo-lockup.svg / .png', 'Colour logo with the name'],
        ['logo-lockup-reversed.svg / .png', 'White logo, for dark backgrounds and photos'],
        ['logo-mark.svg / .png', 'The icon alone'],
        ['logo-mark-mono.svg / .png', 'The icon in one colour'],
        ['logo-app-icon.svg / -512.png', 'Rounded-square icon for profile pictures'],
        ['apple-touch-icon.png', 'iPhone home-screen icon'],
        ['Word template (.dotx)', 'Letter and document template'],
      ].map((r, i) => row(r.map((s, j) => cell(p(s, { spacing: { after: 0 }, children: [t(s, { size: 18, bold: j === 0 })] }), [4000, 5070][j],
        i % 2 ? { shading: { type: ShadingType.CLEAR, fill: C.warmWhite, color: 'auto' } } : {})))),
    ]),
    h2('Contact'),
    p([t('Jamie Maguire', { bold: true }), t('  ·  Garden Designer')], { spacing: { after: 40 } }),
    p(CONTACT.email, { spacing: { after: 40 } }),
    p(CONTACT.web + '   ·   ' + CONTACT.instagram, { spacing: { after: 40 } }),
    small('Graduate of the London College of Garden Design (Garden Design Diploma, Merit Commended). Working across London and surrounding areas.'),
  ];

  const bodyFooter = new Footer({ children: [new Paragraph({ style: 'HeaderText', border: rule('top'),
    tabStops: [{ type: TabStopType.RIGHT, position: CONTENT }],
    children: [t('Jamie Maguire Garden Design  ·  Brand guide'), t('\tPage '), new TextRun({ children: [PageNumber.CURRENT] })] })] });

  return new Document({
    creator: 'Jamie Maguire Garden Design', title: 'Jamie Maguire Garden Design: brand guide', description: 'Logo, colour and typography guide.',
    styles, numbering,
    sections: [
      { properties: pageProps(1418), children: cover },
      { properties: { ...pageProps(1700), type: SectionType.NEXT_PAGE },
        headers: { default: markHeader() }, footers: { default: bodyFooter },
        children: [...intro, ...logo, ...colour, ...type, ...apply, ...voice, ...files] },
    ],
  });
}

(async () => {
  fs.writeFileSync(path.join(OUT, 'template.docx'), await Packer.toBuffer(buildTemplate()));
  fs.writeFileSync(path.join(OUT, 'guide.docx'), await Packer.toBuffer(buildGuide()));
  console.log('wrote', fs.readdirSync(OUT).join(', '), 'in', OUT);
})();
