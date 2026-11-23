// ================= BLOOM VIP =================
// $22.99 a year. Fasting, water, workouts, Mochi and the community stay free.
// VIP: premium themes, AI food calculator, body analyzer, live profile style.
// The developer gets everything. Who is VIP lives on the server (profiles.vip_until),
// and the AI food calculator checks it there too, so it can't be faked.

const VIP_PRICE = '$22.99';
const VIP_PERKS = [
  ['🎨', 'Every theme', 'Rose Gold Luxe, Midnight Sakura, Greek Goddess, Galaxy, K-pop Neon, Dark, Ocean and all new themes first'],
  ['🏋️', 'Every workout', 'K-pop dance, HIIT, home and gym workouts with real people showing every move, plus the best workout for the gear you have at home'],
  ['📸', 'Snap your meal', 'Take a photo and Bloom counts the calories, protein, carbs and fat'],
  ['💬', 'AI calorie chat', 'Just text what you ate. "2 eggs and a latte" is enough'],
  ['🔥', 'Ate too much? Burn plan', 'Exactly which workouts and how many minutes to walk so you don\'t gain'],
  ['🔬', 'Full body analyzer', 'Body fat %, maintenance calories, healthy weight, goal date, protein and water'],
  ['✨', 'Glowing VIP badge', 'Shines next to your name everywhere in the community'],
  ['🎬', 'Live profile', 'Moving banners, your own GIF or video, name glow and avatar rings'],
];

