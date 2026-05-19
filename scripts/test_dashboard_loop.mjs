/**
 * test_dashboard_loop.mjs
 * Tests the owner dashboard load flow to rule out infinite reload loops.
 * node scripts/test_dashboard_loop.mjs
 */

const SUPABASE_URL = 'https://zthsfeivxjwenrjxykwj.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0aHNmZWl2eGp3ZW5yanh5a3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDg4MDMsImV4cCI6MjA5MzcyNDgwM30.eBvCxyl9EbZJvJFpPxINgP4SlU19KXI6LfWBYLTuZ7E';
const SVC_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0aHNmZWl2eGp3ZW5yanh5a3dqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE0ODgwMywiZXhwIjoyMDkzNzI0ODAzfQ.I1xxCN3NhJw0Z8uoovvQ9CYxxUapstZDpM2MiqsjjBE';

const pass = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg) => { console.error(`  ✗ ${msg}`); process.exitCode = 1; };

async function req(path, token = SVC_KEY, extra = {}) {
  const isService = token === SVC_KEY;
  const r = await fetch(`${SUPABASE_URL}${path}`, {
    headers: {
      'apikey': isService ? SVC_KEY : ANON_KEY,
      'Authorization': `Bearer ${token}`,
      ...extra
    }
  });
  const text = await r.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { ok: r.ok, status: r.status, data };
}

async function post(path, body, token = SVC_KEY, extra = {}) {
  const isService = token === SVC_KEY;
  const r = await fetch(`${SUPABASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'apikey': isService ? SVC_KEY : ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...extra
    },
    body: JSON.stringify(body)
  });
  const text = await r.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { ok: r.ok, status: r.status, data };
}

async function signIn(email) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'TestPass123!' })
  });
  const d = await r.json();
  return d.access_token || null;
}

async function createUser(email, role) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { 'apikey': SVC_KEY, 'Authorization': `Bearer ${SVC_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'TestPass123!', email_confirm: true })
  });
  const d = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(d));
  const uid = d.id;
  await post('/rest/v1/profiles', { id: uid, display_name: 'Test Owner', email, primary_role: role },
    SVC_KEY, { 'Prefer': 'return=minimal,resolution=merge-duplicates', 'on_conflict': 'id' });
  return { uid, email };
}

