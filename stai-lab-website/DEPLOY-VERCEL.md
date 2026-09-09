# Publish the STAI Lab website

The frontend and backend are one Next.js application. Vercel hosts the pages and the five API routes. Supabase stores the published website content. No separate backend server, Supabase Edge Function, or browser API base URL is required.

## 1. Update GitHub

Use `stai-github-update.zip` to update the existing repository:
https://github.com/KrishnanshSood/stai-lab-website

1. Extract the ZIP on your computer. This is an archive of replacement/new files, not a Git patch.
2. Open the repository's main page, on the `main` branch.
3. Select **Add file > Upload files**.
4. Drag all the files and folders INSIDE the extracted ZIP onto the upload page. Keep their folder structure. Do not upload the ZIP itself or an extra enclosing folder.
5. Commit the update. If you choose a new branch, merge its pull request into `main` before importing the project into Vercel.
6. Check that `package.json`, `package-lock.json`, and `vercel.json` are at the repository root, with `app/api/v1/site/route.ts` below the `app` folder.

The update archive has 22 files, so it fits in one GitHub browser upload. Preserve the existing files that are not included in it.

`stai-lab-website-source.zip` is the complete source snapshot, for a fresh clone or local use. It contains more than 100 files; use Git or multiple browser upload batches if uploading the entire snapshot. The update ZIP is sufficient for the existing repository.

## 2. Confirm the existing Supabase backend

Project: https://supabase.com/dashboard/project/bopdlgzxfpuosrweokbj

The database setup has already been applied to this project. On 9 September 2026, an anonymous-role database read confirmed:

- Table: `public.stai_site_content`.
- One document with `id = main`, `published = true`.
- Website name: Safe and Trusted AI Lab.
- Four research lines and two news items.
- Anonymous SELECT allowed; anonymous UPDATE denied.

In **Table Editor**, select `stai_site_content` and confirm the `main` row exists and is published. Keep the existing `content` JSON. The migration file `supabase/migrations/20260907120500_create_stai_site_content.sql` is a record of the already-applied setup. Do not run it again or reset this shared database.

Under project **Settings > API Keys**, copy the enabled publishable key whose value starts with `sb_publishable_`. This application specifically expects the modern publishable key. A legacy anon JWT or a privileged secret/service-role key is not a substitute.

## 3. Import into Vercel

1. Open https://vercel.com/new and sign into your Vercel account.
2. Select the account/team you want to host this website.
3. Connect GitHub if prompted. Authorize Vercel to access `stai-lab-website`, then select **Import** next to it.
4. Use these project settings:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root directory | Repository root (`./`) |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | Leave the Next.js default |
| Node.js version | 22.x |
| Production branch | main |

The repository's `package.json` pins Node.js 22.x. `vercel.json` declares Next.js, the install/build commands, and the Seoul function region. Vercel manages the server process; no custom start command is necessary.

If you already have a Vercel project you own for this repository, use that project's settings and Git connection instead of creating a duplicate.

## 4. Set the API environment variables

Before deploying, add these in Vercel's Environment Variables section. Enable **Production** and **Preview** for both values:

| Name | Value |
| --- | --- |
| SUPABASE_URL | https://bopdlgzxfpuosrweokbj.supabase.co |
| SUPABASE_PUBLISHABLE_KEY | The enabled `sb_publishable_...` key from this Supabase project |

Use the values directly, without surrounding quotes. Keep these exact variable names. The application calls its own relative `/api/v1/...` URLs, so no frontend backend-URL variable or CORS configuration is needed for the website.

Select **Deploy**. Wait until the deployment is **Ready**, then open the assigned `https://...vercel.app` address. If you add or change environment variables after a deployment, create a new deployment or redeploy for the values to take effect.

## 5. Verify the website and APIs

All five GET endpoints are deployed automatically from `app/api/v1`:

| Path on your Vercel domain | Content |
| --- | --- |
| /api/v1/site | Full website document |
| /api/v1/pages | Page text, navigation, research lines, and related page content |
| /api/v1/people | Principal investigator, students, and collaborators |
| /api/v1/publications | Publications array |
| /api/v1/news | News array |

Open each endpoint in your browser. Expect JSON with HTTP 200, not an HTML error page. In browser developer tools, successful API requests have `X-Content-Source: supabase` and `Cache-Control: no-store`.

For the included consistency checker, use Node.js 22 in a local copy of the project:

```bash
node scripts/verify-deployment.mjs https://YOUR-SITE.vercel.app
```

This checks the page, client JavaScript, all five API responses, and agreement between the endpoint data. For a protected preview, use an authorized Vercel automation bypass secret through the `VERCEL_AUTOMATION_BYPASS_SECRET` environment variable when running the script. A signed-in browser can also inspect a protected preview directly.

Check Home, About, Research, Team, News, and Contact in the browser. Review the browser console and Network tab for failed requests.

## 6. Update content later

Edit the `content` JSON in Supabase Table Editor, in the existing `id = main` row. Keep `published = true`. The field contract is defined in `lib/stai-schema.ts`. Reload the website to see the updated content; a new deployment is unnecessary for content-only edits.

These are read-only website APIs. Content editing is done through Supabase's authenticated dashboard; the project does not include public write endpoints or an admin editor.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Vercel does not list the repository | Authorize the Vercel GitHub app for this repository from the import screen. |
| Vercel detects Vite/Cloudflare | Confirm the update reached `main`, `vercel.json` is at the root, and the framework preset is Next.js. |
| Build fails | Inspect the build log; confirm Node.js 22.x, `npm ci`, and `npm run build`, using the included lockfile. |
| API returns 503 / Content unavailable | Confirm the two environment variables in the deployment's environment, redeploy after changes, confirm the Supabase project is active, and check the published `main` row. Vercel runtime logs include `[stai-content]` diagnostics. |
| Missing table / no visible data | Confirm project `bopdlgzxfpuosrweokbj`, table `public.stai_site_content`, and its existing SELECT grant and publication policy. Check Supabase Data API settings if the public schema has been disabled. |
| Content edits cause 503 | Restore a valid JSON document matching `lib/stai-schema.ts`; required fields and arrays must retain their types. |
| API returns 404 | Check that `app/api/v1/.../route.ts` was uploaded with the right folder structure and that Vercel built the updated commit. |
| Preview returns a Vercel sign-in page | Open it while signed into the authorized Vercel account, or use authorized automation access for the verification script. |

## Verification status of this package

The prepared application passed a native Next.js production build, TypeScript validation, lint, and all ten tests. The live Supabase anonymous-role query and enabled publishable key were checked again while packaging. Hosted HTTP and browser verification still need to be run after you deploy; the previous inaccessible preview was not verified.

Official references:

- https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
- https://vercel.com/docs/git
- https://vercel.com/docs/environment-variables
