(function(root){
 'use strict';
 const LEGACY='echoprep:listening-vol9-test1:history:v1',CACHE='echoprep:shared-history:cache:v1',QUEUE='echoprep:shared-history:queue:v1';
 function clean(record){
  if(!record||typeof record.id!=='string'||!record.id||record.id.length>100)return null;
  const module=record.module||'listening',testId=record.testId||1;
  if(!['listening','reading'].includes(module)||!Number.isInteger(testId)||testId<1||testId>(module==='reading'?12:9)||!record.answers||Array.isArray(record.answers)||typeof record.answers!=='object'||!Number.isFinite(record.elapsed)||record.elapsed<0||!Number.isFinite(Date.parse(record.submittedAt))||record.result?.rows?.length!==40)return null;
  const result=record.result;if(!['correct','wrong','blank'].every(k=>Number.isInteger(result[k])&&result[k]>=0&&result[k]<=40)||result.correct+result.wrong+result.blank+(result.unchecked||0)!==40)return null;
  if(!result.rows.every((r,i)=>r.n===i+1&&['correct','wrong','blank','unchecked'].includes(r.status)))return null;
  return JSON.parse(JSON.stringify({id:record.id,module,vol:9,testId,test:`${module==='reading'?'Reading':'Listening'} - Vol 9 · Test ${testId}`,timerMode:record.timerMode==='timed'?'timed':'elapsed',submittedAt:record.submittedAt,elapsed:record.elapsed,answers:record.answers,result,highlights:record.highlights||{}}));
 }
 function merge(...lists){const map=new Map();for(const list of lists)for(const value of list){const r=clean(value);if(r)map.set(r.id,r)}return [...map.values()].sort((a,b)=>Date.parse(a.submittedAt)-Date.parse(b.submittedAt)||a.id.localeCompare(b.id));}
 function create({storage,fetch:request=root.fetch?.bind(root),localAPI=false,onChange=()=>{}}={}){
  function read(k){try{const a=JSON.parse(storage?.getItem(k)||'[]');return Array.isArray(a)?a:[]}catch{return []}}
  let records=merge(read(LEGACY),read(CACHE),read(QUEUE)),failed=false,message='',pending=new Set();
  function persist(){try{if(!storage)throw Error('unavailable');storage.setItem(CACHE,JSON.stringify(records));failed=false;return true}catch{failed=true;return false}}
  function status(){return {configured:localAPI,remote:false,busy:false,pending:pending.size,message:message|| (failed?'Lượt làm đang ở bộ nhớ; hãy thử lưu lại trước khi đóng trang.':'Đã lưu lượt làm vào lịch sử.')}}
  async function sync(){if(!localAPI)return true;try{const r=await request('/api/history',{credentials:'omit',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('request_failed');const incoming=await r.json();records=merge(records,incoming);persist();onChange();return true}catch{return false}}
  async function save(value){const r=clean(value);if(!r)throw Error('invalid_record');records=merge(records,[r]);const saved=persist();if(localAPI){try{const response=await request('/api/history',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify(r),signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('request_failed');pending.delete(r.id);message='Đã lưu lượt làm vào lịch sử.';onChange();return true}catch{pending.add(r.id);message=saved?'Đã lưu trong trình duyệt; chưa ghi được vào máy chủ local.':'Chưa lưu được lượt này. Hãy thử lưu lại trước khi đóng trang.';onChange();return saved}}
   message=saved?'Đã lưu lượt làm vào lịch sử.':'Lượt làm đang ở bộ nhớ; hãy thử lưu lại trước khi đóng trang.';onChange();return saved;
  }
  persist();return {list:()=>records.map(r=>JSON.parse(JSON.stringify(r))),status,sync,save,isPending:id=>pending.has(id)};
 }
 const api={create,clean,merge,keys:{LEGACY,CACHE,QUEUE}};if(typeof module==='object'&&module.exports)module.exports=api;else root.EchoHistory=api;
})(typeof window==='object'?window:globalThis);
