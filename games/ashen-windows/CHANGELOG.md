# Changelog

## 1.4.0

This round adds an **All Unlocked** mode, black and white, film grain and VHS **screen filters**, slows the player down (with every timing that depended on speed retuned so it all stays beatable), and makes **1000 improvements to the player sprites and their animations**, listed one by one below. New code lives in `src/15_exA_sprites.js` (the sprite and animation overhaul) `src/15_exB_unlocked.js` (All Unlocked) and `src/15_exC_filters.js` (screen filters).

### New mode: All Unlocked

- Open it from **All Unlocked** on the title screen (marked "NEW IN 1.4"), or from Modes. It is a sandbox: nothing you do there touches your story save or your Long Walk progress.
- **The Long Walk:** pick any of the 50 levels and play it straight away, including the ones you have not reached yet.
- **Night sorties:** pick any site, pick who goes (any of the nine neighbours, the Lamplighter included) and go.
- **Story:** start any of the five chapters.
- **Every mode:** start any mode, including the ones that are normally locked.
- **Items:** add any item in the game, in any amount, to a shared chest. With **Bring the chest into games** on (the default), every game you start from All Unlocked begins with everything in the chest, and sorties pack it. Items are grouped by kind: food, water, medicine, materials, tools, comforts, keepsakes, and everything else.
- **Add any item from the pause menu:** in a game started from All Unlocked, the pause menu has **Add any item**, which puts it straight into your stock, or into your pack on a sortie.

### Screen filters

- Three new filters, all **off by default**, switched on from the **pause menu** (under Screen filters) in the main game and in The Long Walk, or from **Settings > Screen filters**. They can be combined, and they are remembered.
  - **Black and white** drains all colour from the picture, people included, and lifts the contrast a touch.
  - **Film grain** lays a fine, moving grain over everything.
  - **VHS effect** adds scanlines, a faint sideways colour bleed, a tracking band that rolls down the screen, the odd white glitch line, darkened corners, and a blinking PLAY counter with the time.
- With **Reduce Intensity** on, the VHS tracking band and glitch lines are switched off, the PLAY marker stops blinking, and the grain only shifts three times a second.
- New code: `src/15_exC_filters.js`.

### Slower player movement

| | 1.3 | 1.4 |
|---|---|---|
| Walking speed | 78 | 64 |
| Sprint | 148 (78 × 1.9) | 141 (64 × 2.2) |
| Sneaking | 35 | 29 |
| Climbing | × 1.5 | × 1.3 |
| Long Walk running | 150 | 125 |
| Long Walk pushing a crate | 80 | 66 |

- Sprinting is still faster than a chasing patrol (124) and a chasing dog (138), so escapes still work.
- **Nights are 15% longer** (`CFG.timeScale` 1.15) so the same rooms can still be searched before dawn.
- **The Long Walk was retuned** so every jump can still be made at the new speed:
  - gaps are 44 + 26 × difficulty wide (were 52 + 30)
  - double gaps 40 + 20 × difficulty (were 48 + 24)
  - spike strips 34 + 20 × difficulty (were 40 + 26), and 20 + 8 in tunnels (were 24 + 8)
  - tunnel roofs are 10 pixels higher
  - dogs run at 175 (were 215)
  - rotten boards wait 0.65 seconds before dropping (were 0.6)
- A bot clears all 11 kinds of Long Walk puzzle piece at the new speed (test/t13.js), and all 50 levels still pass their checks (test/t12.js).

### 1000 sprite and animation improvements

The neighbours now have jointed knees and elbows, real hands and shoes, a neck, a fuller face, and ten new animations that the game chooses from what they are doing and how they feel. Each of them moves in their own way, has their own costume details, and shows their mood in their body. Toby in The Long Walk was redrawn with the same joints. Every line below is a separate change in `src/15_exA_sprites.js`; the list is generated from the code (`SPRITE_LOG()`), so it always matches what is in the game.

#### The rig, body and face: Rig

1. Legs are now two bones, thigh and shin, joined at a knee that bends.
2. Arms are now two bones, upper arm and forearm, joined at an elbow.
3. Feet are placed with inverse kinematics, so the foot lands where the stride puts it and the knee works out the rest.
4. Hands are placed with inverse kinematics too, so elbows bend naturally when an arm is pulled in.
5. Knees always bend forward and elbows always bend back, as real joints do.
6. A crouch now bends the knees instead of shortening the legs.
7. Feet can no longer sink below the floor at any point of a stride.
8. Eighteen new pose channels: knee lift on each leg, elbow bend on each arm, toe angle on each foot, hip sway, spine curl, head tilt, breathing, hand shape on each hand, jaw, shoulder shrug, eye height, squash, neck stretch and reach.
9. Every new channel eases toward its target, so poses blend smoothly between animations.
10. Each animation has its own blend speed: snappy for hurt and throw, slow and heavy for sleep and collapse.
11. Channels reset each frame, so a pose can never get stuck from an earlier animation.
12. Older survivors without the new channels are upgraded on the fly the first time they are drawn.
13. A Reduce Intensity setting halves sway, breathing and jaw motion.
14. Blink timing follows each neighbour's own blink rate.
15. Eyes make tiny darting movements (saccades) between glances.
16. Hair is thrown up by a jump and settles after the landing.
17. Hats have their own spring and bob a beat behind the head.
18. Backpacks have their own spring: they bounce on each step and lift on a jump.
19. The rig remembers how long the current animation has been playing, for timed touches.
20. Restless neighbours blend between poses a little faster.

#### The rig, body and face: Blending

21. The idle animation blends in at its own pace (9 per second).
22. The walk animation blends in at its own pace (14 per second).
23. The run animation blends in at its own pace (18 per second).
24. The sneak animation blends in at its own pace (12 per second).
25. The climb animation blends in at its own pace (16 per second).
26. The jump animation blends in at its own pace (20 per second).
27. The crouch animation blends in at its own pace (12 per second).
28. The hide animation blends in at its own pace (10 per second).
29. The interact animation blends in at its own pace (14 per second).
30. The use animation blends in at its own pace (24 per second).
31. The throw animation blends in at its own pace (26 per second).
32. The eat animation blends in at its own pace (12 per second).
33. The sleep animation blends in at its own pace (4 per second).
34. The shiver animation blends in at its own pace (16 per second).
35. The cough animation blends in at its own pace (18 per second).
36. The hurt animation blends in at its own pace (28 per second).
37. The collapse animation blends in at its own pace (5 per second).
38. The comforted animation blends in at its own pace (9 per second).
39. The gesture animation blends in at its own pace (14 per second).
40. The victory animation blends in at its own pace (8 per second).
41. The defeat animation blends in at its own pace (4 per second).
42. The sit animation blends in at its own pace (8 per second).
43. The carry animation blends in at its own pace (9 per second).
44. The limp animation blends in at its own pace (12 per second).
45. The coldwalk animation blends in at its own pace (12 per second).
46. The trudge animation blends in at its own pace (10 per second).
47. The skid animation blends in at its own pace (26 per second).
48. The land animation blends in at its own pace (22 per second).
49. The search animation blends in at its own pace (14 per second).
50. The heave animation blends in at its own pace (12 per second).
51. The turn animation blends in at its own pace (24 per second).
52. The bored animation blends in at its own pace (6 per second).

#### The rig, body and face: New animations

53. Carrying someone or something heavy now has its own animation.
54. Walking while hurt is now a limp.
55. Walking in the cold is now a hunched, hugging shuffle.
56. Walking while exhausted or miserable is now a slow trudge.
57. Stopping from a sprint now plays a short skid.
58. Landing from a hop now plays a recovery crouch.
59. Searching a container now has its own rummaging animation.
60. Heavy jobs (cranking, prying, forcing) now have a straining heave.
61. Turning around now plays a quick pivot.
62. Standing idle for a long time now plays a bored, restless wait.
63. The survivors screen move preview now also shows carrying, limping, the cold walk, trudging, searching, heaving and the bored wait.
64. The bored wait only starts after nine seconds of standing still, and stops the moment a neighbour moves, sleeps, climbs or starts a job.
65. The new animations are chosen automatically from what a neighbour is doing and how they feel.
66. Carrying, limping, cold and trudging walks only replace the normal walk; sprinting, sneaking and climbing are unchanged.

#### The rig, body and face: Body

67. Thighs are drawn thicker than shins, so legs taper toward the ankle.
68. Upper arms are drawn thicker than forearms.
69. A soft highlight sits on the near knee.
70. Trouser legs end in a hem just above the shoe.
71. Sleeves end in a cuff above the wrist.
72. The back leg and back arm are drawn a shade darker, for depth.
73. Shoes rotate with the foot, so you can see heel strikes and toe-offs.
74. Shoes have a separate sole and heel.
75. Shoes have a toe cap.
76. Hands have three shapes: open with a thumb, a loose fist, and a grip.
77. An open hand turns with the forearm, so it points the way the arm does.
78. A neck now joins the head to the shoulders and stretches with the walk.
79. Shoulders rise and fall with the shrug channel.
80. The chest swells with each breath.
81. The spine curls forward or arches back, moving the head and shoulders with it.
82. Hips sway sideways with each step, under the torso.
83. Each neighbour's trouser and shoe colours are their own.
84. Shoe size varies by person: Toby's boots are too big, Pavel's are huge.
85. Leg thickness varies by person.
86. Heeled boots are drawn with a raised heel.
87. Arms reach forward when the reach channel is used, for pointing and balance.
88. The squash and stretch on landing now also bends the knees.
89. Jumping uses the new knees: legs tuck under on the way up.
90. Lying down (sleeping, collapsed) keeps the knees and elbows relaxed and bent.
91. A thin dark contour line now runs around the arms and legs, matching the torso.
92. The pack straps sit on the shoulders and move with the shrug.
93. The pack bounces a beat behind the body on its own spring.
94. The flashlight sits in a gripping hand and points along the forearm.
95. The swung pipe or pan follows the forearm, not just the upper arm.
96. Mittens are drawn as mitten shapes, not just bigger dots.
97. Felt soles show as a pale band under the new shoes.
98. The hurt shudder now also rattles the head a little.

