# Perfume Shift Sales Tracker

A mobile-first offline PWA for tracking perfume sales across shifts. Built with React + Vite + Dexie.js.

## Features

- **Offline-first** — All data stored locally in IndexedDB, no server required
- **Shift management** — Create shifts with templates, record sales with +/- controls
- **Product admin** — Full CRUD with drag-and-drop ordering (brands, sub-categories, products)
- **CSV export** — Export shift reports matching Excel format
- **PWA ready** — Installable on mobile, works like a native app

## Tech Stack

| Layer       | Technology             |
| ----------- | ---------------------- |
| Framework   | React 19 + TypeScript  |
| Build       | Vite 8                 |
| Database    | Dexie.js 4 (IndexedDB) |
| Styling     | Tailwind CSS 4         |
| Routing     | React Router 7         |
| Drag & Drop | @dnd-kit               |
| Dates       | date-fns               |

## Project Structure

src/
├── components/
│ ├── AutocompleteInput.tsx # Typeahead input with suggestions
│ └── Layout.tsx # App shell with bottom nav
├── db/
│ ├── database.ts # Dexie schema & initialization
│ └── operations.ts # CRUD operations & business logic
├── pages/
│ ├── ShiftList.tsx # Tab 1: Shift list & creation
│ ├── ShiftEdit.tsx # Sales recording interface
│ ├── Export.tsx # Tab 2: CSV export
│ └── Admin.tsx # Tab 3: Product & template management
├── types/
│ └── index.ts # TypeScript type definitions
├── utils/
│ └── csv.ts # CSV generation & download
├── App.tsx # Router setup
├── main.tsx # Entry point
└── index.css # Global styles & theme

## Database Schema

### products

| Field       | Type        | Index |
| ----------- | ----------- | ----- |
| id          | string (PK) | ✓     |
| brandMain   | string      | ✓     |
| subCategory | string      | ✓     |
| fullName    | string      | —     |
| price       | number      | —     |
| sortOrder   | number      | ✓     |

### shiftTemplates

| Field        | Type        | Index |
| ------------ | ----------- | ----- |
| templateId   | string (PK) | ✓     |
| templateName | string      | —     |
| brandList    | string[]    | —     |
| sortOrder    | number      | ✓     |

### shiftRecords

| Field            | Type        | Index |
| ---------------- | ----------- | ----- |
| shiftId          | string (PK) | ✓     |
| templateId       | string      | ✓     |
| recordDate       | string      | ✓     |
| shiftDisplayName | string      | —     |
| shiftTimeStart   | string      | —     |
| shiftTimeEnd     | string      | —     |

### shiftSales

| Field     | Type        | Index |
| --------- | ----------- | ----- |
| id        | string (PK) | ✓     |
| shiftId   | string      | ✓     |
| productId | string      | ✓     |
| sellCount | number      | —     |

### orderingConfig

| Field             | Type                     |
| ----------------- | ------------------------ |
| id                | string (PK)              |
| brandOrder        | string[]                 |
| subCategoryOrders | Record<string, string[]> |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

```

## Usage Flow

Admin → Add products (brand, sub-category, name, price)

Admin → Create shift templates (select brands via checkboxes)

Shifts → Create a new shift (pick template, date, time)

Shift Edit → Tap +/- to record sales, see live summaries

Export → Download CSV matching your Excel report format
