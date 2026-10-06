const assert=require('node:assert/strict'),{create,keys}=require('../dist/shared-history.js');
class Storage{constructor(){this.data=new Map()}getItem(k){return this.data.get(k)||null}setItem(k,v){this.data.set(k,v)}}
const record=n=>({id:'attempt-'+n,module:'listening',testId:1,submittedAt:new Date(1700000000000+n*1000).toISOString(),elapsed:n,answers:{1:'answer'},result:{correct:1,wrong:0,blank:39,rows:Array.from({length:40},(_,i)=>({n:i+1,status:i===0?'correct':'blank',value:i===0?'answer':'',expected:'answer'}))},highlights:{1:{'block-0':[[1,5]]}}});
(async()=>{
 const rows=new Map(),storageA=new Storage(),storageB=new Storage(),config={url:'https://qa.supabase.co',publishableKey:'sb_publishable_qa'};let online=true,posts=0;
 const fetch=async(url,opts)=>{if(!online)throw Error('offline');assert.equal(opts.credentials,'omit');assert.equal(opts.headers.apikey,'sb_publishable_qa');assert.equal(opts.headers.Authorization,undefined);
  if(opts.method==='POST'){const row=JSON.parse(opts.body);if(!rows.has(row.id))rows.set(row.id,{...row,created_at:new Date().toISOString()});posts++;return new Response(null,{status:201})}
  const u=new URL(url),offset=+u.searchParams.get('offset'),limit=+u.searchParams.get('limit');return Response.json([...rows.values()].slice(offset,offset+limit));};
 storageA.setItem(keys.LEGACY,JSON.stringify([{...record(1),username:'old_user'}]));const a=create({config,storage:storageA,fetch});await a.sync();assert.equal(rows.size,1);assert.equal(rows.get('attempt-1').record.username,undefined);assert.equal(a.status().pending,0);
 const b=create({config,storage:storageB,fetch});await b.sync();assert.equal(b.list().length,1);assert.deepEqual(b.list()[0].highlights,record(1).highlights);
 online=false;assert.equal(await a.save(record(2)),false);assert.equal(a.status().pending,1);assert.equal(a.list().length,2);assert.equal(rows.size,1);
 const afterReload=create({config,storage:storageA,fetch});assert.equal(afterReload.status().pending,1);online=true;await Promise.all([afterReload.sync(),afterReload.sync()]);assert.equal(rows.size,2);assert.equal(afterReload.status().pending,0);await b.sync();assert.equal(b.list().length,2);await b.save(record(2));assert.equal(rows.size,2);assert.equal(posts,2);
 // A submission arriving while a history refresh is in flight must join that refresh's upload queue.
 let release;const slow=create({config,storage:new Storage(),fetch:async(...args)=>{if(!args[1].method)await new Promise(r=>release=r);return fetch(...args)}});const refreshing=slow.sync();await new Promise(r=>setTimeout(r,0));const saving=slow.save(record(3));release();await Promise.all([refreshing,saving]);assert.equal(rows.size,3);assert.equal(slow.status().pending,0);
 // Changing from local/unconfigured storage to the configured cloud must upload the cached attempts.
 const migrationStorage=new Storage();migrationStorage.setItem(keys.CACHE,JSON.stringify([record(4)]));const migration=create({config,storage:migrationStorage,fetch});await migration.sync();assert.ok(rows.has('attempt-4'));
 // Old account records copied by the local server also reach the configured cloud.
 const imported=create({config,localAPI:true,storage:new Storage(),fetch:async(url,options)=>url==='/api/history'?Response.json([record(409)]):fetch(url,options)});await imported.sync();assert.ok(rows.has('attempt-409'));
 // History is paginated beyond Supabase's default maximum page size.
 for(let i=5;i<=406;i++)rows.set('attempt-'+i,{id:'attempt-'+i,record:record(i)});await b.sync();assert.equal(b.list().length,407);
 const unavailable=create({storage:new Storage(),fetch});assert.equal(await unavailable.save(record(407)),false);assert.equal(unavailable.status().configured,false);assert.equal(unavailable.status().pending,1);
 const secret=create({config:{url:config.url,publishableKey:'sb_secret_bad'},storage:new Storage(),fetch:()=>{throw Error('must_not_send')}});assert.equal(secret.status().configured,false);assert.match(secret.status().message,/chưa hợp lệ/);
 const noStorage=create({storage:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}},fetch});await noStorage.save(record(408));assert.equal(noStorage.list().length,1);assert.equal(noStorage.status().storageFailed,true);assert.match(noStorage.status().message,/bộ nhớ/);
 console.log('PASS shared history: two isolated clients, legacy migration, offline queue after reload, deduplication, concurrent refresh/submit, backend switch, pagination, highlights, missing config and secret-key rejection.');
})().catch(e=>{console.error(e);process.exitCode=1});
