// ================= MOCHI (rule based, works offline) =================
// Two personalities:
//   sweet: gentle, therapist style
//   evil:  harsh "toxic" tough love (user must accept terms first)
// Safety rules ALWAYS win over personality:
//   red flag symptoms -> stop the fast + call emergency (Evil Mochi drops the act)
//   feeling sick      -> gentle steps, break the fast if it doesn't pass
//   sad / eating disorder signs -> Evil Mochi drops the act and is kind
// Mochi is not a doctor and says so.

const BUDDY = {
  sweet: { name: 'Sweet Mochi', face: '🐰' },
  evil:  { name: 'Evil Mochi', face: '😈' }
};

const RED_FLAGS = [
  /faint(ed|ing)?/, /pass(ed)? ?out/, /black(ed)? ?out/, /lost consciousness/, /collaps/,
  /chest (pain|hurt|tight|pressure)/, /heart (is )?(racing|pounding|skipping|weird|irregular)/, /palpitation/,
  /can'?t breathe|short(ness)? of breath|hard to breathe/, /confus/, /can'?t (stand|walk|think|see)/,
  /seizure|convuls/, /vomit(ing)? blood|blood in/, /very sick|really sick|so sick/, /numb(ness)?/,
  /(throw|throwing) up (a lot|again|non ?stop)/, /severe/, /unconscious/,
  /flauw|ohnmacht|bewusstlos|evanoui/
];
const SICK = [/dizz/, /lighthead|light-head|light head/, /nause|\bsick\b|throw(ing)? up|vomit/, /headache|head hurts|migraine/,
  /weak|shaky|shaking|trembl/, /chills|freezing/, /cramp/, /blurry/];
