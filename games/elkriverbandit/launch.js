/* Elk River Bandit — launch layer: settings, downloads, stats, achievements, offline, backups. */
(function(){
"use strict";
var CFG=window.ERB_CONFIG||{repo:"",siteUrl:""},VER=window.ERB_VERSION||"1.0.0",BUILD=window.ERB_BUILD||"";
var api=window.erbApi||{songs:[],mute:function(){},isMuted:function(){return false},volumes:function(){},playSong:function(){},pauseMusic:function(){return false},resume:function(){},pauseGame:function(){},state:function(){return""},hi:function(){return 0},nowPlaying:function(){return""}};
var $=function(s){return document.querySelector(s)},$$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
var isNative=!!(window.erbNative||(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform()));
var errors=[];

/* ---------- storage ---------- */
var mem={},storeOK=true;
function lget(k){try{var v=localStorage.getItem(k);return v===null?(k in mem?mem[k]:null):v}catch(e){return k in mem?mem[k]:null}}
function lset(k,v){mem[k]=v;try{localStorage.setItem(k,v)}catch(e){}}
function jget(k,d){try{var v=JSON.parse(lget(k));return v&&typeof v==="object"?v:d}catch(e){return d}}
try{localStorage.setItem("erb2_t","1");localStorage.removeItem("erb2_t")}catch(e){storeOK=false;$("#storewarn").hidden=false}

/* ---------- settings ---------- */
var set=Object.assign({mus:50,sfx:50,hap:true,pauseHid:true,wake:true,song:"shuffle"},jget("erb2_settings",{}));
function saveSet(){lset("erb2_settings",JSON.stringify(set))}
function applyAudio(){api.volumes(set.mus/50,set.sfx/50);window.erbSong=set.song==="shuffle"?null:set.song}
function title(id){return id==="funky-soundtrack"?"Funky Soundtrack":id.split("-").map(function(w){return w.charAt(0).toUpperCase()+w.slice(1)}).join(" ")}

/* ---------- toasts / confirm ---------- */
function stopBubble(el){["pointerdown","pointerup","pointermove","mousedown","mouseup","touchstart","touchend","touchmove","keydown","keyup","wheel"].forEach(function(t){el.addEventListener(t,function(e){e.stopPropagation()},{passive:true})})}
function toast(msg,btnText,btnHref,ms){
  var t=document.createElement("div");t.className="toast";var s=document.createElement("span");s.textContent=msg;t.appendChild(s);
  if(btnText){var b=document.createElement(btnHref&&typeof btnHref==="string"?"a":"button");b.textContent=btnText;
    if(typeof btnHref==="string"){b.href=btnHref;b.target="_blank";b.rel="noopener"}else b.onclick=function(){t.remove();btnHref&&btnHref()};
    t.appendChild(b)}
  stopBubble(t);$("#toasts").appendChild(t);setTimeout(function(){t.remove()},ms||(btnText?12000:3500));return t}
function confirmDlg(ttl,txt,cb){var d=$("#dlgConfirm");$("#tConf").textContent=ttl;$("#confTxt").textContent=txt;d.onclose=function(){if(d.returnValue==="yes")cb()};d.returnValue="";d.showModal()}
["#gear","#dlgSet","#dlgConfirm","#rotate"].forEach(function(s){stopBubble($(s))});

/* ---------- stats + achievements ---------- */
var stats=Object.assign({runs:0,secs:0,coins:0,hits:0,jumps:0,songs:[],days:[],ach:{}},jget("erb2_stats",{}));
var dirty=false;function saveStats(){if(dirty){lset("erb2_stats",JSON.stringify(stats));dirty=false}}
setInterval(saveStats,5000);window.addEventListener("pagehide",saveStats);
var ACH=[
 ["first","🎮","First run","Start your first game",function(s){return s.runs>=1}],
 ["runs10","🏃","Regular","Play 10 games",function(s){return s.runs>=10}],
 ["runs50","🔥","Hooked","Play 50 games",function(s){return s.runs>=50}],
 ["coin100","🪙","Pocket change","Collect 100 coins",function(s){return s.coins>=100}],
 ["coin1000","💰","Loot goblin","Collect 1,000 coins",function(s){return s.coins>=1000}],
 ["hit10","💥","Ouch!","Get hit 10 times",function(s){return s.hits>=10}],
 ["time30","⏱️","Settled in","Play for 30 minutes",function(s){return s.secs>=1800}],
 ["song5","🎧","Music lover","Hear 5 different songs",function(s){return s.songs.length>=5}],
 ["song21","📻","Full playlist","Hear every song",function(s){return api.songs.length>0&&s.songs.length>=api.songs.length}],
 ["days3","📅","Come back soon","Play on 3 different days",function(s){return s.days.length>=3}]];
function checkAch(){ACH.forEach(function(a){if(!stats.ach[a[0]]&&a[4](stats)){stats.ach[a[0]]=Date.now();dirty=true;toast("🏆 Achievement: "+a[2]+" — "+a[3])}})}
function today(){var d=new Date();return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()}
function haptic(ms){if(!set.hap)return;try{var H=window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.Haptics;if(H&&H.vibrate){H.vibrate({duration:ms});return}}catch(e){}try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}}
window.erbOnSound=function(k){
  if(k==="coin"){stats.coins++;haptic(8)}else if(k==="hit"){stats.hits++;haptic(70)}else if(k==="jump")stats.jumps++;else return;
  dirty=true;if(stats.coins%25===0||k==="hit")checkAch()};
window.erbOnSong=function(id,isRun){
  if(stats.songs.indexOf(id)<0)stats.songs.push(id);
  if(isRun){stats.runs++;var d=today();if(stats.days.indexOf(d)<0)stats.days.push(d)}
  dirty=true;checkAch();saveStats();
  var np=$("#nowp");if(np)np.textContent="♪ Now playing: "+title(id);
  if(!api.isMuted())toast("♪ "+title(id),null,null,2600)};

/* ---------- state polling: gear visibility, play time, wake lock, rotate hint ---------- */
var PLAYING={play:1,platformer:1,spelltest:1};
var wl=null;
function wake(on){
  if(on&&!wl&&navigator.wakeLock){navigator.wakeLock.request("screen").then(function(l){wl=l;l.addEventListener("release",function(){wl=null})}).catch(function(){})}
  else if(!on&&wl){try{wl.release()}catch(e){}wl=null}}
function place(){var r=$("#c").getBoundingClientRect(),g=$("#gear"),z=Math.max(36,Math.min(48,r.width*.036));g.style.width=g.style.height=z+"px";g.style.fontSize=Math.round(z*.48)+"px";g.style.left=Math.round(r.left+r.width*.19)+"px";g.style.top=Math.round(r.top+r.height*.022)+"px"}
addEventListener("resize",place);place();
setInterval(function(){
  place();var s=api.state(),playing=!!PLAYING[s];
  $("#gear").classList.toggle("hide",playing||$("#dlgSet").open);
  if(playing&&!document.hidden){stats.secs+=.5;dirty=true}
  wake(playing&&set.wake&&!document.hidden);
},500);
function rot(){$("#rotate").hidden=!(innerHeight>innerWidth*1.1&&innerWidth<820)}
addEventListener("resize",rot);addEventListener("orientationchange",function(){setTimeout(rot,250)});rot();
var locked=false;
addEventListener("pointerdown",function(){if(locked)return;locked=true;try{var st=navigator.standalone||matchMedia("(display-mode:standalone)").matches||document.fullscreenElement;if((st||isNative)&&screen.orientation&&screen.orientation.lock)screen.orientation.lock("landscape").catch(function(){})}catch(e){}},{once:true,passive:true});
document.addEventListener("visibilitychange",function(){
  if(document.hidden){saveStats();if(set.pauseHid)api.pauseGame();hiddenMusic=api.pauseMusic()}
  else if(hiddenMusic){hiddenMusic=false;api.resume()}});
var hiddenMusic=false;

/* ---------- settings dialog ---------- */
var sSong=$("#sSong");
sSong.innerHTML='<option value="shuffle">🔀 Shuffle (all songs)</option>'+api.songs.map(function(id){return '<option value="'+id+'">'+title(id)+'</option>'}).join("");
function fill(){
  $("#sSound").value=api.isMuted()?"off":"on";$("#sMus").value=set.mus;$("#sSfx").value=set.sfx;sSong.value=set.song;
  $("#sHap").value=set.hap?"on":"off";$("#sPauseHid").value=set.pauseHid?"on":"off";$("#sWake").value=set.wake?"on":"off";
  var np=api.nowPlaying();$("#nowp").textContent=np?"♪ Last song: "+title(np):"A new song is picked every time a game starts.";
}
function read(){
  set.mus=+$("#sMus").value;set.sfx=+$("#sSfx").value;set.hap=$("#sHap").value==="on";set.pauseHid=$("#sPauseHid").value==="on";set.wake=$("#sWake").value==="on";
  saveSet();applyAudio()}
$("#sSound").onchange=function(){api.mute($("#sSound").value==="off")};
["#sMus","#sSfx","#sHap","#sPauseHid","#sWake"].forEach(function(s){$(s).addEventListener("input",read);$(s).addEventListener("change",read)});
$("#sSfx").addEventListener("change",function(){try{api.isMuted()||new Audio("audio/coin.mp3").play()}catch(e){}});
sSong.onchange=function(){set.song=sSong.value;saveSet();applyAudio();if(set.song!=="shuffle"&&!api.isMuted())api.playSong(set.song)};
function tab(t){$$("#dlgSet .tabs button").forEach(function(b){b.setAttribute("aria-selected",b.dataset.t===t)});$$("#dlgSet section").forEach(function(s){s.hidden=s.dataset.p!==t});
  if(t==="stats")renderStats();if(t==="dl")renderDl();if(t==="more")diag()}
$$("#dlgSet .tabs button").forEach(function(b){b.onclick=function(){tab(b.dataset.t)}});
function openSettings(){var d=$("#dlgSet");if(d.open)return;api.pauseGame();fill();tab("play");d.showModal()}
$("#gear").onclick=openSettings;
$$("dialog").forEach(function(d){d.addEventListener("click",function(e){if(e.target===d)d.close()})});
$("#dlgSet").addEventListener("close",function(){saveSet()});
document.addEventListener("keydown",function(e){if(e.code==="Comma"&&!e.ctrlKey&&!e.metaKey&&document.activeElement.tagName!=="INPUT"&&!PLAYING[api.state()]){openSettings()}},true);

/* ---------- full screen + how to play ---------- */
var fsOK=!!(window.erbNative||document.fullscreenEnabled||document.webkitFullscreenEnabled)&&!/iPhone|iPod/.test(navigator.userAgent);
if(isNative&&!window.erbNative)fsOK=false;
if(!fsOK)$("#bFs").hidden=true;
$("#bFs").onclick=function(){try{if(window.erbNative&&erbNative.toggleFullscreen){erbNative.toggleFullscreen();return}var el=document.documentElement;
  if(document.fullscreenElement||document.webkitFullscreenElement)(document.exitFullscreen||document.webkitExitFullscreen).call(document);else(el.requestFullscreen||el.webkitRequestFullscreen).call(el)}catch(e){}};
var how=document.createElement("dialog");how.id="dlgHow";how.innerHTML='<form method="dialog" class="dlg"><div class="dhead"><h2>❓ How to play</h2><button value="close" class="x" aria-label="Close">✕</button></div>'+
 '<table><tr><td>Jump</td><td>Space · tap · click</td></tr><tr><td>Slide</td><td>V or Q · tap right side</td></tr><tr><td>Move</td><td>← → or A D</td></tr><tr><td>Throw trash</td><td>T or F</td></tr><tr><td>Spin</td><td>X, Z or Shift</td></tr><tr><td>Change character</td><td>C (menus)</td></tr><tr><td>Map gallery</td><td>G (menus)</td></tr><tr><td>Pause</td><td>P or Esc</td></tr><tr><td>Mute</td><td>M</td></tr><tr><td>Settings</td><td>⚙️ button or , (comma)</td></tr></table>'+
 '<p class="hint">Collect loot, dodge hazards and grab the glowing letters in Spelling mode to spell each word in order.</p><div class="btnrow"><button class="b primary" value="close">Got it</button></div></form>';
document.body.appendChild(how);stopBubble(how);how.addEventListener("click",function(e){if(e.target===how)how.close()});
$("#bHow").onclick=function(){how.showModal()};

/* ---------- stats view ---------- */
function mm(s){var m=Math.round(s/60);return m>=60?Math.floor(m/60)+" h "+m%60+" min":m+" min"}
function renderStats(){
  var rows=[["🎮 Games played",stats.runs],["⏱️ Time played",mm(stats.secs)],["🪙 Coins collected",stats.coins.toLocaleString()],["💥 Times hit",stats.hits],["🦘 Jumps",stats.jumps.toLocaleString()],["⭐ Best score",api.hi()],["🎧 Songs heard",stats.songs.length+" / "+api.songs.length],["📅 Days played",stats.days.length],["🔖 Version",VER]];
  $("#statTbl").innerHTML=rows.map(function(r){return "<tr><td>"+r[0]+"</td><td>"+r[1]+"</td></tr>"}).join("");
  var n=0;$("#achList").innerHTML=ACH.map(function(a){var on=!!stats.ach[a[0]];if(on)n++;return '<li class="'+(on?"":"off")+'"><span style="font-size:24px">'+(on?a[1]:"🔒")+'</span><div><b>'+a[2]+'</b><small>'+a[3]+'</small></div></li>'}).join("");
  $("#achCount").textContent="("+n+"/"+ACH.length+")"}

/* ---------- downloads ---------- */
function plat(){var u=navigator.userAgent,p=navigator.platform||"";if(/Android/i.test(u))return"android";if(/iPhone|iPad|iPod/.test(u)||(p==="MacIntel"&&navigator.maxTouchPoints>1))return"ios";if(/Win/i.test(p)||/Windows/.test(u))return"win";if(/Mac/i.test(p))return"mac";if(/Linux|X11|CrOS/.test(u+p))return"linux";return"web"}
var TARGETS=[
 {k:"win",ic:"🪟",n:"Windows",note:"Windows 10 or newer",a:[[/Windows-Setup\.exe$/i,"Installer"],[/Windows-Portable\.exe$/i,"Portable"]]},
 {k:"mac",ic:"🍎",n:"macOS",note:"macOS 11+ · Apple silicon & Intel",a:[[/macOS\.dmg$/i,"Download .dmg"]]},
 {k:"linux",ic:"🐧",n:"Linux",note:"AppImage works on most distros",a:[[/Linux\.AppImage$/i,"AppImage"],[/Linux\.deb$/i,".deb"]]},
 {k:"android",ic:"🤖",n:"Android",note:"Android 7+ · or use “Install” below",a:[[/Android\.apk$/i,"Download APK"]]},
 {k:"ios",ic:"📱",n:"iPhone & iPad",note:"Safari → Share → Add to Home Screen",a:[[/iOS-unsigned\.ipa$/i,"Sideload .ipa"]],help:"info/support.html#iphone"}];
var relCache=null;
function releases(cb){
  if(relCache)return cb(relCache);
  try{var c=JSON.parse(sessionStorage.getItem("erb2_rel")||"null");if(c&&Date.now()-c.t<36e5){relCache=c.d;return cb(c.d)}}catch(e){}
  if(!CFG.repo||!navigator.onLine)return cb(null);
  var ac=window.AbortController?new AbortController():null,tm=setTimeout(function(){ac&&ac.abort()},7000);
  fetch("https://api.github.com/repos/"+CFG.repo+"/releases/latest",{headers:{Accept:"application/vnd.github+json"},signal:ac&&ac.signal}).then(function(r){return r.ok?r.json():null}).then(function(d){
    clearTimeout(tm);if(d&&d.tag_name){relCache=d;try{sessionStorage.setItem("erb2_rel",JSON.stringify({t:Date.now(),d:d}))}catch(e){}}cb(d&&d.tag_name?d:null)}).catch(function(){clearTimeout(tm);cb(null)})}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function mb(n){return n>1048576?(n/1048576).toFixed(0)+" MB":Math.round(n/1024)+" KB"}
function renderDl(){
  var me=plat(),list=$("#dlList"),fall="https://github.com/"+CFG.repo+"/releases/latest";
  list.innerHTML='<p class="hint">Checking for the latest version…</p>';
  releases(function(rel){
    var html="";
    TARGETS.slice().sort(function(a,b){return (b.k===me)-(a.k===me)}).forEach(function(t){
      var assets=rel&&rel.assets||[],L=[];
      if(t.help)L.push([(isNative?CFG.siteUrl:"")+t.help,"How to install"]);
      t.a.forEach(function(x){var f=assets.filter(function(s){return x[0].test(s.name)})[0];if(f)L.push([f.browser_download_url,x[1]+" · "+mb(f.size),1])});
      if(!L.length)L.push([fall,rel?"All downloads":"Get it on GitHub"]);
      var btns=L.map(function(l,i){return '<a class="'+(i?"sec":"")+'" href="'+esc(l[0])+'" target="_blank" rel="noopener"'+(l[2]?" download":"")+'>'+esc(l[1])+"</a>"}).join("");
      html+='<div class="dl'+(t.k===me?" me":"")+'"><div class="ic">'+t.ic+'</div><div class="t"><b>'+t.n+(t.k===me?" · your device":"")+"</b><small>"+t.note+'</small></div><div class="a">'+btns+"</div></div>"});
    list.innerHTML=html;
    $("#dlVer").textContent=rel?"Latest release: "+rel.tag_name+(rel.published_at?" · "+rel.published_at.slice(0,10):""):"Couldn’t reach GitHub just now — the buttons above open the releases page.";
    var inst=$("#bInstall");inst.hidden=!(deferred||(me==="ios"&&!isStandalone()));
  })}
function isStandalone(){return navigator.standalone===true||(window.matchMedia&&matchMedia("(display-mode:standalone)").matches)}
if(isNative)$("#tabDl").hidden=true;
function newer(a,b){a=String(a).replace(/^v/,"").split(".").map(Number);b=String(b).replace(/^v/,"").split(".").map(Number);for(var i=0;i<3;i++){if((a[i]||0)>(b[i]||0))return true;if((a[i]||0)<(b[i]||0))return false}return false}

/* ---------- install / share / update ---------- */
var deferred=null;
addEventListener("beforeinstallprompt",function(e){e.preventDefault();deferred=e;$("#bInstall").hidden=false});
addEventListener("appinstalled",function(){deferred=null;$("#bInstall").hidden=true;toast("📲 Installed! Find Elk River Bandit on your home screen.")});
$("#bInstall").onclick=function(){if(deferred){deferred.prompt();deferred.userChoice.then(function(){deferred=null;$("#bInstall").hidden=true})}else toast("Tap the Share button, then “Add to Home Screen”.",null,null,7000)};
$("#bShare").onclick=function(){var url=CFG.siteUrl||location.href;
  if(navigator.share)navigator.share({title:"Elk River Bandit",text:"Run, jump and spell your way down the river!",url:url}).catch(function(){});
  else if(navigator.clipboard)navigator.clipboard.writeText(url).then(function(){toast("🔗 Link copied")},function(){toast(url)});else toast(url)};
var swReg=null;
if(!isNative&&"serviceWorker" in navigator&&(location.protocol==="https:"||location.hostname==="localhost"||location.hostname==="127.0.0.1")){
  var reloading=false;
  navigator.serviceWorker.addEventListener("controllerchange",function(){if(reloading)return;reloading=true;location.reload()});
  navigator.serviceWorker.register("sw.js").then(function(reg){swReg=reg;
    function ready(w){toast("✨ A new version is ready.","Update",function(){w.postMessage("SKIP_WAITING")},30000)}
    if(reg.waiting&&navigator.serviceWorker.controller)ready(reg.waiting);
    reg.addEventListener("updatefound",function(){var w=reg.installing;w&&w.addEventListener("statechange",function(){if(w.state==="installed"&&navigator.serviceWorker.controller)ready(w)})})
  }).catch(function(e){errors.push("sw: "+e.message)})}
$("#bUpdate").onclick=function(){
  releases(function(rel){
    if(rel&&newer(rel.tag_name,VER)){toast("⬆️ Version "+rel.tag_name+" is out.","Get it",isNative?rel.html_url:(swReg?function(){swReg.update()}:rel.html_url),20000);return}
    if(swReg)swReg.update().catch(function(){});
    toast(rel?"✔ You have the latest version ("+VER+")":"Couldn’t check — are you online?")})};
function net(){$("#offline").hidden=navigator.onLine!==false}
addEventListener("online",function(){net();toast("✅ Back online")});addEventListener("offline",net);net();

/* ---------- backup / restore / erase ---------- */
function mine(k){return /^(erb|bb2)/.test(k)}
$("#bBackup").onclick=function(){
  var data={};try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(mine(k))data[k]=localStorage.getItem(k)}}catch(e){}
  var blob=new Blob([JSON.stringify({app:"elk-river-bandit",version:VER,exported:new Date().toISOString(),data:data},null,1)],{type:"application/json"});
  var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="elk-river-bandit-backup-"+new Date().toISOString().slice(0,10)+".json";document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500);toast("⬇️ Backup saved")};
