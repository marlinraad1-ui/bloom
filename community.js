// ================= COMMUNITY (Supabase) =================
// No account needed: everyone gets an anonymous login + a profile (name, emoji or photo, bio).
// Anyone can read. You can only post, like, comment, edit and delete as yourself.
// Block hides a person's posts on your phone only.

const AVATARS = ['🌸', '🐰', '😈', '🔥', '💪', '🌙', '🦋', '🐻', '🍓', '⚡', '👑', '🌈', '🐱', '🐼', '🦊', '💎', '🐳', '🍵', '🍑', '🪐', '🎤'];
let sb = null, me = null, feedBusy = false, myLikes = new Set();
const PROFILE_COLS = 'name, avatar, photo_url, show_weight';

const comm = () => (S.community = S.community || { name: '', avatar: '🌸', photo_url: null, bio: '', show_weight: true, blocked: [] });

function timeAgo(t) {
  const s = (Date.now() - new Date(t).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  return Math.floor(s / 86400) + 'd';
}
const avatarHTML = (p, cls = '') => p?.photo_url
  ? `<img class="avatar ${cls}" src="${esc(p.photo_url)}" alt="">`
  : `<span class="avatar ${cls}">${esc(p?.avatar || '🌸')}</span>`;

async function commInit() {
  if (sb) return true;
  if (!SUPA_URL || !SUPA_KEY || !window.supabase) return false;
  sb = window.supabase.createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  let { data } = await sb.auth.getSession();
  if (!data.session) {
    const r = await sb.auth.signInAnonymously();
    if (r.error) { sb = null; throw r.error; }
    data = { session: r.data.session };
  }
  me = data.session.user.id;
  // load my profile from the server (or create it from what this phone remembers)
  const { data: prof } = await sb.from('profiles').select('*').eq('id', me).maybeSingle();
  const c = comm();
  if (prof) Object.assign(c, { name: prof.name, avatar: prof.avatar, photo_url: prof.photo_url, bio: prof.bio || '', show_weight: prof.show_weight });
  else if (c.name) await saveProfileRemote();
  save();
  return true;
}
async function saveProfileRemote() {
  const c = comm();
  return sb.from('profiles').upsert({ id: me, name: c.name, avatar: c.avatar, photo_url: c.photo_url || null, bio: c.bio || null, show_weight: !!c.show_weight, updated_at: new Date().toISOString() });
}

function commProfile(after) {
  const c = comm(); let av = c.avatar, photo = c.photo_url, newPhoto = null;
  openModal(`<h2>${c.name ? 'Edit my profile' : 'Your community profile'}</h2>
    <p class="muted small">No email, no password. Just you.</p>
    <div class="prof-edit">
      <div id="cPic" class="prof-pic">${photo ? `<img src="${esc(photo)}" alt="">` : `<span>${av}</span>`}</div>
      <div class="row gap wrap"><button type="button" class="btn ghost" id="cPicBtn">📷 Photo</button>${photo ? '<button type="button" class="linkbtn" id="cPicX">remove photo</button>' : ''}</div>
      <input type="file" accept="image/*" id="cPicIn" hidden>
    </div>
    <div class="field"><label>Name people will see</label><input id="cName" maxlength="40" value="${esc(c.name || S.profile?.name || '')}"></div>
    <div class="field"><label>Bio (optional)</label><input id="cBio" maxlength="200" value="${esc(c.bio || '')}" placeholder="e.g. 7 day fast for my faith 🙏 down 6 kg"></div>
    <div class="field"><label>Emoji (used when you have no photo)</label><div class="chips" id="cAv">${AVATARS.map(a => `<button type="button" class="chip pick ${a === av ? 'on' : ''}" data-a="${a}" style="font-size:1.3rem">${a}</button>`).join('')}</div></div>
    <label class="small toggle-row"><input type="checkbox" id="cWeight" ${c.show_weight ? 'checked' : ''}> ⚖️ Show my weight in posts</label>
    <button class="btn big" id="cSave">Save</button>`, () => {
    const pic = () => { $('#cPic').innerHTML = (newPhoto || photo) ? `<img src="${newPhoto || photo}" alt="">` : `<span>${av}</span>`; };
    document.querySelectorAll('#cAv button').forEach(b => b.onclick = () => { av = b.dataset.a; document.querySelectorAll('#cAv button').forEach(x => x.classList.toggle('on', x === b)); pic(); });
    $('#cPicBtn').onclick = () => $('#cPicIn').click();
    $('#cPicIn').onchange = async e => { const f = e.target.files[0]; if (f) { newPhoto = await shrinkImage(f, 400); pic(); } };
    if ($('#cPicX')) $('#cPicX').onclick = () => { photo = null; newPhoto = null; pic(); };
    $('#cSave').onclick = async () => {
      const n = $('#cName').value.trim(); if (!n) return toast('Pick a name first');
      const btn = $('#cSave'); btn.disabled = true; btn.textContent = 'Saving…';
      try {
        if (newPhoto) {
          const blob = await (await fetch(newPhoto)).blob();
          const path = `${me}/avatar-${Date.now()}.jpg`;
          const up = await sb.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg' });
          if (up.error) throw up.error;
          const old = c.photo_url?.split('/object/public/photos/')[1];
          if (old && old.startsWith(me + '/')) sb.storage.from('photos').remove([decodeURIComponent(old)]);
          photo = sb.storage.from('photos').getPublicUrl(path).data.publicUrl;
        }
        Object.assign(c, { name: n, avatar: av, photo_url: photo || null, bio: $('#cBio').value.trim(), show_weight: $('#cWeight').checked });
        const r = await saveProfileRemote(); if (r.error) throw r.error;
        save(); closeModal(); renderCommunityHead(); toast('Profile saved ✨'); (after || loadFeed)();
      } catch (e) { btn.disabled = false; btn.textContent = 'Save'; toast('Couldn\'t save. Check your internet.'); }
    };
  });
}

function renderCommunityHead() {
  const c = comm();
  $('#commMe').innerHTML = c.name ? `<button class="me-chip" id="commEdit">${avatarHTML(c, 'sm')} <b>${esc(c.name)}</b> <span class="muted">· my profile</span></button>` : '';
  if ($('#commEdit')) $('#commEdit').onclick = () => showProfile(me);
  $('#postWeight').checked = !!c.show_weight;
}

function myStats(withWeight) {
  const st = {};
  if (S.fast) { st.fastH = Math.floor(fastHours()); st.type = S.fast.type; }
  const start = S.weights[0]?.kg;
  if (withWeight) { if (start && start - kg() > 0) st.lost = +(start - kg()).toFixed(1); st.kg = +kg().toFixed(1); }
  const steps = day().steps; if (steps) st.steps = steps;
  if (S.water?.goal) st.water = +(waterTotal() / 1000).toFixed(1);
  return st;
}
function statsChips(st) {
  if (!st) return '';
  const c = [];
  if (st.fastH != null) c.push(`⏳ ${st.fastH}h ${st.type === 'water' ? 'water' : 'dirty'} fast`);
  if (st.lost) c.push(`📉 −${st.lost} kg`);
  if (st.kg) c.push(`⚖️ ${st.kg} kg`);
  if (st.steps) c.push(`👟 ${(+st.steps).toLocaleString()} steps`);
  if (st.water) c.push(`💧 ${st.water} L`);
  return c.length ? `<div class="chips">${c.map(x => `<span class="chip">${x}</span>`).join('')}</div>` : '';
}

async function renderCommunity() {
  const box = $('#feed');
  if (!SUPA_URL || !SUPA_KEY) { box.innerHTML = '<p class="muted">The community is being set up. Check back soon! 🌸</p>'; $('#composer').hidden = true; return; }
  if (!navigator.onLine) { box.innerHTML = '<p class="muted">You\'re offline. Connect to the internet to see the community.</p>'; return; }
  try { await commInit(); } catch (e) { box.innerHTML = `<p class="muted">Couldn't connect to the community right now. Try again in a bit.</p>`; return; }
  $('#composer').hidden = false;
  renderCommunityHead();
  if (!comm().name) return commProfile(loadFeed);
  loadFeed();
}

function postHTML(p) {
  const nl = p.likes?.[0]?.count || 0, nc = p.comments?.[0]?.count || 0, liked = myLikes.has(p.id), mine = p.user_id === me;
  const prof = p.profiles || { name: p.name, avatar: p.avatar };
  return `<article class="post" data-id="${p.id}" data-user="${p.user_id}">
    <div class="post-head"><button class="who" data-act="profile">${avatarHTML(prof)}</button>
      <div style="flex:1;min-width:0"><button class="who name" data-act="profile">${esc(prof.name)}</button><div class="muted small">${timeAgo(p.created_at)}</div></div>
      <button class="linkbtn" data-act="more">•••</button></div>
    ${p.body ? `<p class="post-body">${esc(p.body)}</p>` : ''}
    ${p.photo_url ? `<img class="post-img" src="${esc(p.photo_url)}" loading="lazy" alt="">` : ''}
    ${statsChips(p.stats)}
    <div class="post-actions">
      <button data-act="like" class="${liked ? 'on' : ''}">${liked ? '❤️' : '🤍'} ${nl}</button>
      <button data-act="comments">💬 ${nc}</button>
      ${mine ? '<button data-act="delete">🗑️</button>' : ''}
    </div></article>`;
}

async function fetchPosts(userId) {
  let q = sb.from('posts').select(`*, profiles(${PROFILE_COLS}), likes(count), comments(count)`).order('created_at', { ascending: false }).limit(50);
  if (userId) q = q.eq('user_id', userId);
  const [{ data: posts, error }, { data: likes }] = await Promise.all([q, sb.from('likes').select('post_id').eq('user_id', me)]);
  if (error) throw error;
  myLikes = new Set((likes || []).map(l => l.post_id));
  const blocked = comm().blocked || [];
  return posts.filter(p => !blocked.includes(p.user_id));
}

async function loadFeed() {
  if (feedBusy) return; feedBusy = true;
  const box = $('#feed');
  if (!box.children.length) box.innerHTML = '<p class="muted">Loading…</p>';
  try {
    const list = await fetchPosts();
    box.innerHTML = list.map(postHTML).join('') || '<p class="muted card">No posts yet. Be the first! 🌸</p>';
  } catch (e) {
    box.innerHTML = '<p class="muted">Couldn\'t load posts. Tap refresh to try again.</p>';
  }
  feedBusy = false;
}

async function showProfile(uid) {
  openModal('<p class="muted">Loading…</p>');
  try {
    const [{ data: prof }, posts] = await Promise.all([sb.from('profiles').select('*').eq('id', uid).maybeSingle(), fetchPosts(uid)]);
    const p = prof || { name: 'Someone', avatar: '🌸' }, mine = uid === me;
    const likesGot = posts.reduce((a, x) => a + (x.likes?.[0]?.count || 0), 0);
    openModal(`<div class="prof-view">
      ${avatarHTML(p, 'xl')}
      <h2>${esc(p.name)}</h2>
      ${p.bio ? `<p>${esc(p.bio)}</p>` : ''}
      <div class="stats" style="width:100%"><div class="stat"><b>${posts.length}</b><span>posts</span></div><div class="stat"><b>${likesGot}</b><span>likes</span></div></div>
      ${mine ? '<button class="btn" id="pvEdit">✏️ Edit my profile</button>' : '<button class="btn ghost" id="pvBlock">🚫 Block</button>'}
    </div>
    <div id="pvPosts" style="margin-top:12px">${posts.map(postHTML).join('') || '<p class="muted small">No posts yet.</p>'}</div>
    <button class="btn ghost big" style="margin-top:8px" onclick="closeModal()">Close</button>`, m => {
      if ($('#pvEdit')) $('#pvEdit').onclick = () => commProfile();
      if ($('#pvBlock')) $('#pvBlock').onclick = () => blockUser(uid);
      $('#pvPosts').addEventListener('click', postClick);
    });
  } catch (e) { openModal('<p>Couldn\'t load this profile.</p><button class="btn big" onclick="closeModal()">Close</button>'); }
}
function blockUser(uid) {
  comm().blocked = [...new Set([...(comm().blocked || []), uid])]; save(); closeModal(); toast('Blocked. You won\'t see them anymore.'); loadFeed();
}

async function postClick(e) {
  const btn = e.target.closest('[data-act]'); const img = e.target.closest('.post-img');
  const post = e.target.closest('.post'); if (!post) return;
  const id = +post.dataset.id, uid = post.dataset.user;
  if (img) return openModal(`<img src="${img.src}" style="width:100%;border-radius:14px"><button class="btn big" style="margin-top:10px" onclick="closeModal()">Close</button>`);
  if (!btn) return;
  const act = btn.dataset.act;
  if (act === 'profile') return showProfile(uid);
  if (act === 'like') {
    const liked = myLikes.has(id), n = +(btn.textContent.match(/\d+/) || [0])[0];
    btn.textContent = `${liked ? '🤍' : '❤️'} ${liked ? n - 1 : n + 1}`; btn.classList.toggle('on', !liked);
    liked ? myLikes.delete(id) : myLikes.add(id);
    if (!liked) { btn.classList.add('pop'); setTimeout(() => btn.classList.remove('pop'), 400); }
    const r = liked ? await sb.from('likes').delete().match({ post_id: id, user_id: me }) : await sb.from('likes').insert({ post_id: id });
    if (r.error) toast('Like didn\'t go through');
  }
  if (act === 'comments') openComments(id);
  if (act === 'delete') deletePost(post, id);
  if (act === 'more') {
    const mine = uid === me;
    openModal(`<h2>Post options</h2><div class="theme-pick">
      <button id="mProf">👤 View profile</button>
      ${mine ? '<button id="mDel">🗑️ Delete my post</button>' : '<button id="mBlock">🚫 Block this person</button>'}
      <button onclick="closeModal()">Cancel</button></div>`, () => {
      $('#mProf').onclick = () => showProfile(uid);
      if ($('#mBlock')) $('#mBlock').onclick = () => blockUser(uid);
      if ($('#mDel')) $('#mDel').onclick = () => deletePost(post, id);
    });
  }
}
$('#feed').addEventListener('click', postClick);

function deletePost(post, id) {
  openModal(`<h2>Delete this post?</h2><p>It will be gone for everyone.</p><div class="row gap"><button class="btn ghost" onclick="closeModal()">Keep it</button><button class="btn danger" id="delGo">Delete</button></div>`, () => {
    $('#delGo').onclick = async () => {
      const r = await sb.from('posts').delete().eq('id', id); closeModal();
      if (r.error) return toast('Couldn\'t delete');
      const path = post.querySelector('.post-img')?.src.split('/object/public/photos/')[1];
      if (path && path.startsWith(me + '/')) sb.storage.from('photos').remove([decodeURIComponent(path)]);
      document.querySelectorAll(`.post[data-id="${id}"]`).forEach(x => x.remove()); toast('Deleted');
    };
  });
}

async function openComments(postId) {
  openModal(`<h2>💬 Comments</h2><div id="cList" class="comments"><p class="muted">Loading…</p></div>
    <form id="cForm" class="chat-input" style="margin-top:10px"><input id="cText" maxlength="500" placeholder="Say something…" autocomplete="off"><button class="btn">Send</button></form>`, async () => {
    const load = async () => {
      const { data } = await sb.from('comments').select(`*, profiles(${PROFILE_COLS})`).eq('post_id', postId).order('created_at').limit(200);
      const blocked = comm().blocked || [];
      $('#cList').innerHTML = (data || []).filter(c => !blocked.includes(c.user_id)).map(c => { const p = c.profiles || c; return `<div class="comment">${avatarHTML(p)}<div><b>${esc(p.name)}</b> <span class="muted small">${timeAgo(c.created_at)}</span><div>${esc(c.body)}</div></div></div>`; }).join('') || '<p class="muted small">No comments yet.</p>';
    };
    load();
    $('#cForm').onsubmit = async e => {
      e.preventDefault(); const body = $('#cText').value.trim(); if (!body) return;
      $('#cText').value = '';
      const c = comm(); const r = await sb.from('comments').insert({ post_id: postId, name: c.name, avatar: c.avatar, body });
      if (r.error) toast('Comment didn\'t send'); else { load(); loadFeed(); }
    };
  });
}

// ---- Composer ----
let postPhoto = null;
$('#postPhotoBtn').onclick = () => $('#postPhotoInput').click();
$('#postPhotoInput').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  postPhoto = await shrinkImage(f, 1080);
  $('#postPreview').innerHTML = `<img src="${postPhoto}" class="post-img"><button class="linkbtn" id="postPhotoX">remove photo</button>`;
  $('#postPhotoX').onclick = () => { postPhoto = null; $('#postPreview').innerHTML = ''; $('#postPhotoInput').value = ''; };
};
$('#postBtn').onclick = async () => {
  const body = $('#postText').value.trim();
  if (!body && !postPhoto) return toast('Write something or add a photo');
  if (!comm().name) return commProfile();
  const btn = $('#postBtn'); btn.disabled = true; btn.textContent = 'Posting…';
  try {
    let photo_url = null;
    if (postPhoto) {
      const blob = await (await fetch(postPhoto)).blob();
      const path = `${me}/${Date.now()}.jpg`;
      const up = await sb.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg' });
      if (up.error) throw up.error;
      photo_url = sb.storage.from('photos').getPublicUrl(path).data.publicUrl;
    }
    const c = comm();
    const r = await sb.from('posts').insert({ name: c.name, avatar: c.avatar, body: body || null, photo_url, stats: $('#postStats').checked ? myStats($('#postWeight').checked) : {} });
    if (r.error) throw r.error;
    $('#postText').value = ''; postPhoto = null; $('#postPreview').innerHTML = ''; $('#postPhotoInput').value = '';
    toast('Posted! 🎉'); loadFeed();
  } catch (e) { toast('Couldn\'t post. Check your internet.'); }
  btn.disabled = false; btn.textContent = 'Post';
};
$('#feedRefresh').onclick = loadFeed;
