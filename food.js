// ================= FOOD & CALORIES =================
// Free: write what you ate with its calories.
// VIP: snap a photo or text the AI and it counts everything for you.
// If you eat more than you burned today, Bloom gives you a burn plan.

function meals(d = day()) {
  if (!d.meals) { d.meals = []; if (d.intake) d.meals.push({ name: 'Food before the log', kcal: d.intake, at: Date.now() }); }
  return d.meals;
}
function syncIntake(d = day()) { d.intake = Math.round(meals(d).reduce((a, m) => a + (+m.kcal || 0), 0)); }
const sumMacros = list => list.reduce((a, m) => ({ p: a.p + (+m.protein || 0), c: a.c + (+m.carbs || 0), f: a.f + (+m.fat || 0) }), { p: 0, c: 0, f: 0 });

// how to burn off extra calories, for this person's weight
function burnPlan(over) {
  const walkMin = Math.ceil(over / (3.5 * kg() / 60));
  const steps = Math.round(over / (kg() * 0.00057) / 100) * 100;
  const pool = WORKOUTS.filter(w => w.goal !== 'gain');
  const pick = ['simple', 'medium', 'max'].map(l => pool.filter(w => w.level === l).sort((a, b) => b.met - a.met)[0]).filter(Boolean);
  return { walkMin, steps, workouts: pick.map(w => ({ w, min: Math.max(5, Math.ceil(over / (w.met * kg() / 60))) })) };
}
function burnPlanHTML(over) {
  const b = burnPlan(over);
  return `<div class="burn-plan">
    <p><b>🔥 Burn the extra ${Math.round(over)} kcal so it doesn't turn into fat. Pick one:</b></p>
    <div class="bp-row"><span>🚶 Walk <b>${b.walkMin} min</b></span><span class="muted small">about ${b.steps.toLocaleString()} steps</span></div>
    ${b.workouts.map(({ w, min }) => `<div class="bp-row"><span>${w.emoji} ${esc(w.name)} <b>${min} min</b></span><button class="btn ghost" data-bp="${w.id}" data-min="${min}">▶ Start</button></div>`).join('')}
  </div>`;
}
function hookBurnPlan(root) {
  root.querySelectorAll('[data-bp]').forEach(b => b.onclick = () => {
    if (!isVip()) return vipModal('workouts');
    const w = WORKOUTS.find(x => x.id === b.dataset.bp);
    playWorkout({ ...w, min: +b.dataset.min });
  });
}

