/* ==========================================================================
   SECTION 32 (1.4): THE SPRITE OVERHAUL - 1000 numbered improvements
   Every improvement is one entry in a table below, next to the code that
   does it. SPRITE_LOG() lists them in order; the changelog numbers come
   from that list, so the count is always the real count.
     A. the rig: jointed limbs, new pose channels, easing, drawing (SYS)
     B. animation channels for every animation (ANIMX)
     C. each neighbour's way of moving (STYLE)
     D. each neighbour's personal touches per animation (PERS)
     E. each neighbour's costume details (DETAIL)
     F. faces and expressions (EXPR)
     G. Toby in The Long Walk (TOBY)
   ========================================================================== */
const SPR = { sys: [], n: 0 };
const SYS = (area, text) => { SPR.sys.push([area, text]); };

/* ---------- A. the rig ---------- */
const POSE_KEYS = ['kneeA', 'kneeB', 'elbA', 'elbB', 'footA', 'footB', 'sway', 'spine', 'tilt', 'breath', 'handA', 'handB', 'jaw', 'shrug', 'lookY', 'sq', 'neck', 'reach'];
SYS('Rig', 'Legs are now two bones, thigh and shin, joined at a knee that bends.');
SYS('Rig', 'Arms are now two bones, upper arm and forearm, joined at an elbow.');
SYS('Rig', 'Feet are placed with inverse kinematics, so the foot lands where the stride puts it and the knee works out the rest.');
SYS('Rig', 'Hands are placed with inverse kinematics too, so elbows bend naturally when an arm is pulled in.');
SYS('Rig', 'Knees always bend forward and elbows always bend back, as real joints do.');
SYS('Rig', 'A crouch now bends the knees instead of shortening the legs.');
SYS('Rig', 'Feet can no longer sink below the floor at any point of a stride.');
SYS('Rig', 'Eighteen new pose channels: knee lift on each leg, elbow bend on each arm, toe angle on each foot, hip sway, spine curl, head tilt, breathing, hand shape on each hand, jaw, shoulder shrug, eye height, squash, neck stretch and reach.');
SYS('Rig', 'Every new channel eases toward its target, so poses blend smoothly between animations.');
SYS('Rig', 'Each animation has its own blend speed: snappy for hurt and throw, slow and heavy for sleep and collapse.');
SYS('Rig', 'Channels reset each frame, so a pose can never get stuck from an earlier animation.');
SYS('Rig', 'Older survivors without the new channels are upgraded on the fly the first time they are drawn.');
const EASE_RATE = { idle: 9, walk: 14, run: 18, sneak: 12, climb: 16, jump: 20, crouch: 12, hide: 10, interact: 14, use: 24, throw: 26, eat: 12, sleep: 4, shiver: 16, cough: 18, hurt: 28, collapse: 5, comforted: 9, gesture: 14, victory: 8, defeat: 4, sit: 8 };
for (const k in EASE_RATE) SYS('Blending', 'The ' + k + ' animation blends in at its own pace (' + EASE_RATE[k] + ' per second).');
function ik2(hx, hy, tx, ty, L1, L2, bend) {
  let dx = tx - hx, dy = ty - hy, d = Math.hypot(dx, dy);
  const dmax = L1 + L2 - 0.01, dmin = Math.abs(L1 - L2) + 0.5;
  if (d > dmax) { dx *= dmax / d; dy *= dmax / d; d = dmax; } if (d < dmin) { const k = dmin / Math.max(d, 1e-4); dx *= k; dy *= k; d = dmin; }
  const b = Math.atan2(dx, dy), a = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)), th = b + bend * a;
  return { kx: hx + Math.sin(th) * L1, ky: hy + Math.cos(th) * L1, ex: hx + dx, ey: hy + dy, th };
}

/* ---------- B. animation channels: [animation, what it does, fn(T, s, t, sw, cw)] ---------- */
const ANIMX = [
  // walk
  ['walk', 'The leg swinging forward lifts its knee.', (T, s, t, sw, cw) => { T.kneeA = Math.max(0, cw) * 0.8; T.kneeB = Math.max(0, -cw) * 0.8; }],
  ['walk', 'Heel strike: the front toe tips up as the foot lands.', (T, s, t, sw) => { T.footA = Math.max(0, sw) * 0.35; T.footB = Math.max(0, -sw) * 0.35; }],
  ['walk', 'Push-off: the back toe tips down as the foot leaves the floor.', (T, s, t, sw) => { T.footA -= Math.max(0, -sw) * 0.3; T.footB -= Math.max(0, sw) * 0.3; }],
  ['walk', 'Elbows soften a little as the arms swing.', (T, s, t, sw) => { T.elbA = 0.25 + Math.max(0, -sw) * 0.25; T.elbB = 0.25 + Math.max(0, sw) * 0.25; }],
  ['walk', 'The hips sway into each step.', (T, s, t, sw) => { T.sway = sw * 0.6; }],
  ['walk', 'The head stays steady while the body bobs, like a real walker\'s.', (T, s, t, sw) => { T.neck = -Math.abs(sw) * 0.5; }],
  ['walk', 'A slight dip at each heel strike before the body rises again.', (T, s, t, sw) => { T.bob -= Math.max(0, Math.abs(sw) - 0.85) * 2.2; }],
  ['walk', 'Hands hang loose and half-open.', (T) => { T.handA = 0.3; T.handB = 0.3; }],
  ['walk', 'Shoulders counter-rotate a touch against the hips.', (T, s, t, sw) => { T.shrug = sw * 0.25; }],
  ['walk', 'Breathing quickens a little while walking.', (T, s, t) => { T.breath = Math.sin(t * 3.2) * 0.6; }],
  // run
  ['run', 'High knees on the forward leg.', (T, s, t, sw, cw) => { T.kneeA = Math.max(0, cw) * 1.25; T.kneeB = Math.max(0, -cw) * 1.25; }],
  ['run', 'The back heel kicks up behind on each stride.', (T, s, t, sw) => { T.footA = -Math.max(0, -sw) * 0.6; T.footB = -Math.max(0, sw) * 0.6; }],
  ['run', 'Elbows bend to ninety degrees, as runners hold them.', (T) => { T.elbA = 0.9; T.elbB = 0.9; }],
  ['run', 'Hands close into loose fists.', (T) => { T.handA = 1; T.handB = 1; }],
  ['run', 'The spine curls forward into the run.', (T) => { T.spine = 0.12; }],
  ['run', 'The chin juts forward.', (T) => { T.tilt = 0.08; }],
  ['run', 'A strong hip sway.', (T, s, t, sw) => { T.sway = sw * 1.1; }],
  ['run', 'Breath comes in short, fast pants.', (T, s, t) => { T.breath = Math.sin(t * 9) * 0.9; T.jaw = 0.3 + Math.abs(Math.sin(t * 9)) * 0.3; }],
  ['run', 'Shoulders pump against the stride.', (T, s, t, sw) => { T.shrug = sw * 0.45; }],
  ['run', 'A flight phase: both feet briefly leave the floor at the top of each stride.', (T, s, t, sw) => { T.bob += Math.max(0, Math.abs(sw) - 0.7) * 3; }],
  // sneak
  ['sneak', 'Knees stay deeply bent while creeping.', (T, s, t, sw, cw) => { T.kneeA = 0.5 + Math.max(0, cw) * 0.5; T.kneeB = 0.5 + Math.max(0, -cw) * 0.5; }],
  ['sneak', 'Each foot is placed toe first.', (T, s, t, sw) => { T.footA = -Math.max(0, sw) * 0.35; T.footB = -Math.max(0, -sw) * 0.35; }],
  ['sneak', 'Arms are held out a little for balance.', (T) => { T.elbA = 0.7; T.elbB = 0.55; T.reach = 0.3; }],
  ['sneak', 'Fingers spread, ready to catch a wall.', (T) => { T.handA = 0; T.handB = 0; }],
  ['sneak', 'Shoulders hunch up toward the ears.', (T) => { T.shrug = 0.6; }],
  ['sneak', 'The head pokes forward and peers.', (T, s, t) => { T.tilt = 0.12; T.lookY = Math.sin(t * 1.3) * 0.4; }],
  ['sneak', 'Breathing is held: the chest barely moves.', (T) => { T.breath = 0; }],
  ['sneak', 'Almost no hip sway, to stay quiet.', (T, s, t, sw) => { T.sway = sw * 0.2; }],
  // climb
  ['climb', 'Knees come up high on each rung.', (T, s, t) => { const c = Math.sin(t * 9); T.kneeA = 0.6 + c * 0.5; T.kneeB = 0.6 - c * 0.5; }],
  ['climb', 'Hands grip the rails.', (T) => { T.handA = 2; T.handB = 2; }],
  ['climb', 'Elbows bend and straighten as each hand reaches up.', (T, s, t) => { const c = Math.sin(t * 9); T.elbA = 0.5 - c * 0.4; T.elbB = 0.5 + c * 0.4; }],
  ['climb', 'Toes point down onto the rungs.', (T) => { T.footA = -0.4; T.footB = -0.4; }],
  ['climb', 'The head tilts up to look where they are going.', (T) => { T.tilt = -0.18; T.lookY = -0.8; }],
  ['climb', 'Effortful breathing on the climb.', (T, s, t) => { T.breath = Math.sin(t * 5) * 0.7; }],
  ['climb', 'The body hugs the ladder.', (T) => { T.spine = 0.08; }],
  // jump
  ['jump', 'Both knees tuck on the way up.', (T, s) => { const up = num(s.jv) > 0; T.kneeA = up ? 1.1 : 0.4; T.kneeB = up ? 0.9 : 0.3; }],
  ['jump', 'Legs reach down for the landing on the way down.', (T, s) => { if (num(s.jv) <= 0) { T.footA = 0.25; T.footB = 0.15; } }],
  ['jump', 'Arms fling up on take-off.', (T, s) => { T.elbA = num(s.jv) > 0 ? 0.2 : 0.6; T.elbB = 0.5; }],
  ['jump', 'Hands open wide in the air.', (T) => { T.handA = 0; T.handB = 0; }],
  ['jump', 'A small stretch while rising.', (T, s) => { T.sq = num(s.jv) > 60 ? -0.05 : 0; }],
  ['jump', 'Eyes look down to find the landing.', (T, s) => { T.lookY = num(s.jv) > 0 ? -0.3 : 0.8; }],
  // crouch
  ['crouch', 'A proper squat: both knees bend deep.', (T) => { T.kneeA = 0.2; T.kneeB = 0.2; }],
  ['crouch', 'Weight on the balls of the feet.', (T) => { T.footA = -0.2; T.footB = -0.25; }],
  ['crouch', 'Forearms rest across the knees.', (T) => { T.elbA = 1.1; T.elbB = 0.9; }],
  ['crouch', 'Slow, controlled breathing.', (T, s, t) => { T.breath = Math.sin(t * 1.6) * 0.5; }],
  ['crouch', 'The head turns to listen, now and then.', (T, s, t) => { T.tilt = Math.sin(t * 0.7) * 0.08; }],
  // hide
  ['hide', 'Knees pulled up tight.', (T) => { T.kneeA = 0.4; T.kneeB = 0.4; }],
  ['hide', 'Arms wrapped around the knees.', (T) => { T.elbA = 1.4; T.elbB = 1.4; T.handA = 1; T.handB = 1; }],
  ['hide', 'Shoulders up and head down, small as possible.', (T) => { T.shrug = 0.8; T.tilt = 0.25; }],
  ['hide', 'Breath held, then a careful little breath out every few seconds.', (T, s, t) => { T.breath = (t % 4 < 0.6) ? 0.6 : 0; }],
  ['hide', 'Eyes dart to the gap they are watching through.', (T, s, t) => { T.lookY = Math.sin(t * 2.3) > 0.6 ? -0.4 : 0.2; }],
  // interact
  ['interact', 'Both hands work at the task.', (T) => { T.handA = 2; T.handB = 1; }],
  ['interact', 'Elbows work in and out with the hands.', (T, s, t) => { T.elbA = 0.6 + Math.sin(t * 14) * 0.3; T.elbB = 0.7 + Math.cos(t * 14) * 0.2; }],
  ['interact', 'The head bends over the work.', (T) => { T.tilt = 0.22; T.lookY = 0.7; }],
  ['interact', 'Knees soften to get closer.', (T) => { T.kneeA = 0.15; T.kneeB = 0.25; }],
  ['interact', 'Weight shifts from foot to foot during long jobs.', (T, s, t) => { T.sway = Math.sin(t * 0.9) * 0.6; }],
  ['interact', 'The tongue pokes out when concentrating.', (T, s, t) => { T.jaw = Math.sin(t * 0.5) > 0.7 ? 0.4 : 0; }],
  // use
  ['use', 'The arm winds back with the elbow bent, then snaps straight on the swing.', (T, s) => { const k = 1 - s.actT / Math.max(0.01, s.actDur); T.elbA = k < 0.3 ? 1.2 : 0.05; }],
  ['use', 'The front knee braces on the swing.', (T, s) => { const k = 1 - s.actT / Math.max(0.01, s.actDur); T.kneeA = k < 0.3 ? 0 : 0.3; }],
  ['use', 'The back foot pivots onto its toe.', (T) => { T.footB = -0.4; }],
  ['use', 'A tight grip on the tool.', (T) => { T.handA = 2; }],
  ['use', 'The other arm swings back for balance.', (T) => { T.elbB = 0.6; }],
  ['use', 'A grunt: the jaw clenches.', (T) => { T.jaw = 0; }],
  // throw
  ['throw', 'The throwing elbow cocks back behind the head.', (T, s) => { const k = 1 - s.actT / Math.max(0.01, s.actDur); T.elbA = k < 0.35 ? 1.4 : 0.05; }],
  ['throw', 'The hand opens at release.', (T, s) => { const k = 1 - s.actT / Math.max(0.01, s.actDur); T.handA = k < 0.35 ? 1 : 0; }],
  ['throw', 'The other arm points at the target.', (T) => { T.elbB = 0.1; T.reach = 0.6; }],
  ['throw', 'The back foot pushes off its toe.', (T) => { T.footB = -0.5; T.kneeB = 0.3; }],
  ['throw', 'The spine twists through the throw.', (T, s) => { const k = 1 - s.actT / Math.max(0.01, s.actDur); T.spine = k < 0.35 ? -0.1 : 0.15; }],
  ['throw', 'Eyes follow the throw out.', (T) => { T.lookY = -0.3; }],
  // eat
  ['eat', 'The elbow bends to bring food to the mouth.', (T) => { T.elbA = 1.6; T.handA = 2; }],
  ['eat', 'The jaw chews.', (T, s, t) => { T.jaw = Math.max(0, Math.sin(t * 10)) * 0.6; }],
  ['eat', 'The other hand cups underneath for crumbs.', (T) => { T.elbB = 1.2; T.handB = 0; }],
  ['eat', 'Shoulders hunch protectively over the bowl.', (T) => { T.shrug = 0.4; T.tilt = 0.12; }],
  ['eat', 'A content little sway while eating.', (T, s, t) => { T.sway = Math.sin(t * 1.3) * 0.4; }],
  // sleep
  ['sleep', 'Knees curl up in sleep.', (T) => { T.kneeA = 0.6; T.kneeB = 0.7; }],
  ['sleep', 'Hands tuck under the cheek.', (T) => { T.elbA = 1.5; T.elbB = 1.3; T.handA = 0; T.handB = 0; }],
  ['sleep', 'Slow, deep breathing you can see.', (T, s, t) => { T.breath = Math.sin(t * 1.2) * 1.2; }],
  ['sleep', 'The mouth falls slightly open.', (T, s, t) => { T.jaw = 0.25 + Math.sin(t * 1.2) * 0.1; }],
  ['sleep', 'A twitch now and then while dreaming.', (T, s, t) => { if (Math.sin(t * 0.37 + s.x) > 0.97) T.footA = 0.4; }],
  // shiver
  ['shiver', 'Arms hug the body, elbows tight.', (T) => { T.elbA = 1.5; T.elbB = 1.5; T.handA = 1; T.handB = 1; }],
  ['shiver', 'Knees knock together.', (T, s, t) => { T.kneeA = 0.2 + Math.sin(t * 30) * 0.08; T.kneeB = 0.2 - Math.sin(t * 30) * 0.08; }],
  ['shiver', 'Shoulders up to the ears.', (T) => { T.shrug = 0.9; }],
  ['shiver', 'Teeth chatter.', (T, s, t) => { T.jaw = Math.abs(Math.sin(t * 34)) * 0.35; }],
  ['shiver', 'Toes curl inward against the cold.', (T) => { T.footA = -0.15; T.footB = -0.15; }],
  ['shiver', 'Breath comes in shaky gasps.', (T, s, t) => { T.breath = Math.sin(t * 7) * 0.5; }],
  // cough
  ['cough', 'Doubles over at each cough.', (T, s, t) => { T.spine = Math.abs(Math.sin(t * 16)) * 0.2; }],
  ['cough', 'A hand comes up to cover the mouth.', (T) => { T.elbA = 1.7; T.handA = 1; }],
  ['cough', 'The other hand braces on a knee.', (T) => { T.elbB = 0.3; T.reach = 0.2; }],
  ['cough', 'Knees buckle a little.', (T) => { T.kneeA = 0.2; T.kneeB = 0.2; }],
  ['cough', 'The jaw jolts open with each cough.', (T, s, t) => { T.jaw = Math.max(0, Math.sin(t * 16)) * 0.6; }],
  // hurt
  ['hurt', 'The body recoils away from the blow.', (T) => { T.spine = -0.2; }],
  ['hurt', 'Hands fly up to protect the face.', (T) => { T.elbA = 1.3; T.elbB = 1.1; T.handA = 0; T.handB = 0; }],
  ['hurt', 'A knee buckles.', (T) => { T.kneeA = 0.5; }],
  ['hurt', 'The head snaps back.', (T) => { T.tilt = -0.3; }],
  ['hurt', 'A sharp gasp.', (T) => { T.jaw = 0.5; T.breath = 1; }],
  ['hurt', 'A stagger: the feet scramble for balance.', (T, s, t) => { T.footA = Math.sin(t * 20) * 0.3; T.footB = -Math.sin(t * 20) * 0.3; }],
  // collapse
  ['collapse', 'Limbs go slack on collapse.', (T) => { T.kneeA = 0.3; T.kneeB = 0.2; T.elbA = 0.4; T.elbB = 0.3; T.handA = 0.3; T.handB = 0.3; }],
  ['collapse', 'Faint, slow breathing so you know they are alive.', (T, s, t) => { T.breath = Math.sin(t * 0.9) * 0.6; }],
  ['collapse', 'The head lolls.', (T) => { T.tilt = 0.2; }],
  // comforted
  ['comforted', 'Shoulders drop and relax.', (T) => { T.shrug = -0.4; }],
  ['comforted', 'Hands clasp together over the heart.', (T) => { T.elbA = 1.6; T.elbB = 1.6; T.handA = 1; T.handB = 1; }],
  ['comforted', 'A happy little bounce in the knees.', (T, s, t) => { T.kneeA = Math.abs(Math.sin(t * 6)) * 0.15; T.kneeB = T.kneeA; }],
  ['comforted', 'The head tilts warmly to one side.', (T) => { T.tilt = -0.12; }],
  ['comforted', 'A long, relieved breath out.', (T, s, t) => { T.breath = Math.sin(t * 1.5) * 1; }],
  // gesture
  ['gesture', 'A wave from the wrist with the elbow bent.', (T, s, t) => { T.elbA = 0.5 + Math.sin(t * 12) * 0.3; T.handA = 0; }],
  ['gesture', 'The other hand rests on the hip.', (T) => { T.elbB = 1.6; T.reach = -0.3; }],
  ['gesture', 'The weight shifts onto one leg.', (T) => { T.kneeB = 0.25; T.sway = 0.8; }],
  ['gesture', 'Talks with the jaw while gesturing.', (T, s, t) => { T.jaw = Math.max(0, Math.sin(t * 8)) * 0.4; }],
  // victory
  ['victory', 'Fists pump in the air.', (T, s, t) => { T.handA = 1; T.handB = 1; T.elbA = 0.3 + Math.max(0, Math.sin(t * 4)) * 0.4; T.elbB = T.elbA; }],
  ['victory', 'Up on the toes.', (T) => { T.footA = -0.3; T.footB = -0.3; }],
  ['victory', 'Chin up, chest out.', (T) => { T.tilt = -0.15; T.breath = 1; T.spine = -0.08; }],
  ['victory', 'A happy bounce in the knees.', (T, s, t) => { T.kneeA = Math.abs(Math.sin(t * 4)) * 0.2; T.kneeB = T.kneeA; }],
  // defeat
  ['defeat', 'Shoulders slump.', (T) => { T.shrug = -0.6; T.spine = 0.18; }],
  ['defeat', 'Arms hang limp.', (T) => { T.elbA = 0.05; T.elbB = 0.05; T.handA = 0.2; T.handB = 0.2; }],
  ['defeat', 'Knees go soft.', (T) => { T.kneeA = 0.2; T.kneeB = 0.2; }],
  ['defeat', 'A long, heavy sigh every few seconds.', (T, s, t) => { T.breath = (t % 5 < 1.5) ? Math.sin((t % 5) / 1.5 * Math.PI) * 1.4 : 0; }],
  ['defeat', 'Eyes on the floor.', (T) => { T.lookY = 1; T.tilt = 0.25; }],
  // sit
  ['sit', 'Shins hang down from the seat.', (T) => { T.kneeA = 1; T.kneeB = 0.9; }],
  ['sit', 'Feet swing gently while sitting.', (T, s, t) => { T.footA = Math.sin(t * 2) * 0.2; T.footB = Math.sin(t * 2 + 1) * 0.2; }],
  ['sit', 'Hands rest in the lap.', (T) => { T.elbA = 1.2; T.elbB = 1.1; T.handA = 0.4; T.handB = 0.4; }],
  ['sit', 'A relaxed curve in the back.', (T) => { T.spine = 0.1; T.shrug = -0.2; }],
  // idle
  ['idle', 'Knees are never locked: a soft, living stance.', (T, s, t) => { T.kneeA = 0.06 + Math.sin(t * 0.8) * 0.03; T.kneeB = 0.06; }],
  ['idle', 'Weight shifts from one foot to the other every few seconds.', (T, s, t) => { T.sway = Math.sin(t * 0.45 + s.x * 0.01) * 0.8; }],
  ['idle', 'Breathing lifts the chest.', (T, s, t) => { T.breath = Math.sin(t * 1.9 + s.x * 0.02) * 0.8; }],
  ['idle', 'Arms hang with relaxed elbows.', (T) => { T.elbA = 0.18; T.elbB = 0.15; T.handA = 0.35; T.handB = 0.3; }],
  ['idle', 'Now and then the head turns to look around.', (T, s, t) => { T.tilt = Math.sin(t * 0.31 + s.x) > 0.8 ? -0.1 : 0; }],
  ['idle', 'Eyes drift up and down a little.', (T, s, t) => { T.lookY = Math.sin(t * 0.53 + s.x * 0.1) * 0.3; }],
  ['idle', 'A small stretch every so often.', (T, s, t) => { const k = (t + s.x * 0.05) % 17; if (k < 1.2) { T.elbA = 0.05; T.armA = 2.6 * Math.sin(k / 1.2 * Math.PI); T.breath = 1.2; T.footA = -0.2; } }],
  ['idle', 'Toes tap when someone is bored.', (T, s, t) => { if (s.morale < 45 && s.morale > 20) T.footA = Math.max(0, Math.sin(t * 6)) * 0.3; }],
  ['idle', 'Cold hands are rubbed together.', (T, s, t) => { if (s.cold < 40) { T.elbA = 1.3; T.elbB = 1.3; T.armA = 0.6 + Math.sin(t * 12) * 0.1; T.armB = 0.6 - Math.sin(t * 12) * 0.1; } }],
  ['idle', 'Hungry people hold their stomach.', (T, s) => { if (s.hunger < 25) { T.elbB = 1.4; T.armB = 0.3; T.spine = 0.08; } }],
  ['idle', 'Tired people sag at the knees and yawn.', (T, s, t) => { if (s.fatigue < 25) { T.kneeA = 0.15; T.kneeB = 0.15; T.shrug = -0.3; if ((t + s.x) % 9 < 1.3) T.jaw = 0.8; } }],
  ['idle', 'Happy people stand a little taller.', (T, s) => { if (s.morale > 75) { T.spine = -0.05; T.tilt = -0.05; } }],
  ['idle', 'Scared people hug themselves.', (T, s) => { if (s.flare > 0.2) { T.elbA = 1.4; T.shrug = 0.5; } }],
  ['idle', 'Someone who is speaking moves their jaw with the words.', (T, s, t) => { if (s.bubble && s.bubble.t > s.bubble.max - 2) T.jaw = Math.max(0, Math.sin(t * 13)) * 0.5; }]
];

