(()=>{"use strict";

const c=document.getElementById('c'),wordInput=document.getElementById('spellingWords'),W=960,H=540,G=420;let x=c.getContext('2d');const dumpsterIcon=new Image();dumpsterIcon.src='img/dumpster.png';
let diff=1,_p=0,S='intro',dist=0,v=0,loot=0,best=0,t=0,introT=0,shake=0,objs=[],parts=[],nextX=0,P,hi=0,lvl=0,cp=0,banner=0,flash=0,M,pops=[],rings=[],trail=[],sq=0,shoot=null,dflash=0,hl=0,bump=0,who=0,base=0,gSel=0,gPrev='title',conf=[],fw=[],spk=[],celeb=0,celN=0;
const DF=[{n:'EASY',spd:.88,haz:.6,sp:1.2,col:'#7be07b',d:'Relaxed pace, fewer hazards'},{n:'NORMAL',spd:1,haz:1,sp:1,col:'#ffd23f',d:'The intended heist'},{n:'HARD',spd:1.12,haz:1.25,sp:.92,col:'#ff6b6b',d:'Faster and packed with hazards'}],LEN=7000,NM=60,SPD=l=>(340+Math.min(l,29)*11+Math.max(0,l-29)*2.5)*DF[diff].spd,hs=(h,s,l)=>`hsl(${h%360},${s}%,${l}%)`;
// [name, sky hue, horizon hue, weather(0 none,1 rain,2 snow,3 fog,4 embers,5 fireflies,6 storm), daylight 0-1]
const LV=[['Sunset Pier',260,18,0,0],['Fisherman’s Wharf',215,35,0,.15],['Neon Marina',290,320,0,0],['Cannery Row',30,10,3,.1],['Lighthouse Point',225,200,0,0],['Rainy Docks',210,200,1,0],['Shipyard Rust',15,25,0,.1],['Coral Cove',175,15,0,.4],['Moonlit Lagoon',225,195,5,0],['Carnival Boardwalk',320,45,0,0],['Midday Harbor',205,190,0,1],['Seagull Cliffs',200,30,0,.9],['Foggy Bay',200,210,3,.2],['Smuggler’s Cove',140,50,3,0],['Thunder Bay',250,260,6,0],['Golden Hour',35,20,0,.6],['Winter Wharf',210,200,2,.3],['Frozen Harbor',190,185,2,.5],['Aurora Bay',150,280,2,0],['Crimson Tide',350,10,4,0],['Volcano Dock',10,30,4,.1],['Jade Canal',150,120,5,.1],['Sakura Port',330,350,0,.5],['Desert Pier',35,45,0,.8],['Twilight Bridge',270,320,0,.2],['Ghost Ship Graveyard',170,160,3,0],['Storm Surge',220,230,6,0],['Emerald Docks',135,110,5,.2],['Midnight Heist',265,280,0,0],['Bandit’s Dawn',330,35,0,.7]];
LV.push(['Maple Landing',25,15,7,.6,2],['Pine Ridge Dock',150,140,0,.5,2],['Elk River Falls',195,170,3,.6,1],['Granite Gorge',20,30,0,.5,1],['Copper Canyon',20,12,9,.7,1],['Sandstone Quay',40,35,9,.85,4],['Pyramid Piers',45,25,0,.8,4],['Oasis Night',230,160,5,0,4],['Pagoda Pier',330,20,7,.4,3],['Lantern Festival',350,30,5,0,3],['Koi Canal',190,340,0,.5,3],['Bamboo Wharf',125,100,1,.3,2],['Castle Quay',250,280,0,.25,6],['Dragon’s Keep',0,20,4,0,6],['Knight’s Harbor',215,220,0,.7,6],['Foundry Row',15,20,4,.1,5],['Smokestack Bay',210,30,3,.2,5],['Gearworks Dock',30,45,0,.3,5],['Reactor Pier',110,130,5,0,5],['Kelp Forest',185,160,8,.3,2],['Sunken Galleon',200,215,8,.15,0],['Abyss Terrace',230,245,8,0,0],['Pearl Lagoon',170,320,8,.5,1],['Iceberg Alley',200,195,2,.5,1],['Polar Night',235,260,2,0,1],['Borealis Bay',160,290,2,0,1],['Storm Front',255,240,6,0,0],['Typhoon Tide',200,210,6,.1,0],['Meteor Marina',270,300,10,0,0],['Elk River Sunrise',340,40,7,.7,0]);
const wx=Array.from({length:90},()=>({x:Math.random()*W,y:Math.random()*H,s:Math.random()}));
// hazards per map: c=patrolling cop (jump), b=rolling barrel (jump), h=hanging hazard (slide), s=jet that pulses on/off (time it or jump)
const HZ=['b','bc','ch','sb','ch','bh','hb','sc','hs','hc','cb','bh','cs','cbh','sc','bhc','hb','hc','hs','sc','sb','hc','bc','sb','chs','chs','sbc','hsb','cbhs','cbhs'];
HZ.push('bch','chs','sbh','bcs','chs','sbc','hbc','chs','cbh','hsb','cbs','bhs','cbh','chs','cbhs','sbh','chs','cbhs','shc','bhs','cbhs','hsb','cbs','chs','cbhs','shb','cbhs','cbhs','cbhs','cbhs');
for(let i=0;i<NM;i++)HZ[i]+='e'.repeat(i<10?1:i<30?2:i<45?2:3);
const LF=[["Pine Trailhead",205,140,0,0.85,0],["Acorn Alley",210,60,0,0.85,4],["Elk River Run",205,185,0,0.8,6],["Town Dump",205,40,0,0.7,8],["Whispering Pines",200,150,3,0.6,0],["Old Oak Crossing",200,50,0,0.7,4],["Willow Bend",150,110,0,0.7,6],["Tire Mountain",30,25,0,0.6,8],["Redwood Cathedral",140,60,0,0.55,1],["Maple Mile",25,20,11,0.65,5],["Cattail Creek",190,80,0,0.75,6],["Fridge Fortress",210,200,3,0.5,8],["Fern Hollow",150,110,0,0.7,1],["Autumn Amble",30,15,11,0.55,5],["Otter Crossing",195,170,0,0.85,6],["Landfill Lane",20,35,3,0.45,8],["Birch Bend",195,80,0,0.8,2],["Golden Grove",40,30,11,0.8,5],["Mudbank Marathon",30,25,3,0.4,6],["Garbage Gully",100,60,0,0.55,8],["Silver Birch Run",215,100,0,0.65,2],["Crimson Canopy",10,350,11,0.4,5],["Reedy Rapids",210,180,1,0.35,6],["Junkyard Jungle",120,90,0,0.6,8],["Misty Spruce Pass",210,170,3,0.4,0],["Hazelnut Hideout",100,70,0,0.6,4],["Stepping Stones",200,150,0,0.9,6],["Compost Canyon",90,50,0,0.5,8],["Snowcap Firs",215,200,2,0.6,9],["Fallen Leaf Lane",20,40,11,0.5,5],["Beaver Dam Dash",25,20,0,0.6,6],["Dumpster Dive",220,30,0,0.35,8],["Frostbitten Trail",200,190,2,0.35,9],["Firefly Woods",240,130,5,0.06,4],["Heron Landing",190,60,3,0.5,6],["Scrap Heap Sunrise",20,30,0,0.8,8],["Moonlit Pines",235,210,5,0.05,0],["Twilight Thicket",270,330,5,0.15,4],["Misty Ford",215,200,3,0.3,6],["Rusty Ridge",15,20,3,0.4,8],["Mossy Glen",130,90,0,0.45,1],["Mushroom Meadow",170,100,0,0.75,4],["Waterfall Walk",180,160,0,0.8,6],["Trash Heap Twilight",270,330,0,0.15,8],["Hooting Hollow",255,280,3,0.08,3],["Stump Town",35,25,3,0.45,4],["Sunset Sandbar",350,25,0,0.5,6],["Rubbish Rapids",200,180,1,0.3,8],["Haunted Hollow",280,300,3,0.04,3],["Woodpecker Walk",205,90,0,0.95,4],["Rainy River Road",220,200,1,0.25,6],["Bottle Cap Bluff",195,50,0,0.9,8],["Thornwood Gloom",330,20,6,0.1,3],["Harvest Moon Woods",25,15,11,0.1,5],["Floodplain Fury",250,260,6,0.1,6],["Seagull Summit",200,30,0,0.85,8],["Giant Sequoia Grove",30,20,0,0.9,1],["Rainy Acorn Road",215,170,1,0.3,4],["Moonlit Mooring",235,190,5,0.05,6],["The Great Garbage Gala",300,350,5,0.1,8]];
const ENPF=[["owl","bat","mole"],["skunk","hedgehog","crow"],["frog","beaver","pelican"],["rat","skunk","slime"],["hedgehog","skunk","bee"],["bee","mole","owl"],["turtle","crab","snake"],["bulldog","robot","bat"],["snake","mole","porcupine"],["goat","crow","beaver"],["fish","pelican","bee"],["crow","slime","pelican"],["bat","bee","goat"],["hedgehog","owl","skunk"],["beaver","snake","frog"],["skunk","bat","rat"],["skunk","porcupine","owl"],["mole","beaver","bee"],["crab","bee","turtle"],["robot","pelican","bulldog"],["mole","goat","hedgehog"],["crow","skunk","goat"],["pelican","frog","fish"],["slime","rat","crow"],["bee","owl","snake"],["owl","bee","hedgehog"],["snake","turtle","beaver"],["bat","bulldog","skunk"],["penguin","porcupine","hedgehog","bat","goat"],["beaver","goat","mole","skunk"],["bee","fish","crab","frog"],["pelican","crow","robot","rat"],["penguin","goat","snake","skunk","owl"],["skunk","hedgehog","crow","bee"],["frog","beaver","pelican","turtle"],["rat","skunk","slime","bulldog"],["owl","bat","mole","hedgehog"],["bee","mole","owl","goat"],["turtle","crab","snake","fish"],["bulldog","robot","bat","crow"],["hedgehog","skunk","bee","snake"],["goat","crow","beaver","hedgehog"],["fish","pelican","bee","beaver"],["crow","slime","pelican","skunk"],["ghost","bat","snake","mole"],["hedgehog","owl","skunk","mole"],["beaver","snake","frog","crab"],["skunk","bat","rat","robot"],["ghost","bat","bee"],["mole","beaver","bee","crow"],["crab","bee","turtle","pelican"],["robot","pelican","bulldog","slime"],["ghost","bat","skunk","porcupine"],["crow","skunk","goat","owl"],["pelican","frog","fish","snake"],["slime","rat","crow","bat"],["mole","goat","hedgehog","bee"],["owl","bee","hedgehog","beaver"],["snake","turtle","beaver","bee"],["bat","bulldog","skunk","pelican"]];
const HZF=HZ.slice(),CUR=()=>forestMode?LF:LV,CURHZ=()=>forestMode?HZF:HZ,CURENP=()=>forestMode?ENPF:ENP;
function hazard(o){const m=CUR()[Math.min(lvl,NM-1)],hz=CURHZ()[Math.min(lvl,NM-1)],k=hz[(Math.random()*hz.length)|0],w=m[3];
 if(k=='c')objs.push({t:'cop',x:o+200,ph:0});
 else if(k=='b')objs.push({t:'barrel',x:o+200,ph:0});
 else if(k=='h')objs.push({t:'hang',x:o,st:forestMode?(w==2?'ice':m[5]==8?'tire':'hive'):w==2?'ice':(lvl==9||lvl==38||lvl==39)?'lantern':'hook'});
 else if(k=='e')objs.push(mkEn(CURENP()[Math.min(lvl,NM-1)],o+200));
 else objs.push({t:'spout',x:o,st:w==4?'fire':(w==3||w==1)?'steam':'geyser',off:rnd(0,3)});
 nextX+=(k=='c'||k=='b'||k=='e')?rnd(520,700):rnd(420,560)}
try{hi=+localStorage.getItem('bb2')||0}catch(e){}
try{who=0;localStorage.setItem('erb_ch','0')}catch(e){who=0}
let trashCount=0,trashCleared=[],trashToast=0;try{trashCount=+localStorage.getItem('erb_trash_count')||0;trashCleared=JSON.parse(localStorage.getItem('erb_trash_cleared')||'[]')}catch(e){}
function awardTrash(i){if(trashCleared.includes(i))return;trashCleared.push(i);trashCount++;trashToast=2.6;try{localStorage.setItem('erb_trash_count',trashCount);localStorage.setItem('erb_trash_cleared',JSON.stringify(trashCleared))}catch(e){}}
function setCh(n){who=(n+CH.length)%CH.length;try{localStorage.setItem('erb_ch',who)}catch(e){}}
const rnd=(a,b)=>a+Math.random()*(b-a);
const stars=Array.from({length:90},()=>({x:rnd(0,W),y:rnd(0,250),r:rnd(.4,1.4),p:rnd(0,6)}));
const clouds=Array.from({length:8},()=>({x:rnd(0,W*1.5),y:rnd(30,200),s:rnd(.6,1.5),sp:rnd(.2,.5)}));
const CH=[{n:'Rita Raccoon',d:'Retired trash-can sommelier; considers shiny objects a retirement plan.',kind:'raccoon'},{n:'Pogo Possum',d:'Plays dead whenever the group chat asks who ate the snacks.',kind:'possum'},{n:'Mochi Cat',d:'A parkour expert who only jumps when nobody is watching.',kind:'cat'},{n:'Benny Bandit',d:'A loyal dog with the confidence of a much larger dog.',kind:'dog'},{n:'Cora Crow',d:'A crow who collects bottle caps and extremely specific grudges.',kind:'crow'},{n:'Darla Dillo',d:'An armadillo whose personal space has its own personal space.',kind:'armadillo'},{n:'Pip Squeak',d:'A mouse with a tiny map and enormous unearned confidence.',kind:'mouse'},{n:'Barry Bear',d:'Big-hearted, big paws, deeply suspicious of picnic baskets.',kind:'bear'},{n:'Yap Coyote',d:'A night-shift runner powered by moonlight and questionable choices.',kind:'coyote'},{n:'Quackers Duck',d:'Waddles at full speed, quacks at full volume, and has never once apologized for the pond.',kind:'duck'}];
const funnyLines=(()=>{const a=['I brought a map','My lawyer said','The plan is simple','I packed snacks','The getaway wagon','I have a degree in','Our disguise','My lucky spoon','The raccoon said','Nobody panic'];const b=['is mostly vibes and a wheelbarrow','has four doors and zero brakes','was approved by a sleepy possum','is legally a picnic','will be fine if we ignore the smoke','has one tiny flaw: gravity','is powered by cheese and optimism','was drawn on a receipt','is under new management (me)','ends with us looking extremely fast'];const out=[];for(let i=0;i<50;i++)for(let j=0;j<10;j++)out.push(a[i%10]+' '+['today','apparently','again','somehow','at least'][Math.floor(i/10)]+' '+b[(j+i*3)%10]+(i%3===0?'!':'.'));return [...new Set(out)];})();
const audioFiles={music:'audio/funky-soundtrack.mp3',jump:'audio/jump.mp3',slide:'audio/slide.mp3',spin:'audio/spin.mp3',coin:'audio/coin.mp3',hit:'audio/hit.mp3',womp:'audio/100-womps.mp3',intro:'audio/intro-polka.mp3'};let musicAudio=null,introAudio=null,muted=false;try{muted=localStorage.getItem('erb_muted')==='1'}catch(e){}
const songList=['funky-soundtrack', 'boardwalk-bounce', 'campfire-jig', 'cattail-shuffle', 'dumpster-dive', 'fireflies', 'frog-chorus', 'lazy-river', 'midnight-ferry', 'moonlit-trash-run', 'night-heist', 'old-mill-waltz', 'pine-tree-parade', 'raccoon-polka', 'rapids', 'sneaky-possum', 'snowy-banks', 'sunrise-paddle', 'sunset-cruise', 'turbo-trash', 'victory-lap'];let songDeck=[],lastSong='';function newSong(){if(!songDeck.length){songDeck=songList.slice();for(let i=songDeck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[songDeck[i],songDeck[j]]=[songDeck[j],songDeck[i]]}if(songDeck.length>1&&songDeck[songDeck.length-1]===lastSong){const k=Math.floor(Math.random()*(songDeck.length-1));[songDeck[songDeck.length-1],songDeck[k]]=[songDeck[k],songDeck[songDeck.length-1]]}}lastSong=songDeck.pop();if(window.erbSong&&songList.includes(window.erbSong))lastSong=window.erbSong;const src='audio/'+lastSong+'.mp3';audioFiles.music=src;if(musicAudio){musicAudio.pause();musicAudio.src=src;musicAudio.currentTime=0}try{window.erbOnSong&&window.erbOnSong(lastSong,true)}catch(e){}}
function stopIntroSong(){if(introAudio){introAudio.pause();introAudio.currentTime=0}}
function toggleMute(){muted=!muted;try{localStorage.setItem('erb_muted',muted?'1':'0')}catch(e){}if(musicAudio)musicAudio.muted=muted;if(introAudio)introAudio.muted=muted}
function sound(k){try{window.erbOnSound&&window.erbOnSound(k)}catch(e){}if(k==='intro'){if(!introAudio){introAudio=new Audio(audioFiles.intro);introAudio.volume=Math.min(1,.28*(window.erbMus==null?1:window.erbMus));introAudio.muted=muted}if(introAudio.paused){introAudio.currentTime=0;introAudio.play().catch(()=>{})}return}if(k==='music'){if(!musicAudio){musicAudio=new Audio(audioFiles.music);musicAudio.loop=true;musicAudio.volume=Math.min(1,.34*(window.erbMus==null?1:window.erbMus));musicAudio.muted=muted}musicAudio.play().catch(()=>{});return}if(muted)return;if(audioFiles[k]){const a=new Audio(audioFiles[k]);a.volume=Math.min(1,.45*(window.erbSfx==null?1:window.erbSfx));a.play().catch(()=>{})}}
const MUTE=[704,12,40,30];
let runMode='continuous',spellingMode=false,spellActive=false,spellWords=[],spellWordIndex=0,spellLetterIndex=0,spellNotice=0,spellCompletedName='',spellError='',runnerPointerX=null,readyFor='play',quip='',readyClock=0,pausedFrom='play',plat=null,funnyLeft=0,funnyNext='play',funnyLevel=1,tutorialTime=0,bioHover=-1;const PLAT_NAMES=['Meadow Mischief','Mushroom Mile','Old Oak Crossing','Moonlit Orchard','Puddle Jump','Pinecone Pass','Abandoned Barn','Riverside Ruins','Bramble Run','Bandit Bonanza'];
const E_=(a,b,rx,ry,c)=>{x.fillStyle=c;x.beginPath();x.ellipse(a,b,rx,ry,0,0,7);x.fill()},R_=(a,b,w,h,c)=>{x.fillStyle=c;x.fillRect(a,b,w,h)},EY=(a,b,r)=>{E_(a,b,r,r,'#fff');E_(a+r*.2,b,r*.5,r*.5,'#111')};
// 20 extra enemies. s=speed toward player, y0=fixed top (air), st=per-frame behaviour, dr=draw (sx,y,o)
const EN={
 crab:{n:'Crab',w:34,h:22,s:90,dr:(sx,y,o)=>{const a=Math.sin(o.ph*14)*2;x.strokeStyle='#b8402b';x.lineWidth=2;for(let i=0;i<3;i++){x.beginPath();x.moveTo(sx+6+i*3,y+17);x.lineTo(sx+1+i*2,y+23+(i%2?a:-a));x.moveTo(sx+28-i*3,y+17);x.lineTo(sx+33-i*2,y+23+(i%2?-a:a));x.stroke()}E_(sx+17,y+13,15,9,'#e0553a');E_(sx+3,y+8+a,6,5,'#f26a4b');E_(sx+31,y+8-a,6,5,'#f26a4b');R_(sx+11,y+2,2,5,'#b8402b');R_(sx+21,y+2,2,5,'#b8402b');EY(sx+12,y+3,3);EY(sx+22,y+3,3)}},
 rat:{n:'Rat',w:28,h:16,s:250,dr:(sx,y,o)=>{const a=Math.sin(o.ph*30)*2;x.strokeStyle='#d99';x.lineWidth=2;x.beginPath();x.moveTo(sx+24,y+10);x.quadraticCurveTo(sx+32,y+4+a,sx+36,y+12);x.stroke();E_(sx+15,y+10,11,6,'#7a6f6a');E_(sx+5,y+9,6,5,'#8a7f7a');E_(sx+7,y+4,3,3,'#e9a');E_(sx+1,y+10,2,2,'#f48');R_(sx+12+a,y+14,3,3,'#544');R_(sx+19-a,y+14,3,3,'#544');EY(sx+5,y+8,1.8)}},
 docker:{n:'Dock Worker',w:28,h:52,s:110,dr:(sx,y,o)=>{const a=Math.sin(o.ph*8)*5;R_(sx+7+a,y+38,6,14,'#2a3a5a');R_(sx+15-a,y+38,6,14,'#2a3a5a');R_(sx+4,y+16,20,24,'#e8841a');R_(sx+4,y+26,20,3,'#ffe36b');E_(sx+14,y+11,8,8,'#e0b088');E_(sx+14,y+6,10,5,'#ffd23f');R_(sx+4,y+7,20,3,'#ffd23f');EY(sx+10,y+12,1.8);R_(sx-4,y+18,8,6,'#7a4a24')}},
 bulldog:{n:'Bulldog',w:44,h:28,s:210,dr:(sx,y,o)=>{const a=Math.sin(o.ph*18)*5;R_(sx+12+a,y+22,5,7,'#8a6238');R_(sx+32-a,y+22,5,7,'#8a6238');E_(sx+26,y+15,17,10,'#b98b5a');E_(sx+10,y+13,10,9,'#c99b6a');E_(sx+4,y+17,6,5,'#a57848');E_(sx+8,y+6,4,5,'#7a5230');R_(sx+14,y+20,6,3,'#c22');EY(sx+8,y+11,2.2);E_(sx+1,y+15,2.5,2,'#222');R_(sx+3,y+19,3,3,'#fff')}},
 skater:{n:'Skater',w:30,h:40,s:340,dr:(sx,y,o)=>{R_(sx,y+35,30,4,'#e63');E_(sx+6,y+39,3,3,'#fff');E_(sx+24,y+39,3,3,'#fff');R_(sx+8,y+20,6,15,'#335');R_(sx+17,y+20,6,15,'#335');R_(sx+6,y+8,19,14,'#7b3fe0');E_(sx+15,y+5,6,6,'#e0b088');R_(sx+8,y,15,4,'#222');R_(sx+2,y+10+Math.sin(o.ph*6)*2,5,3,'#7b3fe0');EY(sx+13,y+5,1.6)}},
 beachball:{n:'Beach Ball',w:30,h:30,s:140,st:o=>{o.y=G-30-Math.abs(Math.sin(o.ph*3))*60},dr:(sx,y,o)=>{x.save();x.translate(sx+15,y+15);x.rotate(-o.ph*5);const cs=['#f33','#fff','#39f','#fd2','#3c6','#fff'];for(let i=0;i<6;i++){x.fillStyle=cs[i];x.beginPath();x.moveTo(0,0);x.arc(0,0,15,i*Math.PI/3,(i+1)*Math.PI/3);x.fill()}x.restore();E_(sx+10,y+9,4,3,'rgba(255,255,255,.4)')}},
 slime:{n:'Slime',w:44,h:24,s:70,dr:(sx,y,o)=>{const q=Math.sin(o.ph*6)*3;x.fillStyle='#6fe06a';x.beginPath();x.moveTo(sx,y+24);x.quadraticCurveTo(sx+2,y+2-q,sx+22,y+2-q);x.quadraticCurveTo(sx+42,y+2-q,sx+44,y+24);x.fill();EY(sx+14,y+12,4);EY(sx+28,y+12,4);R_(sx+17,y+19,10,2,'#2a7a28');E_(sx+10,y+8,4,2,'rgba(255,255,255,.5)')}},
 frog:{n:'Frog',w:30,h:24,s:100,st:(o,dt)=>{const c=o.ph%1.6;if(c<.55){o.y=G-24-Math.sin(c/.55*Math.PI)*80;o.x-=160*dt}else o.y=G-24},dr:(sx,y,o)=>{const up=y<G-26;E_(sx+16,y+15,13,8,'#4cc24a');E_(sx+6,y+10,7,6,'#58d055');E_(sx+4,y+5,4,4,'#fff');E_(sx+11,y+4,4,4,'#fff');E_(sx+4,y+5,2,2,'#111');E_(sx+11,y+4,2,2,'#111');R_(sx+20,y+19,8,up?3:5,'#3a9a38');R_(sx+2,y+19,6,5,'#3a9a38');R_(sx+1,y+13,6,2,'#c33')}},
 skeleton:{n:'Skeleton',w:26,h:54,s:120,dr:(sx,y,o)=>{const a=Math.sin(o.ph*7)*5;x.strokeStyle='#eee';x.lineWidth=3;x.beginPath();x.moveTo(sx+10,y+38);x.lineTo(sx+10+a,y+54);x.moveTo(sx+16,y+38);x.lineTo(sx+16-a,y+54);x.moveTo(sx+13,y+18);x.lineTo(sx+13,y+38);x.stroke();x.lineWidth=2;for(let i=0;i<3;i++){x.beginPath();x.moveTo(sx+6,y+21+i*5);x.lineTo(sx+20,y+21+i*5);x.stroke()}E_(sx+13,y+10,8,8,'#f2f2ea');R_(sx+5,y+3,16,4,'#c22');E_(sx+10,y+10,2,2,'#111');E_(sx+16,y+10,2,2,'#111');R_(sx+9,y+15,8,2,'#aaa');x.strokeStyle='#bbb';x.lineWidth=3;x.beginPath();x.moveTo(sx+2,y+26);x.lineTo(sx-8,y+10);x.stroke()}},
 ghost:{n:'Ghost',w:32,h:36,s:130,st:o=>{o.y=G-44-(Math.sin(o.ph*3)*14+14)},dr:(sx,y,o)=>{x.globalAlpha=.8;x.fillStyle='#e8f0ff';x.beginPath();x.moveTo(sx,y+36);x.lineTo(sx,y+14);x.quadraticCurveTo(sx+16,y-8,sx+32,y+14);x.lineTo(sx+32,y+36);for(let i=0;i<4;i++)x.quadraticCurveTo(sx+28-i*8,y+30+(i%2?4:-2)+Math.sin(o.ph*8+i)*2,sx+24-i*8,y+36);x.fill();x.globalAlpha=1;E_(sx+11,y+14,3,4,'#223');E_(sx+21,y+14,3,4,'#223');E_(sx+16,y+23,3,4,'#223')}},
 pelican:{n:'Pelican',w:54,h:26,s:150,y0:G-64,dr:(sx,y,o)=>{const f=Math.sin(o.ph*7)*9;E_(sx+34,y+14,16,8,'#f4f4f4');E_(sx+14,y+10,7,6,'#f4f4f4');x.fillStyle='#f9a826';x.beginPath();x.moveTo(sx+8,y+8);x.lineTo(sx-12,y+14);x.lineTo(sx+8,y+22);x.fill();x.fillStyle='#e0e0e8';x.beginPath();x.moveTo(sx+30,y+10);x.lineTo(sx+40,y-10+f);x.lineTo(sx+50,y+10);x.fill();EY(sx+12,y+8,2);R_(sx+48,y+12,10,3,'#ddd')}},
 bat:{n:'Bat',w:30,h:18,s:200,y0:G-80,st:o=>{o.y=G-80+Math.sin(o.ph*7)*34},dr:(sx,y,o)=>{const f=Math.sin(o.ph*18)*8;x.fillStyle='#3a2a52';x.beginPath();x.moveTo(sx+15,y+8);x.quadraticCurveTo(sx+4,y-6-f,sx-6,y+4-f);x.quadraticCurveTo(sx+2,y+8,sx+6,y+14);x.lineTo(sx+15,y+12);x.lineTo(sx+24,y+14);x.quadraticCurveTo(sx+28,y+8,sx+36,y+4-f);x.quadraticCurveTo(sx+26,y-6-f,sx+15,y+8);x.fill();E_(sx+15,y+9,5,5,'#4a3a66');R_(sx+11,y+3,2,4,'#4a3a66');R_(sx+17,y+3,2,4,'#4a3a66');R_(sx+12,y+8,2,2,'#f44');R_(sx+17,y+8,2,2,'#f44')}},
 drone:{n:'Drone',w:34,h:20,s:120,y0:G-60,st:o=>{o.y=G-60+Math.sin(o.ph*3)*4},dr:(sx,y,o)=>{R_(sx+6,y+6,22,9,'#555a66');R_(sx+4,y+2,6,2,'#999');R_(sx+24,y+2,6,2,'#999');x.fillStyle='rgba(200,220,255,.5)';x.fillRect(sx-4,y+1,16,2);x.fillRect(sx+22,y+1,16,2);R_(sx+8,y+3,2,4,'#333');R_(sx+24,y+3,2,4,'#333');const on=Math.sin(o.ph*8)>0;E_(sx+17,y+16,4,4,on?'#f33':'#611');if(on){x.fillStyle='rgba(255,50,50,.25)';x.beginPath();x.arc(sx+17,y+16,12,0,7);x.fill()}}},
 crow:{n:'Crow',w:36,h:20,s:230,y0:G-170,st:(o,dt,sx)=>{o.y=G-60-Math.max(0,Math.min(1,(sx-300)/250))*110},dr:(sx,y,o)=>{const f=Math.sin(o.ph*14)*8;E_(sx+20,y+11,13,6,'#16161e');E_(sx+8,y+9,6,5,'#16161e');x.fillStyle='#e8a23a';x.beginPath();x.moveTo(sx+3,y+8);x.lineTo(sx-6,y+11);x.lineTo(sx+3,y+13);x.fill();x.fillStyle='#22222c';x.beginPath();x.moveTo(sx+16,y+9);x.lineTo(sx+26,y-8+f);x.lineTo(sx+32,y+10);x.fill();R_(sx+30,y+9,9,4,'#16161e');R_(sx+7,y+7,2,2,'#fff')}},
 fish:{n:'Flying Fish',w:32,h:16,s:220,y0:G-62,st:o=>{o.y=G-62+Math.sin(o.ph*5)*30},dr:(sx,y,o)=>{const f=Math.sin(o.ph*16)*5;E_(sx+16,y+9,14,5,'#6bb7e8');E_(sx+14,y+11,10,3,'#cde8f8');x.fillStyle='#9ad4f5';x.beginPath();x.moveTo(sx+14,y+7);x.lineTo(sx+22,y-6+f);x.lineTo(sx+24,y+7);x.fill();x.fillStyle='#4a97cc';x.beginPath();x.moveTo(sx+29,y+9);x.lineTo(sx+38,y+2);x.lineTo(sx+38,y+16);x.fill();EY(sx+6,y+8,2)}},
 cannon:{n:'Cannonball',w:22,h:22,s:420,dr:(sx,y,o)=>{x.fillStyle='rgba(255,170,60,.35)';x.beginPath();x.moveTo(sx+22,y+4);x.lineTo(sx+60,y+11);x.lineTo(sx+22,y+18);x.fill();E_(sx+11,y+11,11,11,'#23232b');E_(sx+7,y+7,3,3,'#667');R_(sx+11,y-3,2,5,'#a73');if(Math.sin(o.ph*40)>0)E_(sx+12,y-4,3,3,'#ffd23f')}},
 turtle:{n:'Turtle',w:46,h:26,s:60,dr:(sx,y,o)=>{const a=Math.sin(o.ph*5)*2;E_(sx+5,y+16,6,5,'#8fb85a');R_(sx+10+a,y+20,6,6,'#6f9a3f');R_(sx+32-a,y+20,6,6,'#6f9a3f');x.fillStyle='#3f8a46';x.beginPath();x.moveTo(sx+10,y+22);x.quadraticCurveTo(sx+24,y-8,sx+42,y+22);x.fill();x.strokeStyle='#2c6a34';x.lineWidth=2;x.beginPath();x.moveTo(sx+18,y+8);x.lineTo(sx+22,y+22);x.moveTo(sx+28,y+6);x.lineTo(sx+28,y+22);x.moveTo(sx+36,y+10);x.lineTo(sx+32,y+22);x.stroke();EY(sx+4,y+14,2)}},
 parrot:{n:'Parrot',w:34,h:24,s:190,y0:G-58,st:o=>{o.y=G-58+Math.sin(o.ph*4)*8},dr:(sx,y,o)=>{const f=Math.sin(o.ph*9)*7;E_(sx+20,y+12,12,7,'#e83b3b');E_(sx+8,y+9,7,6,'#e83b3b');x.fillStyle='#ffd23f';x.beginPath();x.moveTo(sx+2,y+6);x.lineTo(sx-5,y+11);x.lineTo(sx+3,y+13);x.fill();x.fillStyle='#2a8cf0';x.beginPath();x.moveTo(sx+16,y+9);x.lineTo(sx+26,y-6+f);x.lineTo(sx+30,y+11);x.fill();x.fillStyle='#3cc060';x.fillRect(sx+30,y+10,9,4);x.fillRect(sx+33,y+14,7,3);EY(sx+7,y+7,2)}},
 ninja:{n:'Ninja Cat',w:28,h:28,s:120,st:(o,dt,sx)=>{if(sx<520)o.go=1;if(o.go){o.x-=300*dt;o.lp=(o.lp||0)+dt;o.y=G-28-(o.lp<.5?Math.sin(o.lp/.5*Math.PI)*90:0)}},dr:(sx,y,o)=>{x.strokeStyle='#222';x.lineWidth=4;x.lineCap='round';x.beginPath();x.moveTo(sx+24,y+20);x.quadraticCurveTo(sx+36,y+14+Math.sin(o.ph*12)*3,sx+32,y+4);x.stroke();x.lineCap='butt';E_(sx+14,y+18,11,8,'#23232b');E_(sx+8,y+11,9,8,'#2c2c36');x.fillStyle='#2c2c36';x.beginPath();x.moveTo(sx+1,y+6);x.lineTo(sx+3,y-3);x.lineTo(sx+8,y+3);x.fill();x.beginPath();x.moveTo(sx+10,y+3);x.lineTo(sx+15,y-3);x.lineTo(sx+16,y+6);x.fill();R_(sx,y+9,18,3,'#d22');R_(sx+14,y+9,8,2,'#d22');E_(sx+5,y+13,2.2,1.6,'#fff');E_(sx+11,y+13,2.2,1.6,'#fff');R_(sx+9+Math.sin(o.ph*20)*2,y+25,5,3,'#23232b')}},
 robot:{n:'Security Bot',w:34,h:42,s:170,dr:(sx,y,o)=>{E_(sx+17,y+37,8,5,'#222');R_(sx+5,y+14,24,22,'#9aa4b4');R_(sx+9,y+19,16,7,'#222');const on=Math.sin(o.ph*10)>0;R_(sx+10,y+21,on?12:6,3,'#f33');R_(sx+14,y+8,6,6,'#778');E_(sx+17,y+6,5,4,on?'#f33':'#37f');x.fillStyle=on?'rgba(255,60,60,.25)':'rgba(60,120,255,.25)';x.beginPath();x.arc(sx+17,y+6,14,0,7);x.fill();R_(sx-3,y+22,8,3,'#778');R_(sx+29,y+22,8,3,'#778');R_(sx+7,y+30,20,2,'#667')}},
 hedgehog:{n:'Hedgehog',w:36,h:28,s:115,dr:(sx,y,o)=>{E_(sx+18,y+20,17,9,'#9a6542');for(let i=0;i<7;i++){x.fillStyle='#49352b';x.beginPath();x.moveTo(sx+3+i*5,y+18);x.lineTo(sx+6+i*4,y+Math.sin(o.ph*8+i)*4);x.lineTo(sx+10+i*4,y+19);x.fill()}E_(sx+32,y+18,6,5,'#b7835c');EY(sx+33,y+17,1.6)}},
 skunk:{n:'Skunk',w:38,h:28,s:130,dr:(sx,y,o)=>{E_(sx+18,y+19,16,9,'#24222a');E_(sx+32,y+15,7,6,'#33313a');x.strokeStyle='#f3eee3';x.lineWidth=4;x.beginPath();x.moveTo(sx+4,y+17);x.quadraticCurveTo(sx-3,y+5,sx+13,y+7);x.lineTo(sx+24,y+18);x.stroke();E_(sx+35,y+14,1.5,1.5,'#fff');R_(sx+8,y+24,5,4,'#211f26');R_(sx+23,y+24,5,4,'#211f26')}},
 goat:{n:'Goat',w:42,h:38,s:155,dr:(sx,y,o)=>{const b=Math.sin(o.ph*8)*3;E_(sx+23,y+25,16,11,'#d8d0b9');E_(sx+13,y+14,9,9,'#e7deca');x.strokeStyle='#7d674c';x.lineWidth=3;x.beginPath();x.moveTo(sx+10,y+10);x.lineTo(sx+6,y+1);x.moveTo(sx+18,y+9);x.lineTo(sx+22,y+1);x.stroke();E_(sx+7,y+14,4,3,'#dca');EY(sx+12,y+13,2);R_(sx+14+b,y+32,4,6,'#695642');R_(sx+30-b,y+32,4,6,'#695642')}},
 owl:{n:'Owl',w:34,h:42,s:100,y0:G-120,st:o=>{o.y=G-120+Math.sin(o.ph*4)*8},dr:(sx,y,o)=>{const f=Math.sin(o.ph*12)*7;E_(sx+17,y+23,15,18,'#805638');x.fillStyle='#67462e';x.beginPath();x.moveTo(sx+8,y+12);x.lineTo(sx+2,y+2);x.lineTo(sx+15,y+9);x.fill();x.beginPath();x.moveTo(sx+26,y+12);x.lineTo(sx+32,y+2);x.lineTo(sx+19,y+9);x.fill();E_(sx+11,y+17,7,7,'#f4e2b8');E_(sx+23,y+17,7,7,'#f4e2b8');E_(sx+12,y+17,2,2,'#111');E_(sx+22,y+17,2,2,'#111');x.fillStyle='#e9a43d';x.beginPath();x.moveTo(sx+15,y+24);x.lineTo(sx+20,y+24);x.lineTo(sx+17,y+29);x.fill();x.fillStyle='#a7724b';x.beginPath();x.ellipse(sx+3,y+27,7,4,f*.08,0,7);x.fill();x.beginPath();x.ellipse(sx+31,y+27,7,4,-f*.08,0,7);x.fill()}},
 beaver:{n:'Beaver',w:42,h:30,s:110,dr:(sx,y,o)=>{E_(sx+20,y+20,16,9,'#8e5e39');E_(sx+34,y+16,7,6,'#a9784e');x.fillStyle='#59402e';x.beginPath();x.ellipse(sx+3,y+25,9,4,-.3,0,7);x.fill();EY(sx+34,y+15,1.7);R_(sx+14,y+25,5,5,'#62442e');R_(sx+27,y+25,5,5,'#62442e');R_(sx+38,y+18,4,3,'#f2d8a4')}},
 snake:{n:'Snake',w:52,h:22,s:180,dr:(sx,y,o)=>{x.strokeStyle='#64ad59';x.lineWidth=10;x.lineCap='round';x.beginPath();x.moveTo(sx+2,y+19);x.bezierCurveTo(sx+12,y+4+Math.sin(o.ph*7)*4,sx+25,y+27,sx+36,y+13);x.stroke();E_(sx+43,y+11,9,7,'#76c869');EY(sx+46,y+9,1.5);x.strokeStyle='#c84a4a';x.lineWidth=2;x.beginPath();x.moveTo(sx+51,y+13);x.lineTo(sx+57,y+14);x.stroke()}},
 bee:{n:'Bee',w:30,h:22,s:220,y0:G-78,st:o=>{o.y=G-78+Math.sin(o.ph*7)*12},dr:(sx,y,o)=>{const f=Math.sin(o.ph*28)*5;x.fillStyle='rgba(240,250,255,.7)';x.beginPath();x.ellipse(sx+10,y+6,6,3,f*.04,0,7);x.ellipse(sx+20,y+6,6,3,-f*.04,0,7);x.fill();E_(sx+15,y+14,12,7,'#f1c536');R_(sx+9,y+9,3,10,'#222');R_(sx+17,y+8,3,12,'#222');R_(sx+24,y+12,6,3,'#222');EY(sx+7,y+12,1.5)}},
 mole:{n:'Mole',w:32,h:28,s:105,dr:(sx,y,o)=>{E_(sx+16,y+18,14,10,'#76604f');E_(sx+26,y+16,7,6,'#977d69');E_(sx+8,y+10,5,5,'#b99182');EY(sx+24,y+14,1.4);E_(sx+31,y+18,2,2,'#df9b9a');R_(sx+9,y+24,6,4,'#544338');R_(sx+21,y+24,6,4,'#544338')}},
 penguin:{n:'Penguin',w:34,h:42,s:120,dr:(sx,y,o)=>{const f=Math.sin(o.ph*10)*5;E_(sx+17,y+23,13,19,'#252b39');E_(sx+17,y+26,8,13,'#f3f0e7');E_(sx+8,y+23,6,4,'#414959');E_(sx+26,y+23,6,4,'#414959');x.fillStyle='#f1a737';x.beginPath();x.moveTo(sx+15,y+16);x.lineTo(sx+22,y+16);x.lineTo(sx+18,y+20);x.fill();E_(sx+13,y+13,1.5,1.5,'#fff');E_(sx+21,y+13,1.5,1.5,'#fff');x.fillStyle='#edaa38';x.beginPath();x.ellipse(sx+11+f,y+40,6,3,0,0,7);x.ellipse(sx+24-f,y+40,6,3,0,0,7);x.fill()}},
 porcupine:{n:'Porcupine',w:42,h:30,s:125,dr:(sx,y,o)=>{E_(sx+21,y+20,17,10,'#74533a');for(let i=0;i<8;i++){x.strokeStyle=i%2?'#e0c79a':'#46362b';x.lineWidth=2;x.beginPath();x.moveTo(sx+5+i*4,y+16);x.lineTo(sx+4+i*4,y+Math.sin(o.ph*6+i)*2);x.stroke()}E_(sx+37,y+18,6,5,'#b78d66');EY(sx+38,y+17,1.4)}}
};
// which of the 20 appear on each of the 30 maps (themed)
const ENP=[['crab','rat'],['crab','pelican','docker'],['skater','drone'],['rat','docker','bulldog'],['pelican','crow'],['frog','rat','slime'],['robot','docker','cannon'],['crab','fish','turtle'],['frog','bat','ghost'],['beachball','skater','parrot'],['bulldog','pelican','beachball'],['crow','pelican','parrot'],['ghost','bat'],['skeleton','parrot','cannon'],['robot','drone','crow'],['ninja','bulldog','beachball'],['slime','bulldog','crow','rat'],['turtle','ninja','bat'],['ghost','drone','fish'],['skeleton','bat','cannon'],['slime','robot','ninja'],['frog','turtle','fish'],['ninja','skater','parrot'],['turtle','rat','bulldog'],['bat','ghost','drone'],['skeleton','ghost','bat'],['robot','cannon','crow'],['frog','docker','fish'],['ninja','drone','skeleton'],Object.keys(EN)];
ENP.push(['rat','bulldog','crow','frog'],['bulldog','crow','skater'],['frog','turtle','fish'],['bat','rat','ninja'],['crow','cannon','bulldog'],['crab','rat','turtle'],['skeleton','ghost','bat'],['bat','ghost','frog'],['ninja','parrot','docker'],['ghost','beachball','skater','drone'],['fish','frog','ninja'],['ninja','frog','crow'],['skeleton','bat','robot'],['skeleton','bat','cannon','ghost'],['robot','docker','crow'],['robot','docker','slime'],['drone','robot','bat'],['robot','cannon','skater'],['slime','drone','robot','ghost'],['fish','turtle','crab'],['skeleton','crab','ghost'],['fish','ghost','slime'],['crab','fish','turtle','parrot'],['bulldog','crow','rat','ninja'],['bat','ghost','ninja'],['drone','fish','crow'],['robot','cannon','crow','bat'],['fish','cannon','pelican','parrot'],['drone','robot','ninja','skater'],Object.keys(EN));
const bonusEnemyNames=['hedgehog','skunk','goat','owl','beaver','snake','bee','mole','penguin','porcupine'];for(let i=0;i<NM;i++)if(ENP[i])ENP[i].push(bonusEnemyNames[i%10]);

// ---- 30 extra enemies + 20 extra obstacles (shared data-driven art) ----
const tri=(a,b,c,d,e,f,col)=>{x.fillStyle=col;x.beginPath();x.moveTo(a,b);x.lineTo(c,d);x.lineTo(e,f);x.closePath();x.fill()};
const mkWalk=(n,w,h,s,c1,c2,o={})=>({n,w,h,s,st:o.hop?((e,dt)=>{const c=e.ph%1.5;e.y=G-h-(c<.5?Math.sin(c/.5*Math.PI)*70:0)}):undefined,dr:(sx,y,e)=>{const a=Math.sin(e.ph*(o.sp||14))*3;x.strokeStyle=c2;x.lineWidth=3;x.lineCap='round';for(let i=0;i<3;i++){const lx=sx+w*(.25+i*.27);x.beginPath();x.moveTo(lx,y+h*.7);x.lineTo(lx+(i%2?a:-a),y+h);x.stroke()}x.lineCap='butt';
 if(o.tail){x.strokeStyle=c1;x.lineWidth=4;x.beginPath();x.moveTo(sx+w*.9,y+h*.5);x.quadraticCurveTo(sx+w*1.1,y+h*.1,sx+w*.8,y-h*.15);x.stroke()}
 E_(sx+w*.55,y+h*.55,w*.4,h*.32,c1);if(o.shell){E_(sx+w*.55,y+h*.48,w*.4,h*.36,o.shell);x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=1.5;x.beginPath();x.moveTo(sx+w*.55,y+h*.15);x.lineTo(sx+w*.55,y+h*.8);x.stroke()}
 if(o.stripe){R_(sx+w*.3,y+h*.3,w*.5,3,o.stripe);R_(sx+w*.3,y+h*.45,w*.5,3,o.stripe)}
 if(o.spk){for(let i=0;i<5;i++)tri(sx+w*(.3+i*.12),y+h*.3,sx+w*(.35+i*.12),y+h*.05,sx+w*(.4+i*.12),y+h*.3,o.spk)}
 E_(sx+w*.17,y+h*.42,w*.18,h*.26,c1);if(o.horn){tri(sx+w*.12,y+h*.2,sx+w*.04,y-h*.15,sx+w*.24,y+h*.18,o.horn)}if(o.tusk){tri(sx+w*.06,y+h*.55,sx-w*.02,y+h*.38,sx+w*.14,y+h*.5,'#fff')}
 if(o.ears){tri(sx+w*.16,y+h*.22,sx+w*.12,y-h*.08,sx+w*.26,y+h*.2,c1)}
 EY(sx+w*.14,y+h*.38,Math.max(1.7,w*.045));if(o.claw){E_(sx+w*.02,y+h*.6,w*.1,h*.12,o.claw)}}});
const mkTall=(n,w,h,s,shirt,hat,o={})=>({n,w,h,s,dr:(sx,y,e)=>{const a=Math.sin(e.ph*8)*5;R_(sx+w*.25+a,y+h*.68,w*.2,h*.32,o.pants||'#3a3f5a');R_(sx+w*.55-a,y+h*.68,w*.2,h*.32,o.pants||'#3a3f5a');R_(sx+w*.15,y+h*.34,w*.7,h*.38,shirt);if(o.plaid){x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=1.5;for(let i=1;i<4;i++){x.beginPath();x.moveTo(sx+w*.15+i*w*.17,y+h*.34);x.lineTo(sx+w*.15+i*w*.17,y+h*.72);x.stroke()}}
 if(o.wrap){x.strokeStyle='#cfc7b0';x.lineWidth=1.5;for(let i=0;i<6;i++){x.beginPath();x.moveTo(sx+w*.15,y+h*.12+i*h*.14);x.lineTo(sx+w*.85,y+h*.18+i*h*.14);x.stroke()}}
 if(o.pack)R_(sx+w*.62,y+h*.36,w*.3,h*.3,o.pack);E_(sx+w*.5,y+h*.2,w*.3,h*.17,o.skin||'#e0b088');
 if(hat=='cone')tri(sx+w*.2,y+h*.12,sx+w*.5,y-h*.25,sx+w*.8,y+h*.12,'#d9322b');else if(hat=='straw'){R_(sx+w*.05,y+h*.07,w*.9,3,'#d9b84a');R_(sx+w*.25,y-h*.04,w*.5,h*.1,'#d9b84a')}else if(hat=='hard'){R_(sx+w*.2,y+h*.03,w*.6,h*.07,'#ffb02e')}else if(hat=='bandana'){R_(sx+w*.2,y+h*.04,w*.6,h*.07,'#c22')}else if(hat=='clown'){E_(sx+w*.5,y+h*.02,w*.35,h*.08,'#ff4fa0');E_(sx+w*.5,y+h*.2,3,3,'#e22')}else if(hat=='beanie')R_(sx+w*.2,y+h*.02,w*.6,h*.1,'#2a6a3a');
 EY(sx+w*.4,y+h*.19,1.6);if(o.axe){x.strokeStyle='#7a4a24';x.lineWidth=3;x.beginPath();x.moveTo(sx-4,y+h*.3);x.lineTo(sx+w*.1,y+h*.7);x.stroke();R_(sx-10,y+h*.28,10,8,'#bbb')}if(o.patch)R_(sx+w*.36,y+h*.17,w*.16,h*.07,'#111')}});
const mkFly=(n,w,h,s,c1,c2,y0,mv,o={})=>({n,w,h,s,y0,st:mv,dr:(sx,y,e)=>{const f=Math.sin(e.ph*(o.fl||22))*(o.amp||8);x.fillStyle=c2;x.globalAlpha=.75;x.beginPath();x.ellipse(sx+w*.55,y+h*.25-f*.4,w*.3,h*.25+Math.abs(f)*.4,-.4,0,7);x.ellipse(sx+w*.7,y+h*.3+f*.3,w*.26,h*.2+Math.abs(f)*.3,.4,0,7);x.fill();x.globalAlpha=1;E_(sx+w*.55,y+h*.6,w*.4,h*.28,c1);if(o.stripe){R_(sx+w*.45,y+h*.4,3,h*.4,o.stripe);R_(sx+w*.62,y+h*.4,3,h*.4,o.stripe)}E_(sx+w*.15,y+h*.6,w*.16,h*.24,c1);if(o.beak)tri(sx+w*.02,y+h*.55,sx-w*.15,y+h*.62,sx+w*.05,y+h*.7,'#f0b030');if(o.sting)tri(sx+w*.94,y+h*.55,sx+w*1.1,y+h*.65,sx+w*.92,y+h*.7,'#222');EY(sx+w*.13,y+h*.55,1.8);if(o.balloon){x.strokeStyle='#ddd';x.lineWidth=1;x.beginPath();x.moveTo(sx+w*.5,y+h*.9);x.lineTo(sx+w*.5,y+h*1.3);x.stroke()}}});
const mkBall=(n,w,s,c1,c2,o={})=>({n,w,h:w,s,dr:(sx,y,e)=>{x.save();x.translate(sx+w/2,y+w/2);x.rotate(-e.ph*(o.rot||8));if(o.spk){for(let i=0;i<10;i++){const an=i/10*6.283;tri(Math.cos(an-.14)*w*.42,Math.sin(an-.14)*w*.42,Math.cos(an)*w*.7,Math.sin(an)*w*.7,Math.cos(an+.14)*w*.42,Math.sin(an+.14)*w*.42,c2)}}E_(0,0,w/2,w/2,c1);if(o.twig){x.strokeStyle=c2;x.lineWidth=1.5;for(let i=0;i<6;i++){x.beginPath();x.arc(0,0,w*(.12+i*.06),i,i+2.2);x.stroke()}}if(o.holes){E_(-3,-4,2,2,'#111');E_(3,-4,2,2,'#111');E_(0,2,2,2,'#111')}if(o.face){EY(-3,-2,2)}x.restore()}});
const mkSnake=(n,w,h,s,c1,c2,seg)=>({n,w,h,s,dr:(sx,y,e)=>{for(let i=seg-1;i>=0;i--){const px=sx+w*(i/seg)+w/seg/2,py=y+h*.5+Math.sin(e.ph*9+i*.9)*h*.28;if(seg>6){x.strokeStyle=c2;x.lineWidth=2;x.beginPath();x.moveTo(px,py+3);x.lineTo(px-2,py+h*.6);x.stroke()}E_(px,py,w/seg*.75,h*.42,i%2?c1:c2)}EY(sx+w/seg*.5,y+h*.38+Math.sin(e.ph*9)*h*.28,1.7)}});
Object.assign(EN,{
 badger:mkWalk('Badger',40,24,110,'#55555d','#2a2a30',{stripe:'#eee',ears:1,claw:'#ddd'}),
 fox:mkWalk('Fox',42,26,210,'#e8742a','#7a3a12',{tail:1,ears:1}),
 wolfpup:mkWalk('Wolf Pup',38,26,190,'#8d96a3','#444b55',{ears:1,tail:1}),
 beetle:mkWalk('Beetle',26,16,120,'#1d2f28','#111',{shell:'#2f7a52',sp:22}),
 snail:mkWalk('Snail',30,22,40,'#d2b48a','#a98a60',{shell:'#c0683a',sp:4}),
 scorpion:mkWalk('Scorpion',42,22,130,'#b8742a','#6a3a12',{tail:1,claw:'#e89a4a'}),
 ant:mkWalk('Ant Soldier',32,18,150,'#7a2a1a','#3a1008',{sp:24,horn:'#5a1a10'}),
 moose:mkWalk('Moose Calf',50,46,80,'#6b4a30','#3a2616',{horn:'#d9c9a0',ears:1}),
 boar:mkWalk('Boar',46,28,230,'#6a5a4a','#30261c',{tusk:1,spk:'#3a2f25'}),
 lizard:mkWalk('Lizard',42,16,170,'#5aa24a','#2e6a28',{tail:1,sp:20}),
 toad:mkWalk('Toad',30,22,90,'#7a8a3a','#4a5a1e',{hop:1,stripe:'#c8d85a'}),
 gnome:mkTall('Garden Gnome',24,40,100,'#2a6ab8','cone',{skin:'#f0c8a0'}),
 scarecrow:mkTall('Scarecrow',28,54,95,'#b88a3a','straw',{pants:'#6a4a22',skin:'#e8c878',patch:1}),
 hiker:mkTall('Hiker',28,52,120,'#3a8a4a','beanie',{pack:'#c8582a'}),
 lumberjack:mkTall('Lumberjack',30,54,125,'#c22b2b','hard',{plaid:1,axe:1,pants:'#2a3a5a'}),
 zombie:mkTall('Zombie',28,52,70,'#4a6a3a','',{skin:'#8ec27a',pants:'#3a3a4a'}),
 mummy:mkTall('Mummy',28,52,75,'#d9d0b8','',{wrap:1,pants:'#cfc7b0',skin:'#d9d0b8'}),
 pirate:mkTall('Pirate',30,52,135,'#a02828','bandana',{patch:1,pants:'#1a1a2a'}),
 clown:mkTall('Clown',28,50,150,'#ff6a2a','clown',{skin:'#f8e8e0',pants:'#3a5ac8'}),
 wasp:mkFly('Wasp',30,18,230,'#f2c12a','#cfeaff',G-95,o=>{o.y=G-95+Math.sin(o.ph*6)*30},{stripe:'#222',sting:1,fl:34,amp:5}),
 dragonfly:mkFly('Dragonfly',42,14,210,'#2aa6c8','#d7f3ff',G-110,o=>{o.y=G-110+Math.sin(o.ph*3)*20},{fl:40,amp:4}),
 moth:mkFly('Moth',30,22,120,'#b89a7a','#e8d8b8',G-100,o=>{o.y=G-100+Math.sin(o.ph*4)*26},{fl:10,amp:12}),
 hawk:mkFly('Hawk',50,26,260,'#7a4a2a','#a8723a',G-175,(o,dt,sx)=>{o.y=G-70-Math.max(0,Math.min(1,(sx-260)/260))*105},{beak:1,fl:12,amp:10}),
 balloon:mkFly('Balloon',26,34,60,'#ff3a6a','#ff8aa8',G-100,o=>{o.y=G-100+Math.sin(o.ph*2)*18},{balloon:1,fl:2,amp:1}),
 tumbleweed:mkBall('Tumbleweed',30,260,'#b89a5a','#7a5a2a',{twig:1}),
 spikeball:mkBall('Spiky Ball',26,200,'#6a6a78','#c8c8d8',{spk:1,rot:10}),
 bowling:mkBall('Bowling Ball',24,320,'#2a2a60','#fff',{holes:1,rot:12}),
 snowball:mkBall('Snowball',30,180,'#f4f8ff','#bcd0e8',{face:1,rot:6}),
 centipede:mkSnake('Centipede',60,14,140,'#a83a2a','#e8a03a',9),
 worm:mkSnake('Giant Worm',44,14,55,'#e89a9a','#d07a7a',4)
});
const NEWC=['fox','beetle','ant','scorpion','lizard','zombie','mummy','pirate','clown','wasp','dragonfly','balloon','tumbleweed','spikeball','bowling','centipede','hawk','moth'],NEWF=['badger','wolfpup','beetle','snail','moose','boar','toad','worm','centipede','gnome','scarecrow','hiker','lumberjack','wasp','dragonfly','moth','hawk','snowball','spikeball'];
for(let i=0;i<ENP.length;i++){for(let j=0;j<(i<20?2:3);j++){const k=NEWC[(i*5+j*7)%NEWC.length];if(!ENP[i].includes(k))ENP[i].push(k)}}
for(let i=0;i<ENPF.length;i++){for(let j=0;j<(i<20?2:3);j++){const k=NEWF[(i*5+j*7)%NEWF.length];if(!ENPF[i].includes(k))ENPF[i].push(k)}}
const OBd=(n,w,h,c,dr)=>({n,w,h,c,dr});
const OB={
 haybale:OBd('Hay Bale',48,36,'#d9b84a',(sx,y,w,h)=>{R_(sx,y,w,h,'#d9b84a');x.strokeStyle='#a9842a';x.lineWidth=2;for(let i=1;i<4;i++){x.beginPath();x.moveTo(sx+i*w/4,y);x.lineTo(sx+i*w/4,y+h);x.stroke()}R_(sx,y+h*.4,w,3,'#8a6a1a')}),
 log:OBd('Log',62,26,'#7a4a24',(sx,y,w,h)=>{R_(sx,y,w,h,'#7a4a24');x.strokeStyle='rgba(0,0,0,.3)';x.lineWidth=1.5;for(let i=0;i<4;i++){x.beginPath();x.moveTo(sx+6,y+5+i*5);x.lineTo(sx+w-6,y+5+i*5);x.stroke()}E_(sx+3,y+h/2,5,h/2,'#c8985a');E_(sx+3,y+h/2,2,3,'#7a4a24')}),
 boulder:OBd('Boulder',50,42,'#8a8f96',(sx,y,w,h)=>{x.fillStyle='#8a8f96';x.beginPath();x.moveTo(sx,y+h);x.quadraticCurveTo(sx-2,y+8,sx+w*.4,y);x.quadraticCurveTo(sx+w,y+2,sx+w,y+h);x.fill();x.fillStyle='rgba(255,255,255,.18)';x.beginPath();x.ellipse(sx+w*.38,y+h*.3,w*.2,h*.14,-.4,0,7);x.fill();x.strokeStyle='rgba(0,0,0,.3)';x.lineWidth=1.5;x.beginPath();x.moveTo(sx+w*.6,y+h*.4);x.lineTo(sx+w*.5,y+h*.7);x.stroke()}),
 tires:OBd('Tire Stack',40,44,'#2a2a30',(sx,y,w,h)=>{for(let i=0;i<3;i++){const yy=y+i*h/3;E_(sx+w/2,yy+h/6,w/2,h/6+1,'#26262c');E_(sx+w/2,yy+h/6,w/4,h/12,'#555')}}),
 cone:OBd('Traffic Cone',24,34,'#ff7a1a',(sx,y,w,h)=>{R_(sx-2,y+h-5,w+4,5,'#e8641a');tri(sx+2,y+h-5,sx+w/2,y,sx+w-2,y+h-5,'#ff7a1a');R_(sx+w*.22,y+h*.45,w*.56,5,'#fff')}),
 sandbags:OBd('Sandbags',54,28,'#c8a868',(sx,y,w,h)=>{for(let i=0;i<3;i++)E_(sx+w*(.2+i*.3),y+h*.75,w*.2,h*.25,'#c8a868');for(let i=0;i<2;i++)E_(sx+w*(.35+i*.3),y+h*.35,w*.2,h*.25,'#b89858')}),
 hydrant:OBd('Fire Hydrant',26,40,'#d92b2b',(sx,y,w,h)=>{R_(sx+4,y+8,w-8,h-8,'#d92b2b');E_(sx+w/2,y+8,w/2-2,7,'#e84a3a');R_(sx,y+16,w,6,'#c22');R_(sx+2,y+h-4,w-4,4,'#8a1a1a');E_(sx+w/2,y+3,3,3,'#ddd')}),
 mailbox:OBd('Mailbox',24,46,'#2a5ac8',(sx,y,w,h)=>{R_(sx+w/2-2,y+18,4,h-18,'#555');E_(sx+w/2,y+12,w/2,12,'#2a5ac8');R_(sx+2,y+10,w-4,8,'#2a5ac8');R_(sx+w-3,y+2,3,10,'#e22')}),
 bench:OBd('Park Bench',64,34,'#8a5a2a',(sx,y,w,h)=>{R_(sx+4,y+h*.5,6,h*.5,'#333');R_(sx+w-10,y+h*.5,6,h*.5,'#333');R_(sx,y+h*.45,w,6,'#8a5a2a');R_(sx,y+h*.1,w,5,'#8a5a2a');R_(sx,y+h*.25,w,5,'#8a5a2a');R_(sx+3,y+h*.1,5,h*.4,'#333')}),
 snowman:OBd('Snowman',34,58,'#f4f8ff',(sx,y,w,h)=>{E_(sx+w/2,y+h*.78,w*.5,h*.22,'#f4f8ff');E_(sx+w/2,y+h*.45,w*.36,h*.18,'#f4f8ff');E_(sx+w/2,y+h*.16,w*.27,h*.15,'#f4f8ff');R_(sx+w*.3,y,w*.4,h*.06,'#222');R_(sx+w*.35,y-h*.06,w*.3,h*.08,'#222');tri(sx+w*.3,y+h*.16,sx+w*.05,y+h*.2,sx+w*.3,y+h*.2,'#ff8a1a');E_(sx+w*.4,y+h*.13,1.5,1.5,'#111');E_(sx+w*.6,y+h*.13,1.5,1.5,'#111')}),
 stump:OBd('Tree Stump',40,30,'#7a4a24',(sx,y,w,h)=>{R_(sx+2,y+6,w-4,h-6,'#7a4a24');E_(sx+w/2,y+6,w/2-2,6,'#c8985a');E_(sx+w/2,y+6,w/4,3,'#a87a42');x.strokeStyle='rgba(0,0,0,.3)';x.lineWidth=1;for(let i=0;i<3;i++){x.beginPath();x.moveTo(sx+8+i*9,y+10);x.lineTo(sx+9+i*9,y+h);x.stroke()}}),
 cactus:OBd('Cactus',30,56,'#3a9a4a',(sx,y,w,h)=>{R_(sx+w*.35,y,w*.3,h,'#3a9a4a');R_(sx,y+h*.3,w*.35,w*.2,'#3a9a4a');R_(sx,y+h*.15,w*.2,h*.2,'#3a9a4a');R_(sx+w*.65,y+h*.42,w*.35,w*.2,'#3a9a4a');R_(sx+w*.8,y+h*.25,w*.2,h*.22,'#3a9a4a');x.strokeStyle='#e8f8c8';x.lineWidth=1;for(let i=0;i<6;i++){x.beginPath();x.moveTo(sx+w*.4,y+8+i*8);x.lineTo(sx+w*.3,y+6+i*8);x.stroke()}}),
 bush:OBd('Thorn Bush',52,32,'#2e6a34',(sx,y,w,h)=>{for(let i=0;i<4;i++)E_(sx+w*(.15+i*.23),y+h*(.6-(i%2)*.15),w*.2,h*.38,i%2?'#2e6a34':'#3a8040');for(let i=0;i<6;i++)tri(sx+w*(.1+i*.15),y+h*.5,sx+w*(.14+i*.15),y+h*.15,sx+w*(.18+i*.15),y+h*.5,'#6a4a2a')}),
 beartrap:OBd('Bear Trap',40,14,'#777b84',(sx,y,w,h)=>{E_(sx+w/2,y+h,w/2,h*.4,'#555');for(let i=0;i<7;i++)tri(sx+i*w/7,y+h,sx+i*w/7+w/14,y+2,sx+(i+1)*w/7,y+h,'#c8ccd4');R_(sx,y+h-3,w,3,'#444')}),
 beehive:OBd('Beehive',30,42,'#e8b83a',(sx,y,w,h)=>{R_(sx+w/2-2,y+h*.55,4,h*.45,'#6a4a22');for(let i=0;i<4;i++)E_(sx+w/2,y+h*(.15+i*.12),w*(.38-Math.abs(i-1.5)*.05),h*.1,i%2?'#d9a62a':'#e8b83a');E_(sx+w/2,y+h*.4,4,3,'#222')}),
 anvil:OBd('Anvil',40,30,'#4a4e58',(sx,y,w,h)=>{R_(sx+w*.3,y+h*.55,w*.4,h*.45,'#3a3e48');R_(sx+w*.15,y+h*.85,w*.7,h*.15,'#2a2e38');R_(sx,y,w,h*.35,'#5a5e68');tri(sx+w,y,sx+w*1.2,y+h*.15,sx+w,y+h*.35,'#5a5e68');R_(sx+3,y+2,w-6,3,'rgba(255,255,255,.25)')}),
 picnic:OBd('Picnic Basket',38,30,'#c8883a',(sx,y,w,h)=>{R_(sx,y+h*.3,w,h*.7,'#c8883a');x.strokeStyle='#8a5a1a';x.lineWidth=2;x.beginPath();x.arc(sx+w/2,y+h*.32,w*.38,Math.PI,0);x.stroke();for(let i=0;i<6;i++)R_(sx+3+i*(w-6)/6,y+h*.3,2,h*.7,'#a8682a');R_(sx,y+h*.28,w,5,'#e8a85a');R_(sx+4,y+h*.34,w*.4,7,'#ee4444')}),
 trashbags:OBd('Trash Bags',50,40,'#2a2e34',(sx,y,w,h)=>{E_(sx+w*.3,y+h*.65,w*.28,h*.33,'#1e2228');E_(sx+w*.68,y+h*.7,w*.26,h*.28,'#2a2e34');E_(sx+w*.48,y+h*.4,w*.22,h*.28,'#33383e');tri(sx+w*.4,y+h*.18,sx+w*.48,y,sx+w*.56,y+h*.18,'#33383e');x.fillStyle='rgba(255,255,255,.15)';x.beginPath();x.ellipse(sx+w*.22,y+h*.52,3,6,.5,0,7);x.fill()}),
 cooler:OBd('Cooler',44,30,'#2a8ac8',(sx,y,w,h)=>{R_(sx,y+h*.25,w,h*.75,'#2a8ac8');R_(sx-2,y+h*.15,w+4,h*.2,'#f4f8ff');R_(sx+w*.4,y+h*.05,w*.2,5,'#333');R_(sx+3,y+h*.5,w-6,3,'rgba(255,255,255,.35)')}),
 wire:OBd('Barbed Wire',70,20,'#8a8e96',(sx,y,w,h)=>{R_(sx,y,4,h,'#6a4a22');R_(sx+w-4,y,4,h,'#6a4a22');x.strokeStyle='#8a8e96';x.lineWidth=2;for(let r=0;r<2;r++){x.beginPath();for(let i=0;i<=14;i++)x.lineTo(sx+4+i*(w-8)/14,y+4+r*9+(i%2)*3);x.stroke()}x.strokeStyle='#ccd';x.lineWidth=1.5;for(let i=1;i<7;i++){const px=sx+i*w/7;x.beginPath();x.moveTo(px-3,y+2);x.lineTo(px+3,y+8);x.moveTo(px+3,y+2);x.lineTo(px-3,y+8);x.stroke()}})
};
const OBC=['cone','sandbags','hydrant','mailbox','bench','anvil','trashbags','cooler','tires','wire','snowman','haybale'],OBF=['haybale','log','boulder','stump','bush','beartrap','beehive','picnic','cactus','snowman','tires','trashbags'];
function obPick(){const k=(forestMode?OBF:OBC)[(Math.random()*12)|0];return{k,w:OB[k].w,h:OB[k].h}}

/* ================= SPELLING TEST: classroom scene ================= */
let stt=null;
const testInput=document.createElement('input');testInput.type='text';testInput.id='testWord';testInput.autocomplete='off';testInput.spellcheck=false;testInput.setAttribute('aria-label','Type the spelling word');testInput.placeholder='Type the word, press Enter';document.body.appendChild(testInput);
testInput.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();submitTest()}else if(e.key==='Escape'){e.preventDefault();leaveTest()}});testInput.addEventListener('keyup',e=>e.stopPropagation());
function leaveTest(){testInput.style.display='none';testInput.blur();stt=null;S='title';t=0}
function startSpellTest(){if(!prepareSpellWords())return;lastMode='spelltest';spellActive=false;const w=spellWords.slice();for(let i=w.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[w[i],w[j]]=[w[j],w[i]]}stt={words:w,i:0,ph:'walk',p:0,score:0,miss:[],typed:'',ok:false,streak:0,fx:[],bob:0};testInput.value='';newSong();sound('music');S='spelltest';t=0}
function stPhase(ph){stt.ph=ph;stt.p=0;if(ph==='think'){testInput.value='';setTimeout(()=>{if(S==='spelltest'&&stt&&stt.ph==='think')testInput.focus()},40)}else testInput.blur()}
function stShowDur(){const w=stt.words[stt.i]||'',m=diff==0?1.4:diff==2?.75:1;return Math.max(2.2,(1.5+.5*w.length)*m)}
function stSkip(){if(!stt)return;if(stt.ph==='walk'||stt.ph==='sit')stPhase('show')}
function updateSpellTest(dt){if(!stt)return;const s=stt;s.p+=dt;s.bob=Math.max(0,s.bob-dt);
 if(s.ph==='walk'&&s.p>3.4)stPhase('sit');else if(s.ph==='sit'&&s.p>1.3)stPhase('show');else if(s.ph==='show'&&s.p>stShowDur())stPhase('think');
 else if(s.ph==='result'&&s.p>(s.ok?1.5:2.8)){s.i++;if(s.i>=s.words.length){stPhase('end');sound(s.score>=s.words.length*.6?'coin':'womp')}else stPhase('show')}
 for(const f of s.fx){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=520*dt;f.l-=dt}s.fx=s.fx.filter(f=>f.l>0)}
