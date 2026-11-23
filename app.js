// ================= STATE =================
const KEY = 'bloom-state-v1';
const $ = s => document.querySelector(s);
const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let S = load();
function load() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  const st = Object.assign({
    profile: null, theme: 'kawaii', persona: 'sweet', evilAgreed: false, fast: null, history: [], weights: [],
    templates: JSON.parse(JSON.stringify(DEFAULT_TEMPLATES)), templateId: 'student',
    today: null, days: {}, chat: [], wf: { level: 'all', goal: 'loss', who: '', kpop: false },
    settings: { emergency: '112', stepGoal: 10000 }
  }, s || {});
  // v2: replace the old built-in plans with example plans
  if (!st.v2) {
    st.templates = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES)); st.templateId = 'student'; st.today = null; st.v2 = true;
    if (!st.persona) st.persona = 'sweet';
    if (!st.wf) st.wf = { level: 'all', goal: 'loss', who: '', kpop: false };
  }
  // v3: water now has its own goal + reminders, so take the fixed water items out of plans
  if (!st.v3) {
    for (const t of Object.values(st.templates || {})) {
      t.items = (t.items || []).filter(i => !/^water\b/i.test(i.title)).map(i => ({ ...i, title: i.title.replace(/\s*\+\s*water.*$/i, '') }));
    }
    st.today = null; st.v3 = true;
  }
  return st;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function day(k = todayKey()) {
  if (!S.days[k]) S.days[k] = { steps: 0, workouts: [], sleep: 7, intake: 0, checks: [] };
  if (!S.days[k].checks) S.days[k].checks = [];
  return S.days[k];
}

// ================= HELPERS =================
// animate numbers counting up
function countUp(root) {
  root.querySelectorAll('[data-count]').forEach(el => {
    const to = +el.dataset.count, t0 = performance.now(), dur = 900;
    const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e).toLocaleString(); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
// little confetti burst for wins
function celebrate() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const colors = [css('--accent'), css('--accent2'), css('--accent3'), '#ffd24d', '#ffffff'];
  const box = document.createElement('div'); box.className = 'confetti'; document.body.appendChild(box);
  for (let i = 0; i < 70; i++) {
    const p = document.createElement('i');
    p.style.left = (50 + (Math.random() - .5) * 30) + '%';
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--dx', ((Math.random() - .5) * 120) + 'vw');
    p.style.setProperty('--dy', (-40 - Math.random() * 50) + 'vh');
    p.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
    p.style.animationDelay = (Math.random() * .15) + 's';
    box.appendChild(p);
  }
  setTimeout(() => box.remove(), 2200);
}
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600);
}
function openModal(html, onMount) {
  $('#modal').innerHTML = html; $('#modalBack').classList.add('show');
  if (onMount) onMount($('#modal'));
}
function closeModal() { $('#modalBack').classList.remove('show'); stopAlarmSound(); }
$('#modalBack').addEventListener('click', e => { if (e.target.id === 'modalBack' && !$('#modalBack').dataset.lock) closeModal(); });

const fmtHMS = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60].map(n => String(n).padStart(2, '0')).join(':'); };
const fmtDur = h => h < 48 ? `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m` : `${Math.floor(h / 24)}d ${Math.floor(h % 24)}h`;
const kg = () => (S.weights.length ? S.weights[S.weights.length - 1].kg : S.profile?.weight) || 70;
// VIP: the developer always counts as VIP
const vipOf = p => !!p && (!!p.is_dev || (!!p.vip_until && new Date(p.vip_until) > new Date()));
const isVip = () => vipOf(S.community);
const fastHours = () => S.fast ? (Date.now() - S.fast.start) / 3600000 : 0;

// ================= BODY MATH =================
function bmi() { const p = S.profile; if (!p) return 0; const m = p.height / 100; return kg() / (m * m); }
function bmiCat(b) { return b < 18.5 ? 'Underweight' : b < 25 ? 'Healthy' : b < 30 ? 'Overweight' : 'Obese'; }
function bmr() {
  const p = S.profile; if (!p) return 1600;
  const base = 10 * kg() + 6.25 * p.height - 5 * p.age;
  return base + (p.sex === 'male' ? 5 : p.sex === 'female' ? -161 : -78);
}
const stepKcal = steps => steps * kg() * 0.00057;
const workoutKcal = (w, min) => w.met * kg() * (min / 60);
function burnToday() {
  const d = day(), perH = bmr() / 24;
  const sleep = d.sleep * perH * 0.95;
  const rest = (24 - d.sleep) * perH * 1.1;
  const steps = stepKcal(d.steps);
  const work = d.workouts.reduce((a, w) => a + w.kcal, 0);
  return { sleep, rest, steps, work, total: sleep + rest + steps + work, intake: d.intake || 0 };
}

// ================= THEME =================
const THEMES = {
  kawaii: { name: 'Kawaii', desc: 'Soft pastel pink, sakura petals, super cute', mascot: '🌸', color: '#ff8fb8', bg: 'linear-gradient(135deg,#fff0f6,#f3e8ff)', fg: '#5b3a4a', font: "'Nunito'" },
  dark:   { name: 'Dark Classic', desc: 'Elegant black and gold, art deco', mascot: '✦', color: '#0d0d10', bg: '#111', fg: '#d4af37', font: "'Playfair Display'" },
  ocean:  { name: 'Ocean', desc: 'Calm blue waves and bubbles', mascot: '🐳', color: '#2b8fd6', bg: 'linear-gradient(135deg,#e6f6ff,#cdeeff)', fg: '#0d4a74', font: "'Quicksand'" },
  matcha: { name: 'Matcha', desc: 'Fresh green tea and leaves', mascot: '🍵', color: '#6aa84f', bg: 'linear-gradient(135deg,#f3f8ec,#e3f0d6)', fg: '#2f4a22', font: "'Fredoka'" },
  peach:  { name: 'Peach Sunset', desc: 'Warm peach, orange and golden sun', mascot: '🍑', color: '#ff8a5c', bg: 'linear-gradient(135deg,#fff3ea,#ffe0cc)', fg: '#7a3418', font: "'Pacifico'" },
  galaxy: { name: 'Galaxy', desc: 'Deep space, stars and planets', mascot: '🪐', color: '#1a1033', bg: 'linear-gradient(135deg,#140c2e,#2a1650)', fg: '#c9b6ff', font: "'Orbitron'" },
  neon:   { name: 'K-pop Neon', desc: 'Concert lights, hot pink and cyan', mascot: '🎤', color: '#0b0b12', bg: 'linear-gradient(135deg,#0b0b12,#1a0b1f)', fg: '#ff4fd8', font: "'Bungee'" },
  goddess: { name: 'Greek Goddess', desc: 'White marble, gold and laurel. Divine.', mascot: '🏛️', color: '#c9a227', bg: 'linear-gradient(135deg,#fffaf0,#efe4c8)', fg: '#6b5320', font: "'Cinzel'" },
  rosegold: { name: 'Rose Gold Luxe', desc: 'Champagne, rose gold and diamonds', mascot: '💎', color: '#b76e79', bg: 'linear-gradient(135deg,#fff6f2,#f6dcd3)', fg: '#5a2f33', font: "'Playfair Display'" },
  sakuranight: { name: 'Midnight Sakura', desc: 'Moonlit night with falling petals', mascot: '🌙', color: '#141a38', bg: 'linear-gradient(135deg,#141a38,#2d1d48)', fg: '#ffb3d1', font: "'Fredoka'" },
  angel: { name: 'Angel', desc: 'Heavenly white, gold halos, feathers and soft light', mascot: '👼', color: '#d4af37', bg: 'radial-gradient(circle at 50% 0%,#ffffff,#fff4d6 45%,#e9efff)', fg: '#4a4560', font: "'Great Vibes'" },
  dollhouse: { name: 'Dollhouse Pink', desc: 'Hot pink gingham, bows and doll glam', mascot: '🎀', color: '#ff3d9a', bg: 'linear-gradient(135deg,#ffd1e8,#fff5fa)', fg: '#8a1650', font: "'Lobster'" },
  animesky: { name: 'Anime Sky', desc: 'Big blue sky and fluffy drifting clouds', mascot: '☁️', color: '#3fa2ff', bg: 'linear-gradient(180deg,#6fc3ff,#fff4e0)', fg: '#173a63', font: "'Dela Gothic One'" },
  blackdiamond: { name: 'Black Diamond', desc: 'Pure black luxury with platinum shine', mascot: '💎', color: '#050507', bg: 'linear-gradient(135deg,#050507,#23232b)', fg: '#e8e8f0', font: "'Bebas Neue'" },
  y2k: { name: 'Y2K Butterfly', desc: 'Holographic chrome, sparkles and butterflies', mascot: '🦋', color: '#9b5cff', bg: 'linear-gradient(125deg,#c9f7ff,#ffd6f9,#e6ffb3)', fg: '#2b1c5a', font: "'Audiowide'" },
  cherrycola: { name: 'Cherry Cola', desc: 'Deep cherry red, fizzy bubbles, retro diner', mascot: '🍒', color: '#7a0f22', bg: 'linear-gradient(135deg,#3b0710,#7a0f22)', fg: '#ffcf6b', font: "'Shrikhand'" },
  mermaid: { name: 'Mermaid Lagoon', desc: 'Turquoise water, shimmering scales and shells', mascot: '🧜‍♀️', color: '#12b5a6', bg: 'linear-gradient(160deg,#c8fff6,#e1d6ff)', fg: '#164a5a', font: "'Sail'" },
  lavender: { name: 'Lavender Fields', desc: 'Soft purple flower fields and calm', mascot: '💜', color: '#9b7ede', bg: 'linear-gradient(180deg,#efe6ff,#eef7e8)', fg: '#4b3a6b', font: "'Dancing Script'" },
  vaporwave: { name: 'Vaporwave', desc: 'Retro 80s sunset grid, palms and neon', mascot: '🌴', color: '#1a0933', bg: 'linear-gradient(180deg,#1a0933,#ff71ce)', fg: '#01cdfe', font: "'Monoton'" },
  academia: { name: 'Dark Academia', desc: 'Old library, candlelight, books and autumn leaves', mascot: '📜', color: '#2b2118', bg: 'linear-gradient(135deg,#1c150f,#4a3828)', fg: '#c9a46a', font: "'IM Fell English'" },
  simple: { name: 'Simple', desc: 'Clean, no distractions', mascot: '', color: '#2563eb', bg: '#fff', fg: '#1d2430', font: 'system-ui' }
};
const VIP_THEMES = Object.keys(THEMES).filter(k => k !== 'kawaii'); // only Kawaii is free
const UPCOMING_THEMES = [['🧚', 'Fairy Garden'], ['🍓', 'Strawberry Milk'], ['🌌', 'Northern Lights']];
// each theme's own fonts, loaded only when that theme is used
const THEME_FONTS = {"kawaii": "family=Mochiy+Pop+One&family=Nunito:wght@400;700", "dark": "family=Playfair+Display:wght@400;700&family=Inter:wght@400;700", "ocean": "family=Comfortaa:wght@400;700&family=Quicksand:wght@400;700", "matcha": "family=Fredoka:wght@400;700&family=Karla:wght@400;700", "peach": "family=Pacifico&family=Poppins:wght@400;700", "galaxy": "family=Orbitron:wght@400;700&family=Space+Grotesk:wght@400;700", "neon": "family=Bungee&family=Rubik:wght@400;700", "goddess": "family=Cinzel:wght@400;700&family=Lora:wght@400;700&family=Cinzel+Decorative", "rosegold": "family=Bodoni+Moda:wght@400;700&family=Jost:wght@400;700", "sakuranight": "family=Kaisei+Decol&family=Zen+Maru+Gothic:wght@400;700", "simple": "", "angel": "family=Marcellus&family=Cormorant+Garamond:wght@400;700&family=Great+Vibes", "dollhouse": "family=Lobster&family=Varela+Round", "animesky": "family=Dela+Gothic+One&family=M+PLUS+Rounded+1c:wght@400;700", "blackdiamond": "family=Bebas+Neue&family=Montserrat:wght@400;700", "y2k": "family=Audiowide&family=Chakra+Petch:wght@400;700", "cherrycola": "family=Shrikhand&family=DM+Sans:wght@400;700", "mermaid": "family=Sail&family=Mulish:wght@400;700", "lavender": "family=Dancing+Script:wght@400;700&family=Nunito+Sans:wght@400;700", "vaporwave": "family=Righteous&family=Share+Tech+Mono&family=Monoton", "academia": "family=IM+Fell+English&family=EB+Garamond:wght@400;700"};
function loadThemeFonts(keys) {
  const q = keys.map(k => THEME_FONTS[k]).filter(Boolean).join('&'); if (!q) return;
  const id = 'tf-' + keys.join('-').slice(0, 60); if (document.getElementById(id)) return;
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.id = id; l.href = 'https://fonts.googleapis.com/css2?' + q + '&display=swap'; document.head.appendChild(l);
}
const theme = () => THEMES[S.theme] || THEMES.kawaii;
function applyTheme() {
  if (!THEMES[S.theme] || (VIP_THEMES.includes(S.theme) && !isVip())) S.theme = 'kawaii';
  document.documentElement.dataset.theme = S.theme; loadThemeFonts([S.theme]);
  document.querySelector('meta[name=theme-color]').content = theme().color;
  const b = BUDDY[S.persona] || BUDDY.sweet; $('#buddyFace').textContent = b.face; $('#buddyName').textContent = b.name;
}
$('#themeBtn').onclick = () => (loadThemeFonts(Object.keys(THEMES)), openModal(`
  <h2>Choose your style</h2>
  <div class="theme-grid">${Object.entries(THEMES).map(([k, t]) => `
    <button data-t="${k}" class="theme-card ${S.theme === k ? 'on' : ''}" style="background:${t.bg};color:${t.fg}">
      <span class="tc-art" data-theme="${k}"></span>
      <span class="tc-name" style="font-family:${t.font},sans-serif">${t.mascot} ${t.name}</span>
      <span class="tc-desc">${t.desc}</span>${VIP_THEMES.includes(k) ? `<span class="tc-vip">${isVip() ? '👑 VIP' : '🔒 VIP'}</span>` : ''}
    </button>`).join('')}
    ${UPCOMING_THEMES.map(([e, n]) => `<div class="theme-card soon"><span class="tc-vip">⏳ Soon</span><span class="tc-name">${e} ${n}</span><span class="tc-desc">Coming for VIP</span></div>`).join('')}</div>
  ${isVip() ? '' : '<button class="btn big vip-btn" id="thVip">👑 Unlock all themes with VIP</button>'}`, m => {
    m.querySelectorAll('[data-t]').forEach(b => b.onclick = () => {
      if (VIP_THEMES.includes(b.dataset.t) && !isVip()) return vipModal('themes');
      S.theme = b.dataset.t; save(); applyTheme(); renderAll(); closeModal();
    });
    if ($('#thVip')) $('#thVip').onclick = () => vipModal('themes');
  }));

