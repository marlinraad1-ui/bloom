// ================= BLOOM COACH: personal daily workouts =================
// A short quiz → a new workout every day made for you: short, intense intervals, focus that rotates,
// and it gets harder week by week (and adapts when you say "too easy" / "too hard").
// Every exercise shows a real person doing exactly that move (Pexels), or its own animation.

const PX_V = id => ({
  4764177: '4764177/4764177-sd_640_360_30fps.mp4', 8691724: '8691724/8691724-sd_960_506_24fps.mp4', 6525469: '6525469/6525469-sd_640_360_25fps.mp4',
  6286170: '6286170/6286170-sd_640_360_30fps.mp4', 8478087: '8478087/8478087-sd_640_360_25fps.mp4', 6286165: '6286165/6286165-sd_640_360_30fps.mp4',
  8837118: '8837118/8837118-sd_960_506_25fps.mp4', 8233047: '8233047/8233047-sd_506_960_25fps.mp4', 6525491: '6525491/6525491-sd_640_360_25fps.mp4',
  6525502: '6525502/6525502-sd_640_360_25fps.mp4', 6525475: '6525475/6525475-sd_640_360_25fps.mp4', 6525487: '6525487/6525487-sd_640_360_25fps.mp4',
  6525495: '6525495/6525495-sd_640_360_25fps.mp4', 8472284: '8472284/8472284-sd_640_360_25fps.mp4', 5025822: '5025822/5025822-sd_640_360_25fps.mp4',
  6286154: '6286154/6286154-sd_640_360_30fps.mp4', 6286161: '6286161/6286161-sd_640_360_30fps.mp4', 6286160: '6286160/6286160-sd_640_360_30fps.mp4',
  8836970: '8836970/8836970-sd_960_506_25fps.mp4', 6286173: '6286173/6286173-sd_640_360_30fps.mp4', 4159114: '4159114/4159114-sd_360_640_24fps.mp4',
  6389045: '6389045/6389045-sd_640_360_25fps.mp4', 8402077: '8402077/8402077-sd_360_640_30fps.mp4', 6077273: '6077273/6077273-sd_960_506_25fps.mp4',
  6707719: '6707719/6707719-sd_640_360_25fps.mp4', 6525490: '6525490/6525490-sd_640_360_25fps.mp4',
})[id];
const TALL = new Set([8233047, 4159114, 8402077]);

