// ================= 3D EMOJI ICONS =================
// Microsoft Fluent Emoji 3D (free, MIT license) for the glossy 3D look.
// Emojis inside titles, tabs and big icons are swapped for 3D images.
// If an image can't load (offline), the normal emoji stays.
const FX_BASE = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/';
const FX = {
  '⏳': 'Hourglass not done', '🗓️': 'Spiral calendar', '🗓': 'Spiral calendar', '📋': 'Clipboard', '⚖️': 'Balance scale', '👟': 'Running shoe', '🏃': 'Running shoe',
  '👥': 'Busts in silhouette', '💬': 'Speech balloon', '🐰': 'Rabbit face', '😈': 'Smiling face with horns', '🎨': 'Artist palette', '⚙️': 'Gear',
  '🔥': 'Fire', '👑': 'Crown', '💧': 'Droplet', '✨': 'Sparkles', '🏆': 'Trophy', '🌙': 'Crescent moon', '💎': 'Gem stone', '🌸': 'Cherry blossom',
  '⚡': 'High voltage', '🏅': 'Sports medal', '🌈': 'Rainbow', '🕊️': 'Dove', '📉': 'Chart decreasing', '🍽️': 'Fork and knife with plate',
  '🔄': 'Counterclockwise arrows button', '🌱': 'Seedling', '🧘': 'Lotus', '💖': 'Sparkling heart', '🩺': 'Stethoscope', '📸': 'Camera with flash',
  '📷': 'Camera', '🎤': 'Microphone', '🍵': 'Teacup without handle', '🍑': 'Peach', '🪐': 'Ringed planet', '🐳': 'Spouting whale',
  '🏛️': 'Classical building', '🔬': 'Microscope', '📊': 'Bar chart', '🪞': 'Mirror', '🎉': 'Party popper', '🥺': 'Pleading face',
  '🍩': 'Doughnut', '🍕': 'Pizza', '🍔': 'Hamburger', '🔐': 'Locked with key', '📌': 'Pushpin', '❤️': 'Red heart', '⭐': 'Star', '🌟': 'Glowing star',
  '💯': 'Hundred points', '🔔': 'Bell', '⏰': 'Alarm clock', '🥳': 'Partying face', '🥰': 'Smiling face with hearts', '🚀': 'Rocket', '🎯': 'Bullseye',
  '🩰': 'Ballet shoes', '☕': 'Hot beverage', '🥤': 'Cup with straw', '🍹': 'Tropical drink', '🎊': 'Party popper'
};
const fxSrc = e => FX[e] ? FX_BASE + encodeURI(`${FX[e]}/3D/${FX[e].toLowerCase().replace(/ /g, '_')}_3d.png`) : null;
const FX_RE = new RegExp(Object.keys(FX).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
// places that get 3D emojis
const FX_SEL = '.hello .mascot, .tabbar span, .topbtns .iconbtn, h2, h3, .ring-emoji, .buddy, .slide-big, .shame-face, .w-icon, .tl div, .alarm-ring, .mini-stat span, .stage-title, .pin-tag, .dev-crown, .people-seg button, .s-time, .theme-card .tc-name, .wday b';

function upgradeEmojis(root = document) {
  const els = root.matches?.(FX_SEL) ? [root] : [];
  els.push(...root.querySelectorAll(FX_SEL));
  for (const el of els) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const t of nodes) {
      if (!FX_RE.test(t.nodeValue)) continue; FX_RE.lastIndex = 0;
      const frag = document.createDocumentFragment(); let last = 0;
      t.nodeValue.replace(FX_RE, (m, i) => {
        if (i > last) frag.appendChild(document.createTextNode(t.nodeValue.slice(last, i)));
        const img = document.createElement('img'); img.className = 'fx'; img.alt = m; img.src = fxSrc(m); img.draggable = false;
        img.onerror = () => img.replaceWith(document.createTextNode(m));
        frag.appendChild(img); last = i + m.length; return m;
      });
      if (last < t.nodeValue.length) frag.appendChild(document.createTextNode(t.nodeValue.slice(last)));
      t.replaceWith(frag);
    }
  }
}
let fxQueued = false;
const fxObserver = new MutationObserver(() => {
  if (fxQueued) return; fxQueued = true;
  requestAnimationFrame(() => { fxQueued = false; fxObserver.disconnect(); upgradeEmojis(document.body); fxObserver.observe(document.body, { childList: true, subtree: true, characterData: true }); });
});
upgradeEmojis(document.body);
fxObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
