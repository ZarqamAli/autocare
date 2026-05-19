/**
 * test_flows.mjs  — programmatic end-to-end tests
 * node scripts/test_flows.mjs
 */

const SUPABASE_URL = 'https://zthsfeivxjwenrjxykwj.supabase.co';
const ANON_KEY    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0aHNmZWl2eGp3ZW5yanh5a3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDg4MDMsImV4cCI6MjA5MzcyNDgwM30.eBvCxyl9EbZJvJFpPxINgP4SlU19KXI6LfWBYLTuZ7E';
const SVC_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0aHNmZWl2eGp3ZW5yanh5a3dqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE0ODgwMywiZXhwIjoyMDkzNzI0ODAzfQ.I1xxCN3NhJw0Z8uoovvQ9CYxxUapstZDpM2MiqsjjBE';

// ─── REST helper: apikey always = ANON_KEY; authToken = user JWT or SVC_KEY ──
async function rest(path, method = 'GET', body, authToken = SVC_KEY, extraHeaders = {}) {
  const isAdmin = authToken === SVC_KEY;
  const r = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      'apikey':        isAdmin ? SVC_KEY : ANON_KEY,
      'Authorization': `Bearer ${authToken}`,
      'Content-Type':  'application/json',
      'Prefer':        method === 'POST' ? 'return=representation' : '',
      ...extraHeaders
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
  const text = await r.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { ok: r.ok, status: r.status, data };
}

// Admin REST (uses service role key in both headers)
const admin = (path, method = 'GET', body, extra = {}) => rest(path, method, body, SVC_KEY, extra);

// Create test user, insert profile with role, return uid
async function createTestUser(email, role) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { 'apikey': SVC_KEY, 'Authorization': `Bearer ${SVC_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'TestPass123!', email_confirm: true })
  });
  const d = await r.json();
  if (!r.ok) throw new Error(`createUser: ${JSON.stringify(d)}`);
  const uid = d.id;

  const pr = await admin('/rest/v1/profiles', 'POST', {
    id: uid, display_name: 'Test', email, primary_role: role
  }, { 'Prefer': 'return=minimal,resolution=merge-duplicates', 'on_conflict': 'id' });
  if (!pr.ok) throw new Error(`upsert profile [${pr.status}]: ${JSON.stringify(pr.data)}`);
  return { uid, email };
}

// Sign in, return access_token
async function signIn(email) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'TestPass123!' })
  });
  const d = await r.json();
  if (!d.access_token) throw new Error(`signIn: ${JSON.stringify(d)}`);
  return d.access_token;
}

async function deleteUser(uid) {
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${uid}`, {
    method: 'DELETE',
    headers: { 'apikey': SVC_KEY, 'Authorization': `Bearer ${SVC_KEY}` }
  }).catch(() => {});
}

// Upload a tiny file to storage
async function storageUpload(bucket, path, jwt) {
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'image/jpeg',
      'x-upsert': 'true'
    },
    body: new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10])
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`upload ${bucket}/${path} [${r.status}]: ${t}`);
  }
}

// ─── test runner ─────────────────────────────────────────────────────────────
const results = [];
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

async function test(label, fn) {
  try {
    await fn();
    console.log('  ✓', label);
    results.push({ label, ok: true });
  } catch (e) {
    console.error('  ✗', label, '→', e.message);
    results.push({ label, ok: false, err: e.message });
  }
}

const cleanupUids = [];

// ══════════════════════════════════════════════════════════════════
// FLOW 1: Mechanic signup → docs upload → mechanic_profiles insert
// ══════════════════════════════════════════════════════════════════
console.log('\n═══ FLOW 1: Mechanic signup → docs upload → profile insert ═══');
let mechUid, mechEmail, mechJwt, mechProfileId;

await test('Create mechanic user + profile (role=mechanic)', async () => {
  const r = await createTestUser(`mech_${Date.now()}@autocare.test`, 'mechanic');
  mechUid = r.uid; mechEmail = r.email;
  cleanupUids.push(mechUid);
});

