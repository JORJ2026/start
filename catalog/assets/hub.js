(function(){
const P=window.PROJECTS,$=(s,r=document)=>r.querySelector(s);
const SECTIONS=[['local','The Collection'],['linked','On GitHub']];
const hue=id=>{let h=0;for(const c of id)h=(h*31+c.charCodeAt(0))%360;return h};

/* "Updated 3 days ago" from an ISO date */
function ago(iso){const d=new Date(iso);if(isNaN(d))return'';const s=(Date.now()-d)/1000;
 const u=[[31536000,'year'],[2592000,'month'],[604800,'week'],[86400,'day'],[3600,'hour'],[60,'minute']];
 for(const[n,w]of u){const v=Math.floor(s/n);if(v>=1)return'Updated '+v+' '+w+(v>1?'s':'')+' ago'}return'Updated just now'}
const fmt=iso=>{const d=new Date(iso);return isNaN(d)?'':d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})};

/* live previews: silent, sandboxed, a few at a time */
const MAX=4,live=new Set(),queue=[];
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches||(navigator.connection&&navigator.connection.saveData);
function mount(sh){if(sh._f)return;const f=document.createElement('iframe');f.src=sh.dataset.src;f.loading='lazy';f.tabIndex=-1;f.setAttribute('aria-hidden','true');f.title='';
 f.setAttribute('sandbox','allow-scripts allow-same-origin');f.setAttribute('allow',"autoplay 'none'");f.muted=true;
 f.onload=()=>{try{f.contentWindow.document.querySelectorAll('audio,video').forEach(m=>{m.muted=true;m.pause()})}catch(e){}
  setTimeout(()=>{if(sh._f===f)sh.classList.add('live')},1400)};sh.appendChild(f);sh._f=f;live.add(sh)}
function unmount(sh){if(!sh._f)return;sh._f.remove();sh._f=null;sh.classList.remove('live');live.delete(sh)}
function pump(){while(live.size<MAX&&queue.length){const s=queue.shift();if(s._vis)mount(s)}}
const io=new IntersectionObserver(es=>{for(const e of es){const s=e.target;s._vis=e.isIntersecting;
 if(e.isIntersecting){if(!s._f&&!queue.includes(s))queue.push(s)}else{const i=queue.indexOf(s);if(i>-1)queue.splice(i,1);unmount(s)}}pump()},{rootMargin:'-8% 0px -8% 0px',threshold:.55});
const ro=new ResizeObserver(es=>{for(const e of es)e.target.style.setProperty('--s',e.contentRect.width/1280)});

const times=[];
function card(p){const a=document.createElement('a');a.className='card'+(p.local?'':' ext');a.href=p.url;
 if(!p.local){a.target='_blank';a.rel='noopener'}
 a.style.setProperty('--h',p.accent!=null?p.accent:hue(p.id));
 a.setAttribute('aria-label',p.name+(p.sub?' ('+p.sub+')':''));
 a.innerHTML='<div class="shot" data-src="'+p.url+'">'+(p.poster?'<div class="ph" style="background-image:url('+p.poster+')"></div>':'<div class="ini"></div>')+'</div><div class="meta"><b></b>'+(p.sub?'<i></i>':'')+'<u>'+(p.local?'→':'↗')+'</u></div>'+(p.updated?'<time></time>':'');
 $('b',a).textContent=p.name;if(p.sub)$('i',a).textContent=p.sub;
 const ini=$('.ini',a);if(ini)ini.textContent=p.name[0];
 const t=$('time',a);if(t){t.dataset.id=p.id;times.push([t,p])}
 const sh=$('.shot',a);ro.observe(sh);if(!reduce)io.observe(sh);return a}
function stamp(){for(const[t,p]of times){t.dateTime=p.updated;t.textContent=ago(p.updated);t.title=fmt(p.updated)}}

/* refresh dates from GitHub when reachable (one request, cached for the visit) */
function refresh(after){const k='qc-gh-dates';let m=null;try{m=JSON.parse(sessionStorage.getItem(k))}catch(e){}
 const apply=m=>{for(const p of P){const d=m[p.id.toLowerCase()];if(d&&!p.local)p.updated=d}after()};
 if(m){apply(m);return}
 fetch('https://api.github.com/users/JORJ2026/repos?per_page=100&sort=pushed').then(r=>r.ok?r.json():Promise.reject()).then(js=>{
  const m={};for(const r of js)m[r.name.toLowerCase()]=r.pushed_at;try{sessionStorage.setItem(k,JSON.stringify(m))}catch(e){}apply(m)}).catch(()=>{})}

if($('#app')){const app=$('#app');
 for(const[g,gl]of SECTIONS){const items=P.filter(p=>p.group===g&&!p.hidden);if(!items.length)continue;
  if(g!=='local'){const h=document.createElement('h2');h.className='sec';h.textContent=gl;app.appendChild(h)}
  const cats=[...new Set(items.map(p=>p.cat))];
  for(const c of cats){
   if(g!=='local'){const t=document.createElement('div');t.className='sub';t.textContent=c;app.appendChild(t)}
   const gr=document.createElement('div');gr.className='grid';for(const p of items)if(p.cat===c)gr.appendChild(card(p));app.appendChild(gr)}}
 stamp();refresh(stamp);setInterval(stamp,60000)}

if($('#rows')){const tb=$('#rows');
 const draw=()=>{tb.innerHTML='';
  for(const[g,gl]of SECTIONS)for(const c of new Set(P.filter(p=>p.group===g).map(p=>p.cat))){
   const r=document.createElement('tr');r.className='sec';r.innerHTML='<td colspan="5"></td>';r.firstChild.textContent=gl===c?gl:gl+' · '+c;tb.appendChild(r);
   for(const p of P.filter(p=>p.group===g&&p.cat===c)){const tr=document.createElement('tr');tr.innerHTML='<td></td><td class="ty"></td><td></td><td class="te"></td><td class="ty"></td>';
    const n=tr.children[0];const a=document.createElement('a');a.href=p.url;a.textContent=p.name;n.appendChild(a);
    if(p.sub){const s=document.createElement('small');s.textContent=p.sub;n.appendChild(s)}
    if(p.repo){const s=document.createElement('a');s.href=p.repo;s.textContent='repo';s.className='repo';s.target='_blank';s.rel='noopener';n.appendChild(s)}
    tr.children[1].textContent=p.local?'bundled':'live site';tr.children[2].textContent=p.desc;tr.children[3].textContent=p.tech;tr.children[4].textContent=p.updated?fmt(p.updated):'';tb.appendChild(tr)}}};
 draw();refresh(draw)}
})();