#### The rig, body and face: Face

99. Eyes can look up and down, not only side to side.
100. Eyes dart slightly between glances.
101. Blinks now have a half-closed frame on the way down and up.
102. Each eye has a small white highlight that moves with the gaze.
103. Upper eyelids droop when tired.
104. Wide eyes now show a ring of white around the pupil.
105. The mouth opens with the jaw channel: chewing, panting, yawning, talking.
106. An open mouth shows a dark inside.
107. Smiles have little dimples at the corners.
108. A worried mouth wobbles slightly.
109. Brows lift independently when surprised.
110. Brows knit together when angry or straining.
111. Sad brows tilt up in the middle.
112. The nose has a small shadow under it.
113. Chins have a faint shadow beneath, separating the face from the neck.
114. Marta's cheeks puff out when she blows on cold hands.
115. A sick neighbour's forehead shows a sheen of sweat.
116. Breath shows as a little cloud in the cold.
117. Tears now roll down the cheek and fall away.
118. A hopeful face gets a second sparkle in the eyes.
119. Squinting eyes are drawn as curved lids, not flat lines.
120. Closed eyes in sleep curve downward, peacefully.
121. Speaking moves the mouth in time with the speech bubble.
122. Lipstick and other lip colours are supported.
123. Eye size can vary by person: Toby's are bigger.
124. The ear has an inner curve.
125. Sweat beads appear when working hard or sprinting.
126. A nervous swallow every few seconds when hiding.
127. A cheeky tongue-out when concentrating.
128. Pupils are a little larger at night.

#### Animation: walk

129. The leg swinging forward lifts its knee.
130. Heel strike: the front toe tips up as the foot lands.
131. Push-off: the back toe tips down as the foot leaves the floor.
132. Elbows soften a little as the arms swing.
133. The hips sway into each step.
134. The head stays steady while the body bobs, like a real walker's.
135. A slight dip at each heel strike before the body rises again.
136. Hands hang loose and half-open.
137. Shoulders counter-rotate a touch against the hips.
138. Breathing quickens a little while walking.

#### Animation: run

139. High knees on the forward leg.
140. The back heel kicks up behind on each stride.
141. Elbows bend to ninety degrees, as runners hold them.
142. Hands close into loose fists.
143. The spine curls forward into the run.
144. The chin juts forward.
145. A strong hip sway.
146. Breath comes in short, fast pants.
147. Shoulders pump against the stride.
148. A flight phase: both feet briefly leave the floor at the top of each stride.

#### Animation: sneak

149. Knees stay deeply bent while creeping.
150. Each foot is placed toe first.
151. Arms are held out a little for balance.
152. Fingers spread, ready to catch a wall.
153. Shoulders hunch up toward the ears.
154. The head pokes forward and peers.
155. Breathing is held: the chest barely moves.
156. Almost no hip sway, to stay quiet.

#### Animation: climb

157. Knees come up high on each rung.
158. Hands grip the rails.
159. Elbows bend and straighten as each hand reaches up.
160. Toes point down onto the rungs.
161. The head tilts up to look where they are going.
162. Effortful breathing on the climb.
163. The body hugs the ladder.

#### Animation: jump

164. Both knees tuck on the way up.
165. Legs reach down for the landing on the way down.
166. Arms fling up on take-off.
167. Hands open wide in the air.
168. A small stretch while rising.
169. Eyes look down to find the landing.

#### Animation: crouch

170. A proper squat: both knees bend deep.
171. Weight on the balls of the feet.
172. Forearms rest across the knees.
173. Slow, controlled breathing.
174. The head turns to listen, now and then.

#### Animation: hide

175. Knees pulled up tight.
176. Arms wrapped around the knees.
177. Shoulders up and head down, small as possible.
178. Breath held, then a careful little breath out every few seconds.
179. Eyes dart to the gap they are watching through.

#### Animation: interact

180. Both hands work at the task.
181. Elbows work in and out with the hands.
182. The head bends over the work.
183. Knees soften to get closer.
184. Weight shifts from foot to foot during long jobs.
185. The tongue pokes out when concentrating.

#### Animation: use

186. The arm winds back with the elbow bent, then snaps straight on the swing.
187. The front knee braces on the swing.
188. The back foot pivots onto its toe.
189. A tight grip on the tool.
190. The other arm swings back for balance.
191. A grunt: the jaw clenches.

#### Animation: throw

192. The throwing elbow cocks back behind the head.
193. The hand opens at release.
194. The other arm points at the target.
195. The back foot pushes off its toe.
196. The spine twists through the throw.
197. Eyes follow the throw out.

#### Animation: eat

198. The elbow bends to bring food to the mouth.
199. The jaw chews.
200. The other hand cups underneath for crumbs.
201. Shoulders hunch protectively over the bowl.
202. A content little sway while eating.

#### Animation: sleep

203. Knees curl up in sleep.
204. Hands tuck under the cheek.
205. Slow, deep breathing you can see.
206. The mouth falls slightly open.
207. A twitch now and then while dreaming.

#### Animation: shiver

208. Arms hug the body, elbows tight.
209. Knees knock together.
210. Shoulders up to the ears.
211. Teeth chatter.
212. Toes curl inward against the cold.
213. Breath comes in shaky gasps.

#### Animation: cough

214. Doubles over at each cough.
215. A hand comes up to cover the mouth.
216. The other hand braces on a knee.
217. Knees buckle a little.
218. The jaw jolts open with each cough.

#### Animation: hurt

219. The body recoils away from the blow.
220. Hands fly up to protect the face.
221. A knee buckles.
222. The head snaps back.
223. A sharp gasp.
224. A stagger: the feet scramble for balance.

#### Animation: collapse

225. Limbs go slack on collapse.
226. Faint, slow breathing so you know they are alive.
227. The head lolls.

#### Animation: comforted

228. Shoulders drop and relax.
229. Hands clasp together over the heart.
230. A happy little bounce in the knees.
231. The head tilts warmly to one side.
232. A long, relieved breath out.

#### Animation: gesture

233. A wave from the wrist with the elbow bent.
234. The other hand rests on the hip.
235. The weight shifts onto one leg.
236. Talks with the jaw while gesturing.

#### Animation: victory

237. Fists pump in the air.
238. Up on the toes.
239. Chin up, chest out.
240. A happy bounce in the knees.

#### Animation: defeat

241. Shoulders slump.
242. Arms hang limp.
243. Knees go soft.
244. A long, heavy sigh every few seconds.
245. Eyes on the floor.

#### Animation: sit

246. Shins hang down from the seat.
247. Feet swing gently while sitting.
248. Hands rest in the lap.
249. A relaxed curve in the back.

#### Animation: idle

250. Knees are never locked: a soft, living stance.
251. Weight shifts from one foot to the other every few seconds.
252. Breathing lifts the chest.
253. Arms hang with relaxed elbows.
254. Now and then the head turns to look around.
255. Eyes drift up and down a little.
256. A small stretch every so often.
257. Toes tap when someone is bored.
258. Cold hands are rubbed together.
259. Hungry people hold their stomach.
260. Tired people sag at the knees and yawn.
261. Happy people stand a little taller.
262. Scared people hug themselves.
263. Someone who is speaking moves their jaw with the words.

#### Animation: carry

264. Carrying: short, heavy steps.
265. Carrying: both arms wrapped around the load.
266. Carrying: leaning back against the weight.
267. Carrying: knees bent under the weight.
268. Carrying: hard breathing.
269. Carrying: shoulders set and raised.

#### Animation: limp

270. Limping: one leg takes a long step, the hurt one a short one.
271. Limping: a big dip each time the hurt leg takes the weight.
272. Limping: the hurt knee hardly bends.
273. Limping: a hand presses on the hurt side.
274. Limping: the face winces with each step.
275. Limping: leaning toward the good side.
276. Limping: the free arm swings out for balance.

#### Animation: coldwalk

277. Cold walk: arms wrapped around the body.
278. Cold walk: quick, stiff little steps.
279. Cold walk: shoulders up to the ears.
280. Cold walk: knees barely lift.
281. Cold walk: a shiver runs through now and then.
282. Cold walk: teeth chattering.

#### Animation: trudge

283. Trudging: slow, dragging steps.
284. Trudging: feet scuff along the floor.
285. Trudging: head hanging.
286. Trudging: arms dangle with hardly any swing.
287. Trudging: shoulders slumped forward.
288. Trudging: a sigh now and then.

#### Animation: skid

289. Skid: leaning back hard against the stop.
290. Skid: the front leg braces out straight.
291. Skid: the back knee bends deep.
292. Skid: arms fly forward for balance.
293. Skid: a little puff of dust kicks up.

#### Animation: land

294. Landing: knees absorb the drop.
295. Landing: arms swing down and out.
296. Landing: the head dips, then comes up.
297. Landing: a breath out on impact.
298. Landing: toes flat on the floor.

#### Animation: search

299. Searching: one arm reaches deep into the container.
300. Searching: the other hand holds the lid or door.
301. Searching: bent over at the waist.
302. Searching: knees bend to get lower.
303. Searching: the head turns to look inside.
304. Searching: the reaching hand opens and closes.
305. Searching: shifting weight while rummaging.

#### Animation: heave

306. Heaving: both hands grip and pull.
307. Heaving: elbows pump with each pull.
308. Heaving: leaning back into each pull.
309. Heaving: legs braced wide.
310. Heaving: a grimace and clenched jaw.
311. Heaving: hard breathing between pulls.

#### Animation: turn

312. Turning: weight drops onto the pivot foot.
313. Turning: arms swing across with the turn.
314. Turning: the head leads the turn.
315. Turning: a quick hip shift.

#### Animation: bored

316. Bored: rocking from heel to toe.
317. Bored: hands clasped behind the back.
318. Bored: looking around the room.
319. Bored: a yawn now and then.
320. Bored: a long sigh.
321. Bored: humming under the breath.

#### How Marta moves

