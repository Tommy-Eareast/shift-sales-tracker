## `PROGRESS.md`

# Progress Log — Perfume Shift Sales Tracker

## Session: 2026-07-28/29

### ✅ Completed

#### Phase 1: Project Setup

- [x] Vite + React + TypeScript project initialized
- [x] Tailwind CSS 4 configured (with @tailwindcss/postcss)
- [x] Dexie.js 4 database with 5 tables
- [x] React Router 7 with 3-tab layout
- [x] @dnd-kit installed for drag-and-drop

#### Phase 2: Database Layer

- [x] Schema: products, shiftTemplates, shiftRecords, shiftSales, orderingConfig
- [x] Version 4 with compound index [shiftId+productId]
- [x] Default templates (Interparfum, Bvlgari Single, Montblanc Single)
- [x] 10 sample products across 5 brands
- [x] OrderingConfig for persistent brand/sub-category ordering

#### Phase 3: Core Pages

- [x] **ShiftList** — Create/edit/delete shifts, summary previews on cards
- [x] **ShiftEdit** — +/- sales controls, grouped by brand→sub-category→product, live summary bar
- [x] **Export** — CSV download with formatted filename (DD-MM-YYYY_Day_Time_Template.csv)
- [x] **Admin** — Full CRUD for products & templates with validation

#### Phase 4: Drag & Drop Ordering

- [x] Three-level DnD: brands, sub-categories, products (each in own context)
- [x] Products reorder within sub-category only
- [x] Sub-categories reorder within brand
- [x] Brands reorder globally
- [x] Templates reorder via drag
- [x] Order persists in IndexedDB via OrderingConfig

#### Phase 5: Quality & UX

- [x] Duplicate validation (product name + brand, template name)
- [x] Autocomplete for brand & sub-category with brand-filtered suggestions
- [x] Shift metadata editing (date, start/end time)
- [x] Template deletion blocked if shifts exist
- [x] Clean Minimalist theme applied (sage green accent, stone palette)
- [x] Mobile-optimized with sticky bottom nav
- [x] React 19 strict mode warnings resolved

#### Phase 6: Bug Fixes

- [x] Time input format (HH:mm with leading zero)
- [x] Template deletion schema error (templateId index)
- [x] Export filename format
- [x] ESLint warnings (no-unused-expressions, isolatedModules)
- [x] Bottom bar overlap with navigation
- [x] Date format changed to DD/MM/YYYY numeric

### 📋 Remaining / Future

#### Priority 1 — Must Have

- [ ] PWA manifest & service worker (vite-plugin-pwa)
- [ ] Data backup/restore (export full DB as JSON)
- [ ] Test on actual mobile device (touch interactions)

#### Priority 2 — Nice to Have

- [ ] Product search/filter in Admin
- [ ] Batch operations (reset shift, copy shift)
- [ ] Shift notes/comments field
- [ ] Dark mode toggle
- [ ] Keyboard shortcuts for +/- (desktop)

#### Priority 3 — Polish

- [ ] Loading skeletons
- [ ] Empty state illustrations
- [ ] Haptic feedback on mobile
- [ ] Animated number transitions
- [ ] Undo toast for deletions

### Known Issues

- None currently

### Database Version

Current: **v4** — Delete IndexedDB if schema changes needed
