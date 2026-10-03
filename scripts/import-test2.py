import pathlib,zipfile,xml.etree.ElementTree as E,json,re,html
root=pathlib.Path(__file__).resolve().parents[1];src=root.parent/'Reference/VOL 9 LISTENING/LIS TEST 2/[VOL 9] Listening Test 2.docx'
z=zipfile.ZipFile(src);ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'};doc=E.fromstring(z.read('word/document.xml'))
def txt(p):return ''.join(x.text or '' for x in p.findall('.//w:t',ns))
def fmt(p):
 out=''
 for r in p.findall('.//w:r',ns):
  s=html.escape(''.join(x.text or '' for x in r.findall('.//w:t',ns)))
  for tag in ['b','i','u']:
   if r.find('w:rPr/w:'+tag,ns) is not None:s=f'<{tag}>{s}</{tag}>'
  out+=s
 return out
paras=doc.findall('.//w:body//w:p',ns);lines=[txt(p).strip() for p in paras];key_start=next(i for i,t in enumerate(lines) if '🥰 Key' in t);keys=[i for i,t in enumerate(lines) if t=='KEY'];answers={};segments={};transcripts={}
for sec,idx in enumerate(keys,1):
 end=keys[sec] if sec<4 else len(lines);script=next(j for j in range(idx,end) if lines[j]=='SCRIPT')
 for j in range(idx+1,script):
  if lines[j].isdigit():
   n=int(lines[j]);v=lines[j+1];variants=[x.strip() for x in re.split(r',|/',v)];expanded=[]
   for v in variants:
    if '(the)' in v:expanded.extend([v.replace('(the) ','').strip(),v.replace('(the)','the').strip()])
    else:expanded.append(v)
   answers[str(n)]=expanded
 stop=next((j for j in range(script+1,end) if lines[j]=='SECTION '+str(sec+1)),end)
 group=[]
 for p,t in zip(paras[script+1:stop],lines[script+1:stop]):
  if not t or t=='Section 3':continue
  m=re.match(r'\((\d+):(\d+) - (\d+):(\d+)\)',t)
  if m or not group:group.append({'id':f's{sec}-t{len(group)}','text':t,'html':'<p>'+fmt(p)+'</p>','start':int(m[1])*60+int(m[2]) if m else None})
  else:group[-1]['text']+='\n'+t;group[-1]['html']+='<p>'+fmt(p)+'</p>'
 segments[str(sec)]=group;transcripts[str(sec)]=''.join(x['html'] for x in group)
# Source question paragraphs, original table cells and bold/italic runs.
choices=[];skip=set();question_end=key_start
for n in list(range(11,16))+list(range(21,25)):
 idx=next(i for i,t in enumerate(lines[:key_start]) if re.match(str(n)+r'\s+',t));options=[];j=idx+1
 while len(options)<3:
  if lines[j]:options.append(lines[j]);skip.add(j)
  j+=1
 choices.append({'n':n,'prompt':re.sub(r'^\d+\s+','',lines[idx]),'options':options});skip.add(idx)
choice_by_text={lines[next(i for i,t in enumerate(lines[:key_start]) if re.match(str(q['n'])+r'\s+',t))]:q['n'] for q in choices}
flow=['bone','different','equal','elm','hazel','iron','peg','roof','scaffold'];issues=['at which point of the presentation it should come','whether it should be removed completely','whether it is clear enough','if it needs to be completely re-written','if visuals will help or not','if the information needs to be checked','which further examples should be included','which of them will present it']
matching={16:'Mark centre of planned house with a',17:'Dig ground using tools made from',18:'Insert centre post and build a wooden',19:'Complete roof framework using',20:'Cover roof with reed bundles of'}
sections=[];sec=0;content=[];seen=set()
def input_for(n):
 if 16<=n<=20 or 25<=n<=30:
  options=flow if n<=20 else issues
  return f'<select data-q="{n}" aria-label="Câu {n}"><option value="">Chọn</option>'+''.join(f'<option value="{chr(65+i)}">{chr(65+i)} · {html.escape(v)}</option>' for i,v in enumerate(options))+'</select>'
 return f'<input class="gap" data-q="{n}" aria-label="Câu {n}" autocomplete="off" spellcheck="false">'
