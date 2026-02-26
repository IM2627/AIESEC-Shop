# AIESEC Shop – Single Source Brief

This document replaces all previous Markdown files and captures the full business and technical context for the project so it can be reused for prompting, planning, and implementation.

## Purpose & Audience
- Serve AIESEC Local Committees with a zero-payment reservation shop for merch.
- Public members browse and reserve items without accounts; admins manage inventory and reservations.
- Operates entirely on free-tier tooling (Vercel/Netlify + Supabase) for low operational cost.

## Core Capabilities
- **Public shop**: Browse active items, see stock, open a reservation modal, submit reservations, receive confirmation feedback.
- **Reservations**: Create reservations even when not authenticated; statuses include `pending`, `collected`, `cancelled`.
- **Admin portal**: Email/password login, verify admin role, manage items (CRUD, stock, active flag), manage reservations (view, filter, update status), and see real-time updates.
- **Real-time updates**: Supabase subscriptions push item/reservation changes to both interfaces.

## Architecture
- **Multi-page React (Vite)**: `index.html` for the public shop and `admin.html` for the admin portal so neither side loads the other's code.
- **Entry points**: `src/main.jsx` (public) and `src/admin-main.jsx` (admin) bootstrap their respective apps.
- **Component split**: Public UI (PublicShop + ReservationForm), Admin UI (AdminLogin, AdminPanel, ItemManager, ReservationManager), shared `supabase.js` client and `useAuth` hook.
- **Build**: Vite multi-page config with manual chunks; React.lazy for heavy admin components; vendor chunking for React and Supabase; optimized caching.

## Data Model (Supabase/PostgreSQL)
- **items**: `id`, `name`, `description`, `price`, `stock`, `image_url`, `active`, timestamps.
- **reservations**: `id`, `item_id`, `full_name`, `email`, `team`, `quantity`, `status (pending|collected|cancelled)`, `notes`, timestamps.
- **admin_users**: `id` (matches `auth.users`), `email`, timestamps.

## Security Model
- Supabase Auth (email/password); JWT handled by `@supabase/supabase-js`.
- Row-Level Security (RLS):
	- Public can `select` active items.
	- Public can `insert` reservations; select only their reservations (email match).
	- Admin-only `insert/update/delete` on items and reservations; admin detection via presence in `admin_users` table.
- Separate admin entry (`admin.html`) keeps admin code and auth flows out of the public bundle.

## Performance Characteristics
- Multi-page split removes admin code from the public payload (≈60% smaller initial load).
- React.lazy + Suspense for admin panels; vendor chunking and caching; esbuild/terser minification in production.
- Real-time listeners kept minimal; only items and reservations channels are subscribed.

## Environment & Configuration
- Required env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in `.env.local`.
- Ports: Vite defaults to `3000` (auto-shifts if busy); public at `/`, admin at `/admin.html`.

## Setup (local)
```bash
npm install
cp .env.local.example .env.local   # add Supabase URL and anon key
npm run dev         # both interfaces
# or
npm run dev:shop    # public only
npm run dev:admin   # admin only
```

## Deploy
- **Frontend**: Vercel or Netlify; deploy `dist/` with both `index.html` and `admin.html` preserved.
- **Backend**: Supabase (DB + Auth + Storage). Apply schema, RLS policies, and insert admin record matching the Supabase user ID.
- Env vars on hosting: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Testing & Monitoring
- Smoke test: load public shop, create reservation, confirm it appears in Admin > Reservations, update status, verify reflected in public view.
- Check console/network for Supabase errors; validate RLS by attempting item mutation as non-admin (should fail).

## Prompting Hints
- When asking for changes, specify target interface (public vs admin) and entry file (`index.html` or `admin.html`).
- For data-layer changes, mention RLS implications and whether admin-only or public access is expected.
- For performance requests, state if they affect initial load (public) or admin-only flows.

**Built for AIESEC LC University – El Manar**
