create type report_reason as enum ('fake', 'scam', 'wrong_details', 'other');
create type report_status as enum ('open', 'resolved');

create table reports (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references listings(id) on delete cascade,
  reporter_id uuid not null references profiles(id) on delete cascade,
  reason      report_reason not null,
  description text,
  status      report_status not null default 'open',
  created_at  timestamptz not null default now()
);

alter table reports enable row level security;

create policy "Reporters can file reports"
  on reports for insert with check (auth.uid() = reporter_id);

create policy "Reporters can read own reports"
  on reports for select using (auth.uid() = reporter_id);

create policy "Admins can read all reports"
  on reports for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can resolve reports"
  on reports for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
