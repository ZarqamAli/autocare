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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { query, conversationHistory } = await req.json();

    const historySection = conversationHistory?.length
      ? `Previous conversation:\n` + conversationHistory.map((m: {role:string;text:string}) => `${m.role}: ${m.text}`).join('\n') + '\n\n'
      : '';

    const extractPrompt =
      historySection +
      `Extract car search filters from this query: "${query}"\n` +
      `Return ONLY compact JSON (no markdown) with these optional fields:\n` +
      `make, model, min_year, max_year, min_price_pkr, max_price_pkr, city, transmission, body_type, fuel_type, condition\n` +
      `Prices should be in PKR (not minor units). Example: { "make": "Honda", "city": "Karachi", "max_price_pkr": 2000000 }`;

    const filterRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: extractPrompt }] }],
        generationConfig: { maxOutputTokens: 200, temperature: 0 },
      }),
    });

    const filterJson = await filterRes.json();
    const filterRaw: string = filterJson.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    let filters: Record<string, unknown> = {};
    try { filters = JSON.parse(filterRaw.replace(/```json|```/g, '').trim()); } catch { filters = {}; }

    let q = sb
      .from('listings')
      .select('id,make,model,variant,year,mileage,city,transmission,fuel_type,body_type,condition,assembly,price_minor,primary_photo_url,status')
      .eq('status', 'active')
      .limit(20);

    if (filters.make)          q = q.ilike('make',          `%${filters.make}%`);
    if (filters.model)         q = q.ilike('model',         `%${filters.model}%`);
    if (filters.min_year)      q = q.gte('year',             filters.min_year);
    if (filters.max_year)      q = q.lte('year',             filters.max_year);
    if (filters.min_price_pkr) q = q.gte('price_minor',      Number(filters.min_price_pkr) * 100);
    if (filters.max_price_pkr) q = q.lte('price_minor',      Number(filters.max_price_pkr) * 100);
    if (filters.city)          q = q.ilike('city',           `%${filters.city}%`);
    if (filters.transmission)  q = q.ilike('transmission',   `%${filters.transmission}%`);
    if (filters.fuel_type)     q = q.ilike('fuel_type',      `%${filters.fuel_type}%`);
    if (filters.condition)     q = q.ilike('condition',      `%${filters.condition}%`);
    if (filters.body_type)     q = q.ilike('body_type',      `%${filters.body_type}%`);

    const { data: listings, error } = await q;
    if (error) throw error;

    if (!listings?.length) {
      return new Response(JSON.stringify({ listings: [], filters, summary: `No active listings matched "${query}".` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rankPrompt =
      `User searched: "${query}"\n\n` +
      `Rank these listings by relevance and give each a one-sentence match reason.\n` +
      `Also write a 1-2 sentence overall summary of what was found.\n` +
      `Return ONLY valid JSON (no markdown):\n` +
      `{ "summary": "...", "ranked": [{ "id": "...", "match_reason": "..." }, ...] }\n\n` +
      `Listings:\n` +
      listings
        .map(l =>
          `ID:${l.id} | ${l.year} ${l.make} ${l.model}${l.variant ? ' '+l.variant : ''}` +
          ` | PKR ${Math.round(l.price_minor/100).toLocaleString()} | ${l.city} | ${(l.mileage||0).toLocaleString()} km`
        )
        .join('\n');

    const rankRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: rankPrompt }] }],
        generationConfig: { maxOutputTokens: 700, temperature: 0.3 },
      }),
    });

    const rankJson = await rankRes.json();
    const rankRaw: string = rankJson.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    let rankData: { summary?: string; ranked?: { id: string; match_reason: string }[] } = {};
    try { rankData = JSON.parse(rankRaw.replace(/```json|```/g, '').trim()); } catch { rankData = {}; }

    const rankedListings = (rankData.ranked ?? [])
      .map(r => ({ ...listings.find(l => l.id === r.id), match_reason: r.match_reason }))
      .filter(Boolean);

    const unrankedIds = new Set(rankedListings.map((l: any) => l.id));
    const remaining = listings.filter(l => !unrankedIds.has(l.id)).map(l => ({ ...l, match_reason: null }));

    return new Response(JSON.stringify({
      listings: [...rankedListings, ...remaining],
      filters,
      summary: rankData.summary ?? `Found ${listings.length} listings matching "${query}".`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
