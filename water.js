// ================= WATER & DRINKS 2.0 =================
// Every drink is separate with its own color and look. The glass fills up in colored layers,
// pours when you add a drink, waves on top, bubbles for fizzy drinks, steam for hot ones.
// The glass itself changes with the theme (chalice, boba cup, potion, crystal glass, jar...).

const DRINK_TYPES = {
  water:  { name: 'Water', emoji: '💧', c1: '#a8e4ff', c2: '#3aa0ff', look: 'bottle', can: '#e9f7ff', ml: 250 },
  tea:    { name: 'Tea', emoji: '🍵', c1: '#f1c76b', c2: '#b8741f', look: 'mug', can: '#7fbf7f', ml: 250, hot: true },
  cola0:  { name: 'Cola Zero', emoji: '🥤', c1: '#5a2a16', c2: '#1d0b05', look: 'can', can: '#111111', band: '#e4002b', ml: 330, fizz: true },
  up0:    { name: '7Up Zero', emoji: '🍋', c1: '#f2ffe6', c2: '#c4f0a6', look: 'can', can: '#1a9b47', band: '#ffffff', ml: 330, fizz: true },
  fanta0: { name: 'Fanta Zero', emoji: '🍊', c1: '#ffc24a', c2: '#ff7a00', look: 'can', can: '#ff8a00', band: '#1d4fb8', ml: 330, fizz: true },
  energy0:{ name: 'Energy Zero', emoji: '⚡', c1: '#eaff6b', c2: '#9be000', look: 'can', can: '#1d2b4f', band: '#b8c4d8', ml: 250, fizz: true },
  coffee: { name: 'Coffee', emoji: '☕', c1: '#9a6a44', c2: '#4a2a14', look: 'mug', can: '#f2e6d8', ml: 200, hot: true },
  other:  { name: 'Other', emoji: '🥛', c1: '#ffffff', c2: '#e6e6ee', look: 'bottle', can: '#f4f4f8', ml: 200 },
};
// old entries keep working
DRINK_TYPES.zero = { ...DRINK_TYPES.cola0, name: 'Zero drink' };
// app.js DRINKS (labels) now come from here
Object.keys(DRINKS).forEach(k => delete DRINKS[k]);
Object.entries(DRINK_TYPES).forEach(([k, d]) => DRINKS[k] = `${d.emoji} ${d.name}`);
const PICKER = ['water', 'tea', 'cola0', 'up0', 'fanta0', 'energy0', 'coffee', 'other'];

// glass shape for each theme
const VESSEL = {
  kawaii: 'boba', dollhouse: 'boba', angel: 'chalice', goddess: 'chalice', academia: 'potion', galaxy: 'potion', sakuranight: 'potion',
  neon: 'highball', vaporwave: 'highball', cherrycola: 'highball', y2k: 'highball', dark: 'tumbler', blackdiamond: 'tumbler', rosegold: 'tumbler',
  ocean: 'bottle', mermaid: 'bottle', animesky: 'bottle', simple: 'bottle', matcha: 'jar', lavender: 'jar', peach: 'jar',
};

// little drink icon (can, mug or bottle) in the drink's own colors
function drinkIcon(k) {
  const d = DRINK_TYPES[k] || DRINK_TYPES.water;
  if (d.look === 'can') return `<svg viewBox="0 0 30 44" class="dicon"><rect x="5" y="4" width="20" height="38" rx="4" fill="${d.can}"/><rect x="5" y="16" width="20" height="10" fill="${d.band}" opacity=".9"/><rect x="7" y="1" width="16" height="5" rx="2" fill="#c9ccd6"/><text x="15" y="24.5" font-size="7" text-anchor="middle" font-weight="900" fill="${d.can}">0</text><rect x="8" y="6" width="3" height="32" rx="1.5" fill="#fff" opacity=".25"/></svg>`;
  if (d.look === 'mug') return `<svg viewBox="0 0 36 40" class="dicon"><path d="M5 12h22v18a8 8 0 0 1-8 8h-6a8 8 0 0 1-8-8z" fill="${d.can}"/><path d="M27 16h3a4 4 0 0 1 0 8h-3" fill="none" stroke="${d.can}" stroke-width="3"/><ellipse cx="16" cy="13" rx="10" ry="2.5" fill="${d.c2}"/><path d="M11 9c0-3 3-3 3-6M18 9c0-3 3-3 3-6" stroke="#bbb" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`;
  return `<svg viewBox="0 0 26 44" class="dicon"><rect x="9" y="1" width="8" height="6" rx="2" fill="#3aa0ff"/><path d="M8 7h10l3 7v26a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V14z" fill="${d.can}" stroke="#9fc9e8"/><path d="M5.5 22h15v18a2.5 2.5 0 0 1-2.5 2.5H8A2.5 2.5 0 0 1 5.5 40z" fill="${d.c2}" opacity=".75"/></svg>`;
}