function vipModal(reason) {
  const top = { themes: '🎨 This theme is for VIP', food: '📸 The AI food calculator is VIP', analyzer: '🔬 The body analyzer is VIP', workouts: '🏋️ Workouts are VIP', profile: '🎬 Live profiles are VIP' }[reason];
  openModal(`<div class="vip-sheet">
    <div class="vip-hero">👑</div>
    ${top ? `<p class="vip-why">${top}</p>` : ''}
    <h2 class="vip-title">Bloom VIP</h2>
    <p class="vip-price"><b>${VIP_PRICE}</b> / year <span class="muted small">· less than $2 a month</span></p>
    <div class="vip-perks">${VIP_PERKS.map(([e, t, d]) => `<div class="vip-perk"><span class="vp-e">${e}</span><div><b>${t}</b><p class="muted small">${d}</p></div></div>`).join('')}</div>
    ${isVip()
      ? `<div class="auth-note">👑 You're VIP${S.community?.is_dev ? ' forever (developer)' : S.community?.vip_until ? ' until ' + new Date(S.community.vip_until).toLocaleDateString() : ''}. Everything is open. Enjoy!</div>${S.community?.is_dev ? '' : '<button class="btn ghost big" id="vipManage">Manage or cancel my VIP</button>'}`
      : `<label class="small toggle-row vip-agree"><input type="checkbox" id="vipAgree"> I agree to the <a href="legal.html#vip" target="_blank" rel="noopener">VIP terms</a>. VIP starts right away, and I know I lose my 14-day withdrawal right once it starts.</label>
         <button class="btn big vip-btn" id="vipGo">👑 Get VIP · ${VIP_PRICE} / year</button>
         <button class="btn ghost big" id="vipLogin">Already VIP? Log in</button>`}
    <p class="muted small" style="text-align:center">🔒 Secure payment by Stripe. Renews yearly, cancel anytime in one tap.<br>Fasting, water, steps, Mochi and the community stay free forever.</p>
    <button class="btn ghost big" onclick="closeModal()">${isVip() ? 'Close' : 'Maybe later'}</button>
  </div>`, () => {
    if ($('#vipGo')) $('#vipGo').onclick = () => $('#vipAgree').checked ? vipBuy() : toast('Please tick the box first');
    if ($('#vipManage')) $('#vipManage').onclick = vipManage;
    if ($('#vipLogin')) $('#vipLogin').onclick = () => { closeModal(); showView('community'); setTimeout(() => { if (!$('#authPanel').hidden) renderAuth('login'); }, 900); };
  });
}

// ---------- paying with Stripe (server function "vip" holds the Stripe key) ----------
async function vipCall(action) {
  if (!navigator.onLine) throw new Error('offline');
  if (!(await commInit())) throw new Error('offline');
  const r = await sb.functions.invoke('vip', { body: { action, return: location.origin + location.pathname } });
  if (r.error) { let j = null; try { j = await r.error.context?.json?.(); } catch (e) {} throw new Error(j?.error || 'failed'); }
  return r.data;
}
const openOut = url => { if (window.Capacitor?.isNativePlatform?.()) window.open(url, '_blank'); else location.href = url; };

async function vipBuy() {
  S.vipWanted = S.vipWanted || Date.now(); save();
  const u = window.currentUser ? await currentUser().catch(() => null) : null;
  if (!isRealUser(u)) {
    return openModal(`<div class="vip-sheet"><div class="vip-hero">🔐</div><h2 class="vip-title">One quick step</h2>
      <p>Make a free Bloom account first, so your VIP is saved to it and works on every phone and computer.</p>
      <button class="btn big" id="vbAcc">Create my account</button><button class="btn ghost big" onclick="closeModal()">Later</button></div>`,
      () => { $('#vbAcc').onclick = () => { closeModal(); showView('community'); }; });
  }
  const btn = $('#vipGo'); if (btn) { btn.disabled = true; btn.textContent = 'Opening secure checkout…'; }
  try {
    const d = await vipCall('checkout');
    if (d.already) { await refreshVip(true); closeModal(); return toast('👑 You already have VIP!'); }
    S.vipPending = Date.now(); save();
    openOut(d.url);
    if (window.Capacitor?.isNativePlatform?.()) openModal(`<div class="vip-sheet"><div class="vip-hero">💳</div><h2 class="vip-title">Finish in your browser</h2>
      <p>Pay on the secure Stripe page that just opened. Then come back here and VIP turns on by itself.</p>
      <button class="btn big" id="vbDone">I paid ✨</button></div>`, () => { $('#vbDone').onclick = async () => { closeModal(); await refreshVip(true); if (!isVip()) toast('Not active yet. Give it a minute and tap the 👑 again.'); }; });
  } catch (e) {
    if (btn) { btn.disabled = false; btn.textContent = `👑 Get VIP · ${VIP_PRICE} / year`; }
    openModal(`<div class="vip-sheet"><div class="vip-hero">🎉</div><h2 class="vip-title">VIP is almost here!</h2>
      <p>${e.message === 'not_configured' ? 'Secure payments are being switched on right now. You\'ll be able to join very soon.' : e.message === 'offline' ? 'You\'re offline. Connect to the internet and try again.' : 'Couldn\'t open checkout. Try again in a moment.'}</p>
      <button class="btn big" onclick="closeModal()">Okay 💖</button></div>`);
  }
}

async function vipManage() {
  try { const d = await vipCall('portal'); openOut(d.url); }
  catch (e) { toast(e.message === 'no_customer' ? 'Your VIP was a gift, nothing to manage 🎁' : 'Couldn\'t open. Try again later.'); }
}

// refresh VIP status from the server (only if this phone already has a login)
async function refreshVip(force) {
  try {
    if (!navigator.onLine || !window.SUPA_URL) return;
    if (!Object.keys(localStorage).some(k => /^sb-.*-auth-token$/.test(k))) return;
    if (!(await commInit())) return;
    const u = (await sb.auth.getUser()).data.user;
    if (isRealUser(u) && (force || S.vipPending || Date.now() - (S.vipSync || 0) > 12 * 3600e3)) {
      try { await vipCall('sync'); S.vipSync = Date.now(); if (S.vipPending && Date.now() - S.vipPending > 3600e3) delete S.vipPending; save(); } catch (e) {}
    }
    const { data } = await sb.from('profiles').select('is_dev, vip_until, banner, name_fx, ring').eq('id', me).maybeSingle();
    if (!data) return;
    const was = isVip();
    Object.assign(comm(), data); save();
    if (was !== isVip()) { applyTheme(); renderAll(); if (isVip()) { delete S.vipPending; save(); celebrate(); toast('👑 Welcome to VIP!'); } }
  } catch (e) {}
}

$('#vipBtn').onclick = () => vipModal();
$('#analyzerBtn').onclick = () => bodyAnalyzer();

// ================= FULL BODY ANALYZER =================
const ACTIVITY = [[1.2, '🛋️ Mostly sitting'], [1.375, '🚶 Light (1 to 3 workouts a week)'], [1.55, '🏃 Active (3 to 5 a week)'], [1.725, '🔥 Very active (6 to 7 a week)']];
const PACES = [[0.25, 'Gentle · 0.25 kg/week'], [0.5, 'Steady · 0.5 kg/week'], [0.75, 'Fast · 0.75 kg/week'], [1, 'Max · 1 kg/week']];

function bodyAnalyzer() {
  if (!S.profile) return;
  if (!isVip()) return vipModal('analyzer');
  const b = S.bodyInfo || { act: 1.375, pace: 0.5, waist: '', neck: '', hip: '' };
  const female = S.profile.sex === 'female';
  openModal(`<h2>🔬 Full body analysis</h2>
    <p class="muted small">Measure with a soft tape, relaxed, in the morning. Waist at the belly button${female ? ', hips at the widest point' : ''}, neck below the Adam's apple. Leave empty if you don't know. We'll estimate.</p>
    <div class="row gap wrap">
      <div class="field"><label>Waist (cm)</label><input id="baWaist" type="number" step="0.5" value="${b.waist}"></div>
      <div class="field"><label>Neck (cm)</label><input id="baNeck" type="number" step="0.5" value="${b.neck}"></div>
      ${female ? `<div class="field"><label>Hips (cm)</label><input id="baHip" type="number" step="0.5" value="${b.hip}"></div>` : ''}
    </div>
    <div class="field"><label>How active are you?</label><div class="seg col" id="baAct">${ACTIVITY.map(([v, l]) => `<button type="button" data-v="${v}" class="${b.act == v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    <div class="field"><label>How fast do you want to lose?</label><div class="seg" id="baPace">${PACES.map(([v, l]) => `<button type="button" data-v="${v}" class="${b.pace == v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    <button class="btn big vip-btn" id="baGo">Analyze me ✨</button>`, m => {
    let act = b.act, pace = b.pace;
    m.querySelectorAll('#baAct button').forEach(x => x.onclick = () => { act = +x.dataset.v; m.querySelectorAll('#baAct button').forEach(y => y.classList.toggle('on', y === x)); });
    m.querySelectorAll('#baPace button').forEach(x => x.onclick = () => { pace = +x.dataset.v; m.querySelectorAll('#baPace button').forEach(y => y.classList.toggle('on', y === x)); });
    $('#baGo').onclick = () => {
      S.bodyInfo = { act, pace, waist: +$('#baWaist').value || '', neck: +$('#baNeck').value || '', hip: +($('#baHip')?.value || 0) || '', at: Date.now() };
      save(); showAnalysis();
    };
  });
}