$("#bRestore").onclick=function(){$("#fRestore").click()};
$("#fRestore").onchange=function(){var f=this.files[0];this.value="";if(!f)return;if(f.size>2e6){toast("That file is too big to be a backup.");return}
  var r=new FileReader();r.onload=function(){var j;try{j=JSON.parse(r.result)}catch(e){toast("That doesn’t look like a backup file.");return}
    if(!j||j.app!=="elk-river-bandit"||!j.data||typeof j.data!=="object"){toast("That isn’t an Elk River Bandit backup.");return}
    var keys=Object.keys(j.data).filter(function(k){return mine(k)&&typeof j.data[k]==="string"});
    confirmDlg("Restore backup?","This replaces your current progress with the backup from "+String(j.exported||"").slice(0,10)+" ("+keys.length+" items).",function(){
      try{Object.keys(localStorage).filter(mine).forEach(function(k){localStorage.removeItem(k)});keys.forEach(function(k){localStorage.setItem(k,j.data[k])})}catch(e){toast("Couldn’t save — storage is full or blocked.");return}
      toast("✅ Restored — reloading…");setTimeout(function(){location.reload()},900)})};r.readAsText(f)};
$("#bErase").onclick=function(){confirmDlg("Erase all progress?","This deletes your scores, level progress, stats, achievements and settings on this device. It can’t be undone.",function(){
  try{Object.keys(localStorage).filter(mine).forEach(function(k){localStorage.removeItem(k)})}catch(e){}mem={};dirty=false;toast("🗑️ Erased — reloading…");setTimeout(function(){location.reload()},900)})};

