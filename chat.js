// ================= GENTLE BUDDY (rule-based, works offline) =================
// Safety rules:
//  - Red-flag symptoms (fainting, chest pain, confusion, etc.) -> STOP fast + call emergency.
//  - Feeling sick / dizzy -> gentle steps; if it doesn't pass -> break the fast gently.
//  - Just hungry / cravings / bored / sad -> therapist-style support to stay strong.
// It is NOT a doctor and says so.

const BUDDY = {
  kawaii: { name: 'Mochi', face: '🐰', s: ['🌸', '💕', '✨', '🥺', '🫶', '🍵'] },
  dark:   { name: 'Sable', face: '🖤', s: ['', '', '', '', '', ''] },
  simple: { name: 'Buddy', face: '🙂', s: ['', '', '', '', '', ''] }
};

const RED_FLAGS = [
  /faint(ed|ing)?/, /pass(ed)? ?out/, /black(ed)? ?out/, /lost consciousness/, /collaps/,
  /chest (pain|hurt|tight|pressure)/, /heart (is )?(racing|pounding|skipping|weird|irregular)/, /palpitation/,
  /can'?t breathe|short(ness)? of breath|hard to breathe/, /confus/, /can'?t (stand|walk|think|see)/,
  /seizure|convuls/, /vomit(ing)? blood|blood in/, /very sick|really sick|so sick/, /numb(ness)?/,
  /(throw|throwing) up (a lot|again|non ?stop)/, /severe/, /fainted/, /unconscious/,
  /flauw|ohnmacht|bewusstlos|evanoui/ // nl/de/fr basics
];
const SICK = [/dizz/, /lighthead|light-head|light head/, /nause|sick|throw(ing)? up|vomit/, /headache|head hurts|migraine/,
  /weak|shaky|shaking|trembl/, /cold|chills|freezing/, /cramp/, /blurry/, /tired|exhausted|no energy/];
