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
  return st;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function day(k = todayKey()) {
  if (!S.days[k]) S.days[k] = { steps: 0, workouts: [], sleep: 7, intake: 0, checks: [] };
  if (!S.days[k].checks) S.days[k].checks = [];
  return S.days[k];
}

// ================= HELPERS =================
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
function applyTheme() {
  document.documentElement.dataset.theme = S.theme;
  const tc = { kawaii: '#ff8fb8', dark: '#0d0d10', simple: '#2563eb' }[S.theme];
  document.querySelector('meta[name=theme-color]').content = tc;
  const b = BUDDY[S.persona] || BUDDY.sweet; $('#buddyFace').textContent = b.face; $('#buddyName').textContent = b.name;
}
$('#themeBtn').onclick = () => openModal(`
  <h2>Choose your style</h2>
  <div class="theme-pick">
    <button data-t="kawaii" style="background:#ffe3ee;color:#5b3a4a">🌸 Kawaii: soft, pastel &amp; super cute</button>
    <button data-t="dark" style="background:#111;color:#d4af37;font-family:'Playfair Display',serif">🖤 Dark Classic: elegant black &amp; gold</button>
    <button data-t="simple" style="background:#fff;color:#1d2430">▫️ Simple: clean, no distractions</button>
  </div>`, m => m.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { S.theme = b.dataset.t; save(); applyTheme(); renderAll(); closeModal(); }));

