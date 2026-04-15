# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This repository contains a single Next.js application under `erp-safety/`. The root `index.html` is a static placeholder. All active development happens inside `erp-safety/`.

## erp-safety — ERP Safety Compliance Platform

A French-language safety compliance platform for **Établissements Recevant du Public (ERP)** — buildings open to the public. It tracks mandatory periodic safety inspections, commission prescriptions, and special reports across five user roles.

**Stack:** Next.js 16.2.3 · React 19 · TypeScript 5 · Prisma 7 · PostgreSQL · Tailwind CSS v4 · Radix UI · React Hook Form + Zod · `date-fns` (fr locale) · `lucide-react`

> **Important:** The `erp-safety/AGENTS.md` warns that Next.js 16.2.3 contains breaking changes from earlier versions. Before writing any Next.js-specific code, consult `node_modules/next/dist/docs/` to verify current API conventions.

---

## Commands

All commands must be run from `erp-safety/`:

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint (v9 flat config via eslint.config.mjs)
npm run seed         # Seed the database with demo data (tsx prisma/seed.ts)

npx prisma migrate dev      # Create and apply a migration
npx prisma db push          # Push schema changes without migration (dev only)
npx prisma generate         # Regenerate Prisma client to src/generated/prisma/
npx prisma studio           # Open Prisma Studio UI
```

There are no automated tests configured.

---

## Architecture

### Auth

Authentication is **custom session-based** — **not** NextAuth, despite `next-auth` appearing in `package.json`. The active auth lives in:

- `src/lib/auth.ts` — session CRUD (`createSession`, `getSession`, `deleteSession`), cookie management (`erp_session` httpOnly cookie, 7-day TTL), bcrypt password verification
- `src/app/actions/auth.ts` — Server Actions `loginAction` / `logoutAction`

Every protected route calls `getSession()` at the top of the component. **There is no middleware** — auth guards are per-page.

### Database

Prisma client is generated to a **non-standard path**: `src/generated/prisma/`. Import it as:

```ts
import { PrismaClient } from '@/generated/prisma/client'
```

The singleton `prisma` instance is exported from `src/lib/db.ts`, which uses `PrismaPg` (driver adapter) with `DIRECT_DATABASE_URL` falling back to `DATABASE_URL`.

### Role-Based Access

Five roles with separate dashboard subtrees:

| Role | Route prefix | Description |
|---|---|---|
| `EXPLOITANT` | `/dashboard/exploitant` | ERP operator — views their buildings and inspection state |
| `TECHNICIEN` | `/dashboard/technicien` | Qualified inspector — creates inspections, lifts prescriptions |
| `ASSUREUR` | `/dashboard/assureur` | Insurer — read-only view of insured ERPs |
| `INSTITUTION` | `/dashboard/institution` | Authority (SDIS, Prefecture, etc.) — read-only sector overview |
| `ADMIN` | `/dashboard/admin` | Platform admin — users, all ERPs, themes |

`/dashboard/page.tsx` immediately redirects to the role-specific route. The `DashboardLayout` (`src/app/dashboard/layout.tsx`) validates the session and renders `<Sidebar>`, which displays role-appropriate nav items.

### Data Model (key entities)

- **ERP** — A building with type (`ERPType` enum: O, M, N, U, etc.) and category (`CAT1`–`CAT5`)
- **InspectionTheme** — A regulatory inspection domain (e.g. `EL` = electrical, `AS` = fire alarm) with a periodicity (`ANNUAL`, `BIANNUAL`, `THREE_YEARS`, `FIVE_YEARS`)
- **Inspection** — One inspection record linking ERP × theme × technicien; status: `CONFORME`, `NON_CONFORME`, `RESERVE`, `EN_COURS`, `A_PLANIFIER`, `EN_RETARD`
- **CommissionPrescription** — A requirement issued by a safety commission (`CommissionVisit`); status: `OUVERTE`, `EN_COURS`, `LEVEE`, `REJETEE`
- **PrescriptionLifting** — A technicien's attestation that a prescription has been remediated
- **SpecialReport** — Reports like RVRAT, RVRE, ATEX, AMIANTE attached to an ERP

Access control is enforced at the data level: institutions only see ERPs in `ERPInstitutionAccess`; assureurs only see ERPs in `InsuranceContract`.

### Server Actions

All mutations use **Next.js Server Actions** (files start with `'use server'`). They are located in `src/app/actions/`. Each action calls `getSession()` first and checks the required role before performing any DB operation.

### Shared Utilities (`src/lib/utils.ts`)

Provides `formatDate` / `formatDateTime` (French locale), status label/color helpers (`getInspectionStatusColor`, `getPrescriptionStatusColor`), date utilities (`isOverdue`, `isDueSoon`, `getDaysUntil`), and ERP type/category label lookups. Also exports `cn()` — a lightweight className joiner (no `clsx`/`tailwind-merge` dependency).

### Components (`src/components/`)

- `Sidebar` — client component, role-aware nav, calls `logoutAction` via a form
- `StatusBadge` — `InspectionBadge`, `PrescriptionBadge`, `PriorityBadge` — thin wrappers around the utility label/color functions

### Path Alias

`@/` resolves to `src/`. Prisma client is at `@/generated/prisma/client`.

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Prisma datasource URL |
| `DIRECT_DATABASE_URL` | Optional override (used first when present) |

## Demo Seed Accounts

After running `npm run seed`, these accounts are available (password: `Demo1234!`):

```
admin@erp-safety.fr           ADMIN
exploitant@demo.fr            EXPLOITANT
technicien@bureau-veritas.fr  TECHNICIEN
assureur@axa.fr               ASSUREUR
sdis@sdis75.fr                INSTITUTION
```
