import { readFileSync, writeFileSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT   = join(__dir, '..');
const SUPABASE_URL     = 'https://zthsfeivxjwenrjxykwj.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0aHNmZWl2eGp3ZW5yanh5a3dqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE0ODgwMywiZXhwIjoyMDkzNzI0ODAzfQ.I1xxCN3NhJw0Z8uoovvQ9CYxxUapstZDpM2MiqsjjBE';
const BUCKET = 'marketing-media';
const HEADERS = { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` };

const IMAGES = [
  { local: 'marketing/media/toyota-corolla.png', remote: 'toyota-corolla.png', mime: 'image/png'  },
  { local: 'marketing/media/mercedes-amg-gt.jpg', remote: 'mercedes-amg-gt.jpg', mime: 'image/jpeg' },
  { local: 'marketing/media/audi-a6.png',         remote: 'audi-a6.png',         mime: 'image/png'  },
];

const publicUrls = {};
for (const { local, remote, mime } of IMAGES) {
  const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${remote}`;
  const check = await fetch(url, { method: 'HEAD' });
  if (check.ok) {
    publicUrls[`media/${remote}`] = url;
    console.log(`Skip (exists): ${remote} → ${url}`);
    continue;
  }
  console.log(`Uploading ${local}...`);
  const data = readFileSync(join(ROOT, local));
  const res  = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${remote}`, {
    method: 'POST',
    headers: { ...HEADERS, 'Content-Type': mime, 'x-upsert': 'true' },
    body: data,
  });
  const json = await res.json().catch(() => ({}));
  if (res.ok || json.Key) {
    publicUrls[`media/${remote}`] = url;
    console.log(`  ✓ ${url}`);
  } else {
    console.error(`  ✗`, json);
    process.exit(1);
  }
}

// Patch HTML
const htmlPath = join(ROOT, 'marketing/AutoMart_Landing.html');
let html = readFileSync(htmlPath, 'utf8');
for (const [localRef, supaUrl] of Object.entries(publicUrls)) {
  html = html.replaceAll(`'${localRef}'`, `'${supaUrl}'`);
  html = html.replaceAll(`"${localRef}"`, `"${supaUrl}"`);
}
writeFileSync(htmlPath, html, 'utf8');
console.log('\n✓ HTML patched');
for (const [k, v] of Object.entries(publicUrls)) console.log(`  ${k} → ${v}`);