// zone: cardio / legs / glutes / abs / arms / full. jump: high impact. eq: what you need. lvl: 1 easy to 3 hard
const EX = {
  jacks:    { n: 'Jumping jacks', v: 4764177, zone: 'cardio', jump: 1, met: 8, lvl: 1, tip: ['Land softly on the balls of your feet', 'Arms all the way up', 'Easier: step out one leg at a time'] },
  highknee: { n: 'High knees', v: 8691724, zone: 'cardio', jump: 1, met: 8, lvl: 2, tip: ['Knees up to hip height', 'Pump your arms', 'Easier: march fast without jumping'] },
  climbers: { n: 'Mountain climbers', v: 6525469, zone: 'abs', met: 8, lvl: 2, tip: ['Hands under shoulders, flat back', 'Drive knees to chest fast', 'Easier: slow and controlled'] },
  burpee:   { n: 'Burpees', anim: 'burpee', zone: 'full', jump: 1, met: 10, lvl: 3, tip: ['Squat, hands down, jump back to plank', 'Jump up with arms high', 'Easier: step back instead of jumping'] },
  jsquat:   { n: 'Jump squats', anim: 'jumpsquat', zone: 'legs', jump: 1, met: 9, lvl: 3, tip: ['Sit back into a squat', 'Explode up, land soft', 'Easier: regular squats'] },
  splitj:   { n: 'Split jumps', anim: 'splitjump', zone: 'legs', jump: 1, met: 9, lvl: 3, tip: ['Lunge, then jump and switch legs', 'Land softly in a lunge', 'Easier: alternating lunges'] },
  boxing:   { n: 'Shadow boxing', v: 8478087, zone: 'cardio', met: 7.5, lvl: 1, tip: ['Fast jabs and crosses', 'Stay light on your feet', 'Breathe out on every punch'] },
  rope:     { n: 'Jump rope', v: 6286170, zone: 'cardio', jump: 1, eq: 'rope', met: 11, lvl: 2, tip: ['Small jumps, wrists turn the rope', 'Stay on the balls of your feet'] },
  stepup:   { n: 'Step ups', v: 6286165, zone: 'legs', eq: 'stairs', met: 7, lvl: 1, tip: ['Use a sturdy step or stair', 'Push through the heel', 'Switch legs each rep'] },
  squat:    { n: 'Squats', v: 8837118, zone: 'legs', met: 5.5, lvl: 1, tip: ['Feet shoulder width', 'Hips back like sitting on a chair', 'Chest up, knees over toes'] },
  sumo:     { n: 'Sumo squats', v: 6525475, zone: 'glutes', met: 5.5, lvl: 1, tip: ['Wide stance, toes out', 'Sink straight down', 'Squeeze your glutes up'] },
  lunge:    { n: 'Lunges', v: 8233047, zone: 'legs', met: 6, lvl: 1, tip: ['Big step, both knees 90°', 'Front knee over ankle', 'Alternate legs'] },
  rlunge:   { n: 'Reverse lunges', v: 6525491, zone: 'glutes', met: 6, lvl: 1, tip: ['Step back, lower the back knee', 'Push through the front heel', 'Easier on the knees'] },
  slunge:   { n: 'Side lunges', v: 6525502, zone: 'legs', met: 6, lvl: 2, tip: ['Step wide to one side', 'Sit back on that leg, other leg straight', 'Push back to center'] },
  bridge:   { n: 'Glute bridges', v: 6525487, zone: 'glutes', met: 4, lvl: 1, tip: ['Feet flat, close to your hips', 'Lift hips, squeeze at the top', 'Lower slowly'] },
  donkey:   { n: 'Donkey kicks', v: 6525495, zone: 'glutes', met: 4.5, lvl: 1, tip: ['On all fours, knee bent', 'Kick the heel up to the ceiling', 'Don\'t arch your lower back'] },
  kick:     { n: 'Squat + kick', anim: 'kick', zone: 'full', met: 7, lvl: 2, tip: ['Squat down', 'Stand up and kick forward', 'Switch legs'] },
  crunch:   { n: 'Crunches', v: 8472284, zone: 'abs', met: 4, lvl: 1, tip: ['Lower back stays on the floor', 'Lift shoulders, not your neck', 'Breathe out going up'] },
  bicycle:  { n: 'Bicycle crunches', v: 5025822, zone: 'abs', met: 5, lvl: 2, tip: ['Elbow to opposite knee', 'Slow and controlled', 'Other leg straight'] },
  legraise: { n: 'Leg raises', v: 6286154, zone: 'abs', met: 4.5, lvl: 2, tip: ['Hands under your hips', 'Legs straight up and slowly down', 'Easier: bend your knees'] },
  revcr:    { n: 'Reverse crunches', anim: 'crunch', zone: 'abs', met: 4.5, lvl: 1, tip: ['Knees to chest', 'Lift hips a little off the floor', 'Lower slowly'] },
  situp:    { n: 'Sit ups', v: 6286161, zone: 'abs', met: 5, lvl: 2, tip: ['Feet on the floor', 'Roll up to sitting', 'Easier: crunches'] },
  toetouch: { n: 'Toe touches', v: 6286160, zone: 'abs', met: 4.5, lvl: 1, tip: ['Legs up, reach for your toes', 'Shoulders lift off the floor'] },
  abcircle: { n: 'Seated ab circles', anim: 'abcircle', zone: 'abs', met: 4, lvl: 2, tip: ['Lean back, legs up', 'Draw circles with your knees'] },
  frog:     { n: 'Frog press', anim: 'frogpress', zone: 'abs', met: 4.5, lvl: 2, tip: ['Lie back, knees bent wide', 'Press legs out and pull back in'] },
  plank:    { n: 'Plank', v: 8836970, zone: 'abs', met: 4, lvl: 1, tip: ['Straight line head to heels', 'Squeeze belly and glutes', 'Easier: on your knees'] },
  tplank:   { n: 'T plank', anim: 'plank', zone: 'abs', met: 5, lvl: 3, tip: ['From plank, rotate and reach up', 'Switch sides'] },
  pushup:   { n: 'Push ups', v: 6286173, zone: 'arms', met: 6, lvl: 2, tip: ['Hands a bit wider than shoulders', 'Chest to the floor', 'Easier: on your knees'] },
  dips:     { n: 'Tricep dips', v: 4159114, zone: 'arms', eq: 'chair', met: 5, lvl: 2, tip: ['Hands on a chair behind you', 'Bend elbows straight back', 'Legs bent = easier'] },
  curls:    { n: 'Bicep curls', v: 6389045, zone: 'arms', eq: 'dumbbells', met: 4, lvl: 1, tip: ['Elbows stay at your sides', 'Curl up, lower slowly'] },
  inchworm: { n: 'Inchworms', anim: 'inchworm', zone: 'full', met: 5, lvl: 2, tip: ['Fold forward, walk hands out to plank', 'Walk hands back and stand'] },
};
const WARM = { n: 'Warm up: arm swings + march', v: 8402077, met: 3.5, tip: ['Loosen up, get warm', 'Breathe deep'] };
const COOL = { n: 'Cool down stretch', v: 6077273, met: 2.5, tip: ['Slow deep breaths', 'Hold each stretch'] };

