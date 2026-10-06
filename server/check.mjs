import assert from 'node:assert/strict';import {mkdtemp} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {DatabaseSync} from 'node:sqlite';import {spawn} from 'node:child_process';
const directory=await mkdtemp(path.join(os.tmpdir(),'echoprep-shared-')),origin='http://127.0.0.1:8081';
const record={id:'old-account-attempt',testId:2,submittedAt:new Date().toISOString(),elapsed:7,answers:{1:'month'},result:{correct:1,wrong:0,blank:39,rows:Array.from({length:40},(_,i)=>({n:i+1,status:i===0?'correct':'blank'}))}};
const oldDB=new DatabaseSync(path.join(directory,'history.sqlite'));oldDB.exec('CREATE TABLE attempts(username TEXT,id TEXT,record TEXT,PRIMARY KEY(username,id));');oldDB.prepare('INSERT INTO attempts VALUES(?,?,?)').run('old_user',record.id,JSON.stringify({...record,username:'old_user'}));oldDB.close();
const server=spawn(process.execPath,['server/server.mjs'],{env:{...process.env,PORT:'8081',ECHOPREP_DATA_DIR:directory},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('exit',code=>reject(Error('Server exited '+code)));});
try{
 const request=(route,opts={})=>fetch(origin+route,{redirect:'manual',...opts});
 assert.equal((await request('/')).status,200);assert.equal((await request('/app.js')).status,200);assert.equal((await request('/login')).status,302);assert.equal((await request('/api/login',{method:'POST',headers:{Origin:origin}})).status,404);
 const html=await (await request('/')).text();assert.ok(html.includes('window.ECHO_LOCAL_HISTORY=true'));assert.ok(!html.includes('ECHO_AUTH'));
 let rows=await (await request('/api/history')).json();assert.equal(rows.length,1);assert.equal(rows[0].id,record.id);assert.equal(rows[0].username,undefined);
 const post=value=>request('/api/history',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(value)});
 assert.equal((await post({...record,id:'new-attempt',username:'spoofed'})).status,201);await post({...record,id:'new-attempt',elapsed:999});rows=await (await request('/api/history')).json();assert.equal(rows.length,2);assert.equal(rows.find(r=>r.id==='new-attempt').elapsed,7);
 assert.equal((await request('/api/history',{headers:{Cookie:'anything=irrelevant'}})).status,200);assert.equal((await request('/api/history',{method:'DELETE',headers:{Origin:origin}})).status,404);
 assert.equal((await post({...record,id:'invalid',testId:3})).status,400);assert.equal((await request('/api/history',{method:'POST',headers:{Origin:'https://another.example'},body:'{}'})).status,403);
 const db=new DatabaseSync(path.join(directory,'history.sqlite'),{readOnly:true});assert.equal(db.prepare('SELECT COUNT(*) AS n FROM attempts').get().n,1);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM shared_attempts').get().n,2);db.close();
 console.log('PASS: no login/cookies required, shared read/append history, original account history preserved/migrated, sanitized records, immutable duplicate IDs, validation and Origin check.');
}finally{server.kill('SIGTERM');}
