import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {readFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),require=createRequire(import.meta.url),{clean}=require('../dist/shared-history.js');
const dataDir=process.env.ECHOPREP_DATA_DIR||path.join(root,'.private');await mkdir(dataDir,{recursive:true,mode:0o700});
const db=new DatabaseSync(path.join(dataDir,'history.sqlite'));db.exec('PRAGMA journal_mode=WAL;CREATE TABLE IF NOT EXISTS shared_attempts(id TEXT PRIMARY KEY,record TEXT NOT NULL);');
// Keep the old account tables intact. Copy valid attempts into the shared local history once.
if(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='attempts'").get()){
 for(const row of db.prepare('SELECT record FROM attempts ORDER BY rowid').all()){try{const record=clean(JSON.parse(row.record));if(record)db.prepare('INSERT OR IGNORE INTO shared_attempts VALUES(?,?)').run(record.id,JSON.stringify(record));}catch{}}
}
const host=process.env.HOST||'127.0.0.1',port=Number(process.env.PORT||8080),origin=process.env.PUBLIC_ORIGIN||`http://${host}:${port}`;
const send=(res,status,data,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(typeof data==='string'||Buffer.isBuffer(data)?data:JSON.stringify(data));};
async function body(req){let value='';for await(const chunk of req){value+=chunk;if(Buffer.byteLength(value)>300000)throw Error('too_large');}return JSON.parse(value||'{}');}
http.createServer(async(req,res)=>{try{
 const pathname=new URL(req.url,origin).pathname;
 if(req.method==='POST'&&req.headers.origin!==origin)return send(res,403,{error:'origin_rejected'});
 if(pathname==='/login')return send(res,302,'',{Location:'/'});
 if(pathname==='/api/history'&&req.method==='GET')return send(res,200,db.prepare('SELECT record FROM shared_attempts ORDER BY rowid').all().map(r=>JSON.parse(r.record)));
 if(pathname==='/api/history'&&req.method==='POST'){
  const record=clean(await body(req));if(!record)return send(res,400,{error:'invalid_record'});
  db.prepare('INSERT OR IGNORE INTO shared_attempts VALUES(?,?)').run(record.id,JSON.stringify(record));return send(res,201,{ok:true});
 }
 if(pathname.startsWith('/api/'))return send(res,404,{error:'not_found'});
 if(req.method!=='GET')return send(res,405,{error:'method_not_allowed'});
 const base=path.join(root,'dist'),file=path.resolve(base,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));if(!file.startsWith(base+path.sep))return send(res,404,{error:'not_found'});
 let content=await readFile(file);const ext=path.extname(file);if(ext==='.html')content=content.toString().replace('<head>','<head><script>window.ECHO_LOCAL_HISTORY=true;</script>');
 return send(res,200,content,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png'}[ext]||'application/octet-stream'),'Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"});
}catch(e){send(res,e.code==='ENOENT'?404:e.message==='too_large'?413:400,{error:'request_failed'});}}).listen(port,host,()=>console.log(`EchoPrep server ready at ${origin}`));