// layered glass: each drink is its own colored layer, in the order you drank them
function glassHTML(drinks, goal) {
  const total = drinks.reduce((a, x) => a + x.ml, 0), scale = Math.max(goal, total);
  const shape = VESSEL[S.theme] || 'bottle';
  const layers = drinks.map((x, i) => {
    const d = DRINK_TYPES[x.kind] || DRINK_TYPES.water, h = x.ml / (total || 1) * 100;
    const fresh = i === drinks.length - 1 && Date.now() - (x.at || 0) < 2000;
    return `<div class="layer ${d.fizz ? 'fizz' : ''} ${fresh ? 'new' : ''}" style="height:${h}%;--c1:${d.c1};--c2:${d.c2}">${d.fizz ? '<i></i><i></i><i></i><i></i>' : ''}</div>`;
  }).join('');
  const top = drinks.length ? DRINK_TYPES[drinks[drinks.length - 1].kind] || DRINK_TYPES.water : DRINK_TYPES.water;
  return `<div class="vessel v-${shape}" style="--top1:${top.c1};--top2:${top.c2}">
    <div class="vglass"><div class="layers" style="height:${Math.min(100, total / scale * 100)}%">${layers}<div class="wave"></div></div>
      ${top.hot && drinks.length ? '<div class="steam"><i></i><i></i><i></i></div>' : ''}<div class="shine"></div></div>
    <span class="vpct">${Math.round(total / goal * 100)}%</span></div>`;
}

// pour animation: a stream in the drink's color falls into the glass
function pourAnim(kind) {
  const v = document.querySelector('#waterCard .vessel'); if (!v) return;
  const d = DRINK_TYPES[kind] || DRINK_TYPES.water;
  const s = document.createElement('div'); s.className = 'pour'; s.style.setProperty('--c1', d.c1); s.style.setProperty('--c2', d.c2);
  v.appendChild(s); setTimeout(() => s.remove(), 1100);
  const sp = document.createElement('div'); sp.className = 'splash'; sp.style.setProperty('--c1', d.c1); v.appendChild(sp); setTimeout(() => sp.remove(), 1200);
}

