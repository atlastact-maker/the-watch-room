const fs=require('fs'),vm=require('vm'),assert=require('assert');
class Base{setState(p){Object.assign(this.state,typeof p==='function'?p(this.state):p);}}
const context={DCLogic:Base,React:{createRef:()=>({current:null})},window:{},document:{},console,Date,Math,localStorage:{getItem:()=>null}};
vm.createContext(context);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../dist/VECTOR Dispatch.dc.html'),'utf8').match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1]+'\nglobalThis.App=Component;globalThis.incidents=INCIDENTS;',context);
const app=new context.App({}),inc=context.incidents[1];app.setState({selected:inc.ref});
let vals=app.renderVals();assert(vals.focusSummary);assert(vals.availRows.length);assert(vals.availRows.some(r=>r.blocked));assert(vals.availRows.some(r=>!r.blocked));
const original=JSON.stringify(app.state.dispatchJobs);
app.mobilise('G53P1');assert.equal(JSON.stringify(app.state.dispatchJobs),original,'off-run unit must not send');
const eligible=app.state.fleet.find(u=>!app.resourceAssessment(u,inc).blocked);assert(eligible);
const assessment=app.resourceAssessment({...eligible,crew:'0/5'},inc);assert(assessment.blocked,'short crew must block');
app.allocateResource(eligible.callsign);assert(inc.pda.some(p=>p.callsign===eligible.callsign));assert(!app.state.dispatchJobs[eligible.callsign],'allocate must not send');
app.mobilise(eligible.callsign);assert(app.state.dispatchJobs[eligible.callsign]);
const sentAt=app.state.dispatchJobs[eligible.callsign].sentAt;app.mobilise(eligible.callsign);assert.equal(app.state.dispatchJobs[eligible.callsign].sentAt,sentAt);
app.setState({detail:eligible.callsign});let mdt=app.resourceControlVals();assert(mdt.rcOpen);assert(mdt.rcHazards);assert(mdt.rcInstruction);assert(mdt.rcArrivalDisabled);
for(let i=0;i<4;i++)app.advanceDispatch(eligible.callsign);
mdt=app.resourceControlVals();assert(!mdt.rcArrivalDisabled);mdt.rcArrival();assert.equal(app.state.fleet.find(u=>u.callsign===eligible.callsign).status,2);
const second=context.incidents[0];app.setState({selected:second.ref});vals=app.renderVals();assert.equal(vals.selectedRef,second.ref);assert(vals.focusUnits.every(u=>!u.label.startsWith(eligible.callsign)),'focus must follow selection');
assert(app.resourceAssessment(eligible,second).blocked,'unit reserved by other incident must block');
console.log('PASS: both incident views, eligibility, crew gate, allocation/send separation, duplicate send, MDT acknowledgement and arrival.');

