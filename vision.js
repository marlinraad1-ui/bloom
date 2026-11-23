// ================= VISION BOARD ("My why") =================
// Your reasons, your inspo and your photos as story slides.
// Shown before you end a fast early. If you haven't written one, Bloom writes one for you.

const vis = () => (S.vision = S.vision || { why: '', inspo: '', inspoText: '', keep: '', photos: [] });
const visImg = id => getPhoto('vision-' + id).then(r => r?.img).catch(() => null);
const visPut = (id, img) => PDB.tx('readwrite', st => st.put({ date: 'vision-' + id, img }));
const visDel = id => PDB.tx('readwrite', st => st.delete('vision-' + id));
const visEmpty = () => { const v = vis(); return !v.why && !v.inspo && !v.keep && !v.photos.length && !v.nowPhoto && !v.goalPhoto; };

async function visionSlides(breaking) {
  const v = vis(), n = S.fast ? hypeNums() : null;
  const name = S.profile?.name ? S.profile.name : 'you';
  const out = [];
  if (visEmpty()) {
    // Bloom writes one for you
    out.push({ bg: 1, big: '✨', title: 'Remember why you started', text: S.fast?.reason || S.lastReason ? `You said: "${S.fast?.reason || S.lastReason}". That reason hasn't changed in the last hour.` : `Somewhere inside, ${name} made a promise. This is the moment that promise is tested.` });
    out.push({ bg: 2, big: '🪞', title: 'Picture the end', text: 'Imagine the moment your timer hits the goal. The pride. The lighter body. The proof that you can do hard things. That moment is waiting for you.' });
    out.push({ bg: 3, big: '🌱', title: 'Your inspo is your future self', text: 'The version of you who finished this fast is cheering for you right now. Don\'t let them down for a snack.' });
  } else {
    const nowImg = v.nowPhoto ? await visImg(v.nowPhoto) : null, goalImg = v.goalPhoto ? await visImg(v.goalPhoto) : null;
    if (nowImg && goalImg) out.push({ compare: [nowImg, goalImg], title: breaking ? 'This is why you don\'t quit now' : 'Now → Goal', text: v.compareText || 'Every hour of this fast moves you from left to right.' });
    else if (goalImg || nowImg) out.push({ img: goalImg || nowImg, title: goalImg ? 'My goal' : 'Where I start', text: v.compareText || '' });
    if (v.why) out.push({ bg: 1, big: '✨', title: 'Why I\'m doing this', text: v.why });
    if (v.inspo || v.inspoText || v.inspoPhoto) out.push({ bg: 2, img: v.inspoPhoto ? await visImg(v.inspoPhoto) : null, big: '🌟', title: v.inspo ? `My inspo: ${v.inspo}` : 'My inspo', text: v.inspoText });
    for (const p of v.photos) { const img = await visImg(p.id); if (img) out.push({ img, title: p.caption || '', text: '' }); }
    if (v.keep) out.push({ bg: 3, big: '🔥', title: 'What keeps me going', text: v.keep });
  }
  if (n && n.h >= 1) out.push({ bg: 4, big: '📊', title: `${n.h} hours done`, text: `About ${n.kcal} kcal burned from your own stores. ${breaking ? 'Are you really going to throw that away?' : 'Keep stacking hours.'}` });
  return out;
}

