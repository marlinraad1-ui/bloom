// Real people doing the exercises: free stock videos from Pexels (pexels.com, Pexels License:
// free for commercial use, no credit required). Played from the Pexels video CDN.
// When there is no video (or no internet) Bloom falls back to the animation in exercises.js.
const PX = 'https://videos.pexels.com/video-files/';
const PXI = 'https://images.pexels.com/videos/';
// id: [video file, thumbnail file, vertical?]
const VIDEOS = {
  6707719: ['6707719/6707719-sd_640_360_25fps.mp4', '6707719/adult-balance-body-care-6707719.jpeg'],
  8478087: ['8478087/8478087-sd_640_360_25fps.mp4', '8478087/boxer-coach-gloves-master-of-sports-8478087.jpeg'],
  6980766: ['6980766/6980766-sd_960_506_30fps.mp4', '6980766/pexels-photo-6980766.jpeg'],
  6286172: ['6286172/6286172-sd_640_360_30fps.mp4', '6286172/pexels-photo-6286172.jpeg'],
  6286162: ['6286162/6286162-sd_640_360_30fps.mp4', '6286162/pexels-photo-6286162.jpeg'],
  6286152: ['6286152/6286152-sd_640_360_30fps.mp4', '6286152/pexels-photo-6286152.jpeg'],
  6286157: ['6286157/6286157-sd_640_360_30fps.mp4', '6286157/pexels-photo-6286157.jpeg'],
  6286165: ['6286165/6286165-sd_640_360_30fps.mp4', '6286165/pexels-photo-6286165.jpeg'],
  6286155: ['6286155/6286155-sd_640_360_30fps.mp4', '6286155/pexels-photo-6286155.jpeg'],
  6286153: ['6286153/6286153-sd_640_360_30fps.mp4', '6286153/pexels-photo-6286153.jpeg'],
  6286151: ['6286151/6286151-sd_640_360_30fps.mp4', '6286151/pexels-photo-6286151.jpeg'],
  6525468: ['6525468/6525468-sd_640_360_25fps.mp4', '6525468/exercises-girl-sport-sporty-6525468.jpeg'],
  4861146: ['4861146/4861146-sd_640_360_25fps.mp4', '4861146/pexels-photo-4861146.jpeg'],
  6286170: ['6286170/6286170-sd_640_360_30fps.mp4', '6286170/pexels-photo-6286170.jpeg'],
  6525469: ['6525469/6525469-sd_640_360_25fps.mp4', '6525469/exercises-girl-sport-sporty-6525469.jpeg'],
  4764124: ['4764124/4764124-sd_640_360_30fps.mp4', '4764124/pexels-photo-4764124.jpeg'],
  6525498: ['6525498/6525498-sd_640_360_25fps.mp4', '6525498/exercises-girl-sport-sporty-6525498.jpeg'],
  6525495: ['6525495/6525495-sd_640_360_25fps.mp4', '6525495/exercises-girl-sport-sporty-6525495.jpeg'],
  6525487: ['6525487/6525487-sd_640_360_25fps.mp4', '6525487/exercises-girl-sport-sporty-6525487.jpeg'],
  6525502: ['6525502/6525502-sd_640_360_25fps.mp4', '6525502/exercises-girl-sport-sporty-6525502.jpeg'],
  5025964: ['5025964/5025964-sd_360_640_25fps.mp4', '5025964/athlete-exercise-female-fitness-5025964.jpeg', 1],
  6525481: ['6525481/6525481-sd_640_360_25fps.mp4', '6525481/exercises-girl-sport-sporty-6525481.jpeg'],
  5025822: ['5025822/5025822-sd_640_360_25fps.mp4', '5025822/pexels-photo-5025822.jpeg'],
  6455345: ['6455345/6455345-sd_360_640_24fps.mp4', '6455345/pexels-photo-6455345.jpeg', 1],
  6286160: ['6286160/6286160-sd_640_360_30fps.mp4', '6286160/pexels-photo-6286160.jpeg'],
  6525485: ['6525485/6525485-sd_640_360_25fps.mp4', '6525485/exercises-girl-sport-sporty-6525485.jpeg'],
  6525490: ['6525490/6525490-sd_640_360_25fps.mp4', '6525490/exercises-girl-sport-sporty-6525490.jpeg'],
  6286161: ['6286161/6286161-sd_640_360_30fps.mp4', '6286161/pexels-photo-6286161.jpeg'],
  6525494: ['6525494/6525494-sd_640_360_25fps.mp4', '6525494/exercises-girl-sport-sporty-6525494.jpeg'],
  6437925: ['6437925/6437925-sd_360_640_30fps.mp4', '6437925/pexels-photo-6437925.jpeg', 1],
  6286173: ['6286173/6286173-sd_640_360_30fps.mp4', '6286173/pexels-photo-6286173.jpeg'],
  6525496: ['6525496/6525496-sd_640_360_25fps.mp4', '6525496/exercises-girl-sport-sporty-6525496.jpeg'],
  6525491: ['6525491/6525491-sd_640_360_25fps.mp4', '6525491/exercises-girl-sport-sporty-6525491.jpeg'],
  6525475: ['6525475/6525475-sd_640_360_25fps.mp4', '6525475/exercises-girl-sport-sporty-6525475.jpeg'],
  4267356: ['4267356/4267356-sd_640_360_30fps.mp4', '4267356/pexels-photo-4267356.jpeg'],
  6525499: ['6525499/6525499-sd_640_360_25fps.mp4', '6525499/exercises-girl-sport-sporty-6525499.jpeg'],
  6525463: ['6525463/6525463-sd_640_360_25fps.mp4', '6525463/exercises-girl-sport-sporty-6525463.jpeg'],
};
const VID_RULES = [
  [/rest|recover|walk down|cool down$/i, 6707719],
  [/jab|hook|uppercut|slip and duck|stance|^combos$/i, 8478087],
  [/combo|groove|freestyle/i, 6980766],
  [/pull-up/i, 6286172],
  [/hanging/i, null],
  [/curl/i, 6286162],
  [/row|press|swing|thruster|dumbbell|deadlift|goblet/i, 6286152],
  [/stair|two steps|steep hill|step up/i, 6286165],
  [/incline|treadmill/i, 6286155],
  [/\b(sprint|run|jog)/i, 6286151],
  [/warm up/i, 6525468],
  [/walk|march|side step/i, 6286153],
  [/spin|moderate pace|^hill$|^climb$/i, 4861146],
  [/rope|basic bounce|alternate feet|double speed/i, 6286170],
  [/plank jack|mountain|shoulder tap|renegade/i, 6525469],
  [/jack/i, 4764124],
  [/jump squat|squat jump|box jump/i, 6525498],
  [/burpee/i, null],
  [/kickback|donkey|hydrant/i, 6525495],
  [/frog pump|bridge|hip thrust/i, 6525487],
  [/skater|split jump|side lunge/i, 6525502],
  [/high knees|knee lift|knee drive|butt kick|squat kick/i, 5025964],
  [/standing (cross )?crunch/i, 6525481],
  [/bicycle/i, 5025822],
  [/twist|boat/i, 6455345],
  [/toe touch/i, 6286160],
  [/flutter|dead bug|hundred|roll up|leg circles|side kicks|abs circle/i, 6525485],
  [/leg raise|knee raise|leg lift/i, 6525490],
  [/sit-up/i, 6286161],
  [/crunch/i, 6525494],
  [/swan|cobra/i, 6437925],
  [/push-up|dip/i, 6286173],
  [/plank|bird dog/i, 6525496],
  [/bulgarian|split squat|lunge|warrior/i, 6525491],
  [/sumo/i, 6525475],
  [/squat|chair|wall sit|calf/i, 4267356],
  [/salutation|inchworm/i, null],
  [/stretch|sway/i, 6525499],
];
// which real video fits this move (bike and treadmill workouts keep showing the machine)
function vidFor(m, w) {
  if (w && !/rest|recover|cool down$/i.test(m)) {
    if (w.id === 'cycle' || (w.needs || []).includes('bike')) return 4861146;
    if ((w.needs || []).includes('treadmill')) return /sprint|jog|run/i.test(m) ? 6286151 : 6286155;
  }
  const r = VID_RULES.find(([re]) => re.test(m)); return r ? r[1] : null;
}
const vidThumb = id => `${PXI}${VIDEOS[id][1]}?auto=compress&cs=tinysrgb&w=320`;
const vidSrc = id => PX + VIDEOS[id][0];
// a real video that falls back to the animation if it can't load
function videoHTML(id, fallbackHTML) {
  const v = VIDEOS[id];
  return `<video class="vid ${v[2] ? 'tall' : ''}" src="${vidSrc(id)}" poster="${vidThumb(id)}" muted autoplay loop playsinline preload="auto" data-fb="${esc(fallbackHTML)}" onerror="this.outerHTML=this.dataset.fb"></video>`;
}
