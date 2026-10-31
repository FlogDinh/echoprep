(function(){
 'use strict';
 const $=id=>document.getElementById(id),types=window.ECHO_COLLOCATIONS.types;
 const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const params=new URLSearchParams(location.search);
 let type=types.find(item=>item.id===params.get('type'))||types.find(item=>item.topics.some(topic=>topic.id===params.get('topic')))||types[0],topic=type.topics.find(item=>item.id===params.get('topic'))||type.topics[0],group='all',cards=[],index=0,flipped=false,mode='flashcard',speechToken=0,utterance=null;
 const pronunciation=window.EchoPronunciation;
 const synth=window.speechSynthesis,speechAvailable=!!synth&&typeof window.SpeechSynthesisUtterance==='function';
 let pronunciationMode=speechAvailable&&pronunciation.read(pronunciation.modeKey)!=='cambridge'?'us':'cambridge',preferredVoice=pronunciation.read(pronunciation.voiceKey);
 const allCards=()=>topic.groups.flatMap(item=>item.cards);
 const groupTitle=id=>{const item=topic.groups.find(item=>item.id===id);return item?`${item.title} · ${item.meaning}`:'';};
 function stopSpeech(){speechToken++;if(speechAvailable)synth.cancel();utterance=null;$('speech-status').textContent='';}
 function speak(card,rate=1){
  stopSpeech();
  if(pronunciationMode==='cambridge')return;
  if(!speechAvailable){$('speech-status').textContent='Trình duyệt này chưa hỗ trợ đọc thành tiếng. Bạn có thể tra phát âm US trên Cambridge bên dưới.';return;}
  const token=speechToken;
  utterance=new SpeechSynthesisUtterance(card.spokenText||card.english);
  const voice=pronunciation.chooseVoice(synth.getVoices(),preferredVoice);
  utterance.lang='en-US';if(voice)utterance.voice=voice;utterance.rate=rate;
  utterance.onstart=()=>{if(token===speechToken)$('speech-status').textContent=`Đang đọc: ${card.spokenText||card.english}`;};
  utterance.onend=()=>{if(token===speechToken){$('speech-status').textContent='';utterance=null;}};
  utterance.onerror=event=>{if(token===speechToken&&!['canceled','interrupted'].includes(event.error)){$('speech-status').textContent='Chưa phát được giọng đọc Anh–Mỹ. Bạn có thể chọn giọng khác hoặc tra âm trên Cambridge.';utterance=null;}};
  try{synth.speak(utterance);}catch{$('speech-status').textContent='Chưa phát được giọng đọc Anh–Mỹ. Bạn có thể chọn giọng khác hoặc tra âm trên Cambridge.';}
 }
 function setSide(back){
  stopSpeech();flipped=back;
  $('card-front').hidden=flipped;$('card-back').hidden=!flipped;$('card-pronunciation').hidden=!flipped||pronunciationMode==='cambridge';$('cambridge-panel').hidden=!flipped;$('flip-help').hidden=flipped;
  $('grammar-notes').hidden=!flipped||!cards[index].rule;
  $('flashcard').dataset.side=flipped?'back':'front';$('flashcard').setAttribute('aria-expanded',String(flipped));
  const card=cards[index];$('flashcard').setAttribute('aria-label',flipped?`${card.spokenText||card.english}. ${card.meaning}. Lật thẻ về mặt cụm tiếng Anh.`:`${card.english}. Lật thẻ để xem nghĩa và phát âm.`);
  if(flipped&&pronunciationMode==='us')speak(card);
 }
 function renderCard(){
  const card=cards[index];if(!card)return;
  $('card-english').textContent=card.english;$('card-back-english').textContent=card.spokenText||card.english;$('card-meaning').textContent=card.meaning;$('card-ipa').textContent=card.ipa;
  $('card-front-label').textContent=card.kind==='grammar'?'CẤU TRÚC NGỮ PHÁP':'CỤM TIẾNG ANH';$('card-back-label').textContent=card.kind==='grammar'?'VÍ DỤ ĐÚNG & PHÁT ÂM':'NGHĨA & PHÁT ÂM';
  $('pronounce').textContent=card.kind==='grammar'?'♪ Nghe ví dụ đúng':'♪ Nghe phát âm';
  $('grammar-notes').innerHTML=grammarNotes(card);$('cambridge-words').innerHTML=dictionaryLinks(card);
  $('card-group').textContent=groupTitle(card.group);$('card-counter').textContent=`Thẻ ${index+1} / ${cards.length}`;
  $('flashcard').dataset.cardId=card.id;
  setSide(false);
 }
 function dictionaryLinks(card){
  return pronunciation.words(card.spokenText||card.english).map(word=>`<a href="${esc(pronunciation.dictionaryURL(word))}" target="_blank" rel="noopener noreferrer" aria-label="Tra ${esc(word)} và nghe US trên Cambridge (mở thẻ mới)">${esc(word)}</a>`).join('');
 }
 function renderVoiceChoices(){
  const voices=speechAvailable?synth.getVoices():[],selected=pronunciation.chooseVoice(voices,preferredVoice);
  $('speech-voice').innerHTML='<option value="">Tự chọn giọng Mỹ</option>'+pronunciation.usVoices(voices).map(voice=>`<option value="${esc(voice.voiceURI)}">${esc(voice.name)} · US</option>`).join('');
  $('speech-voice').value=pronunciation.usVoices(voices).some(v=>v.voiceURI===preferredVoice)?preferredVoice:'';
  $('speech-voice').title=selected?`Giọng tự chọn: ${selected.name}`:'Yêu cầu giọng en-US mặc định của trình duyệt';
 }
 function renderSpeechMode(){
  $('pronunciation-mode').value=pronunciationMode;$('speech-voice-label').hidden=pronunciationMode==='cambridge';
  $('card-pronunciation').hidden=!flipped||pronunciationMode==='cambridge';
  document.querySelectorAll('[data-speak]').forEach(button=>button.hidden=pronunciationMode==='cambridge');
 }
 function grammarNotes(card){
  if(!card.rule)return '';
  return `<h3>Cách dùng đúng</h3><p>${esc(card.rule)}</p><p class="grammar-correct"><strong>Ví dụ đúng:</strong> <span lang="en">${esc(card.spokenText)}</span></p>${card.incorrectExample?`<p class="grammar-incorrect"><strong>Lỗi minh hoạ cần tránh:</strong> <span lang="en">${esc(card.incorrectExample)}</span></p>`:''}${topic.grammarNote?`<p class="grammar-source-note">${esc(topic.grammarNote)}</p>`:''}`;
 }
 function renderList(){
  $('wordlist-title').textContent=topic.groups.some(g=>g.cards.some(c=>c.kind==='grammar'))?'Collocations & ngữ pháp':'Danh sách collocations';
  $('wordlist-count').textContent=`${cards.length} thẻ`;
  $('wordlist-body').innerHTML=cards.map(card=>`<tr><td><span lang="en">${esc(card.english)}</span><small>${esc(groupTitle(card.group))}</small></td><td>${esc(card.meaning)}${card.rule?`<div class="list-grammar-notes">${grammarNotes(card)}</div>`:''}</td><td class="list-ipa" lang="en-GB">${esc(card.ipa)}</td><td><button type="button" data-speak="${esc(card.id)}" aria-label="Nghe phát âm: ${esc(card.spokenText||card.english)}" ${speechAvailable?'':'disabled'} ${pronunciationMode==='cambridge'?'hidden':''}>♪ Nghe</button><details class="list-cambridge"><summary>Cambridge US</summary><div class="cambridge-words">${dictionaryLinks(card)}</div></details></td></tr>`).join('');
 }
 function resetDeck(){cards=allCards().filter(card=>group==='all'||card.group===group);index=0;renderCard();renderList();}
 function selectTopic(id){
  topic=type.topics.find(item=>item.id===id)||type.topics[0];group='all';
  $('topic-title').textContent=topic.title;
  $('topic-description').textContent=`${type.title} · ${allCards().length} thẻ · ${topic.groups.length} nhóm học`;
  $('topic-menu').innerHTML=type.topics.map(item=>`<button type="button" data-topic="${esc(item.id)}" aria-current="${item===topic?'page':'false'}">${esc(item.title)}<small>${item.groups.reduce((n,g)=>n+g.cards.length,0)} thẻ</small></button>`).join('');
  $('colloc-group').innerHTML=`<option value="all">Tất cả nhóm (${allCards().length})</option>`+topic.groups.map(item=>`<option value="${esc(item.id)}">${esc(item.title)} (${item.cards.length})</option>`).join('');
  const url=new URL(location.href);url.searchParams.set('type',type.id);url.searchParams.set('topic',topic.id);history.replaceState(null,'',url);
  resetDeck();
 }
 function setMode(next){
  stopSpeech();mode=next;
  for(const name of ['flashcard','wordlist']){const selected=mode===name;$(name+'-tab').setAttribute('aria-selected',String(selected));$(name+'-tab').tabIndex=selected?0:-1;$(name+'-panel').hidden=!selected;}
 }
 function move(by){index=(index+by+cards.length)%cards.length;renderCard();}
 $('essay-type').innerHTML=types.map(item=>`<option value="${esc(item.id)}">${esc(item.title)}</option>`).join('');
 $('essay-type').value=type.id;
 $('essay-type').onchange=()=>{type=types.find(item=>item.id===$('essay-type').value);selectTopic(type.topics[0].id);};
 $('topic-menu').onclick=event=>{const button=event.target.closest('[data-topic]');if(button)selectTopic(button.dataset.topic);};
 $('colloc-group').onchange=()=>{group=$('colloc-group').value;resetDeck();};
 $('flashcard').onclick=()=>setSide(!flipped);
 $('card-previous').onclick=()=>move(-1);$('card-next').onclick=()=>move(1);
 $('card-shuffle').onclick=()=>{for(let i=cards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}index=0;renderCard();renderList();};
 $('flashcard-tab').onclick=()=>setMode('flashcard');$('wordlist-tab').onclick=()=>setMode('wordlist');
 for(const id of ['flashcard-tab','wordlist-tab'])$(id).onkeydown=event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();setMode(event.key==='Home'?'flashcard':event.key==='End'?'wordlist':mode==='flashcard'?'wordlist':'flashcard');$(mode+'-tab').focus();}};
 $('pronounce').onclick=()=>speak(cards[index]);$('pronounce-slow').onclick=()=>speak(cards[index],0.75);
 for(const id of ['pronounce','pronounce-slow'])$(id).disabled=!speechAvailable;
 $('wordlist-body').onclick=event=>{const button=event.target.closest('[data-speak]');if(button){const card=cards.find(item=>item.id===button.dataset.speak);if(card)speak(card);}};
 document.addEventListener('keydown',event=>{
  if(mode!=='flashcard'||event.altKey||event.ctrlKey||event.metaKey||event.target.closest('input,select,textarea,[role="tablist"],[contenteditable="true"]'))return;
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();move(event.key==='ArrowLeft'?-1:1);}
  else if((event.code==='Space'||event.key===' ')&&!event.target.closest('button,a')){event.preventDefault();setSide(!flipped);}
 });
 $('pronunciation-mode').onchange=()=>{stopSpeech();pronunciationMode=$('pronunciation-mode').value;pronunciation.write(pronunciation.modeKey,pronunciationMode);renderSpeechMode();if(flipped&&pronunciationMode==='us')speak(cards[index]);};
 $('speech-voice').onchange=()=>{preferredVoice=$('speech-voice').value;pronunciation.write(pronunciation.voiceKey,preferredVoice);if(flipped&&pronunciationMode==='us')speak(cards[index]);};
 if(speechAvailable)synth.addEventListener('voiceschanged',renderVoiceChoices);
 window.addEventListener('pagehide',stopSpeech);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSpeech();});
 selectTopic(topic.id);renderVoiceChoices();renderSpeechMode();
 if(!speechAvailable)$('speech-status').textContent='Trình duyệt này chưa hỗ trợ đọc thành tiếng. Bạn có thể tra phát âm US trên Cambridge bên dưới.';
})();
