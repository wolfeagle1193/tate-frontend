#!/usr/bin/env node
// ============================================================
//  setup-hg-3eme.cjs — Taté
//  1. Crée les chapitres Histoire & Géographie 3ème (si manquants)
//  2. Uploade et publie toutes les leçons HTML
//
//  Lancer depuis tate-frontend :
//    node setup-hg-3eme.cjs
// ============================================================

const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');

const API   = 'https://tate-backend-gkdg.onrender.com/api';
const EMAIL = 'admin@tate.sn';
const PASS  = 'TateAdmin2024!';
const DIR   = path.join(__dirname, 'lecons-hg');
const DELAY = 500;

// ── IDs connus ───────────────────────────────────────────────
const MAT = {
  histoire:   '69dfac0e4ecd2d59f0b98067',
  geographie: '69dfac0e4ecd2d59f0b98068',
};

// ── Chapitres à créer ────────────────────────────────────────
const CHAPITRES = [
  // Histoire
  { titre:'Les découvertes scientifiques et les mutations',   mat:'histoire',   num:'L01' },
  { titre:'Le capitalisme et les mutations sociales',          mat:'histoire',   num:'L02' },
  { titre:'Les doctrines sociales',                            mat:'histoire',   num:'L03' },
  { titre:'Les missions et explorations',                      mat:'histoire',   num:'L05' },
  { titre:'Les rivalités et la conférence de Berlin',          mat:'histoire',   num:'L06' },
  { titre:'Les résistances africaines',                        mat:'histoire',   num:'L07' },
  { titre:'Les systèmes coloniaux',                            mat:'histoire',   num:'L08' },
  { titre:"L'impérialisme japonais",                           mat:'histoire',   num:'L10' },
  { titre:"L'impérialisme européen en Asie",                   mat:'histoire',   num:'L11' },
  { titre:"L'impérialisme américain",                          mat:'histoire',   num:'L12' },
  { titre:'Les révolutions chinoises',                         mat:'histoire',   num:'L13' },
  { titre:'La première guerre mondiale',                       mat:'histoire',   num:'L14' },
  { titre:'La révolution russe',                               mat:'histoire',   num:'L15' },
  { titre:'La crise des années trente',                        mat:'histoire',   num:'L16' },
  { titre:'La deuxième guerre mondiale',                       mat:'histoire',   num:'L17' },
  { titre:'La guerre froide',                                  mat:'histoire',   num:'L18' },
  { titre:'Les causes et formes de la décolonisation',         mat:'histoire',   num:'L19' },
  { titre:'Le Sénégal et la vie politique (1944–1962)',         mat:'histoire',   num:'L20' },
  { titre:'Bandoeng et le tiers-monde',                        mat:'histoire',   num:'L21' },
  // Géographie
  { titre:'La Terre dans le système solaire',                  mat:'geographie', num:'L01' },
  { titre:'La Terre : potentiel et équilibres',                mat:'geographie', num:'L02' },
  { titre:'La surexploitation des ressources',                 mat:'geographie', num:'L03' },
  { titre:'Les conséquences climatiques et la pollution',      mat:'geographie', num:'L04' },
  { titre:"Les inégalités de développement",                   mat:'geographie', num:'L05' },
  { titre:'Les systèmes économiques',                          mat:'geographie', num:'L06' },
  { titre:'La coopération bilatérale et multilatérale',        mat:'geographie', num:'L07' },
  { titre:'Les formes de communication',                       mat:'geographie', num:'L08' },
  { titre:'La planète village',                                mat:'geographie', num:'L09' },
];

