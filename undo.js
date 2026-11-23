// ================= UNDO + RESETS =================
// Before every tap we remember how things were. If the tap changed your data,
// an "Undo" button pops up for a few seconds, and Settings has "Undo last change" (up to 15 steps back).

const UNDO_IGNORE = ['peopleTab', 'lastDrink', 'chatUsed', 'goalToast', 'vipSync', 'vipPending', 'waterPrompted', 'wf', 'gear', 'community'];
const undoStack = [];
let undoPending = null, undoChipTimer = null;
const undoComparable = () => { const o = { ...S }; UNDO_IGNORE.forEach(k => delete o[k]); return JSON.stringify(o); };
const undoLabel = el => {
  const b = el.closest('button, label, a, .task, .cupbtn, .dbtn'); if (!b) return 'last change';
  return (b.getAttribute('aria-label') || b.title || b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 34) || 'last change';
};

function undoCapture(e) {
  if (e.target.closest('#undoChip, #undoLast, .tabbar')) return;
  undoPending = { raw: JSON.stringify(S), cmp: undoComparable(), label: undoLabel(e.target) };
  clearTimeout(undoCapture.t); undoCapture.t = setTimeout(undoCheck, 500);
}
function undoCheck() {
  if (!undoPending) return;
  if (undoComparable() !== undoPending.cmp) {
    undoStack.push({ raw: undoPending.raw, label: undoPending.label, at: Date.now() });
    if (undoStack.length > 15) undoStack.shift();
    showUndoChip(undoPending.label);
  }
  undoPending = null;
}
document.addEventListener('click', undoCapture, true);
document.addEventListener('change', e => { if (e.target.matches('input, select, textarea')) undoCapture(e); }, true);

function showUndoChip(label) {
  let c = document.getElementById('undoChip');
  if (!c) { c = document.createElement('button'); c.id = 'undoChip'; c.type = 'button'; document.body.appendChild(c); c.onclick = () => undoLast(); }
  c.innerHTML = `↩ <b>Undo</b> <span>${esc(label)}</span>`;
  c.classList.add('show'); clearTimeout(undoChipTimer); undoChipTimer = setTimeout(() => c.classList.remove('show'), 7000);
}

function undoLast() {
  const s = undoStack.pop();
  document.getElementById('undoChip')?.classList.remove('show');
  if (!s) return toast('Nothing to undo');
  const old = JSON.parse(s.raw);
  // keep things that live on the server or must not jump back
  ['community', 'vipSync', 'vipPending'].forEach(k => { if (S[k] !== undefined) old[k] = S[k]; });
  S = old; save();
  try { renderAll(); if (window.renderFood) renderFood(); renderWater(); } catch (e) {}
  if (curView === 'body') renderBody();
  toast(`↩ Undone: ${s.label}`);
}

// ---------- resets ----------
function resetVisionBoard() {
  openModal(`<h2>🗑️ Reset vision board?</h2><p>This clears your why, inspo, texts and photos from the board. You can tap <b>↩ Undo</b> right after if you change your mind.</p>
    <div class="row gap"><button class="btn ghost" onclick="closeModal()">Keep it</button><button class="btn danger" id="vbResetGo">Reset</button></div>`, () => {
    $('#vbResetGo').onclick = () => {
      S.vision = { why: '', inspo: '', inspoText: '', keep: '', photos: [] }; save();
      closeModal(); if (window.renderVisionCard) renderVisionCard(); toast('Vision board cleared ✨');
    };
  });
}
function resetDrinksToday() {
  openModal(`<h2>🗑️ Reset today's drinks?</h2><p>All drinks you added today are removed (water, tea, coffee, sodas). Your water reminders start fresh. You can tap <b>↩ Undo</b> right after.</p>
    <div class="row gap"><button class="btn ghost" onclick="closeModal()">Keep them</button><button class="btn danger" id="drResetGo">Reset</button></div>`, () => {
    $('#drResetGo').onclick = () => { day().drinks = []; closeModal(); refreshWaterViews(); toast('Today\'s drinks reset 💧'); };
  });
}