renderWater = function () {
  const box = $('#waterCard'); if (!box) return;
  if (!S.water?.goal) {
    box.innerHTML = `<h3>💧 Water</h3><p>Set your daily water goal and Bloom reminds you step by step.</p><button class="btn" id="wSet">Set my water goal</button>`;
    $('#wSet').onclick = () => waterGoalModal(true); return;
  }
  const drinks = day().drinks || [], t = waterTotal(), g = S.water.goal;
  const next = (S.today?.items || []).filter(i => i.water && !i.done).sort((a, b) => minutes(a.time) - minutes(b.time))[0];
  const kinds = Object.entries(drinks.reduce((a, x) => (a[x.kind] = (a[x.kind] || 0) + x.ml, a), {}));
  const sel = PICKER.includes(S.lastDrink) ? S.lastDrink : 'water', sd = DRINK_TYPES[sel];
  box.innerHTML = `
    <div class="row between"><h3>💧 Drinks</h3><button class="linkbtn" id="wEdit">⚙️ ${g / 1000} L goal</button></div>
    <div class="water-row">
      ${glassHTML(drinks, g)}
      <div style="min-width:0;flex:1">
        <div class="water-big">${(t / 1000).toFixed(2)} <small>/ ${g / 1000} L</small></div>
        <p class="small muted">${t >= g ? '🎉 Goal reached! More is a bonus, just stay under 4 L.' : next ? `Next: <b>${next.time}</b>, drink ${next.ml} ml` : `${g - t} ml to go`}</p>
        ${kinds.length ? `<div class="dsum">${kinds.map(([k, v]) => `<span class="dchip" style="--c1:${(DRINK_TYPES[k] || DRINK_TYPES.water).c1};--c2:${(DRINK_TYPES[k] || DRINK_TYPES.water).c2}">${(DRINK_TYPES[k] || DRINK_TYPES.water).name} <b>${v}</b></span>`).join('')}</div>` : ''}
      </div>
    </div>
    <div class="dpick" id="wKind">${PICKER.map(k => `<button type="button" class="dbtn ${k === sel ? 'on' : ''}" data-k="${k}" style="--c1:${DRINK_TYPES[k].c1};--c2:${DRINK_TYPES[k].c2}">${drinkIcon(k)}<span>${DRINK_TYPES[k].name}</span></button>`).join('')}</div>
    <div class="row gap wrap">${[150, 250, 330, 500].map(v => `<button class="btn ghost wadd ${v === sd.ml ? 'suggest' : ''}" data-ml="${v}">+${v}</button>`).join('')}<button class="btn ghost" id="wOther">+ other</button><button class="linkbtn" id="wUndo">↩ undo</button></div>
    <p class="muted tiny" style="margin:6px 0 0">${sd.fizz || sel === 'tea' ? 'Zero sugar drinks and plain tea count as water and have 0 kcal. During a water fast, plain water is best.' : ''}</p>`;
  $('#wEdit').onclick = () => waterGoalModal();
  box.querySelectorAll('#wKind .dbtn').forEach(b => b.onclick = () => { S.lastDrink = b.dataset.k; save(); renderWater(); });
  box.querySelectorAll('.wadd').forEach(b => b.onclick = () => addDrink(+b.dataset.ml, sel));
  $('#wOther').onclick = () => openModal(`<h2>Add ${esc(sd.name)}</h2><div class="field"><label>How much (ml)</label><input type="number" id="wMl" value="${sd.ml}" min="10" max="2000"></div><button class="btn big" id="wAddGo">Add</button>`, () => {
    $('#wAddGo').onclick = () => { const v = Math.min(2000, +$('#wMl').value || 0); if (v > 0) { closeModal(); addDrink(v, sel); } };
  });
  $('#wUndo').onclick = undoDrink;
};

const _addDrink = addDrink;
addDrink = function (ml, kind = 'water', planId) {
  _addDrink(ml, kind, planId);
  requestAnimationFrame(() => pourAnim(kind));
};

// ================= v2: every drink has its own cup and its own count =================
// Water fills the big theme glass and counts toward the water goal.
// Every other drink has its own little cup that fills toward its own gentle daily limit.
// Caffeine from coffee, tea, cola and energy drinks is added up (400 mg a day is the usual safe max).
const DRINK_LIMIT = { tea: 750, coffee: 600, cola0: 660, up0: 660, fanta0: 660, energy0: 500, other: 500 };
const CAFFEINE = { coffee: 0.4, tea: 0.12, cola0: 0.103, zero: 0.103, energy0: 0.32 }; // mg per ml
const drinkTotal = (k, d = day()) => (d.drinks || []).filter(x => (x.kind || 'water') === k || (k === 'cola0' && x.kind === 'zero')).reduce((a, x) => a + x.ml, 0);
const caffeineToday = (d = day()) => Math.round((d.drinks || []).reduce((a, x) => a + x.ml * (CAFFEINE[x.kind] || 0), 0));