function returnAll(){for(const item of app.resourceControlVals().rcHistory[0].returnItems){item.change({target:{value:'Returned — serviceable'}});item.confirm();}}
// Configured tasks reserve actual recorded equipment and named crew.
app.setState({selected:context.incidents[0].ref,detail:'G15P2',rcTab:'Water'});
let view=app.resourceControlVals();view.rcWaterActions.find(x=>x.label==='Hose attack').pick();
view=app.resourceControlVals();assert(view.rcBlocked);assert.equal(view.rcMethods.length,3);
assert(!view.rcEquipmentChoices.some(e=>/UHPL/.test(e.label)),'do not invent unrecorded equipment');
view.rcMethods.find(x=>x.label==='Exterior attack').pick();
view=app.resourceControlVals();const hose=view.rcEquipmentChoices.find(x=>x.label==='45 mm delivery hose');assert(hose&&!hose.disabled);hose.pick();
view=app.resourceControlVals();view.rcLocations.find(x=>x.label==='Front').pick();
for(let i=0;i<2;i++){view=app.resourceControlVals();view.rcCrew.find(c=>!c.busy&&!c.selected).pick();}
view=app.resourceControlVals();assert(!view.rcBlocked);view.rcStart();
view=app.resourceControlVals();assert.equal(view.rcTasks.length,1);assert.equal(view.rcTasks[0].equipment,'1 × 45 mm delivery hose');assert(view.rcTasks[0].target.startsWith('Front'));
view.rcWaterActions.find(x=>x.label==='Hose attack').pick();view=app.resourceControlVals();assert(view.rcEquipmentChoices.filter(e=>/delivery hose/.test(e.label)).every(e=>!e.disabled),'remaining individual hose stock must remain available');
view.rcCancel();view=app.resourceControlVals();assert(view.rcTasks[0].ackPending);view.rcTasks[0].issue();assert.equal(app.state.rcTasks.at(-1).status,'Sent');view.rcTasks[0].accept();view=app.resourceControlVals();assert(view.rcTasks[0].issuePending);view.rcTasks[0].complete();assert.equal(app.resourceControlVals().rcTasks.length,1);view.rcTasks[0].issue();view=app.resourceControlVals();view.rcTasks[0].pause();view=app.resourceControlVals();assert(view.rcTasks[0].paused);assert(view.rcTasks[0].completeBlocked);view.rcTasks[0].pause();app.resourceControlVals().rcTasks[0].complete();
view=app.resourceControlVals();assert.equal(view.rcTasks.length,0);assert.equal(view.rcHistory[0].status,'Completed');assert(view.rcHistory[0].returnPending);assert.equal(app.inventoryFor(app.state.fleet.find(u=>u.callsign==='G15P2')).find(e=>e.label==='45 mm delivery hose').awaiting,1);returnAll();
view.rcWaterActions.find(x=>x.label==='Hose attack').pick();view=app.resourceControlVals();assert(!view.rcEquipmentChoices.find(e=>e.label==='45 mm delivery hose').disabled,'completion releases equipment');
view.rcMethods.find(x=>x.label==='Interior attack').pick();view=app.resourceControlVals();view.rcEquipmentChoices.find(e=>e.label==='45 mm delivery hose').pick();view=app.resourceControlVals();view.rcLocations[0].pick();
for(let i=0;i<2;i++){view=app.resourceControlVals();view.rcCrew.find(c=>!c.busy&&!c.selected).pick();}
view=app.resourceControlVals();assert(view.rcBlocked,'interior task requires available BA selection');assert(view.rcEquipmentChoices.find(e=>/BA set/.test(e.label)).disabled,'existing deployed BA remains unavailable');
view.rcCancel();app.setState({detail:'G15P1',rcTab:'Actions'});view=app.resourceControlVals();view.rcActions.find(x=>x.label==='Survey').pick();view=app.resourceControlVals();view.rcMethods[0].pick();view=app.resourceControlVals();view.rcEquipmentChoices.find(e=>e.id==='none').pick();view=app.resourceControlVals();view.rcLocations[0].pick();view=app.resourceControlVals();view.rcCrew.find(c=>!c.busy).pick();view=app.resourceControlVals();assert(!view.rcBlocked);view.rcStart();app.resourceControlVals().rcTasks[0].cancel();assert.equal(app.resourceControlVals().rcHistory[0].status,'Cancelled');
console.log('PASS: task/equipment/location selections, inventory availability, equipment reservation and release, crew gating, pause/completion and cancellation.');