function submitTest(){if(!stt||stt.ph!=='think')return;const a=testInput.value.toUpperCase().replace(/[^A-Z]/g,''),w=stt.words[stt.i];if(!a)return;stt.typed=a;stt.ok=a===w;if(stt.ok){stt.score++;stt.streak++;stt.bob=.6;sound('coin');for(let i=0;i<46;i++)stt.fx.push({x:480+rnd(-60,60),y:200,vx:rnd(-260,260),vy:rnd(-420,-80),l:rnd(.8,1.6),c:hs(rnd(0,360),90,62)})}else{stt.miss.push(w);stt.streak=0;sound('womp')}stPhase('result')}
function stClick(cx,cy){if(!stt)return;if(cx>=830&&cx<=932&&cy>=14&&cy<=44){leaveTest();return}
 if(stt.ph==='end'){if(cy>=392&&cy<=432){if(cx>=270&&cx<=470)startSpellTest();else if(cx>=490&&cx<=690)leaveTest()}return}stSkip()}
function syncTestInput(){const vis=S==='spelltest'&&stt&&stt.ph==='think';if(!vis){testInput.style.display='none';return}const r=c.getBoundingClientRect();testInput.style.display='block';testInput.style.left=(r.left+r.width*.3)+'px';testInput.style.top=(r.top+r.height*(484/H))+'px';testInput.style.width=(r.width*.4)+'px';testInput.style.height=(r.height*(40/H))+'px';testInput.style.fontSize=Math.max(14,r.height*.04)+'px'}
function drawClassDesk(px,w){x.fillStyle='#7a5230';x.fillRect(px-w/2,386,w,14);x.fillStyle='#9a6a3e';x.fillRect(px-w/2-4,380,w+8,10);x.fillStyle='#5e3e22';x.fillRect(px-w/2+8,400,w-16,60);x.fillStyle='rgba(255,255,255,.12)';x.fillRect(px-w/2-4,380,w+8,2);x.fillStyle='#3e2a16';x.fillRect(px-w/2+10,460,8,16);x.fillRect(px+w/2-18,460,8,16)}
function drawSpellTest(){const s=stt;if(!s)return;const ph=s.ph,px=ph==='walk'?90+Math.min(1,Math.max(0,(s.p-.5)/2.7))*390:480,seated=ph!=='walk';
 let g=x.createLinearGradient(0,0,0,380);g.addColorStop(0,'#f1e3c0');g.addColorStop(1,'#dcc698');x.fillStyle=g;x.fillRect(0,0,W,380);
 x.fillStyle='#5f8a76';x.fillRect(0,300,W,82);x.fillStyle='#45695a';x.fillRect(0,296,W,6);
 const fg=x.createLinearGradient(0,380,0,H);fg.addColorStop(0,'#bf9058');fg.addColorStop(1,'#8a6236');x.fillStyle=fg;x.fillRect(0,382,W,H-382);x.strokeStyle='rgba(60,35,15,.3)';x.lineWidth=2;for(let i=-2;i<14;i++){x.beginPath();x.moveTo(i*80+20,382);x.lineTo(i*150-300,H);x.stroke()}
 // window
 x.fillStyle='#8a5a30';x.fillRect(770,56,158,190);let wg=x.createLinearGradient(0,64,0,238);wg.addColorStop(0,'#8fd2ee');wg.addColorStop(1,'#d9f1c8');x.fillStyle=wg;x.fillRect(778,64,68,174);x.fillRect(852,64,68,174);x.fillStyle='#4a9a52';x.beginPath();x.arc(800,238,40,Math.PI,0);x.arc(890,238,50,Math.PI,0);x.fill();x.fillStyle='rgba(255,255,255,.7)';x.beginPath();x.ellipse(812+Math.sin(t*.3)*8,100,22,8,0,0,7);x.ellipse(890-Math.sin(t*.3)*8,128,26,9,0,0,7);x.fill();
 // wall decor: ABC banner, clock, poster
 const letters='ABCDEFGHIJ';x.fillStyle='rgba(60,40,20,.5)';x.fillRect(290,20,420,2);for(let i=0;i<10;i++){const bx=300+i*40;x.fillStyle=['#e85a5a','#f0b13a','#4cb86a','#4a9ae0','#a06ad8'][i%5];x.beginPath();x.moveTo(bx,22);x.lineTo(bx+34,22);x.lineTo(bx+17,50);x.fill();x.fillStyle='#fff';x.font='bold 15px system-ui';x.textAlign='center';x.fillText(letters[i],bx+17,38)}
 x.fillStyle='#fff';x.beginPath();x.arc(170,100,28,0,7);x.fill();x.strokeStyle='#5a3a20';x.lineWidth=5;x.stroke();x.strokeStyle='#222';x.lineWidth=3;x.beginPath();x.moveTo(170,100);x.lineTo(170+Math.cos(t*.2-1.6)*19,100+Math.sin(t*.2-1.6)*19);x.stroke();x.lineWidth=2;x.beginPath();x.moveTo(170,100);x.lineTo(170+Math.cos(t*.02-1)*13,100+Math.sin(t*.02-1)*13);x.stroke();
 x.fillStyle='#fff7d0';x.fillRect(70,60,70,40);x.fillStyle='#e85a5a';x.fillRect(78,66,54,8);x.fillStyle='#4a9ae0';x.fillRect(78,80,40,5);x.fillRect(78,89,48,5);
 // door
 const o=ph==='walk'?(s.p<.6?s.p/.6:s.p>3?Math.max(0,1-(s.p-3)/.4):1):0;x.fillStyle='#5a3a1e';x.fillRect(20,116,122,266);x.fillStyle='#262838';x.fillRect(28,124,106,258);x.fillStyle='#8b5e34';x.beginPath();x.moveTo(28,124);x.lineTo(28+106*(1-.8*o),124+22*o);x.lineTo(28+106*(1-.8*o),382-14*o);x.lineTo(28,382);x.fill();x.fillStyle='#ffd23f';x.beginPath();x.arc(28+90*(1-.8*o),255,4,0,7);x.fill();x.fillStyle='rgba(255,255,255,.1)';x.fillRect(36,134,26,60);
 // blackboard
 x.fillStyle='#8a5a30';x.fillRect(236,66,488,196);let bg=x.createLinearGradient(0,74,0,254);bg.addColorStop(0,'#2d5a4a');bg.addColorStop(1,'#234a3c');x.fillStyle=bg;x.fillRect(246,76,468,176);x.fillStyle='rgba(255,255,255,.05)';x.beginPath();x.ellipse(420,150,160,40,-.2,0,7);x.fill();x.fillStyle='#6a4524';x.fillRect(236,262,488,10);x.fillStyle='#f4f4f0';x.fillRect(300,258,26,5);x.fillStyle='#f4a6c8';x.fillRect(340,259,18,4);
 // background desks
 for(let r=0;r<2;r++)for(let q=0;q<4;q++){const dx=210+q*180+(r?90:0),dy=330+r*14;if(Math.abs(dx-480)<110&&r==1)continue;x.fillStyle='#8a6038';x.fillRect(dx-34,dy,68,8);x.fillStyle='#5e3e22';x.fillRect(dx-28,dy+8,56,22);x.fillStyle='rgba(0,0,0,.18)';x.fillRect(dx-30,dy+30,60,4)}
 // teacher
 {const tI=who==7?0:7,bob=Math.abs(Math.sin(t*3))*(ph==='result'&&s.ok?10:ph==='result'?0:2);x.save();x.translate(842,440-bob);x.scale(-1.5,1.5);critter(tI,ph==='result'&&s.ok?t*9:0,false,false);x.restore();x.strokeStyle='#caa05a';x.lineWidth=4;x.beginPath();x.moveTo(790,380);x.lineTo(700,250);x.stroke();x.fillStyle='#fff';x.font='bold 11px system-ui';x.textAlign='center';x.fillText('TEACHER',842,456)}
 // board text
 x.textAlign='center';x.fillStyle='#f2f5ee';const w=s.words[s.i]||'';
 if(ph==='walk'||ph==='sit'){x.font='bold 50px "Comic Sans MS",system-ui,cursive';x.fillText('SPELLING TEST',480,150);x.font='22px "Comic Sans MS",system-ui,cursive';x.fillStyle='#ffe58a';x.fillText(s.words.length+' words · watch, then spell!',480,200)}
 else if(ph==='show'){const fs=Math.min(92,Math.floor(430/Math.max(3,w.length)*1.55));x.font='bold '+fs+'px "Comic Sans MS",system-ui,cursive';x.fillText(w,480,168+fs*.2);const dur=stShowDur(),k=1-s.p/dur;x.fillStyle='rgba(255,255,255,.2)';x.fillRect(330,224,300,8);x.fillStyle=k>.3?'#8ef0a8':'#ff9a8a';x.fillRect(330,224,300*k,8);x.font='18px "Comic Sans MS",system-ui,cursive';x.fillStyle='#ffe58a';x.fillText('Remember it!',480,104)}
 else if(ph==='think'||ph==='result'){const L=w.length,sp=Math.min(44,420/L),left=480-L*sp/2;const typed=ph==='think'?testInput.value.toUpperCase().replace(/[^A-Z]/g,''):s.typed;x.font='bold '+Math.min(60,sp*1.3)+'px "Comic Sans MS",system-ui,cursive';for(let i=0;i<L;i++){const cx0=left+i*sp+sp/2;x.fillStyle='#e8f2e0';x.fillRect(cx0-sp*.38,196,sp*.76,4);if(typed[i]){x.fillStyle=ph==='result'?(typed[i]===w[i]?'#8ef0a8':'#ff9a8a'):'#f2f5ee';x.fillText(typed[i],cx0,190)}}
  if(ph==='think'){x.font='24px "Comic Sans MS",system-ui,cursive';x.fillStyle='#ffe58a';x.fillText('Now spell it! ('+L+' letters)',480,120)}
  else{x.font='bold 40px "Comic Sans MS",system-ui,cursive';x.fillStyle=s.ok?'#8ef0a8':'#ff9a8a';x.fillText(s.ok?'✓ Correct!':'✗ Not quite',480,122);if(!s.ok){x.font='bold 24px "Comic Sans MS",system-ui,cursive';x.fillStyle='#ffe58a';x.fillText('It was: '+w,480,238)}}}
 // student
 const run=ph==='walk'?s.p*10:0,wy=ph==='walk'?476:ph==='sit'?476-Math.min(1,s.p/.6)*56:420-(s.bob>0?Math.sin(s.bob/.6*Math.PI)*14:0),front=ph==='walk'||(ph==='sit'&&s.p<.6);
 const drawStudent=()=>{x.save();x.fillStyle='rgba(0,0,0,.25)';x.beginPath();x.ellipse(px,wy+2,44,8,0,0,7);x.fill();x.translate(px,wy);x.scale(1.75,1.75);critter(who,run,false,false);x.restore()};
 if(front){drawClassDesk(480,210);drawStudent()}else{if(seated){x.fillStyle='#7a5230';x.fillRect(px-44,wy-20,88,12)}drawStudent();drawClassDesk(480,210)}
 if(ph==='think'||ph==='result'||ph==='show'){x.fillStyle='#fffdf2';x.fillRect(432,388,96,12);x.strokeStyle='#8a8a9a';x.lineWidth=1;x.beginPath();x.moveTo(436,394);x.lineTo(522,394);x.stroke()}
 for(const f of s.fx){x.globalAlpha=Math.min(1,f.l);x.fillStyle=f.c;x.fillRect(f.x,f.y,7,5)}x.globalAlpha=1;
 // HUD
 x.fillStyle='rgba(12,24,36,.72)';x.beginPath();x.roundRect(20,14,262,30,10);x.fill();x.fillStyle='#fff';x.font='bold 14px system-ui';x.textAlign='left';x.fillText('SPELLING TEST · Word '+Math.min(s.i+1,s.words.length)+'/'+s.words.length+' · ✓ '+s.score,32,34);
 x.fillStyle='rgba(8,6,24,.78)';x.beginPath();x.roundRect(830,14,102,30,9);x.fill();x.strokeStyle='rgba(255,255,255,.35)';x.stroke();x.fillStyle='#fff';x.font='bold 12px system-ui';x.textAlign='center';x.fillText('⌂ MENU',881,34);
 if(s.streak>1&&ph!=='end'){x.fillStyle='#ffd23f';x.font='bold 14px system-ui';x.textAlign='left';x.fillText('🔥 '+s.streak+' in a row',32,62)}
 if(ph==='walk'||ph==='sit'){center('tap or press SPACE to skip',520,13,'rgba(255,255,255,.75)')}
 if(ph==='think')center('Type from memory, then press ENTER',470,13,'#fff7c0');
 if(ph==='end'){x.fillStyle='rgba(7,5,25,.82)';x.fillRect(0,0,W,H);x.fillStyle='rgba(255,255,255,.08)';x.beginPath();x.roundRect(230,80,500,370,18);x.fill();x.strokeStyle='#ffd23f';x.lineWidth=2;x.stroke();const n=s.words.length,pc=s.score/n,gr=pc>=.9?'A':pc>=.8?'B':pc>=.7?'C':pc>=.6?'D':'F';
  center('TEST COMPLETE!',130,34,'#ffd23f');center(s.score+' / '+n+' correct',190,40,'#fff');center('Grade '+gr+(pc==1?' · PERFECT!':pc>=.8?' · Great spelling!':pc>=.6?' · Nice work!':' · Keep practicing!'),228,20,'#8ef0a8');
  if(s.miss.length){center('Words to practice:',270,15,'#ffb89d');const ms=s.miss.slice(0,10).join('  ·  ');center(ms,296,16,'#fff')}else center('No misses. Teacher is crying proud tears.',290,16,'#fff');
  for(const [bx,lb,hot] of [[270,'RETAKE',1],[490,'MENU',0]]){x.fillStyle=hot?'#ffd23f':'rgba(255,255,255,.12)';x.beginPath();x.roundRect(bx,392,200,40,10);x.fill();x.fillStyle=hot?'#10102a':'#fff';x.font='bold 17px system-ui';x.textAlign='center';x.fillText(lb,bx+100,418)}}
}
function mkEn(ks,xw){const k=ks[(Math.random()*ks.length)|0],E=EN[k];return{t:'en',k,x:xw,y:E.y0!==undefined?E.y0:G-E.h,ph:rnd(0,6)}}
function isEn(o){return o.t=='cop'||o.t=='barrel'||o.t=='gull'||o.t=='en'}
function ebox(o,sx){if(o.t=='cop')return[sx+4,G-56,24,56];if(o.t=='barrel')return[sx,G-34,34,34];if(o.t=='gull'){const gy=o.y+Math.sin(o.ph*.4)*6;return[sx,gy,36,22]}const E=EN[o.k];return[sx,o.y,E.w,E.h]}
/* pickup zone follows the drawn raccoon (about 150px tall at 2x), not the small hitbox */
function grabHit(cx,cy){const feet=P.y+P.h,top=feet-(P.h<40?100:190);return Math.abs(cx-(P.x+15))<76&&cy>top&&cy<feet+22}
function knock(o,sx,b){o.dead=1;o.fy=0;o.vx=v+rnd(320,520);o.vy=-rnd(300,520);o.rot=0;o.vr=rnd(9,18);o.pvx=b[0]+b[2]/2-sx;o.pvy=b[1]+b[3]/2;loot+=2;sound('coin');shake=Math.max(shake,.12);
 const cx=b[0]+b[2]/2,cy=b[1]+b[3]/2;burst(cx,cy,'#ffd23f',14);burst(cx,cy,'#fff',8);rings.push({x:cx,y:cy,r:6,l:.35});pops.push({x:o.x,y:b[1]-6,t:'+2',l:.8,col:'#ffd23f'})}
