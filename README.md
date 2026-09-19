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
| `npm run placeholders` | Regenerates the placeholder images (delete once real photos are in) |

`npm run dev` serves the pages only. The contact form posts to `/api/contact`, which runs on Vercel (or `vercel dev`), so locally it shows the "email me directly" fallback.

## Where things live

| To change | Edit |
|---|---|
| Name, email, Instagram, menu, service names | `src/data/site.ts` |
| Colours, fonts sizes, spacing | `src/styles/tokens.css` |
| Portfolio projects | `src/content/projects/*.md` (images in `src/assets/`) |
| Page copy | `src/pages/*.astro` |
| Contact form email | `api/contact.ts` |

### Adding a project

Add a Markdown file to `src/content/projects/` and put its photos in `src/assets/projects/`:

```md
---
title: "Courtyard Garden"
location: "London"
year: 2026
summary: "One or two sentences."
order: 1                      # lower numbers appear first
images:                       # first image is the cover
  - src: ../../assets/projects/courtyard-1.jpg
    alt: "Describe what the photo shows"
---
```

## Environment variables

Set in Vercel (Project Settings > Environment Variables). Never commit them.

| Variable | Required | Purpose |
|---|---|---|
| `RESEND_API_KEY` | Yes, for the contact form | Sends enquiry emails through Resend. Without it the form returns a friendly "not switched on yet" error. |
| `CONTACT_TO` | No | Where enquiries go. Defaults to `jamiemaguiregardendesign@gmail.com`. |
| `CONTACT_FROM` | No | Sender. Must be on a domain verified in Resend (SPF/DKIM DNS records). Defaults to `Website enquiry <enquiries@jamiemaguiregardendesign.com>`. |

## Making changes

Branch off `main`, push, and use the Vercel preview URL to check the change. Merging to `main` deploys to production.
