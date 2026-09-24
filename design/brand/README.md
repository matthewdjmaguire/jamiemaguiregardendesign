# Brand guide and Word template

| File | What it is |
|---|---|
| `Jamie-Maguire-Garden-Design-Brand-Guide.docx` | The brand guide: logo, colour, typography, tone of voice, files. 7 pages, A4. |
| `Jamie-Maguire-Garden-Design-Template.dotx` | A real Word template. Double-click it and Word opens a new document based on it. |
| `Jamie-Maguire-Garden-Design-Template.docx` | The same content as an ordinary document, for programs that do not open `.dotx` files. |

The template has the logo at the top of the first page, a smaller icon at the top of every later page, contact details in the footer (with page numbers after page 1), the brand colours in Word's colour picker, and ready-made styles (Title, Heading 1 to 3, Quote, Small, Address, Subject, bullets and a table look). It uses the Cormorant Garamond and Jost fonts, which must be installed first: the guide explains how.

## Regenerating

The files are built by scripts, so the colours and logo stay in step with the website. From the repo root:

```bash
NODE_PATH=~/Developer/.jmgd-work/docx-build/node_modules node design/brand/build-docs.cjs
~/Developer/.jmgd-work/venv/bin/python design/brand/finish_docs.py
```

`build-docs.cjs` needs the `docx` npm package and `finish_docs.py` uses only Python's standard library. Both are design tools only, kept outside the website's dependencies (install `docx` in `~/Developer/.jmgd-work/docx-build`). The logo images come from `public/brand/`, made by `design/logo/build_logo.py`.

## Notes

- The palette CMYK values are simple estimates, not colour-managed. A printer's proof will differ.
- The brand guide's tone-of-voice page is a draft for Jamie to confirm.
- Checked in real Word (fonts installed, exported to PDF). The colour palette in Word's picker comes from a theme part added by `finish_docs.py`; the file opens cleanly, but the picker itself was not inspected.
