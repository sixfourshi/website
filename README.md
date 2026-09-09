# Sour Hub — Keyless Roblox Script Hub

A dark-blue script hub built with Next.js 15 (App Router), TypeScript, and
Tailwind CSS. Includes a public landing page, individual script pages, a raw
text endpoint for each script, and an owner-only dashboard for managing the
library.

## Getting started

```bash
npm install
cp .env.example .env.local   # then edit the values
npm run dev
```

Visit `http://localhost:3000`.

## Environment variables

Set these in `.env.local` (and in your Vercel project settings for
production):

| Variable          | Purpose                                    |
| ------------------ | ------------------------------------------- |
| `OWNER_USERNAME`   | Username for the `/login` page             |
| `OWNER_PASSWORD`   | Password for the `/login` page             |
| `SESSION_SECRET`   | Random string used to sign session cookies |

Generate a strong secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## How data is stored

Scripts live in `data/scripts.json` and are read/written by
`lib/scripts.ts`. This keeps the project dependency-free and easy to run
locally. On Vercel, the filesystem is read-only in production, so the
dashboard's "Add / Edit / Delete" actions won't persist there out of the
box — swap `lib/scripts.ts` for a real database (Postgres, SQLite via
Turso/LibSQL, etc.) or a GitHub-commit-based writer before going live with
a production dashboard.

## Routes

- `/` — landing page (hero, stats, executors, script library, demo,
  changelog, how-to-use, FAQ, footer)
- `/scripts/[slug]` — public page for a single script with a syntax
  highlighted viewer, copy button, and raw link
- `/raw/[slug]` — plain-text endpoint that returns only the Luau source
  for that script (no HTML)
- `/login` — owner sign-in
- `/dashboard` — owner-only script manager (redirects to `/login` if not
  signed in)

## Deploying to Vercel

1. Push this project to a GitHub repository.
2. Import it in Vercel.
3. Add the three environment variables above in the Vercel project
   settings.
4. Deploy. Your raw endpoint will be available at
   `https://your-site.vercel.app/raw/your-script-slug`.

## Notes

All sample scripts in `data/scripts.json` are placeholder stubs — replace
`code` with your own Luau source for each entry, either by editing the
JSON file directly or through the dashboard.