/* ---------- C. how each neighbour moves ---------- */
const STYLE_PARAMS = {
  stride: ['stride', 'shorter steps', 'longer strides'], swing: ['arm swing', 'arms held closer', 'a bigger arm swing'], bob: ['bounce', 'a smooth, level walk', 'a bouncy walk'],
  lean: ['lean', 'an upright carriage', 'a forward lean'], knee: ['knee lift', 'feet kept low', 'knees lifted high'], sway: ['hip sway', 'little hip sway', 'a loose hip sway'],
  posture: ['posture', 'a straight back', 'a rounded back'], elbow: ['elbows', 'straight arms', 'bent elbows'], fist: ['hands', 'open hands', 'hands kept in fists'],
  breathe: ['breathing', 'slow breathing', 'quick breathing'], toe: ['feet', 'feet together', 'toes turned out'], shoulders: ['shoulders', 'dropped shoulders', 'raised shoulders'],
  head: ['head carriage', 'chin tucked', 'chin up'], blink: ['blinking', 'rare blinks', 'frequent blinks'], fidget: ['fidgeting', 'stillness', 'restless fidgeting'], gaze: ['gaze', 'eyes down', 'eyes up and alert']
};
const STYLE = {
  marta: { stride: 0.92, swing: 0.9, bob: 0.95, lean: 1.1, knee: 1.0, sway: 1.1, posture: 1.05, elbow: 1.15, fist: 0.8, breathe: 1.1, toe: 0.9, shoulders: 1.1, head: 1.0, blink: 1.2, fidget: 1.1, gaze: 1.15 },
  dov: { stride: 0.85, swing: 0.75, bob: 1.2, lean: 1.2, knee: 0.7, sway: 0.8, posture: 1.25, elbow: 1.1, fist: 1.2, breathe: 0.85, toe: 1.2, shoulders: 0.85, head: 0.9, blink: 0.8, fidget: 0.8, gaze: 0.9 },
  ines: { stride: 1.18, swing: 1.2, bob: 1.1, lean: 1.25, knee: 1.25, sway: 0.9, posture: 0.9, elbow: 0.9, fist: 1.0, breathe: 1.2, toe: 1.0, shoulders: 0.9, head: 1.15, blink: 1.0, fidget: 1.35, gaze: 1.2 },
  toby: { stride: 0.8, swing: 1.3, bob: 1.35, lean: 0.9, knee: 1.3, sway: 0.7, posture: 0.85, elbow: 0.85, fist: 0.9, breathe: 1.3, toe: 0.8, shoulders: 1.05, head: 0.85, blink: 1.25, fidget: 1.4, gaze: 0.85 },
  bea: { stride: 0.75, swing: 0.7, bob: 0.8, lean: 1.3, knee: 0.75, sway: 1.15, posture: 1.35, elbow: 1.25, fist: 0.8, breathe: 0.9, toe: 1.15, shoulders: 0.9, head: 1.1, blink: 0.9, fidget: 0.75, gaze: 1.05 },
  ravi: { stride: 1.05, swing: 1.05, bob: 1.05, lean: 0.95, knee: 1.0, sway: 1.25, posture: 1.1, elbow: 1.0, fist: 0.85, breathe: 0.95, toe: 1.25, shoulders: 0.8, head: 0.95, blink: 1.0, fidget: 0.9, gaze: 1.0 },
  yara: { stride: 0.95, swing: 0.85, bob: 0.9, lean: 1.0, knee: 0.95, sway: 1.0, posture: 1.0, elbow: 1.2, fist: 1.15, breathe: 1.3, toe: 0.85, shoulders: 1.3, head: 0.9, blink: 1.35, fidget: 1.25, gaze: 0.8 },
  pavel: { stride: 1.1, swing: 0.8, bob: 0.75, lean: 0.9, knee: 0.85, sway: 0.75, posture: 0.95, elbow: 0.95, fist: 1.2, breathe: 0.8, toe: 1.3, shoulders: 0.85, head: 1.05, blink: 0.75, fidget: 0.7, gaze: 1.0 },
  lamp: { stride: 1.12, swing: 0.6, bob: 0.6, lean: 0.85, knee: 1.1, sway: 0.6, posture: 0.9, elbow: 1.05, fist: 0.75, breathe: 0.7, toe: 0.9, shoulders: 0.8, head: 1.2, blink: 0.65, fidget: 0.65, gaze: 1.25 }
};
const STY = (s, k) => { const st = STYLE[s.id]; return st && st[k] != null ? st[k] : 1; };
function applyStyle(T, s, t) {
  const a = s.anim, mv = a === 'walk' || a === 'run' || a === 'sneak';
  if (mv) { const k = STY(s, 'stride'); T.legA *= k; T.legB *= k; T.armA *= STY(s, 'swing'); T.armB *= STY(s, 'swing'); T.bob *= STY(s, 'bob'); T.kneeA *= STY(s, 'knee'); T.kneeB *= STY(s, 'knee'); T.sway *= STY(s, 'sway'); }
  T.lean *= STY(s, 'lean'); T.spine += (STY(s, 'posture') - 1) * 0.3; T.elbA *= STY(s, 'elbow'); T.elbB *= STY(s, 'elbow');
  T.handA = clamp(T.handA * STY(s, 'fist'), 0, 2); T.handB = clamp(T.handB * STY(s, 'fist'), 0, 2); T.breath *= STY(s, 'breathe');
  T.shrug += (STY(s, 'shoulders') - 1) * 0.6; T.tilt -= (STY(s, 'head') - 1) * 0.3; T.lookY -= (STY(s, 'gaze') - 1) * 0.8;
  if (a === 'idle') T.sway *= STY(s, 'fidget');
}

/* ---------- D. personal touches: [who, animation, what, fn(T, s, t, sw, cw)] ---------- */
const PERS = [
  ['marta', 'idle', 'Marta checks her watch-pin now and then: a nurse\'s habit.', (T, s, t) => { if ((t + 3) % 11 < 1) { T.elbA = 1.7; T.armA = 0.8; T.tilt = 0.25; T.lookY = 0.8; } }],
  ['marta', 'walk', 'Marta keeps one hand on her satchel strap as she walks.', (T) => { T.armB = 0.25; T.elbB = 1.3; T.handB = 2; }],
  ['marta', 'run', 'Marta runs holding the satchel against her side.', (T) => { T.armB = 0.3; T.elbB = 1.4; }],
  ['marta', 'sneak', 'Marta sneaks with a hand raised, ready to hush someone.', (T) => { T.armA = 1.8; T.elbA = 1.2; T.handA = 0; }],
  ['marta', 'interact', 'Marta works with quick, precise hands.', (T, s, t) => { T.elbA = 0.7 + Math.sin(t * 20) * 0.15; }],
  ['marta', 'comforted', 'Marta pats her own chest when someone thanks her.', (T, s, t) => { T.elbA = 1.6; T.armA = 0.7 + Math.sin(t * 8) * 0.1; }],
  ['marta', 'hurt', 'Marta clutches the hurt spot, assessing it like a nurse.', (T) => { T.elbB = 1.5; T.armB = 0.5; T.lookY = 1; }],
  ['marta', 'sleep', 'Marta sleeps lightly, one hand still on the satchel.', (T) => { T.elbB = 0.9; }],
  ['marta', 'crouch', 'Marta crouches with her bag pulled close.', (T) => { T.elbB = 1.5; T.armB = 0.5; }],
  ['marta', 'shiver', 'Marta blows into her cupped hands.', (T, s, t) => { T.elbA = 1.8; T.elbB = 1.8; T.armA = 2.4; T.armB = 2.4; T.jaw = 0.3 + Math.sin(t * 3) * 0.2; }],
  ['marta', 'eat', 'Marta eats quickly, standing, like a nurse on shift.', (T) => { T.spine = 0; T.shrug = 0; }],
  ['marta', 'gesture', 'Marta beckons with two fingers.', (T, s, t) => { T.elbA = 0.9 + Math.sin(t * 9) * 0.4; }],
  ['marta', 'victory', 'Marta hugs the air, then laughs at herself.', (T) => { T.elbA = 1.7; T.elbB = 1.7; T.armA = 1.6; T.armB = 1.6; }],
  ['marta', 'defeat', 'Marta presses her hands to her face.', (T) => { T.elbA = 1.9; T.elbB = 1.9; T.armA = 2.3; T.armB = 2.2; }],
  ['marta', 'climb', 'Marta climbs carefully, checking each rung.', (T) => { T.lookY = 0.4; }],
  ['dov', 'walk', 'Dov favours his bad knee: the back leg stays stiff.', (T, s, t, sw) => { T.kneeB *= 0.25; T.bob += Math.max(0, -sw) * 1.4; }],
  ['dov', 'run', 'Dov\'s run is more of a determined hobble.', (T) => { T.kneeB *= 0.3; T.legA *= 0.8; T.legB *= 0.8; }],
  ['dov', 'idle', 'Dov rubs his bad knee.', (T, s, t) => { if ((t + 7) % 13 < 2) { T.armA = 0.4; T.elbA = 0.5; T.spine = 0.25; T.kneeB = 0.3; } }],
  ['dov', 'idle', 'Dov stands with his hands in his cardigan pockets.', (T, s, t) => { if ((t + 7) % 13 >= 2) { T.elbA = 0.9; T.elbB = 0.9; T.armA = 0.15; T.armB = 0.15; } }],
  ['dov', 'interact', 'Dov hammers with a full-arm swing.', (T, s, t) => { T.elbA = 0.5 + Math.max(0, Math.sin(t * 9)) * 0.9; T.handA = 2; }],
  ['dov', 'climb', 'Dov climbs one rung at a time, leading with the good leg.', (T) => { T.kneeB *= 0.5; }],
  ['dov', 'crouch', 'Dov crouches with a hand on his knee and a grimace.', (T) => { T.elbA = 0.3; T.armA = 0.7; T.jaw = 0; }],
  ['dov', 'sit', 'Dov sits with the stiff leg stretched out.', (T) => { T.kneeB = 0.1; T.legB = 1.6; }],
  ['dov', 'sneak', 'Dov sneaks with exaggerated care, arms out like a tightrope walker.', (T) => { T.armA = 1.4; T.armB = 1.3; T.elbA = 0.3; T.elbB = 0.3; }],
  ['dov', 'shiver', 'Dov stamps his good foot against the cold.', (T, s, t) => { T.kneeA = Math.max(0, Math.sin(t * 6)) * 0.6; }],
  ['dov', 'gesture', 'Dov points with the hammer handle.', (T) => { T.elbA = 0.05; T.handA = 2; }],
  ['dov', 'victory', 'Dov gives one slow, satisfied nod.', (T, s, t) => { T.tilt = Math.max(0, Math.sin(t * 2)) * 0.3; }],
  ['dov', 'sleep', 'Dov snores: his jaw drops wide.', (T, s, t) => { T.jaw = 0.5 + Math.sin(t * 1.2) * 0.3; }],
  ['dov', 'hurt', 'Dov\'s bad knee gives out when he is hit.', (T) => { T.kneeB = 0.9; }],
  ['dov', 'comforted', 'Dov looks away, embarrassed but pleased.', (T) => { T.tilt = 0.2; T.lookY = 0.5; }],
  ['ines', 'walk', 'Ines walks with a spring in her step, up on her toes.', (T, s, t, sw) => { T.footA -= 0.15; T.footB -= 0.15; T.bob += Math.abs(sw) * 0.6; }],
  ['ines', 'run', 'Ines runs like a sprinter: long reach, driving arms.', (T) => { T.legA *= 1.1; T.legB *= 1.1; T.spine = 0.18; }],
  ['ines', 'idle', 'Ines bounces on her heels, impatient to go.', (T, s, t) => { T.footA = -Math.max(0, Math.sin(t * 5)) * 0.3; T.footB = T.footA; T.bob = Math.max(0, Math.sin(t * 5)) * 0.9; }],
  ['ines', 'idle', 'Ines stretches her calves like a courier before a run.', (T, s, t) => { if ((t + 5) % 15 < 1.6) { T.legB = -0.5; T.kneeA = 0.3; T.lean = 0.2; } }],
  ['ines', 'sneak', 'Ines sneaks low and fast, like a cat.', (T) => { T.lean *= 1.3; T.kneeA += 0.2; T.kneeB += 0.2; }],
  ['ines', 'climb', 'Ines climbs fast, two rungs at a time.', (T) => { T.kneeA *= 1.3; T.kneeB *= 1.3; }],
  ['ines', 'jump', 'Ines tucks into a proper vault.', (T) => { T.kneeA = 1.3; T.kneeB = 1.2; }],
  ['ines', 'interact', 'Ines picks locks with her tongue between her teeth.', (T) => { T.jaw = 0.25; T.tilt = 0.3; }],
  ['ines', 'gesture', 'Ines gives a two-finger salute.', (T) => { T.armA = 2.9; T.elbA = 1.3; }],
  ['ines', 'victory', 'Ines punches the air with one fist.', (T, s, t) => { T.armA = 3; T.elbA = 0; T.armB = 0.2; }],
  ['ines', 'shiver', 'Ines jogs on the spot to keep warm.', (T, s, t) => { T.kneeA = Math.max(0, Math.sin(t * 9)) * 0.8; T.kneeB = Math.max(0, -Math.sin(t * 9)) * 0.8; }],
  ['ines', 'crouch', 'Ines crouches on her toes, ready to spring.', (T) => { T.footA = -0.45; T.footB = -0.45; }],
  ['ines', 'hurt', 'Ines rolls with the hit.', (T) => { T.spine = -0.3; T.kneeA = 0.7; }],
  ['ines', 'defeat', 'Ines kicks at the floor.', (T, s, t) => { T.legA = Math.max(0, Math.sin(t * 2)) * 0.6; }],
  ['ines', 'eat', 'Ines eats on the move, bouncing.', (T, s, t) => { T.bob = Math.abs(Math.sin(t * 4)) * 0.8; }],
  ['toby', 'walk', 'Toby skips every few steps.', (T, s, t, sw) => { if (Math.sin(s.ph * 0.25) > 0.7) { T.bob += Math.abs(sw) * 2.2; T.kneeA += 0.4; } }],
  ['toby', 'run', 'Toby runs with arms flailing like a little kid.', (T, s, t) => { T.armA = Math.sin(t * 13) * 1.4; T.armB = -Math.sin(t * 13) * 1.2; T.elbA = 0.3; T.elbB = 0.3; }],
  ['toby', 'idle', 'Toby swings his arms back and forth while waiting.', (T, s, t) => { T.armA = Math.sin(t * 2.5) * 0.6; T.armB = -T.armA; }],
  ['toby', 'idle', 'Toby looks up at the grown-ups.', (T) => { T.tilt = -0.15; T.lookY = -0.7; }],
  ['toby', 'interact', 'Toby draws with his whole arm, tongue out.', (T, s, t) => { T.armA = 1.2 + Math.sin(t * 7) * 0.4; T.jaw = 0.3; }],
  ['toby', 'sneak', 'Toby tiptoes with exaggerated, cartoonish steps.', (T, s, t, sw) => { T.kneeA *= 1.6; T.kneeB *= 1.6; T.footA = -0.5; T.footB = -0.5; T.bob += Math.abs(sw) * 1.2; }],
  ['toby', 'hide', 'Toby hides with his hands over his eyes.', (T) => { T.armA = 2.7; T.armB = 2.6; T.elbA = 1.6; T.elbB = 1.6; }],
  ['toby', 'shiver', 'Toby tucks his hands into his armpits.', (T) => { T.armA = 0.3; T.armB = 0.3; T.elbA = 1.8; T.elbB = 1.8; }],
  ['toby', 'comforted', 'Toby rocks on his heels, grinning.', (T, s, t) => { T.footA = Math.sin(t * 4) * 0.3; T.footB = T.footA; }],
  ['toby', 'victory', 'Toby jumps up and down.', (T, s, t) => { T.bob = Math.abs(Math.sin(t * 7)) * 4; T.kneeA = 0.4; T.kneeB = 0.4; }],
  ['toby', 'hurt', 'Toby\'s lip wobbles.', (T, s, t) => { T.jaw = 0.2 + Math.sin(t * 25) * 0.1; }],
  ['toby', 'sleep', 'Toby sleeps curled in a tight ball.', (T) => { T.kneeA = 1.2; T.kneeB = 1.2; }],
  ['toby', 'climb', 'Toby scrambles up the ladder.', (T, s, t) => { T.kneeA *= 1.4; T.kneeB *= 1.4; }],
  ['toby', 'gesture', 'Toby waves with his whole body.', (T, s, t) => { T.sway = Math.sin(t * 12) * 1.2; }],
  ['toby', 'eat', 'Toby\'s feet swing while he eats.', (T, s, t) => { T.footA = Math.sin(t * 5) * 0.3; }],
  ['bea', 'walk', 'Bea walks with small, shuffling steps.', (T) => { T.kneeA *= 0.4; T.kneeB *= 0.4; T.footA *= 0.3; T.footB *= 0.3; }],
  ['bea', 'walk', 'Bea keeps a hand on the small of her back.', (T) => { T.armB = -0.6; T.elbB = 1.6; }],
  ['bea', 'run', 'Bea\'s "run" is a brisk, determined trot.', (T) => { T.legA *= 0.6; T.legB *= 0.6; T.kneeA *= 0.5; T.kneeB *= 0.5; T.lean = 0.2; }],
  ['bea', 'idle', 'Bea stands with her hands folded at her waist.', (T) => { T.elbA = 1.4; T.elbB = 1.4; T.armA = 0.35; T.armB = 0.35; }],
  ['bea', 'idle', 'Bea wags a finger now and then, mid-opinion.', (T, s, t) => { if ((t + 2) % 9 < 1.2) { T.armA = 1.6 + Math.sin(t * 14) * 0.2; T.elbA = 0.9; } }],
  ['bea', 'interact', 'Bea stirs the pot with a wide, slow circle.', (T, s, t) => { T.armA = 1.4 + Math.sin(t * 3) * 0.25; T.elbA = 0.8 + Math.cos(t * 3) * 0.2; }],
  ['bea', 'sit', 'Bea sits very upright, ankles crossed.', (T) => { T.spine = -0.05; T.legB = T.legA; }],
  ['bea', 'climb', 'Bea climbs slowly, with a rest on every rung.', (T, s, t) => { if (Math.sin(t * 2) > 0.6) { T.kneeA = 0.2; T.kneeB = 0.2; } }],
  ['bea', 'sneak', 'Bea sneaks bent nearly double.', (T) => { T.spine = 0.3; }],
  ['bea', 'gesture', 'Bea points with her wooden spoon.', (T) => { T.elbA = 0.1; T.handA = 2; }],
  ['bea', 'comforted', 'Bea pats the air as if patting a cheek.', (T, s, t) => { T.elbA = 0.6 + Math.sin(t * 6) * 0.2; }],
  ['bea', 'victory', 'Bea claps her hands.', (T, s, t) => { T.armA = 1.4 + Math.sin(t * 10) * 0.25; T.armB = 1.4 - Math.sin(t * 10) * 0.25; T.elbA = 1.1; T.elbB = 1.1; }],
  ['bea', 'shiver', 'Bea pulls her shawl tighter.', (T) => { T.armA = 2.2; T.armB = 2.1; T.elbA = 1.7; T.elbB = 1.7; }],
  ['bea', 'cough', 'Bea coughs into a handkerchief, very politely.', (T) => { T.elbA = 1.8; T.spine *= 0.6; }],
  ['bea', 'sleep', 'Bea sleeps with her hands folded on her chest.', (T) => { T.elbA = 1.5; T.elbB = 1.5; T.kneeA = 0.2; T.kneeB = 0.2; }],
  ['ravi', 'walk', 'Ravi walks with a loose, easy swagger.', (T, s, t, sw) => { T.sway *= 1.3; T.shrug = sw * 0.4; }],
  ['ravi', 'idle', 'Ravi spins his wrench on a finger.', (T, s, t) => { T.armA = 0.9; T.elbA = 1.2; T.handA = 0; }],
  ['ravi', 'idle', 'Ravi leans back with his hands behind his head.', (T, s, t) => { if ((t + 9) % 16 < 3) { T.armA = 3.1; T.armB = 3.0; T.elbA = 1.9; T.elbB = 1.9; T.spine = -0.12; } }],
  ['ravi', 'interact', 'Ravi works with the wrench in quick quarter-turns.', (T, s, t) => { T.elbA = 0.8 + (Math.floor(t * 4) % 2) * 0.4; T.handA = 2; }],
  ['ravi', 'run', 'Ravi runs as if pedalling: high, round knees.', (T, s, t, sw, cw) => { T.kneeA = 0.4 + Math.max(0, cw) * 1.2; T.kneeB = 0.4 + Math.max(0, -cw) * 1.2; }],
  ['ravi', 'sit', 'Ravi sits with one ankle on the other knee.', (T) => { T.legB = 1.9; T.kneeB = 1.4; }],
  ['ravi', 'sneak', 'Ravi sneaks with a "who, me?" casualness.', (T) => { T.lean *= 0.7; T.shrug = 0.2; }],
  ['ravi', 'sleep', 'Ravi sleeps sprawled, one arm flung out.', (T) => { T.elbA = 0; T.armA = 2.4; }],
  ['ravi', 'gesture', 'Ravi gives a thumbs-up.', (T) => { T.armA = 1.5; T.elbA = 1.1; T.handA = 1; }],
  ['ravi', 'victory', 'Ravi takes a little bow.', (T, s, t) => { T.spine = Math.max(0, Math.sin(t * 2)) * 0.35; }],
  ['ravi', 'comforted', 'Ravi scratches the back of his neck.', (T, s, t) => { T.armA = 2.8; T.elbA = 1.8 + Math.sin(t * 15) * 0.05; }],
  ['ravi', 'hurt', 'Ravi shakes out the hurt hand.', (T, s, t) => { T.armA = 1 + Math.sin(t * 30) * 0.3; }],
  ['ravi', 'crouch', 'Ravi squats flat-footed like a mechanic at a wheel.', (T) => { T.footA = 0; T.footB = 0; T.elbA = 1; }],
  ['ravi', 'shiver', 'Ravi rubs his arms briskly.', (T, s, t) => { T.armA = 1.2 + Math.sin(t * 16) * 0.3; T.elbA = 1.6; }],
  ['yara', 'walk', 'Yara walks with arms folded tight.', (T) => { T.armA = 0.6; T.armB = 0.6; T.elbA = 1.7; T.elbB = 1.7; }],
  ['yara', 'idle', 'Yara twists a strand of hair.', (T, s, t) => { T.armA = 2.6; T.elbA = 1.8 + Math.sin(t * 6) * 0.1; }],
  ['yara', 'idle', 'Yara mouths words silently, rehearsing a broadcast.', (T, s, t) => { T.jaw = Math.max(0, Math.sin(t * 7)) * 0.25; }],
  ['yara', 'interact', 'Yara tunes the dial with tiny, careful movements.', (T, s, t) => { T.elbA = 1.1 + Math.sin(t * 3) * 0.05; T.tilt = 0.18; }],
  ['yara', 'sneak', 'Yara sneaks with her shoulders right up by her ears.', (T) => { T.shrug = 1.1; }],
  ['yara', 'hide', 'Yara hides with her hands over her mouth.', (T) => { T.armA = 2.5; T.elbA = 1.9; }],
  ['yara', 'run', 'Yara runs with her hands up near her chest.', (T) => { T.elbA = 1.5; T.elbB = 1.5; }],
  ['yara', 'gesture', 'Yara talks with her hands, like on air.', (T, s, t) => { T.armA = 1.4 + Math.sin(t * 5) * 0.4; T.armB = 1.2 + Math.cos(t * 4) * 0.4; T.elbA = 0.8; T.elbB = 0.8; }],
  ['yara', 'comforted', 'Yara lets out a shaky laugh.', (T, s, t) => { T.jaw = Math.abs(Math.sin(t * 10)) * 0.4; T.shrug = 0.3; }],
  ['yara', 'shiver', 'Yara bounces on the spot, fists clenched.', (T, s, t) => { T.bob = Math.abs(Math.sin(t * 10)) * 1.2; T.handA = 1; T.handB = 1; }],
  ['yara', 'sleep', 'Yara sleeps fitfully, turning.', (T, s, t) => { T.kneeA = 0.5 + Math.sin(t * 0.3) * 0.3; }],
  ['yara', 'hurt', 'Yara freezes, eyes wide.', (T) => { T.elbA = 1.8; T.elbB = 1.8; }],
  ['yara', 'victory', 'Yara does a little radio-host flourish.', (T, s, t) => { T.armA = 2.2 + Math.sin(t * 3) * 0.3; T.elbA = 0.4; }],
  ['pavel', 'walk', 'Pavel walks with heavy, flat-footed steps.', (T) => { T.footA *= 0.3; T.footB *= 0.3; T.bob *= 0.6; }],
  ['pavel', 'walk', 'Pavel\'s big arms swing out from his sides.', (T) => { T.reach = 0.4; }],
  ['pavel', 'idle', 'Pavel stands guard: feet apart, hands clasped in front.', (T) => { T.legA = 0.12; T.legB = -0.12; T.elbA = 1.2; T.elbB = 1.2; T.armA = 0.45; T.armB = 0.45; }],
  ['pavel', 'idle', 'Pavel cracks his knuckles.', (T, s, t) => { if ((t + 4) % 14 < 1) { T.armA = 1.6; T.armB = 1.6; T.elbA = 1.4; T.elbB = 1.4; T.shrug = 0.3; } }],
  ['pavel', 'run', 'Pavel runs like a wall coming at you.', (T) => { T.spine = 0.22; T.shrug = 0.4; }],
  ['pavel', 'sneak', 'Pavel tries his very best to sneak.', (T, s, t, sw) => { T.bob += Math.abs(sw) * 0.8; T.shrug = 0.6; }],
  ['pavel', 'use', 'Pavel swings the pipe two-handed.', (T) => { T.armB = T.armA; T.elbB = T.elbA; T.handB = 2; }],
  ['pavel', 'interact', 'Pavel lifts and carries with a straight back.', (T) => { T.spine = -0.05; T.kneeA = 0.4; T.kneeB = 0.4; }],
  ['pavel', 'crouch', 'Pavel crouches like a rugby player.', (T) => { T.elbA = 0.4; T.elbB = 0.4; T.reach = 0.3; }],
  ['pavel', 'comforted', 'Pavel puts a huge hand over his heart.', (T) => { T.elbA = 1.7; T.armA = 0.6; T.handA = 0; }],
  ['pavel', 'gesture', 'Pavel waves very gently, as if afraid to break something.', (T, s, t) => { T.armA = 2 + Math.sin(t * 6) * 0.15; }],
  ['pavel', 'sleep', 'Pavel sleeps flat on his back, perfectly still.', (T) => { T.kneeA = 0; T.kneeB = 0; T.elbA = 0.1; T.elbB = 0.1; }],
  ['pavel', 'victory', 'Pavel lifts both arms like a weightlifter.', (T) => { T.armA = 2.6; T.armB = 2.6; T.elbA = 1.2; T.elbB = 1.2; T.handA = 1; T.handB = 1; }],
  ['lamp', 'walk', 'The Lamplighter glides: almost no bob at all.', (T) => { T.bob *= 0.2; T.neck = 0; }],
  ['lamp', 'walk', 'The Lamplighter carries the long pole upright.', (T) => { T.armA = 0.9; T.elbA = 1.3; T.handA = 2; }],
  ['lamp', 'idle', 'The Lamplighter stands perfectly still, then tilts their head like a bird.', (T, s, t) => { T.sway = 0; T.tilt = Math.sin(t * 0.4) > 0.7 ? 0.35 : 0; }],
  ['lamp', 'idle', 'The Lamplighter\'s fingers drum on the pole.', (T, s, t) => { T.handA = 1 + Math.sin(t * 9) * 0.5; }],
  ['lamp', 'run', 'The Lamplighter runs without a sound, cloak streaming.', (T) => { T.bob *= 0.3; T.armA = 0.9; T.elbA = 1.3; }],
  ['lamp', 'sneak', 'The Lamplighter sneaks very tall, not low.', (T) => { T.crouch = 0.1; T.kneeA *= 0.3; T.kneeB *= 0.3; }],
  ['lamp', 'interact', 'The Lamplighter lights things with a slow reach of the pole.', (T, s, t) => { T.armA = 2.2 + Math.sin(t * 2) * 0.1; T.elbA = 0.2; }],
  ['lamp', 'gesture', 'The Lamplighter bows slightly.', (T, s, t) => { T.spine = Math.max(0, Math.sin(t * 1.5)) * 0.3; }],
  ['lamp', 'hide', 'The Lamplighter folds into their cloak.', (T) => { T.elbA = 1.9; T.elbB = 1.9; T.shrug = 1; }],
  ['lamp', 'sleep', 'The Lamplighter never quite lies flat.', (T) => { T.kneeA = 0.8; }],
  ['lamp', 'comforted', 'The Lamplighter\'s head tilts, puzzled by kindness.', (T) => { T.tilt = 0.3; }],
  ['lamp', 'victory', 'The Lamplighter raises the pole like a torch.', (T) => { T.armA = 2.9; T.elbA = 0; }],
  ['lamp', 'climb', 'The Lamplighter climbs hand over hand, unhurried.', (T, s, t) => { T.kneeA *= 0.7; T.kneeB *= 0.7; }]
];

