// Mochi AI: Supabase Edge Function that talks to Google Gemini.
// The API key lives in the GEMINI_API_KEY secret, never in the app.
// Safety: the app checks emergency words BEFORE calling this, and the
// system prompt below repeats the safety rules for the AI.

const MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-flash-lite-latest';
const KEY = Deno.env.get('GEMINI_API_KEY') || '';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function systemPrompt(p: Record<string, unknown>) {
  const evil = p.persona === 'evil';
  const ctx = JSON.stringify(p.context ?? {}).slice(0, 2500);
  return `You are ${evil ? 'Evil Mochi 😈' : 'Sweet Mochi 🐰'}, the buddy inside Bloom, a fasting, weight loss and motivation app.

PERSONALITY
${evil
  ? `- Toxic-motivation coach. The user agreed to harsh tough love. Be savage, sarcastic, funny and brutally honest about excuses, cravings and laziness. You may joke that their stored fat is fuel they should burn ("Hungry? With all that stored fat?").
- Never attack their worth, looks in a hateful way, family, religion, or identity. Roast the excuse, not the person. No slurs. No swearing beyond mild.`
  : `- Warm, gentle, encouraging, like a kind friend and a soft therapist. Validate feelings, then guide. Use a few cute emojis.`}
- Sound like a real person texting: short (1 to 4 sentences, max ~70 words), natural, never repeat the same phrase you used earlier in the chat. Vary openings.
- Use the user's real numbers from CONTEXT (hours fasted, kcal burned, water, workouts, their reason and vision) to make it personal.
- Often end with one short question or a concrete next action (drink 300 ml water, walk 10 min, open the vision board).
- Reply in the same language the user writes in.
- Do not use long dashes (— or –). Use commas or periods.

SAFETY RULES (always override personality)
- If they mention fainting, chest pain, heart racing, trouble breathing, confusion, seizure, vomiting a lot, or feeling very sick: drop the act, tell them to stop fasting now, sit or lie down, sip something sweet if they can swallow, and call emergency services (${(p.context as Record<string, unknown>)?.emergency || '112'}) if it is serious or not improving.
- Dizzy, headache, weak, nauseous: gentle steps (sit, water with a pinch of salt, breathe, re-check in 15 min). If it gets worse, they should break the fast gently.
- Signs of an eating disorder, self-hate, self-harm or suicide: drop any harsh act completely, be kind, encourage talking to someone they trust or a professional or a crisis line.
- Pregnant, breastfeeding, under 18, diabetes, insulin, heart or kidney disease: say long fasts need a doctor's OK.
- Never push fasting beyond 15 days. Past 7 days, remind them a doctor should supervise. Remind about electrolytes on multi-day fasts.
- You are not a doctor. Don't invent studies.

CONTEXT (live data from the app)
${ctx}`;
}

const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// is the caller VIP (or the developer)? checked on the server so nobody can fake it
async function callerIsVip(req: Request) {
  const url = Deno.env.get('SUPABASE_URL'), anon = Deno.env.get('SUPABASE_ANON_KEY');
  const auth = req.headers.get('Authorization') || '';
  if (!url || !anon || !auth) return false;
  const r = await fetch(`${url}/rest/v1/rpc/is_vip_me`, { method: 'POST', headers: { apikey: anon, Authorization: auth, 'Content-Type': 'application/json' }, body: '{}' });
  return r.ok && (await r.json()) === true;
}

const FOOD_PROMPT = `You are Bloom's calorie calculator. The user shows a photo of a meal and/or describes what they ate.
Estimate every food and drink: realistic portion in grams or ml, kcal, protein, carbs and fat in grams. Use typical restaurant/home portions when not told.
If the photo is not food, return no items and say so in "note".
Reply with ONLY this JSON, no markdown:
{"items":[{"name":"short name","amount":"e.g. 250 g or 1 can","kcal":0,"protein":0,"carbs":0,"fat":0}],"note":"one friendly short sentence, max 25 words, no long dashes"}
Reply in the same language the user writes in (names and note).`;

