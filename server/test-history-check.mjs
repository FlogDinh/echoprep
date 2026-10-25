import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';

export async function checkTestHistory({evaluate,call}){
 const visible=()=>evaluate("!$('test-history').hidden");
 const rows=()=>evaluate("Array.from(document.querySelectorAll('#test-history tbody tr'),row=>({id:row.querySelector('button').dataset.testHistoryView,total:row.querySelector('.test-history-total').textContent,parts:Array.from(row.querySelectorAll('.test-history-score'),cell=>cell.textContent)}))");
 const base=await evaluate('getHistory().length');
 await evaluate("startTest({module:'reading',id:6})");
 assert.equal(await visible(),true);
 assert.match(await evaluate("$('test-history').textContent"),/Chưa có lượt làm nào cho Reading Test 6/);
 assert.equal((await rows()).length,0);
 // Existing submissions also receive per-passage scores without being rewritten.
 await evaluate("startTest({module:'reading',id:1})");
 assert.deepEqual((await rows())[0].parts,['3/13','3/13','1/14']);
 assert.equal((await rows())[0].total,'7/40');
 for(const counts of [[8,4,7],[2,6,3]]){
  await evaluate("startTest({module:'reading',id:6});$('begin-attempt').click()");
  assert.equal(await visible(),false);
  await evaluate(`answers=Object.fromEntries(Object.entries(TEST.answers).filter(([n])=>groups().some(([a],i)=>+n>=a&&+n<a+${JSON.stringify(counts)}[i])).map(([n,v])=>[n,v[0]]));render();`);
  if(counts[0]===8){
   await evaluate(`(()=>{const paragraph=document.querySelector('#transcript-body p');const range=document.createRange();range.selectNodeContents(paragraph);getSelection().removeAllRanges();getSelection().addRange(range);$('transcript-body').dispatchEvent(new MouseEvent('mouseup'));})()`);
   assert.ok(await evaluate("document.querySelector('#transcript-body mark.keyword-highlight')!==null"));
  }
  await evaluate("(async()=>{await $('finish').onclick()})()");
  assert.equal(await evaluate('result.correct'),counts.reduce((a,b)=>a+b,0));
  assert.equal(await visible(),false);
 }
 await evaluate("document.querySelector('aside [data-module=reading][data-start-test=\"6\"]').click()");
 let records=await rows();
 assert.deepEqual(records.map(r=>r.total),['11/40','19/40']);
 assert.deepEqual(records.map(r=>r.parts),[['2/13','6/13','3/14'],['8/13','4/13','7/14']]);
 assert.notEqual(records[0].id,records[1].id);
 const older=records[1].id;
 await evaluate("document.querySelectorAll('#test-history [data-test-history-view]')[1].click()");
 assert.equal(await visible(),false);
 assert.equal(await evaluate('reviewingId'),older);
 assert.equal(await evaluate('result.correct'),19);
 assert.equal(await evaluate('activeTest'),6);
 assert.ok(await evaluate("document.querySelector('#transcript-body mark.keyword-highlight')!==null"));
 assert.equal(await evaluate("Array.from(document.querySelectorAll('#paper [data-q],#paper [data-choice]')).every(el=>el.disabled)"),true);
 await evaluate('showExplanation(27)');
 assert.equal(await evaluate('section'),3);
 assert.equal(await evaluate("$('explanation-sheet').hidden"),false);
 await evaluate("$('review-return').click()");
 assert.equal(await visible(),true);
 assert.equal(await evaluate('attemptStarted'),false);
 assert.equal(await evaluate('elapsed'),0);
 assert.equal(await evaluate('activeTest'),6);
 assert.equal(await evaluate('getHistory().length'),base+2);
 assert.deepEqual((await rows()).map(r=>r.id),records.map(r=>r.id));
 await evaluate("$('test-history-refresh').click()");
 // A refresh of the local API must retain the selected test and the same rows.
 for(let i=0;i<100&&await evaluate('historyStore.status().busy');i++)await new Promise(r=>setTimeout(r,20));
 assert.deepEqual((await rows()).map(r=>r.id),records.map(r=>r.id));
 if(process.env.ECHOPREP_SCREENSHOT){
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await writeFile('/tmp/echoprep-test-history.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
  await evaluate("$('test-history').scrollIntoView({block:'start'})");
  await writeFile('/tmp/echoprep-test-history-mobile.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await call('Emulation.clearDeviceMetricsOverride');
 }
 await evaluate('showHistory()');assert.equal(await visible(),false);
 await evaluate("$('history-back').click()");assert.equal(await visible(),true);
 await evaluate('showLibrary()');assert.equal(await visible(),false);
 // Same-number Listening and Reading tests must never share history rows.
 await evaluate("startTest({module:'listening',id:6})");
 assert.equal((await rows()).length,0);
 await evaluate("$('begin-attempt').click();answers=Object.fromEntries(Object.entries(TEST.answers).filter(([n])=>groups().some(([a],i)=>+n>=a&&+n<a+[2,5,1,3][i])).map(([n,v])=>[n,v[0]]));(async()=>{await $('finish').onclick()})()");
 await evaluate("startTest({module:'listening',id:6})");
 records=await rows();
 assert.equal(records.length,1);
 assert.equal(records[0].total,'11/40');
 assert.deepEqual(records[0].parts,['2/10','5/10','1/10','3/10']);
 await evaluate("document.querySelector('#test-history [data-test-history-view]').click();change(4)");
 assert.equal(await evaluate('activeModule'),'listening');
 assert.equal(await evaluate('section'),4);
 assert.equal(await evaluate("$('transcript-pane').hidden"),false);
 await evaluate("$('review-return').click();$('begin-attempt').click()");
 assert.equal(await evaluate('Object.keys(answers).length'),0);
 assert.equal(await evaluate('Object.keys(highlights).length'),0);
 await evaluate("$('abort-attempt').click();$('abort-confirm').click();startTest({module:'listening',id:6})");
 assert.equal((await rows()).length,1);
 assert.equal(await evaluate('getHistory().length'),base+3);
 console.log('PASS PER-TEST HISTORY: exact module/test filtering, old attempts, separate retries, total and all passage/section scores, newest first, saved highlights/read-only review, return to selected test, refresh, clean retry and cancellation.');
}

export async function checkUngradedTestHistory({evaluate}){
 await evaluate("startTest({module:'reading',id:12})");
 assert.equal(await evaluate("$('test-history').hidden"),false);
 assert.equal(await evaluate("document.querySelector('#test-history .test-history-total').textContent"),'Chưa chấm');
 assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('#test-history .test-history-score'),el=>el.textContent)"),['Chưa chấm','Chưa chấm','Chưa chấm']);
 assert.equal(await evaluate("$('test-history').textContent.includes('0/40')"),false);
 console.log('PASS UNGRADED HISTORY: Reading 12 total and each passage show Chưa chấm, never a misleading zero score.');
}
