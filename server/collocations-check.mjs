import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';

export async function checkCollocations({evaluate,call,wait}){
 const historyBefore=await evaluate('getHistory().length');
 await evaluate("startTest({module:'listening',id:1});$('begin-attempt').click();answers={1:'Gray'};document.querySelector('[data-collocations-open]').click()");
 assert.equal(await evaluate("$('abort-dialog').open"),true);
 await evaluate("$('abort-continue').click()");
 assert.equal(await evaluate('answers[1]'),'Gray');
 assert.equal(await evaluate('attemptStarted&&!inLibrary'),true);
 await evaluate("document.querySelector('[data-collocations-open]').click();$('abort-confirm').click()");
 await wait("location.pathname.endsWith('/collocations.html')&&!!document.getElementById('card-english')&&document.getElementById('card-english').textContent==='Study abroad'");
 assert.equal(await evaluate("document.getElementById('essay-type').selectedOptions[0].textContent"),'Advantages & Disadvantages');
 assert.equal(await evaluate("document.getElementById('topic-title').textContent"),'Studying Abroad');
 const inventory=await evaluate('ECHO_COLLOCATIONS.types[0].topics[0].groups.map(g=>({id:g.id,count:g.cards.length}))');
 assert.deepEqual(inventory.map(g=>g.count),[9,9,11,9,9,7]);
 const dataset=await evaluate('ECHO_COLLOCATIONS.types[0].topics[0].groups.flatMap(g=>g.cards)');
 assert.equal(dataset.length,54);
 assert.equal(new Set(dataset.map(c=>c.id)).size,54);
 assert.equal(new Set(dataset.map(c=>c.english)).size,53);
 assert.ok(dataset.every(c=>c.english&&c.meaning&&/^\/.+\/$/.test(c.ipa)));
 assert.deepEqual(dataset.filter(c=>c.english==='A positive learning experience').map(c=>c.meaning),['Trải nghiệm học tập tích cực','Một trải nghiệm học tập tích cực']);
 assert.equal(await evaluate("document.getElementById('card-front').hidden"),false);
 assert.equal(await evaluate("document.getElementById('card-back').hidden"),true);
 assert.equal(await evaluate("getComputedStyle(document.getElementById('card-pronunciation')).display"),'none');
 const speechAvailable=await evaluate("!!window.speechSynthesis&&typeof SpeechSynthesisUtterance==='function'");
 if(speechAvailable){
  // Keep the real engine; capture the utterance and mute test output on the local machine.
  await evaluate(`window.qaSpeech=[];window.qaCancelCount=0;const qaNativeSpeak=speechSynthesis.speak.bind(speechSynthesis),qaNativeCancel=speechSynthesis.cancel.bind(speechSynthesis);speechSynthesis.speak=utterance=>{qaSpeech.push({text:utterance.text,lang:utterance.lang,rate:utterance.rate});utterance.volume=0;qaNativeSpeak(utterance)};speechSynthesis.cancel=()=>{qaCancelCount++;qaNativeCancel()};`);
 }
 await call('Runtime.evaluate',{expression:"document.getElementById('flashcard').click()",userGesture:true});
 assert.equal(await evaluate("document.getElementById('card-meaning').textContent"),'Du học');
 assert.equal(await evaluate("document.getElementById('card-ipa').textContent"),'/ˈstʌdi əˈbrɔːd/');
 assert.equal(await evaluate("document.getElementById('card-back').hidden"),false);
 assert.match(await evaluate("document.getElementById('flashcard').getAttribute('aria-label')"),/Du học/);
 if(speechAvailable){
  assert.equal(await evaluate('qaSpeech.length'),1);
  assert.deepEqual(await evaluate('qaSpeech[0]'),{text:'Study abroad',lang:await evaluate('qaSpeech[0].lang'),rate:1});
  assert.match(await evaluate('qaSpeech[0].lang'),/^en/i);
  await call('Runtime.evaluate',{expression:"document.getElementById('pronounce').click()",userGesture:true});
  assert.equal(await evaluate('qaSpeech.length'),2);
  await call('Runtime.evaluate',{expression:"document.getElementById('pronounce-slow').click()",userGesture:true});
  assert.equal(await evaluate('qaSpeech.length'),3);
  assert.equal(await evaluate('qaSpeech.at(-1).rate'),0.75);
  await evaluate("document.getElementById('flashcard').click()");
  assert.equal(await evaluate('qaSpeech.length'),3); // No replay when returning to the English front.
  await call('Runtime.evaluate',{expression:"document.getElementById('flashcard').click()",userGesture:true});
  assert.equal(await evaluate('qaSpeech.length'),4);
  const cancels=await evaluate('qaCancelCount');
  await evaluate("document.getElementById('card-next').click()");
  assert.ok(await evaluate('qaCancelCount')>cancels);
  assert.equal(await evaluate('qaSpeech.length'),4); // Moving to a fresh card must not autoplay it.
 }else await evaluate("document.getElementById('card-next').click()");
 assert.equal(await evaluate("document.getElementById('card-back').hidden"),true);
 assert.equal(await evaluate("document.getElementById('card-english').textContent"),'Access higher-quality education');
 // Traverse every card: next/previous and back content must remain paired.
 const visited=[];
 for(let i=0;i<54;i++){
  visited.push(await evaluate("document.getElementById('flashcard').dataset.cardId"));
  await evaluate("document.getElementById('flashcard').click()");
  const shown=await evaluate("({english:document.getElementById('card-back-english').textContent,meaning:document.getElementById('card-meaning').textContent,ipa:document.getElementById('card-ipa').textContent,id:document.getElementById('flashcard').dataset.cardId})");
  const expected=dataset.find(c=>c.id===shown.id);assert.deepEqual(shown,{id:expected.id,english:expected.english,meaning:expected.meaning,ipa:expected.ipa});
  if(speechAvailable)assert.equal(await evaluate('qaSpeech.at(-1).text'),shown.english);
  await evaluate("document.getElementById('card-next').click()");
 }
 assert.equal(new Set(visited).size,54);
 await evaluate("document.getElementById('card-previous').click();document.activeElement.blur()");
 assert.equal(await evaluate("document.getElementById('card-english').textContent"),'Study abroad');
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});
 await call('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});
 assert.equal(await evaluate("document.getElementById('card-back').hidden"),false);
 if(speechAvailable)assert.equal(await evaluate('qaSpeech.at(-1).text'),'Study abroad');
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
 assert.equal(await evaluate("document.getElementById('card-english').textContent"),'Access higher-quality education');
 assert.equal(await evaluate("document.getElementById('card-back').hidden"),true);
 // Group filters apply equally to flashcards and the full vocabulary list.
 for(const group of inventory){
  await evaluate(`document.getElementById('colloc-group').value=${JSON.stringify(group.id)};document.getElementById('colloc-group').dispatchEvent(new Event('change'));document.getElementById('wordlist-tab').click()`);
  assert.equal(await evaluate("document.querySelectorAll('#wordlist-body tr').length"),group.count);
  assert.ok(await evaluate("Array.from(document.querySelectorAll('#wordlist-body [data-speak]'),b=>b.dataset.speak).every(id=>id.startsWith(document.getElementById('colloc-group').value+'-'))"));
 }
 await evaluate("document.getElementById('colloc-group').value='all';document.getElementById('colloc-group').dispatchEvent(new Event('change'))");
 assert.equal(await evaluate("document.querySelectorAll('#wordlist-body tr').length"),54);
 if(speechAvailable){
  await call('Runtime.evaluate',{expression:"document.querySelectorAll('#wordlist-body [data-speak]')[42].click()",userGesture:true});
  assert.equal(await evaluate('qaSpeech.at(-1).text'),dataset[42].english);
 }
 await evaluate("document.getElementById('flashcard-tab').click();document.getElementById('card-shuffle').click()");
 assert.equal(await evaluate("document.getElementById('card-counter').textContent"),'Thẻ 1 / 54');
 assert.deepEqual(new Set(await evaluate("Array.from(document.querySelectorAll('#wordlist-body [data-speak]'),b=>b.dataset.speak)")),new Set(dataset.map(c=>c.id)));
 // Select the longest phrase to verify wrapping at both desktop and phone widths.
 await evaluate("document.getElementById('colloc-group').value='personal-development';document.getElementById('colloc-group').dispatchEvent(new Event('change'));document.getElementById('card-previous').click()");
 for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});
  assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
  if(process.env.ECHOPREP_SCREENSHOT)await writeFile(`/tmp/echoprep-collocations-${name}.png`,Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await evaluate("document.getElementById('flashcard').click()");
  assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
  if(process.env.ECHOPREP_SCREENSHOT)await writeFile(`/tmp/echoprep-collocations-${name}-back.png`,Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await evaluate("document.getElementById('flashcard').click()");
 }
 await call('Emulation.clearDeviceMetricsOverride');
 await checkAcademicStress({evaluate,call,wait,speechAvailable});
 assert.equal(await evaluate("(async()=> (await (await fetch('/api/history')).json()).length)()"),historyBefore);
 // Missing speech support must not prevent reading, flipping or navigating cards.
 await call('Page.enable');
 const injected=await call('Page.addScriptToEvaluateOnNewDocument',{source:"window.qaWithoutSpeech=true;window.SpeechSynthesisUtterance=undefined;"});
 await call('Page.reload');
 await wait("window.qaWithoutSpeech===true&&!!document.getElementById('card-english')&&document.getElementById('card-english').textContent==='Study abroad'");
 await evaluate("document.getElementById('flashcard').click()");
 assert.equal(await evaluate("document.getElementById('pronounce').disabled"),true);
 assert.equal(await evaluate("document.getElementById('card-meaning').textContent"),'Du học');
 assert.ok(await evaluate("document.getElementById('card-ipa').textContent.length>2"));
 await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:injected.identifier});
 await evaluate("document.querySelector('.learning-menu a[href*=reading]').click()");
 await wait("!!document.getElementById('begin-attempt')&&typeof activeModule!=='undefined'&&activeModule==='reading'&&getHistory().length==="+historyBefore);
 assert.equal(await evaluate('activeTest'),1);
 console.log('PASS COLLOCATIONS: safe navigation from exams, all 54 bilingual cards/6 groups, front/back IPA, autoplay on click/Space with correct English phrase, no autoplay on front/next, normal/slow replay and cancellation, shuffle, filtered lists, unsupported-speech fallback, desktop/mobile layout, Reading return and unchanged exam history.');
}