322. Marta: shorter steps (stride x0.92).
323. Marta: arms held closer (arm swing x0.90).
324. Marta: a smooth, level walk (bounce x0.95).
325. Marta: a forward lean (lean x1.10).
326. Marta: a loose hip sway (hip sway x1.10).
327. Marta: a rounded back (posture x1.05).
328. Marta: bent elbows (elbows x1.15).
329. Marta: open hands (hands x0.80).
330. Marta: quick breathing (breathing x1.10).
331. Marta: feet together (feet x0.90).
332. Marta: raised shoulders (shoulders x1.10).
333. Marta: frequent blinks (blinking x1.20).
334. Marta: restless fidgeting (fidgeting x1.10).
335. Marta: eyes up and alert (gaze x1.15).

#### How Dov moves

336. Dov: shorter steps (stride x0.85).
337. Dov: arms held closer (arm swing x0.75).
338. Dov: a bouncy walk (bounce x1.20).
339. Dov: a forward lean (lean x1.20).
340. Dov: feet kept low (knee lift x0.70).
341. Dov: little hip sway (hip sway x0.80).
342. Dov: a rounded back (posture x1.25).
343. Dov: bent elbows (elbows x1.10).
344. Dov: hands kept in fists (hands x1.20).
345. Dov: slow breathing (breathing x0.85).
346. Dov: toes turned out (feet x1.20).
347. Dov: dropped shoulders (shoulders x0.85).
348. Dov: chin tucked (head carriage x0.90).
349. Dov: rare blinks (blinking x0.80).
350. Dov: stillness (fidgeting x0.80).
351. Dov: eyes down (gaze x0.90).

#### How Ines moves

352. Ines: longer strides (stride x1.18).
353. Ines: a bigger arm swing (arm swing x1.20).
354. Ines: a bouncy walk (bounce x1.10).
355. Ines: a forward lean (lean x1.25).
356. Ines: knees lifted high (knee lift x1.25).
357. Ines: little hip sway (hip sway x0.90).
358. Ines: a straight back (posture x0.90).
359. Ines: straight arms (elbows x0.90).
360. Ines: quick breathing (breathing x1.20).
361. Ines: dropped shoulders (shoulders x0.90).
362. Ines: chin up (head carriage x1.15).
363. Ines: restless fidgeting (fidgeting x1.35).
364. Ines: eyes up and alert (gaze x1.20).

#### How Toby moves

365. Toby: shorter steps (stride x0.80).
366. Toby: a bigger arm swing (arm swing x1.30).
367. Toby: a bouncy walk (bounce x1.35).
368. Toby: an upright carriage (lean x0.90).
369. Toby: knees lifted high (knee lift x1.30).
370. Toby: little hip sway (hip sway x0.70).
371. Toby: a straight back (posture x0.85).
372. Toby: straight arms (elbows x0.85).
373. Toby: open hands (hands x0.90).
374. Toby: quick breathing (breathing x1.30).
375. Toby: feet together (feet x0.80).
376. Toby: raised shoulders (shoulders x1.05).
377. Toby: chin tucked (head carriage x0.85).
378. Toby: frequent blinks (blinking x1.25).
379. Toby: restless fidgeting (fidgeting x1.40).
380. Toby: eyes down (gaze x0.85).

#### How Granny moves

381. Granny: shorter steps (stride x0.75).
382. Granny: arms held closer (arm swing x0.70).
383. Granny: a smooth, level walk (bounce x0.80).
384. Granny: a forward lean (lean x1.30).
385. Granny: feet kept low (knee lift x0.75).
386. Granny: a loose hip sway (hip sway x1.15).
387. Granny: a rounded back (posture x1.35).
388. Granny: bent elbows (elbows x1.25).
389. Granny: open hands (hands x0.80).
390. Granny: slow breathing (breathing x0.90).
391. Granny: toes turned out (feet x1.15).
392. Granny: dropped shoulders (shoulders x0.90).
393. Granny: chin up (head carriage x1.10).
394. Granny: rare blinks (blinking x0.90).
395. Granny: stillness (fidgeting x0.75).
396. Granny: eyes up and alert (gaze x1.05).

#### How Ravi moves

397. Ravi: longer strides (stride x1.05).
398. Ravi: a bigger arm swing (arm swing x1.05).
399. Ravi: a bouncy walk (bounce x1.05).
400. Ravi: an upright carriage (lean x0.95).
401. Ravi: a loose hip sway (hip sway x1.25).
402. Ravi: a rounded back (posture x1.10).
403. Ravi: open hands (hands x0.85).
404. Ravi: slow breathing (breathing x0.95).
405. Ravi: toes turned out (feet x1.25).
406. Ravi: dropped shoulders (shoulders x0.80).
407. Ravi: chin tucked (head carriage x0.95).
408. Ravi: stillness (fidgeting x0.90).

#### How Yara moves

409. Yara: shorter steps (stride x0.95).
410. Yara: arms held closer (arm swing x0.85).
411. Yara: a smooth, level walk (bounce x0.90).
412. Yara: feet kept low (knee lift x0.95).
413. Yara: bent elbows (elbows x1.20).
414. Yara: hands kept in fists (hands x1.15).
415. Yara: quick breathing (breathing x1.30).
416. Yara: feet together (feet x0.85).
417. Yara: raised shoulders (shoulders x1.30).
418. Yara: chin tucked (head carriage x0.90).
419. Yara: frequent blinks (blinking x1.35).
420. Yara: restless fidgeting (fidgeting x1.25).
421. Yara: eyes down (gaze x0.80).

#### How Pavel moves

422. Pavel: longer strides (stride x1.10).
423. Pavel: arms held closer (arm swing x0.80).
424. Pavel: a smooth, level walk (bounce x0.75).
425. Pavel: an upright carriage (lean x0.90).
426. Pavel: feet kept low (knee lift x0.85).
427. Pavel: little hip sway (hip sway x0.75).
428. Pavel: a straight back (posture x0.95).
429. Pavel: straight arms (elbows x0.95).
430. Pavel: hands kept in fists (hands x1.20).
431. Pavel: slow breathing (breathing x0.80).
432. Pavel: toes turned out (feet x1.30).
433. Pavel: dropped shoulders (shoulders x0.85).
434. Pavel: chin up (head carriage x1.05).
435. Pavel: rare blinks (blinking x0.75).
436. Pavel: stillness (fidgeting x0.70).

#### How Lamplighter moves

437. Lamplighter: longer strides (stride x1.12).
438. Lamplighter: arms held closer (arm swing x0.60).
439. Lamplighter: a smooth, level walk (bounce x0.60).
440. Lamplighter: an upright carriage (lean x0.85).
441. Lamplighter: knees lifted high (knee lift x1.10).
442. Lamplighter: little hip sway (hip sway x0.60).
443. Lamplighter: a straight back (posture x0.90).
444. Lamplighter: bent elbows (elbows x1.05).
445. Lamplighter: open hands (hands x0.75).
446. Lamplighter: slow breathing (breathing x0.70).
447. Lamplighter: feet together (feet x0.90).
448. Lamplighter: dropped shoulders (shoulders x0.80).
449. Lamplighter: chin up (head carriage x1.20).
450. Lamplighter: rare blinks (blinking x0.65).
451. Lamplighter: stillness (fidgeting x0.65).
452. Lamplighter: eyes up and alert (gaze x1.25).

#### Moods

453. Sad walking: a slower arm swing.
454. Sad walking: eyes on the floor.
455. Sad idle: arms wrapped around themselves.
456. Sad idle: shoulders curled in.
457. Sad sitting: head in hands.
458. Sad working: slower, heavier hands.
459. Happy walking: a bounce in the step.
460. Happy walking: chin up.
461. Happy idle: a little sway, as if to music.
462. Happy idle: hands on hips now and then.
463. Happy running: a lighter, springier stride.
464. Happy working: humming along.
465. Hungry walking: a hand on the stomach.
466. Hungry idle: a little doubling-over now and then.
467. Hungry sitting: hugging the knees.
468. Hungry working: stops to rub the stomach.
469. Cold idle: stamping feet.
470. Cold idle: hands tucked in armpits.
471. Cold running: shoulders hunched.
472. Cold sneaking: a shiver in the arms.
473. Cold sitting: knees drawn up, rocking.
474. Cold working: blowing on the fingers between tasks.
475. Sick walking: unsteady, weaving a little.
476. Sick walking: a hand to the forehead.
477. Sick idle: hunched, arms crossed.
478. Sick idle: sniffing.
479. Sick sleeping: restless turning.
480. Sick working: stops to cough into an elbow.
481. Tired walking: heavy feet.
482. Tired walking: drooping eyelids.
483. Tired idle: rubbing the eyes.
484. Tired idle: swaying on the feet.
485. Tired sitting: nodding off.
486. Tired working: slow, deliberate hands.
487. Hurt idle: weight kept off one leg.
488. Hurt idle: holding the injured arm.
489. Hurt running: an uneven, hitching stride.
490. Hurt sneaking: one hand on the wall side for support.
491. Hurt climbing: a wince on each rung.
492. Hurt sitting: an injured leg stretched out.
493. Scared idle: looking over the shoulder.
494. Scared idle: hands up near the face.
495. Scared walking: quick glances back.
496. Scared running: arms flailing.
497. Scared sneaking: frozen for a beat between steps.
498. Scared hiding: trembling.
499. Scared crouching: arms over the head.
500. Scared working: hurried, jerky hands.

#### Personal touches: Marta

501. Marta checks her watch-pin now and then: a nurse's habit.
502. Marta keeps one hand on her satchel strap as she walks.
503. Marta runs holding the satchel against her side.
504. Marta sneaks with a hand raised, ready to hush someone.
505. Marta works with quick, precise hands.
506. Marta pats her own chest when someone thanks her.
507. Marta clutches the hurt spot, assessing it like a nurse.
508. Marta sleeps lightly, one hand still on the satchel.
509. Marta crouches with her bag pulled close.
510. Marta blows into her cupped hands.
511. Marta eats quickly, standing, like a nurse on shift.
512. Marta beckons with two fingers.
513. Marta hugs the air, then laughs at herself.
514. Marta presses her hands to her face.
515. Marta climbs carefully, checking each rung.
516. Marta carries with a nurse's lift: back straight, knees bent.
517. Marta limps but keeps her head up, checking on everyone else.
518. Marta walks in the cold with her scarf pulled up to her chin.
519. Marta trudges counting under her breath.
520. Marta skids with one hand flying to the satchel.
521. Marta lands lightly, checking her satchel is still shut.
522. Marta searches tidily, setting things aside in order.
523. Marta heaves carefully, never jerking.
524. Marta turns to look around her, as if counting heads.
525. Marta, bored, rechecks her satchel.
526. Marta climbs steadily, three points on the rungs at all times.
527. Marta hides with a finger to her lips.