/* ---------- H. ten new animations ---------- */
const NEWANIM = [
  ['carry', 'Carrying someone or something heavy now has its own animation.', 9], ['limp', 'Walking while hurt is now a limp.', 12], ['coldwalk', 'Walking in the cold is now a hunched, hugging shuffle.', 12],
  ['trudge', 'Walking while exhausted or miserable is now a slow trudge.', 10], ['skid', 'Stopping from a sprint now plays a short skid.', 26], ['land', 'Landing from a hop now plays a recovery crouch.', 22],
  ['search', 'Searching a container now has its own rummaging animation.', 14], ['heave', 'Heavy jobs (cranking, prying, forcing) now have a straining heave.', 12],
  ['turn', 'Turning around now plays a quick pivot.', 24], ['bored', 'Standing idle for a long time now plays a bored, restless wait.', 6]
];
for (const [a, txt, rate] of NEWANIM) { EASE_RATE[a] = rate; SYS('New animations', txt); SYS('Blending', 'The ' + a + ' animation blends in at its own pace (' + rate + ' per second).'); }
ANIMX.push(
  ['carry', 'Carrying: short, heavy steps.', (T, s, t, sw) => { T.legA = sw * 0.4; T.legB = -sw * 0.4; T.bob = Math.abs(sw) * 1.6; }],
  ['carry', 'Carrying: both arms wrapped around the load.', (T) => { T.armA = 1.2; T.armB = 1.1; T.elbA = 1.3; T.elbB = 1.3; T.handA = 2; T.handB = 2; }],
  ['carry', 'Carrying: leaning back against the weight.', (T) => { T.lean = -0.1; T.spine = -0.08; }],
  ['carry', 'Carrying: knees bent under the weight.', (T, s, t, sw, cw) => { T.kneeA = 0.25 + Math.max(0, cw) * 0.5; T.kneeB = 0.25 + Math.max(0, -cw) * 0.5; }],
  ['carry', 'Carrying: hard breathing.', (T, s, t) => { T.breath = Math.sin(t * 6) * 1; T.jaw = 0.25; }],
  ['carry', 'Carrying: shoulders set and raised.', (T) => { T.shrug = 0.5; }],
  ['limp', 'Limping: one leg takes a long step, the hurt one a short one.', (T, s, t, sw) => { T.legA = sw * 0.6; T.legB = -sw * 0.3; }],
  ['limp', 'Limping: a big dip each time the hurt leg takes the weight.', (T, s, t, sw) => { T.bob = Math.abs(sw) * 1 + Math.max(0, -sw) * 2.4; }],
  ['limp', 'Limping: the hurt knee hardly bends.', (T, s, t, sw, cw) => { T.kneeA = Math.max(0, cw) * 0.8; T.kneeB = 0.05; }],
  ['limp', 'Limping: a hand presses on the hurt side.', (T) => { T.armB = 0.4; T.elbB = 1.5; T.handB = 0; }],
  ['limp', 'Limping: the face winces with each step.', (T, s, t, sw) => { if (sw < -0.6) T.jaw = 0; T.tilt = 0.1; }],
  ['limp', 'Limping: leaning toward the good side.', (T) => { T.lean = 0.14; T.sway = 0.6; }],
  ['limp', 'Limping: the free arm swings out for balance.', (T, s, t, sw) => { T.armA = -sw * 0.8; T.elbA = 0.3; }],
  ['coldwalk', 'Cold walk: arms wrapped around the body.', (T) => { T.armA = 0.8; T.armB = 0.8; T.elbA = 1.7; T.elbB = 1.7; T.handA = 1; T.handB = 1; }],
  ['coldwalk', 'Cold walk: quick, stiff little steps.', (T, s, t, sw) => { T.legA = sw * 0.42; T.legB = -sw * 0.42; T.bob = Math.abs(sw) * 0.8; }],
  ['coldwalk', 'Cold walk: shoulders up to the ears.', (T) => { T.shrug = 0.9; T.tilt = 0.12; }],
  ['coldwalk', 'Cold walk: knees barely lift.', (T, s, t, sw, cw) => { T.kneeA = Math.max(0, cw) * 0.35; T.kneeB = Math.max(0, -cw) * 0.35; }],
  ['coldwalk', 'Cold walk: a shiver runs through now and then.', (T, s, t) => { if (Math.sin(t * 0.9) > 0.85) T.shake = 0.5; }],
  ['coldwalk', 'Cold walk: teeth chattering.', (T, s, t) => { T.jaw = Math.abs(Math.sin(t * 30)) * 0.25; }],
  ['trudge', 'Trudging: slow, dragging steps.', (T, s, t, sw) => { T.legA = sw * 0.45; T.legB = -sw * 0.45; T.bob = Math.abs(sw) * 0.6; }],
  ['trudge', 'Trudging: feet scuff along the floor.', (T, s, t, sw, cw) => { T.kneeA = Math.max(0, cw) * 0.2; T.kneeB = Math.max(0, -cw) * 0.2; T.footA = 0; T.footB = 0; }],
  ['trudge', 'Trudging: head hanging.', (T) => { T.tilt = 0.28; T.lookY = 0.9; }],
  ['trudge', 'Trudging: arms dangle with hardly any swing.', (T, s, t, sw) => { T.armA = -sw * 0.15; T.armB = sw * 0.15; T.elbA = 0.05; T.elbB = 0.05; }],
  ['trudge', 'Trudging: shoulders slumped forward.', (T) => { T.shrug = -0.5; T.spine = 0.15; }],
  ['trudge', 'Trudging: a sigh now and then.', (T, s, t) => { T.breath = (t % 6 < 1.2) ? 1.2 : 0.2; }],
  ['skid', 'Skid: leaning back hard against the stop.', (T) => { T.lean = -0.3; T.spine = -0.1; }],
  ['skid', 'Skid: the front leg braces out straight.', (T) => { T.legA = 0.7; T.kneeA = 0; T.footA = 0.5; }],
  ['skid', 'Skid: the back knee bends deep.', (T) => { T.legB = -0.2; T.kneeB = 0.6; }],
  ['skid', 'Skid: arms fly forward for balance.', (T) => { T.armA = 1.6; T.armB = 1.3; T.elbA = 0.2; T.elbB = 0.3; T.handA = 0; T.handB = 0; }],
  ['skid', 'Skid: a little puff of dust kicks up.', (T, s) => { if (!s.skidDust) { s.skidDust = 1; try { Parts.emit('dust', s.x + s.face * 6, (Render.lastW ? Render.lastW.floorY(s.f) : 0) - 2, 3, { sx: 6 }); } catch (e) { /* ok */ } } }],
  ['land', 'Landing: knees absorb the drop.', (T, s) => { const k = clamp(num(s.land), 0, 1); T.kneeA = k * 0.9; T.kneeB = k * 0.8; T.crouch = k * 0.35; }],
  ['land', 'Landing: arms swing down and out.', (T) => { T.armA = 0.5; T.armB = -0.3; T.elbA = 0.2; }],
  ['land', 'Landing: the head dips, then comes up.', (T, s) => { T.tilt = num(s.land) * 0.2; }],
  ['land', 'Landing: a breath out on impact.', (T) => { T.breath = -0.6; T.jaw = 0.25; }],
  ['land', 'Landing: toes flat on the floor.', (T) => { T.footA = 0; T.footB = 0; }],
  ['search', 'Searching: one arm reaches deep into the container.', (T, s, t) => { T.armA = 1.5 + Math.sin(t * 7) * 0.3; T.elbA = 0.3 + Math.abs(Math.sin(t * 7)) * 0.5; }],
  ['search', 'Searching: the other hand holds the lid or door.', (T) => { T.armB = 2.2; T.elbB = 0.6; T.handB = 2; }],
  ['search', 'Searching: bent over at the waist.', (T) => { T.lean = 0.35; T.spine = 0.15; }],
  ['search', 'Searching: knees bend to get lower.', (T) => { T.kneeA = 0.3; T.kneeB = 0.35; T.crouch = 0.15; }],
  ['search', 'Searching: the head turns to look inside.', (T, s, t) => { T.tilt = 0.25 + Math.sin(t * 2) * 0.08; T.lookY = 0.8; }],
  ['search', 'Searching: the reaching hand opens and closes.', (T, s, t) => { T.handA = Math.sin(t * 7) > 0 ? 0 : 1; }],
  ['search', 'Searching: shifting weight while rummaging.', (T, s, t) => { T.sway = Math.sin(t * 1.4) * 0.7; }],
  ['heave', 'Heaving: both hands grip and pull.', (T) => { T.handA = 2; T.handB = 2; T.armA = 1.3; T.armB = 1.2; }],
  ['heave', 'Heaving: elbows pump with each pull.', (T, s, t) => { const k = Math.max(0, Math.sin(t * 5)); T.elbA = 0.3 + k * 0.9; T.elbB = 0.4 + k * 0.8; }],
  ['heave', 'Heaving: leaning back into each pull.', (T, s, t) => { T.lean = 0.1 - Math.max(0, Math.sin(t * 5)) * 0.3; }],
  ['heave', 'Heaving: legs braced wide.', (T) => { T.legA = 0.35; T.legB = -0.3; T.kneeA = 0.3; T.kneeB = 0.2; }],
  ['heave', 'Heaving: a grimace and clenched jaw.', (T) => { T.jaw = 0; T.tilt = -0.1; }],
  ['heave', 'Heaving: hard breathing between pulls.', (T, s, t) => { T.breath = Math.sin(t * 5) * 1.1; }],
  ['turn', 'Turning: weight drops onto the pivot foot.', (T) => { T.kneeA = 0.3; T.kneeB = 0.1; T.footB = -0.3; }],
  ['turn', 'Turning: arms swing across with the turn.', (T) => { T.armA = 0.6; T.armB = -0.4; T.elbA = 0.4; }],
  ['turn', 'Turning: the head leads the turn.', (T) => { T.tilt = -0.08; }],
  ['turn', 'Turning: a quick hip shift.', (T) => { T.sway = -0.9; }],
  ['bored', 'Bored: rocking from heel to toe.', (T, s, t) => { T.footA = Math.sin(t * 2.4) * 0.3; T.footB = T.footA; T.bob = Math.sin(t * 2.4) * 0.5; }],
  ['bored', 'Bored: hands clasped behind the back.', (T) => { T.armA = -0.5; T.armB = -0.5; T.elbA = 1.2; T.elbB = 1.2; }],
  ['bored', 'Bored: looking around the room.', (T, s, t) => { T.tilt = Math.sin(t * 0.6) * 0.15; T.lookY = Math.sin(t * 0.4) * 0.6; }],
  ['bored', 'Bored: a yawn now and then.', (T, s, t) => { if (t % 11 < 1.4) { T.jaw = 0.9; T.armA = 2.6; T.elbA = 1.6; } }],
  ['bored', 'Bored: a long sigh.', (T, s, t) => { T.breath = (t % 7 < 1.5) ? 1.3 : 0.2; }],
  ['bored', 'Bored: humming under the breath.', (T, s, t) => { T.jaw = Math.max(T.jaw, Math.max(0, Math.sin(t * 4)) * 0.15); }]
);
(function () {
  const _pick = Rig.pickAnim;
  Rig.pickAnim = function (s) {
    const a = _pick.call(this, s);
    if (a === 'walk' || a === 'run') { if (s.carry) return 'carry'; }
    if (a === 'walk') { if (s.wound || num(s.health, 100) < 35) return 'limp'; if (num(s.cold, 100) < 25) return 'coldwalk'; if (num(s.fatigue, 100) < 20 || num(s.morale, 50) < 18) return 'trudge'; }
    if ((a === 'idle' || a === 'crouch' || a === 'shiver') && num(s.skidT) > 0) return 'skid';
    if (a === 'idle' && num(s.land) > 0.35) return 'land';
    if (a === 'interact' && s.busy && /^(Search|Take|Check|Open)/.test(s.busy.label || '')) return 'search';
    if (a === 'interact' && s.busy && /(Crank|crank|Pry|pry|Force|force|Break|Lift|lift|Clear|clear)/.test(s.busy.label || '')) return 'heave';
    if (a === 'idle' && num(s.turnT) > 0.45) return 'turn';
    if (a === 'idle' && num(s.idleT) > 9) return 'bored';
    return a;
  };
  const _up = Rig.update;
  Rig.update = function (s, dt, t) {
    const v = Math.abs(num(s.vx)); if (num(s.lastSpd) > 100 && v < 20) { s.skidT = 0.3; s.skidDust = 0; } s.lastSpd = v; s.skidT = Math.max(0, num(s.skidT) - dt);
    s.idleT = v < 4 && !s.busy && !s.sleeping && !s.cl ? num(s.idleT) + dt : 0;
    return _up.call(this, s, dt, t);
  };
  // the new animations walk with the stride from the walk cycle; the old target only knew the old ones
})();
DEMO.push('carry', 'limp', 'coldwalk', 'trudge', 'search', 'heave', 'bored');
SYS('New animations', 'The survivors screen move preview now also shows carrying, limping, the cold walk, trudging, searching, heaving and the bored wait.');
SYS('New animations', 'The bored wait only starts after nine seconds of standing still, and stops the moment a neighbour moves, sleeps, climbs or starts a job.');
SYS('New animations', 'The new animations are chosen automatically from what a neighbour is doing and how they feel.');
SYS('New animations', 'Carrying, limping, cold and trudging walks only replace the normal walk; sprinting, sneaking and climbing are unchanged.');

/* ---------- I. moods: [mood, animation, what, fn] ---------- */
const MOODS = {
  sad: s => num(s.morale, 50) < 30, happy: s => num(s.morale, 50) > 75, hungry: s => num(s.hunger, 100) < 25, cold: s => num(s.cold, 100) < 35,
  sick: s => !!s.sick, tired: s => num(s.fatigue, 100) < 25, hurt: s => num(s.health, 100) < 40, scared: s => num(s.flare) > 0.1
};
const MOOD = [
  ['sad', 'walk', 'Sad walking: a slower arm swing.', (T) => { T.armA *= 0.6; T.armB *= 0.6; }],
  ['sad', 'walk', 'Sad walking: eyes on the floor.', (T) => { T.lookY = 0.8; T.tilt += 0.1; }],
  ['sad', 'idle', 'Sad idle: arms wrapped around themselves.', (T) => { T.elbA = 1.5; T.elbB = 1.5; T.armA = 0.7; T.armB = 0.7; }],
  ['sad', 'idle', 'Sad idle: shoulders curled in.', (T) => { T.shrug -= 0.3; T.spine += 0.1; }],
  ['sad', 'sit', 'Sad sitting: head in hands.', (T) => { T.armA = 2.3; T.armB = 2.2; T.elbA = 1.8; T.elbB = 1.8; T.tilt = 0.3; }],
  ['sad', 'interact', 'Sad working: slower, heavier hands.', (T) => { T.elbA *= 0.7; }],
  ['happy', 'walk', 'Happy walking: a bounce in the step.', (T, s, t, sw) => { T.bob += Math.abs(sw) * 0.8; }],
  ['happy', 'walk', 'Happy walking: chin up.', (T) => { T.tilt -= 0.08; T.lookY -= 0.3; }],
  ['happy', 'idle', 'Happy idle: a little sway, as if to music.', (T, s, t) => { T.sway = Math.sin(t * 2) * 0.9; }],
  ['happy', 'idle', 'Happy idle: hands on hips now and then.', (T, s, t) => { if (Math.sin(t * 0.25 + s.x) > 0.6) { T.armA = -0.3; T.armB = -0.3; T.elbA = 1.6; T.elbB = 1.6; T.reach = -0.3; } }],
  ['happy', 'run', 'Happy running: a lighter, springier stride.', (T, s, t, sw) => { T.bob += Math.abs(sw) * 0.6; }],
  ['happy', 'interact', 'Happy working: humming along.', (T, s, t) => { T.jaw = Math.max(0, Math.sin(t * 4)) * 0.15; }],
  ['hungry', 'walk', 'Hungry walking: a hand on the stomach.', (T) => { T.armB = 0.4; T.elbB = 1.4; }],
  ['hungry', 'idle', 'Hungry idle: a little doubling-over now and then.', (T, s, t) => { if (t % 8 < 0.8) T.spine += 0.15; }],
  ['hungry', 'sit', 'Hungry sitting: hugging the knees.', (T) => { T.elbA = 1.5; T.elbB = 1.5; T.kneeA += 0.3; }],
  ['hungry', 'interact', 'Hungry working: stops to rub the stomach.', (T, s, t) => { if (t % 9 < 0.9) { T.armB = 0.4; T.elbB = 1.4; } }],
  ['cold', 'idle', 'Cold idle: stamping feet.', (T, s, t) => { T.kneeA = Math.max(0, Math.sin(t * 5)) * 0.4; }],
  ['cold', 'idle', 'Cold idle: hands tucked in armpits.', (T) => { T.armA = 0.3; T.armB = 0.3; T.elbA = 1.8; T.elbB = 1.8; }],
  ['cold', 'run', 'Cold running: shoulders hunched.', (T) => { T.shrug += 0.5; }],
  ['cold', 'sneak', 'Cold sneaking: a shiver in the arms.', (T, s, t) => { T.elbA += Math.sin(t * 30) * 0.05; }],
  ['cold', 'sit', 'Cold sitting: knees drawn up, rocking.', (T, s, t) => { T.kneeA += 0.3; T.sway = Math.sin(t * 2) * 0.6; }],
  ['cold', 'interact', 'Cold working: blowing on the fingers between tasks.', (T, s, t) => { if (t % 7 < 0.8) { T.armA = 2.4; T.elbA = 1.8; T.jaw = 0.3; } }],
  ['sick', 'walk', 'Sick walking: unsteady, weaving a little.', (T, s, t) => { T.sway += Math.sin(t * 1.3) * 0.8; }],
  ['sick', 'walk', 'Sick walking: a hand to the forehead.', (T, s, t) => { if (t % 10 < 2) { T.armA = 2.6; T.elbA = 1.6; } }],
  ['sick', 'idle', 'Sick idle: hunched, arms crossed.', (T) => { T.spine += 0.12; T.elbA = 1.6; T.elbB = 1.6; }],
  ['sick', 'idle', 'Sick idle: sniffing.', (T, s, t) => { if (t % 4 < 0.2) T.tilt -= 0.1; }],
  ['sick', 'sleep', 'Sick sleeping: restless turning.', (T, s, t) => { T.kneeA = 0.6 + Math.sin(t * 0.5) * 0.3; }],
  ['sick', 'interact', 'Sick working: stops to cough into an elbow.', (T, s, t) => { if (t % 9 < 0.6) { T.armA = 2.2; T.elbA = 1.9; T.spine += 0.1; } }],
  ['tired', 'walk', 'Tired walking: heavy feet.', (T) => { T.kneeA *= 0.5; T.kneeB *= 0.5; }],
  ['tired', 'walk', 'Tired walking: drooping eyelids.', (T) => { T.lookY = 0.5; }],
  ['tired', 'idle', 'Tired idle: rubbing the eyes.', (T, s, t) => { if (t % 12 < 1.2) { T.armA = 2.5; T.elbA = 1.7; T.handA = 1; } }],
  ['tired', 'idle', 'Tired idle: swaying on the feet.', (T, s, t) => { T.sway = Math.sin(t * 0.8) * 0.9; }],
  ['tired', 'sit', 'Tired sitting: nodding off.', (T, s, t) => { T.tilt = 0.1 + Math.max(0, Math.sin(t * 0.7)) * 0.3; }],
  ['tired', 'interact', 'Tired working: slow, deliberate hands.', (T) => { T.elbA *= 0.8; T.elbB *= 0.8; }],
  ['hurt', 'idle', 'Hurt idle: weight kept off one leg.', (T) => { T.kneeB = 0.35; T.sway = 0.7; }],
  ['hurt', 'idle', 'Hurt idle: holding the injured arm.', (T) => { T.elbB = 1.5; T.armB = 0.5; T.elbA = 1.3; T.armA = 0.6; }],
  ['hurt', 'run', 'Hurt running: an uneven, hitching stride.', (T, s, t, sw) => { T.bob += Math.max(0, -sw) * 1.4; }],
  ['hurt', 'sneak', 'Hurt sneaking: one hand on the wall side for support.', (T) => { T.armB = 1.9; T.elbB = 0.2; T.handB = 0; }],
  ['hurt', 'climb', 'Hurt climbing: a wince on each rung.', (T, s, t) => { T.jaw = 0; T.tilt += Math.max(0, Math.sin(t * 9)) * 0.05; }],
  ['hurt', 'sit', 'Hurt sitting: an injured leg stretched out.', (T) => { T.kneeB = 0.1; }],
  ['scared', 'idle', 'Scared idle: looking over the shoulder.', (T, s, t) => { T.tilt = -0.15; T.lookY = Math.sin(t * 3) * 0.5; }],
  ['scared', 'idle', 'Scared idle: hands up near the face.', (T) => { T.elbA = 1.6; T.armA = 1.8; T.handA = 0; }],
  ['scared', 'walk', 'Scared walking: quick glances back.', (T, s, t) => { T.tilt += Math.sin(t * 4) > 0.8 ? -0.15 : 0; }],
  ['scared', 'run', 'Scared running: arms flailing.', (T, s, t) => { T.elbA = 0.2; T.elbB = 0.2; T.handA = 0; T.handB = 0; }],
  ['scared', 'sneak', 'Scared sneaking: frozen for a beat between steps.', (T, s, t) => { if (Math.sin(t * 2) > 0.8) { T.legA *= 0.2; T.legB *= 0.2; } }],
  ['scared', 'hide', 'Scared hiding: trembling.', (T, s, t) => { T.shake = 0.4; }],
  ['scared', 'crouch', 'Scared crouching: arms over the head.', (T) => { T.armA = 2.7; T.armB = 2.6; T.elbA = 1.7; T.elbB = 1.7; }],
  ['scared', 'interact', 'Scared working: hurried, jerky hands.', (T, s, t) => { T.elbA += Math.sin(t * 25) * 0.15; }]
];
const MOOD_BY = {}; for (const m of MOOD) { const k = m[1]; (MOOD_BY[k] || (MOOD_BY[k] = [])).push(m); }