// ── Fichiers → chapitre (par num + mat) ──────────────────────
const LECONS = [
  { f:'HG-3e-L01-decouvertes-scientifiques.html',        mat:'histoire',   num:'L01' },
  { f:'HG-3e-L02-capitalisme-mutations-sociales.html',   mat:'histoire',   num:'L02' },
  { f:'HG-3e-L03-doctrines-sociales.html',               mat:'histoire',   num:'L03' },
  { f:'HG-3e-L05-missions-explorations.html',            mat:'histoire',   num:'L05' },
  { f:'HG-3e-L06-rivalites-berlin.html',                 mat:'histoire',   num:'L06' },
  { f:'HG-3e-L07-resistances-africaines.html',           mat:'histoire',   num:'L07' },
  { f:'HG-3e-L08-systemes-coloniaux.html',               mat:'histoire',   num:'L08' },
  { f:'HG-3e-L10-imperialisme-japonais.html',            mat:'histoire',   num:'L10' },
  { f:'HG-3e-L11-imperialisme-europeen-asie.html',       mat:'histoire',   num:'L11' },
  { f:'HG-3e-L12-imperialisme-americain.html',           mat:'histoire',   num:'L12' },
  { f:'HG-3e-L13-revolutions-chinoises.html',            mat:'histoire',   num:'L13' },
  { f:'HG-3e-L14-premiere-guerre-mondiale.html',         mat:'histoire',   num:'L14' },
  { f:'HG-3e-L15-revolution-russe.html',                 mat:'histoire',   num:'L15' },
  { f:'HG-3e-L16-crise-annees-trente.html',              mat:'histoire',   num:'L16' },
  { f:'HG-3e-L17-deuxieme-guerre-mondiale.html',         mat:'histoire',   num:'L17' },
  { f:'HG-3e-L18-guerre-froide.html',                    mat:'histoire',   num:'L18' },
  { f:'HG-3e-L19-causes-formes-decolonisation.html',     mat:'histoire',   num:'L19' },
  { f:'HG-3e-L20-senegal-vie-politique-1944-1962.html',  mat:'histoire',   num:'L20' },
  { f:'HG-3e-L21-bandoeng-tiers-monde.html',             mat:'histoire',   num:'L21' },
  { f:'GEO-3e-L01-terre-systeme-solaire.html',           mat:'geographie', num:'L01' },
  { f:'GEO-3e-L02-terre-potentiel-equilibres.html',      mat:'geographie', num:'L02' },
  { f:'GEO-3e-L03-surexploitation-ressources.html',      mat:'geographie', num:'L03' },
  { f:'GEO-3e-L04-consequences-climatiques.html',        mat:'geographie', num:'L04' },
  { f:'GEO-3e-L05-inegalites-developpement.html',        mat:'geographie', num:'L05' },
  { f:'GEO-3e-L06-systemes-economiques.html',            mat:'geographie', num:'L06' },
  { f:'GEO-3e-L07-cooperation-bilaterale-multilaterale.html', mat:'geographie', num:'L07' },
  { f:'GEO-3e-L08-formes-communication.html',            mat:'geographie', num:'L08' },
  { f:'GEO-3e-L09-planete-village.html',                 mat:'geographie', num:'L09' },
];

// ── Couleurs terminal ────────────────────────────────────────
const G='\x1b[32m',R='\x1b[31m',Y='\x1b[33m',B='\x1b[36m',W='\x1b[1m',X='\x1b[0m';