#### Personal touches: Dov

528. Dov favours his bad knee: the back leg stays stiff.
529. Dov's run is more of a determined hobble.
530. Dov rubs his bad knee.
531. Dov stands with his hands in his cardigan pockets.
532. Dov hammers with a full-arm swing.
533. Dov climbs one rung at a time, leading with the good leg.
534. Dov crouches with a hand on his knee and a grimace.
535. Dov sits with the stiff leg stretched out.
536. Dov sneaks with exaggerated care, arms out like a tightrope walker.
537. Dov stamps his good foot against the cold.
538. Dov points with the hammer handle.
539. Dov gives one slow, satisfied nod.
540. Dov snores: his jaw drops wide.
541. Dov's bad knee gives out when he is hit.
542. Dov looks away, embarrassed but pleased.
543. Dov carries on his shoulder, the way he carried planks.
544. Dov's limp favours his bad knee, which never fully bends.
545. Dov walks in the cold with his hands deep in his cardigan.
546. Dov trudges with a hand on his lower back.
547. Dov stops short and grabs at his knee.
548. Dov lands heavily on his good leg.
549. Dov searches like he is checking a joint: tapping, listening.
550. Dov heaves with long, practised strokes.
551. Dov turns slowly, his whole body, not just his head.
552. Dov, bored, whittles at nothing with his thumb.
553. Dov climbs with a pause on each rung for his knee.
554. Dov hides holding his breath, cheeks puffed.

#### Personal touches: Ines

555. Ines walks with a spring in her step, up on her toes.
556. Ines runs like a sprinter: long reach, driving arms.
557. Ines bounces on her heels, impatient to go.
558. Ines stretches her calves like a courier before a run.
559. Ines sneaks low and fast, like a cat.
560. Ines climbs fast, two rungs at a time.
561. Ines tucks into a proper vault.
562. Ines picks locks with her tongue between her teeth.
563. Ines gives a two-finger salute.
564. Ines punches the air with one fist.
565. Ines jogs on the spot to keep warm.
566. Ines crouches on her toes, ready to spring.
567. Ines rolls with the hit.
568. Ines kicks at the floor.
569. Ines eats on the move, bouncing.
570. Ines carries at a jog, refusing to slow down much.
571. Ines limps fast, hopping more than limping.
572. Ines walks in the cold bouncing on her toes to stay warm.
573. Ines trudges kicking at the floor, annoyed at being slow.
574. Ines skids neatly, like a runner pulling up.
575. Ines lands in a quick crouch and is up again at once.
576. Ines searches fast, flicking through things.
577. Ines heaves with her whole body, feet planted against the work.
578. Ines spins round on one foot.
579. Ines, bored, stretches her calves against the wall.
580. Ines climbs two rungs at a time.
581. Ines hides coiled, ready to bolt.

#### Personal touches: Toby

582. Toby skips every few steps.
583. Toby runs with arms flailing like a little kid.
584. Toby swings his arms back and forth while waiting.
585. Toby looks up at the grown-ups.
586. Toby draws with his whole arm, tongue out.
587. Toby tiptoes with exaggerated, cartoonish steps.
588. Toby hides with his hands over his eyes.
589. Toby tucks his hands into his armpits.
590. Toby rocks on his heels, grinning.
591. Toby jumps up and down.
592. Toby's lip wobbles.
593. Toby sleeps curled in a tight ball.
594. Toby scrambles up the ladder.
595. Toby waves with his whole body.
596. Toby's feet swing while he eats.
597. Toby carries things hugged tight to his chest, waddling.
598. Toby limps with his lip trembling.
599. Toby walks in the cold with his hands up his sleeves.
600. Toby trudges dragging his feet, as tired children do.
601. Toby skids and nearly topples over.
602. Toby lands with his arms out wide, like a plane.
603. Toby searches on tiptoe to see inside.
604. Toby heaves with his tongue poking out in effort.
605. Toby turns with a little hop.
606. Toby, bored, draws in the air with a finger.
607. Toby climbs with his knees up high, rung by rung.
608. Toby peeks out between his fingers every few seconds while hiding.

#### Personal touches: Granny

609. Bea walks with small, shuffling steps.
610. Bea keeps a hand on the small of her back.
611. Bea's "run" is a brisk, determined trot.
612. Bea stands with her hands folded at her waist.
613. Bea wags a finger now and then, mid-opinion.
614. Bea stirs the pot with a wide, slow circle.
615. Bea sits very upright, ankles crossed.
616. Bea climbs slowly, with a rest on every rung.
617. Bea sneaks bent nearly double.
618. Bea points with her wooden spoon.
619. Bea pats the air as if patting a cheek.
620. Bea claps her hands.
621. Bea pulls her shawl tighter.
622. Bea coughs into a handkerchief, very politely.
623. Bea sleeps with her hands folded on her chest.
624. Granny carries on her hip, like a basket of washing.
625. Granny limps grumbling, jaw working.
626. Granny walks in the cold clutching her shawl together.
627. Granny trudges with a stoop and a hand on each knee now and then.
628. Granny stops dead and wags a finger.
629. Granny lands with a hand flying to her back.
630. Granny searches sniffing everything, cook's nose first.
631. Granny heaves in short bursts, then rests.
632. Granny turns with a sharp look.
633. Granny, bored, taps her spoon in her palm.
634. Granny climbs one rung, both feet, then the next.
635. Granny hides gripping her spoon like a club.

#### Personal touches: Ravi

636. Ravi walks with a loose, easy swagger.
637. Ravi spins his wrench on a finger.
638. Ravi leans back with his hands behind his head.
639. Ravi works with the wrench in quick quarter-turns.
640. Ravi runs as if pedalling: high, round knees.
641. Ravi sits with one ankle on the other knee.
642. Ravi sneaks with a "who, me?" casualness.
643. Ravi sleeps sprawled, one arm flung out.
644. Ravi gives a thumbs-up.
645. Ravi takes a little bow.
646. Ravi scratches the back of his neck.
647. Ravi shakes out the hurt hand.
648. Ravi squats flat-footed like a mechanic at a wheel.
649. Ravi rubs his arms briskly.
650. Ravi carries things on his back, like a bike over a fence.
651. Ravi limps with a theatrical sigh.
652. Ravi walks in the cold with his jacket collar up and his beanie pulled down.
653. Ravi trudges with his hands jammed in his pockets.
654. Ravi skids like he is braking a bike: one foot down.
655. Ravi lands and does a little "ta-da".
656. Ravi searches with a mechanic's squint.
657. Ravi heaves like he is cracking a stuck bolt: short sharp yanks.
658. Ravi turns with a sliding pivot on his heel.
659. Ravi, bored, spins a nut on his finger.
660. Ravi climbs hand over hand, quick and loose.
661. Ravi hides peeking out with one eye.

#### Personal touches: Yara

662. Yara walks with arms folded tight.
663. Yara twists a strand of hair.
664. Yara mouths words silently, rehearsing a broadcast.
665. Yara tunes the dial with tiny, careful movements.
666. Yara sneaks with her shoulders right up by her ears.
667. Yara hides with her hands over her mouth.
668. Yara runs with her hands up near her chest.
669. Yara talks with her hands, like on air.
670. Yara lets out a shaky laugh.
671. Yara bounces on the spot, fists clenched.
672. Yara sleeps fitfully, turning.
673. Yara freezes, eyes wide.
674. Yara does a little radio-host flourish.
675. Yara carries things as carefully as her radio.
676. Yara limps talking to herself to keep calm.
677. Yara walks in the cold with her sweater sleeves pulled over her hands.
678. Yara trudges with a hand at her temple.
679. Yara stops short with a gasp, hands to her mouth.
680. Yara lands with a nervous glance behind her.
681. Yara searches as if tuning a dial, slow and careful.
682. Yara heaves with her eyes squeezed shut.
683. Yara turns quickly, startled.
684. Yara, bored, rehearses a broadcast, gesturing.
685. Yara climbs without looking down.
686. Yara hides hugging her knees, rocking a little.

#### Personal touches: Pavel

687. Pavel walks with heavy, flat-footed steps.
688. Pavel's big arms swing out from his sides.
689. Pavel stands guard: feet apart, hands clasped in front.
690. Pavel cracks his knuckles.
691. Pavel runs like a wall coming at you.
692. Pavel tries his very best to sneak.
693. Pavel swings the pipe two-handed.
694. Pavel lifts and carries with a straight back.
695. Pavel crouches like a rugby player.
696. Pavel puts a huge hand over his heart.
697. Pavel waves very gently, as if afraid to break something.
698. Pavel sleeps flat on his back, perfectly still.
699. Pavel lifts both arms like a weightlifter.
700. Pavel carries loads easily, barely slowing.
701. Pavel limps heavily; each step thuds.
702. Pavel walks in the cold rubbing his big hands together.
703. Pavel trudges like a guard at the end of a long shift.
704. Pavel takes a few steps to stop, like a big ship.
705. Pavel lands with a floor-shaking thump.
706. Pavel searches gently, as if afraid to break things.
707. Pavel heaves once and the thing just gives.
708. Pavel turns slowly, like a guard on patrol.
709. Pavel, bored, stands at ease like a guard.
710. Pavel climbs and the ladder creaks; he goes slow.
711. Pavel hides trying to make himself small, which does not work.

#### Personal touches: Lamplighter

