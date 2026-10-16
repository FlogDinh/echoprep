(function(root){
 const normalize=s=>String(s??'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ').replace(/[’‘]/g,"'");
 function grade(answers,key,config={}){
  const sets=config.sets|| (config.pairs||[25,27,29]).map(n=>({n,size:2})),rows=[];
  for(let n=1;n<=40;n++){
   const value=answers[n]||'',variants=key[n]||[],group=sets.find(g=>n>=g.n&&n<g.n+g.size);let correct=false,expected=variants.join(' / ');
   if(!variants.length){rows.push({n,value,expected:'Chưa có đáp án nguồn',status:normalize(value)?'unchecked':'blank'});continue;}
   if(group){const allowed=(key[group.n]||[]).flatMap(v=>v.split('/')).map(normalize),used=Array.from({length:group.size},(_,i)=>normalize(answers[group.n+i]));const i=n-group.n;correct=!!used[i]&&allowed.includes(used[i])&&!used.slice(0,i).includes(used[i]);expected=[...new Set(allowed)].map(x=>x.toUpperCase()).join(' / ');}
   else correct=!!normalize(value)&&variants.some(x=>normalize(x)===normalize(value));
   rows.push({n,value,expected,status:!normalize(value)?'blank':correct?'correct':'wrong'});
  }
  return {rows,correct:rows.filter(x=>x.status==='correct').length,wrong:rows.filter(x=>x.status==='wrong').length,blank:rows.filter(x=>x.status==='blank').length,unchecked:rows.filter(x=>x.status==='unchecked').length,gradedTotal:Object.values(key).filter(v=>v?.length).length};
 }
 root.EchoGrade={normalize,grade};if(typeof module!=='undefined')module.exports=root.EchoGrade;
})(typeof window!=='undefined'?window:globalThis);
