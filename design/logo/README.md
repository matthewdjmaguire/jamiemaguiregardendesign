# Logo design source

`build_logo.py` draws three logo options (cleft leaves, veined leaves, seedling) as SVG and writes them here, plus `preview.html` to compare them. Jamie chose **seedling**; `CHOSEN` in the script controls which option is copied into `public/brand/` (the files the website uses), along with two PNGs.

Run from the repo root with a Python that has `fonttools`, `brotli`, `uharfbuzz` and `pillow` installed (they are design tools only, not dependencies of the website):

```bash
python3 -m venv ~/Developer/.jmgd-work/venv
~/Developer/.jmgd-work/venv/bin/pip install fonttools brotli uharfbuzz pillow
~/Developer/.jmgd-work/venv/bin/python design/logo/build_logo.py
```

The words are outlines of the site's own fonts (`public/fonts/`), and the colours match `src/styles/tokens.css`.