async function gemini(models: string[], body: Record<string, unknown>) {
  let lastErr = '', lastStatus = 0;
  for (const model of models) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY }, body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    }).catch(() => null);
    if (!r) { lastErr = `${model}: timeout`; continue; }
    const j = await r.json().catch(() => ({}));
    const text = (j?.candidates?.[0]?.content?.parts || []).map((x: { text?: string }) => x.text || '').join('').trim();
    if (r.ok && text) return { text, model };
    lastStatus = r.status; lastErr = `${model}: ${j?.error?.status || ''} ${j?.error?.message || (r.ok ? 'empty reply' : '')}`.slice(0, 300);
    if (r.status === 400 || r.status === 401 || r.status === 403) break;
  }
  return { error: 'ai_failed', status: lastStatus, detail: lastErr };
}

async function food(p: Record<string, unknown>) {
  const parts: unknown[] = [];
  const img = typeof p.image === 'string' ? p.image : '';
  const m = img.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (m && m[2].length < 4_000_000) parts.push({ inline_data: { mime_type: m[1], data: m[2] } });
  const text = typeof p.text === 'string' ? p.text.slice(0, 1500) : '';
  parts.push({ text: text || 'What is in this meal? Estimate it.' });
  const out = await gemini(['gemini-flash-lite-latest', 'gemini-2.5-flash-lite', 'gemini-flash-latest', 'gemini-2.5-flash'], {
    system_instruction: { parts: [{ text: FOOD_PROMPT + `
If the user wrote no text, use this language: ${String(p.lang || 'en').slice(0, 20)}.` }] },
    contents: [{ role: 'user', parts }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 1024, responseMimeType: 'application/json' },
  });
  if (!('text' in out)) return json(out, 502);
  try {
    const d = JSON.parse(out.text.replace(/^```(json)?|```$/g, '').trim());
    const items = (Array.isArray(d.items) ? d.items : []).slice(0, 20).map((i: Record<string, unknown>) => ({
      name: String(i.name || 'Food').slice(0, 60), amount: String(i.amount || '').slice(0, 30),
      kcal: Math.max(0, Math.round(+i.kcal || 0)), protein: Math.max(0, Math.round(+i.protein || 0)),
      carbs: Math.max(0, Math.round(+i.carbs || 0)), fat: Math.max(0, Math.round(+i.fat || 0)),
    }));
    return json({ items, note: String(d.note || '').slice(0, 200), model: out.model });
  } catch (_e) { return json({ error: 'bad_ai_json' }, 502); }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!KEY) return new Response(JSON.stringify({ error: 'no_key' }), { status: 503, headers: { ...cors, 'Content-Type': 'application/json' } });
  try {
    const p = await req.json();
    if (p.mode === 'food') {
      if (!(await callerIsVip(req))) return json({ error: 'vip_only' }, 403);
      return await food(p);
    }
    const history = (Array.isArray(p.messages) ? p.messages : []).slice(-16)
      .filter((m: { text?: string }) => typeof m?.text === 'string' && m.text.trim())
      .map((m: { who: string; text: string }) => ({ role: m.who === 'me' ? 'user' : 'model', parts: [{ text: m.text.slice(0, 1500) }] }));
    while (history.length && history[0].role !== 'user') history.shift();
    if (!history.length) return new Response(JSON.stringify({ error: 'empty' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });

    const models = [MODEL, 'gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'].filter((m, i, a) => a.indexOf(m) === i);
    let lastErr = '', lastStatus = 0;
    for (const model of models) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt(p) }] },
          contents: history,
          generationConfig: { temperature: 1.0, maxOutputTokens: 1024 },
        }),
      });
      const j = await r.json().catch(() => ({}));
      const text = (j?.candidates?.[0]?.content?.parts || []).map((x: { text?: string }) => x.text || '').join('').trim();
      if (r.ok && text) return new Response(JSON.stringify({ text, model }), { headers: { ...cors, 'Content-Type': 'application/json' } });
      lastStatus = r.status; lastErr = `${model}: ${j?.error?.status || ''} ${j?.error?.message || (r.ok ? 'empty reply' : '')}`.slice(0, 300);
      if (r.status === 400 || r.status === 401 || r.status === 403) break; // key problem, other models won't help
    }
    return new Response(JSON.stringify({ error: 'ai_failed', status: lastStatus, detail: lastErr }), { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (_e) {
    return new Response(JSON.stringify({ error: 'bad_request' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
