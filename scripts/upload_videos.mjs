import { readFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT   = join(__dir, '..');

const SUPABASE_URL      = 'https://zthsfeivxjwenrjxykwj.supabase.co';
const SERVICE_ROLE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0aHNmZWl2eGp3ZW5yanh5a3dqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE0ODgwMywiZXhwIjoyMDkzNzI0ODAzfQ.I1xxCN3NhJw0Z8uoovvQ9CYxxUapstZDpM2MiqsjjBE';
const BUCKET = 'marketing-media';

const HEADERS = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
};

const VIDEOS = [
  { local: 'marketing/media/hero-car.mp4',      remote: 'hero-car.mp4'      },
  { local: 'marketing/media/why-bmw.mp4',       remote: 'why-bmw.mp4'       },
  { local: 'marketing/sell-cta.mp4',            remote: 'sell-cta.mp4'      },
  { local: 'marketing/media/bmw-rotate.mp4',    remote: 'bmw-rotate.mp4'    },
  { local: 'marketing/media/price-insight.mp4', remote: 'price-insight.mp4' },
];

async function api(method, path, body, extraHeaders = {}) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1${path}`, {
    method,
    headers: { ...HEADERS, ...extraHeaders },
    body,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

// 1. Create bucket (public)
console.log(`\nCreating bucket "${BUCKET}"...`);
const create = await api('POST', '/bucket', JSON.stringify({ id: BUCKET, name: BUCKET, public: true }), { 'Content-Type': 'application/json' });
if (create.ok) {
  console.log('  ✓ Bucket created');
} else if (create.json?.error === 'Duplicate' || create.json?.message?.includes('already exists')) {
  console.log('  ✓ Bucket already exists');
} else {
  console.error('  ✗ Bucket error:', create.json);
  process.exit(1);
}

// 2. Upload each video (with retry + skip-if-exists)
const publicUrls = {};
for (const { local, remote } of VIDEOS) {
  const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${remote}`;
  // Check if already uploaded
  const check = await fetch(url, { method: 'HEAD' });
  if (check.ok) {
    publicUrls[remote] = url;
    console.log(`\nSkipping ${remote} (already uploaded)`);
    console.log(`  ✓ ${url}`);
    continue;
  }

  const fullPath = join(ROOT, local);
  console.log(`\nUploading ${local} → ${remote}`);
  const data = readFileSync(fullPath);

  let res;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      res = await api('POST', `/object/${BUCKET}/${remote}`, data, {
        'Content-Type': 'video/mp4',
        'x-upsert': 'true',
      });
      if (res.ok || res.json?.Key) break;
      console.log(`  attempt ${attempt} failed:`, res.json, '— retrying...');
      await new Promise(r => setTimeout(r, 2000 * attempt));
    } catch (e) {
      console.log(`  attempt ${attempt} error: ${e.message} — retrying...`);
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }

  if (res?.ok || res?.json?.Key) {
    publicUrls[remote] = url;
    console.log(`  ✓ ${url}`);
  } else {
    console.error(`  ✗ Upload failed after 3 attempts:`, res?.json);
    process.exit(1);
  }
}

// 3. Patch AutoMart_Landing.html
console.log('\nPatching AutoMart_Landing.html...');
const htmlPath = join(ROOT, 'marketing/AutoMart_Landing.html');
let html = readFileSync(htmlPath, 'utf8');

// Build replacement map: all local references → supabase URL
const replacements = {
  '"media/hero-car.mp4"':      `"${publicUrls['hero-car.mp4']}"`,
  '"media/why-bmw.mp4"':       `"${publicUrls['why-bmw.mp4']}"`,
  '"media/bmw-rotate.mp4"':    `"${publicUrls['bmw-rotate.mp4']}"`,
  '"media/price-insight.mp4"': `"${publicUrls['price-insight.mp4']}"`,
  '"sell-cta.mp4"':            `"${publicUrls['sell-cta.mp4']}"`,
  // JSX single-quote variants
  "'media/hero-car.mp4'":      `'${publicUrls['hero-car.mp4']}'`,
  "'media/why-bmw.mp4'":       `'${publicUrls['why-bmw.mp4']}'`,
  "'media/bmw-rotate.mp4'":    `'${publicUrls['bmw-rotate.mp4']}'`,
  "'media/price-insight.mp4'": `'${publicUrls['price-insight.mp4']}'`,
  "'sell-cta.mp4'":            `'${publicUrls['sell-cta.mp4']}'`,
};
for (const [from, to] of Object.entries(replacements)) {
  html = html.replaceAll(from, to);
}

import { writeFileSync } from 'fs';
writeFileSync(htmlPath, html, 'utf8');
console.log('  ✓ HTML updated');

// 4. Remove marketing/uploads/
console.log('\nRemoving marketing/uploads/...');
try {
  rmSync(join(ROOT, 'marketing/uploads'), { recursive: true, force: true });
  console.log('  ✓ Deleted');
} catch (e) {
  console.log('  (already gone)');
}

console.log('\n✅ Done. Public URLs:');
for (const [k, v] of Object.entries(publicUrls)) console.log(`  ${k}: ${v}`);