/* ---------- diagnostics + bug report ---------- */
addEventListener("error",function(e){errors.push(new Date().toISOString().slice(11,19)+" "+e.message);if(errors.length>15)errors.shift()});
addEventListener("unhandledrejection",function(e){errors.push("promise: "+(e.reason&&e.reason.message||e.reason));if(errors.length>15)errors.shift()});
function diagText(){
  var n=0,b=0;try{n=Object.keys(localStorage).filter(mine).length;Object.keys(localStorage).filter(mine).forEach(function(k){b+=k.length+localStorage.getItem(k).length})}catch(e){}
  return["Elk River Bandit v"+VER+(BUILD?" ("+BUILD+")":""),"Platform: "+plat()+(isNative?" (app)":isStandalone()?" (installed)":" (browser)"),"Online: "+navigator.onLine,"Offline cache: "+(("serviceWorker" in navigator&&navigator.serviceWorker.controller)?"active":"off"),
   "Storage works: "+storeOK+" ("+n+" items, ~"+Math.round(b/1024)+" KB)","Screen: "+innerWidth+"x"+innerHeight+" @"+(window.devicePixelRatio||1)+"x","Game state: "+api.state(),"Browser: "+navigator.userAgent,"Recent errors: "+(errors.length?"\n  "+errors.join("\n  "):"none")].join("\n")}