function analyzeBody() {
  const p = S.profile, b = S.bodyInfo, w = kg(), h = p.height, m = h / 100, male = p.sex === 'male', female = p.sex === 'female';
  const BMI = w / (m * m);
  // body fat: US Navy tape formula if measured, otherwise estimated from BMI (Deurenberg)
  let fat, fatHow;
  if (b.waist && b.neck && (male ? b.waist > b.neck : b.hip && b.waist + b.hip > b.neck)) {
    fat = male
      ? 495 / (1.0324 - 0.19077 * Math.log10(b.waist - b.neck) + 0.15456 * Math.log10(h)) - 450
      : 495 / (1.29579 - 0.35004 * Math.log10(b.waist + b.hip - b.neck) + 0.221 * Math.log10(h)) - 450;
    fatHow = 'from your tape measurements (US Navy method)';
  } else {
    fat = 1.2 * BMI + 0.23 * p.age - 10.8 * (male ? 1 : 0) - 5.4;
    fatHow = 'estimated from BMI and age. Add waist and neck for a better number';
  }
  fat = Math.min(60, Math.max(3, fat));
  const cats = male ? [[6, 'Essential'], [14, 'Athlete'], [18, 'Fit'], [25, 'Average'], [99, 'High']] : [[14, 'Essential'], [21, 'Athlete'], [25, 'Fit'], [32, 'Average'], [99, 'High']];
  const fatCat = cats.find(([x]) => fat < x)[1];
  const fatKg = w * fat / 100, leanKg = w - fatKg;
  const lo = 18.5 * m * m, hi = 24.9 * m * m;
  const whtr = b.waist ? b.waist / h : null;
  const whtrTxt = !whtr ? null : whtr < 0.4 ? 'Very slim' : whtr < 0.5 ? 'Healthy ✅' : whtr < 0.6 ? 'Raised health risk' : 'High health risk';
  const BMR = bmr(), TDEE = BMR * (b.act || 1.375);
  const floor = male ? 1500 : 1200;
  let target = TDEE - b.pace * 1100, realPace = b.pace;
  if (target < floor) { target = floor; realPace = Math.max(0.1, (TDEE - floor) / 1100); }
  const toLose = Math.max(0, w - p.goal);
  const weeks = toLose / realPace, goalDate = new Date(Date.now() + weeks * 7 * 864e5);
  const protein = Math.round(1.6 * Math.min(w, Math.max(p.goal, hi)));
  const water = Math.min(4, Math.max(2, Math.round(w * 0.035 * 4) / 4));
  const deficitSteps = Math.round(300 / (w * 0.00057) / 500) * 500;
  return { BMI, fat, fatHow, fatCat, fatKg, leanKg, lo, hi, whtr, whtrTxt, BMR, TDEE, target, realPace, toLose, weeks, goalDate, protein, water, deficitSteps };
}

