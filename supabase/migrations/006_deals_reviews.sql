create table deals (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references conversations(id) on delete cascade,
  listing_id       uuid not null references listings(id),
  buyer_id         uuid not null references profiles(id),
  seller_id        uuid not null references profiles(id),
  final_price      bigint not null,
  buyer_confirmed  boolean not null default false,
  seller_confirmed boolean not null default false,
  created_at       timestamptz not null default now()
);

create table reviews (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references deals(id) on delete cascade,
  reviewer_id uuid not null references profiles(id),
  reviewee_id uuid not null references profiles(id),
  rating      int  not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now()
);

alter table deals   enable row level security;
alter table reviews enable row level security;

create policy "Participants can read deals"
  on deals for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Participants can create deals"
  on deals for insert
  with check (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Participants can update deals"
  on deals for update using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Anyone can read reviews"
  on reviews for select using (true);

create policy "Reviewer can insert review"
  on reviews for insert with check (auth.uid() = reviewer_id);
