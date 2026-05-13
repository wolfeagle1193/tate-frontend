#!/usr/bin/env node
// ── Voir les chapitres 3ème dans la DB Taté ──────────────────
// Lancer : node voir-chapitres.cjs
const https = require('https');
const http  = require('http');

const API   = 'https://tate-backend-gkdg.onrender.com/api';
const EMAIL = 'admin@tate.sn';
const PASS  = 'TateAdmin2024!';

function req(method, url, body, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const bs = body ? JSON.stringify(body) : null;
    const r = lib.request({
      hostname: u.hostname, port: u.port||(u.protocol==='https:'?443:80),
      path: u.pathname+u.search, method,
      headers: {
        'Content-Type':'application/json',
        ...(token?{'Authorization':'Bearer '+token}:{}),
        ...(bs?{'Content-Length':Buffer.byteLength(bs)}:{})
      }, timeout: 30000
    }, res => {
      let d=''; res.on('data',c=>d+=c);
      res.on('end',()=>{ try{resolve({s:res.statusCode,b:JSON.parse(d)})}catch{resolve({s:res.statusCode,b:d})} });
    });
    r.on('error',reject);
    r.on('timeout',()=>{ r.destroy(); reject(new Error('timeout')); });
    if(bs) r.write(bs);
    r.end();
  });
}

async function main() {
  // Login
  process.stdout.write('🔐  Login...');
  const lr = await req('POST', `${API}/auth/login`, { email:EMAIL, password:PASS });
  const token = lr.b?.data?.token || lr.b?.data?.accessToken;
  if (!token) { console.log('\n❌  Login échoué:', lr.b?.error || lr.s); process.exit(1); }
  console.log(' ✅');

  // Chapitres
  process.stdout.write('📚  Chapitres 3ème...');
  const cr = await req('GET', `${API}/chapitres?niveau=3eme`, null, token);
  const chaps = cr.b?.data || [];
  if (!chaps.length) { console.log('\n❌  Aucun chapitre:', cr.b?.error || cr.s); process.exit(1); }
  console.log(` ✅  ${chaps.length} chapitres\n`);

  console.log('══════════════════════════════════════════════════════');
  chaps.forEach((c, i) => {
    const mat = c.matiereId?.nom || (typeof c.matiereId === 'string' ? c.matiereId : '?');
    console.log(`${String(i+1).padStart(2)}. [${mat}] ${c.titre}`);
    console.log(`    ID: ${c._id}`);
  });
  console.log('══════════════════════════════════════════════════════');
  console.log('\nCopie-colle ce résultat et envoie-le pour corriger le mapping.\n');
}

main().catch(e => { console.error('💥', e.message); process.exit(1); });
