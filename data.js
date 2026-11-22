// ================= BODY STAGES (hour by hour) =================
// Each stage covers a range of hours. Every hour inside the range shows a
// different fact + tip, so the message changes every hour.
// Timings are typical averages. Every body is different.
const STAGES = [
  { from: 0, to: 4, emoji: '🍽️', name: 'Digesting your last meal',
    body: 'Your body is still using the energy from your last meal. Blood sugar and insulin are high and slowly coming down.',
    facts: [
      'The timer has started. The hardest part, deciding, is already done.',
      'Insulin is moving sugar from your last meal into your cells and liver.',
      'Your stomach is emptying. This usually takes 2 to 4 hours.',
      'Blood sugar is gently returning to your normal level.',
      'Your liver is topping up its glycogen (stored sugar) tank.'
    ],
    tips: ['Drink a glass of water now to start strong.', 'Brush your teeth. It tells your brain the kitchen is closed.', 'Plan something fun for the evening so the hours fly by.'] },
  { from: 4, to: 8, emoji: '📉', name: 'Blood sugar settling',
    body: 'Digestion is mostly done. Insulin is falling, and your body starts switching from storing energy to using it.',
    facts: [
      'Insulin is dropping. Low insulin is the signal that unlocks your fat stores.',
      'Your liver starts releasing stored glycogen to keep blood sugar steady.',
      'Glucagon, the "release energy" hormone, is rising.',
      'You may feel a small hunger wave. It passes in about 20 minutes.'
    ],
    tips: ['Hunger comes in waves, not a rising line. Ride it out with water or tea.', 'Black tea or coffee can calm hunger if your fast allows it.', 'Take a 10 minute walk if you feel restless.'] },
  { from: 8, to: 12, emoji: '🔄', name: 'Glycogen burning',
    body: 'Your body is running on stored glycogen from the liver. Fat burning slowly starts to increase.',
    facts: [
      'Your liver glycogen is being used up. It holds roughly 100 g of sugar.',
      'Fat cells start releasing fatty acids into your blood for fuel.',
      'Growth hormone begins to rise, helping protect your muscle.',
      'Many people feel clear headed here once the first hunger wave is gone.'
    ],
    tips: ['Ghrelin, the hunger hormone, peaks at your usual meal times. Stay busy then.', 'Sip water steadily: about 250 to 300 ml every 1 to 2 hours.', 'Tea with sweetener is fine on a dirty fast.'] },
  { from: 12, to: 16, emoji: '🔥', name: 'Entering fat burning mode',
    body: 'Glycogen is getting low. Your body leans more on fat for fuel and the liver begins making ketones.',
    facts: [
      'Hour 12 and up: your body is shifting into fat burning mode.',
      'Your liver starts making ketones from fat, a clean fuel for brain and muscles.',
      'Insulin is low and stable. Perfect for fat release.',
      'This is the zone 16:8 fasters aim for. You are already here!'
    ],
    tips: ['Add a pinch of salt to your water if you get a headache. Electrolytes!', 'Light walking now uses mostly fat for fuel.', 'Write down WHY you are fasting. Read it when it gets hard.'] },
  { from: 16, to: 24, emoji: '⚡', name: 'Ketosis is starting',
    body: 'Ketone levels are rising. Fat is becoming a major fuel. Cell clean up processes are thought to start increasing.',
    facts: [
      'Ketones are rising in your blood. Your brain is learning to use them.',
      'Research suggests autophagy (cells recycling old parts) increases with longer fasts. Exact timing in humans is still being studied.',
      'Fat burning is higher now than at any point since you started.',
      'Many people report a calm, focused feeling around this time.',
      'At rest your body is using roughly 60 to 70 g of fat per day during a fast.'
    ],
    tips: ['24 hours is a huge milestone. You are almost there!', 'Sleep through the hungry part if it is late. Sleeping hours count.', 'Think about sodium, potassium and magnesium for multi day fasts.'] },
  { from: 24, to: 36, emoji: '🏅', name: 'Day 1 done, deeper ketosis',
    body: 'Liver glycogen is mostly used up. Your body now runs mainly on fat and ketones.',
    facts: [
      '24 hours! Your liver glycogen is mostly empty, so fat is now your main fuel.',
      'Growth hormone can rise a lot during a fast. It helps protect your muscle.',
      'Some water weight leaves as glycogen empties, because glycogen holds water.',
      'Your gut lining is getting a rest from digestion.',
      'Hunger hormones often calm down after day 1. Many say day 2 is easier than they feared.'
    ],
    tips: ['Electrolytes matter now: a pinch of salt in water helps headaches and dizziness.', 'Stand up slowly. Blood pressure can drop on multi day fasts.', 'Pick gentle workouts today: walking, yoga, light dance.'] },
  { from: 36, to: 48, emoji: '🧘', name: 'Fat adapted',
    body: 'Ketones keep climbing. Your brain gets more and more of its energy from ketones.',
    facts: [
      'Your brain can now get a large part of its fuel from ketones.',
      'Insulin sensitivity tends to improve during longer fasts.',
      'Inflammation markers may go down during longer fasts (results vary by study).',
      'The "keto flu" (tired, headache) peaks for some people here. Electrolytes help a lot.'
    ],
    tips: ['Feeling weak? Sit, drink water with a pinch of salt, rest 15 minutes.', 'Feeling faint, chest pain or heart racing? Stop and tell Mochi right now.', 'Two days! Look how far you came.'] },
  { from: 48, to: 72, emoji: '🌙', name: 'Day 2 to 3, deep ketosis',
    body: 'You are in deep ketosis. Hunger is often lower now. Your body is protecting muscle and burning fat.',
    facts: [
      '48 hours! Ketones are now one of your main fuels.',
      'Growth hormone can be several times higher than normal during multi day fasts.',
      'Many people feel LESS hungry on day 3 than on day 1.',
      'Your body is getting very efficient at using fat.',
      'Sleep may feel lighter. That is common and usually temporary.'
    ],
    tips: ['Keep up electrolytes daily: sodium, potassium, magnesium.', 'Low intensity movement only. Skip heavy HIIT from day 3.', 'Celebrate small wins: journal, pray, meditate, call a friend.'] },
  { from: 72, to: 96, emoji: '🌸', name: 'Day 3 to 4, the reset zone',
    body: 'Extended fast territory. Your body is deeply fat adapted. Some studies link this length to immune system changes.',
    facts: [
      '72 hours! Animal studies and early human studies link 3 day fasts with immune cell renewal.',
      'Your body is now very good at protecting protein and burning fat.',
      'Ketones may make you feel super sharp, or tired. Both are normal.',
      'Weight loss on the scale now is a mix of fat, water and gut content.'
    ],
    tips: ['Do a body check: dizzy? faint? heart racing? Tell Mochi.', 'Rest is productive now. Gentle walks, stretching, prayer, reading.', 'Do not stand up fast from bed or the toilet.'] },
  { from: 96, to: 120, emoji: '💎', name: 'Day 4 to 5, strong and steady',
    body: 'You are in a stable fasting state. Your body runs efficiently on fat and needs very little sugar.',
    facts: [
      'Day 4 and up: your metabolism saves energy but keeps burning fat.',
      'Ketones give your brain much of its energy now.',
      'Electrolytes are now the number one safety factor, not hunger.',
      'Your discipline here is rare. Very few people ever get this far.'
    ],
    tips: ['No electrolytes yet today? Have some now.', 'Fainting, confusion or chest pain means break the fast and get help.', 'Start picturing a slow, healthy refeed.'] },
  { from: 120, to: 144, emoji: '👑', name: 'Day 5 to 6, almost there',
    body: 'Very deep fast. Fat is your main fuel. Mental and spiritual focus is often strong here.',
    facts: [
      'Day 5 and up: you have used thousands of calories from your own stored fat.',
      'Your body is in full energy saving mode. Keep activity gentle.',
      'Many spiritual traditions describe days 5 to 7 as the most meaningful.',
      'You are proving to yourself what you are capable of.'
    ],
    tips: ['Plan your refeed: small portions, broth and soft foods first.', 'Do not break with a big sugary meal. After long fasts this can be dangerous (refeeding syndrome).', 'Rest more than usual. Short walks only.'] },
  { from: 144, to: 168, emoji: '🏆', name: 'Day 6 to 7, the final stretch',
    body: 'The last day of a 7 day fast. Your body has fully adapted. Finish gently and plan a careful refeed.',
    facts: [
      'Day 6 to 7: this is where champions are made.',
      'Break a 7 day fast slowly: bone broth, eggs, cooked veggies, small portions.',
      'Your body will hold some water again when you eat. That is normal, not fat.',
      'You built a new level of self discipline that carries into everything.'
    ],
    tips: ['For fasts over 5 days, it is smart to ask a doctor about refeeding.', 'First meal: small. Wait 1 to 2 hours before the next small meal.', 'Be proud. Write down how you feel right now.'] },
  { from: 168, to: 240, emoji: '🌈', name: 'Day 7 to 10, extended fast',
    body: 'You are past 7 days. Your body is fully running on fat, but electrolytes and rest are now critical. A doctor should know you are doing this.',
    facts: [
      '7 days done. Very few people ever reach this. Respect.',
      'Your body is protecting its organs and muscle. Give it rest and minerals.',
      'Refeeding syndrome risk rises the longer you fast. The way you break this fast matters a lot.',
      'Heart rhythm problems can come from low potassium or magnesium. Electrolytes every day.'
    ],
    tips: ['Electrolytes every single day: salt, potassium, magnesium.', 'Dizzy, heart racing, confused or fainting? Stop now and get help.', 'No workouts beyond slow walking.'] },
  { from: 240, to: 99999, emoji: '🕊️', name: 'Day 10 to 15, the long road',
    body: 'This is a very long fast. Medical supervision is strongly recommended. Listen to your body more than to any goal.',
    facts: [
      'Day 10 and up: only do this with a doctor checking on you.',
      'Your mind may feel very clear, but your body is under real stress. Be gentle with it.',
      'Breaking a fast this long should be planned with a doctor: very small portions for several days.',
      'You have already shown incredible discipline. Ending safely is part of the win.'
    ],
    tips: ['Check in with Mochi often. Any warning sign means stop.', 'Plan your refeed now: broth, then soft foods, slowly over days.', 'Rest is your main job now.'] }
];

