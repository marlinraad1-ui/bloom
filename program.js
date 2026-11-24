// ================= WORKOUT PROGRAM: day by day, 2 sessions a day =================
// Morning + evening session every day. Miss them by midnight and Bloom calls you out
// and asks if you're serious. Long fasts automatically switch to gentle workouts.

const W_TYPE = {
  cardio: ['walk', 'lowcardio', 'walk-home', 'rope', 'hiit', 'tabata', 'silent-hiit', 'stairs', 'm-walkfast', 'm-burpee', 'w-hiit'],
  dance: ['dance', 'kp-bp', 'kp-bts', 'kp-twice', 'kp-skz', 'kp-aespa'],
  strength: ['w-tone', 'w-glute', 'w-strong', 'm-body', 'w-booty', 'kp-idol', 'pil-booty', 'arm-sculpt', 'stand-abs', 'mat-abs'],
  recovery: ['powyoga', 'w-pilates', 'walk', 'walk-home', 'pil-booty']
};
// what each day of the week looks like (morning, evening)
const WEEK = [['cardio', 'strength'], ['dance', 'strength'], ['cardio', 'recovery'], ['dance', 'strength'], ['cardio', 'strength'], ['dance', 'recovery'], ['cardio', 'dance']];
const LVL = { simple: 1, medium: 2, max: 3 };
const prog = () => S.program;
const dayDiff = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);

function sessionsFor(dateKey) {
  const p = prog(); if (!p?.active) return [];
  const idx = Math.max(0, dayDiff(p.start, dateKey));
  const fastDay = S.fast ? Math.floor((new Date(dateKey + 'T12:00') - S.fast.start) / 864e5) + 1 : 0;
  const maxLvl = fastDay >= 3 ? 1 : fastDay === 2 ? Math.min(2, LVL[p.level]) : LVL[p.level];
  const who = p.who === 'all' ? null : p.who;
  return WEEK[idx % 7].map((type, k) => {
    let ids = W_TYPE[type];
    if (p.kpop && type === 'dance') ids = ids.filter(i => i.startsWith('kp-'));
    let pool = WORKOUTS.filter(w => ids.includes(w.id) && (w.who === 'all' || !who || w.who === who) && (w.goal === 'both' || w.goal === p.goal || type === 'cardio' || type === 'dance' || type === 'recovery') && LVL[w.level] <= maxLvl && workoutKcal(w, w.min) >= 80);
    if (typeof hasGear === 'function') pool = pool.filter(w => hasGear(w) && (!S.wf.nojump || !w.jump));
    if (!pool.length) pool = WORKOUTS.filter(w => w.level === 'simple' && !w.needs && !w.jump && workoutKcal(w, w.min) >= 80);
    const exact = pool.filter(w => LVL[w.level] === maxLvl);
    const use = exact.length ? exact : pool;
    const w = use[(idx + k * 3) % use.length];
    return { slot: k ? 'pm' : 'am', label: k ? '🌙 Evening' : '☀️ Morning', time: k ? p.pm : p.am, w, gentle: fastDay >= 3 };
  });
}
function progDay(k = todayKey()) { const d = day(k); d.prog = d.prog || { am: false, pm: false }; return d.prog; }
function todayWorkouts() {
  if (!prog()?.active) return null;
  const st = progDay(); return { done: (st.am ? 1 : 0) + (st.pm ? 1 : 0), total: 2 };
}
// called whenever any workout gets logged
function markSessionDone() {
  if (!prog()?.active) return;
  const st = progDay(); const slot = !st.am && nowMin() < 15 * 60 ? 'am' : !st.pm ? 'pm' : !st.am ? 'am' : null;
  if (!slot) return;
  st[slot] = true;
  const it = S.today?.items.find(i => i.prog === slot); if (it) it.done = true;
  save();
  if (st.am && st.pm) { celebrate(); toast(S.persona === 'evil' ? 'Both done. Fine. I\'m impressed. Don\'t tell anyone 😈' : 'Both workouts done today! You\'re unstoppable 🏆'); }
  renderProgram();
}
function programItems() {
  return sessionsFor(todayKey()).map(s => ({ time: s.time, title: `🏋️ ${s.slot === 'am' ? 'Workout 1' : 'Workout 2'}: ${s.w.name}`, why: `${s.w.min} min, about ${Math.round(workoutKcal(s.w, s.w.min))} kcal. 2 a day is the deal.`, alarm: true, notify: true, prog: s.slot }));
}

