// ================= TOGETHER: live fasting, weekly leaderboards, group fasts =================
// Public to everyone in Bloom (people can hide themselves). Data lives in Supabase:
// fast_live (who is fasting now), weekly_stats (boards), fast_groups + fast_group_members.

const TCOLS = 'name, avatar, photo_url, is_dev, vip_until, name_fx, ring, on_boards';
let togetherTab = 'live', boardKind = 'fast', togetherTimer = null;

// Monday of this week as YYYY-MM-DD (local time)
function weekStart(d = new Date()) { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function myWeek() {
  const mon = weekStart(), from = mon.getTime(), now = Date.now();
  const overlap = (a, b) => Math.max(0, Math.min(b, now) - Math.max(a, from)) / 3600e3;
  let hours = S.history.reduce((t, f) => t + overlap(f.start, f.end || (f.start + f.hours * 3600e3)), 0);
  if (S.fast) hours += overlap(S.fast.start, now);
  const k0 = ymd(mon);
  const steps = Object.entries(S.days || {}).filter(([k]) => k >= k0).reduce((t, [, d]) => t + (d.steps || 0), 0);
  let kg = null;
  if (comm().show_weight && S.weights.length) {
    const before = [...S.weights].reverse().find(w => w.date < k0) || S.weights.find(w => w.date >= k0);
    const last = S.weights[S.weights.length - 1];
    if (before && last && last.date >= k0) kg = Math.round((before.kg - last.kg) * 10) / 10;
  }
  return { week: k0, fast_hours: Math.min(168, Math.round(hours * 10) / 10), steps: Math.min(1000000, steps), kg_lost: kg };
}

// push my live fast + weekly numbers (only for real accounts with a community profile)
let lastLiveSig = null, lastWeekSync = 0;
async function syncTogether(force) {
  try {
    if (!navigator.onLine || typeof SUPA_URL === 'undefined' || !SUPA_URL) return;
    if (!Object.keys(localStorage).some(k => /^sb-.*-auth-token$/.test(k))) return;
    if (!(await commInit()) || !comm().name) return;
    const u = (await sb.auth.getUser()).data.user; if (!isRealUser(u)) return;
    const sig = S.fast ? `${S.fast.start}|${S.fast.goal}|${S.fast.type}` : 'none';
    if (force || sig !== lastLiveSig) {
      if (S.fast) await sb.from('fast_live').upsert({ user_id: me, started_at: new Date(S.fast.start).toISOString(), goal_hours: S.fast.goal, kind: S.fast.type, updated_at: new Date().toISOString() });
      else await sb.from('fast_live').delete().eq('user_id', me);
      lastLiveSig = sig;
    }
    if (force || Date.now() - lastWeekSync > 10 * 60e3) {
      await sb.from('weekly_stats').upsert({ user_id: me, ...myWeek(), updated_at: new Date().toISOString() });
      lastWeekSync = Date.now();
    }
  } catch (e) {}
}
setInterval(() => syncTogether(false), 30e3);
document.addEventListener('visibilitychange', () => { if (!document.hidden) syncTogether(false); });
setTimeout(() => syncTogether(true), 4000);

const untilText = (start, goal) => { const end = new Date(start + goal * 3600e3); return end.toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); };
const personRow = (p, right, sub, me_) => `<div class="tg-row ${me_ ? 'me' : ''}" data-uid="${esc(p.id || '')}">${avatarHTML(p, 'sm')}<div class="tg-who"><b>${nameHTML(p)}</b>${sub ? `<span>${sub}</span>` : ''}</div>${right}</div>`;