// ================= HYPE (live numbers, changes every hour) =================
// n = { h, kcal, fatG, name }
const HYPE = [
  n => `You've burned about ${n.kcal} kcal since you started. That's ${(n.kcal / 250).toFixed(1)} donuts your body took from your own stores 🍩`,
  n => `Wow. ${n.h} hours. This is REAL discipline. Most people can't even skip breakfast.`,
  n => `About ${n.fatG} g of fat used as fuel so far. That's ${(n.fatG / 113).toFixed(1)} sticks of butter worth 🧈`,
  n => `You'll thank yourself at the end of this fast. Future you is already proud${n.name ? ', ' + n.name : ''}.`,
  n => `Burgers you said no to so far: ${Math.max(1, Math.floor(n.h / 5))}. Absolute legend 🍔❌`,
  n => `Every hour you burn about ${Math.round(n.kcal / Math.max(1, n.h))} kcal just by existing. Your body is working FOR you.`,
  n => `${n.h} hours of keeping a promise to yourself. That builds a kind of confidence nobody can take away.`,
  n => `That's around ${(n.kcal / 285).toFixed(1)} slices of pizza burned 🍕 and you didn't even have to eat them.`,
  n => `The hunger you felt earlier? Gone. You were stronger than it. Again.`,
  n => `This is the part where most people quit. You're still here. That says everything.`,
  n => `Walking ${Math.round(n.kcal / 50)} km would burn about the same energy you've used. Wow.`,
  n => `Your discipline today is your results next month. Keep stacking hours.`
];

