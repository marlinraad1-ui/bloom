// ================= FAST TIMER VIEW: hours or days, plus when you started and when you finish =================

const fmtDays = (ms, always) => {
  const s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400);
  const hms = [Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60].map(n => String(n).padStart(2, '0')).join(':');
  return d || always ? `${d}d ${hms}` : hms;
};
// "Today 08:30", "Tomorrow 20:30", "Wed 3 Dec 20:30"
function whenText(t) {
  const d = new Date(t), now = new Date(), day = 864e5;
  const startOf = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(d) - startOf(now)) / day);
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff === 0) return `Today ${time}`;
  if (diff === 1) return `Tomorrow ${time}`;
  if (diff === -1) return `Yesterday ${time}`;
  return `${d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })} ${time}`;
}

function fastViewUI() {
  if ($('#fastTimes')) return;
  $('.ring-wrap').insertAdjacentHTML('afterend', `
    <div class="tv-seg" id="tvSeg"><button type="button" data-tv="hours">⏱️ Hours</button><button type="button" data-tv="days">📅 Days</button></div>
    <div class="fast-times" id="fastTimes"></div>`);
  $('#tvSeg').querySelectorAll('[data-tv]').forEach(b => b.onclick = () => { S.settings.timeView = b.dataset.tv; save(); renderFast(); });
  $('#fastTime').onclick = () => { S.settings.timeView = S.settings.timeView === 'days' ? 'hours' : 'days'; save(); renderFast(); };
}

const _renderFastTV = renderFast;
renderFast = function () {
  _renderFastTV();
  fastViewUI();
  const f = S.fast, days = S.settings.timeView === 'days';
  $('#tvSeg').querySelectorAll('[data-tv]').forEach(b => b.classList.toggle('on', b.dataset.tv === (days ? 'days' : 'hours')));
  $('#tvSeg').hidden = !f;
  if (!f) { $('#fastTimes').innerHTML = ''; return; }
  const ms = Date.now() - f.start, end = f.start + f.goal * 3600e3, left = end - Date.now();
  $('#fastTime').textContent = days ? fmtDays(ms, true) : fmtHMS(ms);
  $('#fastTime').classList.toggle('days', days);
  const leftTxt = left <= 0 ? '🎉 goal reached' : days ? `${fmtDays(left)} left` : `${fmtHMS(left)} left`;
  $('#fastTimes').innerHTML = `
    <div class="ft-box"><span>🌙 Started</span><b>${whenText(f.start)}</b></div>
    <div class="ft-mid">${leftTxt}</div>
    <div class="ft-box"><span>🏁 Finish</span><b>${whenText(end)}</b></div>`;
};
renderFast();

document.head.insertAdjacentHTML('beforeend', `<style>
.tv-seg { display: flex; gap: 4px; margin: 8px auto 4px; padding: 4px; width: fit-content; border-radius: 999px; background: color-mix(in srgb, var(--accent) 12%, transparent); }
.tv-seg button { border: 0; background: transparent; color: var(--muted); font: inherit; font-size: .82rem; font-weight: 700; padding: 6px 14px; border-radius: 999px; cursor: pointer; }
.tv-seg button.on { background: var(--accent); color: var(--btn-text, #fff); }
.fast-times { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px; margin: 8px 0 12px; }
.fast-times:empty { display: none; }
.ft-box { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 6px; border-radius: 14px; background: color-mix(in srgb, var(--accent) 10%, transparent); border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent); }
.ft-box span { font-size: .75rem; color: var(--muted); }
.ft-box b { font-size: .9rem; text-align: center; }
.ft-mid { font-size: .78rem; font-weight: 700; color: var(--accent); text-align: center; font-variant-numeric: tabular-nums; max-width: 90px; }
#fastTime { cursor: pointer; }
#fastTime.days { font-size: 1.6rem; }
</style>`);