async function deleteUser(uid) {
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${uid}`, {
    method: 'DELETE',
    headers: { 'apikey': SVC_KEY, 'Authorization': `Bearer ${SVC_KEY}` }
  });
}

(async () => {
  console.log('\n── Dashboard loop test ──────────────────────');

  const email = `test-owner-loop-${Date.now()}@example.com`;
  let uid, token, vehicleId;

  // 1. Create owner account
  try {
    const u = await createUser(email, 'owner');
    uid = u.uid;
    pass('Created owner account');
  } catch (e) { fail('Create owner: ' + e.message); return; }

  // 2. Sign in
  token = await signIn(email);
  if (!token) { fail('Sign in failed'); await deleteUser(uid); return; }
  pass('Signed in, got token');

  // 3. Read profile — simulates dashboard auth check
  const profRes = await req(`/rest/v1/profiles?id=eq.${uid}&select=display_name,primary_role,is_admin`, token);
  if (!profRes.ok || !profRes.data?.length) { fail('Profile fetch failed: ' + JSON.stringify(profRes.data)); }
  else {
    const p = profRes.data[0];
    const allowed = p.primary_role === 'owner' || p.primary_role === 'seller' || p.is_admin;
    if (allowed) pass(`Profile OK: role=${p.primary_role} → dashboard proceeds (no redirect to buyer)`);
    else fail(`Profile role=${p.primary_role} → would redirect away`);
  }

  // 4. Vehicles query (empty) — simulates dashboard with no vehicles
  const emptyRes = await req(
    `/rest/v1/vehicles?owner_id=eq.${uid}&select=*,health_scores(*),service_logs(logged_at,service_types,odometer_at_service)&order=created_at.desc`,
    token
  );
  if (!emptyRes.ok) fail('Empty vehicles query failed: ' + JSON.stringify(emptyRes.data));
  else {
    const v = emptyRes.data;
    if (Array.isArray(v) && v.length === 0)
      pass('Empty vehicles: data=[] → shows empty state HTML (no redirect to add-vehicle)');
    else fail('Unexpected vehicles response: ' + JSON.stringify(v));
  }

  // 5. Insert a vehicle (simulates add-vehicle.html submit)
  const insRes = await post('/rest/v1/vehicles', {
    owner_id: uid, make: 'Toyota', model: 'Corolla', year: 2020,
    color: 'White', registration_number: 'TEST-001'
  }, token);
  if (!insRes.ok || !Array.isArray(insRes.data) || !insRes.data[0]?.id) {
    fail('Vehicle insert failed: ' + JSON.stringify(insRes.data));
  } else {
    vehicleId = insRes.data[0].id;
    pass(`Vehicle inserted: id=${vehicleId}`);
  }

  // 6. Vehicles query (with vehicle) — simulates dashboard after "Go to Garage →"
  if (vehicleId) {
    const withVRes = await req(
      `/rest/v1/vehicles?owner_id=eq.${uid}&select=*,health_scores(*),service_logs(logged_at,service_types,odometer_at_service)&order=created_at.desc`,
      token
    );
    if (!withVRes.ok) fail('Vehicles query (with vehicle) failed: ' + JSON.stringify(withVRes.data));
    else {
      const v = withVRes.data;
      if (Array.isArray(v) && v.length === 1)
        pass(`Vehicles query returns 1 vehicle → shows garage grid (no reload triggered)`);
      else fail(`Expected 1 vehicle, got: ${JSON.stringify(v?.length)}`);
    }
  }

  // 7. health_scores sub-select — confirm RLS doesn't block it
  if (vehicleId) {
    const hsRes = await req(`/rest/v1/health_scores?vehicle_id=eq.${vehicleId}&select=*`, token);
    if (!hsRes.ok) fail('health_scores read failed: ' + JSON.stringify(hsRes.data));
    else pass(`health_scores query OK (returns ${hsRes.data?.length ?? 0} rows)`);
  }

  // 8. Confirm dashboard HTML has no redirect to add-vehicle on empty
  const fs = await import('fs');
  const html = fs.readFileSync('app/owner/dashboard.html', 'utf8');
  const hasAutoRedirect = /if\s*\(!vehicles/.test(html) && /location\.(href|replace|assign)/.test(
    html.slice(html.indexOf('!vehicles'), html.indexOf('!vehicles') + 300)
  );
  if (!hasAutoRedirect) pass('Dashboard: no auto-redirect on empty vehicles');
  else fail('Dashboard: FOUND auto-redirect on empty vehicles → reload loop source');

  // 9. Confirm add-vehicle.html has no auto-redirect after insert
  const avHtml = fs.readFileSync('app/owner/add-vehicle.html', 'utf8');
  // After insert, the code should NOT have window.location pointing to dashboard
  const insertBlock = avHtml.slice(avHtml.indexOf('insert(payload)'));
  const hasAutoNav = /window\.location\.(href|replace)|location\.(href|replace)/.test(
    insertBlock.slice(0, insertBlock.indexOf('btn-download'))
  );
  if (!hasAutoNav) pass('add-vehicle.html: no auto-redirect after insert');
  else fail('add-vehicle.html: FOUND auto-redirect after insert → reload loop source');

  // Cleanup
  if (vehicleId) {
    await fetch(`${SUPABASE_URL}/rest/v1/vehicles?id=eq.${vehicleId}`, {
      method: 'DELETE',
      headers: { 'apikey': SVC_KEY, 'Authorization': `Bearer ${SVC_KEY}` }
    });
  }
  await deleteUser(uid);

  console.log('── Done ──────────────────────────────────────\n');
})();
