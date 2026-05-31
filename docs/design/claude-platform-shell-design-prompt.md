# Claude Design Prompt — SMB Funding Navigator Platform Shells

Use this prompt in **Open Design** (`frontend-design` skill), **Claude**, or **Figma MCP** to generate or refine the product and admin shells. Code is already implemented; this prompt drives **visual parity** with Figma implementation frames.

---

## Master prompt (copy everything below this line)

You are designing the authenticated platform UI for **SMB Funding Navigator** — a Maryland-first SMB grant and funding readiness product. The marketing landing page is already approved; your job is the **product shell** and **admin shell** only.

### Product context

- **Audience:** Maryland small business owners navigating grants, paperwork, and compliance
- **Tone:** Trustworthy fintech + civic clarity — not startup hype, not generic AI dashboard slop
- **Geography:** Maryland-first programs; county and state context matters
- **MVP scope:** Founder subscription product + small admin team — dense but calm, not enterprise-heavy

### Design tokens (mandatory — do not invent new palette)

| Token | Value | Usage |
|---|---|---|
| Background | `#f8faf8` | Page canvas |
| Paper | `#ffffff` | Cards, sidebar |
| Navy | `#17324d` | Headlines, brand, primary text |
| Foreground | `#14213d` | Body text |
| Green | `#2e7d5b` | Primary accent — actions, links, active nav, success (single accent; no blue) |
| Border | `#d9e2ec` | Dividers, card borders |
| Muted | `#607084` | Secondary text, meta |

**Typography:** System sans — Arial/Helvetica stack. Headlines bold (700–800). No decorative serif. No Inter/Roboto defaults unless explicitly matching existing app.

**Radius:** 7–8px buttons and cards. Pill badges use `border-radius: 999px`.

**Shadow:** Subtle only — `0 10px 26px rgba(20, 33, 61, 0.06)` on panels.

**Layout width:** Design at **1440px** desktop. Sidebar **260px** fixed.

### Shell architecture (locked)

Three shells exist; design **two** of them (product + admin). Do not redesign marketing/landing.

| Shell | Routes | Chrome |
|---|---|---|
| **PlatformShell** (product) | `/dashboard`, `/funding`, `/paperwork`, `/tasks` | 260px sidebar + utility top bar. **No** marketing header. |
| **AdminShell** | `/admin/leads`, `/admin/founders`, `/admin/sources` | Grouped sidebar + page title bar |

Brand link in product sidebar → `/dashboard` (not home `/`).

### PlatformShell — shared chrome

**Sidebar (260px, white, border-right `#d9e2ec`):**

1. Brand block: **SMB Funding Navigator** (navy, 15px, weight 800) + subtitle **Maryland MVP** (muted, 12px)
2. Nav (vertical list, 14px):
   - Dashboard → `/dashboard`
   - Funding Matches → `/funding`
   - Paperwork Navigator → `/paperwork`
   - Forms & Tasks → `/tasks`
3. Active state: green left border or green text + light green wash — not full blue fill
4. Progress card: “Get business-ready faster” + horizontal progress bar (~75%) + “View my progress” link (blue)
5. Sign out — secondary outline button at bottom

**Top utility bar (not marketing):**

- Left: **Maryland-first** pill badge (same family as landing badge)
- Right: notification bell placeholder + avatar circle (initials) + display name + optional business name

**Do not include:** Become a Founder CTA, Log in, marketing nav links, or hero CTAs in this chrome.

### AdminShell — shared chrome

**Sidebar (260px):**

- Brand: **SMB Funding Navigator** + **Admin MVP**
- **Overview** section: Waitlist leads (active on leads page)
- **Operations** section: Founder roster, Source management
- Footer note (11px muted): “Phase 2: review queue, ingestion, KPIs”

**Top bar:**

- Page title (h1 weight)
- One-line description (muted)
- Optional actions slot (e.g. Export CSV outline button)

---

## Frame 1: `Platform — Dashboard`

**Figma page:** `02 Product`  
**Reference:** Figma file `z7GTV3blc0MVceWDkud46Y`, node `7:2` (Reference — User Dashboard)

Render **PlatformShell** with **Dashboard** nav active.

**Main content (below utility bar):**

1. **Welcome hero panel** (white card, full width)
   - Kicker: “Welcome back!”
   - H1: business name (e.g. “Harbor Roasters”)
   - Meta: county/location (e.g. “Anne Arundel County, Maryland”)
   - Optional right-side decorative “Maryland” art block (static, not illustration-heavy)

