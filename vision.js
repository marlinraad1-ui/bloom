// ================= VISION BOARD ("My why") =================
// Your reasons, your inspo and your photos as story slides.
// Shown before you end a fast early. If you haven't written one, Bloom writes one for you.

const vis = () => (S.vision = S.vision || { why: '', inspo: '', inspoText: '', keep: '', photos: [] });
const visImg = id => getPhoto('vision-' + id).then(r => r?.img).catch(() => null);
const visPut = (id, img) => PDB.tx('readwrite', st => st.put({ date: 'vision-' + id, img }));
const visDel = id => PDB.tx('readwrite', st => st.delete('vision-' + id));
const visEmpty = () => { const v = vis(); return !v.why && !v.inspo && !v.keep && !v.photos.length; };

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
      $('#stStage').innerHTML = `<div class="slide bg${s.bg || 0}">${s.img ? `<img src="${s.img}" class="slide-img" alt="">` : ''}
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
    $('#stPrev').onclick = () => show(i - 1);
    $('#stNext').onclick = () => show(i + 1);
    $('#stX').onclick = () => { clearTimeout(timer); closeModal(); };
    show(0);
  });
}

async function visionEditor() {
  const v = vis();
  const thumbs = await Promise.all(v.photos.map(async p => ({ ...p, img: await visImg(p.id) })));
  const inspoImg = v.inspoPhoto ? await visImg(v.inspoPhoto) : null;
  openModal(`<h2>✨ My vision board</h2>
    <p class="muted small">This shows up when fasting gets hard, and before you end a fast early. Photos stay on this phone.</p>
    <div class="field"><label>Why am I doing this?</label><textarea id="vWhy" rows="3" maxlength="500" placeholder="e.g. For my faith, for my health, to feel confident in my body again…">${esc(v.why)}</textarea></div>
    <div class="field"><label>Who is my inspo?</label><input id="vInspo" maxlength="60" value="${esc(v.inspo)}" placeholder="a person, an idol, a friend, future me…"></div>
    <div class="row gap" style="align-items:flex-start">
      <label class="photo-slot vsm ${inspoImg ? 'has' : ''}" id="vInspoSlot" style="${inspoImg ? `background-image:url(${inspoImg})` : ''}"><input type="file" accept="image/*" id="vInspoPic" hidden><span>🌟<br>photo</span></label>
      <div class="field" style="flex:1"><label>What do they mean to me?</label><textarea id="vInspoText" rows="3" maxlength="300" placeholder="e.g. She never gives up, and neither will I">${esc(v.inspoText)}</textarea></div>
    </div>
    <div class="field"><label>What makes me want to continue?</label><textarea id="vKeep" rows="3" maxlength="500" placeholder="e.g. Wearing that dress in summer. Proving to myself I can.">${esc(v.keep)}</textarea></div>
    <div class="field"><label>Vision photos (goal body, places, outfits, anything)</label>
      <div class="vgrid" id="vGrid">${thumbs.map(p => `<div class="vthumb" data-id="${p.id}"><img src="${p.img || ''}" alt=""><input value="${esc(p.caption || '')}" placeholder="caption" maxlength="80"><button class="vdel" data-id="${p.id}">✕</button></div>`).join('')}
        <label class="vthumb add"><input type="file" accept="image/*" id="vAdd" hidden multiple>＋<br>Add</label></div></div>
    <button class="btn big" id="vSave">Save my vision board</button>
    <button class="btn ghost big" style="margin-top:8px" id="vPreview">▶ Preview</button>
    <button class="btn ghost big" style="margin-top:8px;color:var(--danger)" id="vReset">🗑️ Reset vision board</button>`, () => {
    let inspoNew = null;
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
  const imgs = (await Promise.all(v.photos.slice(0, 4).map(p => visImg(p.id)))).filter(Boolean);
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

renderVisionCard();