const MOTIVATION = [
  'You are stronger than this craving. 💪',
  'Every hour is a promise you are keeping to yourself.',
  'Hunger is temporary. Pride lasts.',
  'You are not starving. You are healing and recharging.',
  'Your future self is cheering for you right now.',
  'Discipline is choosing what you want MOST over what you want NOW.',
  'One more hour. You can always do one more hour.',
  'You started for a reason. Remember it.',
  'Small steps, every hour. That is how mountains move.',
  'Your body is working hard for you. Be kind to it.',
  'You did not come this far to only come this far.',
  'Body, mind and spirit, all getting stronger today.'
];

function stageFor(h) {
  const s = STAGES.find(x => h >= x.from && h < x.to) || STAGES[STAGES.length - 1];
  const i = Math.max(0, Math.floor(h) - s.from);
  return {
    ...s,
    fact: s.facts[i % s.facts.length],
    tip: s.tips[i % s.tips.length],
    motivation: MOTIVATION[Math.floor(h) % MOTIVATION.length]
  };
}
const hypeFor = n => n.h < 1
  ? `Your fast has begun${n.name ? ', ' + n.name : ''}! From this minute your body starts working for you. You've got this 💪`
  : HYPE[Math.floor(n.h) % HYPE.length](n);

// ================= FAST TYPES =================
const FAST_TYPES = {
  water: { name: 'Water fast', desc: 'Only water (plus electrolytes or a pinch of salt). Nothing else.', allowed: ['Water', 'Sparkling water', 'Electrolytes / pinch of salt'] },
  dirty: { name: 'Dirty fast', desc: 'Zero or very low calorie drinks allowed.', allowed: ['Water', 'Black tea / coffee', 'Sweetener', 'Cola Zero / diet soda', 'Electrolytes', 'Under ~50 kcal a day'] }
};
const FAST_GOALS = [16, 18, 20, 24, 36, 48, 72, 120, 168];

