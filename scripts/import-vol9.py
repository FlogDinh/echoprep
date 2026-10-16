"""Import the additional user-owned Vol 9 DOCX tests without changing source files."""
import pathlib,zipfile,xml.etree.ElementTree as E,re,json,html,unicodedata,difflib
from urllib.parse import quote
ROOT=pathlib.Path(__file__).resolve().parents[1]
NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships','v':'urn:schemas-microsoft-com:vml'}
W='{'+NS['w']+'}'
def norm(t):return re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFKC',t).lower())
class Doc:
 def __init__(self,path):
  self.path=path;self.z=zipfile.ZipFile(path);self.doc=E.fromstring(self.z.read('word/document.xml'));self.body=self.doc.find('w:body',NS);self.paras=self.doc.findall('.//w:body//w:p',NS);self.lines=[self.text(p) for p in self.paras];self.idx={p:i for i,p in enumerate(self.paras)}
  self.rels={r.get('Id'):r.get('Target') for r in E.fromstring(self.z.read('word/_rels/document.xml.rels'))};self.out=None
 @staticmethod
 def text(p):return ''.join(t.text or '' for t in p.findall('.//w:t',NS)).strip().replace('\xa0',' ')
 def fmt(self,p,changes=None):
  # Preserve source run styles even when a question's blank spans several runs.
  runs=[];offset=0
  for r in p.findall('.//w:r',NS):
   t=''.join(n.text or '' for n in r.findall('.//w:t',NS)).replace('\xa0',' ');tags=[]
   for tag in ['b','i','u']:
    e=r.find('w:rPr/w:'+tag,NS)
    if e is not None and e.get(W+'val') not in ['0','false','off']:tags.append(tag)
   runs.append((offset,offset+len(t),t,tags));offset+=len(t)
  def piece(start,end):
   out=''
   for a,b,t,tags in runs:
    if b<=start or a>=end:continue
    v=html.escape(t[max(start-a,0):min(end-a,len(t))]);
    for tag in tags:v=f'<{tag}>{v}</{tag}>'
    out+=v
   return out
  text=''.join(r[2] for r in runs);out='';at=0
  for a,b,value in sorted(changes or []):out+=piece(at,a)+value;at=b
  out+=piece(at,len(text))
  for node in list(p.findall('.//a:blip',NS))+list(p.findall('.//v:imagedata',NS)):
   rid=node.get('{'+NS['r']+'}embed') or node.get('{'+NS['r']+'}id');target=self.rels.get(rid,'');name='word/'+target.lstrip('/')
   if not target or target.startswith('http') or name not in self.z.namelist():continue
   data=self.z.read(name)
   if len(data)<1000:continue
   dest=self.out/pathlib.Path(target).name;dest.write_bytes(data);rel=dest.relative_to(ROOT/'dist');out+=f'<img class="source-image" src="{quote(str(rel))}" alt="Hình gốc trong đề {html.escape(self.path.stem)}">'
  return out
 def render(self,start,end,replacements=None,skip=None):
  replacements=replacements or {};skip=skip or set()
  def render_node(node):
   if node.tag==W+'p':
    i=self.idx[node]
    if not start<=i<end or i in skip:return ''
    if i in replacements:return replacements[i]
    f=self.fmt(node);t=self.lines[i]
    if not t and not '<img' in f:return ''
    cls='subheading' if re.match(r'^Questions?\s',t) else 'instruction' if re.match(r'^(Write |Choose |Complete |Label |NB |Read the text|Reading Passage)',t) else ''
    return f'<p class="{cls}">{f}</p>'
   if node.tag==W+'tbl':
    rows=[]
    for tr in node.findall('w:tr',NS):
     cells=[render_node(tc) for tc in tr.findall('w:tc',NS)]
     if any(cells):rows.append('<tr>'+''.join('<td>'+c+'</td>' for c in cells)+'</tr>')
    return '<div class="table-scroll"><table class="source-table">'+''.join(rows)+'</table></div>' if rows else ''
   return ''.join(render_node(c) for c in node)
  return ''.join(render_node(c) for c in self.body)

