// One shared scenario behind the existing owner-only Sites access gate.
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function sessionApi(request,env){
 if(!['GET','PUT'].includes(request.method))return json({error:'Method not allowed'},405);
 if(request.method==='PUT'){
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin)return json({error:'Origin mismatch'},403);
  if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'JSON required'},415);
 }
 try{
  if(request.method==='GET'){
   const row=await env.DB.prepare('SELECT revision, payload, updated_at FROM mdt_sessions WHERE id = ?').bind('main').first();
   return json(row?{revision:row.revision,data:JSON.parse(row.payload),savedAt:row.updated_at}:{revision:0,data:null});
  }
  const raw=await request.text();if(raw.length>1500000)return json({error:'Scenario too large'},413);
  let body;try{body=JSON.parse(raw);}catch{return json({error:'Invalid JSON'},400);}
  const {revision,data}=body||{};
  if(!Number.isSafeInteger(revision)||revision<0||!data||data.schema!==1||!Array.isArray(data.incidents)||!data.state||!Array.isArray(data.state.fleet)||!Number.isFinite(data.state.t))return json({error:'Invalid scenario'},400);
  const payload=JSON.stringify(data),now=new Date().toISOString();
  const result=revision===0
   ?await env.DB.prepare('INSERT INTO mdt_sessions (id, revision, payload, updated_at) VALUES (?, 1, ?, ?) ON CONFLICT(id) DO NOTHING').bind('main',payload,now).run()
   :await env.DB.prepare('UPDATE mdt_sessions SET revision = revision + 1, payload = ?, updated_at = ? WHERE id = ? AND revision = ?').bind(payload,now,'main',revision).run();
  if(result.meta.changes!==1)return json({error:'A newer session exists. Reload it before editing.'},409);
  return json({revision:revision+1,savedAt:now});
 }catch(error){console.error('MDT persistence unavailable',error?.message);return json({error:'Unable to access saved scenario'},503);}
}