// Individual stock, qualification and atomic issue checks.
app.setState({detail:'G15P2',rcTab:'Water'});view=app.resourceControlVals();view.rcWaterActions.find(x=>x.label==='Hose attack').pick();
view=app.resourceControlVals();view.rcMethods[0].pick();view=app.resourceControlVals();view.rcEquipmentChoices.find(e=>e.label==='45 mm delivery hose').pick();
for(let i=0;i<2;i++)app.resourceControlVals().rcEquipmentChoices.find(e=>e.label==='45 mm delivery hose').increase();
view=app.resourceControlVals();view.rcLocations[0].pick();for(let i=0;i<2;i++){view=app.resourceControlVals();view.rcCrew.find(c=>!c.busy&&!c.selected).pick();}
view=app.resourceControlVals();assert(!view.rcBlocked);view.rcStart();let inv=app.inventoryFor(app.state.fleet.find(u=>u.callsign==='G15P2'));let row=inv.find(e=>e.label==='45 mm delivery hose');assert.equal(row.reserved,3);assert.equal(row.free.length,3);assert.equal(inv.find(e=>e.label==='70 mm delivery hose').free.length,4);
const active=app.state.rcTasks.filter(t=>t.unit==='G15P2'&&t.status==='Sent');assert.equal(new Set(active.flatMap(t=>t.equipmentItemIds)).size,3);
app.resourceControlVals().rcTasks[0].pause();assert.equal(app.inventoryFor(app.state.fleet.find(u=>u.callsign==='G15P2')).find(e=>e.label==='45 mm delivery hose').reserved,3);
app.resourceControlVals().rcTasks[0].cancel();assert.equal(app.inventoryFor(app.state.fleet.find(u=>u.callsign==='G15P2')).find(e=>e.label==='45 mm delivery hose').free.length,6);
// Unknown qualification must not qualify a crew member for a specialist task.
app.setState({detail:'G15P2',rcTab:'Actions'});view=app.resourceControlVals();view.rcActions.find(x=>x.label==='BA search and rescue').pick();view=app.resourceControlVals();assert(view.rcCrew.some(c=>c.qualifications.includes('Not recorded')&&c.busy));
app.setState({detail:'AP101',rcKind:'traffic_mgmt',rcMethod:'Establish control point',rcLocation:'Front',rcEquipmentIds:['none'],rcEquipmentQuantities:{},rcChosen:['F. Graham','G. Richardson']});view=app.resourceControlVals();assert(view.rcBlocked);assert(view.rcCrew.some(c=>c.qualifications.includes('Expired')&&c.busy));
console.log('PASS: exact item reservations, independent hose quantities, release, paused reservations and missing/expired qualifications.');

// Configure a fresh fixture appliance, then verify BA quantity and stale-form revalidation.
vm.runInContext('KIT_IN_USE.G15P2=[]',context);
app.setState({detail:'G15P2',rcTab:'Actions',rcKind:null});view=app.resourceControlVals();view.rcActions.find(x=>x.label==='BA search and rescue').pick();view=app.resourceControlVals();view.rcMethods[0].pick();view=app.resourceControlVals();view.rcEquipmentChoices.find(e=>/BA set/.test(e.label)).pick();view=app.resourceControlVals();view.rcLocations[0].pick();for(let i=0;i<2;i++){view=app.resourceControlVals();view.rcCrew.find(c=>!c.busy&&!c.selected).pick();}
assert(app.resourceControlVals().rcBlocked,'one BA set cannot equip two selected wearers');app.resourceControlVals().rcEquipmentChoices.find(e=>/BA set/.test(e.label)).increase();view=app.resourceControlVals();assert(view.rcBlocked,'BA allocation needs named wearers');view.rcAllocations.forEach((a,i)=>a.change({target:{value:app.state.rcChosen[i]}}));view=app.resourceControlVals();assert(!view.rcBlocked);const staleStart=view.rcStart;
const first=app.state.rcChosen[0];app.setState({rcQualifications:{G15P2:{[first]:{ba:'Expired'}}}});const before=app.state.rcTasks.length;staleStart();assert.equal(app.state.rcTasks.length,before,'issue must revalidate qualification changes');
app.setState({rcQualifications:{},rcEquipmentQuantities:{[app.resourceControlVals().rcEquipmentChoices.find(e=>/BA set/.test(e.label)).id]:5}});assert(app.resourceControlVals().rcBlocked,'quantity exceeding stock must block');
app.setState({rcEquipmentQuantities:{[app.resourceControlVals().rcEquipmentChoices.find(e=>/BA set/.test(e.label)).id]:2}});view=app.resourceControlVals();assert(!view.rcBlocked);view.rcStart();const last=app.state.rcTasks.at(-1);assert.equal(last.equipmentItemIds.length,2);assert.equal(Object.keys(last.qualificationSnapshot).length,2);
console.log('PASS: BA quantity per wearer, stale qualification revalidation, overbooking prevention and assignment snapshots.');