def keys(doc):
 answers={};explanations={};quotes={};lines=doc.lines
 starts=[i for i,t in enumerate(lines) if t in ['Key','KEY']]
 for k,start in enumerate(starts):
  stop=starts[k+1] if k+1<len(starts) else len(lines);ex=next((j for j in range(start+1,stop) if re.match(r'^(Explanation|SCRIPT)\b',lines[j],re.I)),stop)
  for j in range(start+1,ex-1):
   m=re.fullmatch(r'(\d+)(?:[-–](\d+))?',lines[j]);value=lines[j+1]
   if not m or not value or not 1<=int(m[1])<=40:continue
   ns=list(range(int(m[1]),int(m[2] or m[1])+1))
   if m[2]:
    vals=[v.strip() for v in re.split(r'[,/]',value) if v.strip()]
    for n in ns:answers[str(n)]=['/'.join(vals)]
   else:answers[m[1]]=[v.strip() for v in re.split(r'[,/]',value) if v.strip()]
  if ex==stop or not lines[ex].lower().startswith('explanation'):continue
  current=[];parts=[];quote_next=False
  def flush():
   for n in current:explanations[str(n)]=''.join(parts)
  for i in range(ex+1,stop):
   t=lines[i]
   if t.startswith(('PASSAGE ','SECTION ')):break
   m=re.match(r'^(?:Câu\s*)?(\d+)(?:\s*[-–]\s*(\d+))?(?:[.)]\s*|\s+)(?=[A-Za-z])',t)
   if m and 1<=int(m[1])<=40:
    flush();current=list(range(int(m[1]),int(m[2] or m[1])+1));parts=[];quote_next=False
   if not current or not t:continue
   parts.append('<p>'+doc.fmt(doc.paras[i])+'</p>')
   if quote_next:
    for n in current:quotes[str(n)]=t
    quote_next=False
   if 'Đoạn chứa đáp án:' in t:
    after=t.split('Đoạn chứa đáp án:',1)[1].strip()
    if after:
     for n in current:quotes[str(n)]=after
    else:quote_next=True
  flush()
 # Separate source answer documents use "Câu số n:" rather than tables.
 for i,t in enumerate(lines[:-1]):
  m=re.fullmatch(r'Câu số (\d+):',t)
  if m:
   value=lines[i+1];answers[m[1]]=[v.strip() for v in re.split(r'[,/]',value) if v.strip()]
 return answers,explanations,quotes

def gap(n):return f'<span class="qnum">{n}</span><input class="gap" data-q="{n}" aria-label="Câu {n}" autocomplete="off" spellcheck="false">'
def select(n,bank):return f'<select class="answer-select" data-q="{n}" aria-label="Câu {n}"><option value="">Chọn</option>'+''.join(f'<option value="{html.escape(h["value"])}">{html.escape(h["value"])} · {html.escape(h["text"])}</option>' for h in bank)+'</select>'
def strip_labels(options):
 if all(re.match(r'^'+chr(65+i)+r'(?:[.]\s*|\s+)',t) for i,t in enumerate(options)):
  return [re.sub(r'^[A-K](?:[.]\s*|\s+)','',t) for t in options]
 return options
def tokens(bank):return '<div class="bank">'+''.join(f'<button class="token" draggable="true" data-token="{h["value"]}"><b>{h["value"]}</b> {html.escape(h["text"])}</button>' for h in bank)+'</div>'
def blank_changes(p,ns):
 t=''.join(x.text or '' for x in p.findall('.//w:t',NS)).replace('\xa0',' ');changes=[]
 for n in ns:
  m=re.search(r'(?<!\d)(?:\('+str(n)+r'\)|'+str(n)+r')\s*[_….·]{2,}(?:\s*[_….·]+)*',t)
  if m:changes.append((m.start(),m.end(),gap(n)))
 return sorted(changes)
def split_items(t,ns):
 pattern=r'(?<![\d(])('+ '|'.join(str(n) for n in sorted(ns,reverse=True))+r')(?!\d)\s+(?![_….])'
 matches=list(re.finditer(pattern,t));return [(int(m[1]),t[m.end():matches[i+1].start() if i+1<len(matches) else len(t)].strip()) for i,m in enumerate(matches)]
