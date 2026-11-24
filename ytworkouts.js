// ================= FOLLOW-ALONG VIDEOS: pilates + K-pop dance workouts from YouTube =================
// Full workouts by real creators, played inside Bloom with YouTube's own player (they keep their views).
// Every video here was checked to play inside apps. VIP to play, everyone can browse.

const YTW = [
  // ---- Pilates ----
  { yt: 'C2HX2pNbUCM', kind: 'pilates', name: '30-min Full Body Pilates', by: 'Move With Nicole', min: 33, met: 4.0, lvl: 'Medium' },
  { yt: 'TbYkJXqdUP0', kind: 'pilates', name: 'Beginner Pilates Flow', by: 'Move With Nicole', min: 30, met: 3.5, lvl: 'Easy' },
  { yt: 'C3LB3Qszx2I', kind: 'pilates', name: 'Morning Mat Pilates', by: 'Move With Nicole', min: 32, met: 3.8, lvl: 'Medium' },
  { yt: 'caSTuINbONE', kind: 'pilates', name: 'Hourglass Pilates', by: 'Lidia Mera', min: 32, met: 4.2, lvl: 'Medium' },
  { yt: 'Zw7zhaBpSPU', kind: 'pilates', name: 'Full Body Pilates Burn', by: 'Lidia Mera', min: 32, met: 4.2, lvl: 'Medium' },
  { yt: 'lCg_gh_fppI', kind: 'pilates', name: 'POP Pilates for Beginners', by: 'Blogilates', min: 29, met: 4.0, lvl: 'Easy' },
  { yt: 'inL-zRXWpkk', kind: 'pilates', name: '15-min Pilates: thighs, arms, waist', by: 'Blogilates', min: 16, met: 4.2, lvl: 'Medium' },
  { yt: 'yU5uWAMed7k', kind: 'pilates', name: 'Extreme Pilates Thigh Burn', by: 'Blogilates', min: 30, met: 4.8, lvl: 'Hard' },
  { yt: 'm5DJMRYDSc0', kind: 'pilates', name: 'Beginner Pilates Abs', by: 'Blogilates', min: 17, met: 4.0, lvl: 'Easy' },
  { yt: 'Wg6-xYyB0cg', kind: 'pilates', name: 'Quiet Fat Burn (no jumping)', by: 'Blogilates', min: 12, met: 6.0, lvl: 'Medium' },
  { yt: 'I6xCb7s5CE4', kind: 'pilates', name: 'Beautiful Body Pilates', by: 'Blogilates', min: 14, met: 4.0, lvl: 'Easy' },
  // ---- HIIT: real sweaty full workouts ----
  { yt: 'UBMk30rjy0o', kind: 'hiit', name: '20-min Full Body Burn', by: 'Pamela Reif', min: 20, met: 7.5, lvl: 'Medium', jump: 1 },
  { yt: '1skBf6h2ksI', kind: 'hiit', name: '15-min HIIT, lots of calories', by: 'Pamela Reif', min: 15, met: 8.5, lvl: 'Hard', jump: 1 },
  { yt: 'gFeEUq2624Q', kind: 'hiit', name: '10-min Silent Cardio', by: 'Pamela Reif', min: 10, met: 6.5, lvl: 'Medium' },
  { yt: '3zl1_XGgDVk', kind: 'hiit', name: 'Flat Belly + Round Booty', by: 'Pamela Reif', min: 22, met: 5.5, lvl: 'Medium' },
  { yt: 'uvNsr4Fy-DU', kind: 'hiit', name: '20-min HIIT Calorie Burner', by: 'Chloe Ting', min: 21, met: 8.5, lvl: 'Hard', jump: 1 },
  { yt: 'CGmr02bfHUo', kind: 'hiit', name: 'Full Body Fat Loss', by: 'Chloe Ting', min: 21, met: 7.5, lvl: 'Medium', jump: 1 },
  { yt: '2MoGxae-zyo', kind: 'hiit', name: '2 Weeks Shred', by: 'Chloe Ting', min: 14, met: 6.5, lvl: 'Medium', jump: 1 },
  { yt: 'J4wm6qiv5pI', kind: 'hiit', name: '20-min Killer HIIT', by: 'MadFit', min: 21, met: 8.5, lvl: 'Hard', jump: 1 },
  { yt: 'rI_6l992GrA', kind: 'hiit', name: '30-min HIIT (no jumping)', by: 'MadFit', min: 32, met: 6.5, lvl: 'Medium' },
  { yt: 'IT94xC35u6k', kind: 'hiit', name: 'Fat Burn for Beginners', by: 'MadFit', min: 22, met: 5.5, lvl: 'Easy' },
  { yt: 'hLVh5IBsCxk', kind: 'hiit', name: '20-min Killer HIIT', by: 'growingannanas', min: 20, met: 8.5, lvl: 'Hard', jump: 1 },
  { yt: '1V3LgKFZ3dI', kind: 'hiit', name: 'All Standing Fat Burn (no jumping)', by: 'Nobadaddiction', min: 20, met: 6.5, lvl: 'Medium' },
  { yt: '1kOalwKttKo', kind: 'hiit', name: 'Intense Tabata Cardio', by: 'growwithjo', min: 23, met: 8.5, lvl: 'Hard', jump: 1 },
  // ---- K-pop dance ----
  { yt: 'xUoY-SzeQdo', kind: 'kpop', name: 'BLACKPINK Dance Party', by: 'MIZI', min: 13, met: 7.0, lvl: 'Medium', jump: 1 },
  { yt: 'zrscH2x4UNU', kind: 'kpop', name: 'TWICE Dance Party', by: 'MIZI', min: 14, met: 7.0, lvl: 'Medium', jump: 1 },
  { yt: 'py_emJpp4ls', kind: 'kpop', name: 'BTS Dance Party', by: 'MIZI', min: 14, met: 7.0, lvl: 'Medium', jump: 1 },
  { yt: 'YUYK-ShexgM', kind: 'kpop', name: 'KPop Demon Hunters Party', by: 'MIZI', min: 14, met: 7.0, lvl: 'Medium', jump: 1 },
  { yt: 'mILHNza_-PM', kind: 'kpop', name: 'KATSEYE Dance Party', by: 'MIZI', min: 13, met: 7.0, lvl: 'Medium', jump: 1 },
  { yt: 'D5sZjsP03Zw', kind: 'kpop', name: '30-min K-pop Cardio', by: 'bomfit', min: 31, met: 7.3, lvl: 'Hard', jump: 1 },
  { yt: 'rnXP0mwpfJQ', kind: 'kpop', name: '20-min K-pop Sweat', by: 'bomfit', min: 22, met: 7.3, lvl: 'Hard', jump: 1 },
  { yt: 'b5hlY_rh9Cw', kind: 'kpop', name: '15-min K-pop Playlist', by: 'bomfit', min: 15, met: 7.0, lvl: 'Medium', jump: 1 },
  { yt: 'dsANewaxcM8', kind: 'kpop', name: 'K-pop Fat Burning Dance', by: 'growwithjo', min: 19, met: 7.0, lvl: 'Medium', jump: 1 },
  { yt: '571lzh-dPCI', kind: 'kpop', name: '20-min Diet Dance', by: 'Sunny Funny Fitness', min: 23, met: 6.5, lvl: 'Medium', jump: 1 },
  { yt: '2d9-eUqoknk', kind: 'kpop', name: 'K-pop Tone (no jumping)', by: 'Aurora Ouyang', min: 25, met: 5.5, lvl: 'Easy' },
];
const ytwKcal = v => Math.round(workoutKcal(v, v.min));
let ytwTab = 'hiit';