function programSetup() {
  const p = prog() || { goal: 'loss', level: 'medium', who: S.profile?.sex === 'male' ? 'men' : S.profile?.sex === 'female' ? 'women' : 'all', kpop: false, am: '09:00', pm: '19:00' };
  const seg = (id, opts, cur) => `<div class="seg" id="${id}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" class="${cur === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  openModal(`<h2>🗓️ My workout program</h2>
    <p class="muted small">2 workouts every day, morning and evening. A different plan each day of the week. Miss them by midnight and Bloom will ask if you're serious.</p>
    <div class="field"><label>Goal</label>${seg('pgGoal', [['loss', '🔥 Lose weight'], ['gain', '💪 Build muscle']], p.goal)}</div>
    <div class="field"><label>Level</label>${seg('pgLevel', [['simple', '🌱 Simple'], ['medium', '⚡ Medium'], ['max', '💀 Burn the most']], p.level)}</div>
    <div class="field"><label>Made for</label>${seg('pgWho', [['women', '👩 Women'], ['men', '👨 Men'], ['all', '🧑 Everyone']], p.who)}</div>
    <label class="small toggle-row"><input type="checkbox" id="pgKpop" ${p.kpop ? 'checked' : ''}> 🎤 Use K-pop dance workouts on dance days</label>
    <div class="row gap"><label class="small">☀️ Workout 1<input type="time" id="pgAm" value="${p.am}"></label><label class="small">🌙 Workout 2<input type="time" id="pgPm" value="${p.pm}"></label></div>
    <div class="warnbox">On fasting day 3 and later, Bloom switches you to Simple workouts automatically. Feeling dizzy or sick? Skip it, rest, and do a body check. That never counts as failing.</div>
    <button class="btn big" id="pgSave">${p.active ? 'Save program' : 'Start my program 💪'}</button>
    ${p.active ? '<button class="linkbtn" id="pgStop" style="display:block;margin:10px auto 0">Stop program</button>' : ''}`, m => {
    const val = {};
    ['pgGoal', 'pgLevel', 'pgWho'].forEach(id => { val[id] = m.querySelector(`#${id} .on`)?.dataset.v; m.querySelectorAll(`#${id} button`).forEach(b => b.onclick = () => { val[id] = b.dataset.v; m.querySelectorAll(`#${id} button`).forEach(x => x.classList.toggle('on', x === b)); }); });
    $('#pgSave').onclick = () => {
      S.program = { active: true, start: p.active ? p.start : todayKey(), goal: val.pgGoal, level: val.pgLevel, who: val.pgWho, kpop: $('#pgKpop').checked, am: $('#pgAm').value || '09:00', pm: $('#pgPm').value || '19:00' };
      ensureToday(); S.today.items = S.today.items.filter(i => !i.prog).concat(programItems().map(x => ({ ...x, id: uid(), done: !!progDay()[x.prog], fired: minutes(x.time) < nowMin() - 5 })));
      save(); closeModal(); renderProgram(); renderPlan(); celebrate(); toast('Program on. 2 a day, no excuses 💪');
    };
    if ($('#pgStop')) $('#pgStop').onclick = () => { S.program.active = false; S.today.items = S.today.items.filter(i => !i.prog); save(); closeModal(); renderProgram(); renderPlan(); };
  });
}

function renderProgram() {
  const box = $('#programCard'); if (!box) return;
  const p = prog();
  if (!p?.active) {
    box.innerHTML = `<h3>🗓️ My workout program</h3><p>A day by day plan with <b>2 workouts every day</b>, picked for your goal and level. Bloom reminds you, and calls you out if you skip.</p><button class="btn" id="pgStart">Create my program</button>`;
    $('#pgStart').onclick = programSetup; return;
  }
  const k = todayKey(), dayN = dayDiff(p.start, k) + 1, ses = sessionsFor(k), st = progDay(k);
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); const dk = todayKey(d); const pr = S.days[dk]?.prog; const n = pr ? (pr.am ? 1 : 0) + (pr.pm ? 1 : 0) : 0; const before = dayDiff(p.start, dk) < 0; return { dk, n, before, today: dk === k, label: d.toLocaleDateString(undefined, { weekday: 'narrow' }) }; });
  let streak = 0; for (let i = 0; ; i++) { const d = new Date(); d.setDate(d.getDate() - 1 - i); const pr = S.days[todayKey(d)]?.prog; if (pr?.am && pr?.pm) streak++; else break; }
  box.innerHTML = `<div class="row between"><h3>🗓️ Day ${dayN} of your program</h3><button class="linkbtn" id="pgEdit">⚙️</button></div>
    <div class="week">${week.map(w => `<div class="wday ${w.today ? 'today' : ''} ${w.before ? 'before' : w.n === 2 ? 'full' : w.n === 1 ? 'half' : w.today ? '' : 'miss'}"><span>${w.label}</span><b>${w.before ? '·' : w.n === 2 ? '✓' : w.n === 1 ? '½' : w.today ? '…' : '✕'}</b></div>`).join('')}</div>
    ${streak ? `<p class="streak">🔥 ${streak} day streak of 2-a-day!</p>` : ''}
    ${ses.map(s => `<div class="session ${st[s.slot] ? 'done' : ''}"><div class="s-time">${s.label}<br><b>${s.time}</b></div>
      <div class="s-main"><b>${s.w.emoji} ${esc(s.w.name)}</b><div class="small muted">${s.w.min} min · about ${Math.round(workoutKcal(s.w, s.w.min))} kcal${s.gentle ? ' · gentle (fasting day 3+)' : ''}</div></div>
      ${st[s.slot] ? '<span class="s-check">✓</span>' : `<button class="btn sm" data-start="${s.w.id}">▶</button>`}</div>`).join('')}`;
  $('#pgEdit').onclick = programSetup;
  box.querySelectorAll('[data-start]').forEach(b => b.onclick = () => playWorkout(WORKOUTS.find(w => w.id === b.dataset.start)));
}

