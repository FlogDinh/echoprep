import zipfile,xml.etree.ElementTree as E,pathlib,re,json,html,unicodedata
root=pathlib.Path(__file__).resolve().parents[1];src=root/'Reference/VOL 9 READING/[VOL 9] Reading Test 1.docx';z=zipfile.ZipFile(src);ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'};doc=E.fromstring(z.read('word/document.xml'))
paras=doc.findall('.//w:body//w:p',ns)
def text(p):return ''.join(x.text or '' for x in p.findall('.//w:t',ns)).strip()
def fmt(p):
 out=''
 for r in p.findall('.//w:r',ns):
  s=html.escape(''.join(x.text or '' for x in r.findall('.//w:t',ns)))
  for tag in ['b','i','u']:
   if r.find('w:rPr/w:'+tag,ns) is not None:s=f'<{tag}>{s}</{tag}>'
  out+=s
 return out
lines=[text(p) for p in paras];end=next(i for i,t in enumerate(lines) if '🔑 KEY' in t);bounds=[next(i for i,t in enumerate(lines[:end]) if t.strip()=='PASSAGE '+str(n)) for n in [1,2,3]]+[end]
keys=[i for i,t in enumerate(lines) if t=='Key'];answers={};explanations={};quotes={}
for sec,idx in enumerate(keys,1):
 finish=keys[sec] if sec<3 else len(lines);ex=next(j for j in range(idx,finish) if lines[j]=='Explanation')
 for j in range(idx+1,ex):
  if lines[j].isdigit():answers[lines[j]]=[lines[j+1].strip()]
 current=[];parts=[];quote_pending=False
 def flush():
  for n in current:explanations[str(n)]=''.join(parts)
 for p,t in zip(paras[ex+1:finish],lines[ex+1:finish]):
  if t.startswith('PASSAGE '):break
  m=re.match(r'^(\d+)(?:-(\d+))?\.\s*',t)
  if m:
   flush();current=list(range(int(m[1]),int(m[2] or m[1])+1));parts=[];quote_pending=False
  if not current or not t or re.match(r'^(?:Q\d|Câu \d)',t):continue
  parts.append('<p>'+fmt(p)+'</p>')
  if quote_pending:
   for n in current:quotes[str(n)]=t
   quote_pending=False
  if t=='Đoạn chứa đáp án:':quote_pending=True
 flush()
headings=[]
for t in lines[bounds[1]:bounds[2]]:
 m=re.match(r'^\s*(xi|ix|viii|vii|vi|iv|iii|ii|x|v|i)\s+(.+)',t)
 if m:headings.append({'value':m[1],'text':m[2]})