assert.equal(last.status,'Sent');assert.equal(last.equipmentAllocations[0].owner,first);
view=app.resourceControlVals();view.rcTasks[0].accept();view=app.resourceControlVals();view.rcTasks[0].issue();assert.equal(app.state.rcTasks.at(-1).equipmentState,'Issued');
view=app.resourceControlVals();view.rcTasks[0].cancel();assert(app.resourceControlVals().rcHistory[0].returnPending);assert.equal(app.inventoryFor(app.state.fleet.find(u=>u.callsign==='G15P2')).find(e=>e.label==='BA set').free.length,2);
returnAll();assert.equal(app.inventoryFor(app.state.fleet.find(u=>u.callsign==='G15P2')).find(e=>e.label==='BA set').free.length,4);
console.log('PASS: named BA allocation, reserve/issue separation, completion and cancellation return holds.');

// Handover and partial return with unresolved defects.
app.setState({detail:'G15P2',rcTab:'Water'});view=app.resourceControlVals();view.rcWaterActions.find(x=>x.label==='Hose attack').pick();view=app.resourceControlVals();view.rcMethods[0].pick();view=app.resourceControlVals();view.rcEquipmentChoices.find(e=>e.label==='45 mm delivery hose').pick();app.resourceControlVals().rcEquipmentChoices.find(e=>e.label==='45 mm delivery hose').increase();view=app.resourceControlVals();view.rcLocations[0].pick();for(let i=0;i<2;i++){view=app.resourceControlVals();view.rcCrew.find(c=>!c.busy&&!c.selected).pick();}
view=app.resourceControlVals();const originalCrew=app.state.rcChosen[0];view.rcAllocations[0].change({target:{value:originalCrew}});app.resourceControlVals().rcStart();view=app.resourceControlVals();view.rcTasks[0].accept();app.resourceControlVals().rcTasks[0].issue();
view=app.resourceControlVals();let h=view.rcTasks[0].handovers[0];const replacement=h.options.find(o=>!o.disabled).name;h.change({target:{value:replacement}});app.resourceControlVals().rcTasks[0].handovers[0].confirm();let t=app.state.rcTasks.at(-1);assert(!t.crew.includes(originalCrew));assert.equal(t.equipmentAllocations[0].owner,replacement);assert(t.events.some(e=>e.text.includes('Handover')));
view=app.resourceControlVals();view.rcTasks[0].updates.find(u=>u.label==='Access blocked').send();assert(app.state.mdtMessages.at(-1).taskId===t.id);assert(app.state.rcTasks.at(-1).events.some(e=>e.text.includes('Access blocked')));
view.rcTasks[0].complete();view=app.resourceControlVals();const returns=view.rcHistory[0].returnItems;returns[0].change({target:{value:'Returned — serviceable'}});returns[0].confirm();returns[1].change({target:{value:'Damaged'}});returns[1].confirm();let stock=app.inventoryFor(app.state.fleet.find(u=>u.callsign==='G15P2')).find(e=>e.label==='45 mm delivery hose');assert.equal(stock.free.length,5);assert(stock.items.some(i=>i.status==='Damaged'));assert(app.resourceControlVals().rcHistory[0].returnPending);
let damaged=app.resourceControlVals().rcHistory[0].returnItems.find(i=>i.status==='Damaged');damaged.change({target:{value:'Awaiting checks'}});damaged.confirm();damaged=app.resourceControlVals().rcHistory[0].returnItems.find(i=>i.status==='Awaiting checks');damaged.change({target:{value:'Returned — serviceable'}});damaged.confirm();assert.equal(app.inventoryFor(app.state.fleet.find(u=>u.callsign==='G15P2')).find(e=>e.label==='45 mm delivery hose').free.length,6);
console.log('PASS: crew acceptance, atomic handover with equipment ownership, task-linked updates, partial returns and defect resolution.');

// Clearing desk focus must not change incident records or silently select the first job.
const beforeClear=JSON.stringify(context.incidents);
app.clearIncidentSelection();
const empty=app.renderVals();
assert.equal(app.state.selected,'');assert(empty.noSelectedIncident);assert.equal(empty.selectedRef,'');assert.equal(empty.focusUnits.length,0);assert(empty.incidents.every(i=>!i.expanded));assert(empty.availRows.every(r=>r.blocked));assert(!empty.rcOpen);assert.equal(JSON.stringify(context.incidents),beforeClear);
empty.incidents[1].select();assert.equal(app.renderVals().selectedRef,context.incidents[1].ref);
console.log('PASS: clear selection, no fallback incident, blocked mobilisation and reselection.');
