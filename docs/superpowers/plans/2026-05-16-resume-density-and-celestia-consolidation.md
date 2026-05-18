# Resume Density & Celestia Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce visual squish in the printed resume PDF and collapse three repeated Celestia entries into one consolidated block with sub-roles, while staying on a single letter-size page.

**Architecture:** Single-file change to `public/resume.html` (a self-contained static HTML/CSS document with inline `<style>`). Three independent edit clusters: (1) tweak four existing CSS properties for density, (2) add new `.sub-role` / `.sub-date` CSS rules plus replace the three Celestia `<div class="role">` blocks with one consolidated block, (3) verify the printed PDF and optionally trim one bullet if the page overflows. No test harness exists for static resume rendering — verification is visual inspection in a browser at `/resume.html`.

**Tech Stack:** Static HTML5 + inline CSS, served by Next.js 14 from `public/`. Local dev via `yarn dev`. No build step or test framework involved for this file.

**Spec reference:** `docs/superpowers/specs/2026-05-16-resume-density-and-celestia-consolidation-design.md`

---

## File Structure

**Modified:**
- `public/resume.html` — only file touched by this plan

**Not touched:** `pages/`, `styles/`, `next.config.js` (resume is fully self-contained in the static file)

---

## Task 1: CSS density tweaks

Goal: add vertical breathing room to bullets and sections without touching page margins.

**Files:**
- Modify: `public/resume.html` (the inline `<style>` block, specifically the `.role li { ... }` and `section { ... }` rules around lines 185–273 of the current file)

- [ ] **Step 1: Start the dev server in the background**

Run:
```bash
yarn dev
```
(Run in background. Default URL is `http://localhost:3000`. The resume is served from `http://localhost:3000/resume.html`.)

Expected: Next.js starts and prints `Ready` once compiled.

- [ ] **Step 2: Open the resume in a browser and capture the "before" state**

Open `http://localhost:3000/resume.html`. Use the toolbar's "Print / Save as PDF" button and save a PDF aside for visual comparison. (Optional but useful — you'll want it for Task 3 verification.)

- [ ] **Step 3: Edit `.role li` font-size, line-height, and margin-bottom**

In `public/resume.html`, locate the `.role li { ... }` rule (currently around line 257) and change three properties.

Use Edit on the `.role li` block:

```css
  .role li {
    position: relative;
    padding-left: 14px;
    margin-bottom: 3px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--ink-soft);
  }
```

becomes:

```css
  .role li {
    position: relative;
    padding-left: 14px;
    margin-bottom: 6px;
    font-size: 13.5px;
    line-height: 1.55;
    color: var(--ink-soft);
  }
```

- [ ] **Step 4: Edit `section` margin-top**

Locate `section { margin-top: 22px; }` (currently around line 185) and change it to:

```css
  section {
    margin-top: 26px;
  }
```

- [ ] **Step 5: Reload the browser and visually verify density change**

Reload `http://localhost:3000/resume.html`. Expected: bullets visibly have more space between them, sections feel more separated. The page should still render cleanly with no broken layout. Old three-Celestia structure is still in place — that's expected at this stage.

- [ ] **Step 6: Commit**

```bash
git add public/resume.html
git commit -m "Add vertical breathing room to resume bullets and sections"
```

---

## Task 2: Celestia consolidation (CSS + HTML in one atomic change)

Goal: collapse the three Celestia `.role` blocks into one block with three italic sub-role labels, using refreshed PR counts and tightened EM/SWE wording. CSS and HTML are committed together because the new HTML references the new CSS classes.

**Files:**
- Modify: `public/resume.html`
  - Inline `<style>` block: add new `.sub-role` and `.sub-role .sub-date` rules immediately after the `.role li::before` rule (currently ends around line 273)
  - Body: replace the three Celestia `<div class="role">` blocks (currently lines 424–466) with one consolidated block

- [ ] **Step 1: Add the new CSS rules**

In `public/resume.html`, locate the `.role li::before { ... }` rule and the closing `}` that follows it. Add this block immediately after that closing brace (and before the `.role li a, .summary a { ... }` rule that follows):

