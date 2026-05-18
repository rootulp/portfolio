# Resume PDF Download — Design

## Problem

Today, `/resume` serves `public/resume.html` (a static HTML resume styled for letter size) with an in-page "Print / Save as PDF" button that calls `window.print()`. The button delegates rendering to the browser's print dialog, where margins and scale settings can push the resume past a single page. The author can't confidently link to "the PDF" because each download path goes through a different browser dialog with different defaults.

We want a single source of truth: one validated, one-page PDF served at `/resume.pdf`, plus a download link on the home page.

## Goals

- Remove the in-page print button from `public/resume.html`.
- Serve a pre-generated, one-page PDF at `/resume.pdf`.
- Add a "Download PDF" link to the home page alongside the existing HTML resume link.
- Provide a local script that regenerates the PDF and refuses to write output that overflows one page.

## Non-goals

- Automating PDF regeneration in CI or on every `next build`. The PDF is regenerated manually by the author.
- Supporting non-Chrome rendering engines.
- Pre-commit hooks or staleness detection that warns when `resume.html` has changed without regenerating the PDF.
- Tests beyond the script's own one-page assertion. (No test framework exists in this repo.)

## Changes

### `public/resume.html`

Remove the `.toolbar` div containing the "Print / Save as PDF" button (currently lines ~386–388). The `.toolbar` CSS rules (lines ~48–70) become unused and are removed as well. The `@media print` rule that hid `.toolbar` is also removed since there is no toolbar to hide.

No other content or layout changes.

### `pages/index.mdx`

Replace the existing line:

```
- Resume [rootulp](/resume)
```

with:

```
- Resume [rootulp](/resume) · [Download PDF](/resume.pdf)
```

### `scripts/gen-resume-pdf.js` (new)

A Node script with no Puppeteer/Chromium download. It uses the system Chrome installation.

Steps:

1. **Locate Chrome.** Try paths in this order, use the first that exists:
   - `process.env.CHROME_PATH` (escape hatch)
   - `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` (macOS default)
   - `/usr/bin/google-chrome` (Linux)
   - `/usr/bin/chromium` (Linux fallback)

   If none exist, exit non-zero with a message listing the paths tried and instructions to set `CHROME_PATH`.

2. **Render to a temp PDF.** Spawn Chrome with:

   ```
   <chrome> \
     --headless=new \
     --disable-gpu \
     --no-pdf-header-footer \
     --virtual-time-budget=10000 \
     --print-to-pdf=<tmpdir>/resume.pdf \
     file://<abs-path>/public/resume.html
   ```

   `--virtual-time-budget=10000` gives Google Fonts (Fraunces, IBM Plex Sans, IBM Plex Mono) time to load before the page is rasterized.

3. **Validate page count.** Load the temp PDF with `pdf-lib` (added as a `devDependency`). Assert `doc.getPageCount() === 1`. On failure: print the actual page count, leave the temp PDF in place for inspection, exit non-zero. Do **not** overwrite `public/resume.pdf`.

4. **On success**, move the temp PDF to `public/resume.pdf` and print a one-line confirmation (`wrote public/resume.pdf (N bytes, 1 page)`).

### `package.json`

- Add `pdf-lib` to `devDependencies`.
- Add a script: `"resume:pdf": "node scripts/gen-resume-pdf.js"`.

## Workflow

1. Author edits `public/resume.html`.
2. Author runs `npm run resume:pdf`.
   - If the resume overflows one page, the script fails and `public/resume.pdf` is unchanged. Author edits the resume and retries.
   - If it succeeds, `public/resume.pdf` is updated.
3. Author commits both `public/resume.html` and `public/resume.pdf` together.

## Error cases

| Case | Behavior |
| --- | --- |
| Chrome not installed at any known path | Script exits non-zero; prints paths tried and `CHROME_PATH` override instructions. |
| Chrome process fails / non-zero exit | Script exits non-zero; surfaces Chrome's stderr. |
| Generated PDF has >1 page | Script exits non-zero; prints actual page count; leaves temp file path; does not touch `public/resume.pdf`. |
| Author forgets to run the script after editing HTML | PDF goes stale silently. Accepted trade-off (no CI / no pre-commit hook). |

## Out of scope / future work

- A pre-commit hook or CI step that fails when `public/resume.html` has been modified without regenerating `public/resume.pdf`.
- A staleness hash committed alongside the PDF.
- Switching to a non-Chrome renderer (would require restructuring CSS Grid usage in `resume.html`).
