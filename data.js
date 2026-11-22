// ================= BODY STAGES (hour by hour) =================
// Each stage covers a range of hours. Every hour inside the range shows a
// different "fact" + "tip" + "motivation", so the message changes every hour.
// Timings are typical averages; every body is different.
const STAGES = [
  { from: 0, to: 4, emoji: '🍽️', name: 'Digesting your last meal',
    body: 'Your body is still using the energy from your last meal. Blood sugar and insulin are elevated and slowly coming down.',
    facts: [
      'Hour 0: The timer has started — the hardest part (deciding) is already done.',
      'Insulin is moving sugar from your last meal into your cells and liver.',
      'Your stomach is emptying — this usually takes 2–4 hours.',
      'Blood sugar is gently returning toward your normal baseline.',
      'Your liver is topping up its glycogen (stored sugar) tank.'
    ],
    tips: ['Drink a glass of water now to start strong.', 'Brush your teeth — it signals "kitchen closed" to your brain.', 'Plan something fun for the evening so hours fly by.'] },
  { from: 4, to: 8, emoji: '📉', name: 'Blood sugar settling',
    body: 'Digestion is mostly done. Insulin is falling, and your body starts to switch from "storing" to "using" energy.',
    facts: [
      'Insulin is dropping — low insulin is the signal that unlocks fat stores.',
      'Your liver starts releasing stored glycogen to keep blood sugar steady.',
      'Glucagon (the "release energy" hormone) is rising.',
      'You may feel a small hunger wave — it passes in about 20 minutes.'
    ],
    tips: ['Hunger comes in waves, not a rising line. Ride it out with water or tea.', 'Black tea or coffee can blunt hunger (if allowed in your fast).', 'Take a 10-minute walk if you feel restless.'] },
  { from: 8, to: 12, emoji: '🔄', name: 'Glycogen burning',
    body: 'Your body is running on stored glycogen from the liver. Fat burning slowly starts to increase.',
    facts: [
      'Your liver glycogen is being used up — it holds roughly 100 g of sugar.',
      'Fat cells start releasing fatty acids into your blood for fuel.',
      'Your growth hormone begins to rise, helping protect muscle.',
      'Many people feel clear-headed here once the first hunger wave is gone.'
    ],
    tips: ['Ghrelin (hunger hormone) peaks at your usual meal times — stay busy then.', 'Sip water steadily: about 250–300 ml every 1–2 hours.', 'Tea with sweetener is fine on a dirty fast.'] },
  { from: 12, to: 16, emoji: '🔥', name: 'Entering fat-burning mode',
    body: 'Glycogen is getting low. Your body leans more on fat for fuel and the liver begins making ketones.',
    facts: [
      'Hour 12+: your body is shifting into the metabolic state many call "fat-burning mode".',
      'Your liver starts producing ketones from fat — a clean fuel for brain and muscles.',
      'Insulin is low and stable — great for fat release.',
      'This is the zone 16:8 fasters aim for. You are already here!'
    ],
    tips: ['Add a pinch of salt to water if you get a headache (electrolytes!).', 'Light walking now uses mostly fat for fuel.', 'Write down WHY you are fasting — read it when it gets hard.'] },
  { from: 16, to: 24, emoji: '⚡', name: 'Ketosis is starting',
    body: 'Ketone levels are rising. Fat is becoming a major fuel source. Cell clean-up processes are thought to start increasing.',
    facts: [
      'Ketones are rising in your blood — your brain is learning to use them.',
      'Research suggests autophagy (cells recycling old parts) increases with longer fasts — exact timing in humans is still being studied.',
      'Fat oxidation is higher now than at any point since you started.',
      'Many people report a calm, focused feeling around this time.',
      'Your body is using roughly 60–70 g of fat per day at rest during a fast.'
    ],
    tips: ['Getting to 24h is a huge milestone — you are almost there!', 'Sleep through the hungry part if it is late — sleeping hours count.', 'Keep sodium, potassium and magnesium in mind for multi-day fasts.'] },
  { from: 24, to: 36, emoji: '🏅', name: 'Day 1 complete — deeper ketosis',
    body: 'Liver glycogen is largely used up. Your body is now mainly running on fat and ketones.',
    facts: [
      '24 hours! Liver glycogen is mostly empty, so fat is now your main fuel.',
      'Growth hormone can rise significantly in a fast — it helps protect your muscle.',
      'Some water weight leaves your body as glycogen empties (glycogen holds water).',
      'Your gut lining is getting a rest from digestion.',
      'Hunger hormones often calm down after day 1 — many say day 2 is easier than they feared.'
    ],
    tips: ['Electrolytes matter now: a pinch of salt in water helps headaches & dizziness.', 'Stand up slowly — blood pressure can drop on multi-day fasts.', 'Choose gentle workouts today: walking, yoga, stretching.'] },
  { from: 36, to: 48, emoji: '🧘', name: 'Fat adaptation',
    body: 'Ketones keep climbing. Your brain is getting a bigger share of its energy from ketones.',
    facts: [
      'Your brain can now get a large share of its fuel from ketones.',
      'Insulin sensitivity tends to improve during extended fasting.',
      'Inflammation markers may decrease during longer fasts (results vary by study).',
      'The "keto flu" (tired, headache) peaks for some people here — electrolytes help a lot.'
    ],
    tips: ['If you feel weak: sit, drink water with a pinch of salt, rest 15 min.', 'If you feel faint, have chest pain or heart racing — stop and tell Mochi/chat now.', 'Two days! Look how far you came.'] },
  { from: 48, to: 72, emoji: '🌙', name: 'Day 2–3 — deep ketosis',
    body: 'You are in deep ketosis. Hunger is often lower now. Your body is protecting muscle and burning fat.',
    facts: [
      '48 hours! Ketones are well established as a main fuel.',
      'Growth hormone levels can be several times higher than normal during multi-day fasts.',
      'Many people notice hunger is LOWER on day 3 than on day 1.',
      'Your body is getting very efficient at using fat.',
      'Sleep may feel lighter — that is common and usually temporary.'
    ],
    tips: ['Keep up electrolytes daily (sodium, potassium, magnesium).', 'Low-intensity movement only — skip heavy HIIT on day 3+.', 'Celebrate small wins: journal, pray, meditate, call a friend.'] },
  { from: 72, to: 96, emoji: '🌸', name: 'Day 3–4 — the reset zone',
    body: 'Extended fast territory. Your body is deeply fat-adapted. Some studies link this length to immune system changes.',
    facts: [
      '72 hours! Research in animals and early human studies link ~3-day fasts with immune cell renewal.',
      'Your body is now very good at protecting protein and burning fat.',
      'Ketone levels may be high enough to feel very mentally sharp — or tired. Both are normal.',
      'Weight loss on the scale now is a mix of fat, water and gut content.'
    ],
    tips: ['Check in with your body every hour: dizzy? faint? palpitations? → tell the buddy.', 'Rest is productive now. Gentle walks, stretching, prayer, reading.', 'Do not stand up fast from bed or the toilet.'] },
  { from: 96, to: 120, emoji: '💎', name: 'Day 4–5 — strong & steady',
    body: 'You are in a stable fasting state. The body is running efficiently on fat with minimal glucose needs.',
    facts: [
      'Day 4+: your metabolism adapts to save energy but keeps burning fat.',
      'Ketones are providing much of your brain\'s energy.',
      'Electrolyte balance is now the #1 safety factor — not hunger.',
      'Your discipline here is rare — very few people ever get this far.'
    ],
    tips: ['If you have not had electrolytes today, have some now.', 'Any fainting, confusion or chest pain = break the fast and get help.', 'Picture breaking your fast in a slow, healthy way — plan your refeed.'] },
  { from: 120, to: 144, emoji: '👑', name: 'Day 5–6 — almost there',
    body: 'Very deep fast. Fat is your main fuel. Mental and spiritual focus is often strong here.',
    facts: [
      'Day 5+: you have used thousands of calories from your own stored fat.',
      'Your body is in full energy-saving mode — keep activity gentle.',
      'Spiritual traditions often describe days 5–7 as the most meaningful.',
      'You are proving to yourself what you are capable of.'
    ],
    tips: ['Start planning your refeed: small portions, broth, soft foods first.', 'Avoid big sugary meals when you break — this can be dangerous after long fasts (refeeding syndrome).', 'Rest more than usual. Short walks only.'] },
  { from: 144, to: 168, emoji: '🏆', name: 'Day 6–7 — the final stretch',
    body: 'The final day of a 7-day fast. Your body has fully adapted. Finish gently and plan a careful refeed.',
    facts: [
      'Day 6–7: you are in the final stretch — this is where champions are made.',
      'Breaking a 7-day fast should be slow: bone broth, eggs, cooked veggies, small portions.',
      'Your body will reabsorb some water when you eat again — that is normal, not fat.',
      'You have built a new level of self-discipline that carries into everything.'
    ],
    tips: ['For fasts longer than 5 days, it is wise to talk to a doctor about refeeding.', 'First meal: small. Wait 1–2 hours before the next small meal.', 'Be proud. Write down how you feel right now.'] },
  { from: 168, to: 99999, emoji: '🌈', name: 'Beyond 7 days',
    body: 'Fasting longer than 7 days should be supervised by a doctor. Please consider breaking your fast safely.',
    facts: [
      'Beyond 7 days, medical supervision is strongly recommended.',
      'Refeeding syndrome risk rises with fast length — break slowly and carefully.'
    ],
    tips: ['Talk to a doctor before continuing.', 'Break gently: broth → soft protein → small meals.'] }
];