// small cup in the drink's own look, filled to its own amount
function miniCup(k, pct) {
  const d = DRINK_TYPES[k], h = Math.max(0, Math.min(100, pct)), id = 'mc' + k;
  const liquid = (x, y, w, hh) => `<defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${d.c1}"/><stop offset="1" stop-color="${d.c2}"/></linearGradient></defs>
    <rect class="mliq" x="${x}" y="${y + hh * (1 - h / 100)}" width="${w}" height="${hh * h / 100}" fill="url(#${id}g)"/>`;
  if (d.look === 'can') return `<svg viewBox="0 0 40 60" class="mcup"><clipPath id="${id}c"><rect x="7" y="7" width="26" height="49" rx="5"/></clipPath>
    <rect x="7" y="7" width="26" height="49" rx="5" fill="#ffffffaa" stroke="${d.can}" stroke-width="2.5"/>
    <g clip-path="url(#${id}c)">${liquid(7, 7, 26, 49)}${d.fizz && h ? '<circle class="mb" cx="15" cy="50" r="1.6" fill="#fff"/><circle class="mb mb2" cx="24" cy="52" r="1.2" fill="#fff"/>' : ''}</g>
    <rect x="7" y="22" width="26" height="9" fill="${d.band}" opacity=".55"/><rect x="10" y="2" width="20" height="6" rx="2" fill="#c9ccd6"/></svg>`;
  if (d.look === 'mug') return `<svg viewBox="0 0 48 52" class="mcup"><clipPath id="${id}c"><path d="M6 10h28v28a10 10 0 0 1-10 10h-8A10 10 0 0 1 6 38z"/></clipPath>
    <path d="M6 10h28v28a10 10 0 0 1-10 10h-8A10 10 0 0 1 6 38z" fill="#ffffffaa" stroke="${d.can}" stroke-width="2.5"/>
    <g clip-path="url(#${id}c)">${liquid(6, 10, 28, 38)}</g>
    <path d="M34 16h4a6 6 0 0 1 0 12h-4" fill="none" stroke="${d.can}" stroke-width="3"/>${h ? '<path class="mst" d="M14 7c0-3 3-3 3-6M22 7c0-3 3-3 3-6" stroke="#c9c9c9" stroke-width="1.6" fill="none" stroke-linecap="round"/>' : ''}</svg>`;
  return `<svg viewBox="0 0 34 60" class="mcup"><clipPath id="${id}c"><path d="M10 12h14l4 8v32a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V20z"/></clipPath>
    <path d="M10 12h14l4 8v32a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V20z" fill="#ffffffaa" stroke="#9fc9e8" stroke-width="2"/>
    <g clip-path="url(#${id}c)">${liquid(6, 12, 22, 44)}</g><rect x="12" y="4" width="10" height="8" rx="2" fill="${d.c2}"/></svg>`;
}

