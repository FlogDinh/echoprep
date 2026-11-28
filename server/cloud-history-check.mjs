// Online history end to end against the fake Supabase RPCs (server/fake-cloud.mjs):
// student link uploads old local attempts and saves new ones; teacher link is read-only and shows every attempt;
// a wrong key is forgotten. Run: node server/cloud-history-check.mjs (needs Chrome on macOS).
import assert from 'node:assert/strict';import {mkdtemp} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {spawn} from 'node:child_process';
import {FAKE_KEYS} from './fake-cloud.mjs';
const dir=await mkdtemp(path.join(os.tmpdir(),'echoprep-cloud-'));
const server=spawn(process.execPath,['server/server.mjs'],{env:{...process.env,PORT:'8083',ECHOPREP_DATA_DIR:dir,ECHOPREP_FAKE_CLOUD:'1'},stdio:['ignore','pipe','inherit']});
await new Promise((r,j)=>{server.stdout.once('data',r);server.once('exit',()=>j(Error('Server did not start')))});
const chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless','--disable-gpu','--no-first-run','--autoplay-policy=no-user-gesture-required','--remote-debugging-port=9225','--user-data-dir='+path.join(dir,'browser')],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const sockets=[];
async function page(url){
 const t=await (await fetch('http://127.0.0.1:9225/json/new?'+encodeURIComponent(url),{method:'PUT'})).json();const ws=new WebSocket(t.webSocketDebuggerUrl);sockets.push(ws);
 await new Promise(r=>ws.addEventListener('open',r,{once:true}));let seq=0;const pend=new Map();
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){const p=pend.get(m.id);pend.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}});
 const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pend.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
 const wait=async expression=>{for(let i=0;i<200;i++){try{if(await evaluate(expression))return}catch{}await sleep(100)}throw Error('Timed out: '+expression)};
 const open=async u=>{await call('Page.navigate',{url:u});await sleep(300);await wait("typeof startTest==='function'&&document.readyState==='complete'")};
 await wait("typeof startTest==='function'&&document.readyState==='complete'");return {evaluate,wait,open};
}
const submit=async(p,selection)=>{await p.evaluate(`clearAttempt();startTest(${JSON.stringify(selection)});$('begin-attempt').click();answers=Object.fromEntries(Object.entries(TEST.answers).slice(0,30).map(([n,v])=>[n,v[0].split('/')[0]]));`);await p.evaluate('(async()=>{await finishAttempt()})()');};
const base='http://127.0.0.1:8083/';
try{
 for(let i=0;i<50;i++){try{await fetch('http://127.0.0.1:9225/json/version');break}catch{await sleep(100)}}
 // 1. An attempt made before going online stays in this browser.
 const student=await page(base);
 await submit(student,{module:'listening',vol:8,id:1});
 assert.equal(await student.evaluate('getHistory().length'),1);
 assert.equal(await student.evaluate('historyStore.status().remote&&historyStore.status().readOnly'),false);
 // 2. The student link stores the key, hides it from the address bar and uploads the old attempt.
 await student.open(base+'?from=link#connect='+FAKE_KEYS.student);
 await student.wait('historyStore.status().synced');
 assert.equal(await student.evaluate('location.hash'),'');
 assert.equal(await student.evaluate("localStorage.getItem('echoprep:cloud-key:v1')"),FAKE_KEYS.student);
 // 3. New attempts are saved online right away; reopening the plain site keeps the connection.
 await student.open(base+'?again=1');await student.wait('historyStore.status().synced');
 await submit(student,{module:'reading',vol:9,id:1});
 assert.match(await student.evaluate('storageNotice'),/lịch sử online/);
 await student.evaluate("activeModule='listening';activeVol=8;showHistory()");
 assert.match(await student.evaluate("document.querySelector('.cloud-status').textContent"),/đã bật/);
 // 4. The teacher link shows both attempts, read-only, with the full review.
 const teacher=await page(base+'?teacher=1#teacher='+FAKE_KEYS.teacher);
 await teacher.wait("historyStore.status().synced&&document.querySelectorAll('[data-history-view]').length===2");
 assert.equal(await teacher.evaluate("document.body.classList.contains('teacher-mode')&&!$('history').hidden"),true);
 assert.match(await teacher.evaluate("$('history').textContent"),/Lịch sử làm bài của học viên[\s\S]*Reading - Vol 9 · Test 1[\s\S]*Listening - Vol 8 · Test 1/);
 assert.equal(await teacher.evaluate("[...document.querySelectorAll('[data-history-retry],#history-back')].every(b=>getComputedStyle(b).display==='none')"),true);
 assert.equal(await teacher.evaluate("historyStore.status().readOnly"),true);
 await teacher.evaluate("[...document.querySelectorAll('[data-history-view]')].at(-1).click()");
 assert.equal(await teacher.evaluate("[submitted,activeModule,activeVol,activeTest,result.correct].join()"),'true,listening,8,1,30');
 // A teacher's own test is never written to the student's online history.
 await submit(teacher,{module:'listening',vol:8,id:2});
 assert.equal((await (await fetch(base+'rest/v1/rpc/echoprep_list',{method:'POST',headers:{apikey:'fake-anon-key',Authorization:'Bearer fake-anon-key','Content-Type':'application/json'},body:JSON.stringify({p_key:FAKE_KEYS.student})})).json()).length,2);
 // 5. A wrong student link is forgotten instead of failing every save.
 await student.open(base+'?bad=1#connect='+'x'.repeat(32));
 await student.wait("document.readyState==='complete'&&localStorage.getItem('echoprep:cloud-key:v1')===null");
 const wrong=await page(base+'?badteacher=1#teacher='+'y'.repeat(32));
 await wrong.wait("$('history').textContent.includes('không còn hiệu lực')");
 console.log('PASS CLOUD HISTORY: student link uploads old attempts and saves new ones online, key hidden from the address bar, teacher link read-only with all attempts and full review, teacher tests never saved, wrong links rejected.');
}finally{for(const ws of sockets)ws.close();chrome.kill();server.kill();}
