(() => {
  let toast, timer;
  document.addEventListener('click',async e=>{
    const button=e.target.closest('[data-copy]');if(!button)return;
    e.preventDefault();e.stopPropagation();
    const value=button.dataset.copy;if(!value)return;
    window.vectorCopiedValue=value;
    let message='Copied';
    try{await navigator.clipboard.writeText(value);}catch{message='Ready to paste into Systems';}
    if(!toast){toast=document.createElement('div');toast.className='copy-toast';toast.setAttribute('role','status');document.body.appendChild(toast);}
    toast.textContent=message;toast.hidden=false;clearTimeout(timer);timer=setTimeout(()=>toast.hidden=true,2000);
  },true);
})();