712. The Lamplighter glides: almost no bob at all.
713. The Lamplighter carries the long pole upright.
714. The Lamplighter stands perfectly still, then tilts their head like a bird.
715. The Lamplighter's fingers drum on the pole.
716. The Lamplighter runs without a sound, cloak streaming.
717. The Lamplighter sneaks very tall, not low.
718. The Lamplighter lights things with a slow reach of the pole.
719. The Lamplighter bows slightly.
720. The Lamplighter folds into their cloak.
721. The Lamplighter never quite lies flat.
722. The Lamplighter's head tilts, puzzled by kindness.
723. The Lamplighter raises the pole like a torch.
724. The Lamplighter climbs hand over hand, unhurried.
725. The Lamplighter carries with the pole tucked under one arm.
726. The Lamplighter leans on the brass pole like a staff to limp.
727. The Lamplighter walks in the cold with the cloak drawn round.
728. The Lamplighter trudges like a very old pilgrim.
729. The Lamplighter stops gracefully, cloak swinging forward.
730. The Lamplighter lands silently, as if it weighed nothing.
731. The Lamplighter searches by feel, eyes half closed.
732. The Lamplighter heaves with the pole as a lever.
733. The Lamplighter turns without seeming to move their feet.
734. The Lamplighter, waiting, watches the window without blinking.
735. The Lamplighter climbs smoothly, hardly bobbing.
736. The Lamplighter hides perfectly still.

#### Costume: Marta

737. Marta wears dark nurse's stockings under her skirt-length coat.
738. Marta's shoes are sensible flat nurse's shoes.
739. Marta's first-aid satchel hangs at her back hip.
740. The satchel has a white cross on it.
741. A satchel strap runs across Marta's chest.
742. An upside-down nurse's watch is pinned to her chest.
743. A pen peeks out of her breast pocket.
744. A hairpin glints in Marta's bun.
745. A stray strand of hair escapes the bun and sways.
746. Tired shadows under Marta's eyes when she has carried too much.
747. A small plaster on Marta's cheekbone.
748. Marta's sleeves are rolled to the forearm.
749. Her scarf is tied in a nurse's neat knot.
750. The scarf tail ends in a little fringe.
751. Marta's coat has a darker hem band.
752. Marta's shoes have a strap across the instep.
753. Marta's coat has two rows of buttons.
754. A pocket with a thermometer peeking out.
755. A safety pin on her lapel.
756. Marta's bun is held with a ribbon.
757. A ladder runs up one of Marta's stockings.
758. A darned patch on Marta's elbow side.
759. A little bandage on one of Marta's fingers.

#### Costume: Dov

760. Dov wears brown-grey work trousers.
761. Dov wears big, heavy work boots.
762. A carpenter's pencil behind Dov's ear.
763. A little badge on the front of Dov's flat cap.
764. Grey stubble on Dov's chin.
765. Thick, bushy eyebrows.
766. Laughter lines at the corners of Dov's eyes.
767. A tape measure clipped to Dov's belt.
768. A hammer hangs from a loop at Dov's hip.
769. Sawdust flecks on Dov's cardigan.
770. A handkerchief in Dov's cardigan pocket.
771. A knee brace strapped over Dov's bad knee.
772. A heavy wristwatch on Dov's wrist.
773. Leather patches on Dov's cardigan shoulders.
774. Dov's boots have thick soles and laces.
775. Dov's nose is a little red from the cold workshop.
776. Dov's cardigan has leather elbow patches.
777. A folding ruler sticks out of Dov's back pocket.
778. Dov's cardigan is buttoned one hole off.
779. Grey stubble along Dov's jaw.
780. Dov's work boots have thick soles.
781. A knee brace on Dov's bad knee.
782. Dov's knuckles are thick from years of work.

#### Costume: Ines

783. Ines wears dark running tights.
784. Ines wears running shoes with pale soles.
785. A courier bag rides on Ines's back.
786. The bag strap crosses Ines's windbreaker.
787. A zip pull glints on the windbreaker.
788. The hood is bunched at the back of her neck.
789. A folded map sticks out of her pocket.
790. A whistle on a cord around her neck.
791. A bright hair tie holds Ines's ponytail.
792. Short baby hairs at Ines's temple.
793. Freckles across Ines's nose.
794. Fingerless gloves on Ines's hands.
795. A sweatband on Ines's wrist.
796. Bicycle clips on Ines's ankles.
797. A patch sewn on one knee of Ines's tights.
798. A plaster on Ines's knuckle from a stubborn lock.
799. Ines's windbreaker has a reflective stripe.
800. A zip runs down the front of her windbreaker.
801. A courier's bag strap crosses her back.
802. A hair tie with a bead at the root of Ines's ponytail.
803. Ines's running shoes have a bright stripe.
804. Ines's trousers are tucked into her socks.
805. Ines wears fingerless gloves.

#### Costume: Toby

806. Toby's trousers are a size too big.
807. Toby's boots are hand-me-downs, too big for him.
808. Toby carries his drawing pad under his arm.
809. Crayon stubs poke out of Toby's pocket.
810. A pin badge of a little sun on Toby's coat.
811. Toby's pockets bulge with treasures.
812. Toby's coat sleeves come down over his hands.
813. The pompom on Toby's hat wobbles on its own spring.
814. A knitted rib pattern on Toby's hat band.
815. Toby's eyes are bigger, as children's are.
816. An orange crayon smudge on Toby's cheek.
817. Rosy cheeks in the cold.
818. A gap-toothed smile.
819. One of Toby's laces is always untied and flaps as he walks.
820. A plaster on Toby's scraped knee.
821. Toby's coat is buttoned wrong, one button off.
822. Toby's coat has a big toggle button.
823. A crayon smudge on Toby's coat.
824. His drawing pad pokes out of a coat pocket.
825. A mitten on a string hangs from Toby's sleeve.
826. Toby's wellies come up to his knees.
827. A plaster on Toby's knee.
828. Toby's hat has earflaps.

#### Costume: Granny

829. Bea wears thick pale stockings.
830. Bea wears comfortable slippers.
831. Bea always has an apron on.
832. Flour dust on Bea's apron.
833. The apron strings are tied in a bow at the back.
834. Bea's wooden spoon is tucked into the apron.
835. A brooch fastens Bea's shawl.
836. Bea's glasses hang on a chain when she is not reading.
837. Bea's hair is set in a tidy grey wave.
838. Fine wrinkles around Bea's mouth and eyes.
839. A touch of rouge on Bea's cheeks, even now.
840. A pearl earring.
841. A handkerchief tucked in Bea's sleeve.
842. Pompoms on Bea's slippers.
843. A knitted texture on Bea's shawl.
844. The shawl has a scalloped edge.
845. Granny's shawl has a knitted border.
846. A cameo brooch fastens the shawl.
847. Granny's apron pocket holds a folded tea towel.
848. Granny wears spectacles on a chain.
849. A hairnet over Granny's grey curls.
850. Granny wears thick wool stockings.
851. Granny's slippers have pompoms.

#### Costume: Ravi

852. Ravi wears oil-stained work jeans.
853. Ravi wears scuffed work boots.
854. A grease smudge on Ravi's cheek.
855. A neat moustache.
856. Five o'clock shadow along Ravi's jaw.
857. A turned-up fold on Ravi's beanie.
858. A wrench in Ravi's back pocket.
859. An oily rag hangs from Ravi's pocket and swings.
860. Oil stains on Ravi's jacket.
861. Ravi wears his jacket collar turned up.
862. A ring of keys on Ravi's belt loop.
863. A bicycle-chain bracelet.
864. Work gloves tucked in Ravi's belt.
865. Patched knees on Ravi's jeans.
866. Grease on Ravi's fingertips.
867. Ravi's jacket has oil stains.
868. A bike-shop patch is sewn on Ravi's shoulder.
869. A wrench hangs from Ravi's belt loop.
870. Ravi's beanie has a turned-up cuff.
871. A bike chain link earring.
872. One of Ravi's trouser legs is rolled up for cycling.
873. A strip of old inner tube is wrapped round Ravi's wrist.

#### Costume: Yara

874. Yara wears dark slim trousers.
875. Yara wears small-heeled ankle boots.
876. A cable runs from Yara's headphones into her pocket.
877. Yara's sweater has a roll neck.
878. A notebook sticks out of her pocket.
879. A little on-air pin on Yara's sweater.
880. A hair clip holds back Yara's fringe.
881. Yara's bob is cut with a sharp, straight fringe.
882. Hoop earrings that swing as Yara moves.
883. An eyeliner flick.
884. Lipstick, the one luxury she kept.
885. Rings on Yara's fingers.
886. A thin bracelet on Yara's wrist.
887. Small heels on Yara's boots.
888. A knitted cable pattern down Yara's sweater.
889. Yara chews her lip when nervous.
890. Yara's sweater has a cable-knit stripe.
891. Headphones hang round Yara's neck.
892. A station badge on Yara's sweater.
893. A hair clip holds Yara's fringe back.
894. Yara's glasses catch the light.
895. Yara wears patterned tights.
896. Yara's nails are bitten short; she worries.

#### Costume: Pavel

897. Pavel wears heavy black guard's trousers.
898. Pavel wears huge steel-toed boots.
899. Pavel's old guard badge, still polished.
900. A whistle on a chain clipped to his coat.
901. Big round buttons on Pavel's greatcoat.
902. Pavel's coat collar is turned up against the wind.
903. A wide leather belt across the coat.
904. The iron pipe is slung across Pavel's back.
905. A magnificent walrus moustache.
906. A small scar through Pavel's eyebrow.
907. A broad, flattened nose.
908. Pavel's bald head catches a second highlight.
909. Thick knitted gloves.
910. Steel toe caps glint on Pavel's boots.
911. A thick neck that fills the collar.
912. An old ID lanyard.
913. Pavel's coat has an old guard's shoulder epaulette.
914. A name tag stitched on Pavel's coat.
915. A thick leather belt around Pavel's coat.
916. A bushy moustache on Pavel.
917. An old scar over Pavel's eyebrow.
918. Pavel's guard boots are laced high.
919. Pavel's hands are huge.

#### Costume: Lamplighter

