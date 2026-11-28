#!/usr/bin/env node
// Makes the two secret keys for online history and the SQL that registers their hashes in Supabase.
// Writes .private/cloud-keys.json and .private/set-keys.sql (both git-ignored). Running it again replaces
// both keys: old student/teacher links stop working once the new set-keys.sql is run.
// Usage: node scripts/make-cloud-keys.mjs [site-url]
import {randomBytes,createHash} from 'node:crypto';import {mkdir,writeFile} from 'node:fs/promises';
const site=(process.argv[2]||'https://flogdinh.github.io/echoprep/').replace(/\/?$/,'/');
const key=()=>randomBytes(32).toString('base64url'),hash=k=>createHash('sha256').update(k,'utf8').digest('hex');
const keys={student:key(),teacher:key()};
await mkdir('.private',{recursive:true});
await writeFile('.private/cloud-keys.json',JSON.stringify({...keys,studentLink:`${site}#connect=${keys.student}`,teacherLink:`${site}#teacher=${keys.teacher}`},null,2)+'\n',{mode:0o600});
await writeFile('.private/set-keys.sql',`-- Run in Supabase → SQL Editor after supabase/echoprep-history.sql. Replaces any previous keys.\ninsert into public.echoprep_keys (role, key_hash) values\n  ('student', '${hash(keys.student)}'),\n  ('teacher', '${hash(keys.teacher)}')\non conflict (role) do update set key_hash = excluded.key_hash;\n`,{mode:0o600});
console.log('Wrote .private/cloud-keys.json (links for you and your teacher) and .private/set-keys.sql (run it in Supabase).');