async function checkAcademicStress({evaluate,call,wait,speechAvailable}){
 await evaluate("document.getElementById('essay-type').value='causes-effects';document.getElementById('essay-type').dispatchEvent(new Event('change'))");
 assert.equal(await evaluate("document.getElementById('topic-title').textContent"),'Academic Stress');
 assert.equal(await evaluate("document.querySelector('#topic-menu [aria-current=page]').dataset.topic"),'academic-stress');
 assert.equal(await evaluate("new URLSearchParams(location.search).get('topic')"),'academic-stress');
 const data=await evaluate("ECHO_COLLOCATIONS.types.find(t=>t.id==='causes-effects').topics[0].groups.flatMap(g=>g.cards)");
 assert.equal(data.length,23);
 assert.equal(data.filter(c=>c.kind==='grammar').length,3);
 assert.equal(new Set(data.map(c=>c.id)).size,23);
 assert.equal(await evaluate("document.getElementById('grammar-notes').hidden"),true);
 for(const card of data){
  assert.equal(await evaluate("document.getElementById('card-english').textContent"),card.english);
  await call('Runtime.evaluate',{expression:"document.getElementById('flashcard').click()",userGesture:true});
  assert.equal(await evaluate("document.getElementById('card-back-english').textContent"),card.spokenText||card.english);
  assert.equal(await evaluate("document.getElementById('card-meaning').textContent"),card.meaning);
  assert.equal(await evaluate("document.getElementById('card-ipa').textContent"),card.ipa);
  if(speechAvailable)assert.equal(await evaluate('qaSpeech.at(-1).text'),card.spokenText||card.english);
  assert.equal(await evaluate("document.getElementById('grammar-notes').hidden"),card.kind!=='grammar');
  if(card.kind==='grammar'){
   assert.equal(await evaluate("document.getElementById('card-front-label').textContent"),'CẤU TRÚC NGỮ PHÁP');
   assert.ok(await evaluate("document.getElementById('grammar-notes').textContent").then(text=>text.includes(card.rule)&&text.includes(card.incorrectExample)&&text.includes('Lỗi minh hoạ cần tránh')&&text.includes('đã được dùng đúng')));
  }
  await evaluate("document.getElementById('card-next').click()");
  assert.equal(await evaluate("document.getElementById('grammar-notes').hidden"),true);
 }
 await evaluate("document.getElementById('colloc-group').value='grammar-practice';document.getElementById('colloc-group').dispatchEvent(new Event('change'));document.getElementById('wordlist-tab').click()");
 assert.equal(await evaluate("document.querySelectorAll('#wordlist-body tr').length"),3);
 assert.equal(await evaluate("document.querySelectorAll('#wordlist-body .grammar-correct').length"),3);
 if(speechAvailable){
  await call('Runtime.evaluate',{expression:"document.querySelectorAll('#wordlist-body [data-speak]')[1].click()",userGesture:true});
  assert.equal(await evaluate('qaSpeech.at(-1).text'),'Parents expect students to get excellent scores.');
 }
 await evaluate("document.getElementById('flashcard-tab').click();document.getElementById('flashcard').click()");
 for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});
  assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
  if(process.env.ECHOPREP_SCREENSHOT){
   await evaluate("document.getElementById('grammar-notes').scrollIntoView({block:'end'})");
   await writeFile(`/tmp/echoprep-academic-grammar-${name}.png`,Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
  }
 }
 await call('Emulation.clearDeviceMetricsOverride');
 await evaluate('window.qaAcademicBeforeReload=true');await call('Page.reload');
 await wait("!window.qaAcademicBeforeReload&&!!document.getElementById('topic-title')&&document.getElementById('topic-title').textContent==='Academic Stress'");
 assert.equal(await evaluate("document.getElementById('essay-type').value"),'causes-effects');
 assert.equal(await evaluate("document.getElementById('card-counter').textContent"),'Thẻ 1 / 23');
 await evaluate("document.getElementById('essay-type').value='advantages-disadvantages';document.getElementById('essay-type').dispatchEvent(new Event('change'))");
 assert.equal(await evaluate("document.getElementById('topic-title').textContent"),'Studying Abroad');
 assert.equal(await evaluate("document.getElementById('card-counter').textContent"),'Thẻ 1 / 54');
 assert.equal(await evaluate("document.getElementById('grammar-notes').hidden"),true);
 console.log('PASS ACADEMIC STRESS: 20 collocations and 3 grammar cards, correct examples/IPA/rules, explicitly illustrative mistakes, spoken examples rather than formula symbols, filtered list, phone/desktop layout, persisted topic link and original 54 cards preserved.');
}
