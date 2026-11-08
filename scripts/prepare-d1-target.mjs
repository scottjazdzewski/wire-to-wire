/**
 * Prepare an isolated, temporary Wrangler config by looking up EXACTLY
 * the WTW D1 database in the account from the user's Cloudflare dashboard.
 *
 * This script cannot modify Cloudflare databases: only GET /d1/database.
 * Do not print or persist the API token.
 */
import fs from 'node:fs';
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const NAME = 'wtw-canon-desk-db';
if (!/^[0-9a-f]{32}$/i.test(ACCOUNT)) throw Error('WTW Cloudflare account ID missing/invalid');
if (!TOKEN) throw Error('Missing GitHub repository secret WTW_D1_IMPORT_TOKEN');
const endpoint = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/d1/database?name=${encodeURIComponent(NAME)}`;
const res = await fetch(endpoint,{headers:{Authorization:`Bearer ${TOKEN}`}});
if(!res.ok) throw Error(`Cloudflare database discovery returned HTTP ${res.status}`);
const data = await res.json();
if(!data.success || !Array.isArray(data.result)) throw Error('Cloudflare database discovery failed');
const matches=data.result.filter(x=>x.name===NAME);
if(matches.length!==1 || !/^[0-9a-f-]{36}$/i.test(matches[0].uuid||'')) {
  throw Error(`Expected precisely one ${NAME} database in the designated WTW account`);
}
const uuid=matches[0].uuid;
const file='.wtw-d1-import.jsonc';
fs.writeFileSync(file,JSON.stringify({
  name:'wtw-canon-desk-import-cli-only',
  compatibility_date:'2026-11-07',
  d1_databases:[{binding:'DB',database_name:NAME,database_id:uuid,migrations_dir:'migrations'}]
},null,2)+'\n',{mode:0o600});
if(process.env.GITHUB_ENV)fs.appendFileSync(process.env.GITHUB_ENV,`WTW_D1_UUID=${uuid}\n`);
console.log(`WTW import target verified: ${NAME}. Temporary Wrangler configuration prepared.`);
