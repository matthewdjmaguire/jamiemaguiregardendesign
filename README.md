# Jamie Maguire Garden Design

Website for [jamiemaguiregardendesign.com](https://jamiemaguiregardendesign.com): a static [Astro](https://astro.build) site hosted on Vercel, with one serverless function for the contact form.

Project docs and backlog live in Notion (linked from `CLAUDE.md`).

## Run it locally

Needs Node 22.12 or newer (developed on Node 24).

```bash
npm install
npm run dev        # http://localhost:4321
```

| Command | What it does |
|---|---|
| `npm run build` | Builds the site into `dist/` |
| `npm test` | Tests for the contact-form validation and handler |
| `npm run check:contrast` | Checks the colour palette meets WCAG AA contrast |

`npm run dev` serves the pages only. The contact form posts to `/api/contact`, which runs on Vercel (or `vercel dev`), so locally it shows the "email me directly" fallback.

## Where things live

| To change | Edit |
|---|---|
| Name, email, Instagram, menu, service names, **top-menu style** (`headerStyle`: `'solid'` or `'overlay'`), **logo on/off** (`logo.header`, `logo.footer`, `logo.favicon`) | `src/data/site.ts` |
| The logo files | `public/brand/` (made by `design/logo/build_logo.py`) |
| Colours, fonts sizes, spacing | `src/styles/tokens.css` |
| Portfolio projects | `src/content/projects/*.md` (images in `src/assets/`) |
| Page copy | `src/pages/*.astro` |
| Contact form email | `api/contact.ts` |

### Adding a project

Add a Markdown file to `src/content/projects/` and put its photos in `src/assets/photos/`:

```md
---
title: "Courtyard Garden"
location: "London"
summary: "One or two sentences."
order: 1                      # lower numbers appear first
images:                       # first image is the cover
  - src: ../../assets/photos/courtyard-1.jpg
    alt: "Describe what the photo shows"
---
```

## Logo

The logo is the "seedling" design (two leaves on a stem), in `public/brand/`:

| File | Use |
|---|---|
| `logo-lockup.svg` / `logo-lockup-reversed.svg` | Icon with the name to its right. Reversed (white) is for dark backgrounds or photos. |
| `logo-mark.svg` / `logo-mark-mono.svg` | The icon alone, in two colours or one. |
| `logo-lockup.png`, `logo-lockup-reversed.png`, `logo-mark.png`, `logo-mark-mono.png` | Transparent PNG versions (2400 px wide lockups) for Word, email signatures and social media. |
| `logo-app-icon.svg` / `logo-app-icon-light.svg` | The icon on a rounded square (dark or light). Used for the favicon. |
| `logo-app-icon-512.png` | 512px PNG for places that cannot use SVG, such as an Instagram profile picture. |
| `apple-touch-icon.png` | 180px icon for iPhone home screens. |
| `social-preview.png` | 1200 x 630 image shown when a link to the site is shared (WhatsApp, iMessage, Facebook, LinkedIn): the white logo on olive. Set in `BaseLayout.astro`; change the colour in `build_logo.py`. |

The words in the SVGs are outlines of the site's fonts, so they look the same anywhere with no fonts installed. Use the toggles in `src/data/site.ts` to show the logo in the header, the footer and the favicon independently; anything switched off falls back to the plain-text name (or the original leaf favicon). Jamie's Word brand guide and letter/document template are in `design/brand/` (see its README). To change the design, edit `design/logo/build_logo.py` (it lists what it needs at the top) and rerun it. `design/logo/preview.html` shows all the options considered.

## Review mode (for design feedback)

Add `?mode=edit` to any page address (for example `/about?mode=edit`) to see a numbered pin on every heading, paragraph, button, link, image and form field. Click a pin to write a note against it. The panel's **Copy all my notes** button copies every page's notes as one message to paste back, like `(3) Heading: "Thoughtful, elegant gardens…" → Change to Hello`.

- Numbers count down each page in reading order. The header and footer use `H` and `F` (H2, F1), so they mean the same on every page.
- It stays on while browsing that tab; `?mode=off` or the **Exit review mode** button turns it off. Notes are saved in the reviewer's own browser only.
- Numbers only match the version being viewed, and shift when elements are added or removed.
- **Turn it off at launch:** set `reviewMode: false` in `src/data/site.ts`. Nothing review-related is then loaded on any page.

## Environment variables

Set in Vercel (Project Settings > Environment Variables). Never commit them.

| Variable | Required | Purpose |
|---|---|---|
| `RESEND_API_KEY` | Yes, for the contact form | Sends enquiry emails through Resend. Without it the form returns a friendly "not switched on yet" error. |
| `CONTACT_TO` | Yes, for the contact form | Where enquiries are delivered (Jamie's inbox). |
| `CONTACT_FROM` | No | Sender. Must be on a domain verified in Resend (SPF/DKIM DNS records). Defaults to `Website enquiry <enquiries@jamiemaguiregardendesign.com>`. |

## Making changes

Branch off `main`, push, and use the Vercel preview URL to check the change. Merging to `main` deploys to production.
