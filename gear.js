// ================= WORKOUTS: home gear, no jumping, VIP workout pages =================
// Everyone: pick what you have at home + "no jumping", list is always sorted by most calories.
// VIP: "Best for you" pick and a full workout page with every exercise.

const GEAR = [
  ['none', '🙌', 'No equipment'], ['mat', '🧘', 'Yoga mat'], ['treadmill', '🏃', 'Treadmill'], ['bike', '🚴', 'Exercise bike'],
  ['dumbbells', '🏋️', 'Dumbbells'], ['rope', '🪢', 'Jump rope'], ['band', '🎗️', 'Resistance band'], ['stairs', '🪜', 'Stairs or a step'], ['bar', '🤸', 'Pull-up bar'],
];

// more workouts that use home equipment (all burn a lot)
WORKOUTS.push(
  { id: 'tm-incline', name: 'Treadmill incline walk', emoji: '⛰️', met: 7.0, min: 30, level: 'medium', who: 'all', goal: 'loss', needs: ['treadmill'],
    help: 'Steep incline, steady walk. Burns like a jog with zero jumping. A favourite for melting belly fat.',
    moves: ['Warm up flat walk', 'Incline 8%', 'Incline 10%', 'Incline 12%', 'Incline 12% fast', 'Incline 10%', 'Cool down flat walk'],
    video: 'treadmill incline walk workout 30 minutes' },
  { id: 'tm-sprint', name: 'Treadmill sprint intervals', emoji: '🏃', met: 10.0, min: 25, level: 'max', who: 'all', goal: 'loss', needs: ['treadmill'], jump: true,
    help: 'Short sprints and walking breaks. One of the biggest burns you can get in 25 minutes.',
    moves: ['Warm up walk', 'Jog', 'Sprint 30s', 'Walk', 'Sprint 30s', 'Walk', 'Sprint 30s', 'Walk', 'Jog', 'Cool down walk'],
    video: 'treadmill sprint interval workout 25 minutes' },
  { id: 'bike-hiit', name: 'Bike HIIT', emoji: '🚴', met: 8.5, min: 30, level: 'max', who: 'all', goal: 'loss', needs: ['bike'],
    help: 'Hard pedalling bursts, kind to your knees, totally silent.',
    moves: ['Easy spin', 'Climb', 'Sprint 30s', 'Recover', 'Sprint 30s', 'Recover', 'Climb', 'Sprint 30s', 'Easy spin'],
    video: 'stationary bike HIIT workout 30 minutes' },
  { id: 'db-burn', name: 'Dumbbell fat burn circuit', emoji: '🏋️', met: 6.5, min: 30, level: 'medium', who: 'all', goal: 'loss', needs: ['dumbbells'],
    help: 'Weights plus cardio pace. Burns now and keeps burning after.',
    moves: ['Goblet squats', 'Dumbbell swings', 'Renegade rows', 'Thrusters', 'Reverse lunges', 'Russian twists', 'Stretch'],
    video: 'dumbbell fat burning circuit 30 minutes no jumping' },
  { id: 'band-sculpt', name: 'Resistance band sculpt', emoji: '🎗️', met: 5.0, min: 30, level: 'simple', who: 'all', goal: 'both', needs: ['band'],
    help: 'Tones arms, booty and legs. Quiet and easy on joints.',
    moves: ['Band squats', 'Lateral walks', 'Glute kickbacks', 'Band rows', 'Shoulder press', 'Bicep curls', 'Stretch'],
    video: 'resistance band full body workout 30 minutes' },
  { id: 'stairs', name: 'Stair climber blast', emoji: '🪜', met: 8.8, min: 25, level: 'max', who: 'all', goal: 'loss', needs: ['stairs'],
    help: 'Climbing is one of the highest burns with no jumping at all.',
    moves: ['Easy step ups', 'Stairs steady', 'Stairs fast', 'Walk down rest', 'Two steps at a time', 'Stairs fast', 'Cool down'],
    video: 'stair workout at home 25 minutes' },
  { id: 'mat-abs', name: 'Flat belly mat burn', emoji: '🔥', met: 5.5, min: 25, level: 'medium', who: 'all', goal: 'loss',
    help: 'Core moves back to back with no rest. Lying down, no jumping, neighbours won\'t know.',
    moves: ['Toe touch crunch', 'Leg raises', 'Bicycle crunch', 'Russian twists', 'Flutter kicks', 'Dead bug', 'Hip bridges', 'Plank hold', 'Stretch'],
    video: 'flat belly ab workout 25 minutes no jumping' },
  { id: 'silent-hiit', name: 'Silent HIIT (no jumping)', emoji: '🤫', met: 7.0, min: 30, level: 'max', who: 'all', goal: 'loss',
    help: 'All the sweat of HIIT, zero jumping. Perfect for apartments and sore knees.',
    moves: ['March warm up', 'Squat to reach', 'Slow mountain climbers', 'Reverse lunge knee drive', 'Plank shoulder taps', 'Skater steps', 'Standing cross crunch', 'Cool down'],
    video: 'silent no jumping HIIT workout 30 minutes apartment friendly' },
);
// which workouts have jumping / need equipment
const JUMPY = ['hiit', 'rope', 'run', 'w-hiit', 'm-burpee', 'w-strong', 'm-cali', 'kp-skz'];
const NEEDS = { cycle: ['bike'], rope: ['rope'], 'm-cali': ['bar'], 'm-dumb': ['dumbbells'], 'w-strong': ['dumbbells'] };
WORKOUTS.forEach(w => { if (JUMPY.includes(w.id)) w.jump = true; if (NEEDS[w.id]) w.needs = NEEDS[w.id]; });