// ================= NAV =================
document.querySelectorAll('.tabbar button').forEach(b => b.onclick = () => showView(b.dataset.view));
const VIEW_ORDER = ['home', 'plan', 'body', 'move', 'community', 'chat'];
let curView = 'home';
function showView(v) {
  const dir = VIEW_ORDER.indexOf(v) >= VIEW_ORDER.indexOf(curView) ? 'in-right' : 'in-left';
  curView = v;
  document.querySelectorAll('.tabbar button').forEach(x => x.classList.toggle('active', x.dataset.view === v));
  document.querySelectorAll('.view').forEach(x => { const on = x.id === 'view-' + v; x.classList.remove('in-right', 'in-left'); x.classList.toggle('active', on); if (on) { void x.offsetWidth; x.classList.add(dir); } });
  if (v === 'body') renderBody();
  if (v === 'plan') { renderWater(); if (!S.water?.goal && !S.waterPrompted) { S.waterPrompted = true; save(); waterGoalModal(true); } }
  if (v === 'community') renderCommunity();
  if (v === 'chat') { renderChat(); setTimeout(() => $('#chatLog').scrollTop = 1e9, 30); }
  window.scrollTo(0, 0);
}

// ================= ONBOARDING / SETTINGS =================
function profileForm(first) {
  const p = S.profile || { name: '', sex: 'female', age: 25, height: 165, weight: 75, goal: 65 };
  openModal(`
    <h2>${first ? 'Welcome to Bloom 🌸' : 'Your profile & settings'}</h2>
    ${first ? '<p class="muted">Let\'s get to know you so I can calculate your BMI and calories. Everything stays on this device.</p>' : ''}
    <div class="field"><label>Name</label><input id="pName" value="${esc(p.name)}"></div>
    <div class="field"><label>Sex (for calorie math)</label><div class="seg" id="pSex">
      ${['female', 'male', 'other'].map(x => `<button type="button" data-v="${x}" class="${p.sex === x ? 'on' : ''}">${x}</button>`).join('')}</div></div>
    <div class="row gap">
      <div class="field"><label>Age</label><input id="pAge" type="number" value="${p.age}"></div>
      <div class="field"><label>Height (cm)</label><input id="pHeight" type="number" value="${p.height}"></div>
    </div>
    <div class="row gap">
      <div class="field"><label>Weight now (kg)</label><input id="pWeight" type="number" step="0.1" value="${first ? p.weight : kg()}"></div>
      <div class="field"><label>Goal weight (kg)</label><input id="pGoal" type="number" step="0.1" value="${p.goal}"></div>
    </div>
    <div class="row gap">
      <div class="field"><label>Daily step goal</label><input id="pSteps" type="number" value="${S.settings.stepGoal}"></div>
      <div class="field"><label>Emergency number</label><input id="pEmerg" value="${esc(S.settings.emergency)}"></div>
    </div>
    ${first ? '' : `<div class="field"><label>Fasting messages</label>${msgEverySeg()}</div>
    ${window.Capacitor?.isNativePlatform?.() ? '' : '<div class="field"><a class="btn ghost" href="install.html" style="display:block;text-align:center;text-decoration:none">📲 Get the Android app / install on iPhone</a></div>'}
    <div class="field"><button type="button" class="btn ghost" id="pWater">💧 Water goal: ${S.water?.goal ? S.water.goal / 1000 + ' L' : 'not set'}</button></div>`}
    <div class="warnbox">Fasting isn't safe for everyone. Please talk to a doctor first if you are pregnant/breastfeeding, under 18, have diabetes, heart or kidney problems, take medication, or have a history of eating disorders.</div>
    <button class="btn big" id="pSave">${first ? 'Calculate & start 🌱' : 'Save'}</button>
    ${first ? '<p class="muted small" style="text-align:center">By continuing you agree to the <a href="legal.html#terms" target="_blank" rel="noopener">Terms</a> and <a href="legal.html#privacy" target="_blank" rel="noopener">Privacy policy</a>. Bloom is for adults 18+.</p>' : '<div class="row gap wrap" style="margin-top:12px"><button class="btn ghost" id="pExport">⬇️ Backup data</button><button class="btn ghost" id="pImport">⬆️ Restore</button><button class="btn ghost" id="pReset" style="color:var(--danger)">Reset all</button></div><button class="btn ghost big" id="pDelAcc" style="margin-top:10px;color:var(--danger)">🗑️ Delete my account</button>' + legalLinks()}
  `, m => {
    let sex = p.sex;
    if (!first) { hookMsgEvery(m); $('#pWater').onclick = () => waterGoalModal(); }
    m.querySelectorAll('#pSex button').forEach(b => b.onclick = () => { sex = b.dataset.v; m.querySelectorAll('#pSex button').forEach(x => x.classList.toggle('on', x === b)); });
    $('#pSave').onclick = () => {
      const w = +$('#pWeight').value;
      S.profile = { name: $('#pName').value.trim(), sex, age: +$('#pAge').value, height: +$('#pHeight').value, weight: first ? w : (S.profile.weight || w), goal: +$('#pGoal').value };
      S.settings.stepGoal = +$('#pSteps').value || 10000;
      S.settings.emergency = $('#pEmerg').value.trim() || '112';
      if (first || !S.weights.length || S.weights[S.weights.length - 1].kg !== w) addWeight(w);
      delete $('#modalBack').dataset.lock;
      save(); closeModal(); renderAll();
      if (first) showBmiIntro();
    };
    if (!first) {
      $('#pExport').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' })); a.download = 'bloom-backup.json'; a.click(); };
      $('#pImport').onclick = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.json'; i.onchange = async () => { try { S = Object.assign(load(), JSON.parse(await i.files[0].text())); save(); location.reload(); } catch (e) { toast('That file did not work'); } }; i.click(); };
      $('#pDelAcc').onclick = deleteAccountModal;
      $('#pReset').onclick = () => { if (confirm('Delete ALL Bloom data on this device? This cannot be undone.')) { localStorage.removeItem(KEY); location.reload(); } };
    }
  });
  if (first) $('#modalBack').dataset.lock = '1';
}
function showBmiIntro() {
  const b = bmi(), toLose = Math.max(0, kg() - S.profile.goal);
  openModal(`<h2>Your starting point</h2>
    <div class="stats">
      <div class="stat"><b>${b.toFixed(1)}</b><span>BMI · ${bmiCat(b)}</span></div>
      <div class="stat"><b>${Math.round(bmr())}</b><span>kcal/day your body burns at rest</span></div>
      <div class="stat"><b>${toLose.toFixed(1)} kg</b><span>to your goal</span></div>
    </div>
    <p>Every hour you fast, your body uses about <b>${Math.round(bmr() / 24)} kcal</b> just to keep you alive, and more when you walk and work out. I'll show you exactly where you are, every hour. 💕</p>
    <button class="btn big" onclick="closeModal()">Let's go!</button>`);
}
$('#settingsBtn').onclick = () => profileForm(false);

// ================= FAST =================
const MSG_OPTS = [[1, 'Every hour'], [4, 'Every 4 hours'], [5, 'Every 5 hours'], [24, 'Once a day']];
const msgEvery = () => S.settings.msgEvery || 4;
function msgEverySeg() {
  return `<div class="seg" id="msgEvery">${MSG_OPTS.map(([v, l]) => `<button type="button" data-v="${v}" class="${msgEvery() === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
}
function hookMsgEvery(m) {
  m.querySelectorAll('#msgEvery button').forEach(b => b.onclick = () => {
    S.settings.msgEvery = +b.dataset.v; save();
    m.querySelectorAll('#msgEvery button').forEach(x => x.classList.toggle('on', x === b));
  });
}
// should the fasting message for hour h be sent?
const msgDue = h => h > 0 && h % msgEvery() === 0;