async function showVision({ breaking = false, onStop = null, onKeep = null } = {}) {
  const slides = await visionSlides(breaking);
  let i = 0, timer;
  openModal(`<div class="story" id="story">
      <div class="story-bars">${slides.map(() => '<span><i></i></span>').join('')}</div>
      <button class="story-x" id="stX">✕</button>
      <div class="story-stage" id="stStage"></div>
      <div class="story-nav"><button id="stPrev" aria-label="previous"></button><button id="stNext" aria-label="next"></button></div>
      <div class="story-foot" id="stFoot"></div>
    </div>`, () => {
    $('#modal').classList.add('full', 'story-modal');
    const bars = [...document.querySelectorAll('.story-bars i')];
    const show = k => {
      i = Math.max(0, Math.min(slides.length - 1, k)); const s = slides[i];
      bars.forEach((b, j) => { b.style.transition = 'none'; b.style.width = j < i ? '100%' : '0%'; });
      requestAnimationFrame(() => { bars[i].style.transition = 'width 6s linear'; bars[i].style.width = '100%'; });
      $('#stStage').innerHTML = s.compare ? `<div class="slide compare"><div class="cmp"><img src="${s.compare[0]}" alt="" class="cmp-a"><div class="cmp-b"><img src="${s.compare[1]}" alt=""></div><span class="cmp-l">NOW</span><span class="cmp-r">GOAL ✨</span><i class="cmp-line"></i></div>
        <div class="slide-txt">${s.title ? `<h2>${esc(s.title)}</h2>` : ''}${s.text ? `<p>${esc(s.text)}</p>` : ''}</div></div>` : `<div class="slide bg${s.bg || 0}">${s.img ? `<img src="${s.img}" class="slide-img kb" alt="">` : ''}
        <div class="slide-txt">${s.big && !s.img ? `<div class="slide-big">${s.big}</div>` : ''}${s.title ? `<h2>${esc(s.title)}</h2>` : ''}${s.text ? `<p>${esc(s.text)}</p>` : ''}</div></div>`;
      const last = i === slides.length - 1;
      $('#stFoot').innerHTML = last
        ? (breaking ? `<button class="btn big" id="stKeep">💪 I'll keep going</button><button class="linkbtn" id="stStop">I still want to stop</button>`
                    : `<button class="btn big" id="stKeep">Let's go ✨</button>${visEmpty() ? '<button class="linkbtn" id="stEdit">Make my own vision board</button>' : '<button class="linkbtn" id="stEdit">Edit</button>'}`)
        : '';
      if ($('#stKeep')) $('#stKeep').onclick = () => { clearTimeout(timer); closeModal(); if (breaking) { celebrate(); toast(pick(['That\'s the spirit! 💪', 'Proud of you. Keep going ✨', 'Champion move 👑'])); } onKeep && onKeep(); };
      if ($('#stStop')) $('#stStop').onclick = () => { clearTimeout(timer); closeModal(); onStop && onStop(); };
      if ($('#stEdit')) $('#stEdit').onclick = () => { clearTimeout(timer); visionEditor(); };
      clearTimeout(timer); if (!last) timer = setTimeout(() => show(i + 1), 6000);
    };
    let skipClick = false;
    $('#stPrev').onclick = () => { if (skipClick) return skipClick = false; show(i - 1); };
    $('#stNext').onclick = () => { if (skipClick) return skipClick = false; show(i + 1); };
    // hold to pause, swipe to move
    let downAt = 0, sx = 0, pausedLeft = 0;
    const story = $('#story');
    story.addEventListener('pointerdown', e => {
      if (e.target.closest('#stX, #stFoot')) return;
      downAt = Date.now(); sx = e.clientX; skipClick = false;
      const bar = bars[i], w = parseFloat(getComputedStyle(bar).width) / bar.parentElement.offsetWidth * 100;
      bar.style.transition = 'none'; bar.style.width = w + '%'; pausedLeft = (100 - w) / 100 * 6000;
      clearTimeout(timer); story.classList.add('held');
    });
    story.addEventListener('pointerup', e => {
      if (!downAt) return; const dx = e.clientX - sx, held = Date.now() - downAt; downAt = 0; story.classList.remove('held');
      if (Math.abs(dx) > 50) { skipClick = true; return show(i + (dx < 0 ? 1 : -1)); }
      if (held > 250) skipClick = true;
      if (held > 250 && i < slides.length - 1) { const bar = bars[i]; requestAnimationFrame(() => { bar.style.transition = `width ${pausedLeft}ms linear`; bar.style.width = '100%'; }); timer = setTimeout(() => show(i + 1), pausedLeft); }
      else if (held <= 250 && i < slides.length - 1) timer = setTimeout(() => show(i + 1), pausedLeft);
    });
    $('#stX').onclick = () => { clearTimeout(timer); closeModal(); };
    show(0);
  });
}

