// ================= FRIENDS + PRIVATE CHAT (Supabase, live) =================
// Add friends from their profile or by searching a name, accept requests,
// then chat 1 on 1 (text + photos). Messages arrive live.

const PCOLS = 'id, name, avatar, photo_url, is_dev, vip_until, name_fx, ring';
let friendsCache = { friends: [], incoming: [], outgoing: [], lastMsg: {}, unread: {} };
let liveChannel = null, openChatWith = null;

async function loadFriends() {
  const { data, error } = await sb.from('friendships')
    .select(`*, req:profiles!friendships_requester_fkey(${PCOLS}), add:profiles!friendships_addressee_fkey(${PCOLS})`);
  if (error) throw error;
  const f = { friends: [], incoming: [], outgoing: [], lastMsg: {}, unread: {} };
  for (const x of data || []) {
    const other = x.requester === me ? x.add : x.req;
    if (!other) continue;
    const row = { ...other, fid: x.id };
    if (x.status === 'accepted') f.friends.push(row);
    else if (x.addressee === me) f.incoming.push(row);
    else f.outgoing.push(row);
  }
  const { data: msgs } = await sb.from('messages').select('*').or(`sender.eq.${me},receiver.eq.${me}`).order('created_at', { ascending: false }).limit(300);
  for (const m of msgs || []) {
    const other = m.sender === me ? m.receiver : m.sender;
    if (!f.lastMsg[other]) f.lastMsg[other] = m;
    if (m.receiver === me && !m.read_at) f.unread[other] = (f.unread[other] || 0) + 1;
  }
  f.friends.sort((a, b) => (b.is_dev - a.is_dev) || (new Date(f.lastMsg[b.id]?.created_at || 0) - new Date(f.lastMsg[a.id]?.created_at || 0)));
  friendsCache = f; updateBadges();
  return f;
}
function friendState(uid) {
  const f = friendsCache;
  if (f.friends.some(x => x.id === uid)) return 'friends';
  if (f.incoming.some(x => x.id === uid)) return 'incoming';
  if (f.outgoing.some(x => x.id === uid)) return 'outgoing';
  return 'none';
}
function updateBadges() {
  const n = friendsCache.incoming.length + Object.values(friendsCache.unread).reduce((a, b) => a + b, 0);
  const tab = document.querySelector('.tabbar [data-view=community]');
  if (tab) { tab.dataset.badge = n > 9 ? '9+' : n || ''; }
  const seg = document.querySelector('#peopleSeg [data-p=friends]');
  if (seg) seg.dataset.badge = n > 9 ? '9+' : n || '';
}

async function sendRequest(uid) {
  const r = await sb.from('friendships').insert({ addressee: uid });
  if (r.error) return toast(r.error.code === '23505' ? 'You already have a request with them' : 'Couldn\'t send the request');
  toast('Friend request sent 💌'); await loadFriends();
}
async function acceptRequest(row) {
  const r = await sb.from('friendships').update({ status: 'accepted' }).eq('id', row.fid);
  if (r.error) return toast('Couldn\'t accept');
  celebrate(); toast(`You and ${row.name} are friends now 🎉`); await loadFriends(); renderFriends();
}
async function removeFriendship(row, msg) {
  const r = await sb.from('friendships').delete().eq('id', row.fid);
  if (r.error) return toast('Couldn\'t do that');
  toast(msg); await loadFriends(); renderFriends();
}
// the friend button used on profile pages
function friendButton(uid) {
  const st = friendState(uid);
  return { none: '<button class="btn" id="fbAdd">➕ Add friend</button>',
    outgoing: '<button class="btn ghost" disabled>⏳ Request sent</button>',
    incoming: '<button class="btn" id="fbAccept">✅ Accept friend request</button>',
    friends: '<button class="btn" id="fbChat">💬 Message</button>' }[st];
}
function hookFriendButton(uid, p) {
  if ($('#fbAdd')) $('#fbAdd').onclick = async () => { await sendRequest(uid); showProfile(uid); };
  if ($('#fbAccept')) $('#fbAccept').onclick = async () => { await acceptRequest(friendsCache.incoming.find(x => x.id === uid)); showProfile(uid); };
  if ($('#fbChat')) $('#fbChat').onclick = () => openChat({ id: uid, ...p });
}

