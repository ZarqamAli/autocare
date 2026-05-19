-- ============================================================
-- Storage bucket: verifications  (private — CNIC / selfie docs)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'verifications',
  'verifications',
  false,
  10485760,   -- 10 MB per file
  array['image/jpeg','image/png','image/webp','application/pdf']
);

-- Sellers upload to their own folder:  verifications/{user_id}/{filename}
create policy "Sellers can upload own verification docs"
  on storage.objects for insert
  with check (
    bucket_id = 'verifications'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Sellers can view own verification docs"
  on storage.objects for select
  using (
    bucket_id = 'verifications'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Sellers can delete own verification docs"
  on storage.objects for delete
  using (
    bucket_id = 'verifications'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Admins can view all verification docs"
  on storage.objects for select
  using (
    bucket_id = 'verifications'
    and exists (
      select 1 from profiles where id = auth.uid() and is_admin = true
    )
  );


-- ============================================================
-- Storage bucket: listings  (public — car photos)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listings',
  'listings',
  true,
  10485760,   -- 10 MB per file
  array['image/jpeg','image/png','image/webp']
);

-- Anyone can read (bucket is public, but explicit policy keeps RLS consistent)
create policy "Anyone can view listing photos"
  on storage.objects for select
  using (bucket_id = 'listings');

-- Sellers upload to their own folder:  listings/{user_id}/{listing_id}/{filename}
create policy "Sellers can upload listing photos"
  on storage.objects for insert
  with check (
    bucket_id = 'listings'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Sellers can update own listing photos"
  on storage.objects for update
  using (
    bucket_id = 'listings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Sellers can delete own listing photos"
  on storage.objects for delete
  using (
    bucket_id = 'listings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
