# PARVYUKT — Landing Page

Marketing landing page for Pervyukt Agrinnovaters Private Limited ("Healing The Healthy Way" — Himalayan farm products).

Built with [Next.js](https://nextjs.org) (App Router) and Tailwind CSS.

## Prerequisites

- Node.js `>=22.13.0`

## Development

```bash
npm install
npm run dev      # local dev server at http://localhost:3000
npm run build    # production build
npm start        # serve the production build
npm test         # build + rendered-HTML tests
npm run lint     # eslint
```

## Forms and Supabase

Both forms — the hero email capture and the enquiry card — post JSON to
`/api/submit` (`app/api/submit/route.ts`), which is the only thing in the
project holding a Supabase credential. The browser never sees one.

This site shares a **Supabase project** with the Peshagi landing page but not
its deployment, so it has its own route handler writing to its own two tables:

| Form           | Table               |
| -------------- | ------------------- |
| Hero email     | `pervyukt_signups`  |
| Enquiry card   | `pervyukt_contacts` |

Create them by running `supabase/pervyukt-tables.sql` once in the Supabase SQL
editor. They come up with RLS on and no anon policies — the route handler
writes with the `service_role` key, which bypasses RLS, so nothing else can
reach them. `supabase/revoke-anon-insert.sql` is the record of the Peshagi
incident that established this arrangement: inserting from the browser with
the anon key made the REST endpoint a public write target, and it filled with
spam. Don't reintroduce a client-side insert.

Before the insert, the handler runs a few cheap bot filters: a hidden honeypot
field, a minimum fill time (`t` is stamped at page load), an Origin check, a
per-IP rate limit, and per-field validation. A repeat signup returns success
rather than an error, which is what the `unique` constraint on
`pervyukt_signups.email` is for.

If the purpose dropdown in `app/interactive.tsx` changes, update `PURPOSES` in
the route handler to match — anything off the list is stored as
"General enquiry" rather than as sent.

### Environment variables

`.env.example` lists all four with notes on where each value comes from.
Copy it to `.env.local` for local development (Next.js loads that file
automatically in both `dev` and `start`), and set the same values in
Vercel → Settings → Environment Variables for the deployment:

| Variable | Required | Notes |
| -------- | -------- | ----- |
| `SUPABASE_URL` | yes | `https://<project>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-only. Never expose it to the client or prefix it with `NEXT_PUBLIC_`. |
| `TURNSTILE_SECRET_KEY` | no | When set, submissions must carry a valid Cloudflare Turnstile token. |
| `ALLOWED_ORIGINS` | no | Comma-separated hosts. Defaults to same-origin only. |

## Deployment

Hosted on [Vercel](https://vercel.com). Every push to `main` triggers a production deployment; pull requests get preview deployments automatically.

## Project structure

- `app/` — pages, layout, and global styles
- `app/api/submit/` — the route handler both forms post to
- `public/` — brand assets (logo lockup, emblem, ISO certificate, OG image)
- `supabase/` — SQL run by hand in the Supabase editor, kept as the record of what the schema is and why
- `tests/` — smoke tests against the prerendered HTML

## Brand assets

Colours come from `Pervyukt.Identity.X TTS.pdf` and are declared once as custom
properties at the top of `app/globals.css` — the four petals (`#003C36`,
`#EF4123`, `#0FACBD`, `#FDB924`), the wordmark ink (`#231F20`) and the
secondary grey (`#939598`). Everything else on the page derives from those.

The hero film in `public/hero-film.mp4` is a web-ready 720p encode of
`PARVYUKT - Healing The Healthy Way.mp4` (37 MB → 6.1 MB), with
`public/hero-poster.jpg` taken from its closing logo frame. The source file is
gitignored. Note the film has burned-in captions, which is why the hero keeps
its own headline in the top band and the form in the bottom band, leaving the
middle clear; on viewports narrower than ~5:4 the film is letterboxed rather
than cropped so those captions stay whole.
