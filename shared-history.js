(function(root){
 'use strict';
 const LEGACY='echoprep:listening-vol9-test1:history:v1',CACHE='echoprep:shared-history:cache:v1',QUEUE='echoprep:shared-history:queue:v1';
 function clean(record){
  if(!record||typeof record.id!=='string'||!record.id||record.id.length>100)return null;
  const module=record.module||'listening',testId=record.testId||1;
  if(!['listening','reading'].includes(module)||!(module==='reading'?[1]:[1,2]).includes(testId)||!record.answers||Array.isArray(record.answers)||typeof record.answers!=='object'||!Number.isFinite(record.elapsed)||record.elapsed<0||!Number.isFinite(Date.parse(record.submittedAt))||record.result?.rows?.length!==40)return null;
  const result=record.result;if(!['correct','wrong','blank'].every(k=>Number.isInteger(result[k])&&result[k]>=0&&result[k]<=40)||result.correct+result.wrong+result.blank!==40)return null;
  if(!result.rows.every((r,i)=>r.n===i+1&&['correct','wrong','blank'].includes(r.status)))return null;
  const safe={id:record.id,module,vol:9,testId,test:`${module==='reading'?'Reading':'Listening'} - Vol 9 · Test ${testId}`,timerMode:record.timerMode==='timed'?'timed':'elapsed',submittedAt:record.submittedAt,elapsed:record.elapsed,answers:record.answers,result,highlights:record.highlights||{}};
  const serialized=JSON.stringify(safe);return new TextEncoder().encode(serialized).length<=300000?JSON.parse(serialized):null;
 }
 function merge(...lists){const map=new Map();for(const list of lists)for(const value of list){const r=clean(value);if(r)map.set(r.id,r)}return [...map.values()].sort((a,b)=>Date.parse(a.submittedAt)-Date.parse(b.submittedAt)||a.id.localeCompare(b.id));}
 function create({config={},storage,fetch:request=root.fetch?.bind(root),localAPI=false,onChange=()=>{}}={}){
  let storageFailed=false,cache=[],queue=[],operation=null,message='',busy=false,localImported=false;
  const ackKey=CACHE+':ack:'+(config.url|| (localAPI?'local':'unconfigured'));let acknowledged=new Set();
  function read(key){try{const a=JSON.parse(storage?.getItem(key)||'[]');return Array.isArray(a)?a:[]}catch{return []}}
  function write(key,value){try{if(!storage)throw Error('no_storage');storage.setItem(key,JSON.stringify(value));}catch{storageFailed=true}}
  cache=merge(read(CACHE));acknowledged=new Set(read(ackKey).filter(id=>typeof id==='string'));queue=merge(cache,read(LEGACY),read(QUEUE)).filter(r=>!acknowledged.has(r.id));
  let endpoint=null,headers={};
  if(config.url||config.publishableKey){
   try{const u=new URL(config.url);if(u.protocol!=='https:'||u.pathname!=='/'||u.search||u.hash||u.username||u.password)throw Error('invalid_url');
    const key=config.publishableKey;if(typeof key!=='string'||!key)throw Error('missing_key');
    if(key.startsWith('sb_secret_'))throw Error('secret_key');
    if(key.startsWith('eyJ')){const payload=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));if(payload.role!=='anon')throw Error('secret_key');headers.Authorization='Bearer '+key;}else if(!key.startsWith('sb_publishable_'))throw Error('invalid_key');
    endpoint=u.origin+'/rest/v1/echoprep_attempts';headers.apikey=key;
   }catch{message='Cấu hình kho lịch sử chưa hợp lệ. Chỉ dùng Project URL và Publishable/anon key.'}
  }else if(localAPI){endpoint='/api/history';}
  const remote=!!endpoint&&!localAPI||!!endpoint&&!!config.url;
  const configured=!!endpoint;
  function list(){return merge(cache,queue)}
  function status(){return {configured,remote,busy,pending:queue.length,storageFailed,message:message||(!configured?(storageFailed?'Chưa kết nối kho chung và trình duyệt không cho lưu. Lượt đang ở bộ nhớ; đừng đóng trang.':'Chưa kết nối kho lịch sử chung. Các lượt mới tạm lưu trên trình duyệt này.'):queue.length?'Có '+queue.length+' lượt chờ đồng bộ.':remote?'Lịch sử dùng chung · Đã đồng bộ':'Đã lưu trên máy chủ local · Chưa đồng bộ qua Internet')}}
  function notify(){onChange(status())}
  function persist(){write(CACHE,cache);write(QUEUE,queue);write(ackKey,[...acknowledged])}
  async function json(url,options={}){const response=await request(url,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(15000),credentials:'omit'});if(!response.ok)throw Error('history_http_'+response.status);if(response.status===204||options.method==='POST')return null;return response.json()}
  async function pull(){
   if(!remote)return merge(await json(endpoint));
   let all=[],offset=0;while(true){const page=await json(endpoint+'?select=id,record&order=created_at.asc,id.asc&limit=200&offset='+offset);if(!Array.isArray(page))throw Error('invalid_history');all.push(...page.map(row=>row.record));if(page.length<200)break;offset+=page.length;}return merge(all);
  }
  async function sync(){
   if(operation)return operation;
   operation=Promise.resolve().then(async()=>{busy=true;notify();try{
    if(!configured){persist();return false}
    if(remote&&localAPI&&!localImported){const response=await request('/api/history',{credentials:'omit',signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('local_migration_failed');const existing=merge(await response.json());queue=merge(queue,existing).filter(r=>!acknowledged.has(r.id));localImported=true;persist();}
    const fromServer=await pull();cache=merge(cache,fromServer);const known=new Set(fromServer.map(r=>r.id));known.forEach(id=>acknowledged.add(id));queue=queue.filter(r=>!known.has(r.id));persist();
    while(queue.length){const record=queue[0];await json(remote?endpoint+'?on_conflict=id':endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(remote?{Prefer:'resolution=ignore-duplicates,return=minimal'}:{})},body:JSON.stringify(remote?{id:record.id,record}:record)});cache=merge(cache,[record]);acknowledged.add(record.id);queue=queue.filter(r=>r.id!==record.id);persist();}
    message=remote?'Lịch sử dùng chung · Đã đồng bộ':'Đã lưu trên máy chủ local · Chưa đồng bộ qua Internet';return true;
   }catch{message='Chưa kết nối được kho lịch sử. '+(storageFailed?'Lượt chưa đồng bộ đang ở bộ nhớ; hãy thử lại trước khi đóng trang.':'Đáp án vẫn lưu trên máy này; sẽ thử đồng bộ lại khi có mạng.');return false;}finally{busy=false;operation=null;notify();}});
   const current=operation;await current;return configured&&queue.length===0&&!message.startsWith('Chưa kết nối được');
  }
  async function save(value){const record=clean(value);if(!record)throw Error('invalid_record');if(!cache.some(r=>r.id===record.id)&&!queue.some(r=>r.id===record.id))queue.push(record);persist();notify();await sync();return !queue.some(r=>r.id===record.id)&&configured;}
  persist();return {list,status,sync,save,isPending:id=>queue.some(r=>r.id===id)};
 }
 const api={create,clean,merge,keys:{LEGACY,CACHE,QUEUE}};if(typeof module==='object'&&module.exports)module.exports=api;else root.EchoHistory=api;
})(typeof window==='object'?window:globalThis);