async function renderTogether() {
  const box = $('#togetherPanel'); if (!box) return;
  const vis = comm().on_boards !== false;
  box.innerHTML = `<div class="seg people-seg tg-seg">
      <button type="button" data-t="live" class="${togetherTab === 'live' ? 'on' : ''}">🔥 Live</button>
      <button type="button" data-t="boards" class="${togetherTab === 'boards' ? 'on' : ''}">🏆 Weekly</button>
      <button type="button" data-t="groups" class="${togetherTab === 'groups' ? 'on' : ''}">👯 Groups</button></div>
    <div id="tgBody"><p class="muted">Loading…</p></div>
    <label class="small toggle-row tg-vis"><input type="checkbox" id="tgVis" ${vis ? 'checked' : ''}> 👀 Show me on the boards and the live list</label>`;
  box.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { togetherTab = b.dataset.t; renderTogether(); });
  $('#tgVis').onchange = async e => { comm().on_boards = e.target.checked; save(); await sb.from('profiles').update({ on_boards: e.target.checked }).eq('id', me); toast(e.target.checked ? 'You\'re visible on the boards 🏆' : 'You\'re hidden from the boards 🙈'); renderTogether(); };
  await syncTogether(true);
  clearInterval(togetherTimer); togetherTimer = setInterval(() => { if (curView === 'community' && S.peopleTab === 'together' && togetherTab === 'live' && !$('#modalBack').classList.contains('show')) renderLive(); }, 60e3);
  if (togetherTab === 'live') renderLive(); else if (togetherTab === 'boards') renderBoards(); else renderGroups();
}

// ---------- 🔥 who is fasting right now ----------
async function renderLive() {
  const body = $('#tgBody'); if (!body) return;
  const { data, error } = await sb.from('fast_live').select(`user_id, started_at, goal_hours, kind, profiles(${TCOLS})`).order('started_at').limit(200);
  if (error) return body.innerHTML = '<p class="muted">Couldn\'t load. Check your internet.</p>';
  const rows = (data || []).filter(r => r.profiles && (r.profiles.on_boards !== false || r.user_id === me));
  const now = Date.now();
  body.innerHTML = `<div class="tg-hero"><b>${rows.length}</b> ${rows.length === 1 ? 'person is' : 'people are'} fasting right now 🔥</div>
    ${rows.map(r => {
      const st = new Date(r.started_at).getTime(), h = (now - st) / 3600e3, pct = Math.min(100, h / r.goal_hours * 100);
      return personRow({ id: r.user_id, ...r.profiles }, `<div class="tg-fast"><b>${fmtDur(h)}</b><div class="tg-bar"><i style="width:${pct}%"></i></div></div>`,
        `${r.kind === 'water' ? '💧 water' : '🥗 dirty'} fast · until ${untilText(st, r.goal_hours)}`, r.user_id === me);
    }).join('') || '<p class="muted small">Nobody is fasting right now. Start one and lead the way 🌱</p>'}
    ${S.fast ? '' : '<button class="btn big" id="tgStart" style="margin-top:10px">⏳ Start fasting with everyone</button>'}`;
  if ($('#tgStart')) $('#tgStart').onclick = () => { showView('home'); startFastModal(); };
  body.querySelectorAll('.tg-row[data-uid]').forEach(r => r.onclick = () => showProfile(r.dataset.uid));
}