function startFastModal() {
  let type = 'dirty', goal = 168;
  const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  openModal(`<h2>Start a fast</h2>
    <div class="field"><label>Type</label><div class="seg" id="fType">
      ${Object.entries(FAST_TYPES).map(([k, v]) => `<button type="button" data-v="${k}" class="${k === type ? 'on' : ''}">${v.name}</button>`).join('')}</div>
      <p class="small muted" id="fTypeDesc"></p></div>
    <div class="field"><label>Goal</label><div class="seg" id="fGoal">
      ${FAST_GOALS.map(h => `<button type="button" data-v="${h}" class="${h === goal ? 'on' : ''}">${h < 48 ? h + 'h' : h / 24 + 'd'}</button>`).join('')}
      <button type="button" data-v="custom">✏️ Custom</button></div>
      <div class="row gap" id="fCustom" hidden style="margin-top:8px">
        <label class="small">Days (max 15)<input type="number" id="fDays" min="0" max="15" value="10"></label>
        <label class="small">+ hours<input type="number" id="fHours" min="0" max="23" value="0"></label>
      </div></div>
    <div class="field"><label>Fasting messages</label>${msgEverySeg()}</div>
    <div class="field"><label>Started at (only change this if you started earlier)</label><input type="datetime-local" id="fStart" value="${now.toISOString().slice(0, 16)}"></div>
    <div class="field"><label>Why are you fasting? (Mochi reminds you when it's hard)</label><input id="fReason" placeholder="e.g. religious reasons, spirituality, weight loss" value="${esc(S.lastReason || '')}"></div>
    <div class="warnbox" id="fWarn"></div>
    <label class="small" id="fLongOk" hidden style="flex-direction:row;align-items:center;gap:8px;margin-bottom:10px"><input type="checkbox" id="fLongChk" style="width:auto"> I'm 18+, I understand fasts over 3 days (max 15) carry real health risks, a doctor should check me first, and I do this at my own risk as in the <a href="legal.html#terms" target="_blank" rel="noopener">Terms</a>.</label>
    <button class="btn big" id="fGo">Start fasting ✨</button>`, m => {
    let edited = false, custom = false;
    $('#fStart').oninput = () => { edited = true; };
    hookMsgEvery(m);
    const readCustom = () => Math.min(360, Math.max(1, (+$('#fDays').value || 0) * 24 + (+$('#fHours').value || 0)));
    const upd = () => {
      if (custom) goal = readCustom();
      $('#fTypeDesc').textContent = FAST_TYPES[type].desc + ' Allowed: ' + FAST_TYPES[type].allowed.join(', ');
      $('#fWarn').style.display = goal > 72 ? '' : 'none';
      $('#fWarn').innerHTML = goal > 168
        ? `<b>${(goal / 24).toFixed(goal % 24 ? 1 : 0)} days is a very long fast.</b> Past 7 days the risk of electrolyte problems and refeeding syndrome goes up a lot. Please get a doctor's OK, take electrolytes every day, rest a lot, and break the fast very slowly. Mochi will check on you often.`
        : `Fasts longer than 3 days: take electrolytes daily (salt, potassium, magnesium), keep workouts gentle from day 3, and break the fast slowly. Fasts over 5 days are best done with a doctor's OK.`;
      $('#fLongOk').hidden = goal <= 72;
    };
    m.querySelectorAll('#fType button').forEach(b => b.onclick = () => { type = b.dataset.v; m.querySelectorAll('#fType button').forEach(x => x.classList.toggle('on', x === b)); upd(); });
    m.querySelectorAll('#fGoal button').forEach(b => b.onclick = () => {
      custom = b.dataset.v === 'custom'; $('#fCustom').hidden = !custom;
      if (!custom) goal = +b.dataset.v;
      m.querySelectorAll('#fGoal button').forEach(x => x.classList.toggle('on', x === b)); upd();
    });
    $('#fDays').oninput = $('#fHours').oninput = () => {
      if (+$('#fDays').value > 15) $('#fDays').value = 15;
      if (+$('#fDays').value === 15) $('#fHours').value = 0;
      upd();
    };
    upd();
    $('#fGo').onclick = () => {
      if (goal > 72 && !$('#fLongChk').checked) return toast('Please accept the risk agreement first');
      if (goal > 72) S.longFastAgreed = Date.now();
      const picked = new Date($('#fStart').value).getTime();
      const st = edited && picked ? Math.min(picked, Date.now()) : Date.now();
      S.lastReason = $('#fReason').value.trim();
      S.fast = { type, goal, start: st, reason: S.lastReason, lastHour: Math.floor((Date.now() - st) / 3600000) };
      save(); closeModal(); renderAll(); askNotify();
      toast('Fast started. You\'ve got this! 💪');
    };
  });
}
function endFast() {
  if (S.fast && fastHours() < S.fast.goal) return showVision({ breaking: true, onStop: endFastConfirm });
  endFastConfirm();
}
function endFastConfirm() {
  const h = fastHours();
  openModal(`<h2>End your fast?</h2>
    <p>You fasted <b>${fmtDur(h)}</b> of your ${S.fast.goal}h goal. ${h >= S.fast.goal ? '🎉 Goal reached!' : 'Ending early for your health is always okay. 💕'}</p>
    ${h > 72 ? '<div class="warnbox"><b>Break it gently:</b> start with broth or a small soft meal (eggs, yogurt, soup). Wait 1 to 2 hours before eating more. Avoid big sugary/carb meals for the first day. After long fasts this can be dangerous (refeeding syndrome).</div>' : ''}
    <div class="row gap"><button class="btn ghost" onclick="closeModal()">Keep going</button><button class="btn danger" id="fEnd">End fast</button></div>`, () => {
    $('#fEnd').onclick = () => {
      S.history.unshift({ type: S.fast.type, start: S.fast.start, end: Date.now(), hours: h, goal: S.fast.goal });
      S.fast = null; save(); closeModal(); renderAll(); toast(`Fast complete: ${fmtDur(h)} 🌟`);
    };
  });
}
function stageModal(h) {
  const s = stageFor(h + 0.01);
  openModal(`<div class="stage-hour">Hour ${h}${h >= 24 ? ' · Day ' + (Math.floor(h / 24) + 1) : ''}</div>
    <h2>${s.emoji} ${s.name}</h2><p>${s.body}</p>
    <div class="stage-fact">${s.fact}</div><p><b>Tip:</b> ${s.tip}</p>
    <p class="muted small">Approx. fat used by your body by this hour: ~${Math.round(h * bmr() / 24 * 1.1 * 0.7 / 9)} g (rough estimate)</p>
    <button class="btn big" onclick="closeModal()">Got it</button>`);
}

function renderFast() {
  const h = fastHours(), f = S.fast;
  const ring = $('#ringFg'), C = 540.35;
  if (!f) {
    ring.style.strokeDashoffset = C;
    $('#fastTime').textContent = '00:00:00';
    $('#fastLabel').textContent = 'Not fasting';
    $('#stageEmoji').textContent = '🌱';
    if ($('#startFastBtn')) return;
    $('#fastControls').innerHTML = `<button class="btn big" id="startFastBtn">Start fast</button>`;
    $('#startFastBtn').onclick = startFastModal;
    $('#stageCard').innerHTML = `<h3>🌱 Ready when you are</h3><p>Start a fast and every hour I'll tell you exactly what your body is doing and keep you motivated.</p>`;
    $('#timeline').innerHTML = '';
    return;
  }
  const s = stageFor(h);
  ring.style.strokeDashoffset = C * (1 - Math.min(1, h / f.goal));
  $('#fastTime').textContent = fmtHMS(Date.now() - f.start);
  $('#fastLabel').textContent = `${FAST_TYPES[f.type].name} · ${Math.min(100, h / f.goal * 100).toFixed(1)}% of ${f.goal < 48 ? f.goal + 'h' : f.goal / 24 + ' days'}`;
  $('#stageEmoji').textContent = s.emoji;
  if (!$('#endFastBtn')) {
    $('#fastControls').innerHTML = `<div class="row gap wrap" style="justify-content:center"><button class="btn ghost" id="endFastBtn">End fast</button><button class="btn ghost" id="checkBtn">🩺 Body check</button><button class="btn ghost" id="shareBtn">📸 Share</button><button class="btn" id="talkBtn">💬 Help me stay strong</button></div>`;
    $('#endFastBtn').onclick = endFast;
    $('#checkBtn').onclick = bodyCheck;
    $('#shareBtn').onclick = shareCard;
    $('#talkBtn').onclick = () => showVision({ breaking: true, onStop: () => { showView('chat'); sendChat('I want to break my fast'); } });
  }
  const hr = Math.floor(h);
  if ($('#stageCard').dataset.hr !== String(hr)) {
    $('#stageCard').dataset.hr = hr;
    const left = f.goal - h, burned = h * bmr() / 24 * 1.1;
    const sci = scienceFor(h), meters = bodyMeters(h), n = hypeNums();
    $('#stageCard').innerHTML = `
      <div class="stage-hour">Hour ${hr}${hr >= 24 ? ' · Day ' + (Math.floor(h / 24) + 1) : ''} · next update in ${60 - new Date().getMinutes()} min</div>
      <div class="hype pop-in">${esc(hypeFor(n))}</div>
      <div class="stat-row">
        <div class="mini-stat"><b data-count="${n.kcal}">0</b><span>kcal burned</span></div>
        <div class="mini-stat"><b data-count="${n.fatG}">0</b><span>g fat used</span></div>
        <div class="mini-stat"><b>${left > 0 ? fmtDur(left) : '🎉'}</b><span>${left > 0 ? 'to go' : 'goal reached'}</span></div>
      </div>
      <h3 class="stage-title">${s.emoji} ${s.name}</h3>
      <p>${s.body}</p>
      <div class="stage-fact"><b>Right now:</b> ${s.fact}</div>
      <div class="meters">${meters.map((m, i) => `<div class="meter" style="--d:${i * 70}ms"><span class="m-name">${m.emoji} ${m.name}${m.est ? '*' : ''}</span><span class="m-bar"><i class="${m.trend}" style="--w:${Math.round(m.v)}%"></i></span><span class="m-arrow ${m.trend}">${m.trend === 'up' ? '▲' : '▼'}</span></div>`).join('')}
        <p class="muted tiny">Estimates from research averages, not measured. *Cell clean-up timing in humans is still being studied.</p></div>
      <div class="science"><div class="sci-tag">🔬 Science says</div><p>${sci.study.text}</p><div class="sci-src">${sci.study.src}</div></div>
      <p class="feel"><b>You might feel:</b> ${sci.feel}</p>
      <p class="stage-motiv">${s.motivation}</p>
      <p><b>Do this now:</b> ${s.tip}</p>
      <div class="chips">
        ${f.reason ? `<span class="chip">💭 ${esc(f.reason)}</span>` : ''}
      </div>`;
    countUp($('#stageCard'));
    // timeline
    const max = Math.min(f.goal, 360), step = max > 168 ? 12 : max > 72 ? 6 : max > 36 ? 2 : 1;
    let tl = '';
    for (let i = 0; i <= max; i += step) {
      const st = stageFor(i + 0.01);
      tl += `<div class="tl ${i <= hr ? 'done' : ''} ${i <= hr && hr < i + step ? 'now' : ''}" data-h="${i}"><div>${st.emoji}</div>${i}h</div>`;
    }
    $('#timeline').innerHTML = tl;
    $('#timeline').querySelectorAll('.tl').forEach(t => t.onclick = () => stageModal(+t.dataset.h));
    const now = $('#timeline .now'), tlBox = $('#timeline');
    if (now) tlBox.scrollLeft = now.offsetLeft - tlBox.offsetLeft - tlBox.clientWidth / 2 + now.clientWidth / 2;
  }
}

// Hourly fasting notification
function checkFastHour() {
  if (!S.fast) return;
  const h = Math.floor(fastHours());
  if (h > (S.fast.lastHour ?? -1)) {
    S.fast.lastHour = h; save();
    const s = stageFor(h);
    if (msgDue(h)) notify(`⏳ Hour ${h}: ${s.name} ${s.emoji}`, `${hypeFor(hypeNums())}\n${s.fact}${h % 4 === 0 || msgEvery() >= 4 ? '\n🩺 Quick body check: how do you feel?' : ''}`);
    if (h === S.fast.goal) { celebrate(); setTimeout(celebrate, 900); }
    if (h === S.fast.goal) notify('🎉 Goal reached!', `You completed your ${S.fast.goal}h fast. So proud of you!`);
  }
}

// ================= HYPE / BODY CHECK / SHARE =================
function hypeNums() {
  const h = fastHours(), kcal = Math.round(h * bmr() / 24 * 1.1);
  return { h: Math.floor(h), kcal, fatG: Math.round(kcal * 0.7 / 9), name: S.profile?.name };
}

