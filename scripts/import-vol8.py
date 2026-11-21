"""Import the user-owned Vol 8 Listening DOCX tests without changing source files.

Vol 8 differs from Vol 9: sections are headed PART n, line breaks/tabs live inside
single Word paragraphs, choice options have no A/B/C labels, the transcript uses
"Section n" headings and answer keys for Test 2–8 are screenshots. Those keys are
transcribed in vol8-answer-keys.json.
"""
import importlib.util,pathlib,re,json,html
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('vol9',ROOT/'scripts/import-vol9.py');V9=importlib.util.module_from_spec(spec);spec.loader.exec_module(V9)
NS,W,norm,gap,select,tokens,split_items,parse_bank,strip_labels=V9.NS,V9.W,V9.norm,V9.gap,V9.select,V9.tokens,V9.split_items,V9.parse_bank,V9.strip_labels
SOURCE=ROOT/'Reference/VOL 8 LISTENING'
KEYS=json.loads((ROOT/'scripts/vol8-answer-keys.json').read_text())

def run_text(r):
 out=''
 for node in r:
  if node.tag==W+'t':out+=(node.text or '').replace('\xa0',' ')
  elif node.tag in (W+'tab',W+'ptab'):out+=' '
  elif node.tag in (W+'br',W+'cr'):out+='\n'
 return out
def raw(p):return ''.join(run_text(r) for r in p.findall('.//w:r',NS))

class Doc(V9.Doc):
 def __init__(self,path):
  super().__init__(path);self.lines=[raw(p).strip() for p in self.paras]
 def fmt(self,p,changes=None):
  # Same as Vol 9, but Word line breaks/tabs inside one paragraph are kept.
  runs=[];offset=0
  for r in p.findall('.//w:r',NS):
   t=run_text(r);tags=[]
   for tag in ['b','i','u']:
    e=r.find('w:rPr/w:'+tag,NS)
    if e is not None and e.get(W+'val') not in ['0','false','off']:tags.append(tag)
   runs.append((offset,offset+len(t),t,tags));offset+=len(t)
  def piece(start,end):
   out=''
   for a,b,t,tags in runs:
    if b<=start or a>=end:continue
    v=html.escape(t[max(start-a,0):min(end-a,len(t))]).replace('\n','<br>')
    for tag in tags:
     if v.strip().replace('<br>',''):v=f'<{tag}>{v}</{tag}>'
    out+=v
   return out
  text=''.join(r[2] for r in runs);out='';at=0
  for a,b,value in sorted(changes or []):out+=piece(at,a)+value;at=b
  out+=piece(at,len(text))
  out=re.sub(r'^(?:\s|<br>)+|(?:\s|<br>)+$','',out)
  for node in list(p.findall('.//a:blip',NS))+list(p.findall('.//v:imagedata',NS)):
   rid=node.get('{'+NS['r']+'}embed') or node.get('{'+NS['r']+'}id');target=self.rels.get(rid,'');name='word/'+target.lstrip('/')
   if not target or target.startswith('http') or name not in self.z.namelist():continue
   data=self.z.read(name)
   if len(data)<1000:continue
   dest=self.out/pathlib.Path(target).name;dest.write_bytes(data);rel=dest.relative_to(ROOT/'dist')
   out+=f'<img class="source-image" src="{V9.quote(str(rel))}" alt="Hình gốc trong đề {html.escape(self.path.stem)}">'
  return out

def blank_changes(p,ns):
 t=raw(p);changes=[]
 for n in ns:
  m=re.search(r'(?<!\d)(?:\('+str(n)+r'\)|'+str(n)+r')\s*[_….·]{2,}(?:\s*[_….·]+)*',t)
  if m:changes.append((m.start(),m.end(),gap(n)))
 return sorted(changes)

# Documented source omissions. Each is restored only where the transcript and key agree.
RESTORE={8:{22:('40-minute presentation to the','Câu 22: chỗ trống (22) bị thiếu trong đề nguồn (“40-minute presentation to the …”). Web thêm ô trống theo key “seminar group” và transcript “presentation to the seminar group”.')}}

