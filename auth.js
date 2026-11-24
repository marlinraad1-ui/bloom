// ================= ACCOUNTS: sign up / log in =================
// The community needs a real account (email + password) so profiles, posts,
// friends and chats are never lost and work on every device.
// (Mochi AI still works without an account, using a hidden guest login.)

async function currentUser() {
  if (!(await commInit())) return null;
  const { data } = await sb.auth.getUser();
  return data?.user || null;
}
const isRealUser = u => !!u && !u.is_anonymous && !!u.email;

function showAuthPanel(show) {
  $('#authPanel').hidden = !show;
  $('#peopleSeg').hidden = show;
  $('#feedPanel').hidden = show || S.peopleTab === 'friends';
  $('#friendsPanel').hidden = show || S.peopleTab !== 'friends';
  if ($('#togetherPanel')) $('#togetherPanel').hidden = show || S.peopleTab !== 'together';
}

function renderAuth(mode = 'signup', note = '') {
  showAuthPanel(true);
  const signup = mode === 'signup', forgot = mode === 'forgot';
  $('#authPanel').innerHTML = `<div class="card auth-card">
    <div class="auth-hero">${signup ? '🌸' : forgot ? '🔐' : '👋'}</div>
    <h2 class="glow-text">${signup ? 'Join the Bloom community' : forgot ? 'Reset your password' : 'Welcome back'}</h2>
    <p class="muted small">${signup ? 'Create your free account so your profile, posts, friends and chats are always saved, on every device.' : forgot ? 'We\'ll email you a link to set a new password.' : 'Log in to see your profile, friends and chats.'}</p>
    ${note ? `<div class="auth-note">${note}</div>` : ''}
    <form id="authForm" class="auth-form">
      <input type="email" id="auEmail" placeholder="Email" autocomplete="email" required>
      ${forgot ? '' : `<input type="password" id="auPass" placeholder="Password (at least 6 characters)" autocomplete="${signup ? 'new-password' : 'current-password'}" minlength="6" required>`}
      ${signup ? `<input type="password" id="auPass2" placeholder="Repeat password" autocomplete="new-password" minlength="6" required>
      <label class="small toggle-row"><input type="checkbox" id="auAgree" required> I'm 18+ and agree to the <a href="legal.html#terms" target="_blank" rel="noopener">Terms</a>, <a href="legal.html#rules" target="_blank" rel="noopener">Community rules</a> (no bullying, hate or harmful content) and <a href="legal.html#privacy" target="_blank" rel="noopener">Privacy policy</a>.</label>` : ''}
      <button class="btn big" id="auGo">${signup ? 'Create my account ✨' : forgot ? 'Send reset link' : 'Log in'}</button>
    </form>
    <div class="auth-links">
      ${signup ? '<button class="linkbtn" data-m="login">Already have an account? <b>Log in</b></button>'
               : '<button class="linkbtn" data-m="signup">New here? <b>Create an account</b></button>'}
      ${mode === 'login' ? '<button class="linkbtn" data-m="forgot">Forgot password?</button>' : ''}
    </div>
  </div>`;
  $('#authPanel').querySelectorAll('[data-m]').forEach(b => b.onclick = () => renderAuth(b.dataset.m));
  $('#authForm').onsubmit = async e => {
    e.preventDefault();
    const email = $('#auEmail').value.trim(), pass = $('#auPass')?.value || '';
    const btn = $('#auGo'); const label = btn.textContent; btn.disabled = true; btn.textContent = '…';
    const done = () => { btn.disabled = false; btn.textContent = label; };
    try {
      if (signup) {
        if (pass !== $('#auPass2').value) { done(); return toast('The passwords don\'t match'); }
        const r = await sb.auth.signUp({ email, password: pass, options: { emailRedirectTo: location.origin + location.pathname } });
        if (r.error) { done(); return toast(/already|registered/i.test(r.error.message) ? 'That email already has an account. Log in instead.' : r.error.message); }
        if (!r.data.session) return renderAuth('login', `📧 Almost done! Open the email we sent to <b>${esc(email)}</b>, tap the link, then log in here.`);
        await afterLogin(true);
      } else if (forgot) {
        await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
        renderAuth('login', `📧 If <b>${esc(email)}</b> has an account, a reset link is on its way.`);
      } else {
        const r = await sb.auth.signInWithPassword({ email, password: pass });
        if (r.error) { done(); return toast(/confirm/i.test(r.error.message) ? 'Please confirm your email first (check your inbox).' : 'Wrong email or password'); }
        await afterLogin(false);
      }
    } catch (err) { done(); toast('Something went wrong. Check your internet.'); }
  };
}

async function afterLogin(isNew) {
  me = (await sb.auth.getUser()).data.user.id;
  // start fresh for this account, then load its profile from the server
  S.community = { name: '', avatar: '🌸', photo_url: null, bio: '', show_weight: true, blocked: S.community?.blocked || [] };
  const { data: prof } = await sb.from('profiles').select('*').eq('id', me).maybeSingle();
  if (prof) Object.assign(S.community, { name: prof.name, avatar: prof.avatar, photo_url: prof.photo_url, bio: prof.bio || '', show_weight: prof.show_weight, is_dev: prof.is_dev, vip_until: prof.vip_until, banner: prof.banner, name_fx: prof.name_fx, ring: prof.ring });
  applyTheme();
  save();
  if (liveChannel) { sb.removeChannel(liveChannel); liveChannel = null; }
  celebrate(); toast(isNew ? 'Welcome to Bloom! 🌸' : 'Welcome back! 💖');
  showAuthPanel(false);
  renderAll(); // themes, VIP workouts, food AI unlock right away
  if (vipOf(S.community)) setTimeout(() => toast('👑 VIP unlocked'), 1500);
  renderCommunity();
}

async function logOut() {
  openModal(`<h2>Log out?</h2><p>Your account stays saved. Log in again any time with your email and password.</p>
    <div class="row gap"><button class="btn ghost" onclick="closeModal()">Stay</button><button class="btn danger" id="loGo">Log out</button></div>`, () => {
    $('#loGo').onclick = async () => {
      if (liveChannel) { sb.removeChannel(liveChannel); liveChannel = null; }
      await sb.auth.signOut();
      S.community = { name: '', avatar: '🌸', blocked: [] }; save(); renderAll();
      sb = null; me = null; closeModal(); toast('Logged out');
      if (curView === 'community') renderCommunity();
    };
  });
}

// coming back from a password reset email: ask for the new password
async function checkRecovery() {
  if (!/type=recovery/.test(location.href)) return;
  await commInit();
  openModal(`<h2>🔐 New password</h2><input type="password" id="npPass" placeholder="New password (at least 6 characters)" minlength="6">
    <button class="btn big" style="margin-top:10px" id="npGo">Save new password</button>`, () => {
    $('#npGo').onclick = async () => {
      const r = await sb.auth.updateUser({ password: $('#npPass').value });
      if (r.error) return toast('Couldn\'t save. Try a longer password.');
      closeModal(); toast('Password changed 🎉'); history.replaceState(null, '', location.pathname);
    };
  });
}
checkRecovery();