const MOTIVATION = [
  'You are stronger than this craving. 💪',
  'Every hour is a promise you are keeping to yourself.',
  'Hunger is temporary. Pride lasts.',
  'You are not starving — you are healing and recharging.',
  'Your future self is cheering for you right now.',
  'Discipline is choosing what you want MOST over what you want NOW.',
  'One more hour. You can always do one more hour.',
  'You started for a reason. Remember it.',
  'Small steps, every hour. That is how mountains move.',
  'Your body is working hard for you — be kind to it.',
  'You did not come this far to only come this far.',
  'Body, mind and spirit — all getting stronger today.'
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

// ================= FAST TYPES =================
const FAST_TYPES = {
  water: { name: 'Water fast', desc: 'Only water (plus electrolytes/salt). Nothing else.', allowed: ['Water', 'Sparkling water', 'Electrolytes / pinch of salt'] },
  dirty: { name: 'Dirty fast', desc: 'Zero / very low-calorie drinks allowed.', allowed: ['Water', 'Black tea / coffee', 'Sweetener', 'Cola Zero / diet soda', 'Electrolytes', 'Under ~50 kcal/day'] }
};
const FAST_GOALS = [16, 18, 20, 24, 36, 48, 72, 120, 168];

// ================= WORKOUTS =================
// MET values from the Compendium of Physical Activities (approximate).
// kcal = MET × kg × hours
const WORKOUTS = [
  { id: 'walk', name: 'Brisk walk', emoji: '🚶', met: 4.3, min: 40, intensity: 'low',
    help: 'Best fat-burner during a fast: low intensity uses mostly fat for fuel and is safe on all fasting days.',
    moves: ['Warm-up slow walk', 'Brisk walk', 'Brisk walk + arm swings', 'Brisk walk', 'Cool-down slow walk'],
    video: 'brisk indoor walking workout 40 minutes' },
  { id: 'lowhiit', name: 'Low-impact cardio', emoji: '💃', met: 5.0, min: 40, intensity: 'mid',
    help: 'Raises your heart rate without jumping — good for days 1–2 of a fast. Burns more than walking.',
    moves: ['March in place', 'Step jacks', 'Side steps + arms', 'Knee lifts', 'Butt kicks (slow)', 'Standing oblique crunch', 'Cool-down'],
    video: 'low impact cardio workout 40 minutes no jumping' },
  { id: 'strength', name: 'Bodyweight strength', emoji: '🏋️', met: 3.8, min: 40, intensity: 'mid',
    help: 'Keeps your MUSCLE while losing fat — the secret to not regaining weight. Do it on days 0–3.',
    moves: ['Squats', 'Wall / knee push-ups', 'Glute bridges', 'Reverse lunges', 'Plank', 'Bird-dog', 'Stretch'],
    video: 'full body bodyweight strength workout 40 minutes beginner' },
  { id: 'hiit', name: 'HIIT', emoji: '⚡', met: 8.0, min: 25, intensity: 'high',
    help: 'Burns a lot fast, but hard during long fasts. Only on day 0–1 if you feel strong. Skip from day 3.',
    moves: ['Jumping jacks', 'Rest', 'Squat jumps', 'Rest', 'Mountain climbers', 'Rest', 'High knees', 'Rest'],
    video: 'beginner HIIT workout 25 minutes' },
  { id: 'dance', name: 'Dance cardio', emoji: '🎶', met: 6.0, min: 40, intensity: 'mid',
    help: 'Fun = you actually do it. Great mood booster when motivation is low.',
    moves: ['Warm-up groove', 'Dance combo 1', 'Dance combo 2', 'Dance combo 3', 'Cool-down sway'],
    video: 'dance cardio workout 40 minutes' },
  { id: 'yoga', name: 'Yoga flow', emoji: '🧘', met: 2.5, min: 40, intensity: 'low',
    help: 'Lower burn, but lowers stress hormones (cortisol) that make you crave food. Perfect for day 3+.',
    moves: ['Child\'s pose', 'Cat-cow', 'Downward dog', 'Warrior II', 'Tree pose', 'Seated forward fold', 'Savasana'],
    video: 'gentle yoga flow 40 minutes' },
  { id: 'stretch', name: 'Stretching', emoji: '🤸', met: 2.3, min: 20, intensity: 'low',
    help: 'Safe on every fasting day. Helps sleep, recovery and keeps you moving.',
    moves: ['Neck rolls', 'Shoulder stretch', 'Hamstring stretch', 'Hip opener', 'Quad stretch', 'Spinal twist'],
    video: 'full body stretching routine 20 minutes' },
  { id: 'cycle', name: 'Cycling (moderate)', emoji: '🚴', met: 6.8, min: 40, intensity: 'mid',
    help: 'Strong calorie burn with low impact on joints. Keep it easy on day 2+.',
    moves: ['Easy spin', 'Moderate pace', 'Light hill', 'Moderate pace', 'Easy spin'],
    video: 'indoor cycling workout 40 minutes beginner' }
];

// ================= DEFAULT DAY PLANS (from the user's own schedule) =================
const DEFAULT_TEMPLATES = {
  free: { name: '🌤️ Free day', items: [
    { time: '11:00', title: 'Workout (40 min)', why: 'Morning movement burns fat while insulin is low and wakes up your mood.', alarm: true },
    { time: '12:00', title: 'Water 300 ml', why: 'Hydration keeps headaches and fake-hunger away.', alarm: false },
    { time: '13:00', title: 'Cola Zero', why: 'A treat with zero calories — keeps you on track without breaking the fast.', alarm: false },
    { time: '14:00', title: 'Black tea with sweetener', why: 'Tea helps calm hunger and gives a gentle energy lift.', alarm: false },
    { time: '15:00', title: 'Water 300 ml + pinch of salt', why: 'Electrolytes prevent dizziness and headaches on multi-day fasts.', alarm: false },
    { time: '16:00', title: 'Steps walk (goal 20k by 19:00)', why: 'Walking burns mostly fat during a fast and clears your head.', alarm: true },
    { time: '20:00', title: 'Workout (40 min)', why: 'Second session doubles today\'s burn. Go gentler if you feel weak.', alarm: true },
    { time: '21:00', title: 'Water 300 ml', why: 'Last big drink before bed — sleep is easier when you\'re hydrated.', alarm: false }
  ]},
  work: { name: '💼 Work day', items: [
    { time: '05:30', title: 'Wake up', why: 'Early start — you\'re already winning the day.', alarm: true },
    { time: '05:50', title: 'Leave the house', why: 'Don\'t be late! Take your water bottle.', alarm: true },
    { time: '06:40', title: 'Work starts', why: 'Keep a bottle nearby and sip every hour.', alarm: false },
    { time: '13:00', title: 'Home from work (9–13h)', why: 'Tick this when you get home — then rest.', alarm: false },
    { time: '13:30', title: 'Sleep until 15:00', why: 'Sleep is the easiest fasting hours — your body burns fat while you rest.', alarm: false },
    { time: '15:00', title: 'Water + change clothes', why: 'Wake-up water resets your energy for the evening.', alarm: true },
    { time: '16:00', title: 'Steps walk (until 19:00)', why: 'Walking burns mostly fat during a fast.', alarm: true },
    { time: '20:00', title: 'Water 300 ml + pinch of salt', why: 'Electrolytes keep you safe on long fasts.', alarm: false },
    { time: '21:00', title: 'Workout (40 min)', why: 'Finish the day strong — gentle if it\'s day 3+.', alarm: true },
    { time: '22:00', title: 'Water 300 ml', why: 'Hydrate before sleep.', alarm: false }
  ]},
  study: { name: '📚 Study / PC / game-dev day', items: [
    { time: '09:00', title: 'Wake up + water 300 ml', why: 'Start hydrated so your brain works better.', alarm: true },
    { time: '10:00', title: 'Study block 1', why: 'Your focus is strongest in the morning on a fast.', alarm: false },
    { time: '12:00', title: 'Stand up & stretch 5 min', why: 'Sitting for hours slows calorie burn — move a bit.', alarm: false },
    { time: '13:00', title: 'Black tea / Cola Zero', why: 'Small reward between work blocks.', alarm: false },
    { time: '14:00', title: 'Game dev block', why: 'Ketone focus is great for creative work.', alarm: false },
    { time: '16:00', title: 'Steps walk', why: 'Screen break + fat burn.', alarm: true },
    { time: '19:00', title: 'Water + pinch of salt', why: 'Electrolytes help with the evening dip.', alarm: false },
    { time: '20:00', title: 'Workout (40 min)', why: 'Burn more, sleep better.', alarm: true },
    { time: '21:00', title: 'Gaming / movie (earned it!)', why: 'Rest is part of the plan. Keep water nearby.', alarm: false },
    { time: '23:00', title: 'Screens off, sleep', why: 'Good sleep = fewer cravings tomorrow.', alarm: false }
  ]}
};