const FOCUS_NAMES = { full: 'Full body burn', abs: 'Belly burn', legs: 'Legs & thighs', glutes: 'Booty builder', arms: 'Arms & upper body', cardio: 'Fat blast cardio' };
const FOCUS_EMOJI = { full: '🔥', abs: '💎', legs: '🦵', glutes: '🍑', arms: '💪', cardio: '⚡' };
const LEVEL_T = { 1: [30, 30], 2: [40, 20], 3: [45, 15] };

const wp = () => S.wprof;
function seeded(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = s * 16807 % 2147483647) / 2147483647; }
const dayNum = (d = new Date()) => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5) + d.getFullYear() * 400;

function canDo(e) {
  const p = wp();
  if (p.nojump && e.jump) return false;
  if (e.eq && !(p.equip || []).includes(e.eq)) return false;
  if (e.lvl > p.level + 1) return false;
  return true;
}

// focus for a given day: rotates through what you picked, with cardio days when you want to lose weight
function focusFor(d = new Date()) {
  const p = wp(), list = [...p.focus];
  if (p.goal === 'lose' && !list.includes('cardio')) list.push('cardio');
  if (!list.includes('full')) list.push('full');
  return list[dayNum(d) % list.length];
}

function buildSession(focus, minutes, seed) {
  const p = wp(), rnd = seeded(seed);
  const weeks = Math.floor((Date.now() - (p.since || Date.now())) / (7 * 864e5));
  let [work, rest] = LEVEL_T[p.level];
  work = Math.min(work + Math.floor(weeks / 2) * 5, 50); rest = Math.max(rest - Math.floor(weeks / 2) * 5, 10); // gets harder every 2 weeks
  const pool = Object.entries(EX).filter(([, e]) => canDo(e));
  const inZone = pool.filter(([, e]) => focus === 'full' ? true : focus === 'glutes' ? ['glutes', 'legs'].includes(e.zone) : e.zone === focus || (focus === 'cardio' && e.zone === 'full'));
  const extra = pool.filter(([, e]) => e.zone === 'cardio' || e.zone === 'full');
  const pick = (arr, n) => { const a = [...arr]; const out = []; while (a.length && out.length < n) out.push(a.splice(Math.floor(rnd() * a.length), 1)[0]); return out; };
  let moves = pick(inZone, 4);
  if (p.goal !== 'muscle') moves = moves.concat(pick(extra.filter(x => !moves.includes(x)), 1));
  if (moves.length < 4) moves = moves.concat(pick(pool.filter(x => !moves.includes(x)), 4 - moves.length));
  const round = moves.length * work + (moves.length - 1) * rest;
  const rounds = Math.max(2, Math.min(5, Math.round((minutes * 60 - 150 + 45) / (round + 45))));
  const steps = [{ ex: WARM, sec: 75, type: 'warm' }];
  for (let r = 1; r <= rounds; r++) {
    moves.forEach(([, e], i) => { steps.push({ ex: e, sec: work, type: 'work', info: `Round ${r} of ${rounds}` }); if (i < moves.length - 1) steps.push({ ex: { n: 'Rest' }, sec: rest, type: 'rest' }); });
    if (r < rounds) steps.push({ ex: { n: 'Round break: water and breathe' }, sec: 45, type: 'rest' });
  }
  steps.push({ ex: COOL, sec: 75, type: 'cool' });
  const secs = steps.reduce((a, s) => a + s.sec, 0);
  const kcal = Math.round(steps.reduce((a, s) => a + (s.ex.met || 1.5) * kg() * s.sec / 3600 * (s.type === 'rest' ? .4 : 1), 0));
  return { focus, moves: moves.map(([k]) => k), steps, secs, kcal, work, rest, rounds, title: FOCUS_NAMES[focus] };
}