assert len(headings)==11
sections=[];passages=[];singles=[];pairs=[];segments={};transcripts={}
def gap(n):return f'<input class="gap" data-q="{n}" aria-label="Câu {n}" autocomplete="off" spellcheck="false">'
def select(n,values):return f'<select data-q="{n}" aria-label="Câu {n}"><option value="">Chọn</option>'+''.join(f'<option value="{html.escape(v)}">{html.escape(v)}</option>' for v in values)+'</select>'
for sec in [1,2,3]:
 lo,hi=bounds[sec-1]+1,bounds[sec];question_start=next(i for i in range(lo,hi) if lines[i].startswith('Questions '));title=lines[lo];body_segments=[];subtitle='';para_number=0
 for i in range(lo+1,question_start):
  t=lines[i]
  if not t or re.match(r'^\d+\s*[.…]+',t) or t.startswith('---'):continue
  if sec in [1,3] and i==lo+1:subtitle=fmt(paras[i]);continue
  para_number+=1;letter=t[0] if sec==3 and re.match(r'^[A-I] ',t) else None;identifier=f'r{sec}-p{letter or para_number}'
  body_segments.append({'id':identifier,'text':t,'html':'<p>'+fmt(paras[i])+'</p>','letter':letter,'headingQuestion':13+para_number if sec==2 else None})
 segments[str(sec)]=body_segments;transcripts[str(sec)]=''.join(x['html'] for x in body_segments);passages.append({'number':sec,'title':title,'subtitle':subtitle});out=[];i=question_start
 while i<hi:
  t=lines[i]
  if not t:i+=1;continue
  if re.match(r'^[1-6] ',t):
   n=int(t.split(' ',1)[0]);q={'n':n,'prompt':t.split(' ',1)[1],'options':['TRUE','FALSE','NOT GIVEN'],'values':['TRUE','FALSE','NOT GIVEN']};singles.append(q);out.append(f'<div data-render-choice="{n}"></div>');i+=4;continue
  if sec==2 and t=='List of Headings':
   out.append('<h3>List of Headings</h3><div class="bank heading-bank">'+''.join(f'<button class="token" draggable="true" data-token="{h["value"]}"><b>{h["value"]}</b> {html.escape(h["text"])}</button>' for h in headings)+'</div>')
   for n in range(14,21):out.append(f'<p class="matching-row" data-drop="{n}"><span class="qnum">{n}</span>Paragraph {n-13} '+select(n,[h['value'] for h in headings])+'</p>')
   i+=1
   while i<hi and not lines[i].startswith('Questions 21'):i+=1
   continue
  if sec==2 and t.startswith('Which TWO of these'):
   opts=[];j=i+1
   while len(opts)<5:
    if lines[j]:opts.append(lines[j])
    j+=1
   pairs.append({'n':21,'prompt':t,'options':opts});out.append('<div data-render-pair="21"></div>');i=j;continue
  if sec==3 and t in list('ABCDEFGHI'):i+=1;continue
  if sec==3 and re.match(r'^(2[7-9]|3[0-3]) ',t):
   n=int(t[:2]);out.append(f'<p class="matching-row" data-drop="{n}"><span class="qnum">{n}</span>'+html.escape(t[3:])+' '+select(n,list('ABCDEFGHI'))+'</p>');i+=1;continue
  if sec==3 and re.match(r'^(39|40) ',t):
   n=int(t[:2]);opts=[];j=i+1
   while len(opts)<4:
    if lines[j]:opts.append(lines[j])
    j+=1
   singles.append({'n':n,'prompt':t[3:],'options':opts});out.append(f'<div data-render-choice="{n}"></div>');i=j;continue
  if '_' in t:
   if sec in [1,2]:
    f=html.escape(t);f=re.sub(r'\((\d+)\)\s*_{3,}',lambda m:f'<span class="qnum">{m[1]}</span>'+gap(int(m[1])),f);out.append('<p>'+f+'</p>')
   else:
    # The original packs questions 35-37 into one paragraph; keep each question independently editable.
    chunks=re.split(r'(?<!\d)(?=3[4-8]\s)',t)
    for chunk in chunks:
     m=re.match(r'(3[4-8])\s+(.+)',chunk)
     if m:out.append(f'<p><span class="qnum">{m[1]}</span>'+html.escape(m[2]).replace('_'*len(re.search(r'_{3,}',m[2])[0]),gap(int(m[1])))+'</p>')
   i+=1;continue
  cls='subheading' if t.startswith('Questions ') else 'instruction' if t.startswith(('Choose ','Write ','Complete ','Reading Passage','NB ','Which paragraph')) else ''
  out.append(f'<p class="{cls}">'+fmt(paras[i])+'</p>');i+=1
 sections.append({'number':sec,'html':'\n'.join(out)})
def norm(s):return re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFKC',s).lower())
links={}
for n in range(1,41):
 sec=1 if n<=13 else 2 if n<=26 else 3
 if 14<=n<=20:found=[segments['2'][n-14]['id']]
 elif 27<=n<=33:found=[x['id'] for x in segments['3'] if x['letter']==answers[str(n)][0]]
 else:
  q=norm(quotes.get(str(n),''));found=[x['id'] for x in segments[str(sec)] if q and (q in norm(x['text']) or q[:120] in norm(x['text']))]
 if not found:raise ValueError(f'Question {n} evidence not found: {quotes.get(str(n))}')
 links[str(n)]=found
assert len(answers)==40 and len(explanations)==40 and len(segments['2'])==7
# Preserve British spelling in the source key; equivalent American spelling is accepted.
answers['23'].append('civilization')
data={'id':1,'module':'reading','vol':9,'sections':sections,'passages':passages,'singles':singles,'pairs':pairs,'answers':answers,'explanations':explanations,'transcriptSegments':segments,'transcripts':transcripts,'questionSegments':links,'headings':headings,'grading':{'pairs':[21]},'groups':[[1,13],[14,26],[27,40]]}
out=root/'dist/Reading - Vol 9/Test 1';out.mkdir(parents=True,exist_ok=True);(out/'test.js').write_text('window.READING_TESTS={1:'+json.dumps(data,ensure_ascii=False)+'};')
print('Imported Reading Test 1: 3 passages, 40 answers and source explanations, all evidence links, 11 headings, 1 two-answer group.')
