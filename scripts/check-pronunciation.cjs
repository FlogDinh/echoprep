const assert=require('node:assert/strict'),p=require('../dist/pronunciation.js');
const uk={voiceURI:'uk',name:'Google UK English Female',lang:'en-GB',default:true};
const basic={voiceURI:'basic',name:'Samantha',lang:'en-US'};
const natural={voiceURI:'natural',name:'US Natural Voice',lang:'en-US'};
const google={voiceURI:'google',name:'Google US English',lang:'en-US'};
assert.equal(p.chooseVoice([uk]),undefined); // Never substitute a UK voice for a US request.
assert.equal(p.chooseVoice([uk,basic,natural]).voiceURI,'natural');
assert.equal(p.chooseVoice([uk,basic,natural,google]).voiceURI,'google');
assert.equal(p.chooseVoice([uk,basic,natural,google],'basic').voiceURI,'basic');
assert.equal(p.chooseVoice([uk,basic],'uk').voiceURI,'basic');
assert.deepEqual(p.words('This makes it difficult for residents to access services. This helps residents.'),['This','makes','it','difficult','for','residents','to','access','services','helps']);
assert.deepEqual(p.words('A close-knit community: a community’s support.'),['A','close-knit','community','community’s','support']);
const url=new URL(p.dictionaryURL("community’s"));assert.equal(url.origin,'https://dictionary.cambridge.org');assert.ok(url.pathname.startsWith('/us/dictionary/english/'));assert.equal(decodeURIComponent(url.pathname.split('/').at(-1)),"community's");
console.log('PASS pronunciation: US voice preference, natural/Google ranking, no silent UK fallback, deduplicated word links and safe Cambridge US URLs.');