async function visionEditor() {
  const v = vis();
  const thumbs = await Promise.all(v.photos.map(async p => ({ ...p, img: await visImg(p.id) })));
  const inspoImg = v.inspoPhoto ? await visImg(v.inspoPhoto) : null;
  const nowImg = v.nowPhoto ? await visImg(v.nowPhoto) : null, goalImg = v.goalPhoto ? await visImg(v.goalPhoto) : null;
  openModal(`<h2>✨ My vision board</h2>
    <p class="muted small">This shows up when fasting gets hard, and before you end a fast early. Photos stay on this phone.</p>
    <div class="field"><label>Why am I doing this?</label><textarea id="vWhy" rows="3" maxlength="500" placeholder="e.g. For my faith, for my health, to feel confident in my body again…">${esc(v.why)}</textarea></div>
    <div class="field"><label>Who is my inspo?</label><input id="vInspo" maxlength="60" value="${esc(v.inspo)}" placeholder="a person, an idol, a friend, future me…"></div>
    <div class="row gap" style="align-items:flex-start">
      <label class="photo-slot vsm ${inspoImg ? 'has' : ''}" id="vInspoSlot" style="${inspoImg ? `background-image:url(${inspoImg})` : ''}"><input type="file" accept="image/*" id="vInspoPic" hidden><span>🌟<br>photo</span></label>
      <div class="field" style="flex:1"><label>What do they mean to me?</label><textarea id="vInspoText" rows="3" maxlength="300" placeholder="e.g. She never gives up, and neither will I">${esc(v.inspoText)}</textarea></div>
    </div>
    <div class="field"><label>Me now ➜ my goal (pinned at the top of your board)</label>
      <div class="nvg">
        <label class="photo-slot vsm ${nowImg ? 'has' : ''}" id="vNowSlot" style="${nowImg ? `background-image:url(${nowImg})` : ''}"><input type="file" accept="image/*" id="vNowPic" hidden><span>📸<br>Me now</span></label>
        <span class="nvg-arrow">➜</span>
        <label class="photo-slot vsm ${goalImg ? 'has' : ''}" id="vGoalSlot" style="${goalImg ? `background-image:url(${goalImg})` : ''}"><input type="file" accept="image/*" id="vGoalPic" hidden><span>✨<br>My goal</span></label>
      </div>
      <input id="vCmpText" maxlength="120" value="${esc(v.compareText || '')}" placeholder="Words for this photo, e.g. Skinny me is waiting 💖" style="margin-top:8px"></div>
    <div class="field"><label>What makes me want to continue?</label><textarea id="vKeep" rows="3" maxlength="500" placeholder="e.g. Wearing that dress in summer. Proving to myself I can.">${esc(v.keep)}</textarea></div>
    <div class="field"><label>Vision photos (goal body, places, outfits, anything)</label>
      <div class="vgrid" id="vGrid">${thumbs.map(p => `<div class="vthumb" data-id="${p.id}"><img src="${p.img || ''}" alt=""><input value="${esc(p.caption || '')}" placeholder="caption" maxlength="80"><button class="vdel" data-id="${p.id}">✕</button></div>`).join('')}
        <label class="vthumb add"><input type="file" accept="image/*" id="vAdd" hidden multiple>＋<br>Add</label></div></div>
    <div class="field"><label>Affirmation stickers (pick up to 5, or write your own)</label>
      <div class="affs" id="vAffs">${[...new Set(AFFIRMATIONS.concat(v.affirmations || []))].map(a => `<button type="button" class="chip pick ${(v.affirmations || []).includes(a) ? 'on' : ''}" data-a="${esc(a)}">${esc(a)}</button>`).join('')}</div>
      <div class="row gap" style="margin-top:6px"><input id="vAffNew" maxlength="40" placeholder="My own affirmation"><button type="button" class="btn ghost" id="vAffAdd">＋</button></div></div>
    <button class="btn big" id="vSave">Save my vision board</button>
    <button class="btn ghost big" style="margin-top:8px" id="vPreview">👀 See my board</button>
    <button class="btn ghost big" style="margin-top:8px;color:var(--danger)" id="vReset">🗑️ Reset vision board</button>`, () => {
    let inspoNew = null, nowNew = null, goalNew = null;
    const hookAff = () => document.querySelectorAll('#vAffs [data-a]').forEach(b => b.onclick = () => {
      const on = document.querySelectorAll('#vAffs .on').length;
      if (!b.classList.contains('on') && on >= 5) return toast('Pick up to 5 ✨'); b.classList.toggle('on');
    });
    hookAff();
    $('#vAffAdd').onclick = () => { const t = $('#vAffNew').value.trim(); if (!t) return; $('#vAffs').insertAdjacentHTML('beforeend', `<button type="button" class="chip pick" data-a="${esc(t)}">${esc(t)}</button>`); $('#vAffNew').value = ''; hookAff(); $('#vAffs [data-a]:last-child').click(); };
    $('#vNowPic').onchange = async e => { const f = e.target.files[0]; if (!f) return; nowNew = await shrinkImage(f, 1080); $('#vNowSlot').style.backgroundImage = `url(${nowNew})`; $('#vNowSlot').classList.add('has'); };
    $('#vGoalPic').onchange = async e => { const f = e.target.files[0]; if (!f) return; goalNew = await shrinkImage(f, 1080); $('#vGoalSlot').style.backgroundImage = `url(${goalNew})`; $('#vGoalSlot').classList.add('has'); };
    $('#vInspoPic').onchange = async e => { const f = e.target.files[0]; if (!f) return; inspoNew = await shrinkImage(f, 1080); $('#vInspoSlot').style.backgroundImage = `url(${inspoNew})`; $('#vInspoSlot').classList.add('has'); };
    $('#vAdd').onchange = async e => {
      for (const f of e.target.files) {
        const id = uid(), img = await shrinkImage(f, 1080); await visPut(id, img);
        v.photos.push({ id, caption: '' }); save();
        $('#vGrid').insertAdjacentHTML('afterbegin', `<div class="vthumb" data-id="${id}"><img src="${img}" alt=""><input placeholder="caption" maxlength="80"><button class="vdel" data-id="${id}">✕</button></div>`);
      }
      hookDel();
    };
    const hookDel = () => document.querySelectorAll('.vdel').forEach(b => b.onclick = async e => {
      e.preventDefault(); const id = b.dataset.id; await visDel(id); v.photos = v.photos.filter(p => p.id !== id); save(); b.parentElement.remove();
    });
    hookDel();
    const collect = async () => {
      v.why = $('#vWhy').value.trim(); v.inspo = $('#vInspo').value.trim(); v.inspoText = $('#vInspoText').value.trim(); v.keep = $('#vKeep').value.trim();
      document.querySelectorAll('.vthumb[data-id]').forEach(t => { const p = v.photos.find(x => x.id === t.dataset.id); if (p) p.caption = t.querySelector('input').value.trim(); });
      if (inspoNew) { const id = uid(); await visPut(id, inspoNew); if (v.inspoPhoto) visDel(v.inspoPhoto); v.inspoPhoto = id; inspoNew = null; }
      if (nowNew) { const id = uid(); await visPut(id, nowNew); v.nowPhoto = id; nowNew = null; }
      if (goalNew) { const id = uid(); await visPut(id, goalNew); v.goalPhoto = id; goalNew = null; }
      v.compareText = $('#vCmpText').value.trim();
      v.affirmations = [...document.querySelectorAll('#vAffs .on')].map(b => b.dataset.a);
      save(); renderVisionCard();
    };
    $('#vSave').onclick = async () => { await collect(); closeModal(); toast('Vision board saved ✨'); celebrate(); };
    $('#vPreview').onclick = async () => { await collect(); showVision(); };
    $('#vReset').onclick = () => resetVisionBoard();
  });
}