```css
  .sub-role {
    font-family: var(--serif);
    font-style: italic;
    font-size: 13.5px;
    color: var(--ink-soft);
    margin: 10px 0 4px;
  }
  .role .sub-role:first-of-type {
    margin-top: 6px;
  }
  .sub-role .sub-date {
    font-family: var(--mono);
    font-style: normal;
    font-size: 10.5px;
    color: var(--ink-muted);
    margin-left: 2px;
  }
```

- [ ] **Step 2: Replace the three Celestia `.role` blocks with one consolidated block**

In `public/resume.html`, delete the three existing Celestia role blocks (the three consecutive `<div class="role">` blocks starting with `<span class="company">Celestia</span>` — currently lines 424–466 inclusive) and replace them with this single block.

The exact old content to remove (use a multi-line Edit, anchored on the first opening `<div class="role">` after the `<h2 class="section-title">` and ending with the third `</div>` that closes the SWE block):

```html
      <div class="role">
        <div class="role-head">
          <div class="role-title">
            <span class="company">Celestia</span>
            <span class="sep">—</span>
            <span class="position">Engineering Manager</span>
          </div>
          <div class="role-date">Mar 2026 — Present</div>
        </div>
        <ul>
          <li>Lead an 8-person team (10 reports including two on loan to adjacent team) owning reliability, performance, and scale for the Celestia protocol</li>
          <li>Defined and now drive execution against Q2 OKRs spanning network reliability, protocol performance, and scale targets</li>
        </ul>
      </div>

      <div class="role">
        <div class="role-head">
          <div class="role-title">
            <span class="company">Celestia</span>
            <span class="sep">—</span>
            <span class="position">Team Lead</span>
          </div>
          <div class="role-date">Dec 2025 — Mar 2026</div>
        </div>
        <ul>
          <li>Led a 4-person team owning the Celestia consensus layer</li>
        </ul>
      </div>

      <div class="role">
        <div class="role-head">
          <div class="role-title">
            <span class="company">Celestia</span>
            <span class="sep">—</span>
            <span class="position">Senior Software Engineer</span>
          </div>
          <div class="role-date">Jul 2022 — Dec 2025</div>
        </div>
        <ul>
          <li>Led the first consensus layer upgrade (v2.0.0), establishing the upgrade framework used by all subsequent network upgrades</li>
          <li>Authored 888 and reviewed 1,956 merged pull requests across celestia-app and celestia-core</li>
        </ul>
      </div>
```

Replace with:

```html
      <div class="role">
        <div class="role-head">
          <div class="role-title">
            <span class="company">Celestia</span>
          </div>
          <div class="role-date">Jul 2022 — Present</div>
        </div>

        <div class="sub-role">Engineering Manager <span class="sub-date">· Mar 2026 — Present</span></div>
        <ul>
          <li>Lead an 8-person team owning reliability, performance, and scale for the Celestia protocol</li>
          <li>Set and drive Q2 OKRs across network reliability, protocol performance, and scale</li>
        </ul>

        <div class="sub-role">Team Lead <span class="sub-date">· Dec 2025 — Mar 2026</span></div>
        <ul>
          <li>Led a 4-person team owning the Celestia consensus layer</li>
        </ul>

        <div class="sub-role">Senior Software Engineer <span class="sub-date">· Jul 2022 — Dec 2025</span></div>
        <ul>
          <li>Led Celestia's first consensus-breaking upgrade (v2.0.0), establishing the framework reused by every subsequent network upgrade</li>
          <li>Authored 1,168 and reviewed 2,427 merged pull requests across celestia-app and celestia-core</li>
        </ul>
      </div>
```

Note the changes embedded in the replacement:
- Three separate `Celestia — Position` headers collapse to one `Celestia` header with overall date `Jul 2022 — Present`.
- New `<div class="sub-role">` lines carry the position and date for each sub-role.
- EM bullet 1: drops the "(10 reports including two on loan to adjacent team)" parenthetical.
- EM bullet 2: "Defined and now drive execution against Q2 OKRs spanning ... targets" → "Set and drive Q2 OKRs across network reliability, protocol performance, and scale".
- Team Lead bullet: unchanged.
- SWE bullet 1: "Led the first consensus layer upgrade (v2.0.0), establishing the upgrade framework used by all subsequent network upgrades" → "Led Celestia's first consensus-breaking upgrade (v2.0.0), establishing the framework reused by every subsequent network upgrade".
- SWE bullet 2: PR counts updated from `888 / 1,956` to `1,168 / 2,427`.

