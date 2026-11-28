const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let attemptStarted=false;
let activeModule="listening",timerMode="elapsed";
const READING_TIME_LIMIT=60*60;
let timeLimitPending=false;
const catalog={listening:{9:TESTS,8:window.VOL8_TESTS||{}},reading:{9:READING_TESTS}};
const vols=(module=activeModule)=>Object.keys(catalog[module]).map(Number).filter(v=>Object.keys(catalog[module][v]).length).sort((a,b)=>b-a);
const moduleName=()=>activeModule==="reading"?"Reading":"Listening";
const groups=()=>TEST.groups||[[1,10],[11,20],[21,30],[31,40]];
const questionSection=n=>groups().findIndex(([a,b])=>n>=a&&n<=b)+1;
let activeTest=1, activeVol=9, inLibrary=false, pendingTest=null, pendingRetry=null;
const choiceSize=q=>q.size||2;
const questionBase=n=>{const p=TEST.pairs.find(p=>n>=p.n&&n<p.n+choiceSize(p));return p?p.n:n};
let section=1, audioSection=1, answers={}, submitted=false, result=null, started=Date.now(), elapsed=0, chosen='', sources={}, positions={};
const audioByTest={};
const audioKey=()=>`${activeModule}:${activeVol}:${activeTest}`;
const isVol9Test1=()=>activeModule==='listening'&&activeVol===9&&activeTest===1;
let highlights={};
let selectedQuestion=null;
let reviewingId=null, reviewBackup=null, storageNotice='';
let pendingSave=null;
const HISTORY_KEY=EchoHistory.keys.LEGACY;
let browserStorage;try{browserStorage=localStorage}catch{}
// Online history on Supabase (cloud-config.js). Open the site once with #connect=<student key> to save attempts
// online from this browser; #teacher=<teacher key> opens a read-only view of every attempt for the teacher.
const CLOUD_KEY='echoprep:cloud-key:v1',cloudHash=new URLSearchParams(location.hash.slice(1));
const teacherKey=cloudHash.get('teacher')||'',connectKey=cloudHash.get('connect')||'';
let studentKey='';try{studentKey=connectKey||browserStorage?.getItem(CLOUD_KEY)||''}catch{}
if(connectKey){try{browserStorage?.setItem(CLOUD_KEY,connectKey)}catch{}history.replaceState(null,'',location.pathname+location.search)}
const teacherMode=!!teacherKey;let cloudNotice='';
// New publishable keys (sb_publishable_…) go in the apikey header only; legacy anon JWTs also as Bearer.
function cloudRPC(fn,body){const c=window.ECHO_CLOUD||{};return fetch(`${c.url.replace(/\/$/,'')}/rest/v1/rpc/${fn}`,{method:'POST',credentials:'omit',headers:{apikey:c.anonKey,...(c.anonKey.startsWith('sb_')?{}:{Authorization:`Bearer ${c.anonKey}`}),'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)}).then(async r=>{if(!r.ok)throw Error(`cloud_${r.status}`);const t=await r.text();return t?JSON.parse(t):null})}
function cloudRemote(){
 const c=window.ECHO_CLOUD||{},key=teacherKey||studentKey;if(!c.url||!c.anonKey||!key)return null;
 return {name:'lịch sử online',list:()=>cloudRPC('echoprep_list',{p_key:key}),save:teacherMode?null:record=>cloudRPC('echoprep_save',{p_key:key,p_record:record})};
}
const memoryStorage=(()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}})();
const historyStore=EchoHistory.create({storage:teacherMode?memoryStorage:browserStorage,localAPI:window.ECHO_LOCAL_HISTORY===true,remote:cloudRemote(),onChange:updateHistoryStatus});
// A new link is checked once: a wrong or replaced key is forgotten instead of failing every save.
async function checkCloudKey(){
 const key=teacherKey||connectKey;if(!key||!cloudRemote())return;
 try{const role=await cloudRPC('echoprep_whoami',{p_key:key});
  if(role!==(teacherMode?'teacher':'student')){cloudNotice='Link lịch sử online không còn hiệu lực. Hãy xin link mới.';if(!teacherMode){try{browserStorage?.removeItem(CLOUD_KEY)}catch{}}}
  else if(!teacherMode)cloudNotice='Đã bật lịch sử online cho trình duyệt này. Các lượt đã làm đang được gửi lên.';
 }catch{cloudNotice='Chưa kiểm tra được link lịch sử online (mất mạng?).'}
}
function cloudStatusText(){
 const st=historyStore.status();if(cloudNotice&&!st.synced)return cloudNotice;
 if(teacherMode)return st.syncError?'Chưa tải được lịch sử online. Kiểm tra mạng rồi bấm Làm mới.':st.synced?'Chế độ giáo viên · chỉ xem. Bấm vào một lượt để xem bài chữa chi tiết.':'Đang tải lịch sử của học viên…';
 if(!st.remote)return '';
 return st.syncError?'Lịch sử online: chưa kết nối được, các lượt mới vẫn lưu trong trình duyệt và sẽ tự gửi lại.':st.pending?`Lịch sử online: còn ${st.pending} lượt chưa gửi được.`:'Lịch sử online: đã bật · cô giáo xem được các lượt đã nộp.';
}
function getHistory(){return historyStore.list()}
function updateHistoryStatus(){updateTestCounts();renderTestHistory();if(!$('history').hidden)renderHistory();}
async function refreshHistory(){await historyStore.sync();updateHistoryStatus();}
async function saveAttempt(){const record=pendingSave||{highlights:JSON.parse(JSON.stringify(highlights)),module:activeModule,vol:activeVol,timerMode,testId:activeTest,id:crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random(),test:`${moduleName()} - Vol ${activeVol} · Test ${activeTest}`,submittedAt:new Date().toISOString(),elapsed,answers:{...answers},result:JSON.parse(JSON.stringify(result))};
 try{const synced=await historyStore.save(record);pendingSave=synced?null:record;storageNotice=historyStore.status().message;}catch{pendingSave=record;storageNotice='Chưa lưu được lượt này. Hãy thử lưu lại trước khi đóng trang.'}}

const duration=seconds=>[Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(x=>String(x).padStart(2,'0')).join(':');
const audio=$('audio'), labels=['music room','assembly hall','computer room','cloakroom','Head’s office','gym','reception'];
function clock(){
 if(attemptStarted&&!submitted&&!inLibrary&&!timeLimitPending){
  elapsed=Math.max(0,Math.floor((Date.now()-started)/1000));
  if(activeModule==='reading'&&timerMode==='timed'&&elapsed>=READING_TIME_LIMIT)offerTimeLimitChoice();
 }
 $('timer').textContent=timerMode==='timed'&&attemptStarted&&!submitted?duration(Math.max(0,READING_TIME_LIMIT-elapsed)):duration(elapsed);
}
setInterval(clock,1000);
function offerTimeLimitChoice(){
 if(timeLimitPending)return;
 timeLimitPending=true;elapsed=READING_TIME_LIMIT;
 // The deadline choice takes precedence over a pending submit/leave confirmation.
 for(const id of ['confirm','abort-dialog','restart-dialog'])if($(id).open)$(id).close();
 pendingTest=null;pendingRetry=null;
 $('time-limit-progress').textContent=`Bạn đã trả lời ${Object.values(answers).filter(Boolean).length}/40 câu.`;
 $('time-limit-dialog').showModal();$('time-limit-title').focus();
}
$('time-limit-dialog').addEventListener('cancel',event=>event.preventDefault());
$('time-limit-dialog').addEventListener('keydown',event=>{if(event.key==='Escape')event.preventDefault();});
$('time-limit-continue').onclick=()=>{
 if(!timeLimitPending||submitted)return;
 timerMode='elapsed';timeLimitPending=false;elapsed=READING_TIME_LIMIT;
 // Exclude time spent deciding; count up from exactly 60 minutes.
 started=Date.now()-READING_TIME_LIMIT*1000;
 $('time-mode').value='elapsed';$('time-limit-dialog').close();clock();
};
$('time-limit-submit').onclick=()=>finishAttempt(true);
function count(){const n=Object.values(answers).filter(Boolean).length;$('answered').textContent=`${n} / 40`;$('progress').style.width=`${n/40*100}%`;document.querySelectorAll('[data-jump]').forEach(b=>{const q=+b.dataset.jump;b.classList.toggle('filled',!!answers[q]);b.classList.toggle('current',q===currentQuestion);b.classList.toggle('flagged',flagged.has(q));if(q===currentQuestion)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');if(result)b.classList.add(result.rows[q-1].status)});if($('review-flag')){$('review-flag').checked=flagged.has(currentQuestion);$('review-flag').disabled=submitted;}}
// Exam-style navigation state: the question being worked on and questions marked with Review.
let currentQuestion=1;const flagged=new Set();
function setCurrentQuestion(n){if(!Number.isInteger(n)||n<1||n>40)return;currentQuestion=n;count();}
function options(q,multi=false){return `<div class="choice-block" id="q${q.n}"><h3><span class="qnum">${multi?q.n+'–'+(q.n+choiceSize(q)-1):q.n}</span>${esc(q.prompt)}</h3>${multi?`<p class="instruction">Choose ${choiceSize(q)===3?'THREE':'TWO'} correct answers.</p>`:''}${q.options.map((t,i)=>{const l=q.values?.[i]||String.fromCharCode(65+i);const checked=multi?Array.from({length:choiceSize(q)},(_,j)=>answers[q.n+j]).includes(l):answers[q.n]===l;return `<label class="choice"><input type="${multi?'checkbox':'radio'}" name="q${q.n}" data-choice="${q.n}" data-multi="${multi}" value="${l}" ${checked?'checked':''} ${submitted?'disabled':''}>${q.values?'':`<span class="letter">${l}</span>`}${esc(t)}</label>`}).join('')}</div>`}
function updateTestSelection(){document.querySelectorAll('[data-start-test]').forEach(el=>{const selected=!inLibrary&&+el.dataset.startTest===activeTest&&(el.dataset.module||'listening')===activeModule;el.classList.toggle('test-selected',selected);if(el.closest('aside')){el.style.background=selected?'#e3ecff':'#ffffff';el.style.color=selected?'#1d4ed8':'#64748b';el.style.borderColor=selected?'#8eaeff':'#dce3ed';el.style.fontWeight=selected?'700':'500';el.style.boxShadow=selected?'inset 3px 0 0 #1d4ed8':'none';}if(selected)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});}
function render(){
 renderMenu();updateTestSelection();
 const ready=!attemptStarted&&!submitted&&!inLibrary;$('start-panel').hidden=!ready;$('review-shell').hidden=ready;$('paper').hidden=ready;document.body.classList.toggle('ready-mode',ready);document.querySelector('.audio-player').hidden=ready;$('questions').hidden=ready;renderTestHistory();
 $('source-notes').innerHTML=(TEST.sourceNotes||[]).map(t=>'<p>'+esc(t)+'</p>').join('');$('source-notes').hidden=!(TEST.sourceNotes||[]).length;
 $('explanation-sheet').hidden=true;document.body.classList.toggle('reading-mode',activeModule==='reading'&&!ready);$('start-description').textContent=activeModule==='reading'?'Chọn chế độ thời gian, rồi bắt đầu đọc và trả lời.':'Chọn file nghe khi sẵn sàng, rồi bắt đầu làm bài.';$('time-mode-label').hidden=activeModule!=='reading';$('time-mode').value=timerMode;
 let body=TEST.sections[section-1].html;
 if(isVol9Test1()&&section===3)body='<p class="subheading">Questions 21–24</p><p class="instruction">Choose the correct answer.</p><h2>Forensic Linguistics</h2>'+TEST.singles.map(q=>options(q)).join('')+TEST.pairs.map(q=>options(q,true)).join('');
 if(isVol9Test1()&&section===2)body+=`<div class="map-layout"><div class="map"><img src="Listening%20-%20Vol%209/Test%201/plan.png" alt="Original Spring Down Junior School plan. Question 18 is right of the main entrance, 19 is left of the classrooms, 20 is next to the main hall.">${[18,19,20].map(n=>`<label class="map-slot slot${n}" data-drop="${n}" id="q${n}"><span>${n}</span><select data-q="${n}" aria-label="Câu ${n}" ${submitted?'disabled':''}><option value="">Chọn</option>${labels.map((t,i)=>`<option value="${String.fromCharCode(65+i)}">${String.fromCharCode(65+i)}</option>`).join('')}</select></label>`).join('')}</div><div class="bank"><p>Kéo đáp án vào ô trên sơ đồ, hoặc chọn chữ cái.</p>${labels.map((t,i)=>`<button class="token" draggable="${!submitted}" data-token="${String.fromCharCode(65+i)}" ${submitted?'disabled':''}><b>${String.fromCharCode(65+i)}</b> ${esc(t)}</button>`).join('')}</div></div>`;
 body=body.replace(/<div data-render-choice="(\d+)"><\/div>/g,(_,n)=>options(TEST.singles.find(q=>q.n===+n)));
 body=body.replace(/<div data-render-pair="(\d+)"><\/div>/g,(_,n)=>options(TEST.pairs.find(q=>q.n===+n),true));
 $('breadcrumb').textContent=`${moduleName()} - Vol ${activeVol} / Test ${activeTest}`;document.querySelector('.test-heading .pill').textContent=`Vol ${activeVol}`;document.querySelector('.test-heading h1').textContent=`${moduleName()} Test ${activeTest}`;document.querySelector('#restart-dialog h2').textContent=`Làm lại Test ${activeTest}?`;
 $('paper').innerHTML=body;enhancePaper();
 renderPassage();renderPartBanner();
 document.body.classList.toggle('exam-mode',attemptStarted&&!submitted&&!inLibrary);
 {const [first,last]=groups()[section-1];if(currentQuestion<first||currentQuestion>last)currentQuestion=first;}
 document.querySelectorAll('[data-q]').forEach(el=>{el.value=answers[el.dataset.q]||'';el.disabled=submitted;el.id=el.id||`q${el.dataset.q}`;el.addEventListener('input',()=>{answers[el.dataset.q]=el.value;document.querySelectorAll(`[data-q="${el.dataset.q}"]`).forEach(other=>other.value=el.value);syncGrid(el.dataset.q);count()})});
 document.querySelectorAll('#paper [data-grid]').forEach(el=>{el.checked=answers[el.dataset.grid]===el.value;el.disabled=submitted;el.addEventListener('change',()=>{const n=el.dataset.grid;answers[n]=el.value;document.querySelectorAll(`[data-q="${n}"]`).forEach(other=>other.value=el.value);setCurrentQuestion(+n)})});
 document.querySelectorAll('#paper input.gap').forEach(el=>{el.placeholder=el.dataset.q});
 document.querySelectorAll('[data-choice]').forEach(el=>el.addEventListener('change',()=>{const n=+el.dataset.choice;if(el.dataset.multi==='true'){const values=[...document.querySelectorAll(`[data-choice="${n}"]:checked`)].map(x=>x.value);const size=choiceSize(TEST.pairs.find(p=>p.n===n));if(values.length>size){el.checked=false;return}for(let i=0;i<size;i++)answers[n+i]=values[i]||''}else answers[n]=el.value;count()}));
 document.querySelectorAll('[data-token]').forEach(el=>{el.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',el.dataset.token));el.addEventListener('click',()=>{chosen=el.dataset.token;document.querySelectorAll('[data-token]').forEach(x=>x.classList.toggle('selected',x===el))})});
 document.querySelectorAll('[data-drop]').forEach(el=>{el.addEventListener('dragover',e=>{if(!submitted)e.preventDefault()});const set=v=>{if(submitted)return;const select=el.querySelector('select');if(![...select.options].some(o=>o.value===v))return;answers[el.dataset.drop]=v;select.value=v;document.querySelectorAll(`[data-q="${el.dataset.drop}"]`).forEach(other=>other.value=v);currentQuestion=+el.dataset.drop;count()};el.addEventListener('drop',e=>{e.preventDefault();set(e.dataTransfer.getData('text/plain'))});el.addEventListener('click',e=>{if(e.target.tagName!=='SELECT'&&chosen)set(chosen)})});
 $('questions').innerHTML=`<label class="review-flag" title="Đánh dấu câu hiện tại để xem lại"><input type="checkbox" id="review-flag"> Review</label><div class="question-parts">${groups().map(([first,last],i)=>`<div class="question-group ${i+1===section?'active':''}" role="group" aria-label="Part ${i+1}" data-group="${i+1}"><span class="part-label">Part ${i+1}</span>${Array.from({length:last-first+1},(_,j)=>`<button data-jump="${first+j}" aria-label="Câu ${first+j}">${first+j}</button>`).join('')}</div>`).join('')}</div><div class="nav-arrows"><button type="button" id="nav-prev" aria-label="Câu trước">&#8592;</button><button type="button" id="nav-next" aria-label="Câu sau">&#8594;</button></div>`;count();
 if(submitted){
  document.querySelectorAll('#paper [data-q]').forEach(el=>{el.closest('p,.grid-label')?.insertAdjacentHTML('beforeend',explanationButton(+el.dataset.q))});
  document.querySelectorAll('#paper .choice-block').forEach(el=>{const n=+el.id.slice(1);el.insertAdjacentHTML('beforeend',Array.from({length:TEST.pairs.some(p=>p.n===n)?choiceSize(TEST.pairs.find(p=>p.n===n)):1},(_,i)=>explanationButton(n+i)).join(''))});
  if(isVol9Test1()&&section===2)$('paper').insertAdjacentHTML('beforeend','<div class="map-explanations">'+[18,19,20].map(explanationButton).join('')+'</div>');
 }
 renderReview();
 EchoHighlight.apply($('paper'),highlights[section]||{});
 $('finish').textContent=TEST.hasAnswerKey===false?'Lưu bài làm':'Chấm kết quả';renderAudioStatus();$('submit').disabled=submitted||!attemptStarted;$('submit').hidden=!attemptStarted&&!submitted;$('abort-attempt').hidden=submitted;
 if(result)document.querySelectorAll('[data-q]').forEach(el=>el.classList.add(result.rows[el.dataset.q-1].status));
}
function change(n){chosen='';selectedQuestion=null;$('explanation-sheet').hidden=true;section=n;render();$('paper').scrollTop=0;$('transcript-body').scrollTop=0;}
function rememberAudioPosition(){
 if(activeModule==='listening'&&sources[audioSection]&&audio.getAttribute('src')===sources[audioSection]&&audio.readyState>=1&&Number.isFinite(audio.currentTime))positions[audioSection]=audio.currentTime;
}
// Tests with audio on the site (Vol 8) fill any section the learner has not replaced with a local file.
function withHostedAudio(){for(const [n,src] of Object.entries(TEST.audio||{}))if(!sources[n])sources[n]=encodeURI(src);}
const isHosted=n=>!!sources[n]&&!sources[n].startsWith('blob:');
// Exam-style playback: when a Part ends during an attempt, the next Part starts (and the questions follow if they were on the Part that ended).
audio.addEventListener('ended',()=>{
 if(!$('continuous').checked||activeModule!=='listening'||inLibrary||!attemptStarted||submitted||reviewingId)return;
 const prev=audioSection;if(prev>=4){$('audio-status').textContent='Đã nghe hết Part 4. Kiểm tra lại đáp án rồi nộp bài.';return;}
 if(!sources[prev+1])return;
 positions[prev]=0;audioSection=prev+1;positions[audioSection]=0;
 if(section===prev)change(audioSection);
 loadAudio();audio.play().catch(()=>{});
});
function unloadAudio(){audio.pause();audio.onloadedmetadata=null;audio.removeAttribute('src');audio.load();}
function renderAudioStatus(){
 $('audio-title').textContent=`Audio · Section ${audioSection}`;$('audio-section').value=String(audioSection);
 $('audio-viewing').hidden=section===audioSection||activeModule!=='listening';$('audio-viewing').textContent=`Đang xem câu hỏi Section ${section}`;
 $('files').closest('label').hidden=!!TEST.audio;$('continuous').closest('label').hidden=activeModule!=='listening';
 $('audio-status').textContent=isHosted(audioSection)?`Audio Part ${audioSection} có sẵn trên web.${$('continuous').checked?' Phát liên tục Part 1 → 4 như thi thật.':''}`:sources[audioSection]?`Audio Section ${audioSection} đã sẵn sàng. Chuyển câu hỏi không làm gián đoạn bài nghe.`:`Chưa chọn audio Section ${audioSection}. Chọn file ${audioFileHint(audioSection)} từ máy.`;
}
function loadAudio(){
 if(activeModule!=='listening'){if(audio.hasAttribute('src'))unloadAudio();return;}
 const source=sources[audioSection];renderAudioStatus();
 // Re-rendering questions/history must never reload or seek the active recording.
 if(source&&audio.getAttribute('src')===source)return;
 if(!source){if(audio.hasAttribute('src'))unloadAudio();return;}
 audio.pause();audio.src=source;
 audio.onloadedmetadata=()=>{audio.currentTime=Math.min(positions[audioSection]||0,Number.isFinite(audio.duration)?audio.duration:Infinity);audio.playbackRate=+$('speed').value;};
}
$('audio-section').onchange=()=>{rememberAudioPosition();audio.pause();audioSection=+$('audio-section').value;loadAudio();};
$('questions').addEventListener('change',e=>{if(e.target.id!=='review-flag')return;if(e.target.checked)flagged.add(currentQuestion);else flagged.delete(currentQuestion);count();});
$('paper').addEventListener('focusin',e=>{const el=e.target.closest?.('[data-q],[data-choice],[data-grid]');if(el)setCurrentQuestion(+(el.dataset.q||el.dataset.grid||el.dataset.choice));});
function jumpTo(n){document.querySelector(`[data-jump="${n}"]`)?.click();}
$('questions').addEventListener('click',e=>{if(e.target.closest('#nav-prev')){jumpTo(Math.max(1,currentQuestion-1));return}if(e.target.closest('#nav-next')){jumpTo(Math.min(40,currentQuestion+1));return}const b=e.target.closest('[data-jump]');if(!b)return;const n=+b.dataset.jump,s=questionSection(n);currentQuestion=n;count();if(s!==section)change(s);const id=questionBase(n);const el=$('q'+id);el?.scrollIntoView({behavior:'smooth',block:'center'});if(el?.matches('input,select'))el.focus({preventScroll:true});if(submitted)showExplanation(n)});
$('files').addEventListener('change',e=>{const files=[...e.target.files];let assigned=0;files.forEach(f=>{const match=audioFileSection(f.name);if(match?.test&&match.test!==activeTest)return;let n=match?match.section:files.length===1?audioSection:null;if(!n)return;if(sources[n]?.startsWith('blob:'))URL.revokeObjectURL(sources[n]);positions[n]=0;sources[n]=URL.createObjectURL(f);assigned++});loadAudio();if(!assigned)$('audio-status').textContent=`Chọn từng file để gán cho section đang chọn trên thanh nghe, hoặc dùng tên ${audioFileHint(1)} … ${audioFileHint(4)}.`});
$('speed').onchange=()=>audio.playbackRate=+$('speed').value;$('back5').onclick=()=>audio.currentTime=Math.max(0,audio.currentTime-5);$('forward5').onclick=()=>{if(Number.isFinite(audio.duration))audio.currentTime=Math.min(audio.duration,audio.currentTime+5)};
audio.onerror=()=>{if(audio.hasAttribute('src'))$('audio-status').textContent=isHosted(audioSection)?`Không tải được audio Part ${audioSection}. Kiểm tra kết nối mạng rồi bấm phát lại.`:`Không phát được audio Section ${audioSection}. Hãy chọn lại file nghe cho section này.`};
$('submit').onclick=()=>{if(!attemptStarted||submitted)return;clock();if(timeLimitPending)return;$('confirm-text').textContent=`Bạn đã trả lời ${Object.values(answers).filter(Boolean).length}/40 câu. ${TEST.hasAnswerKey===false?'Lưu bài làm để xem lại; chưa chấm đúng/sai do chưa có đáp án nguồn.':'Nộp bài để xem đúng, sai và đáp án.'}`;$('confirm').showModal()};$('cancel').onclick=()=>$('confirm').close();
function explanationButton(n){return `<button class="explanation-button" data-explain="${n}">Xem giải thích · Câu ${n}</button>`}
function renderReview(){
 document.body.classList.toggle('review-mode',submitted&&!$('paper').hidden);
 $('transcript-pane').hidden=activeModule==='reading'?(!attemptStarted&&!submitted):!submitted;$('review-toolbar').hidden=!submitted;
 if(!submitted){$('explanation-sheet').hidden=true;return}
 if(activeModule!=='reading')renderPassage();
 $('review-toolbar').innerHTML=`<strong>${TEST.hasAnswerKey===false?'Chưa có đáp án nguồn':result.correct+'/40 đúng'}</strong><span>${TEST.hasAnswerKey===false?'Đã trả lời: '+(40-result.blank)+'/40 · Chưa chấm':'Sai: '+result.wrong+' · Bỏ qua: '+result.blank}</span><button id="results-toggle">Bảng kết quả</button><button id="review-retry">Làm lại</button>${pendingSave?'<button id="retry-save">Lưu lại lịch sử</button>':''}${reviewBackup?'<button id="review-return">Trở về lượt hiện tại</button>':''}`;
 $('results-toggle').onclick=()=>{const show=$('results').hidden;$('results').hidden=!show;$('review-shell').hidden=show;$('results-toggle').textContent=show?'Transcript & câu hỏi':'Bảng kết quả'};
 if($('retry-save'))$('retry-save').onclick=async()=>{await saveAttempt();renderReview();renderResults();};
 $('review-retry').onclick=()=>$('restart-dialog').showModal();if($('review-return'))$('review-return').onclick=returnCurrent;
 document.querySelectorAll('#paper [data-q]').forEach(el=>{
  const n=+el.dataset.q,row=result.rows[n-1], container=el.closest('p,.grid-label,.map-slot');
  container.classList.add('review-question');container.dataset.reviewQuestion=n;if(el.previousElementSibling?.classList.contains('qnum'))el.previousElementSibling.dataset.reviewQuestion=n;
  const correctLetters=(TEST.answers[n]||[]).flatMap(v=>v.split('/'));document.querySelectorAll(`#paper [data-grid="${n}"]`).forEach(radio=>{radio.closest('td').classList.toggle('correct-cell',correctLetters.includes(radio.value));radio.closest('td').classList.toggle('wrong-cell',radio.checked&&!correctLetters.includes(radio.value)&&TEST.hasAnswerKey!==false)});
  if(el.closest('p,.grid-label'))el.insertAdjacentHTML('afterend',`<span class="answer-correction ${row.status}">${row.status==='correct'?'✓':row.status==='unchecked'?' · Chưa có đáp án nguồn':' → '+esc(row.expected)}</span>`);
 });
 document.querySelectorAll('#paper .choice-block').forEach(el=>{const n=+el.id.slice(1);el.dataset.reviewQuestion=n;el.classList.add('review-question');const rows=result.rows.slice(n-1,TEST.pairs.some(p=>p.n===n)?n-1+choiceSize(TEST.pairs.find(p=>p.n===n)):n);el.insertAdjacentHTML('beforeend',`<div class="choice-feedback">${rows.map(r=>`<span class="answer-correction ${r.status}">Câu ${r.n}: ${esc(r.value)||'—'} → <strong>${esc(r.expected)}</strong> ${r.status==='correct'?'✓':r.status==='unchecked'?'?':'✕'}</span>`).join('')}</div>`);const correct=(TEST.answers[n]||[]).flatMap(v=>v.split('/'));el.querySelectorAll('.choice').forEach(label=>{const input=label.querySelector('input');if(correct.includes(input.value))label.classList.add('correct-option');else if(input.checked&&TEST.hasAnswerKey!==false)label.classList.add('wrong-option')})});
}
function showExplanation(n,opts={}){
 if(!submitted)return;
 const targetSection=questionSection(n);if(section!==targetSection)change(targetSection);
 $('results').hidden=true;$('review-shell').hidden=false;$('results-toggle').textContent='Bảng kết quả';
 selectedQuestion=n;$('explanation-title').textContent=`Câu ${n} · Giải thích đáp án`;
 const row=result.rows[n-1];const ids=TEST.questionSegments[n]||[];
 $('explanation-content').innerHTML=`<div class="explanation-answer"><p>Bạn trả lời: <strong>${esc(row.value)||'—'}</strong></p><p>Đáp án: <strong>${esc(row.expected)}</strong></p></div>`+(TEST.explanations[n]||`<p class="source-note">${activeModule==='reading'?'File gốc chưa có lời giải riêng cho câu này.':'File gốc chưa có lời giải riêng cho câu này.'} ${ids.length?'Đoạn liên quan đã được đánh dấu bên trái.':'Bạn có thể đối chiếu toàn bộ nội dung bên trái; chưa có vị trí bằng chứng được xác nhận cho câu này.'}</p>${TEST.transcriptSegments[section].filter(segment=>ids.includes(segment.id)).map(segment=>segment.html).join('')}`);
 if(questionAudioTime(n))$('explanation-content').insertAdjacentHTML('afterbegin',`<button type="button" class="replay-question" data-replay="${n}">▶ Nghe lại đoạn câu ${n}</button>`);
 $('explanation-sheet').hidden=false;$('explanation-content').scrollTop=0;
 document.querySelectorAll('.transcript-segment').forEach(el=>el.classList.toggle('evidence-active',ids.includes(el.id)));
 document.querySelectorAll('[data-review-question]').forEach(el=>el.classList.toggle('question-active',+el.dataset.reviewQuestion===(questionBase(n))));
 const evidence=$(ids[0]);if(evidence){const pane=$('transcript-body');pane.scrollTo({top:Math.max(0,evidence.getBoundingClientRect().top-pane.getBoundingClientRect().top+pane.scrollTop-20),behavior:'auto'})}
 if(opts.play!==false)playQuestionAudio(n);
 const question=$('q'+(questionBase(n)));if(question){const card=question.closest('[data-review-question]')||question,paper=$('paper');paper.scrollTo({top:Math.max(0,paper.scrollTop+card.getBoundingClientRect().top-paper.getBoundingClientRect().top-Math.max(18,(paper.clientHeight-card.offsetHeight)/2)),behavior:'auto'})}
}
// Review: play the recording from where question n is answered (times from scripts/align-audio-times.py).
function questionAudioTime(n){return activeModule==='listening'?(window.AUDIO_TIMES||{})[audioKey()]?.[n]||null:null}
function playQuestionAudio(n){
 const at=questionAudioTime(n);if(!at)return false;const [sec,t]=at;
 if(!sources[sec]){$('audio-status').textContent=`Chọn file nghe Section ${sec} (${audioFileHint(sec)}) để nghe lại đoạn của câu ${n}.`;return false}
 rememberAudioPosition();if(audioSection!==sec){audio.pause();audioSection=sec}
 positions[sec]=t;loadAudio();if(audio.getAttribute('src')===sources[sec]&&audio.readyState>=1)audio.currentTime=t;
 audio.play().catch(()=>{});$('audio-status').textContent=`Đang phát đoạn của câu ${n} (Section ${sec}, từ ${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}).`;return true;
}
$('explanation-close').onclick=()=>{$('explanation-sheet').hidden=true;selectedQuestion=null;};
document.addEventListener('click',e=>{const r=e.target.closest('[data-replay]');if(r){playQuestionAudio(+r.dataset.replay);return}const b=e.target.closest('[data-explain]');if(b&&submitted){showExplanation(+b.dataset.explain);return}const q=e.target.closest('[data-review-question]');if(q&&submitted)showExplanation(+q.dataset.reviewQuestion)});
function showExam(){inLibrary=false;$('library').hidden=true;$('submit').hidden=false;$('abort-attempt').hidden=submitted; $('history').hidden=true;$('review-shell').hidden=false;$('paper').hidden=false;document.querySelector('.test-heading').hidden=false;document.querySelector('footer').hidden=false;$('results').hidden=!result;render();clock();loadAudio();if(result)renderResults();}
function renderResults(){
 $('results').hidden=true;$('results').innerHTML=`<div class="result-heading"><div><div class="eyebrow">${reviewingId?'XEM LẠI LƯỢT ĐÃ LÀM':'KẾT QUẢ LÀM BÀI'}</div><h2>${TEST.hasAnswerKey===false?'Đã nộp bài':result.correct+'<span> / 40 câu đúng</span>'}</h2></div><p>Thời gian: ${esc(duration(elapsed))}</p></div><div class="stats"><div><strong>${TEST.hasAnswerKey===false?'—':result.correct}</strong>Đúng</div><div><strong>${TEST.hasAnswerKey===false?'—':result.wrong}</strong>Sai</div><div><strong>${result.blank}</strong>Bỏ qua</div></div>${storageNotice?`<p class="storage-notice" role="status">${esc(storageNotice)}</p>`:''}<div class="actions"><button id="review">Xem lại câu hỏi</button><button id="restart">Làm lại</button><button id="results-history">Lịch sử làm bài</button>${reviewBackup?'<button id="return-current">Trở về lượt hiện tại</button>':''}</div><div class="table-scroll"><table><thead><tr><th>Câu</th><th>Bạn trả lời</th><th>Đáp án</th><th>Kết quả</th><th>Chữa bài</th></tr></thead><tbody>${result.rows.map(r=>`<tr class="${r.status}"><td>${r.n}</td><td>${esc(r.value)||'—'}</td><td>${esc(r.expected)}</td><td>${r.status==='correct'?'Đúng':r.status==='wrong'?'Sai':r.status==='unchecked'?'Chưa chấm':'Bỏ qua'}</td><td>${explanationButton(r.n)}</td></tr>`).join('')}</tbody></table></div>`;
 $('review').onclick=()=>{$('results').hidden=true;$('review-shell').hidden=false;};$('restart').onclick=()=>$('restart-dialog').showModal();$('results-history').onclick=showHistory;if($('return-current'))$('return-current').onclick=returnCurrent;
}
function showHistory(){
 $('part-banner').hidden=true;document.body.classList.remove('exam-mode');closeHighlightMenu();$('source-notes').hidden=true;
 $('start-panel').hidden=true;$('test-history').hidden=true;document.body.classList.remove('ready-mode');
 $('library').hidden=true;
 document.body.classList.remove('review-mode','reading-mode');$('review-shell').hidden=true;$('review-toolbar').hidden=true;rememberAudioPosition();audio.pause();$('paper').hidden=true;$('results').hidden=true;document.querySelector('.test-heading').hidden=true;document.querySelector('footer').hidden=true;$('history').hidden=false;
 renderHistory();refreshHistory();
}

function renderTestHistory(){
 const panel=$('test-history');
 panel.hidden=$('start-panel').hidden||!$('history').hidden||inLibrary;
 if(panel.hidden)return;
 const records=getHistory().filter(r=>(r.module||'listening')===activeModule&&+(r.vol||9)===activeVol&&+(r.testId||1)===activeTest)
  .sort((a,b)=>new Date(b.submittedAt)-new Date(a.submittedAt)||b.id.localeCompare(a.id));
 const title=`${moduleName()} Test ${activeTest}`,part=activeModule==='reading'?'Passage':'Section',ranges=groups();
 const date=new Intl.DateTimeFormat('vi-VN',{dateStyle:'short',timeStyle:'medium',timeZone:'Asia/Ho_Chi_Minh'});
 // Read the saved grading snapshot, so existing attempts need no migration or regrading.
 const score=(record,first=1,last=40)=>{
  const rows=record.result.rows.filter(row=>row.n>=first&&row.n<=last);
  if(record.result.gradedTotal===0||rows.some(row=>row.status==='unchecked'))return '<span class="test-history-ungraded">Chưa chấm</span>';
  return `<strong>${rows.filter(row=>row.status==='correct').length}</strong><span>/${last-first+1}</span>`;
 };
 panel.innerHTML=`<div class="test-history-heading"><div><h2 id="test-history-title">Lịch sử · ${title}</h2><p>${records.length?`${records.length} lượt đã nộp · Mới nhất ở trên cùng`:'Các lượt đã nộp của bài này sẽ xuất hiện tại đây.'}</p></div><button id="test-history-refresh">Làm mới</button></div>${records.length?`
  <div class="table-scroll"><table class="test-history-table"><caption class="sr-only">Kết quả từng lượt làm ${title}</caption><thead><tr><th scope="col">Lượt</th><th scope="col">Thời gian nộp</th><th scope="col">Thời gian làm</th><th scope="col">Tổng đúng</th>${ranges.map((_,i)=>`<th scope="col">${part} ${i+1}</th>`).join('')}<th scope="col">Bài làm</th></tr></thead>
  <tbody>${records.map((r,i)=>`<tr><th scope="row">#${records.length-i}</th><td><time datetime="${esc(r.submittedAt)}">${esc(date.format(new Date(r.submittedAt)))}</time></td><td>${duration(r.elapsed)}</td><td class="test-history-total">${score(r)}</td>${ranges.map(([first,last])=>`<td class="test-history-score">${score(r,first,last)}</td>`).join('')}<td><button data-test-history-view="${esc(r.id)}" aria-label="Xem lại ${title}, lượt ${records.length-i}">Xem lại</button></td></tr>`).join('')}</tbody></table></div>`:
  `<div class="test-history-empty"><p>Chưa có lượt làm nào cho <strong>${title}</strong>.</p><p>Bấm Bắt đầu làm bài và nộp bài để lưu kết quả đầu tiên.</p></div>`}`;
 $('test-history-refresh').onclick=refreshHistory;
 panel.onclick=event=>{const button=event.target.closest('[data-test-history-view]');if(button)openAttemptReview(button.dataset.testHistoryView);};
}

function renderHistory(){
 const records=getHistory().filter(r=>teacherMode||(r.module||'listening')===activeModule&&+(r.vol||9)===activeVol).slice().reverse();$('history').innerHTML=`<div class="history-heading"><div><div class="eyebrow">${teacherMode?'TẤT CẢ BÀI · LISTENING & READING':`${moduleName().toUpperCase()} · VOL ${activeVol}`}</div><h1>${teacherMode?'Lịch sử làm bài của học viên':'Lịch sử làm bài'}</h1></div><button id="history-refresh">Làm mới</button><button id="history-back">${reviewBackup?'Trở về lượt hiện tại':'Trở về bài làm'}</button></div><p class="history-note">${teacherMode?'Mỗi dòng là một lần nộp bài, mới nhất trước.':'Mỗi lần nộp là một lượt riêng. Có thể xem lại đáp án hoặc bắt đầu một lượt mới.'}</p>${cloudStatusText()?`<p class="cloud-status${historyStore.status().syncError?' cloud-error':''}" role="status">${esc(cloudStatusText())}</p>`:''}${records.length?`<div class="table-scroll"><table class="history-table"><thead><tr><th>Bài / Lượt</th><th>Thời gian nộp</th><th>Thời gian làm</th><th>Tổng câu</th><th>Đúng</th><th>Sai</th><th>Bỏ qua</th><th>Tỉ lệ đúng</th><th>Thao tác</th></tr></thead><tbody>${records.map((r,i)=>`<tr><td><strong>${esc(r.test)}</strong><small>Lượt ${records.length-i}</small></td><td>${esc(new Intl.DateTimeFormat('vi-VN',{dateStyle:'short',timeStyle:'medium',timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(r.submittedAt)))}</td><td>${duration(r.elapsed)}</td><td>40</td><td class="score-correct">${r.result.gradedTotal===0?'Chưa chấm':r.result.correct}</td><td class="score-wrong">${r.result.gradedTotal===0?'—':r.result.wrong}</td><td>${r.result.blank}</td><td>${r.result.gradedTotal===0?'—':r.result.correct/40*100+'%'}<div class="progress"><i style="width:${r.result.correct/40*100}%"></i></div></td><td><div class="history-actions"><button data-history-view="${esc(r.id)}">Xem lại</button><button data-history-retry="${esc(r.id)}">Làm lại</button></div></td></tr>`).join('')}</tbody></table></div>`:`<div class="history-empty"><h2>Chưa có lượt làm nào</h2><p>Nộp một bài ${moduleName()} Vol ${activeVol} để lưu kết quả đầu tiên.</p></div>`}`;
 $('history-refresh').onclick=refreshHistory;
 $('history-back').onclick=reviewBackup?returnCurrent:inLibrary?showLibrary:showExam;
 $('history').onclick=e=>{const view=e.target.closest('[data-history-view]'),retry=e.target.closest('[data-history-retry]');if(retry){const r=getHistory().find(x=>x.id===retry.dataset.historyRetry);pendingRetry={id:r?.testId||1,module:r?.module||'listening',vol:+(r?.vol||9)};$('restart-dialog').showModal();return}if(view)openAttemptReview(view.dataset.historyView);};
}
function openAttemptReview(id){const r=getHistory().find(x=>x.id===id);if(!r)return;rememberAudioPosition();audio.pause();if(!reviewBackup)reviewBackup={activeModule,activeVol,timerMode,highlights,attemptStarted,activeTest,inLibrary,sources,positions,section,audioSection,answers:{...answers},submitted,result,started,elapsed,reviewingId,storageNotice};unloadAudio();audioByTest[audioKey()]=sources;activeModule=r.module||'listening';activeVol=+(r.vol||9);timerMode=r.timerMode||'elapsed';activeTest=r.testId||1;sources=audioByTest[audioKey()]||{};positions={};audioSection=1;TEST=catalog[activeModule][activeVol][activeTest];withHostedAudio();highlights=JSON.parse(JSON.stringify(r.highlights||{}));answers={...r.answers};result=JSON.parse(JSON.stringify(r.result));elapsed=r.elapsed;submitted=true;attemptStarted=true;reviewingId=r.id;storageNotice='';section=1;showExam();
}
function returnCurrent(){if(reviewBackup){unloadAudio();({activeModule,activeVol,timerMode,highlights,attemptStarted,activeTest,inLibrary,sources,positions,section,audioSection,answers,submitted,result,started,elapsed,reviewingId,storageNotice}=reviewBackup);reviewBackup=null;TEST=catalog[activeModule][activeVol][activeTest];}if(inLibrary)showLibrary();else{showExam();loadAudio();}}
$('history-open').onclick=showHistory;
async function finishAttempt(fromTimeLimit=false){
 if(submitted||!attemptStarted||(fromTimeLimit&&!timeLimitPending))return;
 if(!fromTimeLimit){clock();if(timeLimitPending)return;}
 $('confirm').close();$('time-limit-dialog').close();timeLimitPending=false;submitted=true;
 rememberAudioPosition();audio.pause();result=EchoGrade.grade(answers,TEST.answers,TEST.grading);await saveAttempt();
 section=1;selectedQuestion=null;showExam();
}
$('finish').onclick=()=>finishAttempt();
function clearAttempt(){closeHighlightMenu();flagged.clear();currentQuestion=1;timeLimitPending=false;$('time-limit-dialog').close();chosen='';unloadAudio();audioSection=1;highlights={};attemptStarted=false;answers={};result=null;submitted=false;started=Date.now();elapsed=0;positions={};reviewingId=null;reviewBackup=null;storageNotice='';pendingSave=null;section=1;selectedQuestion=null;$('explanation-sheet').hidden=true;$('results').hidden=true;}
function startTest(selection){const id=typeof selection==='object'?selection.id:selection,nextModule=typeof selection==='object'?selection.module:activeModule,nextVol=typeof selection==='object'?+(selection.vol||9):activeVol;clearAttempt();const nextKey=`${nextModule}:${nextVol}:${id}`;if(audioKey()!==nextKey){audioByTest[audioKey()]=sources;sources=audioByTest[nextKey]||{};}activeModule=nextModule;activeVol=nextVol;timerMode='elapsed';activeTest=id;TEST=catalog[activeModule][activeVol][id];withHostedAudio();inLibrary=false;pendingRetry=null;pendingTest=null;showExam();clock();$('paper').scrollTop=0;$('transcript-body').scrollTop=0;window.scrollTo({top:0});}
function showLibrary(){$('part-banner').hidden=true;document.body.classList.remove('exam-mode');closeHighlightMenu();$('source-notes').hidden=true;audio.pause();renderMenu();inLibrary=true;$('start-panel').hidden=true;$('test-history').hidden=true;document.body.classList.remove('ready-mode');updateTestSelection();document.body.classList.remove('review-mode','reading-mode');$('library').hidden=false;$('review-shell').hidden=true;$('review-toolbar').hidden=true;$('paper').hidden=true;$('results').hidden=true;$('history').hidden=true;document.querySelector('.test-heading').hidden=true;document.querySelector('footer').hidden=true;$('submit').hidden=true;$('abort-attempt').hidden=true;}
function navigateSelection(selection){if(selection?.view==='collocations'){location.assign('collocations.html');}else if(selection)startTest(selection);else showLibrary();}
function requestLeave(testId=null){pendingTest=testId;if(attemptStarted&&!submitted&&!inLibrary){$('abort-dialog').showModal();}else navigateSelection(testId);}
function captureKeywords(root,key){if(!attemptStarted||submitted||inLibrary)return false;const current=highlights[key]||(highlights[key]={});return EchoHighlight.capture(root,window.getSelection(),current);}
// As in the computer-delivered test: select text, right-click, then choose "Tô vàng" (no highlight on plain selection).
let highlightContext=null;
const highlightKey=root=>root===$('paper')?section:'passage:'+section;
const canHighlight=root=>attemptStarted&&!submitted&&!inLibrary&&(root===$('paper')||activeModule==='reading');
function closeHighlightMenu(){$('highlight-menu').hidden=true;highlightContext=null;}
// Some browsers (Safari, Firefox on some systems) drop the selection when the right button is pressed:
// keep the last text selected in a pane and reuse it when the right-click lands on that text.
let lastSelection=null;
document.addEventListener('selectionchange',()=>{const selection=getSelection();if(!selection.rangeCount||selection.isCollapsed||!selection.toString().trim())return;const range=selection.getRangeAt(0),root=[$('paper'),$('transcript-body')].find(r=>r.contains(range.commonAncestorContainer));if(root)lastSelection={root,range:range.cloneRange()};});
function rememberedSelection(root,x,y){
 if(lastSelection?.root!==root||!root.contains(lastSelection.range.commonAncestorContainer))return null;
 const inside=[...lastSelection.range.getClientRects()].some(r=>x>=r.left-6&&x<=r.right+6&&y>=r.top-6&&y<=r.bottom+6);
 return inside&&lastSelection.range.toString().trim()?lastSelection.range:null;
}
function openHighlightMenu(root,x,y,mark){
 const selection=getSelection();let range=selection.rangeCount&&!selection.isCollapsed?selection.getRangeAt(0):null;
 if(!(range&&root.contains(range.commonAncestorContainer)&&selection.toString().trim())){range=rememberedSelection(root,x,y);if(range){selection.removeAllRanges();selection.addRange(range.cloneRange());}}
 const hasSelection=!!range&&root.contains(range.commonAncestorContainer)&&!!range.toString().trim();
 if(!hasSelection&&!mark)return false;
 const key=highlightKey(root);highlightContext={root,key,range:hasSelection?range.cloneRange():null,mark};
 const menu=$('highlight-menu');menu.querySelector('[data-highlight-action="highlight"]').disabled=!hasSelection;menu.querySelector('[data-highlight-action="clear"]').disabled=!mark;menu.querySelector('[data-highlight-action="clear-all"]').disabled=!root.querySelector('mark.keyword-highlight');
 menu.hidden=false;const box=menu.getBoundingClientRect();menu.style.left=Math.max(4,Math.min(x,innerWidth-box.width-4))+'px';menu.style.top=Math.max(4,Math.min(y,innerHeight-box.height-4))+'px';
 return true;
}
for(const root of [$('paper'),$('transcript-body')])root.addEventListener('contextmenu',e=>{if(!canHighlight(root))return;if(openHighlightMenu(root,e.clientX,e.clientY,e.target.closest?.('mark.keyword-highlight')))e.preventDefault();});
$('highlight-menu').addEventListener('click',e=>{const action=e.target.closest('[data-highlight-action]')?.dataset.highlightAction;const context=highlightContext;if(!action||!context||e.target.closest('button').disabled)return;
 if(action==='highlight'){const selection=getSelection();selection.removeAllRanges();selection.addRange(context.range);captureKeywords(context.root,context.key);lastSelection=null;}
 else if(action==='clear')EchoHighlight.remove(context.root,highlights[context.key]||{},context.mark);
 else {highlights[context.key]={};EchoHighlight.apply(context.root,{});}
 closeHighlightMenu();});
document.addEventListener('mousedown',e=>{if(!$('highlight-menu').hidden&&!e.target.closest('#highlight-menu'))closeHighlightMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('highlight-menu').hidden)closeHighlightMenu();});
for(const pane of [$('paper'),$('transcript-body')])pane.addEventListener('scroll',closeHighlightMenu,{passive:true});
// Touch screens have no right-click: show the same menu under a finished text selection.
let touchSelectionTimer;
if(matchMedia('(pointer: coarse)').matches)document.addEventListener('selectionchange',()=>{clearTimeout(touchSelectionTimer);touchSelectionTimer=setTimeout(()=>{const selection=getSelection();if(!selection.rangeCount||selection.isCollapsed)return;const range=selection.getRangeAt(0);const root=[$('paper'),$('transcript-body')].find(r=>r.contains(range.commonAncestorContainer));if(!root||!canHighlight(root))return;const rect=range.getBoundingClientRect();openHighlightMenu(root,rect.left,rect.bottom+8,null);},450);});
function renderPartBanner(){
 const banner=$('part-banner'),show=(attemptStarted||submitted)&&!inLibrary&&!$('paper').hidden;banner.hidden=!show;if(!show)return;
 const [first,last]=groups()[section-1];banner.innerHTML=`<h2>Part ${section}</h2><p>${activeModule==='reading'?'Read the text below and answer questions':'Listen and answer questions'} <b>${first} – ${last}</b>.</p>`;
}
// Letter-only matching (maps, plans, "Which paragraph…") becomes the exam's A–H answer grid;
// matching with worded options gets drag-and-drop gaps beside the option list. The original select keeps data-q.
function enhancePaper(){
 const paper=$('paper'),runs=[];
 for(const row of paper.querySelectorAll('p.matching-row')){const run=runs.at(-1);if(run&&run.at(-1).nextElementSibling===row)run.push(row);else runs.push([row]);}
 for(const run of runs){
  const bank=run[0].previousElementSibling?.classList.contains('bank')?run[0].previousElementSibling:null;
  const letters=[...run[0].querySelector('select').options].map(o=>o.value).filter(Boolean);
  const lettersOnly=!!bank&&[...bank.querySelectorAll('[data-token]')].every(t=>t.textContent.replace(/\s+/g,'')===t.dataset.token+t.dataset.token);
  // Map/plan labelling: the source image on the left, each place with its number and a letter box on the right.
  const images=[];for(let el=bank?.previousElementSibling;el&&!el.classList.contains('subheading');el=el.previousElementSibling){if(el.matches('img.source-image'))images.unshift(el);else images.unshift(...el.querySelectorAll?.('img.source-image')||[]);}
  if(lettersOnly&&images.length){
   const layout=document.createElement('div');layout.className='map-question';const figure=document.createElement('div');figure.className='map-figure';const list=document.createElement('div');list.className='map-answers';
   bank.before(layout);figure.append(...images);
   for(const row of run){const select=row.querySelector('select'),n=select.dataset.q,label=[...row.childNodes].filter(x=>x.nodeType===3).map(x=>x.textContent).join('').trim();
    row.className='matching-row map-row';row.innerHTML=`<span class="map-place">${esc(label)}</span><span class="qnum map-number">${n}</span>`;select.classList.add('map-select');select.setAttribute('aria-label',`Câu ${n}: ${label}`);row.append(select);list.append(row);}
   layout.append(figure,list);bank.remove();continue;
  }
  if(lettersOnly&&letters.length<=12){
   const table=document.createElement('table');table.className='match-grid';
   table.innerHTML=`<thead><tr><th scope="col"><span class="sr-only">Câu hỏi</span></th>${letters.map(l=>`<th scope="col">${l}</th>`).join('')}</tr></thead><tbody></tbody>`;
   for(const row of run){const select=row.querySelector('select'),n=select.dataset.q,label=[...row.childNodes].filter(x=>x.nodeType===3).map(x=>x.textContent).join('').trim();
    const tr=document.createElement('tr');tr.innerHTML=`<th scope="row" class="grid-label"><span class="qnum">${n}</span>${esc(label)}</th>${letters.map(l=>`<td><input type="radio" name="grid${n}" data-grid="${n}" value="${l}" aria-label="Câu ${n}: ${l}"></td>`).join('')}`;
    select.classList.add('grid-select');select.tabIndex=-1;select.setAttribute('aria-hidden','true');tr.firstElementChild.append(select);table.tBodies[0].append(tr);}
   const wrap=document.createElement('div');wrap.className='table-scroll';wrap.append(table);run[0].before(wrap);run.forEach(r=>r.remove());bank.remove();
  } else if(bank){
   const layout=document.createElement('div');layout.className='drag-layout';const targets=document.createElement('div');targets.className='drag-targets';
   run[0].before(layout);targets.append(...run);layout.append(targets,bank);bank.classList.add('drag-options');
  }
 }
 for(const select of paper.querySelectorAll('.inline-match select,.matching-row select')){if(select.options[0]&&!select.options[0].value)select.options[0].textContent=select.classList.contains('map-select')?'':select.dataset.q;}
}
function syncGrid(n){document.querySelectorAll(`#paper [data-grid="${n}"]`).forEach(radio=>radio.checked=radio.value===answers[n]);}
$('begin-attempt').onclick=()=>{if(attemptStarted||submitted||inLibrary)return;timerMode=activeModule==='reading'?$('time-mode').value:'elapsed';attemptStarted=true;started=Date.now();elapsed=0;render();clock();if(activeModule==='listening'&&$('continuous').checked&&isHosted(1)){audioSection=1;positions[1]=0;loadAudio();if(audio.readyState>=1)audio.currentTime=0;audio.play().catch(()=>{});}};
audio.addEventListener('play',()=>{if(activeModule!=='listening'||inLibrary||(!attemptStarted&&!submitted))audio.pause();});
$('back-library').onclick=()=>requestLeave();$('abort-attempt').onclick=()=>requestLeave();$('abort-continue').onclick=()=>{$('abort-dialog').close();pendingTest=null;};$('abort-confirm').onclick=()=>{const id=pendingTest;$('abort-dialog').close();clearAttempt();pendingTest=null;navigateSelection(id);};
document.addEventListener('click',e=>{const b=e.target.closest('[data-start-test]');if(b){e.preventDefault();requestLeave({id:+b.dataset.startTest,module:b.dataset.module||'listening',vol:+(b.dataset.vol||9)})}});
$('restart-cancel').onclick=()=>{$('restart-dialog').close();pendingRetry=null;};$('restart-confirm').onclick=()=>{$('restart-dialog').close();startTest(pendingRetry||activeTest);};
async function initialize(){const params=new URLSearchParams(location.search);if(params.get('module')==='reading')activeModule='reading';const vol=+params.get('vol');activeVol=vols().includes(vol)?vol:vols()[0];TEST=catalog[activeModule][activeVol][1];render();clock();updateHistoryStatus();if(teacherMode){document.body.classList.add('teacher-mode');showHistory();}await checkCloudKey();await refreshHistory();}
window.addEventListener('online',refreshHistory);
window.addEventListener('focus',()=>{if(!$('history').hidden)refreshHistory()});
setInterval(()=>{if(!document.hidden&&!$('history').hidden)refreshHistory()},30000);

function renderMenu(){
 $('module-menu').innerHTML=['listening','reading'].map(m=>`<button data-module-menu="${m}" class="${m===activeModule?'module-active':''}">${m==='reading'?'Reading':'Listening'}</button>`).join('')+'<button data-collocations-open class="collocations-menu-link">Ôn Collocations</button>';
 const volButtons=vols().map(v=>`<button data-vol-menu="${v}" class="${v===activeVol?'vol-active':''}" aria-pressed="${v===activeVol}">Vol ${v}</button>`).join('');$('vol-menu').innerHTML=volButtons;$('vol-menu').hidden=vols().length<2;
 document.querySelector('aside h2').textContent=moduleName()+' - Vol '+activeVol;
 const cards=Object.keys(catalog[activeModule][activeVol]).map(id=>`<a class="test-active" href="#" data-module="${activeModule}" data-vol="${activeVol}" data-start-test="${id}"><span>${moduleName()} Test ${id}</span><small class="test-attempt-count">Đã làm 0 lần</small><small class="test-latest-result" hidden></small></a>`).join('');$('test-menu').innerHTML=cards;
 $('library').innerHTML=`<div class="eyebrow">${moduleName().toUpperCase()} · VOL ${activeVol}</div><h1>Chọn bài luyện ${activeModule==='reading'?'đọc':'nghe'}</h1>${vols().length>1?`<div class="library-vols" role="group" aria-label="Chọn Vol">${volButtons}</div>`:''}<div class="library-tests">${cards}</div>`;
 document.querySelector('.test-heading .eyebrow').textContent='IELTS '+moduleName().toUpperCase();
 document.querySelector('.local-label').textContent=activeModule==='reading'?'Bôi chọn từ, nhấn chuột phải rồi chọn Tô vàng (bài đọc và câu hỏi).':'Audio được phát trực tiếp từ máy của bạn.';
 updateTestCounts();
}
function updateTestCounts(){
 const stats=new Map();
 for(const record of getHistory()){
  const key=`${record.module||'listening'}:${record.vol||9}:${record.testId||1}`;
  const stat=stats.get(key)||{count:0,latest:null};
  stat.count++;
  if(!stat.latest||Date.parse(record.submittedAt)>=Date.parse(stat.latest.submittedAt))stat.latest=record;
  stats.set(key,stat);
 }
 document.querySelectorAll('[data-start-test]').forEach(card=>{
  const stat=stats.get(`${card.dataset.module||'listening'}:${card.dataset.vol||9}:${card.dataset.startTest}`);
  const label=card.querySelector('.test-attempt-count');
  if(label)label.textContent=`Đã làm ${stat?.count||0} lần`;
  const latest=card.querySelector('.test-latest-result');
  if(latest){
   latest.hidden=!stat?.latest;
   latest.textContent=stat?.latest?(stat.latest.result.gradedTotal===0?'Gần nhất: Chưa chấm':`Gần nhất: ${stat.latest.result.correct}/40 câu đúng`):'';
  }
 });
}
$('module-menu').onclick=e=>{if(e.target.closest('[data-collocations-open]')){requestLeave({view:'collocations'});return;}const b=e.target.closest('[data-module-menu]');if(b&&b.dataset.moduleMenu!==activeModule)requestLeave({id:1,module:b.dataset.moduleMenu,vol:vols(b.dataset.moduleMenu)[0]});};
document.addEventListener('click',e=>{const b=e.target.closest('[data-vol-menu]');if(b&&+b.dataset.volMenu!==activeVol)requestLeave({id:1,module:activeModule,vol:+b.dataset.volMenu});});
// Vol 8 audio is named 1-Topic.mp3 (Test 1), 7-1.mp3 (Tests 2–7) or 81.mp3 (Test 8); Vol 9 uses T3-S1.mp3.
function audioFileSection(name){const base=name.replace(/\.[a-z0-9]+$/i,'');let m=base.match(/(?:T(\d+)[-_ ]?)?S([1-4])\b/i);if(m)return {test:m[1]?+m[1]:null,section:+m[2]};m=base.match(/^(\d)[-_ ]?([1-4])$/);if(m)return {test:+m[1],section:+m[2]};m=base.match(/^([1-4])[-_ ][a-z]/i)||base.match(/\bPart[-_ ]?([1-4])$/i);return m?{test:null,section:+m[1]}:null;}
function audioFileHint(n){return TEST.audioFiles?.[n]||`T${activeTest}-S${n}.mp3`;}
function renderPassage(){
 if(activeModule!=='reading'&&!submitted)return;
 $('transcript-title').textContent=activeModule==='reading'?`Passage ${section} · ${TEST.passages[section-1].title}`:`Transcript · Section ${section}`;
 document.querySelector('.transcript-heading span').textContent=activeModule==='reading'?'Bài đọc gốc':'Đối chiếu bài nghe';
 $('transcript-body').innerHTML=(activeModule==='reading'&&TEST.passages[section-1].subtitle?'<p class="passage-subtitle">'+TEST.passages[section-1].subtitle+'</p>':'')+TEST.transcriptSegments[section].map(segment=>`<div class="transcript-segment" id="${segment.id}">${segment.headingQuestion?`<label class="passage-heading" data-drop="${segment.headingQuestion}">Câu ${segment.headingQuestion} · Heading <select id="heading${segment.headingQuestion}" data-q="${segment.headingQuestion}"><option value="">Chọn heading</option>${(TEST.headingsBySection?.[section]||TEST.headings||[]).map(h=>`<option value="${h.value}">${h.value}. ${esc(h.text)}</option>`).join('')}</select></label>`:''}${segment.html}</div>`).join('');
 if(activeModule==='reading')EchoHighlight.apply($('transcript-body'),highlights['passage:'+section]||{});
}

initialize();