// ================= NAV =================
document.querySelectorAll('.tabbar button').forEach(b => b.onclick = () => showView(b.dataset.view));
function showView(v) {
  document.querySelectorAll('.tabbar button').forEach(x => x.classList.toggle('active', x.dataset.view === v));
  document.querySelectorAll('.view').forEach(x => x.classList.toggle('active', x.id === 'view-' + v));
  if (v === 'body') renderBody();
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
    <div class="warnbox">Fasting isn't safe for everyone. Please talk to a doctor first if you are pregnant/breastfeeding, under 18, have diabetes, heart or kidney problems, take medication, or have a history of eating disorders.</div>
    <button class="btn big" id="pSave">${first ? 'Calculate & start 🌱' : 'Save'}</button>
    ${first ? '' : '<div class="row gap wrap" style="margin-top:12px"><button class="btn ghost" id="pExport">⬇️ Backup data</button><button class="btn ghost" id="pImport">⬆️ Restore</button><button class="btn ghost" id="pReset" style="color:var(--danger)">Reset all</button></div>'}
  `, m => {
    let sex = p.sex;
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
function startFastModal() {
  let type = 'dirty', goal = 168;
  const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  openModal(`<h2>Start a fast</h2>
    <div class="field"><label>Type</label><div class="seg" id="fType">
      ${Object.entries(FAST_TYPES).map(([k, v]) => `<button type="button" data-v="${k}" class="${k === type ? 'on' : ''}">${v.name}</button>`).join('')}</div>
      <p class="small muted" id="fTypeDesc"></p></div>
    <div class="field"><label>Goal</label><div class="seg" id="fGoal">
      ${FAST_GOALS.map(h => `<button type="button" data-v="${h}" class="${h === goal ? 'on' : ''}">${h < 48 ? h + 'h' : h / 24 + 'd'}</button>`).join('')}</div></div>
    <div class="field"><label>Started at (change if you started earlier)</label><input type="datetime-local" id="fStart" value="${now.toISOString().slice(0, 16)}"></div>
    <div class="field"><label>Why are you fasting? (the buddy reminds you when it's hard)</label><input id="fReason" placeholder="e.g. religious reasons, spirituality, weight loss" value="${esc(S.lastReason || '')}"></div>
    <div class="warnbox" id="fWarn"></div>
    <button class="btn big" id="fGo">Start fasting ✨</button>`, m => {
    const upd = () => {
      $('#fTypeDesc').textContent = FAST_TYPES[type].desc + ' Allowed: ' + FAST_TYPES[type].allowed.join(', ');
      $('#fWarn').style.display = goal > 72 ? '' : 'none';
      $('#fWarn').innerHTML = `Fasts longer than 3 days: take electrolytes daily (salt, potassium, magnesium), keep workouts gentle from day 3, and break the fast slowly. Fasts over 5 days are best done with a doctor's OK.`;
    };
    m.querySelectorAll('#fType button').forEach(b => b.onclick = () => { type = b.dataset.v; m.querySelectorAll('#fType button').forEach(x => x.classList.toggle('on', x === b)); upd(); });
    m.querySelectorAll('#fGoal button').forEach(b => b.onclick = () => { goal = +b.dataset.v; m.querySelectorAll('#fGoal button').forEach(x => x.classList.toggle('on', x === b)); upd(); });
    upd();
    $('#fGo').onclick = () => {
      const st = new Date($('#fStart').value).getTime() || Date.now();
      S.lastReason = $('#fReason').value.trim();
      S.fast = { type, goal, start: Math.min(st, Date.now()), reason: S.lastReason, lastHour: Math.floor((Date.now() - st) / 3600000) };
      save(); closeModal(); renderAll(); askNotify();
      toast('Fast started. You\'ve got this! 💪');
    };
  });
}
function endFast() {
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
    $('#talkBtn').onclick = () => { showView('chat'); sendChat('I want to break my fast'); };
  }
  const hr = Math.floor(h);
  if ($('#stageCard').dataset.hr !== String(hr)) {
    $('#stageCard').dataset.hr = hr;
    const left = f.goal - h, burned = h * bmr() / 24 * 1.1;
    $('#stageCard').innerHTML = `
      <div class="stage-hour">Hour ${hr}${hr >= 24 ? ' · Day ' + (Math.floor(h / 24) + 1) : ''} · next update in ${60 - new Date().getMinutes()} min</div>
      <div class="hype">${esc(hypeFor(hypeNums()))}</div>
      <h3>${s.emoji} ${s.name}</h3>
      <p>${s.body}</p>
      <div class="stage-fact">${s.fact}</div>
      <p class="stage-motiv">${s.motivation}</p>
      <p><b>Tip:</b> ${s.tip}</p>
      <div class="chips">
        <span class="chip">🔥 ~${Math.round(burned)} kcal burned since start</span>
        <span class="chip">⏳ ${left > 0 ? fmtDur(left) + ' to go' : 'Goal reached! 🎉'}</span>
        ${f.reason ? `<span class="chip">💭 ${esc(f.reason)}</span>` : ''}
      </div>`;
    // timeline
    const max = Math.min(f.goal, 168), step = max > 72 ? 6 : max > 36 ? 2 : 1;
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
    notify(`⏳ Hour ${h}: ${s.name} ${s.emoji}`, `${hypeFor(hypeNums())}\n${s.fact}`);
    if (h > 0 && h % 4 === 0) setTimeout(() => notify('🩺 Body check time', 'How do you feel? Open Bloom and tap Body check. It takes 10 seconds.'), 4000);
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
    <button class="btn big" id="ckSave">Check me</button>`, () => {
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
      save(); showCheckResult(level, picked, energy, mood); renderChecks();
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
    if ($('#ckEnd')) $('#ckEnd').onclick = () => { closeModal(); if (S.fast) endFast(); };
  });
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

// ================= PLAN / CHECKLIST =================
function ensureToday() {
  const k = todayKey();
  if (!S.today || S.today.date !== k) {
    const tpl = S.templates[S.templateId] || S.templates.free;
    S.today = { date: k, items: tpl.items.map(x => ({ ...x, id: uid(), done: false, notify: true, fired: false })) };
    save();
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
  if (act === 'done') { it.done = !it.done; if (it.done) toast(cheer()); }
  if (act === 'alarm') it.alarm = !it.alarm;
  if (act === 'notify') it.notify = !it.notify;
  if (act === 'edit') return taskForm(it);
  save(); renderPlan(); renderGlance();
});
function cheer() {
  const k = ['Yay! Checked off 🌸', 'One step closer ✨', 'Look at you go! 💪', 'Proud of you 🫶', 'Done & dusted 🌟'];
  const d = ['Completed.', 'Well done.', 'Noted. Keep going.', 'Excellent.'];
  const a = S.theme === 'kawaii' ? k : d; return a[Math.floor(Math.random() * a.length)];
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
  toast(prev && w < prev ? `−${(prev - w).toFixed(1)} kg! Amazing 🌟` : 'Logged. Progress isn\'t always a straight line 💕');
};
$('#bodyCheckBtn').onclick = bodyCheck;
$('#shareBtn2').onclick = shareCard;
$('#sleepInput').onchange = e => { day().sleep = +e.target.value || 0; save(); renderBody(); renderGlance(); };
$('#intakeInput').onchange = e => { day().intake = +e.target.value || 0; save(); renderBody(); };

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
  const d = day(); $('#sleepInput').value = d.sleep; $('#intakeInput').value = d.intake || '';
  const x = burnToday(), deficit = x.total - x.intake;
  $('#burnBreakdown').innerHTML = `
    <div class="burn-row"><span>😴 Sleeping (${d.sleep}h)</span><b>${Math.round(x.sleep)} kcal</b></div>
    <div class="burn-row"><span>🧍 Being awake / resting</span><b>${Math.round(x.rest)} kcal</b></div>
    <div class="burn-row"><span>👟 Steps (${d.steps.toLocaleString()})</span><b>${Math.round(x.steps)} kcal</b></div>
    <div class="burn-row"><span>🏋️ Workouts (${d.workouts.length})</span><b>${Math.round(x.work)} kcal</b></div>
    ${S.fast ? `<div class="burn-row"><span>⏳ Fasting: total since start</span><b>${Math.round(fastHours() * bmr() / 24 * 1.1)} kcal</b></div>` : ''}
    <div class="burn-row burn-total"><span>Total burned today</span><span>${Math.round(x.total)} kcal</span></div>
    <div class="burn-row"><span>Eaten / drunk</span><b>${Math.round(x.intake)} kcal</b></div>
    <div class="burn-row burn-total"><span>Deficit</span><span style="color:var(--good)">${Math.round(deficit)} kcal ≈ ${Math.round(deficit / 7.7)} g fat</span></div>
    <p class="muted small">Estimates (Mifflin-St Jeor + activity). 7,700 kcal ≈ 1 kg of fat. Early fasting weight loss also includes water.</p>`;
  renderChecks();
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
    <div class="stat"><b>${tasks.filter(t => t.done).length}/${tasks.length}</b><span>plan tasks done</span></div>`;
}

