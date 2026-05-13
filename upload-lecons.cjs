#!/usr/bin/env node
// ============================================================
//  upload-lecons.js — Taté · Upload leçons HG 3ème
//  Placer ce fichier dans le dossier tate-frontend
//  Lancer : node upload-lecons.js
// ============================================================

const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');

// URL de l'API — choisir selon l'environnement:
// Option 1 : backend local (lance 'd'abord : cd tate-backend && npm start')
// Option 2 : backend Render (si déployé)
const API = process.env.API_URL || 'https://tate-backend-gkdg.onrender.com/api';
// const API = 'https://tate-backend.onrender.com/api'; // ← décommenter si Render
const EMAIL  = 'admin@tate.sn';
const PASS   = 'TateAdmin2024!';
const DIR    = path.join(__dirname, 'lecons-hg');
const DELAY  = 400; // ms entre chaque requête

// Couleurs terminal
const C = { g:'\x1b[32m', r:'\x1b[31m', y:'\x1b[33m', b:'\x1b[36m', x:'\x1b[0m', w:'\x1b[1m' };

// ─── Mapping fichier → matière + mots-clés chapitre ─────────
const LECONS = [
  { f:'HG-3e-L01-decouvertes-scientifiques.html',        m:'Histoire',    k:'découvertes scientifiques mutations' },
  { f:'HG-3e-L02-capitalisme-mutations-sociales.html',   m:'Histoire',    k:'capitalisme mutations sociales' },
  { f:'HG-3e-L03-doctrines-sociales.html',               m:'Histoire',    k:'doctrines sociales syndicalisme' },
  { f:'HG-3e-L05-missions-explorations.html',            m:'Histoire',    k:'missions explorations' },
  { f:'HG-3e-L06-rivalites-berlin.html',                 m:'Histoire',    k:'rivalités berlin coloniales' },
  { f:'HG-3e-L07-resistances-africaines.html',           m:'Histoire',    k:'résistances africaines' },
  { f:'HG-3e-L08-systemes-coloniaux.html',               m:'Histoire',    k:'systèmes coloniaux' },
  { f:'HG-3e-L10-imperialisme-japonais.html',            m:'Histoire',    k:'impérialisme japonais' },
  { f:'HG-3e-L11-imperialisme-europeen-asie.html',       m:'Histoire',    k:'impérialisme européen asie' },
  { f:'HG-3e-L12-imperialisme-americain.html',           m:'Histoire',    k:'impérialisme américain' },
  { f:'HG-3e-L13-revolutions-chinoises.html',            m:'Histoire',    k:'révolutions chinoises mao' },
  { f:'HG-3e-L14-premiere-guerre-mondiale.html',         m:'Histoire',    k:'première guerre mondiale' },
  { f:'HG-3e-L15-revolution-russe.html',                 m:'Histoire',    k:'révolution russe' },
  { f:'HG-3e-L16-crise-annees-trente.html',              m:'Histoire',    k:'crise années trente' },
  { f:'HG-3e-L17-deuxieme-guerre-mondiale.html',         m:'Histoire',    k:'deuxième seconde guerre mondiale' },
  { f:'HG-3e-L18-guerre-froide.html',                    m:'Histoire',    k:'guerre froide relations est-ouest' },
  { f:'HG-3e-L19-causes-formes-decolonisation.html',     m:'Histoire',    k:'décolonisation causes formes' },
  { f:'HG-3e-L20-senegal-vie-politique-1944-1962.html',  m:'Histoire',    k:'sénégal vie politique' },
  { f:'HG-3e-L21-bandoeng-tiers-monde.html',             m:'Histoire',    k:'bandoeng tiers monde' },
  { f:'GEO-3e-L01-terre-systeme-solaire.html',           m:'Géographie',  k:'terre système solaire' },
  { f:'GEO-3e-L02-terre-potentiel-equilibres.html',      m:'Géographie',  k:'potentiel équilibres' },
  { f:'GEO-3e-L03-surexploitation-ressources.html',      m:'Géographie',  k:'surexploitation ressources' },
  { f:'GEO-3e-L04-consequences-climatiques.html',        m:'Géographie',  k:'conséquences climatiques pollution' },
  { f:'GEO-3e-L05-inegalites-developpement.html',        m:'Géographie',  k:'inégalités développement' },
  { f:'GEO-3e-L06-systemes-economiques.html',            m:'Géographie',  k:'systèmes économiques capitalisme socialisme' },
  { f:'GEO-3e-L07-cooperation-bilaterale-multilaterale.html', m:'Géographie', k:'coopération bilatérale multilatérale' },
  { f:'GEO-3e-L08-formes-communication.html',            m:'Géographie',  k:'formes communication' },
  { f:'GEO-3e-L09-planete-village.html',                 m:'Géographie',  k:'planète village' },
];

