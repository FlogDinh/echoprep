import zipfile,xml.etree.ElementTree as E,json,re,html,pathlib
root=pathlib.Path(__file__).resolve().parents[1]; src=root.parent/'VOL 9 LISTENING/LIS TEST 1/[VOL 9] Listening Test 1.docx'
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
(root/'dist/Listening - Vol 9/Test 1/test.js').write_text('window.TEST='+json.dumps({'sections':sections,'singles':singles,'pairs':pairs,'answers':answers},ensure_ascii=False)+';')
(root/'dist/Listening - Vol 9/Test 1/plan.png').write_bytes(z.read('word/media/image1.png'))
