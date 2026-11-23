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
renderWater();
