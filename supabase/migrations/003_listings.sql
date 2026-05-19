create type transmission_type    as enum ('Auto', 'Manual');
create type condition_type       as enum ('New', 'Used');
create type assembly_type        as enum ('Local', 'Imported');
create type fuel_type            as enum ('Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG');
create type body_type            as enum ('Sedan', 'Hatchback', 'SUV', 'Pickup', 'Van', 'Coupe');
create type accident_history_type as enum ('None', 'Minor', 'Major');
create type ownership_count_type  as enum ('1st', '2nd', '3rd', '4th+');
create type listing_status        as enum ('active', 'paused', 'sold');

create table listings (
  id              uuid primary key default gen_random_uuid(),
  seller_id       uuid not null references profiles(id) on delete cascade,
  make            text not null,
  model           text not null,
  variant         text,
  year            int  not null,
  mileage         int,
  price           bigint not null,
  city            text,
  transmission    transmission_type,
  condition       condition_type,
  assembly        assembly_type,
  fuel_type       fuel_type,
  body_type       body_type,
  color           text,
  accident_history  accident_history_type default 'None',
  ownership_count   ownership_count_type,
  description     text,
  status          listing_status not null default 'active',
  views_count     int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table listings enable row level security;

create policy "Anyone can read active listings"
  on listings for select using (status = 'active');

create policy "Sellers can read own listings"
  on listings for select using (auth.uid() = seller_id);

create policy "Sellers can insert own listings"
  on listings for insert with check (auth.uid() = seller_id);

create policy "Sellers can update own listings"
  on listings for update using (auth.uid() = seller_id);

create policy "Sellers can delete own listings"
  on listings for delete using (auth.uid() = seller_id);

-- Auto-update updated_at on every change
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_updated_at
  before update on listings
  for each row execute function update_updated_at();