920. The Lamplighter's trousers vanish into shadow.
921. The Lamplighter wears soft, pointed boots.
922. The Lamplighter carries a long brass pole.
923. A small flame burns at the tip of the pole.
924. The flame casts a soft glow around itself.
925. Under the hood, the face is in deep shadow.
926. Two calm points of light for eyes.
927. The hood comes to a soft point.
928. A brass clasp at the cloak's throat.
929. Wax drips down the front of the cloak.
930. The cloak's hem is ragged.
931. A tin wick-box hangs at the Lamplighter's belt.
932. A small spare lantern swings at the hip.
933. Soot marks on the cloak.
934. The Lamplighter's boots curl up at the toes.
935. A few embers drift off the Lamplighter now and then.
936. The Lamplighter's cloak has a frayed hem.
937. A brass clasp fastens the cloak.
938. Spare wicks hang from the Lamplighter's belt.
939. Wax drips have dried on the cloak front.
940. A faint warm glow inside the Lamplighter's hood.
941. The Lamplighter's boots are worn soft from walking.
942. Soot on the Lamplighter's fingertips.

#### Toby in The Long Walk

943. Toby now has jointed knees and elbows in The Long Walk, using the same leg and arm solver as the main game.
944. His run has high knees on the forward leg.
945. His heels kick up behind him as he runs.
946. His arms pump with bent elbows when he runs.
947. He leans into the run, more as he speeds up.
948. His body bobs on each stride, with a flight phase at the top.
949. His head stays steadier than his body as he runs.
950. Starting and stopping: a brief lean back with his arms out as he changes speed.
951. Take-off: his knees tuck up under him.
952. Rising: his arms fling up and his body stretches.
953. Falling: his legs reach down for the ground and his arms go up.
954. A long fall: his arms windmill.
955. Landing: he squashes down into his knees, harder from higher falls.
956. Landing: his arms swing down with the impact.
957. Landing from a big fall: he puts a hand to the ground.
958. Pushing a crate: he leans right into it with both arms straight out.
959. Pushing: short, effortful steps.
960. Pushing: his head goes down with the effort.
961. Pulling a lever: he reaches up, grabs and hauls down with his whole body.
962. Pulling a lever: he bends his knees as he hauls.
963. Standing still: his body rises and falls with his breathing.
964. Standing still: his weight shifts from foot to foot.
965. Standing still for a while: he looks up at the paper stars.
966. Standing still for longer: he hugs himself against the cold.
967. Standing still for a long time: he sits down on the spot and waits.
968. He glances down at his boots every so often.
969. Riding a moving platform: he holds his arms out for balance.
970. On a crumbling board: his arms wobble and his knees bend.
971. In the searchlight: he throws an arm up over his eyes.
972. Being chased by a dog: he runs with arms flailing and his chin up.
973. In a low tunnel: he ducks his head.
974. In the rain: he ducks his head.
975. In the snow: he lifts his feet higher.
976. Falling into a pit: he tumbles head over heels.
977. Caught on glass and wire: he crumples to his knees.
978. In deep water: he sinks, arms reaching up, with bubbles.
979. Caught in the searchlight: he fades away.
980. Caught by a dog: he is knocked flat.
981. Hit by falling rubble: he is knocked down.
982. Coming back at a checkpoint: he fades back in.
983. Reaching the exit: he steps toward the light and raises his hand to shield his eyes.
984. His hat has its own spring: it lags on starts and stops, and bounces on landings.
985. The pompom on his hat bobs on a second, looser spring.
986. His hat squashes down when he lands.
987. His hat brim shows a knitted rib.
988. His hat is the brightest thing on screen, with a soft rim of light.
989. His coat flares out behind him as he runs.
990. His coat hem swings back and forth when he stops.
991. He has a tiny scarf end that streams when he runs.
992. His boots are a bit too big, and flap on each step.
993. A small puff of dust when he lands.
994. In the cold chapters, a faint cloud of breath.
995. His eyes catch the light: two small pale dots under the hat.
996. He blinks.
997. His silhouette has a faint lighter rim, so he never gets lost against the black ground.
998. He has a soft ground shadow that shrinks as he jumps.
999. All of his animations blend smoothly into each other.
1000. Reduce Intensity calms his idle bob, windmilling, wobbling and flailing.


## 1.3.0

This round adds a second game, The Long Walk, plus 75 new things to find, 75 new kinds of enemy with smarter behaviour, new hazards on the sites, glowing outlines, a full Player's Guide (PDF), and a way to carry your whole game to another browser. New code lives in `src/15_ex8_v13.js` (items, crafting, enemies, AI, save files, guide link), `src/15_ex9_walk.js` (The Long Walk) and `src/15_ex9b_hazards.js` (hazards and outlines).

### New mode: The Long Walk

- A side-scrolling puzzle platformer, told in silhouette. The night the shells came over the orchard, Toby and Ines were caught on the wrong side of the river. Toby walks home alone, following the paper stars the neighbours hung on threads.
- **50 levels in five chapters:** The Orchard, The Rail Yard, The Drowned Streets, The Works and The Long Bridge.
- Each chapter brings new pieces:
  - gaps, ledges, broken glass, crates to push and climb, and levers that open gates
  - pressure plates, moving platforms and rotten boards that drop away
  - deep water, lifts and falling rubble
  - searchlights you hide from under roofs, and low tunnels
  - dogs that outrun you but cannot climb
- Checkpoints come in the form of star posts, and a fall sends you back to the last one. Each level has paper stars to collect.
- **An animated interlude follows every level.** Each one is a small scene with one line of the story, and it waits for you to press. There are chapter title cards between chapters, a prologue, and an ending that leads into the credits.
- On the Long Walk menu you can continue, replay any level you have reached, or watch the prologue and the ending again. Progress, falls and tips seen are saved.
- Start it from **The Long Walk** on the title screen, or from Modes.

### Foraging and crafting

- **75 new items:**
  - 20 foods
  - 10 medical supplies
  - 25 materials
  - 10 tools
  - 10 comforts
- Every site has its own loot table for them, and traders stock some.
- Two of them can be thrown: a **firecracker** is loud enough to pull a whole floor away from you, and a **pebble** gives a small, close distraction.
- **32 new recipes** at the stove and the workbench.
- Some recipes need a **tool** that is kept, not used up (scissors, a crowbar, knitting needles). Some can only be made **once a day**.
- **The workbench was improved:**
  - Recipes you can make are listed first, and each shows how many you can make right now.
  - Anything you are missing is named exactly.
  - Dov and Ravi sometimes get an extra piece out of a job.
- New crafts include:
  - a **satchel** that adds pack space
  - **sandbags** for the barricade
  - splints, sterile gauze, knitted jumpers and a carved chess set

### Enemies and AI

- **75 enemy variants** built on the five hostile kinds:
  - 27 Grey Coats
  - 22 Magpies
  - 13 dogs
  - 7 raiders
  - 6 List-keepers
- Each variant has a name, a look (cap, armband, fur collar, lamp, bandana, sack and more) and traits such as sharp-eyed, hard of hearing, fast, dozes off, stands guard, follows your trail, calls for help, ignores thrown things and steals from your pack.
- Harder variants show up at more dangerous sites and later in the winter. Their name appears over their head the first time they spot you.
- **Smarter AI:**
  - Enemies stay on edge for a while after losing you, so they see further and move faster.
  - Patrols glance back on their rounds.
  - A guard who starts a chase calls nearby allies.
  - Searches sweep a room instead of standing on the spot.
  - Trackers head for where you are now, not where they last saw you.
  - Enemies who were fooled by a thrown object learn to ignore the next one.

### Hazards on the sites

- New hazards that can hurt you:
  - **Broken glass** cuts you unless you creep (crouch) across or hop over it, and it crunches either way.
  - **Rusty nails** can only be hopped.
  - **Live wires** spark on and off, so cross while they are dark.
  - **Rotten floors** creak, then give way and drop you to the floor below with a bump. Once broken, a rotten floor stays as a hole you can drop through.
- Hazards are placed by the site's danger level and never sit on top of ladders, doors or containers.

### Glowing outlines

- Enemies, doors and shutters, holes and every hazard have a soft white outline that breathes slowly, so they read in the dark. The Long Walk outlines its obstacles, crates, gates, platforms, falling boards, rubble, water and dogs.
- You can turn it off under **Settings > Glowing outlines**.

### Save all / Import all

- A new **Save data** section in Settings:
  - **Save all to a file** downloads one `.json` file with everything: settings, the story save, Long Walk progress, scores, unlocks and the field guide. It also copies the file to the clipboard.
  - **Import all from a file** loads that file in any other browser or computer.
  - **Import from the clipboard** pastes it instead.
- Imported files are checked before anything is replaced.

### Player's Guide

- A new illustrated **Player's Guide (PDF)**, `Ashen-Windows-Players-Guide.pdf`, ships next to `index.html`. It covers:
  - controls, modes and settings
  - what to do on your first nights
  - every recipe and item, the enemies and their traits, and the hazards
  - each site's layout, a story walkthrough, and all 50 Long Walk levels
  - the release notes
- You can open it from a link on the JORJ splash screen, from the title menu and from the pause menu (in both the main game and The Long Walk).

### Fixes

