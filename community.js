// ================= COMMUNITY (Supabase) =================
// No account needed: everyone gets an anonymous login + a name and emoji.
// Anyone can read. You can only post, like, comment and delete as yourself.
// Block hides a person's posts on your phone only.

const AVATARS = ['🌸', '🐰', '😈', '🔥', '💪', '🌙', '🦋', '🐻', '🍓', '⚡', '👑', '🌈', '🐱', '🐼', '🦊', '💎'];
let sb = null, me = null, feedBusy = false, myLikes = new Set();

const comm = () => (S.community = S.community || { name: '', avatar: '🌸', blocked: [] });

function timeAgo(t) {
  const s = (Date.now() - new Date(t).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  return Math.floor(s / 86400) + 'd';
}

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
  return true;
}

function commProfile(after) {
  const c = comm(); let av = c.avatar;
  openModal(`<h2>Your community profile</h2>
    <p class="muted small">No email, no password. Just a name and an emoji.</p>
    <div class="field"><label>Name people will see</label><input id="cName" maxlength="40" value="${esc(c.name || S.profile?.name || '')}"></div>
    <div class="field"><label>Your emoji</label><div class="chips" id="cAv">${AVATARS.map(a => `<button type="button" class="chip pick ${a === av ? 'on' : ''}" data-a="${a}" style="font-size:1.3rem">${a}</button>`).join('')}</div></div>
    <button class="btn big" id="cSave">Save</button>`, () => {
    document.querySelectorAll('#cAv button').forEach(b => b.onclick = () => { av = b.dataset.a; document.querySelectorAll('#cAv button').forEach(x => x.classList.toggle('on', x === b)); });
    $('#cSave').onclick = () => {
      const n = $('#cName').value.trim(); if (!n) return toast('Pick a name first');
      c.name = n; c.avatar = av; save(); closeModal(); renderCommunityHead(); after && after();
    };
  });
}

function renderCommunityHead() {
  const c = comm();
  $('#commMe').innerHTML = c.name ? `<span class="avatar">${c.avatar}</span> <b>${esc(c.name)}</b> <button class="linkbtn" id="commEdit">edit</button>` : '';
  if ($('#commEdit')) $('#commEdit').onclick = () => commProfile();
}

