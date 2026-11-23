// ================= SAFETY: reports, moderation, account deletion, legal links =================
// Needed for the App Store and Google Play: users can report and block, the developer
// reviews reports and removes content, and everyone can delete their account in the app.

const LEGAL = 'legal.html';
const REASONS = ['Bullying or harassment', 'Hate', 'Nudity or sexual', 'Promotes eating disorder or self-harm', 'Dangerous advice', 'Spam or scam', 'Other'];

function reportModal(kind, target, label) {
  let reason = '';
  openModal(`<h2>🚩 Report</h2>
    <p class="muted small">${esc(label || '')}</p>
    <div class="chips" id="rpWhy">${REASONS.map(r => `<button type="button" class="chip pick" data-r="${esc(r)}">${esc(r)}</button>`).join('')}</div>
    <textarea id="rpMore" rows="2" maxlength="500" placeholder="Anything else? (optional)" style="width:100%;margin-top:10px"></textarea>
    <p class="muted small">The Bloom team reviews every report within 24 hours. The person won't know who reported them.</p>
    <div class="row gap"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn danger" id="rpGo">Send report</button></div>`, m => {
    m.querySelectorAll('#rpWhy button').forEach(b => b.onclick = () => { reason = b.dataset.r; m.querySelectorAll('#rpWhy button').forEach(x => x.classList.toggle('on', x === b)); });
    $('#rpGo').onclick = async () => {
      if (!reason) return toast('Pick a reason');
      try {
        if (!(await commInit())) throw 0;
        const r = await sb.from('reports').insert({ kind, target: String(target), reason, details: $('#rpMore').value.trim() || null });
        if (r.error) throw r.error;
        closeModal(); toast('Thanks. Report sent 🙏');
      } catch (e) { toast('Couldn\'t send. Check your internet.'); }
    };
  });
}

// ---------- developer moderation panel ----------
async function devReports() {
  openModal('<h2>🚩 Reports</h2><p class="muted">Loading…</p>');
  const { data, error } = await sb.from('reports').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(100);
  if (error) return openModal('<p>Couldn\'t load reports.</p><button class="btn big" onclick="closeModal()">Close</button>');
  const rows = await Promise.all((data || []).map(async r => {
    let what = '';
    if (r.kind === 'post') { const { data: p } = await sb.from('posts').select('body, user_id, profiles(name)').eq('id', r.target).maybeSingle(); what = p ? `<b>${esc(p.profiles?.name || '')}</b>: ${esc((p.body || '').slice(0, 140))}` : '<i>post already removed</i>'; r._user = p?.user_id; }
    else if (r.kind === 'comment') { const { data: c } = await sb.from('comments').select('body, user_id, profiles(name)').eq('id', r.target).maybeSingle(); what = c ? `<b>${esc(c.profiles?.name || '')}</b>: ${esc((c.body || '').slice(0, 140))}` : '<i>comment already removed</i>'; r._user = c?.user_id; }
    else if (r.kind === 'user' || r.kind === 'message') { const uid = r.kind === 'user' ? r.target : r.target.split(':')[0]; const { data: p } = await sb.from('profiles').select('name').eq('id', uid).maybeSingle(); what = `Person: <b>${esc(p?.name || 'deleted')}</b>`; r._user = uid; }
    else what = `Mochi reply: ${esc(String(r.details || r.target).slice(0, 160))}`;
    return r._what = what, r;
  }));
  openModal(`<h2>🚩 Reports (${rows.length})</h2>
    ${rows.map(r => `<div class="rep" data-id="${r.id}">
      <div class="small"><span class="chip">${esc(r.kind)}</span> <b>${esc(r.reason || '')}</b> <span class="muted">${timeAgo(r.created_at)}</span></div>
      <div class="small">${r._what}</div>${r.details && r.kind !== 'ai' ? `<div class="muted small">“${esc(r.details)}”</div>` : ''}
      <div class="row gap wrap">
        ${r.kind === 'post' ? `<button class="btn ghost" data-a="delpost" data-t="${esc(r.target)}">🗑️ Remove post</button>` : ''}
        ${r.kind === 'comment' ? `<button class="btn ghost" data-a="delcom" data-t="${esc(r.target)}">🗑️ Remove comment</button>` : ''}
        ${r._user ? `<button class="btn ghost" data-a="ban" data-u="${esc(r._user)}">⛔ Ban person</button>` : ''}
        <button class="btn ghost" data-a="done">✓ Done</button>
      </div></div>`).join('') || '<p class="muted">No open reports 🎉</p>'}
    <button class="btn big" onclick="closeModal()" style="margin-top:10px">Close</button>`, m => {
    m.querySelectorAll('.rep [data-a]').forEach(b => b.onclick = async () => {
      const box = b.closest('.rep'), id = box.dataset.id, a = b.dataset.a;
      let r = { error: null };
      if (a === 'delpost') r = await sb.from('posts').delete().eq('id', b.dataset.t);
      if (a === 'delcom') r = await sb.from('comments').delete().eq('id', b.dataset.t);
      if (a === 'ban' && !confirm('Ban this person? They can\'t post, comment or message anymore.')) return;
      if (a === 'ban') r = await sb.rpc('set_ban', { uid: b.dataset.u, ban: true });
      if (r.error) return toast('Didn\'t work: ' + r.error.message);
      if (a === 'done' || a === 'ban' || a.startsWith('del')) await sb.from('reports').update({ status: 'done' }).eq('id', id);
      box.remove(); toast('Done ✓'); if (a.startsWith('del')) loadFeed();
    });
  });
}

