import {randomBytes,scrypt} from 'node:crypto';
import {promisify} from 'node:util';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),directory=process.env.ECHOPREP_DATA_DIR||path.join(root,'.private');
let input='';for await(const chunk of process.stdin)input+=chunk;const {username,password}=JSON.parse(input);
if(typeof username!=='string'||!username||typeof password!=='string'||!password)throw Error('Username and password required');
await mkdir(directory,{recursive:true,mode:0o700});const file=path.join(directory,'accounts.json');let accounts=[];try{accounts=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const salt=randomBytes(32).toString('hex'),hash=(await promisify(scrypt)(password,salt,64)).toString('hex');accounts=accounts.filter(a=>a.username!==username);accounts.push({username,salt,hash});await writeFile(file,JSON.stringify(accounts),{mode:0o600});console.log('Account configured; password stored only as salted hash.');