const hasGear = w => !w.needs || w.needs.some(g => (S.gear || ['none']).includes(g));

// exercise picture for each move
const MOVE_ICONS = [
  [/rest|recover/i, '😮‍💨'], [/stretch|cool down|sway/i, '🧘'], [/\b(sprint|run|jog)/i, '🏃'], [/walk|march|incline|warm up/i, '🚶'],
  [/stairs|step/i, '🪜'], [/spin|climb|bike/i, '🚴'], [/rope|bounce|double speed|alternate feet/i, '🪢'], [/jab|hook|uppercut|slip|stance|box/i, '🥊'],
  [/burpee|jack|jump|skater|high knees/i, '🤸'], [/combo|groove|freestyle|dance/i, '💃'], [/salutation|warrior|chair|cobra|boat|swan|hundred|roll up|circles/i, '🧘'],
  [/crunch|twist|leg raise|flutter|dead bug|abs|toe touch|knee raise/i, '🔥'], [/plank|mountain|bird dog/i, '💪'], [/push|dip|press|pull/i, '💪'],
  [/glute|bridge|hip|donkey|hydrant|kickback|frog|booty/i, '🍑'], [/squat|lunge|wall sit|calf|deadlift/i, '🦵'], [/dumbbell|row|curl|swing|thruster|band/i, '🏋️'],
];
const moveIcon = m => (MOVE_ICONS.find(([r]) => r.test(m)) || [0, '⭐'])[1];
// real exercise photo (2 frames that flip, so it moves) or the icon when there is no photo
// animation for a move (bike and treadmill workouts keep showing the machine)
function animFor(m, w) {
  if (w && /rest|recover|cool down$/i.test(m)) return exFor(m);
  if (w && (w.id === 'cycle' || (w.needs || []).includes('bike'))) return 'bike';
  if (w && (w.needs || []).includes('treadmill')) return 'treadmill';
  return exFor(m);
}
// real person video (Pexels) first, animation if there's no video or no internet, icon last
const exPic = (m, cls = '', w) => {
  const a = animFor(m, w);
  const lot = a ? `<div class="lot ${cls}" data-a="${a}" data-fallback="${moveIcon(m)}" role="img" aria-label="${esc(m)}"></div>` : moveIcon(m);
  const v = navigator.onLine && typeof vidFor === 'function' ? vidFor(m, w) : null;
  if (!v) return lot;
  return cls === 'big' ? videoHTML(v, lot)
    : `<img class="vthumb" src="${vidThumb(v)}" alt="${esc(m)}" loading="lazy" data-fb="${esc(lot)}" onerror="this.outerHTML=this.dataset.fb">`;
};
const playerVisual = (m, w) => isVip() ? exPic(m, 'big', w) : moveIcon(m);