// ================= MOVE =================
function renderSteps() {
  const d = day(), g = S.settings.stepGoal;
  $('#stepCount').textContent = d.steps.toLocaleString(); $('#stepGoal').textContent = g.toLocaleString();
  $('#stepProgress').style.width = Math.min(100, d.steps / g * 100) + '%';
  $('#stepKcal').textContent = `≈ ${Math.round(stepKcal(d.steps))} kcal from steps · ${(d.steps * 0.00075).toFixed(1)} km`;
}
$('#addStepsBtn').onclick = () => { const n = +$('#addStepsInput').value; if (!n) return; day().steps = Math.max(0, day().steps + n); $('#addStepsInput').value = ''; save(); renderSteps(); renderGlance(); };

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
      $('#pStep').textContent = `Move ${i + 1} / ${w.moves.length}`; $('#pMove').textContent = w.moves[i];
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
function chatCtx() { return { persona: S.persona, hours: fastHours(), name: S.profile?.name, reason: S.fast?.reason || S.lastReason, fastType: S.fast?.type }; }
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
    <p>Evil Mochi uses <b>toxic motivation</b>. That means:</p>
    <ul class="small">
      <li>It can be harsh, rude and sarcastic.</li>
      <li>It may feel like bullying. That's on purpose, to push you.</li>
      <li>It's a joke character, not a real opinion about you.</li>
      <li>If you say you feel sick, faint, sad or unsafe, it drops the act and helps you for real.</li>
      <li>You can switch back to Sweet Mochi any time.</li>
    </ul>
    <label class="small" style="flex-direction:row;align-items:center;gap:8px;margin:10px 0"><input type="checkbox" id="evilOk" style="width:auto"> I am 16 or older, I understand all of this, and I want Evil Mochi anyway.</label>
    <div class="row gap"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn danger" id="evilGo" disabled>I agree, unleash it 😈</button></div>`, () => {
    $('#evilOk').onchange = e => $('#evilGo').disabled = !e.target.checked;
    $('#evilGo').onclick = () => { S.evilAgreed = true; closeModal(); setPersona('evil'); };
  });
}
function renderChat() {
  if (!S.chat.length) S.chat.push({ who: 'bot', text: mochiHello() });
  $('#chatLog').innerHTML = S.chat.slice(-60).map(m => `<div class="msg ${m.who} ${m.alert ? 'alert' : ''}">${esc(m.text)}${m.call ? `<br><a class="callbtn" href="tel:${esc(S.settings.emergency)}">📞 Call emergency ${esc(S.settings.emergency)}</a>` : ''}</div>`).join('');
  const last = [...S.chat].reverse().find(m => m.who === 'bot');
  const q = last?.quick || ['I feel great', 'Hungry', 'Want to break my fast', 'Dizzy', 'Motivate me', 'What\'s happening in my body?'];
  $('#quickReplies').innerHTML = q.map(x => `<button>${esc(x)}</button>`).join('');
  $('#quickReplies').querySelectorAll('button').forEach(b => b.onclick = () => sendChat(b.textContent));
  $('#chatLog').scrollTop = 1e9;
}
function sendChat(text) {
  if (!text.trim()) return;
  S.chat.push({ who: 'me', text }); renderChat();
  setTimeout(() => {
    buddyReply(text, chatCtx()).forEach(r => S.chat.push({ who: 'bot', ...r }));
    S.chat = S.chat.slice(-120); save(); renderChat();
  }, 500);
}
$('#chatForm').onsubmit = e => { e.preventDefault(); sendChat($('#chatInput').value); $('#chatInput').value = ''; };
$('#chatMic').onclick = () => listen(t => sendChat(t));
$('#switchMochi').onclick = personaModal;

// ================= MAIN LOOP =================
function renderHeader() {
  const h = new Date().getHours(), n = S.profile?.name;
  const g = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  $('#hello').textContent = `${g}${n ? ', ' + n : ''}${S.theme === 'kawaii' ? ' 🌸' : ''}`;
  $('#todayLabel').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}
function renderAll() { applyTheme(); renderHeader(); $('#stageCard').dataset.hr = ''; $('#fastControls').innerHTML = ''; renderFast(); renderPlan(); renderGlance(); renderSteps(); renderWorkouts(); renderBody(); notifState(); }

let lastMinute = -1;
setInterval(() => {
  renderFast(); checkFastHour();
  const m = new Date().getMinutes();
  if (m !== lastMinute) { lastMinute = m; checkReminders(); renderNext(); renderHeader(); }
}, 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { checkReminders(); renderAll(); } });

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').then(r => swReg = r).catch(() => {});

applyTheme(); renderAll();
if (!S.profile) profileForm(true);
