// Bloom VIP payments: Supabase Edge Function that talks to Stripe.
// The Stripe secret key lives in the STRIPE_SECRET_KEY secret, never in the app.
// actions: checkout (start paying), sync (ask Stripe and update vip_until), portal (manage / cancel)
// No webhooks needed: after paying, and every now and then, the app asks "sync" and we read
// the truth straight from Stripe.

const STRIPE = Deno.env.get('STRIPE_SECRET_KEY') || '';
const URL_ = Deno.env.get('SUPABASE_URL') || '';
const ANON = Deno.env.get('SUPABASE_ANON_KEY') || '';
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const PRICE_CENTS = 2299; // $22.99 a year
const SITE = 'https://marlinraad1-ui.github.io/bloom/';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

async function stripe(path: string, params: Record<string, string> = {}, method = 'POST') {
  const body = new URLSearchParams(params).toString();
  const r = await fetch(`https://api.stripe.com/v1/${path}${method === 'GET' && body ? '?' + body : ''}`, {
    method, headers: { Authorization: `Bearer ${STRIPE}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: method === 'GET' ? undefined : body,
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || 'stripe_error');
  return j;
}
const db = (path: string, init: RequestInit = {}) => fetch(`${URL_}/rest/v1/${path}`, {
  ...init, headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(init.headers || {}) },
}).then(r => r.json());

// only send people back to Bloom itself
function safeReturn(u: unknown) {
  try {
    const x = new URL(String(u));
    if (x.origin === 'https://marlinraad1-ui.github.io' || /^(localhost|127\.0\.0\.1)$/.test(x.hostname)) return x.origin + x.pathname;
  } catch (_e) { /* fall through */ }
  return SITE;
}

async function customerFor(user: { id: string; email: string }, create: boolean) {
  const rows = await db(`vip_billing?user_id=eq.${user.id}&select=stripe_customer`);
  if (rows?.[0]?.stripe_customer) {
    // a customer saved in test mode doesn't exist in live mode (or was deleted): forget it
    try { await stripe(`customers/${rows[0].stripe_customer}`, {}, 'GET'); return rows[0].stripe_customer as string; }
    catch (e) {
      if (!/no such customer/i.test(String((e as Error).message))) throw e;
      await db(`vip_billing?user_id=eq.${user.id}`, { method: 'DELETE' });
    }
  }
  if (!create) return null;
  const c = await stripe('customers', { email: user.email, 'metadata[supabase_uid]': user.id });
  await db('vip_billing', { method: 'POST', body: JSON.stringify({ user_id: user.id, stripe_customer: c.id }) });
  return c.id as string;
}

async function sync(user: { id: string }) {
  const cust = await customerFor(user as { id: string; email: string }, false);
  if (!cust) return { vip_until: null, status: 'none' };
  const subs = await stripe('subscriptions', { customer: cust, status: 'all', limit: '10' }, 'GET');
  let end = 0, status = 'none';
  for (const s of subs.data || []) {
    const e = s.current_period_end || s.items?.data?.[0]?.current_period_end || 0;
    if (['active', 'trialing', 'past_due'].includes(s.status) && e > end) { end = e; status = s.status; }
  }
  const [prof] = await db(`profiles?id=eq.${user.id}&select=vip_until`);
  let vip = prof?.vip_until || null;
  if (end && (!vip || new Date(vip).getTime() < end * 1000)) {
    vip = new Date(end * 1000).toISOString();
    await db(`profiles?id=eq.${user.id}`, { method: 'PATCH', body: JSON.stringify({ vip_until: vip }) });
  }
  await db(`vip_billing?user_id=eq.${user.id}`, { method: 'PATCH', body: JSON.stringify({ status, updated_at: new Date().toISOString() }) });
  return { vip_until: vip, status };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!STRIPE) return json({ error: 'not_configured' }, 503);
  try {
    // who is asking? (must be a real account with an email, not a guest)
    const ur = await fetch(`${URL_}/auth/v1/user`, { headers: { apikey: ANON, Authorization: req.headers.get('Authorization') || '' } });
    const user = ur.ok ? await ur.json() : null;
    if (!user?.id || !user.email || user.is_anonymous) return json({ error: 'need_account' }, 401);
    const p = await req.json().catch(() => ({}));
    const back = safeReturn(p.return);

    if (p.action === 'checkout') {
      const now = await sync(user);
      if (now.status === 'active' || now.status === 'trialing') return json({ already: true, ...now });
      const cust = await customerFor(user, true);
      const s = await stripe('checkout/sessions', {
        mode: 'subscription', customer: cust, client_reference_id: user.id,
        'line_items[0][quantity]': '1',
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][unit_amount]': String(PRICE_CENTS),
        'line_items[0][price_data][recurring][interval]': 'year',
        'line_items[0][price_data][product_data][name]': 'Bloom VIP',
        'line_items[0][price_data][product_data][description]': 'All themes, every workout with real videos, AI food calculator, body analyzer, live profile. 1 year, renews yearly, cancel anytime.',
        'subscription_data[metadata][supabase_uid]': user.id,
        allow_promotion_codes: 'true',
        success_url: back + '?vip=success',
        cancel_url: back + '?vip=cancel',
      });
      return json({ url: s.url });
    }
    if (p.action === 'sync') return json(await sync(user));
    if (p.action === 'portal') {
      const cust = await customerFor(user, false);
      if (!cust) return json({ error: 'no_customer' }, 404);
      const s = await stripe('billing_portal/sessions', { customer: cust, return_url: back });
      return json({ url: s.url });
    }
    return json({ error: 'bad_action' }, 400);
  } catch (e) {
    return json({ error: 'failed', detail: String((e as Error).message || e).slice(0, 200) }, 502);
  }
});
