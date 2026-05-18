# Resume PDF Download Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the in-page print button on `/resume` with a pre-generated, validated one-page PDF served at `/resume.pdf`, plus a download link on the home page.

**Architecture:** A Node script (`scripts/gen-resume-pdf.js`) spawns the system Chrome in headless mode to render `public/resume.html` to a temp PDF, validates page count with `pdf-lib`, and only then moves it to `public/resume.pdf`. The PDF is committed. The print button is removed from `resume.html`. The home page gains a `[Download PDF](/resume.pdf)` link.

**Tech Stack:** Node 18+, Next.js 14, system Chrome (headless), `pdf-lib` (devDependency).

**Spec:** `docs/superpowers/specs/2026-05-16-resume-pdf-download-design.md`

---

## File Map

| Path | Action | Responsibility |
| --- | --- | --- |
| `package.json` | Modify | Add `pdf-lib` devDep + `resume:pdf` script. |
| `scripts/gen-resume-pdf.js` | Create | Render + validate + write the PDF. |
| `public/resume.html` | Modify | Remove `.toolbar` button + related CSS. |
| `public/resume.pdf` | Create | Generated, committed artifact. |
| `pages/index.mdx` | Modify | Add `[Download PDF]` link. |

---

## Task 1: Add `pdf-lib` and npm script

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install `pdf-lib` as a devDependency**

Run from the worktree root:

```bash
yarn add --dev pdf-lib
```

Expected: `package.json` and `yarn.lock` updated; `pdf-lib` listed under `devDependencies`.

- [ ] **Step 2: Add the `resume:pdf` script**

Edit `package.json` — add a new entry to the `"scripts"` object so it reads:

```json
"scripts": {
  "dev": "next",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "resume:pdf": "node scripts/gen-resume-pdf.js"
}
```

- [ ] **Step 3: Verify**

Run:

```bash
yarn run | grep resume:pdf
```

Expected: line shows `resume:pdf` is listed.

- [ ] **Step 4: Commit**

```bash
git add package.json yarn.lock
git commit -m "chore: add pdf-lib devDep and resume:pdf script"
```

---

## Task 2: Write the PDF generator script (TDD via behavioral red/green)

**Files:**
- Create: `scripts/gen-resume-pdf.js`

The "test" for this script is end-to-end behavior: it must **fail** on a multi-page input and **succeed** on the real resume. We start by proving the failure path works, then the success path.

- [ ] **Step 1: Create the script with the full implementation**

Create `scripts/gen-resume-pdf.js` with exactly this content:

```js
#!/usr/bin/env node
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { PDFDocument } = require('pdf-lib')

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium'
].filter(Boolean)

function findChrome() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p
  }
  console.error('Could not locate Chrome. Tried:')
  for (const p of CHROME_PATHS) console.error(`  ${p}`)
  console.error('Set CHROME_PATH=/path/to/chrome to override.')
  process.exit(1)
}

async function main() {
  const chrome = findChrome()
  const repoRoot = path.resolve(__dirname, '..')
  const inputHtml = process.env.INPUT_HTML
    ? path.resolve(process.env.INPUT_HTML)
    : path.join(repoRoot, 'public', 'resume.html')
  const outputPdf = process.env.OUTPUT_PDF
    ? path.resolve(process.env.OUTPUT_PDF)
    : path.join(repoRoot, 'public', 'resume.pdf')
  const tmpPdf = path.join(os.tmpdir(), `resume-${process.pid}.pdf`)

  if (!fs.existsSync(inputHtml)) {
    console.error(`Input HTML not found: ${inputHtml}`)
    process.exit(1)
  }

  const result = spawnSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-pdf-header-footer',
      '--virtual-time-budget=10000',
      `--print-to-pdf=${tmpPdf}`,
      `file://${inputHtml}`
    ],
    { stdio: 'inherit' }
  )

  if (result.status !== 0) {
    console.error(`Chrome exited with code ${result.status}`)
    process.exit(1)
  }

  if (!fs.existsSync(tmpPdf)) {
    console.error(`Chrome did not produce ${tmpPdf}`)
    process.exit(1)
  }

  const bytes = fs.readFileSync(tmpPdf)
  const doc = await PDFDocument.load(bytes)
  const pageCount = doc.getPageCount()
  if (pageCount !== 1) {
    console.error(
      `Expected 1 page, got ${pageCount}. Tmp PDF left at ${tmpPdf} for inspection.`
    )
    process.exit(1)
  }

  fs.renameSync(tmpPdf, outputPdf)
  console.log(
    `wrote ${path.relative(repoRoot, outputPdf)} (${bytes.length} bytes, 1 page)`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

Notes:
- `INPUT_HTML` and `OUTPUT_PDF` env overrides exist so the script can be exercised against test fixtures without affecting `public/resume.pdf`.
- `--virtual-time-budget=10000` gives Google Fonts time to load before the snapshot.
- `--no-pdf-header-footer` is the modern Chromium flag; on older Chrome it's a no-op (default is no header/footer anyway).

- [ ] **Step 2: Write a failing-case fixture (red)**

Create `/tmp/multi-page.html` (do NOT commit this):

```bash
cat > /tmp/multi-page.html <<'EOF'
<!DOCTYPE html>
<html><head><style>
  @page { size: letter; margin: 0; }
  .pg { width: 8.5in; height: 11in; }
</style></head>
<body>
  <div class="pg">Page 1</div>
  <div class="pg">Page 2</div>
</body></html>
EOF
```

- [ ] **Step 3: Run the script against the multi-page fixture — expect failure**

Run from the worktree root:

```bash
INPUT_HTML=/tmp/multi-page.html OUTPUT_PDF=/tmp/should-not-exist.pdf node scripts/gen-resume-pdf.js
echo "exit code: $?"
```

Expected:
- Stderr contains `Expected 1 page, got 2.` (or some N > 1)
- Exit code is non-zero
- `/tmp/should-not-exist.pdf` does NOT exist

Verify:

```bash
test ! -e /tmp/should-not-exist.pdf && echo "OK: output PDF not written"
```

- [ ] **Step 4: Run the script against the real resume — expect success (green)**

```bash
yarn resume:pdf
echo "exit code: $?"
```

Expected:
- Stdout contains `wrote public/resume.pdf (... bytes, 1 page)`
- Exit code 0
- `public/resume.pdf` exists

Verify:

```bash
ls -lh public/resume.pdf
```

If page count is >1: the resume has overflowed. Stop and report — the resume content needs trimming before this plan can continue.

- [ ] **Step 5: Clean up the fixture**

```bash
rm -f /tmp/multi-page.html /tmp/should-not-exist.pdf
```

- [ ] **Step 6: Commit the script (NOT the PDF yet)**

```bash
git add scripts/gen-resume-pdf.js
git commit -m "feat: add gen-resume-pdf script for one-page validated PDF"
```

---

## Task 3: Commit the generated PDF

**Files:**
- Create: `public/resume.pdf`

- [ ] **Step 1: Confirm the PDF exists and is the freshly generated one**

```bash
file public/resume.pdf
```

Expected: output identifies it as a PDF document, version 1.x.

- [ ] **Step 2: Open it visually to spot-check rendering**

On macOS:

```bash
open public/resume.pdf
```

Spot-check:
- Single page
- Header, contact line, summary, experience, education, skills all visible
- Fonts loaded (Fraunces serif, IBM Plex Sans, IBM Plex Mono) — if a font fell back to Times/Helvetica, the `--virtual-time-budget` may need raising

If the fonts are wrong, raise `--virtual-time-budget` to `20000` in `scripts/gen-resume-pdf.js`, regenerate with `yarn resume:pdf`, and recheck.

- [ ] **Step 3: Commit**

```bash
git add public/resume.pdf
git commit -m "feat: add generated one-page resume PDF"
```

---

## Task 4: Remove the print button from `resume.html`

**Files:**
- Modify: `public/resume.html`

The print button is now misleading (the canonical PDF is the committed one). Remove it and the now-unused CSS.

- [ ] **Step 1: Remove the `.toolbar` HTML**

In `public/resume.html`, delete these three lines (around line 386–388):

```html
  <div class="toolbar">
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>
```

- [ ] **Step 2: Remove the `.toolbar` CSS rules**

In `public/resume.html`, delete these blocks:

Lines ~48–56 (the `.toolbar` rule):

```css
  .toolbar {
    display: flex;
    gap: 8px;
    width: 100%;
    max-width: 8.5in;
    justify-content: flex-end;
    font-family: var(--mono);
    font-size: 11px;
  }
```

Lines ~58–70 (the `.toolbar button` rules):

```css
  .toolbar button {
    background: var(--ink);
    color: var(--paper);
    border: none;
    padding: 8px 14px;
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .toolbar button:hover { background: var(--accent); }
```

- [ ] **Step 3: Remove the `.toolbar` rule inside `@media print`**

Inside the `@media print { ... }` block, delete the line:

```css
    .toolbar { display: none; }
```

The surrounding rule should now read:

```css
  @media print {
    html, body { background: white; }
    .frame { padding: 0; gap: 0; }
    .page {
      width: 100%;
      min-height: auto;
      box-shadow: none;
      padding: 0.5in 0.6in;
    }
    @page {
      size: letter;
      margin: 0;
    }
  }
```

- [ ] **Step 4: Visually verify in the dev server**

Run in a separate terminal:

```bash
yarn dev
```

Wait for the `Local: http://localhost:3000` line. Open `http://localhost:3000/resume` in a browser. Confirm:
- The resume renders as before
- No "Print / Save as PDF" button is visible
- No console errors

Stop the dev server (Ctrl-C).

- [ ] **Step 5: Regenerate the PDF (HTML changed, so the committed PDF must update)**

```bash
yarn resume:pdf
```

Expected: `wrote public/resume.pdf (... bytes, 1 page)`. The PDF should now be a touch smaller since the toolbar wasn't actually rendered in the previous PDF either (the print media query already hid it) — but the CSS lines were still in the file, so the HTML is slightly shorter now. The regeneration is for HTML/PDF parity, not visual change.

- [ ] **Step 6: Commit**

```bash
git add public/resume.html public/resume.pdf
git commit -m "feat: remove in-page print button from resume.html"
```

---

## Task 5: Add the Download PDF link to the home page

**Files:**
- Modify: `pages/index.mdx`

- [ ] **Step 1: Update the Resume bullet**

In `pages/index.mdx`, replace line 23:

```
- Resume [rootulp](/resume)
```

with:

```
- Resume [rootulp](/resume) · [Download PDF](/resume.pdf)
```

- [ ] **Step 2: Visually verify in the dev server**

```bash
yarn dev
```

Open `http://localhost:3000/`. Confirm the Links section shows:

```
Resume rootulp · Download PDF
```

with two distinct links. Click each:
- `rootulp` → opens the HTML resume at `/resume`
- `Download PDF` → triggers a download (or in-browser preview, depending on browser) of `resume.pdf`

Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add pages/index.mdx
git commit -m "feat: add Download PDF link to home page Links section"
```

---

## Task 6: End-to-end verification & lint

**Files:** none

- [ ] **Step 1: Run lint**

```bash
yarn lint
```

Expected: passes (or shows only pre-existing warnings unrelated to the changes).

- [ ] **Step 2: Build the site**

```bash
yarn build
```

Expected: build completes without errors. Static assets including `public/resume.pdf` are emitted.

- [ ] **Step 3: Serve the build and re-check**

```bash
yarn start
```

In a browser:
- Visit `http://localhost:3000/` — Links section shows two resume links
- Click `Download PDF` — downloads/displays `resume.pdf`
- Visit `http://localhost:3000/resume` — HTML resume renders, no print button
- Confirm the downloaded PDF opens to exactly one page

Stop the server.

- [ ] **Step 4: Final commit (only if anything was changed during verification)**

If lint or build required changes, commit them:

```bash
git add -A
git commit -m "chore: fix lint/build after resume PDF changes"
```

Otherwise skip this step.

---

## Self-Review Checklist (already performed by plan author)

- [x] Every spec section maps to a task: print-button removal (Task 4), `/resume.pdf` artifact (Task 3), home-page link (Task 5), validating script (Task 2), `package.json` wiring (Task 1).
- [x] No placeholders (TBD, "implement later", "add appropriate error handling").
- [x] Function/method names match across tasks (`findChrome`, `main`, env var names `CHROME_PATH`/`INPUT_HTML`/`OUTPUT_PDF`).
- [x] Each code change shows the actual code.
- [x] Each command shows expected output.