async function renderVisionCard() {
  const box = $('#visionCard'); if (!box) return;
  const v = vis();
  const imgs = (await Promise.all([v.nowPhoto, v.goalPhoto].filter(Boolean).concat(v.photos.slice(0, 4).map(p => p.id)).map(id => visImg(id)))).filter(Boolean).slice(0, 5);
  box.innerHTML = visEmpty()
    ? `<div class="row between"><h3>✨ My why</h3></div>
       <p class="small">Add your reasons, your inspo and photos that motivate you. Bloom shows them when it gets hard.</p>
       <div class="row gap wrap"><button class="btn" id="vcEdit">Create my vision board</button><button class="btn ghost" id="vcOpen">▶ See an example</button></div>`
    : `<div class="row between"><h3>✨ My why</h3><button class="linkbtn" id="vcEdit">edit</button></div>
       ${v.why ? `<p class="vision-quote">“${esc(v.why)}”</p>` : ''}
       ${imgs.length ? `<div class="vstrip">${imgs.map(s => `<img src="${s}" alt="">`).join('')}</div>` : ''}
       <button class="btn" id="vcOpen">▶ Open my vision board</button>`;
  $('#vcEdit').onclick = visionEditor;
  $('#vcOpen').onclick = () => showVision();
}


// ================= VISION BOARD 3: a real mood board collage =================
// Polaroids with washi tape and handwritten captions, sticky notes, a Now → Goal pair with a drawn arrow,
// and affirmation stickers on paper. Shown when you open your board and when you try to end a fast early.