await test('Sign in as mechanic', async () => {
  mechJwt = await signIn(mechEmail);
});

await test('Upload CNIC front to mechanic-docs bucket', async () => {
  await storageUpload('mechanic-docs', `${mechUid}/cnic_front_${Date.now()}.jpg`, mechJwt);
});

await test('Upload workshop photo to mechanic-docs bucket', async () => {
  await storageUpload('mechanic-docs', `${mechUid}/workshop_${Date.now()}.jpg`, mechJwt);
});

await test('Insert mechanic_profiles row (RLS: user_id = auth.uid)', async () => {
  const r = await rest('/rest/v1/mechanic_profiles', 'POST', {
    user_id:            mechUid,
    workshop_name:      'Test Workshop',
    address:            '123 Test St',
    city:               'Karachi',
    phone:              '+923001234567',
    cnic_number:        '12345-1234567-1',
    cnic_front_url:     `${mechUid}/cnic_front_test.jpg`,
    cnic_back_url:      `${mechUid}/cnic_back_test.jpg`,
    selfie_url:         `${mechUid}/selfie_test.jpg`,
    workshop_photo_url: `${mechUid}/workshop_test.jpg`,
    status:             'pending'
  }, mechJwt, { 'Prefer': 'return=representation' });
  assert(r.ok, `[${r.status}] ${JSON.stringify(r.data)}`);
  mechProfileId = (Array.isArray(r.data) ? r.data[0] : r.data)?.id;
  assert(mechProfileId, 'no id in response');
});

// ══════════════════════════════════════════════════════════════════
// FLOW 2: Admin approves mechanic
// ══════════════════════════════════════════════════════════════════
console.log('\n═══ FLOW 2: Admin approves mechanic ═══');

await test('Admin sets mechanic_profiles.status = approved', async () => {
  const r = await admin(
    `/rest/v1/mechanic_profiles?id=eq.${mechProfileId}`,
    'PATCH',
    { status: 'approved', verified_at: new Date().toISOString() },
    { 'Prefer': 'return=minimal' }
  );
  assert(r.ok, `[${r.status}] ${JSON.stringify(r.data)}`);
});

await test('Mechanic reads own profile → status = approved', async () => {
  const r = await rest(
    `/rest/v1/mechanic_profiles?user_id=eq.${mechUid}&select=id,status`,
    'GET', undefined, mechJwt
  );
  assert(r.ok, JSON.stringify(r.data));
  const row = (Array.isArray(r.data) ? r.data[0] : r.data);
  assert(row?.status === 'approved', `got status=${row?.status}`);
});

// ══════════════════════════════════════════════════════════════════
// FLOW 3: Mechanic scans QR → logs service → health score upserts
// ══════════════════════════════════════════════════════════════════
console.log('\n═══ FLOW 3: Mechanic scans QR → service log → health score ═══');
let ownerUid, ownerEmail, vehicleId, vehicleQrUuid;

await test('Create owner + vehicle (with auto-generated qr_code_uuid)', async () => {
  const o = await createTestUser(`owner_${Date.now()}@autocare.test`, 'owner');
  ownerUid = o.uid; ownerEmail = o.email;
  cleanupUids.push(ownerUid);

  const vr = await admin('/rest/v1/vehicles', 'POST', {
    owner_id: ownerUid,
    make: 'Toyota', model: 'Corolla', year: 2020
  }, { 'Prefer': 'return=representation' });
  assert(vr.ok, `[${vr.status}] ${JSON.stringify(vr.data)}`);
  const v = Array.isArray(vr.data) ? vr.data[0] : vr.data;
  vehicleId = v.id;
  vehicleQrUuid = v.qr_code_uuid;
  assert(vehicleId && vehicleQrUuid, 'missing id or qr_code_uuid');
});