// ---- the midnight check ----
const SHAME = {
  sweet: [
    n => `Hey… you skipped ${n} workout${n > 1 ? 's' : ''} yesterday 🥺 I'm not mad. But I have to ask you honestly:`,
    n => `Yesterday ended with ${n} workout${n > 1 ? 's' : ''} not done. That's okay once. But let me ask you something real:`
  ],
  evil: [
    n => `Wow. ${n} workout${n > 1 ? 's' : ''} skipped. Your couch must be SO proud of you 🛋️`,
    n => `Midnight came. Your workouts didn't. ${n} missed. Impressive, in the worst way.`,
    n => `So we're just skipping workouts now? ${n} of them? Your fat says thank you 😈`,
    n => `${n} workout${n > 1 ? 's' : ''} missed. I've seen snails with more drive.`
  ]
};
function midnightCheck() {
  const p = prog(); if (!p?.active) return;
  const y = new Date(); y.setDate(y.getDate() - 1); const yk = todayKey(y);
  if (S.judged === yk || dayDiff(p.start, yk) < 0) return;
  S.judged = yk; save();
  const pr = S.days[yk]?.prog || {}; const missed = 2 - ((pr.am ? 1 : 0) + (pr.pm ? 1 : 0));
  if (missed <= 0) return;
  // never shame someone who was unwell
  const sick = (S.days[yk]?.checks || []).some(c => c.level >= 2);
  if (sick) { toast('You rested yesterday because you felt unwell. That was the right call 🫶'); return; }
  const persona = S.persona === 'evil' ? 'evil' : 'sweet';
  openModal(`<div class="shame ${persona}"><div class="shame-face">${persona === 'evil' ? '😈' : '🥺'}</div>
    <p class="shame-line">${esc(pick(SHAME[persona])(missed))}</p>
    <h2 class="glow-text">Are you serious about losing weight?</h2>
    <div class="shame-btns"><button class="btn big" id="shYes">Yes. I'm serious 💪</button><button class="btn ghost" id="shNo">Honestly… not right now</button></div></div>`, () => {
    $('#shYes').onclick = () => {
      S.serious = (S.serious || 0) + 1; save();
      openModal(`<div class="shame"><div class="shame-face">🔥</div><h2>Then prove it today.</h2>
        <p>${persona === 'evil' ? 'Words are cheap. Workout 1 is at ' + p.am + '. Be there.' : 'I believe you 🫶 Workout 1 is at ' + p.am + '. Let\'s make today count.'}</p>
        <button class="btn big" id="shExtra">➕ Add a make-up session today</button><button class="btn ghost big" style="margin-top:8px" onclick="closeModal()">Just my 2 workouts</button></div>`, () => {
        $('#shExtra').onclick = () => {
          const w = WORKOUTS.find(x => x.id === 'walk');
          ensureToday(); S.today.items.push({ id: uid(), time: '13:00', title: `🔁 Make-up: ${w.name} ${w.min} min`, why: 'You said you\'re serious. This is how serious looks.', alarm: true, notify: true, done: false, fired: nowMin() > 13 * 60 });
          save(); renderPlan(); closeModal(); toast('Make-up session added for 13:00 💪');
        };
      });
    };
    $('#shNo').onclick = () => openModal(`<div class="shame"><div class="shame-face">🫶</div><h2>Thank you for being honest.</h2>
      <p>What's getting in the way? Too hard, no time, or no energy? You can make it easier and still keep going.</p>
      <button class="btn big" id="shEasy">🌱 Switch to Simple workouts</button><button class="btn ghost big" style="margin-top:8px" id="shTalk">💬 Talk to Mochi</button></div>`, () => {
      $('#shEasy').onclick = () => { S.program.level = 'simple'; save(); closeModal(); renderProgram(); toast('Switched to Simple. Small steps still count 🌱'); };
      $('#shTalk').onclick = () => { closeModal(); showView('chat'); sendChat('I skipped my workouts and I\'m losing motivation'); };
    });
  });
}
// evening warning if workouts are still open
function eveningNag() {
  const t = todayWorkouts(); if (!t || t.done >= 2) return;
  const k = todayKey(); if (S.nagged === k || nowMin() < 21 * 60) return;
  S.nagged = k; save();
  const left = 2 - t.done, msg = S.persona === 'evil' ? `${left} workout${left > 1 ? 's' : ''} left and the day is almost over. Tick tock 😈` : `${left} workout${left > 1 ? 's' : ''} left today. There's still time before midnight 💪`;
  notify('🏋️ Workouts left today', msg); toast(msg);
}

if (S.program?.active) { ensureToday(); if (!S.today.items.some(i => i.prog)) { S.today.items = S.today.items.concat(programItems().map(x => ({ ...x, id: uid(), done: !!progDay()[x.prog], fired: minutes(x.time) < nowMin() - 5 }))); save(); } }
renderProgram(); renderPlan(); midnightCheck();
