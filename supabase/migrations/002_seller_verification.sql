create type seller_type        as enum ('individual', 'dealer');
create type verification_status as enum ('pending', 'approved', 'rejected');

create table seller_verifications (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references profiles(id) on delete cascade,
  seller_type        seller_type not null,
  full_name          text,
  cnic               text,
  phone              text,
  cnic_front_url     text,
  cnic_back_url      text,
  selfie_url         text,
  business_name      text,
  business_reg_no    text,
  business_address   text,
  business_logo_url  text,
  payment_status     text,
  status             verification_status not null default 'pending',
  rejection_reason   text,
  submitted_at       timestamptz not null default now(),
  reviewed_at        timestamptz
);

alter table seller_verifications enable row level security;

-- Sellers can submit and view their own application
create policy "Sellers can insert own verification"
  on seller_verifications for insert with check (auth.uid() = user_id);

create policy "Sellers can read own verification"
  on seller_verifications for select using (auth.uid() = user_id);

-- Admins can read and update all applications
create policy "Admins can read all verifications"
  on seller_verifications for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update all verifications"
  on seller_verifications for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