def paragraph(p):
 t=txt(p).strip();f=fmt(p)
 if not t:return ''
 if t in choice_by_text:return f'<div data-render-choice="{choice_by_text[t]}"></div>'
 if paras.index(p) in skip:return ''
 if sec==3 and t.startswith(('A    ','B    ','C    ','D    ','E    ','F    ','G   ','H   ')):return ''
 if t.startswith('A bone'):return '<div class="bank">'+''.join(f'<button class="token" draggable="true" data-token="{chr(65+i)}"><b>{chr(65+i)}</b> {html.escape(v)}</button>' for i,v in enumerate(flow))+'</div>'
 if sec==3 and t.startswith('25  Introduction'):
  titles=['Introduction','Researcher profiles','Section on automation','Section on workplace structure','Section on tracking technology','Interview with company manager']
  return '<div class="bank">'+''.join(f'<button class="token" draggable="true" data-token="{chr(65+i)}"><b>{chr(65+i)}</b> {html.escape(v)}</button>' for i,v in enumerate(issues))+'</div>'+''.join(f'<p class="matching-row" data-drop="{n}"><span class="qnum">{n}</span>{title} {input_for(n)}</p>' for n,title in zip(range(25,31),titles))
 if sec==3 and t.startswith('29  '):return ''
 nums=re.findall(r'\((\d+)\)',t)
 if nums and 16<=int(nums[0])<=20:f=html.escape(t)
 for value in nums:
  n=int(value);seen.add(n)
  f=re.sub(r'(?:<b>)?\('+value+r'\)(?:</b>)?\s*(?:_{2,}|…+\.?|\.{3,})',f'<span class="qnum">{n}</span>'+input_for(n),f)
 cls='instruction' if t.startswith(('Write ','Complete ','Choose ','What issue','Label ')) else 'subheading' if t.startswith('Questions ') or (p.find('.//w:b',ns) is not None and len(t)<65 and not nums) else ''
 if nums and 16<=int(nums[0])<=20:cls+=' matching-row';return f'<p class="{cls}" data-drop="{nums[0]}">{f}</p>'
 return f'<p class="{cls}">{f}</p>'
for node in doc.find('w:body',ns):
 if node.tag.endswith('}p'):
  t=txt(node).strip()
  if '🥰 Key' in t:break
  if re.fullmatch(r'SECTION [1-4]',t):
   if sec:sections.append({'number':sec,'html':'\n'.join(content)})
   sec=int(t[-1]);content=[];continue
  if sec:content.append(paragraph(node))
 elif node.tag.endswith('}tbl') and sec:
  rows=[]
  for row in node.findall('w:tr',ns):rows.append('<tr>'+''.join('<td>'+''.join(paragraph(p) for p in cell.findall('w:p',ns))+'</td>' for cell in row.findall('w:tc',ns))+'</tr>')
  content.append('<div class="table-scroll"><table class="source-table">'+''.join(rows)+'</table></div>')
sections.append({'number':sec,'html':'\n'.join(content)})
cues={1:['end of the month'],2:['orange poppies'],3:['hour east'],4:['wearing trousers'],5:['a state park'],6:['general tour'],7:['the museum'],8:['lasts one hour'],9:['5.30 a.m.'],10:['zoom lens'],11:['here I do it every day'],12:['long time to cook'],13:['chat about the day'],14:['nice and hot'],15:['different things every day'],16:['a wooden peg'],17:['animal bone'],18:['timber scaffold'],19:['hazel wood rods'],20:['equal length'],21:['Customers were happier'],22:["a machine can't"],23:['working from home'],24:['employees would refuse'],25:['you ought to deliver'],26:['So, cut it'],27:['I should start again'],28:['other situations'],29:['some photos'],30:['everything down accurately'],31:['number of shops'],32:['internal clock'],33:['light and dark'],34:['unsocial hours'],35:['stomach problems'],36:['problem is depression'],37:['mental abilities'],38:['control our performance'],39:['breakup of family life'],40:['peer group']}
links={str(n):[x['id'] for x in segments[str((n-1)//10+1)] if any(c.lower() in x['text'].lower() for c in cue)] for n,cue in cues.items()}
assert len(answers)==40 and all(links.values())
data={'id':2,'sections':sections,'singles':choices,'pairs':[],'answers':answers,'explanations':{},'transcripts':transcripts,'transcriptSegments':segments,'questionSegments':links,'grading':{'pairs':[]}}
out=root/'dist/Listening - Vol 9/Test 2';out.mkdir(parents=True,exist_ok=True);(out/'test.js').write_text('window.TESTS[2]='+json.dumps(data,ensure_ascii=False)+';')
print('Imported Test 2: 40 questions, source table, 9 single-choice questions, 11 matching questions, transcripts and evidence links.')
