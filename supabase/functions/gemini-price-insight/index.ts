import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_API_KEY       = Deno.env.get('GEMINI_API_KEY')             ?? '';
const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')               ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')  ?? '';
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { status: 200, headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  try {
    const listing = await req.json();
    const pkr = Math.round((listing.price_minor ?? 0) / 100);

    // Try to get reference prices — gracefully skip if table doesn't exist
    let refSection = 'No reference prices available in database.';
    try {
      const { data: refs } = await sb
        .from('price_reference')
        .select('price_minor, mileage, year')
        .ilike('make',  `%${listing.make}%`)
        .ilike('model', `%${listing.model}%`)
        .gte('year',  (listing.year ?? 0) - 2)
        .lte('year',  (listing.year ?? 9999) + 2)
        .limit(20);

      if (refs?.length) {
        refSection =
          `Reference prices (PKR) for comparable ${listing.make} ${listing.model} ±2 years:\n` +
          refs.map(r => `  ${r.year} — PKR ${Math.round(r.price_minor/100).toLocaleString()}${r.mileage ? ', '+r.mileage.toLocaleString()+' km':''}`).join('\n');
      }

      // Also compare with active listings in DB
      const { data: similar } = await sb
        .from('listings')
        .select('price_minor, mileage, year')
        .ilike('make',  `%${listing.make}%`)
        .ilike('model', `%${listing.model}%`)
        .eq('status', 'active')
        .gte('year',  (listing.year ?? 0) - 2)
        .lte('year',  (listing.year ?? 9999) + 2)
        .limit(10);

      if (similar?.length) {
        const avgPkr = Math.round(similar.reduce((s, r) => s + r.price_minor/100, 0) / similar.length);
        refSection += `\n\nLive market data — ${similar.length} similar listings currently on AutoMart, avg PKR ${avgPkr.toLocaleString()}.`;
      }
    } catch { /* price_reference table may not exist — proceed without it */ }

    const prompt =
      `You are a Pakistani used-car market expert.\n\n` +
      `Listing:\n` +
      `  Car: ${listing.year} ${listing.make} ${listing.model}${listing.variant ? ' '+listing.variant : ''}\n` +
      `  Asking price: PKR ${pkr.toLocaleString()}\n` +
      `  Mileage: ${listing.mileage ? listing.mileage.toLocaleString()+' km' : 'N/A'}\n` +
      `  Condition: ${listing.condition ?? 'N/A'}, ${listing.assembly ?? ''} assembled\n` +
      `  City: ${listing.city ?? 'Pakistan'}\n\n` +
      refSection + '\n\n' +
      `Based on the data and your knowledge of the Pakistani used-car market in 2024-2025, assess the asking price.\n` +
      `Respond ONLY as valid JSON (no markdown):\n` +
      `{ "assessment": "below_market" | "fair" | "above_market", "percentage": <number 0-50>, "reason": "<one concise sentence about the Pakistani market>" }`;

    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 200, temperature: 0.2 },
      }),
    });

    const json = await res.json();
    const raw: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    let insight: Record<string, unknown> = {};
    try { insight = JSON.parse(raw.replace(/```json|```/g, '').trim()); } catch { insight = { assessment: 'fair', percentage: 0, reason: 'Unable to assess at this time.' }; }

    return new Response(JSON.stringify(insight), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