function renderYTW() {
  const box = $('#ytwCard'); if (!box) return;
  const nojump = !!(S.wprof?.nojump || S.wf?.nojump);
  const list = YTW.filter(v => v.kind === ytwTab).sort((a, b) => (nojump ? (a.jump || 0) - (b.jump || 0) : 0) || ytwKcal(b) - ytwKcal(a));
  const done = new Set((S.ytwDone || []));
  box.innerHTML = `<div class="ytw-head"><h3>🎀 Follow along</h3><span class="small">${isVip() ? 'press play, sweat, glow ✨' : '<span class="vip-badge">VIP</span>'}</span></div>
    <div class="ytw-tabs"><button class="${ytwTab === 'pilates' ? 'on' : ''}" data-t="pilates">🩰 Pilates</button><button class="${ytwTab === 'hiit' ? 'on' : ''}" data-t="hiit">🔥 HIIT</button><button class="${ytwTab === 'kpop' ? 'on' : ''}" data-t="kpop">🎤 K-pop</button></div>
    <div class="ytw-row">${list.map(v => `<button class="ytw-v" data-yt="${v.yt}">
      <span class="ytw-th"><img src="https://i.ytimg.com/vi/${v.yt}/mqdefault.jpg" alt="" loading="lazy"><i class="ytw-play">▶</i><em>${v.min} min</em>${done.has(v.yt) ? '<s class="ytw-done">✓ done</s>' : ''}</span>
      <b>${esc(v.name)}</b><span class="ytw-meta">🔥 ${ytwKcal(v)} kcal · ${v.jump ? '🦘 jumping' : '🤫 no jumping'}</span><span class="ytw-by">♡ ${esc(v.by)} · ${v.lvl}</span></button>`).join('')}</div>`;
  box.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { ytwTab = b.dataset.t; renderYTW(); });
  box.querySelectorAll('[data-yt]').forEach(b => b.onclick = () => ytwPlay(YTW.find(v => v.yt === b.dataset.yt)));
}