// ---------- friends panel ----------
async function renderFriends() {
  const box = $('#friendsPanel'); if (!box) return;
  try { await loadFriends(); } catch (e) { box.innerHTML = '<p class="muted">Couldn\'t load friends.</p>'; return; }
  const f = friendsCache;
  const row = (p, right, sub = '') => `<div class="frow" data-id="${p.id}">${avatarHTML(p)}<div class="frow-main"><b>${nameHTML(p)}</b>${sub ? `<div class="muted small ellipsis">${sub}</div>` : ''}</div>${right}</div>`;
  box.innerHTML = `
    <div class="card">
      <div class="search"><input id="fSearch" placeholder="🔎 Find people by name…" autocomplete="off"></div>
      <div id="fResults"></div>
    </div>
    ${f.incoming.length ? `<div class="card"><h3>💌 Friend requests</h3>${f.incoming.map(p => row(p, `<div class="row gap"><button class="btn sm" data-acc="${p.id}">Accept</button><button class="linkbtn" data-dec="${p.id}">✕</button></div>`)).join('')}</div>` : ''}
    <div class="card"><h3>💬 Friends</h3>
      ${f.friends.map(p => { const m = f.lastMsg[p.id], u = f.unread[p.id];
        return row(p, `<div class="frow-end">${m ? `<span class="muted small">${timeAgo(m.created_at)}</span>` : ''}${u ? `<span class="unread">${u}</span>` : ''}</div>`,
          m ? esc((m.sender === me ? 'You: ' : '') + (m.body || '📷 Photo')) : 'Say hi 👋'); }).join('') || '<p class="muted small">No friends yet. Search above, or open someone\'s profile from the feed and tap ➕ Add friend.</p>'}
    </div>
    ${f.outgoing.length ? `<div class="card"><h3>⏳ Sent requests</h3>${f.outgoing.map(p => row(p, `<button class="linkbtn" data-cancel="${p.id}">cancel</button>`)).join('')}</div>` : ''}`;
  box.querySelectorAll('[data-acc]').forEach(b => b.onclick = e => { e.stopPropagation(); acceptRequest(f.incoming.find(x => x.id === b.dataset.acc)); });
  box.querySelectorAll('[data-dec]').forEach(b => b.onclick = e => { e.stopPropagation(); removeFriendship(f.incoming.find(x => x.id === b.dataset.dec), 'Request declined'); });
  box.querySelectorAll('[data-cancel]').forEach(b => b.onclick = e => { e.stopPropagation(); removeFriendship(f.outgoing.find(x => x.id === b.dataset.cancel), 'Request cancelled'); });
  box.querySelectorAll('.card:not(:first-child) .frow').forEach(r => r.onclick = () => {
    const p = f.friends.find(x => x.id === r.dataset.id); p ? openChat(p) : showProfile(r.dataset.id);
  });
  let t; $('#fSearch').oninput = e => { clearTimeout(t); t = setTimeout(() => searchPeople(e.target.value.trim()), 300); };
}
async function searchPeople(q) {
  const out = $('#fResults'); if (!q) { out.innerHTML = ''; return; }
  const { data } = await sb.from('profiles').select(PCOLS).ilike('name', `%${q.replace(/[%_]/g, '')}%`).neq('id', me).limit(15);
  out.innerHTML = (data || []).map(p => `<div class="frow" data-id="${p.id}">${avatarHTML(p)}<div class="frow-main"><b>${nameHTML(p)}</b></div><span class="chip">${{ friends: '✓ friends', outgoing: '⏳ sent', incoming: '💌 wants to be friends', none: '➕' }[friendState(p.id)]}</span></div>`).join('') || '<p class="muted small">Nobody found with that name.</p>';
  out.querySelectorAll('.frow').forEach(r => r.onclick = () => showProfile(r.dataset.id));
}