function todaySession() { const p = wp(); return buildSession(focusFor(), p.minutes, dayNum() * 31 + (p.seedBump || 0)); }

// ---------- quiz ----------
function coachQuiz() {
  const p = S.wprof || { goal: 'lose', level: 1, minutes: 15, equip: [], nojump: false, focus: ['abs', 'glutes'] };
  const seg = (key, opts, multi) => `<div class="qz-opts ${multi ? 'multi' : ''}" data-key="${key}">${opts.map(([v, l, d]) => `<button type="button" data-v="${v}" class="qz-o ${multi ? ((p[key] || []).includes(v) ? 'on' : '') : (String(p[key]) === String(v) ? 'on' : '')}"><b>${l}</b>${d ? `<span>${d}</span>` : ''}</button>`).join('')}</div>`;
  openModal(`<h2>🏋️ Your personal plan</h2><p class="muted small">5 quick questions. Bloom makes you a new workout every day.</p>
    <h4 class="qz-q">1. Your goal</h4>${seg('goal', [['lose', '🔥 Lose weight', 'burn fat fast'], ['tone', '✨ Tone up', 'firm and lean'], ['muscle', '💪 Build muscle', 'get stronger']])}
    <h4 class="qz-q">2. Your fitness level</h4>${seg('level', [[1, '🌱 Beginner', 'new or coming back'], [2, '⚡ Intermediate', 'workout sometimes'], [3, '💀 Advanced', 'train a lot']])}
    <h4 class="qz-q">3. Time per day</h4>${seg('minutes', [[7, '7 min'], [12, '12 min'], [20, '20 min'], [30, '30 min']])}
    <h4 class="qz-q">4. Focus on (pick up to 3)</h4>${seg('focus', [['abs', '💎 Belly'], ['glutes', '🍑 Booty'], ['legs', '🦵 Legs'], ['arms', '💪 Arms'], ['full', '🔥 Full body']], true)}
    <h4 class="qz-q">5. What do you have?</h4>${seg('equip', [['chair', '🪑 Chair'], ['stairs', '🪜 Stairs or step'], ['dumbbells', '🏋️ Dumbbells'], ['rope', '🪢 Jump rope']], true)}
    <label class="small toggle-row" style="margin-top:10px"><input type="checkbox" id="qzJump" ${p.nojump ? 'checked' : ''}> 🤫 No jumping (knees, neighbours, apartment)</label>
    <button class="btn big vip-btn" id="qzGo" style="margin-top:12px">Make my plan ✨</button>`, m => {
    const st = JSON.parse(JSON.stringify(p));
    m.querySelectorAll('.qz-opts').forEach(g => g.querySelectorAll('.qz-o').forEach(b => b.onclick = () => {
      const key = g.dataset.key, v = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v;
      if (g.classList.contains('multi')) {
        const arr = st[key] || []; const i = arr.indexOf(v);
        if (i >= 0) arr.splice(i, 1); else { if (key === 'focus' && arr.length >= 3) return toast('Up to 3'); arr.push(v); }
        st[key] = arr; b.classList.toggle('on', arr.includes(v));
      } else { st[key] = v; g.querySelectorAll('.qz-o').forEach(x => x.classList.toggle('on', x === b)); }
    }));
    $('#qzGo').onclick = () => {
      if (!st.focus?.length) st.focus = ['full'];
      st.nojump = $('#qzJump').checked; st.since = S.wprof?.since || Date.now();
      S.wprof = st; save(); closeModal(); celebrate(); renderCoach(); toast('Your plan is ready 💪');
    };
  });
}

// ---------- Move tab ----------
const exVisual = (e, cls = '') => e.v && navigator.onLine
  ? `<video class="vid ${TALL.has(e.v) ? 'tall' : ''} ${cls}" src="https://videos.pexels.com/video-files/${PX_V(e.v)}" muted autoplay loop playsinline preload="metadata"></video>`
  : e.anim ? `<div class="lot ${cls}" data-a="${e.anim}"></div>` : `<span class="noviz">${FOCUS_EMOJI.full}</span>`;
