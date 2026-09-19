# Jamie Maguire Garden Design

> **Preset:** Quick-MVP, adapted for a static site with no database and no auth (so no RLS or
> Supabase). Global rules in `~/.claude/CLAUDE.md` still apply. UK English throughout.

## PROJECT CHARTER
- **App:** Jamie Maguire Garden Design: brochure/portfolio site for Jamie's garden design business (jamiemaguiregardendesign.com).
- **Profile:** Quick-MVP (justification: static public content, no user data stored, no auth or database; low blast radius).
- **Users & core jobs:** Prospective clients see the work, understand services and process, get in touch. Editor (Matt for now, possibly Jamie later) adds portfolio projects and tweaks copy.
- **In scope (v1):** Home, Portfolio, Project detail, About, Services & process, Contact form (Resend), responsive + accessible design, privacy notice, cookie-free analytics, SEO basics.
- **Out of scope (v1):** login/WYSIWYG editor (see backlog spike), e-commerce, blog, booking, client portal.
- **Data sensitivity:** contact-form enquiries only (name, email, message), emailed and not stored. **Blast radius:** low. **Regulatory:** UK GDPR (privacy notice).
- **Stack:** Astro (static, Markdown content collections), TypeScript, no database; one serverless function for the contact form; Vercel Pro. Deviates from the default Next.js stack deliberately: content site, near-zero JS.
- **Environments:** production + Vercel preview per branch.
- **Auth & secrets:** none / Resend API key in Vercel env vars only. Enquiries go to jamiemaguiregardendesign@gmail.com (for now).
- **Autonomy level:** Fully autonomous, but Matt approves the preview before merge to `main`.
- **UI direction:** bespoke, spacious, image-led; all colour/type/spacing in one design-tokens file. WCAG AA: yes. Reference sites: TBC.
- **Docs home:** https://app.notion.com/p/3e0c7c13fcb8810087d3f209dd81543a (backlog DB embedded). **Only touch this page and its children.**
- **Definition of Done:** merged to main, live, checked by Matt, Notion updated. **Prod approver:** Matt.

---

## Content model
- Portfolio projects live in `src/content/projects/*.md` (frontmatter: title, location, year, summary, images[] with alt text; the first image is the cover). Photos live in `src/assets/photos/`; the current ones are temporary CC BY-SA demo images (see `CREDITS.md` there) to be replaced with Jamie's own before launch. Keep this structure so a Git-based CMS can be added later.
- Site-wide facts (name, email, social links, nav, and the `headerStyle` toggle: `'solid'` or `'overlay'`) live in `src/data/site.ts`; colours, type and spacing live in `src/styles/tokens.css`. Change those, not individual components.
- "Update the site" prompts should be: branch, edit content, push, share the Vercel preview URL. Never push straight to `main`.

## Dependencies
Ask before adding any (Resend SDK, CMS, analytics) and say what it replaces.

## Conventions
- **No secrets in the repo.** Platform env vars only (Vercel project settings). The only secret is `RESEND_API_KEY`.
- Plain CSS with design tokens, minimal JavaScript (mobile menu, project lightbox, contact form, review mode).
- **Review mode** (`?mode=edit`, see README) is a temporary aid: `reviewMode` in `src/data/site.ts` must be `false` at launch. Accessibility target: WCAG AA; check contrast with `npm run check:contrast` when tokens change.
- Keep a `README` that says how to run it and what the env vars are.

## Explain as you go
Add a one-line **why** comment on any non-obvious bit, and break out uncommon abbreviations.
Cheap now, invaluable when you return to this in three months.

## Feature Workflow *(lean)*
1. **Pick the next thing** from the Notion backlog (or a simple checklist for a true
   throwaway). Note acceptance criteria — even one line.
2. **Branch** — `feat/<slug>` off `main`. Push to get a preview URL.
3. **Build** — implement it, test-first for anything with real logic (money math, auth checks,
   data transforms): write the test, watch it fail, then implement. Skip exhaustive tests on
   trivial UI. If this ticket is a bug fix, add the regression case that would have caught it.
