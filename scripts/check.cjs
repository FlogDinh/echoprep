const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {grade}=require('../dist/grading.js');const ctx={window:{}};vm.runInNewContext(fs.readFileSync(__dirname+'/../dist/Listening - Vol 9/Test 1/test.js','utf8'),ctx);const t=ctx.window.TEST;
const answers=Object.fromEntries(Object.entries(t.answers).map(([n,v])=>[n,v[0]]));Object.assign(answers,{25:'B',26:'E',27:'A',28:'D',29:'C',30:'E'});
assert.equal(grade(answers,t.answers).correct,40);assert.equal(grade({},t.answers).blank,40);
assert.equal(grade({...answers,25:'E',26:'B',27:'D',28:'A',29:'E',30:'C'},t.answers).correct,40);
assert.equal(grade({...answers,25:'B',26:'B'},t.answers).correct,39);
assert.equal(grade({...answers,9:'June 1',11:'8.55 a.m.',6:'  FRIDAY   evening '},t.answers).correct,40);
assert.equal(grade({...answers,31:'resource',1:'110'},t.answers).wrong,2);
assert.equal(grade({...answers,25:'A',26:'E'},t.answers).correct,39);
assert.equal(grade({...answers,25:'',26:'E'},t.answers).blank,1);
const gaps=t.sections.flatMap(x=>[...x.html.matchAll(/data-q="(\d+)"/g)].map(m=>+m[1]));assert.equal(new Set(gaps).size,27);
for(const n of [...Array.from({length:17},(_,i)=>i+1),...Array.from({length:10},(_,i)=>i+31)])assert.ok(gaps.includes(n));
assert.equal(t.singles.length,4);assert.equal(t.pairs.length,3);assert.equal(Object.keys(t.answers).length,40);
console.log('Passed: 40-answer key, all 27 gaps, 7 choice groups, reversed pairs, duplicates, partial credit, blanks, date/time variants and normalization.');

assert.equal(Object.keys(t.explanations).length,20);
for(let n=1;n<=20;n++)assert.ok(t.explanations[n].includes('Gợi ý:'));
for(let n=1;n<=4;n++)assert.ok(t.transcripts[n].length>100);
console.log('Passed: all 20 source explanations and 4 original transcripts imported.');

for(let n=1;n<=40;n++){const ids=t.questionSegments[n];assert.ok(ids.length);assert.ok(ids.every(id=>t.transcriptSegments[Math.ceil(n/10)].some(segment=>segment.id===id)));}
assert.ok(t.transcriptSegments[1].find(x=>x.id===t.questionSegments[1][0]).text.includes('Yours is $80'));
assert.ok(t.transcriptSegments[2].find(x=>x.id===t.questionSegments[18][0]).text.includes("Head's office"));
console.log('Passed: all 40 questions map to original transcript evidence in their correct section.');
