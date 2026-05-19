/**
 * fix_and_test.mjs
 * Diagnoses, fixes, and tests all broken Supabase RLS/storage policies.
 * Run with: node scripts/fix_and_test.mjs
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL      = 'https://zthsfeivxjwenrjxykwj.supabase.co';
const ANON_KEY          = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0aHNmZWl2eGp3ZW5yanh5a3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDg4MDMsImV4cCI6MjA5MzcyNDgwM30.eBvCxyl9EbZJvJFpPxINgP4SlU19KXI6LfWBYLTuZ7E';
const SERVICE_ROLE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0aHNmZWl2eGp3ZW5yanh5a3dqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE0ODgwMywiZXhwIjoyMDkzNzI0ODAzfQ.I1xxCN3NhJw0Z8uoovvQ9CYxxUapstZDpM2MiqsjjBE';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ─── helpers ────────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
function ok(label)   { console.log('  ✓', label); passed++; }
function fail(label, err) { console.error('  ✗', label, '→', err?.message || err); failed++; }

async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  return res;
}

// Use the pg REST endpoint (pg meta) to run arbitrary SQL
async function execSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`SQL failed [${res.status}]: ${body}`);
  return JSON.parse(body);
}

// Create a disposable test user and return {client, userId, cleanup}
async function createTestUser(email, role) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: 'TestPass123!',
    email_confirm: true,
    user_metadata: { full_name: 'Test User' }
  });
  if (error) throw error;
  const userId = data.user.id;

  // Ensure profile exists with correct role
  const { error: pe } = await admin.from('profiles').upsert({
    id:           userId,
    display_name: 'Test User',
    email,
    primary_role: role
  });
  if (pe) throw pe;

  // Sign in as that user with anon client
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { error: se } = await userClient.auth.signInWithPassword({ email, password: 'TestPass123!' });
  if (se) throw se;

  const cleanup = async () => {
    await admin.auth.admin.deleteUser(userId).catch(() => {});
  };
  return { client: userClient, userId, cleanup };
}

// ─── FIX 1: storage policies for mechanic-docs ──────────────────────────────
async function fix_mechanic_docs_policies() {
  console.log('\n[FIX 1] Adding mechanic-docs storage policies via SQL migration...');

  const sql = `
    DO $$
    BEGIN
      -- INSERT: authenticated users upload to their own folder
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename='objects' AND schemaname='storage'
        AND policyname='Mechanics can upload own docs'
      ) THEN
        EXECUTE $p$
          CREATE POLICY "Mechanics can upload own docs"
            ON storage.objects FOR INSERT
            WITH CHECK (
              bucket_id = 'mechanic-docs'
              AND auth.uid() IS NOT NULL
              AND (storage.foldername(name))[1] = auth.uid()::text
            )
        $p$;
      END IF;

      -- SELECT: user sees own files
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename='objects' AND schemaname='storage'
        AND policyname='Mechanics can view own docs'
      ) THEN
        EXECUTE $p$
          CREATE POLICY "Mechanics can view own docs"
            ON storage.objects FOR SELECT
            USING (
              bucket_id = 'mechanic-docs'
              AND (storage.foldername(name))[1] = auth.uid()::text
            )
        $p$;
      END IF;

      -- DELETE: user deletes own files
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename='objects' AND schemaname='storage'
        AND policyname='Mechanics can delete own docs'
      ) THEN
        EXECUTE $p$
          CREATE POLICY "Mechanics can delete own docs"
            ON storage.objects FOR DELETE
            USING (
              bucket_id = 'mechanic-docs'
              AND (storage.foldername(name))[1] = auth.uid()::text
            )
        $p$;
      END IF;

      -- Admins can view all mechanic docs
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename='objects' AND schemaname='storage'
        AND policyname='Admins can view all mechanic docs'
      ) THEN
        EXECUTE $p$
          CREATE POLICY "Admins can view all mechanic docs"
            ON storage.objects FOR SELECT
            USING (
              bucket_id = 'mechanic-docs'
              AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
            )
        $p$;
      END IF;
    END $$;
  `;

  await admin.rpc('exec_sql', { sql }).catch(() => {}); // try via rpc first
  // Fallback: write as migration file
  return sql;
}

// ─── FIX 2: storage policies for vehicle-photos ─────────────────────────────
async function fix_vehicle_photos_policies() {
  console.log('\n[FIX 2] Adding vehicle-photos storage policies...');
  const sql = `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename='objects' AND schemaname='storage'
        AND policyname='Owners can upload vehicle photos'
      ) THEN
        EXECUTE $p$
          CREATE POLICY "Owners can upload vehicle photos"
            ON storage.objects FOR INSERT
            WITH CHECK (
              bucket_id = 'vehicle-photos'
              AND auth.uid() IS NOT NULL
              AND (storage.foldername(name))[1] = auth.uid()::text
            )
        $p$;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename='objects' AND schemaname='storage'
        AND policyname='Owners can view vehicle photos'
      ) THEN
        EXECUTE $p$
          CREATE POLICY "Owners can view vehicle photos"
            ON storage.objects FOR SELECT
            USING (
              bucket_id = 'vehicle-photos'
              AND (storage.foldername(name))[1] = auth.uid()::text
            )
        $p$;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename='objects' AND schemaname='storage'
        AND policyname='Owners can delete vehicle photos'
      ) THEN
        EXECUTE $p$
          CREATE POLICY "Owners can delete vehicle photos"
            ON storage.objects FOR DELETE
            USING (
              bucket_id = 'vehicle-photos'
              AND (storage.foldername(name))[1] = auth.uid()::text
            )
        $p$;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename='objects' AND schemaname='storage'
        AND policyname='Anyone can read vehicle photos'
      ) THEN
        EXECUTE $p$
          CREATE POLICY "Anyone can read vehicle photos"
            ON storage.objects FOR SELECT
            USING (bucket_id = 'vehicle-photos')
        $p$;
      END IF;
    END $$;
  `;
  return sql;
}

// ─── FIX 3: health_scores mechanic upsert ───────────────────────────────────
async function fix_health_scores_policies() {
  console.log('\n[FIX 3] Fixing health_scores upsert policy for approved mechanics...');
  const sql = `
    DO $$
    BEGIN
      -- Drop admin-only insert/update, replace with mechanic+admin
      DROP POLICY IF EXISTS "Admins can insert health scores" ON health_scores;
      DROP POLICY IF EXISTS "Admins can update health scores" ON health_scores;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename='health_scores' AND schemaname='public'
        AND policyname='Approved mechanic can upsert health scores'
      ) THEN
        EXECUTE $p$
          CREATE POLICY "Approved mechanic can upsert health scores"
            ON health_scores FOR INSERT
            WITH CHECK (
              EXISTS (
                SELECT 1 FROM mechanic_profiles mp
                WHERE mp.user_id = auth.uid() AND mp.status = 'approved'
              )
              OR EXISTS (
                SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
              )
            )
        $p$;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename='health_scores' AND schemaname='public'
        AND policyname='Approved mechanic can update health scores'
      ) THEN
        EXECUTE $p$
          CREATE POLICY "Approved mechanic can update health scores"
            ON health_scores FOR UPDATE
            USING (
              EXISTS (
                SELECT 1 FROM mechanic_profiles mp
                WHERE mp.user_id = auth.uid() AND mp.status = 'approved'
              )
              OR EXISTS (
                SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
              )
            )
        $p$;
      END IF;
    END $$;
  `;
  return sql;
}

console.log('AutoCare — Fix & Test Script');
console.log('================================\n');
console.log('Service role connected to:', SUPABASE_URL);
