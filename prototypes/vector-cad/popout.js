(() => {
  const windows=new Map();
  const identify=p=>p['data-popout-key']||(p.className||'').split(/\s+/).find(c=>c==='systems-window'||c==='map-base'||c.startsWith('tile-')&&c!=='tile-content'&&c!=='tile-handle');
  const label=k=>k==='map-base'?'Map':k==='systems-window'?'Systems':k==='tile-resource'?'MDT':k.replace('tile-','').replace(/-/g,' ');
  const refresh=()=>window.dispatchEvent(new Event('vector-popout-change'));
  const dock=k=>{const w=windows.get(k);windows.delete(k);if(w&&!w.closed)w.close();refresh();};
  function pop(k){
    if(windows.has(k)){windows.get(k).focus();return;}
    const w=window.open('', 'vector-'+k,'popup=yes,width=1000,height=760,resizable=yes,scrollbars=yes');
    if(!w){alert('Allow pop-up windows for VECTOR to detach this panel.');return;}
    w.document.title='VECTOR | '+label(k);
    const base=w.document.createElement('base');base.href=document.baseURI;w.document.head.append(base);
    document.querySelectorAll('style,link[rel="stylesheet"]').forEach(e=>w.document.head.append(e.cloneNode(true)));
    const style=w.document.createElement('style');style.textContent=`html,body{margin:0!important;width:100%;height:100%;overflow:hidden;background:#dfe6eb;font-family:Arial}#popout-root{height:calc(100vh - 34px);position:relative;display:flex;flex-direction:column}#popout-root>.map-tile,#popout-root>.systems-window,#popout-root>.map-base,#popout-root>[data-popout-key]{position:relative!important;inset:auto!important;box-sizing:border-box;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;flex:1;margin:0}#popout-root>.map-base{display:flex;flex-direction:column}#popout-root>.rugged-mdt{display:grid!important}#popout-root .panel-resize,#popout-root .vector-popout-button{display:none!important}.popout-toolbar{height:34px;display:flex;align-items:center;justify-content:space-between;background:#203847;color:white;padding:0 10px;box-sizing:border-box;font:12px Arial}.popout-toolbar button{cursor:pointer;background:#e4edf3;border:1px solid #a8bfce;padding:4px 9px}`;
    w.document.head.append(style);
    const bar=w.document.createElement('div');bar.className='popout-toolbar';bar.append(w.document.createTextNode('VECTOR / '+label(k).toUpperCase()));
    const b=w.document.createElement('button');b.textContent='Dock back';b.onclick=()=>dock(k);bar.append(b);w.document.body.append(bar);
    const host=w.document.createElement('div');host.id='popout-root';w.document.body.append(host);
    windows.set(k,w);w.addEventListener('pagehide',()=>{if(windows.get(k)===w){windows.delete(k);refresh();}});
    // Copy controls operate in the window that received the click.
    w.document.addEventListener('click',e=>{const b=e.target.closest('[data-copy]');if(b){const value=b.dataset.copy;window.vectorCopiedValue=value;w.navigator.clipboard?.writeText(value).catch(()=>{});}});
    refresh();
  }
  window.vectorPortal=(node,props)=>{
    const k=identify(props);if(!k)return node;
    const w=windows.get(k);if(!w||w.closed)return node;
    return window.ReactDOM.createPortal(node,w.document.getElementById('popout-root'),k);
  };
  function buttons(){document.querySelectorAll('.map-tile,.systems-window,.map-base,[data-popout-key]').forEach(el=>{
    const head=el.querySelector(':scope > .tile-handle,:scope > header,:scope > div:first-child');if(!head||head.querySelector('.vector-popout-button'))return;
    const k=identify({className:el.className,'data-popout-key':el.dataset.popoutKey});if(!k)return;
    const b=document.createElement('button');b.type='button';b.className='vector-popout-button';b.title='Pop out '+label(k);b.setAttribute('aria-label','Pop out '+label(k));b.textContent='↗';b.style.cssText='flex:0 0 auto;cursor:pointer;margin-left:6px;font:14px Arial;padding:2px 7px';b.onclick=e=>{e.stopPropagation();pop(k);};head.append(b);
  });}
  new MutationObserver(buttons).observe(document.documentElement,{subtree:true,childList:true});
  setInterval(()=>{for(const [k,w] of windows)if(w.closed){windows.delete(k);refresh();}buttons();},1000);
  window.addEventListener('pagehide',()=>{for(const w of windows.values())if(!w.closed)w.close();});
  window.vectorPopouts={open:pop,dock,isOpen:k=>windows.has(k),hasPrefix:p=>[...windows.keys()].some(k=>k.startsWith(p)),keepDispatch:screen=>{document.body.dataset.vectorScreen=screen;return windows.size>0;}};buttons();
})();