const AFFIRMATIONS = ['I can do hard things', 'My body is changing every hour', 'Discipline > cravings', 'I keep my promises to myself', 'Future me is proud', 'Hunger is temporary, results stay', 'I am becoming her', 'Slow progress is still progress', 'I deserve to feel good in my body', 'Water, patience, glow'];
const TAPES = ['#ffd6e7', '#c9f0ff', '#fff1a8', '#d9f7c9', '#e7d9ff'];
const rot = i => [-4, 3, -2, 5, -3, 2, -5, 4][i % 8];

async function boardItems(breaking) {
  const v = vis(), items = [];
  const nowImg = v.nowPhoto ? await visImg(v.nowPhoto) : null, goalImg = v.goalPhoto ? await visImg(v.goalPhoto) : null;
  if (nowImg || goalImg) items.push(`<div class="vb-item vb-pair">
      ${nowImg ? `<figure class="vb-pol" style="--r:-4deg"><i class="tape" style="--t:${TAPES[0]}"></i><img src="${nowImg}" alt=""><figcaption>me now</figcaption></figure>` : ''}
      ${nowImg && goalImg ? '<svg class="vb-arrow" viewBox="0 0 80 40"><path d="M4 30 C 25 4, 50 4, 70 22" /><path d="M60 14 L72 23 L58 28" /></svg>' : ''}
      ${goalImg ? `<figure class="vb-pol" style="--r:4deg"><i class="tape" style="--t:${TAPES[2]}"></i><img src="${goalImg}" alt=""><figcaption>my goal ✨</figcaption></figure>` : ''}
      ${v.compareText ? `<p class="vb-hand big">${esc(v.compareText)}</p>` : ''}</div>`);
  if (v.why) items.push(`<div class="vb-item vb-note yellow" style="--r:-2deg"><i class="pin"></i><b>why I'm doing this</b><p>${esc(v.why)}</p></div>`);
  const photos = await Promise.all(v.photos.map(async p => ({ ...p, img: await visImg(p.id) })));
  photos.filter(p => p.img).forEach((p, i) => items.push(`<figure class="vb-item vb-pol" style="--r:${rot(i)}deg"><i class="tape" style="--t:${TAPES[(i + 1) % 5]}"></i><img src="${p.img}" alt="">${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ''}</figure>`));
  if (v.inspo || v.inspoText || v.inspoPhoto) {
    const im = v.inspoPhoto ? await visImg(v.inspoPhoto) : null;
    items.push(`<div class="vb-item vb-note pink" style="--r:2deg"><i class="pin"></i>${im ? `<img src="${im}" class="vb-inspo" alt="">` : ''}<b>my inspo${v.inspo ? ': ' + esc(v.inspo) : ''}</b>${v.inspoText ? `<p>${esc(v.inspoText)}</p>` : ''}</div>`);
  }
  if (v.keep) items.push(`<div class="vb-item vb-note blue" style="--r:-3deg"><i class="pin"></i><b>what keeps me going</b><p>${esc(v.keep)}</p></div>`);
  const aff = (v.affirmations && v.affirmations.length ? v.affirmations : AFFIRMATIONS.slice(0, 3));
  aff.forEach((a, i) => items.push(`<div class="vb-item vb-sticker s${i % 4}" style="--r:${rot(i + 3)}deg">${esc(a)}</div>`));
  if (breaking && S.fast) { const n = hypeNums(); items.splice(1, 0, `<div class="vb-item vb-note mint" style="--r:1deg"><i class="pin"></i><b>${n.h} hours already done</b><p>About ${n.kcal} kcal burned from your own fat stores. Don't throw that away now.</p></div>`); }
  return items;
}