const TIRED = [/tired|exhausted|no energy|sleepy/];
const HUNGRY = [/hungry|starving|hunger/, /crav/, /want(ed)? to (eat|break|stop|quit|give up)/, /break (my|the) fast/,
  /give up|quit|can'?t do (this|it)/, /food|pizza|burger|chocolate|\beat\b|\beating\b/];
const SAD = [/sad|depress|cry|lonely|alone|anxious|anxiety|stress|overwhelm|upset/];
const BORED = [/bored|boring|nothing to do/];
const ED = [/hate (my|myself|my body)|fat and ugly|disgusting|purg|make myself (sick|throw up)|deserve to starve|punish|kill myself|want to die|suicid/];
const MOTIV = [/motivat|inspire|push me|help me (stay|keep)|keep going|roast me/];
const WHY = [/why.*fast|benefit|what('?s| is) happening|my body/];
const GREET = [/^(hi|hey|hello|yo|salam|hallo|hola)\b/];
const BETTER = [/better|good now|fine now|okay now|ok now|i'?m ok|i'?m good/];
const MEDICAL = [/diabet|insulin|pregnan|breastfeed|eating disorder|anorex|bulimi|heart condition|blood thinner|kidney/];

const anyMatch = (list, t) => list.some(r => r.test(t));
const pick = a => a[Math.floor(Math.random() * a.length)];

const EVIL_MOTIV = [
  'Oh you want motivation? Here: the fridge doesn\'t love you. Your goals do. Drink your water.',
  'You said you wanted results. Results don\'t come from snacks at midnight, sweetie.',
  'Imagine quitting now and having to start from hour zero again. Embarrassing. Keep going.',
  'Your excuses are louder than your stomach. Shut both up.',
  'Discipline or regret. Pick one. I already know which one you\'re picking, right? RIGHT?',
  'Nobody is coming to do this for you. Not me, not your mom, not the pizza guy.',
  'You lasted this long and you want to throw it away for a cookie? Be serious.',
  'Cry if you want, but cry hydrated. Water. Now.',
  'Champions are built in the hours nobody claps for. This is one of those hours.',
  'Yes, it\'s hard. That\'s literally the point. Easy things don\'t change you.'
];

function buddyReply(text, ctx) {
  const t = text.toLowerCase();
  const evil = ctx.persona === 'evil';
  const hours = ctx.hours;
  const H = Math.floor(hours);
  const name = ctx.name ? ', ' + ctx.name : '';
  const out = [];

  // 1. Emergency red flags ALWAYS first, both personalities
  if (anyMatch(RED_FLAGS, t)) {
    out.push({ alert: true, text:
      (evil ? 'Okay. I\'m dropping the act. This is serious.\n\n' : '') +
      `Please stop your fast right now${name}. Your safety matters more than any goal.\n\n` +
      `• Sit or lie down somewhere safe. Don't stand up fast.\n` +
      `• If you can swallow safely, sip something with sugar (juice, honey water) slowly.\n` +
      `• Tell someone near you what is happening.\n` +
      `• If you fainted, have chest pain, trouble breathing, confusion, or it is not getting better in a few minutes: call emergency services NOW.`,
      call: true });
    out.push({ text: `I'm right here with you 🫶 Breaking your fast for your health is not failing. It's wisdom. You can always fast again when you feel well.` });
    return out;
  }

  // 2. Eating disorder / self harm signs: always kind
  if (anyMatch(ED, t)) {
    out.push({ text: (evil ? 'Hey. Act off. I mean this for real.\n\n' : '') +
      `Thank you for telling me that 🫶 I hear a lot of pain in those words, and you deserve kindness, especially from yourself.\n\nFasting should never be a punishment. If food, your body or fasting feel like a fight, please talk to someone you trust or a doctor or therapist. If you ever think about hurting yourself, call your local emergency number or a crisis line right away. You don't have to carry this alone.\n\nDo you want to talk about what's making you feel this way?` });
    return out;
  }

  // 3. Medical conditions
  if (anyMatch(MEDICAL, t)) {
    out.push({ text: `That's important. With diabetes, insulin or other medication, pregnancy or breastfeeding, an eating disorder history, or heart or kidney problems, long fasts can be risky. Please check with your doctor before fasting more than a day. If your sugar feels low (shaky, sweaty, confused), break the fast now.` });
    return out;
  }

  // 4. Feeling sick, not red flag: gentle in both modes
  if (anyMatch(SICK, t)) {
    out.push({ text: (evil ? 'Fine, I\'ll be nice for a second. Your health > my attitude.\n\n' : 'Oh no, I\'m sorry you feel this way 🥺 Let\'s take care of you first.\n\n') +
      `Try this for the next 15 minutes:\n1. Sit or lie down. Stand up slowly later.\n2. Drink a glass of water with a small pinch of salt. Electrolytes help dizziness and headaches a lot.\n3. Breathe slowly: in for 4 seconds, out for 6.\n4. Check again in 15 minutes.\n\n` +
      `If it goes away, you can keep going gently. No hard workout today.\nIf it gets worse, you faint, feel very sick, your heart races or you get confused: break your fast with something small and get help if needed. Your health comes first, always.` });
    out.push({ text: `Tell me in 15 minutes how you feel.`, quick: ['Better now', 'Still bad', 'I fainted'] });
    return out;
  }

  if (/still bad|not better|worse|getting worse/.test(t)) {
    out.push({ text: `Thank you for being honest 🫶 Since it isn't getting better, it's time to gently break your fast today.\n\nStart small: a cup of broth or a little juice, wait 30 to 60 minutes, then a small soft meal (eggs, yogurt, soup). If you get worse, faint, or have chest pain, call emergency services.\n\nYou didn't fail. You listened to your body, and that's real strength.`, call: true });
    return out;
  }

  if (anyMatch(BETTER, t)) {
    out.push({ text: evil ? 'Good. See? You\'re tougher than you think. Water, electrolytes, and no drama. Tell me if anything feels off.' : 'I\'m so glad 🌸 Keep sipping water with electrolytes, keep moving gently today, and tell me right away if anything feels off. Proud of you 🫶' });
    return out;
  }

  // 5. Sad: Evil drops the act
  if (anyMatch(SAD, t)) {
    out.push({ text: (evil ? 'Okay, roasting paused. You matter more than a fast.\n\n' : '') +
      `I'm really glad you told me 🫶 Fasting can bring up feelings. Lower blood sugar makes emotions louder, so be gentle with yourself.\n\nLet's breathe together: in for 4, hold for 4, out for 6. Three times.\n\nWhat's on your mind? I'm listening. If the sadness feels heavy or doesn't go away, talking to someone you trust or a professional is a sign of strength.` });
    return out;
  }

  // 6. Hungry / want to quit
  if (anyMatch(HUNGRY, t)) {
    const reason = ctx.reason ? `\n\nYou told me you're fasting for: "${ctx.reason}". ${evil ? 'Remember that? Or was it just talk?' : 'Hold on to that 🌸'}` : '';
    if (evil) {
      out.push({ text: `Hungry? ${H > 0 ? `After ${H} hours you want to fold over a little stomach growl? ` : ''}Wow. Dramatic.\n\nOkay listen. Is it real stomach hunger, or are you just bored, tired, stressed, or staring at food again?` + reason,
        quick: ['Stomach hunger', 'Bored', 'Stressed / sad', 'Saw food', 'I feel sick'] });
    } else {
      out.push({ text: `It's okay to feel this 🌸 Wanting to eat doesn't mean you're weak. It means you're human.\n\n${H > 0 ? `You're ${H} hours in. That's ${H} hours of keeping your promise. ` : ''}Can I ask you something gently: is it hunger in your stomach, or more boredom, tiredness, stress, or seeing or smelling food?` + reason,
        quick: ['Stomach hunger', 'Bored', 'Stressed / sad', 'Saw food', 'I feel sick'] });
    }
    return out;
  }
  if (/stomach hunger|real hunger|physically hungry/.test(t)) {
    const drink = ctx.fastType === 'dirty' ? 'Black tea or a Cola Zero is allowed for you' : 'Add a pinch of salt. Hunger is sometimes low sodium';
    out.push({ text: evil
      ? `Real hunger comes in WAVES. It peaks for 15 to 20 minutes and then it leaves, even if you do nothing. So do nothing. Well, not nothing:\n• Drink 300 ml water. Sparkling fills you up.\n• ${drink}.\n• Set a 20 minute timer and keep your hands busy.\n\nIf you actually feel sick, not just hungry, tell me "I feel sick". Otherwise, I'll see you in 20 minutes, still fasting. 😈`
      : `Thank you for noticing that 🥺 Real hunger comes in WAVES. It usually peaks for 15 to 20 minutes, then fades, even without eating.\n\nLet's ride this wave together:\n• Drink 300 ml water (sparkling helps fill you up)\n• ${drink}\n• Set a 20 minute timer and do something with your hands\n\nIf after that you feel truly unwell, not just hungry, tell me "I feel sick".` });
    return out;
  }
  if (anyMatch(BORED, t)) {
    out.push({ text: evil
      ? `Bored is not hunger, genius. The fridge is not a TV show.\n\nPick one, right now:\n🎮 Gaming or a project for 25 minutes\n🎬 A movie with tea\n📚 One study block\n🚶 A 15 minute walk, it adds steps too\n🙏 Prayer, meditation or journaling\n\nGo. Stop texting me and go.`
      : `Boredom is the sneakiest hunger 🌸 Your brain wants a little dopamine, not food.\n\nTry one:\n🎮 Gaming or a project for 25 minutes\n🎬 Start a movie (with tea!)\n📚 One focused study block\n🚶 A 15 minute walk, it adds steps too\n🙏 Prayer, meditation or journaling\n\nWhich one sounds okay right now?` });
    return out;
  }
  if (anyMatch(TIRED, t)) {
    out.push({ text: evil
      ? 'Tired? Then rest. Lying on the couch is still fasting. Eating is not a nap. Drink water with a pinch of salt and take 20 minutes.'
      : 'Being tired on a fast is really common 🫶 Lie down for 20 minutes, sip water with a pinch of salt, and skip hard workouts today. If you also feel dizzy or faint, tell me.' });
    return out;
  }
  if (/saw food|smell|someone (is )?eating|family (is )?eating/.test(t)) {
    out.push({ text: evil
      ? `So someone ate in front of you and now you're weak? Leave the room. Brush your teeth. Drink something warm. The urge drops in 10 minutes. Their food, their problem. Your goal, your win. 😈`
      : `That's the hardest trigger 🥺 Seeing or smelling food makes your body release hunger hormones in seconds. It's automatic, not your fault.\n\nStep away for 5 minutes, brush your teeth or chew mint gum if your fast allows, drink something warm. The urge will drop a lot within 10 minutes. You've got this 💪` });
    return out;
  }
  if (anyMatch(MOTIV, t)) {
    const s = stageFor(hours);
    out.push({ text: evil ? pick(EVIL_MOTIV) + ` 😈\n\nRight now your body is in "${s.name}". ${s.fact}` : `${pick(MOTIVATION)} ✨\n\nRight now your body is in "${s.name}". ${s.fact}` });
    return out;
  }
  if (anyMatch(WHY, t)) {
    const s = stageFor(hours);
    out.push({ text: `${s.emoji} Hour ${H}: ${s.name}\n\n${s.body}\n\n${s.fact}\n\nTip: ${s.tip}` });
    return out;
  }
  if (anyMatch(GREET, t)) {
    out.push({ text: evil ? `Oh. You're back${name}. Did you cheat? No? Good. What do you want?` : `Hi${name} 🌸 How are you feeling right now?`,
      quick: ['I feel great', 'Hungry', 'Want to break my fast', 'Dizzy', 'Motivate me'] });
    return out;
  }
  if (/great|amazing|strong|good/.test(t)) {
    out.push({ text: evil ? 'Good. Don\'t get cocky. The fast isn\'t over until it\'s over.' : 'Yay ✨ That\'s your body adapting beautifully. Water, electrolytes, gentle movement. I\'m so proud of you 🫶' });
    return out;
  }
  out.push({ text: evil
    ? `Use your words. Hungry, tired, sick, sad, or do you need me to yell at you a little? If you ever feel faint, chest pain or very sick, tell me right away. That part I'm serious about.`
    : `I hear you 🌸 Tell me a bit more: are you hungry, tired, sick, sad, or do you want some motivation? And if you ever feel faint, chest pain or very sick, tell me right away.`,
    quick: ['Hungry', 'Tired', 'Dizzy', 'Sad', 'Motivate me'] });
  return out;
}