const THUMB_NAME = { 6525469: 'exercises-girl-sport-sporty-6525469', 6525491: 'exercises-girl-sport-sporty-6525491', 6525502: 'exercises-girl-sport-sporty-6525502', 6525475: 'exercises-girl-sport-sporty-6525475', 6525487: 'exercises-girl-sport-sporty-6525487', 6525495: 'exercises-girl-sport-sporty-6525495', 6525490: 'exercises-girl-sport-sporty-6525490', 8478087: 'boxer-coach-gloves-master-of-sports-8478087', 8472284: 'boxer-coach-gloves-master-of-sports-8472284', 6077273: 'ball-balls-basketball-basketball-basket-6077273', 8402077: 'adult-athlete-ball-beautiful-8402077', 6707719: 'adult-balance-body-care-6707719' };
const exThumb = e => e.v ? `<img src="https://images.pexels.com/videos/${e.v}/${THUMB_NAME[e.v] || 'pexels-photo-' + e.v}.jpeg?auto=compress&cs=tinysrgb&w=200" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'🔥'}))">` : `<div class="lot" data-a="${e.anim}"></div>`;

const QUICK = [
  { id: 'q-belly', title: '7-min Belly Burn', emoji: '💎', focus: 'abs', min: 7 },
  { id: 'q-fat', title: '10-min Fat Blast', emoji: '⚡', focus: 'cardio', min: 10 },
  { id: 'q-booty', title: '12-min Booty Builder', emoji: '🍑', focus: 'glutes', min: 12 },
  { id: 'q-full', title: '15-min Full Body', emoji: '🔥', focus: 'full', min: 15 },
  { id: 'q-arms', title: '8-min Toned Arms', emoji: '💪', focus: 'arms', min: 8 },
  { id: 'q-legs', title: '10-min Lean Legs', emoji: '🦵', focus: 'legs', min: 10 },
];

function renderCoach() {
  const box = $('#coachCard'); if (!box) return;
  if (!S.wprof) {
    box.innerHTML = `<div class="coach-hero empty"><div class="ch-emoji">🏋️‍♀️</div><h3>Your personal workout plan</h3>
      <p class="small">Answer 5 quick questions and get a new short workout every day, made for your body, your goal and what you have at home.</p>
      <button class="btn big vip-btn" id="chQuiz">Start my plan ✨</button></div>`;
    $('#chQuiz').onclick = coachQuiz; return;
  }
  const s = todaySession(), done = (S.coachDone || {})[todayKey()];
  const streak = coachStreak();
  box.innerHTML = `<div class="coach-hero">
      <div class="ch-top"><span class="ch-tag">${FOCUS_EMOJI[s.focus]} Today · ${s.title}</span>${streak ? `<span class="ch-streak">🔥 ${streak} day${streak > 1 ? 's' : ''}</span>` : ''}</div>
      <div class="ch-vis">${exVisual(EX[s.moves[0]], 'chv')}</div>
      <h3 class="ch-title">${s.title}</h3>
      <div class="ch-stats"><span>⏱️ <b>${Math.round(s.secs / 60)}</b> min</span><span>⚡ <b>${s.kcal}</b> kcal</span><span>🔁 <b>${s.rounds}</b> rounds</span><span>${s.work}s on / ${s.rest}s off</span></div>
      <div class="ch-moves">${s.moves.map(k => `<button class="ch-move" data-ex="${k}">${exThumb(EX[k])}<span>${EX[k].n}</span></button>`).join('')}</div>
      <button class="btn big ${isVip() ? '' : 'vip-btn'}" id="chStart">${done ? '✓ Done today · do it again' : isVip() ? '▶ Start workout' : '🔒 Start with VIP'}</button>
      <div class="ch-links"><button class="linkbtn" id="chNew">🔀 Different workout</button><button class="linkbtn" id="chEdit">⚙️ My plan</button></div></div>
    <h3 class="ch-h">Quick workouts</h3>
    <div class="ch-quick">${QUICK.map(q => { const qs = buildSession(q.focus, q.min, dayNum() + q.id.length * 7); return `<button class="ch-q" data-q="${q.id}"><span class="cq-vis">${exThumb(EX[qs.moves[0]])}</span><b>${q.emoji} ${q.title}</b><span class="muted small">${qs.kcal} kcal · ${qs.moves.length} moves</span></button>`; }).join('')}</div>`;
  $('#chStart').onclick = () => isVip() ? playSession(s) : vipModal('workouts');
  $('#chNew').onclick = () => { S.wprof.seedBump = (S.wprof.seedBump || 0) + 1; save(); renderCoach(); };
  $('#chEdit').onclick = coachQuiz;
  box.querySelectorAll('[data-ex]').forEach(b => b.onclick = () => exSheet(b.dataset.ex));
  box.querySelectorAll('[data-q]').forEach(b => b.onclick = () => {
    const q = QUICK.find(x => x.id === b.dataset.q); const qs = buildSession(q.focus, q.min, dayNum() + q.id.length * 7); qs.title = q.title;
    sessionPage(qs);
  });
}

