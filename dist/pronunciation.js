(function(root){
 'use strict';
 const voiceKey='echoprep:collocations:us-voice:v1',modeKey='echoprep:collocations:pronunciation-mode:v1';
 const read=key=>{try{return root.localStorage?.getItem(key)||'';}catch{return '';}};
 const write=(key,value)=>{try{root.localStorage?.setItem(key,value);}catch{}};
 function usVoices(voices){return voices.filter(voice=>/^en-US(?:-|$)/i.test(voice.lang.replace('_','-')));}
 function chooseVoice(voices,preferred){const us=usVoices(voices);return us.find(v=>v.voiceURI===preferred)||us.find(v=>/Google US English/i.test(v.name))||us.find(v=>/natural|neural|enhanced|premium/i.test(v.name))||us.find(v=>v.default)||us[0];}
 function words(text){const seen=new Set();return (text.match(/[A-Za-z]+(?:['’\-][A-Za-z]+)*/g)||[]).filter(word=>{const key=word.toLowerCase().replaceAll('’',"'");if(seen.has(key))return false;seen.add(key);return true;});}
 function dictionaryURL(word){return 'https://dictionary.cambridge.org/us/dictionary/english/'+encodeURIComponent(word.toLowerCase().replaceAll('’',"'"));}
 const api={voiceKey,modeKey,read,write,usVoices,chooseVoice,words,dictionaryURL};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.EchoPronunciation=api;
})(typeof window==='object'?window:globalThis);
