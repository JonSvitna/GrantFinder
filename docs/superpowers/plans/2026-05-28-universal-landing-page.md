# Universal Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Figma `01 Landing` and the live `/` page to match the approved reference mockup — full marketing layout with header/footer conversion only (no hero tier cards).

**Architecture:** Figma-first. Rebuild `01 Landing` in file `z7GTV3blc0MVceWDkud46Y` section-by-section using `use_figma`, validate against `00 References` → `Reference — Landing`, then refactor `apps/web` into focused landing components that mirror the Figma frames. Reuse existing waitlist API, cap fetch, and design tokens.

**Tech Stack:** Figma MCP (`use_figma`, `get_screenshot`), Next.js 16 App Router, React 19, CSS modules via `globals.css`, existing `WaitlistForm` + `fetchBillingCap`.

**Design references:**
- Spec: `docs/superpowers/specs/2026-05-28-universal-landing-page-design.md`
- Figma: https://www.figma.com/design/z7GTV3blc0MVceWDkud46Y
- Reference node: `5:2` on page `00 References`

---

## File Structure

```text
apps/web/
  app/
    page.tsx                          # compose landing sections only
    globals.css                       # landing layout + footer + hero grid CSS
  components/
    landing-shell.tsx                 # header (update) + wraps main; footer moved out
    landing-hero.tsx                  # NEW — copy, CTAs, trust line
    dashboard-preview-card.tsx        # MODIFY — rich static preview
    landing-features.tsx              # NEW — 4-up feature grid
    landing-middle.tsx                # NEW — how-it-works + checklist + forms
    landing-footer.tsx                # NEW — link columns, subscribe, legal bar
    landing-illustration.tsx          # NEW — MD decorative SVG/block
    waitlist-form.tsx                 # MODIFY — footer subscribe label variant
    founder-tier-card.tsx             # unchanged (still used on checkout, not /)
  public/
    landing-hero-illustration.svg     # NEW — optional static illustration asset
```

Figma file `z7GTV3blc0MVceWDkud46Y`:
- Page `4:2` (`01 Landing`) — full rebuild as single frame `Landing — Universal`

---

## Task 1: Figma — Header frame

**Files:**
- Figma: page `01 Landing` (`4:2`), file key `z7GTV3blc0MVceWDkud46Y`

- [ ] **Step 1: Clear empty page and create root frame**

Run `use_figma` on page `4:2`:

```js
const page = await figma.getNodeByIdAsync('4:2');
await figma.setCurrentPageAsync(page);
for (const child of [...page.children]) child.remove();

const screen = figma.createFrame();
screen.name = 'Landing — Universal';
screen.resize(1440, 4200);
screen.fills = [{ type: 'SOLID', color: { r: 0.973, g: 0.98, b: 0.973 } }];
screen.layoutMode = 'VERTICAL';
screen.itemSpacing = 0;
screen.placeholder = true;
page.appendChild(screen);

return { createdNodeIds: [screen.id], screenId: screen.id };
```

- [ ] **Step 2: Build header row**

Append to `screenId` from Step 1 — compass ellipse, brand text, Maryland-first badge, nav links (Funding ▾, Paperwork ▾, Incentives ▾, Resources ▾, About), Log in outline button, Become a Founder solid button. Match colors: navy `#17213d`, green `#2e805c`, muted `#617085`, border `#d9e3ed`.

Return `{ createdNodeIds, mutatedNodeIds: [screenId], headerId }`.

- [ ] **Step 3: Screenshot header**

Run `await header.screenshot({ scale: 0.5 })` in a read script or `get_screenshot` on header node. Compare to reference top bar.

---

## Task 2: Figma — Hero + dashboard preview

**Files:**
- Figma: continue on `Landing — Universal` frame

- [ ] **Step 1: Hero copy column**

Add auto-layout row `Hero` with three children:
1. **Hero/Copy** — headline, extended subhead, primary CTA (blue `#2f80ed`), secondary outline CTA, trust disclaimer with shield placeholder rectangle
2. **Hero/Preview** — white card 520×560: greeting, gauge ring 78%, 3 funding match rows, next step card, 5-step progress bar (step 4 active)
3. **Hero/Illustration** — placeholder frame labeled `Maryland illustration` 280×400 with note "Replace with SVG asset"

- [ ] **Step 2: Screenshot hero section**

Screenshot the Hero row; verify no tier/waitlist cards appear.

- [ ] **Step 3: Set hero placeholder false**

`screen.placeholder = false` for hero subtree when complete.

---

## Task 3: Figma — Feature grid + middle trio

**Files:**
- Figma: `Landing — Universal`