function ytwPlay(v) {
  if (!isVip()) return vipModal('workouts');
  const started = Date.now();
  openModal(`<div class="ytw-player"><div class="ytw-frame"><iframe src="https://www.youtube-nocookie.com/embed/${v.yt}?autoplay=1&playsinline=1&rel=0&modestbranding=1" title="${esc(v.name)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>
    <h2>${esc(v.name)}</h2><p class="muted small">by ${esc(v.by)} on YouTube · ${v.min} min · about ${ytwKcal(v)} kcal</p>
    <button class="btn big" id="ytwDone">✅ I finished it! (+${ytwKcal(v)} kcal)</button>
    <button class="linkbtn" id="ytwPart">I did part of it</button>
    <a class="linkbtn" href="https://www.youtube.com/watch?v=${v.yt}" target="_blank" rel="noopener">Open on YouTube</a></div>`, m => {
    m.classList.add('ytw-modal');
    const finish = min => {
      logWorkout({ name: `${{ kpop: '🎤', hiit: '🔥', pilates: '🩰' }[v.kind]} ${v.name}`, met: v.met }, min);
      S.ytwDone = [...new Set([...(S.ytwDone || []), v.yt])].slice(-60); save();
      closeModal(); celebrate(); renderYTW();
    };
    $('#ytwDone').onclick = () => finish(v.min);
    $('#ytwPart').onclick = () => finish(Math.max(3, Math.min(v.min, Math.round((Date.now() - started) / 60e3))));
  });
}
const _closeModalY = window.closeModal;
window.closeModal = function () { $('#modal').classList.remove('ytw-modal'); _closeModalY(); };

const _showViewY = showView;
showView = function (v) { _showViewY(v); if (v === 'move') renderYTW(); };
renderYTW();

document.head.insertAdjacentHTML('beforeend', `<style>
.card.ytw { background: linear-gradient(160deg, #fff0f6, #f3e8ff 55%, #e8f4ff); color: #5a3550; border: 2px solid #ffd3e6; position: relative; overflow: hidden; }
.card.ytw::before { content: '♡ ✿ ♡'; position: absolute; right: 14px; top: 10px; font-size: .8rem; color: #ff9cc5; letter-spacing: 3px; }
.ytw-head { display: flex; align-items: baseline; gap: 10px; }
.ytw-head h3 { margin: 0; color: #c2185b; font-family: var(--head); }
.ytw-head .small { color: #a0708c; }
.ytw-tabs { display: flex; gap: 6px; margin: 10px 0; }
.ytw-tabs button { flex: 1; border: 2px solid #ffc6dd; background: #fff; color: #b0447a; border-radius: 999px; padding: 8px 10px; font-weight: 700; cursor: pointer; }
.ytw-tabs button.on { background: linear-gradient(90deg, #ff8fb8, #c38bff); color: #fff; border-color: transparent; box-shadow: 0 4px 12px rgba(255, 120, 170, .35); }
.ytw-row { display: flex; gap: 12px; overflow-x: auto; scroll-snap-type: x mandatory; padding: 4px 2px 10px; margin: 0 -2px; }
.ytw-v { flex: 0 0 210px; scroll-snap-align: start; text-align: left; background: #fff; border: 0; border-radius: 20px; padding: 8px 8px 10px; box-shadow: 0 6px 16px rgba(200, 90, 150, .15); cursor: pointer; color: #5a3550; display: flex; flex-direction: column; gap: 3px; transition: transform .2s; }
.ytw-v:active { transform: scale(.97); }
.ytw-th { position: relative; display: block; border-radius: 14px; overflow: hidden; aspect-ratio: 16 / 9; background: #ffe3ef; }
.ytw-th img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ytw-play { position: absolute; inset: 0; margin: auto; width: 40px; height: 40px; border-radius: 50%; background: rgba(255, 255, 255, .9); color: #ff5c9a; display: grid; place-items: center; font-style: normal; font-size: 1rem; box-shadow: 0 3px 10px rgba(0,0,0,.2); }
.ytw-th em { position: absolute; right: 6px; bottom: 6px; background: #ff7eb0; color: #fff; font-style: normal; font-size: .72rem; font-weight: 700; border-radius: 999px; padding: 2px 8px; }
.ytw-done { position: absolute; left: 6px; top: 6px; background: #7ed9a8; color: #fff; text-decoration: none; font-size: .72rem; font-weight: 700; border-radius: 999px; padding: 2px 8px; }
.ytw-v b { font-size: .92rem; line-height: 1.2; margin-top: 4px; }
.ytw-meta { font-size: .75rem; color: #c2185b; }
.ytw-by { font-size: .72rem; color: #a0708c; }
.modal.ytw-modal { max-width: 720px; }
.ytw-player { display: grid; gap: 8px; text-align: center; }
.ytw-player h2 { margin: 6px 0 0; }
.ytw-frame { position: relative; aspect-ratio: 16 / 9; border-radius: 16px; overflow: hidden; background: #000; }
.ytw-frame iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
</style>`);