// how to do one exercise (VIP)
function exerciseSheet(m, back, w) {
  const info = null;
  openModal(`<div class="ex-sheet"><div class="ex-photo">${exPic(m, 'big', w)}</div>
    <h2>${esc(m)}</h2>${info ? `<ol class="ex-steps">${info.s.map(t => `<li>${esc(t)}</li>`).join('')}</ol>` : (/combo|groove|freestyle|dance/i.test(m) ? '<p>Follow the music and copy the moves. Big arms, soft knees, keep moving!</p>' : '<p>Move slowly and with control. Breathe out on the hard part. Stop if anything hurts or you feel dizzy.</p>')}
    <button class="btn big" id="exBack">‹ Back to workout</button></div>`, () => { $('#exBack').onclick = back; });
}
const fmtMS = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

// best workout for you: matches your gear, jumping choice, goal and fasting day; most calories wins
function bestWorkout() {
  const h = fastHours(), fastDay = S.fast ? Math.floor(h / 24) + 1 : 0;
  const who = S.wf.who || (S.profile?.sex === 'male' ? 'men' : S.profile?.sex === 'female' ? 'women' : 'all');
  return WORKOUTS.filter(w => (w.who === 'all' || who === 'all' || w.who === who) && hasGear(w) && (!S.wf.nojump || !w.jump) && (w.goal === 'both' || w.goal === S.wf.goal))
    .filter(w => !S.fast || w.level === 'simple' || (w.level === 'medium' && fastDay < 3) || (w.level === 'max' && fastDay < 2))
    .sort((a, b) => workoutKcal(b, b.min) - workoutKcal(a, a.min))[0];
}

function gearModal() {
  let pick = new Set(S.gear || ['none']);
  openModal(`<h2>🏠 What do you have at home?</h2><p class="muted small">Pick everything you have. Bloom shows workouts you can really do, with the biggest burn first.</p>
    <div class="gear-grid">${GEAR.map(([k, e, n]) => `<button type="button" class="gear ${pick.has(k) ? 'on' : ''}" data-g="${k}"><span>${e}</span>${n}</button>`).join('')}</div>
    <button class="btn big" id="gearOk" style="margin-top:12px">Show my workouts</button>`, m => {
    m.querySelectorAll('[data-g]').forEach(b => b.onclick = () => {
      const k = b.dataset.g; pick.has(k) ? pick.delete(k) : pick.add(k);
      if (!pick.size) pick.add('none');
      m.querySelectorAll('[data-g]').forEach(x => x.classList.toggle('on', pick.has(x.dataset.g)));
    });
    $('#gearOk').onclick = () => { S.gear = [...pick]; save(); closeModal(); renderWorkouts(); };
  });
}

// big real video at the top of the workout page (first move that has one)
function heroVid(w) {
  const m = navigator.onLine && typeof vidFor === 'function' ? w.moves.find(x => !/rest|recover|cool down|warm up/i.test(x) && vidFor(x, w)) : null;
  return m ? `<video class="wk-herovid" src="${vidSrc(vidFor(m, w))}" poster="${vidThumb(vidFor(m, w))}" muted autoplay loop playsinline onerror="this.remove()"></video>` : `<div class="wk-big">${w.emoji}</div>`;
}
// VIP workout page
function workoutPage(w) {
  if (!isVip()) return vipModal('workouts');
  const per = w.min * 60 / w.moves.length, kcal = Math.round(workoutKcal(w, w.min));
  openModal(`<div class="wk-hero"><button class="wk-back" onclick="closeModal()">‹</button>${heroVid(w)}
      <h1 class="wk-title">${esc(w.name)}</h1></div>
    <div class="wk-stats"><div>⏱️ <b>${w.min}</b> mins</div><span></span><div>⚡ <b>${kcal}</b> calories</div></div>
    <div class="wk-tags">${w.jump ? '<span class="chip">🦘 Has jumping</span>' : '<span class="chip">🤫 No jumping</span>'}${(w.needs || []).map(g => { const x = GEAR.find(y => y[0] === g); return `<span class="chip">${x[1]} ${x[2]}</span>`; }).join('')}<span class="chip">🔥 ${Math.round(kcal / 7.7)} g fat</span></div>
    <h3 class="wk-h">Exercises (${w.moves.length})</h3>
    <div class="wk-list">${w.moves.map((m, i) => `<div class="wk-ex" data-i="${i}"><div class="wk-thumb">${exPic(m, '', w)}</div><div><b>${esc(m)}</b><span class="muted small">${fmtMS(per)} · move ${i + 1}</span></div></div>`).join('')}</div>
    <p class="muted small wk-video">Tap an exercise to see how to do it.<br><span class="tiny">Videos from Pexels. Animations from LottieFiles artists.</span></p>
    <div class="wk-go"><button class="btn big" id="wkStart">▶ Start Now</button></div>`, m => {
    m.classList.add('full', 'wk-page');
    $('#wkStart').onclick = () => { m.classList.remove('full', 'wk-page'); playWorkout(w); };
    m.querySelectorAll('.wk-ex').forEach(r => r.onclick = () => { m.classList.remove('full', 'wk-page'); exerciseSheet(w.moves[+r.dataset.i], () => workoutPage(w), w); });
  });
}
const _closeModal2 = window.closeModal;
window.closeModal = function () { $('#modal').classList.remove('wk-page'); _closeModal2(); };