def keys_for(test):
 key={n:list(v) for n,v in KEYS[str(test)].items()}
 for n,v in KEYS.get('extraVariants',{}).get(str(test),{}).items():key[n]=list(dict.fromkeys(key[n]+v))
 assert sorted(map(int,key))==list(range(1,41)),(test,'keys')
 return key

def explanations_test1(doc):
 """Test 1 has a text KEY & EXPLANATION block: 'Câu n…' paragraphs until the transcript."""
 start=doc.lines.index('KEY & EXPLANATION');end=doc.lines.index('TRANSCRIPT');out={};quotes={};current=None
 for i in range(start+1,end):
  t=doc.lines[i]
  m=re.match(r'^Câu\s*(\d+)\b',t)
  if m:current=m[1];out[current]=''
  if current is None or not t or re.fullmatch(r'PART \d',t):continue
  out[current]+='<p>'+doc.fmt(doc.paras[i])+'</p>'
  quotes.setdefault(current,[]).extend(q for q in re.findall(r'“([^”]{12,})”',t))
 return out,quotes

def audio_files(folder):
 # Same naming rules as audioFileSection in dist/app.js: 1-Topic.mp3, 7-1.mp3, 81.mp3. Audio itself is never copied.
 out={}
 for f in sorted(folder.glob('*.mp3')):
  m=re.fullmatch(r'(\d)[-_ ]?([1-4])',f.stem) or re.match(r'()([1-4])[-_ ][A-Za-z]',f.stem)
  if m:out[m[2]]=f.name
 assert sorted(out)==['1','2','3','4'],(folder,out)
 return out

