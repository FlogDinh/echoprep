import zipfile,xml.etree.ElementTree as E,json,re,html,pathlib
root=pathlib.Path(__file__).resolve().parents[1]; src=root.parent/'Reference/VOL 9 LISTENING/LIS TEST 1/[VOL 9] Listening Test 1.docx'
z=zipfile.ZipFile(src); ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}; doc=E.fromstring(z.read('word/document.xml'))
def txt(p): return ''.join(t.text or '' for t in p.findall('.//w:t',ns))
def formatted(p):
 out=''
 for r in p.findall('.//w:r',ns):
  s=html.escape(''.join(t.text or '' for t in r.findall('.//w:t',ns)))
  for tag in ['b','i','u']:
   v=r.find('w:rPr/w:'+tag,ns)
   if v is not None and v.get('{'+ns['w']+'}val') not in ['0','false','none']: s=f'<{tag}>{s}</{tag}>'
  out+=s
 return out
paras=list(doc.findall('.//w:body//w:p',ns)); lines=[txt(p) for p in paras]; stop=next(i for i,t in enumerate(lines) if '🥰 Key' in t)
sections=[]
for n in range(1,5):
 start=lines.index('SECTION '+str(n)); end=lines.index('SECTION '+str(n+1)) if n<4 else stop
 content=[]; q=1 if n==1 else 11
 for p,t in zip(paras[start+1:end],lines[start+1:end]):
  if not t.strip(): continue
  f=formatted(p)
  if '_' in t and n in [1,2,4]:
   number=int(re.search(r'\((\d+)\)',t).group(1)) if n==4 else q
   f=re.sub(r'\('+str(number)+r'\)', '',f) if n==4 else f
   f=re.sub(r'_{3,}',f'<input class="gap" data-q="{number}" aria-label="Câu {number}" autocomplete="off" spellcheck="false">',f)
   f=f'<span class="qnum">{number}</span>'+f
   q+=1
  cls='instruction' if t.startswith(('Write ','Complete ','Choose ','Label ')) else 'subheading' if t.startswith('Questions ') or (p.find('.//w:b',ns) is not None and len(t)<60 and '_' not in t) else ''
  if n!=3 and t not in ['music room','assembly hall','computer room','cloakroom','Head’s office','gym','reception']: content.append(f'<p class="{cls}">{f}</p>')
 sections.append({'number':n,'html':'\n'.join(content)})
# Parse Section 3 from source, retaining exact wording.
a=lines.index('SECTION 3'); b=lines.index('SECTION 4'); s=lines[a:b]; singles=[]; pairs=[]
for num in range(21,25):
 idx=next(i for i,t in enumerate(s) if t.startswith(str(num)+' ')); singles.append({'n':num,'prompt':s[idx][3:],'options':s[idx+1:idx+4]})
for num in [25,27,29]:
 idx=next(i for i,t in enumerate(s) if t.startswith(str(num)+'-')); pairs.append({'n':num,'prompt':s[idx].split(' ',1)[1],'options':s[idx+1:idx+6]})
answers={}; keys=[i for i,t in enumerate(lines) if t=='KEY']
for idx in keys:
 j=idx+1
 while j<len(lines) and lines[j]!='SCRIPT':
  if lines[j].strip().isdigit():
   num=int(lines[j]); val=lines[j+1].strip(); answers[str(num)]=[x.strip() for x in re.split(r',| / ',val)]
   j+=2
  else: j+=1
explanations={}; transcripts={}; transcript_segments={}
for section_index, idx in enumerate(keys,1):
 end=keys[section_index] if section_index<len(keys) else len(lines)
 script_start=next((j for j in range(idx,end) if lines[j].strip()=='SCRIPT'),None)
 explanation_start=next((j for j in range(idx,end) if lines[j].strip()=='EXPLANATION'),end)
 if script_start is not None:
  script_end=explanation_start
  if section_index<4:
   script_end=next((j for j in range(script_start+1,script_end) if lines[j].strip()=='SECTION '+str(section_index+1)),script_end)
  segments=[]
  for p in paras[script_start+1:script_end]:
   text=txt(p).strip()
   if not text: continue
   match=re.match(r'\((\d+):(\d+) - (\d+):(\d+)\)',text)
   if match or not segments:
    segments.append({'id':f's{section_index}-t{len(segments)}','text':text,'html':'<p>'+formatted(p)+'</p>','start':int(match[1])*60+int(match[2]) if match else None})
   else:
    segments[-1]['text']+='\n'+text
    segments[-1]['html']+='<p>'+formatted(p)+'</p>'
  transcript_segments[str(section_index)]=segments
  transcripts[str(section_index)]=''.join('<p>'+formatted(p)+'</p>' for p in paras[script_start+1:script_end] if txt(p).strip())
 current=None; chunks=[]
 for p,t in zip(paras[explanation_start+1:end],lines[explanation_start+1:end]):
  match=re.match(r'Câu (\d+)\b',t)
  if match:
   if current: explanations[str(current)]=''.join(chunks)
   current=int(match.group(1));chunks=[]
  if t.strip().startswith('SECTION '): break
  if current and t.strip(): chunks.append('<p>'+formatted(p)+'</p>')
 if current: explanations[str(current)]=''.join(chunks)
# Match each question to the evidence in the original transcript, including shared pair evidence.
cues={1:['Yours is $80'],2:['this house has a garage'],3:["Yeah, it's in the kitchen"],4:["doesn't have a heater"],5:['if you had a toaster'],6:['Friday evening'],7:['work at the supermarket'],8:['share the petrol'],9:['1st of June'],10:["I've got an exam"],11:['take the register'],12:['a hot meal is available'],13:['two breaks of 15 minutes'],14:['whole school to do sports'],15:['produce a poster'],16:['every month'],17:['set up clubs'],18:["Head's office"],19:['create a music room'],20:['turned into a gym'],21:['Then we can add'],22:['recording is very unclear'],23:['the tutor suggests'],24:['self-doubt'],25:['ought to borrow that','get out modern forensic techniques'],26:['ought to borrow that','get out modern forensic techniques'],27:["how we're going to record",'fitting in the writing up'],28:["how we're going to record",'fitting in the writing up'],29:['Leave that to me','discussion and conclusions'],30:['Leave that to me','discussion and conclusions'],31:['conserve the resources'],32:['stressful'],33:['competition'],34:['amount of light'],35:['reduction in their metabolism'],36:['deep into the mud'],37:['possibility of starvation'],38:['minimising evaporation'],39:['nest that is insulated'],40:['area around the heart']}
question_segments={str(n):[segment['id'] for segment in transcript_segments[str((n-1)//10+1)] if any(cue.lower() in segment['text'].lower() for cue in cue_list)] for n,cue_list in cues.items()}
assert all(question_segments.values()), 'Every question must map to original transcript evidence'
(root/'dist/Listening - Vol 9/Test 1/test.js').write_text('window.TEST='+json.dumps({'sections':sections,'singles':singles,'pairs':pairs,'answers':answers,'explanations':explanations,'transcripts':transcripts,'transcriptSegments':transcript_segments,'questionSegments':question_segments},ensure_ascii=False)+';')
(root/'dist/Listening - Vol 9/Test 1/plan.png').write_bytes(z.read('word/media/image1.png'))
