# Portfolio

[![license](https://img.shields.io/:license-mit-blue.svg)](https://rootulp.mit-license.org)

This portfolio is plain HTML and CSS, hosted on [Cloudflare Workers static assets](https://developers.cloudflare.com/workers/static-assets/) at [rootulp.com](https://rootulp.com).

- `src/` holds the pages, `styles.css`, the resume, favicon, and a 1200 × 630 PNG social preview. `/about`, `/contact`, and `/privacy` share the homepage styles and provide substantive identity, contact, and privacy information.
- `build.mjs` copies `src/` into `dist/` and inlines `styles.css` into each page.
- The build also generates `index.md` from the homepage's main content, keeping the HTML and Markdown biography and links in sync.
- `worker.mjs` negotiates Markdown on `/` and missing paths for GET and HEAD requests with an explicit `Accept: text/markdown`. It respects media quality preferences, sets `Vary: Accept` on both representations, and preserves HTTP 404 for missing pages. Other requests use the existing static asset handling.
- `wrangler.jsonc` configures the Worker; `wrangler deploy` runs the build first.

## Local Development

1. `git clone`
2. `npm install`
3. Start the web server locally with `npm run dev`
4. Preview local changes at [http://localhost:8787](http://localhost:8787)
5. Make changes and create a PR.
6. If changes look good, merge the PR. Cloudflare deploys `main` automatically.

## Verification

Run `npm test` for HTTP integration tests in Cloudflare's local Worker runtime. The tests build the site and check HTML and Markdown negotiation, HEAD, 404s, redirects, structured data, raw homepage content, all public assets, and discovery file links. Run `npx wrangler deploy --dry-run` to validate deployment packaging without uploading.

After deployment, verify the final response headers and bodies on the public domain:

```sh
curl -sS -L -i -H 'Accept: text/markdown' https://rootulp.com/
curl -sS -L -i -H 'Accept: text/html' https://rootulp.com/
curl -sS -L -i -H 'Accept: text/markdown' https://rootulp.com/__agent-404-check
curl -sS -L -i https://rootulp.com/robots.txt
curl -sS -L -i https://rootulp.com/sitemap.xml
curl -sS -L -i https://rootulp.com/llms.txt
curl -sS -L -i https://rootulp.com/about
curl -sS -L -i https://rootulp.com/contact
curl -sS -L -i https://rootulp.com/privacy
curl -sS -L -I https://rootulp.com/og-image.png
```

The Markdown homepage must return 200 and the missing page 404, both with `Content-Type: text/markdown` and `Vary: Accept`. The HTML request must still return HTML. `/index.md` provides the same homepage Markdown directly. `robots.txt` points to the canonical XML sitemap; `llms.txt` follows the Markdown site-guide format.

Search ranking requires search engines to recrawl and index the site. Once deployed, submit the sitemap and inspect indexing in the owner's Google Search Console account. Relevant profile links and earned mentions can strengthen name discoverability; no ranking or readiness score is guaranteed by these code changes.

## Identity and agent guidance

Home introduces the professional work; About covers interests outside work and the site's personal scope; the resume holds detailed experience. Keep these roles distinct when updating content. The About URL, navigation, and discovery links remain available to readers and agents.

`llms.txt` describes when to use this portfolio, how to retrieve its content, and the limits of its personal scope. The homepage uses Schema.org `Person` with a `ContactPoint` for the published email, `rootulp@gmail.com`. Celestia is represented only as the person's employer. An audit requesting an `Organization` postal address does not justify inventing a business or publishing an unverified address. Add organization details only if the owner confirms a separate organization and a public address.

The homepage keeps its descriptive name-and-specialty title and now names distributed systems engineering in the biography. All three trust pages are linked from the homepage, site guide, and sitemap. The privacy page describes the code's current behavior, Cloudflare hosting, and the resume's Google Fonts requests; review it when adding third-party scripts or data collection.

After publishing, repeat the public checks above and request a fresh Is Agentic scan. Compare `scanned_at` to avoid treating a cached report as verification of the changes. Search Console submission requires the owner's account, and search ranking and earned profile/press links remain external follow-up work.

## Agent readiness monitoring

The `Agent readiness` GitHub Actions workflow checks production on pushes to `main`, daily at 16:17 UTC, and on manual dispatch. It runs the official Is Agentic CLI, saves the JSON report for 30 days, and records the score, scan date, and report link in the job summary. A score below 80, an unscored result, or a report over 24 hours old fails the check; GitHub Actions notification settings control delivery.

Is Agentic caches reports for six hours. A successful push check can still describe the previous deployment, so compare `scanned_at` with the deployment time before claiming the change preserved the score. The next daily run checks again after that cache window. This audit is separate from CI and does not block the deployment needed for a new scan.

## Resume PDF

After editing `src/resume.html`, run `npm run resume:pdf` to regenerate `src/resume.pdf` (needs Chrome; set `CHROME_PATH` if it isn't found).
