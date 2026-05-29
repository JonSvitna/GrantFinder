# Universal Landing Page Design

Date: 2026-05-28  
Status: Implemented  
Supersedes: Landing layout portions of [2026-05-27-founder-access-mvp-design.md](./2026-05-27-founder-access-mvp-design.md) (hero structure only — funnel logic unchanged)  
Figma Design: [SMB Funding Navigator — Founder Access Screens](https://www.figma.com/design/z7GTV3blc0MVceWDkud46Y)  
Reference mockup: `00 References` → `Reference — Landing` (embedded approved image)

## Goal

Make the SMB Funding Navigator landing page (`/`) match the approved full marketing mockup universally — for all users and launch contexts — while preserving the Founder Access conversion funnel defined in the Founder Access MVP spec.

The reference mockup is the single visual source of truth. The simplified dual-tier hero (waitlist + Founder cards inside the hero) is retired.

## Product decisions (locked)

| Decision | Choice |
|---|---|
| Landing layout | Full reference mockup — header, hero, feature grid, middle trio, footer |
| Hero composition | Unchanged from reference — no waitlist/Founder tier cards in hero |
| Free waitlist capture | Footer “Stay in the loop” only (`landing_footer` source) |
| Paid conversion | Header **Become a Founder** → `/founder/checkout` |
| Auth entry | Header **Log in** → `/login` |
| Primary product CTA | Hero **Find Funding & Paperwork Steps** → `/wizard` |
| Secondary hero CTA | **See How It Works** → `#how-it-works` anchor |
| Spots counter | Optional compact badge near header **Become a Founder** (live from cap API) |
| Figma workflow | Figma-first — rebuild `01 Landing`, then implement Next.js to match |
| Illustration & preview | Static for MVP (deterministic sample content) |

## Relationship to Founder Access MVP

This spec changes **only the landing page layout and CTA placement**. It does not change:

- Stripe Checkout, webhooks, or subscription gating
- Wizard paywall behavior
- Supabase magic-link auth
- 50-seat Founder cap enforcement
- Admin pages or dashboard shells

The Founder Access funnel still works as documented in the 2026-05-27 spec. Waitlist source `landing_hero` is deprecated on `/`; footer uses `landing_footer`.

## Page structure

Top-to-bottom sections matching the reference mockup:

### 1. Header

- **Brand:** Compass mark + “SMB Funding Navigator” + “Maryland MVP” subtitle
- **Badge:** “Maryland-first” pill (flag/crab accent)
- **Nav:** Funding, Paperwork, Incentives, Resources, About (dropdown chevrons cosmetic for MVP)
- **Actions:** Log in (outline) + Become a Founder (solid navy/green per mockup)

Nav destinations for MVP:

| Link | Target |
|---|---|
| Funding | `/funding` or `#features` |
| Paperwork | `/paperwork` |
| Incentives | `#features` |
| Resources | `#how-it-works` |
| About | `#about` |

### 2. Hero

**Left column — copy**

- Kicker: Maryland-first positioning (implicit in headline area)
- Headline: “Find funding. Decode paperwork. Get business-ready faster.”
- Subhead: Extended copy including incentives, forms, registrations; audience includes startups, solo founders, new LLC owners
- CTAs: Find Funding & Paperwork Steps (primary blue) + See How It Works (outline)
- Trust line: “Trusted guidance, not legal or tax advice…” with shield icon

**Center/right — dashboard preview card (static)**

- Greeting: “Welcome back, Alex! Here's your business readiness overview.”
- Readiness gauge: 78% On Track + explanatory copy
- Top Funding Matches: 3 sample programs with amounts
- Next Recommended Step: “Get your EIN” + Start Step link
- Progress timeline: 5 steps (Profile → Launch), step 4 highlighted in progress

**Far right — Maryland illustration**

- State House, skyline, water, crab, flag — static SVG or exported asset
- Decorative only; no interaction required for MVP

### 3. Feature grid (4 columns)

| Card | Icon | Copy theme |
|---|---|---|
| Funding Matches | Search | Personalized grants, loans, tax credits, incentives |
| Paperwork Navigator | Document | Plain-English form guidance |
| Readiness Dashboard | Chart | Progress tracking toward fundable |
| County/State Incentives | Map pin | Location-based incentive discovery |

### 4. Middle trio (3 columns)

**How It Works**

1. Create Your Profile  
2. Get Matched & Guided  
3. Take Action & Grow  

**Plain-English Checklist (preview)**

Static checklist with status badges:

- Get your EIN — Complete  
- Register your business with Maryland — Complete  
- Set up a business bank account — Complete  
- Create a SAM.gov account — In Progress  
- Apply for funding opportunities — Not Started  

**Common Forms & Registrations**

Icon grid: W-9, SAM.gov, eMMA, EIN, Business Registration (links to `/paperwork` where seeded docs exist)

### 5. Footer

**Top row**

- Logo + product description
- Four link columns: Funding, Paperwork, Resources, About (anchor links)
- “Stay in the loop” — email + first name + Subscribe button → `WaitlistForm` (`landing_footer`)
- Social icons: LinkedIn, Facebook, YouTube, Email (placeholder `#` hrefs for MVP)

**Bottom bar (navy)**

- Copyright © 2026 SMB Funding Navigator
- Privacy Policy · Terms of Use · Disclaimer (placeholder `#` or existing disclaimer anchor)
- “Built for Maryland businesses” + flag/crab accent

## Conversion mapping

| Mockup element | Live behavior |
|---|---|
| Sign up free | **Removed** — replaced by Become a Founder |
| Become a Founder (header) | `/founder/checkout`; show sold-out state when cap reached |
| Log in | `/login` |
| Subscribe (footer) | `POST /api/waitlist` via `WaitlistForm` |
| Find Funding & Paperwork Steps | `/wizard` |
| Dashboard preview content | Static — not live user data |
| Start Step (preview) | `/wizard` or `/paperwork` |

Optional header badge: `{spots_remaining}/50 spots left` from `fetchBillingCap()` when cap API available.

## Figma deliverable

Rebuild empty page **`01 Landing`** in file `z7GTV3blc0MVceWDkud46Y`:

| Frame | Contents |
|---|---|
| Header | 1440×~97 |
| Hero | Copy + preview card + illustration placeholder |
| Features | 4-up icon cards |
| Middle | 3-column section |
| Footer | Subscribe row + legal bar |

Validation: screenshot `01 Landing` against `Reference — Landing` in `00 References`. Do not modify the reference embed.

Implementation order in Figma:

1. Header  
2. Hero + preview card  
3. Feature grid  
4. Middle trio  
5. Footer  
6. Final screenshot compare  

## Frontend deliverable

Replace current `/` implementation (`landing-shell`, hero tier cards, minimal preview) with components aligned to Figma frames:

| Component | Role |
|---|---|
| `landing-shell.tsx` | Header + footer shell (update to match mockup) |
| `landing-hero.tsx` | Hero copy + CTAs + trust line |
| `dashboard-preview-card.tsx` | Rich static preview (expand current minimal card) |
| `landing-features.tsx` | 4-up feature grid |
| `landing-middle.tsx` | How it works + checklist + forms grid |
| `landing-footer.tsx` | Link columns + subscribe + legal bar |

Remove from `/`:

- Hero-tier `WaitlistForm` (`landing_hero` variant in hero)
- Hero-tier `FounderTierCard`

Retain:

- `WaitlistForm` in footer  
- `fetchBillingCap` for optional header badge  
- `Disclaimer` content (integrate into footer legal or trust areas)  
- Existing CSS tokens (`--navy`, `--green`, `--blue`, `--muted`, `--border`)

## Static vs live (MVP)

| Element | MVP treatment |
|---|---|
| Dashboard preview | Static sample data |
| Checklist statuses | Static preview |
| Funding match amounts | Static copy |
| Maryland illustration | Static asset |
| Nav dropdowns | Visual only — no menus |
| Footer legal links | Placeholder anchors |
| Social links | Placeholder `#` |
| Waitlist form | Live API |
| Founder checkout CTA | Live route + cap check |
| Wizard CTA | Live route |

## Error handling

| Scenario | Behavior |
|---|---|
| Cap API unavailable | Header badge hidden; Become a Founder still links to checkout (checkout route enforces cap) |
| Cap reached | Header CTA shows sold-out copy or disabled state; footer waitlist still works |
| Waitlist duplicate | Existing idempotent success messaging |
| Missing illustration asset | CSS/SVG fallback block — page still ships |

## Success criteria

- Figma `01 Landing` visually matches `Reference — Landing` at comparable viewport width
- Live `/` matches Figma `01 Landing` structure and copy hierarchy
- No waitlist or Founder tier cards appear in the hero
- Header exposes Log in + Become a Founder
- Footer waitlist form submits successfully
- Hero and primary CTAs route to `/wizard` and `#how-it-works`
- Founder Access funnel (wizard → paywall → checkout) unchanged

## Out of scope

- Animated hero or scroll effects
- Functional nav dropdown menus
- Live dashboard preview fed by API
- Privacy/Terms legal pages (placeholder links only)
- Replacing other pages (wizard, paywall, dashboard) — separate specs