function spin(){if(S==='platformer'){platSpin();return}if((S!='play'&&S!='platformer')||P.spin>0||P.scd>0||P.fall||!P.alive)return;P.spin=.45;P.scd=1.3;P.slide=0;sound('spin');rings.push({x:P.x+20,y:P.y+P.h/2,r:20,l:.45});rings.push({x:P.x+20,y:P.y+P.h/2,r:44,l:.35});burst(P.x+20,P.y+P.h/2,'#fff',14)}
function spinBtn(){if(mobileOn)return;const bx=W-78,by=H-72,r=38,rd=P.scd>0?1-P.scd/1.3:1,rdy=rd>=1;
 x.save();x.fillStyle='rgba(8,6,24,.6)';x.beginPath();x.arc(bx,by,r,0,7);x.fill();
 if(rdy){x.strokeStyle='rgba(255,210,63,'+(.25+.2*Math.sin(t*6))+')';x.lineWidth=8;x.beginPath();x.arc(bx,by,r+3,0,7);x.stroke()}
 x.strokeStyle='rgba(255,255,255,.22)';x.lineWidth=4;x.beginPath();x.arc(bx,by,r-2,0,7);x.stroke();
 x.strokeStyle=rdy?'#ffd23f':'#9ad';x.lineWidth=5;x.beginPath();x.arc(bx,by,r-2,-Math.PI/2,-Math.PI/2+rd*Math.PI*2);x.stroke();
 x.translate(bx,by);x.rotate(P.spin>0?t*20:0);x.strokeStyle=x.fillStyle=rdy?'#fff':'#789';x.lineWidth=4;x.lineCap='round';
 for(let i=0;i<2;i++){const a0=i*Math.PI+.3,a1=a0+2.1;x.beginPath();x.arc(0,0,14,a0,a1);x.stroke();const nx=Math.cos(a1),ny=Math.sin(a1),px=nx*14,py=ny*14;x.beginPath();x.moveTo(px-ny*8,py+nx*8);x.lineTo(px+nx*6,py+ny*6);x.lineTo(px+ny*2,py-nx*2);x.fill()}
 x.restore();x.textAlign='center';x.font='bold 12px system-ui,sans-serif';x.fillStyle=rdy?'#ffd23f':'#9ad';x.fillText('SPIN [X]',bx,by+r+16)}
const birds=Array.from({length:5},()=>({x:rnd(0,W),y:rnd(60,200),p:rnd(0,6),s:rnd(.6,1)}));
const skyline=Array.from({length:40},(_,i)=>({x:i*70,w:rnd(40,66),h:rnd(60,170),win:Array.from({length:14},()=>Math.random()<.45)}));
const boats=Array.from({length:6},(_,i)=>({x:i*420,s:rnd(.8,1.3)}));
function reset(){dist=cp*LEN;base=dist;lvl=cp;v=SPD(lvl);loot=0;objs=[];parts=[];pops=[];rings=[];trail=[];sq=0;dflash=0;celeb=0;conf=[];fw=[];spk=[];nextX=_p=dist+900;shake=0;banner=3;flash=0;spellNotice=0;spellCompletedName='';
P={x:170,worldX:dist+170,y:G-56,vy:0,h:56,jumps:0,slide:0,alive:true,fall:false,run:0,spin:0,scd:0};ammo=5;shots=[];throwCd=0;forestMode=runMode==='free'}
let ammo=5,shots=[],throwCd=0,forestMode=false;
function throwTrash(){if(S==='platformer'){platThrow();return}if(S!=='play'||!P||!P.alive||P.fall||throwCd>0)return;if(ammo<=0){pops.push({x:dist+P.x+30,y:P.y-12,t:'OUT OF TRASH!',l:.9,col:'#ff9a8a'});throwCd=.4;return}
 ammo--;throwCd=.26;sound('spin');shots.push({x:dist+P.x+50,y:P.y+P.h-74,vx:980,vy:-120,rot:0,k:(Math.random()*3)|0,l:2.2});burst(P.x+46,P.y+P.h-74,'#cfd',5)}
function bodyHit(vb){const hx=P.x+20,hy=P.y+P.h,hw=22,hh=P.h*2.4,bx0=vb[0]+8,bx1=vb[0]+vb[2]-8,by0=vb[1]+6,by1=vb[1]+vb[3]-4;return hx+hw>bx0&&hx-hw<bx1&&hy>by0&&hy-hh<by1}
function visBox(b,sx){return[sx+2*(b[0]-sx),G-2*(G-b[1]),2*b[2],2*b[3]]}
function shotTargets(o,sx){if(isEn(o)){const b=ebox(o,sx);return{en:1,raw:b,vis:visBox(b,sx)}}if(o.t=='crate')return{vis:[sx,G-2*o.h,2*o.w,2*o.h],col:o.sk?OB[o.sk].c:forestMode?'#8a8f86':'#7a4a24'};if(o.t=='hang')return{vis:[sx,G-165,72,90],col:'#d9a21b'};if(o.t=='spout')return{vis:[sx,G-150,74,150],col:'#8cd0ff'};return null}
function updateShots(dt){throwCd=Math.max(0,throwCd-dt);
 for(const s of shots){s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=620*dt;s.rot+=dt*16;s.l-=dt;const ssx=s.x-dist;
  if(s.y>G-4){s.l=0;burst(ssx,G-6,'#9a9',6);continue}if(ssx>W+80){s.l=0;continue}
  for(const o of objs){if(o.dead||o.x<-1e8)continue;const osx=o.x-dist;if(osx<-120||osx>W+60)continue;const tg=shotTargets(o,osx);if(!tg)continue;const v2=tg.vis;
   if(ssx>v2[0]-12&&ssx<v2[0]+v2[2]+12&&s.y>v2[1]-12&&s.y<v2[1]+v2[3]+12){s.l=0;
    if(tg.en){knock(o,osx,tg.raw);sound('hit')}else{const ox=o.x;o.x=-1e9;sound('hit');loot+=1;shake=Math.max(shake,.1);const cx=v2[0]+v2[2]/2,cy=v2[1]+v2[3]/2;burst(cx,cy,tg.col,16);burst(cx,cy,'#fff',6);rings.push({x:cx,y:cy,r:6,l:.35});pops.push({x:ox,y:cy-10,t:'SMASH +1',l:.8,col:'#ffd23f'})}
    break}}}
 shots=shots.filter(s=>s.l>0)}
function drawShots(){for(const s of shots){x.save();x.translate(s.x-dist,s.y);x.rotate(s.rot);
  if(s.k==0){x.fillStyle='#2f5a3a';x.beginPath();x.ellipse(0,2,13,12,0,0,7);x.fill();x.fillStyle='#244a2e';x.beginPath();x.moveTo(-4,-9);x.lineTo(0,-17);x.lineTo(4,-9);x.fill();x.fillStyle='rgba(255,255,255,.3)';x.beginPath();x.ellipse(-4,-2,4,6,0,0,7);x.fill()}
  else if(s.k==1){x.fillStyle='#b8c2cc';x.fillRect(-8,-11,16,22);x.fillStyle='#e04b4b';x.fillRect(-8,-4,16,7);x.fillStyle='rgba(255,255,255,.55)';x.fillRect(-6,-10,3,20);x.fillStyle='#8893a0';x.fillRect(-8,-11,16,3)}
  else{x.fillStyle='#7a5a3a';x.beginPath();x.moveTo(-12,-8);x.lineTo(2,-8);x.lineTo(4,2);x.lineTo(13,6);x.lineTo(13,11);x.lineTo(-12,11);x.fill();x.fillStyle='#3a2a1a';x.fillRect(-12,8,25,3)}
  x.restore()}}
function throwBtn(){if(mobileOn)return;const bx=W-168,by=H-72,r=34,rdy=ammo>0&&throwCd<=0;x.save();x.fillStyle='rgba(8,6,24,.66)';x.beginPath();x.arc(bx,by,r,0,7);x.fill();x.strokeStyle=ammo>0?'#8fe08f':'#9a8a8a';x.lineWidth=rdy?4:2.5;x.stroke();
 x.save();x.translate(bx,by-2);x.fillStyle=ammo>0?'#3f8a50':'#667';x.beginPath();x.ellipse(0,3,12,11,0,0,7);x.fill();x.beginPath();x.moveTo(-4,-7);x.lineTo(0,-15);x.lineTo(4,-7);x.fill();x.fillStyle='rgba(255,255,255,.3)';x.beginPath();x.ellipse(-4,0,3,5,0,0,7);x.fill();x.restore();
 x.fillStyle=ammo>0?'#ffd23f':'#a88';x.beginPath();x.arc(bx+24,by-24,11,0,7);x.fill();x.fillStyle='#1a1020';x.font='bold 13px system-ui';x.textAlign='center';x.fillText(ammo,bx+24,by-19);
 x.font='bold 12px system-ui,sans-serif';x.fillStyle=ammo>0?'#8fe08f':'#a99';x.fillText('THROW [T]',bx,by+r+16);x.restore()}
function inGap(wx){return objs.some(o=>o.t=='gap'&&wx>o.x+8&&wx<o.x+o.w-8)}
function spawn(){
 while(nextX<dist+1600){nextX=_p+(nextX-_p)*Math.max(1,v/440)*(1.3-Math.min(lvl,29)/29*.3)*DF[diff].sp;_p=nextX;
  const r=Math.random(),d=Math.min(lvl,29)/29;let o=nextX;if(Math.random()<.13){objs.push({t:'ammo',x:o,y:G-34});nextX+=rnd(260,380);continue}if(Math.random()<(.3+d*.2+(lvl>29?.04:0))*DF[diff].haz){hazard(o);continue}
  if(r<.28){if(Math.random()<.78){const q=obPick();objs.push({t:'crate',x:o,w:q.w,h:q.h,sk:q.k})}else objs.push({t:'crate',x:o,w:44,h:44+(Math.random()<.3?30:0)});nextX+=rnd(420,620)-d*100}
  else if(r<.5){const w=rnd(130,190)+d*50;objs.push({t:'gap',x:o,w});
   for(let i=0;i<6;i++)objs.push({t:'coin',x:o+w*(i/5)-10,y:G-90-Math.sin(i/5*Math.PI)*90});nextX+=w+rnd(380,520)}
  else if(r<.72){objs.push({t:'gull',x:o,y:G-58,ph:rnd(0,6)});nextX+=rnd(420,560)}
  else if(r<.86){for(let i=0;i<7;i++)objs.push({t:'coin',x:o+i*34,y:G-40-(i%2?10:0)});nextX+=rnd(380,500)}
  else{objs.push({t:'gem',x:o,y:G-150});const q=obPick();objs.push({t:'crate',x:o-10,w:q.w,h:Math.min(q.h,48),sk:q.k});nextX+=rnd(460,600)}
 }}
function burst(px,py,col,n){for(let i=0;i<n;i++)parts.push({x:px,y:py,vx:rnd(-160,160),vy:rnd(-220,60),l:rnd(.3,.7),col,s:rnd(2,4)})}
function jump(){
 if(S==='title'){startFromTitle();return}if(S==='spellwin'){replay();return}if((S==='over'||S==='win')&&t>.6){replay();return}if(S==='ready'){sound('music');S=readyFor;return}if(S==='platformer'){platJump();return}if(S!='play')return;
 if(P.jumps<3&&!P.fall){sound('jump');P.vy=P.jumps==0?-640:P.jumps==1?-560:-500;P.jumps++;P.slide=0;burst(P.x+20,P.y+P.h,'#9ad',8);sq=-.7;rings.push({x:P.x+20,y:P.y+P.h,r:6,l:.4})}}