// ── HTTP helper ──────────────────────────────────────────────
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
      }, timeout: 45000
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

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── MAIN ─────────────────────────────────────────────────────
async function main() {
  console.log(`\n${B}${W}══════════════════════════════════════════════${X}`);
  console.log(`${B}${W}   🎓  Taté — Setup HG 3ème (chapitres + leçons)${X}`);
  console.log(`${B}${W}══════════════════════════════════════════════${X}\n`);

  if (!fs.existsSync(DIR)) {
    console.error(`${R}❌  Dossier "lecons-hg" introuvable dans : ${__dirname}${X}`);
    process.exit(1);
  }

  // ── 1. LOGIN ──────────────────────────────────────────────
  process.stdout.write('🔐  Connexion admin...');
  const lr = await req('POST', `${API}/auth/login`, { email:EMAIL, password:PASS });
  const token = lr.b?.data?.token || lr.b?.data?.accessToken;
  if (!token) { console.log(`\n${R}❌  Login échoué: ${lr.b?.error||lr.s}${X}`); process.exit(1); }
  console.log(` ${G}✅  OK${X}`);

  // ── 2. CHAPITRES EXISTANTS ────────────────────────────────
  process.stdout.write('📚  Chargement des chapitres HG existants...');
  const cr = await req('GET', `${API}/chapitres?niveau=3eme`, null, token);
  const existants = cr.b?.data || [];
  console.log(` ${G}✅  ${existants.length} trouvés${X}`);

  // Index existants : mat+num → _id
  // On va matcher par matiereId + mots-clés du titre
  const chapMap = {}; // clé: "mat:num" → _id

  // ── 3. CRÉER LES CHAPITRES MANQUANTS ─────────────────────
  console.log(`\n📖  Création des chapitres manquants...\n`);
  let chapCrees = 0, chapExist = 0, chapErr = 0;

  for (const ch of CHAPITRES) {
    const key = `${ch.mat}:${ch.num}`;
    const matiereId = MAT[ch.mat];
    const label = ch.titre.padEnd(55);
    process.stdout.write(`  📁  ${label}`);

    // Essaie POST /api/chapitres
    try {
      const body = {
        titre: ch.titre,
        matiereId,
        niveau: '3eme',
        description: '',
        objectif: `Comprendre et maîtriser les notions essentielles : ${ch.titre}.`,
        ordre: parseInt(ch.num.replace('L','')) || 1,
      };
      const r = await req('POST', `${API}/chapitres`, body, token);

      if ((r.s === 201 || r.s === 200) && (r.b?.success || r.b?.data?._id || r.b?._id)) {
        const id = r.b?.data?._id || r.b?._id;
        chapMap[key] = id;
        console.log(` ${G}✅  créé${X}`);
        chapCrees++;
      } else if (r.s === 409 || (r.b?.error||'').toLowerCase().includes('exist') || (r.b?.message||'').toLowerCase().includes('exist')) {
        // Déjà existant — chercher dans existants
        const found = trouverDansExistants(existants, ch.mat, ch.titre);
        if (found) {
          chapMap[key] = found._id;
          console.log(` ${Y}⏭️  déjà là${X}`);
        } else {
          console.log(` ${Y}⏭️  déjà là (id inconnu)${X}`);
        }
        chapExist++;
      } else {
        // Peut-être que l'endpoint attend un format différent
        console.log(` ${R}❌  ${r.s}: ${JSON.stringify(r.b?.error||r.b?.message||r.b).substring(0,80)}${X}`);
        chapErr++;
      }
    } catch(e) {
      console.log(` ${R}❌  ${e.message}${X}`);
      chapErr++;
    }
    await sleep(300);
  }

  // Re-charger les chapitres pour récupérer ceux qui existaient déjà
  if (chapExist > 0 || chapErr > 0) {
    const cr2 = await req('GET', `${API}/chapitres?niveau=3eme`, null, token);
    const tous = cr2.b?.data || [];
    for (const ch of CHAPITRES) {
      const key = `${ch.mat}:${ch.num}`;
      if (!chapMap[key]) {
        const found = trouverDansExistants(tous, ch.mat, ch.titre);
        if (found) chapMap[key] = found._id;
      }
    }
  }

  console.log(`\n  ${G}✅ Créés : ${chapCrees}${X}  ${Y}⏭️  Existants : ${chapExist}${X}  ${R}❌ Erreurs : ${chapErr}${X}`);

  // ── 4. UPLOAD DES LEÇONS ──────────────────────────────────
  console.log(`\n\n📤  Upload des leçons...\n`);
  let ok=0, skip=0, err=0, exist=0;

  for (const entry of LECONS) {
    const key = `${entry.mat}:${entry.num}`;
    const chapId = chapMap[key];
    const fp = path.join(DIR, entry.f);
    const label = entry.f.replace('.html','').padEnd(52);

    if (!fs.existsSync(fp)) {
      console.log(`${Y}⚠️  ${label} — fichier manquant${X}`); skip++; continue;
    }
    if (!chapId) {
      console.log(`${Y}⚠️  ${label} — chapitreId introuvable${X}`); skip++; continue;
    }

    process.stdout.write(`  📄  ${label}`);
    try {
      const html = fs.readFileSync(fp, 'utf-8');
      const r = await req('POST', `${API}/lecons/creer-html`, {
        chapitreId: chapId,
        contenuHTML: html,
        exercices: [],
        instructionsHTML: '',
        genererExos: false,
        dureeExercices: null,
      }, token);

      if ((r.s === 201 || r.s === 200) && r.b?.success) {
        const id = r.b.data._id;
        const pub = await req('PUT', `${API}/lecons/${id}/statut`, { statut:'publie' }, token);
        const pubOk = pub.s === 200 && pub.b?.success;
        console.log(` ${G}✅  ${pubOk ? 'publiée' : 'créée (non publiée)'}${X}`);
        ok++;
      } else if (r.s===409 || (r.b?.error||r.b?.message||'').toLowerCase().includes('exist')) {
        console.log(` ${Y}⏭️  déjà existante${X}`); exist++;
      } else {
        console.log(` ${R}❌  ${r.s}: ${r.b?.error||r.b?.message||'?'}${X}`); err++;
      }
    } catch(e) {
      console.log(` ${R}❌  ${e.message}${X}`); err++;
    }
    await sleep(DELAY);
  }

  // ── 5. BILAN FINAL ────────────────────────────────────────
  console.log(`\n${B}══════════════════════════════════════════════${X}`);
  console.log(`${B}  📊  BILAN FINAL${X}`);
  console.log(`${B}══════════════════════════════════════════════${X}`);
  console.log(`  ${G}✅  Leçons publiées   : ${ok}${X}`);
  console.log(`  ${Y}⏭️   Déjà existantes  : ${exist}${X}`);
  console.log(`  ${Y}⚠️   Ignorées         : ${skip}${X}`);
  console.log(`  ${R}❌  Erreurs          : ${err}${X}`);
  console.log(`\n${G}${W}✨  Terminé !${X}\n`);
}

// ── Helper : trouver dans existants par matière + titre ──────
function norm(s) {
  return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]/g,' ').trim();
}
function trouverDansExistants(chapitres, mat, titre) {
  const mNorm = norm(mat === 'histoire' ? 'Histoire' : 'Géographie').split(' ')[0];
  const tNorm = norm(titre);
  const pool = chapitres.filter(c => norm(c.matiereId?.nom||'').includes(mNorm));
  // Cherche correspondance exacte ou proche
  const words = tNorm.split(/\s+/).filter(w=>w.length>3);
  let best = null, bestScore = 0;
  for (const c of (pool.length ? pool : chapitres)) {
    const ct = norm(c.titre);
    const score = words.reduce((n,w) => n+(ct.includes(w)?1:0), 0);
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return bestScore > 0 ? best : null;
}

main().catch(e => { console.error(`\n${'\x1b[31m'}💥  ${e.message}${'\x1b[0m'}`); process.exit(1); });
