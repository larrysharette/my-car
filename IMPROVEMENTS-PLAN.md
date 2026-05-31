# My Car — Improvement Plan

Draft plan based on a codebase audit (May 2026). **Edit freely** — strike items, reorder phases, or add notes inline before implementation.

**Status key:** `[ ]` not started · `[~]` in progress · `[x]` done · `[—]` dropped / disagree

---

## Phase 1 — Broken or half-wired flows

High impact; these are places the UI promises something that doesn’t work yet.

### 1.1 Wishlist page
- [ ] Add `/wishlist` route with list of items for the current car
- [ ] Wire edit + delete using existing `server/actions/wishlist.ts`
- [ ] Add **Wishlist** to sidebar nav (`components/layout/app-nav-links.tsx`)
- [ ] Protect route in `proxy.ts`
- [ ] Fix dashboard **View all** link (currently 404)

**Files:** `app/(app)/wishlist/page.tsx`, new client component for list/edit, `app-nav-links.tsx`, `proxy.ts`, `dashboard-client.tsx`

**Notes / modifications:**
- 

---

### 1.2 Dashboard quick actions
- [ ] Render quick actions that are already imported but unused:
  - [ ] Add wishlist item (`WishlistDialog`)
  - [ ] Create maintenance (`CreateMaintenanceDialog`)
  - [ ] Upload file/image (file input + `uploadCarFile`)
- [ ] Decide layout: button row on desktop vs extend mobile FAB pattern

**Files:** `components/dashboard/dashboard-client.tsx`

**Notes / modifications:**
- I actually don't want the quick actions for maintenance and wishlist. I'd rather the user go to those pages. I just needed a quick action for recording gas fill up

---

### 1.3 Actionable lists on dashboard
- [ ] Reminders: link each row to `/maintenance/[id]`
- [ ] Recent maintenance (desktop table): make rows clickable like mobile cards
- [ ] Recent wishlist: link to item URL when present; link to wishlist page for manage

**Files:** `components/dashboard/dashboard-client.tsx`

**Notes / modifications:**
- 

---

## Phase 2 — Complete existing features

Finish what’s partially built; no new product surface area.

### 2.1 Gas log detail & charts
- [ ] Expose **notes** and **fuel type** in gas log edit form (stored today, not editable)
- [ ] Add **delete fill-up** in UI (`deleteGasLog` exists server-side)
- [ ] Add **MPG trend** chart (MPG is computed/stored; chart was replaced by miles-per-tank on dashboard — decide if gas page should show both)
- [ ] Empty state when no chart data (CTA to log first fill-up)

**Files:** `components/gas/gas-log-client.tsx`, `components/gas/gas-charts.tsx`

**Notes / modifications:**
- I do want to make the graphs more mobile friendly, right now they can be wider than the mobile screen causing a horizontal scroll that is unnecessary

---

### 2.2 Maintenance list filters
- [ ] Date range UI for `completedFrom` / `completedTo` (server already supports)
- [ ] Search (per original `PLAN.md`)
- [ ] Confirm grid-only on mobile is acceptable

**Files:** `components/maintenance/maintenance-list-client.tsx`, `app/(app)/maintenance/page.tsx`

**Notes / modifications:**
- grid only on mobile is preferred. Table is preferred on desktop/tablet. This pattern should be default across the entire application

---

### 2.3 Gallery
- [ ] Delete images/files (may need new server actions)
- [ ] Camera capture on upload (maintenance detail already has `capture="environment"`)
- [ ] Migrate upload + edit forms to TanStack Form + Zod (match rest of app)
- [ ] Edit metadata for non-image files (images have edit dialog; files may not)

**Files:** `components/gallery/gallery-client.tsx`, `server/actions/files.ts`

**Notes / modifications:**
- 

---

### 2.4 Use stored fields already in schema
- [ ] Wishlist: show **url** as link in dashboard table; consider **imageUrl** (field exists, never written)
- [ ] Maintenance parts: surface **description**, **url** in add-part form (`maintenancePartFormSchema` exists)
- [ ] Gallery: optionally show **file size** / **image size**

**Files:** various — see schema in `server/db/schema.ts`

**Notes / modifications:**
- 

---

## Phase 3 — Registration & car profile

### 3.1 Optional VIN on sign-up
- [ ] Add optional VIN field after make / year / model
- [ ] Decode via NHTSA `DecodeVinValues` and prefill:
  - [ ] `fuel` ← `FuelTypePrimary`
  - [ ] `transmission` ← `TransmissionStyle`
  - [ ] Optional new fields: trim, body class, drive type, engine displacement
- [ ] **Do not** expect tank size from NHTSA (not in API)

**Files:** `components/auth/sign-up-form.tsx`, new `lib/data/nhtsa-decode.ts`, `server/actions/auth.ts`, possibly schema migration

**Notes / modifications:**
- I do not want to handle VINs in this application as useful as that would be. I'd rather the user manually enter the information that we would get from the VIN
- I do think that maybe we should make the sign up multiple step. First enter the sign in information then enter the car information
- I do like the suggested new fields

---

### 3.2 Settings expansions
- [ ] Allow editing **brand / model / year** in settings (read-only today)
- [ ] **Change password** flow

