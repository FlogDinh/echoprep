import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';

export async function checkPronunciation({evaluate,call,wait}){
 const available=await evaluate("!!window.speechSynthesis&&typeof SpeechSynthesisUtterance==='function'");
 assert.equal(await evaluate("document.getElementById('pronunciation-mode').value"),available?'us':'cambridge');
 assert.equal(await evaluate("document.getElementById('cambridge-panel').hidden"),true);
 if(available)await evaluate(`window.qaUSSpeech=[];const qaUSNativeSpeak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=utterance=>{qaUSSpeech.push({text:utterance.text,lang:utterance.lang,voice:utterance.voice?.voiceURI,voiceLang:utterance.voice?.lang});utterance.volume=0;qaUSNativeSpeak(utterance);};`);
 await call('Runtime.evaluate',{expression:"document.getElementById('flashcard').click()",userGesture:true});
 assert.equal(await evaluate("document.getElementById('cambridge-panel').hidden"),false);
 const links=await evaluate("Array.from(document.querySelectorAll('#cambridge-words a'),a=>({word:a.textContent,href:a.href,target:a.target,rel:a.rel}))");
 assert.deepEqual(links.map(link=>link.word),['Study','abroad']);
 for(const link of links){
  const url=new URL(link.href);assert.equal(url.origin,'https://dictionary.cambridge.org');assert.ok(url.pathname.startsWith('/us/dictionary/english/'));assert.equal(link.target,'_blank');assert.match(link.rel,/noopener/);
 }
 if(available){
  const spoken=await evaluate('qaUSSpeech.at(-1)');assert.equal(spoken.text,'Study abroad');assert.equal(spoken.lang,'en-US');
  if(spoken.voiceLang)assert.match(spoken.voiceLang,/^en[-_]US/i);
 }
 await evaluate("document.getElementById('pronunciation-mode').value='cambridge';document.getElementById('pronunciation-mode').dispatchEvent(new Event('change'))");
 assert.equal(await evaluate("document.getElementById('card-pronunciation').hidden"),true);
 assert.equal(await evaluate("document.getElementById('speech-voice-label').hidden"),true);
 const before=available?await evaluate('qaUSSpeech.length'):0;
 await evaluate("document.getElementById('flashcard').click();document.getElementById('flashcard').click()");
 if(available)assert.equal(await evaluate('qaUSSpeech.length'),before);
 await evaluate("document.getElementById('wordlist-tab').click()");
 assert.equal(await evaluate("Array.from(document.querySelectorAll('#wordlist-body [data-speak]')).every(button=>button.hidden)"),true);
 assert.equal(await evaluate("document.querySelectorAll('#wordlist-body .list-cambridge').length"),54);
 // Cambridge links for grammar must use actual example words, never formula tokens.
 await evaluate("document.getElementById('essay-type').value='causes-effects';document.getElementById('essay-type').dispatchEvent(new Event('change'));document.getElementById('colloc-group').value='grammar-practice';document.getElementById('colloc-group').dispatchEvent(new Event('change'));document.getElementById('flashcard-tab').click();document.getElementById('card-next').click();document.getElementById('flashcard').click()");
 assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('#cambridge-words a'),a=>a.textContent)"),['Parents','expect','students','to','get','excellent','scores']);
 if(available){
  assert.equal(await evaluate('qaUSSpeech.length'),before);
  await call('Runtime.evaluate',{expression:"document.getElementById('pronunciation-mode').value='us';document.getElementById('pronunciation-mode').dispatchEvent(new Event('change'))",userGesture:true});
  assert.equal(await evaluate('qaUSSpeech.at(-1).text'),'Parents expect students to get excellent scores.');
  assert.equal(await evaluate('qaUSSpeech.at(-1).lang'),'en-US');
  const options=await evaluate("Array.from(document.querySelectorAll('#speech-voice option')).map(option=>option.value).filter(Boolean)");
  if(options.length){
   const chosen=options.at(-1);
   await call('Runtime.evaluate',{expression:`document.getElementById('speech-voice').value=${JSON.stringify(chosen)};document.getElementById('speech-voice').dispatchEvent(new Event('change'))`,userGesture:true});
   assert.equal(await evaluate('qaUSSpeech.at(-1).voice'),chosen);
   await evaluate("speechSynthesis.dispatchEvent(new Event('voiceschanged'))");
   assert.equal(await evaluate("document.getElementById('speech-voice').value"),chosen);
  }
 }
 if(process.env.ECHOPREP_SCREENSHOT){
  for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
   await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});
   assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
   await evaluate("document.getElementById('cambridge-panel').scrollIntoView({block:'center'})");
   await writeFile(`/tmp/echoprep-cambridge-${name}.png`,Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
  }
  await call('Emulation.clearDeviceMetricsOverride');
 }
 await evaluate("document.getElementById('pronunciation-mode').value='cambridge';document.getElementById('pronunciation-mode').dispatchEvent(new Event('change'));window.qaPronunciationBeforeReload=true");
 await call('Page.reload');
 await wait("!window.qaPronunciationBeforeReload&&!!document.getElementById('pronunciation-mode')&&document.getElementById('card-counter').textContent==='Thẻ 1 / 23'");
 assert.equal(await evaluate("document.getElementById('pronunciation-mode').value"),'cambridge');
 await evaluate("document.getElementById('flashcard').click()");
 assert.equal(await evaluate("document.getElementById('card-pronunciation').hidden"),true);
 assert.equal(await evaluate("document.getElementById('cambridge-panel').hidden"),false);
 // Return to defaults for the existing unsupported-browser regression check.
 await evaluate("document.getElementById('pronunciation-mode').value='us';document.getElementById('pronunciation-mode').dispatchEvent(new Event('change'));document.getElementById('essay-type').value='advantages-disadvantages';document.getElementById('essay-type').dispatchEvent(new Event('change'))");
 console.log('PASS US/CAMBRIDGE: US-only sentence speech, Cambridge links from actual examples, no synthesized autoplay in Cambridge mode, dictionary links in lists, real voice selection/late voice events, saved mode, phone layout and no UK audio mislabeled as US.');
}
