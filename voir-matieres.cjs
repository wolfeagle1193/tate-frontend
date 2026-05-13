#!/usr/bin/env node
// Voir les matières et niveaux disponibles dans la DB
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
  process.stdout.write('🔐  Login...');
  const lr = await req('POST', `${API}/auth/login`, { email:EMAIL, password:PASS });
  const token = lr.b?.data?.token || lr.b?.data?.accessToken;
  if (!token) { console.log('\n❌', lr.b?.error || lr.s); process.exit(1); }
  console.log(' ✅\n');

  // Matières
  const mr = await req('GET', `${API}/matieres`, null, token);
  const matieres = mr.b?.data || mr.b || [];
  console.log('══ MATIÈRES (' + (Array.isArray(matieres)?matieres.length:'?') + ') ══');
  if (Array.isArray(matieres)) matieres.forEach(m => console.log('  · ' + m.nom + ' | ' + m._id));
  else console.log(JSON.stringify(mr.b, null, 2));

  // Niveaux
  const nr = await req('GET', `${API}/niveaux`, null, token);
  const niveaux = nr.b?.data || nr.b || [];
  console.log('\n══ NIVEAUX (' + (Array.isArray(niveaux)?niveaux.length:'?') + ') ══');
  if (Array.isArray(niveaux)) niveaux.forEach(n => console.log('  · ' + n.nom + ' | ' + n._id));
  else console.log(JSON.stringify(nr.b, null, 2));

  console.log('');
}

main().catch(e => { console.error('💥', e.message); process.exit(1); });