await test('Mechanic looks up vehicle by QR uuid (vehicles.select)', async () => {
  const r = await rest(
    `/rest/v1/vehicles?qr_code_uuid=eq.${vehicleQrUuid}&select=id,make,model,year,is_stolen,owner_id`,
    'GET', undefined, mechJwt
  );
  assert(r.ok, JSON.stringify(r.data));
  assert(Array.isArray(r.data) && r.data[0]?.id === vehicleId, 'vehicle not found');
});

let serviceLogId;
await test('Approved mechanic inserts service_log', async () => {
  const r = await rest('/rest/v1/service_logs', 'POST', {
    vehicle_id:          vehicleId,
    mechanic_id:         mechProfileId,
    service_types:       ['Oil Change', 'Filter Change'],
    odometer_at_service: 45000,
    notes:               'Routine service'
  }, mechJwt, { 'Prefer': 'return=representation' });
  assert(r.ok, `[${r.status}] ${JSON.stringify(r.data)}`);
  serviceLogId = (Array.isArray(r.data) ? r.data[0] : r.data)?.id;
  assert(serviceLogId, 'no id');
});

await test('Mechanic upserts health_score (RLS: approved mechanic)', async () => {
  const r = await rest('/rest/v1/health_scores', 'POST', {
    vehicle_id:    vehicleId,
    score:         75,
    breakdown:     { has_logs: true, recent_service: true, odo_ok: true, five_plus_logs: false, not_stolen: true },
    calculated_at: new Date().toISOString()
  }, mechJwt, { 'Prefer': 'return=representation,resolution=merge-duplicates', 'on_conflict': 'vehicle_id' });
  assert(r.ok, `[${r.status}] ${JSON.stringify(r.data)}`);
});

await test('Anyone can read health_score for vehicle', async () => {
  const r = await rest(
    `/rest/v1/health_scores?vehicle_id=eq.${vehicleId}&select=score,breakdown`,
    'GET', undefined, ANON_KEY  // unauthenticated read
  );
  assert(r.ok && Array.isArray(r.data) && r.data[0]?.score === 75, JSON.stringify(r.data));
});

// ══════════════════════════════════════════════════════════════════
// FLOW 4: Owner adds vehicle → photo upload → QR generated
// ══════════════════════════════════════════════════════════════════
console.log('\n═══ FLOW 4: Owner adds vehicle → photo upload → QR ═══');
let ownerJwt, newVehicleId;

await test('Sign in as owner', async () => {
  ownerJwt = await signIn(ownerEmail);
});

await test('Owner uploads photo to vehicle-photos bucket', async () => {
  await storageUpload('vehicle-photos', `${ownerUid}/car_${Date.now()}.jpg`, ownerJwt);
});

await test('Owner inserts vehicle (qr_code_uuid auto-generated by DB default)', async () => {
  const r = await rest('/rest/v1/vehicles', 'POST', {
    owner_id: ownerUid,
    make: 'Honda', model: 'Civic', year: 2022
  }, ownerJwt, { 'Prefer': 'return=representation' });
  assert(r.ok, `[${r.status}] ${JSON.stringify(r.data)}`);
  const v = Array.isArray(r.data) ? r.data[0] : r.data;
  newVehicleId = v.id;
  assert(v.qr_code_uuid, 'qr_code_uuid not auto-generated');
});

await test('Owner reads garage (vehicles + health_scores join)', async () => {
  const r = await rest(
    `/rest/v1/vehicles?owner_id=eq.${ownerUid}&select=id,make,model,year,qr_code_uuid,health_scores(score)`,
    'GET', undefined, ownerJwt
  );
  assert(r.ok && Array.isArray(r.data) && r.data.length >= 2, JSON.stringify(r.data));
});

await test('Service passport (public QR lookup + service_logs)', async () => {
  const r = await rest(
    `/rest/v1/vehicles?qr_code_uuid=eq.${vehicleQrUuid}&select=id,make,model,year,is_stolen,service_logs(logged_at,service_types,odometer_at_service),health_scores(score,breakdown)`,
    'GET', undefined, ANON_KEY
  );
  assert(r.ok && Array.isArray(r.data) && r.data[0]?.service_logs?.length > 0, JSON.stringify(r.data));
});