// ================= BODY CHECK =================
const SYMPTOMS = [
  { id: 'none', label: 'All good 😊', level: 0 },
  { id: 'hungry', label: 'Hungry', level: 0 },
  { id: 'tired', label: 'Tired', level: 1 },
  { id: 'headache', label: 'Headache', level: 1 },
  { id: 'cold', label: 'Cold / chills', level: 1 },
  { id: 'cramps', label: 'Muscle cramps', level: 1 },
  { id: 'dizzy', label: 'Dizzy', level: 2 },
  { id: 'nausea', label: 'Nauseous', level: 2 },
  { id: 'shaky', label: 'Shaky / sweaty', level: 2 },
  { id: 'heart', label: 'Heart racing', level: 3 },
  { id: 'chest', label: 'Chest pain', level: 3 },
  { id: 'faint', label: 'Fainted / almost fainted', level: 3 },
  { id: 'confused', label: 'Confused', level: 3 },
  { id: 'breath', label: 'Hard to breathe', level: 3 }
];

// ================= WORKOUTS =================
// MET values: approximate, from the Compendium of Physical Activities.
// kcal = MET x kg x hours. Only workouts that burn 80+ kcal are shown.
// level: simple | medium | max ; who: all | women | men ; goal: loss | gain | both
const WORKOUTS = [
  // ---- Everyone, weight loss ----
  { id: 'walk', name: 'Brisk walk', emoji: '🚶', met: 4.3, min: 45, level: 'simple', who: 'all', goal: 'loss',
    help: 'Best fat burner during a fast. Low intensity uses mostly fat for fuel and is safe on every fasting day.',
    moves: ['Warm up walk', 'Brisk walk', 'Brisk walk + arm swings', 'Power walk', 'Brisk walk', 'Cool down walk'],
    video: 'brisk indoor walking workout 45 minutes' },
  { id: 'lowcardio', name: 'Low impact cardio', emoji: '🦶', met: 5.0, min: 30, level: 'simple', who: 'all', goal: 'loss',
    help: 'Gets your heart going without jumping. Kind to joints and neighbours.',
    moves: ['March in place', 'Step jacks', 'Side steps + arms', 'Knee lifts', 'Slow butt kicks', 'Standing crunch', 'Cool down'],
    video: 'low impact cardio workout 30 minutes no jumping' },
  { id: 'cycle', name: 'Cycling', emoji: '🚴', met: 6.8, min: 40, level: 'medium', who: 'all', goal: 'loss',
    help: 'Strong burn, easy on the knees. Keep it easy on fasting day 2 and up.',
    moves: ['Easy spin', 'Moderate pace', 'Hill', 'Moderate pace', 'Sprint 30s', 'Easy spin'],
    video: 'indoor cycling workout 40 minutes' },
  { id: 'dance', name: 'Dance cardio party', emoji: '💃', met: 6.5, min: 30, level: 'medium', who: 'all', goal: 'loss',
    help: 'Fun means you actually do it. Huge mood boost when motivation is low.',
    moves: ['Warm up groove', 'Combo 1', 'Combo 2', 'Combo 3', 'Freestyle', 'Cool down sway'],
    video: 'dance cardio workout 30 minutes' },
  { id: 'hiit', name: 'Fat burn HIIT', emoji: '⚡', met: 8.0, min: 25, level: 'max', who: 'all', goal: 'loss',
    help: 'Burns the most in the least time. Only when you feel strong, and skip it from fasting day 2.',
    moves: ['Jumping jacks', 'Rest', 'Squat jumps', 'Rest', 'Mountain climbers', 'Rest', 'High knees', 'Rest', 'Burpees', 'Cool down'],
    video: 'fat burning HIIT workout 25 minutes' },
  { id: 'rope', name: 'Jump rope blast', emoji: '🪢', met: 11.0, min: 20, level: 'max', who: 'all', goal: 'loss',
    help: 'One of the highest calorie burns per minute there is. Not on long fast days.',
    moves: ['Basic bounce', 'Rest', 'Alternate feet', 'Rest', 'High knees rope', 'Rest', 'Double speed', 'Cool down'],
    video: 'jump rope workout 20 minutes fat burn' },
  { id: 'run', name: 'Run intervals', emoji: '🏃', met: 9.0, min: 30, level: 'max', who: 'all', goal: 'loss',
    help: 'Running burns big. Intervals make it easier to keep going. Not during multi day fasts.',
    moves: ['Walk warm up', 'Jog', 'Run fast 1 min', 'Walk', 'Run fast 1 min', 'Walk', 'Jog', 'Walk cool down'],
    video: 'beginner running intervals 30 minutes' },
  { id: 'powyoga', name: 'Power yoga', emoji: '🧘', met: 4.0, min: 40, level: 'simple', who: 'all', goal: 'both',
    help: 'Builds strength and lowers stress hormones that make you crave food. Fine on any fasting day.',
    moves: ['Sun salutation A', 'Sun salutation B', 'Warrior flow', 'Chair pose', 'Plank to cobra', 'Boat pose', 'Rest'],
    video: 'power yoga 40 minutes full body' },

  // ---- K-pop ----
  { id: 'kp-bp', name: 'BLACKPINK dance workout', emoji: '🖤', met: 6.5, min: 30, level: 'medium', who: 'all', goal: 'loss', kpop: true,
    help: 'Dance to BLACKPINK hits. Feels like a concert, burns like cardio.',
    moves: ['Warm up', 'How You Like That combo', 'DDU-DU DDU-DU combo', 'Pink Venom combo', 'Freestyle', 'Cool down'],
    video: 'BLACKPINK dance workout 30 minutes' },
  { id: 'kp-bts', name: 'BTS dance workout', emoji: '💜', met: 6.5, min: 30, level: 'medium', who: 'all', goal: 'loss', kpop: true,
    help: 'ARMY cardio. Big moves, big burn, big smile.',
    moves: ['Warm up', 'Dynamite combo', 'Butter combo', 'Fire combo', 'Freestyle', 'Cool down'],
    video: 'BTS dance workout 30 minutes' },
  { id: 'kp-twice', name: 'TWICE & NewJeans easy dance', emoji: '🍭', met: 5.5, min: 30, level: 'simple', who: 'all', goal: 'loss', kpop: true,
    help: 'Cute, easy choreo. Perfect when you are tired but want to move.',
    moves: ['Warm up', 'TT combo', 'Fancy combo', 'Hype Boy combo', 'Super Shy combo', 'Cool down'],
    video: 'TWICE NewJeans easy kpop dance workout' },
  { id: 'kp-skz', name: 'Stray Kids & ATEEZ killer dance', emoji: '🔥', met: 7.8, min: 30, level: 'max', who: 'all', goal: 'loss', kpop: true,
    help: 'High energy, powerful choreo. The most burn of all the K-pop sessions.',
    moves: ['Warm up', 'God\'s Menu combo', 'S-Class combo', 'Guerrilla combo', 'Bouncy combo', 'Cool down'],
    video: 'Stray Kids ATEEZ kpop dance workout high intensity' },
  { id: 'kp-aespa', name: 'aespa & ITZY power dance', emoji: '⚡', met: 7.3, min: 25, level: 'max', who: 'women', goal: 'loss', kpop: true,
    help: 'Girl crush energy. Sharp, strong moves that work legs and core.',
    moves: ['Warm up', 'Next Level combo', 'Supernova combo', 'WANNABE combo', 'DALLA DALLA combo', 'Cool down'],
    video: 'aespa ITZY kpop dance workout' },
  { id: 'kp-idol', name: 'Idol abs & legs routine', emoji: '✨', met: 5.0, min: 25, level: 'medium', who: 'all', goal: 'both', kpop: true,
    help: 'The kind of core and leg routine idols use between practices. Tones while it burns.',
    moves: ['Leg raises', 'Bicycle crunch', 'Plank', 'Squats', 'Side lunges', 'Calf raises', 'Stretch'],
    video: 'kpop idol abs and legs workout' },

  // ---- Women ----
  { id: 'w-pilates', name: 'Pilates sculpt', emoji: '🩰', met: 4.0, min: 30, level: 'simple', who: 'women', goal: 'loss',
    help: 'Long, lean muscle and a strong core. Low impact and fasting friendly.',
    moves: ['Hundred', 'Roll up', 'Leg circles', 'Side kicks', 'Bridge', 'Swan', 'Stretch'],
    video: 'pilates sculpt workout 30 minutes women' },
  { id: 'w-booty', name: 'Booty & legs burn', emoji: '🍑', met: 6.0, min: 30, level: 'medium', who: 'women', goal: 'loss',
    help: 'Big leg muscles burn the most energy. Shape and burn together.',
    moves: ['Sumo squats', 'Glute bridges', 'Reverse lunges', 'Donkey kicks', 'Fire hydrants', 'Squat pulses', 'Stretch'],
    video: 'booty and legs workout 30 minutes fat burn' },
  { id: 'w-hiit', name: 'Hourglass core HIIT', emoji: '⏳', met: 8.0, min: 25, level: 'max', who: 'women', goal: 'loss',
    help: 'Max burn plus core work. Only when you feel strong.',
    moves: ['Jump squats', 'Rest', 'Russian twists', 'Rest', 'Skaters', 'Rest', 'Plank jacks', 'Cool down'],
    video: 'hourglass core HIIT workout women' },
  { id: 'w-tone', name: 'Full body toning', emoji: '🌷', met: 3.8, min: 35, level: 'simple', who: 'women', goal: 'gain',
    help: 'Beginner friendly muscle building. More muscle means you burn more every day, even resting.',
    moves: ['Squats', 'Knee push-ups', 'Glute bridges', 'Bird dog', 'Plank', 'Wall sit', 'Stretch'],
    video: 'full body toning workout beginner women 30 minutes' },
  { id: 'w-glute', name: 'Glute builder', emoji: '🍑', met: 5.0, min: 40, level: 'medium', who: 'women', goal: 'gain',
    help: 'Builds round, strong glutes with bodyweight or dumbbells.',
    moves: ['Hip thrusts', 'Bulgarian split squat', 'Romanian deadlift', 'Kickbacks', 'Step ups', 'Frog pumps', 'Stretch'],
    video: 'glute building workout at home 40 minutes' },
  { id: 'w-strong', name: 'Strong girl strength + HIIT', emoji: '💪', met: 6.0, min: 40, level: 'max', who: 'women', goal: 'gain',
    help: 'Heavy-ish strength sets with cardio bursts. Muscle and burn in one.',
    moves: ['Goblet squats', 'Push-ups', 'Burpees', 'Dumbbell rows', 'Lunges', 'Jump squats', 'Stretch'],
    video: 'strength and HIIT workout women 40 minutes dumbbells' },

  // ---- Men ----
  { id: 'm-box', name: 'Boxing cardio', emoji: '🥊', met: 7.8, min: 30, level: 'medium', who: 'men', goal: 'loss',
    help: 'Shadow boxing burns big and feels powerful. Great stress release.',
    moves: ['Stance + bounce', 'Jab cross', 'Hooks', 'Uppercuts', 'Combos', 'Slip and duck', 'Cool down'],
    video: 'boxing cardio workout 30 minutes at home' },
  { id: 'm-burpee', name: 'Burpee & push-up HIIT', emoji: '🔥', met: 8.5, min: 25, level: 'max', who: 'men', goal: 'loss',
    help: 'Brutal and effective. Max calorie burn. Not on long fast days.',
    moves: ['Burpees', 'Rest', 'Push-ups', 'Rest', 'Squat jumps', 'Rest', 'Mountain climbers', 'Cool down'],
    video: 'burpee push up HIIT workout men' },
  { id: 'm-walkfast', name: 'Incline power walk', emoji: '⛰️', met: 6.0, min: 40, level: 'simple', who: 'men', goal: 'loss',
    help: 'Walking uphill or on stairs burns way more than flat walking, still easy on the body.',
    moves: ['Warm up', 'Incline walk', 'Stairs / steep hill', 'Incline walk', 'Stairs / steep hill', 'Cool down'],
    video: 'incline walking workout 40 minutes' },
  { id: 'm-body', name: 'Beginner muscle builder', emoji: '🏋️', met: 3.8, min: 35, level: 'simple', who: 'men', goal: 'gain',
    help: 'Push-ups, squats and rows with bodyweight. Keeps your muscle while you lose fat.',
    moves: ['Push-ups', 'Squats', 'Table rows', 'Lunges', 'Pike push-ups', 'Plank', 'Stretch'],
    video: 'beginner bodyweight muscle building workout men' },
  { id: 'm-cali', name: 'Calisthenics circuit', emoji: '🤸', met: 7.0, min: 30, level: 'medium', who: 'men', goal: 'gain',
    help: 'Pull-ups, dips and push-ups. Real strength and a big burn.',
    moves: ['Pull-ups', 'Dips', 'Push-ups', 'Jump squats', 'Hanging knee raises', 'Plank', 'Stretch'],
    video: 'calisthenics circuit workout 30 minutes' },
  { id: 'm-dumb', name: 'Heavy dumbbell full body', emoji: '🦾', met: 6.0, min: 45, level: 'max', who: 'men', goal: 'gain',
    help: 'Heavy compound lifts for maximum muscle. Best on eating days or early in a fast.',
    moves: ['Dumbbell squats', 'Bench / floor press', 'Bent over rows', 'Overhead press', 'Romanian deadlift', 'Curls + triceps', 'Stretch'],
    video: 'dumbbell full body workout muscle gain 45 minutes' }
];