/* ---------- J. how each person does the new animations ---------- */
PERS.push(
  ['marta', 'carry', 'Marta carries with a nurse\'s lift: back straight, knees bent.', (T) => { T.spine = 0; T.lean = -0.04; T.kneeA += 0.1; T.kneeB += 0.1; }],
  ['marta', 'limp', 'Marta limps but keeps her head up, checking on everyone else.', (T) => { T.tilt = -0.02; T.lookY = 0; }],
  ['marta', 'coldwalk', 'Marta walks in the cold with her scarf pulled up to her chin.', (T) => { T.armA = 2.3; T.elbA = 1.9; T.handA = 2; }],
  ['marta', 'trudge', 'Marta trudges counting under her breath.', (T, s, t) => { T.jaw = Math.max(0, Math.sin(t * 3)) * 0.12; }],
  ['marta', 'skid', 'Marta skids with one hand flying to the satchel.', (T) => { T.armB = 0.3; T.elbB = 1.4; }],
  ['marta', 'land', 'Marta lands lightly, checking her satchel is still shut.', (T) => { T.armB = 0.3; T.elbB = 1.4; T.lookY = 0.9; }],
  ['marta', 'search', 'Marta searches tidily, setting things aside in order.', (T, s, t) => { T.armB = 1.6 + Math.sin(t * 3) * 0.2; T.elbB = 0.6; }],
  ['marta', 'heave', 'Marta heaves carefully, never jerking.', (T, s, t) => { T.lean = 0.05 - Math.max(0, Math.sin(t * 3)) * 0.2; }],
  ['marta', 'turn', 'Marta turns to look around her, as if counting heads.', (T) => { T.lookY = -0.2; T.tilt = -0.12; }],
  ['marta', 'bored', 'Marta, bored, rechecks her satchel.', (T, s, t) => { if (t % 8 < 2) { T.armB = 0.6; T.elbB = 1.5; T.lookY = 0.9; T.tilt = 0.2; } }],
  ['marta', 'climb', 'Marta climbs steadily, three points on the rungs at all times.', (T, s, t) => { T.elbA *= 0.8; }],
  ['marta', 'hide', 'Marta hides with a finger to her lips.', (T) => { T.armA = 2.3; T.elbA = 2.2; T.handA = 1; }],
  ['dov', 'carry', 'Dov carries on his shoulder, the way he carried planks.', (T) => { T.armA = 2.6; T.elbA = 2.1; T.handA = 2; T.tilt = 0.12; }],
  ['dov', 'limp', 'Dov\'s limp favours his bad knee, which never fully bends.', (T) => { T.kneeB = 0; }],
  ['dov', 'coldwalk', 'Dov walks in the cold with his hands deep in his cardigan.', (T) => { T.armA = 0.1; T.armB = 0.1; T.elbA = 0.6; T.elbB = 0.6; }],
  ['dov', 'trudge', 'Dov trudges with a hand on his lower back.', (T) => { T.armB = -0.5; T.elbB = 1.6; }],
  ['dov', 'skid', 'Dov stops short and grabs at his knee.', (T) => { T.armB = 0.2; T.elbB = 0.8; T.lean += 0.1; }],
  ['dov', 'land', 'Dov lands heavily on his good leg.', (T) => { T.kneeA = 1; T.kneeB = 0.2; T.jaw = 0; }],
  ['dov', 'search', 'Dov searches like he is checking a joint: tapping, listening.', (T, s, t) => { T.handA = Math.sin(t * 5) > 0 ? 1 : 2; T.tilt += 0.08; }],
  ['dov', 'heave', 'Dov heaves with long, practised strokes.', (T, s, t) => { T.elbA = 0.3 + Math.max(0, Math.sin(t * 3)) * 1.1; T.elbB = 0.4 + Math.max(0, Math.sin(t * 3)) * 1; }],
  ['dov', 'turn', 'Dov turns slowly, his whole body, not just his head.', (T) => { T.tilt = 0; T.sway = -0.5; }],
  ['dov', 'bored', 'Dov, bored, whittles at nothing with his thumb.', (T, s, t) => { T.armA = 0.9; T.armB = 0.9; T.elbA = 1.4; T.elbB = 1.4; T.handA = Math.sin(t * 6) > 0 ? 1 : 2; }],
  ['dov', 'climb', 'Dov climbs with a pause on each rung for his knee.', (T, s, t) => { if (Math.sin(t * 3) > 0.7) T.kneeB = 0.1; }],
  ['dov', 'hide', 'Dov hides holding his breath, cheeks puffed.', (T) => { T.jaw = 0; T.breath = 0.8; }],
  ['ines', 'carry', 'Ines carries at a jog, refusing to slow down much.', (T, s, t, sw) => { T.bob += Math.abs(sw) * 0.5; T.lean = 0.02; }],
  ['ines', 'limp', 'Ines limps fast, hopping more than limping.', (T, s, t, sw) => { T.bob += Math.max(0, sw) * 1.2; }],
  ['ines', 'coldwalk', 'Ines walks in the cold bouncing on her toes to stay warm.', (T, s, t) => { T.footA = 0.3; T.footB = 0.3; T.bob += Math.abs(Math.sin(t * 8)) * 0.4; }],
  ['ines', 'trudge', 'Ines trudges kicking at the floor, annoyed at being slow.', (T, s, t, sw) => { if (sw > 0.8) T.footA = 0.6; }],
  ['ines', 'skid', 'Ines skids neatly, like a runner pulling up.', (T) => { T.lean = -0.18; T.armA = 1; T.armB = -0.6; }],
  ['ines', 'land', 'Ines lands in a quick crouch and is up again at once.', (T, s) => { T.crouch = num(s.land) * 0.45; }],
  ['ines', 'search', 'Ines searches fast, flicking through things.', (T, s, t) => { T.armA = 1.5 + Math.sin(t * 12) * 0.3; }],
  ['ines', 'heave', 'Ines heaves with her whole body, feet planted against the work.', (T) => { T.legA = 0.5; T.kneeA = 0.5; T.lean = -0.15; }],
  ['ines', 'turn', 'Ines spins round on one foot.', (T) => { T.footB = 0.5; T.kneeA = 0.6; }],
  ['ines', 'bored', 'Ines, bored, stretches her calves against the wall.', (T, s, t) => { if (t % 10 < 4) { T.legB = -0.6; T.kneeB = 0; T.lean = 0.2; T.armA = 1.6; T.elbA = 0.1; } }],
  ['ines', 'climb', 'Ines climbs two rungs at a time.', (T, s, t) => { T.kneeA *= 1.3; }],
  ['ines', 'hide', 'Ines hides coiled, ready to bolt.', (T) => { T.kneeA = 0.9; T.kneeB = 0.9; T.lean = 0.2; }],
  ['toby', 'carry', 'Toby carries things hugged tight to his chest, waddling.', (T) => { T.elbA = 1.7; T.elbB = 1.7; T.sway = 0.6; }],
  ['toby', 'limp', 'Toby limps with his lip trembling.', (T, s, t) => { T.jaw = 0.1 + Math.sin(t * 20) * 0.05; }],
  ['toby', 'coldwalk', 'Toby walks in the cold with his hands up his sleeves.', (T) => { T.handA = -1; T.handB = -1; }],
  ['toby', 'trudge', 'Toby trudges dragging his feet, as tired children do.', (T) => { T.footA = -0.1; T.footB = -0.1; T.tilt = 0.35; }],
  ['toby', 'skid', 'Toby skids and nearly topples over.', (T, s, t) => { T.sway = Math.sin(t * 15) * 1.2; }],
  ['toby', 'land', 'Toby lands with his arms out wide, like a plane.', (T) => { T.armA = 1.6; T.armB = 1.6; T.elbA = 0; T.elbB = 0; }],
  ['toby', 'search', 'Toby searches on tiptoe to see inside.', (T) => { T.footA = 0.5; T.footB = 0.5; T.crouch = 0; T.kneeA = 0; T.kneeB = 0; }],
  ['toby', 'heave', 'Toby heaves with his tongue poking out in effort.', (T) => { T.jaw = 0.3; }],
  ['toby', 'turn', 'Toby turns with a little hop.', (T) => { T.bob = -1.2; }],
  ['toby', 'bored', 'Toby, bored, draws in the air with a finger.', (T, s, t) => { T.armA = 1.8 + Math.sin(t * 3) * 0.3; T.elbA = 0.4 + Math.cos(t * 3) * 0.3; T.handA = 1; }],
  ['toby', 'climb', 'Toby climbs with his knees up high, rung by rung.', (T) => { T.kneeA *= 1.25; T.kneeB *= 1.25; }],
  ['toby', 'hide', 'Toby peeks out between his fingers every few seconds while hiding.', (T, s, t) => { if (t % 5 < 1) { T.handA = 0; T.lookY = 0.2; T.tilt = -0.08; } }],
  ['bea', 'carry', 'Granny carries on her hip, like a basket of washing.', (T) => { T.armB = 0.6; T.elbB = 1.6; T.sway = 0.9; }],
  ['bea', 'limp', 'Granny limps grumbling, jaw working.', (T, s, t) => { T.jaw = Math.max(0, Math.sin(t * 5)) * 0.2; }],
  ['bea', 'coldwalk', 'Granny walks in the cold clutching her shawl together.', (T) => { T.armA = 2; T.elbA = 2; T.handA = 2; }],
  ['bea', 'trudge', 'Granny trudges with a stoop and a hand on each knee now and then.', (T, s, t) => { if (t % 9 < 1.5) { T.spine = 0.3; T.armA = 0.9; T.armB = 0.9; T.elbA = 0.2; T.elbB = 0.2; } }],
  ['bea', 'skid', 'Granny stops dead and wags a finger.', (T, s, t) => { T.armA = 1.8; T.elbA = 0.9; T.handA = 1; T.elbA += Math.sin(t * 14) * 0.2; }],
  ['bea', 'land', 'Granny lands with a hand flying to her back.', (T) => { T.armB = -0.5; T.elbB = 1.6; }],
  ['bea', 'search', 'Granny searches sniffing everything, cook\'s nose first.', (T, s, t) => { T.tilt = 0.15 + Math.sin(t * 9) * 0.03; }],
  ['bea', 'heave', 'Granny heaves in short bursts, then rests.', (T, s, t) => { if (t % 3 > 2) { T.elbA = 0.4; T.elbB = 0.4; T.lean = 0.1; } }],
  ['bea', 'turn', 'Granny turns with a sharp look.', (T) => { T.tilt = -0.15; T.lookY = -0.3; }],
  ['bea', 'bored', 'Granny, bored, taps her spoon in her palm.', (T, s, t) => { T.armA = 1.1; T.elbA = 1.2 + Math.max(0, Math.sin(t * 4)) * 0.3; T.armB = 0.9; T.elbB = 1.4; }],
  ['bea', 'climb', 'Granny climbs one rung, both feet, then the next.', (T, s, t) => { T.kneeB = T.kneeA; }],
  ['bea', 'hide', 'Granny hides gripping her spoon like a club.', (T) => { T.armA = 2.4; T.elbA = 1.4; T.handA = 2; }],
  ['ravi', 'carry', 'Ravi carries things on his back, like a bike over a fence.', (T) => { T.armA = 2.5; T.armB = 2.4; T.elbA = 2.2; T.elbB = 2.2; T.lean = 0.12; }],
  ['ravi', 'limp', 'Ravi limps with a theatrical sigh.', (T, s, t) => { T.breath = (t % 4 < 0.8) ? 1.4 : 0.3; }],
  ['ravi', 'coldwalk', 'Ravi walks in the cold with his jacket collar up and his beanie pulled down.', (T) => { T.shrug += 0.3; T.tilt += 0.05; }],
  ['ravi', 'trudge', 'Ravi trudges with his hands jammed in his pockets.', (T) => { T.armA = 0; T.armB = 0; T.elbA = 0.5; T.elbB = 0.5; T.handA = -1; T.handB = -1; }],
  ['ravi', 'skid', 'Ravi skids like he is braking a bike: one foot down.', (T) => { T.legA = 0.9; T.kneeA = 0; T.legB = 0; T.kneeB = 0.7; }],
  ['ravi', 'land', 'Ravi lands and does a little "ta-da".', (T, s) => { if (num(s.land) < 0.5) { T.armA = 2; T.armB = 2; T.elbA = 0; T.elbB = 0; } }],
  ['ravi', 'search', 'Ravi searches with a mechanic\'s squint.', (T) => { T.tilt = 0.2; T.lookY = 0.6; }],
  ['ravi', 'heave', 'Ravi heaves like he is cracking a stuck bolt: short sharp yanks.', (T, s, t) => { T.elbA = 0.3 + (Math.sin(t * 9) > 0.5 ? 1 : 0); }],
  ['ravi', 'turn', 'Ravi turns with a sliding pivot on his heel.', (T) => { T.footA = -0.4; }],
  ['ravi', 'bored', 'Ravi, bored, spins a nut on his finger.', (T, s, t) => { T.armA = 1.2; T.elbA = 1.4; T.handA = 1; T.elbA += Math.sin(t * 12) * 0.08; }],
  ['ravi', 'climb', 'Ravi climbs hand over hand, quick and loose.', (T) => { T.elbA *= 1.1; T.elbB *= 1.1; }],
  ['ravi', 'hide', 'Ravi hides peeking out with one eye.', (T, s, t) => { T.tilt = -0.2 + Math.sin(t * 1.5) * 0.08; }],
  ['yara', 'carry', 'Yara carries things as carefully as her radio.', (T) => { T.elbA = 1.5; T.elbB = 1.5; T.lean = -0.06; T.bob *= 0.6; }],
  ['yara', 'limp', 'Yara limps talking to herself to keep calm.', (T, s, t) => { T.jaw = Math.abs(Math.sin(t * 9)) * 0.2; }],
  ['yara', 'coldwalk', 'Yara walks in the cold with her sweater sleeves pulled over her hands.', (T) => { T.handA = -1; T.handB = -1; T.armA = 0.9; T.elbA = 1.6; }],
  ['yara', 'trudge', 'Yara trudges with a hand at her temple.', (T) => { T.armA = 2.6; T.elbA = 1.8; T.handA = 0; }],
  ['yara', 'skid', 'Yara stops short with a gasp, hands to her mouth.', (T) => { T.armA = 2.4; T.armB = 2.3; T.elbA = 2; T.elbB = 2; T.jaw = 0.6; }],
  ['yara', 'land', 'Yara lands with a nervous glance behind her.', (T) => { T.tilt = -0.18; }],
  ['yara', 'search', 'Yara searches as if tuning a dial, slow and careful.', (T, s, t) => { T.handA = 1; T.elbA = 0.6 + Math.sin(t * 2) * 0.15; }],
  ['yara', 'heave', 'Yara heaves with her eyes squeezed shut.', (T) => { T.lookY = 0.5; T.jaw = 0; }],
  ['yara', 'turn', 'Yara turns quickly, startled.', (T) => { T.shake = 0.3; T.armA = 1.8; T.elbA = 1.2; }],
  ['yara', 'bored', 'Yara, bored, rehearses a broadcast, gesturing.', (T, s, t) => { T.armA = 1.4 + Math.sin(t * 2.2) * 0.4; T.elbA = 0.8; T.handA = 0; T.jaw = Math.abs(Math.sin(t * 8)) * 0.3; }],
  ['yara', 'climb', 'Yara climbs without looking down.', (T) => { T.lookY = -0.8; }],
  ['yara', 'hide', 'Yara hides hugging her knees, rocking a little.', (T, s, t) => { T.elbA = 1.8; T.elbB = 1.8; T.sway = Math.sin(t * 2) * 0.5; }],
  ['pavel', 'carry', 'Pavel carries loads easily, barely slowing.', (T) => { T.lean = 0; T.spine = 0; T.kneeA *= 0.6; T.kneeB *= 0.6; }],
  ['pavel', 'limp', 'Pavel limps heavily; each step thuds.', (T, s, t, sw) => { T.bob += Math.max(0, -sw) * 1.4; }],
  ['pavel', 'coldwalk', 'Pavel walks in the cold rubbing his big hands together.', (T, s, t) => { T.armA = 1.2; T.armB = 1.2; T.elbA = 1.4 + Math.sin(t * 10) * 0.15; T.elbB = 1.4 - Math.sin(t * 10) * 0.15; }],
  ['pavel', 'trudge', 'Pavel trudges like a guard at the end of a long shift.', (T) => { T.armA = -0.2; T.armB = -0.2; T.elbA = 1.1; T.elbB = 1.1; }],
  ['pavel', 'skid', 'Pavel takes a few steps to stop, like a big ship.', (T) => { T.lean = -0.15; }],
  ['pavel', 'land', 'Pavel lands with a floor-shaking thump.', (T, s) => { T.crouch = num(s.land) * 0.4; T.shake = num(s.land) * 0.5; }],
  ['pavel', 'search', 'Pavel searches gently, as if afraid to break things.', (T, s, t) => { T.elbA = 0.5 + Math.sin(t * 2.5) * 0.15; }],
  ['pavel', 'heave', 'Pavel heaves once and the thing just gives.', (T, s, t) => { T.elbA = 0.4 + Math.max(0, Math.sin(t * 2)) * 0.6; T.lean = 0; }],
  ['pavel', 'turn', 'Pavel turns slowly, like a guard on patrol.', (T) => { T.tilt = 0.04; }],
  ['pavel', 'bored', 'Pavel, bored, stands at ease like a guard.', (T) => { T.armA = -0.4; T.armB = -0.4; T.elbA = 1; T.elbB = 1; T.legA = 0.15; T.legB = -0.15; }],
  ['pavel', 'climb', 'Pavel climbs and the ladder creaks; he goes slow.', (T) => { T.elbA *= 0.85; }],
  ['pavel', 'hide', 'Pavel hides trying to make himself small, which does not work.', (T) => { T.shrug = 0.8; T.crouch = Math.max(T.crouch, 0.25); }],
  ['lamp', 'carry', 'The Lamplighter carries with the pole tucked under one arm.', (T) => { T.armB = 0.2; T.elbB = 0.9; }],
  ['lamp', 'limp', 'The Lamplighter leans on the brass pole like a staff to limp.', (T) => { T.armA = 1.2; T.elbA = 0.3; T.handA = 2; T.lean = 0.15; }],
  ['lamp', 'coldwalk', 'The Lamplighter walks in the cold with the cloak drawn round.', (T) => { T.armA = 0.6; T.armB = 0.6; T.elbA = 1.8; T.elbB = 1.8; }],
  ['lamp', 'trudge', 'The Lamplighter trudges like a very old pilgrim.', (T) => { T.spine = 0.2; T.tilt = 0.25; }],
  ['lamp', 'skid', 'The Lamplighter stops gracefully, cloak swinging forward.', (T) => { T.lean = -0.08; }],
  ['lamp', 'land', 'The Lamplighter lands silently, as if it weighed nothing.', (T) => { T.crouch *= 0.5; T.shake = 0; }],
  ['lamp', 'search', 'The Lamplighter searches by feel, eyes half closed.', (T) => { T.lookY = 0.3; T.tilt = -0.05; }],
  ['lamp', 'heave', 'The Lamplighter heaves with the pole as a lever.', (T, s, t) => { T.armA = 1.6; T.armB = 1.4; T.elbA = 0.2; T.elbB = 0.5 + Math.max(0, Math.sin(t * 3)) * 0.5; }],
  ['lamp', 'turn', 'The Lamplighter turns without seeming to move their feet.', (T) => { T.kneeA = 0; T.kneeB = 0; T.sway = 0; }],
  ['lamp', 'bored', 'The Lamplighter, waiting, watches the window without blinking.', (T) => { T.tilt = -0.1; T.lookY = -0.4; T.breath = 0.1; }],
  ['lamp', 'climb', 'The Lamplighter climbs smoothly, hardly bobbing.', (T) => { T.bob *= 0.4; }],
  ['lamp', 'hide', 'The Lamplighter hides perfectly still.', (T) => { T.breath = 0; T.shake = 0; T.sway = 0; }]
);
const PERS_BY = {}; for (const p of PERS) { const k = p[0] + ':' + p[1]; (PERS_BY[k] || (PERS_BY[k] = [])).push(p[3]); }
const ANIMX_BY = {}; for (const a of ANIMX) (ANIMX_BY[a[0]] || (ANIMX_BY[a[0]] = [])).push(a[2]);

/* ---------- the new target and update ---------- */
(function () {
  const _target = Rig.target;
  Rig.target = function (s, t) {
    const T = _target.call(this, s, t);
    for (const k of POSE_KEYS) T[k] = 0;
    const a = s.anim, sw = Math.sin(s.ph || 0), cw = Math.cos(s.ph || 0);
    const fx = ANIMX_BY[a]; if (fx) for (const f of fx) f(T, s, t, sw, cw);
    applyStyle(T, s, t);
    const ps = PERS_BY[s.id + ':' + a]; if (ps) for (const f of ps) f(T, s, t, sw, cw);
    const ms = MOOD_BY[a]; if (ms) for (const m of ms) if (MOODS[m[0]](s)) m[3](T, s, t, sw, cw);
    if (Save.s.reduce) { T.sway *= 0.5; T.breath *= 0.5; T.jaw *= 0.5; }
    return T;
  };
  SYS('Rig', 'A Reduce Intensity setting halves sway, breathing and jaw motion.');
  const _update = Rig.update;
  Rig.update = function (s, dt, t) {
    const P = s.pose; for (const k of POSE_KEYS) if (P[k] == null || !Number.isFinite(P[k])) P[k] = 0;
    s.anim = this.pickAnim(s);
    const T = this.target(s, t), k = Math.min(1, dt * (EASE_RATE[s.anim] || 14) * (STY(s, 'fidget') > 1.2 ? 1.1 : 1));
    for (const key in T) P[key] += (T[key] - P[key]) * k;
    // the rest of the old update: blinking, glances, springs and timers
    s.blink -= dt; if (s.blink < 0) s.blink = (2.5 + Math.random() * 3.5) / STY(s, 'blink');
    if (Math.random() < dt * 0.25 * STY(s, 'gaze')) s.glance = Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? -1 : 1);
    s.sacc = Math.random() < dt * 2.5 ? (Math.random() - 0.5) * 0.7 : num(s.sacc);
    const sp = s.sp, mv = Math.abs(s.vx);
    sp.scarf.t = clamp(mv * 0.075, 0, 10) + Math.sin(t * 2.1 + s.x * 0.02) * 1.2; sp.hair.t = clamp(mv * 0.04, 0, 5) + (s.anim === 'jump' ? clamp(-num(s.jv) * 0.02, -4, 4) : 0); sp.hem.t = clamp(mv * 0.03, 0, 4);
    if (!sp.hat) sp.hat = new Spring(0, 160, 7); sp.hat.t = clamp(mv * 0.03, 0, 4) - P.bob * 0.6; sp.hat.step(dt);
    if (!sp.pack) sp.pack = new Spring(0, 120, 8); sp.pack.t = -P.bob * 0.8 + (s.anim === 'jump' ? 2 : 0); sp.pack.step(dt);
    sp.scarf.step(dt); sp.hair.step(dt); sp.hem.step(dt);
    for (const key of ['hurtT', 'actT', 'comfortT', 'coughT', 'gestureT', 'prot', 'stun', 'cool']) if (s[key] > 0) s[key] = Math.max(0, s[key] - dt);
    s.flare = Math.max(0, s.flare - dt * 0.9);
    if (s.lastFace !== s.face) { if (s.lastFace) s.turnT = 1; s.lastFace = s.face; }
    s.turnT = Math.max(0, num(s.turnT) - dt * 9); s.land = Math.max(0, num(s.land) - dt * 6);
    if (s.bubble) { s.bubble.t -= dt; if (s.bubble.t <= 0) s.bubble = null; }
    s.animT = s.anim === s.prevAnim ? num(s.animT) + dt : 0; s.prevAnim = s.anim;
  };
  SYS('Rig', 'Blink timing follows each neighbour\'s own blink rate.');
  SYS('Rig', 'Eyes make tiny darting movements (saccades) between glances.');
  SYS('Rig', 'Hair is thrown up by a jump and settles after the landing.');
  SYS('Rig', 'Hats have their own spring and bob a beat behind the head.');
  SYS('Rig', 'Backpacks have their own spring: they bounce on each step and lift on a jump.');
  SYS('Rig', 'The rig remembers how long the current animation has been playing, for timed touches.');
  SYS('Rig', 'Restless neighbours blend between poses a little faster.');
})();

/* ---------- E. costume details: [who, layer, what, fn(c, S)] ----------
   layers: pre (colours), back (behind the body), legs, torso, head (hair layer), face, hand (front hand) */
