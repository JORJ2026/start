const $=id=>document.getElementById(id);
const BASE='https://jorj2026.github.io/';
const CATC={Learn:'#2F9E44',Reflect:'#0CA678',Create:'#D6336C',Work:'#1C7ED6',Hubs:'#7048E8',Featured:'#E8590C',Adventure:'#C2255C','More Games':'#F08C00',Retro:'#7048E8'};
const GL={tools:'Tools & Apps',games:'Games'};
const store=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}};
const url=p=>BASE+p.id+'/';
const byId=id=>DATA.find(p=>p.id===id);

/* Family picks: id on jorj2026.github.io + the name shown */
const PICKS={
 gran:[['play','Play Something!'],['bible','Bible Verses'],['granstudy','Gran’s Study App'],['gsd','Tools'],['pocketreference','Pocket Reference']],
 faith:[['play','Play Something!'],['meow','Cat Games'],['gsd','Tools'],['pocketreference','Pocket Reference']]
};
const pickList=k=>PICKS[k].map(([id,name])=>{const p=byId(id)||{id,desc:'',cat:''};return Object.assign({},p,{name,sub:''})});

const PROFILES=[
 {key:'jack',name:'Jack',c:'#3B4BC8',icon:'star',n:()=>DATA.filter(p=>!p.hidden).length+' projects'},
 {key:'faith',name:'Faith & Harmony',c:'#D6336C',icon:'heart',n:()=>PICKS.faith.length+' apps'},
 {key:'gran',name:'Gran',c:'#2F9E44',icon:'sun',n:()=>PICKS.gran.length+' apps'},
 {key:'catalog',name:'Catalog',c:'#E8590C',icon:'gamepad',href:'catalog/index.html',n:()=>'The Quiet Collection'}];

let view=store('qc-view')==='list'?'list':'grid',cat='',cur=null;

/* live previews: 1280×800 page scaled to the card */
const MAXLIVE=24,live=new Set(),q=[];
const ro=new ResizeObserver(es=>{for(const e of es)e.target.style.setProperty('--s',e.contentRect.width/1280)});
function mount(t){if(t._f||!t._v)return;const f=document.createElement('iframe');f.tabIndex=-1;f.setAttribute('aria-hidden','true');f.title='';
 f.setAttribute('sandbox','allow-scripts allow-same-origin');f.setAttribute('allow',"autoplay 'none'");f.loading='lazy';
 f.onload=()=>setTimeout(()=>{if(t._f===f)t.classList.add('live')},900);f.src=t.dataset.src;t.appendChild(f);t._f=f;live.add(t)}
function unmount(t){if(!t._f)return;t._f.remove();t._f=null;t.classList.remove('live');live.delete(t)}
function pump(){while(live.size<MAXLIVE&&q.length)mount(q.shift())}
const io=new IntersectionObserver(es=>{for(const e of es){const t=e.target;t._v=e.isIntersecting;
 if(e.isIntersecting){if(!t._f&&!q.includes(t))q.push(t)}else{const i=q.indexOf(t);if(i>-1)q.splice(i,1);unmount(t)}}pump()},{rootMargin:'150px',threshold:0});
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
function reset(){io.disconnect();for(const t of [...live])unmount(t);q.length=0}

function card(p,tag){const a=document.createElement('a');a.className='card';a.href=url(p);a.target='_blank';a.rel='noopener';
 if(CATC[p.cat])a.style.setProperty('--c',CATC[p.cat]);
 a.innerHTML='<div class="thumb"><div class="ini"></div></div><div class="tx"><h3><span></span></h3><p></p></div>';
 const t=a.querySelector('.thumb');t.dataset.src=url(p);a.querySelector('.ini').textContent=(p.name||'?')[0];
 a.querySelector('h3 span').textContent=p.name+(p.sub?' · '+p.sub:'');
 if(tag&&p.cat){const s=document.createElement('span');s.className='tag';s.textContent=p.cat;a.querySelector('h3').appendChild(s)}
 a.querySelector('p').textContent=p.desc||'';ro.observe(t);if(!reduce)io.observe(t);return a}