// ══════════════════════════════════════════════════════════════════
// FLOW 5: Buyer browse → detail → chat → offer → deal → review
// ══════════════════════════════════════════════════════════════════
console.log('\n═══ FLOW 5: Buyer → listing → chat → offer → deal → review ═══');
let buyerUid, buyerEmail, sellerUid, sellerEmail;
let buyerJwt, sellerJwt, listingId, convId, offerId, dealId;

await test('Create buyer + seller users', async () => {
  const b = await createTestUser(`buyer_${Date.now()}@autocare.test`, 'buyer');
  const s = await createTestUser(`seller_${Date.now()}@autocare.test`, 'seller');
  buyerUid = b.uid; buyerEmail = b.email;
  sellerUid = s.uid; sellerEmail = s.email;
  cleanupUids.push(buyerUid, sellerUid);

  // Create seller_profiles row (required for listings FK)
  await admin('/rest/v1/seller_profiles', 'POST', {
    user_id: sellerUid, full_name: 'Test Seller', phone_number: '+923001234567',
    verification_status: 'approved'
  }, { 'Prefer': 'return=minimal,resolution=merge-duplicates', 'on_conflict': 'user_id' });
});

await test('Sign in buyer + seller', async () => {
  buyerJwt  = await signIn(buyerEmail);
  sellerJwt = await signIn(sellerEmail);
});

await test('Seller creates listing (price_minor, mileage required)', async () => {
  const r = await rest('/rest/v1/listings', 'POST', {
    seller_id:   sellerUid,
    make:        'Toyota', model: 'Corolla', year: 2019,
    variant:     'XLi', city: 'Lahore',
    price_minor: 25000000000,   // PKR 2,500,000 * 100 (minor = paisa)
    mileage:     80000,
    status:      'active'
  }, sellerJwt, { 'Prefer': 'return=representation' });
  assert(r.ok, `[${r.status}] ${JSON.stringify(r.data)}`);
  listingId = (Array.isArray(r.data) ? r.data[0] : r.data)?.id;
  assert(listingId, 'no id');
});

await test('Buyer browses active listings (public read)', async () => {
  const r = await rest(
    `/rest/v1/listings?status=in.(active,sold)&select=id,make,model,year,price_minor,city&limit=5`,
    'GET', undefined, buyerJwt
  );
  assert(r.ok && Array.isArray(r.data), JSON.stringify(r.data));
  assert(r.data.some(l => l.id === listingId), 'new listing not in browse results');
});

await test('Buyer opens listing detail (with seller_profiles join)', async () => {
  const r = await rest(
    `/rest/v1/listings?id=eq.${listingId}&select=*,seller_profiles!listings_seller_id_fkey(full_name,phone_number,verification_status)`,
    'GET', undefined, buyerJwt
  );
  assert(r.ok && Array.isArray(r.data) && r.data[0]?.id === listingId, JSON.stringify(r.data));
});

await test('Buyer starts conversation (buyer_id = auth.uid)', async () => {
  const r = await rest('/rest/v1/conversations', 'POST', {
    listing_id: listingId,
    buyer_id:   buyerUid,
    seller_id:  sellerUid,
    status:     'active'
  }, buyerJwt, { 'Prefer': 'return=representation' });
  assert(r.ok, `[${r.status}] ${JSON.stringify(r.data)}`);
  convId = (Array.isArray(r.data) ? r.data[0] : r.data)?.id;
  assert(convId, 'no id');
});

await test('Buyer sends message', async () => {
  const r = await rest('/rest/v1/messages', 'POST', {
    conversation_id: convId,
    sender_id:       buyerUid,
    body:            'Is this still available?'
  }, buyerJwt, { 'Prefer': 'return=minimal' });
  assert(r.ok, `[${r.status}] ${JSON.stringify(r.data)}`);
});