def import_test(test):
 folder=next(p for p in SOURCE.iterdir() if p.is_dir() and p.name.strip()==f'Test {test}')
 source=next(folder.glob('*.docx'));doc=Doc(source)
 out=ROOT/'dist/Listening - Vol 8'/f'Test {test}';out.mkdir(parents=True,exist_ok=True);doc.out=out
 for old in out.glob('*.png'):old.unlink()
 answers=keys_for(test);original=json.loads(json.dumps(answers));warnings=[]
 limit=doc.lines.index('key & script')
 sections=[];singles=[];multi=[];types={};all_controls=set();segments={}
 for sec in range(1,5):
  starts=[i for i,t in enumerate(doc.lines[:limit]) if t==f'PART {sec}'];assert starts,(test,sec,'no part')
  lo=starts[0]+1;hi=next((i for i in range(lo,limit) if doc.lines[i]==f'PART {sec+1}'),limit)
  groups=[]
  for i in range(lo,hi):
   m=re.match(r'^Questions?\s*(\d+)(?:\s*[-–]\s*(\d+))?',doc.lines[i])
   if m:groups.append((i,int(m[1]),int(m[2] or m[1])))
  assert groups,(test,sec,'no groups')
  content=[]
  for gi,(first,a,b) in enumerate(groups):
   last=groups[gi+1][0] if gi+1<len(groups) else hi;ns=list(range(a,b+1))
   indices=[i for i in range(first+1,last) if doc.lines[i]];texts=[doc.lines[i] for i in indices];instructions=' '.join(texts[:3]);rep={};skip=set();kind='gap'
   if re.search(r'Choose\s+(?:TWO|THREE)\s+correct answers|Which\s+(?:TWO|THREE)',' '.join(texts[:4]),re.I):kind='multi'
   elif re.search(r'Choose the correct answer',instructions,re.I):kind='single'
   elif re.search(r'(?:Choose|Label|Lable)',instructions,re.I) and not re.search(r'Write\s+(?:ONE|NO MORE)',instructions):kind='matching'
   for n in ns:types[str(n)]=kind
   if kind=='multi':
    pi=next(i for i in indices if re.match(r'^'+str(a)+r'\s*[-–]\s*'+str(b)+r'\b',doc.lines[i]))
    option_ids=[i for i in indices if i>pi];options=strip_labels([doc.lines[i] for i in option_ids])
    assert 5<=len(options)<=7,(test,a,options)
    multi.append({'n':a,'size':len(ns),'prompt':re.sub(r'^\d+\s*[-–]\s*\d+\s*','',doc.lines[pi]),'options':options})
    rep[pi]=f'<div data-render-pair="{a}"></div>';skip.update(option_ids);all_controls.update(ns)
    letters=answers[str(a)][0].split('/');assert len(letters)==len(ns) and all(ord(x)-65<len(options) for x in letters),(test,a,letters)
   elif kind=='single':
    for n in ns:
     pi=next((i for i in indices if re.match(r'^'+str(n)+r'\s+',doc.lines[i])),None);assert pi is not None,(test,n,'prompt')
     oi=[i for i in indices if i>pi][:3];opts=strip_labels([doc.lines[i] for i in oi])
     assert len(opts)==3 and not any(re.match(r'^\d+\s',o) or o.startswith('Questions') for o in opts),(test,n,opts)
     singles.append({'n':n,'prompt':re.sub(r'^\d+\s+','',doc.lines[pi]),'options':opts});rep[pi]=f'<div data-render-choice="{n}"></div>';skip.update(oi);all_controls.add(n)
     assert answers[str(n)][0] in 'ABC',(test,n,answers[str(n)])
   elif kind=='matching':
    bank_start=next((i for i in indices if re.match(r'^[A-K](?:\.|\s)',doc.lines[i]) and len(doc.lines[i])>2),None)
    q_lines=[i for i in indices if split_items(doc.lines[i],ns) and not re.match(r'^Choose',doc.lines[i])]
    if bank_start is not None:
     end_bank=next((i for i in indices if i>bank_start and i in q_lines),last)
     bank=parse_bank([doc.lines[i] for i in indices if bank_start<=i<end_bank and not i in q_lines])
    else:
     values=list(dict.fromkeys(t for t in texts if re.fullmatch(r'[A-K]',t)));bank=[{'value':v,'text':v} for v in values]
    assert bank,(test,a,'bank')
    letter_range=re.search(r'\b([A-K])\s*[-–]\s*([A-K])\b',instructions)
    if letter_range:assert [h['value'] for h in bank]==[chr(c) for c in range(ord(letter_range[1]),ord(letter_range[2])+1)],(test,a,bank)
    for n in ns:assert answers[str(n)][0] in [h['value'] for h in bank],(test,n,answers[str(n)],bank)
    if any(blank_changes(doc.paras[i],ns) for i in indices):
     # Flow-chart completion from a lettered option list: blanks become inline selects.
     for i in indices:
      changes=blank_changes(doc.paras[i],ns)
      if changes:
       repl=[]
       for aa,bb,v in changes:
        n=int(re.search(r'data-q="(\d+)"',v)[1]);all_controls.add(n);repl.append((aa,bb,f'<span class="inline-match" data-drop="{n}"><span class="qnum">{n}</span>'+select(n,bank)+'</span>'))
       rep[i]='<p>'+doc.fmt(doc.paras[i],repl)+'</p>'
     content.append(doc.render(first,last,rep,skip));continue
    found={}
    for i in q_lines:
     for n,t in split_items(doc.lines[i],ns):found.setdefault(n,re.sub(r'\s+',' ',t).strip())
    assert all(n in found for n in ns),(test,a,b,found)
    stop=min([i for i in [bank_start]+q_lines if i is not None]+[next((i for i in indices if re.fullmatch(r'[A-K]',doc.lines[i])),last)])
    intro=''.join(f'<p class="instruction">{doc.fmt(doc.paras[i])}</p>' for i in indices if i<stop and doc.paras[i].find('.//a:blip',NS) is None)
    images=''.join(doc.fmt(doc.paras[i]) for i in range(first,last) if doc.paras[i].find('.//a:blip',NS) is not None or doc.paras[i].find('.//v:imagedata',NS) is not None)
    content.append('<p class="subheading">'+doc.fmt(doc.paras[first])+'</p>'+intro+images+tokens(bank)+''.join(f'<p class="matching-row" data-drop="{n}"><span class="qnum">{n}</span>{html.escape(found[n])} '+select(n,bank)+'</p>' for n in ns))
    all_controls.update(ns);continue
   else:
    for i in indices:
     changes=blank_changes(doc.paras[i],ns)
     if changes:rep[i]='<p>'+doc.fmt(doc.paras[i],changes)+'</p>';all_controls.update(int(re.search(r'data-q="(\d+)"',v)[1]) for _,_,v in changes)
    for n,(anchor,note) in RESTORE.get(test,{}).items():
     if n in ns and n not in all_controls:
      i=next(i for i in indices if doc.lines[i].endswith(anchor));rep[i]='<p>'+doc.fmt(doc.paras[i])+' '+gap(n)+'</p>';all_controls.add(n);warnings.append(note)
   content.append(doc.render(first,last,rep,skip))
  sections.append({'number':sec,'html':'\n'.join(content)})
 assert all_controls==set(range(1,41)),(test,'missing',set(range(1,41))-all_controls,'extra',all_controls-set(range(1,41)))
 # Transcript: "Section n" headings after TRANSCRIPT; each source paragraph is one evidence segment.
 t0=doc.lines.index('TRANSCRIPT')
 for sec in range(1,5):
  lo=next(i for i in range(t0,len(doc.lines)) if doc.lines[i]==f'Section {sec}')+1
  hi=next((i for i in range(lo,len(doc.lines)) if doc.lines[i] in (f'PART {sec+1}',f'Section {sec+1}')),len(doc.lines))
  segments[str(sec)]=[{'id':f's{sec}-t{k+1}','text':doc.lines[i],'html':'<p>'+doc.fmt(doc.paras[i])+'</p>','start':None} for k,i in enumerate(i for i in range(lo,hi) if doc.lines[i])]
  assert sum(len(x['text']) for x in segments[str(sec)])>1500,(test,sec,'short transcript')
 expl,quotes=explanations_test1(doc) if test==1 else ({},{})
 # Evidence: exact quote from the source explanation, else a gap answer found in exactly one paragraph.
 links={};unresolved=[]
 for n in range(1,41):
  segs=segments[str((n-1)//10+1)];found=[]
  for q in quotes.get(str(n),[]):
   qn=norm(q);hits=[x['id'] for x in segs if len(qn)>12 and qn in norm(x['text'])]
   if hits:found=hits[:1];break
  if not found and types[str(n)]=='gap':
   hits=[x['id'] for x in segs if any(len(norm(v))>=3 and re.search(r'(?<!\w)'+re.escape(v)+r'(?!\w)',x['text'],re.I) for v in answers[str(n)])]
   if len(hits)==1:found=hits
  links[str(n)]=found
  if not found:unresolved.append(n)
 data={'id':test,'module':'listening','vol':8,'sections':sections,'passages':[],'singles':singles,'pairs':multi,'answers':answers,'explanations':expl,'transcriptSegments':segments,
  'transcripts':{s:''.join(x['html'] for x in segs) for s,segs in segments.items()},'questionSegments':links,'headingsBySection':{},
  'grading':{'pairs':[q['n'] for q in multi if q['size']==2],'sets':[{'n':q['n'],'size':q['size']} for q in multi]},'groups':[[1,10],[11,20],[21,30],[31,40]],
  'questionTypes':types,'audioFiles':audio_files(folder),'sourceAnswerKey':original,'sourceNotes':warnings,'hasAnswerKey':True}
 (out/'test.js').write_text(f'window.VOL8_TESTS[{test}]='+json.dumps(data,ensure_ascii=False)+';\n')
 report={'module':'listening','vol':8,'test':test,'source':source.name,'questions':len(all_controls),'answers':len(answers),'explanations':len(expl),'images':len(list(out.glob('*.png'))),'unlinkedEvidence':unresolved,'warnings':warnings}
 print('listening vol8',test,'OK',len(answers),'keys',len(expl),'explanations; unlinked evidence',unresolved);return report

if __name__=='__main__':
 report=[import_test(n) for n in range(1,9)]
 (ROOT/'scripts/import-vol8-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
