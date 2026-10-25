const assert=require('node:assert/strict'),{create,keys}=require('../dist/shared-history.js');
class Storage{constructor(){this.data=new Map()}getItem(k){return this.data.get(k)||null}setItem(k,v){this.data.set(k,v)}}
const record=n=>({id:'attempt-'+n,module:'listening',testId:9,submittedAt:new Date(1700000000000+n*1000).toISOString(),elapsed:n,answers:{1:'answer'},result:{correct:1,wrong:0,blank:39,rows:Array.from({length:40},(_,i)=>({n:i+1,status:i===0?'correct':'blank',value:i===0?'answer':'',expected:'answer'}))},highlights:{1:{'block-0':[[1,5]]}}});
(async()=>{
 const storage=new Storage();storage.setItem(keys.LEGACY,JSON.stringify([{...record(1),username:'old-user'}]));storage.setItem(keys.QUEUE,JSON.stringify([record(2)]));const a=create({storage,fetch:()=>{throw Error('No network needed')}});assert.equal(a.list().length,2);assert.equal(a.list()[0].username,undefined);assert.equal(await a.save(record(3)),true);assert.equal(await a.save(record(3)),true);assert.equal(a.list().length,3);assert.deepEqual(a.list()[0].highlights,record(1).highlights);
 const reload=create({storage});assert.equal(reload.list().length,3);assert.equal(reload.status().remote,false);await reload.save({...record(4),module:'reading',testId:12,result:{correct:0,wrong:0,blank:0,unchecked:40,gradedTotal:0,rows:Array.from({length:40},(_,i)=>({n:i+1,status:'unchecked',value:'practice',expected:'Chưa có đáp án nguồn'}))}});assert.equal(reload.list().length,4);assert.equal(reload.list().at(-1).result.wrong,0);
 const blocked=create({storage:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}}});assert.equal(await blocked.save(record(5)),false);assert.equal(blocked.list().length,1);assert.match(blocked.status().message,/bộ nhớ/);
 // A slow history refresh must not replace a submission saved while its JSON is loading.
 let jsonStarted,releaseJson;
 const parsing=new Promise(resolve=>{jsonStarted=resolve});
 const concurrent=create({storage:new Storage(),localAPI:true,fetch:async(_url,options)=>options.method==='POST'?{ok:true}:{ok:true,json:()=>{jsonStarted();return new Promise(resolve=>{releaseJson=resolve})}}});
 const refreshing=concurrent.sync();await parsing;await concurrent.save(record(6));releaseJson([]);await refreshing;
 assert.deepEqual(concurrent.list().map(r=>r.id),['attempt-6']);
 console.log('PASS attempt history: no account/device/network dependency, old records and highlights retained, duplicate ID protection, fresh separate attempts and ungraded Reading 12.');
 console.log('PASS concurrent history: a stale refresh preserves submissions saved while the response is loading.');
})().catch(e=>{console.error(e);process.exitCode=1});