- [ ] **Step 1: Feature 4-up**

Section `Features` — 4 equal cards with icon circle + title + body:
- Funding Matches
- Paperwork Navigator
- Readiness Dashboard
- County/State Incentives

- [ ] **Step 2: Middle trio**

Section `Middle` — 3 columns:
- How It Works (3 numbered steps with icon circles)
- Plain-English Checklist preview (5 rows with Complete/In Progress/Not Started badges)
- Common Forms grid (W-9, SAM.gov, eMMA, EIN, Business Registration icon tiles)

- [ ] **Step 3: Screenshot mid-page**

Capture Features + Middle sections together.

---

## Task 4: Figma — Footer + final validation

**Files:**
- Figma: `Landing — Universal`

- [ ] **Step 1: Footer top row**

Logo blurb, 4 link columns, Stay in the loop card (email + first name inputs + Subscribe button), social icon placeholders.

- [ ] **Step 2: Legal bar**

Navy `#17324d` full-width bar: copyright, Privacy · Terms · Disclaimer links, "Built for Maryland businesses 🦀"

- [ ] **Step 3: Full-page screenshot compare**

Screenshot entire `Landing — Universal` frame at 0.25–0.5 scale. Compare side-by-side with `5:2` reference embed. Note any gaps in a short return object `{ gaps: [...] }` and fix in a follow-up `use_figma` call if needed.

---

## Task 5: Landing CSS foundation

**Files:**
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: Replace tier-card hero CSS with universal layout CSS**

Remove or stop using: `.landing-tier-row`, `.landing-tier-card`, `.landing-tier-card-founder`, `.landing-tier-label`, `.landing-tier-price`, `.landing-tier-copy`, `.landing-tier-list`.

Add:

```css
.landing-header-badge {
  align-items: center;
  background: #eef5f1;
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--navy);
  display: inline-flex;
  font-size: 12px;
  font-weight: 700;
  gap: 6px;
  padding: 6px 10px;
}

.landing-hero-universal {
  display: grid;
  gap: 32px;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 520px) minmax(200px, 280px);
  margin: 0 auto;
  max-width: 1440px;
  padding: 48px 24px;
}

.landing-trust-line {
  align-items: center;
  color: var(--muted);
  display: flex;
  font-size: 13px;
  gap: 8px;
  line-height: 1.5;
}

.landing-feature-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.landing-middle-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.landing-footer-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: 1.2fr repeat(4, minmax(0, 1fr)) 1.3fr;
}

.landing-legal-bar {
  background: var(--navy);
  color: rgba(255, 255, 255, 0.88);
  display: flex;
  flex-wrap: wrap;
  font-size: 13px;
  gap: 12px;
  justify-content: space-between;
  padding: 16px 24px;
}

@media (max-width: 1100px) {
  .landing-hero-universal,
  .landing-feature-grid,
  .landing-middle-grid,
  .landing-footer-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: Add button-blue utility**

```css
.button-blue {
  align-items: center;
  background: var(--blue);
  border: 0;
  border-radius: 7px;
  color: white;
  cursor: pointer;
  display: inline-flex;
  font-weight: 700;
  min-height: 44px;
  padding: 0 16px;
}
```

- [ ] **Step 3: Verify CSS parses**

Run: `cd apps/web && npm run build`
Expected: build succeeds (no PostCSS errors).

---

## Task 6: Landing shell — header with badge + cap

**Files:**
- Modify: `apps/web/components/landing-shell.tsx`

- [ ] **Step 1: Update nav items and header layout**

```tsx
const navItems = [
  { href: "/funding", label: "Funding" },
  { href: "/paperwork", label: "Paperwork" },
  { href: "#features", label: "Incentives" },
  { href: "#how-it-works", label: "Resources" },
  { href: "#about", label: "About" },
];
```

Add Maryland-first badge after brand. Accept optional props:

```tsx
export function LandingShell({
  children,
  spotsRemaining,
  capReached,
}: {
  children: ReactNode;
  spotsRemaining?: number;
  capReached?: boolean;
}) {
```

Render near Become a Founder:

```tsx
{spotsRemaining !== undefined && !capReached ? (
  <span className="landing-header-badge">{spotsRemaining}/50 spots left</span>
) : null}
<Link
  className={capReached ? "button-secondary" : "button-primary"}
  href={capReached ? "/waitlist/thanks" : "/founder/checkout"}
>
  {capReached ? "Founder seats full" : "Become a Founder"}
</Link>
```

Add cosmetic `▾` after nav labels in JSX (span with aria-hidden).

- [ ] **Step 2: Verify build**

Run: `cd apps/web && npm run build`
Expected: PASS

---

## Task 7: Landing hero component

**Files:**
- Create: `apps/web/components/landing-hero.tsx`

- [ ] **Step 1: Create component**

```tsx
import Link from "next/link";

export function LandingHero() {
  return (
    <section className="landing-hero-universal">
      <div className="landing-hero-copy">
        <h1 className="landing-hero-title">
          Find funding. Decode paperwork.
          <br />
          Get business-ready faster.
        </h1>
        <p className="landing-hero-subtitle">
          Maryland-first assistant for grants, loans, tax credits, incentives, forms, and registrations—built for
          small businesses, startups, solo founders, and new LLC owners.
        </p>
        <div className="landing-hero-ctas">
          <Link className="button-blue" href="/wizard">
            Find Funding &amp; Paperwork Steps
          </Link>
          <Link className="button-secondary" href="#how-it-works">
            See How It Works
          </Link>
        </div>
        <p className="landing-trust-line">
          <span aria-hidden="true">🛡️</span>
          Trusted guidance, not legal or tax advice. We simplify official information—but we don&apos;t submit forms for
          you.
        </p>
      </div>
      {/* DashboardPreviewCard and LandingIllustration inserted by page.tsx */}
    </section>
  );
}
```

Refactor so `page.tsx` passes preview + illustration as children OR export a wrapper `LandingHeroSection` that composes all three columns — prefer single `landing-hero.tsx` exporting:

```tsx
export function LandingHeroSection() {
  return (
    <section className="landing-hero-universal">
      <LandingHeroCopy />
      <DashboardPreviewCard />
      <LandingIllustration />
    </section>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd apps/web && npm run build`
Expected: PASS

---

## Task 8: Rich dashboard preview card

**Files:**
- Modify: `apps/web/components/dashboard-preview-card.tsx`

- [ ] **Step 1: Replace minimal card with full static preview**

Implement sections from spec:
- Title: "Welcome back, Alex! Here's your business readiness overview."
- Gauge: 78% On Track + reason copy
- Top Funding Matches: 3 rows with amounts
- Next Recommended Step: Get your EIN + Link to `/wizard`
- Progress: 5 steps, step 4 "Apply for Funding" marked in progress

Use existing `.panel`, `.landing-preview-gauge`, add `.landing-preview-match`, `.landing-preview-stepper` classes in globals.css as needed.

- [ ] **Step 2: Verify preview renders key strings**

Run: `cd apps/web && npm run build && curl -s http://localhost:3001/ | grep -o "Maryland Entrepreneur Hub Grants\|Get your EIN\|Apply for Funding" | sort -u`

Expected: all three strings present when dev server running.

---

## Task 9: Maryland illustration

**Files:**
- Create: `apps/web/components/landing-illustration.tsx`
- Optional: `apps/web/public/landing-hero-illustration.svg`

- [ ] **Step 1: Create decorative component**

Minimal MVP: gradient block with labels "State House", crab emoji, flag colors stripe — or inline SVG ~280×400. Component must not block layout on mobile (hidden below 1100px optional).

```tsx
export function LandingIllustration() {
  return (
    <div aria-hidden="true" className="landing-illustration">
      {/* SVG or styled div matching reference palette */}
    </div>
  );
}
```

Add `.landing-illustration { min-height: 360px; border-radius: 12px; background: linear-gradient(...); }` to globals.css.

- [ ] **Step 2: Verify build**

Run: `cd apps/web && npm run build`
Expected: PASS

---

## Task 10: Feature grid + middle trio

**Files:**
- Create: `apps/web/components/landing-features.tsx`
- Create: `apps/web/components/landing-middle.tsx`

- [ ] **Step 1: landing-features.tsx**

Export `LandingFeatures` with `id="features"` wrapping 4 cards — static copy from spec table. Each card: icon emoji or CSS circle + h3 + p.

- [ ] **Step 2: landing-middle.tsx**

Export `LandingMiddle` containing:
- `#how-it-works` — 3 steps
- Checklist preview with status pills (Complete / In Progress / Not Started)
- Forms grid linking to `/paperwork` with 5 tiles

- [ ] **Step 3: Verify build**

Run: `cd apps/web && npm run build`
Expected: PASS

---

## Task 11: Footer + waitlist

**Files:**
- Create: `apps/web/components/landing-footer.tsx`
- Modify: `apps/web/components/waitlist-form.tsx`

- [ ] **Step 1: landing-footer.tsx**

Sections:
- Logo + description
- Link columns (Funding, Paperwork, Resources, About) — anchor hrefs from spec
- Stay in the loop: `<WaitlistForm source="landing_footer" variant="subscribe" />`
- Social placeholders (`href="#"`)
- Legal bar with Disclaimer link to `#disclaimer` and copyright 2026

- [ ] **Step 2: Add subscribe variant to WaitlistForm**

```tsx
variant?: "default" | "hero" | "subscribe";
```

For `subscribe`: stacked email + first name, button label **Subscribe**, use `button-blue` or `button-primary`.

- [ ] **Step 3: Move Disclaimer**

Render `<Disclaimer />` inside footer above legal bar with `id="disclaimer"`.

- [ ] **Step 4: Verify waitlist source**

Confirm hero no longer uses `landing_hero` — grep:

Run: `rg "landing_hero" apps/web/app/page.tsx`
Expected: no matches

---

## Task 12: Compose page.tsx

**Files:**
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Replace current composition**

```tsx
import { LandingShell } from "@/components/landing-shell";
import { LandingHeroSection } from "@/components/landing-hero";
import { LandingFeatures } from "@/components/landing-features";
import { LandingMiddle } from "@/components/landing-middle";
import { LandingFooter } from "@/components/landing-footer";
import { fetchBillingCap } from "@/lib/subscription";

export default async function HomePage() {
  let spotsRemaining: number | undefined;
  let capReached = false;
  try {
    const cap = await fetchBillingCap();
    spotsRemaining = cap.spots_remaining;
    capReached = cap.cap_reached;
  } catch {
    spotsRemaining = undefined;
  }

  return (
    <LandingShell capReached={capReached} spotsRemaining={spotsRemaining}>
      <LandingHeroSection />
      <LandingFeatures />
      <LandingMiddle />
      <LandingFooter />
    </LandingShell>
  );
}
```

Remove imports: `FounderTierCard`, hero `WaitlistForm`, old tier layout, standalone `Disclaimer` if moved to footer.

- [ ] **Step 2: Remove dead CSS**

Delete unused tier-card rules from `globals.css` if no other page references them.

Run: `rg "landing-tier" apps/web`
Expected: no matches outside globals (then remove rules).

- [ ] **Step 3: Full build**

Run: `cd apps/web && npm run build`
Expected: PASS, `/` listed as static route.

---

## Task 13: Visual verification checklist

**Files:** none (verification only)

- [ ] **Step 1: Structure grep**

Run: `curl -s http://localhost:3001/ | grep -o 'landing-hero-universal\|landing-feature-grid\|landing-middle-grid\|landing-footer-grid\|Become a Founder\|Stay in the loop\|Find funding\. Decode paperwork' | sort -u`

Expected: all tokens present.

- [ ] **Step 2: Confirm hero has no tier cards**

Run: `curl -s http://localhost:3001/ | grep -c "Join waitlist"` 
Expected: `1` (footer only, not hero — or `0` in hero section; footer Subscribe may say Subscribe not Join waitlist)

- [ ] **Step 3: Figma vs code**

Open Figma `01 Landing` and localhost `/` side-by-side at 1440px width. Confirm:
- Header badge + nav + CTAs match
- Hero has preview card, no tier cards
- 4 feature cards, 3 middle columns, full footer

- [ ] **Step 4: Founder funnel smoke**

Click **Become a Founder** → `/founder/checkout`. Click **Find Funding & Paperwork Steps** → `/wizard`. Footer form submits → `/waitlist/thanks`.

---

## Task 14: Spec status update

**Files:**
- Modify: `docs/superpowers/specs/2026-05-28-universal-landing-page-design.md`

- [ ] **Step 1: Mark implemented**

Change `Status: Approved design` → `Status: Implemented` after Tasks 1–13 pass.

- [ ] **Step 2: Note deprecation**

Add one line to `2026-05-27-founder-access-mvp-design.md` landing section: "Hero tier-card layout superseded by universal landing spec (2026-05-28)."

---

## Spec coverage self-review

| Spec requirement | Task |
|---|---|
| Full reference layout | Tasks 1–4 (Figma), 5–12 (code) |
| No hero tier cards | Tasks 2, 12 |
| Header Log in + Become a Founder | Task 6 |
| Footer waitlist only | Task 11 |
| Rich dashboard preview | Task 8 |
| MD illustration | Task 9 |
| Feature 4-up | Task 10 |
| Middle trio | Task 10 |
| Full footer + legal bar | Task 11 |
| Figma-first validation | Tasks 1–4, 13 |
| Cap badge optional | Task 6 |
| Static preview data | Tasks 8–10 |

No TBD placeholders in plan. All file paths explicit.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-28-universal-landing-page.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session with checkpoints after Figma (Task 4) and after code (Task 13)

Which approach?