async function boardHTML(breaking) {
  const items = await boardItems(breaking);
  const title = S.profile?.name ? `${esc(S.profile.name)}'s vision` : 'my vision';
  return `<div class="vb"><h2 class="vb-title">${title} <span>${new Date().getFullYear()}</span></h2>
    ${items.length ? `<div class="vb-grid">${items.join('')}</div>`
      : '<p class="vb-hand big" style="text-align:center">Your board is empty. Add your photos, your why and your goal ✨</p>'}</div>`;
}

// the board replaces the old story view everywhere (home, quitting early, Mochi)
showVision = async function ({ breaking = false, onStop = null, onKeep = null } = {}) {
  if (visEmpty() && !breaking) return visionEditor();
  const board = visEmpty() ? '' : await boardHTML(breaking);
  const fallback = visEmpty() ? `<div class="vb"><h2 class="vb-title">remember why you started</h2><div class="vb-grid">
      <div class="vb-item vb-note yellow" style="--r:-2deg;--d:0ms"><i class="pin"></i><b>your promise</b><p>${esc(S.fast?.reason || S.lastReason || 'Somewhere inside you made a promise. This is the moment it gets tested.')}</p></div>
      ${AFFIRMATIONS.slice(0, 4).map((a, i) => `<div class="vb-item vb-sticker s${i}" style="--r:${rot(i)}deg;--d:${(i + 1) * 90}ms">${a}</div>`).join('')}</div></div>` : '';
  openModal(`<div class="vb-wrap">
      ${breaking ? '<div class="vb-stop">Wait. Look at this first 💭</div>' : ''}
      ${board || fallback}
      <div class="vb-actions">${breaking
        ? '<button class="btn big" id="vbKeep">💪 I\'ll keep going</button><button class="linkbtn" id="vbStop">I still want to stop</button>'
        : '<button class="btn big" id="vbKeep">Close ✨</button><button class="linkbtn" id="vbEdit">✏️ Edit my board</button>'}</div></div>`, m => {
    m.classList.add('full', 'vb-modal');
    m.querySelectorAll('.vb-item').forEach((el, i) => el.style.setProperty('--d', i * 90 + 'ms'));
    $('#vbKeep').onclick = () => { closeModal(); if (breaking) { celebrate(); toast(pick(['That\'s the spirit! 💪', 'Proud of you. Keep going ✨', 'Champion move 👑'])); } onKeep && onKeep(); };
    if ($('#vbStop')) $('#vbStop').onclick = () => { closeModal(); onStop && onStop(); };
    if ($('#vbEdit')) $('#vbEdit').onclick = () => visionEditor();
    m.querySelectorAll('.vb-pol img, .vb-inspo').forEach(img => img.onclick = () => { img.closest('.vb-item, .vb-pol').classList.toggle('zoom'); });
  });
};
const _closeModal3 = window.closeModal;
window.closeModal = function () { $('#modal').classList.remove('vb-modal'); _closeModal3(); };

// home card: a little live preview of the board
renderVisionCard = async function () {
  const box = $('#visionCard'); if (!box) return;
  if (visEmpty()) {
    box.innerHTML = `<div class="row between"><h3>✨ My vision board</h3></div>
      <p class="small">Pin your goal photos, your why and your affirmations. Bloom shows your board when fasting gets hard.</p>
      <div class="row gap wrap"><button class="btn" id="vcEdit">Create my vision board</button></div>`;
  } else {
    const items = (await boardItems(false)).slice(0, 7);
    box.innerHTML = `<div class="row between"><h3>✨ My vision board</h3><button class="linkbtn" id="vcEdit">edit</button></div>
      <div class="vb mini" id="vcOpen"><div class="vb-grid">${items.join('')}</div></div>
      <button class="btn ghost" id="vcOpen2" style="margin-top:8px">Open my board</button>`;
    $('#vcOpen').onclick = $('#vcOpen2').onclick = () => showVision();
  }
  $('#vcEdit').onclick = visionEditor;
};
renderVisionCard();
