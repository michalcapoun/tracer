-- Trips table
create table public.trips (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  description        text,
  date               date,
  total_distance_km  float,
  total_duration_min int,
  mapy_link          text,
  created_at         timestamptz default now()
);

-- Waypoints table
create table public.waypoints (
  id                   uuid primary key default gen_random_uuid(),
  trip_id              uuid references public.trips(id) on delete cascade,
  name                 text not null,
  lat                  float8 not null,
  lng                  float8 not null,
  "order"              int not null,
  distance_to_next_km  float,
  notes                text,
  mapy_place_id        text
);

-- Indexes
create index on public.waypoints(trip_id);
create index on public.trips(date);
create index on public.trips(name);

-- Full-text search on trip name
create index on public.trips using gin(to_tsvector('simple', name));

-- Enable RLS
alter table public.trips enable row level security;
alter table public.waypoints enable row level security;

-- Allow all (single user app, no auth needed)
create policy "allow all trips"     on public.trips     for all using (true);
create policy "allow all waypoints" on public.waypoints for all using (true);
