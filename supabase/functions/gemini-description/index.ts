const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { status: 200, headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  try {
    const car = await req.json();

    const prompt =
      `Write an 80-120 word car listing description for a ${car.year} ${car.make} ${car.model}` +
      `${car.variant ? ' ' + car.variant : ''}.` +
      ` Details: ${car.mileage ? car.mileage.toLocaleString() + ' km' : 'mileage N/A'},` +
      ` ${car.transmission ?? ''}, ${car.condition ?? ''}, ${car.color ?? ''}, ${car.city ?? 'Pakistan'}.` +
      ` Target Pakistani buyers. Make it compelling, honest, and buyer-friendly. One plain paragraph, no bullet points.`;

    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 220, temperature: 0.7 },
      }),
    });

    const json = await res.json();
    const description: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!description) {
      return new Response(JSON.stringify({ error: 'No description generated', raw: json }), {
        status: 500, headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ description }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: corsHeaders,
    });
  }
});
