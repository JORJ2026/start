/* ============ EDIT THIS SECTION ============ */
// Format per line: Users | Category | Status | Title | URL
// Users = All, Admin, Gran, Faith or Harmony. Admin always sees everything.
const ROLES = {
  admin:   { name:"Admin",   color:"#2F3E9E", blurb:"Everything, everywhere",  greeting:"Hello, Admin" },
  faith:   { name:"Faith",   color:"#18788A", blurb:"Your projects",           greeting:"Hi, Faith" },
  gran:    { name:"Gran",    color:"#A6406B", blurb:"Your family projects",    greeting:"Hello, Gran" },
  harmony: { name:"Harmony", color:"#5E8A2F", blurb:"Your projects",           greeting:"Hi, Harmony" },
  guest:   { name:"Guest",   color:"#9A6A12", blurb:"A few favorites",         greeting:"Welcome, Guest" },
  jack:    { name:"Jack Jr.", color:"#C2410C", blurb:"Everything that’s live", greeting:"Hi, Jack Jr." },
  jorj26:  { name:"JORJ26", color:"#0B7285", blurb:"Your projects", greeting:"Hi, JORJ26" }
};

const RAW = `
Gran|Religious|Live|Bible|https://jackrosejr2027.github.io/bible/
All|Games|Live|Play Something!|https://jackrose2028.github.io/play
Admin|Music|Live|Theory Decks|https://jackrose2028.github.io/theorydecks
Admin|Other|Live|Recipes|https://jackrose2028.github.io/recipes
Admin|Music|Live Test|Music Training Center|https://jackrose2028.github.io/musictrainingcenter
Admin|Music|Live Test|Music Training Center|https://jackrose2028.github.io/chordprogressionpro
Admin|Music|Live Test|Music Training Center|https://jackrose2028.github.io/chordprogressionpractice
All|Video|Live|LocalTube|https://jackrose2028.github.io/watch
Admin|Games|Live|Card Arcade|https://jackrose2027.github.io/cardarcade
Admin|Music|Live|Guitar OG V1|https://jackrose2031.github.io/GuitarOGV1
Admin|Music|Live|Guitar OG V2|https://jackrose2031.github.io/GuitarOGV2
Admin|Games|Live|gemumod|https://jackrose2028.github.io/gemumod/
Admin|Games|Live|Emu Mod|https://jackrose2028.github.io/gemustudio/
Admin|Games|Live|EmuModLatest-112026|https://jackrose2028.github.io/emumodlatest/
Admin|Other|Live|Quality|https://rossjeck89.github.io/quality/
Admin|Music|Live|SNESStudio|https://rossjeck89.github.io/studio/
Admin|Music|Live|Manic Rules|https://jackrose2028.github.io/guitar
Admin|Music|Live Test|Fretboard|https://jackrose2028.github.io/fretboard
Admin|Music|Live Test|Guitar Drill|https://jackrose2028.github.io/guitardrill
Admin|Other|Live Test|Reference|https://jackrose2030.github.io/pocketreference/
Admin|Self Help|Live Test|Calm|https://jackrosejr2027.github.io/calm/
All|Games|Live Test|Emu|https://jackrose2028.github.io/gemu/
Admin|Music|Live Test|Guitar Various|https://jackrose2028.github.io/guitarmisc
Admin|Music|Live Test|Manic Rules - Single HTML|https://jackrose2028.github.io/guitartest
All|Games|Live|Nobody's Purrfect|https://jackrosejr2027.github.io/nobodyspurrfect
Gran|Self Help|Live|personalreset|https://jackrose2029.github.io/personalreset
Gran|Self Help|Live|quietnotebook|https://jackrose2029.github.io/quietnotebook
Gran|Self Help|Live|quietpages|https://jackrose2029.github.io/quietpages
Gran|Study|Live|Gran's Study Time|https://jackrose2029.github.io/granstudy
Admin|Games|Testing|solitaire|https://dnowlpdgu.github.io/solitaire
Admin|Other|Work Testing|qms|https://dnowlpdgu.github.io/qms
Admin|Other|Work Testing|review|https://dnowlpdgu.github.io/review
Admin|Other|Work Testing|audit|https://dnowlpdgu.github.io/audit
Admin|Other|Work Testing|qms|https://rossjeck89.github.io/qms
Admin|Music|Testing|testing|https://jackrose2031.github.io/testing
Admin|Music|Testing|manicrules|https://jackrose2031.github.io/manicrules
Admin|Music|Testing|m2|https://jackrose2030.github.io/m2
Admin|Music|Testing|ManicRules|https://jackrose2030.github.io/ManicRules
Admin|Music|Testing|test3|https://jackrose2030.github.io/test3
Admin|Music|Testing|app042426|https://jackrose2030.github.io/app042426
Admin|Music|Testing|t3|https://jackrose2030.github.io/t3
Admin|Music|Testing|manicrulesscalestest1|https://jackrose2030.github.io/manicrulesscalestest1
Admin|Games|Testing|games|https://jackrose2027.github.io/games
Admin|Video|Testing|localtube|https://jackrose2027.github.io/localtube
Admin|Games|Testing|games|https://jackrosejr2027.github.io/games
Admin|Video|Testing|localtube|https://jackrosejr2027.github.io/localtube
Admin|Music|Testing|ManicRulesGuitar|https://jackrosejr2027.github.io/ManicRulesGuitar
Admin|Music|Testing|ManicRules|https://jackrosejr2027.github.io/ManicRules
Admin|Other|Testing|prj|https://jackrosejr2027.github.io/prj
Admin|Games|Testing|Play|https://jackrose2029.github.io/Play
Admin|Other|Testing|home|https://jackrose2029.github.io/home
Admin|Games|Testing|retrobeta|https://jackrose2029.github.io/retrobeta
Admin|Games|Testing|rpg|https://jackrose2029.github.io/rpg
Admin|Music|Testing|Practice|https://jackrose2029.github.io/Practice
Admin|Music|Testing|ManicRulesV1-0-0|https://jackrose2029.github.io/ManicRulesV1-0-0
Admin|Music|Testing|ManicRules|https://jackrose2029.github.io/ManicRules
Admin|Music|Testing|MANICRULES|https://jackrose2028.github.io/MANICRULES0.01
Admin|Games|Testing|play|https://jackrosejr2027.github.io/play
Admin|Games|Testing|gamesog|https://jackrosejr2027.github.io/gamesog
Admin|Self Help|Testing|meditationgame|https://jackrosejr2027.github.io/meditationgame
Admin|Music|Testing|music|https://jackrosejr2027.github.io/music
JORJ26|Games|Live|emubasic|https://jorj2026.github.io/emubasic/
JORJ26|Games|Live|rpg-hm|https://jorj2026.github.io/rpg-hm/
JORJ26|Other|Live|logo|https://jorj2026.github.io/logo/
JORJ26|Study|Live|granstudy|https://jorj2026.github.io/granstudy/
JORJ26|Self Help|Live|quietpages|https://jorj2026.github.io/quietpages/
JORJ26|Games|Live|play|https://jorj2026.github.io/play/
JORJ26|Other|Live|start|https://jorj2026.github.io/start/
JORJ26|Games|Live|emulatorjsmod|https://jorj2026.github.io/emulatorjsmod/
JORJ26|Games|Live|homebrewroms|https://jorj2026.github.io/homebrewroms/
JORJ26|Games|Live|nobodyspurrfect|https://jorj2026.github.io/nobodyspurrfect/
JORJ26|Other|Live|paint3d|https://jorj2026.github.io/paint3d/
JORJ26|Other|Live|quality|https://jorj2026.github.io/quality/
JORJ26|Games|Live|cardarcade|https://jorj2026.github.io/cardarcade/
JORJ26|Music|Live|chopin|https://jorj2026.github.io/chopin/
JORJ26|Self Help|Live|calm|https://jorj2026.github.io/calm/
JORJ26|Self Help|Live|personalreset|https://jorj2026.github.io/personalreset/
JORJ26|Self Help|Live|quietnotebook|https://jorj2026.github.io/quietnotebook/
JORJ26|Games|Live|emu|https://jorj2026.github.io/emu/
JORJ26|Religious|Live|bible|https://jorj2026.github.io/bible/
JORJ26|Music|Live|guitar|https://jorj2026.github.io/guitar/
JORJ26|Video|Live|localtube|https://jorj2026.github.io/localtube/
JORJ26|Other|Live|pocketreference|https://jorj2026.github.io/pocketreference/
`;
const ALL = ["admin","gran","faith","harmony"];
// Guest always sees these (by URL). They can tick more with "Choose more projects".
const GUEST_BASE = [
  "https://jackrose2030.github.io/pocketreference/",
  "https://jackrose2028.github.io/watch",
  "https://jackrose2028.github.io/play",
  "https://jackrose2028.github.io/guitar"
];
const STATUS_ORDER = ["Live","Live Test","Testing","Work Testing"];
// Titles listed here show first, in this order, for that person. Everything else follows.
const PRIORITY = { gran:["Bible","Play Something!","LocalTube","Gran\u2019s Study Time"] };
// "Live!" chip (Admin only): a filter over these URLs. Doesn't change any project's own category.
const LIVE_BANG = ["https://jackrose2028.github.io/play/", "http://jackrose2028.github.io/gemu", "https://rossjeck89.github.io/studio/", "https://jackrose2029.github.io/granstudy/", "https://rossjeck89.github.io/quality/", "https://jackrose2027.github.io/cardarcade/", "https://jackrose2028.github.io/watch/", "https://jackrose2030.github.io/pocketreference/", "https://jackrosejr2027.github.io/bible/", "https://jackrose2028.github.io/gemumod/", "https://jackrose2028.github.io/guitar/", "https://jackrose2028.github.io/gemustudio/"];
const normUrl = u => u.replace(/^https?:\/\//,"").replace(/\/$/,"").toLowerCase();
const LIVE_SET = new Set(LIVE_BANG.map(normUrl));
const inLiveBang = p => LIVE_SET.has(normUrl(p.url));
const PROJECTS = RAW.trim().split("\n").map(l=>{
  const [u,c,st,t,url] = l.split("|").map(x=>x.trim());
  return { name:t.replace("'", "\u2019"), url, cat:c, status:st, tags:[c,st], desc:url.replace("https://",""),
          for: u==="All" ? ALL : [u.toLowerCase()] };
});
/* ============ END EDIT ============ */

const $ = id => document.getElementById(id);
let role = null, deferredPrompt = null;
let guestPicks = []; try{ guestPicks = JSON.parse(store("hub-guest-picks")||"[]")||[]; }catch(e){}
const canSee = p => role==="admin"
  || (role==="jack" && (p.status==="Live"||p.status==="Live Test"))
  || (role==="guest" && (GUEST_BASE.includes(p.url) || guestPicks.includes(p.url)))
  || p.for.includes(role);

function store(k,v){ try{ if(v===undefined) return localStorage.getItem(k); v===null?localStorage.removeItem(k):localStorage.setItem(k,v);}catch(e){return null;} }
function toast(t){ const el=$("toast"); el.textContent=t; el.hidden=false; setTimeout(()=>el.hidden=true,2200); }
const repoUrl = p => p.url || `https://github.com/${GITHUB_USER}/${p.repo}`;

function buildPicker(){
  $("roles").innerHTML = "";
  Object.entries(ROLES).forEach(([key,r])=>{
    const b = document.createElement("button");
    b.className="role"; b.style.setProperty("--c", r.color);
    b.innerHTML = `<span class="ri">${svgIcon(ROLE_ICON[key])}</span><b>${r.name}</b><div class="big" aria-hidden="true">${r.name[0]}</div>`;
    b.onclick = () => choose(key);
    $("roles").appendChild(b);
  });
}

const CAT_ICON={Games:"gamepad",Music:"music",Video:"tv",Other:"sparkle",Study:"book","Self Help":"leaf",Religious:"cross"};
const ROLE_ICON={admin:"crown",faith:"sun",gran:"heart",harmony:"leaf",guest:"user",jack:"star",jorj26:"sparkle"};
const CATC={Games:"#E8590C",Music:"#7048E8",Video:"#D6336C",Other:"#1C7ED6",Study:"#2F9E44","Self Help":"#0CA678",Religious:"#3A6EA5"};
function card(p,feat){
  const a=document.createElement("a");
  a.className="tile"+(feat?" feat":""); a.href=repoUrl(p); a.target="_blank"; a.rel="noopener";
  a.style.setProperty("--c", CATC[p.cat]||"#1C7ED6");
  const icon = /recipe/i.test(p.name) ? "chef" : (CAT_ICON[p.cat]||"sparkle");
  const slug = p.status.toLowerCase().replace(/\s+/g,"-");
  a.innerHTML = `<div class="ic" aria-hidden="true"></div><span class="st st-${slug}"></span><div class="tx"><h3></h3><p></p></div><span class="go" aria-hidden="true"></span>`;
  a.querySelector(".ic").innerHTML=svgIcon(icon);
  a.querySelector(".go").innerHTML=svgIcon("arrow");
  const stEl=a.querySelector(".st"); if(role==="admin"||role==="jack") stEl.textContent=p.status; else stEl.remove();
  a.querySelector("h3").textContent=p.name;
  a.querySelector("p").textContent = role==="admin"||role==="jack" ? p.desc : p.cat;
  return a;
}

let cat = "";
let view = store("hub-view")==="grid" ? "grid" : "list";
let collapsed = {"Testing":1,"Work Testing":1};
try{ const c=JSON.parse(store("hub-collapsed")||"null"); if(c) collapsed=c; }catch(e){}
let group = store("hub-group")==="account" ? "account" : "status";
const acct = p => p.url.replace(/^https?:\/\//,"").split(".")[0];
function setGroup(g){ group=g; store("hub-group",g); render(); }
function setView(v){ view=v; store("hub-view",v); render(); }

function render(){
  $("vList").setAttribute("aria-pressed", String(view==="list"));
  $("vGrid").setAttribute("aria-pressed", String(view==="grid"));
  $("gStatus").setAttribute("aria-pressed", String(group==="status"));
  $("gAcct").setAttribute("aria-pressed", String(group==="account"));
  const term = $("q").value.trim().toLowerCase();
  const mine = PROJECTS.filter(canSee);
  const cats = [...new Set(mine.map(p=>p.cat))].sort();
  const chips=$("chips"); chips.innerHTML="";
  if(cats.length>1){
    ["", ...(role==="admin"?["Live!"]:[]), ...cats].forEach(c=>{
      const b=document.createElement("button"); b.className="chip"; b.textContent=c||"All";
      b.setAttribute("aria-selected", String(cat===c));
      b.onclick=()=>{cat=c;render();}; chips.appendChild(b);
    });
  }
  const pr = PRIORITY[role] || [];
  const rank = p => { const i = pr.indexOf(p.name); return i<0 ? pr.length : i; };
  const shown = mine
    .filter(p => (!cat || (cat==="Live!" ? inLiveBang(p) : p.cat===cat)) && (!term || (p.name+" "+p.desc+" "+p.tags.join(" ")).toLowerCase().includes(term)))
    .sort((x,y)=> rank(x)-rank(y) || STATUS_ORDER.indexOf(x.status)-STATUS_ORDER.indexOf(y.status));
  const list=$("list"); list.innerHTML="";
  if(!shown.length){ list.innerHTML = `<div class="empty"><span class="eic">${svgIcon("inbox")}</span>${term||cat?"No projects match.":"No projects have been shared with you yet. Ask Admin to add some."}</div>`; return; }
  const favs = shown.filter(p=>pr.includes(p.name)), rest = shown.filter(p=>!pr.includes(p.name));
  if(favs.length){ const f=document.createElement("div"); f.className="favs"; favs.forEach(p=>f.appendChild(card(p,true))); list.appendChild(f); }
  const block = items => { const d=document.createElement("div"); d.className = view==="grid" ? "grid" : "rows"; items.forEach(p=>d.appendChild(card(p))); return d; };
  if(role==="admin"||role==="jack"){
    const filtering = !!(term||cat);
    const groups = (role==="admin" && group==="account")
      ? [...new Set(rest.map(acct))].sort((a,b)=>a.toLowerCase().localeCompare(b.toLowerCase())).map(a=>({k:"@"+a,label:a,items:rest.filter(p=>acct(p)===a)}))
      : STATUS_ORDER.map(st=>({k:st,label:st,items:rest.filter(p=>p.status===st)}));
    groups.forEach(g=>{
      const items = g.items; if(!items.length) return;
      const open = filtering || !collapsed[g.k];
      const sec=document.createElement("section");
      const h=document.createElement("button"); h.className="grp"; h.setAttribute("aria-expanded", String(open));
      h.innerHTML = `<span class="cv">${svgIcon("chev")}</span>${g.label} <span>${items.length}</span>`;
      h.onclick=()=>{ collapsed[g.k]=open?1:0; store("hub-collapsed",JSON.stringify(collapsed)); render(); };
      sec.appendChild(h); if(open) sec.appendChild(block(items)); list.appendChild(sec);
    });
  } else if(rest.length){ list.appendChild(block(rest)); }
}

const DOCK = [
  { label:"Pocket Ref", icon:"notebook", url:"https://jackrose2030.github.io/pocketreference/", c:"#1C7ED6" },
  { label:"LocalTube", icon:"tv", url:"https://jackrose2028.github.io/watch",  c:"#D6336C" },
  { label:"Play",      icon:"gamepad", url:"https://jackrose2028.github.io/play",   c:"#E8590C" },
  { label:"Guitar",    icon:"music", url:"https://jackrose2028.github.io/guitar", c:"#7048E8" },
  { label:"Study",     icon:"book", url:"https://jackrose2029.github.io/granstudy", c:"#2F9E44" },
  { label:"Bible",     icon:"cross", url:"https://jackrosejr2027.github.io/bible/", c:"#3A6EA5" }
];
function buildDock(){
  const dock=$("dock"); dock.innerHTML="";
  DOCK.filter(d=>!role || PROJECTS.some(p=>p.url===d.url && canSee(p))).forEach(d=>{
    const a=document.createElement("a"); a.href=d.url; a.target="_blank"; a.rel="noopener"; a.style.setProperty("--c",d.c);
    a.innerHTML='<span class="di" aria-hidden="true"></span><span></span>';
    a.firstChild.innerHTML=svgIcon(d.icon); a.lastChild.textContent=d.label; dock.appendChild(a);
  });
  dock.hidden = !dock.children.length;
}

function choose(key){
  role = key; store("hub-role", key);
  const r = ROLES[key];
  document.documentElement.style.setProperty("--accent", r.color);
  document.querySelector('meta[name="theme-color"]').content = r.color;
  $("dot").textContent = r.name[0]; $("whoName").textContent = r.name;
  $("hello").textContent = r.greeting;
  $("sub").textContent = (key==="admin"||key==="jack")
    ? "Every project, grouped by status."
    : key==="guest" ? "A few favorites. Add more any time."
    : "Here are the projects set up for you.";
  $("q").value=""; cat="";
  $("adminBar").hidden = key!=="admin";
  $("guestBar").hidden = key!=="guest"; $("pickPanel").hidden = true; if(key==="guest") buildPick();
  $("pick").hidden=true; $("home").hidden=false; buildDock();
  render(); window.scrollTo(0,0);
}

function pickable(){
  return PROJECTS.filter(p => (p.status==="Live"||p.status==="Live Test") && !GUEST_BASE.includes(p.url) && !(p.for.length===1 && p.for[0]==="gran"));
}
function buildPick(){
  const box=$("pickList"); box.innerHTML="";
  pickable().forEach(p=>{
    const l=document.createElement("label");
    l.className="pl";
    const cb=document.createElement("input"); cb.type="checkbox"; cb.className="pcb"; cb.checked=guestPicks.includes(p.url);
    cb.onchange=()=>{
      guestPicks = cb.checked ? [...new Set([...guestPicks,p.url])] : guestPicks.filter(u=>u!==p.url);
      store("hub-guest-picks",JSON.stringify(guestPicks)); render(); buildDock();
    };
    const sp=document.createElement("span");
    sp.textContent = p.name+" ("+p.cat+") \u00B7 "+p.url.replace(/\/$/,"").split("/").pop();
    l.append(cb,sp); box.appendChild(l);
  });
}
function exportCsv(){
  const opt = new Set(pickable().map(p=>p.url));
  const who = p => Object.keys(ROLES).filter(r =>
      r==="admin" || (r==="jack" && (p.status==="Live"||p.status==="Live Test")) || (r==="guest" && GUEST_BASE.includes(p.url)) || p.for.includes(r)
    ).map(r=>ROLES[r].name).concat(opt.has(p.url) && !GUEST_BASE.includes(p.url) ? ["Guest (optional)"] : []).join("; ");
  const q = v => '"'+String(v).replace(/"/g,'""')+'"';
  const rows = [["Name","Category","Status","GitHub account","URL","Shows up for"], ...PROJECTS.map(p=>[p.name,p.cat,p.status,acct(p),p.url,who(p)])];
  const csv = "\uFEFF" + rows.map(r=>r.map(q).join(",")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  a.download = "project-hub-links.csv"; document.body.appendChild(a); a.click(); a.remove();
  toast("CSV downloaded");
}
function showPicker(){
  store("hub-role", null); role=null;
  document.documentElement.style.removeProperty("--accent");
  $("adminBar").hidden=true; $("guestBar").hidden=true; $("pickPanel").hidden=true;
  $("home").hidden=true; $("pick").hidden=false; buildDock();
}

/* Install help */
const ua = navigator.userAgent;
const isIos = /iPhone|iPad|iPod/.test(ua) || (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);
const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
function setTab(which){
  $("panIos").hidden = which!=="ios"; $("panAnd").hidden = which!=="and";
  $("tabIos").setAttribute("aria-selected", which==="ios"); $("tabAnd").setAttribute("aria-selected", which==="and");
}
$("tabIos").onclick=()=>setTab("ios"); $("tabAnd").onclick=()=>setTab("and");
setTab(isIos ? "ios" : "and");
if(isStandalone) $("install").hidden = true;

window.addEventListener("beforeinstallprompt", e=>{ e.preventDefault(); deferredPrompt=e; $("installBtn").hidden=false; setTab("and"); });
$("installBtn").onclick = async()=>{ if(!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; $("installBtn").hidden=true; };
$("copy").onclick = async()=>{
  try{ await navigator.clipboard.writeText(location.href.split("#")[0]); toast("Link copied"); }
  catch(e){ window.prompt("Copy this link:", location.href.split("#")[0]); }
};

/* App icon + manifest (generated, so everything stays in one file) */
(function(){
  try{
    const c=document.createElement("canvas"); c.width=c.height=512;
    const g=c.getContext("2d");
    g.fillStyle="#2F3E9E"; g.fillRect(0,0,512,512);
    g.fillStyle="#fff"; g.font="800 300px system-ui,sans-serif"; g.textAlign="center"; g.textBaseline="middle"; g.fillText("H",256,276);
    const png=c.toDataURL("image/png");
    const l=document.createElement("link"); l.rel="apple-touch-icon"; l.href=png; document.head.appendChild(l);
    const i=document.createElement("link"); i.rel="icon"; i.href=png; document.head.appendChild(i);
    const manifest={name:"Project Hub",short_name:"Hub",start_url:location.href.split("#")[0],display:"standalone",background_color:"#E6EDEF",theme_color:"#2F3E9E",icons:[{src:png,sizes:"512x512",type:"image/png",purpose:"any"}]};
    const m=document.createElement("link"); m.rel="manifest";
    m.href=URL.createObjectURL(new Blob([JSON.stringify(manifest)],{type:"application/manifest+json"}));
    document.head.appendChild(m);
  }catch(e){}
})();

$("switch").onclick = showPicker;
$("dlCsv").onclick=exportCsv;
$("gStatus").onclick=()=>setGroup("status"); $("gAcct").onclick=()=>setGroup("account");
$("morePick").onclick=()=>{ $("pickPanel").hidden=!$("pickPanel").hidden; };
$("pickDone").onclick=()=>{ $("pickPanel").hidden=true; window.scrollTo(0,0); };
$("q").addEventListener("input", render);
$("vList").onclick=()=>setView("list"); $("vGrid").onclick=()=>setView("grid");
document.querySelectorAll("[data-ic]").forEach(el=>el.innerHTML=svgIcon(el.dataset.ic));
buildPicker();
const saved = store("hub-role");
if(saved && ROLES[saved]) choose(saved); else { $("pick").hidden=false; buildDock(); }