function renderFood() {
  const box = $('#foodCard'); if (!box || !S.profile) return;
  const d = day(); const list = meals(d); syncIntake(d);
  const burn = Math.round(burnToday().total), eaten = d.intake, left = burn - eaten, m = sumMacros(list);
  box.innerHTML = `
    <div class="row between"><h3>🍽️ Food today</h3><button class="btn" id="foodAdd">＋ Add food</button></div>
    <div class="food-meter ${left < 0 ? 'over' : ''}"><div style="width:${Math.min(100, eaten / burn * 100)}%"></div></div>
    <div class="food-nums"><span><b>${eaten.toLocaleString()}</b> kcal eaten</span><span><b>${burn.toLocaleString()}</b> kcal burned today</span></div>
    <p class="small">${left >= 0
      ? `🟢 <b>${left.toLocaleString()} kcal</b> under what you burned. That's about <b>${Math.round(left / 7.7)} g of fat</b> gone today.`
      : `🔴 <b>${(-left).toLocaleString()} kcal over</b> what you burned today.`}</p>
    ${m.p + m.c + m.f ? `<div class="chips"><span class="chip">🥩 ${Math.round(m.p)} g protein</span><span class="chip">🍞 ${Math.round(m.c)} g carbs</span><span class="chip">🥑 ${Math.round(m.f)} g fat</span></div>` : ''}
    <ul class="list food-list">${list.map((x, i) => `<li><span>${x.src === 'photo' ? '📸' : x.src === 'ai' ? '💬' : '✍️'} ${esc(x.name)}${x.amount ? ` <span class="muted small">${esc(x.amount)}</span>` : ''}</span><span><b>${Math.round(x.kcal)}</b> <button class="linkbtn" data-del="${i}" title="Remove">✕</button></span></li>`).join('') || '<li class="muted">Nothing logged yet. Tap ＋ Add food.</li>'}</ul>
    ${left < 0 ? burnPlanHTML(-left) : ''}`;
  $('#foodAdd').onclick = () => addFoodModal();
  box.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { list.splice(+b.dataset.del, 1); syncIntake(d); save(); renderBody(); renderGlance(); });
  hookBurnPlan(box);
}

function addMeals(items, src) {
  const d = day(), before = Math.round(burnToday().total) - (d.intake || 0);
  items.forEach(i => meals(d).push({ ...i, src, at: Date.now() }));
  syncIntake(d); save(); renderBody(); renderGlance();
  const added = items.reduce((a, i) => a + (+i.kcal || 0), 0);
  const left = Math.round(burnToday().total) - d.intake;
  if (left < 0) {
    openModal(`<h2>${before >= 0 ? '😬 That puts you over' : '😬 Still over'}</h2>
      <p>+${Math.round(added)} kcal. You've now eaten <b>${(-left).toLocaleString()} kcal more</b> than you burned today.</p>
      ${burnPlanHTML(-left)}<button class="btn ghost big" onclick="closeModal()">Later</button>`, m => hookBurnPlan(m));
  } else { closeModal(); toast(`+${Math.round(added)} kcal logged · ${left.toLocaleString()} kcal left 💪`); }
}

// ask the AI (VIP only, checked on the server)
async function aiFood(body) {
  if (!navigator.onLine) throw new Error('offline');
  if (!(await commInit())) throw new Error('offline');
  const call = sb.functions.invoke('mochi', { body: { mode: 'food', lang: navigator.language || 'en', ...body } });
  const r = await Promise.race([call, new Promise(res => setTimeout(() => res({ error: { timeout: true } }), 65000))]);
  if (r.error) {
    let j = null; try { j = await r.error.context?.json?.(); } catch (e) {}
    throw new Error(j?.error === 'vip_only' ? 'vip' : r.error.timeout ? 'timeout' : 'ai');
  }
  return r.data;
}
const aiFoodError = e => e.message === 'vip' ? 'This is a VIP feature 👑' : e.message === 'offline' ? 'You\'re offline. Connect to the internet.' : 'The AI is busy. Try again in a moment.';

function resultHTML(res) {
  if (!res.items?.length) return `<p class="muted">${esc(res.note || 'I couldn\'t find food there. Try another photo or describe it.')}</p>`;
  const t = res.items.reduce((a, i) => a + i.kcal, 0), m = sumMacros(res.items);
  return `<div class="food-res">
    ${res.items.map((i, k) => `<label class="fr-item"><input type="checkbox" data-k="${k}" checked><span>${esc(i.name)} <span class="muted small">${esc(i.amount)}</span></span><input type="number" class="mini" data-kc="${k}" value="${i.kcal}"> kcal</label>`).join('')}
    <div class="fr-total"><span>Total</span><b>${t} kcal</b></div>
    <div class="chips"><span class="chip">🥩 ${m.p} g</span><span class="chip">🍞 ${m.c} g</span><span class="chip">🥑 ${m.f} g</span></div>
    ${res.note ? `<p class="small">${esc(res.note)}</p>` : ''}
    <button class="btn big" data-addres>＋ Add to today</button></div>`;
}
function hookResult(root, res, src) {
  const btn = root.querySelector('[data-addres]'); if (!btn) return;
  btn.onclick = () => {
    const picked = res.items.map((i, k) => ({ ...i, kcal: +root.querySelector(`[data-kc="${k}"]`).value || 0 })).filter((i, k) => root.querySelector(`[data-k="${k}"]`).checked);
    if (!picked.length) return toast('Tick at least one food');
    addMeals(picked, src);
  };
}

let foodChat = [];
function addFoodModal(tab = isVip() ? 'photo' : 'manual') {
  const lock = isVip() ? '' : ' 🔒';
  openModal(`<h2>🍽️ Add food</h2>
    <div class="seg" id="fdTabs">
      <button type="button" data-t="photo">📸 Photo${lock}</button>
      <button type="button" data-t="chat">💬 Tell AI${lock}</button>
      <button type="button" data-t="manual">✍️ Myself</button>
    </div>
    <div id="fdBody" style="margin-top:12px"></div>`, m => {
    const show = t => {
      m.querySelectorAll('#fdTabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
      const body = $('#fdBody');
      if (t !== 'manual' && !isVip()) {
        body.innerHTML = `<div class="vip-lock"><div class="vip-hero">${t === 'photo' ? '📸' : '💬'}</div>
          <p><b>${t === 'photo' ? 'Snap your plate, Bloom counts it.' : 'Just text what you ate. The AI does the math.'}</b></p>
          <p class="muted small">Calories, protein, carbs and fat in seconds, and a burn plan if you went over. Part of Bloom VIP.</p>
          <button class="btn big vip-btn" id="fdVip">👑 Unlock with VIP · ${VIP_PRICE}/year</button></div>`;
        $('#fdVip').onclick = () => vipModal('food'); return;
      }
      if (t === 'photo') {
        body.innerHTML = `<label class="food-drop" id="fdDrop"><input type="file" accept="image/*" id="fdFile" hidden><span>📸<br><b>Take or choose a photo</b><br><span class="muted small">of your meal, snack or drink</span></span></label>
          <input id="fdNote" placeholder="Extra info? e.g. fried in oil, big portion (optional)" style="margin-top:8px">
          <div id="fdRes"></div>`;
        $('#fdFile').onchange = async e => {
          const f = e.target.files[0]; if (!f) return;
          const img = await shrinkImage(f, 1024);
          $('#fdDrop').style.backgroundImage = `url(${img})`; $('#fdDrop').classList.add('has');
          $('#fdRes').innerHTML = '<p class="muted ai-think">🔍 Looking at your food…</p>';
          try { const res = await aiFood({ image: img, text: $('#fdNote').value.trim() }); $('#fdRes').innerHTML = resultHTML(res); hookResult($('#fdRes'), res, 'photo'); }
          catch (err) { $('#fdRes').innerHTML = `<p class="muted">${aiFoodError(err)}</p>`; }
        };
      } else if (t === 'chat') {
        body.innerHTML = `<div class="fd-chat" id="fdLog"><div class="msg bot">Hi! Tell me what you ate or drank and I'll count it 🍽️<br><span class="muted small">e.g. "2 eggs, toast with butter and an iced latte"</span></div></div>
          <form id="fdForm" class="row gap" style="margin-top:8px"><input id="fdIn" placeholder="What did you eat?" autocomplete="off"><button class="btn">Send</button></form>`;
        const log = $('#fdLog');
        foodChat.forEach(x => log.insertAdjacentHTML('beforeend', x));
        log.scrollTop = 1e9;
        $('#fdForm').onsubmit = async e => {
          e.preventDefault(); const text = $('#fdIn').value.trim(); if (!text) return; $('#fdIn').value = '';
          const mine = `<div class="msg me">${esc(text)}</div>`; foodChat.push(mine); log.insertAdjacentHTML('beforeend', mine);
          log.insertAdjacentHTML('beforeend', '<div class="msg bot typing" id="fdTyping"><i></i><i></i><i></i></div>'); log.scrollTop = 1e9;
          try {
            const res = await aiFood({ text });
            $('#fdTyping')?.remove();
            const wrap = document.createElement('div'); wrap.className = 'msg bot food-bubble'; wrap.innerHTML = resultHTML(res);
            log.appendChild(wrap); hookResult(wrap, res, 'ai');
          } catch (err) { $('#fdTyping')?.remove(); log.insertAdjacentHTML('beforeend', `<div class="msg bot">${aiFoodError(err)}</div>`); }
          log.scrollTop = 1e9;
        };
      } else {
        body.innerHTML = `<div class="field"><label>What did you eat or drink?</label><input id="fmName" placeholder="e.g. Chicken salad"></div>
          <div class="field"><label>Calories (kcal)</label><input id="fmKcal" type="number" placeholder="e.g. 450"></div>
          <details><summary class="small">Add protein, carbs, fat (optional)</summary><div class="row gap">
            <div class="field"><label>Protein g</label><input id="fmP" type="number"></div>
            <div class="field"><label>Carbs g</label><input id="fmC" type="number"></div>
            <div class="field"><label>Fat g</label><input id="fmF" type="number"></div></div></details>
          <button class="btn big" id="fmAdd" style="margin-top:10px">＋ Add to today</button>
          ${isVip() ? '' : '<p class="muted small" style="text-align:center">Don\'t know the calories? 👑 VIP counts them from a photo or a text.</p>'}`;
        $('#fmAdd').onclick = () => {
          const name = $('#fmName').value.trim() || 'Food', kcal = +$('#fmKcal').value;
          if (!(kcal >= 0) || $('#fmKcal').value === '') return toast('Add the calories');
          addMeals([{ name, kcal, protein: +$('#fmP').value || 0, carbs: +$('#fmC').value || 0, fat: +$('#fmF').value || 0 }], 'manual');
        };
      }
    };
    m.querySelectorAll('#fdTabs button').forEach(b => b.onclick = () => show(b.dataset.t));
    show(tab);
  });
}
renderFood();
