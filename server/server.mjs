import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes,scrypt as rawScrypt,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const scrypt=promisify(rawScrypt),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const privateDir=process.env.ECHOPREP_DATA_DIR||path.join(root,'.private');await mkdir(privateDir,{recursive:true,mode:0o700});
const accounts=JSON.parse(await readFile(path.join(privateDir,'accounts.json'),'utf8'));
const db=new DatabaseSync(path.join(privateDir,'history.sqlite'));db.exec(`PRAGMA journal_mode=WAL;CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,username TEXT NOT NULL,expires INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS attempts(username TEXT NOT NULL,id TEXT NOT NULL,record TEXT NOT NULL,PRIMARY KEY(username,id));`);
const digest=s=>createHash('sha256').update(s).digest('hex'),host=process.env.HOST||'127.0.0.1',port=Number(process.env.PORT||8080),origin=process.env.PUBLIC_ORIGIN||`http://${host}:${port}`,secure=origin.startsWith('https:');
const failCounts=new Map();
const send=(res,status,data,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(typeof data==='string'||Buffer.isBuffer(data)?data:JSON.stringify(data));};
async function body(req){let value='';for await(const chunk of req){value+=chunk;if(Buffer.byteLength(value)>300000)throw Error('too_large');}return JSON.parse(value||'{}');}
function user(req){const token=req.headers.cookie?.match(/(?:^|;\s*)echo_session=([a-f0-9]{64})(?:;|$)/)?.[1];if(!token)return null;const row=db.prepare('SELECT username FROM sessions WHERE token_hash=? AND expires>?').get(digest(token),Date.now());return row?.username||null;}
const loginHTML=`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Đăng nhập · EchoPrep</title><style>body{font:16px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f2f5f9;color:#1e293b;margin:0;display:grid;place-items:center;min-height:100dvh}main{box-sizing:border-box;background:white;border:1px solid #dce3ed;border-radius:16px;padding:36px;width:min(420px,calc(100% - 32px))}h1{color:#1d4ed8;margin:0 0 10px}h2{font-size:21px}label{display:block;margin:20px 0 8px}input,button{box-sizing:border-box;width:100%;font:inherit;border:1px solid #cbd5e1;padding:12px;border-radius:8px}button{background:#1d4ed8;color:white;margin-top:24px;cursor:pointer}#error{color:#b91c1c;min-height:22px;line-height:1.5}</style><main><h1>EchoPrep</h1><h2>Đăng nhập để luyện nghe</h2><form id="login"><label for="username">Tên đăng nhập</label><input id="username" autocomplete="username" required><label for="password">Mật khẩu</label><input id="password" type="password" autocomplete="current-password" required><button id="submit">Đăng nhập</button><p id="error" role="alert"></p></form></main><script>document.getElementById('login').onsubmit=async e=>{e.preventDefault();const button=document.getElementById('submit');button.disabled=true;document.getElementById('error').textContent='';try{const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:document.getElementById('username').value,password:document.getElementById('password').value})});if(r.ok)location.assign('/');else document.getElementById('error').textContent=r.status===429?'Bạn thử đăng nhập quá nhiều lần. Hãy thử lại sau 15 phút.':'Tên đăng nhập hoặc mật khẩu không đúng.'}catch{document.getElementById('error').textContent='Không kết nối được. Hãy thử lại.'}finally{button.disabled=false;}};</script></html>`;
http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,origin);const pathname=url.pathname;
 if(req.method==='POST'&&req.headers.origin!==origin)return send(res,403,{error:'origin_rejected'});
 if(pathname==='/login'&&req.method==='GET'){return send(res,200,loginHTML,{'Content-Type':'text/html; charset=utf-8'});}
 if(pathname==='/api/login'&&req.method==='POST'){
  const ip=req.socket.remoteAddress;const failures=failCounts.get(ip);if(failures&&failures.count>=10&&failures.until>Date.now())return send(res,429,{error:'rate_limited'});
  const data=await body(req);const account=accounts.find(a=>a.username===data.username);const computed=await scrypt(String(data.password||'').slice(0,1024),account?.salt||'dummy-account-salt',64);const expected=account?Buffer.from(account.hash,'hex'):Buffer.alloc(64);
  if(!account||!timingSafeEqual(computed,expected)){const previous=failures?.until>Date.now()?failures:{count:0,until:Date.now()+900000};previous.count++;failCounts.set(ip,previous);return send(res,401,{error:'invalid_credentials'});}
  failCounts.delete(ip);db.prepare('DELETE FROM sessions WHERE expires<=?').run(Date.now());const token=randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(digest(token),account.username,Date.now()+7*86400000);
  return send(res,200,{username:account.username},{'Set-Cookie':`echo_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${secure?'; Secure':''}`});
 }
 const username=user(req);
 if(!username){if(pathname.startsWith('/api/'))return send(res,401,{error:'login_required'});return send(res,302,'',{'Location':'/login'});}
 if(pathname==='/api/session')return send(res,200,{username});
 if(pathname==='/api/logout'&&req.method==='POST'){const token=req.headers.cookie?.match(/echo_session=([a-f0-9]{64})/)?.[1];if(token)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(digest(token));return send(res,200,{ok:true},{'Set-Cookie':'echo_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});}
 if(pathname==='/api/history'&&req.method==='GET')return send(res,200,db.prepare('SELECT record FROM attempts WHERE username=? ORDER BY rowid').all(username).map(r=>JSON.parse(r.record)));
 if(pathname==='/api/history'&&req.method==='POST'){
  const r=await body(req);if(typeof r.id!=='string'||r.id.length>100||!((r.module||'listening')==='reading'?[1]:[1,2]).includes(r.testId||1)||!['listening','reading'].includes(r.module||'listening')||!r.answers||r.result?.rows?.length!==40||!Number.isFinite(r.elapsed)||r.elapsed<0||!Number.isFinite(Date.parse(r.submittedAt)))return send(res,400,{error:'invalid_record'});
  // Account ownership is derived exclusively from the session, never from the request body.
  delete r.username;delete r.account;db.prepare('INSERT OR IGNORE INTO attempts VALUES(?,?,?)').run(username,r.id,JSON.stringify(r));return send(res,201,{ok:true});
 }
 if(req.method!=='GET')return send(res,405,{error:'method_not_allowed'});
 const base=path.join(root,'dist'),file=path.resolve(base,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));if(!file.startsWith(base+path.sep))return send(res,404,{error:'not_found'});
 let content=await readFile(file);const ext=path.extname(file);if(ext==='.html')content=content.toString().replace('<head>','<head><script>window.ECHO_AUTH=true;</script>');
 return send(res,200,content,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png'}[ext]||'application/octet-stream'),'Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"});
}catch(e){send(res,e.code==='ENOENT'?404:e.message==='too_large'?413:400,{error:'request_failed'});}}).listen(port,host,()=>console.log(`EchoPrep server ready at ${origin}`));
