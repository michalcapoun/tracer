-- Trips table
create table public.trips (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_at  timestamptz default now()
);

-- Waypoints table
create table public.waypoints (
  id        uuid primary key default gen_random_uuid(),
  trip_id   uuid references public.trips(id) on delete cascade,
  name      text not null,
  lat       float8 not null,
  lng       float8 not null,
  "order"   int not null,
  visited   boolean default false,
  visited_at timestamptz
);

-- Enable RLS
alter table public.trips enable row level security;
alter table public.waypoints enable row level security;

-- Allow all for now (tighten after adding auth)
create policy "allow all trips" on public.trips for all using (true);
create policy "allow all waypoints" on public.waypoints for all using (true);