// extend the workout list: gear + no jumping filters, best pick, VIP page
const _renderWorkouts = renderWorkouts;
renderWorkouts = function () {
  const nojump = !!S.wf.nojump;
  // temporarily hide workouts you can't do, then let the normal list render (it already sorts by most kcal)
  const all = WORKOUTS.splice(0, WORKOUTS.length, ...WORKOUTS.filter(w => hasGear(w) && (!nojump || !w.jump)));
  try { _renderWorkouts(); } finally { WORKOUTS.splice(0, WORKOUTS.length, ...all); }
  const gear = (S.gear || ['none']).map(g => GEAR.find(x => x[0] === g)).filter(Boolean);
  $('#workoutFilters').insertAdjacentHTML('beforeend', `<div class="seg wseg">
      <button type="button" id="wfGear">🏠 At home: ${gear.map(x => x[1]).join(' ')}</button>
      <button type="button" id="wfJump" class="${nojump ? 'on' : ''}">🤫 No jumping</button></div>`);
  $('#wfGear').onclick = gearModal;
  $('#wfJump').onclick = () => { S.wf.nojump = !S.wf.nojump; save(); renderWorkouts(); };
  // best for you (VIP)
  const best = bestWorkout();
  if (best) $('#workoutList').insertAdjacentHTML('afterbegin', `<button class="best-pick" id="bestPick">
      <span class="bp-label">⭐ Best workout for you ${isVip() ? '' : '<span class="vip-badge">VIP</span>'}</span>
      <span class="bp-main"><span class="bp-emoji">${best.emoji}</span><span><b>${esc(best.name)}</b><br><span class="small">⏱️ ${best.min} min · ⚡ ${Math.round(workoutKcal(best, best.min))} kcal · ${best.jump ? 'has jumping' : 'no jumping'}</span></span></span>
      <span class="small muted">The biggest burn with what you have at home${S.fast ? ' and safe for today\'s fast' : ''}.</span></button>`);
  if ($('#bestPick')) $('#bestPick').onclick = () => workoutPage(best);
  // VIP: tap a workout to open its page
  $('#workoutList').querySelectorAll('.workout').forEach(card => {
    const id = card.querySelector('[data-w]')?.dataset.w; if (!id) return;
    card.querySelector('.w-name').insertAdjacentHTML('beforeend', ' <button class="linkbtn wk-open" title="Workout page">📋</button>');
    card.querySelector('.wk-open').onclick = () => workoutPage(WORKOUTS.find(w => w.id === id));
    if (isVip()) card.querySelector('[data-w]').onclick = () => workoutPage(WORKOUTS.find(w => w.id === id));
    // no more YouTube: see the exercises right inside Bloom
    const yt = card.querySelector('a[href*="youtube"]');
    if (yt) yt.outerHTML = `<button class="btn ghost" data-ex="${id}">📋 Exercises${isVip() ? '' : ' 🔒'}</button>`;
    card.querySelector('[data-ex]').onclick = () => workoutPage(WORKOUTS.find(w => w.id === id));
  });
};
renderWorkouts();
