create table stolen_alerts (
  id            uuid primary key default gen_random_uuid(),
  vehicle_id    uuid not null references vehicles(id) on delete cascade,
  mechanic_id   uuid not null references mechanic_profiles(id) on delete cascade,
  lat           numeric(10, 7),
  lng           numeric(10, 7),
  workshop_name text,
  created_at    timestamptz not null default now()
);

alter table stolen_alerts enable row level security;

create policy "Mechanic can insert stolen alert"
  on stolen_alerts for insert
  with check (
    exists (select 1 from mechanic_profiles where id = mechanic_id and user_id = auth.uid())
  );

create policy "Owner can read alerts for their vehicles"
  on stolen_alerts for select
  using (
    exists (select 1 from vehicles where id = vehicle_id and owner_id = auth.uid())
  );

create policy "Admins can read all stolen alerts"
  on stolen_alerts for select
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