function showAnalysis() {
  const a = analyzeBody(), p = S.profile;
  const pct = Math.min(100, a.fat / 45 * 100);
  openModal(`<h2>🔬 Your body, decoded</h2>
    <div class="fat-gauge"><div class="fg-bar"><i style="left:${pct}%"></i></div>
      <div class="fg-num"><b>${a.fat.toFixed(1)}%</b> body fat · ${a.fatCat}</div>
      <p class="muted tiny">${a.fatHow}.</p></div>
    <div class="stats">
      <div class="stat"><b>${a.fatKg.toFixed(1)} kg</b><span>fat</span></div>
      <div class="stat"><b>${a.leanKg.toFixed(1)} kg</b><span>lean (muscle, bone, water)</span></div>
      <div class="stat"><b>${a.BMI.toFixed(1)}</b><span>BMI · ${bmiCat(a.BMI)}</span></div>
      <div class="stat"><b>${a.lo.toFixed(0)} to ${a.hi.toFixed(0)} kg</b><span>healthy weight for ${p.height} cm</span></div>
      <div class="stat"><b>${Math.round(a.BMR)}</b><span>kcal at total rest (BMR)</span></div>
      <div class="stat"><b>${Math.round(a.TDEE)}</b><span>kcal maintenance (no gain, no loss)</span></div>
      <div class="stat hi"><b>${Math.round(a.target)}</b><span>kcal a day to lose ${a.realPace.toFixed(2).replace(/0$/, '')} kg/week</span></div>
      <div class="stat"><b>${a.protein} g</b><span>protein a day to keep muscle</span></div>
      <div class="stat"><b>${a.water} L</b><span>water a day</span></div>
      ${a.whtr ? `<div class="stat"><b>${a.whtr.toFixed(2)}</b><span>waist to height · ${a.whtrTxt}</span></div>` : ''}
    </div>
    ${a.toLose > 0 ? `<div class="auth-note">🎯 <b>${a.toLose.toFixed(1)} kg</b> to your goal of ${p.goal} kg. At this pace you get there around <b>${a.goalDate.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</b> (${Math.ceil(a.weeks)} weeks). Fasting days make it faster.</div>`
      : `<div class="auth-note">🏆 You're at your goal weight. Eat around ${Math.round(a.TDEE)} kcal to stay here.</div>`}
    <p class="small">🚶 Walking an extra <b>${a.deficitSteps.toLocaleString()} steps</b> burns about 300 kcal more, every day.</p>
    <p class="muted tiny">Estimates from standard formulas (Mifflin-St Jeor, US Navy, WHO BMI). Not a medical test.</p>
    <div class="row gap"><button class="btn ghost" id="baEdit">✏️ Measurements</button><button class="btn" onclick="closeModal()">Done</button></div>`, () => {
    $('#baEdit').onclick = bodyAnalyzer;
  });
}

// ================= PROFILE CUSTOMIZER =================
const BANNERS = { aurora: '🌌 Aurora', sakura: '🌸 Sakura', galaxy: '🪐 Galaxy', neon: '🎤 Neon', gold: '✨ Gold', ocean: '🌊 Ocean', fire: '🔥 Fire', candy: '🍭 Candy' };
const NAME_FX = { gold: '✨ Gold', rainbow: '🌈 Rainbow', neon: '💗 Neon', ice: '❄️ Ice', fire: '🔥 Fire' };
const RINGS = { gold: '👑 Gold', rainbow: '🌈 Rainbow', neon: '💗 Neon', sakura: '🌸 Sakura' };
const isMediaUrl = s => /^(https?:\/\/|blob:)/.test(s || '');
const isVideoUrl = s => /\.(mp4|webm|mov)(\?|$)/i.test(s || '');

function bannerHTML(p) {
  if (!vipOf(p) || !p.banner) return '';
  if (isMediaUrl(p.banner)) return isVideoUrl(p.banner)
    ? `<div class="prof-banner"><video src="${esc(p.banner)}" autoplay muted loop playsinline></video></div>`
    : `<div class="prof-banner"><img src="${esc(p.banner)}" alt=""></div>`;
  return BANNERS[p.banner] ? `<div class="prof-banner bn-${p.banner}"><i></i><i></i><i></i></div>` : '';
}

function vipCustomizer() {
  if (!isVip()) return vipModal('profile');
  const c = comm(); let banner = c.banner || '', fx = c.name_fx || 'gold', ring = c.ring || '', file = null, fileUrl = null;
  const preview = () => {
    const p = { ...c, banner: fileUrl ? (file.type.startsWith('video') ? fileUrl + '#.mp4' : fileUrl) : banner, name_fx: fx, ring };
    $('#vcPrev').innerHTML = `${bannerHTML(p)}<div class="prof-view ${p.banner ? 'has-banner' : ''}">${avatarHTML(p, 'xl')}<h2>${nameHTML(p)}</h2></div>`;
  };
  openModal(`<h2>✨ My VIP style</h2>
    <div class="vc-prev" id="vcPrev"></div>
    <h3>🎬 Banner</h3>
    <div class="vc-grid" id="vcBan">
      <button type="button" data-b="" class="vc-b none">None</button>
      ${Object.entries(BANNERS).map(([k, n]) => `<button type="button" data-b="${k}" class="vc-b bn-${k}"><i></i><i></i><i></i><span>${n}</span></button>`).join('')}
      <button type="button" class="vc-b own" id="vcOwn">📷 My photo, GIF or video</button>
    </div>
    <input type="file" id="vcFile" accept="image/*,video/mp4,video/webm,video/quicktime" hidden>
    <p class="muted tiny">Your own banner: a photo, a GIF or a short video (max 8 MB). Videos play silently on loop.</p>
    <h3>💫 Name glow</h3>
    <div class="chips" id="vcFx">${Object.entries(NAME_FX).map(([k, n]) => `<button type="button" class="chip pick ${fx === k ? 'on' : ''}" data-f="${k}">${n}</button>`).join('')}</div>
    <h3>⭕ Avatar ring</h3>
    <div class="chips" id="vcRing"><button type="button" class="chip pick ${!ring ? 'on' : ''}" data-r="">None</button>${Object.entries(RINGS).map(([k, n]) => `<button type="button" class="chip pick ${ring === k ? 'on' : ''}" data-r="${k}">${n}</button>`).join('')}</div>
    <button class="btn big vip-btn" id="vcSave" style="margin-top:14px">Save my style</button>`, m => {
    const pick = (sel, attr, set) => m.querySelectorAll(sel).forEach(x => x.onclick = () => { set(x.dataset[attr]); m.querySelectorAll(sel).forEach(y => y.classList.toggle('on', y === x)); preview(); });
    pick('#vcBan [data-b]', 'b', v => { banner = v; file = null; fileUrl = null; });
    pick('#vcFx [data-f]', 'f', v => fx = v);
    pick('#vcRing [data-r]', 'r', v => ring = v);
    m.querySelectorAll('#vcBan [data-b]').forEach(x => x.classList.toggle('on', x.dataset.b === banner && !isMediaUrl(banner)));
    $('#vcOwn').classList.toggle('on', isMediaUrl(banner));
    $('#vcOwn').onclick = () => $('#vcFile').click();
    $('#vcFile').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      if (f.size > 8 * 1024 * 1024) return toast('Too big. Pick something under 8 MB');
      file = f; fileUrl = URL.createObjectURL(f);
      m.querySelectorAll('#vcBan .vc-b').forEach(y => y.classList.toggle('on', y.id === 'vcOwn')); preview();
    };
    preview();
    $('#vcSave').onclick = async () => {
      const btn = $('#vcSave'); btn.disabled = true; btn.textContent = 'Saving…';
      try {
        if (!(await commInit())) throw new Error('offline');
        let url = banner;
        if (file) {
          let blob = file, type = file.type, ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
          if (/image\/(jpeg|png|webp)/.test(type)) { blob = await (await fetch(await shrinkImage(file, 1400))).blob(); type = 'image/jpeg'; ext = 'jpg'; }
          const path = `${me}/banner-${Date.now()}.${ext}`;
          const up = await sb.storage.from('photos').upload(path, blob, { contentType: type });
          if (up.error) throw up.error;
          url = sb.storage.from('photos').getPublicUrl(path).data.publicUrl;
        }
        const old = isMediaUrl(c.banner) && c.banner !== url ? c.banner.split('/object/public/photos/')[1] : null;
        Object.assign(c, { banner: url || null, name_fx: fx, ring: ring || null });
        const r = await saveProfileRemote(); if (r.error) throw r.error;
        if (old && decodeURIComponent(old).startsWith(me + '/')) sb.storage.from('photos').remove([decodeURIComponent(old)]);
        save(); celebrate(); toast('Your VIP style is live ✨'); showProfile(me);
      } catch (e) { btn.disabled = false; btn.textContent = 'Save my style'; toast('Couldn\'t save. Check your internet.'); }
    };
  });
}

// back from Stripe checkout
(function vipReturn() {
  const q = new URLSearchParams(location.search).get('vip'); if (!q) return;
  history.replaceState(null, '', location.pathname);
  if (q === 'cancel') return toast('No worries, nothing was charged 💖');
  S.vipPending = Date.now(); save();
  openModal(`<div class="vip-sheet"><div class="vip-hero">👑</div><h2 class="vip-title">Thank you!</h2><p>Turning on your VIP…</p></div>`);
  let n = 0; const t = setInterval(async () => { n++; await refreshVip(true); if (isVip() || n > 8) { clearInterval(t); closeModal(); if (isVip()) vipModal(); else toast('Payment received. VIP will turn on in a minute.'); } }, 2500);
})();
document.addEventListener('visibilitychange', () => { if (!document.hidden && S.vipPending) refreshVip(true); });
refreshVip();
