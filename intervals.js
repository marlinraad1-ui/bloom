// ================= REAL INTERVAL WORKOUTS =================
// Strength / HIIT / mat workouts: warm up, then rounds of 40 s work + short rest, round breaks, cool down.
// Rest gets shorter the harder the level (simple 20 s, medium 15 s, max 10 s).
// Walking, running, bike, stairs and treadmill: real intervals (push / easy) instead of one long block.
// Dance and K-pop: one song per combo with short water breaks.

const WARM_RE = /warm/i, COOL_RE = /cool|stretch|sway/i, SKIP_RE = /^rest$|recover|walk down/i;
const STEADY = new Set(['walk', 'm-walkfast', 'tm-incline', 'cycle', 'run', 'tm-sprint', 'bike-hiit', 'stairs', 'lowcardio']);
const LEVEL_TIMING = { simple: [40, 20], medium: [40, 15], max: [40, 10] };

function buildPlan(w) {
  const total = w.min * 60, steps = [];
  const add = (name, sec, type, info = '') => steps.push({ name, sec: Math.max(10, Math.round(sec)), type, info });
  const main = w.moves.filter(m => !WARM_RE.test(m) && !COOL_RE.test(m) && !SKIP_RE.test(m));
  const warmName = w.moves.find(m => WARM_RE.test(m)) || 'Warm up: march and arm circles';
  const coolName = [...w.moves].reverse().find(m => COOL_RE.test(m)) || 'Cool down stretch';

  if (w.kpop || w.id === 'dance') {
    const each = (total - 240 - (main.length - 1) * 20) / main.length;
    add(warmName, 120, 'warm');
    main.forEach((m, i) => { add(m, each, 'work', `Song ${i + 1} of ${main.length}`); if (i < main.length - 1) add('Water break', 20, 'rest'); });
    add(coolName, 120, 'cool');
    return steps;
  }
  if (STEADY.has(w.id)) {
    // intervals: hard parts are short, easy parts let you breathe
    const segSec = m => { const s = m.match(/(\d+)\s*s\b/i), mi = m.match(/(\d+)\s*min/i); return s ? +s[1] : mi ? +mi[1] * 60 : /fast|sprint|power|hill|climb|12%/i.test(m) ? 60 : 90; };
    const isEasy = m => /easy|walk$|^walk|jog|moderate|steady|flat/i.test(m) && !/power|brisk|fast/i.test(m);
    add(warmName, 180, 'warm');
    let left = total - 360, k = 0, round = 1;
    while (left > 30) {
      const m = main[k % main.length], sec = Math.min(segSec(m), left);
      add(m, sec, isEasy(m) ? 'easy' : 'work', `Interval ${round}`);
      left -= sec; k++; if (k % main.length === 0) round++;
    }
    add(coolName, 180, 'cool');
    return steps;
  }
  const [work, rest] = LEVEL_TIMING[w.level] || [40, 15], roundRest = 60;
  const per = main.length * work + (main.length - 1) * rest;
  const rounds = Math.max(2, Math.min(6, Math.round((total - 240 + roundRest) / (per + roundRest))));
  add(warmName, 120, 'warm');
  for (let r = 1; r <= rounds; r++) {
    main.forEach((m, i) => { add(m, work, 'work', `Round ${r} of ${rounds}`); if (i < main.length - 1) add('Rest', rest, 'rest'); });
    if (r < rounds) add('Round break: water and breathe', roundRest, 'rest');
  }
  add(coolName, 120, 'cool');
  return steps;
}

// short summary for the workout page: "40 s work · 10 s rest · 3 rounds"
function planSummary(w) {
  const p = buildPlan(w), secs = p.reduce((a, s) => a + s.sec, 0);
  if (w.kpop || w.id === 'dance') return { text: `${p.filter(s => s.type === 'work').length} songs · 20 s water breaks`, secs, per: m => fmtMS(p.find(s => s.name === m)?.sec || 0) };
  if (STEADY.has(w.id)) return { text: p.some(s => s.type === 'easy') ? `Intervals: ${p.filter(s => s.type === 'work').length} hard pushes with easy recovery` : 'Intervals: pace changes every 1 to 1.5 min', secs, per: m => { const n = p.filter(s => s.name === m); return n.length ? `${fmtMS(n[0].sec)} × ${n.length}` : fmtMS(p.find(s => s.name === m)?.sec || 0); } };
  const [work, rest] = LEVEL_TIMING[w.level] || [40, 15], rounds = (p.find(s => s.type === 'work')?.info.match(/of (\d+)/) || [0, 1])[1];
  return { text: `${work} s work · ${rest} s rest · ${rounds} rounds`, secs, per: m => { const n = p.filter(s => s.name === m && s.type === 'work'); return n.length ? `${work} s × ${n.length} rounds` : fmtMS(p.find(s => s.name === m)?.sec || 0); } };
}