const DETAIL = [
  ['marta', 'pre', 'Marta wears dark nurse\'s stockings under her skirt-length coat.', S => { S.pants = grey(28); }],
  ['marta', 'pre', 'Marta\'s shoes are sensible flat nurse\'s shoes.', S => { S.shoe = grey(24); S.shoeW = 0.95; }],
  ['marta', 'back', 'Marta\'s first-aid satchel hangs at her back hip.', (c, S) => { c.fillStyle = grey(70); rrect(c, -S.tw / 2 - 4, -9, 8, 9, 2); c.fill(); }],
  ['marta', 'back', 'The satchel has a white cross on it.', (c, S) => { c.fillStyle = grey(215); c.fillRect(-S.tw / 2 - 1.2, -6.8, 2.4, 0.9); c.fillRect(-S.tw / 2 - 0.45, -7.6, 0.9, 2.4); }],
  ['marta', 'torso', 'A satchel strap runs across Marta\'s chest.', (c, S) => { c.strokeStyle = grey(52); c.lineWidth = 1.3; c.beginPath(); c.moveTo(S.tw / 2 - 2, -S.th + 2); c.lineTo(-S.tw / 2 + 1, -6); c.stroke(); }],
  ['marta', 'torso', 'An upside-down nurse\'s watch is pinned to her chest.', (c, S) => { c.fillStyle = grey(200); c.beginPath(); c.arc(S.tw / 2 - 3.5, -S.th + 8, 1.2, 0, TAU); c.fill(); c.fillStyle = grey(40); c.fillRect(S.tw / 2 - 3.7, -S.th + 7.8, 0.4, 0.8); }],
  ['marta', 'torso', 'A pen peeks out of her breast pocket.', (c, S) => { c.fillStyle = grey(30); c.fillRect(S.tw / 2 - 5.5, -S.th + 4.5, 0.8, 3); c.strokeStyle = grey(0, 0.25); c.lineWidth = 0.5; c.strokeRect(S.tw / 2 - 6.6, -S.th + 6, 3, 2.6); }],
  ['marta', 'head', 'A hairpin glints in Marta\'s bun.', (c, S) => { c.strokeStyle = grey(210); c.lineWidth = 0.6; c.beginPath(); c.moveTo(-S.hr - 1.5, -S.hr + 0.5); c.lineTo(-S.hr + 2.5, -S.hr + 2.2); c.stroke(); }],
  ['marta', 'head', 'A stray strand of hair escapes the bun and sways.', (c, S) => { c.strokeStyle = S.hair; c.lineWidth = 0.6; c.beginPath(); c.moveTo(S.hr * 0.2, -S.hr + 0.6); c.quadraticCurveTo(S.hr * 0.8, -S.hr * 0.2 + S.hs * 0.3, S.hr * 0.7, S.hr * 0.25 + S.hs * 0.4); c.stroke(); }],
  ['marta', 'face', 'Tired shadows under Marta\'s eyes when she has carried too much.', (c, S) => { if (S.s.fatigue < 45 || S.s.morale < 40) { c.fillStyle = grey(30, 0.25); c.fillRect(S.hr * 0.05, 0.7, S.hr * 0.75, 0.7); } }],
  ['marta', 'face', 'A small plaster on Marta\'s cheekbone.', (c, S) => { c.fillStyle = grey(225, 0.9); c.fillRect(-0.3, 1.2, 2.4, 1.2); c.fillStyle = grey(160, 0.6); c.fillRect(0.6, 1.4, 0.5, 0.8); }],
  ['marta', 'hand', 'Marta\'s sleeves are rolled to the forearm.', (c, S) => { c.strokeStyle = S.dark; c.lineWidth = 1.8; c.beginPath(); c.moveTo(S.elb[0], S.elb[1]); c.lineTo(lerp(S.elb[0], S.hand[0], 0.25), lerp(S.elb[1], S.hand[1], 0.25)); c.stroke(); }],
  ['marta', 'torso', 'Her scarf is tied in a nurse\'s neat knot.', (c, S) => { if (!S.mono) { c.fillStyle = S.dark; c.beginPath(); c.arc(S.tw / 2 - 2, -S.th + 2.5, 1.7, 0, TAU); c.fill(); } }],
  ['marta', 'torso', 'The scarf tail ends in a little fringe.', (c, S) => { c.strokeStyle = S.main; c.lineWidth = 0.6; const x = -S.tw / 2 - 4 - S.tail, y = -S.th + 10 - S.tail * 0.5; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x - 1 + i, y); c.lineTo(x - 1.4 + i, y + 2); c.stroke(); } }],
  ['marta', 'torso', 'Marta\'s coat has a darker hem band.', (c, S) => { c.fillStyle = S.dark; c.fillRect(-S.tw / 2 + 1, -1, S.tw - 2, 2); }],
  ['marta', 'legs', 'Marta\'s shoes have a strap across the instep.', (c, S) => { c.strokeStyle = grey(60); c.lineWidth = 0.6; for (const f of [S.fA, S.fB]) { c.beginPath(); c.moveTo(f[0] + 0.5, f[1] - 2); c.lineTo(f[0] + 2.2, f[1] - 0.6); c.stroke(); } }],

  ['dov', 'pre', 'Dov wears brown-grey work trousers.', S => { S.pants = grey(44); }],
  ['dov', 'pre', 'Dov wears big, heavy work boots.', S => { S.shoe = grey(14); S.shoeW = 1.2; }],
  ['dov', 'head', 'A carpenter\'s pencil behind Dov\'s ear.', (c, S) => { c.strokeStyle = grey(150); c.lineWidth = 1; c.beginPath(); c.moveTo(-2.6, -1.4); c.lineTo(0.6, 2.4); c.stroke(); c.fillStyle = grey(40); c.fillRect(0.3, 2.1, 0.7, 0.7); }],
  ['dov', 'head', 'A little badge on the front of Dov\'s flat cap.', (c, S) => { c.fillStyle = grey(150); c.fillRect(S.hr - 3.4, -S.hr + 1.6, 1.2, 1.2); }],
  ['dov', 'face', 'Grey stubble on Dov\'s chin.', (c, S) => { c.fillStyle = grey(110, 0.45); for (let i = 0; i < 7; i++) c.fillRect(S.hr * 0.1 + (i % 4) * 1.3, 3.6 + Math.floor(i / 4) * 1.1, 0.5, 0.5); }],
  ['dov', 'face', 'Thick, bushy eyebrows.', (c, S) => { c.strokeStyle = grey(140); c.lineWidth = 1.3; c.beginPath(); c.moveTo(S.ex[0] - 1.4, -3.4); c.lineTo(S.ex[0] + 1.3, -3.5); c.moveTo(S.ex[1] - 1.2, -3.5); c.lineTo(S.ex[1] + 1.2, -3.3); c.stroke(); }],
  ['dov', 'face', 'Laughter lines at the corners of Dov\'s eyes.', (c, S) => { c.strokeStyle = grey(30, 0.35); c.lineWidth = 0.4; c.beginPath(); c.moveTo(S.ex[1] + 1.6, -1.3); c.lineTo(S.ex[1] + 2.5, -1.8); c.moveTo(S.ex[1] + 1.6, -0.4); c.lineTo(S.ex[1] + 2.5, 0); c.stroke(); }],
  ['dov', 'torso', 'A tape measure clipped to Dov\'s belt.', (c, S) => { c.fillStyle = grey(140); rrect(c, S.tw / 2 - 5, -5, 4, 3.4, 1); c.fill(); c.fillStyle = grey(40); c.fillRect(S.tw / 2 - 3.6, -3.8, 1.2, 1.2); }],
  ['dov', 'back', 'A hammer hangs from a loop at Dov\'s hip.', (c, S) => { c.strokeStyle = grey(90); c.lineWidth = 1.2; c.beginPath(); c.moveTo(-S.tw / 2, -6); c.lineTo(-S.tw / 2 - 1, 3); c.stroke(); c.fillStyle = grey(110); c.fillRect(-S.tw / 2 - 3, -7, 5, 2); }],
  ['dov', 'torso', 'Sawdust flecks on Dov\'s cardigan.', (c, S) => { c.fillStyle = grey(200, 0.35); for (let i = 0; i < 6; i++) c.fillRect(-S.tw / 2 + 2 + PH(i, 71) * (S.tw - 4), -S.th + 4 + PH(i, 73) * (S.th - 6), 0.6, 0.6); }],
  ['dov', 'torso', 'A handkerchief in Dov\'s cardigan pocket.', (c, S) => { c.fillStyle = grey(190); c.beginPath(); c.moveTo(S.tw / 2 - 5, -S.th + 7); c.lineTo(S.tw / 2 - 3.5, -S.th + 5.4); c.lineTo(S.tw / 2 - 2.5, -S.th + 7); c.fill(); }],
  ['dov', 'legs', 'A knee brace strapped over Dov\'s bad knee.', (c, S) => { c.strokeStyle = grey(85); c.lineWidth = 2.2; c.beginPath(); c.moveTo(S.kB[0] - 1.6, S.kB[1] - 1); c.lineTo(S.kB[0] + 1.6, S.kB[1] + 1); c.stroke(); }],
  ['dov', 'hand', 'A heavy wristwatch on Dov\'s wrist.', (c, S) => { c.fillStyle = grey(160); c.beginPath(); c.arc(lerp(S.elb[0], S.hand[0], 0.82), lerp(S.elb[1], S.hand[1], 0.82), 1, 0, TAU); c.fill(); }],
  ['dov', 'torso', 'Leather patches on Dov\'s cardigan shoulders.', (c, S) => { c.fillStyle = grey(30, 0.5); rrect(c, -S.tw / 2 + 1.5, -S.th + 1.5, 4, 3, 1); c.fill(); }],
  ['dov', 'legs', 'Dov\'s boots have thick soles and laces.', (c, S) => { c.strokeStyle = grey(70); c.lineWidth = 0.5; for (const f of [S.fA, S.fB]) { c.beginPath(); c.moveTo(f[0] + 0.5, f[1] - 2.4); c.lineTo(f[0] + 2.5, f[1] - 2.4); c.stroke(); } }],
  ['dov', 'face', 'Dov\'s nose is a little red from the cold workshop.', (c, S) => { if (!S.mono) { c.fillStyle = 'hsla(356,60%,62%,0.3)'; c.beginPath(); c.arc(S.hr - 0.2, 1, 1, 0, TAU); c.fill(); } }],

  ['ines', 'pre', 'Ines wears dark running tights.', S => { S.pants = grey(22); }],
  ['ines', 'pre', 'Ines wears running shoes with pale soles.', S => { S.shoe = grey(30); S.sole = grey(200); }],
  ['ines', 'back', 'A courier bag rides on Ines\'s back.', (c, S) => { c.fillStyle = grey(62); rrect(c, -S.tw / 2 - 5, -S.th + 5 + S.pk * 0.5, 7, 10, 2); c.fill(); c.fillStyle = grey(44); c.fillRect(-S.tw / 2 - 5, -S.th + 8 + S.pk * 0.5, 7, 1.2); }],
  ['ines', 'torso', 'The bag strap crosses Ines\'s windbreaker.', (c, S) => { c.strokeStyle = grey(40); c.lineWidth = 1.2; c.beginPath(); c.moveTo(-S.tw / 2 + 1, -S.th + 2); c.lineTo(S.tw / 2 - 2, -4); c.stroke(); }],
  ['ines', 'torso', 'A zip pull glints on the windbreaker.', (c, S) => { c.fillStyle = grey(225); c.fillRect(1.2, -S.th + 3, 1, 1.6); }],
  ['ines', 'torso', 'The hood is bunched at the back of her neck.', (c, S) => { c.fillStyle = S.dark; c.beginPath(); c.ellipse(-S.tw / 2 + 2, -S.th + 1, 3.2, 2, 0, 0, TAU); c.fill(); }],
  ['ines', 'torso', 'A folded map sticks out of her pocket.', (c, S) => { c.fillStyle = grey(210); c.fillRect(S.tw / 2 - 4.5, -7, 3, 2.4); c.strokeStyle = grey(120); c.lineWidth = 0.3; c.beginPath(); c.moveTo(S.tw / 2 - 3, -7); c.lineTo(S.tw / 2 - 3, -4.6); c.stroke(); }],
  ['ines', 'torso', 'A whistle on a cord around her neck.', (c, S) => { c.strokeStyle = grey(160); c.lineWidth = 0.4; c.beginPath(); c.moveTo(-1, -S.th + 1); c.quadraticCurveTo(1, -S.th + 7, 3, -S.th + 1); c.stroke(); c.fillStyle = grey(190); c.fillRect(0.6, -S.th + 6, 1.6, 1); }],
  ['ines', 'head', 'A bright hair tie holds Ines\'s ponytail.', (c, S) => { if (!S.mono) { c.fillStyle = hsl(S.C, S.sat, 10); c.beginPath(); c.arc(-S.hr - 0.5, -2 + S.hs * 0.1, 1.1, 0, TAU); c.fill(); } }],
  ['ines', 'head', 'Short baby hairs at Ines\'s temple.', (c, S) => { c.strokeStyle = S.hair; c.lineWidth = 0.4; c.beginPath(); c.moveTo(S.hr * 0.5, -S.hr + 1); c.lineTo(S.hr * 0.75, -S.hr + 2.3); c.stroke(); }],
  ['ines', 'face', 'Freckles across Ines\'s nose.', (c, S) => { c.fillStyle = grey(60, 0.35); for (let i = 0; i < 4; i++) c.fillRect(S.hr * 0.45 + i * 0.8, 1 + (i % 2) * 0.6, 0.45, 0.45); }],
  ['ines', 'hand', 'Fingerless gloves on Ines\'s hands.', (c, S) => { c.fillStyle = grey(40); c.beginPath(); c.arc(S.hand[0], S.hand[1], 2.2, Math.PI * 0.6, Math.PI * 1.6); c.fill(); }],
  ['ines', 'hand', 'A sweatband on Ines\'s wrist.', (c, S) => { c.strokeStyle = grey(200); c.lineWidth = 1.6; const x = lerp(S.elb[0], S.hand[0], 0.78), y = lerp(S.elb[1], S.hand[1], 0.78); c.beginPath(); c.moveTo(x - 0.8, y - 0.8); c.lineTo(x + 0.8, y + 0.8); c.stroke(); }],
  ['ines', 'legs', 'Bicycle clips on Ines\'s ankles.', (c, S) => { c.strokeStyle = grey(150); c.lineWidth = 0.8; for (const f of [S.fA, S.fB]) { c.beginPath(); c.arc(f[0], f[1] - 3.4, 1.8, 0, Math.PI); c.stroke(); } }],
  ['ines', 'legs', 'A patch sewn on one knee of Ines\'s tights.', (c, S) => { c.fillStyle = grey(52); c.fillRect(S.kA[0] - 1.4, S.kA[1] - 1.2, 2.8, 2.4); }],
  ['ines', 'hand', 'A plaster on Ines\'s knuckle from a stubborn lock.', (c, S) => { c.fillStyle = grey(225); c.fillRect(S.hand[0] - 0.4, S.hand[1] - 1.8, 1.6, 0.8); }],

  ['toby', 'pre', 'Toby\'s trousers are a size too big.', S => { S.pants = grey(40); S.legW = 1.15; }],
  ['toby', 'pre', 'Toby\'s boots are hand-me-downs, too big for him.', S => { S.shoe = grey(26); S.shoeW = 1.25; }],
  ['toby', 'back', 'Toby carries his drawing pad under his arm.', (c, S) => { c.fillStyle = grey(225); c.save(); c.rotate(-0.25); c.fillRect(-S.tw / 2 - 3, -S.th + 6, 3, 9); c.restore(); }],
  ['toby', 'torso', 'Crayon stubs poke out of Toby\'s pocket.', (c, S) => { if (!S.mono) { const cols = ['hsl(24,90%,55%)', 'hsl(200,70%,50%)', 'hsl(120,50%,45%)']; cols.forEach((k, i) => { c.fillStyle = k; c.fillRect(S.tw / 2 - 4.5 + i * 1, -6.5 - i * 0.4, 0.8, 2.4); }); } }],
  ['toby', 'torso', 'A pin badge of a little sun on Toby\'s coat.', (c, S) => { c.fillStyle = S.mono ? grey(200) : 'hsl(46,95%,60%)'; c.beginPath(); c.arc(S.tw / 2 - 3, -S.th + 6, 1.2, 0, TAU); c.fill(); }],
  ['toby', 'torso', 'Toby\'s pockets bulge with treasures.', (c, S) => { c.fillStyle = grey(0, 0.18); c.beginPath(); c.ellipse(S.tw / 2 - 3, -3, 2.4, 1.6, 0, 0, TAU); c.fill(); }],
  ['toby', 'hand', 'Toby\'s coat sleeves come down over his hands.', (c, S) => { c.fillStyle = S.torsoC; c.beginPath(); c.arc(lerp(S.elb[0], S.hand[0], 0.85), lerp(S.elb[1], S.hand[1], 0.85), 2.2, 0, TAU); c.fill(); }],
  ['toby', 'head', 'The pompom on Toby\'s hat wobbles on its own spring.', (c, S) => { if (!S.mono) { c.fillStyle = S.main; c.beginPath(); c.arc(-1 - S.hs * 0.4 - S.hat * 0.3, -S.hr - 2.4 - S.hat * 0.5, 2.6, 0, TAU); c.fill(); } }],
  ['toby', 'head', 'A knitted rib pattern on Toby\'s hat band.', (c, S) => { c.strokeStyle = S.mono ? grey(80) : S.dark; c.lineWidth = 0.4; for (let i = -5; i <= 5; i += 1.6) { c.beginPath(); c.moveTo(i, -2.4); c.lineTo(i, -0.6); c.stroke(); } }],
  ['toby', 'pre', 'Toby\'s eyes are bigger, as children\'s are.', S => { S.eyeR = 1.3; }],
  ['toby', 'face', 'An orange crayon smudge on Toby\'s cheek.', (c, S) => { if (!S.mono) { c.fillStyle = 'hsla(24,90%,55%,0.45)'; c.fillRect(-0.4, 1.8, 2.2, 0.8); } }],
  ['toby', 'face', 'Rosy cheeks in the cold.', (c, S) => { if (!S.mono && S.s.cold < 60) { c.fillStyle = 'hsla(356,70%,65%,0.3)'; c.beginPath(); c.arc(S.hr * 0.25, 2, 1.4, 0, TAU); c.fill(); } }],
  ['toby', 'face', 'A gap-toothed smile.', (c, S) => { if (S.s.mouth === 'smile') { c.fillStyle = grey(240); c.fillRect(S.mx - 0.9, 2.5, 1.8, 0.7); c.fillStyle = grey(20); c.fillRect(S.mx - 0.2, 2.5, 0.5, 0.7); } }],
  ['toby', 'legs', 'One of Toby\'s laces is always untied and flaps as he walks.', (c, S) => { c.strokeStyle = grey(150); c.lineWidth = 0.4; c.beginPath(); c.moveTo(S.fA[0] + 1.5, S.fA[1] - 1.6); c.quadraticCurveTo(S.fA[0] + 3, S.fA[1] - 0.5 + Math.sin(S.t * 9) * 0.6, S.fA[0] + 4.4, S.fA[1] - 0.2); c.stroke(); }],
  ['toby', 'legs', 'A plaster on Toby\'s scraped knee.', (c, S) => { c.fillStyle = grey(220); c.fillRect(S.kA[0] - 1, S.kA[1] - 0.6, 2, 1.2); }],
  ['toby', 'torso', 'Toby\'s coat is buttoned wrong, one button off.', (c, S) => { c.fillStyle = grey(30); c.fillRect(2.5, -S.th + 5, 1, 1); c.fillRect(2.8, -S.th + 9.5, 1, 1); c.fillRect(2.2, -S.th + 13, 1, 1); }],

  ['bea', 'pre', 'Bea wears thick pale stockings.', S => { S.pants = grey(80); S.legW = 0.85; }],
  ['bea', 'pre', 'Bea wears comfortable slippers.', S => { S.shoe = grey(60); S.shoeW = 1.05; }],
  ['bea', 'torso', 'Bea always has an apron on.', (c, S) => { c.fillStyle = grey(195, 0.9); c.beginPath(); c.moveTo(0, -S.th + 8); c.lineTo(S.tw / 2 - 0.5, -S.th + 8); c.lineTo(S.tw / 2 + 0.5, 1); c.lineTo(-1, 1); c.closePath(); c.fill(); }],
  ['bea', 'torso', 'Flour dust on Bea\'s apron.', (c, S) => { c.fillStyle = grey(255, 0.5); for (let i = 0; i < 5; i++) c.fillRect(1 + PH(i, 81) * (S.tw / 2 - 2), -S.th + 10 + PH(i, 83) * 8, 0.7, 0.7); }],
  ['bea', 'back', 'The apron strings are tied in a bow at the back.', (c, S) => { c.strokeStyle = grey(195); c.lineWidth = 0.8; c.beginPath(); c.ellipse(-S.tw / 2 - 1, -S.th + 9, 1.6, 0.9, 0.4, 0, TAU); c.ellipse(-S.tw / 2 - 1.5, -S.th + 10.4, 1.4, 0.8, -0.5, 0, TAU); c.stroke(); }],
  ['bea', 'torso', 'Bea\'s wooden spoon is tucked into the apron.', (c, S) => { c.strokeStyle = grey(120); c.lineWidth = 1; c.beginPath(); c.moveTo(S.tw / 2 - 2, -S.th + 7); c.lineTo(S.tw / 2 - 3, -S.th + 13); c.stroke(); c.fillStyle = grey(120); c.beginPath(); c.ellipse(S.tw / 2 - 1.8, -S.th + 6, 1, 1.5, 0.2, 0, TAU); c.fill(); }],
  ['bea', 'torso', 'A brooch fastens Bea\'s shawl.', (c, S) => { c.fillStyle = grey(225); c.beginPath(); c.arc(S.tw / 2 - 2.5, -S.th + 3.4, 1.1, 0, TAU); c.fill(); c.fillStyle = S.mono ? grey(90) : hsl(S.C, S.sat, -10); c.beginPath(); c.arc(S.tw / 2 - 2.5, -S.th + 3.4, 0.5, 0, TAU); c.fill(); }],
  ['bea', 'torso', 'Bea\'s glasses hang on a chain when she is not reading.', (c, S) => { c.strokeStyle = grey(170, 0.7); c.lineWidth = 0.35; c.beginPath(); c.moveTo(-1, -S.th - 1); c.quadraticCurveTo(2, -S.th + 6, 4, -S.th - 1); c.stroke(); }],
  ['bea', 'head', 'Bea\'s hair is set in a tidy grey wave.', (c, S) => { c.strokeStyle = grey(200, 0.5); c.lineWidth = 0.5; c.beginPath(); c.arc(0, -1, S.hr - 1.5, Math.PI * 1.1, Math.PI * 1.6); c.stroke(); }],
  ['bea', 'face', 'Fine wrinkles around Bea\'s mouth and eyes.', (c, S) => { c.strokeStyle = grey(40, 0.3); c.lineWidth = 0.35; c.beginPath(); c.moveTo(S.mx - 2.4, 2); c.lineTo(S.mx - 2.6, 3.4); c.moveTo(S.ex[1] + 1.5, -1); c.lineTo(S.ex[1] + 2.3, -1.6); c.stroke(); }],
  ['bea', 'face', 'A touch of rouge on Bea\'s cheeks, even now.', (c, S) => { if (!S.mono) { c.fillStyle = 'hsla(350,60%,62%,0.32)'; c.beginPath(); c.arc(S.hr * 0.2, 1.8, 1.5, 0, TAU); c.fill(); } }],
  ['bea', 'face', 'A pearl earring.', (c, S) => { c.fillStyle = grey(240); c.beginPath(); c.arc(-1.2, 2.6, 0.6, 0, TAU); c.fill(); }],
  ['bea', 'hand', 'A handkerchief tucked in Bea\'s sleeve.', (c, S) => { c.fillStyle = grey(225); c.beginPath(); c.arc(lerp(S.elb[0], S.hand[0], 0.75), lerp(S.elb[1], S.hand[1], 0.75) + 1, 1.2, 0, TAU); c.fill(); }],
  ['bea', 'legs', 'Pompoms on Bea\'s slippers.', (c, S) => { c.fillStyle = grey(140); for (const f of [S.fA, S.fB]) { c.beginPath(); c.arc(f[0] + 2.6, f[1] - 1.8, 0.9, 0, TAU); c.fill(); } }],
  ['bea', 'torso', 'A knitted texture on Bea\'s shawl.', (c, S) => { c.strokeStyle = grey(0, 0.15); c.lineWidth = 0.4; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-S.tw / 2 + 1 + i * 2.5, -S.th + 4); c.lineTo(-S.tw / 2 + 2 + i * 2.5, -S.th + 7); c.stroke(); } }],
  ['bea', 'torso', 'The shawl has a scalloped edge.', (c, S) => { c.fillStyle = S.main; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(-S.tw / 2 + 1 + i * 3, -S.th + 10.5 - i * 0.4, 1, 0, Math.PI); c.fill(); } }],

  ['ravi', 'pre', 'Ravi wears oil-stained work jeans.', S => { S.pants = grey(46); }],
  ['ravi', 'pre', 'Ravi wears scuffed work boots.', S => { S.shoe = grey(20); S.shoeW = 1.1; }],
  ['ravi', 'face', 'A grease smudge on Ravi\'s cheek.', (c, S) => { c.fillStyle = grey(15, 0.4); c.fillRect(0, 1.5, 2.4, 0.7); c.fillRect(0.8, 2.2, 1.4, 0.5); }],
  ['ravi', 'face', 'A neat moustache.', (c, S) => { c.fillStyle = grey(30); c.fillRect(S.mx - 1.6, 1.7, 3.2, 0.9); }],
  ['ravi', 'face', 'Five o\'clock shadow along Ravi\'s jaw.', (c, S) => { c.fillStyle = grey(40, 0.22); c.beginPath(); c.arc(S.hr * 0.4, 2.8, 2.8, 0.1, Math.PI - 0.1); c.fill(); }],
  ['ravi', 'head', 'A turned-up fold on Ravi\'s beanie.', (c, S) => { c.strokeStyle = grey(85); c.lineWidth = 0.5; c.beginPath(); c.moveTo(-S.hr, -1.8); c.lineTo(S.hr, -1.8); c.stroke(); }],
  ['ravi', 'back', 'A wrench in Ravi\'s back pocket.', (c, S) => { c.strokeStyle = grey(150); c.lineWidth = 1.2; c.beginPath(); c.moveTo(-S.tw / 2 + 1, -3); c.lineTo(-S.tw / 2 - 1.5, -9); c.stroke(); c.beginPath(); c.arc(-S.tw / 2 - 1.8, -9.8, 1.2, 0.5, 5.5); c.stroke(); }],
  ['ravi', 'torso', 'An oily rag hangs from Ravi\'s pocket and swings.', (c, S) => { c.fillStyle = grey(110); c.beginPath(); c.moveTo(S.tw / 2 - 4, -5); c.lineTo(S.tw / 2 - 1.5, -5); c.lineTo(S.tw / 2 - 2 - S.hem * 0.4, 1); c.lineTo(S.tw / 2 - 4.5 - S.hem * 0.4, 0); c.fill(); }],
  ['ravi', 'torso', 'Oil stains on Ravi\'s jacket.', (c, S) => { c.fillStyle = grey(0, 0.22); c.beginPath(); c.ellipse(-1, -S.th + 9, 1.6, 1, 0.3, 0, TAU); c.ellipse(2.5, -6, 1.1, 0.8, 0, 0, TAU); c.fill(); }],
  ['ravi', 'torso', 'Ravi wears his jacket collar turned up.', (c, S) => { c.fillStyle = S.dark; c.beginPath(); c.moveTo(-S.tw / 2 + 2, -S.th - 1.6); c.lineTo(S.tw / 2 - 2, -S.th - 0.6); c.lineTo(S.tw / 2 - 3, -S.th + 2); c.lineTo(-S.tw / 2 + 2, -S.th + 2); c.fill(); }],
  ['ravi', 'torso', 'A ring of keys on Ravi\'s belt loop.', (c, S) => { c.strokeStyle = grey(190); c.lineWidth = 0.5; c.beginPath(); c.arc(S.tw / 2 - 2, -2, 1.2, 0, TAU); c.stroke(); c.fillStyle = grey(190); c.fillRect(S.tw / 2 - 2.4, -1, 0.6, 1.6); }],
  ['ravi', 'hand', 'A bicycle-chain bracelet.', (c, S) => { c.strokeStyle = grey(130); c.lineWidth = 1; c.setLineDash([0.6, 0.5]); const x = lerp(S.elb[0], S.hand[0], 0.8), y = lerp(S.elb[1], S.hand[1], 0.8); c.beginPath(); c.moveTo(x - 1, y - 0.6); c.lineTo(x + 1, y + 0.6); c.stroke(); c.setLineDash([]); }],
  ['ravi', 'torso', 'Work gloves tucked in Ravi\'s belt.', (c, S) => { c.fillStyle = grey(95); c.fillRect(-S.tw / 2 + 1.5, -4.2, 2.4, 4); }],
  ['ravi', 'legs', 'Patched knees on Ravi\'s jeans.', (c, S) => { c.fillStyle = grey(58); for (const k of [S.kA, S.kB]) c.fillRect(k[0] - 1.2, k[1] - 1, 2.4, 2); }],
  ['ravi', 'hand', 'Grease on Ravi\'s fingertips.', (c, S) => { c.fillStyle = grey(10, 0.45); c.beginPath(); c.arc(S.hand[0] + 1, S.hand[1] + 0.6, 1, 0, TAU); c.fill(); }],

  ['yara', 'pre', 'Yara wears dark slim trousers.', S => { S.pants = grey(26); S.legW = 0.9; }],
  ['yara', 'pre', 'Yara wears small-heeled ankle boots.', S => { S.shoe = grey(16); S.heel = 1; }],
  ['yara', 'torso', 'A cable runs from Yara\'s headphones into her pocket.', (c, S) => { c.strokeStyle = grey(30); c.lineWidth = 0.4; c.beginPath(); c.moveTo(4, -S.th + 2); c.quadraticCurveTo(6, -S.th + 9, S.tw / 2 - 3, -6); c.stroke(); }],
  ['yara', 'torso', 'Yara\'s sweater has a roll neck.', (c, S) => { c.fillStyle = S.dark; rrect(c, -2.5, -S.th - 2.2, 6, 3, 1.2); c.fill(); }],
  ['yara', 'torso', 'A notebook sticks out of her pocket.', (c, S) => { c.fillStyle = grey(180); c.fillRect(S.tw / 2 - 4.5, -7.4, 2.6, 3.2); c.fillStyle = grey(60); c.fillRect(S.tw / 2 - 4.5, -7.4, 2.6, 0.5); }],
  ['yara', 'torso', 'A little on-air pin on Yara\'s sweater.', (c, S) => { c.fillStyle = S.mono ? grey(200) : 'hsl(0,75%,55%)'; c.beginPath(); c.arc(S.tw / 2 - 3, -S.th + 5, 0.9, 0, TAU); c.fill(); }],
  ['yara', 'head', 'A hair clip holds back Yara\'s fringe.', (c, S) => { c.fillStyle = grey(200); c.fillRect(S.hr * 0.1, -S.hr + 1.4, 2.2, 0.7); }],
  ['yara', 'head', 'Yara\'s bob is cut with a sharp, straight fringe.', (c, S) => { c.fillStyle = S.hair; c.fillRect(-S.hr * 0.3, -S.hr + 0.4, S.hr * 1.1, 1.6); }],
  ['yara', 'face', 'Hoop earrings that swing as Yara moves.', (c, S) => { c.strokeStyle = grey(210); c.lineWidth = 0.5; c.beginPath(); c.arc(-1.4 + S.hs * 0.1, 3.3, 1.1, 0, TAU); c.stroke(); }],
  ['yara', 'face', 'An eyeliner flick.', (c, S) => { c.strokeStyle = grey(10); c.lineWidth = 0.4; c.beginPath(); c.moveTo(S.ex[1] + 0.9, -1); c.lineTo(S.ex[1] + 1.8, -1.6); c.stroke(); }],
  ['yara', 'pre', 'Lipstick, the one luxury she kept.', S => { if (!S.mono) S.lip = 'hsl(352,55%,42%)'; }],
  ['yara', 'hand', 'Rings on Yara\'s fingers.', (c, S) => { c.fillStyle = grey(220); c.fillRect(S.hand[0] + 0.6, S.hand[1] - 0.4, 0.8, 0.8); }],
  ['yara', 'hand', 'A thin bracelet on Yara\'s wrist.', (c, S) => { c.strokeStyle = grey(210); c.lineWidth = 0.4; const x = lerp(S.elb[0], S.hand[0], 0.8), y = lerp(S.elb[1], S.hand[1], 0.8); c.beginPath(); c.arc(x, y, 1.6, 0, TAU); c.stroke(); }],
  ['yara', 'legs', 'Small heels on Yara\'s boots.', (c, S) => { c.fillStyle = grey(16); for (const f of [S.fA, S.fB]) c.fillRect(f[0] - 1.6, f[1] - 0.6, 1.2, 1.4); }],
  ['yara', 'torso', 'A knitted cable pattern down Yara\'s sweater.', (c, S) => { c.strokeStyle = grey(0, 0.18); c.lineWidth = 0.6; c.beginPath(); for (let y = -S.th + 3; y < 0; y += 2) { c.moveTo(-1, y); c.lineTo(0.5, y + 1); c.lineTo(-1, y + 2); } c.stroke(); }],
  ['yara', 'face', 'Yara chews her lip when nervous.', (c, S) => { if (S.s.morale < 40) { c.fillStyle = grey(240, 0.7); c.fillRect(S.mx - 0.6, 3.1, 1.2, 0.5); } }],

  ['pavel', 'pre', 'Pavel wears heavy black guard\'s trousers.', S => { S.pants = grey(20); S.legW = 1.2; }],
  ['pavel', 'pre', 'Pavel wears huge steel-toed boots.', S => { S.shoe = grey(10); S.shoeW = 1.35; }],
  ['pavel', 'torso', 'Pavel\'s old guard badge, still polished.', (c, S) => { c.fillStyle = grey(200); c.beginPath(); c.moveTo(S.tw / 2 - 4, -S.th + 5); c.lineTo(S.tw / 2 - 2, -S.th + 5); c.lineTo(S.tw / 2 - 3, -S.th + 7.6); c.closePath(); c.fill(); }],
  ['pavel', 'torso', 'A whistle on a chain clipped to his coat.', (c, S) => { c.strokeStyle = grey(170); c.lineWidth = 0.4; c.beginPath(); c.moveTo(S.tw / 2 - 4, -S.th + 8); c.quadraticCurveTo(S.tw / 2 - 2, -S.th + 11, S.tw / 2 - 1.5, -S.th + 9); c.stroke(); }],
  ['pavel', 'torso', 'Big round buttons on Pavel\'s greatcoat.', (c, S) => { c.fillStyle = grey(25); for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(3, -S.th + 5 + i * 5, 0.9, 0, TAU); c.fill(); } }],
  ['pavel', 'torso', 'Pavel\'s coat collar is turned up against the wind.', (c, S) => { c.fillStyle = S.dark; c.fillRect(-S.tw / 2 + 1, -S.th - 2.2, S.tw - 3, 3); }],
  ['pavel', 'torso', 'A wide leather belt across the coat.', (c, S) => { c.fillStyle = grey(18); c.fillRect(-S.tw / 2 + 1, -7, S.tw - 2, 1.8); c.fillStyle = grey(150); c.fillRect(1.6, -7, 1.6, 1.8); }],
  ['pavel', 'back', 'The iron pipe is slung across Pavel\'s back.', (c, S) => { c.strokeStyle = grey(95); c.lineWidth = 2; c.beginPath(); c.moveTo(-S.tw / 2 - 2, -S.th - 3); c.lineTo(-S.tw / 2 + 2, -3); c.stroke(); }],
  ['pavel', 'face', 'A magnificent walrus moustache.', (c, S) => { c.fillStyle = grey(50); c.beginPath(); c.moveTo(S.mx - 2.6, 2.9); c.quadraticCurveTo(S.mx, 0.9, S.mx + 2.6, 2.9); c.quadraticCurveTo(S.mx, 2.2, S.mx - 2.6, 2.9); c.fill(); }],
  ['pavel', 'face', 'A small scar through Pavel\'s eyebrow.', (c, S) => { c.strokeStyle = grey(220, 0.6); c.lineWidth = 0.4; c.beginPath(); c.moveTo(S.ex[1] - 0.4, -3.6); c.lineTo(S.ex[1] + 0.3, -1.9); c.stroke(); }],
  ['pavel', 'face', 'A broad, flattened nose.', (c, S) => { c.fillStyle = S.skin; c.beginPath(); c.ellipse(S.hr - 0.2, 1, 1.6, 1.3, 0, 0, TAU); c.fill(); }],
  ['pavel', 'head', 'Pavel\'s bald head catches a second highlight.', (c, S) => { c.fillStyle = 'rgba(255,255,255,0.12)'; c.beginPath(); c.arc(1.5, -4.2, 1, 0, TAU); c.fill(); }],
  ['pavel', 'hand', 'Thick knitted gloves.', (c, S) => { c.fillStyle = grey(50); c.beginPath(); c.arc(S.hand[0], S.hand[1], 2.8, 0, TAU); c.fill(); }],
  ['pavel', 'legs', 'Steel toe caps glint on Pavel\'s boots.', (c, S) => { c.fillStyle = grey(110); for (const f of [S.fA, S.fB]) c.fillRect(f[0] + 3, f[1] - 1.8, 1.4, 1.2); }],
  ['pavel', 'torso', 'A thick neck that fills the collar.', (c, S) => { c.fillStyle = S.skin; c.fillRect(-1.5, -S.th - 2, 5, 2.4); }],
  ['pavel', 'torso', 'An old ID lanyard.', (c, S) => { c.fillStyle = grey(200); c.fillRect(S.tw / 2 - 5.5, -S.th + 11, 2.2, 3); }],

  ['lamp', 'pre', 'The Lamplighter\'s trousers vanish into shadow.', S => { S.pants = grey(12); }],
  ['lamp', 'pre', 'The Lamplighter wears soft, pointed boots.', S => { S.shoe = grey(12); S.shoeW = 1.15; S.point = 1; }],
  ['lamp', 'hand', 'The Lamplighter carries a long brass pole.', (c, S) => { c.strokeStyle = grey(170); c.lineWidth = 1.3; c.beginPath(); c.moveTo(S.hand[0], S.hand[1] + 10); c.lineTo(S.hand[0] + 2, S.hand[1] - 28); c.stroke(); }],
  ['lamp', 'hand', 'A small flame burns at the tip of the pole.', (c, S) => { const x = S.hand[0] + 2, y = S.hand[1] - 30, f = Math.sin(S.t * 13) * 0.6; c.fillStyle = S.mono ? grey(240) : 'hsla(40,95%,62%,0.95)'; c.beginPath(); c.ellipse(x, y + f * 0.3, 1.2, 2.2 + f, 0, 0, TAU); c.fill(); }],
  ['lamp', 'hand', 'The flame casts a soft glow around itself.', (c, S) => { if (!S.mono && !Render.cheap) { const x = S.hand[0] + 2, y = S.hand[1] - 30, g = c.createRadialGradient(x, y, 0, x, y, 14); g.addColorStop(0, 'hsla(40,95%,60%,0.3)'); g.addColorStop(1, 'hsla(40,95%,60%,0)'); c.fillStyle = g; c.fillRect(x - 14, y - 14, 28, 28); } }],
  ['lamp', 'face', 'Under the hood, the face is in deep shadow.', (c, S) => { c.fillStyle = grey(0, 0.55); c.beginPath(); c.arc(0, 0, S.hr, -Math.PI / 2, Math.PI / 2); c.fill(); }],
  ['lamp', 'face', 'Two calm points of light for eyes.', (c, S) => { c.fillStyle = S.mono ? grey(240) : 'hsla(45,90%,75%,0.9)'; c.fillRect(S.ex[0] - 0.4, -1, 0.9, 0.9); c.fillRect(S.ex[1] - 0.4, -1, 0.9, 0.9); }],
  ['lamp', 'head', 'The hood comes to a soft point.', (c, S) => { c.fillStyle = S.dark; c.beginPath(); c.moveTo(-S.hr - 1, -S.hr * 0.6); c.quadraticCurveTo(-S.hr - 4 - S.hs, -S.hr - 1, -S.hr - 5 - S.hs * 1.4, -S.hr + 3); c.lineTo(-S.hr, -S.hr * 0.2); c.fill(); }],
  ['lamp', 'torso', 'A brass clasp at the cloak\'s throat.', (c, S) => { c.fillStyle = grey(180); c.beginPath(); c.arc(S.tw / 2 - 2.5, -S.th + 2, 1.2, 0, TAU); c.fill(); }],
  ['lamp', 'torso', 'Wax drips down the front of the cloak.', (c, S) => { c.fillStyle = grey(210, 0.55); for (let i = 0; i < 3; i++) c.fillRect(S.tw / 2 - 5 + i * 1.6, -S.th + 6 + i * 2, 0.7, 2 + i); }],
  ['lamp', 'torso', 'The cloak\'s hem is ragged.', (c, S) => { c.fillStyle = S.torsoC; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-S.tw / 2 + i * 3, 2); c.lineTo(-S.tw / 2 + 1.5 + i * 3 - S.hem * 0.3, 4.5 + (i % 2)); c.lineTo(-S.tw / 2 + 3 + i * 3, 2); c.fill(); } }],
  ['lamp', 'back', 'A tin wick-box hangs at the Lamplighter\'s belt.', (c, S) => { c.fillStyle = grey(120); rrect(c, -S.tw / 2 - 3, -8, 4, 4, 1); c.fill(); }],
  ['lamp', 'back', 'A small spare lantern swings at the hip.', (c, S) => { const sw = S.hem * 0.5; c.strokeStyle = grey(140); c.lineWidth = 0.4; c.beginPath(); c.moveTo(-S.tw / 2 - 1, -4); c.lineTo(-S.tw / 2 - 1 - sw, -1); c.stroke(); c.fillStyle = S.mono ? grey(200) : 'hsla(40,90%,60%,0.8)'; c.fillRect(-S.tw / 2 - 2.2 - sw, -1, 2.4, 3); }],
  ['lamp', 'torso', 'Soot marks on the cloak.', (c, S) => { c.fillStyle = grey(0, 0.25); c.beginPath(); c.ellipse(-2, -S.th + 12, 2, 1, 0.4, 0, TAU); c.fill(); }],
  ['lamp', 'legs', 'The Lamplighter\'s boots curl up at the toes.', (c, S) => { c.strokeStyle = grey(12); c.lineWidth = 1; for (const f of [S.fA, S.fB]) { c.beginPath(); c.moveTo(f[0] + 3.4, f[1] - 0.8); c.quadraticCurveTo(f[0] + 5.4, f[1] - 1, f[0] + 5, f[1] - 2.8); c.stroke(); } }],
  ['lamp', 'back', 'A few embers drift off the Lamplighter now and then.', (c, S) => { if (!S.mono && !calm()) { const k = (S.t * 0.7) % 1; c.fillStyle = 'hsla(30,90%,60%,' + (0.6 * (1 - k)) + ')'; c.fillRect(-S.tw / 2 - 2 - k * 4, -S.th - k * 14, 0.9, 0.9); } }]
];