function bodyCheck() {
  const sel = new Set();
  let energy = 3, mood = 3;
  openModal(`<h2>🩺 Body check</h2>
    <p class="muted small">Be honest. This is just for you.</p>
    <div class="field"><label>Energy: <span id="eVal">3</span>/5</label><input type="range" min="1" max="5" value="3" id="eRange"></div>
    <div class="field"><label>Mood: <span id="mVal">3</span>/5</label><input type="range" min="1" max="5" value="3" id="mRange"></div>
    <div class="field"><label>How does your body feel? (tap all that fit)</label>
      <div class="chips" id="symChips">${SYMPTOMS.map(s => `<button type="button" class="chip pick" data-id="${s.id}">${s.label}</button>`).join('')}</div></div>
    <div class="field"><label>📷 Today's photos (optional, saved only on this phone)</label>
      <div class="photo-pair">
        <label class="photo-slot" id="slotBody"><input type="file" accept="image/*" id="fBody" hidden><span>🧍<br>Me</span></label>
        <label class="photo-slot" id="slotScale"><input type="file" accept="image/*" id="fScale" hidden><span>⚖️<br>Scale</span></label>
      </div>
      <input type="number" step="0.1" id="ckKg" placeholder="Weight on the scale (kg)" style="margin-top:8px"></div>
    <button class="btn big" id="ckSave">Check me</button>`, () => {
    const pics = {};
    const hook = (inp, slot, key) => $(inp).onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      pics[key] = await shrinkImage(f);
      $(slot).style.backgroundImage = `url(${pics[key]})`; $(slot).classList.add('has');
    };
    hook('#fBody', '#slotBody', 'body'); hook('#fScale', '#slotScale', 'scale');
    bodyCheck.pics = pics;
    $('#eRange').oninput = e => { energy = +e.target.value; $('#eVal').textContent = energy; };
    $('#mRange').oninput = e => { mood = +e.target.value; $('#mVal').textContent = mood; };
    document.querySelectorAll('#symChips .pick').forEach(b => b.onclick = () => {
      const id = b.dataset.id;
      if (id === 'none') { sel.clear(); document.querySelectorAll('#symChips .pick').forEach(x => x.classList.remove('on')); }
      else { sel.delete('none'); document.querySelector('#symChips [data-id=none]').classList.remove('on'); }
      sel.has(id) ? sel.delete(id) : sel.add(id); b.classList.toggle('on', sel.has(id));
    });
    $('#ckSave').onclick = () => {
      const picked = SYMPTOMS.filter(s => sel.has(s.id)), level = Math.max(0, ...picked.map(s => s.level));
      day().checks.push({ at: Date.now(), energy, mood, symptoms: picked.map(s => s.id), level, hour: S.fast ? Math.floor(fastHours()) : null });
      const w = +$('#ckKg').value, pics = bodyCheck.pics || {};
      if (w) { addWeight(w); renderGlance(); }
      if (pics.body || pics.scale || w) savePhotos(todayKey(), { ...pics, ...(w ? { kg: w } : {}) }).then(renderPhotos);
      save(); showCheckResult(level, picked, energy, mood); renderChecks(); if (w) renderBody();
    };
  });
}
function showCheckResult(level, picked, energy, mood) {
  const names = picked.map(p => p.label.toLowerCase()).join(', ');
  const n = hypeNums();
  let html;
  if (level >= 3) {
    html = `<div class="alarm-ring">🚨</div><h2>Please stop your fast now</h2>
      <p>You said: <b>${esc(names)}</b>. These can be signs your body needs help.</p>
      <div class="warnbox">Sit or lie down. If you can swallow safely, sip juice or something sweet slowly. Tell someone near you. If it does not get better fast, or you fainted or have chest pain, call emergency services.</div>
      <a class="btn danger big" style="display:block;text-align:center;text-decoration:none" href="tel:${esc(S.settings.emergency)}">📞 Call ${esc(S.settings.emergency)}</a>
      <button class="btn ghost big" style="margin-top:8px" id="ckEnd">End my fast</button>`;
  } else if (level === 2) {
    html = `<h2>⚠️ Take care of yourself first</h2><p>You said: <b>${esc(names)}</b>.</p>
      <ol class="small"><li>Sit or lie down for 15 minutes.</li><li>Drink water with a small pinch of salt.</li><li>Breathe slowly: in 4, out 6.</li><li>No workout right now.</li></ol>
      <p class="small">I'll ask again in 15 minutes. If it gets worse or doesn't pass, break your fast gently. That's not failing, that's smart.</p>
      <button class="btn big" id="ckOk">Okay</button>`;
    setTimeout(() => { notify('🩺 Quick check', 'Are you feeling better? Do another body check.'); toast('🩺 Time for a quick re-check'); }, 15 * 60000);
  } else if (level === 1) {
    html = `<h2>💛 Normal fasting stuff</h2><p>You said: <b>${esc(names)}</b>. That's common, especially after day 1.</p>
      <p class="small">Try water with a pinch of salt (electrolytes), rest a bit, and keep workouts gentle today.</p>
      <p class="stage-motiv">${esc(hypeFor(n))}</p><button class="btn big" id="ckOk">Got it</button>`;
  } else {
    html = `<h2>🌟 You're doing amazing</h2><p>Energy ${energy}/5, mood ${mood}/5. Your body is handling this really well.</p>
      ${S.fast ? `<p class="stage-motiv">${esc(hypeFor(n))}</p>` : ''}<button class="btn big" id="ckOk">Keep going 💪</button>`;
  }
  openModal(html, () => {
    if ($('#ckOk')) $('#ckOk').onclick = closeModal;
    if ($('#ckEnd')) $('#ckEnd').onclick = () => { closeModal(); if (S.fast) endFastConfirm(); };
  });
}
// ---- Progress photos (IndexedDB, stays on this device) ----
const PDB = {
  db: null,
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((res, rej) => {
      const r = indexedDB.open('bloom-photos', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('days', { keyPath: 'date' });
      r.onsuccess = () => res(this.db = r.result); r.onerror = () => rej(r.error);
    });
  },
  async tx(mode, fn) { const db = await this.open(); return new Promise((res, rej) => { const t = db.transaction('days', mode); const s = t.objectStore('days'); const out = fn(s); t.oncomplete = () => res(out && out.result); t.onerror = () => rej(t.error); }); }
};
const getPhoto = date => PDB.tx('readonly', s => s.get(date));
const allPhotos = () => PDB.tx('readonly', s => s.getAll());
async function savePhotos(date, data) {
  try { const old = (await getPhoto(date)) || { date }; await PDB.tx('readwrite', s => s.put({ ...old, ...data, date })); }
  catch (e) { toast('Could not save photos on this device'); }
}
function shrinkImage(file, max = 900) {
  return new Promise(res => {
    const img = new Image(); img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = img.width * k; c.height = img.height * k; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src); res(c.toDataURL('image/jpeg', 0.8));
    }; img.src = URL.createObjectURL(file);
  });
}
async function renderPhotos() {
  let days = [];
  try { days = (await allPhotos()).filter(d => d.body || d.scale).sort((a, b) => b.date.localeCompare(a.date)); } catch (e) {}
  const box = $('#photoList'); if (!box) return;
  const slot = (src, label) => src ? `<img src="${src}" alt="${label}" class="ph">` : `<div class="ph empty">${label}</div>`;
  const first = days[days.length - 1], last = days[0];
  $('#photoCompare').innerHTML = days.length > 1 ? `
    <div class="compare"><div><div class="small muted">Day 1 · ${first.date}${first.kg ? ' · ' + first.kg + ' kg' : ''}</div>${slot(first.body, '🧍')}</div>
    <div><div class="small muted">Now · ${last.date}${last.kg ? ' · ' + last.kg + ' kg' : ''}</div>${slot(last.body, '🧍')}</div></div>
    ${first.kg && last.kg && first.kg > last.kg ? `<p class="stage-motiv" style="text-align:center">−${(first.kg - last.kg).toFixed(1)} kg. Look at that difference! 🎉</p>` : ''}` : '';
  box.innerHTML = days.map(d => `<div class="photo-day"><div class="small"><b>${d.date}</b>${d.kg ? ' · ' + d.kg + ' kg' : ''}</div>
    <div class="photo-pair">${slot(d.body, '🧍')}${slot(d.scale, '⚖️')}</div></div>`).join('') || '<p class="muted small">No photos yet. Add them in a body check: one of you, one of the scale. Same place, same time each day works best.</p>';
  box.querySelectorAll('img.ph').forEach(i => i.onclick = () => openModal(`<img src="${i.src}" style="width:100%;border-radius:14px"><button class="btn big" style="margin-top:10px" onclick="closeModal()">Close</button>`));
  $('#photoCompare').querySelectorAll('img.ph').forEach(i => i.onclick = () => openModal(`<img src="${i.src}" style="width:100%;border-radius:14px"><button class="btn big" style="margin-top:10px" onclick="closeModal()">Close</button>`));
}
async function photoReminder() {
  const k = todayKey(); if (S.photoNag === k || new Date().getHours() < 9) return;
  try { const p = await getPhoto(k); if (p && (p.body || p.scale)) return; } catch (e) { return; }
  S.photoNag = k; save(); notify('📷 Daily photo time', 'Take a quick photo of you and the scale in your body check. Future you will love seeing the difference.');
}

function renderChecks() {
  const list = Object.entries(S.days).flatMap(([k, d]) => (d.checks || []).map(c => c)).sort((a, b) => b.at - a.at).slice(0, 10);
  const icon = l => ['🟢', '🟡', '🟠', '🔴'][l];
  $('#checkList').innerHTML = list.map(c => `<li><span>${icon(c.level)} ${new Date(c.at).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}${c.hour != null ? ' · hour ' + c.hour : ''}</span><span class="small muted">⚡${c.energy} 🙂${c.mood}</span></li>`).join('') || '<li class="muted">No checks yet. Do one every few hours while fasting.</li>';
}

async function shareCard() {
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const x = c.getContext('2d');
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const g = x.createLinearGradient(0, 0, 1080, 1350); g.addColorStop(0, css('--accent')); g.addColorStop(1, css('--accent2'));
  x.fillStyle = g; x.fillRect(0, 0, 1080, 1350);
  x.fillStyle = 'rgba(255,255,255,.92)'; x.beginPath(); x.roundRect(70, 160, 940, 1030, 60); x.fill();
  x.fillStyle = '#2b1d25'; x.textAlign = 'center';
  const start = S.weights[0]?.kg, lost = start ? start - kg() : 0, n = hypeNums();
  x.font = '900 64px Nunito, sans-serif'; x.fillText('My Bloom progress 🌸', 540, 110);
  x.font = '160px sans-serif'; x.fillText(S.fast ? stageFor(fastHours()).emoji : '🏆', 540, 400);
  x.font = '900 120px Nunito, sans-serif';
  x.fillText(S.fast ? fmtDur(fastHours()) : (S.history[0] ? fmtDur(S.history[0].hours) : '0h'), 540, 560);
  x.font = '700 48px Nunito, sans-serif'; x.fillStyle = '#7a5a6a';
  x.fillText(S.fast ? `${FAST_TYPES[S.fast.type].name} · ${stageFor(fastHours()).name}` : 'Last fast', 540, 630);
  x.fillStyle = '#2b1d25'; x.font = '800 56px Nunito, sans-serif';
  if (S.fast) x.fillText(`🔥 ~${n.kcal} kcal burned`, 540, 760);
  if (lost > 0) x.fillText(`⚖️ −${lost.toFixed(1)} kg so far`, 540, 850);
  x.fillText(`👟 ${day().steps.toLocaleString()} steps today`, 540, 940);
  x.font = 'italic 600 42px Nunito, sans-serif'; x.fillStyle = '#7a5a6a';
  const quote = pick(MOTIVATION); x.fillText(quote.length > 44 ? quote.slice(0, 44) + '…' : quote, 540, 1080);
  x.fillStyle = '#fff'; x.font = '800 40px Nunito, sans-serif'; x.fillText((location.host + location.pathname).replace(/index\.html$/, '').replace(/\/$/, ''), 540, 1280);
  const blob = await new Promise(r => c.toBlob(r, 'image/png'));
  const file = new File([blob], 'bloom-progress.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], text: 'My fasting progress with Bloom 🌸' }); } catch (e) {}
  } else {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bloom-progress.png'; a.click();
    toast('Saved your progress picture 📸');
  }
}

