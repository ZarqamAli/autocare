create type offer_status as enum ('pending', 'accepted', 'rejected', 'countered');

create table conversations (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  buyer_id   uuid not null references profiles(id) on delete cascade,
  seller_id  uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references profiles(id) on delete cascade,
  body            text not null,
  created_at      timestamptz not null default now()
);

create table offers (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  buyer_id        uuid not null references profiles(id) on delete cascade,
  seller_id       uuid not null references profiles(id) on delete cascade,
  amount          bigint not null,
  note            text,
  status          offer_status not null default 'pending',
  counter_amount  bigint,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table conversations enable row level security;
alter table messages      enable row level security;
alter table offers        enable row level security;

-- Conversations
create policy "Participants can read conversations"
  on conversations for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Buyers can start conversations"
  on conversations for insert with check (auth.uid() = buyer_id);

-- Messages
create policy "Participants can read messages"
  on messages for select
  using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

create policy "Participants can send messages"
  on messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- Offers
create policy "Participants can read offers"
  on offers for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Buyers can create offers"
  on offers for insert with check (auth.uid() = buyer_id);

create policy "Participants can update offers"
  on offers for update using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- Enable Supabase Realtime on messages and offers
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table offers;