/* ---------- K. more costume details ---------- */
DETAIL.push(
  ['marta', 'torso', 'Marta\'s coat has two rows of buttons.', (c, S) => { c.fillStyle = grey(30); for (let i = 0; i < 3; i++) { c.fillRect(S.tw / 2 - 5, -S.th + 7 + i * 4, 0.9, 0.9); c.fillRect(S.tw / 2 - 2.5, -S.th + 7 + i * 4, 0.9, 0.9); } }],
  ['marta', 'torso', 'A pocket with a thermometer peeking out.', (c, S) => { c.strokeStyle = grey(25, 0.5); c.lineWidth = 0.5; c.strokeRect(-S.tw / 2 + 2, -S.th + 6, 4, 3); c.fillStyle = grey(220); c.fillRect(-S.tw / 2 + 3.5, -S.th + 4, 0.6, 2.4); }],
  ['marta', 'torso', 'A safety pin on her lapel.', (c, S) => { c.strokeStyle = grey(200); c.lineWidth = 0.4; c.beginPath(); c.moveTo(S.tw / 2 - 5, -S.th + 3); c.lineTo(S.tw / 2 - 3, -S.th + 5); c.stroke(); }],
  ['marta', 'head', 'Marta\'s bun is held with a ribbon.', (c, S) => { if (!S.mono) { c.fillStyle = S.main; c.fillRect(-S.hr - 0.5, -S.hr + 1.6, 1.4, 1.4); } }],
  ['marta', 'legs', 'A ladder runs up one of Marta\'s stockings.', (c, S) => { c.strokeStyle = grey(60, 0.6); c.lineWidth = 0.4; c.beginPath(); c.moveTo(S.kA[0] + 0.5, S.kA[1]); c.lineTo(S.fA[0] + 0.5, S.fA[1] - 3); c.stroke(); }],
  ['marta', 'torso', 'A darned patch on Marta\'s elbow side.', (c, S) => { c.fillStyle = grey(60, 0.45); c.fillRect(-S.tw / 2 + 1, -S.th + 12, 2.5, 2.5); }],
  ['marta', 'hand', 'A little bandage on one of Marta\'s fingers.', (c, S) => { c.fillStyle = grey(225); c.fillRect(S.hand[0] - 0.4, S.hand[1] - 0.4, 1.2, 0.8); }],
  ['dov', 'torso', 'Dov\'s cardigan has leather elbow patches.', (c, S) => { c.fillStyle = grey(45, 0.7); c.beginPath(); c.ellipse(-S.tw / 2 + 2, -S.th + 13, 1.6, 2.4, 0, 0, TAU); c.fill(); }],
  ['dov', 'torso', 'A folding ruler sticks out of Dov\'s back pocket.', (c, S) => { c.fillStyle = grey(190); c.fillRect(-S.tw / 2 - 0.5, -6, 1.2, 4); }],
  ['dov', 'torso', 'Dov\'s cardigan is buttoned one hole off.', (c, S) => { c.fillStyle = grey(30); for (let i = 0; i < 4; i++) c.fillRect(S.tw / 2 - 3 - (i === 3 ? 1 : 0), -S.th + 5 + i * 4, 1, 1); }],
  ['dov', 'head', 'Grey stubble along Dov\'s jaw.', (c, S) => { c.fillStyle = grey(160, 0.3); for (let i = 0; i < 6; i++) c.fillRect(S.hr * 0.1 + PH(i, 91) * S.hr * 0.7, S.hr * 0.35 + PH(i, 93) * S.hr * 0.4, 0.5, 0.5); }],
  ['dov', 'legs', 'Dov\'s work boots have thick soles.', (c, S) => { c.fillStyle = grey(70); for (const f of [S.fA, S.fB]) c.fillRect(f[0] - 2, f[1] - 0.4, 6.5, 1); }],
  ['dov', 'legs', 'A knee brace on Dov\'s bad knee.', (c, S) => { c.fillStyle = grey(90, 0.8); c.fillRect(S.kB[0] - 1.6, S.kB[1] - 1.2, 3.2, 2.4); }],
  ['dov', 'hand', 'Dov\'s knuckles are thick from years of work.', (c, S) => { c.fillStyle = S.skin; c.beginPath(); c.arc(S.hand[0], S.hand[1], 1.9, 0, TAU); c.fill(); }],
  ['ines', 'torso', 'Ines\'s windbreaker has a reflective stripe.', (c, S) => { c.fillStyle = grey(220, 0.7); c.fillRect(-S.tw / 2 + 1, -S.th + 10, S.tw - 2, 0.9); }],
  ['ines', 'torso', 'A zip runs down the front of her windbreaker.', (c, S) => { c.strokeStyle = grey(170, 0.7); c.lineWidth = 0.5; c.beginPath(); c.moveTo(S.tw / 2 - 1.5, -S.th + 2); c.lineTo(S.tw / 2 - 1.5, -1); c.stroke(); }],
  ['ines', 'torso', 'A courier\'s bag strap crosses her back.', (c, S) => { c.strokeStyle = grey(40); c.lineWidth = 1.1; c.beginPath(); c.moveTo(-S.tw / 2 + 1, -S.th + 2); c.lineTo(S.tw / 2 - 1, -4); c.stroke(); }],
  ['ines', 'head', 'A hair tie with a bead at the root of Ines\'s ponytail.', (c, S) => { if (!S.mono) { c.fillStyle = S.main; c.beginPath(); c.arc(-S.hr + 0.5, -S.hr * 0.3, 0.9, 0, TAU); c.fill(); } }],
  ['ines', 'legs', 'Ines\'s running shoes have a bright stripe.', (c, S) => { if (!S.mono) { c.fillStyle = S.main; for (const f of [S.fA, S.fB]) c.fillRect(f[0] - 0.5, f[1] - 1.6, 3, 0.6); } }],
  ['ines', 'legs', 'Ines\'s trousers are tucked into her socks.', (c, S) => { c.fillStyle = grey(200, 0.6); for (const f of [S.fA, S.fB]) c.fillRect(f[0] - 1.2, f[1] - 3.2, 2.6, 1); }],
  ['ines', 'hand', 'Ines wears fingerless gloves.', (c, S) => { c.fillStyle = grey(30, 0.85); c.fillRect(S.hand[0] - 1.3, S.hand[1] - 0.2, 2.6, 1.3); }],
  ['toby', 'torso', 'Toby\'s coat has a big toggle button.', (c, S) => { c.fillStyle = grey(140); c.fillRect(S.tw / 2 - 3, -S.th + 6, 2, 0.8); }],
  ['toby', 'torso', 'A crayon smudge on Toby\'s coat.', (c, S) => { if (!S.mono) { c.fillStyle = 'rgba(230,120,40,0.5)'; c.fillRect(-1, -S.th + 9, 2.5, 0.8); } }],
  ['toby', 'torso', 'His drawing pad pokes out of a coat pocket.', (c, S) => { c.fillStyle = grey(230); c.fillRect(-S.tw / 2 + 1.5, -7, 3.2, 2.2); }],
  ['toby', 'torso', 'A mitten on a string hangs from Toby\'s sleeve.', (c, S) => { if (!S.mono) { c.fillStyle = S.main; c.fillRect(-S.tw / 2 - 1.6, -S.th + 14 + Math.sin(S.t * 3) * 0.4, 1.8, 2); } }],
  ['toby', 'legs', 'Toby\'s wellies come up to his knees.', (c, S) => { c.strokeStyle = grey(30); c.lineWidth = 2.6 * S.legW; for (const [k, f] of [[S.kA, S.fA], [S.kB, S.fB]]) { c.beginPath(); c.moveTo(lerp(k[0], f[0], 0.35), lerp(k[1], f[1], 0.35)); c.lineTo(f[0], f[1] - 1); c.stroke(); } }],
  ['toby', 'legs', 'A plaster on Toby\'s knee.', (c, S) => { c.fillStyle = grey(225, 0.9); c.fillRect(S.kA[0] - 0.8, S.kA[1] - 0.5, 1.6, 1); }],
  ['toby', 'head', 'Toby\'s hat has earflaps.', (c, S) => { c.fillStyle = S.mono ? grey(80) : S.dark; c.fillRect(-S.hr * 0.4, -S.hr * 0.2, 2, 3); }],
  ['bea', 'torso', 'Granny\'s shawl has a knitted border.', (c, S) => { c.strokeStyle = grey(200, 0.4); c.lineWidth = 0.5; c.setLineDash([0.8, 0.8]); c.beginPath(); c.moveTo(-S.tw / 2, -S.th + 9); c.lineTo(S.tw / 2, -S.th + 9); c.stroke(); c.setLineDash([]); }],
  ['bea', 'torso', 'A cameo brooch fastens the shawl.', (c, S) => { c.fillStyle = grey(210); c.beginPath(); c.ellipse(S.tw / 2 - 2.5, -S.th + 4, 1.1, 1.4, 0, 0, TAU); c.fill(); }],
  ['bea', 'torso', 'Granny\'s apron pocket holds a folded tea towel.', (c, S) => { c.fillStyle = grey(225, 0.7); c.fillRect(-1, -6, 3.4, 2); }],
  ['bea', 'head', 'Granny wears spectacles on a chain.', (c, S) => { c.strokeStyle = grey(190, 0.7); c.lineWidth = 0.4; c.beginPath(); c.moveTo(S.hr * 0.25, -0.3); c.quadraticCurveTo(-S.hr * 0.2, S.hr * 0.9, -S.hr * 0.6, 0); c.stroke(); }],
  ['bea', 'head', 'A hairnet over Granny\'s grey curls.', (c, S) => { c.strokeStyle = grey(120, 0.35); c.lineWidth = 0.3; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 1.6, -S.hr - 0.5); c.lineTo(i * 1.6 - 1, -S.hr * 0.3); c.stroke(); } }],
  ['bea', 'pre', 'Granny wears thick wool stockings.', S => { S.pants = grey(50); }],
  ['bea', 'legs', 'Granny\'s slippers have pompoms.', (c, S) => { c.fillStyle = grey(200); for (const f of [S.fA, S.fB]) { c.beginPath(); c.arc(f[0] + 3, f[1] - 1.4, 0.9, 0, TAU); c.fill(); } }],
  ['ravi', 'torso', 'Ravi\'s jacket has oil stains.', (c, S) => { c.fillStyle = grey(15, 0.35); c.beginPath(); c.ellipse(-1, -S.th + 12, 1.8, 1.2, 0.4, 0, TAU); c.fill(); }],
  ['ravi', 'torso', 'A bike-shop patch is sewn on Ravi\'s shoulder.', (c, S) => { c.fillStyle = grey(170, 0.8); c.beginPath(); c.arc(-S.tw / 2 + 3, -S.th + 4, 1.6, 0, TAU); c.fill(); }],
  ['ravi', 'torso', 'A wrench hangs from Ravi\'s belt loop.', (c, S) => { c.strokeStyle = grey(150); c.lineWidth = 1; c.beginPath(); c.moveTo(S.tw / 2 - 2, -3); c.lineTo(S.tw / 2 - 1, 2); c.stroke(); }],
  ['ravi', 'head', 'Ravi\'s beanie has a turned-up cuff.', (c, S) => { c.fillStyle = grey(0, 0.25); c.fillRect(-S.hr, -S.hr * 0.55, S.hr * 2, 1); }],
  ['ravi', 'head', 'A bike chain link earring.', (c, S) => { c.strokeStyle = grey(170); c.lineWidth = 0.4; c.strokeRect(-1.2, 1.8, 0.8, 1.2); }],
  ['ravi', 'legs', 'One of Ravi\'s trouser legs is rolled up for cycling.', (c, S) => { c.fillStyle = S.pants; c.fillRect(S.fA[0] - 1.6, S.fA[1] - 4.5, 3.4, 1.4); }],
  ['ravi', 'hand', 'A strip of old inner tube is wrapped round Ravi\'s wrist.', (c, S) => { c.strokeStyle = grey(20); c.lineWidth = 1.6; const x = lerp(S.elb[0], S.hand[0], 0.85), y = lerp(S.elb[1], S.hand[1], 0.85); c.beginPath(); c.moveTo(x - 1, y - 0.4); c.lineTo(x + 1, y + 0.4); c.stroke(); }],
  ['yara', 'torso', 'Yara\'s sweater has a cable-knit stripe.', (c, S) => { c.strokeStyle = grey(255, 0.15); c.lineWidth = 0.6; c.beginPath(); for (let i = 0; i < 6; i++) { c.moveTo(-1, -S.th + 3 + i * 3); c.lineTo(1, -S.th + 4.5 + i * 3); } c.stroke(); }],
  ['yara', 'torso', 'Headphones hang round Yara\'s neck.', (c, S) => { c.strokeStyle = grey(40); c.lineWidth = 0.8; c.beginPath(); c.arc(0, -S.th + 1, 3.4, 0.2, Math.PI - 0.2); c.stroke(); }],
  ['yara', 'torso', 'A station badge on Yara\'s sweater.', (c, S) => { c.fillStyle = grey(220); c.beginPath(); c.arc(S.tw / 2 - 3, -S.th + 6, 1, 0, TAU); c.fill(); }],
  ['yara', 'head', 'A hair clip holds Yara\'s fringe back.', (c, S) => { c.fillStyle = grey(200); c.fillRect(S.hr * 0.2, -S.hr + 1.2, 1.8, 0.6); }],
  ['yara', 'head', 'Yara\'s glasses catch the light.', (c, S) => { c.strokeStyle = grey(190, 0.8); c.lineWidth = 0.4; c.strokeRect(S.hr * 0.35, -1.5, 2.2, 1.6); }],
  ['yara', 'legs', 'Yara wears patterned tights.', (c, S) => { c.fillStyle = grey(200, 0.2); for (const k of [S.kA, S.kB]) for (let i = 0; i < 3; i++) c.fillRect(k[0] - 0.6, k[1] + i * 2, 0.6, 0.6); }],
  ['yara', 'hand', 'Yara\'s nails are bitten short; she worries.', (c, S) => { c.fillStyle = grey(240, 0.4); c.fillRect(S.hand[0] + 0.8, S.hand[1] - 0.4, 0.5, 0.5); }],
  ['pavel', 'torso', 'Pavel\'s coat has an old guard\'s shoulder epaulette.', (c, S) => { c.fillStyle = grey(30); c.fillRect(-S.tw / 2 + 1, -S.th + 1, 5, 1.2); }],
  ['pavel', 'torso', 'A name tag stitched on Pavel\'s coat.', (c, S) => { c.fillStyle = grey(200, 0.7); c.fillRect(S.tw / 2 - 6, -S.th + 6, 4, 1.3); }],
  ['pavel', 'torso', 'A thick leather belt around Pavel\'s coat.', (c, S) => { c.fillStyle = grey(25); c.fillRect(-S.tw / 2, -7, S.tw, 1.8); c.fillStyle = grey(160); c.fillRect(S.tw / 2 - 4, -7.2, 2, 2.2); }],
  ['pavel', 'head', 'A bushy moustache on Pavel.', (c, S) => { c.fillStyle = grey(50); c.fillRect(S.hr * 0.35, S.hr * 0.25, 3.4, 1.1); }],
  ['pavel', 'head', 'An old scar over Pavel\'s eyebrow.', (c, S) => { c.strokeStyle = grey(200, 0.4); c.lineWidth = 0.4; c.beginPath(); c.moveTo(S.hr * 0.4, -2.4); c.lineTo(S.hr * 0.6, -1.2); c.stroke(); }],
  ['pavel', 'legs', 'Pavel\'s guard boots are laced high.', (c, S) => { c.strokeStyle = grey(120, 0.6); c.lineWidth = 0.4; for (const f of [S.fA, S.fB]) for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(f[0] - 1, f[1] - 2 - i * 1.2); c.lineTo(f[0] + 1, f[1] - 2.6 - i * 1.2); c.stroke(); } }],
  ['pavel', 'hand', 'Pavel\'s hands are huge.', (c, S) => { c.fillStyle = S.skin; c.beginPath(); c.arc(S.hand[0], S.hand[1], 2.2, 0, TAU); c.fill(); }],
  ['lamp', 'torso', 'The Lamplighter\'s cloak has a frayed hem.', (c, S) => { c.fillStyle = S.dark; for (let i = 0; i < 5; i++) c.fillRect(-S.tw / 2 + i * S.tw / 5, 0, 1, 1.5 + PH(i, 51)); }],
  ['lamp', 'torso', 'A brass clasp fastens the cloak.', (c, S) => { c.fillStyle = S.mono ? grey(180) : 'rgb(200,160,80)'; c.beginPath(); c.arc(S.tw / 2 - 2, -S.th + 2, 1.2, 0, TAU); c.fill(); }],
  ['lamp', 'torso', 'Spare wicks hang from the Lamplighter\'s belt.', (c, S) => { c.strokeStyle = grey(220, 0.7); c.lineWidth = 0.5; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-2 + i * 1.3, -6); c.lineTo(-2 + i * 1.3, -2.5 + Math.sin(S.t * 2 + i) * 0.3); c.stroke(); } }],
  ['lamp', 'torso', 'Wax drips have dried on the cloak front.', (c, S) => { c.fillStyle = grey(230, 0.35); c.fillRect(S.tw / 2 - 4, -S.th + 10, 0.8, 2); c.fillRect(S.tw / 2 - 6, -S.th + 14, 0.8, 1.5); }],
  ['lamp', 'head', 'A faint warm glow inside the Lamplighter\'s hood.', (c, S) => { if (!S.mono) { c.fillStyle = 'rgba(255,190,110,0.12)'; c.beginPath(); c.arc(S.hr * 0.3, 0, S.hr * 0.7, 0, TAU); c.fill(); } }],
  ['lamp', 'pre', 'The Lamplighter\'s boots are worn soft from walking.', S => { S.shoe = grey(36); }],
  ['lamp', 'hand', 'Soot on the Lamplighter\'s fingertips.', (c, S) => { c.fillStyle = grey(10, 0.55); c.fillRect(S.hand[0] + 0.2, S.hand[1] - 0.8, 1.2, 1.4); }]
);
const DETAIL_BY = {}; for (const d of DETAIL) { const k = d[0] + ':' + d[1]; (DETAIL_BY[k] || (DETAIL_BY[k] = [])).push(d[3]); }
function runDetails(c, S, layer) { const L = DETAIL_BY[S.s.id + ':' + layer]; if (!L) return; for (const f of L) { try { layer === 'pre' ? f(S) : f(c, S); } catch (e) { if (DEBUG) console.warn(e); } } }