**Files:** `components/settings/car-settings-form.tsx`, `lib/validations/car.ts`, `server/actions/car.ts` or `auth.ts`

**Notes / modifications:**
- Nope, don't want any of this.

---

## Phase 4 — Security & data integrity

### 4.1 Resource ownership on mutations
Ensure every update/delete verifies `carId` matches session (pattern used in `getMaintenanceLog`).

- [ ] `updateGasLog`, `deleteGasLog` — `server/actions/gas-log.ts`
- [ ] `updateMaintenanceLog`, parts/files mutations — `server/actions/maintenance.ts`, `server/actions/files.ts`
- [ ] `setPrimaryImage`, `updateCarImageMeta` — `server/actions/files.ts`

**Notes / modifications:**
- This is really important and is a big priority

---

### 4.2 Validation & auth polish
- [ ] Zod-validate `updateMaintenanceLog` (currently loose `Record<string, unknown>`)
- [ ] Re-enable redirect: signed-in users away from `/signin` / `/signup` (`proxy.ts` — currently commented out)
- [ ] Dedicated unauthorized handling vs generic `throw new Error("Unauthorized")`

**Notes / modifications:**
- 

---

## Phase 5 — UX polish

### 5.1 Mobile & layout
- [ ] Bottom padding on `<main>` so fixed fill-up FAB doesn’t cover last content
- [ ] Review maintenance parts table on narrow screens (card fallback?)

**Files:** `app/(app)/layout.tsx`, maintenance detail components

**Notes / modifications:**
- 

---

### 5.2 Empty & loading states
- [ ] Empty states with CTAs (reminders, maintenance, wishlist, charts)
- [ ] Route-level `loading.tsx` / `error.tsx` for app routes

**Notes / modifications:**
- 

---

## Phase 6 — Bigger product ideas (optional / later)

Not required for “complete vs PLAN.md”; pick if they match your vision.

### 6.1 Cost & insights
- [ ] Monthly roll-up: gas spend + maintenance cost on dashboard
- [ ] Use **purchase price** (`cars.price`) in cost-of-ownership view

**Notes / modifications:**
- Love these ideas

---

### 6.2 Smarter maintenance
- [ ] Suggested intervals from odometer + last service (e.g. oil change)
- [ ] Tie reminders more tightly to `cars.odometer` vs `maintenanceLog.odometer`

**Notes / modifications:**
- I love the suggested intervals and I thought about adding it but I want to be more "automatic" with user ability to edit the configuration.
- I'd love to add the concept of inspection reminders. This would be more of a "Hey it's been a couple of months since you last checked your air filter" so similar structure to the maintenanceLog structure but focused on "inspecting" the system to see if it needs maintenance. Whereas maintenance is focused on "doing" the work

---

### 6.3 Export & portability
- [ ] CSV export: gas logs, maintenance history

**Notes / modifications:**
- I'm open to CSV export, but I'd also love a PDF printout of everything. Both of these would need to date filtered so people aren't need to grab ALL of their data all at once over and over

---

### 6.4 Multi-car / accounts
- [ ] Today: one car per login. Multi-garage would need schema + auth redesign.

**Notes / modifications:**
- I don't care about multi-car support because what I kind of like about this is that it doesn't imply a specific person owning it. The data is tied to the car not the person. But I'll continue thinking about this

---

## Phase 7 — Engineering hygiene

### 7.1 CI
- [ ] GitHub Action: `npm run typecheck`, `lint`, `build` on PR

**Notes / modifications:**
- Agree with this

---

### 7.2 Tests (minimal high-value)
- [ ] Server actions: auth required, ownership checks, validation failures
- [ ] Optional: one smoke test per critical flow (sign-up, create gas log)

**Notes / modifications:**
- Tests are nice but last priority in this list

---

### 7.3 Documentation
- [ ] Replace template `README.md` with: env vars, local Postgres, storage adapter, dev commands

**Notes / modifications:**
- Agree

---

## Explicitly out of scope (unless you add below)

Items from the audit you may **not** want — mark `[x]` under **Keep dropped** or move to a phase if you change your mind.

- [ ] **Keep dropped:** MPG chart on dashboard (if miles-per-tank is enough)
- [ ] **Keep dropped:** VIN auto-fill on sign-up
- [ ] **Keep dropped:** Editable brand/model/year in settings
- [ ] **Keep dropped:** Password change
- [ ] **Keep dropped:** Gallery delete
- [ ] **Keep dropped:** Dashboard file upload quick action
- [ ] **Keep dropped:** Maintenance search
- [ ] **Keep dropped:** CI/tests in Phase 7

**Other items to drop or defer:**
- No the MPG chart should be on the dashboard. I just forgot about it

---

## Implementation order (suggested)

After your edits, a reasonable default sequence:

1. Phase 1 (wishlist + dashboard wiring)
2. Phase 2.1–2.2 (gas + maintenance completeness)
3. Phase 4 (security)
4. Phase 2.3–2.4 + Phase 5 (gallery + polish)
5. Phase 3 + 6 (profile + bigger ideas, as chosen)
6. Phase 7 (CI/docs)

**Your preferred order after modifications:**
- I agree with this ordering

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-05-30 | Agent audit → plan draft | Initial `IMPROVEMENTS-PLAN.md` |
