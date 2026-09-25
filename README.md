# Tracer

Osobní archiv výletů. Ukládá trasy naplánované na [Mapy.com](https://mapy.com)
— název, datum, vzdálenost a odkaz zpět do Map.

**Živá verze:** https://tracer-six.vercel.app

## Co umí

- **Plánované** — výlety bez data nebo s datem v budoucnu, nejbližší nahoře
- **Historie** — proběhlé výlety seskupené podle roku
- **Smazané** — koš: výlet jde 30 dní obnovit nebo trvale smazat, pak
  z koše zmizí; aplikace sama koš z databáze neuklízí
- Odkaz do Mapy.com pro přeplánování trasy
- Kopírování výletu
- Hledání podle názvu

## Přihlášení

- Email a heslo přes Supabase Auth, registrace v aplikaci není
- Demo účet na přihlašovací stránce, s omezeným počtem výletů; jeho data
  se každou noc mažou (pg_cron v Supabase dashboardu)

## Technologie

- [Vue 3](https://vuejs.org) + TypeScript
- [Supabase](https://supabase.com) — databáze PostgreSQL a přihlašování
- [Vite](https://vite.dev) — build
- [Vercel](https://vercel.com) — hosting

Schéma databáze a pg_cron joby se spravují v Supabase dashboardu, v repu nejsou.

## Lokální vývoj

```bash
cd frontend
npm install
npm run dev
```

Vytvoř `frontend/.env` (vzor je v `.env.example`):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_DEMO_EMAIL=...
VITE_DEMO_PASSWORD=...
```

Demo proměnné potřebuje jen tlačítko demo účtu. `npm run build` pustí
kontrolu typů a produkční build.
