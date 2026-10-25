import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';

export async function checkAudioNavigation({call,wait}){
 // Native playback is initiated by a user gesture, like pressing the audio play button.
 const evaluate=async expression=>{
  const reply=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});
  if(reply.exceptionDetails)throw Error(reply.exceptionDetails.exception?.description||reply.exceptionDetails.text);
  return reply.result.value;
 };
 await call('Page.bringToFront');
 const base=await evaluate('getHistory().length');
 await evaluate("startTest({module:'listening',id:3})");
 // Real WAV files exercise decoding, the media clock and native playback events.
 // They are generated in memory; no private recordings or history are used.
 await evaluate(`window.qaWaveFile=(name)=>{
  const rate=8000,samples=rate*60,buffer=new ArrayBuffer(44+samples*2),data=new DataView(buffer);
  const text=(at,value)=>{for(let i=0;i<value.length;i++)data.setUint8(at+i,value.charCodeAt(i));};
  text(0,'RIFF');data.setUint32(4,36+samples*2,true);text(8,'WAVE');text(12,'fmt ');data.setUint32(16,16,true);data.setUint16(20,1,true);data.setUint16(22,1,true);data.setUint32(24,rate,true);data.setUint32(28,rate*2,true);data.setUint16(32,2,true);data.setUint16(34,16,true);text(36,'data');data.setUint32(40,samples*2,true);
  for(let i=0;i<samples;i++)data.setInt16(44+i*2,Math.sin(i*440*2*Math.PI/rate)*3000,true);
  return new File([buffer],name,{type:'audio/wav'});
 };window.qaChooseFiles=(names)=>{const transfer=new DataTransfer();names.forEach(name=>transfer.items.add(qaWaveFile(name)));$('files').files=transfer.files;$('files').dispatchEvent(new Event('change'));};
 qaChooseFiles(['T3-S1.wav','T3-S2.wav','T3-S3.wav']);audio.muted=true;`);
 await wait('audio.readyState>=2&&audio.duration===60');
 assert.equal(await evaluate('audioSection'),1);
 await evaluate("audio.play().catch(()=>{});");
 await wait('audio.paused');
 assert.equal(await evaluate('attemptStarted'),false);
 await evaluate("$('begin-attempt').click();audio.currentTime=5;$('speed').value='1.25';$('speed').dispatchEvent(new Event('change'));window.qaMediaEvents=[];for(const name of ['pause','loadstart','emptied','seeking'])audio.addEventListener(name,()=>qaMediaEvents.push(name));");
 await wait('!audio.seeking');
 await evaluate('audio.play()');
 await wait('audio.currentTime>5.2');
 await evaluate('qaMediaEvents=[];window.qaSource=audio.src;window.qaTime=audio.currentTime;');
 for(const n of [11,21,31,1]){
  await evaluate(`document.querySelector('[data-jump="${n}"]').click()`);
  assert.equal(await evaluate('audio.paused'),false);
  assert.equal(await evaluate('audio.src===qaSource&&audioSection===1'),true);
  assert.equal(await evaluate('audio.playbackRate'),1.25);
  assert.equal(await evaluate('section'),Math.floor((n-1)/10)+1);
 }
 await wait('audio.currentTime>qaTime+0.3');
 assert.deepEqual(await evaluate('qaMediaEvents'),[]);
 await evaluate('change(3)');
 assert.equal(await evaluate("$('audio-title').textContent"),'Audio · Section 1');
 assert.equal(await evaluate("$('audio-viewing').hidden"),false);
 assert.match(await evaluate("$('audio-viewing').textContent"),/Section 3/);
 // Adding a recording for another section must leave the active media untouched.
 await evaluate("qaMediaEvents=[];qaChooseFiles(['T3-S4.wav'])");
 assert.equal(await evaluate('audio.paused'),false);
 assert.equal(await evaluate('audio.src===qaSource'),true);
 assert.deepEqual(await evaluate('qaMediaEvents'),[]);
 // Only the dedicated audio selector changes the recording, preserving each position.
 await evaluate("$('audio-section').value='2';$('audio-section').dispatchEvent(new Event('change'));");
 await wait('audio.readyState>=2&&!audio.seeking');
 assert.equal(await evaluate('audio.paused'),true);
 assert.equal(await evaluate('audioSection'),2);
 assert.equal(await evaluate('section'),3);
 assert.equal(await evaluate('audio.src!==qaSource'),true);
 assert.ok(await evaluate('positions[1]>5'));
 await evaluate("audio.currentTime=17;$('audio-section').value='1';$('audio-section').dispatchEvent(new Event('change'))");
 await wait('audio.readyState>=2&&!audio.seeking&&audio.currentTime>5');
 assert.ok(await evaluate('Math.abs(audio.currentTime-positions[1])<0.1'));
 await evaluate("$('audio-section').value='2';$('audio-section').dispatchEvent(new Event('change'))");
 await wait('audio.readyState>=2&&!audio.seeking&&Math.abs(audio.currentTime-17)<0.1');
 await evaluate('audio.play();qaMediaEvents=[];showExam()');
 assert.equal(await evaluate('audio.paused'),false);
 assert.deepEqual(await evaluate('qaMediaEvents'),[]);
 // Pausing and browsing questions must not restart or seek paused recordings either.
 await evaluate('audio.pause();window.qaPausedTime=audio.currentTime;change(4);change(2)');
 assert.equal(await evaluate('audio.paused'),true);
 assert.ok(await evaluate('Math.abs(audio.currentTime-qaPausedTime)<0.1'));
 // Leaving to inspect an old attempt restores the correct audio section and position.
 await evaluate("showHistory();document.querySelector('[data-history-view]').click();returnCurrent()");
 await wait('audio.readyState>=2&&!audio.seeking&&Math.abs(audio.currentTime-qaPausedTime)<0.1');
 assert.equal(await evaluate('audioSection'),2);
 assert.equal(await evaluate('section'),2);
 assert.equal(await evaluate('audio.paused'),true);
 await evaluate("audio.play();answers={1:TEST.answers[1][0]};(async()=>{await $('finish').onclick()})()");
 assert.equal(await evaluate('audio.paused'),true);
 assert.equal(await evaluate('getHistory().length'),base+1);
 assert.equal(await evaluate('audioSection'),2);
 await evaluate('audio.play();window.qaReviewTime=audio.currentTime;showExplanation(31)');
 assert.equal(await evaluate('section'),4);
 assert.equal(await evaluate('audioSection'),2);
 assert.equal(await evaluate('audio.paused'),false);
 await wait('audio.currentTime>qaReviewTime+0.2');
 if(process.env.ECHOPREP_SCREENSHOT){
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await writeFile('/tmp/echoprep-independent-audio.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await call('Emulation.clearDeviceMetricsOverride');
 }
 // A new test must never inherit the previous test's running recording.
 await evaluate("startTest({module:'listening',id:4});$('begin-attempt').click()");
 assert.equal(await evaluate('audio.paused&&!audio.hasAttribute("src")'),true);
 assert.equal(await evaluate('audioSection'),1);
 // Unnamed uploads follow the explicitly selected audio section, not question section.
 await evaluate("change(4);$('audio-section').value='3';$('audio-section').dispatchEvent(new Event('change'));qaChooseFiles(['recording.wav'])");
 await wait('audio.readyState>=2');
 assert.equal(await evaluate('!!sources[3]&&!sources[4]&&audioSection===3&&section===4'),true);
 await evaluate("audio.play();$('abort-attempt').click();$('abort-confirm').click()");
 assert.equal(await evaluate('audio.paused&&!audio.hasAttribute("src")'),true);
 assert.equal(await evaluate('getHistory().length'),base+1);
 await evaluate("startTest({module:'reading',id:1});$('begin-attempt').click();change(2)");
 assert.equal(await evaluate('audio.paused&&!audio.hasAttribute("src")'),true);
 await evaluate('clearAttempt();showLibrary()');
 console.log('PASS INDEPENDENT AUDIO: actual WAV playback continues across all question sections and review explanations with no pause/reload/seek; separate audio selection, per-recording positions, rate, paused playback, unrelated uploads, history return, start gate, submission, cancellation and test/module isolation.');
}