const CUPS = ['tea', 'coffee', 'cola0', 'up0', 'fanta0', 'energy0', 'other'];
renderWater = function () {
  const box = $('#waterCard'); if (!box) return;
  if (!S.water?.goal) {
    box.innerHTML = `<h3>💧 Water</h3><p>Set your daily water goal and Bloom reminds you step by step, gently 💕</p><button class="btn" id="wSet">Set my water goal</button>`;
    $('#wSet').onclick = () => waterGoalModal(true); return;
  }
  if (applyNudges()) setTimeout(renderPlan);
  const d = day(), all = d.drinks || [], waterOnly = all.filter(x => (x.kind || 'water') === 'water');
  const t = waterTotal(), g = S.water.goal, caf = caffeineToday();
  const next = (S.today?.items || []).filter(i => i.water && !i.done).sort((a, b) => minutes(a.time) - minutes(b.time))[0];
  const sel = PICKER.includes(S.lastDrink) ? S.lastDrink : 'water', sd = DRINK_TYPES[sel];
  box.innerHTML = `
    <div class="row between"><h3>💧 Drinks</h3><button class="linkbtn" id="wEdit">⚙️ ${g / 1000} L water goal</button></div>
    <div class="water-row">
      <button type="button" class="vbtn ${sel === 'water' ? 'on' : ''}" data-k="water" title="Water">${glassHTML(waterOnly, g)}</button>
      <div style="min-width:0;flex:1">
        <div class="water-big">${(t / 1000).toFixed(2)} <small>/ ${g / 1000} L water</small></div>
        <p class="small muted">${t >= g ? '🎉 Water goal reached! You glow 💖 More is a bonus, just stay under 4 L.' : next ? `Next sip: <b>${next.time}</b>, ${next.ml} ml 🫧` : `${g - t} ml to go, you've got this 💕`}</p>
        <div class="caf ${caf > 400 ? 'over' : caf > 300 ? 'high' : ''}"><span>☕ Caffeine</span><div class="caf-bar"><i style="width:${Math.min(100, caf / 4)}%"></i></div><b>${caf} / 400 mg</b></div>
      </div>
    </div>
    <div class="cups" id="wKind">${CUPS.map(k => { const ml = drinkTotal(k), lim = DRINK_LIMIT[k]; return `<button type="button" class="cupbtn ${k === sel ? 'on' : ''} ${ml > lim ? 'over' : ''}" data-k="${k}">${miniCup(k, ml / lim * 100)}<span class="cn">${DRINK_TYPES[k].name}</span><span class="cm">${ml ? `<b>${ml}</b> / ${lim} ml` : `0 ml`}</span></button>`; }).join('')}</div>
    <div class="addrow"><span class="addfor">${sd.emoji} ${sd.name}</span>${[150, 250, 330, 500].map(v => `<button class="btn ghost wadd ${v === sd.ml ? 'suggest' : ''}" data-ml="${v}">+${v}</button>`).join('')}<button class="btn ghost" id="wOther">+ other</button><button class="linkbtn" id="wUndo">↩ undo</button></div>
    <p class="muted tiny" style="margin:6px 0 0">${drinkTip(sel, caf)}</p>`;
  $('#wEdit').onclick = () => waterGoalModal();
  box.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { S.lastDrink = b.dataset.k; save(); renderWater(); });
  box.querySelectorAll('.wadd').forEach(b => b.onclick = () => addDrink(+b.dataset.ml, sel));
  $('#wOther').onclick = () => openModal(`<h2>Add ${esc(sd.name)}</h2><div class="field"><label>How much (ml)</label><input type="number" id="wMl" value="${sd.ml}" min="10" max="2000"></div><button class="btn big" id="wAddGo">Add</button>`, () => {
    $('#wAddGo').onclick = () => { const v = Math.min(2000, +$('#wMl').value || 0); if (v > 0) { closeModal(); addDrink(v, sel); } };
  });
  $('#wUndo').onclick = undoDrink;
};
function drinkTip(k, caf) {
  if (caf > 400) return '⚠️ Over 400 mg caffeine today. That can cause jitters, a racing heart and bad sleep. Switch to water for the rest of the day 💧';
  return {
    water: 'Plain water is the best drink of all, especially during a fast 💧',
    tea: 'Plain tea has 0 kcal and a little caffeine (about 30 mg a cup). Green tea is lovely while fasting 🍵',
    coffee: 'Black coffee has 0 kcal and about 95 mg caffeine a cup. It can dull hunger, but go easy after 2 pm 😴',
    cola0: 'Cola Zero has 0 kcal and about 34 mg caffeine a can. Count it as a treat, not as your water 🥤',
    up0: '7Up Zero has 0 kcal and no caffeine. Sweeteners can make some people crave sweets, so keep it to a can or two 🍋',
    fanta0: 'Fanta Zero has 0 kcal and no caffeine. A fun treat, but water still wins 🍊',
    energy0: 'Energy Zero has about 80 mg caffeine a can. Max 2 a day, and not on an empty stomach if you feel shaky ⚡',
    other: 'Milk, juice or smoothies have calories and break a water fast. Add them to your food log too 🥛',
  }[k] || '';
}
// pour into the right cup
pourAnim = function (kind) {
  if (kind === 'water') {
    const v = document.querySelector('#waterCard .vessel'); if (!v) return;
    const d = DRINK_TYPES.water, s = document.createElement('div'); s.className = 'pour'; s.style.setProperty('--c1', d.c1); s.style.setProperty('--c2', d.c2);
    v.appendChild(s); setTimeout(() => s.remove(), 1100);
    const sp = document.createElement('div'); sp.className = 'splash'; sp.style.setProperty('--c1', d.c1); v.appendChild(sp); setTimeout(() => sp.remove(), 1200);
  } else {
    const c = document.querySelector(`#waterCard .cupbtn[data-k="${kind}"]`); if (!c) return;
    c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
  }
};
// separate counts in the toast too
const _addDrink2 = addDrink;
addDrink = function (ml, kind = 'water', planId) {
  _addDrink2(ml, kind, planId);
  if (kind !== 'water') {
    const lim = DRINK_LIMIT[kind], tot = drinkTotal(kind), caf = caffeineToday();
    setTimeout(() => toast(`${DRINK_TYPES[kind].emoji} ${DRINK_TYPES[kind].name}: ${tot} ml today${CAFFEINE[kind] ? ` · ☕ ${caf} mg caffeine` : ''}${tot > lim ? ' · that\'s plenty for today 💕' : ''}`), 50);
  }
};