- Smoke columns no longer crash when they are drawn at a negative time (seen on the Long Walk's chapter 4 skyline).

## 1.2.0

This round adds the backstory, cutscenes that wait for you, new sound, taller buildings with new ways through them, and a lot more weather and atmosphere. Most of the new code is in `src/15_ex7_v12.js`. The cutscene player is in `src/14_menus.js`, and the story text and site floor counts are in `src/01_config.js`.

### Story: who you are, and who you are hiding from

- A new illustrated prologue opens Story Mode. Greywater is a river city with an army dug in on the far bank. You are neighbours from the sixth floor of the Ashen Windows building: a nurse, a carpenter, a courier and a boy who draws.
- The people you hide from now have names:
  - **The Grey Coats** are the curfew wardens. After six, anyone outside is a looter in their book. They keep lists, and people on the lists are taken to the work brigades.
  - **The Magpies** are gangs who strip empty buildings, and full ones if the door is weak.
  - **The long guns** are snipers across the river. They watch the bridges, open squares and lit windows.
  - **List-keepers** run Census Night, and **strays** are the dogs.
- A new **The Story So Far** entry on the title screen replays the prologue, then opens the new **Field Guide**: a card for every threat, each with a moving portrait, a description and a tip for avoiding it.
- The first time you meet each kind of hostile on a sortie, a one-line note from the Field Guide explains it.
- Chapter cutscenes gained lines about the curfew and the lists. Patrols and gangs have new lines of their own ("Curfew! Stand still!"). The credits note that every faction is invented.

### Cutscenes and animated sequences

- **Cutscenes no longer advance on their own.** Each line types out, then waits until you press to turn the page. Pressing early finishes the line first. Left goes back a panel, and Esc / B still skips the scene. A bouncing marker shows when the next page is ready.
- The credits wait for you at the end ("The end. Thank you for keeping the candle lit.") instead of closing by themselves.
- Ten new illustrated, animated panels:
  - The besieged skyline, with searchlights, shell flashes and smoke.
  - The river and the broken bridge, with sniper glints on the far bank.
  - Grey Coats walking their round past a curfew poster under a street lamp.
  - A curfew register nailed to a wall, flickering in candlelight.
  - Magpies rummaging in an alley under their painted bird.
  - The Ashen Windows building in falling snow, with one candle-lit window.
  - A close-up of a candle in cupped hands.
  - A snowstorm, and a thaw with dripping icicles.
  - The landing, with snow outside the window and a candle on the shelf.
- Panel animation:
  - Pages slide and tilt in and out like turned paper.
  - Each panel drifts in a slow camera pan.
  - Speakers walk into frame before they talk.
  - Chapter titles ink in from the centre, and dust drifts across the screen.
- Scene transitions: the iris has a soft edge, the paper tear casts a shadow, and the blinds catch light between the slats.
- Endings: birds cross the dawn sky after a good ending, and snow falls on the hard ones. The credits have drifting smoke and birds.

### Sound

- Every location now has its own acoustic space:
  - The shelter and shops sound like small rooms.
  - The school and hospital sound like halls.
  - The church has a long reverberant tail.
  - The flooded metro has a tunnel echo.
  - Open ground is dry.
- New versions of many sounds:
  - Footsteps differ by surface: heel and toe on wood, with the odd creak; grit on stone; sloshing in water; crunching in snow.
  - Doors have a latch, a creaking hinge and a thump.
  - Also new: knocks, creaks, thuds, hits, match strikes, drips, splashes, dog barks, page turns, typewriter keys and menu clicks.
  - Bells have more partials and a longer ring.
  - Glass shards, rumbles and pickups gained extra layers.
- New ambience: distant shelling, wind howls, faraway dogs and crows. The metro gets dripping water and the church gets creaking timbers.
- Thunder follows lightning in heavy rain. Thick fog muffles the whole mix.
- New effects include a soft landing thump, whispers and breathing (for the shadows), thunder and distant shelling.

### Gameplay and taller buildings

- Every scavenging site now has 3 or 4 floors:
  - 3 floors: Corner Pharmacy, Market Square, Flooded Metro and Broken Bridge.
  - 4 floors: The School, Collapsed Block, Hospital Wing and Church.
- **Broken floors.** Most upper floors have a hole you can drop through to the floor below. It is quick, but it is loud, and you cannot climb back up the same way.
- **Upper floors are less picked over.** Containers two or more floors above the street often hold an extra item.
- **Patrols and Magpies change floors** on their rounds, using the stairs and ladders like you do. Watch the stairwells.
- **Fog hides you.** Inside a fog bank you are up to a third harder to see.
- **Rain and snow cover small sounds.** While a shower is falling, quiet noises carry a little less far.
- **Passing showers.** Even on a clear night, a rain or snow shower can roll in for a while, with a note when it starts.
- **Floor plan on the HUD:** which floor you are on, how many floors the building has, how many unsearched spots you have seen on each, and which floors have a hole.
- Painted floor numbers (G, 1, 2, 3) mark both ends of every staircase and ladder.

### Fog and smoke

- Fog banks roll in at times on every map. They drift across each floor in layers, swirl, and leave again. On foggy days they stay.
- Smouldering rubble in the sites glows and sends up smoke. Indoors the smoke spreads out under the ceiling, and on open ground it rises into the sky.
- Smoke columns rise from distant fires behind the skyline.

### Rain, snow and lightning over the maps

- Rain falls in three layers of depth over every map. It is heavier on open ground and lighter indoors, it slants as the view moves, and on open ground it splashes on the floors.
- Snow falls in three layers of drifting flakes.
- Lightning flashes in heavy rain at night, followed by thunder a moment later.

### Unsettling shadows (scenery only)

These are only decoration. They are never enemies, they cannot see or hurt you, and they do not affect the game. They appear now and then, away from real people:

- A too-tall figure standing still in a pale haze. It tilts its head, and it is gone if you walk toward it.
- A pair of pale eyes in the dark that blink twice and vanish.
- A long, stretched shadow that slides across a wall.
- Something many-legged crawling along the ceiling before it scuttles away.
- Long fingers reaching in from the edge of the screen at night.
- A faint whisper or breath sometimes goes with them.

They can be switched off in **Settings > Unsettling shadows**. With Reduce motion on, only the slow ones appear, and less often.

### Other

- Version 1.2.0 everywhere: the title tag, pause screen and credits.
- All new motion respects **Reduce motion**. The heavier effects (smoke, extra fog layers, the far rain and snow layer) switch off on **Low** quality.

## 1.1.0

A second polish pass: 100 new visual improvements (numbered 101 to 200, so they never repeat the 1.0 list), another round of UI upgrades and a version bump. All of it lives in `src/15_ex6_polish11.js`, with matching `#number` comments, except the UI work, which is in `src/09_ui.js`, `src/11_play.js`, `src/14_menus.js` and `src/15_game.js`. Nothing from 1.0 was removed.

### 100 more visual improvements

**Sky and skyline**

101. A band of lighter sky low on the night horizon.
102. The occasional shooting star.
103. A pale sun glowing through the overcast by day.
104. Barrage balloons tethered far off, bobbing on their cables.
105. Craters on the moon.
106. Thin clouds drifting across the moon.
107. An aircraft's blinking light crossing the night sky.
108. Zig-zag fire escapes on the skyline.
109. Jagged shell holes in the distant walls.
110. Washing lines strung between distant rooftops.

**The shelter**

111. Cornice moulding along every ceiling.
112. A stencilled frieze around the sitting room.
113. Light switches and wall sockets.
114. A pendulum swinging under the wall clock.
115. Toby's crayon doodles taped low on the stairwell wall, while Toby is still with the group.
116. A rat-hole in the cellar wall, with eyes that shine at night.
117. A puddle under the dripping pipe, rippling when a drop lands.
118. A washing line on the roof: shirts and socks on the breeze.
119. Pigeons on the parapet that peck and hop.
120. A weathervane on the chimney that turns.
121. Hairline cracks in the outer brickwork.
122. Window boxes with stubborn plants on the balconies.
123. A mailbox by the front door.
124. A doormat on the step.
125. A drain grate in the road.
126. Scraps of paper skittering down the street.
127. A bird's nest in the gutter.
128. A carpet runner and bright edges on the stairs.
129. Worn rungs and a rope tie on the ladders.
130. A knocker, letter plate and spyhole on the front door.
131. Door frames around every door on scavenging sites.

**Scavenging sites**

132. Corner Pharmacy: rows of medicine bottles.
133. Corner Pharmacy: a faded opening-hours poster.
134. Market Square: a hanging scale.
135. Market Square: stacked crates of cabbages.
136. Flooded Metro: signal lamps and sagging cable runs.
137. The School: coat pegs with small coats.
138. The School: an alphabet frieze.
139. Collapsed Block: a bathtub hanging over the broken edge.
140. Collapsed Block: crooked family photos.
141. Hospital Wing: an X-ray light box.
142. Hospital Wing: a parked wheelchair.
143. Church: rows of pews.
144. Church: hanging banners that stir in the draught.
145. Broken Bridge: sandbag walls.
146. Broken Bridge: a bent railing.
147. Open ground: bare winter trees.
148. Spray-painted scrawls on some site walls.
149. Cobwebs in the upper corners of interior sites.
150. Rats that dart across the floor now and then.
151. Moths circling the working bulbs.
152. Drips falling from the metro ceiling.
153. Torn wiring in the broken block that throws the odd spark.
154. Rain puddles on open ground, ringed by falling drops.
155. Pigeons roosting in the church rafters, and now and then flying off.

**Objects**

156. Searched containers leave a few scraps on the floor beside them.
157. Stencil marks on crates.
158. Name tags on lockers.
159. Price tags on shop shelves.
160. A wardrobe door that breathes open a crack while someone hides inside.
161. Hanging coats that sway over someone hiding behind them.
162. A teddy on the first bed, and knobbed bedposts.
163. The radio dial lights up while it plays, and the aerial tip bobs.
164. A little dancer turns on the music box while it plays.
165. A pot rim and dark soil on the window plant.
166. A burner ring that pulses on the stove, and a kettle.
167. Labels on the tins in the pantry.
168. A vice on the workbench and wood shavings on the floor.
169. A pilot light on the running heater.
170. A shine on the fridge door and handle.
171. Numbers around the safe dial.
172. Brass knobs on the chest of drawers.
173. Gilt corners on the painting's frame.
174. A candle dish and a spent match.
175. Light moving on the water in the rain barrel.
176. Raindrops ringing in the rain catcher.
177. Straw at the coop door.
178. The fire barrel's sides glow with heat.
179. The way-out arrow on the exit pulses toward the street.
180. Rays turning around the lit signal.
181. A split in each squeaky board, so you can spot them.
182. Crumbs of mortar around loose bricks.

**Characters and animation**

183. Patrols carry a glowing hand lamp at night.
184. Dogs sit and wag their tails when idle.
185. Running NPCs kick up dust.
186. Speed lines stream off a sprinting survivor.
187. A small heart in the survivor's colour lifts off when someone is comforted.
188. The ground shadow shrinks and fades while a survivor is in the air.

**Light, weather and screen**

189. Dust motes turning in the daylight from the shelter windows.
190. Moonlight falling through the side windows onto the shelter floor on clear nights.
191. Cold moonlight slanting in through site windows.
192. Low ground fog creeping over open ground at night.
193. A soft halo around a hostile's alert glyph.
194. Frost creeping in at the screen corners when it freezes, thicker the colder it gets.
195. A heartbeat pulse at the screen edges during a chase.
196. Big soft snowflakes drifting past close to the lens.

**The building from outside**

197. A rooftop washing line, and pigeons hopping on the parapet.
198. A street lamp outside the building that flickers and pools light.
199. Paper stars taped in some windows.
200. Potted plants on some window sills.

### UI upgrade, round two

- On/off settings are now pill switches with a knob that slides and an on/off label.
- Sliders have a rounded track, a round knob with a shadow, and a percentage readout.
- Choice settings use arrow markers that nudge gently while selected.
- Section headers in menus have a diamond marker and a fading rule.
- Long menus have a rounded scrollbar and fade at the top and bottom edges while there is more to scroll.
- Menu descriptions slide in when the selection changes and carry a small book icon.
- Overlays (pause, journal and so on) darken the edges of the screen for focus.
- Mode select shows a badge for the kind of mode, one pip per supported player, and a stamped BEST score.
- HUD: the thermometer's column follows the temperature, a weather icon sits beside it, and the calendar casts a shadow.
- HUD: the survivor you control gets a colour tab on their roster card, and critical need bars tremble.
- Interaction prompts bob gently. The hold-to-work ring has a bright leading dot and a percentage.
- The subtitle note shows a blinking cursor while text is still typing.
- New weather icons: rain, snow and fog.
- The title screen has a swinging "New in 1.1" tag.
- The version is now 1.1.0 everywhere: title tag, pause screen and credits.

As before, all new motion respects **Reduce motion**, and the heavier effects (rats, light shafts, fog, frost, snowflakes) switch off on **Low** quality.

## 1.0.0 (release)

The first public release. This version adds 100 visual improvements, a UI pass, bug fixes and everything needed to host the game on GitHub Pages.

Items 1 to 69 and 98 to 100 live in `src/15_ex5_polish.js`, and each has a matching `#number` comment there. Items 70 to 97 are changes to the existing sprite, particle and world code (`src/04_fx.js`, `src/05_rig.js`, `src/06_world.js`).

### Visual improvements

**Sky and skyline**

1. Twinkling night stars with slow parallax.
2. A soft halo around the moon.
3. A distant searchlight that sweeps the night clouds.
4. Shelling glow that flares on the horizon now and then.
5. Cloud banks drift across the day sky.
6. Skyline rooftops get water towers, antennas and chimneys.
7. A few lived-in windows on the skyline flicker on and off at night.
8. Birds cross the day sky in loose V formations.
9. A layer of low haze where the city meets the sky.

**The shelter (home cutaway)**

10. Brick courses and three supporting arches in the cellar.
11. Cobwebs in the cellar corners.
12. Framed photographs on the bedroom wall.
13. A wall calendar that crosses off every day survived.
14. A bookshelf in the sitting room, with one book leaning over.
15. A kitchen notice board with pinned notes.
16. A cellar shelf of jars and a stack of crates.
17. Water stains under the old pipes.
18. Soft dust shadows along the floor of every room.
19. Brick texture on the outside walls.
20. A rooftop water tank on cross-braced legs.
21. A bent TV aerial that sways, with its cable running down the wall.
22. Brick lines and a cowl on the chimney.
23. A drainpipe with brackets down the right-hand wall.
24. The house number painted by the front door.
25. A cobbled street and a curb outside.
26. A puddle by the door that catches the light.
27. The dead street lamp gets a glass head.
28. Glass panes in the side windows, with moonlight or daylight streaks.
29. Rain runs down the window glass when it rains.
30. Snow settles on the roof, chimney, water tank, sills and balconies in snowy weather.
31. Icicles hang from the roof and balcony when it freezes.
32. Fringed rugs on the bedroom and sitting-room floors.
33. Wood grain and knots in the floorboards.
34. Lamp shades over the ceiling bulbs that sway slightly.

**Scavenging sites**

35. Ceiling pipes and conduit brackets in every interior site.
36. Peeling wallpaper and damp stains (not in the metro tunnels).
37. Corner Pharmacy: hanging cross signs and dispensing counters.
38. Market Square: striped stall awnings that flap, produce on the counters, and a string of dead bulbs.
39. Flooded Metro: tiled walls, a GREYWATER station plaque and the platform-edge stripe.
40. The School: chalkboards with doodles and rows of child-sized chairs.
41. Collapsed Block: exposed rebar, a swinging cable and someone's left-behind picture.
42. Hospital Wing: ward beds, drip stands and curtain rails.
43. Church: rose windows and three-branch candle stands.
44. Broken Bridge: suspension cables and lamp posts on the span.
45. Open ground: burnt-out car wrecks.
46. A moving river under the bridge and black water under the metro.
47. Floors are scattered with debris, papers and glints of broken glass.
48. Snow drifts along open ground when it snows.
49. Footprints in the snow that slowly fill back in.

**Objects**

50. An EXIT sign over the street door, with light spilling under it.
51. Container handles catch the light.
52. Searched cabinets and lockers are left ajar.
53. Beds get a pillow and a quilted blanket.
54. A pot on the stove that steams while there is food in the house.
55. A speaker grille on the radio.
56. A pegboard of tools above the workbench.
57. Heat shimmer rises off a running heater.
58. Labelled pantry shelves.
59. Magnets and a note on the fridge.
60. Panelling and feet on wardrobes.
61. Eyes peek out of an occupied hiding place.
62. Wax drips down the candle.

**Light and atmosphere**

63. Bloom around every working bulb.
64. Dusty light shafts fall beneath lamps at night and on sorties.
65. A visible flashlight beam with dust floating in it.
66. Warm halos around the candle, the fire barrel and carried lanterns.
67. Lightning flickers, with distant thunder, during rainy nights.
68. Faint old-film scratches and specks.
69. Letterbox bars slide in during cutscenes.
70. Raindrops splash where they land.

**Animation**

71. Squash and stretch: survivors stretch on the way up and squash when they land.
72. A dust ring spreads out on landing.
73. A quick pinch when a survivor turns around.
74. A shudder when a survivor is hurt.
75. Idle breathing, slower and deeper while asleep.
76. Small dust puffs from walking footsteps on sorties.
77. Ripples spread around feet when wading through flood water.

**Survivor sprites**

78. Shoe soles.
79. Felt soles from the wardrobe now show on the shoes.
80. Knitted mittens from the wardrobe now show on the hands, in the survivor's colour.
81. A backpack, with a strap, on every sortie.
82. A thin ink outline around the torso and head.
83. Torso shading: a shadowed back and a lit front edge.
84. A nose.
85. A red nose when the survivor is cold.
86. An ear.
87. A sheen on the hair, and a shine on bald heads.
88. Catchlights in the eyes.
89. The flashlight lens glows when it is on.

**Other characters**

90. NPCs breathe while standing still.
91. Patrols carry a rifle on the back and wear a helmet with a chin strap and a shine.
92. Scavengers and raiders carry a stuffed sack.
93. Strangers carry a bundle and wear a headscarf.
94. Belts, buckles and buttons on patrols and census takers, plus an armband for the census.
95. Boots and a body outline on every human NPC.
96. Dogs wear a collar, pant with their tongue out when chasing, and prick up their ears when alert.
97. Cats have bright eyes and a pale tail tip.

**The building from outside (title, credits, endings)**

98. Brick courses on the facade.
99. A chimney with a slow curl of smoke, a TV aerial and a water tank on the roof.
100. Lit windows get curtains, a sill, and light that spills down the wall at night.

### UI upgrade

- Paper panels have a fibre texture and a soft light falloff. Large paper sheets are held up with strips of masking tape.
- Menus: the highlight glides between rows, sits on a drop shadow and has an accent bar. Common items get icons.
- 12 new icons: gear, book, door, people, hanger, grid, play, expand, sun, moon, map and back.
- Need bars are rounded and have a highlight.
- Key prompts look like real keycaps with a bevel.
- Speech bubbles pop in and cast a shadow.
- The roster shows a live, animated portrait of each survivor in a coloured locket.
- The pocket watch shows a sun by day and a moon by night.
- The objective note is pinned up.
- Keepsake toasts get a shine sweep and an icon pop.
- Title screen: a dark pool behind the logo, gently swaying letters with a drop shadow, a v1.0.0 tag and an ember icon by the Embers count.
- Pause menu: a "to resume" hint above it, and the mode, day and version below it.
- The "muted" label moved to the top right, so it no longer covers the version tag.
- Web page: a favicon, description and social tags, a dark vignette and frame around the game canvas, and a message for browsers with JavaScript turned off.
- The credits now name the release.

All new motion respects **Reduce motion**. Heavier effects switch off on **Low** quality and when the adaptive quality steps down.

### Bug fixes

- Object animations (radio waves, the music box, the painting's wink, the dancing sandwich, filter drips, the mouse's sign, the door shaking under blows) were tied to frame count. They ran twice as fast on 120 Hz screens and half as fast at 30 FPS. They now use real frame time.
- Effects spawned while drawing (chimney smoke, embers, cellar drips, sleep "z"s, fire smoke) are now scaled by frame time, so they have the same density on every display.
- The keyboard now works after one click when the game is embedded in a page or iframe, such as GitHub Pages previews. The canvas also takes focus at boot.
- `build.sh` printed an error on the first build because the `build/` folder was missing.
- Tests used hard-coded machine paths. They now find `index.html` relative to themselves and take `PLAYWRIGHT` and `CHROME` from the environment.
- Removed a stray path command in the exit-door drawing.

### Release

- `README.md` covers how to play, controls, modes, building, testing and publishing on GitHub Pages.
- Added `.nojekyll` and `.gitignore` for a clean GitHub Pages deployment.
- `index.html` at the repository root is the whole game: one self-contained file with relative paths and no network requests.