function exSheet(k) {
  const e = EX[k];
  openModal(`<div class="ex-sheet"><div class="ex-photo">${exVisual(e)}</div><h2>${e.n}</h2>
    <ul class="ex-tips">${e.tip.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    <div class="chips">${e.jump ? '<span class="chip">🦘 jumping</span>' : '<span class="chip">🤫 no jumping</span>'}${e.eq ? `<span class="chip">needs ${e.eq}</span>` : ''}<span class="chip">${'⭐'.repeat(e.lvl)} level</span></div>
    <button class="btn big" onclick="closeModal()" style="margin-top:12px">Got it</button></div>`);
}

function sessionPage(s) {
  openModal(`<div class="wk-hero"><button class="wk-back" onclick="closeModal()">‹</button>${exVisual(EX[s.moves[0]], 'wk-herovid')}<h1 class="wk-title">${esc(s.title)}</h1></div>
    <div class="wk-stats"><div>⏱️ <b>${Math.round(s.secs / 60)}</b> mins</div><span></span><div>⚡ <b>${s.kcal}</b> calories</div></div>
    <div class="wk-plan">⏱️ ${s.work} s work · ${s.rest} s rest · ${s.rounds} rounds</div>
    <h3 class="wk-h">Exercises (${s.moves.length})</h3>
    <div class="wk-list">${s.moves.map(k => `<div class="wk-ex" data-k="${k}"><div class="wk-thumb">${exThumb(EX[k])}</div><div><b>${EX[k].n}</b><span class="muted small">${s.work} s × ${s.rounds}</span></div></div>`).join('')}</div>
    <div class="wk-go"><button class="btn big" id="sgo">${isVip() ? '▶ Start Now' : '🔒 Start with VIP'}</button></div>`, m => {
    m.classList.add('full', 'wk-page');
    m.querySelectorAll('.wk-ex').forEach(r => r.onclick = () => { m.classList.remove('full', 'wk-page'); exSheet(r.dataset.k); });
    $('#sgo').onclick = () => { if (!isVip()) return vipModal('workouts'); m.classList.remove('full', 'wk-page'); playSession(s); };
  });
}

function coachStreak() {
  const d = S.coachDone || {}; let n = 0; const t = new Date();
  for (let i = 0; i < 400; i++) { const k = todayKey(new Date(t.getTime() - i * 864e5)); if (d[k]) n++; else if (i > 0) break; }
  return n;
}