function slide(){if(S==='platformer'){platDash();return}if(S=='play'&&!P.fall){sound('slide');if(P.y+P.h>=G-1){P.slide=.7;P.h=28;P.y=G-28}else P.vy=Math.max(P.vy,700)}}
function prepareSpellWords(){const list=wordInput.value.split(',').map(w=>w.toUpperCase().replace(/[^A-Z]/g,'')).filter(Boolean);if(!list.length){spellError='Add words separated by commas first.';wordInput.focus();return false}if(list.length>40||list.some(w=>w.length>18)){spellError='Use up to 40 words, 18 letters each.';wordInput.focus();return false}spellWords=list;cp=0;spellWordIndex=0;spellLetterIndex=0;spellError='';spellNotice=0;spellCompletedName='';return true}
function advanceSpell(){if(!spellActive||!spellWords[spellWordIndex])return false;spellLetterIndex++;if(spellLetterIndex>=spellWords[spellWordIndex].length){spellCompletedName=spellWords[spellWordIndex];spellWordIndex++;spellLetterIndex=0;spellNotice=2.2;if(spellWordIndex>=spellWords.length){S='spellwin';t=0;return true}}return false}
function replay(){if(lastMode==='spelltest'){startSpellTest();return}if(lastMode==='platformer'){startPlatformer(0);return}beginRunner(lastMode==='free'?'free':'continuous')}
function beginRunner(style='continuous'){lastMode=style==='free'?'free':'runner';if(spellingMode){startSpelling(style);return}spellActive=false;runMode=style;newSong();sound('music');reset();readyFor='play';quip=funnyLines[Math.floor(Math.random()*funnyLines.length)];readyClock=2.5;S='ready';t=0}
function startFromTitle(){beginRunner('continuous')}
function startSpelling(style='continuous'){if(!prepareSpellWords())return;spellActive=true;runMode=style;newSong();sound('music');reset();runMode=style;readyFor='play';quip='Collect each glowing letter in order!';readyClock=2;S='ready';t=0}
function spawnSpellLetter(){if(!spellActive||spellWordIndex>=spellWords.length||objs.some(o=>o.t==='letter'&&!o.got))return;const word=spellWords[spellWordIndex];objs.push({t:'letter',x:dist+P.x+560,y:G-92,ch:word[spellLetterIndex]})}
function syncSpellInput(){const visible=S==='title'&&spellingMode;if(!visible){wordInput.style.display='none';return}const r=c.getBoundingClientRect();wordInput.style.display='block';wordInput.style.left=(r.left+r.width*.25)+'px';wordInput.style.top=(r.top+r.height*(492/H))+'px';wordInput.style.width=(r.width*.5)+'px';wordInput.style.height=(r.height*(26/H))+'px'}
wordInput.addEventListener('input',()=>{spellError=''});wordInput.addEventListener('keydown',e=>{if(e.key==='Enter'&&S==='title'&&spellingMode){e.preventDefault();startSpelling()}});
function pauseGame(){if(S==='play'||S==='platformer'){pausedFrom=S;S='pause'}else if(S==='pause')S=pausedFrom}
function startFunnySequence(next,level){funnyNext=next;funnyLevel=level;funnyLeft=2.4;S='funny';}
const keysDown=new Set();
function setupPlatLevel(){const L=plat.level;plat.x=74;plat.y=G-90;plat.vx=0;plat.vy=0;plat.on=true;plat.camera=0;plat.goal=2730;plat.w=76;plat.h=90;plat.platforms=[];plat.gaps=[];plat.enemies=[];plat.hazards=[];plat.spellLetters=[];plat.coins=[];plat.jumps=0;plat.spin=0;plat.scd=0;plat.dash=0;plat.dcd=0;plat.tcd=0;plat.face=1;plat.shots=[];plat.fx=[];plat.springs=[];plat.saws=[];plat.fires=[];plat.stand=null;plat.crumbT=0;for(let i=0;i<6;i++){const gx=430+i*355+(L%3)*17,gw=94+(L%4)*10;plat.gaps.push({x:gx,w:gw})}for(let i=0;i<8;i++){const px=280+i*300,py=G-(105+((i*61+L*27)%88));plat.platforms.push({x:px,y:py,w:125+(i%3)*20,mv:L>=1&&i%4==2?{a:60,ph:i}:null,cr:L>=1&&i%4==3,fall:0,ox:px,oy:py})}for(let i=0;i<3+Math.floor(L/3);i++){plat.springs.push({x:480+i*620+(L%3)*30,sq:0})}for(let i=0;i<(L>=2?1+Math.floor(L/3):0);i++){plat.saws.push({x:700+i*640+(L%2)*40,y:G-70,ph:i,r:26})}for(let i=0;i<(L>=3?1+Math.floor(L/3):0);i++){plat.fires.push({x:900+i*560+(L%3)*30,ph:i*1.1})}for(let i=0;i<7;i++){const ex=320+i*325;const kinds=['walker','walker','spiky','hopper','flyer','charger','walker'],kd=L<1?'walker':kinds[(i+L)%7],ART={walker:['badger','fox','beetle','ant','lizard','snail','scorpion','gnome','zombie','hiker'],spiky:['spikeball','porcupine','hedgehog'],hopper:['toad','frog'],flyer:['wasp','dragonfly','moth','hawk','balloon','bat'],charger:['boar','wolfpup','bulldog','moose']};plat.enemies.push({x:ex,home:ex,min:ex-55,max:ex+80,vx:(i%2?1:-1)*(80+L*2),dead:false,art:ART[kd][(i*3+L*2)%ART[kd].length],kind:kd,y:kd=='flyer'?G-150-(i%3)*18:G-42,vy:0,ph:i*1.3})}for(let i=0;i<5+Math.floor(L/2);i++){const hx=560+i*370+(L%2)*40;const SKP=['cone','beartrap','sandbags','stump','hydrant','picnic','cooler','wire','mailbox'];plat.hazards.push({x:hx,w:46,h:34,sk:(i+L)%3==0?null:SKP[(i*2+L)%SKP.length]})}if(!spellActive)for(const b of plat.platforms)for(let k=1;k<=3;k++)plat.coins.push({x:b.x+b.w*k/4,y:b.y-30,got:false})}
function startPlatformer(level=0){lastMode='platformer';ammo=5;if(spellingMode){if(!prepareSpellWords())return;spellActive=true}else spellActive=false;runMode='continuous';plat={x:74,y:G-90,vx:0,vy:0,on:true,camera:0,level,loot:0,w:76,h:90};setupPlatLevel();newSong();sound('music');readyFor='platformer';quip=spellActive?'Collect each glowing letter in order!':funnyLines[Math.floor(Math.random()*funnyLines.length)];readyClock=0;S='ready';t=0}
function platJump(){if(!plat||S!=='platformer')return;if(plat.on)plat.jumps=0;else if(!plat.jumps)plat.jumps=1;if(plat.jumps>=3)return;plat.vy=plat.jumps==0?-760:plat.jumps==1?-650:-580;plat.jumps++;plat.on=false;plat.stand=null;sound('jump');plat.fx.push({k:'ring',x:plat.x+plat.w/2,y:plat.y+plat.h,l:.35,m:.35})}
function platSpin(){if(!plat||S!=='platformer'||plat.spin>0||plat.scd>0)return;plat.spin=.45;plat.scd=1.1;sound('spin');plat.fx.push({k:'ring',x:plat.x+plat.w/2,y:plat.y+plat.h/2,l:.45,m:.45,big:1})}
function platDash(){if(!plat||S!=='platformer'||plat.dash>0||plat.dcd>0)return;plat.dash=.22;plat.dcd=.8;plat.face=plat.face||1;sound('slide')}
function platThrow(){if(!plat||S!=='platformer'||plat.tcd>0)return;if(ammo<=0){plat.tcd=.4;plat.fx.push({k:'txt',x:plat.x,y:plat.y-10,t:'OUT OF TRASH!',l:.9,m:.9});return}ammo--;plat.tcd=.28;sound('throw');plat.shots.push({x:plat.x+plat.w/2,y:plat.y+30,vx:(plat.face||1)*620,vy:-120,l:1.6,r:0})}
function platKill(e,w){if(e.dead)return;e.dead=true;ammo=Math.min(9,ammo+1);plat.loot++;loot++;sound('coin');plat.fx.push({k:'txt',x:e.x,y:(e.y||G-40)-10,t:w||'+1',l:.7,m:.7})}
function platformerDie(){if(S!=='platformer')return;sound('womp');S='platdead';t=0}
function updatePlatformer(dt){const speed=300*DF[diff].spd,left=keysDown.has('ArrowLeft')||keysDown.has('KeyA'),right=keysDown.has('ArrowRight')||keysDown.has('KeyD');plat.spin=Math.max(0,plat.spin-dt);plat.scd=Math.max(0,plat.scd-dt);plat.dash=Math.max(0,plat.dash-dt);plat.dcd=Math.max(0,plat.dcd-dt);plat.tcd=Math.max(0,plat.tcd-dt);if(right&&!left)plat.face=1;else if(left&&!right)plat.face=-1;plat.vx=((right?1:0)-(left?1:0))*speed;if(plat.dash>0)plat.vx=plat.face*speed*2.6;plat.x=Math.max(0,plat.x+plat.vx*dt);
for(const b of plat.platforms){if(b.mv){const nx=b.ox+Math.sin(t*1.6+b.mv.ph)*b.mv.a,d=nx-b.x;b.x=nx;if(plat.stand===b)plat.x+=d}if(b.cr&&b.fall>0){b.fall+=dt;if(b.fall>.55){b.y+=(b.fall-.55)*(b.fall-.55)*2600*dt+300*dt;if(b.y>H+80){b.y=b.oy;b.fall=0}}}}
if(plat.dash>0&&Math.random()<.6)plat.fx.push({k:'dot',x:plat.x+plat.w/2,y:plat.y+plat.h/2+(Math.random()-.5)*50,l:.25,m:.25});const oldY=plat.y,oldBottom=oldY+plat.h;plat.vy+=1850*dt;plat.y+=plat.vy*dt;plat.on=false;const overlap=(a,b)=>plat.x+plat.w-8>a&&plat.x+8<a+b;plat.stand=null;for(const b of plat.platforms)if(!(b.cr&&b.fall>.55)&&overlap(b.x,b.w)&&oldBottom<=b.y+8&&plat.y+plat.h>=b.y&&plat.vy>=0){plat.y=b.y-plat.h;plat.vy=0;plat.on=true;plat.stand=b;if(b.cr&&!b.fall)b.fall=.001}const mid=plat.x+plat.w/2,inGap=plat.gaps.some(g=>mid>g.x&&mid<g.x+g.w);if(!inGap&&oldBottom<=G&&plat.y+plat.h>=G&&plat.vy>=0){plat.y=G-plat.h;plat.vy=0;plat.on=true}if(plat.on)plat.jumps=0;for(const sp of plat.springs)if(overlap(sp.x,50)&&plat.vy>0&&plat.y+plat.h>=G-24&&plat.y+plat.h<=G+14&&oldBottom<=G+2){plat.vy=-1050;plat.on=false;plat.jumps=1;sp.sq=.3;sound('jump')}for(const sp of plat.springs)sp.sq=Math.max(0,sp.sq-dt);for(const sw of plat.saws){const sy=G-60-Math.abs(Math.sin(t*1.8+sw.ph))*70;sw.y=sy;if(plat.dash<=0&&Math.hypot(plat.x+plat.w/2-sw.x,plat.y+plat.h/2-sy)<sw.r+30)platformerDie()}for(const f of plat.fires){f.on=Math.sin(t*2.2+f.ph)>-.25;if(f.on&&overlap(f.x,46)&&plat.y+plat.h>G-52&&plat.y+plat.h<G+5)platformerDie()}for(const h of plat.hazards)if(overlap(h.x,h.w)&&plat.y+plat.h>G-h.h+8&&plat.y+plat.h<G+5)platformerDie();for(const e of plat.enemies){if(e.dead)continue;const k=e.kind;if(k=='flyer'){e.x+=e.vx*.8*dt;e.y=e.y0===undefined?(e.y0=e.y):e.y0;e.y=e.y0+Math.sin(t*3+e.ph)*34;if(e.x<e.min-60||e.x>e.max+60)e.vx*=-1}else if(k=='charger'){const dx=plat.x-e.x;if(Math.abs(dx)<380){e.x+=Math.sign(dx)*190*dt;e.warn=1}else{e.warn=0;e.x+=e.vx*dt;if(e.x<e.min||e.x>e.max)e.vx*=-1}}else if(k=='hopper'){e.x+=e.vx*.7*dt;e.vy+=1500*dt;e.y+=e.vy*dt;if(e.y>=G-42){e.y=G-42;e.vy=-560}if(e.x<e.min||e.x>e.max)e.vx*=-1}else{e.x+=e.vx*dt;if(e.x<e.min||e.x>e.max)e.vx*=-1}const ey=k=='walker'||k=='spiky'||k=='charger'?G-42:e.y,ew=44,eh=42;
if(plat.spin>0&&Math.hypot(plat.x+plat.w/2-(e.x+22),plat.y+plat.h/2-(ey+21))<95){platKill(e,'SPIN!');continue}
if(overlap(e.x,ew)&&plat.y+plat.h>ey+8&&plat.y<ey+eh){if(plat.dash>0){platKill(e,'DASH!');continue}if(k!='spiky'&&plat.vy>80&&oldBottom<=ey+20){platKill(e);plat.vy=-430;plat.jumps=Math.min(plat.jumps,1)}else platformerDie()}}
for(const sh of plat.shots){sh.l-=dt;sh.vy+=900*dt;sh.x+=sh.vx*dt;sh.y+=sh.vy*dt;sh.r+=dt*14;if(sh.y>G-8){sh.y=G-8;sh.vy*=-.4;sh.vx*=.8}for(const e of plat.enemies){if(e.dead)continue;const ey=(e.kind=='flyer'||e.kind=='hopper')?e.y:G-42;if(sh.x>e.x-8&&sh.x<e.x+52&&sh.y>ey-8&&sh.y<ey+50){platKill(e,'HIT!');sh.l=0;sound('hit')}}}plat.shots=plat.shots.filter(q=>q.l>0);for(const f of plat.fx)f.l-=dt;plat.fx=plat.fx.filter(f=>f.l>0);
for(const q of plat.coins)if(!q.got&&overlap(q.x-30,60)&&plat.y<q.y+50&&plat.y+plat.h>q.y-24){q.got=true;loot++;plat.loot++;sound('coin');burst(q.x-plat.camera,q.y,'#ffd23f',8)}if(spellActive&&spellWordIndex<spellWords.length){let letter=plat.spellLetters.find(q=>!q.got);const onPlat=()=>plat.platforms.find(b=>b.x+b.w/2>plat.x+240);if(!letter){const word=spellWords[spellWordIndex],pb=onPlat();let lx,ly=G-54;if(pb){lx=pb.x+pb.w/2;ly=pb.y-34}else{lx=Math.min(plat.goal-70,plat.x+300);for(const g of plat.gaps)if(lx>g.x-45&&lx<g.x+g.w+45)lx=g.x+g.w+75;for(const h of plat.hazards)if(Math.abs(lx-h.x)<80)lx=h.x+100}letter={x:lx,y:ly,ch:word[spellLetterIndex],got:false};plat.spellLetters.push(letter)}else if(letter.x<plat.x-120){const pb=onPlat();if(pb){letter.x=pb.x+pb.w/2;letter.y=pb.y-34}else{letter.x=Math.min(plat.goal-70,plat.x+260);letter.y=G-54}}if(overlap(letter.x-18,36)&&plat.y<letter.y+30&&plat.y+plat.h>letter.y-30){letter.got=true;loot++;sound('coin');burst(letter.x-plat.camera,letter.y,'#61e5c1',10);if(advanceSpell())return}}if(plat.y>H+70)platformerDie();plat.camera=Math.max(0,Math.min(plat.goal-W+180,plat.x-245));if(plat.x+plat.w>=plat.goal){mark(plat.level,2);plat.level++;if(plat.level>=10){if(spellActive){plat.level=0;setupPlatLevel();readyFor='platformer';startFunnySequence('ready',0);return}plat.level=9;startFunnySequence('platwin',10);return}setupPlatLevel();quip=spellActive?'Collect each glowing letter in order!':funnyLines[Math.floor(Math.random()*funnyLines.length)];readyFor='platformer';startFunnySequence('ready',plat.level)}}
addEventListener('keydown',e=>{if(e.target===wordInput)return;if(S==='spelltest'){if(e.code==='Escape'){leaveTest();return}if(e.code==='KeyM'){toggleMute();return}if(stt&&stt.ph==='end'&&['Space','Enter'].includes(e.code)){e.preventDefault();startSpellTest();return}if(['Space','Enter'].includes(e.code)){e.preventDefault();stSkip()}return}keysDown.add(e.code);if(e.code==='KeyV'||e.code==='KeyQ'){e.preventDefault();if(!e.repeat)slide();return}if(e.code==='KeyT'||e.code==='KeyF'){e.preventDefault();if(!e.repeat)throwTrash();return}if(S==='spellwin'&&['Space','Enter'].includes(e.code)){replay();return}if(e.code==='Escape'&&S==='tutorial'){S='title';return}if(e.code==='Escape'||e.code==='KeyP'){e.preventDefault();pauseGame();return}if(e.code==='KeyM'){toggleMute();return}if(S==='platdead'&&['Space','Enter'].includes(e.code)){startPlatformer(plat.level);return}if(S=='gallery'){galKey(e);return}if(S==='animalgallery'){if(e.code==='Escape')S='title';return}if((S==='platformer'||S==='play')&&['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(e.code)){e.preventDefault()}if(e.code=='KeyG'&&S!='play'){e.preventDefault();openGal();return}if(e.code=='KeyC'&&S!='play'){setCh(who+1);return}if(['KeyX','KeyZ','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();if(!e.repeat)spin();return}if(S!='play'&&S!='platformer'&&['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(e.code)){e.preventDefault();diff=Math.max(0,Math.min(2,diff+(e.code=='ArrowLeft'||e.code=='KeyA'?-1:1)));return}
 if(['Space','ArrowUp','KeyW'].includes(e.code)){e.preventDefault();if(!e.repeat){if(S==='title')startFromTitle();else if(S==='platwin')startPlatformer();else jump()}}
 if(['ArrowDown','KeyS'].includes(e.code)){e.preventDefault();slide()}});addEventListener('keyup',e=>keysDown.delete(e.code));
c.addEventListener('pointerdown',e=>{const r=c.getBoundingClientRect();{const mx=(e.clientX-r.left)/r.width*W,my=(e.clientY-r.top)/r.height*H;if(inRect(mx,my,MUTE)){toggleMute();return}}if(S==='play')runnerPointerX=e.clientX;
 if(S=='intro'){stopIntroSong();S='title';t=0;return}
 if(S==='funny'){S=funnyNext;if(S==='win')t=0;if(S==='ready')readyFor='platformer';return}if(S==='animalgallery'){const px=(e.clientX-r.left)/r.width*W,py=(e.clientY-r.top)/r.height*H;if(py>500&&px<170){S='title';return}if(py>=91&&py<508&&px>=28&&px<940){const col=Math.floor((px-28)/304),row=Math.floor((py-91)/104),idx=row*3+col;if(idx<CH.length)setCh(idx)}return}if(S=='gallery'){galClick(e,r);return}if(S!='play'&&galHit(e,r)){openGal();return}
 const cx=(e.clientX-r.left)/r.width*W,cy=(e.clientY-r.top)/r.height*H;if(S==='spelltest'){stClick(cx,cy);return}if(S==='pause'){if(cy>280&&cy<370){if(cx<W/2)S=pausedFrom;else S='title'}return}if((S==='play'||S==='platformer')&&cy>70&&cy<115&&cx>825){S='title';return}if((S==='play'||S==='platformer')&&cy>70&&cy<115&&cx>720){pauseGame();return}if(S==='play'&&cx>W-130&&cy>H-220&&cy<H-125){slide();return}if(S==='play'&&cy>H-125&&cx>W-212&&cx<=W-130){throwTrash();return}if(S==='play'&&cy>H-125&&cx>W-130){spin();return}if(S==='ready'){sound('music');S=readyFor;return}if(S==='platformer'){if(cy>H-112){if(cx<140)keysDown.add('ArrowLeft');else if(cx<280)keysDown.add('ArrowRight');else if(cx<639)platJump();else if(cx<741)platSpin();else if(cx<843)platThrow();else platDash()}else if(cx<W*.32)keysDown.add('ArrowLeft');else if(cx<W*.57)keysDown.add('ArrowRight');else platJump();return}if(S==='platdead'){if(cx>W/2&&cy>300)S='title';else startPlatformer(plat.level);return}if(S==='platwin'){startPlatformer();return}
 if(S==='tutorial'){S='title';return}if(S=='title'){if(inRect(cx,cy,TL.how)){tutorialTime=0;S='tutorial';return}if(inRect(cx,cy,TL.ani)){S='animalgallery';return}const ci=tlChar(cx,cy);if(ci>=0){setCh(ci);return}const di=tlDiff(cx,cy);if(di>=0){diff=di;return}const mi=tlMode(cx,cy);if(mi===0){startFromTitle();return}if(mi===1){startPlatformer();return}if(mi===2){beginRunner('free');return}if(mi===3){if(!spellingMode||!wordInput.value.trim()){spellingMode=true;spellError='Paste your words above, then click SPELLING TEST again.';wordInput.focus();return}startSpellTest();return}if(inRect(cx,cy,TL.spl)){spellingMode=!spellingMode;spellError='';if(spellingMode)wordInput.focus();return}}
 if(S==='title')return;if(S==='spellwin'){replay();return}(e.clientX-r.left<r.width*.6||S!='play')?jump():slide()});addEventListener('pointerup',()=>{keysDown.delete('ArrowLeft');keysDown.delete('ArrowRight')});c.addEventListener('pointermove',e=>{if(S==='play'&&e.buttons&&runnerPointerX!==null){const r=c.getBoundingClientRect(),dx=(e.clientX-runnerPointerX)*W/r.width;P.x=Math.max(90,Math.min(520,P.x+dx));runnerPointerX=e.clientX}if(S!=='title'){bioHover=-1;modeHover=-1;c.style.cursor='default';return}const r=c.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*W,py=(e.clientY-r.top)/r.height*H;bioHover=tlChar(px,py);modeHover=tlMode(px,py);c.style.cursor=(inRect(px,py,TL.how)||inRect(px,py,TL.ani)||bioHover>=0||tlDiff(px,py)>=0||inRect(px,py,TL.spl)||modeHover>=0||galHit({clientX:e.clientX,clientY:e.clientY},r))?'pointer':'default'});
function die(f){if(S!=='play')return;sound('womp');cp=lvl;P.alive=false;S='over';t=0;shake=.4;burst(P.x+20,P.y+30,'#f55',30);dflash=1;celeb=0;conf=[];fw=[];spk=[];
 if(sc()>hi){hi=sc();try{localStorage.setItem('bb2',hi)}catch(e){}}}
function update(dt){
 t+=dt;if(S==='ready'){readyClock-=dt;if(readyClock<=0){S=readyFor;t=0}return}if(S==='tutorial'){tutorialTime+=dt;return}if(S==='funny')return;if(S==='spelltest'){updateSpellTest(dt);return}if(S==='platformer'){updatePlatformer(dt);return}if(S==='pause'||S==='platwin')return;if(S=='intro'){introT+=dt;if(introT>=15){introT=15;stopIntroSong();S='title';t=0}}shake=Math.max(0,shake-dt);banner=Math.max(0,banner-dt);flash=Math.max(0,flash-dt*1.5);bump=Math.max(0,bump-dt*4);dflash=Math.max(0,dflash-dt*.8);sq+=(0-sq)*Math.min(1,dt*10);
 if(S=='play'){
  v+=(SPD(lvl)-v)*dt;if(runMode==='continuous'){dist+=v*dt;const steer=(keysDown.has('ArrowRight')||keysDown.has('KeyD')?1:0)-(keysDown.has('ArrowLeft')||keysDown.has('KeyA')?1:0);P.x=Math.max(90,Math.min(520,P.x+steer*320*dt));P.worldX=dist+P.x}else{const steer=(keysDown.has('ArrowRight')||keysDown.has('KeyD')?1:0)-(keysDown.has('ArrowLeft')||keysDown.has('KeyA')?1:0);P.worldX=Math.max(lvl*LEN+80,Math.min((lvl+1)*LEN+180,P.worldX+steer*350*dt));dist=Math.max(lvl*LEN,P.worldX-520);P.x=P.worldX-dist}spawn();if(spellActive)spawnSpellLetter();
  const nl=Math.floor((runMode==='continuous'?dist:P.worldX)/LEN);
  if(!spellActive&&nl>lvl){const finalLevel=nl>=NM;if(finalLevel){mark(NM-1);awardTrash(NM-1);cp=0;const scoreNow=sc();if(scoreNow>hi){hi=scoreNow;try{localStorage.setItem('bb2',hi)}catch(e){}}burst(200,P.y,'#ffd23f',40);celebrate(NM);lvl=NM-1;startFunnySequence('win',NM)}else{mark(nl-1);awardTrash(nl-1);lvl=nl;banner=5;flash=1;loot+=10;celebrate(nl);burst(200,P.y,'#ffd23f',30);startFunnySequence('play',nl)}return}
  P.slide=Math.max(0,P.slide-dt);P.spin=Math.max(0,P.spin-dt);P.scd=Math.max(0,P.scd-dt);if(P.spin>0)P.slide=0;P.h=P.slide>0?28:56;P.run+=dt*v/38;
  P.vy+=1700*dt*(P.spin>0?.4:1);P.y+=P.vy*dt;
  const cx=dist+P.x+30;
  if(!P.fall&&P.vy>=0&&P.y+P.h>=G&&P.y+P.h<G+30&&!inGap(cx)){if(P.vy>260){sq=Math.min(1,P.vy/800);for(let i=0;i<9;i++)parts.push({x:P.x+20+rnd(-12,12),y:G-2,vx:rnd(-200,40),vy:rnd(-80,-10),l:rnd(.3,.5),col:'#cdb48a',s:rnd(2,4)});rings.push({x:P.x+20,y:G,r:8,l:.35})}P.y=G-P.h;P.vy=0;P.jumps=0}
  else if(P.y+P.h>G+10&&inGap(cx)&&!P.fall){P.fall=true;burst(P.x+20,G,'#6cf',20);rings.push({x:P.x+20,y:G+8,r:8,l:.8});rings.push({x:P.x+20,y:G+8,r:2,l:.6})}
  if(P.y+P.h<G-6&&!P.fall)trail.push({x:P.x+20,y:P.y,h:P.h,d:dist,l:.25});if(P.y>H+40)die();
  const px=P.x+5,pw=30,py=P.y+6,ph=P.h-6;
  for(const o of objs){const sx=o.x-dist;if(sx<-300||sx>W+50)continue;
   if(o.dead){o.x+=o.vx*dt;o.fy+=o.vy*dt;o.vy+=900*dt;o.rot+=o.vr*dt;continue}
   if(runMode==='free'&&isEn(o)&&!o.act){if(sx<W-30){o.act=1;pops.push({x:o.x+8,y:G-190,t:'!',l:.8,col:'#ffec6a'})}else continue}
   if(P.spin>0&&isEn(o)){const b=ebox(o,sx),fr=runMode==='free',bb=fr?visBox(b,sx):b,cx0=fr?P.x+20:px+pw/2,cy0=fr?P.y+P.h-65:py+ph/2,nx=Math.max(bb[0],Math.min(cx0,bb[0]+bb[2])),ny=Math.max(bb[1],Math.min(cy0,bb[1]+bb[3]));if((nx-cx0)*(nx-cx0)+(ny-cy0)*(ny-cy0)<(fr?12100:4356)){knock(o,sx,b);continue}}
   if(runMode==='free'&&(isEn(o)||o.t=='crate')){const tg=shotTargets(o,sx);if(tg&&bodyHit(tg.vis))die()}
   if(o.t=='en'){const E=EN[o.k];o.ph+=dt;o.x-=(runMode==='free'?Math.max(E.s,130):E.s)*dt;if(E.st)E.st(o,dt,sx);else if(runMode==='free'&&E.y0!==undefined){const ty=P.y+P.h*.5;o.y=Math.max(E.y0-34,Math.min(E.y0+34,o.y+(ty-o.y)*.9*dt))}if(runMode!=='free'&&px+pw>sx+4&&px<sx+E.w-4&&py<o.y+E.h-3&&py+ph>o.y+3)die()}
   if(o.t=='cop'||o.t=='barrel'){o.x-=(o.t=='cop'?150:260)*dt;o.ph+=dt*(o.t=='cop'?8:9)}
   if(runMode!=='free'&&o.t=='cop'&&px+pw>sx+6&&px<sx+28&&py+ph>G-58)die();
   if(runMode!=='free'&&o.t=='barrel'&&px+pw>sx+4&&px<sx+30&&py+ph>G-32)die();
   if(o.t=='hang'&&px+pw>sx+6&&px<sx+28&&py<G-42)die();
   if(o.t=='spout'){const sp=(t+o.off)%2.4;if(sp>1.7&&px+pw>sx+6&&px<sx+30&&py+ph>G-76)die()}
   if(runMode!=='free'&&o.t=='crate'&&px+pw>sx+4&&px<sx+o.w-4&&py+ph>G-o.h+4){die()}
   if(o.t=='gull'){if(runMode==='free')o.x-=150*dt;o.ph+=dt*8;const gx=sx-dt*0,gy=o.y+Math.sin(o.ph*.4)*6;
    if(runMode!=='free'&&px+pw>gx&&px<gx+36&&py<gy+22&&py+ph>gy)die()}
   if((o.t=='coin'||o.t=='gem'||o.t=='letter')&&!o.got&&(o.t==='letter'?(spellActive&&Math.abs((sx+20)-(px+20))<38&&(2*(o.y+Math.sin(t*5+o.x*.02)*3)-G)>=py-28&&(2*(o.y+Math.sin(t*5+o.x*.02)*3)-G)<=py+ph+28):grabHit(o.t==='gem'?sx:sx+16,2*(o.y+(o.t==='gem'?Math.sin(t*3)*5:0))-G))){
    o.got=1;sound('coin');loot+=o.t=='gem'?5:1;pops.push({x:o.x,y:o.t=='letter'?o.y-14:2*o.y-G-24,t:o.t=='letter'?o.ch:o.t=='gem'?'+5':'+1',l:.8,col:o.t=='letter'?'#61e5c1':o.t=='gem'?'#f8f':'#fd4'});burst(sx+(o.t=='coin'?16:0),o.t=='letter'?o.y:2*o.y-G,o.t=='letter'?'#61e5c1':o.t=='gem'?'#f8f':'#fd4',10);if(o.t=='letter'&&advanceSpell())return;}}
  for(const o of objs)if(o.t=='ammo'&&!o.got){const sx=o.x-dist;if(grabHit(sx+16,2*o.y-G)){o.got=1;ammo=Math.min(9,ammo+2);sound('coin');pops.push({x:o.x,y:2*o.y-G-24,t:'+2 TRASH',l:.9,col:'#8fe08f'});burst(sx+16,2*o.y-G,'#8fe08f',8)}}
  updateShots(dt);
  objs=objs.filter(o=>o.x-dist>-300&&!(o.dead&&(o.x-dist>W+60||o.fy>560)));
  if(P.alive&&Math.random()<.5)parts.push({x:170,y:Math.min(P.y+P.h,G),vx:-v*.3,vy:rnd(-40,0),l:.3,col:'#8a7',s:2})
 }
 for(const p of parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=500*dt;p.l-=dt}for(const p of pops){p.y-=36*dt;p.l-=dt}for(const r of rings){r.r+=110*dt;r.l-=dt}for(const q of trail)q.l-=dt;
 celeb=Math.max(0,celeb-dt);trashToast=Math.max(0,trashToast-dt);spellNotice=Math.max(0,spellNotice-dt);
 if(S=='win'){if(Math.random()<.05)fw.push({x:rnd(100,W-100),y:H,ty:rnd(80,260),d:0,vy:-520,c:rnd(0,360)});if(Math.random()<.5)conf.push({x:rnd(0,W),y:-10,vx:rnd(-60,60),vy:rnd(120,300),r:rnd(0,6),vr:rnd(-8,8),w:rnd(6,11),h:rnd(4,8),c:hs(rnd(0,360),90,60),l:5})}
 for(const f of fw){if(f.d>0){f.d-=dt;continue}f.y+=f.vy*dt;if(Math.random()<.8)spk.push({x:f.x,y:f.y,vx:rnd(-10,10),vy:rnd(0,30),l:.3,c:f.c,s:2});
  if(f.y<=f.ty){f.done=1;for(let i=0;i<46;i++){const a=i/46*6.283,sp=rnd(90,230);spk.push({x:f.x,y:f.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,l:rnd(.8,1.4),c:f.c+rnd(-20,20),s:3})}}}
 fw=fw.filter(f=>!f.done);
 for(const s of spk){s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=160*dt;s.vx*=.99;s.l-=dt}
 spk=spk.filter(s=>s.l>0);
 for(const c of conf){c.x+=c.vx*dt+Math.sin(t*3+c.r)*20*dt;c.y+=c.vy*dt;c.r+=c.vr*dt;c.l-=dt}
 conf=conf.filter(c=>c.l>0&&c.y<H+20);
 parts=parts.filter(p=>p.l>0);pops=pops.filter(p=>p.l>0);rings=rings.filter(r=>r.l>0);trail=trail.filter(q=>q.l>0);
}
function sky(){
 let g=x.createLinearGradient(0,0,0,G);const L=M[4];g.addColorStop(0,hs(M[1],55,6+L*38));g.addColorStop(.55,hs((M[1]+M[2])/2,50,16+L*38));g.addColorStop(.85,hs(M[2],65,32+L*34));g.addColorStop(1,hs(M[2],90,52+L*28));
 x.fillStyle=g;x.fillRect(0,0,W,H);
 // aurora ribbons (Aurora Bay)
 if(!forestMode&&(lvl==18||lvl==54||lvl==55)){for(let i=0;i<3;i++){let a=x.createLinearGradient(0,60,0,230);a.addColorStop(0,'rgba(80,255,170,0)');a.addColorStop(.5,'hsla('+(140+i*50+Math.sin(t+i)*20)+',90%,60%,.22)');a.addColorStop(1,'rgba(80,255,170,0)');x.fillStyle=a;x.beginPath();x.moveTo(0,120);for(let px=0;px<=W;px+=40)x.lineTo(px,110+i*28+Math.sin(px*.012+t*.8+i*2)*30);x.lineTo(W,260);x.lineTo(0,260);x.fill()}}
 for(const s of stars){x.globalAlpha=(.5+.5*Math.sin(t*2+s.p))*Math.max(0,1-M[4]*1.3);x.fillStyle='#fff';x.beginPath();x.arc(s.x,s.y,s.r,0,7);x.fill()}
 x.globalAlpha=1;
 // shooting stars
 if(L<.5){if(!shoot&&Math.random()<.006)shoot={x:rnd(300,W),y:rnd(10,110),l:1};
  if(shoot){x.globalAlpha=Math.max(0,shoot.l);let sg=x.createLinearGradient(shoot.x,shoot.y,shoot.x+90,shoot.y-40);sg.addColorStop(0,'#fff');sg.addColorStop(1,'rgba(255,255,255,0)');x.strokeStyle=sg;x.lineWidth=2;x.beginPath();x.moveTo(shoot.x,shoot.y);x.lineTo(shoot.x+90,shoot.y-40);x.stroke();shoot.x-=10;shoot.y+=4.5;shoot.l-=.03;x.globalAlpha=1;if(shoot.l<=0)shoot=null}}
 // sun (day) or moon (night)
 const sx0=760,sy0=110;
 let m=x.createRadialGradient(sx0,sy0,10,sx0,sy0,170);m.addColorStop(0,L>.55?'rgba(255,230,150,.7)':'rgba(255,245,210,.55)');m.addColorStop(1,'rgba(255,245,210,0)');
 x.fillStyle=m;x.fillRect(560,0,400,320);
 if(L>.55){x.save();x.translate(sx0,sy0);x.rotate(t*.1);x.fillStyle='rgba(255,230,130,.35)';for(let i=0;i<12;i++){x.rotate(Math.PI/6);x.beginPath();x.moveTo(-8,-46);x.lineTo(0,-86-(i%2)*14);x.lineTo(8,-46);x.fill()}x.restore();x.fillStyle='#fff2b0';x.beginPath();x.arc(sx0,sy0,38,0,7);x.fill()}
 else{x.fillStyle='#fff6d8';x.beginPath();x.arc(sx0,sy0,38,0,7);x.fill();
  x.fillStyle='#e6dcb8';[[748,100,8],[772,125,6],[768,92,4]].forEach(a=>{x.beginPath();x.arc(a[0],a[1],a[2],0,7);x.fill()})}
 // drifting clouds
 for(const c of clouds){const cx=((c.x-t*c.sp*20-dist*.03)%(W+400)+(W+400))%(W+400)-200;
  x.fillStyle='hsla('+(M[1]%360)+',35%,'+(18+L*68)+'%,'+(.22+L*.3)+')';
  for(const q of[[0,0,26],[28,-8,32],[58,0,24],[28,8,26]]){x.beginPath();x.ellipse(cx+q[0]*c.s,c.y+q[1]*c.s,q[2]*c.s*1.3,q[2]*c.s*.6,0,0,7);x.fill()}}
 // distant birds
 if(L>=.1){x.strokeStyle='rgba(20,20,40,.55)';x.lineWidth=2;for(const b of birds){const bx=((b.x-t*30*b.s-dist*.05)%1100+1100)%1100-70,by=b.y+Math.sin(t+b.p)*10,fl=Math.sin(t*8+b.p)*5;x.beginPath();x.moveTo(bx-9,by-fl);x.quadraticCurveTo(bx-4,by+2,bx,by);x.quadraticCurveTo(bx+4,by+2,bx+9,by-fl);x.stroke()}}
}
function city0(){
 const off=(dist*.08)%2800;
 for(const b of skyline){let bx=((b.x-off)%2800+2800)%2800-200;if(bx>W)continue;
  x.fillStyle=hs(M[1],45,9+M[4]*16);x.fillRect(bx,G-60-b.h,b.w,b.h+60);
  b.win.forEach((w,i)=>{if(w&&M[4]<.6){x.fillStyle=(i%5==0)?'#ffcf7a':'#f2a65a';x.fillRect(bx+6+(i%4)*12,G-52-b.h+Math.floor(i/4)*16,6,8)}})}
 // lighthouse
 const lx=((620-dist*.12)%1800+1800)%1800-100;
 if(lx<W+100){x.fillStyle=hs(M[1],45,7+M[4]*12);x.beginPath();x.moveTo(lx,G-60);x.lineTo(lx+14,G-260);x.lineTo(lx+36,G-260);x.lineTo(lx+50,G-60);x.fill();
  x.fillStyle='#ffe08a';x.fillRect(lx+16,G-278,18,18);
  const a=Math.sin(t*1.2)*.5;x.save();x.translate(lx+25,G-269);x.rotate(a-.3);
  let bm=x.createLinearGradient(0,0,-420,0);bm.addColorStop(0,'rgba(255,240,170,.35)');bm.addColorStop(1,'rgba(255,240,170,0)');
  x.fillStyle=bm;x.beginPath();x.moveTo(0,0);x.lineTo(-420,-40);x.lineTo(-420,40);x.fill();x.restore()}
}
function drawBiomeScenery(){const theme=Math.floor(lvl/10)%6,scroll=(dist*.18)%1120;x.save();x.globalAlpha=.8;for(let i=-1;i<10;i++){const bx=i*145-scroll; x.fillStyle=['#263f34','#665136','#473455','#263b42','#38363e','#285056'][theme];if(theme===0||theme===3){x.beginPath();x.moveTo(bx,G-62);x.lineTo(bx+55,G-205-(i%3)*22);x.lineTo(bx+110,G-62);x.fill();if(theme===3){x.fillStyle='#b7833c';x.fillRect(bx+32,G-170,48,42);x.fillRect(bx+42,G-185,28,15)}}else if(theme===1){x.fillRect(bx+40,G-150,20,90);x.beginPath();x.moveTo(bx,G-150);x.lineTo(bx+50,G-230);x.lineTo(bx+100,G-150);x.fill()}else if(theme===2){x.fillRect(bx+24,G-142,72,80);x.fillRect(bx+37,G-170,46,28);x.fillRect(bx+48,G-194,24,24)}else if(theme===4){x.fillRect(bx+30,G-200,18,138);x.fillRect(bx+61,G-160,20,98);x.fillRect(bx+16,G-215,45,16)}else{x.beginPath();x.moveTo(bx+10,G-62);x.lineTo(bx+48,G-210);x.lineTo(bx+93,G-62);x.fill();x.fillStyle='#9bd6e8';x.fillRect(bx+48,G-115,11,48)}}x.restore()}
function city(){if(M[5])cityAlt(M[5]);else city0();drawBiomeScenery();const h=(M[2]%360+360)%360;let z=x.createLinearGradient(0,G-150,0,G);z.addColorStop(0,'hsla('+h+',70%,55%,0)');z.addColorStop(1,'hsla('+h+',70%,'+(40+M[4]*30)+'%,.3)');x.fillStyle=z;x.fillRect(0,G-150,W,150)}
function water0(){
 let g=x.createLinearGradient(0,G,0,H);g.addColorStop(0,hs(M[1],50,15+M[4]*16));g.addColorStop(1,hs(M[1],60,3+M[4]*6));x.fillStyle=g;x.fillRect(0,G,W,H-G);
 for(const b of boats){const bx=((b.x-dist*.25)%2520+2520)%2520-200;
  x.save();x.translate(bx,G-6);x.scale(b.s,b.s);x.fillStyle=hs(M[1],40,7+M[4]*10);x.beginPath();x.moveTo(-40,-14);x.lineTo(40,-14);x.lineTo(28,6);x.lineTo(-30,6);x.fill();
  x.fillRect(-2,-70,3,56);x.beginPath();x.moveTo(3,-68);x.lineTo(32,-20);x.lineTo(3,-20);x.fill();
  x.fillStyle='rgba(255,200,120,.25)';x.fillRect(-18,12,36,60);x.restore()}
 x.fillStyle='rgba(255,210,150,.18)';
 for(let i=0;i<14;i++){const wx=((i*90-dist*.4)%1260+1260)%1260-150,wy=G+14+(i*37)%90;x.fillRect(wx,wy+Math.sin(t*2+i)*2,50-(i%3)*12,2)}
}
function water(){water0();
 const L=M[4];
 for(let i=0;i<14;i++){const w=(46-i*2.6)*(.65+.35*Math.sin(t*3+i)),yy=G+36+i*8;if(yy>H)break;x.fillStyle=(L>.55?'rgba(255,230,150,':'rgba(255,245,210,')+(.32-i*.02)+')';x.fillRect(760-w/2+Math.sin(t*2+i)*5,yy,w,2.5)}
 x.strokeStyle='rgba(255,255,255,.13)';x.lineWidth=2;for(const by of[G+44,G+78]){x.beginPath();for(let px=0;px<=W;px+=16){const yy=by+Math.sin(px*.03+t*2+by)*2.5;px?x.lineTo(px,yy):x.moveTo(px,yy)}x.stroke()}
}
function boardwalk(){
 // gaps: draw planks except in gaps
 x.fillStyle='#4a2f1f';
 let gs=objs.filter(o=>o.t=='gap'&&o.x-dist<W+10&&o.x+o.w-dist>-10);
 let segs=[[0,W]];
 for(const o of gs){const a=o.x-dist,b=a+o.w;segs=segs.flatMap(([s,e])=>{if(b<=s||a>=e)return[[s,e]];const r=[];if(a>s)r.push([s,a]);if(b<e)r.push([b,e]);return r})}
 for(const [s,e] of segs){
  let g=x.createLinearGradient(0,G,0,G+40);g.addColorStop(0,'#8a5a36');g.addColorStop(1,'#3a2216');x.fillStyle=g;x.fillRect(s,G,e-s,28);
  x.fillStyle='#2a170e';x.fillRect(s,G+28,e-s,6);
  x.fillStyle='rgba(0,0,0,.35)';for(let px=Math.floor((s+dist)/48)*48-dist;px<e;px+=48)if(px>=s)x.fillRect(px,G,2,28);
  x.fillStyle='#d9a066';x.fillRect(s,G,e-s,3);
  x.fillStyle='#1c1008';for(let px=Math.floor((s+dist)/160)*160-dist;px<e;px+=160)if(px>=s+4&&px<e-8)x.fillRect(px,G+34,10,H-G);}
 // lamps + bunting
 for(let i=-1;i<8;i++){const lx=((i*300-dist*.9)%2400+2400)%2400-100;if(lx>W+40)continue;
  x.strokeStyle='rgba(30,20,20,.8)';x.lineWidth=1.5;x.beginPath();for(let u=0;u<=1.001;u+=.1){const bx=lx+2+300*u,by=G-122+Math.sin(u*Math.PI)*22;u?x.lineTo(bx,by):x.moveTo(bx,by)}x.stroke();
  x.globalAlpha=.85;for(let k=1;k<10;k++){const u=k/10,bx=lx+2+300*u,by=G-122+Math.sin(u*Math.PI)*22,sw=Math.sin(t*2+k+i)*1.5;x.fillStyle=hs((k+i*3)*47,75,58);x.beginPath();x.moveTo(bx-6,by);x.lineTo(bx+6,by);x.lineTo(bx+sw,by+14);x.fill()}x.globalAlpha=1;
  x.fillStyle='#222';x.fillRect(lx,G-130,5,130);x.fillRect(lx-8,G-134,21,6);
  const fk=.5+.08*Math.sin(t*9+i*3)+(Math.sin(t*23+i)>.97?-.2:0);
  let l=x.createRadialGradient(lx+2,G-122,2,lx+2,G-110,110);l.addColorStop(0,'rgba(255,220,140,'+fk+')');l.addColorStop(1,'rgba(255,220,140,0)');
  x.save();x.globalCompositeOperation='lighter';x.fillStyle=l;x.fillRect(lx-120,G-230,244,230);x.restore();
  x.fillStyle='#ffe9a8';x.beginPath();x.arc(lx+2,G-122,5,0,7);x.fill()}
}
/* white glowing outline for enemies & obstacles (offscreen silhouette; works on Safari too) */
const oc=document.createElement('canvas');oc.width=W;oc.height=H;const ox=oc.getContext('2d');let OUTL=false;
const OUT_OFFS=[[-3,0],[3,0],[0,-3],[0,3],[-2,-2],[2,-2],[-2,2],[2,2]];
function glowDraw(fn,any){
 if(OUTL||any===false){fn();return}
 const main=x;ox.setTransform(1,0,0,1,0,0);ox.globalCompositeOperation='source-over';ox.globalAlpha=1;ox.shadowBlur=0;ox.clearRect(0,0,W,H);
 x=ox;OUTL=true;try{fn()}catch(e){}finally{x=main;OUTL=false}
 ox.setTransform(1,0,0,1,0,0);ox.globalCompositeOperation='source-in';ox.fillStyle='#fff';ox.fillRect(0,0,W,H);ox.globalCompositeOperation='source-over';
 x.save();x.shadowColor='rgba(255,255,255,.95)';x.shadowBlur=22;x.drawImage(oc,0,0);x.drawImage(oc,0,0);x.shadowBlur=0;x.shadowColor='transparent';
 for(const [dx,dy] of OUT_OFFS)x.drawImage(oc,dx,dy);
 x.restore();fn()}
function isHost(o){return !o.dead&&(o.t=='crate'||o.t=='cop'||o.t=='barrel'||o.t=='gull'||o.t=='en'||o.t=='hang'||o.t=='spout')}
function drawObjs(){
 const vis=[];let any=false;for(const o of objs){const sx=o.x-dist;if(sx<-120||sx>W+60)continue;vis.push([o,sx]);if(isHost(o))any=true}
 glowDraw(()=>{for(const [o,sx] of vis)if(isHost(o))drawObj(o,sx)},any);
 for(const [o,sx] of vis)if(!isHost(o))drawObj(o,sx);
}
function drawObj(o,sx){x.save();x.translate(sx,G);x.scale(2,2);x.translate(-sx,-G);
  if(!OUTL&&!o.dead&&(o.t=='crate'||o.t=='cop'||o.t=='barrel'||o.t=='gull'||o.t=='en')){const E=o.t=='en'?EN[o.k]:null,sw=E?E.w/2:o.t=='crate'?o.w/2+4:18,scx=sx+(E?E.w/2:o.t=='crate'?o.w/2:o.t=='gull'?18:15),al=E?Math.max(.06,.3-(G-(o.y+E.h))/220):o.t=='gull'?.18:.3;x.fillStyle='rgba(0,0,0,'+al+')';x.beginPath();x.ellipse(scx,G+3,sw,4,0,0,7);x.fill()}
  if(o.dead){x.save();x.translate(sx+o.pvx,o.pvy+o.fy);x.rotate(o.rot);x.translate(-(sx+o.pvx),-o.pvy)}
  if(o.t=='en')EN[o.k].dr(sx,o.y,o);
  if(o.t=='crate'&&o.sk)OB[o.sk].dr(sx,G-o.h,o.w,o.h);else if(o.t=='crate'&&forestMode){const y=G-o.h,dmp=M[5]==8,rk=(Math.floor(o.x/7)%2)==0;
   if(dmp){x.fillStyle='#1f2a22';x.beginPath();x.ellipse(sx+o.w/2,y+o.h*.55,o.w*.62,o.h*.5,0,0,7);x.fill();x.fillStyle='#2f4a37';x.beginPath();x.ellipse(sx+o.w*.4,y+o.h*.45,o.w*.34,o.h*.3,0,0,7);x.fill();x.fillStyle='#1a221c';x.beginPath();x.moveTo(sx+o.w*.42,y+4);x.lineTo(sx+o.w*.5,y-8);x.lineTo(sx+o.w*.58,y+4);x.fill();x.fillStyle='rgba(255,255,255,.18)';x.beginPath();x.ellipse(sx+o.w*.3,y+o.h*.38,5,9,0,0,7);x.fill()}
   else if(rk){x.fillStyle='#868b84';x.beginPath();x.roundRect(sx,y+3,o.w,o.h-3,13);x.fill();x.fillStyle='#a3a89f';x.beginPath();x.roundRect(sx+4,y+6,o.w*.55,o.h*.3,8);x.fill();x.fillStyle='#5f8a4a';x.beginPath();x.ellipse(sx+o.w*.7,y+8,o.w*.28,5,0,0,7);x.fill();x.strokeStyle='#5a5f58';x.lineWidth=2;x.beginPath();x.moveTo(sx+o.w*.5,y+o.h*.4);x.lineTo(sx+o.w*.62,y+o.h*.8);x.stroke()}
   else{x.fillStyle='#6b4423';x.fillRect(sx+2,y+8,o.w-4,o.h-8);x.fillStyle='#51331a';x.fillRect(sx+2,y+8,6,o.h-8);x.fillStyle='#c9a06a';x.beginPath();x.ellipse(sx+o.w/2,y+8,o.w/2,8,0,0,7);x.fill();x.strokeStyle='#9a7040';x.lineWidth=1.5;x.beginPath();x.ellipse(sx+o.w/2,y+8,o.w*.32,5,0,0,7);x.moveTo(sx+o.w/2+o.w*.14,y+8);x.ellipse(sx+o.w/2,y+8,o.w*.14,2.4,0,0,7);x.stroke()}}
  else if(o.t=='crate'){const y=G-o.h;x.fillStyle='#7a4a24';x.fillRect(sx,y,o.w,o.h);x.strokeStyle='#3d2310';x.lineWidth=3;x.strokeRect(sx+1.5,y+1.5,o.w-3,o.h-3);
   x.beginPath();x.moveTo(sx,y);x.lineTo(sx+o.w,y+o.h);x.moveTo(sx+o.w,y);x.lineTo(sx,y+o.h);x.stroke();x.fillStyle='rgba(255,255,255,.12)';x.fillRect(sx,y,o.w,4);const cr=[[0,0],[o.w-9,0],[0,o.h-9],[o.w-9,o.h-9]];x.fillStyle='#38302c';for(const q of cr)x.fillRect(sx+q[0],y+q[1],9,9);x.fillStyle='#b9b2a8';for(const q of cr)x.fillRect(sx+q[0]+3,y+q[1]+3,2,2)}
  else if(o.t=='letter'&&!o.got){const y=o.y+Math.sin(t*5+o.x*.02)*3;let glow=x.createRadialGradient(sx+10,y,2,sx+10,y,29);glow.addColorStop(0,'rgba(86,245,197,.72)');glow.addColorStop(1,'rgba(86,245,197,0)');x.fillStyle=glow;x.fillRect(sx-19,y-29,58,58);x.fillStyle='#2fd5aa';x.beginPath();x.arc(sx+10,y,16,0,7);x.fill();x.strokeStyle='#eafff8';x.lineWidth=2;x.stroke();x.fillStyle='#08382f';x.font='bold 19px system-ui,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(o.ch,sx+10,y+1);x.textBaseline='alphabetic'}
  else if(o.t=='coin'&&!o.got){const w=Math.abs(Math.cos(t*4+o.x*.01))*8+1;x.fillStyle='rgba(255,210,60,.14)';x.beginPath();x.arc(sx+8,o.y,15,0,7);x.fill();x.fillStyle='#ffd23f';x.beginPath();x.ellipse(sx+8,o.y,w,9,0,0,7);x.fill();
   x.fillStyle='rgba(255,255,255,.7)';x.fillRect(sx+7,o.y-5,2,4);if(Math.sin(t*3+o.x)>.92){x.fillStyle='#fff';x.fillRect(sx+2,o.y-1,12,2);x.fillRect(sx+7,o.y-6,2,12)}}
  else if(o.t=='gem'&&!o.got){const y=o.y+Math.sin(t*3)*5;let l=x.createRadialGradient(sx,y,2,sx,y,30);l.addColorStop(0,'rgba(255,120,255,.6)');l.addColorStop(1,'rgba(255,120,255,0)');
   x.fillStyle=l;x.fillRect(sx-30,y-30,60,60);x.fillStyle='#f6f';x.beginPath();x.moveTo(sx,y-14);x.lineTo(sx+12,y);x.lineTo(sx,y+14);x.lineTo(sx-12,y);x.fill();x.fillStyle='#fff8';x.beginPath();x.moveTo(sx,y-14);x.lineTo(sx+12,y);x.lineTo(sx,y);x.fill()}
  else if(o.t=='ammo'&&!o.got){const y=o.y+Math.sin(t*4+o.x*.02)*3;let gl=x.createRadialGradient(sx+8,y,2,sx+8,y,22);gl.addColorStop(0,'rgba(140,255,140,.35)');gl.addColorStop(1,'rgba(140,255,140,0)');x.fillStyle=gl;x.fillRect(sx-14,y-22,44,44);x.fillStyle='#3f8a50';x.beginPath();x.ellipse(sx+8,y+2,9,8,0,0,7);x.fill();x.beginPath();x.moveTo(sx+4,y-5);x.lineTo(sx+8,y-11);x.lineTo(sx+12,y-5);x.fill();x.fillStyle='rgba(255,255,255,.35)';x.beginPath();x.ellipse(sx+5,y,2.5,4,0,0,7);x.fill()}
  else if(o.t=='cop'){const b=Math.sin(o.ph)*6;if(!OUTL){x.fillStyle='rgba(255,250,200,.18)';x.beginPath();x.moveTo(sx,G-34);x.lineTo(sx-170,G-72);x.lineTo(sx-170,G+8);x.fill()}
   x.fillStyle=forestMode?'#2f6a3a':'#1d2f6f';x.fillRect(sx+4,G-36,22,26);x.fillRect(sx+6+b,G-12,7,12);x.fillRect(sx+17-b,G-12,7,12);
   x.fillStyle='#e8b98a';x.beginPath();x.arc(sx+15,G-44,9,0,7);x.fill();x.fillStyle=forestMode?'#5a4524':'#10204f';x.fillRect(sx+4,G-56,22,6);x.fillRect(sx+2,G-51,26,3);x.fillStyle='#fd4';x.fillRect(sx+9,G-28,4,4)}
  else if(o.t=='barrel'){x.save();x.translate(sx+17,G-17);x.rotate(-o.ph);x.fillStyle='#8a5a2a';x.beginPath();x.arc(0,0,17,0,7);x.fill();x.strokeStyle='#3a2210';x.lineWidth=3;x.stroke();x.beginPath();if(forestMode){x.arc(0,0,11,0,7);x.moveTo(6,0);x.arc(0,0,6,0,7);x.moveTo(1.5,0);x.arc(0,0,1.5,0,7)}else{x.moveTo(-17,0);x.lineTo(17,0);x.moveTo(0,-17);x.lineTo(0,17)}x.stroke();x.restore()}
  else if(o.t=='hang'){const b=G-42;x.strokeStyle=o.st=='ice'?'#bfe8ff':'#666';x.lineWidth=3;x.beginPath();x.moveTo(sx+17,0);x.lineTo(sx+17,b-34);x.stroke();
   if(o.st=='ice'){x.fillStyle='#cdeeff';x.beginPath();x.moveTo(sx,b-40);x.lineTo(sx+34,b-40);x.lineTo(sx+17,b+2);x.fill()}
   else if(o.st=='hive'){x.fillStyle='#d9a63a';x.beginPath();x.ellipse(sx+17,b-18,15,20,0,0,7);x.fill();x.strokeStyle='#8a5a12';x.lineWidth=2;for(let q=0;q<3;q++){x.beginPath();x.ellipse(sx+17,b-18,15-q*3,6+q*5,0,.2,2.9);x.stroke()}x.fillStyle='#3a2208';x.beginPath();x.ellipse(sx+17,b-6,5,4,0,0,7);x.fill();x.fillStyle='#ffe066';for(let q=0;q<3;q++){const a=t*5+q*2.1;x.fillRect(sx+17+Math.cos(a)*22,b-20+Math.sin(a*1.3)*14,3,3)}}
   else if(o.st=='tire'){x.fillStyle='#1d1d22';x.beginPath();x.arc(sx+17,b-17,17,0,7);x.fill();x.fillStyle='#2e2e38';x.beginPath();x.arc(sx+17,b-17,8,0,7);x.fill();x.strokeStyle='#4a4a55';x.lineWidth=2;x.beginPath();x.arc(sx+17,b-17,12.5,0,7);x.stroke()}
   else if(o.st=='lantern'){let l=x.createRadialGradient(sx+17,b-17,2,sx+17,b-17,50);l.addColorStop(0,'rgba(255,90,60,.5)');l.addColorStop(1,'rgba(255,90,60,0)');if(!OUTL){x.fillStyle=l;x.fillRect(sx-35,b-70,100,100)}x.fillStyle='#e23';x.beginPath();x.roundRect(sx+3,b-34,28,34,8);x.fill();x.fillStyle='#fd4';x.fillRect(sx+10,b-40,14,6)}
   else{x.fillStyle='#d9a21b';x.fillRect(sx+2,b-34,30,24);x.fillStyle='#222';x.fillRect(sx+2,b-26,30,5);x.fillStyle='#777';x.beginPath();x.moveTo(sx+10,b-10);x.lineTo(sx+24,b-10);x.lineTo(sx+17,b+2);x.fill()}}
  else if(o.t=='spout'){const sp=(t+o.off)%2.4,on=sp>1.7,wn=sp>1.1&&!on;const c=o.st=='fire'?['255,140,30','255,230,120']:o.st=='steam'?['220,230,240','255,255,255']:['90,170,255','200,235,255'];
   x.fillStyle='#2a2a33';x.fillRect(sx,G-6,36,6);
   if(wn||on){const h=on?110:18+(sp-1.1)*20;let g=x.createLinearGradient(0,G-h,0,G);g.addColorStop(0,'rgba('+c[0]+',0)');g.addColorStop(1,'rgba('+c[on?1:0]+','+(on?.95:.6)+')');x.fillStyle=g;x.beginPath();x.moveTo(sx+4,G-6);x.quadraticCurveTo(sx+18,G-h*1.3,sx+32,G-6);x.fill()}}
  else if(o.t=='gull'){const y=o.y+Math.sin(o.ph*.4)*6,f=Math.sin(o.ph)*10;x.fillStyle='#eee';x.beginPath();x.ellipse(sx+18,y+12,18,8,0,0,7);x.fill();
   x.beginPath();x.arc(sx+4,y+8,6,0,7);x.fill();x.fillStyle='#f90';x.beginPath();x.moveTo(sx-2,y+8);x.lineTo(sx-10,y+11);x.lineTo(sx-2,y+12);x.fill();
   x.strokeStyle='#ccd';x.lineWidth=5;x.lineCap='round';x.beginPath();x.moveTo(sx+14,y+8);x.lineTo(sx+22,y-6+f);x.lineTo(sx+34,y-8+f);x.stroke();
   x.fillStyle='#000';x.fillRect(sx+3,y+6,2,2)}
  if(o.dead)x.restore();x.restore()}
function critter(k,run,sl,air){
 const kind=CH[k]?.kind||'raccoon',H2=sl?28:56,bob=air?0:Math.abs(Math.sin(run))*3,step=air?5:Math.sin(run)*8;
 x.translate(0,-bob);
 const palette={raccoon:['#85858f','#c8c7cb','#25252e'],possum:['#c9c3ba','#f0e9df','#e9a1ab'],cat:['#c98b52','#f1d2af','#d77736'],dog:['#bc895f','#f0d1aa','#875d3d'],crow:['#292b36','#555965','#d89a38'],armadillo:['#9c846c','#d3c3ad','#67533e'],mouse:['#aaa6a6','#ece5e2','#e6a0aa'],bear:['#79533d','#d4aa7b','#4e3428'],coyote:['#b89268','#ead7bb','#aa7752'],duck:['#f3cc3c','#fff1a8','#f08a24']}[kind];
 const [fur,belly,accent]=palette;x.lineCap='round';
 if(kind==='raccoon'){x.fillStyle=fur;x.beginPath();x.ellipse(-22,-24,18,8,-.25,0,7);x.fill();x.strokeStyle='#25252e';x.lineWidth=4;for(let q=0;q<3;q++){x.beginPath();x.moveTo(-32+q*8,-30);x.lineTo(-29+q*8,-18);x.stroke()}}
 else if(kind==='possum'||kind==='mouse'){x.strokeStyle=kind==='mouse'?'#e6a0aa':'#d2a3a7';x.lineWidth=4;x.beginPath();x.moveTo(-10,-22);x.bezierCurveTo(-30,-15,-39,-42,-52,-30);x.stroke()}
 else if(kind==='cat'){x.strokeStyle=fur;x.lineWidth=7;x.beginPath();x.moveTo(-10,-22);x.bezierCurveTo(-30,-10,-35,-44,-51,-31);x.stroke()}
 else if(kind==='dog'||kind==='coyote'){x.fillStyle=fur;x.beginPath();x.ellipse(-20,-30,13,6,-.5,0,7);x.fill()}
 else if(kind==='bear'){x.fillStyle=fur;x.beginPath();x.ellipse(-21,-25,15,9,-.3,0,7);x.fill()}
 else if(kind==='duck'){x.fillStyle=fur;x.beginPath();x.moveTo(-10,-30);x.quadraticCurveTo(-26,-42,-34,-34);x.quadraticCurveTo(-26,-26,-10,-22);x.closePath();x.fill()}
 else if(kind==='crow'){x.fillStyle=fur;x.beginPath();x.moveTo(-10,-27);x.lineTo(-34,-32);x.lineTo(-26,-21);x.closePath();x.fill()}
 x.strokeStyle=fur;x.lineWidth=6;x.lineCap='round';x.beginPath();x.moveTo(-10,-H2*.62);x.lineTo(-18-step*.55,-H2*.4+step*.25);x.moveTo(12,-H2*.62);x.lineTo(20+step*.55,-H2*.4-step*.25);x.stroke();x.fillStyle=accent;x.fillRect(-8+step,-10,9,10);x.fillRect(5-step,-10,9,10);
 x.fillStyle=fur;x.beginPath();x.roundRect(-15,-H2*.78,31,H2*.68,kind==='armadillo'?13:11);x.fill();
 x.fillStyle=belly;x.beginPath();x.roundRect(-7,-H2*.56,16,H2*.37,8);x.fill();
 // Tailored bandit gear: stitched belt, bright buckle, shoulder strap and a little loot pouch.
 x.strokeStyle='rgba(255,244,210,.72)';x.lineWidth=2;x.beginPath();x.moveTo(-12,-20);x.lineTo(12,-20);x.moveTo(-8,-15);x.lineTo(7,-15);x.stroke();x.fillStyle='#e9b84d';x.beginPath();x.roundRect(-2,-22,7,6,2);x.fill();x.strokeStyle=accent;x.lineWidth=3;x.beginPath();x.moveTo(-10,-39);x.lineTo(9,-19);x.stroke();x.fillStyle=accent;x.beginPath();x.roundRect(-15,-24,9,10,3);x.fill();x.fillStyle='rgba(255,255,255,.55)';x.fillRect(-13,-22,5,1);x.fillRect(-13,-19,4,1);
 if(kind==='armadillo'){x.fillStyle='#806a54';x.beginPath();x.roundRect(-12,-H2*.82,25,25,10);x.fill();x.strokeStyle='#c8b59d';x.lineWidth=2;for(let a=-7;a<=9;a+=8){x.beginPath();x.moveTo(a,-45);x.lineTo(a+2,-26);x.stroke()}}
 x.fillStyle='#bd9451';x.beginPath();x.arc(-14,-H2*.54,9,0,7);x.fill();x.fillStyle='#ffe38b';x.beginPath();x.ellipse(-14,-H2*.54+1,3,4,0,0,7);x.fill();x.strokeStyle='#bd9451';x.lineWidth=1;x.stroke();
 const hy=-H2*.94,scarf=kind==='crow'?'#e23':kind==='cat'?'#36c9b3':'#e64b40';x.fillStyle=scarf;x.beginPath();x.moveTo(-3,hy+11);x.quadraticCurveTo(-19,hy+15+Math.sin(t*14)*3,-37,hy+12+Math.sin(t*14)*4);x.lineTo(-29,hy+23);x.quadraticCurveTo(-15,hy+21,1,hy+21);x.fill();
 x.fillStyle=fur;
 if(kind==='cat'||kind==='coyote'||kind==='raccoon'){x.beginPath();x.moveTo(-3,hy-3);x.lineTo(-5,hy-22);x.lineTo(7,hy-12);x.closePath();x.fill();x.beginPath();x.moveTo(11,hy-11);x.lineTo(22,hy-23);x.lineTo(23,hy-2);x.closePath();x.fill()}
 else if(kind==='bear'||kind==='mouse'||kind==='possum'){x.beginPath();x.arc(1,hy-11,kind==='bear'?8:7,0,7);x.fill();x.beginPath();x.arc(19,hy-11,kind==='bear'?8:7,0,7);x.fill();x.fillStyle=kind==='bear'?'#b77f60':kind==='mouse'?'#edb0b8':'#e9a1ab';x.beginPath();x.arc(1,hy-11,4,0,7);x.fill();x.beginPath();x.arc(19,hy-11,4,0,7);x.fill()}
 else if(kind==='dog'){x.fillStyle=accent;x.beginPath();x.ellipse(-1,hy-9,6,12,-.5,0,7);x.fill();x.beginPath();x.ellipse(20,hy-9,6,12,.5,0,7);x.fill()}
 else if(kind==='armadillo'){x.beginPath();x.moveTo(-3,hy-2);x.lineTo(-2,hy-17);x.lineTo(8,hy-9);x.closePath();x.fill();x.beginPath();x.moveTo(14,hy-9);x.lineTo(23,hy-18);x.lineTo(23,hy-2);x.closePath();x.fill()}
 else {x.beginPath();x.arc(8,hy,14,0,7);x.fill()}
 if(kind==='crow'){x.beginPath();x.ellipse(8,hy,14,13,0,0,7);x.fill();x.fillStyle=accent;x.beginPath();x.moveTo(19,hy-1);x.lineTo(34,hy+4);x.lineTo(19,hy+7);x.closePath();x.fill()}
 else {x.beginPath();x.ellipse(9,hy,14,13,0,0,7);x.fill();x.fillStyle=belly;x.beginPath();x.ellipse(15,hy+6,8,5,0,0,7);x.fill();if(kind==='possum'||kind==='mouse'){x.beginPath();x.moveTo(14,hy-2);x.lineTo(36,hy+5);x.lineTo(14,hy+8);x.closePath();x.fill()}else if(kind==='dog'||kind==='bear'||kind==='coyote'){x.beginPath();x.ellipse(19,hy+5,9,6,0,0,7);x.fill()}}
 if(kind==='raccoon'){x.fillStyle='#292932';x.beginPath();x.ellipse(8,hy+1,14,5,0,0,7);x.fill()}
 if(kind==='duck'){x.fillStyle=fur;x.beginPath();x.moveTo(4,hy-11);x.quadraticCurveTo(0,hy-24,10,hy-20);x.quadraticCurveTo(8,hy-14,12,hy-11);x.fill();x.fillStyle='#f08a24';x.beginPath();x.ellipse(24,hy+5,12,5,.08,0,7);x.fill();x.fillStyle='#c96a14';x.fillRect(14,hy+5,20,1.5)}
 if(kind==='armadillo'){x.strokeStyle='#d9c8b0';x.lineWidth=2;x.beginPath();x.arc(8,hy,13,-2.8,.8);x.stroke()}
 x.fillStyle='#fff';x.beginPath();x.ellipse(5,hy-1,3.1,4,0,0,7);x.fill();x.beginPath();x.ellipse(14,hy-1,3.1,4,0,0,7);x.fill();x.fillStyle='#17151a';x.beginPath();x.arc(6,hy,1.5,0,7);x.fill();x.beginPath();x.arc(15,hy,1.5,0,7);x.fill();
 // Tiny brows, whiskers and character-specific finish make the crew readable at a glance.
 x.strokeStyle=kind==='crow'?'#aaa':'rgba(55,35,28,.75)';x.lineWidth=1.5;x.beginPath();x.moveTo(2,hy-6);x.lineTo(8,hy-7);x.moveTo(12,hy-7);x.lineTo(18,hy-6);if(['cat','mouse','possum','bear'].includes(kind)){x.moveTo(21,hy+4);x.lineTo(34,hy+1);x.moveTo(21,hy+7);x.lineTo(35,hy+9)}x.stroke();if(kind==='dog'){x.fillStyle='#f5d15f';x.beginPath();x.arc(0,hy+13,3,0,7);x.fill()}if(kind==='crow'){x.strokeStyle='#e6d08c';x.lineWidth=2;x.beginPath();x.moveTo(-3,-34);x.quadraticCurveTo(-18,-45,-8,-51);x.stroke()}if(kind==='mouse'||kind==='possum'){x.fillStyle='#f7e1d7';for(let q=0;q<3;q++){x.fillRect(-4+q*3,-27,2,2)}}
 x.fillStyle=kind==='duck'?'#c96a14':kind==='crow'?'#e6a33e':kind==='possum'||kind==='mouse'?'#ea8297':'#28242a';x.beginPath();x.arc(kind==='possum'||kind==='mouse'?35:24,hy+5,2.7,0,7);x.fill();
 if((t%3.6)<.12){x.fillStyle='#fff';x.fillRect(4,hy-1,5,1);x.fillRect(13,hy-1,5,1)}
}
function bandit(){
 const px=P.x,py=P.y,sl=P.h<40,run=P.run,air=P.y+P.h<G-4;
 x.save();x.translate(px+20,py+P.h);if(!P.alive){x.translate(30,-44);x.rotate(Math.PI/2)}
 x.fillStyle='rgba(0,0,0,.3)';if(!air)x.beginPath(),x.ellipse(0,0,24,5,0,0,7),x.fill();
 x.scale(1+sq*.3,1-sq*.3);
 if(sl){x.rotate(-.15)}else if(air){x.rotate(Math.max(-.25,Math.min(.35,P.vy/2500)))}else x.rotate(.04);
 x.scale(2,2);if(P.spin>0){const f=1-P.spin/.45;x.save();x.translate(0,-28);x.rotate(-f*14);let gl=x.createRadialGradient(0,0,20,0,0,66);gl.addColorStop(0,'rgba(255,255,255,0)');gl.addColorStop(1,'rgba(255,240,170,.35)');x.fillStyle=gl;x.beginPath();x.arc(0,0,66,0,7);x.fill();x.strokeStyle='rgba(255,255,255,.85)';x.lineWidth=5;x.lineCap='round';for(let i=0;i<3;i++){x.beginPath();x.arc(0,0,58,i*2.094,i*2.094+1.1);x.stroke()}x.restore();x.translate(0,-28);x.rotate(f*Math.PI*4);x.translate(0,28)}critter(who,run,sl,air);
 x.restore();
}
function weather(){const w=M[3];
 if(w==9){x.fillStyle='rgba(215,165,90,.09)';x.fillRect(0,0,W,H)}
 if(w==8){x.fillStyle='rgba(20,110,170,.13)';x.fillRect(0,0,W,H);x.save();x.globalCompositeOperation='lighter';x.fillStyle='rgba(120,200,255,.05)';for(let i=0;i<4;i++){const s2=120+i*240+Math.sin(t*.4+i)*30;x.beginPath();x.moveTo(s2,0);x.lineTo(s2+60,0);x.lineTo(s2+10,G);x.lineTo(s2-90,G);x.fill()}x.restore()}
 if(w==3){let g=x.createLinearGradient(0,G-170,0,G+20);g.addColorStop(0,'rgba(200,210,230,0)');g.addColorStop(1,'rgba(200,210,230,.38)');x.fillStyle=g;x.fillRect(0,G-170,W,200)}
 if(w==6&&Math.sin(t*.9)>.97){x.fillStyle='rgba(255,255,255,.35)';x.fillRect(0,0,W,H)}
 for(const p of wx){
  if(w==1||w==6){p.y+=14+p.s*8;p.x-=4;x.strokeStyle='rgba(170,200,255,.5)';x.lineWidth=1.5;x.beginPath();x.moveTo(p.x,p.y);x.lineTo(p.x-6,p.y+16);x.stroke();if(p.s>.6&&p.y>G-4&&p.y<G+22){x.fillStyle='rgba(200,225,255,.6)';x.fillRect(p.x-4,G+2,8,2)}}
  else if(w==2){p.y+=1.2+p.s*1.5;p.x-=.5;x.fillStyle='rgba(255,255,255,.85)';x.fillRect(p.x+Math.sin(t+p.s*9)*8,p.y,2.5,2.5)}
  else if(w==4){p.y+=1+p.s*2;x.fillStyle='rgba(255,'+(100+p.s*100|0)+',40,.8)';x.fillRect(p.x,H-p.y,2,2)}
  else if(w==5){x.fillStyle='rgba(220,255,120,'+(.3+.7*Math.abs(Math.sin(t*2+p.s*9)))+')';x.fillRect(p.x+Math.sin(t+p.s*9)*14,G-p.y*.6+20*Math.sin(t*.7+p.s*5),3,3)}
  else if(w==7){p.y+=.8+p.s*1.2;p.x-=1+p.s*1.2;x.fillStyle=lvl==30?hs(20+p.s*25,80,50):hs(335+p.s*20,75,78);x.save();x.translate(p.x+Math.sin(t*2+p.s*9)*10,p.y);x.rotate(t+p.s*9);x.beginPath();x.ellipse(0,0,4,2,0,0,7);x.fill();x.restore()}
  else if(w==11){p.y+=.9+p.s*1.3;p.x-=1.2+p.s*1.5;x.fillStyle=hs([18,32,45,8][(p.s*4)|0],80,52);x.save();x.translate(p.x+Math.sin(t*2+p.s*9)*10,p.y);x.rotate(t+p.s*9);x.beginPath();x.ellipse(0,0,5,2.6,0,0,7);x.fill();x.restore()}
  else if(w==8){p.y-=.6+p.s*1.1;p.x+=Math.sin(t+p.s*9)*.4;x.strokeStyle='rgba(200,240,255,.45)';x.lineWidth=1;x.beginPath();x.arc(p.x,p.y,1.5+p.s*4,0,7);x.stroke()}
  else if(w==9){p.x-=9+p.s*12;x.strokeStyle='rgba(235,195,120,.35)';x.lineWidth=1.5;x.beginPath();x.moveTo(p.x,p.y*.8+G*.1);x.lineTo(p.x+14+p.s*16,p.y*.8+G*.1);x.stroke()}
  else if(w==10){p.x-=9+p.s*6;p.y+=4+p.s*3;if(p.s>.7){x.strokeStyle='rgba(255,240,200,.85)';x.lineWidth=2;x.beginPath();x.moveTo(p.x,p.y);x.lineTo(p.x+30,p.y-14);x.stroke()}}
  if(w==8&&p.y<-10)p.y=H+10;
  if(p.y>H)p.y=-10;if(p.x<-10)p.x=W+10}}
function pill(a,b,w,h){x.fillStyle='rgba(8,6,24,.55)';x.beginPath();x.roundRect(a,b,w,h,12);x.fill();x.strokeStyle='rgba(255,255,255,.15)';x.lineWidth=1;x.stroke()}
function actionButtons(){x.save();x.fillStyle='rgba(8,6,24,.78)';x.beginPath();x.roundRect(730,78,92,30,9);x.fill();x.roundRect(830,78,102,30,9);x.fill();x.strokeStyle='rgba(255,255,255,.35)';x.stroke();x.stroke();x.fillStyle='#fff';x.textAlign='center';x.font='bold 12px system-ui';x.fillText('Ⅱ PAUSE',776,98);x.fillText('⌂ MENU',881,98);x.restore()}
function slideBtn(){if(mobileOn)return;const bx=W-78,by=H-165;x.save();x.fillStyle='rgba(8,6,24,.72)';x.beginPath();x.arc(bx,by,38,0,7);x.fill();x.strokeStyle='#8ce0c0';x.lineWidth=3;x.stroke();x.fillStyle='#fff';x.textAlign='center';x.font='bold 23px system-ui';x.fillText('⇩',bx,by+7);x.font='bold 11px system-ui';x.fillStyle='#8ce0c0';x.fillText('SLIDE',bx,by+54);x.restore()}
function hud(){
 if(loot!=hl){hl=loot;bump=1}
 pill(14,12,330,74);pill(W-214,12,200,58);
 const cw=Math.abs(Math.cos(t*3))*9+2;x.fillStyle='#ffd23f';x.beginPath();x.ellipse(36,36,cw,11,0,0,7);x.fill();x.fillStyle='rgba(255,255,255,.7)';x.fillRect(35,31,2,5);
 x.fillStyle='#fff';x.textAlign='left';x.font='bold '+((22+bump*6)|0)+'px system-ui,sans-serif';x.fillText(loot,56,43);
 x.font='13px system-ui,sans-serif';x.fillStyle='#cde';x.fillText(spellActive?((runMode==='free'?'FREE RUN · ':'')+'SPELLING · WORD '+Math.min(spellWordIndex+1,spellWords.length)+'/'+spellWords.length):'MAP '+(lvl+1)+'/'+NM+' · '+M[0]+' · '+DF[diff].n+' · '+(runMode==='free'?'FREE RUN':'INFINITE RUNNER'),26,62);
 const fr=spellActive?(spellWordIndex>=spellWords.length?1:spellLetterIndex/(spellWords[spellWordIndex]?.length||1)):(dist%LEN)/LEN;x.fillStyle='rgba(255,255,255,.2)';x.beginPath();x.roundRect(26,70,300,6,3);x.fill();
 let pg=x.createLinearGradient(26,0,326,0);pg.addColorStop(0,'#ff8a3d');pg.addColorStop(1,'#ffd23f');x.fillStyle=pg;x.beginPath();x.roundRect(26,70,Math.max(6,300*fr),6,3);x.fill();
 x.fillStyle='#fff';x.beginPath();x.arc(26+300*fr,73,5,0,7);x.fill();
 if(spellActive){const wi=Math.min(spellWordIndex,Math.max(0,spellWords.length-1)),word=spellWords[wi]||'',tile=30,gap=5,total=word.length*(tile+gap)-gap,left=(W-total)/2;center((runMode==='free'?'FREE RUN · ':'')+'COLLECT THE LETTERS IN ORDER',103,14,'#9fe9d5');for(let i=0;i<word.length;i++){const bx=left+i*(tile+gap);x.fillStyle=i<spellLetterIndex?'#4ad7b2':'rgba(255,255,255,.12)';x.beginPath();x.roundRect(bx,112,tile,32,7);x.fill();x.strokeStyle=i<spellLetterIndex?'#dffff6':'rgba(255,255,255,.35)';x.lineWidth=1.5;x.stroke();x.textAlign='center';x.font='bold 20px system-ui';x.fillStyle=i<spellLetterIndex?'#07382d':'#fff';x.fillText(i<spellLetterIndex?word[i]:'·',bx+tile/2,135)}if(spellNotice>0)center('WORD COMPLETE!  '+spellCompletedName,166,22,'#a7ffe4')}
 for(let i=0;i<NM;i++){x.fillStyle=i<lvl?'#ffd23f':i==lvl?'#fff':'rgba(255,255,255,.25)';x.fillRect(360+i*4,18,3,i==lvl?9+Math.sin(t*6)*1.5:7)}
 x.textAlign='right';x.fillStyle='#fff';x.font='bold 22px system-ui,sans-serif';x.fillText(Math.floor(dist/10)+' m',W-28,40);
 x.font='14px system-ui,sans-serif';x.fillStyle='#ffd23fcc';x.fillText('BEST '+hi,W-28,60);pill(574,490,154,34);if(dumpsterIcon.complete&&dumpsterIcon.naturalWidth)x.drawImage(dumpsterIcon,576,487,34,34);x.textAlign='left';x.font='bold 15px system-ui,sans-serif';x.fillStyle='#ffe8a0';x.fillText('TRASH  '+trashCount,608,512);if(trashToast>0){x.globalAlpha=Math.min(1,trashToast*2);pill(551,450,177,30);x.textAlign='center';x.font='bold 12px system-ui,sans-serif';x.fillStyle='#ffe8a0';x.fillText('LEVEL COIN COLLECTED!',639,470);x.globalAlpha=1}if(S=='play'||S=='platformer'){spinBtn();slideBtn();actionButtons();if(S=='play')throwBtn()}
}
const TL={how:[20,12,140,30],ani:[W-170,12,150,30],gx:W/2-238,gy:158,gw:92,gh:34,gg:4,bio:288,dy:298,dh:26,dw:150,dg:10,mx:W/2-242,my:332,cw:115,cg:8,ch:120,th:83,spl:[W/2-100,458,200,22],panel:[W/2-256,148,512,340]};let modeHover=-1,lastMode='runner';const modeImgs=['img/mode-runner.png','img/mode-platformer.png','img/mode-free.png','img/mode-spelling.png'].map(u=>{const i=new Image();i.src=u;return i});
function inRect(px,py,r){return px>=r[0]&&px<=r[0]+r[2]&&py>=r[1]&&py<=r[1]+r[3]}
function tlChar(px,py){for(let i=0;i<CH.length;i++){const col=i%5,row=Math.floor(i/5);if(inRect(px,py,[TL.gx+col*(TL.gw+TL.gg),TL.gy+row*(TL.gh+TL.gg),TL.gw,TL.gh]))return i}return -1}
function tlDiff(px,py){for(let i=0;i<3;i++)if(inRect(px,py,[W/2-(3*TL.dw+2*TL.dg)/2+i*(TL.dw+TL.dg),TL.dy,TL.dw,TL.dh]))return i;return -1}
function tlMode(px,py){for(let i=0;i<4;i++)if(inRect(px,py,[TL.mx+i*(TL.cw+TL.cg),TL.my,TL.cw,TL.ch]))return i;return -1}
function drawMute(){const[bx,by,bw,bh]=MUTE;x.save();x.fillStyle='rgba(8,6,24,.72)';x.beginPath();x.roundRect(bx,by,bw,bh,9);x.fill();x.strokeStyle=muted?'rgba(255,120,120,.8)':'rgba(255,210,63,.6)';x.lineWidth=1.5;x.stroke();
 x.translate(bx+bw/2-4,by+bh/2);x.fillStyle=muted?'#ff9a9a':'#ffd23f';x.beginPath();x.moveTo(-9,-4);x.lineTo(-4,-4);x.lineTo(3,-10);x.lineTo(3,10);x.lineTo(-4,4);x.lineTo(-9,4);x.closePath();x.fill();
 x.strokeStyle=muted?'#ff9a9a':'#ffd23f';x.lineWidth=2;x.lineCap='round';
 if(muted){x.beginPath();x.moveTo(8,-5);x.lineTo(16,5);x.moveTo(16,-5);x.lineTo(8,5);x.stroke()}else{x.beginPath();x.arc(4,0,6,-.9,.9);x.stroke();x.beginPath();x.arc(4,0,11,-.9,.9);x.stroke()}
 x.restore()}

const fh=n=>{const q=Math.sin(n*127.1+311.7)*43758.5453;return q-Math.floor(q)};
function fbranch(x0,y0,a,len,w,d,seed){x.lineWidth=w;x.beginPath();x.moveTo(x0,y0);const x1=x0+Math.cos(a)*len,y1=y0+Math.sin(a)*len;x.lineTo(x1,y1);x.stroke();if(d>0){fbranch(x1,y1,a-.5-fh(seed)*.4,len*.7,w*.7,d-1,seed+1.3);fbranch(x1,y1,a+.5+fh(seed+2)*.4,len*.68,w*.7,d-1,seed+2.7)}}
function ftree(st,tx,by,h,lay,k){const L=M[4],sat=22+lay*12,lit=6+L*20+(2-lay)*3,hue=[150,135,95,30,105,28,98,0,40,155][st];
 const trunk=hs(28,32,Math.max(5,lit-1)),leaf=hs(hue,sat,lit+2),leaf2=hs(hue+8,sat,lit+8);x.fillStyle=trunk;x.strokeStyle=trunk;
 if(st==0||st==9){const w=h*.07;x.fillRect(tx-w/2,by-h*.2,w,h*.2);x.fillStyle=leaf;for(let j=0;j<5;j++){const yb=by-h*.1-j*h*.17,wd=h*(.3-j*.045),yt=yb-h*.3;x.beginPath();x.moveTo(tx-wd,yb);x.lineTo(tx,yt);x.lineTo(tx+wd,yb);x.fill();if(st==9){x.fillStyle='rgba(235,245,255,.82)';x.beginPath();x.moveTo(tx-wd*.5,yt+(yb-yt)*.5);x.lineTo(tx,yt);x.lineTo(tx+wd*.5,yt+(yb-yt)*.5);x.fill();x.fillStyle=leaf}}}
 else if(st==1){const w=h*.09;x.beginPath();x.moveTo(tx-w*.6,by);x.lineTo(tx-w*.32,by-h*.82);x.lineTo(tx+w*.32,by-h*.82);x.lineTo(tx+w*.6,by);x.fill();E_(tx,by-h*.92,h*.11,h*.09,leaf);E_(tx-h*.08,by-h*.8,h*.08,h*.06,leaf);E_(tx+h*.09,by-h*.78,h*.08,h*.06,leaf);E_(tx,by-h*.95,h*.07,h*.05,leaf2)}
 else if(st==2){const w=h*.045;x.fillStyle=hs(50,12,38+L*34);x.fillRect(tx-w/2,by-h*.78,w,h*.78);x.fillStyle=hs(30,10,12+L*8);for(let j=0;j<7;j++)x.fillRect(tx-w/2,by-h*.1-j*h*.1,w*(.4+fh(k*9+j)*.6),h*.018);E_(tx,by-h*.86,h*.14,h*.13,leaf2);E_(tx-h*.1,by-h*.74,h*.1,h*.09,leaf);E_(tx+h*.11,by-h*.76,h*.1,h*.09,leaf)}
 else if(st==3||st==8){x.lineCap='round';const w=h*.045;x.lineWidth=w;x.beginPath();x.moveTo(tx,by);x.lineTo(tx+(k-.5)*h*.06,by-h*.55);x.stroke();fbranch(tx+(k-.5)*h*.06,by-h*.55,-1.57-.4,h*.3,w*.7,2,k*50);fbranch(tx+(k-.5)*h*.06,by-h*.45,-1.57+.7,h*.26,w*.6,2,k*50+9)}
 else if(st==4||st==5){const w=h*.075;x.fillRect(tx-w/2,by-h*.5,w,h*.5);const lc=st==5?hs([18,32,45,8][(k*4)|0],68,Math.min(60,lit+16)):leaf,lc2=st==5?hs([18,32,45,8][(k*4)|0],70,Math.min(70,lit+24)):leaf2;
  for(const[ox,oy,r]of[[0,.7,.22],[-.17,.58,.17],[.17,.58,.17],[-.09,.83,.15],[.11,.81,.14]]){E_(tx+ox*h,by-oy*h,r*h,r*h*.92,lc)}E_(tx-h*.06,by-h*.78,h*.09,h*.07,lc2)}
 else if(st==6){const w=h*.06;x.beginPath();x.moveTo(tx-w,by);x.quadraticCurveTo(tx-w*.2,by-h*.4,tx+(k-.5)*h*.1,by-h*.6);x.lineTo(tx+(k-.5)*h*.1+w*.5,by-h*.6);x.quadraticCurveTo(tx+w*.9,by-h*.4,tx+w,by);x.fill();E_(tx,by-h*.66,h*.22,h*.14,leaf);x.strokeStyle=leaf2;x.lineWidth=2.4;for(let j=0;j<9;j++){const x0=tx-h*.2+j*h*.05,sw=Math.sin(t*1.2+j+tx*.01)*4;x.beginPath();x.moveTo(x0,by-h*.62);x.quadraticCurveTo(x0+sw+(j-4)*2,by-h*.45,x0+sw*1.5+(j-4)*3,by-h*.2-(j%3)*h*.05);x.stroke()}}}
function junkHump(px){return(Math.sin(px*.011)+Math.sin(px*.027+2)*.6+1.7)*26}
function forestScene(){const L=M[4],st=M[5],dump=st==8,river=st==6;
 // distant hills
 x.fillStyle=hs(M[2],24,9+L*22);x.beginPath();x.moveTo(0,G);const ho=dist*.03;for(let px=0;px<=W;px+=24)x.lineTo(px,G-130-(Math.sin((px+ho)*.006)*.5+Math.sin((px+ho)*.017+1)*.35+.9)*44);x.lineTo(W,G);x.fill();
 if(L>.45&&!dump){x.save();x.globalCompositeOperation='lighter';for(let i=0;i<3;i++){const bx=130+i*300+Math.sin(t*.35+i*2)*30,a=.05+.03*Math.sin(t*.6+i);const g=x.createLinearGradient(bx,0,bx-90,G);g.addColorStop(0,'rgba(255,240,170,'+a*1.6+')');g.addColorStop(1,'rgba(255,240,170,0)');x.fillStyle=g;x.beginPath();x.moveTo(bx-30,0);x.lineTo(bx+40,0);x.lineTo(bx-150,G);x.lineTo(bx-230,G);x.fill()}x.restore()}
 const LAY=[{par:.07,sp:150,h0:140,h1:90,by:G-(river?52:78)},{par:.17,sp:170,h0:210,h1:110,by:G-40},{par:.36,sp:300,h0:330,h1:150,by:G-8}];
 for(let lay=0;lay<3;lay++){if(river&&lay==1)continue;const Y=LAY[lay],off=dist*Y.par,sp=Y.sp*(river&&lay==2?1.5:1),i0=Math.floor(off/sp)-1,i1=Math.floor((off+W)/sp)+2;
  for(let i=i0;i<=i1;i++){const k=fh(i*3.7+lay*11+M[1]*.01),tx=i*sp-off+(fh(i*1.9+lay)-.5)*sp*.7,h=Y.h0+fh(i*5.3+lay)*Y.h1;if(dump&&k<.35)continue;ftree(st,tx,Y.by,h,lay,k)}
  if(lay==0){if(river){const wy=G-48;let g=x.createLinearGradient(0,wy,0,G-12);g.addColorStop(0,hs(M[2],45,22+L*30));g.addColorStop(1,hs(M[1],50,14+L*20));x.fillStyle=g;x.fillRect(0,wy,W,36);x.fillStyle='rgba(255,255,255,.22)';for(let j=0;j<16;j++){const wxx=((j*80-dist*.5)%1280+1280)%1280-60;x.fillRect(wxx,wy+6+(j*7)%26+Math.sin(t*2+j)*1.5,26-(j%3)*6,2)}}
   x.fillStyle='hsla('+M[2]+',35%,'+(25+L*40)+'%,'+(.13+L*.08)+')';x.fillRect(0,G-250,W,250)}}
 if(dump){const off=dist*.42;x.fillStyle=hs(30,10,13+L*20);x.beginPath();x.moveTo(0,G);for(let px=0;px<=W+20;px+=14)x.lineTo(px,G-24-junkHump(px+off));x.lineTo(W+20,G);x.fill();
  const sp=90,i0=Math.floor(off/sp)-1,i1=Math.floor((off+W)/sp)+2;for(let i=i0;i<=i1;i++){const px=i*sp-off+fh(i*2.3)*50,wy=G-24-junkHump(px+off),k=fh(i*7.1),c=hs(fh(i)*360,40,30+L*26);
   if(k<.2){x.fillStyle=hs(0,0,38+L*34);x.fillRect(px,wy-46,36,48);x.fillStyle=hs(0,0,18+L*20);x.fillRect(px+27,wy-38,3,16)}
   else if(k<.4){x.strokeStyle='#15151a';x.lineWidth=7;x.beginPath();x.arc(px+14,wy-12,13,0,7);x.stroke();x.beginPath();x.arc(px+34,wy-6,11,0,7);x.stroke()}
   else if(k<.55&&dumpsterIcon.complete&&dumpsterIcon.naturalWidth){const dw=84,dh=dw*dumpsterIcon.naturalHeight/dumpsterIcon.naturalWidth;x.globalAlpha=.55+L*.3;x.drawImage(dumpsterIcon,px,wy-dh+8,dw,dh);x.globalAlpha=1}
   else if(k<.75){x.fillStyle='#2c4535';x.beginPath();x.ellipse(px+16,wy-10,20,16,0,0,7);x.fill();x.beginPath();x.moveTo(px+10,wy-22);x.lineTo(px+16,wy-34);x.lineTo(px+22,wy-22);x.fill()}
   else{x.fillStyle=c;x.fillRect(px,wy-18,26,20);x.fillStyle=hs(40,30,30+L*20);x.fillRect(px+4,wy-26,8,10)}}
  for(let q=0;q<3;q++)for(let r=0;r<7;r++){x.fillStyle='rgba(120,120,120,'+(.07-r*.007)+')';x.beginPath();x.arc(150+q*320+Math.sin(t*.5+r+q)*14-((dist*.3)%320),G-180-r*34,18+r*7,0,7);x.fill()}}
 if(river){/* near-bank reeds are drawn with the ground */}
}
function forestGround(){const L=M[4],st=M[5],dump=st==8,river=st==6,leafy=st==4||st==5;
 const soilH=dump?35:river?32:26,soilS=dump?8:30,gh=river?72:dump?60:st==5?50:st==3?90:105,gS=dump?10:48;
 const gs=objs.filter(o=>o.t=='gap'&&o.x-dist<W+10&&o.x+o.w-dist>-10);let segs=[[0,W]];
 for(const o of gs){const a=o.x-dist,b=a+o.w;segs=segs.flatMap(([s0,e])=>{if(b<=s0||a>=e)return[[s0,e]];const r=[];if(a>s0)r.push([s0,a]);if(b<e)r.push([b,e]);return r})}
 for(const o of gs){const a=Math.max(-5,o.x-dist),b=Math.min(W+5,o.x+o.w-dist);let g=x.createLinearGradient(0,G+10,0,H);g.addColorStop(0,hs(195,50,24+L*26));g.addColorStop(1,hs(215,55,8+L*10));x.fillStyle=g;x.fillRect(a,G+10,b-a,H-G-10);
  x.fillStyle='rgba(255,255,255,.28)';for(let j=0;j<5;j++){const wy=G+18+j*14+Math.sin(t*2+j+o.x)*2;x.fillRect(a+6+((j*29+t*30)%(Math.max(10,b-a-30))),wy,20,2)}
  x.strokeStyle='rgba(255,255,255,.4)';x.lineWidth=2;x.beginPath();for(let px=a;px<=b;px+=8){const wy=G+12+Math.sin(px*.06+t*3)*2;px==a?x.moveTo(px,wy):x.lineTo(px,wy)}x.stroke()}
 for(const[s0,e]of segs){let g=x.createLinearGradient(0,G,0,H);g.addColorStop(0,hs(soilH,soilS,15+L*12));g.addColorStop(1,hs(soilH,soilS,5+L*5));x.fillStyle=g;x.fillRect(s0,G,e-s0,H-G);
  x.fillStyle=hs(gh,gS,17+L*20);x.fillRect(s0,G,e-s0,9);x.fillStyle=hs(gh,gS+8,26+L*20);x.fillRect(s0,G,e-s0,3);
  for(let px=Math.floor((s0+dist)/13)*13;px<e+dist;px+=13){const sx=px-dist;if(sx<s0||sx>e)continue;const k=fh(px*.37),bh=5+k*9;x.fillStyle=hs(gh,gS+10,24+L*22+k*8);x.beginPath();x.moveTo(sx,G+1);x.lineTo(sx+2.5,G-bh);x.lineTo(sx+5,G+1);x.fill()}
  for(let px=Math.floor((s0+dist)/57)*57;px<e+dist;px+=57){const sx=px-dist;if(sx<s0+6||sx>e-6)continue;const k=fh(px*.11);x.fillStyle=hs(soilH,soilS-8,22+L*10+k*10);x.beginPath();x.ellipse(sx,G+30+k*60,6+k*8,4+k*4,0,0,7);x.fill()}}
 for(let px=Math.floor(dist/79)*79-79;px<dist+W+80;px+=79){const k=fh(px*.21+3),sx=px-dist+k*30;if(inGap(px+k*30+10)||inGap(px+k*30-10))continue;const by=G+2;
  if(river){x.strokeStyle=hs(95,40,20+L*20);x.lineWidth=2;x.beginPath();x.moveTo(sx,by);x.lineTo(sx+Math.sin(t+px)*3,by-34-k*18);x.stroke();if(k>.3){x.fillStyle=hs(25,40,14+L*14);x.fillRect(sx+Math.sin(t+px)*3-2,by-46-k*18,5,14)}}
  else if(dump){x.fillStyle=hs(fh(px)*360,25,24+L*18);x.fillRect(sx,by-5,7,5);x.fillStyle='#9aa';x.fillRect(sx+14,by-3,5,3)}
  else if(k<.5){x.fillStyle=hs(gh+10,50,18+L*18);for(let j=-2;j<=2;j++){x.beginPath();x.moveTo(sx,by);x.quadraticCurveTo(sx+j*7,by-14,sx+j*11,by-22+Math.abs(j)*4);x.lineTo(sx+j*11+3,by-20+Math.abs(j)*4);x.quadraticCurveTo(sx+j*7+2,by-10,sx+3,by);x.fill()}}
  else if(leafy||st==1||st==2){x.fillStyle=hs(40,20,60+L*20);x.fillRect(sx+3,by-9,3,9);x.fillStyle=hs(k>.75?0:20,70,40+L*15);x.beginPath();x.ellipse(sx+4.5,by-10,8,5,0,Math.PI,0);x.fill();x.fillStyle='rgba(255,255,255,.7)';x.fillRect(sx+2,by-13,2,2);x.fillRect(sx+6,by-11,2,2)}
  else{x.fillStyle=hs(gh,50,16+L*16);x.beginPath();x.arc(sx,by,9,Math.PI,0);x.fill()}}
}
function center(a,y,sz,col){x.fillStyle=col||'#fff';x.font='bold '+sz+'px system-ui,sans-serif';x.textAlign='center';x.fillText(a,W/2,y)}
function cityAlt(st){
 const off=(dist*.08)%2800,L=M[4],B=G,col=hs(M[1],45,9+L*16),col2=hs(M[1],40,15+L*18);
 for(const b of skyline){const bx=((b.x-off)%2800+2800)%2800-200;if(bx>W+120)continue;const px=bx+b.w/2;
  if(st==1){const w2=b.w*3.2,h2=b.h*1.25+40;x.fillStyle=col;x.beginPath();x.moveTo(px-w2/2,B);x.lineTo(px,B-h2);x.lineTo(px+w2/2,B);x.fill();
   x.fillStyle=hs(M[1],20,72+L*20);x.beginPath();x.moveTo(px,B-h2);x.lineTo(px-w2*.11,B-h2*.78);x.lineTo(px-w2*.04,B-h2*.84);x.lineTo(px+w2*.02,B-h2*.77);x.lineTo(px+w2*.11,B-h2*.78);x.fill()}
  else if(st==2){for(let d=0;d<2;d++){const tx=px+d*b.w*.9,th=b.h*.7+30-d*14;x.fillStyle=d?col2:col;x.fillRect(tx-3,B-16,6,16);for(let k=0;k<3;k++){const yy=B-12-th*(k/3.2)*.8,ww=b.w*(.9-k*.2)+8;x.beginPath();x.moveTo(tx-ww,yy);x.lineTo(tx,yy-th*.52);x.lineTo(tx+ww,yy);x.fill()}}}
  else if(st==3){const tiers=2+(b.h>110?1:0);x.fillStyle=col;x.fillRect(px-b.w*.36,B-tiers*34-4,b.w*.72,tiers*34+4);
   for(let k=0;k<tiers;k++){const yy=B-k*34-26,ww=b.w*.7-k*7+12;x.fillStyle=col2;x.beginPath();x.moveTo(px-ww-8,yy);x.quadraticCurveTo(px-ww*.4,yy-4,px,yy-20);x.quadraticCurveTo(px+ww*.4,yy-4,px+ww+8,yy);x.quadraticCurveTo(px,yy-6,px-ww-8,yy);x.fill();if(L<.6){x.fillStyle='#ffcf7a';x.fillRect(px-3,yy+6,6,9)}}
   x.fillStyle=col;x.fillRect(px-1,B-tiers*34-26,2,16)}
  else if(st==4){if(b.h>120){x.fillStyle=col2;x.beginPath();x.moveTo(px-b.w*1.2,B);x.lineTo(px,B-b.h*.95);x.lineTo(px+b.w*1.2,B);x.fill();x.fillStyle='rgba(0,0,0,.2)';x.beginPath();x.moveTo(px,B-b.h*.95);x.lineTo(px+b.w*1.2,B);x.lineTo(px,B);x.fill()}else{x.fillStyle=col;x.beginPath();x.ellipse(px,B,b.w*1.7,b.h*.45,0,Math.PI,0);x.fill()}}
  else if(st==5){const hh=b.h*.7+20;x.fillStyle=col;x.fillRect(bx,B-hh,b.w+10,hh);x.fillRect(bx+b.w*.55,B-hh-46,10,46);x.fillRect(bx+2,B-hh-10,b.w*.35,10);
   for(let k=0;k<3;k++){x.fillStyle='rgba(190,190,205,'+(.28-k*.07)+')';x.beginPath();x.arc(bx+b.w*.55+5+Math.sin(t*.8+k+bx*.01)*8+k*7,B-hh-56-k*20,8+k*4,0,7);x.fill()}
   if(L<.6)for(let k=0;k<3;k++){x.fillStyle=b.win[k]?'#ffa84a':'#3a2a2a';x.fillRect(bx+6+k*14,B-hh+10,8,8)}}
  else{x.fillStyle=col;x.fillRect(bx,B-b.h,b.w,b.h);for(let k=0;k<4;k++)x.fillRect(bx+k*(b.w/4),B-b.h-8,b.w/8+1,8);
   if(b.h>100){x.fillStyle=col2;x.beginPath();x.moveTo(bx-4,B-b.h-8);x.lineTo(px,B-b.h-46);x.lineTo(bx+b.w+4,B-b.h-8);x.fill();x.fillStyle='#d22';x.fillRect(px,B-b.h-62,12,6);x.fillRect(px,B-b.h-62,1.5,16)}
   if(L<.6){x.fillStyle='#ffcf7a';x.fillRect(px-2,B-b.h+18,4,10);x.fillRect(px-2,B-b.h+48,4,10)}}
 }
}
// ---------------------------------------------------------------- MAP GALLERY
const thumbs=[],WXN=['clear','rain','snow','fog','embers','fireflies','storm','petals','bubbles','sandstorm','meteors'],HZN={c:'cops',b:'barrels',h:'hangers',s:'jets'};
let clr=[];try{clr=JSON.parse(localStorage.getItem('erb_clr')||'[]')}catch(e){}
let clrF=[],clrP=[];try{clrF=JSON.parse(localStorage.getItem('erb_clrf')||'[]');clrP=JSON.parse(localStorage.getItem('erb_clrp')||'[]')}catch(e){}
const CLRS=()=>[clr,clrF,clrP],CLRK=['erb_clr','erb_clrf','erb_clrp'];
function mark(i,m=S==='platformer'?2:runMode==='free'?1:0){const a=CLRS()[m];if(!a[i]){a[i]=1;try{localStorage.setItem(CLRK[m],JSON.stringify(a))}catch(e){}}}
let galMode=0;const thumbsF=[],thumbsP=[],GN=()=>galMode==2?10:NM,GTH=()=>galMode==2?thumbsP:galMode==1?thumbsF:thumbs,GNAME=i=>galMode==2?PLAT_NAMES[i]:galMode==1?LF[i][0]:LV[i][0],GTABS=[['INFINITE RUNNER',236],['FREE RUN',372],['PLATFORMER',476]];
function setGalMode(m){galMode=m;gSel=Math.max(0,Math.min(GN()-1,m==2?0:cp))}
function sc(){return loot*10+Math.floor((dist-base)/10)}
function genThumb(i){const m=galMode,oc=document.createElement('canvas');oc.width=W;oc.height=H;const ox=x,sv=[dist,t,lvl,M,objs,forestMode,plat,spellActive];
 x=oc.getContext('2d');dist=1500+i*211;t=4+i*.37;lvl=i;forestMode=m==1;
 if(m==2){spellActive=false;plat={level:i,loot:0};setupPlatLevel();plat.camera=420+i*90;plat.x=plat.camera+260;plat.on=true;drawPlatformer();x=ox;[dist,t,lvl,M,objs,forestMode,plat,spellActive]=sv;const tc2=document.createElement('canvas');tc2.width=320;tc2.height=180;tc2.getContext('2d').drawImage(oc,60,104,640,360,0,0,320,180);thumbsP[i]=tc2;return}
 M=(m==1?LF:LV)[i];objs=[];
 if(m==1){sky();forestScene();forestGround()}else{sky();city();water();boardwalk()}
 const L2=(m==1?ENPF:ENP)[i],ks=[...new Set((L2.length>6?[3,10,18].map(n=>L2[Math.min(n,L2.length-1)]):L2.slice(0,3)).filter(k=>EN[k]))];
 ks.forEach((k,j)=>{const E=EN[k],y=E.y0!==undefined?Math.max(E.y0,G-110):G-E.h,sx=470+j*130;E_(sx+E.w/2,G+3,E.w/2,4,'rgba(0,0,0,.3)');E.dr(sx,y,{ph:1.1+j,y})});
 weather();
 let vg=x.createRadialGradient(W/2,H/2,H*.45,W/2,H/2,H*.95);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,10,.55)');x.fillStyle=vg;x.fillRect(0,0,W,H);
 x=ox;[dist,t,lvl,M,objs,forestMode,plat,spellActive]=sv;
 const tc=document.createElement('canvas');tc.width=320;tc.height=180;tc.getContext('2d').drawImage(oc,0,0,320,180);GTH()[i]=tc}
const GC=4,GP=12,GX=31,GY=72,GW=214,GH=120,GDX=228,GDY=134;
function cellRect(k){return[GX+(k%GC)*GDX,GY+Math.floor(k/GC)*GDY,GW,GH]}
function openGal(){gPrev=S;S='gallery';setGalMode(lastMode==='platformer'?2:lastMode==='free'?1:0)}
function closeGal(){S=gPrev}
function playMap(i){if(galMode==2){startPlatformer(i);return}if(galMode==1){cp=i;runMode='free';lastMode='free';spellActive=false;ammo=5;reset();S='play';t=0;return}cp=i;runMode='continuous';lastMode='runner';spellActive=false;reset();forestMode=false;S='play';t=0}
function galKey(e){const k=e.code;let h=1;
 if(k=='Tab'||k=='KeyE')setGalMode((galMode+(e.shiftKey?2:1))%3);else if(k=='KeyQ')setGalMode((galMode+2)%3);
 else if(k=='ArrowLeft'||k=='KeyA')gSel=Math.max(0,gSel-1);
 else if(k=='ArrowRight'||k=='KeyD')gSel=Math.min(GN()-1,gSel+1);
 else if(k=='ArrowUp'||k=='KeyW')gSel=Math.max(0,gSel-GC);
 else if(k=='ArrowDown'||k=='KeyS')gSel=Math.min(GN()-1,gSel+GC);
 else if(k=='PageUp')gSel=Math.max(0,gSel-GP);
 else if(k=='PageDown')gSel=Math.min(GN()-1,gSel+GP);
 else if(k=='Home')gSel=0;else if(k=='End')gSel=GN()-1;
 else if(k=='Enter'||k=='Space')playMap(gSel);
 else if(k=='Escape'||k=='KeyG'||k=='Backspace')closeGal();
 else h=0;if(h)e.preventDefault()}
function galClick(e,r){const px=(e.clientX-r.left)/r.width*W,py=(e.clientY-r.top)/r.height*H,pg=Math.floor(gSel/GP);
 if(py>=60&&py<=88){for(let q=0;q<3;q++){const bx=[196,372,476][q]}}if(py>=30&&py<=56){const xs=[[262,424],[430,540],[546,676]];for(let q=0;q<3;q++)if(px>=xs[q][0]&&px<=xs[q][1]){setGalMode(q);return}}
 if(py>=486&&py<=520){if(px>=31&&px<=131)closeGal();else if(px>=725&&px<=769)gSel=Math.max(0,gSel-GP);else if(px>=777&&px<=821)gSel=Math.min(GN()-1,gSel+GP);else if(px>=829&&px<=929)playMap(gSel);return}
 for(let k=0;k<GP;k++){const i=pg*GP+k;if(i>=GN())break;const [a,b,w,h]=cellRect(k);if(px>=a&&px<=a+w&&py>=b&&py<=b+h){if(i==gSel)playMap(i);else gSel=i;return}}}
function gbtn(a,b,w,h,txt,hot){x.fillStyle=hot?'#ffd23f':'rgba(255,255,255,.1)';x.beginPath();x.roundRect(a,b,w,h,9);x.fill();x.strokeStyle=hot?'#fff':'rgba(255,255,255,.3)';x.lineWidth=hot?2:1;x.stroke();x.fillStyle=hot?'#10102a':'#cde';x.font='bold 15px system-ui,sans-serif';x.textAlign='center';x.fillText(txt,a+w/2,b+h/2+5)}
function galBtn(){x.save();x.fillStyle='rgba(8,6,24,.6)';x.beginPath();x.roundRect(24,484,170,34,10);x.fill();x.strokeStyle='rgba(255,210,63,.6)';x.lineWidth=1.5;x.stroke();x.fillStyle='#ffd23f';for(let i=0;i<4;i++)x.fillRect(38+(i%2)*8,492+Math.floor(i/2)*8,6,6);x.font='bold 14px system-ui,sans-serif';x.textAlign='left';x.fillText('MAP GALLERY [G]',62,506);x.restore()}
function galHit(e,r){const px=(e.clientX-r.left)/r.width*W,py=(e.clientY-r.top)/r.height*H;return px>=24&&px<=194&&py>=484&&py<=518}
function drawAnimalGallery(){let g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#11172d');g.addColorStop(1,'#26394a');x.fillStyle=g;x.fillRect(0,0,W,H);center('ANIMAL GALLERY',48,29,'#ffe08b');center('Meet the river bandits',72,13,'#b9d8da');for(let i=0;i<CH.length;i++){const col=i%3,row=Math.floor(i/3),bx=28+col*304,by=91+row*104;const selected=i===who;x.fillStyle=selected?'rgba(255,210,63,.18)':'rgba(255,255,255,.08)';x.beginPath();x.roundRect(bx,by,286,94,13);x.fill();x.strokeStyle=selected?'#ffd23f':'rgba(255,255,255,.22)';x.lineWidth=selected?2:1;x.stroke();x.save();x.translate(bx+55,by+84);x.scale(.7,.7);critter(i,t*5,false,false);x.restore();x.textAlign='left';x.font='bold 15px system-ui';x.fillStyle='#ffe08b';x.fillText(CH[i].n,bx+104,by+22);wrapCanvasText(CH[i].d,bx+104,by+39,174,14,4);if(selected){x.fillStyle='#ffd23f';x.font='bold 10px system-ui';x.fillText('SELECTED',bx+104,by+88)}}x.fillStyle='rgba(255,255,255,.12)';x.beginPath();x.roundRect(28,508,128,25,8);x.fill();x.textAlign='center';x.font='bold 12px system-ui';x.fillStyle='#fff';x.fillText('← BACK',92,525);center('Click an animal to choose',524,12,'#a9c9d1')}
function wrapCanvasText(txt,x0,y0,maxW,lineH,maxLines){x.font='12px system-ui';x.fillStyle='#d8e4e4';const words=txt.split(' ');let line='',rows=[];for(const word of words){const test=line?line+' '+word:word;if(x.measureText(test).width>maxW&&line){rows.push(line);line=word}else line=test}if(line)rows.push(line);rows=rows.slice(0,maxLines);if(rows.length===maxLines&&words.length>0&&x.measureText(rows[rows.length-1]).width>maxW)rows[rows.length-1]=rows[rows.length-1].slice(0,-1)+'…';rows.forEach((r,i)=>x.fillText(r,x0,y0+i*lineH))}
function drawGallery(){
 let g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0b0a1a');g.addColorStop(1,'#1b1033');x.fillStyle=g;x.fillRect(0,0,W,H);
 for(const s of stars){x.globalAlpha=.25+.25*Math.sin(t*2+s.p);x.fillStyle='#fff';x.fillRect(s.x,s.y*2.1,1.5,1.5)}x.globalAlpha=1;
 const pg=Math.floor(gSel/GP),pages=Math.ceil(GN()/GP),cl=CLRS()[galMode];let nclr=0;for(let i=0;i<GN();i++)if(cl[i])nclr++;
 x.save();x.textAlign='left';x.font='bold 30px system-ui,sans-serif';let tg=x.createLinearGradient(0,20,0,50);tg.addColorStop(0,'#fff3a0');tg.addColorStop(1,'#ff9a3d');x.fillStyle=tg;x.shadowColor='#ff6a3d';x.shadowBlur=14;x.fillText('MAP GALLERY',31,48);x.restore();for(let q=0;q<3;q++){const xs=[[262,424],[430,540],[546,676]][q],on=q==galMode;x.fillStyle=on?'#ffd23f':'rgba(255,255,255,.1)';x.beginPath();x.roundRect(xs[0],30,xs[1]-xs[0],26,8);x.fill();x.strokeStyle=on?'#fff':'rgba(255,255,255,.3)';x.lineWidth=1;x.stroke();x.fillStyle=on?'#10102a':'#cde';x.font='bold 12px system-ui,sans-serif';x.textAlign='center';x.fillText(GTABS[q][0],(xs[0]+xs[1])/2,47)}
 x.textAlign='right';x.font='bold 16px system-ui,sans-serif';x.fillStyle='#ffd23f';x.fillText('CLEARED '+nclr+'/'+GN()+'   ·   PAGE '+(pg+1)+'/'+pages,W-31,56);x.font='12px system-ui,sans-serif';x.fillStyle='#9ad';x.fillText('Arrows select · TAB switch type · ENTER play · ESC back',W-31,69);
 let budget=3;
 for(let k=0;k<GP;k++){const i=pg*GP+k;if(i>=GN())break;if(!GTH()[i]&&budget>0){genThumb(i);budget--}
  const [a,b,w,h]=cellRect(k),sel=i==gSel;
  x.save();x.beginPath();x.roundRect(a,b,w,h,10);x.clip();
  if(GTH()[i])x.drawImage(GTH()[i],a,b,w,h);else{x.fillStyle='#161230';x.fillRect(a,b,w,h)}
  let lg=x.createLinearGradient(0,b+h-40,0,b+h);lg.addColorStop(0,'rgba(0,0,0,0)');lg.addColorStop(1,'rgba(0,0,0,.75)');x.fillStyle=lg;x.fillRect(a,b+h-40,w,40);
  x.restore();
  x.textAlign='left';x.fillStyle='#fff';x.font='bold 13px system-ui,sans-serif';x.fillText(GNAME(i),a+9,b+h-9);
  x.fillStyle='rgba(8,6,24,.7)';x.beginPath();x.roundRect(a+6,b+6,34,20,6);x.fill();x.fillStyle='#ffd23f';x.font='bold 12px system-ui,sans-serif';x.textAlign='center';x.fillText('#'+(i+1),a+23,b+20);
  if(cl[i]){x.fillStyle='#ffd23f';star(a+w-18,b+18,10,0);x.fill();x.strokeStyle='#7a4a10';x.lineWidth=2;x.stroke()}
  if(sel){x.save();x.shadowColor='#ffd23f';x.shadowBlur=14+4*Math.sin(t*5);x.strokeStyle='#ffd23f';x.lineWidth=3;x.beginPath();x.roundRect(a,b,w,h,10);x.stroke();x.restore()}
  else{x.strokeStyle='rgba(255,255,255,.25)';x.lineWidth=1;x.beginPath();x.roundRect(a,b,w,h,10);x.stroke()}}
 for(let i=0;i<GN()&&budget>0;i++)if(!GTH()[i]){genThumb(i);budget--}
 let hz,ens,wxl,m=galMode==1?LF[gSel]:LV[gSel];
 if(galMode==2){hz='spikes, pits, springs, saws, fire';ens='walkers, spikies, hoppers, flyers, chargers';wxl='Day '+(gSel+1)}
 else{const T=galMode==1?HZF:HZ,E2=galMode==1?ENPF:ENP;hz=[...new Set(T[gSel])].filter(k=>k!='e').map(k=>HZN[k]).join(', ');const en=E2[gSel].map(n=>EN[n].n);ens=en.length>5?en.slice(0,4).join(', ')+' +'+(en.length-4)+' more':en.join(', ');wxl=WXN[m[3]]+'  ·  '+(m[4]>.55?'Daytime':m[4]>.2?'Dusk':'Night')}
 x.textAlign='center';x.fillStyle='#fff';x.font='bold 17px system-ui,sans-serif';x.fillText(['MAP ','FOREST ','LEVEL '][galMode]+(gSel+1)+' · '+GNAME(gSel)+(cl[gSel]?'  ★':''),432,498);
 x.font='12px system-ui,sans-serif';x.fillStyle='#9ad';x.fillText('Hazards: '+(hz||'none')+'  ·  '+(galMode==2?'':'Weather: ')+wxl,432,515);x.fillText('Enemies: '+ens,432,531);
 gbtn(31,486,100,34,'◀ BACK',false);gbtn(725,486,44,34,'◀',false);gbtn(777,486,44,34,'▶',false);gbtn(829,486,100,34,'PLAY ▶',true)}
function celebrate(n){celeb=2;celN=n;
 for(let i=0;i<110;i++)conf.push({x:rnd(0,W),y:rnd(-200,-10),vx:rnd(-60,60),vy:rnd(120,300),r:rnd(0,6),vr:rnd(-8,8),w:rnd(6,11),h:rnd(4,8),c:hs(rnd(0,360),90,60),l:5});
 for(let i=0;i<5;i++)fw.push({x:rnd(120,W-120),y:H,ty:rnd(80,250),d:i*.28,vy:-520,c:rnd(0,360)})}
function star(cx,cy,r,rot){x.beginPath();for(let i=0;i<10;i++){const a=rot+i*Math.PI/5-Math.PI/2,rr=i%2?r*.45:r;x.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr)}x.closePath()}
function celebFX(){
 if(!(conf.length||spk.length||fw.length||celeb>0))return;
 x.save();const p=2-celeb;
 if(celeb>0&&S=='play'){const a=Math.min(1,celeb);
  x.save();x.globalCompositeOperation='lighter';x.translate(W/2,205);x.rotate(t*.6);x.fillStyle='rgba(255,220,100,'+a*.13+')';for(let i=0;i<14;i++){x.rotate(Math.PI/7);x.beginPath();x.moveTo(0,0);x.lineTo(-34,-480);x.lineTo(34,-480);x.fill()}x.restore();
  let gv=x.createRadialGradient(W/2,H/2,H*.4,W/2,H/2,H);gv.addColorStop(0,'rgba(255,210,80,0)');gv.addColorStop(1,'rgba(255,210,80,'+a*.3+')');x.fillStyle=gv;x.fillRect(0,0,W,H)}
 x.globalCompositeOperation='lighter';
 for(const f of fw){if(f.d>0)continue;x.fillStyle='#fff';x.fillRect(f.x-2,f.y,4,10)}
 for(const s of spk){x.globalAlpha=Math.min(1,s.l*1.5);x.fillStyle=hs(s.c,100,62);x.fillRect(s.x-s.s/2,s.y-s.s/2,s.s,s.s)}
 x.globalAlpha=1;x.globalCompositeOperation='source-over';
 for(const c of conf){x.save();x.translate(c.x,c.y);x.rotate(c.r);x.fillStyle=c.c;x.fillRect(-c.w/2,-c.h/2,c.w,c.h*Math.abs(Math.cos(c.r*2))+1);x.restore()}
 if(celeb>0&&S=='play'){
  const al=Math.min(1,celeb*1.6),k=Math.min(1,p/.35),sc=k<1?(1-Math.pow(1-k,3))*1.15:1.15-.15*Math.min(1,(p-.35)*4);
  x.globalAlpha=al;
  for(let i=0;i<3;i++){const ss=Math.max(0,Math.min(1,(p-.12*i-.1)*4)),cx2=W/2+(i-1)*76,cy2=i==1?112:128,r=(i==1?30:22)*ss*(1+Math.sin(t*6+i)*.05);x.fillStyle='#ffd23f';x.strokeStyle='#7a4a10';x.lineWidth=4;star(cx2,cy2,r,t*(i-1)*.8+(1-ss)*3);x.fill();x.stroke()}
  x.save();x.translate(W/2,200);x.scale(sc,sc);x.font='bold 56px system-ui,sans-serif';x.textAlign='center';x.lineJoin='round';x.lineWidth=9;x.strokeStyle='#2a0f1f';let tg=x.createLinearGradient(0,-44,0,8);tg.addColorStop(0,'#fff3a0');tg.addColorStop(1,'#ff9a3d');x.shadowColor='#ff6a3d';x.shadowBlur=22;const tt='MAP '+celN+' CLEARED!';x.strokeText(tt,0,0);x.fillStyle=tg;x.fillText(tt,0,0);x.restore();
  x.font='bold 22px system-ui,sans-serif';x.textAlign='center';x.fillStyle='#fff';x.fillText('+10 LOOT BONUS',W/2,244);
  x.globalAlpha=1;
  for(let i=0;i<6;i++){const ang=t*5+i*Math.PI/3,sx3=190+Math.cos(ang)*36,sy3=P.y+P.h/2+Math.sin(ang)*34,sr=3+Math.abs(Math.sin(t*8+i))*3;x.fillStyle='#fff6b0';x.fillRect(sx3-sr,sy3-1,sr*2,2);x.fillRect(sx3-1,sy3-sr,2,sr*2)}}
 x.restore()}
function introRiver(){
 // Quiet wooded banks frame a broad winding river.
 let ground=x.createLinearGradient(0,230,0,H);ground.addColorStop(0,'#314c38');ground.addColorStop(1,'#162b26');x.fillStyle=ground;x.fillRect(0,220,W,H-220);
 // Distant evergreen ridge.
 for(let i=0;i<34;i++){const px=i*31-18,hh=68+Math.abs(Math.sin(i*7.31))*78,base=324+(i%3)*8,col=i%2?'#203b31':'#294535';x.fillStyle=col;x.fillRect(px+18,base-hh*.2,7,hh*.2);for(let tier=0;tier<3;tier++){const top=base-hh+tier*hh*.23,ww=hh*(.36-tier*.06);x.beginPath();x.moveTo(px,top+hh*.28);x.lineTo(px+21,top);x.lineTo(px+42,top+hh*.28);x.closePath();x.fill()}}
 // River widens toward the foreground, reflecting the sky.
 let water=x.createLinearGradient(0,305,0,405);water.addColorStop(0,'#36545b');water.addColorStop(.5,'#2d4c55');water.addColorStop(1,'#1a3944');x.fillStyle=water;x.beginPath();x.moveTo(0,324);x.bezierCurveTo(180,302,320,335,485,315);x.bezierCurveTo(650,298,800,333,960,312);x.lineTo(960,390);x.bezierCurveTo(780,409,630,378,475,398);x.bezierCurveTo(300,416,140,382,0,402);x.closePath();x.fill();
 // Soft moving reflections.
 x.save();x.strokeStyle='rgba(195,226,197,.24)';x.lineWidth=2;for(let i=0;i<6;i++){const yy=328+i*11,half=24+i*19,cx=480+Math.sin(t*1.2+i)*28;x.beginPath();x.moveTo(cx-half,yy);x.quadraticCurveTo(cx,yy+Math.sin(t*2+i)*2,cx+half,yy);x.stroke()}x.restore();
 // Foreground pines on both riverbanks.
 for(const [px,hh] of [[24,190],[108,142],[175,112],[780,125],[855,177],[930,205]]){const base=414;x.fillStyle='#152922';x.fillRect(px-4,base-hh*.46,8,hh*.46);for(let tier=0;tier<4;tier++){const top=base-hh+tier*hh*.2,ww=hh*(.34-tier*.035);x.beginPath();x.moveTo(px-ww,top+hh*.27);x.lineTo(px,top);x.lineTo(px+ww,top+hh*.27);x.closePath();x.fill()}}
 // Riverbank grass gives the gang a place to stand.
 x.fillStyle='#263e2b';x.beginPath();x.moveTo(0,397);x.quadraticCurveTo(160,384,320,403);x.lineTo(640,403);x.quadraticCurveTo(810,382,960,399);x.lineTo(960,425);x.lineTo(0,425);x.closePath();x.fill();
}
function drawIntro(){
 const q=introT;sky();introRiver();
 x.fillStyle='rgba(5,5,22,.38)';x.fillRect(0,0,W,H);
 x.fillStyle='rgba(7,7,25,.68)';x.fillRect(0,0,W,76);x.save();x.textAlign='center';x.font='900 34px system-ui,sans-serif';x.lineJoin='round';x.lineWidth=5;x.strokeStyle='#28111d';x.strokeText('ELK RIVER BANDIT',W/2,49);x.shadowColor='#ff783b';x.shadowBlur=15;x.fillStyle='#ffe28a';x.fillText('ELK RIVER BANDIT',W/2,49);x.restore();
 // Wordless opening: let the characters and the chase tell the story.
 // The tempting bin, with its lid wobbling every time the gang rummages.
 const rummage=q>3&&q<8.2,lid=Math.sin(q*11)* (rummage?10:2);
 x.save();x.fillStyle='rgba(0,0,0,.38)';x.beginPath();x.ellipse(480,422,95,10,0,0,7);x.fill();
 let metal=x.createLinearGradient(430,0,530,0);metal.addColorStop(0,'#36404c');metal.addColorStop(.22,'#87919a');metal.addColorStop(.5,'#59636b');metal.addColorStop(.8,'#a0a6a8');metal.addColorStop(1,'#343e48');x.fillStyle=metal;x.beginPath();x.roundRect(431,335,98,87,12);x.fill();x.strokeStyle='#c1c9c9';x.lineWidth=3;x.stroke();x.fillStyle='rgba(12,18,22,.55)';x.beginPath();x.ellipse(480,337,49,13,0,Math.PI,Math.PI*2);x.fill();x.fillStyle='#c4ccca';x.beginPath();x.ellipse(480,335,50,13,lid*.012,0,Math.PI*2);x.fill();x.strokeStyle='#3f4b52';x.lineWidth=3;x.stroke();
 for(let i=0;i<3;i++){x.fillStyle='rgba(18,27,32,.28)';x.fillRect(448+i*28,352,3,62)}
 // An embossed recycle mark makes it unmistakably a trash bin, without a label.
 x.strokeStyle='#78a98b';x.lineWidth=3;x.lineCap='round';x.beginPath();x.moveTo(471,387);x.lineTo(478,374);x.lineTo(485,374);x.moveTo(482,370);x.lineTo(487,374);x.lineTo(481,376);x.moveTo(488,379);x.lineTo(495,391);x.lineTo(491,397);x.moveTo(498,390);x.lineTo(494,397);x.lineTo(490,391);x.moveTo(485,400);x.lineTo(471,400);x.lineTo(467,393);x.moveTo(471,404);x.lineTo(466,398);x.lineTo(473,397);x.stroke();
 x.fillStyle='#202a30';x.fillRect(439,331,82,7);x.fillRect(448,421,10,5);x.fillRect(502,421,10,5);x.restore();
 // A clearly non-coin piece of rubbish bobs out of the bin as they rummage.
 if(rummage){x.save();x.translate(480+Math.sin(q*7)*44,325-Math.abs(Math.sin(q*5))*48);x.rotate(Math.sin(q*8)*.55);x.fillStyle='#3c899a';x.beginPath();x.roundRect(-8,-9,16,23,4);x.fill();x.fillRect(-4,-15,8,8);x.fillStyle='#b8d4cc';x.fillRect(-7,0,14,7);x.fillStyle='#d5bf84';x.fillRect(-4,-17,8,3);x.restore()}
 const homes=Array.from({length:9},(_,i)=>246+i*58.5);
 const gather=Math.max(0,Math.min(1,(q-.25)/2.6));
 for(let i=0;i<9;i++){
  let px=homes[i];if(q<2.85){const from=i<4?-90-i*47:1050+(i-4)*48;const e=gather*gather*(3-2*gather);px=from+(homes[i]-from)*e}
  let flee=Math.max(0,Math.min(1,(q-11.15)/2.65));if(flee>0){const dir=i<4?-1:1;px+=dir*flee*flee*560}
  const wobble=rummage?Math.sin(q*12+i*2.2)*3:0;
  if(q>8.05&&q<9.5)px+=Math.sin(q*38+i*5)*2;
  x.save();x.translate(px,420+wobble);const scale=.57;x.scale(i>=5?-scale:scale,scale);x.rotate(rummage?Math.sin(q*9+i)*.07:0);critter(i,q*8+i*.7,false,false);x.restore();
  if(rummage&&i%2===0&&Math.sin(q*8+i)>0.6){x.strokeStyle='#fff5c4';x.lineWidth=2;x.beginPath();x.moveTo(px-5,350+Math.sin(q*11+i)*8);x.lineTo(px,344+Math.sin(q*11+i)*8);x.lineTo(px+5,350+Math.sin(q*11+i)*8);x.stroke()}
 }
 // A very sleepy human, charging in slippers with a broom like it is a heroic weapon.
 const approach=Math.max(0,Math.min(1,(q-9.1)/1.25)),chase=Math.max(0,q-11.05),ownerX=q<9.1?1030:Math.max(548,1030-approach*240-chase*145);
 if(q>9.05){const run=Math.sin(q*16);x.save();x.translate(ownerX,420);x.scale(.9,.9);x.fillStyle='#25252d';x.beginPath();x.ellipse(0,2,30,6,0,0,7);x.fill();
  x.fillStyle='#38536a';x.fillRect(-18,-59,38,51);x.fillStyle='#d6a77e';x.beginPath();x.arc(1,-76,19,0,7);x.fill();x.fillStyle='#564237';x.beginPath();x.ellipse(1,-87,20,11,0,Math.PI,Math.PI*2);x.fill();x.fillRect(-19,-85,8,16);x.fillStyle='#2a2526';x.fillRect(7,-78,4,3);x.fillRect(-5,-78,4,3);x.fillStyle='#8d2630';x.beginPath();x.ellipse(1,-68,7,4,0,0,7);x.fill();
  x.fillStyle='#38536a';x.beginPath();x.moveTo(-18,-56);x.lineTo(18,-56);x.lineTo(25,-8);x.lineTo(-24,-8);x.closePath();x.fill();x.strokeStyle='#24394b';x.lineWidth=3;x.stroke();x.fillStyle='#d6a77e';x.lineWidth=8;x.lineCap='round';x.beginPath();x.moveTo(-15,-49);x.lineTo(-34+run*4,-72);x.moveTo(16,-49);x.lineTo(34-run*4,-72);x.stroke();
  x.fillStyle='#26313a';x.fillRect(-17,-8,13,7+run*4);x.fillRect(6,-8,13,7-run*4);x.fillStyle='#f5d176';x.beginPath();x.ellipse(-12,0,12,5,0,0,7);x.fill();x.beginPath();x.ellipse(12,0,12,5,0,0,7);x.fill();
  // Broom held high: dramatic, if you are a raccoon.
  x.strokeStyle='#744d35';x.lineWidth=5;x.beginPath();x.moveTo(-35,-70);x.lineTo(-60,-125);x.stroke();x.fillStyle='#d7b679';x.beginPath();x.moveTo(-67,-128);x.lineTo(-49,-136);x.lineTo(-43,-123);x.lineTo(-59,-117);x.fill();x.restore();
 }
 if(q>8.15&&q<11.5){for(let i=0;i<3;i++){x.strokeStyle='rgba(255,240,150,'+(0.65-i*.17)+')';x.lineWidth=2;x.beginPath();x.arc(480,320,60+i*17+Math.sin(q*30)*5,.8,2.3);x.stroke()}x.strokeStyle='#fff1a0';x.lineWidth=4;for(let i=0;i<8;i++){const a=i*Math.PI/4,rx=q<9.2?480:ownerX,ry=250;x.beginPath();x.moveTo(rx+Math.cos(a)*25,ry+Math.sin(a)*25);x.lineTo(rx+Math.cos(a)*37,ry+Math.sin(a)*37);x.stroke()}}
 // The human's flailing broom and the fleeing crew carry the whole punchline.
 x.fillStyle='rgba(255,255,255,.2)';x.fillRect(40,522,880,4);x.fillStyle='#ffd23f';x.fillRect(40,522,880*Math.min(1,q/15),4);
 if(q>14.1){x.globalAlpha=Math.min(1,(q-14.1)/.8);x.fillStyle='rgba(5,5,22,.58)';x.fillRect(0,0,W,H);x.globalAlpha=1}
}
function drawPauseOverlay(){x.fillStyle='rgba(5,4,20,.75)';x.fillRect(0,0,W,H);center('PAUSED',220,48,'#ffd23f');x.fillStyle='rgba(255,255,255,.12)';x.beginPath();x.roundRect(285,290,180,62,12);x.fill();x.beginPath();x.roundRect(495,290,180,62,12);x.fill();center('RESUME',328,19);center('BACK TO MENU',328,17);center('P / ESC to resume',380,14,'#9ad')}
function drawFunnyOverlay(){x.fillStyle='rgba(8,5,25,.76)';x.fillRect(0,0,W,H);center('INTERMISSION',150,40,'#ffd23f');x.save();x.translate(W/2,365+Math.sin(t*5)*12);x.scale(1.65,1.65);critter(who,t*10,false,false);x.restore();center('MAP '+funnyLevel+' CLEARED',445,18,'#fff');center('TAP TO CONTINUE',490,14,'#9ad')}
function drawTutorial(){x.fillStyle='rgba(5,4,22,.86)';x.fillRect(0,0,W,H);x.strokeStyle='#ffd23f';x.lineWidth=2;x.beginPath();x.roundRect(170,72,620,400,22);x.fillStyle='rgba(22,17,48,.96)';x.fill();x.stroke();center('HOW TO PLAY',120,31,'#ffd23f');const stage=Math.floor(tutorialTime/2.4)%3;const labels=['JUMP OVER TROUBLE','SLIDE UNDER LOW STUFF','SPIN TO BONK ENEMIES'];center(labels[stage],175,20,'#fff');x.save();x.translate(310,370+Math.sin(tutorialTime*5)*9);x.scale(1.55,1.55);critter(who,tutorialTime*8,stage===1,stage===0&&Math.sin(tutorialTime*3)>0);x.restore();x.fillStyle=stage===1?'#a06a3b':'#f0c24f';x.beginPath();x.roundRect(540,315,stage===1?150:58,stage===1?72:90,10);x.fill();if(stage===2){x.strokeStyle='#fff';x.lineWidth=5;x.beginPath();x.arc(340,342,68+Math.sin(tutorialTime*10)*8,0,6.2);x.stroke()}const lines=['SPACE / ↑ or tap left: jump (up to 3 times: triple jump!).','↓ / S or the slide button: crouch and glide beneath obstacles.','X / SHIFT: spin-bonk enemies · T / F: throw trash at anything · M: mute · P: pause.'];center(lines[stage],423,15,'#cde');center('The animal picker and difficulty buttons are on the start screen.',449,13,'#9ad');center('CLICK ANYWHERE TO RETURN',500,14,'#ffd23f')}
function drawReadyOverlay(){x.fillStyle='rgba(7,5,25,.82)';x.fillRect(120,168,720,130);x.strokeStyle='#ffd23f';x.lineWidth=2;x.strokeRect(120,168,720,130);center('PRE-LEVEL PEP TALK',201,16,'#ffd23f');center('“'+quip+'”',244,22,'#fff');center('Starting in '+Math.max(1,Math.ceil(readyClock))+'… tap or press SPACE to start',277,14,'#9ad')}
function draw(){if(S==='spelltest'){drawSpellTest();return}if(S==='pause'&&pausedFrom==='platformer'){drawPlatformer();drawPauseOverlay();return}if(S==='platformer'||(S==='funny'&&(funnyNext==='platformer'||funnyNext==='ready'||funnyNext==='platwin'&&readyFor==='platformer'))||(S==='platdead'||S==='platwin')||(S==='ready'&&readyFor==='platformer')){drawPlatformer();if(S==='funny')drawFunnyOverlay();if(S==='ready'){drawReadyOverlay()}if(S==='platdead'){x.fillStyle='rgba(5,4,20,.76)';x.fillRect(0,0,W,H);center('WOMP WOMP WOMP',220,44,'#ffd23f');center('The gang has discovered gravity.',270,21);center('CLICK OR SPACE TO RETRY THIS LEVEL',330,17,'#fff');center('Click the right side to return to the start screen.',365,14,'#9ad')}if(S==='platwin'){x.fillStyle='rgba(5,4,20,.76)';x.fillRect(0,0,W,H);center('ALL 10 LEVELS CLEARED!',230,40,'#ffd23f');center('Press SPACE or click to play again.',300,18,'#fff')}return}if(S==='animalgallery'){drawAnimalGallery();return}if(S=='gallery'){drawGallery();return}if(S==='title')forestMode=false;M=CUR()[Math.min(lvl,NM-1)];if(S=='intro'){drawIntro();return}
 x.save();if(shake>0)x.translate(rnd(-6,6)*shake*3,rnd(-6,6)*shake*3);
 sky();if(forestMode){forestScene();forestGround()}else{city();water();boardwalk()}drawObjs();
 for(const q of trail){const gx=(q.x??190)-(dist-q.d);x.fillStyle='rgba(150,200,255,'+(q.l*.9)+')';x.beginPath();x.roundRect(gx-14,q.y+q.h*.1,28,q.h*.8,10);x.fill()}
 bandit();drawShots();
 for(const p of parts){x.globalAlpha=Math.max(0,p.l*2);x.fillStyle=p.col;x.fillRect(p.x,p.y,p.s,p.s)}x.globalAlpha=1;
 for(const r of rings){x.globalAlpha=Math.max(0,r.l*2);x.strokeStyle='#bfe8ff';x.lineWidth=2;x.beginPath();x.ellipse(r.x,r.y,r.r,r.r*.3,0,0,7);x.stroke()}x.globalAlpha=1;
 for(const p of pops){x.globalAlpha=Math.min(1,p.l*2);x.font='bold 18px system-ui,sans-serif';x.textAlign='center';x.lineWidth=4;x.strokeStyle='rgba(0,0,0,.6)';x.strokeText(p.t,p.x-dist,p.y);x.fillStyle=p.col;x.fillText(p.t,p.x-dist,p.y)}x.globalAlpha=1;
 if(S=='play'&&v>380){const a=Math.min(.16,(v-380)/900);x.strokeStyle='rgba(255,255,255,'+a+')';x.lineWidth=1.5;for(let i=0;i<10;i++){const lx=W-((i*173+t*(900+i*80))%(W+300)),ly=50+(i*53)%(G-120);x.beginPath();x.moveTo(lx,ly);x.lineTo(lx+40+v*.1,ly);x.stroke()}}
 x.restore();
 weather();// vignette
 let vg=x.createRadialGradient(W/2,H/2,H*.45,W/2,H/2,H*.95);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,10,.55)');x.fillStyle=vg;x.fillRect(0,0,W,H);
 if(dflash>0){let rv=x.createRadialGradient(W/2,H/2,H*.2,W/2,H/2,H);rv.addColorStop(0,'rgba(255,0,40,0)');rv.addColorStop(1,'rgba(255,0,40,'+dflash*.55+')');x.fillStyle=rv;x.fillRect(0,0,W,H)}
 if(S!='title')hud();
 if(S=='play'&&banner>0&&banner<=3){const k=Math.min(1,(3-banner)*3),a=Math.min(1,banner,k),sl=(1-k)*-120;x.globalAlpha=a;x.save();x.translate(sl,0);
  let bg=x.createLinearGradient(0,0,W,0);bg.addColorStop(0,'rgba(0,0,0,0)');bg.addColorStop(.25,'rgba(0,0,0,.45)');bg.addColorStop(.75,'rgba(0,0,0,.45)');bg.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=bg;x.fillRect(0,118,W,136);
  x.fillStyle='#ffd23f';x.fillRect(W/2-170,126,340,2);x.fillRect(W/2-170,246,340,2);
  center('MAP '+(lvl+1)+' OF '+NM,150,24,'#ffd23f');center(M[0].toUpperCase(),198,46);center([...new Set(CURHZ()[Math.min(lvl,NM-1)])].map(k=>k=='e'?CURENP()[Math.min(lvl,NM-1)].map(n=>EN[n].n).join('/'):({c:forestMode?'rangers':'cops',b:forestMode?'rolling logs':'rolling barrels',h:forestMode?'hanging hazards: slide':'hangers: slide',s:forestMode?'geysers':'pulsing jets'})[k]).join(' · '),232,18,'#9ad');x.restore();x.globalAlpha=1}
 if(flash>0){x.fillStyle='rgba(255,255,255,'+flash*.5+')';x.fillRect(0,0,W,H)}
 if(S=='spellwin'){x.fillStyle='rgba(7,5,25,.82)';x.fillRect(0,0,W,H);center('WORD BANDIT!',200,46,'#8fffe0');center('You spelled every word!',257,23,'#fff');center(spellWords.length+' words completed',304,18,'#c9f7eb');center('CLICK OR PRESS SPACE TO PLAY AGAIN',364,16,'#ffe08b')}
 if(S=='win'){x.fillStyle='rgba(10,5,30,.65)';x.fillRect(0,0,W,H);for(let i=0;i<40;i++){x.fillStyle=hs(i*37,90,60);x.fillRect((i*97+t*60)%W,(i*53+t*140*(1+i%3*.3))%H,6,10)}center('YOU PULLED OFF THE HEIST!',220,52,'#ffd23f');center('All '+NM+' maps cleared  ·  Loot '+loot,276,24);if(Math.sin(t*4)>0)center('PRESS SPACE OR TAP TO PLAY AGAIN',340,20)}
 if(S=='title'){x.fillStyle='rgba(5,5,25,.5)';x.fillRect(0,0,W,H);
  x.save();x.globalCompositeOperation='lighter';for(const s of[-1,1]){x.save();x.translate(W/2+s*430,H);x.rotate(s*(-.5+Math.sin(t*.8+s)*.25));let bg=x.createLinearGradient(0,0,0,-520);bg.addColorStop(0,'rgba(255,240,180,.16)');bg.addColorStop(1,'rgba(255,240,180,0)');x.fillStyle=bg;x.beginPath();x.moveTo(-14,0);x.lineTo(14,0);x.lineTo(70,-520);x.lineTo(-70,-520);x.fill();x.restore()}x.restore();
  const btn=(r,label,o={})=>{const[bx,by,bw,bh]=r;x.save();x.fillStyle=o.fill||'rgba(8,6,24,.72)';x.beginPath();x.roundRect(bx,by,bw,bh,o.rad||10);x.fill();x.strokeStyle=o.stroke||'rgba(255,210,63,.6)';x.lineWidth=o.lw||1.25;x.stroke();x.fillStyle=o.col||'#ffd23f';x.font='bold '+(o.sz||13)+'px system-ui,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(label,bx+bw/2,by+bh/2+1);x.restore()};
  /* title */
  x.save();x.font='bold 64px system-ui,sans-serif';x.textAlign='left';x.textBaseline='alphabetic';const T='ELK RIVER BANDIT';let tw=0;const ws=[...T].map(ch=>{const w=x.measureText(ch).width;tw+=w;return w});let tx=W/2-tw/2;
  const tg=x.createLinearGradient(0,60,0,112);tg.addColorStop(0,'#fff3a0');tg.addColorStop(.5,'#ffd23f');tg.addColorStop(1,'#ff8a3d');
  x.shadowColor='#ff6a3d';x.shadowBlur=22;x.lineJoin='round';x.lineWidth=8;x.strokeStyle='#2a0f1f';
  [...T].forEach((ch,i)=>{const ty=108+Math.sin(t*3+i*.5)*4;x.strokeText(ch,tx,ty);x.fillStyle=tg;x.fillText(ch,tx,ty);tx+=ws[i]});x.restore();
  for(let i=0;i<14;i++){const sx2=W/2+Math.cos(i*2.4)*(250+(i%4)*22),sy2=84+Math.sin(i*1.7)*(26+(i%3)*8),sa=Math.max(0,Math.sin(t*3+i*1.3));x.globalAlpha=sa;x.fillStyle='#fff';x.fillRect(sx2-6*sa,sy2-1,12*sa,2);x.fillRect(sx2-1,sy2-6*sa,2,12*sa)}x.globalAlpha=1;
  {const a1=NM+' MAPS · ONE LONG HEIST ALONG THE RIVER  ·  ',a2='AND SPELLING GAMES!!!';x.save();x.font='bold 15px system-ui,sans-serif';x.textAlign='left';const w1=x.measureText(a1).width,w2=x.measureText(a2).width,x0=W/2-(w1+w2)/2;x.fillStyle='#b9c8ff';x.fillText(a1,x0,140);x.shadowColor='#4af0c8';x.shadowBlur=8;x.fillStyle='#7ff0d0';x.fillText(a2,x0+w1,140);x.restore()}
  /* top-left utility buttons */
  btn(TL.how,'? HOW TO PLAY');btn(TL.ani,'ANIMAL GALLERY');
  /* control panel */
  x.fillStyle='rgba(8,6,26,.62)';x.beginPath();x.roundRect(...TL.panel,18);x.fill();x.strokeStyle='rgba(255,255,255,.14)';x.lineWidth=1;x.stroke();
  /* animal picker: name only, bio is shown on one line below */
  for(let i=0;i<CH.length;i++){const col=i%5,row=Math.floor(i/5),cx0=TL.gx+col*(TL.gw+TL.gg),cy0=TL.gy+row*(TL.gh+TL.gg),sel=i==who,hov=i==bioHover;
   x.fillStyle=sel?'rgba(255,210,63,.24)':hov?'rgba(255,255,255,.13)':'rgba(255,255,255,.06)';x.beginPath();x.roundRect(cx0,cy0,TL.gw,TL.gh,10);x.fill();x.strokeStyle=sel?'#ffd23f':hov?'rgba(255,255,255,.5)':'rgba(255,255,255,.2)';x.lineWidth=sel?2:1;x.stroke();
   x.save();x.translate(cx0+19,cy0+TL.gh-5);x.scale(.36,.36);critter(i,sel?t*8:0,false,false);x.restore();
   x.textAlign='left';x.textBaseline='middle';x.fillStyle=sel?'#fff':'#cfd9f0';x.font='bold 12px system-ui,sans-serif';x.fillText(CH[i].n.split(' ')[0].toUpperCase(),cx0+37,cy0+TL.gh/2+1);x.textBaseline='alphabetic'}
  {const k=bioHover>=0?bioHover:who;let line=CH[k].n+' — '+CH[k].d;x.font='13px system-ui,sans-serif';x.textAlign='center';let fs=13;while(x.measureText(line).width>TL.panel[2]-28&&fs>10){fs--;x.font=fs+'px system-ui,sans-serif'}x.fillStyle='#ffe39a';x.fillText(line,W/2,TL.bio)}
  /* difficulty */
  for(let i=0;i<3;i++){const bx=W/2-(3*TL.dw+2*TL.dg)/2+i*(TL.dw+TL.dg),sel=i==diff,d=DF[i];btn([bx,TL.dy,TL.dw,TL.dh],d.n,{fill:sel?d.col:'rgba(255,255,255,.08)',stroke:sel?'#fff':'rgba(255,255,255,.28)',lw:sel?2.5:1,col:sel?'#10102a':'#cfd9f0',sz:14,rad:9})}
  /* game-mode cards: click one to start */
  {const MODES=[['INFINITE RUNNER','Auto-run · jump'],['PLATFORMER','10 levels'],['FREE RUN','60 maps'],['SPELLING TEST','Watch · hide · spell']];
   for(let i=0;i<4;i++){const bx=TL.mx+i*(TL.cw+TL.cg),by=TL.my,bw=TL.cw,bh=TL.ch,hv=modeHover==i,im=modeImgs[i],iw=bw-8;
    x.save();x.fillStyle=hv?'rgba(255,210,63,.2)':'rgba(255,255,255,.07)';x.beginPath();x.roundRect(bx,by,bw,bh,12);x.fill();
    x.save();x.beginPath();x.roundRect(bx+4,by+4,iw,TL.th,9);x.clip();if(im.complete&&im.naturalWidth)x.drawImage(im,bx+4,by+4,iw,TL.th);else{x.fillStyle='#1a2236';x.fillRect(bx+4,by+4,iw,TL.th)}
    if(hv){x.fillStyle='rgba(0,0,0,.3)';x.fillRect(bx+4,by+4,iw,TL.th);x.fillStyle='#ffd23f';x.beginPath();x.moveTo(bx+bw/2-11,by+4+TL.th/2-15);x.lineTo(bx+bw/2+15,by+4+TL.th/2);x.lineTo(bx+bw/2-11,by+4+TL.th/2+15);x.fill()}
    x.restore();x.strokeStyle=hv?'#ffd23f':'rgba(255,210,63,.5)';x.lineWidth=hv?2.5:1.5;x.beginPath();x.roundRect(bx,by,bw,bh,12);x.stroke();
    x.textAlign='center';x.font='bold 11px system-ui,sans-serif';x.fillStyle=hv?'#fff':'#ffe9a8';x.fillText(MODES[i][0],bx+bw/2,by+4+TL.th+16);x.font='10px system-ui,sans-serif';x.fillStyle='#aab6d6';x.fillText(MODES[i][1],bx+bw/2,by+4+TL.th+29);x.restore()}}
  btn(TL.spl,spellingMode?'SPELLING MODE: ON':'SPELLING MODE: OFF',{sz:12,rad:9,fill:spellingMode?'rgba(70,220,180,.28)':'rgba(255,255,255,.06)',stroke:spellingMode?'#63e7c5':'rgba(255,255,255,.3)',col:spellingMode?'#d8fff3':'#cfd9f0',lw:spellingMode?2:1});
  /* footer */
  if(spellingMode){center(spellError||'Paste words above, then click a game mode',536,13,spellError?'#ffb89d':'#a7e9db')}else center('SPACE: infinite runner  ·  ← → difficulty  ·  C animal  ·  G map gallery  ·  T throw  ·  M mute',506,12,'#aab6d6');
  x.save();x.textAlign='right';x.font='bold 16px system-ui,sans-serif';x.shadowColor='#ffd23f';x.shadowBlur=10;x.fillStyle='#ffe9a8';x.fillText('JORJ26',W-24,H-22);x.restore()}
 if(S=='over'){x.fillStyle='rgba(20,0,10,.6)';x.fillRect(0,0,W,H);
  {const fl=Math.sin(t*10)>0,bx=fl?0:W;let sg=x.createRadialGradient(bx,0,10,bx,0,460);sg.addColorStop(0,fl?'rgba(255,40,40,.4)':'rgba(40,90,255,.4)');sg.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=sg;x.fillRect(0,0,W,H)}
  x.save();x.shadowColor='#f00';x.shadowBlur=30;center('BUSTED!',230+Math.sin(t*30)*Math.max(0,.4-t)*20,64,'#ff5a5a');x.restore();center('Difficulty: '+DF[diff].n+'   (◀ ▶ to change)  ·  '+CH[who].n+' (C to switch)  ·  G: gallery',384,16,'#9ad');
  center('Loot '+loot+'  ·  '+Math.floor(dist/10)+' m  ·  Score '+sc(),284,24);
  if(t>.6&&Math.sin(t*4)>0)center('RETRY FROM MAP '+(cp+1)+' · SPACE OR TAP',340,20)}
 if(S=='title'||S=='over'||S=='win')galBtn();if(S==='tutorial')drawTutorial();if(S==='funny')drawFunnyOverlay();if(S==='ready')drawReadyOverlay();
 if(S==='pause')drawPauseOverlay()
 if(S==='platwin'){x.fillStyle='rgba(5,4,20,.78)';x.fillRect(0,0,W,H);center('THE GANG CLEARED ALL 10!',230,42,'#ffd23f');center('A wildly unreasonable amount of platforming.',275,20);center('Tap or press SPACE to run it back',335,17,'#9ad')}
 celebFX();
}
function drawPlatformer(){const pal=[['#90cad1','#d8e7b2','#427747'],['#a9d4db','#e8d9a6','#658949'],['#252a50','#9c789e','#31385a'],['#edb66c','#f1d486','#a98642'],['#d3eced','#b8d4d3','#547e83'],['#c7a9df','#edc2cc','#738b57'],['#d6b68f','#eed59d','#66814d'],['#87c7bd','#c8e5ac','#2e756c'],['#5b82a2','#d8c9a0','#5d674b'],['#eaa371','#f1da9a','#78864b']][plat.level%10];let bg=x.createLinearGradient(0,0,0,H);bg.addColorStop(0,pal[0]);bg.addColorStop(.72,pal[1]);bg.addColorStop(1,pal[2]);x.fillStyle=bg;x.fillRect(0,0,W,H);const cam=plat.camera;for(let i=0;i<14;i++){const bx=((i*118-cam*.24)%1700+1700)%1700-100;x.fillStyle=i%2?'rgba(31,67,61,.28)':'rgba(34,75,53,.36)';x.beginPath();x.arc(bx,210+(i*39)%105,40+(i*11)%25,0,7);x.fill()}let start=0;for(const g of [...plat.gaps,{x:plat.goal+500,w:9999}]){const a=Math.max(start,g.x),b=Math.min(plat.goal+500,g.x+g.w);if(a>start){x.fillStyle=pal[2];x.fillRect(start-cam,G,a-start,H-G);x.fillStyle='#a4d46e';x.fillRect(start-cam,G,a-start,9);x.fillStyle='rgba(0,0,0,.16)';x.fillRect(start-cam,G+35,a-start,4)}start=Math.max(start,g.x+g.w)}for(const g of plat.gaps){const sx=g.x-cam;x.fillStyle='rgba(16,25,42,.86)';x.fillRect(sx,G,g.w,H-G);x.fillStyle='#3c2836';x.fillRect(sx,G,g.w,10);for(let q=0;q<4;q++){x.fillStyle='#ad6350';x.beginPath();x.moveTo(sx+q*24,G+4);x.lineTo(sx+q*24+12,G+22);x.lineTo(sx+q*24+24,G+4);x.fill()}}for(const b of plat.platforms){const sx=b.x-cam;if(sx>-160&&sx<W+160){x.fillStyle=b.mv?'#4a6a8a':b.cr?'#8a6a4a':'#765234';x.beginPath();x.roundRect(sx+(b.cr&&b.fall&&b.fall<.55?Math.sin(t*60)*2:0),b.y,b.w,24,6);x.fill();x.fillStyle=b.mv?'#8ad0ff':b.cr?'#d6b27a':'#9acb67';x.fillRect(sx,b.y,b.w,7);x.fillStyle='rgba(255,255,255,.13)';x.fillRect(sx+8,b.y+10,b.w-16,2)}}for(const q of plat.coins){if(q.got)continue;const qx=q.x-cam;if(qx<-30||qx>W+30)continue;const qy=q.y+Math.sin(t*4+q.x*.05)*3,sw=Math.abs(Math.cos(t*3+q.x*.03))*.75+.25;x.fillStyle='rgba(255,210,63,.22)';x.beginPath();x.arc(qx,qy,15,0,7);x.fill();x.fillStyle='#ffd23f';x.beginPath();x.ellipse(qx,qy,10*sw,11,0,0,7);x.fill();x.strokeStyle='#b8801a';x.lineWidth=2;x.stroke();x.fillStyle='rgba(255,255,255,.6)';x.beginPath();x.ellipse(qx-2*sw,qy-3,3*sw,4,0,0,7);x.fill()}glowDraw(()=>{for(const h of plat.hazards){const sx=h.x-cam;if(sx>-60&&sx<W+60&&h.sk){OB[h.sk].dr(sx,G-h.h,46,h.h)}else if(sx>-60&&sx<W+60){x.fillStyle='#bf5444';for(let q=0;q<4;q++){x.beginPath();x.moveTo(sx+q*12,G);x.lineTo(sx+q*12+6,G-h.h);x.lineTo(sx+q*12+12,G);x.fill()}}}},plat.hazards.length>0);for(const sp of plat.springs){const sx=sp.x-cam;if(sx<-60||sx>W+60)continue;const hh=22-(sp.sq>0?10:0);x.fillStyle='#d9d9e8';x.fillRect(sx,G-6,50,6);x.strokeStyle='#8fb3ff';x.lineWidth=4;x.beginPath();for(let q=0;q<5;q++){x.lineTo(sx+8+(q%2)*34,G-6-q*hh/5)}x.stroke();x.fillStyle='#ff5e7e';x.beginPath();x.roundRect(sx,G-6-hh-6,50,8,4);x.fill()}
glowDraw(()=>{for(const f of plat.fires){const sx=f.x-cam;if(sx<-60||sx>W+60)continue;x.fillStyle='#3a2a2a';x.fillRect(sx-2,G-8,50,8);if(f.on){for(let q=0;q<4;q++){const fh=34+Math.sin(t*14+q*2+f.ph)*10;x.fillStyle=q%2?'#ffb02e':'#ff5a2e';x.beginPath();x.moveTo(sx+q*12,G-8);x.quadraticCurveTo(sx+q*12+6,G-8-fh*1.2,sx+q*12+12,G-8);x.fill()}}else{x.fillStyle='rgba(255,120,60,.5)';x.fillRect(sx+6,G-12,36,4)}}
for(const sw of plat.saws){const sx=sw.x-cam;if(sx<-60||sx>W+60)continue;if(!OUTL){x.strokeStyle='rgba(255,255,255,.2)';x.lineWidth=3;x.beginPath();x.moveTo(sx,G);x.lineTo(sx,sw.y);x.stroke();}x.save();x.translate(sx,sw.y);x.rotate(t*12);x.fillStyle='#c9ced8';x.beginPath();for(let q=0;q<16;q++){const r=q%2?sw.r-6:sw.r+4,an=q/16*6.283;x.lineTo(Math.cos(an)*r,Math.sin(an)*r)}x.fill();x.fillStyle='#6a7080';x.beginPath();x.arc(0,0,7,0,7);x.fill();x.restore()}
for(const e of plat.enemies){if(e.dead)continue;const sx=e.x-cam;if(sx<-70||sx>W+70)continue;const k=e.kind,bob=Math.sin(t*12+e.home)*3,ey=(k=='flyer'||k=='hopper')?e.y+42-42:G-42,by=(k=='flyer'||k=='hopper')?e.y+42:G;const col=k=='spiky'?['#3b3b52','#d7d7ee']:k=='hopper'?['#2f6a46','#8ff0a8']:k=='flyer'?['#5b3a82','#d7a8ff']:k=='charger'?['#8a2c2c','#ffb0a0']:['#5e3346','#ef7c6d'];const AE=e.art&&EN[e.art];if(AE){const sc=Math.max(.9,Math.min(1.9,50/Math.max(AE.w,AE.h*1.1)));x.save();x.translate(sx+22,by+(k=='flyer'?-8:0));x.scale(e.vx>0?-sc:sc,sc);x.translate(-AE.w/2,-AE.h);AE.dr(0,0,{ph:t*(k=='charger'&&e.warn?1.6:1),y:0});x.restore();if(k=='charger'&&e.warn){x.fillStyle='#ffec6a';x.font='bold 16px system-ui';x.textAlign='center';x.fillText('!',sx+22,by-62)}continue}x.fillStyle=col[0];x.beginPath();x.ellipse(sx+22,by-20+bob,23,21,0,0,7);x.fill();if(k=='spiky'){x.fillStyle=col[1];for(let q=0;q<6;q++){x.beginPath();x.moveTo(sx+4+q*7,by-34+bob);x.lineTo(sx+7.5+q*7,by-52+bob);x.lineTo(sx+11+q*7,by-34+bob);x.fill()}}else if(k=='flyer'){x.fillStyle=col[1];const fl=Math.sin(t*20)*14;x.beginPath();x.ellipse(sx+4,by-34+bob,16,6+Math.abs(fl)/3,-.5,0,7);x.ellipse(sx+40,by-34+bob,16,6+Math.abs(fl)/3,.5,0,7);x.fill()}else{x.fillStyle=col[1];x.beginPath();x.arc(sx+12,by-37+bob,9,0,7);x.arc(sx+31,by-37+bob,9,0,7);x.fill()}x.fillStyle='#fff';x.fillRect(sx+12,by-27+bob,6,7);x.fillRect(sx+27,by-27+bob,6,7);x.fillStyle=k=='charger'&&e.warn?'#f00':'#20202b';x.fillRect(sx+15,by-25+bob,3,4);x.fillRect(sx+29,by-25+bob,3,4);if(k=='charger'&&e.warn){x.fillStyle='#ffec6a';x.font='bold 16px system-ui';x.textAlign='center';x.fillText('!',sx+22,by-60)}}},plat.fires.length+plat.saws.length+plat.enemies.length>0);
 for(const sh of plat.shots){x.save();x.translate(sh.x-cam,sh.y);x.rotate(sh.r);x.fillStyle='#7bbf6a';x.fillRect(-8,-8,16,16);x.fillStyle='#2e5a2a';x.fillRect(-4,-4,8,8);x.restore()}
if(spellActive)for(const letter of plat.spellLetters){if(letter.got)continue;const lx=letter.x-cam,ly=letter.y+Math.sin(t*5+letter.x*.02)*3;if(lx>-40&&lx<W+40){x.fillStyle='rgba(60,235,190,.2)';x.beginPath();x.arc(lx,ly,28,0,7);x.fill();x.fillStyle='#2fd5aa';x.beginPath();x.arc(lx,ly,17,0,7);x.fill();x.strokeStyle='#eafff8';x.lineWidth=2;x.stroke();x.fillStyle='#08382f';x.font='bold 20px system-ui';x.textAlign='center';x.textBaseline='middle';x.fillText(letter.ch,lx,ly);x.textBaseline='alphabetic'}}const gx=plat.goal-cam;x.fillStyle='#f2d36d';x.fillRect(gx,G-175,9,175);x.fillStyle='#e85e52';x.beginPath();x.moveTo(gx+9,G-174);x.lineTo(gx+84,G-151);x.lineTo(gx+9,G-126);x.fill();x.fillStyle='#fff2b0';x.font='bold 13px system-ui';x.textAlign='center';x.fillText('EXIT',gx+47,G-145);const sx=plat.x-cam;x.save();x.translate(sx+plat.w/2,plat.y+plat.h);x.scale(1.6*(plat.face<0?-1:1),1.6);if(plat.spin>0){x.translate(0,-plat.h/2.4);x.rotate((.45-plat.spin)/.45*12.57);x.translate(0,plat.h/2.4)}critter(who,t*8,false,!plat.on);x.restore();for(const f of plat.fx){const fx=f.x-cam,a=f.l/f.m;if(f.k=='ring'){x.strokeStyle='rgba(255,255,255,'+a+')';x.lineWidth=3;x.beginPath();x.arc(fx,f.y,(f.big?95:30)*(1-a)+8,0,7);x.stroke()}else if(f.k=='dot'){x.fillStyle='rgba(255,255,255,'+a*.7+')';x.beginPath();x.arc(fx,f.y,6*a,0,7);x.fill()}else{x.fillStyle='rgba(255,236,106,'+a+')';x.font='bold 16px system-ui';x.textAlign='center';x.fillText(f.t,fx,f.y-(1-a)*30)}}center(PLAT_NAMES[plat.level]+' · '+(plat.level+1)+'/10',31,22,'#173e45');center(spellActive?'SPELLING · COLLECT THE LETTERS IN ORDER':'← → move · SPACE x3 jump · X spin · T throw · V dash · stomp enemies',56,13,'#173e45');if(spellActive){const wi=Math.min(spellWordIndex,Math.max(0,spellWords.length-1)),word=spellWords[wi]||'',tile=26,gap=4,left=(W-word.length*(tile+gap)+gap)/2;for(let i=0;i<word.length;i++){const bx=left+i*(tile+gap);x.fillStyle=i<spellLetterIndex?'#4ad7b2':'rgba(255,255,255,.42)';x.beginPath();x.roundRect(bx,68,tile,27,6);x.fill();x.fillStyle=i<spellLetterIndex?'#07382d':'#fff';x.font='bold 16px system-ui';x.textAlign='center';x.fillText(i<spellLetterIndex?word[i]:'·',bx+tile/2,87)}}if(!spellActive){const tot=plat.coins.length,got=plat.coins.filter(q=>q.got).length;x.fillStyle='rgba(12,24,36,.6)';x.beginPath();x.roundRect(20,14,118,28,10);x.fill();x.fillStyle='#ffd23f';x.beginPath();x.arc(38,28,8,0,7);x.fill();x.fillStyle='#fff';x.font='bold 14px system-ui';x.textAlign='left';x.fillText('COINS '+got+'/'+tot,52,33)}actionButtons();x.fillStyle='rgba(12,24,36,.6)';x.beginPath();x.roundRect(20,48,118,24,10);x.fill();x.fillStyle='#fff';x.font='bold 13px system-ui';x.textAlign='left';x.fillText('TRASH '+ammo,34,65);for(const [bx,label] of (mobileOn?[]:[[68,'◀'],[202,'▶'],[588,'JUMP'],[690,'SPIN'],[792,'THROW'],[894,'DASH']])){x.fillStyle='rgba(12,24,36,.62)';x.beginPath();x.roundRect(bx-47,H-82,94,58,14);x.fill();x.strokeStyle='rgba(255,255,255,.55)';x.stroke();x.fillStyle='#fff';x.font='bold 20px system-ui';x.textAlign='center';x.fillText(label,bx,H-46)}}

sound('intro');reset();P.alive=true;let last=performance.now();
function loop(n){const dt=Math.min(.033,(n-last)/1000);last=n;
 if(S=='title'){dist+=120*dt;t+=dt;P.run+=dt*5;parts=[]}else update(dt);
 if(S=='title'){objs=[]}syncSpellInput();syncTestInput();draw();drawMute();requestAnimationFrame(loop)}
requestAnimationFrame(loop);


/* ===== Mobile view (iPhone): on-screen controls + rotate prompt ===== */
let mobileOn=false,mobUI=null,rotUI=null,rotDismissed=false;
function mobCSS(){if(document.getElementById('mobcss'))return;const st=document.createElement('style');st.id='mobcss';st.textContent=`
html.mobile,html.mobile body{position:fixed;inset:0;width:100%;height:100%;overscroll-behavior:none;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
html.mobile canvas{max-height:100dvh;max-width:calc(100dvh*16/9)}
html.mobile #spellingWords,html.mobile #testWord{font-size:16px!important;-webkit-user-select:text;user-select:text}
#mobUI{position:fixed;inset:0;z-index:6;pointer-events:none;display:none;font-family:system-ui,-apple-system,sans-serif}
#mobUI .mb{position:absolute;pointer-events:auto;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;color:#fff;font-weight:900;font-size:11px;letter-spacing:.04em;background:rgba(14,20,40,.52);border:2px solid rgba(255,255,255,.55);border-radius:50%;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);text-shadow:0 1px 2px #0008}
#mobUI .mb b{font-size:24px;line-height:1}
#mobUI .mb.on{background:rgba(255,210,63,.75);color:#1a1a2e;border-color:#fff;transform:scale(.94)}
#mobUI .big{width:92px;height:92px}#mobUI .sm{width:68px;height:68px}#mobUI .mv{width:78px;height:78px;border-radius:22px}
@media (max-height:360px){#mobUI .big{width:78px;height:78px}#mobUI .sm{width:58px;height:58px}#mobUI .mv{width:66px;height:66px}}
#rotUI{position:fixed;inset:0;z-index:9;display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#0b0a1af2;color:#fff;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:24px}
#rotUI .ph{font-size:64px;animation:rotph 2.4s ease-in-out infinite}@keyframes rotph{0%,30%{transform:rotate(0)}60%,100%{transform:rotate(-90deg)}}
#rotUI p{margin:0;font-size:20px;font-weight:800}#rotUI small{opacity:.75;font-size:14px}
#rotUI button{margin-top:6px;min-height:46px;padding:0 22px;font:800 16px system-ui;color:#1a1a2e;background:#ffd23f;border:0;border-radius:12px}
`;document.head.appendChild(st)}
function mobKey(code,down){window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code,key:code,bubbles:true,cancelable:true}))}
function buildMobileUI(){mobCSS();
 mobUI=document.createElement('div');mobUI.id='mobUI';
 const inset=(side)=>`calc(env(safe-area-inset-${side},0px) + 14px)`,bot=`calc(env(safe-area-inset-bottom,0px) + 14px)`;
 const defs=[
  ['L','mv','◀','',{left:inset('left'),bottom:bot},'ArrowLeft',1],
  ['R','mv','▶','',{left:`calc(env(safe-area-inset-left,0px) + 106px)`,bottom:bot},'ArrowRight',1],
  ['J','big','⬆','JUMP',{right:inset('right'),bottom:bot},'Space',0],
  ['S','sm','⬇','SLIDE',{right:`calc(env(safe-area-inset-right,0px) + 118px)`,bottom:bot},'KeyS',0],
  ['X','sm','🌀','SPIN',{right:`calc(env(safe-area-inset-right,0px) + 118px)`,bottom:`calc(env(safe-area-inset-bottom,0px) + 92px)`},'KeyX',0],
  ['T','sm','🗑','THROW',{right:inset('right'),bottom:`calc(env(safe-area-inset-bottom,0px) + 118px)`},'KeyT',0]
 ];
 for(const [id,cls,ico,lab,pos,code,hold] of defs){const b=document.createElement('div');b.className='mb '+cls;b.id='mb'+id;b.setAttribute('role','button');b.setAttribute('aria-label',lab||code);b.innerHTML=`<b>${ico}</b>${lab?`<span>${lab}</span>`:''}`;Object.assign(b.style,pos);
  const down=e=>{e.preventDefault();try{b.setPointerCapture(e.pointerId)}catch(_){}b.classList.add('on');mobKey(code,true);if(!hold)setTimeout(()=>mobKey(code,false),90)};
  const up=e=>{if(!b.classList.contains('on'))return;b.classList.remove('on');if(hold)mobKey(code,false)};
  b.addEventListener('pointerdown',down);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);b.addEventListener('contextmenu',e=>e.preventDefault());
  mobUI.appendChild(b)}
 document.body.appendChild(mobUI);
 rotUI=document.createElement('div');rotUI.id='rotUI';rotUI.innerHTML='<div class="ph">📱</div><p>Turn your iPhone sideways</p><small>Elk River Bandit plays best in landscape.</small><button type="button">Play anyway</button>';
 rotUI.querySelector('button').addEventListener('click',()=>{rotDismissed=true;mobSync()});
 document.body.appendChild(rotUI)}
