import assert from 'node:assert/strict';import {mkdtemp,writeFile} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {randomBytes,scrypt} from 'node:crypto';import {promisify} from 'node:util';import {spawn} from 'node:child_process';
const directory=await mkdtemp(path.join(os.tmpdir(),'echoprep-auth-')),origin='http://127.0.0.1:8081',accounts=[];
for(const username of ['qa_alpha','qa_beta']){const salt=randomBytes(16).toString('hex');accounts.push({username,salt,hash:(await promisify(scrypt)('qa-password',salt,64)).toString('hex')});}
await writeFile(path.join(directory,'accounts.json'),JSON.stringify(accounts),{mode:0o600});
const server=spawn(process.execPath,['server/server.mjs'],{env:{...process.env,PORT:'8081',ECHOPREP_DATA_DIR:directory},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('exit',code=>reject(Error('Server exited '+code)));});
try{
 const request=(route,opts={})=>fetch(origin+route,{redirect:'manual',...opts});
 assert.equal((await request('/')).status,302);assert.equal((await request('/app.js')).status,302);assert.equal((await request('/api/history')).status,401);
 assert.equal((await request('/api/login',{method:'POST',headers:{Origin:'https://another.example'},body:'{}'})).status,403);
 const login=async(username,password='qa-password')=>request('/api/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({username,password})});
 assert.equal((await login('qa_alpha','wrong')).status,401);assert.equal((await login('not_exists')).status,401);
 const a=await login('qa_alpha');assert.equal(a.status,200);const cookie=a.headers.get('set-cookie').split(';')[0];assert.ok(a.headers.get('set-cookie').includes('HttpOnly'));assert.ok(a.headers.get('set-cookie').includes('SameSite=Strict'));
 const index=await request('/',{headers:{Cookie:cookie}});assert.equal(index.status,200);assert.ok((await index.text()).includes('window.ECHO_AUTH=true'));
 const asset=await request('/app.js',{headers:{Cookie:cookie}});assert.ok((await asset.text()).startsWith('const $='));
 const record={id:'one',testId:2,test:'Test 2',username:'qa_beta',submittedAt:new Date().toISOString(),elapsed:7,answers:{1:'month'},result:{correct:1,wrong:0,blank:39,rows:Array.from({length:40},(_,i)=>({n:i+1,status:'blank'}))}};
 const put=()=>request('/api/history',{method:'POST',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(record)});
 assert.equal((await put()).status,201);await put();let rows=await (await request('/api/history',{headers:{Cookie:cookie}})).json();assert.equal(rows.length,1);assert.equal(rows[0].username,undefined);
 const b=await login('qa_beta');const cookieB=b.headers.get('set-cookie').split(';')[0];assert.equal((await (await request('/api/history',{headers:{Cookie:cookieB}})).json()).length,0);
 record.id='two';await put();assert.equal((await (await request('/api/history',{headers:{Cookie:cookie}})).json()).length,2);
 await request('/api/logout',{method:'POST',headers:{Cookie:cookie,Origin:origin}});assert.equal((await request('/api/history',{headers:{Cookie:cookie}})).status,401);
 const again=await login('qa_alpha');const cookieAgain=again.headers.get('set-cookie').split(';')[0];assert.equal((await (await request('/api/history',{headers:{Cookie:cookieAgain}})).json()).length,2);
 console.log('PASS: protected assets, wrong credentials, CSRF rejection, secure session attributes, per-account history isolation, ownership spoof rejection, idempotent save, separate attempts, logout and persistent history.');
}finally{server.kill('SIGTERM');}
