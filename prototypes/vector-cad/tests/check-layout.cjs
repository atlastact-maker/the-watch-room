const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const memory=new Map(),events={};
const area={clientWidth:1400,clientHeight:700,getBoundingClientRect:()=>({left:0,top:0}),querySelectorAll:()=>panels};
function panel(name){return {classList:['map-tile','tile-'+name],style:{},matches:s=>s==='.rugged-mdt'&&name==='resource',closest:()=>area,querySelector:()=>({}),appendChild:()=>{},removeAttribute(){this.style={};},getBoundingClientRect(){const {left='0',top='0',width='300',height='300'}=this.style;const x=parseFloat(left),y=parseFloat(top),w=parseFloat(width),h=parseFloat(height);return {left:x,top:y,width:w,height:h,right:x+w,bottom:y+h};}};}
const panels=[panel('calls'),panel('live'),panel('units')];
let observer;
const context={window:{addEventListener:()=>{}},document:{documentElement:{},querySelectorAll:()=>panels,addEventListener:(n,f)=>events[n]=f,createElement:()=>({dataset:{}})},localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},MutationObserver:class{constructor(f){observer=f;}observe(){}},innerWidth:1400,innerHeight:900,console};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/panel-layout.js'),'utf8'),context);
const api=context.window.vectorLayout;
api.preset('resources');const added=panel('available');panels.push(added);observer();assert(parseFloat(added.style.width)>=500,'newly mounted resource panel must receive preset');assert(parseFloat(added.style.left)>600);
api.save({live:true,available:true});api.preset('overview');const restored=api.restore();assert(restored.available&&restored.live);assert(parseFloat(added.style.left)>600);
assert(!api.snap());api.toggleSnap();assert(api.snap());assert.equal(memory.get('vector-panel-snap'),'true');
console.log('PASS: presets apply to newly mounted panels, saved visibility/geometry restore, snap preference persists.');