def parse_bank(lines,roman=False):
 # Some Word paragraphs contain a whole option bank with no line breaks.
 p=r'((?:xi|ix|viii|vii|vi|iv|iii|ii|x|v|i))(?:[.)]\s*|\s+)' if roman else r'(?<![A-Z])([A-K])(?:[.)]\s*|\s+)'
 out=[]
 for t in lines:
  if not roman:t=re.sub(r'([.!?])([A-K])(?=[a-z])',r'\1\2 ',t)
  matches=[m for m in re.finditer(p,t) if not roman or m.start()==0 or not t[m.start()-1].isalpha() or len(t[m.end(1):m.end()])>=2]
  for i,m in enumerate(matches):
   value=t[m.end():matches[i+1].start() if i+1<len(matches) else len(t)].strip()
   if value:out.append({'value':m[1],'text':value})
 # Avoid accidental letters inside prose: source banks are consecutive in label order.
 seen={};
 for h in out:
  if h['value'] not in seen:seen[h['value']]=h
 return list(seen.values())

REPORT=[]
CUES=json.loads((ROOT/'scripts/vol9-evidence-cues.json').read_text()) if (ROOT/'scripts/vol9-evidence-cues.json').exists() else {}
def import_test(module,test):
 folder=ROOT/'Reference'/('VOL 9 LISTENING' if module=='listening' else 'VOL 9 READING');source=next(folder.rglob(f'*Listening Test {test}.docx')) if module=='listening' and test<9 else folder/'LIS TEST 9/[VOL 9] TEST 9.docx' if module=='listening' else next(folder.glob(f'*Reading Test {test}*.docx'))
 keydoc=Doc(source);answers,expl,quotes=keys(keydoc)
 sources=[source.name]
 if module=='listening' and test==9:
  keydoc=Doc(folder/'LIS TEST 9/KEY VOL 9 TEST 9.docx');answers,expl,quotes=keys(keydoc);sources.append(keydoc.path.name)
 doc=Doc(folder/'VOL 9 TEST 11.docx') if module=='reading' and test==11 else Doc(source)
 out=ROOT/'dist'/('Listening - Vol 9' if module=='listening' else 'Reading - Vol 9')/f'Test {test}';out.mkdir(parents=True,exist_ok=True);doc.out=out;keydoc.out=out
 end=next((i for i,t in enumerate(doc.lines) if '🔑' in t or '🥰' in t),len(doc.lines))
 original_answers=json.loads(json.dumps(answers))
 count=4 if module=='listening' else 3;sections=[];passages=[];segments={};singles=[];multi=[];headings_by_section={};links={};types={};warnings=[];all_controls=set()
 for sec in range(1,count+1):
  section_doc=doc
  if module=='reading' and test==12 and sec>1:section_doc=Doc(folder/'VOL 9 TEST 12.docx');section_doc.out=out
  d=section_doc;limit=next((i for i,t in enumerate(d.lines) if '🔑' in t or '🥰' in t),len(d.lines));label='SECTION' if module=='listening' else 'PASSAGE'
  starts=[i for i,t in enumerate(d.lines[:limit]) if re.match(label+r'\s*'+str(sec)+r'(?=\b|Read)',t)]
  assert starts,(module,test,sec,'no section');lo=starts[0]+1
  nexts=[i for i,t in enumerate(d.lines[lo:limit],lo) if re.match(label+r'\s*'+str(sec+1)+r'(?=\b|Read)',t)]
  hi=nexts[0] if nexts else limit
  # Duplicate empty passage headings at the end of a source are ignored.
  groups=[]
  for i in range(lo,hi):
   m=re.match(r'^Questions?\s*(\d+)(?:\s*[-–]\s*(\d+))?',d.lines[i])
   if m:groups.append((i,int(m[1]),int(m[2] or m[1])))
  assert groups,(module,test,sec,'no question groups')
  if module=='reading':
   body=[];pending=None;title='';subtitle=''
   for i in range(lo,groups[0][0]):
    t=d.lines[i]
    if not t or t.startswith(('Read the text','PASSAGE ')):continue
    if not title:title=t;continue
    m=re.fullmatch(r'(\d+)\s*[_….]{2,}',t)
    if m:pending=int(m[1]);continue
    if re.match(r'^[ivx]+\s+',t) and len(t)<100:body.append({'id':f'r{sec}-example','text':t,'html':'<p>'+d.fmt(d.paras[i])+'</p>','letter':None,'headingQuestion':None});continue
    if len(t)<180 and not body and pending is None :subtitle+=d.fmt(d.paras[i]);continue
    # Reading Test 12 has D/E in a single Word paragraph: retain separate letter targets.
    chunks=re.split(r'(?<=\.)\s{2,}(?=[A-I]\.\s)',t) if test==12 and sec==1 else [t]
    for chunk in chunks:
     m=re.match(r'^([A-I])(?:\.\s*|\s+)',chunk);letter=m[1] if m else None
     body.append({'id':f'r{sec}-p{len(body)+1}','text':chunk,'html':'<p>'+(d.fmt(d.paras[i]) if len(chunks)==1 else html.escape(chunk))+'</p>','letter':letter,'headingQuestion':pending});pending=None
   assert len(body)>=3,(module,test,sec,'short passage',body)
   passages.append({'number':sec,'title':title,'subtitle':subtitle});segments[str(sec)]=body
  content=[]
  for gi,(first,a,b) in enumerate(groups):
   last=groups[gi+1][0] if gi+1<len(groups) else hi;ns=list(range(a,b+1));indices=[i for i in range(first+1,last) if d.lines[i]];texts=[d.lines[i] for i in indices];instructions=' '.join(texts[:7]);rep={};skip=set();kind='gap'
   if re.search(r'Choose\s+(?:TWO|THREE)\s+correct answers|Which\s+(?:TWO|THREE)',instructions,re.I):kind='multi'
   elif 'correct heading' in instructions.lower():kind='heading'
   elif re.search(r'Choose\s+TRUE',instructions):kind='boolean'
   elif re.search(r'Choose\s+YES',instructions):kind='boolean'
   elif re.search(r'Choose the correct answer',instructions,re.I):kind='single'
   elif re.search(r'(?:Choose|Match |Label |correct ending|corect ending|list of words|list of.*phrases)',instructions,re.I) and not re.search(r'Write\s+(?:ONE|NO MORE)',instructions):kind='matching'
   if module=='listening' and test==9 and a==16:kind='matching'
   for n in ns:types[str(n)]=kind
   if kind in ['single','boolean','multi']:
    if kind=='multi':
     pi=next(i for i in indices if re.match(r'^'+str(a)+r'\s*[-–]\s*'+str(b)+r'\b',d.lines[i]));option_ids=[i for i in indices if i>pi and not re.match(r'^(?:PASSAGE|SECTION) ',d.lines[i])];options=strip_labels([d.lines[i] for i in option_ids]);prompt=re.sub(r'^\d+\s*[-–]\s*\d+\s*','',d.lines[pi]);q={'n':a,'size':len(ns),'prompt':prompt,'options':options};
     if module=='reading' and test==2 and a==24:
      q['options'].append('A translation should give the impression of being an original work.');warnings.append('Câu 24–26: phương án F bị thiếu ở phần đề, được khôi phục nguyên văn từ phần chữa chi tiết trong cùng file nguồn.')
     multi.append(q);rep[pi]=f'<div data-render-pair="{a}"></div>';skip.update(option_ids)
     allowed=[]
     for n in ns:
      for v in answers.get(str(n),[]):
       for letter in v.split('/'):
        if letter not in allowed:allowed.append(letter)
     if allowed:
      for n in ns:answers[str(n)]=['/'.join(allowed)]
     all_controls.update(ns)
    else:
     for n in ns:
      pi=next((i for i in indices if re.match(r'^'+str(n)+r'\s+',d.lines[i])),None)
      assert pi is not None,(module,test,sec,kind,n,'missing prompt')
      if kind=='boolean':opts=['TRUE','FALSE','NOT GIVEN'] if 'Choose TRUE' in instructions else ['YES','NO','NOT GIVEN'];q={'n':n,'prompt':re.sub(r'^\d+\s+','',d.lines[pi]),'options':opts,'values':opts};skip.update(i for i in indices if d.lines[i] in opts)
      else:
       oi=[]
       for i in indices:
        if i<=pi:continue
        if any(re.match(r'^'+str(v)+r'\s+',d.lines[i]) for v in ns) or d.lines[i].startswith(('Questions','PASSAGE','SECTION')):break
        oi.append(i)
        if len(oi)==(3 if module=='listening' else 4):break
       opts=strip_labels([d.lines[i] for i in oi]);assert len(opts)==(3 if module=='listening' else 4),(module,test,n,opts)
       q={'n':n,'prompt':re.sub(r'^\d+\s+','',d.lines[pi]),'options':opts};skip.update(oi)
      singles.append(q);rep[pi]=f'<div data-render-choice="{n}"></div>';all_controls.add(n)
   elif kind in ['heading','matching']:
    if kind=='heading':
     bank=parse_bank(texts,True)
     if module=='reading' and test==5 and a==14:
      bank.append({'value':'ix','text':'A change of direction for Ray'});warnings.append('Câu 14–20: heading ix bị thiếu ở phần đề, được khôi phục nguyên văn từ phần chữa câu 16 trong cùng file nguồn.')
     assert len(bank)>=b-a+1,(module,test,a,bank);headings_by_section[str(sec)]=bank
     questions=[(n,'Paragraph '+str(i+1)) for i,n in enumerate(ns)];
     heading_segments=[x for x in segments[str(sec)] if x.get('headingQuestion')]
     if len(heading_segments)!=len(ns):
      # Headings appear before every paragraph in these sources; example paragraph has no input.
      raise ValueError((module,test,sec,'heading alignment',len(heading_segments),ns))
     questions=[(x['headingQuestion'],'Paragraph '+str(i+1)) for i,x in enumerate(segments[str(sec)]) if x.get('headingQuestion')]
    else:
     questions=[];q_indices=[]
     for i in indices:
      items=split_items(d.lines[i],ns)
      if items:questions.extend(items);q_indices.append(i)
     # Use only bank paragraphs before the first actual matching question (not instructions containing numbers).
     questions=[(n,t) for n,t in questions if not re.match(r'^(?:to |and |[-–])',t)]
     found={n:t for n,t in questions}
     bank_start=next((i for i in indices if re.match(r'^[A-K](?:\.|\s)',d.lines[i]) and len(d.lines[i])>2),None)
     if bank_start is not None:
      end_bank=next((i for i in indices if i>bank_start and split_items(d.lines[i],ns)),last)
      bank=parse_bank([d.lines[i] for i in indices if bank_start<=i<end_bank])
     else:bank=[]
     # Diagram grids contain the letter headers in individual cells, not descriptions.
     if not bank:
      values=[d.lines[i] for i in indices if re.fullmatch(r'[A-K]',d.lines[i])];values=list(dict.fromkeys(values))
      if not values:
       range_match=re.search(r'([A-K])\s*[-–]\s*([A-K])',instructions)
       values=[chr(c) for c in range(ord(range_match[1]),ord(range_match[2])+1)] if range_match else []
      bank=[{'value':v,'text':v} for v in values]
     if module=='listening' and test==3 and a==27:
      bank.append({'value':'G','text':'unavailable'});warnings.append('Câu 27–30: ngân hàng nguồn ghi nhãn D hai lần; nhãn cuối được hiển thị là G (unavailable) theo dãy A–G và key gốc.')
     assert bank,(module,test,sec,a,'no bank')
     # Summary-from-bank questions contain inline numbered blanks rather than standalone question prompts.
     has_blanks=any(blank_changes(d.paras[i],ns) for i in indices)
     if has_blanks:
      for i in indices:
       changes=blank_changes(d.paras[i],ns)
       if changes:
        replacements=[]
        for aa,bb,v in changes:
         n=int(re.search(r'data-q="(\d+)"',v)[1]);all_controls.add(n);replacements.append((aa,bb,f'<span class="inline-match" data-drop="{n}"><span class="qnum">{n}</span>'+select(n,bank)+'</span>'))
        rep[i]='<p>'+d.fmt(d.paras[i],replacements)+'</p>'
      rendered=d.render(first,last,rep,skip);content.append(rendered);continue
     assert all(n in found for n in ns),(module,test,a,b,'missing matching question',found)
     questions=[(n,found[n]) for n in ns]
    intro=[]
    for i in indices:
     t=d.lines[i]
     if i>=next((j for j in indices if re.match(r'^[A-Kivx]+[.\s]',d.lines[j]) and len(d.lines[j])>2),last) and kind=='heading':break
     if any(re.match(str(n)+r'\s',t) for n in ns):break
     if re.fullmatch(r'[A-K]',t):break
     intro.append('<p class="instruction">'+d.fmt(d.paras[i])+'</p>')
    # Preserve embedded map image exactly from the source.
    images=''.join(d.fmt(d.paras[i]) for i in range(first,last) if d.paras[i].find('.//a:blip',NS) is not None or d.paras[i].find('.//v:imagedata',NS) is not None)
    body='<p class="subheading">'+d.fmt(d.paras[first])+'</p>'+''.join(intro)+images+tokens(bank)+''.join(f'<p class="matching-row" data-drop="{n}"><span class="qnum">{n}</span>{html.escape(t)} '+select(n,bank)+'</p>' for n,t in questions)
    content.append(body);all_controls.update(ns);continue
   else:
    for i in indices:
     changes=blank_changes(d.paras[i],ns)
     if changes:
      rep[i]='<p>'+d.fmt(d.paras[i],changes)+'</p>';all_controls.update(int(re.search(r'data-q="(\d+)"',v)[1]) for aa,bb,v in changes)
    for n in ns:
     if n in all_controls:continue
     pi=next((i for i in indices if re.match(r'^'+str(n)+r'\s+',d.lines[i])),None)
     if pi is not None:
      f=d.fmt(d.paras[pi]);rep[pi]='<p>'+f+' '+gap(n)+'</p>';all_controls.add(n)
   content.append(d.render(first,last,rep,skip))
  sections.append({'number':sec,'html':'\n'.join(content)})
 # Listening scripts are separate from the question document (Test 9) or after KEY (3-8).
 if module=='listening':
  for sec in range(1,5):
   kd=keydoc;starts=[i for i,t in enumerate(kd.lines) if t==('SCRIPT')]
   if starts:
    lo=starts[sec-1]+1;hi=next((i for i in range(lo,len(kd.lines)) if kd.lines[i]=='SECTION '+str(sec+1)),len(kd.lines))
   else:
    lo=next(i for i,t in enumerate(kd.lines) if t=='Section '+str(sec))+1;hi=next((i for i in range(lo,len(kd.lines)) if kd.lines[i]=='Section '+str(sec+1)),len(kd.lines))
   seg=[]
   for i in range(lo,hi):
    t=kd.lines[i]
    if not t or re.fullmatch(r'\d\d:\d\d',t):continue
    m=re.match(r'\((\d+):(\d+)\s*[-–]\s*(\d+):(\d+)\)',t)
    if m or not seg:seg.append({'id':f's{sec}-t{len(seg)+1}','text':t,'html':'<p>'+kd.fmt(kd.paras[i])+'</p>','start':int(m[1])*60+int(m[2]) if m else None})
    else:seg[-1]['text']+='\n'+t;seg[-1]['html']+='<p>'+kd.fmt(kd.paras[i])+'</p>'
   segments[str(sec)]=seg
 if module=='listening' and test==7:
  fixed={32:'gift',33:'publicity',34:'reputation',35:'machines',36:'toppings',37:'mistake',38:'contact',39:'shape'}
  for n,v in fixed.items():answers[str(n)]=[v]
  warnings.append('Key nguồn câu 32–39 bị lệch thứ tự. Đáp án trên web được đối chiếu lại từng chỗ trống với transcript gốc; bản key ban đầu được giữ trong dữ liệu nguồn để đối chiếu.')
 if module=='listening' and test==8:
  answers['36']=['grass'];warnings.append('Câu 36: key nguồn ghi “glass”, transcript ghi “grass”. Web chấm “grass” theo đoạn nghe gốc.')
 # Evidence: only link exact source quote/answer or paragraph-letter matches. No fabricated locations.
 unresolved=[]
 for n in range(1,41):
  sec=(n-1)//10+1 if module=='listening' else 1 if n<=13 else 2 if n<=26 else 3;segs=segments[str(sec)];found=[];kind=types.get(str(n))
  if kind=='heading':found=[x['id'] for x in segs if x.get('headingQuestion')==n]
  if not found and module=='reading' and kind=='matching' and answers.get(str(n)):
   # Only paragraph-matching questions use paragraph labels; people/date/summary matching must use source quotes.
   qhtml=sections[sec-1]['html'];groupstart=max(qhtml.rfind('Questions',0,qhtml.find(f'data-q="{n}"')),0)
   if 'Which paragraph' in qhtml[groupstart:qhtml.find(f'data-q="{n}"')]:found=[x['id'] for x in segs if x.get('letter')==answers[str(n)][0]]
  q=quotes.get(str(n),'')
  if not found and q:
   # Source explanations may append a Vietnamese translation to the same paragraph.
   english=re.split(r'\([A-ZĐ][^)]*[àáạảãâăèéẹêìíịòóọôơùúụưỳýỵđ]',q)[0];qn=norm(english)
   found=[x['id'] for x in segs if len(qn)>20 and (qn in norm(x['text']) or qn[:100] in norm(x['text']))]
   if not found:
    words=re.findall(r'[A-Za-z]{3,}',english.lower());scores=[sum(w in x['text'].lower() for w in set(words))/max(1,len(set(words))) for x in segs];best=max(scores,default=0)
    if best>=.72:found=[segs[scores.index(best)]['id']]
  if not found and kind=='gap' and answers.get(str(n)):
   candidates=[x['id'] for x in segs if any(len(norm(v))>=4 and re.search(r'(?<!\w)'+re.escape(v)+r'(?!\w)',x['text'],re.I) for v in answers[str(n)])]
   if len(candidates)==1:found=candidates
  cue=CUES.get(module,{}).get(str(test),{}).get(str(n))
  if cue:
   exact=[x['id'] for x in segs if norm(cue) in norm(x['text'])]
   assert exact,(module,test,n,'missing reviewed evidence cue',cue)
   found=exact
  links[str(n)]=found
  if not found:unresolved.append(n)
 assert all_controls==set(range(1,41)),(module,test,'controls missing',set(range(1,41))-all_controls,'extra',all_controls-set(range(1,41)))
 if answers:assert len(answers)==40,(module,test,'keys',len(answers))
 if not answers:warnings.append('File đáp án nguồn đang trống. Bài này chỉ luyện tập, chưa chấm đúng/sai.')
 if module=='reading' and test==11:
  answers['13']=list(dict.fromkeys(answers['13']+['varnished']));warnings.append('Câu 13: key nguồn ghi “Varnis”; chấp nhận thêm “varnished” theo nội dung passage.')
 data={'id':test,'module':module,'vol':9,'sections':sections,'passages':passages,'singles':singles,'pairs':multi,'answers':answers,'explanations':expl,'transcriptSegments':segments,'transcripts':{s:''.join(x['html'] for x in segs) for s,segs in segments.items()},'questionSegments':links,'headingsBySection':headings_by_section,'grading':{'pairs':[q['n'] for q in multi if q['size']==2],'sets':[{'n':q['n'],'size':q['size']} for q in multi]},'groups':[[1,10],[11,20],[21,30],[31,40]] if module=='listening' else [[1,13],[14,26],[27,40]],'questionTypes':types,'sourceAnswerKey':original_answers,'sourceNotes':warnings,'hasAnswerKey':len(answers)==40}
 target='TESTS' if module=='listening' else 'READING_TESTS';(out/'test.js').write_text(f'window.{target}[{test}]='+json.dumps(data,ensure_ascii=False)+';\n')
 REPORT.append({'module':module,'test':test,'questions':len(all_controls),'answers':len(answers),'explanations':len(expl),'images':len(list(out.glob('*.png'))),'unlinkedEvidence':unresolved,'warnings':warnings})
 print(module,test,'OK',len(answers),'keys',len(expl),'explanations; unlinked evidence',unresolved)
if __name__=='__main__':
 for n in range(3,10):import_test('listening',n)
 for n in range(2,13):import_test('reading',n)
 (ROOT/'scripts/import-vol9-report.json').write_text(json.dumps(REPORT,ensure_ascii=False,indent=2)+'\n')