function diag(){$("#diagTxt").textContent=diagText()}
$("#bDiag").onclick=function(){var t=diagText();navigator.clipboard?navigator.clipboard.writeText(t).then(function(){toast("📋 Copied")},function(){toast("Select the text and copy it by hand.")}):toast("Select the text and copy it by hand.")};
$("#bBug").onclick=function(){var u="https://github.com/"+CFG.repo+"/issues/new?title="+encodeURIComponent("Problem: ")+"&body="+encodeURIComponent("**What happened?**\n\n\n**Diagnostics**\n```\n"+diagText().slice(0,1500)+"\n```");window.open(u,"_blank","noopener")};

/* ---------- native: point info links at the website ---------- */
if(isNative&&CFG.siteUrl)$$(".links a").forEach(function(a){a.href=CFG.siteUrl+a.getAttribute("href")});

/* ---------- native app boot (Capacitor) ---------- */
if(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform()){try{var P=Capacitor.Plugins||{};
  if(P.ScreenOrientation&&P.ScreenOrientation.lock)P.ScreenOrientation.lock({orientation:"landscape"}).catch(function(){});
  if(P.StatusBar&&P.StatusBar.hide)P.StatusBar.hide().catch(function(){});
  if(P.App&&P.App.addListener)P.App.addListener("pause",function(){if(set.pauseHid)api.pauseGame()})}catch(e){}}

/* ---------- boot ---------- */
applyAudio();checkAch();
window.ERB={version:VER,stats:stats,toast:toast,openSettings:openSettings};
})();