function myStats() {
  const st = {};
  if (S.fast) { st.fastH = Math.floor(fastHours()); st.type = S.fast.type; }
  const start = S.weights[0]?.kg; if (start && start - kg() > 0) st.lost = +(start - kg()).toFixed(1);
  const steps = day().steps; if (steps) st.steps = steps;
  return st;
}
function statsChips(st) {
  if (!st) return '';
  const c = [];
  if (st.fastH != null) c.push(`⏳ ${st.fastH}h ${st.type === 'water' ? 'water' : 'dirty'} fast`);
  if (st.lost) c.push(`⚖️ −${st.lost} kg`);
  if (st.steps) c.push(`👟 ${(+st.steps).toLocaleString()} steps`);
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

async function loadFeed() {
  if (feedBusy) return; feedBusy = true;
  const box = $('#feed');
  if (!box.children.length) box.innerHTML = '<p class="muted">Loading…</p>';
  try {
    const [{ data: posts, error }, { data: likes }] = await Promise.all([
      sb.from('posts').select('*, likes(count), comments(count)').order('created_at', { ascending: false }).limit(50),
      sb.from('likes').select('post_id').eq('user_id', me)
    ]);
    if (error) throw error;
    myLikes = new Set((likes || []).map(l => l.post_id));
    const blocked = comm().blocked || [];
    const list = posts.filter(p => !blocked.includes(p.user_id));
    box.innerHTML = list.map(p => {
      const nl = p.likes?.[0]?.count || 0, nc = p.comments?.[0]?.count || 0, liked = myLikes.has(p.id), mine = p.user_id === me;
      return `<article class="post" data-id="${p.id}" data-user="${p.user_id}">
        <div class="post-head"><span class="avatar">${esc(p.avatar)}</span><div style="flex:1;min-width:0"><b>${esc(p.name)}</b><div class="muted small">${timeAgo(p.created_at)}</div></div>
          <button class="linkbtn" data-act="more">•••</button></div>
        ${p.body ? `<p class="post-body">${esc(p.body)}</p>` : ''}
        ${p.photo_url ? `<img class="post-img" src="${esc(p.photo_url)}" loading="lazy" alt="">` : ''}
        ${statsChips(p.stats)}
        <div class="post-actions">
          <button data-act="like" class="${liked ? 'on' : ''}">${liked ? '❤️' : '🤍'} ${nl}</button>
          <button data-act="comments">💬 ${nc}</button>
          ${mine ? '<button data-act="delete">🗑️</button>' : ''}
        </div></article>`;
    }).join('') || '<p class="muted">No posts yet. Be the first! 🌸</p>';
  } catch (e) {
    box.innerHTML = '<p class="muted">Couldn\'t load posts. Pull down or tap refresh to try again.</p>';
  }
  feedBusy = false;
}

$('#feed').addEventListener('click', async e => {
  const btn = e.target.closest('[data-act]'); const img = e.target.closest('.post-img');
  const post = e.target.closest('.post'); if (!post) return;
  const id = +post.dataset.id, uid = post.dataset.user;
  if (img) return openModal(`<img src="${img.src}" style="width:100%;border-radius:14px"><button class="btn big" style="margin-top:10px" onclick="closeModal()">Close</button>`);
  if (!btn) return;
  const act = btn.dataset.act;
  if (act === 'like') {
    const liked = myLikes.has(id), n = +(btn.textContent.match(/\d+/) || [0])[0];
    btn.textContent = `${liked ? '🤍' : '❤️'} ${liked ? n - 1 : n + 1}`; btn.classList.toggle('on', !liked);
    liked ? myLikes.delete(id) : myLikes.add(id);
    const r = liked ? await sb.from('likes').delete().match({ post_id: id, user_id: me }) : await sb.from('likes').insert({ post_id: id });
    if (r.error) toast('Like didn\'t go through');
  }
  if (act === 'comments') openComments(id);
  if (act === 'delete') {
    openModal(`<h2>Delete this post?</h2><p>It will be gone for everyone.</p><div class="row gap"><button class="btn ghost" onclick="closeModal()">Keep it</button><button class="btn danger" id="delGo">Delete</button></div>`, () => {
      $('#delGo').onclick = async () => {
        const r = await sb.from('posts').delete().eq('id', id); closeModal();
        if (r.error) return toast('Couldn\'t delete');
        const path = post.querySelector('.post-img')?.src.split('/object/public/photos/')[1];
        if (path && path.startsWith(me + '/')) sb.storage.from('photos').remove([decodeURIComponent(path)]);
        post.remove(); toast('Deleted');
      };
    });
  }
  if (act === 'more') {
    const mine = uid === me;
    openModal(`<h2>Post options</h2><div class="theme-pick">
      ${mine ? '<button id="mDel">🗑️ Delete my post</button>' : '<button id="mBlock">🚫 Block this person</button>'}
      <button onclick="closeModal()">Cancel</button></div>`, () => {
      if ($('#mBlock')) $('#mBlock').onclick = () => { comm().blocked = [...new Set([...(comm().blocked || []), uid])]; save(); closeModal(); toast('Blocked. You won\'t see them anymore.'); loadFeed(); };
      if ($('#mDel')) $('#mDel').onclick = () => { closeModal(); post.querySelector('[data-act=delete]').click(); };
    });
  }
});

async function openComments(postId) {
  openModal(`<h2>💬 Comments</h2><div id="cList" class="comments"><p class="muted">Loading…</p></div>
    <form id="cForm" class="chat-input" style="margin-top:10px"><input id="cText" maxlength="500" placeholder="Say something nice… or not 😈" autocomplete="off"><button class="btn">Send</button></form>`, async () => {
    const load = async () => {
      const { data } = await sb.from('comments').select('*').eq('post_id', postId).order('created_at').limit(200);
      const blocked = comm().blocked || [];
      $('#cList').innerHTML = (data || []).filter(c => !blocked.includes(c.user_id)).map(c => `<div class="comment"><span class="avatar">${esc(c.avatar)}</span><div><b>${esc(c.name)}</b> <span class="muted small">${timeAgo(c.created_at)}</span><div>${esc(c.body)}</div></div></div>`).join('') || '<p class="muted small">No comments yet.</p>';
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
    const r = await sb.from('posts').insert({ name: c.name, avatar: c.avatar, body: body || null, photo_url, stats: $('#postStats').checked ? myStats() : {} });
    if (r.error) throw r.error;
    $('#postText').value = ''; postPhoto = null; $('#postPreview').innerHTML = ''; $('#postPhotoInput').value = '';
    toast('Posted! 🎉'); loadFeed();
  } catch (e) { toast('Couldn\'t post. Check your internet.'); }
  btn.disabled = false; btn.textContent = 'Post';
};
$('#feedRefresh').onclick = loadFeed;