// ================= WATER =================
const DRINKS = { water: '💧 Water', tea: '🍵 Tea', zero: '🥤 Zero drink', coffee: '☕ Coffee', other: '🥛 Other' };
const waterTotal = (d = day()) => (d.drinks || []).reduce((a, x) => a + x.ml, 0);
const hm = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
// spread the daily goal over the drinking hours, step by step
function waterItems() {
  const w = S.water; if (!w?.goal) return [];
  const from = minutes(w.from || '08:00'), to = Math.max(from + 60, minutes(w.to || '21:00'));
  const n = Math.max(4, Math.round(w.goal / 330));
  const each = Math.round(w.goal / n / 10) * 10;
  let cum = 0;
  return Array.from({ length: n }, (_, i) => {
    const ml = i === n - 1 ? w.goal - each * (n - 1) : each; cum += ml;
    const L = (cum / 1000).toFixed(2).replace(/\.?0+$/, '');
    return { time: hm(Math.round((from + (to - from) * i / (n - 1)) / 15) * 15), title: `💧 Drink ${ml} ml`, why: `Step ${i + 1} of ${n}: ${L} L of ${w.goal / 1000} L by now`, water: true, ml, cum, notify: true, alarm: false };
  });
}
const newWaterItems = () => waterItems().map(x => ({ ...x, id: uid(), done: false, fired: minutes(x.time) < nowMin() - 5 }));
// tick water steps automatically from how much you really drank
function syncWaterItems() {
  if (!S.today) return; const t = waterTotal();
  S.today.items.filter(i => i.water).forEach(i => { i.done = t >= i.cum; });
}
function refreshWaterViews() { syncWaterItems(); save(); renderWater(); renderPlan(); renderGlance(); }
function addDrink(ml, kind = 'water', planId) {
  const d = day(); d.drinks = d.drinks || [];
  const before = waterTotal();
  d.drinks.push({ at: Date.now(), ml, kind, planId });
  refreshWaterViews();
  const t = waterTotal(), g = S.water?.goal;
  if (g && t >= g && before < g) { celebrate(); toast('💧 Water goal reached! Amazing 🎉'); notify('💧 Water goal reached!', 'You hit your water goal today. Your body says thank you.'); }
  else toast(`+${ml} ml ${DRINKS[kind].split(' ')[0]}`);
  if (t > 4000 && before <= 4000) openModal(`<h2>⚠️ That's a lot of water</h2><p>You've had over 4 L today. Too much water, especially while fasting, can lower your sodium and make you sick. Slow down, and add a pinch of salt if you keep drinking.</p><button class="btn big" onclick="closeModal()">Okay</button>`);
}
function toggleWaterItem(it) {
  const d = day(); d.drinks = d.drinks || [];
  if (!it.done) return addDrink(Math.max(it.ml, Math.min(it.cum - waterTotal(), it.ml * 2)), 'water', it.id);
  const n = d.drinks.length;
  d.drinks = d.drinks.filter(x => x.planId !== it.id);
  if (d.drinks.length === n && n) d.drinks.pop();
  refreshWaterViews();
}
function undoDrink() { const d = day(); if (!d.drinks?.length) return; const x = d.drinks.pop(); refreshWaterViews(); toast(`Removed ${x.ml} ml`); }
function waterGoalModal(first) {
  const sug = Math.min(4000, Math.max(2000, Math.round(kg() * 35 / 500) * 500));
  let goal = S.water?.goal || sug;
  const opts = [2000, 2500, 3000, 3500, 4000];
  openModal(`<h2>💧 Daily water goal</h2>
    <p class="muted small">${first ? 'Pick your goal first. Bloom spreads it over your day with reminders, step by step.' : 'Change your goal or your drinking hours.'}</p>
    <div class="seg" id="wGoal">${opts.map(v => `<button type="button" data-v="${v}" class="${v === goal ? 'on' : ''}">${v / 1000} L${v === sug ? ' ⭐' : ''}</button>`).join('')}</div>
    <p class="small muted">⭐ Suggested for your weight (about 35 ml per kg).</p>
    <div class="row gap"><label class="small">First drink<input type="time" id="wFrom" value="${S.water?.from || '08:00'}"></label><label class="small">Last drink<input type="time" id="wTo" value="${S.water?.to || '21:00'}"></label></div>
    <div class="warnbox">Never more than 4 L a day. Too much water, especially while fasting, can lower your sodium (hyponatremia) and be dangerous. Add a pinch of salt to some of your water on fasting days.</div>
    <p class="small" id="wPreview"></p>
    <button class="btn big" id="wSave">Save my water plan</button>`, m => {
    const prev = () => { const n = Math.max(4, Math.round(goal / 330)); $('#wPreview').textContent = `That's ${n} reminders of about ${Math.round(goal / n / 10) * 10} ml each.`; };
    m.querySelectorAll('#wGoal button').forEach(b => b.onclick = () => { goal = +b.dataset.v; m.querySelectorAll('#wGoal button').forEach(x => x.classList.toggle('on', x === b)); prev(); });
    prev();
    $('#wSave').onclick = () => {
      S.water = { goal: Math.min(4000, goal), from: $('#wFrom').value || '08:00', to: $('#wTo').value || '21:00' };
      ensureToday();
      S.today.items = S.today.items.filter(i => !i.water).concat(newWaterItems());
      closeModal(); refreshWaterViews();
      toast(`💧 ${S.water.goal / 1000} L plan ready`);
    };
  });
}
function renderWater() {
  const box = $('#waterCard'); if (!box) return;
  if (!S.water?.goal) {
    box.innerHTML = `<h3>💧 Water</h3><p>Set your daily water goal and Bloom reminds you step by step.</p><button class="btn" id="wSet">Set my water goal</button>`;
    $('#wSet').onclick = () => waterGoalModal(true); return;
  }
  const t = waterTotal(), g = S.water.goal, pct = Math.min(100, t / g * 100);
  const next = (S.today?.items || []).filter(i => i.water && !i.done).sort((a, b) => minutes(a.time) - minutes(b.time))[0];
  const kinds = Object.entries((day().drinks || []).reduce((a, x) => (a[x.kind] = (a[x.kind] || 0) + x.ml, a), {}));
  box.innerHTML = `
    <div class="row between"><h3>💧 Water</h3><button class="linkbtn" id="wEdit">⚙️ ${g / 1000} L goal</button></div>
    <div class="water-row">
      <div class="bottle"><div class="bottle-fill" style="height:${pct}%"></div><span>${Math.round(pct)}%</span></div>
      <div style="min-width:0;flex:1">
        <div class="water-big">${(t / 1000).toFixed(2)} <small>/ ${g / 1000} L</small></div>
        <p class="small muted">${t >= g ? '🎉 Goal reached! More is a bonus, just stay under 4 L.' : next ? `Next: <b>${next.time}</b>, drink ${next.ml} ml` : `${g - t} ml to go`}</p>
        ${kinds.length ? `<div class="chips">${kinds.map(([k, v]) => `<span class="chip">${DRINKS[k].split(' ')[0]} ${v} ml</span>`).join('')}</div>` : ''}
      </div>
    </div>
    <div class="chips" id="wKind" style="margin:10px 0 6px">${Object.entries(DRINKS).map(([k, v]) => `<button type="button" class="chip pick ${k === (S.lastDrink || 'water') ? 'on' : ''}" data-k="${k}">${v}</button>`).join('')}</div>
    <div class="row gap wrap">${[150, 250, 330, 500].map(v => `<button class="btn ghost wadd" data-ml="${v}">+${v}</button>`).join('')}<button class="btn ghost" id="wOther">+ other</button><button class="linkbtn" id="wUndo">↩ undo</button></div>`;
  $('#wEdit').onclick = () => waterGoalModal();
  box.querySelectorAll('#wKind .pick').forEach(b => b.onclick = () => { S.lastDrink = b.dataset.k; save(); box.querySelectorAll('#wKind .pick').forEach(x => x.classList.toggle('on', x === b)); });
  box.querySelectorAll('.wadd').forEach(b => b.onclick = () => addDrink(+b.dataset.ml, S.lastDrink || 'water'));
  $('#wOther').onclick = () => openModal(`<h2>Add a drink</h2><div class="field"><label>How much (ml)</label><input type="number" id="wMl" value="200" min="10" max="2000"></div><button class="btn big" id="wAddGo">Add</button>`, () => {
    $('#wAddGo').onclick = () => { const v = Math.min(2000, +$('#wMl').value || 0); if (v > 0) { closeModal(); addDrink(v, S.lastDrink || 'water'); } };
  });
  $('#wUndo').onclick = undoDrink;
}
// end of the drinking day: ask about drinks you forgot to add
function waterEndCheck() {
  const w = S.water; if (!w?.goal) return;
  const k = todayKey(); if (S.waterAsked === k) return;
  if (nowMin() < minutes(w.to || '21:00') + 30) return;
  S.waterAsked = k; save();
  const t = waterTotal(), left = w.goal - t;
  const msg = left > 0 ? `You're at ${(t / 1000).toFixed(2)} L of ${w.goal / 1000} L. Did you drink anything you didn't add? Tea, a Cola Zero, a glass at dinner?` : `You reached your water goal today! 🎉 Did you drink anything else you didn't add?`;
  notify('💧 Water check', msg);
  openModal(`<h2>💧 End of day water check</h2><p>${msg}</p>
    <div class="row gap wrap">${[150, 250, 330, 500].map(v => `<button class="btn ghost wend" data-ml="${v}">+${v} ml</button>`).join('')}</div>
    <p class="stage-motiv">${left > 0 ? 'Every glass counts. Tomorrow you crush it 💪' : 'Hydrated and proud. Your body thanks you ✨'}</p>
    <button class="btn big" onclick="closeModal()">All added</button>`, m => m.querySelectorAll('.wend').forEach(b => b.onclick = () => { addDrink(+b.dataset.ml, 'water'); b.textContent = '✓ added'; }));
}