await test('Buyer makes offer (proposer_id, amount_minor, conversation_id)', async () => {
  const r = await rest('/rest/v1/offers', 'POST', {
    conversation_id: convId,
    proposer_id:     buyerUid,
    amount_minor:    24000000000,
    status:          'pending'
  }, buyerJwt, { 'Prefer': 'return=representation' });
  assert(r.ok, `[${r.status}] ${JSON.stringify(r.data)}`);
  offerId = (Array.isArray(r.data) ? r.data[0] : r.data)?.id;
  assert(offerId, 'no id');
});

await test('Seller reads offer (participants read policy)', async () => {
  const r = await rest(
    `/rest/v1/offers?id=eq.${offerId}&select=id,amount_minor,status`,
    'GET', undefined, sellerJwt
  );
  assert(r.ok && Array.isArray(r.data) && r.data[0]?.id === offerId, JSON.stringify(r.data));
});

await test('Seller accepts offer (UPDATE offers)', async () => {
  const r = await rest(
    `/rest/v1/offers?id=eq.${offerId}`,
    'PATCH', { status: 'accepted' },
    sellerJwt, { 'Prefer': 'return=minimal' }
  );
  assert(r.ok, `[${r.status}] ${JSON.stringify(r.data)}`);
});

await test('Seller creates deal (Participants can create deal)', async () => {
  const r = await rest('/rest/v1/deals', 'POST', {
    conversation_id: convId,
    listing_id:      listingId,
    buyer_id:        buyerUid,
    seller_id:       sellerUid,
    final_price_minor: 24000000000,
    status:          'open'
  }, sellerJwt, { 'Prefer': 'return=representation' });
  assert(r.ok, `[${r.status}] ${JSON.stringify(r.data)}`);
  dealId = (Array.isArray(r.data) ? r.data[0] : r.data)?.id;
  assert(dealId, 'no id');
});

await test('Buyer confirms deal (UPDATE deals.buyer_confirmed_at)', async () => {
  const r = await rest(
    `/rest/v1/deals?id=eq.${dealId}`,
    'PATCH', { buyer_confirmed_at: new Date().toISOString() },
    buyerJwt, { 'Prefer': 'return=minimal' }
  );
  assert(r.ok, `[${r.status}] ${JSON.stringify(r.data)}`);
});

await test('Seller confirms deal (UPDATE deals.seller_confirmed_at)', async () => {
  const r = await rest(
    `/rest/v1/deals?id=eq.${dealId}`,
    'PATCH', { seller_confirmed_at: new Date().toISOString() },
    sellerJwt, { 'Prefer': 'return=minimal' }
  );
  assert(r.ok, `[${r.status}] ${JSON.stringify(r.data)}`);
});

await test('Buyer submits review (reviewer_id = auth.uid, comment field)', async () => {
  const r = await rest('/rest/v1/reviews', 'POST', {
    deal_id:     dealId,
    reviewer_id: buyerUid,
    reviewee_id: sellerUid,
    rating:      5,
    comment:     'Great seller!'
  }, buyerJwt, { 'Prefer': 'return=representation' });
  assert(r.ok, `[${r.status}] ${JSON.stringify(r.data)}`);
});

// ─── cleanup ─────────────────────────────────────────────────────────────────
console.log('\n[Cleanup] Removing test users...');
await Promise.all(cleanupUids.map(deleteUser));

// ─── summary ─────────────────────────────────────────────────────────────────
const pass = results.filter(t => t.ok).length;
const fail = results.filter(t => !t.ok).length;
console.log(`\n════════════════════════════════════`);
console.log(`Results: ${pass} passed, ${fail} failed (${results.length} total)`);
if (fail > 0) {
  console.log('\nFailed:');
  results.filter(t => !t.ok).forEach(t => console.log(`  ✗ ${t.label}\n    ${t.err}`));
  process.exit(1);
} else {
  console.log('All tests passed ✓');
}