2. **Readiness band** (horizontal)
   - Left: **Overall readiness** circular gauge — large numeric score (e.g. 68) with ring
   - Right: **3×2 grid** of compact score cards — Funding fit, Paperwork, Compliance, Registrations, etc. Each: label + score bar + small score number

3. **Three-column grid**
   - **Column 1 — Top funding matches:** 3 program rows with match %, agency, deadline hint
   - **Column 2 — Next steps:** checklist / priority tasks with status chips
   - **Column 3 — Missing documents + progress:** doc list + horizontal step timeline: Profile → Paperwork → Registrations → Apply for Funding → Launch

Use realistic Maryland SMB sample data. Include a small legal disclaimer footer area if space allows.

---

## Frame 2: `Platform — Funding`

**Figma page:** `02 Product`  
Same **PlatformShell**; **Funding Matches** nav active.

**Main content:**

1. **Page header** (in content area, not shell): “Funding matches and readiness programs” + short subtitle
2. **Filter row:** search input + stage/status dropdown (outline controls)
3. **Program list:** 5–6 stacked cards, each with:
   - Program name (navy, bold)
   - Agency / source
   - Match score badge (green percentage)
   - Application deadline
   - One-line description
   - “View details” link (blue)

No sidebar duplication. No marketing header.

---

## Frame 3: `Platform — Paperwork` (optional third product frame)

Same shell; **Paperwork Navigator** active.

- Page title: “Paperwork navigator”
- Document checklist grouped by category (Licenses, Tax, Insurance, etc.)
- Status pills: Missing / In progress / Complete
- Link to document detail rows

---

## Frame 4: `Admin — Leads`

**Figma page:** `03 Admin`  
**Reference:** Figma node `8:2` (Reference — Admin Dashboard)

Render **AdminShell** with **Waitlist leads** active.

**Main content:**

1. **KPI row** — 4 stat cards:
   - Total leads
   - This week
   - Converted founders
   - Pending review

2. **Data table** — columns: Name, Email, Business, Stage, Submitted, Actions  
   Sample 5–6 rows with realistic Maryland SMB names and emails.

3. **Phase 2 note** — muted callout below table: future review queue / ingestion (not built yet)

Top bar: title “Waitlist leads”, description “Founder waitlist and early access requests”, Export button.

---

## Anti-patterns (reject these)

- Purple gradients, glassmorphism, or “AI startup” dark mode
- Generic dashboard with random chart widgets unrelated to funding readiness
- Duplicate navigation (marketing header + sidebar on same screen)
- Sidebar width other than 260px
- New colors outside the token table
- Messages, Settings, or Incentives nav items (out of scope — omit)
- Stock photo heroes or illustrated characters

## Deliverables

1. **1440×900** (or taller if content requires) frames for each screen above
2. **Component-level clarity:** sidebar, top bar, cards, tables reusable across frames
3. **Pixel alignment** with existing code in `apps/web/components/platform-shell.tsx`, `admin-shell.tsx`, and `globals.css`
4. Export-ready for Figma pages `02 Product` and `03 Admin` — do **not** edit reference embeds on `00 References`

## Verification checklist

Before marking done, confirm:

- [ ] Sidebar 260px, tokens match table
- [ ] Product frames share identical shell; only main content differs
- [ ] Admin frame uses grouped nav, not product nav
- [ ] No marketing CTAs in product/admin chrome
- [ ] Active nav state visible on each frame
- [ ] Sample content feels Maryland-specific, not generic lorem ipsum
- [ ] Screenshot at 1440px would align with live routes `/dashboard`, `/funding`, `/admin/leads`

---

## Open Design settings

| Setting | Value |
|---|---|
| Skill | `frontend-design` or `web-artifacts-builder` |
| Design system | `clean` or `stripe` (override with tokens above) |
| Output | Single-file HTML artifact or Figma-ready structured layout |
| URL | http://localhost:7456 (or dev server port if using `pnpm tools-dev run web`) |

## Figma file

- **File:** [SMB Funding Navigator — Founder Access Screens](https://www.figma.com/design/z7GTV3blc0MVceWDkud46Y)
- **File key:** `z7GTV3blc0MVceWDkud46Y`
- **Create on:** `02 Product`, `03 Admin`
- **References (read-only):** `00 References` → nodes `5:2`, `7:2`, `8:2`

## Related specs

- `docs/superpowers/specs/2026-05-28-platform-shell-navigation-design.md`
- `docs/superpowers/specs/2026-05-28-universal-landing-page-design.md`