function mobSync(){if(!mobUI)return;const portrait=innerHeight>innerWidth;if(!portrait)rotDismissed=false;
 rotUI.style.display=mobileOn&&portrait&&!rotDismissed?'flex':'none';
 const playing=S==='play'||S==='platformer';mobUI.style.display=mobileOn&&playing&&rotUI.style.display==='none'?'block':'none';
 const sl=document.querySelector('#mbS span');if(sl)sl.textContent=S==='platformer'?'DASH':'SLIDE';
 const tl=document.querySelector('#mbT span');if(tl)tl.textContent='THROW '+ammo}
function setMobile(on){mobileOn=!!on;document.documentElement.classList.toggle('mobile',mobileOn);if(mobileOn&&!mobUI)buildMobileUI();if(mobileOn)mobCSS();mobSync()}
window.setMobile=setMobile;setInterval(mobSync,150);addEventListener('resize',mobSync);addEventListener('orientationchange',mobSync);
try{if(window.parent===window&&/iPhone|iPod/.test(navigator.userAgent))setMobile(true)}catch(e){}

window.erbApi={songs:songList.slice(),
mute(m){muted=!!m;try{localStorage.setItem('erb_muted',muted?'1':'0')}catch(e){}if(musicAudio)musicAudio.muted=muted;if(introAudio)introAudio.muted=muted},
isMuted(){return muted},
volumes(m,s2){window.erbMus=m;window.erbSfx=s2;if(musicAudio)musicAudio.volume=Math.min(1,.34*m);if(introAudio)introAudio.volume=Math.min(1,.28*m)},
playSong(id){if(!songList.includes(id))return;lastSong=id;audioFiles.music='audio/'+id+'.mp3';if(!musicAudio){sound('music')}else{musicAudio.src=audioFiles.music;musicAudio.currentTime=0;musicAudio.play().catch(()=>{})}try{window.erbOnSong&&window.erbOnSong(id,false)}catch(e){}},
pauseMusic(){const p=!!(musicAudio&&!musicAudio.paused);if(p)musicAudio.pause();return p},
resume(){if(musicAudio)musicAudio.play().catch(()=>{})},
pauseGame(){if(S==='play'||S==='platformer')pauseGame()},
state(){return S},score(){try{return sc()}catch(e){return 0}},hi(){return hi},nowPlaying(){return lastSong}};
})();
