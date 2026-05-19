-- ============================================================
-- 012: Fix missing storage policies + health_scores RLS
-- ============================================================

-- ---- mechanic-docs bucket policies ----
CREATE POLICY "Mechanics can upload own docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'mechanic-docs'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Mechanics can view own docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'mechanic-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Mechanics can delete own docs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'mechanic-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can view all mechanic docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'mechanic-docs'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ---- vehicle-photos bucket policies ----
CREATE POLICY "Owners can upload vehicle photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'vehicle-photos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owners can view vehicle photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'vehicle-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owners can delete vehicle photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'vehicle-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can read vehicle photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicle-photos');

-- ---- health_scores: replace admin-only with mechanic+admin ----
DROP POLICY IF EXISTS "Admins can insert health scores" ON health_scores;
DROP POLICY IF EXISTS "Admins can update health scores" ON health_scores;

CREATE POLICY "Mechanic or admin can insert health scores"
  ON health_scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mechanic_profiles mp
      WHERE mp.user_id = auth.uid() AND mp.status = 'approved'
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Mechanic or admin can update health scores"
  ON health_scores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM mechanic_profiles mp
      WHERE mp.user_id = auth.uid() AND mp.status = 'approved'
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );
