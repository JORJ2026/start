(function(){
const P=window.PROJECTS,$=(s,r=document)=>r.querySelector(s);
const GROUPS=[['tools','Tools & Apps'],['games','Games']];
const hue=id=>{let h=0;for(const c of id)h=(h*31+c.charCodeAt(0))%360;return h};
const MAX=4,live=new Set(),queue=[];
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches||(navigator.connection&&navigator.connection.saveData);
function mount(sh){if(sh._f)return;const f=document.createElement('iframe');f.src=sh.dataset.src;f.loading='lazy';f.tabIndex=-1;f.setAttribute('aria-hidden','true');f.title='';
 f.setAttribute('sandbox','allow-scripts allow-same-origin');f.setAttribute('allow','autoplay \'none\'');
 f.onload=()=>setTimeout(()=>{if(sh._f===f)sh.classList.add('live')},1400);sh.appendChild(f);sh._f=f;live.add(sh)}
function unmount(sh){if(!sh._f)return;sh._f.remove();sh._f=null;sh.classList.remove('live');live.delete(sh)}
function pump(){while(live.size<MAX&&queue.length){const s=queue.shift();if(s._vis)mount(s)}}
const io=new IntersectionObserver(es=>{for(const e of es){const s=e.target;s._vis=e.isIntersecting;
 if(e.isIntersecting){if(!s._f&&!queue.includes(s))queue.push(s)}else{const i=queue.indexOf(s);if(i>-1)queue.splice(i,1);unmount(s)}}pump()},{rootMargin:'-8% 0px -8% 0px',threshold:.55});
const ro=new ResizeObserver(es=>{for(const e of es)e.target.style.setProperty('--s',e.contentRect.width/1280)});
function card(p){const a=document.createElement('a');a.className='card';a.href=p.url;a.style.setProperty('--h',p.accent!=null?p.accent:hue(p.id));
 a.setAttribute('aria-label',p.name+(p.sub?' ('+p.sub+')':''));
 a.innerHTML='<div class="shot" data-src="'+p.url+'">'+(p.poster?'<div class="ph" style="background-image:url('+p.poster+')"></div>':'<div class="ini">'+p.name[0]+'</div>')+'</div><div class="meta"><b></b>'+(p.sub?'<i></i>':'')+'<u>'+(p.local?'→':'↗')+'</u></div>';
 $('b',a).textContent=p.name;if(p.sub)$('i',a).textContent=p.sub;
 const sh=$('.shot',a);ro.observe(sh);if(!reduce)io.observe(sh);return a}
if($('#app')){const app=$('#app');
 for(const[g,gl]of GROUPS){const cats=[];for(const p of P)if(p.group==g&&!p.hidden&&!cats.includes(p.cat))cats.push(p.cat);if(!cats.length)continue;
  for(const c of cats){
   const gr=document.createElement('div');gr.className='grid';for(const p of P)if(p.group==g&&p.cat==c&&!p.hidden)gr.appendChild(card(p));app.appendChild(gr)}}}
if($('#rows')){const tb=$('#rows');
 for(const[g,gl]of GROUPS){const cats=[];for(const p of P)if(p.group==g&&!cats.includes(p.cat))cats.push(p.cat);
  for(const c of cats){const r=document.createElement('tr');r.className='sec';r.innerHTML='<td colspan="4"></td>';r.firstChild.textContent=gl+' · '+c;tb.appendChild(r);
   for(const p of P)if(p.group==g&&p.cat==c){const tr=document.createElement('tr');tr.innerHTML='<td></td><td class="ty"></td><td></td><td class="te"></td>';
    const n=tr.children[0];if(p.hidden){n.textContent=p.name}else{const a=document.createElement('a');a.href=p.url;a.textContent=p.name;n.appendChild(a)}
    if(p.sub){const s=document.createElement('small');s.textContent=p.sub;n.appendChild(s)}
    tr.children[1].textContent=p.local?'bundled':p.hidden?'unreachable':'live site';tr.children[2].textContent=p.desc;tr.children[3].textContent=p.tech;tb.appendChild(tr)}}}}
})();