// ─── Helpers ─────────────────────────────────────────────────
function norm(s) {
  return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]/g,' ').trim();
}
function match(titre, keywords) {
  const t = norm(titre);
  return norm(keywords).split(/\s+/).filter(w=>w.length>2).reduce((n,w)=>n+(t.includes(w)?1:0),0);
}
function findChap(chapitres, mat, kw) {
  const m = norm(mat).split(' ')[0];
  const pool = chapitres.filter(c=>norm(c.matiereId?.nom||'').includes(m));
  const ranked = (pool.length ? pool : chapitres).map(c=>({c, s:match(c.titre,kw)})).sort((a,b)=>b.s-a.s);
  return ranked[0]?.s > 0 ? ranked[0].c : null;
}
function apiReq(method, url, body, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const bs = body ? JSON.stringify(body) : null;
    const r = lib.request({
      hostname: u.hostname, port: u.port||(u.protocol==='https:'?443:80),
      path: u.pathname+u.search, method,
      headers: {
        'Content-Type':'application/json',
        ...(token?{'Authorization':`Bearer ${token}`}:{}),
        ...(bs?{'Content-Length':Buffer.byteLength(bs)}:{})
      }, timeout: 30000
    }, res => {
      let d=''; res.on('data',c=>d+=c);
      res.on('end',()=>{ try{resolve({s:res.statusCode,b:JSON.parse(d)})}catch{resolve({s:res.statusCode,b:d})} });
    });
    r.on('error',reject); r.on('timeout',()=>{r.destroy();reject(new Error('timeout'));});
    if(bs) r.write(bs); r.end();
  });
}
const sleep = ms => new Promise(r=>setTimeout(r,ms));

// ─── MAIN ────────────────────────────────────────────────────
async function main() {
  console.log(`\n${C.b}${C.w}══════════════════════════════════════════${C.x}`);
  console.log(`${C.b}${C.w}   🎓  Taté Upload — Leçons HG 3ème        ${C.x}`);
  console.log(`${C.b}${C.w}══════════════════════════════════════════${C.x}\n`);

  // Vérifie que le dossier lecons-hg existe
  if (!fs.existsSync(DIR)) {
    console.error(`${C.r}❌  Dossier "lecons-hg" introuvable dans : ${__dirname}${C.x}`);
    process.exit(1);
  }

  // 1. LOGIN
  process.stdout.write(`🔐  Connexion admin...`);
  let token;
  try {
    const r = await apiReq('POST', `${API}/auth/login`, { email:EMAIL, password:PASS });
    token = r.b?.data?.token || r.b?.data?.accessToken;
    if (!token) throw new Error(r.b?.error || `HTTP ${r.s}`);
    console.log(` ${C.g}✅  OK${C.x}`);
  } catch(e) {
    console.log(`\n${C.r}❌  Login échoué : ${e.message}${C.x}`);
    process.exit(1);
  }

  // 2. CHAPITRES
  process.stdout.write(`📚  Chargement des chapitres 3ème...`);
  let chapitres;
  try {
    const r = await apiReq('GET', `${API}/chapitres?niveau=3eme`, null, token);
    chapitres = r.b?.data;
    if (!chapitres?.length) throw new Error(r.b?.error || 'aucun chapitre');
    console.log(` ${C.g}✅  ${chapitres.length} chapitres${C.x}`);
  } catch(e) {
    console.log(`\n${C.r}❌  ${e.message}${C.x}`); process.exit(1);
  }

  // 2b. AFFICHE les chapitres pour debug
  console.log('
📋  Chapitres trouvés dans la DB :');
  chapitres.forEach(c => {
    const mat = c.matiereId?.nom || c.matiereId || '?';
    console.log('  · [' + mat + '] ' + c.titre + ' → ' + c._id);
  });
  console.log('');

  // 3. UPLOAD
  console.log(`\n📤  Upload de ${LECONS.length} leçons...\n`);
  let ok=0, skip=0, err=0, exist=0;

  for (const entry of LECONS) {
    const fp = path.join(DIR, entry.f);
    const label = entry.f.replace('.html','').padEnd(50);

    if (!fs.existsSync(fp)) {
      console.log(`${C.y}⚠️  ${label} — fichier manquant${C.x}`); skip++; continue;
    }
    const chap = findChap(chapitres, entry.m, entry.k);
    if (!chap) {
      console.log(`${C.y}⚠️  ${label} — chapitre non trouvé${C.x}`); skip++; continue;
    }

    process.stdout.write(`  📄  ${label}`);
    try {
      const html = fs.readFileSync(fp, 'utf-8');
      const r = await apiReq('POST', `${API}/lecons/creer-html`, {
        chapitreId: chap._id, contenuHTML: html,
        exercices:[], instructionsHTML:'', genererExos:false, dureeExercices:null
      }, token);

      if (r.s === 201 && r.b.success) {
        const id = r.b.data._id;
        await apiReq('PUT', `${API}/lecons/${id}/statut`, {statut:'publie'}, token);
        console.log(` ${C.g}✅  publiée${C.x}`); ok++;
      } else if (r.s===409 || (r.b?.error||'').toLowerCase().includes('exist')) {
        console.log(` ${C.y}⏭️  déjà là${C.x}`); exist++;
      } else {
        console.log(` ${C.r}❌  ${r.s}: ${r.b?.error||'?'}${C.x}`); err++;
      }
    } catch(e) {
      console.log(` ${C.r}❌  ${e.message}${C.x}`); err++;
    }
    await sleep(DELAY);
  }

  // 4. BILAN
  console.log(`\n${C.b}══════════════════════════════════${C.x}`);
  console.log(`${C.g}  ✅  Publiées    : ${ok}${C.x}`);
  console.log(`${C.y}  ⏭️   Déjà là     : ${exist}${C.x}`);
  console.log(`${C.y}  ⚠️   Ignorées    : ${skip}${C.x}`);
  console.log(`${C.r}  ❌  Erreurs     : ${err}${C.x}`);
  console.log(`\n${C.g}${C.w}✨  Terminé !${C.x}\n`);
}

main().catch(e => { console.error(`\n${C.r}💥  ${e.message}${C.x}`); process.exit(1); });