// ================= PLAN / CHECKLIST =================
function ensureToday() {
  const k = todayKey();
  if (!S.today || S.today.date !== k) {
    const tpl = S.templates[S.templateId] || S.templates.free;
    S.today = { date: k, items: tpl.items.map(x => ({ ...x, id: uid(), done: false, notify: true, fired: false })).concat(newWaterItems()).concat(typeof programItems === 'function' ? programItems().map(x => ({ ...x, id: uid(), done: false, fired: minutes(x.time) < nowMin() - 5 })) : []) };
    syncWaterItems(); save();
  }
}
function minutes(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function nowMin() { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }

function renderPlan() {
  ensureToday();
  const sel = $('#templateSelect');
  sel.innerHTML = Object.entries(S.templates).map(([k, v]) => `<option value="${k}" ${k === S.templateId ? 'selected' : ''}>${esc(v.name)}</option>`).join('') + '<option value="__new">＋ New plan type…</option>';
  const items = S.today.items.sort((a, b) => minutes(a.time) - minutes(b.time));
  const n = nowMin(), nextId = items.find(i => !i.done && minutes(i.time) >= n - 30)?.id;
  $('#taskList').innerHTML = items.map(i => `
    <li class="task ${i.done ? 'done' : ''} ${minutes(i.time) < n - 30 ? 'past' : ''} ${i.id === nextId ? 'next' : ''}" data-id="${i.id}">
      <button class="check" data-act="done">${i.done ? '✓' : ''}</button>
      <div><div class="t-title"><span class="t-time">${i.time}</span> ${esc(i.title)}</div>${i.why ? `<div class="t-why">${esc(i.why)}</div>` : ''}</div>
      <div class="t-actions">
        <button data-act="alarm" class="${i.alarm ? '' : 'off'}" title="Alarm sound">⏰</button>
        <button data-act="notify" class="${i.notify ? '' : 'off'}" title="Notification">🔔</button>
        <button data-act="edit" title="Edit">✏️</button>
      </div>
    </li>`).join('') || '<p class="muted">No tasks yet. Add one!</p>';
  const done = items.filter(i => i.done).length;
  $('#planProgress').style.width = (items.length ? done / items.length * 100 : 0) + '%';
  $('#planProgressLabel').textContent = `${done} of ${items.length} done${done === items.length && items.length ? '. Perfect day! 🏆' : ''}`;
  renderNext();
}
$('#taskList').addEventListener('click', e => {
  const btn = e.target.closest('button'); if (!btn) return;
  const id = btn.closest('.task').dataset.id, it = S.today.items.find(x => x.id === id);
  const act = btn.dataset.act;
  if (act === 'done' && it.water) return toggleWaterItem(it);
  if (act === 'done' && it.prog) { it.done = !it.done; progDay()[it.prog] = it.done; if (it.done) toast(cheer()); save(); renderPlan(); renderProgram(); return; }
  if (act === 'done') { it.done = !it.done; if (it.done) { toast(cheer()); if (S.today.items.every(i => i.done)) celebrate(); } }
  if (act === 'alarm') it.alarm = !it.alarm;
  if (act === 'notify') it.notify = !it.notify;
  if (act === 'edit') return taskForm(it);
  save(); renderPlan(); renderGlance();
});
function cheer() {
  const k = ['Yay! Checked off 🌸', 'One step closer ✨', 'Look at you go! 💪', 'Proud of you 🫶', 'Done & dusted 🌟'];
  const d = ['Completed.', 'Well done.', 'Noted. Keep going.', 'Excellent.'];
  const a = ['dark', 'simple'].includes(S.theme) ? d : k; return a[Math.floor(Math.random() * a.length)];
}
$('#templateSelect').onchange = e => {
  const v = e.target.value;
  if (v === '__new') {
    const name = prompt('Name for the new plan type (e.g. "School day")');
    if (name) { const id = uid(); S.templates[id] = { name, items: [] }; S.templateId = id; }
  } else {
    if (S.today.items.some(i => i.done) && !confirm('Switch plan? Today\'s checklist will be replaced.')) return renderPlan();
    S.templateId = v;
  }
  S.today = null; save(); renderPlan();
};
$('#saveTemplateBtn').onclick = () => {
  S.templates[S.templateId].items = S.today.items.map(({ time, title, why, alarm }) => ({ time, title, why, alarm }));
  save(); toast('Saved! This plan will be used next time 💾');
};

function taskForm(it, preset) {
  const x = it || { time: preset?.time || '', title: preset?.title || '', why: preset?.why || '', alarm: !!preset?.alarm };
  openModal(`<h2>${it ? 'Edit task' : 'New task'}</h2>
    <div class="field"><label>Time</label><input type="time" id="tTime" value="${x.time}"></div>
    <div class="field"><label>What</label><input id="tTitle" value="${esc(x.title)}" placeholder="e.g. Wake up for school"></div>
    <div class="field"><label>Why (shown in the reminder)</label><input id="tWhy" value="${esc(x.why)}" placeholder="e.g. So I'm not late"></div>
    <div class="field"><label><input type="checkbox" id="tAlarm" ${x.alarm ? 'checked' : ''} style="width:auto"> Ring an alarm (not just a notification)</label></div>
    <div class="row gap">${it ? '<button class="btn ghost" id="tDel" style="color:var(--danger)">Delete</button>' : ''}<button class="btn big" id="tSave">Save</button></div>`, () => {
    $('#tSave').onclick = () => {
      const v = { time: $('#tTime').value || '12:00', title: $('#tTitle').value.trim() || 'Task', why: $('#tWhy').value.trim(), alarm: $('#tAlarm').checked };
      if (it) Object.assign(it, v, { fired: false }); else S.today.items.push({ ...v, id: uid(), done: false, notify: true, fired: minutes(v.time) < nowMin() });
      save(); closeModal(); renderPlan();
    };
    if (it) $('#tDel').onclick = () => { S.today.items = S.today.items.filter(i => i !== it); save(); closeModal(); renderPlan(); };
  });
}
$('#addTaskBtn').onclick = () => taskForm(null);

// ---- Voice input ----
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
function listen(cb) {
  if (!SR) return toast('Voice needs Chrome or Edge (on phone: Chrome)');
  const r = new SR(); r.lang = navigator.language || 'en-US'; r.interimResults = false;
  toast('🎙️ Listening…'); r.onresult = e => cb(e.results[0][0].transcript); r.onerror = () => toast('Did not catch that, try again'); r.start();
}
function parseSpoken(t) {
  let time = null, rest = t;
  const m = t.match(/(?:at\s*)?(\d{1,2})(?:[:.\s](\d{2}))?\s*(a\.?m\.?|p\.?m\.?|o'?clock)?/i);
  if (m) {
    let h = +m[1], mi = +(m[2] || 0); const ap = (m[3] || '').toLowerCase();
    if (ap.startsWith('p') && h < 12) h += 12; if (ap.startsWith('a') && h === 12) h = 0;
    if (h < 24 && mi < 60) { time = `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`; rest = t.replace(m[0], ''); }
  }
  let why = ''; const w = rest.match(/\b(because|so that|so|for)\b(.+)$/i);
  if (w && w[1].toLowerCase() === 'because') { why = w[2].trim(); rest = rest.replace(w[0], ''); }
  const title = rest.replace(/^\s*(remind me to|i need to|time to|to)\s*/i, '').trim();
  const alarm = /wake|alarm|school|work|leave/i.test(t);
  return { time, title: title.charAt(0).toUpperCase() + title.slice(1), why, alarm };
}
$('#voiceBtn').onclick = () => listen(t => taskForm(null, parseSpoken(t)));

// ---- Reminders / alarms ----
let audioCtx, alarmTimer;
function playAlarmSound() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const beep = () => {
      [0, .25, .5].forEach((d, i) => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = S.theme === 'dark' ? 'triangle' : 'sine';
        o.frequency.value = [880, 1046, 1318][i]; g.gain.setValueAtTime(.0001, audioCtx.currentTime + d);
        g.gain.exponentialRampToValueAtTime(.35, audioCtx.currentTime + d + .02);
        g.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + d + .22);
        o.connect(g).connect(audioCtx.destination); o.start(audioCtx.currentTime + d); o.stop(audioCtx.currentTime + d + .25);
      });
      navigator.vibrate?.([300, 150, 300]);
    };
    beep(); clearInterval(alarmTimer); alarmTimer = setInterval(beep, 1400);
  } catch (e) {}
}
function stopAlarmSound() { clearInterval(alarmTimer); alarmTimer = null; }
function ringAlarm(it) {
  playAlarmSound();
  notify(`⏰ ${it.time}: ${it.title}`, it.why || 'Time for this!');
  openModal(`<div class="alarm-ring">⏰</div><h2 style="text-align:center">${esc(it.title)}</h2>
    <p style="text-align:center" class="muted">${it.time}</p>${it.why ? `<div class="stage-fact"><b>Why:</b> ${esc(it.why)}</div>` : ''}
    <div class="row gap"><button class="btn ghost" id="aSnooze">Snooze 10 min</button><button class="btn big" id="aDone">Done ✓</button></div>`, () => {
    $('#aDone').onclick = () => { if (it.id) { it.done = true; save(); renderPlan(); } closeModal(); toast(cheer()); };
    $('#aSnooze').onclick = () => { closeModal(); setTimeout(() => ringAlarm(it), 600000); };
  });
}
function checkReminders() {
  ensureToday();
  const n = nowMin();
  for (const it of S.today.items) {
    if (it.fired || it.done) continue;
    const t = minutes(it.time);
    if (n >= t && n - t <= 5) {
      it.fired = true; save();
      if (it.alarm) ringAlarm(it);
      else if (it.notify) { notify(`🔔 ${it.title}`, it.why || `It's ${it.time}`); toast(`🔔 ${it.title}`); }
    } else if (n - t > 5) it.fired = true;
  }
}
$('#testAlarmBtn').onclick = () => ringAlarm({ time: new Date().toTimeString().slice(0, 5), title: 'Test alarm', why: 'This is how your alarms will look and sound.' });

// ---- Notifications ----
let swReg = null;
function notifState() {
  const p = 'Notification' in window ? Notification.permission : 'unsupported';
  $('#notifStatus').innerHTML = { granted: '✅ Notifications are on.', denied: '❌ Notifications are blocked. Allow them in your browser/site settings.', default: 'Notifications are off.', unsupported: 'This browser does not support notifications.' }[p];
  $('#enableNotifBtn').style.display = p === 'default' ? '' : 'none';
}
async function askNotify() { if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission(); notifState(); }
$('#enableNotifBtn').onclick = askNotify;
function notify(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const opts = { body, icon: 'icon.svg', badge: 'icon.svg', vibrate: [200, 100, 200], tag: title };
  if (swReg) swReg.showNotification(title, opts).catch(() => new Notification(title, opts));
  else try { new Notification(title, opts); } catch (e) {}
}

function renderNext() {
  ensureToday();
  const n = nowMin(), it = S.today.items.find(i => !i.done && minutes(i.time) >= n - 30);
  $('#nextTask').innerHTML = it
    ? `<div class="task next" style="grid-template-columns:1fr"><div><div class="t-title"><span class="t-time">${it.time}</span> ${esc(it.title)}</div><div class="t-why">${esc(it.why)}</div></div></div>`
    : `<p class="muted">All done for today 🎉 Rest well.</p>`;
}

// ================= BODY VIEW =================
function addWeight(w) {
  const k = todayKey(); S.weights = S.weights.filter(x => x.date !== k); S.weights.push({ date: k, kg: w });
  S.weights.sort((a, b) => a.date.localeCompare(b.date));
}
$('#logWeightBtn').onclick = () => {
  const w = +$('#weightInput').value; if (!w) return;
  const prev = S.weights.length ? S.weights[S.weights.length - 1].kg : null;
  addWeight(w); save(); $('#weightInput').value = ''; renderBody(); renderGlance();
  if (prev && w < prev) celebrate();
  toast(prev && w < prev ? `−${(prev - w).toFixed(1)} kg! Amazing 🌟` : 'Logged. Progress isn\'t always a straight line 💕');
};
$('#bodyCheckBtn').onclick = bodyCheck;
$('#photoAddBtn').onclick = bodyCheck;
$('#shareBtn2').onclick = shareCard;
$('#sleepInput').onchange = e => { day().sleep = +e.target.value || 0; save(); renderBody(); renderGlance(); };