// ================= EXAMPLE DAY PLANS =================
const DEFAULT_TEMPLATES = {
  student: { name: '🎒 Student day', items: [
    { time: '07:00', title: 'Wake up', why: 'A fresh start. Your first water reminder comes right after.', alarm: true },
    { time: '07:30', title: 'Leave for school', why: 'Take your water bottle with you.', alarm: true },
    { time: '13:00', title: 'Lunch break walk', why: 'Steps + fresh air instead of the cafeteria.', alarm: false },
    { time: '15:30', title: 'Home, snack or tea', why: 'A planned break so you don\'t graze.', alarm: false },
    { time: '16:00', title: 'Homework block', why: 'Do the hard subject first while your brain is fresh.', alarm: false },
    { time: '18:00', title: 'Workout', why: 'Moving after studying resets your brain.', alarm: true },
    { time: '22:30', title: 'Phone away, sleep', why: 'Good sleep means fewer cravings tomorrow.', alarm: false }
  ]},
  worker: { name: '💼 Work day', items: [
    { time: '06:30', title: 'Wake up', why: 'An early start wins the day.', alarm: true },
    { time: '07:30', title: 'Leave for work', why: 'Bring your water bottle.', alarm: true },
    { time: '12:30', title: '15 min walk on break', why: 'Steps and a clear head for the afternoon.', alarm: false },
    { time: '15:00', title: 'Tea or coffee', why: 'Beats the afternoon slump.', alarm: false },
    { time: '17:30', title: 'Home + change clothes', why: 'Switch into evening mode.', alarm: false },
    { time: '18:30', title: 'Workout', why: 'Burns stress from work and calories.', alarm: true },
    { time: '20:00', title: 'Electrolytes: pinch of salt', why: 'Salt, potassium and magnesium keep you safe on fasting days.', alarm: false },
    { time: '23:00', title: 'Sleep', why: 'Recovery is part of the plan.', alarm: false }
  ]},
  free: { name: '🌤️ Free time day', items: [
    { time: '09:30', title: 'Wake up', why: 'Good morning! Water reminders start soon.', alarm: true },
    { time: '10:30', title: 'Workout', why: 'Morning movement sets the mood for the day.', alarm: true },
    { time: '14:00', title: 'Hobby time', why: 'Gaming, drawing, reading, whatever you love.', alarm: false },
    { time: '16:00', title: 'Long walk', why: 'Steps burn mostly fat when you are fasting.', alarm: true },
    { time: '18:00', title: 'Tea or zero drink', why: 'A little treat that keeps you on track.', alarm: false },
    { time: '20:00', title: 'Movie or series', why: 'Rest is earned.', alarm: false },
    { time: '23:00', title: 'Sleep', why: 'Good sleep means fewer cravings tomorrow.', alarm: false }
  ]},
  blank: { name: '✏️ My own plan (empty)', items: [] }
};