// ---------- 🏆 weekly leaderboards ----------
async function renderBoards() {
  const body = $('#tgBody'); if (!body) return;
  const col = { fast: 'fast_hours', steps: 'steps', kg: 'kg_lost' }[boardKind];
  let q = sb.from('weekly_stats').select(`user_id, fast_hours, steps, kg_lost, profiles(${TCOLS})`).eq('week', ymd(weekStart())).order(col, { ascending: false, nullsFirst: false }).limit(50);
  q = boardKind === 'kg' ? q.gt('kg_lost', 0) : q.gt(col, 0);
  const { data, error } = await q;
  if (error) return body.innerHTML = '<p class="muted">Couldn\'t load. Check your internet.</p>';
  const rows = (data || []).filter(r => r.profiles && (r.profiles.on_boards !== false || r.user_id === me));
  const fmt = r => boardKind === 'fast' ? `${Math.round(r.fast_hours)} h` : boardKind === 'steps' ? (+r.steps).toLocaleString() : `−${(+r.kg_lost).toFixed(1)} kg`;
  const myRank = rows.findIndex(r => r.user_id === me) + 1, mine = myWeek();
  const resets = new Date(weekStart().getTime() + 7 * 864e5).toLocaleDateString([], { weekday: 'long' });
  body.innerHTML = `<div class="seg people-seg tg-kind">
      <button type="button" data-k="fast" class="${boardKind === 'fast' ? 'on' : ''}">⏳ Fasting</button>
      <button type="button" data-k="steps" class="${boardKind === 'steps' ? 'on' : ''}">👟 Steps</button>
      <button type="button" data-k="kg" class="${boardKind === 'kg' ? 'on' : ''}">⚖️ Weight lost</button></div>
    <div class="tg-me">${myRank ? `You're <b>#${myRank}</b> this week 🎉` : 'You\'re not on this board yet'} · You: <b>${boardKind === 'fast' ? Math.round(mine.fast_hours) + ' h' : boardKind === 'steps' ? mine.steps.toLocaleString() : mine.kg_lost != null ? (mine.kg_lost > 0 ? '−' + mine.kg_lost + ' kg' : '0 kg') : 'weight hidden'}</b><span class="muted small"> · resets ${resets}</span></div>
    ${rows.length >= 3 ? `<div class="podium">${[1, 0, 2].map(i => { const r = rows[i]; return `<div class="pod p${i + 1}" data-uid="${r.user_id}">${avatarHTML({ id: r.user_id, ...r.profiles }, '')}<b>${esc(r.profiles.name)}</b><span>${fmt(r)}</span><div class="pod-step">${['🥇', '🥈', '🥉'][i]}</div></div>`; }).join('')}</div>` : ''}
    ${rows.slice(rows.length >= 3 ? 3 : 0).map((r, i) => personRow({ id: r.user_id, ...r.profiles }, `<b class="tg-val">${fmt(r)}</b>`, '', r.user_id === me).replace('<div class="tg-row', `<div data-rank="${i + (rows.length >= 3 ? 4 : 1)}" class="tg-row`)).join('')}
    ${!rows.length ? '<p class="muted small">No one on this board yet this week. Be the first 🌟</p>' : ''}
    ${boardKind === 'kg' && !comm().show_weight ? '<p class="muted small">Your weight is hidden (profile setting), so you aren\'t on this board.</p>' : ''}`;
  body.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { boardKind = b.dataset.k; renderBoards(); });
  body.querySelectorAll('[data-uid]').forEach(r => r.onclick = () => showProfile(r.dataset.uid));
}

// ---------- 👯 group fasts ----------
async function renderGroups() {
  const body = $('#tgBody'); if (!body) return;
  const since = new Date(Date.now() - 16 * 864e5).toISOString();
  const { data, error } = await sb.from('fast_groups').select('*, fast_group_members(user_id)').gte('starts_at', since).order('starts_at').limit(50);
  if (error) return body.innerHTML = '<p class="muted">Couldn\'t load. Check your internet.</p>';
  const now = Date.now();
  const groups = (data || []).filter(g => new Date(g.starts_at).getTime() + g.goal_hours * 3600e3 > now - 864e5);
  body.innerHTML = `<button class="btn big" id="tgNew">＋ Start a group fast</button>
    ${groups.map(g => {
      const st = new Date(g.starts_at).getTime(), n = g.fast_group_members.length, joined = g.fast_group_members.some(m => m.user_id === me);
      const state = now < st ? `starts ${new Date(st).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : now < st + g.goal_hours * 3600e3 ? `live · ends ${untilText(st, g.goal_hours)}` : 'finished';
      return `<div class="tg-group ${joined ? 'joined' : ''}" data-g="${g.id}"><span class="tg-gemo">${esc(g.emoji)}</span><div class="tg-who"><b>${esc(g.name)}</b><span>${g.goal_hours} h · ${state} · ${n} ${n === 1 ? 'member' : 'members'}</span></div><span class="chip">${joined ? '✓ joined' : 'Join'}</span></div>`;
    }).join('') || '<p class="muted small" style="margin-top:10px">No group fasts yet. Start one and invite everyone 💪</p>'}`;
  $('#tgNew').onclick = newGroupModal;
  body.querySelectorAll('[data-g]').forEach(r => r.onclick = () => openGroup(+r.dataset.g));
}

function newGroupModal() {
  let goal = 24, emoji = '🔥';
  const now = new Date(Date.now() + 60e3), local = new Date(now.getTime() - now.getTimezoneOffset() * 60e3).toISOString().slice(0, 16);
  openModal(`<h2>👯 New group fast</h2>
    <div class="field"><label>Name</label><input id="gName" maxlength="40" placeholder="e.g. Monday reset squad"></div>
    <div class="field"><label>Emoji</label><div class="chips" id="gEmo">${['🔥', '💪', '🌸', '😈', '👑', '🦋', '🌙', '💎'].map(e => `<button type="button" class="chip pick ${e === emoji ? 'on' : ''}" data-e="${e}" style="font-size:1.2rem">${e}</button>`).join('')}</div></div>
    <div class="field"><label>How long</label><div class="seg" id="gGoal">${[16, 24, 36, 48, 72, 120, 168].map(h => `<button type="button" data-h="${h}" class="${h === goal ? 'on' : ''}">${h < 48 ? h + ' h' : h / 24 + ' days'}</button>`).join('')}</div></div>
    <div class="field"><label>Starts</label><input type="datetime-local" id="gStart" value="${local}"></div>
    <label class="small toggle-row" id="gRisk" hidden><input type="checkbox" id="gRiskOk"> Everyone joining fasts over 3 days at their own risk (Terms). I'm 18+.</label>
    <button class="btn big" id="gGo">Create group fast</button>`, m => {
    m.querySelectorAll('#gEmo [data-e]').forEach(b => b.onclick = () => { emoji = b.dataset.e; m.querySelectorAll('#gEmo [data-e]').forEach(x => x.classList.toggle('on', x === b)); });
    m.querySelectorAll('#gGoal [data-h]').forEach(b => b.onclick = () => { goal = +b.dataset.h; m.querySelectorAll('#gGoal [data-h]').forEach(x => x.classList.toggle('on', x === b)); $('#gRisk').hidden = goal <= 72; });
    $('#gGo').onclick = async () => {
      const name = $('#gName').value.trim(); if (name.length < 2) return toast('Give it a name');
      if (goal > 72 && !$('#gRiskOk').checked) return toast('Please accept the risk note');
      const st = new Date($('#gStart').value || Date.now());
      const r = await sb.from('fast_groups').insert({ name, emoji, goal_hours: goal, starts_at: st.toISOString() }).select().single();
      if (r.error) return toast('Couldn\'t create. Check your internet.');
      await sb.from('fast_group_members').insert({ group_id: r.data.id });
      closeModal(); celebrate(); toast('Group fast created 🎉 Share it in the feed!'); openGroup(r.data.id);
    };
  });
}

async function openGroup(id) {
  openModal('<p class="muted">Loading…</p>');
  const { data: g } = await sb.from('fast_groups').select('*').eq('id', id).maybeSingle();
  if (!g) return openModal('<p>This group fast is gone.</p><button class="btn big" onclick="closeModal()">Close</button>');
  const { data: mem } = await sb.from('fast_group_members').select(`user_id, profiles(${TCOLS})`).eq('group_id', id).limit(300);
  const ids = (mem || []).map(m => m.user_id);
  const { data: live } = ids.length ? await sb.from('fast_live').select('user_id, started_at, goal_hours').in('user_id', ids) : { data: [] };
  const L = Object.fromEntries((live || []).map(l => [l.user_id, l]));
  const st = new Date(g.starts_at).getTime(), now = Date.now(), joined = ids.includes(me), owner = g.owner === me;
  const groupH = Math.max(0, (now - st) / 3600e3);
  const people = (mem || []).filter(m => m.profiles).map(m => { const l = L[m.user_id]; const h = l ? (now - new Date(l.started_at).getTime()) / 3600e3 : 0; return { ...m, h, fasting: !!l }; }).sort((a, b) => b.h - a.h);
  openModal(`<div class="tg-ghead"><span class="tg-gemo big">${esc(g.emoji)}</span><h2>${esc(g.name)}</h2>
      <p class="muted small">${g.goal_hours} h fast · ${now < st ? 'starts ' + new Date(st).toLocaleString() : 'started ' + new Date(st).toLocaleString()} · ends ${untilText(st, g.goal_hours)}</p>
      <div class="tg-bar big"><i style="width:${Math.min(100, groupH / g.goal_hours * 100)}%"></i></div>
      <p class="small"><b>${people.filter(p => p.fasting).length}</b> of ${people.length} fasting right now</p></div>
    ${people.map(p => personRow({ id: p.user_id, ...p.profiles }, p.fasting ? `<div class="tg-fast"><b>${fmtDur(p.h)}</b><div class="tg-bar"><i style="width:${Math.min(100, p.h / g.goal_hours * 100)}%"></i></div></div>` : '<span class="muted small">not fasting</span>', '', p.user_id === me)).join('')}
    <div class="row gap wrap" style="margin-top:12px">
      ${joined ? `${!S.fast ? '<button class="btn" id="gStartMine">⏳ Start my fast now</button>' : ''}<button class="btn ghost" id="gLeave">Leave</button>` : '<button class="btn big" id="gJoin">👯 Join this group fast</button>'}
      ${owner || comm().is_dev ? '<button class="btn ghost" id="gDel" style="color:var(--danger)">Delete</button>' : ''}
      <button class="btn ghost" onclick="closeModal()">Close</button></div>`, m => {
    m.querySelectorAll('.tg-row[data-uid]').forEach(r => r.onclick = () => showProfile(r.dataset.uid));
    if ($('#gJoin')) $('#gJoin').onclick = async () => {
      if (g.goal_hours > 72 && !confirm('This group fast is longer than 3 days. You join at your own risk (see Terms) and should check with a doctor first. Join?')) return;
      await sb.from('fast_group_members').insert({ group_id: id }); celebrate(); toast('You joined 💪'); openGroup(id);
    };
    if ($('#gLeave')) $('#gLeave').onclick = async () => { await sb.from('fast_group_members').delete().eq('group_id', id).eq('user_id', me); closeModal(); renderTogether(); };
    if ($('#gDel')) $('#gDel').onclick = async () => { if (!confirm('Delete this group fast for everyone?')) return; await sb.from('fast_groups').delete().eq('id', id); closeModal(); renderTogether(); };
    if ($('#gStartMine')) $('#gStartMine').onclick = () => {
      S.lastReason = S.lastReason || g.name;
      const left = Math.max(1, Math.round(st + g.goal_hours * 3600e3 - now) / 3600e3);
      if (left > 72) S.longFastAgreed = Date.now();
      S.fast = { type: 'water', goal: Math.min(360, Math.round(left)), start: Date.now(), reason: `Group fast: ${g.name}`, lastHour: 0 };
      save(); renderAll(); syncTogether(true); closeModal(); celebrate(); toast(`Fasting with ${g.name} 🔥`);
    };
  });
}

// hook into the People tab
const _peopleTab = peopleTab;
peopleTab = function (which) {
  _peopleTab(which);
  $('#togetherPanel').hidden = which !== 'together';
  if (which === 'together') renderTogether();
};
