const $=id=>document.getElementById(id);
const BASE='https://jorj2026.github.io/';
const CATC={Learn:'#2F9E44',Reflect:'#0CA678',Create:'#D6336C',Work:'#1C7ED6',Hubs:'#7048E8',Featured:'#E8590C','Adventure':'#C2255C','More Games':'#F08C00',Retro:'#7048E8'};
const GL={tools:'Tools & Apps',games:'Games'};
const store=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}};
let view=store('qc-view')==='grid'?'grid':'list',cat='';
const url=p=>BASE+p.id+'/';
const MAXLIVE=60,live=new Set(),q=[];
function mount(t){const f=t.querySelector('iframe');if(f.src||!t._v)return;f.src=f.dataset.src;live.add(t)}
function unmount(t){const f=t.querySelector('iframe');f.removeAttribute('src');live.delete(t)}
const io=new IntersectionObserver(es=>{es.forEach(e=>{const t=e.target;t._v=e.isIntersecting;if(e.isIntersecting){if(live.size<MAXLIVE)mount(t);else if(!q.includes(t))q.push(t)}else{const i=q.indexOf(t);if(i>-1)q.splice(i,1);if(live.has(t))unmount(t)}});while(live.size<MAXLIVE&&q.length)mount(q.shift())},{rootMargin:'200px',threshold:0});
function card(p){const a=document.createElement('a');a.className='tile';a.href=url(p);a.target='_blank';a.rel='noopener';a.style.setProperty('--c',CATC[p.cat]||'#2F3E9E');
 a.innerHTML='<div class="thumb"><iframe tabindex="-1" aria-hidden="true" sandbox="allow-scripts allow-same-origin" loading="lazy"></iframe></div><div class="tx"><h3></h3><p></p></div><span class="go" aria-hidden="true"></span>';
 a.querySelector('iframe').dataset.src=url(p);a.querySelector('.go').innerHTML=svgIcon('arrow');
 a.querySelector('h3').textContent=p.name+(p.sub?' ('+p.sub+')':'');a.querySelector('p').textContent=p.desc;
 const t=a.querySelector('.thumb');if(!matchMedia('(prefers-reduced-motion:reduce)').matches)io.observe(t);return a}
function render(){io.disconnect();live.clear();q.length=0;
 $('vList').setAttribute('aria-pressed',view==='list');$('vGrid').setAttribute('aria-pressed',view==='grid');
 const term=$('q').value.trim().toLowerCase(),vis=DATA.filter(p=>!p.hidden);
 const cats=[...new Set(vis.map(p=>p.cat))];const ch=$('chips');ch.innerHTML='';
 ['',...cats].forEach(c=>{const b=document.createElement('button');b.className='chip';b.textContent=c||'All';b.setAttribute('aria-selected',cat===c);b.onclick=()=>{cat=c;render()};ch.appendChild(b)});
 const list=$('list');list.innerHTML='';
 const shown=vis.filter(p=>(!cat||p.cat===cat)&&(!term||(p.name+' '+p.desc+' '+p.cat).toLowerCase().includes(term)));
 if(!shown.length){list.innerHTML='<div class="empty">No matches.</div>';return}
 for(const g of Object.keys(GL)){const gi=shown.filter(p=>p.group===g);if(!gi.length)continue;
  const h=document.createElement('h2');h.className='main-h';h.textContent=GL[g];list.appendChild(h);
  for(const c of [...new Set(gi.map(p=>p.cat))]){const items=gi.filter(p=>p.cat===c);
   const s=document.createElement('div');s.className='grp';s.style.cssText='cursor:default;margin-top:10px';s.innerHTML='<span></span> <span class="count"></span>';s.firstChild.textContent=c;s.lastChild.textContent=items.length;list.appendChild(s);
   const d=document.createElement('div');d.className=view==='grid'?'grid':'rows';items.forEach(p=>d.appendChild(card(p)));list.appendChild(d)}}}
function details(){const tb=$('rows');if(tb.children.length)return;
 for(const g of Object.keys(GL))for(const c of [...new Set(DATA.filter(p=>p.group===g).map(p=>p.cat))]){
  const r=document.createElement('tr');r.className='sec';r.innerHTML='<td colspan="4"></td>';r.firstChild.textContent=GL[g]+' · '+c;tb.appendChild(r);
  for(const p of DATA.filter(p=>p.group===g&&p.cat===c)){const tr=document.createElement('tr');tr.innerHTML='<td></td><td></td><td></td><td class="te"></td>';
   const n=tr.children[0];if(p.hidden)n.textContent=p.name;else{const a=document.createElement('a');a.href=url(p);a.target='_blank';a.rel='noopener';a.textContent=p.name+(p.sub?' ('+p.sub+')':'');n.appendChild(a)}
   tr.children[1].textContent=p.cat;tr.children[2].textContent=p.desc;tr.children[3].textContent=p.tech;tb.appendChild(tr)}}}
$('gear').onclick=()=>{const on=$('details').hidden;$('details').hidden=!on;$('home').hidden=on;$('gear').setAttribute('aria-pressed',on);if(on){details();io.disconnect()}else render();scrollTo(0,0)};
$('q').addEventListener('input',render);
$('vList').onclick=()=>{view='list';store('qc-view',view);render()};$('vGrid').onclick=()=>{view='grid';store('qc-view',view);render()};
document.querySelectorAll('[data-ic]').forEach(el=>el.innerHTML=svgIcon(el.dataset.ic));


const PROFILES=[
 {name:'Jack',desc:'Every app, tool and game, with live previews.',c:'#2F3E9E',icon:'star',act:()=>show('home')},
 {name:'Catalog',desc:'The Quiet Collection: a gallery of bundled games.',c:'#E8590C',icon:'gamepad',href:'catalog/'}];
const pr=$('profiles');
PROFILES.forEach(P=>{const a=document.createElement(P.href?'a':'button');a.className='tile';a.style.setProperty('--c',P.c);if(P.href)a.href=P.href;
 a.innerHTML='<div class="ic" aria-hidden="true"></div><div class="tx"><h3></h3><p></p></div><span class="go" aria-hidden="true"></span>';
 a.querySelector('.ic').innerHTML=svgIcon(P.icon);a.querySelector('.go').innerHTML=svgIcon('arrow');
 a.querySelector('h3').textContent=P.name;a.querySelector('p').textContent=P.desc;if(P.act)a.onclick=P.act;pr.appendChild(a)});
function show(w){$('pick').hidden=w!=='pick';$('home').hidden=w!=='home';$('details').hidden=true;$('back').hidden=w==='pick';$('gear').hidden=w==='pick';
 if(w==='home')render();else io.disconnect();scrollTo(0,0)}
$('back').onclick=()=>show('pick');
show(location.hash==='#jack'?'home':'pick');
