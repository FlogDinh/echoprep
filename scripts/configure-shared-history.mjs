import {createInterface} from 'node:readline/promises';
import {writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {create}=createRequire(import.meta.url)('../dist/shared-history.js');
const prompt=createInterface({input:process.stdin,output:process.stdout});
try{
 const url=(await prompt.question('Supabase Project URL: ')).trim().replace(/\/$/,'');
 const publishableKey=(await prompt.question('Publishable key (hoặc anon key; không dùng secret/service_role): ')).trim();
 const config={url,publishableKey};if(!create({config}).status().configured)throw Error('Project URL hoặc public key chưa hợp lệ.');
 await writeFile(new URL('../dist/shared-history-config.js',import.meta.url),'// Public browser configuration. Do not put Secret/service_role keys here.\nwindow.ECHO_HISTORY_CONFIG='+JSON.stringify(config)+';\n');
 console.log('Đã cấu hình. Chạy supabase/shared-history.sql trong SQL Editor rồi triển khai dist lên GitHub Pages.');
}finally{prompt.close()}
