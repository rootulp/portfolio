# Resume: Density and Celestia Consolidation

**Date:** 2026-05-16
**Target file:** `public/resume.html`

## Goal

Make the printed PDF of the resume feel less visually squished, and reduce content redundancy by consolidating the three separate Celestia role entries into one company block with three sub-roles. Stay on a single letter-size page.

## Scope

Four coordinated changes to `public/resume.html`:

1. **CSS density tweaks** — add vertical breathing room without touching page margins.
2. **Celestia consolidation** — collapse three `.role` blocks into one block with three italic sub-role labels.
3. **Refreshed PR counts** — replace the stale `888 / 1,956` figures with live values from GitHub (`1,168 / 2,427`).
4. **Tightened EM / SWE wording** — sharper, less wordy bullets in the Engineering Manager and Senior Software Engineer entries.

## Non-goals

- Two-page layout, sidebar layout, or any structural restyle (rejected during brainstorming in favor of conservative density tweaks).
- Adding new sections (Talks, Selected Work, etc.).
- Quantifying EM / Team Lead bullets with concrete numbers — user opted to tighten wording only.
- Changes to other roles (AWS, Palantir) beyond the optional overflow-trim escape valve below.
- Changes to Education, Skills, or the Summary.

## Design

### 1. CSS density tweaks

All values live in the `<style>` block in `public/resume.html`. Page-padding values are untouched — those would shrink content width, which would worsen squish.

| Selector | Property | From | To |
|---|---|---|---|
| `.role li` | `margin-bottom` | `3px` | `6px` |
| `.role li` | `line-height` | `1.5` | `1.55` |
| `.role li` | `font-size` | `13px` | `13.5px` |
| `section` | `margin-top` | `22px` | `26px` |

These four changes operate on the dominant repeated elements (bullets and section spacing) and together produce a visible rhythm change on the printed page.

### 2. Celestia consolidation

Three `.role` blocks become one. The single block uses the existing `.role-head` styling for the "Celestia · Jul 2022 — Present" header, and introduces two new classes (`.sub-role`, `.sub-date`) for the italic position labels nested beneath.

**New HTML structure (replaces the three current Celestia `.role` blocks):**

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

**New CSS (added inside the existing `<style>` block, immediately after the `.role li::before` rule):**

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

Rationale for the styling choices:
- Italic serif for the position keeps it visually subordinate to the small-caps "Celestia" header but still distinct from the bullets.
- The mono `.sub-date` matches the existing `.role-date` typography so date columns across the resume share a single visual language.
- `:first-of-type` reduces the top gap on the first sub-role since it follows the role header directly.

### 3. Refreshed PR counts

Source: live `gh api search/issues` queries against `celestiaorg/celestia-app` and `celestiaorg/celestia-core` (ran 2026-05-16).

| Repo | Authored (merged) | Reviewed (merged) |
|---|---|---|
| celestia-app | 1,013 | 2,109 |
| celestia-core | 155 | 318 |
| **Combined** | **1,168** | **2,427** |

The SWE bullet uses the combined totals to match the "across celestia-app and celestia-core" framing already in place.

### 4. Tightened EM / SWE wording

| Role | Before | After |
|---|---|---|
| EM | Lead an 8-person team (10 reports including two on loan to adjacent team) owning reliability, performance, and scale for the Celestia protocol | Lead an 8-person team owning reliability, performance, and scale for the Celestia protocol |
| EM | Defined and now drive execution against Q2 OKRs spanning network reliability, protocol performance, and scale targets | Set and drive Q2 OKRs across network reliability, protocol performance, and scale |
| Team Lead | Led a 4-person team owning the Celestia consensus layer | *(unchanged — already lean)* |
| SWE | Led the first consensus layer upgrade (v2.0.0), establishing the upgrade framework used by all subsequent network upgrades | Led Celestia's first consensus-breaking upgrade (v2.0.0), establishing the framework reused by every subsequent network upgrade |

## Single-page constraint

The density tweaks add roughly 50–60px of vertical content; the Celestia consolidation reclaims roughly 30–40px (three role-heads collapse to one role-head plus three smaller sub-role labels). Expected net is near-neutral.

**If the page overflows after the changes:** trim the AWS "Recognized as employee of the month 3 times in less than 2 years (team of ~20 engineers)" bullet. It is the weakest bullet in the resume (internal/subjective rather than externally legible) and removing it costs the least signal. This is an escape valve, not a planned change.

## Verification

After implementing, the implementer should:

1. Open `public/resume.html` in a browser at the existing `/resume` route.
2. Use the toolbar's "Print / Save as PDF" button to render a PDF and confirm:
   - The resume fits on one letter page.
   - Bullets and sections feel less compressed than the current version.
   - The Celestia block visually reads as one company entry with three sub-roles, not three companies.
3. Verify the PR count bullet shows `1,168` authored and `2,427` reviewed.
4. Skim for any unintended layout side effects on the screen-viewing breakpoint (`max-width: 900px`).

## Risk

- **Page overflow:** mitigated by the escape valve above.
- **Sub-role styling drift on the mobile breakpoint:** the existing `@media (max-width: 900px)` block changes `.role-head` to a single column. The new `.sub-role` line is already a single-column flow element, so no media-query work should be needed, but the implementer should confirm on a narrow viewport.
- **PR-count freshness:** numbers are point-in-time as of 2026-05-16. Future refreshes will require re-running the `gh` queries.
