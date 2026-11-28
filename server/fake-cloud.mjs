// Test double of the Supabase RPC endpoints in supabase/echoprep-history.sql, used by the browser check
// (ECHOPREP_FAKE_CLOUD=1). Same contract: POST /rest/v1/rpc/echoprep_{whoami,list,save} with apikey header,
// 403 for a wrong key, 204 for a save. Keys: student 's'×32, teacher 't'×32.
export const FAKE_KEYS={student:'s'.repeat(32),teacher:'t'.repeat(32)},FAKE_ANON='fake-anon-key';
import {createHash} from 'node:crypto';
const records=new Map(),sha=k=>createHash('sha256').update(String(k)).digest('hex'),hashes={student:sha(FAKE_KEYS.student),teacher:sha(FAKE_KEYS.teacher)};
export function fakeCloud(req,res,pathname,body,origin){
 if(pathname==='/cloud-config.js'){res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'});res.end(`window.ECHO_CLOUD={url:${JSON.stringify(origin)},anonKey:${JSON.stringify(FAKE_ANON)}};`);return true}
 const m=pathname.match(/^\/rest\/v1\/rpc\/(echoprep_(?:whoami|list|save|set_teacher))$/);if(!m)return false;
 const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(data===undefined?'':JSON.stringify(data))};
 if(req.method!=='POST'||req.headers.apikey!==FAKE_ANON||![undefined,`Bearer ${FAKE_ANON}`].includes(req.headers.authorization))return reply(401,{message:'bad apikey'}),true;
 return body().then(b=>{
  const role=Object.entries(hashes).find(([,h])=>h===sha(b.p_key))?.[0]||null;
  if(m[1]==='echoprep_whoami')return reply(200,role);
  if(m[1]==='echoprep_list')return role?reply(200,[...records.values()].sort((a,c)=>Date.parse(a.submittedAt)-Date.parse(c.submittedAt))):reply(403,{code:'42501'});
  if(role!=='student')return reply(403,{code:'42501'});
  if(m[1]==='echoprep_set_teacher'){if(!/^[0-9a-f]{64}$/.test(b.p_teacher_hash||''))return reply(400,{code:'22023'});hashes.teacher=b.p_teacher_hash;return reply(204)}
  records.set(b.p_record.id,b.p_record);return reply(204);
 }),true;
}