// ---------- player ----------
function playSession(s) {
  const plan = s.steps, total = plan.reduce((a, x) => a + x.sec, 0);
  let i = 0, left = plan[0].sec, elapsed = 0, burned = 0, paused = false, t, shown = -1;
  const nextWork = from => plan.slice(from).find(x => x.type !== 'rest');
  openModal(`<div class="player">
    <div class="p-top"><span class="phase" id="pPhase"></span><span class="muted small" id="pStep"></span></div>
    <div class="move-emoji" id="pVis"></div>
    <div class="move-name" id="pMove"></div><div class="move-timer" id="pTime"></div>
    <ul class="p-tips" id="pTips"></ul>
    <div class="muted small" id="pNext"></div><div class="progress"><div id="pProg"></div></div>
    <p class="w-burn" id="pBurn"></p>
    <div class="row gap" style="justify-content:center"><button class="btn ghost" id="pPause">⏸ Pause</button><button class="btn ghost" id="pSkip">⏭ Skip</button><button class="btn" id="pStop">Finish</button></div>
    <label class="small toggle-row" style="justify-content:center"><input type="checkbox" id="pVoice" ${S.settings.voiceCoach === false ? '' : 'checked'}> 🔊 Voice coach</label></div>`, () => {
    const announce = () => { const x = plan[i], n = nextWork(i + 1); coachSay(x.type === 'rest' ? `Rest. ${n ? 'Next, ' + n.ex.n : 'Almost done'}` : x.type === 'cool' ? 'Amazing work. Cool down.' : x.type === 'warm' ? 'Let\'s warm up' : `Go! ${x.ex.n}`); };
    const draw = () => {
      const x = plan[i], [label, cls] = PHASE[x.type];
      $('#pPhase').textContent = label; $('#pPhase').className = 'phase ' + cls;
      $('#pStep').textContent = x.info || '';
      if (shown !== i) {
        shown = i; const target = x.type === 'rest' ? nextWork(i + 1) : x;
        $('#pVis').innerHTML = target ? exVisual(target.ex) + (x.type === 'rest' ? '<span class="next-tag">Next</span>' : '') : '💖';
        $('#pVis').classList.toggle('resting', x.type === 'rest');
        $('#pTips').innerHTML = target?.ex.tip ? target.ex.tip.slice(0, 2).map(tp => `<li>${esc(tp)}</li>`).join('') : '';
      }
      $('#pMove').textContent = x.type === 'rest' ? (nextWork(i + 1) ? `Next: ${nextWork(i + 1).ex.n}` : 'Last one done!') : x.ex.n;
      $('#pTime').textContent = fmtHMS(left * 1000).slice(3);
      const n = plan[i + 1]; $('#pNext').textContent = n ? `Then: ${n.ex.n}${n.type === 'rest' ? ' ' + n.sec + ' s' : ''}` : 'Last one!';
      $('#pProg').style.width = (elapsed / total * 100) + '%';
      $('#pBurn').textContent = `🔥 ${Math.round(burned)} kcal · ${fmtMS(elapsed)} of ${fmtMS(total)}`;
    };
    const finish = () => {
      clearInterval(t); try { speechSynthesis.cancel(); } catch (e) {}
      if (elapsed > 60) {
        day().workouts.push({ name: s.title, min: Math.round(elapsed / 60), kcal: burned, at: Date.now() });
        S.coachDone = S.coachDone || {}; S.coachDone[todayKey()] = true; save(); renderWorkouts(); renderGlance(); renderCoach();
        if (window.markSessionDone && S.program?.active) markSessionDone();
        openModal(`<div class="done-sheet"><div class="ch-emoji">🎉</div><h2>Workout done!</h2><p><b>${Math.round(burned)} kcal</b> burned in ${fmtMS(elapsed)} · 🔥 ${coachStreak()} day streak</p>
          <p class="small">How was it?</p><div class="row gap" style="justify-content:center"><button class="btn ghost" data-f="-1">😮‍💨 Too hard</button><button class="btn ghost" data-f="0">👌 Just right</button><button class="btn ghost" data-f="1">😎 Too easy</button></div></div>`, m => {
          celebrate();
          m.querySelectorAll('[data-f]').forEach(b => b.onclick = () => {
            const f = +b.dataset.f; if (S.wprof) S.wprof.level = Math.max(1, Math.min(3, S.wprof.level + f)); save(); closeModal(); renderCoach();
            toast(f > 0 ? 'Next ones get harder 💀' : f < 0 ? 'Next ones get a bit easier 🌱' : 'Perfect, keep it up 💪');
          });
        });
      } else closeModal();
    };
    const next = () => { i++; if (i >= plan.length) return finish(); left = plan[i].sec; playBeep(); announce(); };
    t = setInterval(() => {
      if (paused || !$('#pMove')) return;
      left--; elapsed++; const x = plan[i]; burned += (x.ex.met || 1.5) * kg() / 3600 * (x.type === 'rest' ? .4 : 1);
      if (left === 3 && plan[i + 1]) coachSay('3, 2, 1');
      if (left <= 0) next(); if ($('#pMove')) draw();
    }, 1000);
    $('#pPause').onclick = () => { paused = !paused; $('#pPause').textContent = paused ? '▶ Resume' : '⏸ Pause'; };
    $('#pSkip').onclick = () => { next(); if ($('#pMove')) draw(); };
    $('#pStop').onclick = finish;
    $('#pVoice').onchange = e => { S.settings.voiceCoach = e.target.checked; save(); };
    draw(); announce();
  });
}

renderCoach();
const _showViewC = showView;
showView = function (v) { _showViewC(v); if (v === 'move') renderCoach(); };
