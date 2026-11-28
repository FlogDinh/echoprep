(function(root){
 'use strict';
 const LEGACY='echoprep:listening-vol9-test1:history:v1',CACHE='echoprep:shared-history:cache:v1',QUEUE='echoprep:shared-history:queue:v1';
 function clean(record){
  if(!record||typeof record.id!=='string'||!record.id||record.id.length>100)return null;
  const module=record.module||'listening',testId=record.testId||1,vol=+(record.vol||9);
  // Listening has Vol 9 (Tests 1–9) and Vol 8 (Tests 1–8); Reading has Vol 9 only. Old records without vol are Vol 9.
  const maxTest=module==='reading'?(vol===9?12:0):vol===9?9:vol===8?8:0;
  if(!['listening','reading'].includes(module)||!Number.isInteger(testId)||testId<1||testId>maxTest||!record.answers||Array.isArray(record.answers)||typeof record.answers!=='object'||!Number.isFinite(record.elapsed)||record.elapsed<0||!Number.isFinite(Date.parse(record.submittedAt))||record.result?.rows?.length!==40)return null;
  const result=record.result;if(!['correct','wrong','blank'].every(k=>Number.isInteger(result[k])&&result[k]>=0&&result[k]<=40)||result.correct+result.wrong+result.blank+(result.unchecked||0)!==40)return null;
  if(!result.rows.every((r,i)=>r.n===i+1&&['correct','wrong','blank','unchecked'].includes(r.status)))return null;
  return JSON.parse(JSON.stringify({id:record.id,module,vol,testId,test:`${module==='reading'?'Reading':'Listening'} - Vol ${vol} · Test ${testId}`,timerMode:record.timerMode==='timed'?'timed':'elapsed',submittedAt:record.submittedAt,elapsed:record.elapsed,answers:record.answers,result,highlights:record.highlights||{}}));
 }
 function merge(...lists){const map=new Map();for(const list of lists)for(const value of list){const r=clean(value);if(r)map.set(r.id,r)}return [...map.values()].sort((a,b)=>Date.parse(a.submittedAt)-Date.parse(b.submittedAt)||a.id.localeCompare(b.id));}
 // remote: {list()→records, save(record)|null, name}. localAPI is the local server (/api/history); app.js passes
 // the Supabase adapter. Without save (teacher view) the store only shows what the remote holds.
 function create({storage,fetch:request=root.fetch?.bind(root),localAPI=false,remote=null,onChange=()=>{}}={}){
  if(!remote&&localAPI)remote={name:'máy chủ local',
   list:async()=>{const r=await request('/api/history',{credentials:'omit',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('request_failed');return r.json()},
   save:async record=>{const r=await request('/api/history',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify(record),signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('request_failed')}};
  function read(k){try{const a=JSON.parse(storage?.getItem(k)||'[]');return Array.isArray(a)?a:[]}catch{return []}}
  let records=merge(read(LEGACY),read(CACHE),read(QUEUE)),failed=false,message='',pending=new Set(),synced=false,syncError=false;
  function persist(){try{if(!storage)throw Error('unavailable');storage.setItem(CACHE,JSON.stringify(records));failed=false;return true}catch{failed=true;return false}}
  function status(){return {configured:!!remote,remote:!!remote,readOnly:!!remote&&!remote.save,synced,syncError,busy:false,pending:pending.size,message:message|| (failed?'Lượt làm đang ở bộ nhớ; hãy thử lưu lại trước khi đóng trang.':'Đã lưu lượt làm vào lịch sử.')}}
  // Pull everything from the remote, then push local attempts it does not have yet (old history, offline saves).
  async function sync(){
   if(!remote)return true;
   try{
    const incoming=merge(await remote.list());const have=new Set(incoming.map(r=>r.id));
    records=merge(records,incoming);
    if(remote.save)for(const r of records)if(!have.has(r.id)){await remote.save(r);pending.delete(r.id)}
    persist();synced=true;syncError=false;onChange();return true;
   }catch{syncError=true;onChange();return false}
  }
  async function save(value){
   const r=clean(value);if(!r)throw Error('invalid_record');records=merge(records,[r]);const saved=persist();
   if(remote?.save){try{await remote.save(r);pending.delete(r.id);message=`Đã lưu lượt làm vào lịch sử (${remote.name}).`;onChange();return true}catch{pending.add(r.id);message=saved?`Đã lưu trong trình duyệt; chưa ghi được lên ${remote.name}, sẽ tự gửi lại khi có mạng.`:'Chưa lưu được lượt này. Hãy thử lưu lại trước khi đóng trang.';onChange();return saved}}
   message=remote?'Chế độ chỉ xem: lượt này chỉ lưu trong trình duyệt này.':saved?'Đã lưu lượt làm vào lịch sử.':'Lượt làm đang ở bộ nhớ; hãy thử lưu lại trước khi đóng trang.';onChange();return saved;
  }
  persist();return {list:()=>records.map(r=>JSON.parse(JSON.stringify(r))),status,sync,save,isPending:id=>pending.has(id)};
 }
 const api={create,clean,merge,keys:{LEGACY,CACHE,QUEUE}};if(typeof module==='object'&&module.exports)module.exports=api;else root.EchoHistory=api;
})(typeof window==='object'?window:globalThis);
