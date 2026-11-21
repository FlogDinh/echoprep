const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{grade}=require('../dist/grading.js'),{clean}=require('../dist/shared-history.js');
const ctx={window:{VOL8_TESTS:{}}};vm.createContext(ctx);
for(let n=1;n<=8;n++)vm.runInContext(fs.readFileSync(`dist/Listening - Vol 8/Test ${n}/test.js`,'utf8'),ctx);
const tests=ctx.window.VOL8_TESTS,keys=JSON.parse(fs.readFileSync('scripts/vol8-answer-keys.json','utf8'));
assert.deepEqual(Object.keys(tests),['1','2','3','4','5','6','7','8']);
for(const [id,t] of Object.entries(tests)){
 assert.equal(t.vol,8);assert.equal(t.module,'listening');assert.equal(t.sections.length,4);
 const controls=new Set([...t.sections.map(s=>s.html).join('').matchAll(/data-q="(\d+)"/g)].map(m=>+m[1]));
 t.singles.forEach(q=>{assert.equal(q.options.length,3,`Test ${id} Q${q.n} options`);controls.add(q.n)});t.pairs.forEach(q=>{for(let i=0;i<q.size;i++)controls.add(q.n+i)});
 assert.equal(controls.size,40,`Vol 8 Test ${id} controls`);
 // Every answer equals the transcribed source key (plus documented formatting variants only).
 for(let n=1;n<=40;n++)for(const v of keys[id][n])assert.ok(t.answers[n].includes(v),`Test ${id} Q${n} source key`);
 const answers=Object.fromEntries(Object.entries(t.answers).map(([n,v])=>[n,v[0]]));
 for(const set of t.grading.sets){const allowed=t.answers[set.n][0].split('/').reverse();for(let i=0;i<set.size;i++)answers[set.n+i]=allowed[i]}
 assert.equal(grade(answers,t.answers,t.grading).correct,40,`Vol 8 Test ${id} full marks`);
 for(const set of t.grading.sets)assert.equal(grade({...answers,[set.n+1]:answers[set.n]},t.answers,t.grading).correct,39,`Test ${id} duplicate choice`);
 for(const [sec,segs] of Object.entries(t.transcriptSegments)){assert.ok(segs.map(s=>s.text).join(' ').length>1500,`Test ${id} transcript ${sec}`)}
 for(let n=1;n<=40;n++)for(const link of t.questionSegments[n]||[])assert.ok(t.transcriptSegments[Math.ceil(n/10)].some(s=>s.id===link),`Test ${id} evidence ${n}`);
 const images=[...t.sections.map(s=>s.html).join('').matchAll(/src="([^"]+)"/g)];for(const image of images)assert.ok(fs.existsSync('dist/'+decodeURIComponent(image[1])),image[1]);
 console.log(`PASS Listening Vol 8 Test ${id}: 40 controls, 40 source answers, ${images.length} source images, ${Object.keys(t.explanations).length} explanations`);
}
assert.equal(tests[1].explanations[25].includes('too irregular'),true);
assert.match(tests[8].sourceNotes.join(' '),/Câu 22/);
// History keeps Vol 8 attempts separate from Vol 9; old records without vol stay Vol 9.
const rows=Array.from({length:40},(_,i)=>({n:i+1,status:'blank',value:'',expected:'x'})),record={id:'v8',module:'listening',vol:8,testId:8,submittedAt:new Date().toISOString(),elapsed:1,answers:{},result:{correct:0,wrong:0,blank:40,rows}};
assert.equal(clean(record).vol,8);assert.equal(clean(record).test,'Listening - Vol 8 · Test 8');
assert.equal(clean({...record,vol:undefined,testId:9}).vol,9);assert.equal(clean({...record,testId:9}),null);assert.equal(clean({...record,module:'reading',testId:1}),null);
// Audio file names in the Vol 8 source folders map to their sections.
const app=fs.readFileSync('dist/app.js','utf8'),audioFileSection=new Function(app.match(/function audioFileSection[\s\S]*?\n/)[0]+'return audioFileSection')();
for(const [name,test,section] of [['1-International-Student-Travel-Agency.mp3',null,1],['4-Dyscalculia.mp3',null,4],['3-The-Just-in-Time-Supply-System-JIT.mp3',null,3],['7-2.mp3',7,2],['84.mp3',8,4],['T3-S1.mp3',3,1],['VOL 9-Part 2.mp3',null,2]])assert.deepEqual(audioFileSection(name),{test,section},name);
console.log('PASS Listening Vol 8 catalog: 8 tests, source keys, separate Vol 8 history and source audio names.');
