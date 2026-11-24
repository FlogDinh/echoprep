import assert from 'node:assert/strict';
// Computer-delivered IELTS behaviour: right-click highlighting, A–H answer grids, Review flags, Part bar and arrows.
export async function checkExamUI({evaluate}){
 const select=root=>`(()=>{const walker=document.createTreeWalker(${root},NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode())&&node.textContent.trim().length<40);const range=document.createRange();range.setStart(node,0);range.setEnd(node,25);getSelection().removeAllRanges();getSelection().addRange(range);return node.parentElement})()`;
 const rightClick=target=>`(()=>{const event=new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:40,clientY:40});${target}.dispatchEvent(event);return event.defaultPrevented})()`;
 await evaluate("clearAttempt();startTest({module:'reading',vol:9,id:1});$('begin-attempt').click()");
 assert.equal(await evaluate("document.body.classList.contains('exam-mode')"),true);
 assert.equal(await evaluate("$('part-banner').hidden"),false);
 assert.match(await evaluate("$('part-banner').textContent"),/Part 1.*Read the text below and answer questions 1 – 13/);
 // A plain selection no longer highlights; only right-click → Tô vàng does.
 await evaluate(`window.qaTarget=${select("$('transcript-body')")};$('transcript-body').dispatchEvent(new MouseEvent('mouseup',{bubbles:true}))`);
 assert.equal(await evaluate("document.querySelectorAll('#transcript-body mark.keyword-highlight').length"),0);
 assert.equal(await evaluate(rightClick('qaTarget')),true);
 assert.equal(await evaluate("$('highlight-menu').hidden"),false);
 assert.deepEqual(await evaluate("[...document.querySelectorAll('#highlight-menu button')].map(b=>b.disabled)"),[false,true,true]);
 await evaluate("document.querySelector('[data-highlight-action=highlight]').click()");
 assert.equal(await evaluate("$('highlight-menu').hidden"),true);
 assert.equal(await evaluate("document.querySelectorAll('#transcript-body mark.keyword-highlight').length"),1);
 // Right-click with nothing selected keeps the browser's own menu.
 assert.equal(await evaluate("getSelection().removeAllRanges();"+rightClick("document.querySelectorAll('#transcript-body p')[3]")),false);
 assert.equal(await evaluate("$('highlight-menu').hidden"),true);
 // Clear one highlight from its own context menu; Clear all empties the pane.
 assert.equal(await evaluate(rightClick("document.querySelector('#transcript-body mark.keyword-highlight')")),true);
 assert.deepEqual(await evaluate("[...document.querySelectorAll('#highlight-menu button')].map(b=>b.disabled)"),[true,false,false]);
 await evaluate("document.querySelector('[data-highlight-action=clear]').click()");
 assert.equal(await evaluate("document.querySelectorAll('#transcript-body mark.keyword-highlight').length"),0);
 await evaluate(`${select("$('paper')")};${rightClick("$('paper')")};document.querySelector('[data-highlight-action=highlight]').click()`);
 assert.equal(await evaluate("document.querySelectorAll('#paper mark.keyword-highlight').length>0"),true);
 await evaluate(`getSelection().removeAllRanges();${rightClick("document.querySelector('#paper mark.keyword-highlight')")};document.querySelector('[data-highlight-action=clear-all]').click()`);
 assert.equal(await evaluate("document.querySelectorAll('#paper mark.keyword-highlight').length+Object.keys(highlights[1]||{}).length"),0);
 // Review flag, current question and arrows in the bottom bar.
 await evaluate("document.querySelector('[data-jump=\"5\"]').click();$('review-flag').click()");
 assert.equal(await evaluate("document.querySelector('[data-jump=\"5\"]').className.includes('flagged')"),true);
 await evaluate("$('nav-next').click()");assert.equal(await evaluate('currentQuestion'),6);
 assert.equal(await evaluate("$('review-flag').checked"),false);
 await evaluate("document.querySelector('[data-jump=\"13\"]').click();$('nav-next').click()");
 assert.equal(await evaluate('[currentQuestion,section].join()'),'14,2');
 assert.match(await evaluate("$('part-banner').textContent"),/Part 2/);
 await evaluate("$('nav-prev').click()");assert.equal(await evaluate('[currentQuestion,section].join()'),'13,1');
 // A–H grid (letter-only map matching) answers through radio cells and survives Part changes.
 await evaluate("clearAttempt();startTest({module:'listening',vol:8,id:1});$('begin-attempt').click();change(2)");
 assert.equal(await evaluate("document.querySelectorAll('#paper .match-grid tbody tr').length"),5);
 assert.equal(await evaluate("document.querySelectorAll('#paper .match-grid thead th').length"),9);
 await evaluate("document.querySelector('[data-grid=\"11\"][value=\"C\"]').click()");
 assert.equal(await evaluate('answers[11]'),'C');assert.equal(await evaluate("$('q11').value"),'C');
 assert.equal(await evaluate("document.querySelector('[data-jump=\"11\"]').classList.contains('filled')"),true);
 await evaluate("change(1);change(2)");assert.equal(await evaluate("document.querySelector('[data-grid=\"11\"][value=\"C\"]').checked"),true);
 // Worded options use drag-and-drop gaps beside the option list; gap boxes show their number.
 await evaluate('change(3)');
 assert.equal(await evaluate("document.querySelectorAll('#paper .drag-layout .drag-targets [data-drop]').length"),6);
 assert.equal(await evaluate("document.querySelector('#paper .drag-options [data-token=\"B\"]')!==null"),true);
 await evaluate("change(1)");assert.equal(await evaluate("document.querySelector('#paper input.gap').placeholder"),'1');
 // Review marks the right grid cell after submission.
 await evaluate("(async()=>{await finishAttempt();change(2)})()");
 assert.equal(await evaluate("document.querySelector('[data-grid=\"11\"][value=\"C\"]').closest('td').classList.contains('correct-cell')"),true);
 assert.equal(await evaluate("document.body.classList.contains('exam-mode')"),false);
 assert.equal(await evaluate("document.querySelectorAll('#paper .match-grid .explanation-button').length"),5);
 console.log('PASS EXAM UI: right-click highlight/clear/clear all (no highlight on plain selection), native menu without selection, Part banner, Review flags, arrows across Parts, A–H grid answers and review cells, drag-and-drop gaps and numbered answer boxes.');
}
