-- ============================================================
-- AutoCare Extension Migration
-- Based on confirmed live schema (no enums exist in this DB)
-- ============================================================

-- ------------------------------------------------------------
-- 1. mechanic_profiles
-- ------------------------------------------------------------
create table mechanic_profiles (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references profiles(id) on delete cascade,
  workshop_name      text,
  address            text,
  city               text,
  lat                numeric(10, 7),
  lng                numeric(10, 7),
  cnic_number        text,
  phone              text,
  cnic_front_url     text,
  cnic_back_url      text,
  selfie_url         text,
  workshop_photo_url text,
  status             text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason   text,
  verified_at        timestamptz,
  created_at         timestamptz not null default now()
);

alter table mechanic_profiles enable row level security;

create policy "Mechanic can read own profile"
  on mechanic_profiles for select
  using (auth.uid() = user_id);

create policy "Mechanic can insert own profile"
  on mechanic_profiles for insert
  with check (auth.uid() = user_id);

create policy "Mechanic can update own profile"
  on mechanic_profiles for update
  using (auth.uid() = user_id);

create policy "Admins can read all mechanic profiles"
  on mechanic_profiles for select
  using (exists (
    select 1 from profiles where id = auth.uid() and is_admin = true
  ));

create policy "Admins can update all mechanic profiles"
  on mechanic_profiles for update
  using (exists (
    select 1 from profiles where id = auth.uid() and is_admin = true
  ));


-- ------------------------------------------------------------
-- 2. vehicles
-- ------------------------------------------------------------
create table vehicles (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references profiles(id) on delete cascade,
  make                text not null,
  model               text not null,
  variant             text,
  year                int  not null,
  color               text,
  registration_number text,
  engine_number       text,
  current_odometer    int,
  qr_code_uuid        uuid not null unique default gen_random_uuid(),
  qr_code_url         text,
  is_stolen           boolean not null default false,
  stolen_reported_at  timestamptz,
  created_at          timestamptz not null default now()
);

alter table vehicles enable row level security;

create policy "Owner can read own vehicles"
  on vehicles for select
  using (auth.uid() = owner_id);

create policy "Owner can insert own vehicles"
  on vehicles for insert
  with check (auth.uid() = owner_id);

create policy "Owner can update own vehicles"
  on vehicles for update
  using (auth.uid() = owner_id);

create policy "Owner can delete own vehicles"
  on vehicles for delete
  using (auth.uid() = owner_id);

create policy "Mechanics can read any vehicle"
  on vehicles for select
  using (exists (
    select 1 from profiles where id = auth.uid() and primary_role = 'mechanic'
  ));

create policy "Public can read vehicles"
  on vehicles for select
  using (true);


-- ------------------------------------------------------------
-- 3. service_logs  (immutable — no UPDATE or DELETE policies)
-- ------------------------------------------------------------
create table service_logs (
  id                  uuid primary key default gen_random_uuid(),
  vehicle_id          uuid not null references vehicles(id) on delete cascade,
  mechanic_id         uuid not null references mechanic_profiles(id) on delete restrict,
  service_types       text[] not null default '{}',
  odometer_at_service int,
  notes               text,
  cost_pkr            bigint,
  logged_at           timestamptz not null default now()
);

alter table service_logs enable row level security;

create policy "Approved mechanic can insert service logs"
  on service_logs for insert
  with check (
    exists (
      select 1 from mechanic_profiles
      where id = mechanic_id
        and user_id = auth.uid()
        and status = 'approved'
    )
  );

create policy "Anyone can read service logs"
  on service_logs for select
  using (true);


-- ------------------------------------------------------------
-- 4. health_scores
-- ------------------------------------------------------------
create table health_scores (
  id             uuid primary key default gen_random_uuid(),
  vehicle_id     uuid not null unique references vehicles(id) on delete cascade,
  score          int  not null check (score between 0 and 100),
  breakdown      jsonb,
  calculated_at  timestamptz not null default now()
);

alter table health_scores enable row level security;

create policy "Anyone can read health scores"
  on health_scores for select
  using (true);

create policy "Admins can insert health scores"
  on health_scores for insert
  with check (exists (
    select 1 from profiles where id = auth.uid() and is_admin = true
  ));

create policy "Admins can update health scores"
  on health_scores for update
  using (exists (
    select 1 from profiles where id = auth.uid() and is_admin = true
  ));


-- ------------------------------------------------------------
-- 5. Extend listings table
-- ------------------------------------------------------------
alter table listings
  add column vehicle_id            uuid references vehicles(id) on delete set null,
  add column health_score_snapshot int;
