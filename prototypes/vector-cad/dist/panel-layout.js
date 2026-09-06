(() => {
  const key = 'vector-panel-layout-v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
  let active, top = 110, pendingPreset=null;
  let snapping=false;
  try { snapping=localStorage.getItem('vector-panel-snap')==='true'; } catch {}
  const workspaceKey='vector-workspace-saved-v1';
  function rectFor(name, el) {
    const area=areaOf(el);if(!area)return null;
    const w=area.clientWidth,h=area.clientHeight,g=12,col=Math.min(330,Math.max(240,w*.25)),right=Math.min(540,Math.max(280,w*.43));
    const key=id(el);
    if(key==='resource')return {x:Math.max(g,w-692),y:g,w:Math.min(680,w-2*g),h:Math.min(650,h-2*g)};
    if(name==='resources') {
      if(key==='live')return {x:g,y:g,w:col,h:h-2*g};
      if(key==='available')return {x:Math.max(g,w-right-g),y:g,w:right,h:h-2*g};
    }
    if(key==='calls')return {x:g,y:g,w:col,h:(h-3*g)/2};
    if(key==='live')return {x:g,y:(h+g)/2,w:col,h:(h-3*g)/2};
    if(key==='units')return {x:Math.max(g,w-col-g),y:g,w:col,h:Math.min(h-2*g,360)};
    return null;
  }
  window.vectorLayout={
    snap:()=>snapping,
    toggleSnap:()=>{snapping=!snapping;try{localStorage.setItem('vector-panel-snap',String(snapping));}catch{}},
    preset:name=>{pendingPreset=name;saved={};persist();document.querySelectorAll('.map-tile').forEach(el=>{el.removeAttribute('style');const r=rectFor(name,el);if(r)saved[id(el)]=apply(el,r);});persist();},
    save:tiles=>{const panels={...saved};document.querySelectorAll('.map-tile').forEach(el=>{const area=areaOf(el);if(!area)return;const r=el.getBoundingClientRect(),a=area.getBoundingClientRect();panels[id(el)]={x:r.left-a.left,y:r.top-a.top,w:r.width,h:r.height};});localStorage.setItem(workspaceKey,JSON.stringify({tiles,panels}));},
    restore:()=>{try{const v=JSON.parse(localStorage.getItem(workspaceKey)||'null');if(!v||!v.tiles||!v.panels)return null;pendingPreset=null;saved=v.panels;persist();document.querySelectorAll('.map-tile').forEach(el=>{if(saved[id(el)])apply(el,saved[id(el)]);});return v.tiles;}catch{return null;}}
  };
  const areaOf=el=>el.matches('.systems-window')?{clientWidth:innerWidth,clientHeight:innerHeight,getBoundingClientRect:()=>({left:0,top:0})}:el.closest('.map-workspace');
  const initialized = new WeakSet();
  const id = el => el.matches('.systems-window')?'systems':[...el.classList].find(c => c.startsWith('tile-')).slice(5);
  const persist = () => { try { localStorage.setItem(key, JSON.stringify(saved)); } catch {} };
  function apply(el, rect) {
    const area = areaOf(el);
    if (!area) return;
    const w = Math.min(area.clientWidth, Math.max(220, rect.w));
    const h = Math.min(area.clientHeight, Math.max(120, rect.h));
    const x = Math.max(0, Math.min(area.clientWidth - w, rect.x));
    const y = Math.max(0, Math.min(area.clientHeight - h, rect.y));
    Object.assign(el.style, { left:x+'px', top:y+'px', width:w+'px', height:h+'px', right:'auto', bottom:'auto', maxHeight:'none' });
    return {x,y,w,h};
  }
  function initialize() {
    document.querySelectorAll('.map-tile, .systems-window').forEach(el => {
      if (initialized.has(el) || !el.querySelector(".tile-handle, .systems-window > header")) return;
      initialized.add(el);
      if (saved[id(el)]) apply(el, saved[id(el)]);
      else if(pendingPreset){const r=rectFor(pendingPreset,el);if(r){saved[id(el)]=apply(el,r);persist();}}
      else if(el.matches('.rugged-mdt')){const r=rectFor('overview',el);if(r)apply(el,r);}
      el.querySelector('.tile-handle, .systems-window > header').title = 'Drag to move panel';
      for (const edge of ['n','s','e','w','ne','nw','se','sw']) {
        const grip = document.createElement('div');
        grip.className = 'panel-resize panel-resize-' + edge;
        grip.dataset.edge = edge;
        grip.title = 'Drag to resize panel';
        el.appendChild(grip);
      }
    });
  }
  document.addEventListener('pointerdown', e => {
    const el = e.target.closest('.map-tile, .systems-window');
    if (!el || e.button !== 0) return;
    el.style.zIndex = ++top;
    const grip = e.target.closest('.panel-resize');
    if (!grip && (!e.target.closest('.tile-handle, .systems-window > header') || e.target.closest('button'))) return;
    const r = el.getBoundingClientRect(), a = areaOf(el).getBoundingClientRect();
    active = {el,edge:grip?.dataset.edge,x:e.clientX,y:e.clientY,r:{x:r.left-a.left,y:r.top-a.top,w:r.width,h:r.height},pointer:e.pointerId};
    el.setPointerCapture(e.pointerId);
    el.classList.add('panel-manipulating');
    e.preventDefault(); e.stopPropagation();
  }, true);
  document.addEventListener('pointermove', e => {
    if (!active || e.pointerId !== active.pointer) return;
    const {el,edge,r} = active, dx=e.clientX-active.x, dy=e.clientY-active.y;
    const area=areaOf(el);
    let next={...r};
    if (!edge) { next.x+=dx;next.y+=dy; }
    else {
      if(edge.includes('e'))next.w=Math.max(220,Math.min(area.clientWidth-r.x,r.w+dx));
      if(edge.includes('s'))next.h=Math.max(120,Math.min(area.clientHeight-r.y,r.h+dy));
      if(edge.includes('w')){next.x=Math.max(0,Math.min(r.x+r.w-220,r.x+dx));next.w=r.x+r.w-next.x;}
      if(edge.includes('n')){next.y=Math.max(0,Math.min(r.y+r.h-120,r.y+dy));next.h=r.y+r.h-next.y;}
    }
    if(snapping&&!edge){
      const distance=18;
      if(next.x<distance)next.x=0;
      if(next.y<distance)next.y=0;
      if(Math.abs(area.clientWidth-next.x-next.w)<distance)next.x=area.clientWidth-next.w;
      if(Math.abs(area.clientHeight-next.y-next.h)<distance)next.y=area.clientHeight-next.h;
      area.querySelectorAll?.('.map-tile').forEach(other=>{if(other===el)return;const b=other.getBoundingClientRect(),a=area.getBoundingClientRect();const right=b.right-a.left,bottom=b.bottom-a.top,left=b.left-a.left,top=b.top-a.top;if(Math.abs(next.x-right-8)<distance)next.x=right+8;if(Math.abs(next.x+next.w-left+8)<distance)next.x=left-next.w-8;if(Math.abs(next.y-bottom-8)<distance)next.y=bottom+8;if(Math.abs(next.y+next.h-top+8)<distance)next.y=top-next.h-8;});
    }
    saved[id(el)]=apply(el,next);
    e.preventDefault(); e.stopPropagation();
  }, true);
  function finish(e) {
    if (!active || e.pointerId !== active.pointer) return;
    active.el.classList.remove('panel-manipulating');
    if(active.el.hasPointerCapture(e.pointerId))active.el.releasePointerCapture(e.pointerId);
    active=null;persist();
  }
  document.addEventListener('pointerup',finish,true);
  document.addEventListener('pointercancel',finish,true);
  document.addEventListener('click',e=>{
    if(!e.target.closest('[data-reset-panels]'))return;
    saved={};pendingPreset=null;persist();
    document.querySelectorAll('.map-tile, .systems-window').forEach(el=>el.removeAttribute('style'));
  },true);
  window.addEventListener('resize',()=>document.querySelectorAll('.map-tile, .systems-window').forEach(el=>{if(saved[id(el)])apply(el,saved[id(el)]);}));
  new MutationObserver(initialize).observe(document.documentElement,{childList:true,subtree:true});
  initialize();
})();
