(function(root){
 const excluded='button,input,select,textarea,.qnum,.letter,.answer-correction,.choice-feedback';
 function blocks(paper){return [...paper.querySelectorAll('p,h2,h3,label.choice')].filter(el=>!el.closest('.choice-feedback')).map((el,i)=>{el.dataset.highlightBlock='block-'+i;return el})}
 function nodes(block){const walker=document.createTreeWalker(block,NodeFilter.SHOW_TEXT,{acceptNode(node){return node.parentElement?.closest(excluded)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}});const list=[];while(walker.nextNode())list.push(walker.currentNode);return list}
 function merge(ranges){if(!Array.isArray(ranges))return [];const sorted=ranges.filter(x=>Array.isArray(x)&&Number.isInteger(x[0])&&Number.isInteger(x[1])&&x[0]>=0&&x[1]>x[0]).sort((a,b)=>a[0]-b[0]);const out=[];for(const range of sorted){const last=out.at(-1);if(last&&range[0]<=last[1])last[1]=Math.max(last[1],range[1]);else out.push([...range]);}return out}
 function apply(paper,saved={}){
  paper.querySelectorAll('mark.keyword-highlight').forEach(mark=>{const parent=mark.parentNode;mark.replaceWith(...mark.childNodes);parent.normalize()});
  for(const block of blocks(paper)){
   const ranges=merge(saved[block.dataset.highlightBlock]||[]);let offset=0;
   for(const node of nodes(block)){const length=node.textContent.length,parts=ranges.map(([start,end])=>[Math.max(0,start-offset),Math.min(length,end-offset)]).filter(([start,end])=>end>start);offset+=length;
    for(const [start,end] of parts.reverse()){if(end<node.length)node.splitText(end);const selected=start?node.splitText(start):node;const mark=document.createElement('mark');mark.className='keyword-highlight';selected.replaceWith(mark);mark.append(selected);}
   }
  }
 }
 function capture(paper,selection,saved={}){
  if(!selection?.rangeCount||selection.isCollapsed)return false;const range=selection.getRangeAt(0);if(!paper.contains(range.startContainer)||!paper.contains(range.endContainer)||!selection.toString().trim())return false;
  let changed=false;
  for(const block of blocks(paper)){let offset=0;const additions=[];for(const node of nodes(block)){const length=node.length;if(range.intersectsNode(node)){const start=node===range.startContainer?range.startOffset:0,end=node===range.endContainer?range.endOffset:length;if(end>start&&node.textContent.slice(start,end).trim())additions.push([offset+start,offset+end]);}offset+=length;}
   if(additions.length){saved[block.dataset.highlightBlock]=merge([...(saved[block.dataset.highlightBlock]||[]),...additions]);changed=true;}
  }
  if(changed){selection.removeAllRanges();apply(paper,saved)}return changed;
 }
 root.EchoHighlight={apply,capture,merge};
})(window);