- [ ] **Step 3: Reload the browser and verify the consolidated Celestia section**

Reload `http://localhost:3000/resume.html`. Verify:
- One "Celestia" header line, not three.
- Three italic sub-role labels ("Engineering Manager · Mar 2026 — Present", "Team Lead · ...", "Senior Software Engineer · ...") nested under the Celestia header, each followed by its bullets.
- EM bullet count is 2 (no parenthetical). Team Lead has 1 bullet. SWE has 2 bullets with refreshed numbers.
- No broken layout, no missing styles. The sub-role lines should read as italic serif, with a mono-font date suffix.

- [ ] **Step 4: Print to PDF and verify single-page fit**

In the browser, click the "Print / Save as PDF" toolbar button. In the print dialog, choose "Save as PDF" with Letter paper size. Save to a temp location (e.g. `/tmp/resume-after.pdf`) and open it.

Verify:
- Content fits on exactly one page (no second page with overflow content).
- Top, bottom, left, right margins look clean (no clipped content).
- Bullets feel less squished than the "before" PDF from Task 1 Step 2.

If the page overflows by one or more lines, proceed to Task 3. If it fits on one page, **skip Task 3 entirely**.

- [ ] **Step 5: Commit**

```bash
git add public/resume.html
git commit -m "Consolidate Celestia roles into single block with sub-roles

Collapses three repeated Celestia entries into one company block
with three italic sub-role labels. Refreshes PR counts (1,168 /
2,427) and tightens EM and SWE bullet wording."
```

---

## Task 3: Apply overflow escape valve (CONDITIONAL — only if Task 2 Step 4 showed overflow)

Goal: trim the single weakest bullet on the resume to keep it on one page.

**Files:**
- Modify: `public/resume.html` (the AWS role's bullet list, currently around lines 478–481)

- [ ] **Step 1: Confirm overflow exists**

If the PDF from Task 2 Step 4 fit on one page, **stop — do not execute this task**.

- [ ] **Step 2: Remove the "employee of the month" bullet**

In `public/resume.html`, locate the AWS role's `<ul>` and remove this `<li>`:

```html
          <li>Recognized as employee of the month 3 times in less than 2 years (team of ~20 engineers)</li>
```

The remaining two AWS bullets stay.

- [ ] **Step 3: Reload, re-print to PDF, verify single-page fit**

Reload `http://localhost:3000/resume.html`, print to PDF again. Verify the page fits on one letter page. If it still overflows, stop and report back — the spec did not authorize further trimming.

- [ ] **Step 4: Commit**

```bash
git add public/resume.html
git commit -m "Drop weakest AWS bullet to keep resume on one page"
```

---

## Task 4: Final verification and cleanup

Goal: do a clean final pass on the rendered resume and stop the dev server.

- [ ] **Step 1: Hard-reload the browser and re-verify the printed PDF**

Hard reload (Cmd+Shift+R on Mac) `http://localhost:3000/resume.html` to bust any cache, then print to PDF one more time. Confirm:
- One page.
- Celestia reads as one company with three sub-roles.
- PR count bullet shows `1,168` and `2,427`.
- EM bullets are the two tightened versions (no parenthetical on bullet 1).
- SWE bullet 1 says "consensus-breaking upgrade" and "reused by every subsequent network upgrade".
- Bullets feel less compressed than before.

- [ ] **Step 2: Spot-check the mobile screen breakpoint**

In the browser, resize the window to ~700px wide (or use DevTools device emulation). Verify the resume page reflows reasonably — no horizontally-clipped sub-role labels, no overlap. The existing `@media (max-width: 900px)` rules in the file should handle this without modification, but a 30-second check is worth it.

- [ ] **Step 3: Stop the dev server**

Stop the background `yarn dev` process.

- [ ] **Step 4: Final status check**

Run:
```bash
git status
git log --oneline -5
```

Expected: working tree clean, recent commits show the density tweak, Celestia consolidation, and (if applied) the overflow trim.
