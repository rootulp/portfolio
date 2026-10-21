# Portfolio

[![license](https://img.shields.io/:license-mit-blue.svg)](https://rootulp.mit-license.org)

This portfolio is plain HTML and CSS, hosted on [Cloudflare Workers static assets](https://developers.cloudflare.com/workers/static-assets/) at [rootulp.com](https://rootulp.com).

- `src/` holds the pages, `styles.css`, the resume, and the favicon.
- `build.mjs` copies `src/` into `dist/` and inlines `styles.css` into each page.
- `wrangler.jsonc` configures the Worker; `wrangler deploy` runs the build first.

## Local Development

1. `git clone`
2. `npm install`
3. Start the web server locally with `npm run dev`
4. Preview local changes at [http://localhost:8787](http://localhost:8787)
5. Make changes and create a PR.
6. If changes look good, merge the PR. Cloudflare deploys `main` automatically.

## Resume PDF

After editing `src/resume.html`, run `npm run resume:pdf` to regenerate `src/resume.pdf` (needs Chrome; set `CHROME_PATH` if it isn't found).