// voice coach (uses the phone's own voice, works offline)
function coachSay(text) {
  try { if (S.settings.voiceCoach === false || !window.speechSynthesis) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 1.05; speechSynthesis.speak(u); } catch (e) {}
}
const PHASE = { warm: ['WARM UP', 'warm'], work: ['GO', 'work'], easy: ['EASY', 'easy'], rest: ['REST', 'rest'], cool: ['COOL DOWN', 'cool'] };

playWorkout = function (w) {
  const plan = buildPlan(w), totalSec = plan.reduce((a, s) => a + s.sec, 0);
  let i = 0, left = plan[0].sec, elapsed = 0, hardSec = 0, paused = false, t, shown = -1;
  const nextWork = from => plan.slice(from).find(s => s.type !== 'rest');
  openModal(`<div class="player">
    <div class="p-top"><span class="phase" id="pPhase"></span><span class="muted small" id="pStep"></span></div>
    <div class="move-emoji" id="pVis"></div>
    <div class="move-name" id="pMove"></div><div class="move-timer" id="pTime"></div>
    <div class="muted small" id="pNext"></div><div class="progress"><div id="pProg"></div></div>
    <p class="w-burn" id="pBurn"></p>
    <div class="row gap" style="justify-content:center"><button class="btn ghost" id="pPause">⏸ Pause</button><button class="btn ghost" id="pSkip">⏭ Skip</button><button class="btn" id="pStop">Finish</button></div>
    <label class="small toggle-row" style="justify-content:center"><input type="checkbox" id="pVoice" ${S.settings.voiceCoach === false ? '' : 'checked'}> 🔊 Voice coach</label>
    <p class="muted small">Feeling dizzy or faint? Stop, sit down, and drink water with a pinch of salt.</p></div>`, () => {
    const announce = () => {
      const s = plan[i], n = nextWork(i + 1);
      if (s.type === 'rest') coachSay(`Rest. ${n ? 'Next, ' + n.name : 'Almost done'}`);
      else if (s.type === 'warm') coachSay(`Warm up. ${s.name}`);
      else if (s.type === 'cool') coachSay('Great work. Cool down.');
      else coachSay(`Go! ${s.name}`);
    };
    const draw = () => {
      const s = plan[i], [label, cls] = PHASE[s.type];
      $('#pPhase').textContent = label; $('#pPhase').className = 'phase ' + cls;
      $('#pStep').textContent = s.info || `${i + 1} / ${plan.length}`;
      if (shown !== i) {
        shown = i;
        const target = s.type === 'rest' ? nextWork(i + 1) : s;
        $('#pVis').innerHTML = (target ? (typeof playerVisual === 'function' ? playerVisual(target.name, w) : w.emoji) : '💖') + (s.type === 'rest' && target ? '<span class="next-tag">Next</span>' : '');
        $('#pVis').classList.toggle('resting', s.type === 'rest');
      }
      $('#pMove').textContent = s.type === 'rest' ? (nextWork(i + 1) ? `Next: ${nextWork(i + 1).name}` : 'Last one done!') : s.name;
      $('#pTime').textContent = fmtHMS(left * 1000).slice(3);
      const n = plan[i + 1]; $('#pNext').textContent = n ? `Then: ${n.type === 'rest' ? n.name + ' ' + n.sec + ' s' : n.name}` : 'Last one!';
      $('#pProg').style.width = (elapsed / totalSec * 100) + '%';
      $('#pBurn').textContent = `🔥 ${Math.round(burned())} kcal so far · ${fmtMS(elapsed)} of ${fmtMS(totalSec)}`;
    };
    // rest and easy parts burn less, so calories are honest
    const effMin = () => (hardSec + (elapsed - hardSec) * 0.35) / 60;
    const burned = () => workoutKcal(w, effMin());
    const finish = () => {
      clearInterval(t); try { speechSynthesis.cancel(); } catch (e) {} closeModal();
      if (elapsed > 60) { const ratio = effMin() / (elapsed / 60); logWorkout({ ...w, met: w.met * ratio }, elapsed / 60); }
    };
    const next = () => { i++; if (i >= plan.length) return finish(); left = plan[i].sec; playBeep(); announce(); };
    t = setInterval(() => {
      if (paused || !$('#pMove')) return;
      left--; elapsed++; if (['work', 'warm'].includes(plan[i].type)) hardSec++;
      if (left === 3 && plan[i + 1]) coachSay('3, 2, 1');
      if (left <= 0) next();
      if ($('#pMove')) draw();
    }, 1000);
    $('#pPause').onclick = () => { paused = !paused; $('#pPause').textContent = paused ? '▶ Resume' : '⏸ Pause'; coachSay(paused ? 'Paused' : 'Let\'s go'); };
    $('#pSkip').onclick = () => { next(); if ($('#pMove')) draw(); };
    $('#pStop').onclick = finish;
    $('#pVoice').onchange = e => { S.settings.voiceCoach = e.target.checked; save(); if (!e.target.checked) try { speechSynthesis.cancel(); } catch (er) {} };
    draw(); announce();
  });
};
