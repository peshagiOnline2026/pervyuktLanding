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

## Deployment

Hosted on [Vercel](https://vercel.com). Every push to `main` triggers a production deployment; pull requests get preview deployments automatically.

## Project structure

- `app/` — pages, layout, and global styles
- `public/` — brand assets (logo lockup, emblem, ISO certificate, OG image)
- `tests/` — smoke tests against the prerendered HTML
