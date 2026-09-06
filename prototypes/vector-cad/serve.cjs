const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 let DatabaseSync;try{({DatabaseSync}=await import('node:sqlite'));}catch{console.error('VECTOR needs Node.js 22.13 or newer. Install Node.js, then run this command again.');process.exitCode=1;return;}
 const {sessionApi}=await import('./worker/session.mjs');
 const root=path.join(__dirname,'dist'),store=process.env.VECTOR_DATA_DIR||path.join(__dirname,'.local');fs.mkdirSync(store,{recursive:true});
 const db=new DatabaseSync(path.join(store,'session.sqlite'));db.exec('PRAGMA journal_mode = WAL');
 // Apply the committed migration to a new local database, once.
 if(!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='mdt_sessions'").get())db.exec(fs.readFileSync(path.join(__dirname,'drizzle/0000_true_hitman.sql'),'utf8'));
 const DB={prepare(sql){return{bind(...args){return{async first(){return db.prepare(sql).get(...args)||null;},async run(){const result=db.prepare(sql).run(...args);return{meta:{changes:Number(result.changes)}};}};}};}};
 const port=Number(process.env.PORT||8765),host=process.env.HOST||'127.0.0.1';
 http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://'+req.headers.host);
   if(url.pathname==='/api/session'){
    const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>1500000){res.writeHead(413);res.end('Scenario too large');return;}chunks.push(chunk);}
    const response=await sessionApi(new Request(url,{method:req.method,headers:req.headers,...(req.method==='PUT'?{body:Buffer.concat(chunks)}:{})}),{DB});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());return;
   }
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
   const name=decodeURIComponent(url.pathname),file=path.resolve(root,'.'+(name==='/'?'/index.html':name)),rel=path.relative(root,file);
   if(rel.startsWith('..')||path.isAbsolute(rel)||rel.split(path.sep).some(p=>p.startsWith('.')||p==='server')){res.writeHead(403);res.end();return;}
   fs.readFile(file,(error,body)=>{if(error){res.writeHead(404);res.end('Not found');return;}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-cache');res.end(req.method==='HEAD'?undefined:body);});
  }catch(error){console.error(error.message);res.writeHead(500);res.end('Unable to serve request');}
 }).listen(port,host,()=>console.log(`VECTOR ready: http://${host}:${port}/\nKeep this terminal open. Your PC session is saved in prototypes/vector-cad/.local/.`));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
