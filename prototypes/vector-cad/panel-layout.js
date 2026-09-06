(() => {
  const key = 'vector-panel-layout-v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
  let active, top = 110;
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
    saved={};persist();
    document.querySelectorAll('.map-tile, .systems-window').forEach(el=>el.removeAttribute('style'));
  },true);
  window.addEventListener('resize',()=>document.querySelectorAll('.map-tile, .systems-window').forEach(el=>{if(saved[id(el)])apply(el,saved[id(el)]);}));
  new MutationObserver(initialize).observe(document.documentElement,{childList:true,subtree:true});
  initialize();
})();