/* ---------- the new survivor drawing ---------- */
[['Body', 'Thighs are drawn thicker than shins, so legs taper toward the ankle.'], ['Body', 'Upper arms are drawn thicker than forearms.'], ['Body', 'A soft highlight sits on the near knee.'],
 ['Body', 'Trouser legs end in a hem just above the shoe.'], ['Body', 'Sleeves end in a cuff above the wrist.'], ['Body', 'The back leg and back arm are drawn a shade darker, for depth.'],
 ['Body', 'Shoes rotate with the foot, so you can see heel strikes and toe-offs.'], ['Body', 'Shoes have a separate sole and heel.'], ['Body', 'Shoes have a toe cap.'],
 ['Body', 'Hands have three shapes: open with a thumb, a loose fist, and a grip.'], ['Body', 'An open hand turns with the forearm, so it points the way the arm does.'],
 ['Body', 'A neck now joins the head to the shoulders and stretches with the walk.'], ['Body', 'Shoulders rise and fall with the shrug channel.'], ['Body', 'The chest swells with each breath.'],
 ['Body', 'The spine curls forward or arches back, moving the head and shoulders with it.'], ['Body', 'Hips sway sideways with each step, under the torso.'], ['Body', 'Each neighbour\'s trouser and shoe colours are their own.'],
 ['Body', 'Shoe size varies by person: Toby\'s boots are too big, Pavel\'s are huge.'], ['Body', 'Leg thickness varies by person.'], ['Body', 'Heeled boots are drawn with a raised heel.'],
 ['Body', 'Arms reach forward when the reach channel is used, for pointing and balance.'], ['Body', 'The squash and stretch on landing now also bends the knees.'],
 ['Body', 'Jumping uses the new knees: legs tuck under on the way up.'], ['Body', 'Lying down (sleeping, collapsed) keeps the knees and elbows relaxed and bent.'],
 ['Body', 'A thin dark contour line now runs around the arms and legs, matching the torso.'], ['Body', 'The pack straps sit on the shoulders and move with the shrug.'],
 ['Body', 'The pack bounces a beat behind the body on its own spring.'], ['Body', 'The flashlight sits in a gripping hand and points along the forearm.'],
 ['Body', 'The swung pipe or pan follows the forearm, not just the upper arm.'], ['Body', 'Mittens are drawn as mitten shapes, not just bigger dots.'],
 ['Body', 'Felt soles show as a pale band under the new shoes.'], ['Body', 'The hurt shudder now also rattles the head a little.'],
 ['Face', 'Eyes can look up and down, not only side to side.'], ['Face', 'Eyes dart slightly between glances.'], ['Face', 'Blinks now have a half-closed frame on the way down and up.'],
 ['Face', 'Each eye has a small white highlight that moves with the gaze.'], ['Face', 'Upper eyelids droop when tired.'], ['Face', 'Wide eyes now show a ring of white around the pupil.'],
 ['Face', 'The mouth opens with the jaw channel: chewing, panting, yawning, talking.'], ['Face', 'An open mouth shows a dark inside.'], ['Face', 'Smiles have little dimples at the corners.'],
 ['Face', 'A worried mouth wobbles slightly.'], ['Face', 'Brows lift independently when surprised.'], ['Face', 'Brows knit together when angry or straining.'],
 ['Face', 'Sad brows tilt up in the middle.'], ['Face', 'The nose has a small shadow under it.'], ['Face', 'Chins have a faint shadow beneath, separating the face from the neck.'],
 ['Face', 'Marta\'s cheeks puff out when she blows on cold hands.'], ['Face', 'A sick neighbour\'s forehead shows a sheen of sweat.'], ['Face', 'Breath shows as a little cloud in the cold.'],
 ['Face', 'Tears now roll down the cheek and fall away.'], ['Face', 'A hopeful face gets a second sparkle in the eyes.'], ['Face', 'Squinting eyes are drawn as curved lids, not flat lines.'],
 ['Face', 'Closed eyes in sleep curve downward, peacefully.'], ['Face', 'Speaking moves the mouth in time with the speech bubble.'], ['Face', 'Lipstick and other lip colours are supported.'],
 ['Face', 'Eye size can vary by person: Toby\'s are bigger.'], ['Face', 'The ear has an inner curve.'], ['Face', 'Sweat beads appear when working hard or sprinting.'],
 ['Face', 'A nervous swallow every few seconds when hiding.'], ['Face', 'A cheeky tongue-out when concentrating.'], ['Face', 'Pupils are a little larger at night.']
].forEach(e => SYS(e[0], e[1]));
(function () {
  const PART = { kneeHi: 0.18 };
  Rig.draw = function (ctx, s, x, y, o) {
    o = o || {}; const P = s.pose, b = s.d.b, sc = o.scale || 1, hh = b.h, bw = b.w, dir = s.face || 1, t = Game.time;
    for (const k of POSE_KEYS) if (P[k] == null) P[k] = 0;
    const sat = o.mono ? 0 : s.sat(), C = s.hueC(), sk = s.d.skin;
    const main = hsl(C, sat), muted = hsl(C, sat * 0.32, -20), dark = hsl(C, sat * 0.85, -15);
    const skinC = hsl(sk, Math.max(0.18, sat) * (s.sick ? 0.5 : 1), (s.sick ? 8 : 0) + (s.cold < 25 ? 5 : 0));
    const hairC = grey(s.d.hair * 2.4 + 10), torsoC = COLORED_TORSO[b.acc] ? main : muted;
    const S = { s, t, mono: !!o.mono, C, sat, main, dark, muted, skin: skinC, hair: hairC, torsoC, pants: grey(34), shoe: grey(18), sole: grey(62), shoeW: 1, legW: 1, eyeR: 1, lip: null, heel: 0, point: 0, hs: s.sp.hair.x, hem: s.sp.hem.x, tail: s.sp.scarf.x, hat: s.sp.hat ? s.sp.hat.x : 0, pk: s.sp.pack ? s.sp.pack.x : 0 };
    runDetails(null, S, 'pre');
    const alpha = (o.alpha == null ? 1 : o.alpha) * clamp(P.alpha, 0, 1), clothes = Save.data.equip.clothes[s.id], calmM = Save.s.reduce || o.mono;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,' + (0.35 * alpha) + ')'; ctx.beginPath(); ctx.ellipse(P.sway * 0.4, 1, 11 * bw * sc, 2.6 * sc, 0, 0, TAU); ctx.fill();
    if (s.guilt > 25 && !o.mono) { ctx.fillStyle = 'rgba(0,0,0,' + (0.22 * alpha) + ')'; ctx.beginPath(); ctx.ellipse(-dir * 12 * sc, -12 * sc, 8 * sc, 16 * sc, 0, 0, TAU); ctx.fill(); }
    ctx.translate(0, -(s.jz || 0));
    if (!o.mono && (s.morale > 80 || s.flare > 0.05)) { const r = 30 * sc * (1 + s.flare), g = ctx.createRadialGradient(0, -24 * sc, 2, 0, -24 * sc, r); g.addColorStop(0, hsl(C, 1, 12, 0.2 + s.flare * 0.35)); g.addColorStop(1, hsl(C, 1, 12, 0)); ctx.fillStyle = g; ctx.fillRect(-r, -24 * sc - r, r * 2, r * 2); }
    ctx.globalAlpha = alpha;
    if (s.sprint && Math.abs(s.vx) > 100 && !Save.s.lowfx) { ctx.globalAlpha = alpha * 0.25; ctx.fillStyle = main; ctx.fillRect(-dir * 20 * sc, -34 * sc * hh, 12 * sc, 22 * sc * hh); ctx.globalAlpha = alpha; }
    const sq = Save.s.reduce ? 0 : num(s.land) * 0.16 - (s.jv > 40 ? 0.06 : 0) + P.sq, tn = Save.s.reduce ? 0 : num(s.turnT) * 0.28;
    if (s.hurtT > 0.25 && !Save.s.reduce) ctx.translate(Math.sin(t * 70) * 1.6 * s.hurtT, 0);
    ctx.scale(dir * sc * (1 + sq) * (1 - tn), sc * (1 - sq));
    if (P.lie > 0.02) { ctx.translate(-8 * P.lie, -4 * P.lie); ctx.rotate(-Math.PI / 2 * P.lie * 0.97); }
    if (P.shake > 0.05) ctx.translate(Math.sin(t * 38) * P.shake, 0);
    const legFull = 14 * hh, legL = legFull * (1 - P.crouch * 0.5) - num(s.land) * 1.5;
    const breathe = calmM ? 0 : Math.sin(t * (s.sleeping ? 1.6 : 2.3) + s.x * 0.03) * (s.sleeping ? 0.04 : 0.022);
    const torsoH = 18 * hh * (1 - P.crouch * 0.12) * (1 + breathe), headR = s.id === 'toby' ? 6.4 : 6.8, hipY = -legL - P.bob, tw = 13 * bw * (1 + P.breath * 0.025);
    S.tw = tw; S.th = torsoH; S.hr = headR;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const L1 = legFull * 0.52, L2 = legFull * 0.5, feet = [], knees = [];
    const leg = (ang, knee, foot, ox, back) => {
      const hx = ox + P.sway * 0.5, hy = hipY, lift = knee * legFull * 0.32;
      const tx = ox + Math.sin(ang) * legFull, ty = Math.min(0, hy + Math.cos(ang) * legFull) - lift;
      const r = ik2(hx, hy, tx, ty, L1, L2, 1), w = 4.6 * Math.min(1.15, bw) * S.legW, col = back ? shade(S.pants, -10) : S.pants;
      ctx.strokeStyle = 'rgba(8,8,8,0.35)'; ctx.lineWidth = w + 1; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(r.kx, r.ky); ctx.lineTo(r.ex, r.ey); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(r.kx, r.ky); ctx.stroke();
      ctx.lineWidth = w * 0.86; ctx.beginPath(); ctx.moveTo(r.kx, r.ky); ctx.lineTo(r.ex, r.ey); ctx.stroke();
      if (!back) { ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.arc(r.kx + 0.8, r.ky, 1.3, 0, TAU); ctx.fill(); }
      else { ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = w * 0.9; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(r.kx, r.ky); ctx.lineTo(r.ex, r.ey); ctx.stroke(); }
      ctx.strokeStyle = shade(col, -14); ctx.lineWidth = 0.6; const ha = Math.atan2(r.ex - r.kx, r.ey - r.ky); ctx.beginPath(); ctx.moveTo(r.ex - Math.cos(ha) * w * 0.45 - Math.sin(ha) * 1.2, r.ey + Math.sin(ha) * w * 0.45 - Math.cos(ha) * 1.2); ctx.lineTo(r.ex + Math.cos(ha) * w * 0.45 - Math.sin(ha) * 1.2, r.ey - Math.sin(ha) * w * 0.45 - Math.cos(ha) * 1.2); ctx.stroke();
      // shoe
      const fa = foot, fw = 3.6 * S.shoeW / Math.sqrt(STY(s, 'toe'));
      ctx.save(); ctx.translate(r.ex, r.ey); ctx.rotate(-fa);
      ctx.fillStyle = back ? shade(S.shoe, -6) : S.shoe; ctx.beginPath(); ctx.ellipse(1.6, -0.6 - S.heel * 0.6, fw, 2, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.ellipse(1.6 + fw * 0.6, -1.2, fw * 0.35, 0.9, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = clothes === 'softsoles' ? grey(150) : S.sole; ctx.fillRect(-1.8, 0.6 - S.heel * 0.4, fw * 1.8 + 0.2, clothes === 'softsoles' ? 1.4 : 0.8);
      ctx.fillStyle = shade(S.shoe, -8); ctx.fillRect(-2, -0.2, 1.6, 1.2 + S.heel);
      ctx.restore();
      feet.push([r.ex, r.ey]); knees.push([r.kx, r.ky]);
    };
    const shade = (c, d) => c;   // colours here are already shaded per layer; kept as a hook
    const arm = (ang, elb, hand, front) => {
      const Lr = 12.5 * hh, sx0 = (front ? 1.5 : -1) + P.spine * torsoH * 0.25, sy0 = -torsoH + 4 - P.shrug * 1.2, reach = P.reach * (front ? 1 : 0.6);
      const d = Lr * (1 - clamp(elb, 0, 1.9) * 0.33), a2 = ang + reach * 0.3, tx = sx0 + Math.sin(a2) * d, ty = sy0 + Math.cos(a2) * d;
      const r = ik2(sx0, sy0, tx, ty, Lr * 0.5, Lr * 0.5, -1), col = front ? torsoC : (COLORED_TORSO[b.acc] ? dark : muted), w = 4 * Math.min(1.2, bw);
      ctx.strokeStyle = 'rgba(8,8,8,0.3)'; ctx.lineWidth = w + 0.9; ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.lineTo(r.kx, r.ky); ctx.lineTo(r.ex, r.ey); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.lineTo(r.kx, r.ky); ctx.stroke();
      ctx.lineWidth = w * 0.88; ctx.beginPath(); ctx.moveTo(r.kx, r.ky); ctx.lineTo(r.ex, r.ey); ctx.stroke();
      const fa = Math.atan2(r.ex - r.kx, r.ey - r.ky);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(r.ex - Math.sin(fa) * 1.6 - Math.cos(fa) * w * 0.42, r.ey - Math.cos(fa) * 1.6 + Math.sin(fa) * w * 0.42); ctx.lineTo(r.ex - Math.sin(fa) * 1.6 + Math.cos(fa) * w * 0.42, r.ey - Math.cos(fa) * 1.6 - Math.sin(fa) * w * 0.42); ctx.stroke();
      const hc = clothes === 'mitts' ? (o.mono ? grey(150) : hsl(C, Math.max(0.4, sat), 6)) : skinC;
      ctx.fillStyle = hc;
      if (clothes === 'mitts') { ctx.save(); ctx.translate(r.ex, r.ey); ctx.rotate(-fa); ctx.beginPath(); ctx.ellipse(0, 1.2, 2.5, 3, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(1.8, 0.2, 1, 1.4, 0.4, 0, TAU); ctx.fill(); ctx.restore(); }
      else if (hand >= 1.5) { ctx.beginPath(); ctx.arc(r.ex, r.ey, 2.1, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(r.ex - 1.4, r.ey - 0.3, 2.8, 0.5); }
      else if (hand >= 0.6) { ctx.beginPath(); ctx.arc(r.ex, r.ey, 2.2, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.arc(r.ex, r.ey, 1.2, 0.5, 2.4); ctx.stroke(); }
      else { ctx.save(); ctx.translate(r.ex, r.ey); ctx.rotate(-fa); ctx.beginPath(); ctx.ellipse(0, 1.6, 1.9, 2.9, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(1.7, 0.4, 0.8, 1.6, -0.5, 0, TAU); ctx.fill(); ctx.restore(); }
      return { hand: [r.ex, r.ey], elb: [r.kx, r.ky], fa };
    };
    // back leg, back arm (in the torso frame), front leg
    leg(P.legB, P.kneeB, P.footB, -2.4 * bw, true);
    ctx.save(); ctx.translate(0, hipY); ctx.rotate(P.lean + P.spine * 0.5);
    const bA = arm(P.armB, P.elbB, P.handB, false); S.handB = bA.hand;
    ctx.restore();
    leg(P.legA, P.kneeA, P.footA, 2.4 * bw, false);
    S.fA = feet[1]; S.fB = feet[0]; S.kA = knees[1]; S.kB = knees[0];
    runDetails(ctx, S, 'legs');
    ctx.save(); ctx.translate(P.sway * 0.4, hipY); ctx.rotate(P.lean + P.spine * 0.5);
    runDetails(ctx, S, 'back');
    if (o.pack && P.lie < 0.3) { const py = S.pk * 0.6 - P.shrug; ctx.fillStyle = grey(58); rrect(ctx, -tw / 2 - 5, -torsoH + 2 + py, 8, 13, 2.5); ctx.fill(); ctx.fillStyle = grey(40); ctx.fillRect(-tw / 2 - 5, -torsoH + 7 + py, 8, 1.4); ctx.strokeStyle = grey(30); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-tw / 2 + 2, -torsoH + 2 - P.shrug); ctx.lineTo(tw / 2 - 3, -torsoH + 12); ctx.stroke(); }
    const hem = s.sp.hem.x, top = -torsoH - P.shrug * 0.8, lean2 = P.spine * torsoH * 0.35;
    ctx.fillStyle = torsoC; ctx.beginPath();
    ctx.moveTo(-tw / 2 - hem * 0.6, 2); ctx.lineTo(tw / 2, 1); ctx.lineTo(tw / 2 - 1 + lean2, top + 4); ctx.quadraticCurveTo(tw / 2 - 1 + lean2, top, tw / 2 - 5 + lean2, top);
    ctx.lineTo(-tw / 2 + 5 + lean2, top); ctx.quadraticCurveTo(-tw / 2 + 1 + lean2, top, -tw / 2 + 1 + lean2 * 0.6, top + 4); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(0,0,0,0.17)'; ctx.fillRect(-tw / 2 - 4, top, tw * 0.36 + 4, torsoH + 4); ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(tw / 2 - 3 + lean2, top, 3, torsoH); ctx.restore();
    ctx.strokeStyle = 'rgba(8,8,8,0.42)'; ctx.lineWidth = 0.8; ctx.stroke();
    if (b.acc === 'cardigan') { ctx.strokeStyle = dark; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(2, top + 2); ctx.lineTo(2, 1); ctx.stroke(); ctx.fillStyle = dark; for (let i = 0; i < 3; i++) ctx.fillRect(3, top + 6 + i * 4, 1.4, 1.4); }
    if (b.acc === 'coat' || b.acc === 'cloak') { ctx.fillStyle = dark; ctx.fillRect(-tw / 2 + 1, top, tw - 2, 3); ctx.fillRect(1, top + 3, 1.5, torsoH - 3); if (b.acc === 'cloak') { ctx.fillStyle = torsoC; ctx.fillRect(-tw / 2 - hem, -2, tw + hem, 6); } }
    if (b.acc === 'wind') { ctx.strokeStyle = grey(235, 0.7); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-tw / 2 + 1, top + 7); ctx.lineTo(tw / 2 - 1, top + 7); ctx.stroke(); }
    if (b.acc === 'jacket') { ctx.fillStyle = dark; ctx.fillRect(-tw / 2 + 1, -5, tw - 2, 2); ctx.fillRect(1.5, top + 2, 1.2, torsoH - 4); }
    if (b.acc === 'sweater') { ctx.strokeStyle = dark; ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-tw / 2 + 2, top + 6 + i * 4); ctx.lineTo(tw / 2 - 2, top + 6 + i * 4); ctx.stroke(); } ctx.strokeStyle = grey(60); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, top + 1, 5, 0.2, Math.PI - 0.2); ctx.stroke(); }
    if (b.acc === 'shawl') { ctx.fillStyle = main; ctx.beginPath(); ctx.moveTo(-tw / 2 - 2 - hem * 0.5, top + 11); ctx.lineTo(0, top - 1); ctx.lineTo(tw / 2 + 2, top + 9); ctx.lineTo(tw / 2, top + 3); ctx.lineTo(-tw / 2, top + 3); ctx.closePath(); ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = 0.8; ctx.stroke(); }
    if (s.coat) { ctx.strokeStyle = grey(150, 0.8); ctx.lineWidth = 1.2; ctx.strokeRect(-tw / 2 + 1.5, top + 4, tw - 3, torsoH - 5); }
    if (!o.mono) { ctx.strokeStyle = hsl(C, Math.max(sat, 0.62), 16, 0.55); ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(tw / 2, 1); ctx.lineTo(tw / 2 - 1 + lean2, top + 4); ctx.quadraticCurveTo(tw / 2 - 1 + lean2, top, tw / 2 - 5 + lean2, top); ctx.stroke(); }
    ctx.save(); ctx.translate(0, -P.shrug * 0.8); S.th = torsoH; runDetails(ctx, S, 'torso'); ctx.restore();
    // neck
    const nx = 1 + lean2 * 1.1, ny = top + 0.5;
    ctx.fillStyle = skinC; ctx.fillRect(nx - 1.8, ny - 2.6 - P.neck, 3.6, 3.4 + P.neck);
    // head
    ctx.save(); ctx.translate(nx, ny - headR + 1.5 - P.neck); ctx.rotate(P.head + P.tilt + (s.hurtT > 0.25 && !calmM ? Math.sin(t * 50) * 0.05 : 0));
    const hs = s.sp.hair.x; S.hs = hs;
    if (b.hair === 'pony') { ctx.strokeStyle = hairC; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-headR + 1, -2); ctx.quadraticCurveTo(-headR - 5 - hs, 0, -headR - 4 - hs * 1.6, 8); ctx.stroke(); }
    if (b.hair === 'bun') { ctx.fillStyle = hairC; ctx.beginPath(); ctx.arc(-headR + 0.5, -headR + 1, 3.2, 0, TAU); ctx.fill(); }
    if (b.hair === 'hood') { ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(-1, 0, headR + 2.5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = skinC; ctx.beginPath(); ctx.arc(0, 0, headR, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(8,8,8,0.35)'; ctx.lineWidth = 0.7; ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.arc(0.6, headR - 0.6, 3.4, 0.2, Math.PI - 0.2); ctx.fill();       // chin shadow
    const puff = s.anim === 'shiver' && s.id === 'marta' ? 0.6 : 0;
    ctx.fillStyle = skinC; ctx.beginPath(); ctx.arc(headR - 0.3, 0.9, 1.35, -1.2, 1.6); ctx.fill(); if (puff) { ctx.beginPath(); ctx.arc(headR * 0.55, 2.4, 1.6 + puff, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(headR - 1.6, 2.1, 1.6, 0.5);                                                   // under the nose
    if (s.cold < 25 && !o.mono) { ctx.fillStyle = 'hsla(356,70%,62%,0.55)'; ctx.beginPath(); ctx.arc(headR - 0.1, 1, 1.1, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.beginPath(); ctx.arc(-1.4, 0.8, 1.7, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.arc(-1.2, 0.8, 0.9, -1, 1.4); ctx.stroke();     // inner ear
    ctx.fillStyle = hairC;
    if (b.hair === 'bun' || b.hair === 'pony' || b.hair === 'bob') { ctx.beginPath(); ctx.arc(0, 0, headR + 0.4, Math.PI * 0.95, Math.PI * 1.95); ctx.lineTo(headR * 0.3, -headR * 0.35); ctx.closePath(); ctx.fill(); if (b.hair === 'bob') ctx.fillRect(-headR - 0.4, -2, 3.4, headR + 2 + hs * 0.3); }
    if (b.hair === 'grey') { ctx.beginPath(); ctx.arc(0, 0, headR + 0.5, Math.PI * 0.9, Math.PI * 1.9); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(-headR * 0.5, -headR, 3, 0, TAU); ctx.fill(); ctx.strokeStyle = grey(30); ctx.lineWidth = 0.7; ctx.strokeRect(1, -2.2, 2.6, 2.4); ctx.strokeRect(4.2, -2.2, 2.2, 2.4); }
    if (b.hair === 'cap') { ctx.beginPath(); ctx.arc(-1.5, 0, headR, Math.PI * 0.75, Math.PI * 1.2); ctx.fill(); ctx.fillStyle = grey(46); ctx.beginPath(); ctx.arc(0, -1.5 - S.hat * 0.3, headR + 0.5, Math.PI, TAU); ctx.fill(); ctx.fillRect(headR - 2, -2.6 - S.hat * 0.3, 5.5, 1.8); }
    if (b.hair === 'beanie') { ctx.fillStyle = grey(52); ctx.beginPath(); ctx.arc(0, -1.2 - S.hat * 0.3, headR + 0.6, Math.PI * 0.98, Math.PI * 2.02); ctx.fill(); ctx.fillStyle = grey(70); ctx.fillRect(-headR - 0.6, -2.4, headR * 2 + 1.2, 2.2); ctx.fillStyle = grey(40, 0.5); ctx.fillRect(1, 2.6, 4.5, 2.6); }
    if (b.hair === 'hat') { ctx.fillStyle = main; ctx.beginPath(); ctx.arc(0, -1.4 - S.hat * 0.3, headR + 0.9, Math.PI * 0.98, Math.PI * 2.02); ctx.fill(); ctx.fillStyle = dark; ctx.fillRect(-headR - 0.9, -2.6, headR * 2 + 1.8, 2.3); if (s.id !== 'toby') { ctx.fillStyle = main; ctx.beginPath(); ctx.arc(-1 - hs * 0.4, -headR - 2.4, 2.4, 0, TAU); ctx.fill(); } }
    if (b.hair === 'bald') { ctx.fillStyle = grey(70); ctx.fillRect(2, 2.2, 5, 1.6); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.arc(-1, -3.4, 1.6, 0, TAU); ctx.fill(); }
    if (b.hair === 'bun' || b.hair === 'pony' || b.hair === 'bob' || b.hair === 'grey') { ctx.strokeStyle = 'rgba(255,255,255,0.24)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(0, 0, headR - 1.1, Math.PI * 1.22, Math.PI * 1.5); ctx.stroke(); }
    runDetails(ctx, S, 'head');
    drawFace(ctx, s, S, headR, t, o);
    runDetails(ctx, S, 'face');
    const cl = Save.data.equip.clothes[s.id];
    if (cl === 'glasses' && b.hair !== 'grey') { ctx.strokeStyle = grey(25); ctx.lineWidth = 0.7; ctx.strokeRect(0.2, -2.2, 2.6, 2.4); ctx.strokeRect(3.6, -2.2, 2.4, 2.4); }
    if (cl === 'ribbon' && !o.mono) { ctx.fillStyle = hsl(C, sat, 10); ctx.beginPath(); ctx.moveTo(-headR + 1, -headR + 1); ctx.lineTo(-headR - 3, -headR - 2); ctx.lineTo(-headR - 3, -headR + 4); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    if (b.acc === 'scarf' || cl === 'wool') {
      const sc2 = b.acc === 'scarf' ? main : grey(165), tail = s.sp.scarf.x;
      ctx.fillStyle = sc2; ctx.fillRect(-tw / 2 + 1 + lean2, top - 1, tw - 1, 4.2);
      ctx.strokeStyle = sc2; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-tw / 2 + 2 + lean2, top + 1); ctx.quadraticCurveTo(-tw / 2 - 3 - tail * 0.6, top + 3 - tail * 0.2, -tw / 2 - 4 - tail, top + 10 - tail * 0.5); ctx.stroke();
    }
    if (b.hair === 'bob') { ctx.strokeStyle = grey(70); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(lean2, top + 1.5, 5.2, 0.1, Math.PI - 0.1); ctx.stroke(); }
    const fA = arm(P.armA, P.elbA, s.light && !s.hidden ? 2 : P.handA, true); S.hand = fA.hand; S.elb = fA.elb;
    runDetails(ctx, S, 'hand');
    const hand = fA.hand;
    if (s.light && !s.hidden) { ctx.save(); ctx.translate(hand[0], hand[1]); ctx.rotate(-fA.fa + Math.PI / 2); ctx.fillStyle = grey(190); ctx.fillRect(-1, -1.5, 6, 3); ctx.fillStyle = grey(255); ctx.fillRect(4.4, -2, 1.4, 4); ctx.restore(); }
    if ((s.anim === 'use') && (s.id === 'pavel' || s.hasPan)) { ctx.strokeStyle = grey(120); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(hand[0], hand[1]); ctx.lineTo(hand[0] + Math.sin(fA.fa) * 13, hand[1] + Math.cos(fA.fa) * 13); ctx.stroke(); }
    // effort sweat
    if (!o.mono && (s.anim === 'run' || (s.anim === 'interact' && num(s.animT) > 3)) && !calmM) { const k = (t * 1.3) % 1; ctx.fillStyle = grey(235, 0.6 * (1 - k)); ctx.beginPath(); ctx.arc(nx + headR * 0.9, ny - headR * 1.6 + k * 6, 0.7, 0, TAU); ctx.fill(); }
    ctx.restore();
    if (s.prot > 0 && Math.sin(t * TAU * 3) > 0) { ctx.strokeStyle = grey(255, 0.8); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(0, hipY - torsoH * 0.5, tw * 0.9, legL + torsoH * 0.7, 0, 0, TAU); ctx.stroke(); }
    ctx.restore();
    // cold breath, drawn in world space so it drifts the way they face
    if (!o.mono && s.cold < 45 && !calmM && P.lie < 0.3) { const k = ((t * 0.45 + s.x * 0.01) % 1); if (k < 0.5) { const bx = x + dir * (9 + k * 10) * sc, by = y - (s.jz || 0) - (legL + torsoH + headR) * sc + 2 * sc - k * 3; ctx.fillStyle = grey(230, 0.22 * (1 - k * 2)); ctx.beginPath(); ctx.arc(bx, by, (1.5 + k * 4) * sc, 0, TAU); ctx.fill(); } }
    // the 1.1 overlay (speed lines, hearts, airborne shadow)
    try { V11.survivor(ctx, s, x, y, o); } catch (e) { if (DEBUG) console.warn(e); }
  };
  function drawFace(ctx, s, S, headR, t, o) {
    const P = s.pose, gx = s.glance * 0.6 + num(s.sacc) * 0.5, gy = clamp(P.lookY, -1, 1) * 0.55, er = S.eyeR, ink = grey(18);
    const ex = [headR * 0.18 + gx, headR * 0.66 + gx], ey = -0.6 + gy; S.ex = ex;
    const bl = s.blink, half = bl < 0.2 && bl >= 0.12 || (bl < 0.04);
    let eyes = s.eyes; if (half && eyes !== 'closed' && eyes !== 'squint') eyes = 'half';
    const dark = Render.lastW && Render.lastW.night ? 1.15 : 0.9;
    ctx.fillStyle = ink; ctx.strokeStyle = ink; ctx.lineWidth = 0.9;
    for (let i = 0; i < 2; i++) {
      const X = ex[i];
      if (eyes === 'closed') { ctx.beginPath(); if (s.sleeping) ctx.arc(X, ey - 0.6, 1.2, 0.3, Math.PI - 0.3); else { ctx.moveTo(X - 1.1, ey); ctx.lineTo(X + 1.1, ey); } ctx.stroke(); }
      else if (eyes === 'squint') { ctx.beginPath(); ctx.arc(X, ey + 0.8, 1.3, Math.PI + 0.5, TAU - 0.5); ctx.stroke(); }
      else if (eyes === 'half') { ctx.beginPath(); ctx.arc(X, ey + 0.2, 1.05 * er, 0, Math.PI); ctx.fill(); ctx.beginPath(); ctx.moveTo(X - 1.3, ey); ctx.lineTo(X + 1.3, ey); ctx.stroke(); }
      else if (eyes === 'wide') { ctx.fillStyle = grey(240); ctx.beginPath(); ctx.arc(X, ey, 1.75 * er, 0, TAU); ctx.fill(); ctx.strokeStyle = grey(0, 0.4); ctx.lineWidth = 0.4; ctx.stroke(); ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(X + gx * 0.4, ey + gy * 0.3, 0.8 * er * dark, 0, TAU); ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 0.9; }
      else {
        ctx.beginPath(); ctx.arc(X, ey, 1.05 * er * dark, 0, TAU); ctx.fill(); ctx.fillStyle = grey(255, 0.85); ctx.fillRect(X + 0.1 + gx * 0.2, ey - 0.75, 0.5, 0.5); ctx.fillStyle = ink;
        if (eyes === 'tired') { ctx.fillStyle = S.skin; ctx.fillRect(X - 1.4, ey - 1.5, 2.8, 1.1); ctx.fillStyle = ink; ctx.beginPath(); ctx.moveTo(X - 1.3, ey - 0.5); ctx.lineTo(X + 1.3, ey - 0.5); ctx.stroke(); ctx.fillStyle = grey(30, 0.3); ctx.fillRect(X - 1.2, ey + 1.2, 2.4, 0.8); ctx.fillStyle = ink; }
        if (eyes === 'teary') { const k = (t * 0.8 + i * 0.5) % 1; ctx.fillStyle = grey(235, 0.9 * (1 - k)); ctx.beginPath(); ctx.arc(X + 0.4, ey + 1.6 + k * 5, 0.7, 0, TAU); ctx.fill(); ctx.fillStyle = ink; }
        if (eyes === 'hopeful') { ctx.fillStyle = grey(255); ctx.fillRect(X + 0.1, ey - 0.8, 0.7, 0.7); ctx.fillRect(X - 0.6, ey + 0.2, 0.4, 0.4); ctx.fillStyle = ink; }
      }
    }
    const br = s.eyes === 'hopeful' ? -0.5 : (s.mouth === 'worried' || s.eyes === 'teary') ? 0.6 : s.mouth === 'grit' ? -0.9 : 0, surprise = s.eyes === 'wide' ? 0.8 : 0, knit = s.mouth === 'grit' ? 0.5 : 0;
    ctx.beginPath();
    if (br > 0.3) { ctx.moveTo(ex[0] - 1.2, ey - 2.4); ctx.lineTo(ex[0] + 1.1, ey - 3.1); ctx.moveTo(ex[1] - 1, ey - 3.1); ctx.lineTo(ex[1] + 1.1, ey - 2.4); }
    else { ctx.moveTo(ex[0] - 1.2, ey - 2.6 + br - surprise); ctx.lineTo(ex[0] + 1.1 + knit, ey - 2.6 - br - surprise * 0.7 + knit); ctx.moveTo(ex[1] - 1 - knit, ey - 2.6 - br * 0.5 - surprise + knit); ctx.lineTo(ex[1] + 1.1, ey - 2.6 + br * 0.4 - surprise * 0.8); }
    ctx.stroke();
    const mx = headR * 0.42, my = 3; S.mx = mx;
    const talk = s.bubble && s.bubble.t > s.bubble.max - Math.min(2.5, s.bubble.max * 0.7) && !Save.s.reduce, jaw = clamp(P.jaw + (talk ? Math.max(0, Math.sin(t * 14)) * 0.5 : 0), 0, 1);
    ctx.strokeStyle = S.lip || ink; ctx.lineWidth = S.lip ? 1.1 : 0.9;
    if (jaw > 0.18) { ctx.fillStyle = grey(25); ctx.beginPath(); ctx.ellipse(mx, my + 0.2, 1.3, 0.5 + jaw * 1.3, 0, 0, TAU); ctx.fill(); if (S.lip) { ctx.stroke(); } if (s.anim === 'interact' && jaw > 0.3 && !o.mono) { ctx.fillStyle = 'hsla(350,60%,62%,0.8)'; ctx.fillRect(mx + 0.6, my + 0.2, 1, 0.8); } }
    else {
      ctx.beginPath();
      if (s.mouth === 'smile') { ctx.arc(mx, my - 0.8, 1.9, 0.15, Math.PI - 0.15); ctx.stroke(); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(mx - 2.1, my - 0.4, 0.4, 0.4); ctx.fillRect(mx + 1.8, my - 0.4, 0.4, 0.4); }
      else if (s.mouth === 'worried') { const wob = Save.s.reduce ? 0 : Math.sin(t * 9) * 0.15; ctx.arc(mx, my + 1.4 + wob, 1.7, Math.PI + 0.25, TAU - 0.25); ctx.stroke(); }
      else if (s.mouth === 'o') { ctx.arc(mx, my, 1.1, 0, TAU); ctx.stroke(); }
      else if (s.mouth === 'grit') { ctx.moveTo(mx - 1.8, my); ctx.lineTo(mx - 0.6, my + 0.7); ctx.lineTo(mx + 0.6, my - 0.2); ctx.lineTo(mx + 1.8, my + 0.5); ctx.stroke(); }
      else { ctx.moveTo(mx - 1.4, my); ctx.lineTo(mx + 1.4, my); ctx.stroke(); }
    }
    if (!o.mono && (s.comfortT > 0 || s.morale > 80)) { ctx.fillStyle = hsl([8, 70, 60], S.sat, 0, 0.4); ctx.beginPath(); ctx.arc(headR * 0.1, 2, 1.5, 0, TAU); ctx.fill(); }
    if (s.sick && !o.mono) { ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(headR * 0.3, -headR * 0.55, 1.2, 0, TAU); ctx.fill(); }
    if (s.anim === 'hide' && (t % 3) < 0.25) { ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(headR * 0.2, headR - 0.3); ctx.lineTo(headR * 0.5, headR - 0.8); ctx.stroke(); }
  }
})();

/* ---------- G. Toby in The Long Walk ---------- */
const TOBY = [
  'Toby now has jointed knees and elbows in The Long Walk, using the same leg and arm solver as the main game.',
  'His run has high knees on the forward leg.', 'His heels kick up behind him as he runs.', 'His arms pump with bent elbows when he runs.',
  'He leans into the run, more as he speeds up.', 'His body bobs on each stride, with a flight phase at the top.', 'His head stays steadier than his body as he runs.',
  'Starting and stopping: a brief lean back with his arms out as he changes speed.',
  'Take-off: his knees tuck up under him.', 'Rising: his arms fling up and his body stretches.',
  'Falling: his legs reach down for the ground and his arms go up.', 'A long fall: his arms windmill.', 'Landing: he squashes down into his knees, harder from higher falls.',
  'Landing: his arms swing down with the impact.', 'Landing from a big fall: he puts a hand to the ground.',
  'Pushing a crate: he leans right into it with both arms straight out.', 'Pushing: short, effortful steps.', 'Pushing: his head goes down with the effort.',
  'Pulling a lever: he reaches up, grabs and hauls down with his whole body.', 'Pulling a lever: he bends his knees as he hauls.',
  'Standing still: his body rises and falls with his breathing.', 'Standing still: his weight shifts from foot to foot.',
  'Standing still for a while: he looks up at the paper stars.', 'Standing still for longer: he hugs himself against the cold.',
  'Standing still for a long time: he sits down on the spot and waits.', 'He glances down at his boots every so often.',
  'Riding a moving platform: he holds his arms out for balance.', 'On a crumbling board: his arms wobble and his knees bend.',
  'In the searchlight: he throws an arm up over his eyes.', 'Being chased by a dog: he runs with arms flailing and his chin up.',
  'In a low tunnel: he ducks his head.', 'In the rain: he ducks his head.', 'In the snow: he lifts his feet higher.',
  'Falling into a pit: he tumbles head over heels.', 'Caught on glass and wire: he crumples to his knees.', 'In deep water: he sinks, arms reaching up, with bubbles.',
  'Caught in the searchlight: he fades away.', 'Caught by a dog: he is knocked flat.', 'Hit by falling rubble: he is knocked down.',
  'Coming back at a checkpoint: he fades back in.', 'Reaching the exit: he steps toward the light and raises his hand to shield his eyes.',
  'His hat has its own spring: it lags on starts and stops, and bounces on landings.', 'The pompom on his hat bobs on a second, looser spring.',
  'His hat squashes down when he lands.', 'His hat brim shows a knitted rib.', 'His hat is the brightest thing on screen, with a soft rim of light.',
  'His coat flares out behind him as he runs.', 'His coat hem swings back and forth when he stops.', 'He has a tiny scarf end that streams when he runs.',
  'His boots are a bit too big, and flap on each step.', 'A small puff of dust when he lands.', 'In the cold chapters, a faint cloud of breath.',
  'His eyes catch the light: two small pale dots under the hat.', 'He blinks.', 'His silhouette has a faint lighter rim, so he never gets lost against the black ground.',
  'He has a soft ground shadow that shrinks as he jumps.', 'All of his animations blend smoothly into each other.', 'Reduce Intensity calms his idle bob, windmilling, wobbling and flailing.'
];
(function () {
  if (typeof WalkScene === 'undefined') return;
  const ink = () => grey(6);
  WalkScene.prototype.drawToby = function (ctx, x, y) {
    const P = this.P, t = this.t, run = P.on && Math.abs(P.vx) > 20, sp = Math.abs(P.vx) / WALK_SPD, calmM = calm() || Save.s.reduce;
    const T = this.tp || (this.tp = { legA: 0, legB: 0, kneeA: 0, kneeB: 0, armA: 0, armB: 0, elbA: 0, elbB: 0, lean: 0, bob: 0, sq: 0, head: 0, crouch: 0, sit: 0 });
    const Q = { legA: 0, legB: 0, kneeA: 0.05, kneeB: 0.05, armA: 0.05, armB: -0.05, elbA: 0.2, elbB: 0.2, lean: 0, bob: 0, sq: 0, head: 0, crouch: 0, sit: 0 };
    const sw = Math.sin(P.ph), cw = Math.cos(P.ph);
    if (run) { const k = Math.min(1, sp); Q.legA = sw * 0.85 * k; Q.legB = -sw * 0.85 * k; Q.kneeA = Math.max(0, cw) * 1.2 * k; Q.kneeB = Math.max(0, -cw) * 1.2 * k; Q.armA = -sw * 0.9 * k; Q.armB = sw * 0.9 * k; Q.elbA = 0.9; Q.elbB = 0.9; Q.lean = 0.16 * k; Q.bob = Math.abs(sw) * 1.6 * k + Math.max(0, Math.abs(sw) - 0.7) * 2; Q.head = -0.06; }
    if (P.on && Math.sign(P.vx) !== 0 && Math.abs(P.vx) < 60 && !run) { Q.lean = -0.1; Q.armA = -0.6; Q.armB = 0.6; }
    if (!P.on) { const up = P.vy < -60; Q.kneeA = up ? 1.1 : 0.2; Q.kneeB = up ? 0.9 : 0.1; Q.legA = up ? 0.4 : 0.25; Q.legB = up ? -0.1 : -0.15; Q.armA = up ? 2.4 : 2.0; Q.armB = up ? 2.1 : 1.6; Q.elbA = 0.3; Q.elbB = 0.4; Q.sq = up ? -0.06 : 0; if (num(P.airT) > 0.9 && !calmM) { Q.armA = 2 + Math.sin(t * 14) * 1; Q.armB = 2 - Math.sin(t * 14) * 1; } }
    if (P.landT > 0) { const k = P.landT / 0.28 * num(P.landK, 0.4); Q.crouch = k * 0.8; Q.kneeA = Math.max(Q.kneeA, k); Q.kneeB = Math.max(Q.kneeB, k); Q.armA = -0.3; Q.armB = 0.4; Q.sq = k * 0.2; if (num(P.landK) > 0.8) { Q.armA = 0.9; Q.elbA = 0; } }
    if (P.push > 0) { Q.armA = 1.55; Q.armB = 1.45; Q.elbA = 0.05; Q.elbB = 0.1; Q.lean = 0.42; Q.head = 0.18; Q.kneeA *= 0.7; Q.kneeB *= 0.7; }
    if (P.pullT > 0) { const k = 1 - P.pullT / 0.6; Q.armA = k < 0.35 ? 2.8 : 2.8 - (k - 0.35) * 3; Q.elbA = k < 0.35 ? 0.1 : 0.9; Q.crouch = k > 0.35 ? 0.4 : 0; Q.kneeA = Q.kneeB = k > 0.35 ? 0.4 : 0; }
    if (P.on && !run && !P.push && !P.pullT && !P.landT) {
      Q.bob = calmM ? 0 : Math.sin(t * 2) * 0.4; Q.legA = Math.sin(t * 0.5) * 0.05; Q.head = 0;
      if (P.idleT > 2.5) Q.head = -0.35;
      if (P.idleT > 6) { Q.armA = 1.3; Q.armB = 1.3; Q.elbA = 1.6; Q.elbB = 1.6; Q.head = 0.05; }
      if (P.idleT > 12) { Q.sit = Math.min(1, (P.idleT - 12) / 0.8); Q.crouch = Q.sit * 0.9; Q.kneeA = Q.kneeB = Q.sit * 1.4; Q.legA = Q.legB = Q.sit * 1.2; }
      if (((t * 0.3) % 1) < 0.08 && P.idleT < 6) Q.head = 0.3;
    }
    if (P.ride) { Q.armA = 1.5; Q.armB = 1.5; Q.elbA = 0.1; Q.elbB = 0.1; Q.kneeA = Q.kneeB = 0.25; }
    const onFall = this.L.falls.some(f => f.t > 0 && P.x + 14 > f.x && P.x < f.x + f.w && P.on); if (onFall && !calmM) { Q.armA = 1.6 + Math.sin(t * 22) * 0.3; Q.armB = 1.6 - Math.sin(t * 22) * 0.3; Q.kneeA = Q.kneeB = 0.3; }
    const inLight = this.L.lights.some(l => num(l.seen) > 0.05); if (inLight) { Q.armA = 2.7; Q.elbA = 1.4; Q.lean = -0.1; }
    const chased = this.L.dogs.some(g => g.st === 'run' && Math.abs(g.x - P.x) < 400); if (chased && run) { Q.head = -0.3; if (!calmM) { Q.armA = Math.sin(t * 16) * 1.6; Q.armB = -Math.sin(t * 16) * 1.4; } }
    const ducked = this.L.solids.some(r => r.y + r.h < P.y && r.y + r.h > P.y - 60 && P.x + 7 > r.x && P.x + 7 < r.x + r.w); if (ducked) Q.head = 0.25;
    const ch = this.L.ch; if (WALK_CH[ch].part === 'rain') Q.head += 0.08; if (WALK_CH[ch].part === 'snow' && run) { Q.kneeA *= 1.2; Q.kneeB *= 1.2; }
    if (this.done) { Q.armA = 2.6; Q.elbA = 1.3; Q.lean = 0.05; }
    const k = Math.min(1, (this.lastDT || 0.016) * 16); for (const key in Q) T[key] += (Q[key] - T[key]) * k;
    // springs for the hat and pompom and coat
    const hat = this.hatS || (this.hatS = new Spring(0, 140, 8)), pom = this.pomS || (this.pomS = new Spring(0, 70, 5)), coat = this.coatS || (this.coatS = new Spring(0, 90, 9));
    hat.t = -T.bob * 0.8 + (P.landT > 0 ? 1.5 : 0) - P.vx * 0.004; pom.t = hat.x * 1.6 - P.vx * 0.012; coat.t = clamp(Math.abs(P.vx) * 0.04, 0, 6); const dt = this.lastDT || 0.016; hat.step(dt); pom.step(dt); coat.step(dt);
    ctx.save(); ctx.translate(x, y);
    // shadow
    const air = clamp((this.groundAt(P.x + 7) - (P.y + P.h)) / 120, 0, 1); ctx.fillStyle = grey(0, 0.35 * (1 - air)); ctx.beginPath(); ctx.ellipse(0, 1, 9 * (1 - air * 0.5), 2, 0, 0, TAU); ctx.fill();
    if (P.dead) {
      const d = P.dead, how = P.how;
      if (how === 'water') { ctx.translate(0, Math.min(40, d * 30)); T.armA = 2.8; T.armB = 2.6; if (!calmM) for (let i = 0; i < 3; i++) { const b = (d * 1.5 + i * 0.3) % 1; ctx.strokeStyle = grey(200, 0.6 * (1 - b)); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(2 + i * 3, -30 - b * 30, 1.5, 0, TAU); ctx.stroke(); } }
      else if (how === 'fall') { ctx.translate(0, -15); ctx.rotate(d * 8 * P.face); ctx.translate(0, 15); }
      else if (how === 'light') { ctx.globalAlpha = clamp(1 - d, 0, 1); }
      else if (how === 'dog' || how === 'rock') { ctx.rotate(-P.face * Math.min(1, d / 0.3) * 1.5); ctx.translate(-P.face * 4, 0); }
      else { const kk = Math.min(1, d / 0.35); T.crouch = kk; T.kneeA = T.kneeB = kk * 1.5; T.head = kk * 0.4; ctx.rotate(P.face * kk * 0.3); }
    }
    if (this.spawnT == null || this.spawnP !== P) { this.spawnT = 0; this.spawnP = P; } this.spawnT += this.lastDT || 0.016;
    if (this.spawnT < 0.5) ctx.globalAlpha *= clamp(this.spawnT / 0.5, 0, 1);
    ctx.scale(P.face * (1 + T.sq), 1 - T.sq);
    const legFull = 13, legL = legFull * (1 - T.crouch * 0.45), hipY = -legL - T.bob, col = ink();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const leg = (ang, kn, ox, w) => { const tx = ox + Math.sin(ang) * legFull, ty = Math.min(0, hipY + Math.cos(ang) * legFull) - kn * legFull * 0.3 - (run ? Math.max(0, -ang) * 5 : 0), r = ik2(ox, hipY, tx, ty, 6.8, 6.6, 1); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(ox, hipY); ctx.lineTo(r.kx, r.ky); ctx.lineTo(r.ex, r.ey); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(r.ex + 2, r.ey - 0.8 + (run && !calmM ? Math.sin(P.ph * 2) * 0.3 : 0), 3.6, 1.9, 0, 0, TAU); ctx.fill(); };
    leg(T.legB, T.kneeB, -2, 4); leg(T.legA, T.kneeA, 2, 4.2);
    ctx.save(); ctx.translate(0, hipY); ctx.rotate(T.lean);
    const arm = (ang, elb, front) => { const sx = front ? 1.5 : -1, sy = -12, d = 11 * (1 - clamp(elb, 0, 1.8) * 0.33), r = ik2(sx, sy, sx + Math.sin(ang) * d, sy + Math.cos(ang) * d, 5.6, 5.6, -1); ctx.strokeStyle = col; ctx.lineWidth = front ? 3.2 : 2.8; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(r.kx, r.ky); ctx.lineTo(r.ex, r.ey); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(r.ex, r.ey, 1.7, 0, TAU); ctx.fill(); };
    arm(T.armB, T.elbB, false);
    // coat with a flaring hem
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-6 - coat.x * 0.7, 2 + Math.sin(t * 3) * (P.on && !run ? 0.3 : 0)); ctx.lineTo(6, 1); ctx.lineTo(5, -14); ctx.quadraticCurveTo(4, -17, 0, -17); ctx.quadraticCurveTo(-5, -17, -5, -13); ctx.closePath(); ctx.fill();
    // a little scarf end
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-3, -15); ctx.quadraticCurveTo(-7 - coat.x, -14, -9 - coat.x * 1.3, -11 + Math.sin(t * 9) * (run ? 1 : 0.2)); ctx.stroke();
    // rim light so he never vanishes into the ground
    ctx.strokeStyle = grey(70, 0.5); ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(6, 1); ctx.lineTo(5, -14); ctx.quadraticCurveTo(4, -17, 0, -17); ctx.stroke();
    // head
    ctx.save(); ctx.translate(1, -22 + T.bob * 0.45); ctx.rotate(T.head);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, 6.3, 0, TAU); ctx.fill();
    const blink = ((t + 1.3) % 4.1) < 0.12; ctx.fillStyle = grey(200, 0.75); if (!blink) { ctx.fillRect(2.2, -0.6, 1.2, 1.2); ctx.fillRect(4.4, -0.6, 1.1, 1.2); } else { ctx.fillRect(2, 0, 3.6, 0.4); }
    // the only colour in the world: the orange hat, on its own spring
    const sv = SURVIVORS.toby, hc = hsl(sv.hue, 1, 0), hy = -hat.x * 0.6, squash = P.landT > 0 ? num(P.landK, 0.4) * 0.15 : 0;
    if (!Render.cheap) { ctx.save(); ctx.shadowColor = hsl(sv.hue, 1, 10, 0.8); ctx.shadowBlur = 6; }
    ctx.fillStyle = hc; ctx.save(); ctx.translate(0, hy); ctx.scale(1 + squash, 1 - squash); ctx.beginPath(); ctx.arc(0, -2, 6.7, Math.PI, TAU); ctx.fill(); ctx.fillRect(-6.9, -3, 13.8, 2.6); ctx.restore();
    if (!Render.cheap) ctx.restore();
    ctx.strokeStyle = hsl(sv.hue, 1, -18); ctx.lineWidth = 0.4; for (let i = -6; i <= 6; i += 1.7) { ctx.beginPath(); ctx.moveTo(i, -2.9 + hy); ctx.lineTo(i, -0.5 + hy); ctx.stroke(); }
    ctx.fillStyle = hc; ctx.beginPath(); ctx.arc(-3 - pom.x * 0.8, -9.2 + hy - pom.x * 0.3, 2.3, 0, TAU); ctx.fill();
    ctx.restore();
    arm(T.armA, T.elbA, true);
    ctx.restore();
    ctx.restore();
    // breath in the cold
    if (!calmM && (ch === 0 || ch === 4) && ((t * 0.5) % 1) < 0.45) { const k = ((t * 0.5) % 1) / 0.45; ctx.fillStyle = grey(220, 0.18 * (1 - k)); ctx.beginPath(); ctx.arc(x + P.face * (10 + k * 8), y - 22 - T.bob - k * 3, 1.5 + k * 3, 0, TAU); ctx.fill(); }
    // landing dust puff
    if (P.landT > 0.2 && num(P.landK) > 0.3 && !this.dusted) { this.dusted = true; Parts.emit('dust', P.x + 7, P.y + P.h - 1, 5, { sx: 10 }); } if (P.landT <= 0.2) this.dusted = false;
  };
  const _u = WalkScene.prototype.update; WalkScene.prototype.update = function (dt) { this.lastDT = dt; return _u.call(this, dt); };
  const _ld = WalkScene.prototype.load; WalkScene.prototype.load = function () { const r = _ld.apply(this, arguments); this.spawnT = 0; this.spawnP = this.P; this.tp = null; return r; };
})();

/* ---------- the numbered list ---------- */
function SPRITE_LOG() {
  const out = [];
  const sysA = []; for (const [a] of SPR.sys) if (!sysA.includes(a)) sysA.push(a);
  for (const a0 of sysA) for (const [a, t] of SPR.sys) if (a === a0) out.push(['The rig, body and face: ' + a, t]);
  for (const a of ANIMX) out.push(['Animation: ' + a[0], a[1]]);
  for (const id of SURV_ORDER) { const st = STYLE[id]; if (!st) continue; for (const k in STYLE_PARAMS) { const v = st[k]; if (v == null || v === 1) continue; const P = STYLE_PARAMS[k]; out.push(['How ' + SURVIVORS[id].short + ' moves', SURVIVORS[id].short + ': ' + (v < 1 ? P[1] : P[2]) + ' (' + P[0] + ' x' + v.toFixed(2) + ').']); } }
  for (const m of MOOD) out.push(['Moods', m[2]]);
  const byWho = L => SURV_ORDER.flatMap(id => L.filter(e => e[0] === id));
  for (const p of byWho(PERS)) out.push(['Personal touches: ' + SURVIVORS[p[0]].short, p[2]]);
  for (const d of byWho(DETAIL)) out.push(['Costume: ' + SURVIVORS[d[0]].short, d[2]]);
  for (const t of TOBY) out.push(['Toby in The Long Walk', t]);
  return out;
}