const HUNGRY = [/hungry|starving|hunger/, /crav/, /want(ed)? to (eat|break|stop|quit|give up)/, /break (my|the) fast/,
  /give up|quit|can'?t do (this|it)/, /food|pizza|burger|chocolate|\beat\b|\beating\b/];
const SAD = [/sad|depress|cry|lonely|alone|anxious|anxiety|stress|overwhelm|upset/];
const BORED = [/bored|boring|nothing to do/];
const ED = [/hate (my|myself|my body)|fat and ugly|disgusting|purg|make myself (sick|throw up)|deserve to starve|punish/];
const MOTIV = [/motivat|inspire|push me|help me (stay|keep)|keep going/];
const WHY = [/why.*fast|benefit|what('?s| is) happening|body/];
const GREET = [/^(hi|hey|hello|yo|salam|hallo|hola)\b/];
const BETTER = [/better|good now|fine now|okay now|ok now|i'?m ok|i'?m good|great/];
const DIABETES = [/diabet|insulin|pregnan|breastfeed|eating disorder|anorex|bulimi|heart condition|blood thinner|kidney/];

function anyMatch(list, t) { return list.some(r => r.test(t)); }

function buddyReply(text, ctx) {
  const t = text.toLowerCase();
  const b = BUDDY[ctx.theme] || BUDDY.kawaii;
  const e = i => b.s[i] ? ' ' + b.s[i] : '';
  const hours = ctx.hours;
  const name = ctx.name ? ', ' + ctx.name : '';
  const out = [];

  // 1. Emergency red flags ALWAYS first
  if (anyMatch(RED_FLAGS, t)) {
    out.push({ alert: true, text:
      `Please stop your fast right now${name}. Your safety matters more than any goal.\n\n` +
      `• Sit or lie down somewhere safe — don't stand up fast.\n` +
      `• If you can swallow safely, sip something with sugar (juice, honey water) slowly.\n` +
      `• Tell someone near you what is happening.\n` +
      `• If you fainted, have chest pain, trouble breathing, confusion, or it is not getting better in a few minutes — call emergency services NOW.`,
      call: true });
    out.push({ text: `I'm right here with you${e(4)}. Breaking your fast for your health is not failing — it's wisdom. You can always fast again another day when you feel well.` });
    return out;
  }

  // 2. Eating-disorder warning signs — gentle, no fasting push
  if (anyMatch(ED, t)) {
    out.push({ text: `Thank you for telling me that${e(4)}. I hear a lot of pain in those words, and you deserve kindness — especially from yourself.\n\nFasting should never be a punishment. If food, your body or fasting feel like a fight, please talk to someone you trust or a doctor/therapist. You can also reach a mental-health helpline in your country — you don't have to carry this alone.\n\nWould you like to talk about what's making you feel this way?` });
    return out;
  }

  // 3. Medical conditions
  if (anyMatch(DIABETES, t)) {
    out.push({ text: `That's important${e(2)}. With diabetes, insulin or other medication, pregnancy/breastfeeding, an eating-disorder history, heart or kidney conditions, long fasts can be risky. Please check with your doctor before fasting more than a day — they can help you do it safely (for example adjusting medication). If your sugar feels low (shaky, sweaty, confused) — break the fast now.` });
    return out;
  }

  // 4. Feeling sick but not red-flag
  if (anyMatch(SICK, t)) {
    out.push({ text: `Oh no, I'm sorry you feel this way${e(3)}. Let's take care of you first.\n\nTry this for the next 15 minutes:\n1. Sit or lie down. Stand up slowly later.\n2. Drink a glass of water with a small pinch of salt (electrolytes help dizziness & headaches a lot).\n3. Breathe slowly: in 4 seconds, out 6 seconds.\n4. Check again in 15 min.\n\n` +
      `If it goes away → you can keep going gently, no workout today${e(1)}.\nIf it gets worse, you faint, feel very sick, your heart races or you get confused → break your fast with something small and call for help if needed. Your health comes first, always.` });
    out.push({ text: `Tell me in 15 minutes how you feel — "better" or "still bad".`, quick: ['Better now', 'Still bad', 'I fainted'] });
    return out;
  }

  if (/still bad|not better|worse|getting worse/.test(t)) {
    out.push({ text: `Thank you for being honest${e(4)}. Since it isn't getting better, I think it's time to gently break your fast today.\n\nStart small: a cup of broth or a little juice, then wait 30–60 min, then a small soft meal (eggs, yogurt, soup). If you get worse, faint, or have chest pain — call emergency services.\n\nYou didn't fail. You listened to your body — that's the real strength.`, call: true });
    return out;
  }

  if (anyMatch(BETTER, t)) {
    out.push({ text: `I'm so glad${e(1)}! Keep sipping water with electrolytes, keep movement gentle today, and tell me right away if anything feels off again. Proud of you${e(5)}.` });
    return out;
  }

  // 5. Hungry / want to quit — therapist-style
  if (anyMatch(HUNGRY, t)) {
    const reason = ctx.reason ? `\n\nYou told me you're fasting for: "${ctx.reason}". Hold onto that${e(1)}.` : '';
    const hrs = hours > 0 ? `You're ${Math.floor(hours)} hours in — that's ${Math.floor(hours)} hours of keeping your promise. ` : '';
    out.push({ text: `It's okay to feel this${e(0)}. Wanting to eat doesn't mean you're weak — it means you're human.\n\n${hrs}Can I ask you something gently: are you feeling hungry in your stomach, or is it more boredom, tiredness, stress, or seeing/smelling food?` + reason,
      quick: ['Stomach hunger', 'Bored', 'Stressed / sad', 'Saw food', 'I feel sick'] });
    return out;
  }
  if (/stomach hunger|real hunger|physically hungry/.test(t)) {
    out.push({ text: `Thank you for noticing that${e(2)}. Real hunger comes in WAVES — it usually peaks for 15–20 minutes, then fades, even without eating.\n\nLet's ride this wave together:\n• Drink 300 ml water (sparkling helps fill you up)\n• ${ctx.fastType === 'dirty' ? 'Black tea or a Cola Zero is allowed for you' : 'Add a pinch of salt — hunger is sometimes low sodium'}\n• Set a 20-minute timer and do something with your hands\n\nIf after that you still feel truly unwell — not just hungry — tell me "I feel sick".` });
    return out;
  }
  if (anyMatch(BORED, t)) {
    out.push({ text: `Boredom is the sneakiest hunger${e(0)}! Your brain wants a dopamine hit, not food.\n\nTry one:\n🎮 Work on your game for 25 min\n🎬 Start a movie (with tea!)\n📚 One focused study block\n🚶 A 15-min walk — also adds steps\n🙏 Prayer, meditation or journaling\n\nWhich one sounds okay right now?` });
    return out;
  }
  if (anyMatch(SAD, t)) {
    out.push({ text: `I'm really glad you told me${e(4)}. Fasting can bring up feelings — a lower blood sugar makes emotions louder, so be gentle with yourself.\n\nLet's breathe together: in for 4… hold 4… out for 6. Three times.\n\nWhat's on your mind? I'm listening. And if the sadness feels heavy or doesn't go away, it's a sign of strength to talk to someone you trust or a professional.` });
    return out;
  }
  if (/saw food|smell|someone (is )?eating|family (is )?eating/.test(t)) {
    out.push({ text: `That's the hardest trigger${e(3)}! Seeing or smelling food makes your body release hunger hormones in seconds — it's automatic, not your fault.\n\nStep away for 5 minutes, brush your teeth or chew mint gum (if your fast allows), drink something warm. The urge will drop a lot within 10 minutes. You've got this${e(5)}.` });
    return out;
  }
  if (anyMatch(MOTIV, t)) {
    out.push({ text: `${MOTIVATION[Math.floor(Math.random() * MOTIVATION.length)]}${e(2)}\n\nRight now your body is in: "${stageFor(hours).name}". ${stageFor(hours).fact}` });
    return out;
  }
  if (anyMatch(WHY, t)) {
    const s = stageFor(hours);
    out.push({ text: `${s.emoji} Hour ${Math.floor(hours)} — ${s.name}\n\n${s.body}\n\n${s.fact}\n\nTip: ${s.tip}` });
    return out;
  }
  if (anyMatch(GREET, t)) {
    out.push({ text: `Hi${name}${e(1)}! How are you feeling right now?`, quick: ['I feel great', 'Hungry', 'Want to break my fast', 'Dizzy', 'Motivate me'] });
    return out;
  }
  if (/great|amazing|strong|good/.test(t)) {
    out.push({ text: `Yay${e(1)}! That's your body adapting beautifully. Remember: water, electrolytes, gentle movement. I'm so proud of you${e(5)}.` });
    return out;
  }
  out.push({ text: `I hear you${e(0)}. Tell me a bit more — are you feeling hungry, tired, sick, sad, or do you want some motivation? And if you ever feel faint, chest pain or very sick, tell me right away.`,
    quick: ['Hungry', 'Tired', 'Dizzy', 'Sad', 'Motivate me'] });
  return out;
}