function render(){reset();const list=$('list');list.innerHTML='';
 if(cur.key!=='jack'){list.className='big';const g=document.createElement('div');g.className='grid';pickList(cur.key).forEach(p=>g.appendChild(card(p)));list.appendChild(g);return}
 list.className='';
 $('vList').setAttribute('aria-pressed',view==='list');$('vGrid').setAttribute('aria-pressed',view==='grid');
 const term=$('q').value.trim().toLowerCase(),vis=DATA.filter(p=>!p.hidden);
 const ch=$('chips');ch.innerHTML='';
 ['',...new Set(vis.map(p=>p.cat))].forEach(c=>{const b=document.createElement('button');b.className='chip';b.textContent=c||'All';b.setAttribute('aria-selected',cat===c);b.onclick=()=>{cat=c;render()};ch.appendChild(b)});
 const shown=vis.filter(p=>(!cat||p.cat===cat)&&(!term||(p.name+' '+p.desc+' '+p.cat).toLowerCase().includes(term)));
 if(!shown.length){list.innerHTML='<div class="empty">No matches.</div>';return}
 for(const g of Object.keys(GL)){const gi=shown.filter(p=>p.group===g);if(!gi.length)continue;
  const h=document.createElement('h2');h.className='sec-h';h.innerHTML='<span></span><span class="count"></span>';h.firstChild.textContent=GL[g];h.lastChild.textContent=gi.length;list.appendChild(h);
  for(const c of new Set(gi.map(p=>p.cat))){const items=gi.filter(p=>p.cat===c);
   const s=document.createElement('div');s.className='cat-h';s.style.setProperty('--c',CATC[c]||'#888');s.textContent=c;list.appendChild(s);
   const d=document.createElement('div');d.className=view==='grid'?'grid':'rows';items.forEach(p=>d.appendChild(card(p)));list.appendChild(d)}}}

function details(){const tb=$('rows');if(tb.children.length)return;
 for(const g of Object.keys(GL))for(const c of new Set(DATA.filter(p=>p.group===g).map(p=>p.cat))){
  const r=document.createElement('tr');r.className='sec';r.innerHTML='<td colspan="4"></td>';r.firstChild.textContent=GL[g]+' · '+c;tb.appendChild(r);
  for(const p of DATA.filter(p=>p.group===g&&p.cat===c)){const tr=document.createElement('tr');tr.innerHTML='<td></td><td></td><td></td><td class="te"></td>';
   const n=tr.children[0];if(p.hidden)n.textContent=p.name;else{const a=document.createElement('a');a.href=url(p);a.target='_blank';a.rel='noopener';a.textContent=p.name+(p.sub?' ('+p.sub+')':'');n.appendChild(a)}
   tr.children[1].textContent=p.cat;tr.children[2].textContent=p.desc;tr.children[3].textContent=p.tech;tb.appendChild(tr)}}}

function show(key){const P=PROFILES.find(p=>p.key===key&&!p.href);cur=P||null;
 document.documentElement.style.setProperty('--p',P?P.c:'#3B4BC8');
 $('pick').hidden=!!P;$('home').hidden=!P;$('details').hidden=true;$('back').hidden=!P;$('who').hidden=!P;
 $('gear').hidden=!P||P.key!=='jack';$('gear').setAttribute('aria-pressed','false');
 $('bar').hidden=$('chips').hidden=!P||P.key!=='jack';
 if(P){$('whoName').textContent=P.name;$('whoAv').innerHTML=svgIcon(P.icon);render()}else reset();
 const h=P?'#'+P.key:'';if(location.hash!==h)history.replaceState(null,'',h||location.pathname);scrollTo(0,0)}

const pr=$('profiles');
PROFILES.forEach(P=>{const a=document.createElement(P.href?'a':'button');a.className='person';a.style.setProperty('--c',P.c);if(P.href)a.href=P.href;else a.type='button';
 a.innerHTML='<span class="av" aria-hidden="true"></span><h3></h3><span class="n"></span>';
 a.querySelector('.av').innerHTML=svgIcon(P.icon);a.querySelector('h3').textContent=P.name;a.querySelector('.n').textContent=P.n();
 if(!P.href)a.onclick=()=>show(P.key);pr.appendChild(a)});

$('gear').onclick=()=>{const on=$('details').hidden;$('details').hidden=!on;$('home').hidden=on;$('gear').setAttribute('aria-pressed',on);if(on){reset();details()}else render();scrollTo(0,0)};
$('q').addEventListener('input',render);
$('vList').onclick=()=>{view='list';store('qc-view',view);render()};$('vGrid').onclick=()=>{view='grid';store('qc-view',view);render()};
$('back').onclick=()=>show('');
document.querySelectorAll('[data-ic]').forEach(el=>el.innerHTML=svgIcon(el.dataset.ic));
show(location.hash.slice(1));
addEventListener('hashchange',()=>{const k=location.hash.slice(1);if(k!==(cur?cur.key:''))show(k)});

(function(){const s=document.getElementById('splash');if(!s||document.documentElement.classList.contains('nosplash'))return;
 const done=()=>{if(s.classList.contains('out'))return;s.classList.add('out');try{sessionStorage.setItem('jp-splash','1')}catch(e){}setTimeout(()=>s.remove(),700)};
 s.addEventListener('click',done);addEventListener('keydown',done,{once:true});setTimeout(done,1600)})();