function renderBody() {
  if (!S.profile) return;
  const b = bmi(), p = S.profile, start = S.weights[0]?.kg || p.weight;
  $('#bmiStats').innerHTML = `
    <div class="stat"><b>${b.toFixed(1)}</b><span>BMI · ${bmiCat(b)}</span></div>
    <div class="stat"><b>${kg().toFixed(1)} kg</b><span>Now (start ${start.toFixed(1)})</span></div>
    <div class="stat"><b>${Math.max(0, kg() - p.goal).toFixed(1)} kg</b><span>to goal ${p.goal} kg</span></div>
    <div class="stat"><b>${Math.round(bmr())}</b><span>kcal/day at rest (BMR)</span></div>`;
  $('#bmiMarker').style.left = Math.min(100, Math.max(0, (b - 15) / 25 * 100)) + '%';
  drawWeightChart();
  const lost = start - kg();
  $('#weightSummary').innerHTML = S.weights.length > 1 ? (lost > 0 ? `You've lost <b>${lost.toFixed(1)} kg</b> since ${S.weights[0].date} 🎉` : 'Keep going. The scale catches up with your effort.') : 'Log your weight each morning (same time, after the toilet) for the best chart.';
  const d = day(); $('#sleepInput').value = d.sleep; if (window.renderFood) { renderFood(); }
  const x = burnToday(), deficit = x.total - x.intake;
  $('#burnBreakdown').innerHTML = `
    <div class="burn-row"><span>😴 Sleeping (${d.sleep}h)</span><b>${Math.round(x.sleep)} kcal</b></div>
    <div class="burn-row"><span>🧍 Being awake / resting</span><b>${Math.round(x.rest)} kcal</b></div>
    <div class="burn-row"><span>👟 Steps (${d.steps.toLocaleString()})</span><b>${Math.round(x.steps)} kcal</b></div>
    <div class="burn-row"><span>🏋️ Workouts (${d.workouts.length})</span><b>${Math.round(x.work)} kcal</b></div>
    ${S.fast ? `<div class="burn-row"><span>⏳ Fasting: total since start</span><b>${Math.round(fastHours() * bmr() / 24 * 1.1)} kcal</b></div>` : ''}
    <div class="burn-row burn-total"><span>Total burned today</span><span>${Math.round(x.total)} kcal</span></div>
    <div class="burn-row"><span>🍽️ Eaten / drunk</span><b>${Math.round(x.intake)} kcal</b></div>
    <div class="burn-row burn-total"><span>Deficit</span><span style="color:var(--good)">${Math.round(deficit)} kcal ≈ ${Math.round(deficit / 7.7)} g fat</span></div>
    <p class="muted small">Estimates (Mifflin-St Jeor + activity). 7,700 kcal ≈ 1 kg of fat. Early fasting weight loss also includes water.</p>`;
  renderChecks(); renderPhotos();
  $('#fastHistory').innerHTML = S.history.slice(0, 20).map(f => `<li><span>${new Date(f.start).toLocaleDateString()} · ${FAST_TYPES[f.type].name}</span><b>${fmtDur(f.hours)} ${f.hours >= f.goal ? '🏆' : ''}</b></li>`).join('') || '<li class="muted">No finished fasts yet.</li>';
}
function drawWeightChart() {
  const c = $('#weightChart'), ctx = c.getContext('2d'), dpr = devicePixelRatio || 1;
  const W = c.clientWidth || 300, H = 180; c.width = W * dpr; c.height = H * dpr; ctx.scale(dpr, dpr); ctx.clearRect(0, 0, W, H);
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const pts = S.weights.slice(-30); if (!pts.length) return;
  const vals = pts.map(p => p.kg).concat(S.profile.goal), lo = Math.min(...vals) - 1, hi = Math.max(...vals) + 1;
  const X = i => 30 + (pts.length === 1 ? (W - 40) / 2 : i * (W - 40) / (pts.length - 1)), Y = v => 10 + (hi - v) / (hi - lo) * (H - 30);
  ctx.font = '11px sans-serif'; ctx.fillStyle = css('--muted');
  ctx.strokeStyle = css('--good'); ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(30, Y(S.profile.goal)); ctx.lineTo(W - 10, Y(S.profile.goal)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillText('goal', W - 36, Y(S.profile.goal) - 5); ctx.fillText(hi.toFixed(0), 0, 14); ctx.fillText(lo.toFixed(0), 0, H - 20);
  ctx.strokeStyle = css('--accent'); ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.beginPath();
  pts.forEach((p, i) => i ? ctx.lineTo(X(i), Y(p.kg)) : ctx.moveTo(X(i), Y(p.kg))); ctx.stroke();
  ctx.fillStyle = css('--accent'); pts.forEach((p, i) => { ctx.beginPath(); ctx.arc(X(i), Y(p.kg), 4, 0, 7); ctx.fill(); });
  ctx.fillStyle = css('--muted'); ctx.fillText(pts[0].date.slice(5), 30, H - 4); if (pts.length > 1) ctx.fillText(pts[pts.length - 1].date.slice(5), W - 45, H - 4);
}

// ================= GLANCE =================
function renderGlance() {
  if (!S.profile) return;
  const d = day(), x = burnToday();
  const tasks = S.today?.items || [];
  $('#glance').innerHTML = `
    <div class="stat"><b>${kg().toFixed(1)}</b><span>kg · BMI ${bmi().toFixed(1)}</span></div>
    <div class="stat"><b>${d.steps.toLocaleString()}</b><span>steps / ${S.settings.stepGoal.toLocaleString()}</span></div>
    <div class="stat"><b>${Math.round(x.total)}</b><span>kcal burned today (est.)</span></div>
    <div class="stat"><b>${tasks.filter(t => t.done).length}/${tasks.length}</b><span>plan tasks done</span></div>
    ${S.water?.goal ? `<div class="stat"><b>💧 ${(waterTotal() / 1000).toFixed(1)} L</b><span>of ${S.water.goal / 1000} L water</span></div>` : ''}`;
}

// ================= MOVE =================
function renderSteps() {
  const d = day(), g = S.settings.stepGoal;
  $('#stepCount').textContent = d.steps.toLocaleString(); $('#stepGoal').textContent = g.toLocaleString();
  $('#stepProgress').style.width = Math.min(100, d.steps / g * 100) + '%';
  $('#stepKcal').textContent = `≈ ${Math.round(stepKcal(d.steps))} kcal from steps · ${(d.steps * 0.00075).toFixed(1)} km`;
}
function changeSteps(n, set) {
  const d = day(), before = d.steps;
  d.steps = Math.max(0, Math.round(set ? n : d.steps + n));
  $('#addStepsInput').value = ''; save(); renderSteps(); renderGlance(); renderBody();
  const diff = stepKcal(d.steps) - stepKcal(before);
  toast(`👟 ${d.steps.toLocaleString()} steps today · ${diff >= 0 ? '+' : ''}${Math.round(diff)} kcal burned 🔥`);
}
$('#addStepsBtn').onclick = () => { const n = +$('#addStepsInput').value; if (n) changeSteps(n, false); };
$('#setStepsBtn').onclick = () => { const n = +$('#addStepsInput').value; if (n >= 0 && $('#addStepsInput').value !== '') changeSteps(n, true); };

// Simple accelerometer pedometer (peak detection)
let pedoOn = false, lastMag = 0, lastStep = 0, avg = 9.8;
function onMotion(e) {
  const a = e.accelerationIncludingGravity; if (!a) return;
  const mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
  avg = avg * 0.95 + mag * 0.05;
  const now = Date.now();
  if (lastMag < avg + 1.6 && mag >= avg + 1.6 && now - lastStep > 300) {
    lastStep = now; const d = day(); d.steps++;
    if (d.steps % 10 === 0) { save(); renderSteps(); }
    if (d.steps === S.settings.stepGoal) { notify('👟 Step goal reached!', 'You hit your step goal today. Incredible!'); toast('Step goal reached! 🎉'); }
  }
  lastMag = mag;
}
$('#pedoBtn').onclick = async () => {
  if (pedoOn) { window.removeEventListener('devicemotion', onMotion); pedoOn = false; $('#pedoBtn').textContent = '👟 Start step counter'; save(); return; }
  if (!('DeviceMotionEvent' in window)) return toast('No motion sensor here. Add steps manually');
  if (typeof DeviceMotionEvent.requestPermission === 'function') { try { if (await DeviceMotionEvent.requestPermission() !== 'granted') return toast('Motion permission needed'); } catch (e) { return; } }
  window.addEventListener('devicemotion', onMotion); pedoOn = true; $('#pedoBtn').textContent = '⏸ Stop step counter';
  try { await navigator.wakeLock?.request('screen'); } catch (e) {}
  toast('Counting steps. Keep Bloom open 👟');
};

function renderWorkouts() {
  const h = fastHours(), fastDay = S.fast ? Math.floor(h / 24) + 1 : 0;
  const f = S.wf, who = f.who || (S.profile?.sex === 'male' ? 'men' : S.profile?.sex === 'female' ? 'women' : 'all');
  const seg = (key, opts) => `<div class="seg wseg">${opts.map(([v, l]) => `<button type="button" data-k="${key}" data-v="${v}" class="${(key === 'who' ? who : f[key]) === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  $('#workoutFilters').innerHTML =
    seg('who', [['women', '👩 Women'], ['men', '👨 Men'], ['all', '🧑 Everyone']]) +
    seg('goal', [['loss', '🔥 Weight loss'], ['gain', '💪 Muscle gain']]) +
    seg('level', [['all', 'All'], ['simple', '🌱 Simple'], ['medium', '⚡ Medium'], ['max', '💀 Burn the most']]) +
    `<div class="seg wseg"><button type="button" data-k="kpop" data-v="toggle" class="${f.kpop ? 'on' : ''}">🎤 K-pop idol workouts only</button></div>`;
  $('#workoutFilters').querySelectorAll('button').forEach(b => b.onclick = () => {
    const k = b.dataset.k; S.wf[k] = k === 'kpop' ? !S.wf.kpop : b.dataset.v; save(); renderWorkouts();
  });
  $('#workoutHint').textContent = S.fast ? `You're on fasting day ${fastDay}. ${fastDay >= 3 ? 'Pick Simple workouts today. They burn mostly fat and keep you safe.' : 'Medium is still okay. Stop if you feel dizzy.'}` : 'Calories are calculated for YOUR weight. Only workouts that burn 80+ kcal are shown.';
  const list = WORKOUTS
    .filter(w => w.who === 'all' || who === 'all' || w.who === who)
    .filter(w => w.goal === 'both' || w.goal === f.goal)
    .filter(w => f.level === 'all' || w.level === f.level)
    .filter(w => !f.kpop || w.kpop)
    .filter(w => workoutKcal(w, w.min) >= 80)
    .sort((a, b) => workoutKcal(b, b.min) - workoutKcal(a, a.min));
  const lvl = { simple: '🌱 Simple', medium: '⚡ Medium', max: '💀 Max burn' };
  $('#workoutList').innerHTML = list.map(w => {
    const kcal = workoutKcal(w, w.min);
    const ok = !S.fast || w.level === 'simple' || (w.level === 'medium' && fastDay < 3) || (w.level === 'max' && fastDay < 2);
    return `<div class="workout"><div class="w-icon">${w.emoji}</div><div>
      <div class="w-name">${esc(w.name)} · ${w.min} min</div>
      <div class="chips" style="margin:4px 0"><span class="chip">${lvl[w.level]}</span>${w.kpop ? '<span class="chip">🎤 K-pop</span>' : ''}${S.fast ? `<span class="tag ${ok ? 'ok' : 'warn'}">${ok ? 'good for today' : 'too hard today'}</span>` : ''}</div>
      <div class="w-burn">🔥 about ${Math.round(kcal)} kcal · about ${Math.round(kcal / 7.7)} g fat</div>
      <div class="w-help">${w.goal === 'gain' ? '💪 Builds muscle. ' : w.goal === 'both' ? '🔥💪 Burns fat and builds strength. ' : '🔥 Helps weight loss. '}${esc(w.help)}</div>
      <div class="w-btns"><button class="btn" data-w="${w.id}">▶ Start</button>
      <a class="btn ghost" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(w.video)}">📺 Watch videos</a>
      <button class="btn ghost" data-log="${w.id}">✓ I did it</button></div></div></div>`;
  }).join('') || '<p class="muted">No workouts match. Try another filter.</p>';
  $('#workoutList').querySelectorAll('[data-w]').forEach(b => b.onclick = () => playWorkout(WORKOUTS.find(w => w.id === b.dataset.w)));
  $('#workoutList').querySelectorAll('[data-log]').forEach(b => b.onclick = () => logWorkoutAsk(WORKOUTS.find(w => w.id === b.dataset.log)));
  const d = day();
  $('#workoutLog').innerHTML = d.workouts.map(w => `<li><span>${esc(w.name)} · ${w.min} min</span><b>${Math.round(w.kcal)} kcal</b></li>`).join('') || '<li class="muted">Nothing yet. Even 10 minutes counts!</li>';
}
function logWorkout(w, min) {
  day().workouts.push({ name: w.name, min: Math.round(min), kcal: workoutKcal(w, min), at: Date.now() });
  save(); renderWorkouts(); renderGlance(); toast(`+${Math.round(workoutKcal(w, min))} kcal burned 🔥`);
  if (window.markSessionDone && S.program?.active) { markSessionDone(); renderPlan(); return; }
  const it = S.today?.items.find(i => !i.done && /workout/i.test(i.title)); if (it) { it.done = true; save(); renderPlan(); }
}
function logWorkoutAsk(w) {
  const min = +prompt(`How many minutes of ${w.name}?`, w.min); if (min > 0) logWorkout(w, min);
}
function playWorkout(w) {
  const per = w.min * 60 / w.moves.length; let i = 0, left = per, elapsed = 0, paused = false, t;
  openModal(`<div class="player">
    <div class="muted small" id="pStep"></div><div class="move-emoji">${w.emoji}</div>
    <div class="move-name" id="pMove"></div><div class="move-timer" id="pTime"></div>
    <div class="muted small" id="pNext"></div><div class="progress"><div id="pProg"></div></div>
    <p class="w-burn" id="pBurn"></p>
    <div class="row gap" style="justify-content:center"><button class="btn ghost" id="pPause">⏸ Pause</button><button class="btn ghost" id="pSkip">⏭ Skip</button><button class="btn" id="pStop">Finish</button></div>
    <p class="muted small">Feeling dizzy or faint? Stop, sit down, and drink water with a pinch of salt.</p></div>`, () => {
    const draw = () => {
      $('#pStep').textContent = `Move ${i + 1} / ${w.moves.length}`; const mv = $('.player .move-emoji'); if (typeof playerVisual === 'function' && mv.dataset.m !== String(i)) { mv.dataset.m = i; mv.innerHTML = playerVisual(w.moves[i], w); } $('#pMove').textContent = w.moves[i];
      $('#pTime').textContent = fmtHMS(left * 1000).slice(3); $('#pNext').textContent = w.moves[i + 1] ? 'Next: ' + w.moves[i + 1] : 'Last one!';
      $('#pProg').style.width = (elapsed / (w.min * 60) * 100) + '%'; $('#pBurn').textContent = `🔥 ${Math.round(workoutKcal(w, elapsed / 60))} kcal so far`;
    };
    const finish = () => { clearInterval(t); closeModal(); if (elapsed > 60) logWorkout(w, elapsed / 60); };
    const next = () => { i++; left = per; if (i >= w.moves.length) return finish(); playBeep(); };
    t = setInterval(() => { if (paused || !$('#pMove')) return; left--; elapsed++; if (left <= 0) next(); if ($('#pMove')) draw(); }, 1000);
    $('#pPause').onclick = () => { paused = !paused; $('#pPause').textContent = paused ? '▶ Resume' : '⏸ Pause'; };
    $('#pSkip').onclick = () => { next(); if ($('#pMove')) draw(); };
    $('#pStop').onclick = finish; draw();
  });
}
function playBeep() { playAlarmSound(); setTimeout(stopAlarmSound, 500); }

// ================= CHAT =================
function chatCtx() { S.chatUsed = S.chatUsed || {}; return { persona: S.persona, hours: fastHours(), kcal: S.fast ? hypeNums().kcal : 0, used: S.chatUsed, name: S.profile?.name, reason: S.fast?.reason || S.lastReason, fastType: S.fast?.type }; }
function mochiHello() {
  const n = S.profile?.name ? ' ' + S.profile.name : '';
  return S.persona === 'evil'
    ? `Well well well${n}. I'm Evil Mochi 😈\nI don't do cute. I do results. Complain to me and I'll roast you back into fasting mode.\n\nOne promise though: if you feel faint, chest pain, heart racing or really sick, I drop the act and help you stop safely.`
    : `Hi${n}! I'm Sweet Mochi 🐰🌸\nI'm here whenever fasting gets hard. Tell me how you feel. No judgement, ever.\n\nIf you ever feel faint, chest pain, heart racing or very sick, tell me and I'll help you stop safely.`;
}
function setPersona(p) {
  S.persona = p; S.chat.push({ who: 'bot', text: mochiHello() }); save(); applyTheme(); renderChat();
}
function personaModal() {
  openModal(`<h2>Pick your Mochi</h2>
    <div class="theme-pick">
      <button data-p="sweet" class="${S.persona === 'sweet' ? 'on' : ''}">🐰 Sweet Mochi<br><span class="small muted">Gentle, kind, like a soft therapist. For people who need support.</span></button>
      <button data-p="evil" class="${S.persona === 'evil' ? 'on' : ''}">😈 Evil Mochi<br><span class="small muted">Toxic motivation. Harsh, sarcastic, roasts your excuses. Tough love only.</span></button>
    </div>`, m => m.querySelectorAll('[data-p]').forEach(b => b.onclick = () => {
      if (b.dataset.p === 'sweet') { closeModal(); return setPersona('sweet'); }
      if (S.evilAgreed) { closeModal(); return setPersona('evil'); }
      evilTerms();
    }));
}
function evilTerms() {
  openModal(`<h2>😈 Evil Mochi terms</h2>
    <p>Evil Mochi is <b>toxic on purpose</b>. That means:</p>
    <ul class="small">
      <li>It is harsh, rude, sarcastic and insulting.</li>
      <li><b>It makes fat jokes and comments about your body, weight, belly, thighs and chins.</b> This can feel like fat shaming.</li>
      <li>It mocks your excuses, cravings and quitting. It may feel like bullying. That's the point.</li>
      <li>You use it at your own risk. If jokes about your body could hurt you, or you have or had an eating disorder, <b>do not use it. Use Sweet Mochi instead.</b></li>
      <li>It's a joke character, not a real opinion about you.</li>
      <li>If you say you feel sick, faint, sad or unsafe, it drops the act and helps you for real.</li>
      <li>You can switch back to Sweet Mochi any time.</li>
    </ul>
    <label class="small" style="flex-direction:row;align-items:center;gap:8px;margin:10px 0"><input type="checkbox" id="evilOk" style="width:auto"> I am 18 or older. I agree that Evil Mochi is toxic and may fat shame me, and I choose it at my own risk. If I don't agree, I'll use Sweet Mochi.</label>
    <div class="row gap"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn danger" id="evilGo" disabled>I agree, unleash it 😈</button></div>`, () => {
    $('#evilOk').onchange = e => $('#evilGo').disabled = !e.target.checked;
    $('#evilGo').onclick = () => { S.evilAgreed = true; closeModal(); setPersona('evil'); };
  });
}
function renderChat() {
  if (!S.chat.length) S.chat.push({ who: 'bot', text: mochiHello() });
  $('#chatLog').innerHTML = S.chat.slice(-60).map((m, i) => `<div class="msg ${m.who} ${m.alert ? 'alert' : ''}">${esc(m.text)}${m.call ? `<br><a class="callbtn" href="tel:${esc(S.settings.emergency)}">📞 Call emergency ${esc(S.settings.emergency)}</a>` : ''}${m.who === 'bot' && !m.alert ? `<button class="msg-flag" data-flag="${i}" title="Report this reply">🚩</button>` : ''}</div>`).join('');
  const shown = S.chat.slice(-60);
  $('#chatLog').querySelectorAll('[data-flag]').forEach(b => b.onclick = () => { const m = shown[+b.dataset.flag]; reportModal('ai', 'mochi', 'Mochi said: ' + m.text.slice(0, 120)); });
  const last = [...S.chat].reverse().find(m => m.who === 'bot');
  const q = last?.quick || ['Motivate me', "I'm hungry", 'I want to quit', 'I feel dizzy', "What's happening in my body?", 'Roast me 😈'];
  $('#quickReplies').innerHTML = q.map(x => `<button>${esc(x)}</button>`).join('');
  $('#quickReplies').querySelectorAll('button').forEach(b => b.onclick = () => sendChat(b.textContent));
  $('#chatLog').scrollTop = 1e9;
}
// live data the AI uses to make replies personal
function aiContext() {
  const h = fastHours(), n = hypeNums(), st = S.fast ? stageFor(h) : null, v = S.vision || {};
  const prog = typeof todayWorkouts === 'function' ? todayWorkouts() : null;
  return {
    name: S.profile?.name || null, time: new Date().toLocaleString(), emergency: S.settings.emergency,
    fasting: S.fast ? { hours: +h.toFixed(1), goalHours: S.fast.goal, type: S.fast.type, stage: st.name, kcalBurned: n.kcal, fatGrams: n.fatG, reason: S.fast.reason || null } : null,
    weightKg: +kg().toFixed(1), goalKg: S.profile?.goal, startKg: S.weights[0]?.kg,
    waterToday: S.water?.goal ? `${(waterTotal() / 1000).toFixed(2)} of ${S.water.goal / 1000} L` : null,
    stepsToday: day().steps, eatenTodayKcal: day().intake || 0, burnedTodayKcal: Math.round(burnToday().total), vip: isVip(), workoutsToday: prog ? `${prog.done} of ${prog.total} done` : null,
    vision: (v.why || v.inspo || v.keep) ? { why: v.why, inspo: v.inspo, keepGoing: v.keep } : null
  };
}
const SAFETY_LISTS = () => [RED_FLAGS, SICK, ED, MEDICAL, SAD];
let aiDown = 0;
async function aiReply() {
  if (Date.now() < aiDown || !navigator.onLine || typeof commInit !== 'function') return null;
  try {
    if (!(await commInit())) return null;
    const call = sb.functions.invoke('mochi', { body: { persona: S.persona, messages: S.chat.slice(-16).map(m => ({ who: m.who, text: m.text })), context: aiContext() } });
    const r = await Promise.race([call, new Promise(res => setTimeout(() => res({ error: 'timeout' }), 25000))]);
    if (r.error || !r.data?.text) { aiDown = Date.now() + 60000; return null; }
    return r.data.text.replace(/\s*[—–]\s*/g, ', ');
  } catch (e) { aiDown = Date.now() + 60000; return null; }
}
async function sendChat(text) {
  if (!text.trim()) return;
  const t = text.toLowerCase();
  S.chat.push({ who: 'me', text }); renderChat();
  $('#chatLog').insertAdjacentHTML('beforeend', '<div class="msg bot typing" id="typing"><i></i><i></i><i></i></div>'); $('#chatLog').scrollTop = 1e9;
  // safety first: health and emotional cues always get the tested built-in replies
  const sensitive = SAFETY_LISTS().some(l => anyMatch(l, t)) || /still bad|not better|worse|i fainted/.test(t);
  const ai = sensitive ? null : await aiReply();
  if (!ai) await new Promise(r => setTimeout(r, 500));
  $('#typing')?.remove();
  if (ai) S.chat.push({ who: 'bot', text: ai, ai: true });
  else buddyReply(text, chatCtx()).forEach(r => S.chat.push({ who: 'bot', ...r }));
  S.chat = S.chat.slice(-120); save(); renderChat();
  if (S.fast && anyMatch(QUIT, t) && !sensitive) setTimeout(() => showVision({ breaking: true, onStop: endFastConfirm }), 2200);
}
$('#chatForm').onsubmit = e => { e.preventDefault(); sendChat($('#chatInput').value); $('#chatInput').value = ''; };
$('#chatMic').onclick = () => listen(t => sendChat(t));
$('#switchMochi').onclick = personaModal;

// ================= MAIN LOOP =================
function renderHeader() {
  const h = new Date().getHours(), n = S.profile?.name;
  const g = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  $('#hello').innerHTML = `${esc(g)}${n ? ', ' + esc(n) : ''}${theme().mascot ? ` <span class="mascot">${theme().mascot}</span>` : ''}`;
  $('#todayLabel').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}
function renderAll() { applyTheme(); renderHeader(); if (window.renderVisionCard) renderVisionCard(); if (window.renderProgram) renderProgram(); $('#stageCard').dataset.hr = ''; $('#fastControls').innerHTML = ''; renderFast(); renderPlan(); renderGlance(); renderSteps(); renderWorkouts(); renderBody(); notifState(); }

let lastMinute = -1;
setInterval(() => {
  renderFast(); checkFastHour();
  const m = new Date().getMinutes();
  if (m !== lastMinute) { lastMinute = m; checkReminders(); renderNext(); renderHeader(); photoReminder(); waterEndCheck(); if (window.eveningNag) { eveningNag(); midnightCheck(); } }
}, 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { checkReminders(); renderAll(); } });

if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !window.Capacitor?.isNativePlatform?.()) navigator.serviceWorker.register('sw.js').then(r => swReg = r).catch(() => {});

applyTheme(); renderAll();
if (!S.profile) profileForm(true);