// ---------- delete my account ----------
function deleteAccountModal() {
  openModal(`<h2>Delete my account</h2>
    <p>This deletes your Bloom account, profile, posts, comments, likes, friends, chats and uploaded photos <b>for good</b>. An active VIP subscription paid with Stripe is cancelled. This can't be undone.</p>
    <p class="muted small">Your fasting history, weight and photos saved on this phone stay until you tap "Also clear this phone".</p>
    <label class="small toggle-row"><input type="checkbox" id="daWipe" checked> Also clear all Bloom data on this phone</label>
    <div class="field"><label>Type <b>DELETE</b> to confirm</label><input id="daTxt" autocomplete="off"></div>
    <div class="row gap"><button class="btn ghost" onclick="closeModal()">Keep my account</button><button class="btn danger" id="daGo">Delete forever</button></div>`, () => {
    $('#daGo').onclick = async () => {
      if ($('#daTxt').value.trim().toUpperCase() !== 'DELETE') return toast('Type DELETE to confirm');
      const btn = $('#daGo'); btn.disabled = true; btn.textContent = 'Deleting…';
      try {
        if (!(await commInit())) throw new Error('offline');
        const r = await sb.functions.invoke('vip', { body: { action: 'delete_account' } });
        let j = r.data; if (r.error) { try { j = await r.error.context.json(); } catch (e) {} }
        if (!j?.deleted) throw new Error(j?.error || 'failed');
        try { await sb.auth.signOut(); } catch (e) {}
        if ($('#daWipe').checked) { localStorage.clear(); try { indexedDB.deleteDatabase('bloom-photos'); } catch (e) {} }
        else { S.community = { name: '', avatar: '🌸', blocked: [] }; save(); }
        closeModal(); alert('Your Bloom account is deleted. Take care 💖'); location.reload();
      } catch (e) {
        btn.disabled = false; btn.textContent = 'Delete forever';
        toast(e.message === 'dev_protected' ? 'The developer account can\'t be deleted here.' : 'Couldn\'t delete. Check your internet and try again.');
      }
    };
  });
}

// ---------- legal links in settings ----------
const legalLinks = () => `<div class="legal-links">
  <a href="${LEGAL}#terms" target="_blank" rel="noopener">Terms</a> · <a href="${LEGAL}#rules" target="_blank" rel="noopener">Community rules</a> ·
  <a href="${LEGAL}#privacy" target="_blank" rel="noopener">Privacy</a> · <a href="${LEGAL}#impressum" target="_blank" rel="noopener">Impressum</a></div>`;
