/* ============ EDIT THIS SECTION ============ */
// Format per line: Users | Category | Status | Title | URL
// Users = All, Admin, Gran, Faith or Harmony. Admin always sees everything.
const ROLES = {
  faith:      { name:"Faith",       color:"#7048E8", blurb:"Your projects",          greeting:"Hi, Faith" },
  gran:       { name:"Gran",        color:"#355E3B", blurb:"Your family projects",   greeting:"Hello, Gran" },
  harmony:    { name:"Harmony",     color:"#E64980", blurb:"Your projects",          greeting:"Hi, Harmony" },
  jack:       { name:"Jack Jr.",    color:"#1A1A1A", blurb:"Everything that’s live", greeting:"Hi, Jack Jr." },
  jorjdev2027:{ name:"JORJDEV2027", color:"#E8590C", blurb:"Your projects",          greeting:"Hi, JORJDEV2027" }
};

const RAW = `
jorjdev2027|Games|Live|Play Something!|https://jorj2026.github.io/play
jorjdev2027|Games|Live|Elk River Bandit|https://jorj2026.github.io/elkriverbandit
jorjdev2027|Study|Live|Gran's Study Corner|https://jorj2026.github.io/granstudy
jorjdev2027|Games|Live|Wildroot|https://jorj2026.github.io/wildroot
jorjdev2027|Games|Live|Lantern Woods|https://jorj2026.github.io/lanternwoods
jorjdev2027|Games|Live|Emulator|https://jorj2026.github.io/emu
jorjdev2027|Music|Live|Fretlab|https://jorj2026.github.io/fretlab
jorjdev2027|Music|Live|Guitar Scales & Practice|https://jorj2026.github.io/guitar
jorjdev2027|Other|Live|Clear Mind|https://jorj2026.github.io/clearmind
jorjdev2027|Music|Live|MIDI|https://jorj2026.github.io/chopin
jorjdev2027|Bible|Live|Bible Verses|https://jorj2026.github.io/bible
jorjdev2027|GitHub|Live|jackrose2028|accounts/jackrose2028.html
jorjdev2027|GitHub|Live|dnowlpdgu|accounts/dnowlpdgu.html
jorjdev2027|GitHub|Live|jackrose2027|accounts/jackrose2027.html
jorjdev2027|GitHub|Live|jackrose2030|accounts/jackrose2030.html
jorjdev2027|GitHub|Live|JORJ2026A|accounts/JORJ2026A.html
jorjdev2027|GitHub|Live|JORJ2026|accounts/JORJ2026.html
jorjdev2027|GitHub|Live|jackrosejr2027|accounts/jackrosejr2027.html
jorjdev2027|GitHub|Live|jackrose2029|accounts/jackrose2029.html
jorjdev2027|Other|Live|HB|https://jorj2026.github.io/hb
jorjdev2027|Games|Live|EmulatorJS Mod Fix|https://jorj2026.github.io/emulatorjsmodfix
jorjdev2027|Games|Live|EmulatorJS Mod|https://jorj2026.github.io/emulatorjsmod
jorjdev2027|Games|Live|Emu Basic|https://jorj2026.github.io/emubasic
jorjdev2027|Games|Live|RPG HM|https://jorj2026.github.io/rpg-hm
jorjdev2027|Other|Live|Start|https://jorj2026.github.io/start
jorjdev2027|Games|Live|GTA II|https://jorj2026.github.io/gtaII
jorjdev2027|Other|Live|Quiet Pages|https://jorj2026.github.io/quietpages
jorjdev2027|Games|Live|Cat Games|https://jorj2026.github.io/meow
jorjdev2027|Games|Live|Wildwood GBA|https://jorj2026.github.io/wildwoodgba
jorjdev2027|Games|Live|GTA|https://jorj2026.github.io/gta
jorjdev2027|Games|Live|Nobody Spurrfect|https://jorj2026.github.io/nobodyspurrfect
jorjdev2027|Other|Live|Paint 3d|https://jorj2026.github.io/paint3d
jorjdev2027|Self Help|Live|Personal Reset|https://jorj2026.github.io/personalreset
jorjdev2027|Other|Live|Quiet Notebook|https://jorj2026.github.io/quietnotebook
jorjdev2027|Other|Live|Text Editor|https://jorj2026.github.io/logo
jorjdev2027|Other|Live|Shelf|https://jorj2026.github.io/shelf
jorjdev2027|Games|Live|RPG|https://jorj2026.github.io/rpg
jorjdev2027|Other|Live|Quality|https://jorj2026.github.io/quality
jorjdev2027|Games|Live|Card Arcade|https://jorj2026.github.io/cardarcade
jorjdev2027|Self Help|Live|Calm|https://jorj2026.github.io/calm
jorjdev2027|Video|Live|LocalTube|https://jorj2026.github.io/localtube
jorjdev2027|Study|Live|Pocket Reference|https://jorj2026.github.io/pocketreference
gran|Bible|Live|Bible Verses|https://jorj2026.github.io/bible
gran|Games|Live|Play Something!|https://jorj2026.github.io/play
gran|Games|Live|Cat Games|https://jorj2026.github.io/meow
gran|Study|Live|Gran's Study Corner|https://jorj2026.github.io/granstudy
gran|Music|Live|MIDI|https://jorj2026.github.io/chopin
gran|Other|Live|Clear Mind|https://jorj2026.github.io/clearmind
faith|Games|Live|Play Something!|https://jorj2026.github.io/play
faith|Games|Live|Cat Games|https://jorj2026.github.io/meow
harmony|Games|Live|Play Something!|https://jorj2026.github.io/play
harmony|Games|Live|Cat Games|https://jorj2026.github.io/meow
gran|Other|Live|Journaling|https://jorj2026.github.io/clearmind
jack|Other|Live|Journaling|https://jorj2026.github.io/clearmind
gran|Other|Live|Paint 3d|https://jorj2026.github.io/paint3d
jack|Other|Live|Paint 3d|https://jorj2026.github.io/paint3d
gran|Other|Live|Text Editor|https://jorj2026.github.io/logo
jack|Other|Live|Text Editor|https://jorj2026.github.io/logo
gran|Video|Live|LocalTube|https://jorj2026.github.io/localtube
jack|Video|Live|LocalTube|https://jorj2026.github.io/localtube
gran|Study|Live|Pocket Reference|https://jorj2026.github.io/pocketreference
jack|Study|Live|Pocket Reference|https://jorj2026.github.io/pocketreference
gran|Games|Live|Card Arcade (old)|https://jorj2026.github.io/cardarcade
jack|Games|Live|Card Arcade (old)|https://jorj2026.github.io/cardarcade
gran|Music|Live|FretLab|https://jorj2026.github.io/fretlab
jack|Music|Live|FretLab|https://jorj2026.github.io/fretlab
gran|Music|Live|FretLab (old)|https://jorj2026.github.io/guitar
jack|Music|Live|FretLab (old)|https://jorj2026.github.io/guitar
jack|Other|Live|Quality|https://jorj2026.github.io/quality
jack|Other|Live|Calm|https://jorj2026.github.io/calm
faith|Games|Live|Cat Card Games (old)|https://jorj2026.github.io/nobodyspurrfect
gran|Games|Live|Cat Card Games (old)|https://jorj2026.github.io/nobodyspurrfect
harmony|Games|Live|Cat Card Games (old)|https://jorj2026.github.io/nobodyspurrfect
jack|Games|Live|Cat Card Games (old)|https://jorj2026.github.io/nobodyspurrfect
jorjdev2027|Games|Live|Cat Card Games (old)|https://jorj2026.github.io/nobodyspurrfect
`;
const ALL = [];
// Guest always sees these (by URL). They can tick more with "Choose more projects".
const GUEST_BASE = [];
const STATUS_ORDER = ["Live","Live Test","Testing","Work Testing"];
// Titles listed here show first, in this order, for that person. Everything else follows.
const PRIORITY = { jorjdev2027:["Play Something!","Elk River Bandit","Gran’s Study Corner","Wildroot","Lantern Woods","Fretlab","Clear Mind","MIDI","Guitar Scales & Practice"] };
// Heading above the PRIORITY titles, for that person only.
const MAIN_LABEL = { jorjdev2027:"Main apps" };
// "Live!" chip (Admin only): a filter over these URLs. Doesn't change any project's own category.
const LIVE_BANG = [];
const normUrl = u => u.replace(/^https?:\/\//,"").replace(/\/$/,"").toLowerCase();
const LIVE_SET = new Set(LIVE_BANG.map(normUrl));
const inLiveBang = p => LIVE_SET.has(normUrl(p.url));
const PROJECTS = RAW.trim().split("\n").filter(Boolean).map(l=>{
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

const CAT_ICON={Games:"gamepad",Music:"music",Video:"tv",Other:"sparkle",Study:"book","Self Help":"leaf",Religious:"cross"};
const ROLE_ICON={admin:"crown",faith:"sun",gran:"heart",harmony:"leaf",guest:"user",jack:"star",jorjdev2027:"sparkle"};
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
  const cats = [...new Set(mine.map(p=>p.cat))].sort((a,b)=> (a==='GitHub')-(b==='GitHub') || a.localeCompare(b));
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
  if(favs.length){ if(MAIN_LABEL[role]){ const h=document.createElement("h2"); h.className="main-h"; h.textContent=MAIN_LABEL[role]; list.appendChild(h); } const f=document.createElement("div"); f.className="favs"; favs.forEach(p=>f.appendChild(card(p,true))); list.appendChild(f); }
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
  { url:"https://jorj2026.github.io/play", label:"Play Something!", icon:"gamepad", c:"#E8590C" },
  { url:"https://jorj2026.github.io/meow", label:"Cat Games", icon:"gamepad", c:"#E8590C" },
  { url:"https://jorj2026.github.io/granstudy", label:"Study", icon:"book", c:"#2F9E44" },
  { url:"https://jorj2026.github.io/chopin", label:"MIDI", icon:"music", c:"#7048E8" },
  { url:"https://jorj2026.github.io/localtube", label:"LocalTube", icon:"tv", c:"#D6336C" },
  { url:"https://jorj2026.github.io/logo", label:"Text Editor", icon:"notebook", c:"#1C7ED6" },
  { url:"https://jorj2026.github.io/fretlab", label:"FretLab", icon:"music", c:"#7048E8" },
  { url:"https://jorj2026.github.io/pocketreference", label:"Pocket Reference", icon:"book", c:"#2F9E44" },
  { url:"https://jorj2026.github.io/paint3d", label:"Paint 3d", icon:"sparkle", c:"#0CA678" },
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

$("dlCsv").onclick=exportCsv;
$("back").onclick=showPick;
function showPick(){
  role = null; $("home").hidden = true; $("dock").hidden = true; $("pick").hidden = false;
  document.documentElement.style.removeProperty("--accent");
  document.querySelector('meta[name="theme-color"]').content = "#E6EDEF";
  window.scrollTo(0,0);
}
$("gStatus").onclick=()=>setGroup("status"); $("gAcct").onclick=()=>setGroup("account");
$("morePick").onclick=()=>{ $("pickPanel").hidden=!$("pickPanel").hidden; };
$("pickDone").onclick=()=>{ $("pickPanel").hidden=true; window.scrollTo(0,0); };
$("q").addEventListener("input", render);
$("vList").onclick=()=>setView("list"); $("vGrid").onclick=()=>setView("grid");
document.querySelectorAll("[data-ic]").forEach(el=>el.innerHTML=svgIcon(el.dataset.ic));
// One button per user, alphabetical by name
const userList = $("userList");
Object.entries(ROLES).sort((a,b)=>a[1].name.localeCompare(b[1].name, undefined, {sensitivity:"base"})).forEach(([key,r])=>{
  const b=document.createElement("button"); b.className="tile"; b.style.setProperty("--c", r.color);
  b.innerHTML='<div class="ic" aria-hidden="true"></div><div class="tx"><h3></h3><p></p></div><span class="go" aria-hidden="true"></span>';
  b.querySelector(".ic").innerHTML=svgIcon(ROLE_ICON[key]||"user");
  b.querySelector(".go").innerHTML=svgIcon("arrow");
  b.querySelector("h3").textContent=r.name; b.querySelector("p").textContent=r.blurb;
  b.onclick=()=>choose(key); userList.appendChild(b);
});
$("pick").hidden=false; buildDock();
