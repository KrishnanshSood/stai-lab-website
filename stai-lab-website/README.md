# STAI Lab website

The Safe and Trusted AI Lab website runs on Next.js 16 and reads its published content from Supabase. GitHub stores the application, Vercel runs the pages and API routes, and Supabase stores the content.

## Local development

Use Node.js 22, then run:

```bash
npm ci
cp .env.example .env.local
# Fill in SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.
npm run dev
```

The application requires a modern Supabase publishable key (`sb_publishable_...`). Do not use a secret or service-role key. Both settings remain server-side. The Vercel integration's `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` names are also supported.

## Vercel deployment

Import `KrishnanshSood/stai-lab-website` into Vercel and connect the GitHub repository. Use the repository root, the **Next.js** framework preset, `npm ci` for install, and `npm run build` for build. Leave the output directory at the Next.js default. `vercel.json` records the build settings and puts functions in Seoul, matching the existing Supabase project's region.

Set these environment variables for Production and Preview, and Development if using `vercel env pull`:

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | `https://bopdlgzxfpuosrweokbj.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | The project's publishable key from Supabase Settings > API Keys |

The existing Supabase project is `bopdlgzxfpuosrweokbj`. The migration in `supabase/migrations/20260907120500_create_stai_site_content.sql` has already been applied there. Apply it once when using a different project. Never run a database reset against this shared project.

With Vercel's GitHub integration connected, pushes to `main` deploy to production and other branches receive preview deployments. Database content edits do not require a GitHub commit or redeployment.

## Editing content

Open Supabase Table Editor, select `public.stai_site_content`, and edit the `content` JSON document in the row with `id = main`. Set `published` to `true` for the public website. The initial content is the site's existing text, with no invented students or publications. The seed in `lib/stai-content.ts` is a reference for the initial import, not a runtime fallback.

The document contains `site`, `nav`, `footer`, `home`, `about`, `thrusts`, `pubNotice`, `publications`, `people`, `team`, `news`, and `contact`. The exact contract is in `lib/stai-schema.ts`. Preserve required fields and use arrays, including empty arrays, where expected. A malformed or unpublished document produces a retryable HTTP 503 instead of an incomplete page.

Row-level security allows anonymous and signed-in visitors to read the published main document. Those roles cannot insert, update, or delete website content. Only the dedicated website table was added; the project's equipment-management tables are separate.

## API

| Endpoint | Response |
| --- | --- |
| `/api/v1/site` | Entire validated website document |
| `/api/v1/pages` | Page copy, navigation, research lines, and notices |
| `/api/v1/people` | Principal investigator, students, and collaborations |
| `/api/v1/publications` | Publication array |
| `/api/v1/news` | News array |

Every endpoint reads Supabase at request time and returns `X-Content-Source: supabase` and `Cache-Control: no-store`. Reload the website to see database edits. Failed requests return HTTP 503 without database details or credentials. The site offers a retry action.

## Verification

```bash
npm run lint
npm run build
npm test
npm start
# In another terminal:
npm run verify:deployment -- http://localhost:3000
# Or verify a deployed URL:
npm run verify:deployment -- https://your-project.vercel.app
```

The checks cover Next.js output, existing UI component behavior, database error handling, content updates, client JavaScript availability, and consistency across all five APIs. For a protected Vercel preview, supply `VERCEL_AUTOMATION_BYPASS_SECRET` in the verification script's environment. Do not commit it.

## Previous hosting setup

The original Cloudflare/Vinext starter files remain available through `dev:sites`, `build:sites`, and `start:sites`. The default commands and Vercel deployment use native Next.js. Cloudflare-only source directories are excluded from Next.js type checking.