// ---------- cute, gentle water reminders with real benefits ----------
const WATER_NUDGES = [
  ['Sip sip time 🫧', 'A glass of water can give your metabolism a little boost for about an hour. Tiny sip, big help 💧'],
  ['Water break, cutie 🌸', 'Your body needs water to break down fat. A hydrated body burns better ✨'],
  ['Your cells are thirsty 🥺', 'Thirst often feels like hunger. A few sips now and the craving may just float away 💕'],
  ['Hydration hug 🤗', 'Water before you eat helps you feel full sooner. Future you says thank you 🌷'],
  ['Glow up o\'clock 💖', 'Water keeps your skin soft, your head clear and your energy up. Bottoms up 🥤'],
  ['A little chill 🧊', 'Cold water makes your body warm it up, burning a tiny bit extra. Every bit counts ❄️'],
  ['Your kidneys say hi 👋', 'While you burn fat, your kidneys work hard. Water helps them flush everything out 🌊'],
  ['Headache shield 🛡️', 'Most fasting headaches come from too little water. Sip now and stay comfy 🫶'],
  ['Gentle reminder 🐰', 'Sipping through the day keeps your energy steady and your mood sunny ☀️'],
  ['You\'re doing amazing 🌟', 'One more glass and you\'re closer to your goal. So proud of you 💕'],
  ['Brain fuel 🧠', 'Even a little dehydration makes you tired and foggy. Water = focus mode on 💡'],
  ['Workout buddy 💪', 'Hydrated muscles work harder and recover faster. Drink up before you move 🏃‍♀️'],
];
function waterNudge(i) {
  const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
  return WATER_NUDGES[(i + doy) % WATER_NUDGES.length];
}
// give today's and future water steps the cute texts
const _waterItems = waterItems;
waterItems = function () {
  return _waterItems().map((it, i) => { const [t, b] = waterNudge(i); return { ...it, title: `${t} · ${it.ml} ml`, why: `${b}\n${it.ml} ml now · ${it.why.split(': ')[1] || ''}`.trim(), nudge: true }; });
};
function applyNudges() {
  if (!S.today?.items || !S.water?.goal) return false;
  const fresh = waterItems(); let k = 0, changed = false;
  S.today.items.forEach(it => { if (it.water && !it.nudge && fresh[k]) { const f = fresh.find(x => x.cum === it.cum) || fresh[k]; it.title = f.title; it.why = f.why; it.nudge = true; changed = true; } if (it.water) k++; });
  if (changed) save();
  return changed;
}
if (applyNudges()) renderPlan();
renderWater();
