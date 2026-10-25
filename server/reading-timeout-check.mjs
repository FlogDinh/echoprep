import assert from 'node:assert/strict';

export async function checkReadingTimeout({evaluate,call}){
 await call('Page.bringToFront');
 await evaluate("window.qaRealNow=Date.now;window.qaNow=Date.now();Date.now=()=>window.qaNow;window.qaHistoryBefore=getHistory().length");
 try{
  // Reach the limit through the actual timer while preserving live inputs and highlights.
  await evaluate("startTest({module:'reading',id:1});$('time-mode').value='timed';$('begin-attempt').click();document.querySelector('[data-choice=\"1\"][value=\"FALSE\"]').click();$('q7').value='water';$('q7').dispatchEvent(new Event('input'));");
  await evaluate(`(()=>{const paragraph=document.querySelector('#transcript-body p');const range=document.createRange();range.selectNodeContents(paragraph);getSelection().removeAllRanges();getSelection().addRange(range);$('transcript-body').dispatchEvent(new MouseEvent('mouseup'));window.qaInput=$('q7');window.qaAnswers=JSON.stringify(answers);window.qaHighlights=JSON.stringify(highlights);window.qaMarks=document.querySelectorAll('mark.keyword-highlight').length;})()`);
  assert.ok(await evaluate('qaMarks>0'));
  await evaluate('qaNow=started+3599000;clock()');
  assert.equal(await evaluate("$('timer').textContent"),'00:00:01');
  assert.equal(await evaluate("$('time-limit-dialog').open"),false);
  await evaluate('qaNow+=1000;clock()');
  assert.equal(await evaluate("$('time-limit-dialog').open"),true);
  assert.equal(await evaluate("$('timer').textContent"),'00:00:00');
  assert.equal(await evaluate('elapsed'),3600);
  assert.equal(await evaluate('submitted'),false);
  assert.equal(await evaluate('getHistory().length===qaHistoryBefore'),true);
  assert.match(await evaluate("$('time-limit-progress').textContent"),/2\/40/);
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  assert.equal(await evaluate("$('time-limit-dialog').open"),true);
  await evaluate('qaNow+=300000;clock();clock()');
  assert.equal(await evaluate('elapsed'),3600);
  assert.equal(await evaluate("document.querySelectorAll('dialog[open]').length"),1);

  await evaluate("$('time-limit-continue').click()");
  assert.equal(await evaluate('timerMode'),'elapsed');
  assert.equal(await evaluate("$('timer').textContent"),'01:00:00');
  assert.equal(await evaluate("$('time-limit-dialog').open"),false);
  assert.equal(await evaluate("$('q7')===qaInput&&JSON.stringify(answers)===qaAnswers&&JSON.stringify(highlights)===qaHighlights"),true);
  assert.equal(await evaluate("document.querySelectorAll('mark.keyword-highlight').length===qaMarks"),true);
  assert.equal(await evaluate('getHistory().length===qaHistoryBefore'),true);
  await evaluate('qaNow+=17000;clock();change(2);change(1)');
  assert.equal(await evaluate("$('timer').textContent"),'01:00:17');
  assert.equal(await evaluate("$('q7').value"),'water');
  assert.ok(await evaluate("document.querySelectorAll('mark.keyword-highlight').length>0"));
  await evaluate('qaNow+=43000;clock()');
  assert.equal(await evaluate("$('time-limit-dialog').open"),false);
  await evaluate("$('finish').onclick()");
  assert.equal(await evaluate('result.correct'),2);
  assert.equal(await evaluate('getHistory().length===qaHistoryBefore+1'),true);
  assert.equal(await evaluate('getHistory().at(-1).elapsed'),3660);
  assert.equal(await evaluate('JSON.stringify(getHistory().at(-1).highlights)===qaHighlights'),true);
  await evaluate("$('finish').onclick();clock()");
  assert.equal(await evaluate('getHistory().length===qaHistoryBefore+1'),true);
  assert.equal(await evaluate("$('time-limit-dialog').open"),false);

  // Expiry takes over an open manual submit confirmation, and submits exactly once.
  await evaluate("startTest({module:'reading',id:1});$('time-mode').value='timed';$('begin-attempt').click();document.querySelector('[data-choice=\"1\"][value=\"FALSE\"]').click();qaNow=started+3599000;$('submit').click()");
  assert.equal(await evaluate("$('confirm').open"),true);
  await evaluate('qaNow+=1000;clock()');
  assert.equal(await evaluate("$('confirm').open"),false);
  assert.equal(await evaluate("$('time-limit-dialog').open"),true);
  await evaluate('qaNow+=120000;clock()');
  await evaluate("$('time-limit-submit').onclick()");
  assert.equal(await evaluate('submitted'),true);
  assert.equal(await evaluate('result.correct'),1);
  assert.equal(await evaluate('elapsed'),3600);
  assert.equal(await evaluate("$('review-toolbar').hidden||$('review-shell').hidden"),false);
  assert.equal(await evaluate('getHistory().length===qaHistoryBefore+2'),true);
  assert.equal(await evaluate('getHistory().at(-1).elapsed'),3600);
  assert.equal(await evaluate('getHistory().at(-1).timerMode'),'timed');
  await evaluate("$('time-limit-submit').onclick();clock()");
  assert.equal(await evaluate('getHistory().length===qaHistoryBefore+2'),true);

  // A fresh attempt can expire again; an elapsed history record never opens the prompt.
  await evaluate("startTest({module:'reading',id:1});$('time-mode').value='timed';$('begin-attempt').click();showHistory();document.querySelector('[data-history-view]').click();qaNow+=3700000;clock()");
  assert.equal(await evaluate("$('time-limit-dialog').open"),false);
  await evaluate('returnCurrent()');
  assert.equal(await evaluate("$('time-limit-dialog').open"),true);
  await evaluate("$('time-limit-continue').click();$('abort-attempt').click();$('abort-confirm').click()");
  assert.equal(await evaluate('getHistory().length===qaHistoryBefore+2'),true);
  assert.equal(await evaluate('timeLimitPending'),false);

  // Expiry from the history screen still returns to results after submission.
  await evaluate("startTest({module:'reading',id:2});$('time-mode').value='timed';$('begin-attempt').click();showHistory();qaNow=started+3610000;clock()");
  assert.equal(await evaluate("$('time-limit-dialog').open"),true);
  await evaluate("$('time-limit-submit').onclick()");
  assert.equal(await evaluate("$('history').hidden"),true);
  assert.equal(await evaluate("$('review-toolbar').hidden||$('review-shell').hidden"),false);
  assert.equal(await evaluate('getHistory().length===qaHistoryBefore+3'),true);

  // Untimed Reading, Listening and a ready screen have no 60-minute prompt.
  await evaluate("startTest({module:'reading',id:1});$('time-mode').value='timed';started=qaNow-7200000;clock()");
  assert.equal(await evaluate("$('time-limit-dialog').open"),false);
  await evaluate("$('time-mode').value='elapsed';$('begin-attempt').click();qaNow+=7200000;clock()");
  assert.equal(await evaluate('elapsed'),7200);
  assert.equal(await evaluate("$('timer').textContent"),'02:00:00');
  assert.equal(await evaluate("$('time-limit-dialog').open"),false);
  await evaluate("startTest({module:'listening',id:1});$('begin-attempt').click();qaNow+=7200000;clock()");
  assert.equal(await evaluate("$('time-limit-dialog').open"),false);
  assert.equal(await evaluate('elapsed'),7200);
  await evaluate('clearAttempt();showLibrary()');
  console.log('PASS READING TIMEOUT: deadline choice once, Escape blocked, paused choice time, continue from 60:00 with answers/highlights, later submission and elapsed history, immediate submit at 60 minutes, duplicate prevention, retakes, history review, background expiry and untimed/Listening isolation.');
 }finally{
  await evaluate('Date.now=qaRealNow;clearAttempt();showLibrary()');
 }
}
