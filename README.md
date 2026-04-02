# Tracer

Personal trip archive. Save, organize and archive routes planned in [Mapy.com](https://mapy.com).

**Live:** https://tracer-six.vercel.app

## Features

- **Planned trips** — trips without a date or with a future date
- **History** — past trips grouped by year
- **Trash** — soft delete with automatic removal after 30 days
- Store Mapy.com share links for quick re-planning
- Duplicate trips
- Search

## Stack

- [Vue 3](https://vuejs.org) + TypeScript — UI framework
- [Pinia](https://pinia.vuejs.org) — shared state management (trips, trash)
- [Supabase](https://supabase.com) — PostgreSQL database + row-level auth
- [Vite](https://vitejs.dev) — build tool
- [Vercel](https://vercel.com) — hosting

## Local development

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_DEMO_EMAIL=...
VITE_DEMO_PASSWORD=...
```

## Auth

- Email and password login
- Demo account for showcasing — available on the login page
