// ================= MOCHI (rule based, works offline) =================
// Two personalities:
//   sweet: gentle, therapist style
//   evil:  harsh "toxic" tough love (user must accept terms first)
// Safety rules ALWAYS win over personality:
//   red flag symptoms -> stop the fast + call emergency (Evil Mochi drops the act)
//   feeling sick      -> gentle steps, break the fast if it doesn't pass
//   sad / eating disorder / self harm signs -> Evil Mochi drops the act and is kind
// Lines never repeat until most of the other lines for that mood were used.

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
const QUIT = [/want(ed)? to (break|stop|quit|give up)/, /break (my|the) fast/, /give up|quit|can'?t do (this|it)/];
const HUNGRY = [/hungry|starving|hunger/, /crav/, /want(ed)? to eat/, /food|pizza|burger|chocolate|snack|\beat\b|\beating\b/];
const SAD = [/sad|depress|cry|lonely|alone|anxious|anxiety|stress|overwhelm|upset/];
const BORED = [/bored|boring|nothing to do/];
const ED = [/hate (my|myself|my body)|disgusting|purg|make myself (sick|throw up)|deserve to starve|punish|kill myself|want to die|suicid|hurt myself|self ?harm/];
const MOTIV = [/motivat|inspire|push me|help me (stay|keep)|keep going|roast me/];
const WHY = [/why.*fast|benefit|what('?s| is) happening|my body/];
const GREET = [/^(hi|hey|hello|yo|salam|hallo|hola)\b/];
const BETTER = [/better|good now|fine now|okay now|ok now|i'?m ok|i'?m good/];
const MEDICAL = [/diabet|insulin|pregnan|breastfeed|eating disorder|anorex|bulimi|heart condition|blood thinner|kidney/];

const anyMatch = (list, t) => list.some(r => r.test(t));
const pick = a => a[Math.floor(Math.random() * a.length)];

// Pick a line that was not used recently for this mood
function fresh(ctx, key, arr, n) {
  const used = (ctx.used[key] = ctx.used[key] || []);
  const keep = Math.max(0, Math.min(arr.length - 1, 8));
  let options = arr.map((_, i) => i).filter(i => !used.includes(i));
  if (!options.length) options = arr.map((_, i) => i);
  const i = pick(options);
  used.push(i); while (used.length > keep) used.shift();
  const line = arr[i];
  return typeof line === 'function' ? line(n) : line;
}

// ---------- EVIL MOCHI LINES ----------
const EVIL = {
  hungry: [
    n => `Hungry? With all that fat? How?? Your body packed weeks of snacks on you already. Eat THAT.`,
    n => `You're "starving"? Babe, you're carrying a whole backup buffet around your waist. Use it.`,
    n => `${n.H} hours and you're crying for food? Your love handles ARE lunch. Go burn them.`,
    n => `Oh no, the person with a fully loaded fat storage account is hungry. Tragic. Make a withdrawal.`,
    n => `You want MORE food? Your body is sitting on thousands of stored calories and you want to add some? Bold.`,
    n => `Your stomach growls, your belly fat laughs at you. Drink water and make it stop laughing.`,
    n => `Hungry is just your fat begging you not to burn it. Don't listen to the fat.`,
    n => `Imagine eating now and staying exactly like this forever. Yeah. Didn't think so.`,
    n => `Your body has been saving snacks for years and THIS is when you want new ones? Spend your savings.`,
    n => `Wow. Hungry. Groundbreaking. Every faster ever is hungry. The winners just don't cry about it to a bunny.`,
    n => `Hungry? Look down. That's not a stomach, that's a pantry. Open it.`,
    n => `You've burned about ${n.kcal} kcal and you want to undo it for a sandwich? Smart. Really smart. 🙄`
  ],
  hungryAsk: [
    'So: real stomach hunger, or are you just bored, tired, stressed or staring at food again?',
    'Be honest. Actual hunger, or your brain throwing a tantrum?',
    'Tell me what it really is, and don\'t lie to me. I can smell excuses.'
  ],
  quit: [
    n => `Quit? After ${n.H} hours? So all that suffering was for NOTHING? Great plan, genius.`,
    n => `Sure, give up. Then start from zero again next week and cry about it. Classic you.`,
    n => `Every time you quit, your fat throws a party. Stop sending it invitations.`,
    n => `You said you wanted this. Was that a lie, or are you just weak today?`,
    n => `Breaking your fast because it's "hard"? It's supposed to be hard. That's why your body still looks like this.`,
    n => `Go ahead, eat. And tomorrow, look in the mirror and explain to yourself why you quit at hour ${n.H}.`,
    n => `Quitting is the easiest thing in the world. That's why everyone does it. Be less like everyone.`,
    n => `You didn't come this far to fold like a lawn chair. Sit down. Drink water.`
  ],
  stomach: [
    n => `Real hunger comes in waves. 15 to 20 minutes and it's gone. You've survived worse than 20 minutes.\n• 300 ml water, sparkling if you have it\n• ${n.drink}\n• Hands busy for 20 minutes\nIf you actually feel SICK, not just hungry, tell me. Otherwise I'll see you in 20 minutes, still fasting. 😈`,
    n => `Fine, it's real hunger. Congratulations, your body works. Now:\n• Drink 300 ml water\n• ${n.drink}\n• Set a 20 minute timer and suffer productively\nSick? Tell me. Just hungry? Deal with it.`,
    n => `Stomach hunger peaks and then leaves, like your motivation usually does. Except this time YOU stay.\n• Water. Now.\n• ${n.drink}\n• 20 minute timer, go do something\nFeel sick? Then tell me. That's the only exit.`
  ],
  bored: [
    'Bored is not hunger, genius. The fridge is not a TV show.\n\nPick one: 🎮 project or game for 25 min, 🎬 movie with tea, 📚 study block, 🚶 15 min walk, 🙏 prayer or journaling. Go.',
    'You\'re bored so you want to eat? That\'s how you got here in the first place. Go walk. Steps count, chips don\'t.',
    'Bored? Clean your room. Do 20 squats. Build your game. Literally anything that isn\'t chewing.',
    'Boredom eating is just snacking with extra steps. Find a hobby that doesn\'t have calories.',
    'If you have time to be bored, you have time to work out. Move tab. Now.'
  ],
  tired: [
    'Tired? Then nap. Lying on the couch is still fasting. Eating is not a nap.',
    'Rest, fine. But rest with water in your hand, not a fork.',
    'Tired is normal. Lie down 20 minutes, pinch of salt in your water, stop whining. Dizzy too? Then tell me for real.',
    'Your body is working hard burning that fat. Let it. Go lie down and let it cook.'
  ],
  food: [
    'Someone ate in front of you and now you\'re weak? Leave the room. Their food, their problem. Your goal, your win.',
    'Staring at food won\'t make it yours. Turn around. Brush your teeth. The urge dies in 10 minutes.',
    'Smelled something good? So did your fat, and it\'s rooting for you to fail. Don\'t give it the win.',
    'You\'re not hungry, you\'re just nosy about other people\'s plates. Go away from the kitchen.'
  ],
  better: [
    'Good. See? You\'re tougher than you act. Water, electrolytes, no drama.',
    'Look at you, surviving. Shocking. Keep going.',
    'Better? Then stop texting me and go be productive.'
  ],
  great: [
    'Good. Don\'t get cocky. The fast isn\'t over until it\'s over.',
    'Feeling great? Finally. Now keep that energy and don\'t ruin it at 2 am.',
    'Nice. Screenshot this feeling so you remember it when you\'re whining in 3 hours.',
    'Great? Then you clearly have energy for a workout. Move tab. Go.'
  ],
  greet: [
    n => `Oh. You're back${n.name}. Did you cheat? No? Good. What do you want?`,
    n => `Look who it is${n.name}. Still fasting or did you fold already?`,
    n => `Hi. ${n.H ? n.H + ' hours in. ' : ''}Don't make me regret answering.`,
    n => `What now${n.name}? Make it quick, I'm busy judging you.`
  ],
  motiv: [
    'The fridge doesn\'t love you. Your goals do. Drink your water.',
    'You said you wanted results. Results don\'t come from midnight snacks.',
    'Your excuses are louder than your stomach. Shut both up.',
    'Nobody is coming to do this for you. Not me, not your mom, not the pizza guy.',
    'Champions are built in the hours nobody claps for. This is one of those hours.',
    'Yes, it\'s hard. That\'s the point. Easy things never changed anybody.',
    'Every hour you push through, your old body loses. Keep winning.',
    'You want to look different? Then stop acting the same.',
    'Your future body is watching. Don\'t embarrass it.',
    'Remember the last photo you hated? Yeah. Keep fasting.',
    'Discipline now, or regret later. Regret tastes worse than hunger.',
    'Your fat isn\'t going to burn itself. Oh wait, it is. If you SHUT UP and keep fasting.',
    'Weak people eat when it\'s hard. You\'re not weak. Prove it.',
    'The scale doesn\'t care about your feelings. Neither do I. Keep going.'
  ],
  other: [
    'Use your words. Hungry, tired, sick, sad, or do you need me to yell at you a little?',
    'I don\'t speak whatever that was. Hungry? Bored? Want a roast?',
    'Okay and? Say what you actually feel so I can roast it properly.',
    'Cool story. Now tell me: hungry, tired, bored, or sick?'
  ]
};

// ---------- SWEET MOCHI LINES ----------
const SWEET = {
  hungry: [
    n => `It's okay to feel this 🌸 Wanting to eat doesn't mean you're weak. It means you're human.`,
    n => `Hunger is so hard, I know 🥺 ${n.H ? `You've already done ${n.H} hours, and that's amazing. ` : ''}Let's figure this out together.`,
    n => `Thank you for telling me instead of just giving in 🫶 That already shows how strong you are.`,
    n => `Aww, your tummy is talking 🐰 That's okay. It's just a signal, not an order.`
  ],
  hungryAsk: [
    'Can I ask gently: is it hunger in your stomach, or more boredom, tiredness, stress, or seeing food?',
    'What do you think it is right now? Real tummy hunger, or something else like stress or boredom?',
    'Let\'s check together: stomach hunger, or is your mind looking for comfort?'
  ],
  quit: [
    n => `I hear you 🌸 It's okay that it feels hard. ${n.H ? `You've already given ${n.H} hours, and that matters no matter what.` : ''}`,
    n => `Before you decide, let's breathe together for a second 🫶 Breaking a fast is always allowed, but let's make sure it's what you really want.`,
    n => `You're allowed to stop any time, and I'll never judge you 🐰 Let's just check why you want to.`
  ],
  stomach: [
    n => `Thank you for noticing that 🥺 Real hunger comes in WAVES. It usually peaks for 15 to 20 minutes, then fades.\n\nLet's ride this wave together:\n• Drink 300 ml water (sparkling helps)\n• ${n.drink}\n• Set a 20 minute timer and keep your hands busy\n\nIf you feel truly unwell, not just hungry, tell me "I feel sick".`,
    n => `Okay, tummy hunger 🌸 That's your body being normal. Here's what helps:\n• A big glass of water\n• ${n.drink}\n• A short walk or something fun for 20 minutes\n\nThe wave will pass, I promise. And if you feel sick, tell me right away.`
  ],
  bored: [
    'Boredom is the sneakiest hunger 🌸 Your brain wants a little dopamine, not food.\n\nTry one: 🎮 a game or project, 🎬 a movie with tea, 📚 a study block, 🚶 a short walk, 🙏 prayer or journaling.',
    'Bored brains love snacks 🐰 How about something fun with your hands for 25 minutes? Drawing, gaming, building, cleaning with music?',
    'Let\'s make boredom useful 🌷 A walk adds steps, a study block adds progress, a movie adds rest. Which one feels nice?'
  ],
  tired: [
    'Being tired on a fast is really common 🫶 Lie down for 20 minutes, sip water with a pinch of salt, and skip hard workouts today.',
    'Rest is part of the plan 🌙 Your body is working hard. A little nap is a great idea. Tell me if you also feel dizzy.',
    'Aww, sleepy 🐰 Cozy up with water or tea. Gentle day today. You\'re doing great.'
  ],
  food: [
    'That\'s the hardest trigger 🥺 Seeing or smelling food makes your body release hunger hormones in seconds. It\'s automatic, not your fault.\n\nStep away for 5 minutes, brush your teeth, drink something warm. The urge drops a lot in 10 minutes.',
    'Oh, that\'s so tough 🌸 Your brain reacts to food on its own. Go to another room, put on music, and give it 10 minutes. You\'ve got this 💪'
  ],
  better: [
    'I\'m so glad 🌸 Keep sipping water with electrolytes, keep moving gently today, and tell me right away if anything feels off.',
    'Yay, that makes me happy 🐰 Take it easy, and I\'m right here if you need me.',
    'Phew 🫶 Proud of you for taking care of yourself.'
  ],
  great: [
    'Yay ✨ That\'s your body adapting beautifully. I\'m so proud of you 🫶',
    'Love that for you 🌸 Remember this feeling, it\'s what you\'re working for.',
    'You\'re glowing 🌷 Keep going, gentle and steady.'
  ],
  greet: [
    n => `Hi${n.name} 🌸 How are you feeling right now?`,
    n => `Hello${n.name} 🐰 I missed you! How's your body doing?`,
    n => `Hey you 🫶 ${n.H ? n.H + ' hours already! ' : ''}How are you?`
  ],
  other: [
    'I hear you 🌸 Tell me a bit more: are you hungry, tired, sick, sad, or do you want some motivation?',
    'I\'m listening 🐰 How does your body feel right now?',
    'Tell me what\'s going on 🫶 No judgement, ever.'
  ]
};

function buddyReply(text, ctx) {
  const t = text.toLowerCase();
  const evil = ctx.persona === 'evil';
  const L = evil ? EVIL : SWEET;
  const hours = ctx.hours;
  const H = Math.floor(hours);
  const name = ctx.name ? ', ' + ctx.name : '';
  const n = { H, name, kcal: ctx.kcal || 0, drink: ctx.fastType === 'dirty' ? 'Black tea or a Cola Zero is allowed for you' : 'A pinch of salt in water. Hunger is sometimes low sodium' };
  const say = key => fresh(ctx, (evil ? 'e_' : 's_') + key, L[key], n);
  const Q = ['Stomach hunger', 'Bored', 'Stressed / sad', 'Saw food', 'I feel sick'];
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
      `Thank you for telling me that 🫶 I hear a lot of pain in those words, and you deserve kindness, especially from yourself.\n\nFasting should never be a punishment. If food, your body or fasting feel like a fight, please talk to someone you trust or a doctor or therapist. If you ever think about hurting yourself, call your local emergency number or a crisis line right away. You don't have to carry this alone.` +
      (evil ? '\n\nAnd if Evil Mochi is making you feel bad for real, switch to Sweet Mochi. No shame in that.' : '') });
    return out;
  }

  // 3. Medical conditions
  if (anyMatch(MEDICAL, t)) {
    out.push({ text: `That's important. With diabetes, insulin or other medication, pregnancy or breastfeeding, an eating disorder history, or heart or kidney problems, long fasts can be risky. Please check with your doctor before fasting more than a day. If your sugar feels low (shaky, sweaty, confused), break the fast now.` });
    return out;
  }

  // 4. Feeling sick, not red flag: gentle in both modes
  if (anyMatch(SICK, t)) {
    out.push({ text: (evil ? 'Fine, I\'ll be nice for a second. Your health beats my attitude.\n\n' : 'Oh no, I\'m sorry you feel this way 🥺 Let\'s take care of you first.\n\n') +
      `Try this for the next 15 minutes:\n1. Sit or lie down. Stand up slowly later.\n2. Drink a glass of water with a small pinch of salt. Electrolytes help dizziness and headaches a lot.\n3. Breathe slowly: in for 4 seconds, out for 6.\n4. Check again in 15 minutes.\n\n` +
      `If it goes away, you can keep going gently. No hard workout today.\nIf it gets worse, you faint, feel very sick, your heart races or you get confused: break your fast with something small and get help if needed. Your health comes first, always.` });
    out.push({ text: `Tell me in 15 minutes how you feel.`, quick: ['Better now', 'Still bad', 'I fainted'] });
    return out;
  }

  if (/still bad|not better|worse|getting worse/.test(t)) {
    out.push({ text: `Thank you for being honest 🫶 Since it isn't getting better, it's time to gently break your fast today.\n\nStart small: a cup of broth or a little juice, wait 30 to 60 minutes, then a small soft meal (eggs, yogurt, soup). If you get worse, faint, or have chest pain, call emergency services.\n\nYou didn't fail. You listened to your body, and that's real strength.`, call: true });
    return out;
  }

  // 5. Sad: Evil drops the act
  if (anyMatch(SAD, t)) {
    out.push({ text: (evil ? 'Okay, roasting paused. You matter more than a fast.\n\n' : '') +
      `I'm really glad you told me 🫶 Fasting can bring up feelings. Lower blood sugar makes emotions louder, so be gentle with yourself.\n\nLet's breathe together: in for 4, hold for 4, out for 6. Three times.\n\nWhat's on your mind? I'm listening. If the sadness feels heavy or doesn't go away, talking to someone you trust or a professional is a sign of strength.` });
    return out;
  }

  if (anyMatch(BETTER, t)) { out.push({ text: say('better') }); return out; }

  if (/stomach hunger|real hunger|physically hungry/.test(t)) { out.push({ text: say('stomach') }); return out; }

  // 6. Want to quit / hungry
  if (anyMatch(QUIT, t)) {
    const reason = ctx.reason ? `\n\nYou told me you're fasting for: "${ctx.reason}". ${evil ? 'Or was that just talk?' : 'Hold on to that 🌸'}` : '';
    out.push({ text: say('quit') + reason + '\n\n' + say('hungryAsk'), quick: Q });
    return out;
  }
  if (anyMatch(HUNGRY, t)) {
    out.push({ text: say('hungry') + '\n\n' + say('hungryAsk'), quick: Q });
    return out;
  }
  if (anyMatch(BORED, t)) { out.push({ text: say('bored') }); return out; }
  if (anyMatch(TIRED, t)) { out.push({ text: say('tired') }); return out; }
  if (/saw food|smell|someone (is )?eating|family (is )?eating/.test(t)) { out.push({ text: say('food') }); return out; }
  if (anyMatch(MOTIV, t)) {
    const s = stageFor(hours);
    const line = evil ? say('motiv') + ' 😈' : fresh(ctx, 's_motiv', MOTIVATION, n) + ' ✨';
    out.push({ text: `${line}\n\nRight now your body is in "${s.name}". ${s.fact}` });
    return out;
  }
  if (anyMatch(WHY, t)) {
    const s = stageFor(hours);
    out.push({ text: `${s.emoji} Hour ${H}: ${s.name}\n\n${s.body}\n\n${s.fact}\n\nTip: ${s.tip}` });
    return out;
  }
  if (anyMatch(GREET, t)) { out.push({ text: say('greet'), quick: ['I feel great', 'Hungry', 'Want to break my fast', 'Dizzy', 'Motivate me'] }); return out; }
  if (/great|amazing|strong|good/.test(t)) { out.push({ text: say('great') }); return out; }
  out.push({ text: say('other') + '\n\nIf you ever feel faint, chest pain or very sick, tell me right away.' + (evil ? ' That part I\'m serious about.' : ''),
    quick: ['Hungry', 'Tired', 'Dizzy', 'Sad', 'Motivate me'] });
  return out;
}
