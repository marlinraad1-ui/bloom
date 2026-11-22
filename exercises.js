// Exercise animations (anim/*.json) from LottieFiles, used under the Lottie Simple License.
// Sources and artists are listed in anim/LICENSE.txt. Moves without a matching animation show their icon.
const EX_RULES = [
  [/rest|recover|walk down|cool down$/i, 'breathe'],
  [/jab|hook|uppercut|slip and duck|stance|^combos$/i, 'punch'],
  [/combo|groove|freestyle|pull-up|hanging|curl|press$|overhead press|shoulder press|row/i, null],
  [/stair|two steps|steep hill|step up/i, 'stepup'],
  [/incline|treadmill/i, 'treadmill'],
  [/\b(sprint|run|jog)/i, 'jog'],
  [/walk|march|warm up|side step/i, 'walk'],
  [/spin|moderate pace|^hill$|^climb$/i, 'bike'],
  [/rope|basic bounce|alternate feet|double speed/i, 'rope'],
  [/plank jack|mountain|shoulder tap|renegade/i, 'highplank'],
  [/jack/i, 'jacks'],
  [/jump squat|squat jump|box jump/i, 'jumpsquat'],
  [/burpee/i, 'burpee'],
  [/kickback|donkey|hydrant|frog pump|bridge/i, 'bridge'],
  [/hip thrust/i, 'hipthrust'],
  [/skater|split jump/i, 'splitjump'],
  [/high knees|butt kick|knee lift|knee drive|squat kick|standing (cross )?crunch/i, 'kick'],
  [/bicycle|twist|boat|leg circles|side kicks|abs circle/i, 'abcircle'],
  [/toe touch|flutter|dead bug|hundred|roll up/i, 'frogpress'],
  [/crunch|leg raise|knee raise|sit-up/i, 'crunch'],
  [/swan|cobra/i, 'cobra'],
  [/pike push|staggered/i, 'staggered'],
  [/knee push|wide/i, 'widepushup'],
  [/push-up|dip/i, 'pushup'],
  [/plank|bird dog/i, 'plank'],
  [/bulgarian|split squat|lunge|warrior/i, 'lunge'],
  [/goblet|dumbbell|swing|thruster|romanian|deadlift/i, 'dbsquat'],
  [/squat|chair|wall sit|calf/i, 'squat'],
  [/salutation|inchworm/i, 'inchworm'],
  [/stretch|sway/i, 'stretch'],
];
const exFor = move => { const r = EX_RULES.find(([re]) => re.test(move)); return r ? r[1] : null; };

// play every animation box that appears on screen (loads the player and the file only when needed)
let _lottieLib = null;
function lottieLib() {
  if (window.lottie) return Promise.resolve(window.lottie);
  return _lottieLib || (_lottieLib = new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'vendor/lottie_light.min.js'; s.onload = () => ok(window.lottie); s.onerror = no; document.head.appendChild(s); }));
}
async function mountLotties(root = document) {
  const boxes = [...root.querySelectorAll('.lot:not([data-on])')]; if (!boxes.length) return;
  boxes.forEach(b => b.dataset.on = '1');
  try {
    const L = await lottieLib();
    boxes.forEach(b => { if (b.isConnected) L.loadAnimation({ container: b, renderer: 'svg', loop: true, autoplay: true, path: `anim/${b.dataset.a}.json`, rendererSettings: { preserveAspectRatio: 'xMidYMid meet' } }); });
  } catch (e) { boxes.forEach(b => b.outerHTML = `<span>${b.dataset.fallback || '⭐'}</span>`); }
}
new MutationObserver(() => mountLotties()).observe(document.body, { childList: true, subtree: true });