// ================= SCIENCE + HOW YOU MIGHT FEEL (per stage) =================
// Real, published studies. Summaries are simplified; timings vary person to person.
const SCIENCE = {
  0:   { feel: 'Full, maybe a bit sleepy. Totally normal after eating.',
         study: [{ src: 'Basic human physiology', text: 'After a meal, insulin rises within minutes and moves sugar into your liver and muscles to be stored as glycogen.' }] },
  4:   { feel: 'The first light hunger pang may show up. It is a wave, not a wall.',
         study: [{ src: 'Natalucci et al., 2005, European Journal of Endocrinology', text: 'During a 24 hour fast, the hunger hormone ghrelin still rose at people\'s usual meal times, then fell again on its own without any food. Hunger comes in waves.' }] },
  8:   { feel: 'Clear headed between hunger waves. Maybe a little cold.',
         study: [{ src: 'Rothman et al., 1991, Science', text: 'Using magnetic resonance scans, researchers watched liver glycogen drain steadily during the first day of fasting while the body started making its own new glucose.' }] },
  12:  { feel: 'Hungry at meal times, calmer in between. Energy steadier than you expected.',
         study: [{ src: 'Anton et al., 2018, Obesity', text: 'The "metabolic switch" from burning sugar to burning fat and ketones usually happens 12 to 36 hours after the last meal. You are flipping it right now.' }] },
  16:  { feel: 'Focus often improves. Some people feel light and calm.',
         study: [{ src: 'de Cabo & Mattson, 2019, New England Journal of Medicine', text: 'This review describes how fasting periods switch on stress-resistance and repair programs in cells and improve insulin sensitivity.' },
                 { src: 'Alirezaei et al., 2010, Autophagy', text: 'In mice, short-term fasting (24 to 48 hours) strongly boosted autophagy, the cell clean-up process, even in brain cells.' }] },
  24:  { feel: 'Day 1 done! A small headache is common. Salt water helps.',
         study: [{ src: 'Zauner et al., 2000, American Journal of Clinical Nutrition', text: 'In healthy people, resting metabolism actually went UP during the first days of fasting, driven by noradrenaline. Your metabolism is not crashing.' }] },
  36:  { feel: 'Hunger often quieter. Maybe tired in the afternoon.',
         study: [{ src: 'Ho et al., 1988, Journal of Clinical Investigation', text: 'Growth hormone secretion rose several times above normal during fasting. Growth hormone helps protect your muscle while fat is burned.' }] },
  48:  { feel: 'Many people say day 2 to 3 is easier than day 1. Sleep may be lighter.',
         study: [{ src: 'Owen et al., 1967, Journal of Clinical Investigation', text: 'In longer fasts, the brain got most of its energy from ketones instead of sugar. Your brain is switching fuel too.' },
                 { src: 'Cahill, 2006, Annual Review of Nutrition', text: 'Ketones let the body spare its protein during fasting, which is why fat, not muscle, becomes the main fuel.' }] },
  72:  { feel: 'Mentally sharp or a bit drained. Both are normal. Move slowly.',
         study: [{ src: 'Cheng et al., 2014, Cell Stem Cell', text: 'In mice, fasts of 2 to 4 days lowered IGF-1 and triggered stem cell based renewal of the immune system. Early human data pointed the same way.' }] },
  96:  { feel: 'Steady and calm, but your body needs minerals every day now.',
         study: [{ src: 'Wilhelmi de Toledo et al., 2019, PLOS ONE', text: 'In 1,422 people fasting 4 to 21 days in a supervised clinic, weight, blood pressure and wellbeing improved, and fasting was well tolerated with medical support.' }] },
  120: { feel: 'Low energy for exercise, but often a strong mind.',
         study: [{ src: 'Kerndt et al., 1982, Western Journal of Medicine', text: 'Long fasts are generally tolerated in healthy people, but electrolytes (sodium, potassium, magnesium) need watching. That is your number one job now.' }] },
  144: { feel: 'You can see the finish line. Start planning a gentle refeed.',
         study: [{ src: 'Mehanna et al., 2008, BMJ', text: 'After long fasts, eating too much too fast can cause refeeding syndrome. Restart food slowly: small portions over a few days.' }] },
  168: { feel: 'Very deep fast. Rest is your main job.',
         study: [{ src: 'Mehanna et al., 2008, BMJ', text: 'Refeeding risk rises with fast length. Fasts this long are best done with a doctor checking in.' }] },
  240: { feel: 'Listen to your body above any goal.',
         study: [{ src: 'Wilhelmi de Toledo et al., 2019, PLOS ONE', text: 'Fasts up to 21 days were safe in that study because they were medically supervised. Supervision is the key word.' }] }
};
function scienceFor(h) {
  const keys = Object.keys(SCIENCE).map(Number).filter(k => k <= h).sort((a, b) => b - a);
  const s = SCIENCE[keys[0] ?? 0];
  return { feel: s.feel, study: s.study[Math.floor(h) % s.study.length] };
}

// ================= BODY METERS (estimates from research curves, not measured) =================
const clamp = v => Math.max(0, Math.min(100, v));
function bodyMeters(h) {
  return [
    { name: 'Blood sugar', emoji: '🩸', v: clamp(100 - 45 * (1 - Math.exp(-h / 10))), trend: 'down' },
    { name: 'Insulin', emoji: '🔑', v: clamp(100 * Math.exp(-h / 7) + 8), trend: 'down' },
    { name: 'Liver glycogen', emoji: '🔋', v: clamp(100 - h * 3.6), trend: 'down' },
    { name: 'Fat burning', emoji: '🔥', v: clamp(12 + 85 * (1 - Math.exp(-h / 16))), trend: 'up' },
    { name: 'Ketones', emoji: '⚡', v: clamp(h < 10 ? 2 : 100 * (1 - Math.exp(-(h - 10) / 40))), trend: 'up' },
    { name: 'Growth hormone', emoji: '💪', v: clamp(15 + 85 * (1 - Math.exp(-h / 24))), trend: 'up' },
    { name: 'Cell clean-up', emoji: '♻️', v: clamp(h < 14 ? 4 : 100 * (1 - Math.exp(-(h - 14) / 30))), trend: 'up', est: true }
  ];
}
