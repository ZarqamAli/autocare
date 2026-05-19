create table listing_photos (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  url        text not null,
  position   int  not null default 0,
  is_cover   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table listing_photos enable row level security;

-- Public read
create policy "Anyone can read listing photos"
  on listing_photos for select using (true);

-- Only the listing's owner can write photos
create policy "Seller-owner can insert photos"
  on listing_photos for insert
  with check (
    exists (
      select 1 from listings where id = listing_id and seller_id = auth.uid()
    )
  );

create policy "Seller-owner can update photos"
  on listing_photos for update
  using (
    exists (
      select 1 from listings where id = listing_id and seller_id = auth.uid()
    )
  );

create policy "Seller-owner can delete photos"
  on listing_photos for delete
  using (
    exists (
      select 1 from listings where id = listing_id and seller_id = auth.uid()
    )
  );
