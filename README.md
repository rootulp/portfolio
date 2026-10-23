# Portfolio

[![license](https://img.shields.io/:license-mit-blue.svg)](https://rootulp.mit-license.org)

This portfolio is plain HTML and CSS, hosted on [Cloudflare Workers static assets](https://developers.cloudflare.com/workers/static-assets/) at [rootulp.com](https://rootulp.com).

- `src/` holds the pages, `styles.css`, the resume, and the favicon.
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
```

The Markdown homepage must return 200 and the missing page 404, both with `Content-Type: text/markdown` and `Vary: Accept`. The HTML request must still return HTML. `/index.md` provides the same homepage Markdown directly. `robots.txt` points to the canonical XML sitemap; `llms.txt` follows the Markdown site-guide format.

Search ranking requires search engines to recrawl and index the site. Once deployed, submit the sitemap and inspect indexing in the owner's Google Search Console account. Relevant profile links and earned mentions can strengthen name discoverability; no ranking or readiness score is guaranteed by these code changes.

## Resume PDF

After editing `src/resume.html`, run `npm run resume:pdf` to regenerate `src/resume.pdf` (needs Chrome; set `CHROME_PATH` if it isn't found).
