#!/usr/bin/env node
// Sets the password the teacher types at /teacher. Writes .private/set-teacher-password.sql: paste it into
// Supabase → SQL Editor → Run. Only SHA-256 of the derived key is stored (the site derives the key as
// sha256 hex of 'echoprep-teacher:' + password). Running it again changes the password; the teacher's
// browser then asks for the new one. Usage: node scripts/set-teacher-password.mjs '<password, 8+ characters>'
import {createHash} from 'node:crypto';import {mkdir,writeFile} from 'node:fs/promises';
const password=process.argv[2]||'';
if(password.length<8){console.error('Mật khẩu cần ít nhất 8 ký tự.');process.exit(1)}
const sha=t=>createHash('sha256').update(t,'utf8').digest('hex'),key=sha('echoprep-teacher:'+password);
const sql=`-- Teacher password for /teacher. Run in Supabase → SQL Editor. Replaces the previous teacher password/link.\ninsert into public.echoprep_keys (role, key_hash) values ('teacher', '${sha(key)}')\non conflict (role) do update set key_hash = excluded.key_hash;\n`;
await mkdir('.private',{recursive:true});await writeFile('.private/set-teacher-password.sql',sql,{mode:0o600});
process.stdout.write(sql);