4. **Review pass** — run `/simplify`. Run `/security-review` if the change touches the
   contact form, secrets or data handling. Flag `/code-review` as optional-but-available for the human.
5. **Self-review & present** — open the preview URL, confirm it works, note anything new
   worth a backlog ticket.
6. **Merge** — merge to `main`; Vercel deploys prod automatically.
7. **Document** — update the Notion page + mark the ticket Done. Even a lean app keeps a
   living page — it's what lets it graduate cleanly later.

## Pull requests *(optional here, but recommended)*
- Even when you'll self-merge, a PR gives you the preview URL, a diff, and a record.
- **To make a PR reach your phone:** assign it to yourself (`matthewdjmaguire`) and add a
  **`needs-review`** label, then point your iOS GitHub widget at "Your pull requests" (or a
  saved `is:open is:pr assignee:@me` search). GitHub can't push-notify you about a PR you
  *authored*, but assigned + labelled PRs show up in that widget/filter. *(Create the
  `needs-review` label once per repo: Settings → Labels → New label.)*

## Review Gates *(lightweight, but not zero)*
- `/simplify` on anything non-trivial (self-invoke) — keeps the codebase from rotting.
- `/security-review` whenever the contact form, secrets or any data handling changes (self-invoke).
- `/code-review` is available if you want a deeper pass; not required at this profile.

## Testing & CI *(light)*
- Tests only where logic can hurt: the contact-form handler (validation, spam rejection) and the colour-contrast check. Run with `npm test`.
- CI on pull request: `astro check`, tests, build.

## Security posture *(short list that matters here)*
- **Secrets:** Vercel env vars only; never commit `.env`.
- **Contact form:** validate server-side, honeypot for bots, never store enquiries, never echo user input into HTML or email headers. Run `/security-review` on any change to it.
- **Data:** if the site ever stores personal data (bookings, accounts, a CMS login), stop and revisit the preset.

## UI standards *(never plain boilerplate)*
- Design tokens (colour, type scale, spacing) in one file; components use tokens only.
- Palette: white and warm off-white with sage banners/highlights and a deep olive for text-level accents and buttons. Sage is never used for text on white (fails contrast).
- Reference feel: clean, minimal copy, hero image with overlaid text, hover zoom on images, underline on nav hover, service cards, simple closing enquiry block.
- Responsive, semantic HTML, labelled inputs with high-contrast borders, visible focus, respect `prefers-reduced-motion`.

## Documentation & Notion
- Keep a **Notion page** for the app with a small embedded **backlog database**
  (statuses: Backlog / In progress / Blocked / Pending review / Done / Descoped; a status
  pie chart is nice-to-have). See `notion/`.
- Ticket bodies can be brief but still carry: Context, Requirements, quick Test plan,
  Acceptance criteria.
- Update the page when you merge — a five-minute habit that makes graduating painless.
- **Notion access is allow-listed:** name the exact page(s) Claude may touch; never browse
  the rest of the workspace (it may hold unrelated personal content). App page: https://app.notion.com/p/3e0c7c13fcb8810087d3f209dd81543a.

## Autonomy limits
- **Fully autonomous is acceptable here** precisely because the blast radius is low — but
  only once there are a few tests on the risky logic. Untested money/auth code still stops
  for a human look.
- The moment data sensitivity rises, autonomy drops: switch presets.

## Learnings capture
Hit a surprising bug or platform gotcha (a Vercel env-var quirk, an Astro build oddity)?
Propose a one-line note in this `CLAUDE.md` so it isn't rediscovered the hard way.

## Slash commands used here
- `/simplify` — self-invoke; keep it clean as you move fast.
- `/security-review` — self-invoke; on contact-form/secrets changes. Cheap, high-value.
- `/code-review` — optional deeper pass; human-invoked.

## When to graduate off this preset
Move to **Standard** (and re-run the relevant interview sections) when *any* of these
becomes true: real external users depend on it; it holds financial/health/other-people's
PII; downtime or a data leak would actually matter; or more than one person is building on
it. Graduating is a deliberate step, not an accident — the playbook's "Graduating a profile"
section walks through it.
