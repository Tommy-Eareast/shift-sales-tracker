# Perfume Shift Sales Tracker

A mobile-first PWA for fragrance promoters to record sales and submit reports. Managers view aggregated data and export to brand-specific CSV formats.

## Features

- **Role-based access**: Promoter (record/submit shifts) vs Manager (view/export/admin)
- **Draft recording with persistence**: Draft shifts persist to Supabase, can be edited anytime
- **Shift submission**: Creates immutable snapshot in `submitted_shifts` for manager
- **Brand-specific CSV export**: Each brand has its own export profile
- **Drag-and-drop reordering**: Products, templates, team members
- **Team management**: Manager creates/removes promoter accounts via Edge Functions
- **Offline recording**: Sales can be recorded without WiFi (draft saved locally)

## Tech Stack

| Layer       | Technology                                    |
| ----------- | --------------------------------------------- |
| Frontend    | React 19 + TypeScript + Vite 8                |
| Styling     | Tailwind CSS 4                                |
| Backend     | Supabase (PostgreSQL + Auth + Edge Functions) |
| Routing     | React Router 7                                |
| Drag & Drop | @dnd-kit                                      |
| Testing     | Vitest + React Testing Library + MSW          |
| PWA         | vite-plugin-pwa                               |

## Architecture

src/
├── components/ # UI primitives + navigation
│ ├── ui/ # Button, Card, Modal, ConfirmModal, AlertModal
│ ├── navigation/ # Tab definitions
│ └── Layout.tsx # App shell
├── lib/ # External clients
│ └── supabaseClient.ts
├── features/
│ ├── auth/ # Login, profiles, member management
│ ├── products/ # Product CRUD + ordering
│ ├── templates/ # Template CRUD + export profile auto-assignment
│ ├── shifts/ # Shift CRUD, sales recording, submission
│ ├── manager/ # Manager views + export
│ ├── export/ # Export profiles (per-brand CSV formats)
│ └── admin/ # Admin sections (Products, Templates, Members)
├── pages/
│ ├── promoter/ # ShiftList, ShiftEdit, PromoterExport
│ └── manager/ # Sales, ManagerExport, Dashboard, Admin
├── types/ # TypeScript types
├── utils/ # date, week, validation
└── test/ # Unit + component tests

## Export Profiles

### How to Add a New Brand Format

1. **Create profile file**: `src/features/export/profiles/[brand]Profile.ts`
2. **Register in** `src/features/export/profiles/index.ts`
3. **Add mapping in** `src/features/export/profiles/templateMapping.ts`
4. **Run SQL** to set `export_category` on products
5. **Done** — Manager creates template with that name, system auto-assigns profile

### Available Profiles

| Profile        | Format                                                         | Status |
| -------------- | -------------------------------------------------------------- | ------ |
| `bvlgari`      | Daily rows with WOMEN/MEN/LE GEMME/OTHER categories            | ✅     |
| `dolceGabbana` | Per-product rows with daily UNITS/SALES, grouped by WOMEN/MEN  | ✅     |
| `dior`         | Daily rows with 7 categories + productivity                    | ✅     |
| `amouage`      | Simple daily summary + comments                                | ✅     |
| `default`      | Basic summary (template, date, time, promoter, units, revenue) | ✅     |

## Database Schema

| Table              | Purpose                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `profiles`         | User profiles (role, display_name, sort_order)                     |
| `templates`        | Shift templates (name, brand_list, export_profile)                 |
| `products`         | Product catalog (brand_main, sub_category, price, export_category) |
| `shifts`           | Working shifts (draft + submitted)                                 |
| `shift_sales`      | Line items for shifts                                              |
| `submitted_shifts` | Immutable snapshots for manager viewing                            |
| `ordering_config`  | Brand/sub-category display ordering                                |

## Running Locally

```bash
npm install
npm run dev
```

## Testing

```bash
npm test          # Run all tests
npm run test:watch  # Watch mode
npm run test:coverage  # Coverage report
```

# Deployment

Frontend: Netlify
Backend: Supabase (Database + Auth + Edge Functions)

# ENV

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Edge Func

npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy create-member
npx supabase functions deploy remove-member
