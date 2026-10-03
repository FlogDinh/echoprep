(function(root){
 const normalize=s=>String(s??'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ').replace(/[’‘]/g,"'");
 function grade(answers,key,config={}){
  const rows=[];
  for(let n=1;n<=40;n++){
   let value=answers[n]||'', correct=false, expected=key[n].join(' / ');
   const pair=(config.pairs||[25,27,29]).find(first=>n===first||n===first+1);
   if(pair){const first=pair; const allowed=key[first][0].split('/').map(normalize); const used=[answers[first],answers[first+1]].map(normalize); const i=n-first; correct=!!used[i]&&allowed.includes(used[i])&&(i===0||used[0]!==used[1]); expected=allowed.map(x=>x.toUpperCase()).join(' / ');}
   else {correct=!!normalize(value)&&key[n].some(x=>normalize(x)===normalize(value));}
   rows.push({n,value,expected,status:!normalize(value)?'blank':correct?'correct':'wrong'});
  }
  return {rows,correct:rows.filter(x=>x.status==='correct').length,wrong:rows.filter(x=>x.status==='wrong').length,blank:rows.filter(x=>x.status==='blank').length};
 }
 root.EchoGrade={normalize,grade}; if(typeof module!=='undefined')module.exports=root.EchoGrade;
})(typeof window!=='undefined'?window:globalThis);
