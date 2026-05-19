-- Allow anyone to read workshop_name and city for approved mechanics
-- so service-passport.html can show the real workshop name without auth
create policy "Public can read approved mechanic workshop info"
  on mechanic_profiles for select
  using (status = 'approved');