// ---------- chat ----------
function msgHTML(m) {
  const mine = m.sender === me;
  return `<div class="dm ${mine ? 'me' : 'them'}" data-id="${m.id}">
    ${m.photo_url ? `<img src="${esc(m.photo_url)}" class="dm-img" alt="">` : ''}${m.body ? `<div>${esc(m.body)}</div>` : ''}
    <span class="dm-time">${new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${mine && m.read_at ? ' ✓✓' : ''}</span></div>`;
}
async function openChat(p) {
  openChatWith = p.id;
  openModal(`<div class="chat-sheet">
      <div class="chat-top"><button class="linkbtn" id="dmBack">←</button>${avatarHTML(p)}<button class="who name" id="dmProf">${nameHTML(p)}</button>${p.is_dev ? '' : '<button class="linkbtn" id="dmReport" title="Report" style="margin-left:auto">🚩</button>'}</div>
      <div class="dm-list" id="dmList"><p class="muted small">Loading…</p></div>
      <div id="dmPrev"></div>
      <form class="chat-input" id="dmForm"><button type="button" class="iconbtn" id="dmPic">📷</button><input type="file" accept="image/*" id="dmPicIn" hidden><input id="dmText" maxlength="2000" placeholder="Message…" autocomplete="off"><button class="btn">Send</button></form>
    </div>`, async () => {
    $('#modal').classList.add('full');
    $('#dmBack').onclick = () => { closeModal(); };
    $('#dmProf').onclick = () => showProfile(p.id);
    const { data } = await sb.from('messages').select('*')
      .or(`and(sender.eq.${me},receiver.eq.${p.id}),and(sender.eq.${p.id},receiver.eq.${me})`)
      .order('created_at', { ascending: true }).limit(300);
    $('#dmList').innerHTML = (data || []).map(msgHTML).join('') || `<p class="muted small" style="text-align:center">Say hi to ${esc(p.name)} 👋</p>`;
    $('#dmList').scrollTop = 1e9;
    sb.from('messages').update({ read_at: new Date().toISOString() }).eq('receiver', me).eq('sender', p.id).is('read_at', null).then(() => loadFriends());
    let pic = null;
    $('#dmPic').onclick = () => $('#dmPicIn').click();
    if ($('#dmReport')) $('#dmReport').onclick = () => reportModal('message', p.id + ':chat', 'Chat with ' + p.name);
    $('#dmPicIn').onchange = async e => { const f = e.target.files[0]; if (!f) return; pic = await shrinkImage(f, 1080); $('#dmPrev').innerHTML = `<div class="dm-prev"><img src="${pic}"><button class="linkbtn" id="dmPicX">✕</button></div>`; $('#dmPicX').onclick = () => { pic = null; $('#dmPrev').innerHTML = ''; }; };
    $('#dmForm').onsubmit = async e => {
      e.preventDefault();
      const body = $('#dmText').value.trim(); if (!body && !pic) return;
      $('#dmText').value = '';
      let photo_url = null;
      try {
        if (pic) {
          const blob = await (await fetch(pic)).blob(); const path = `${me}/dm-${Date.now()}.jpg`;
          const up = await sb.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg' }); if (up.error) throw up.error;
          photo_url = sb.storage.from('photos').getPublicUrl(path).data.publicUrl; pic = null; $('#dmPrev').innerHTML = '';
        }
        const { data: m, error } = await sb.from('messages').insert({ receiver: p.id, body: body || null, photo_url }).select().single();
        if (error) throw error;
        appendMsg(m);
      } catch (err) { toast('Message didn\'t send'); }
    };
  });
}
function appendMsg(m) {
  const list = $('#dmList'); if (!list || list.querySelector(`[data-id="${m.id}"]`)) return;
  if (list.querySelector('p.muted')) list.innerHTML = '';
  list.insertAdjacentHTML('beforeend', msgHTML(m)); list.scrollTop = 1e9;
}
const _closeModal = window.closeModal;
window.closeModal = function () { openChatWith = null; $('#modal').classList.remove('full', 'story-modal'); _closeModal(); };

// ---------- live updates ----------
function startLive() {
  if (liveChannel || !sb) return;
  liveChannel = sb.channel('bloom-live-' + me)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver=eq.${me}` }, ({ new: m }) => {
      if (openChatWith === m.sender) {
        appendMsg(m); sb.from('messages').update({ read_at: new Date().toISOString() }).eq('id', m.id).then(() => {});
      } else {
        const who = friendsCache.friends.find(x => x.id === m.sender);
        toast(`💬 ${who ? who.name : 'New message'}: ${m.body ? m.body.slice(0, 40) : '📷 Photo'}`);
        notify(`💬 ${who ? who.name : 'New message'}`, m.body || '📷 Photo');
        loadFriends().then(() => { if ($('#friendsPanel') && !$('#friendsPanel').hidden) renderFriends(); });
      }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, ({ eventType, new: f }) => {
      if (eventType === 'INSERT' && f.addressee === me) { toast('💌 New friend request!'); notify('💌 New friend request', 'Someone wants to be your friend on Bloom'); }
      if (eventType === 'UPDATE' && f.requester === me && f.status === 'accepted') { toast('🎉 Your friend request was accepted!'); celebrate(); }
      loadFriends().then(() => { if ($('#friendsPanel') && !$('#friendsPanel').hidden) renderFriends(); });
    })
    .subscribe();
}

// ---------- People tab: Feed / Friends switch ----------
function peopleTab(which) {
  S.peopleTab = which; save();
  document.querySelectorAll('#peopleSeg button').forEach(b => b.classList.toggle('on', b.dataset.p === which));
  $('#feedPanel').hidden = which !== 'feed';
  $('#friendsPanel').hidden = which !== 'friends';
  if (which === 'friends') renderFriends();
}
document.querySelectorAll('#peopleSeg button').forEach(b => b.onclick = () => peopleTab(b.dataset.p));
