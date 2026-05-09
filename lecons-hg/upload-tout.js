#!/usr/bin/env node
// ============================================================
// upload-tout.js — Upload automatique de TOUTES les leçons HG 3e
// Taté API · Se connecte, récupère les chapitres, uploade tout.
//
// USAGE (depuis ce dossier) :
//   node upload-tout.js
//
// PRÉREQUIS : Node.js installé, connexion internet
// ============================================================

const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');

// ─── CONFIG ────────────────────────────────────────────────
const CONFIG = {
  apiBase:  'https://api.tate.sn/api',
  email:    'admin@tate.sn',
  password: 'TateAdmin2024!',
  dir:      __dirname,
  delayMs:  400,   // délai entre chaque upload (ms)
};

// ─── Mapping fichier → indices de recherche dans la DB ─────
const FICHIERS = [
  // ── HISTOIRE ──────────────────────────────────────────────
  { file:'HG-3e-L01-decouvertes-scientifiques.html',       mat:'Histoire', hint:'découvertes scientifiques mutations' },
  { file:'HG-3e-L02-capitalisme-mutations-sociales.html',  mat:'Histoire', hint:'capitalisme mutations sociales' },
  { file:'HG-3e-L03-doctrines-sociales.html',              mat:'Histoire', hint:'doctrines sociales syndicalisme socialisme' },
  { file:'HG-3e-L05-missions-explorations.html',           mat:'Histoire', hint:'missions explorations' },
  { file:'HG-3e-L06-rivalites-berlin.html',                mat:'Histoire', hint:'rivalités berlin coloniales' },
  { file:'HG-3e-L07-resistances-africaines.html',          mat:'Histoire', hint:'résistances africaines formes' },
  { file:'HG-3e-L08-systemes-coloniaux.html',              mat:'Histoire', hint:'systèmes coloniaux français britannique' },
  { file:'HG-3e-L10-imperialisme-japonais.html',           mat:'Histoire', hint:'impérialisme japonais' },
  { file:'HG-3e-L11-imperialisme-europeen-asie.html',      mat:'Histoire', hint:'impérialisme européen asie' },
  { file:'HG-3e-L12-imperialisme-americain.html',          mat:'Histoire', hint:'impérialisme américain' },
  { file:'HG-3e-L13-revolutions-chinoises.html',           mat:'Histoire', hint:'révolutions chinoises sun wen mao' },
  { file:'HG-3e-L14-premiere-guerre-mondiale.html',        mat:'Histoire', hint:'première guerre mondiale' },
  { file:'HG-3e-L15-revolution-russe.html',                mat:'Histoire', hint:'révolution russe' },
  { file:'HG-3e-L16-crise-annees-trente.html',             mat:'Histoire', hint:'crise années trente' },
  { file:'HG-3e-L17-deuxieme-guerre-mondiale.html',        mat:'Histoire', hint:'deuxième guerre mondiale' },
  { file:'HG-3e-L18-guerre-froide.html',                   mat:'Histoire', hint:'guerre froide relations est-ouest' },
  { file:'HG-3e-L19-causes-formes-decolonisation.html',    mat:'Histoire', hint:'décolonisation causes formes' },
  { file:'HG-3e-L20-senegal-vie-politique-1944-1962.html', mat:'Histoire', hint:'sénégal vie politique' },
  { file:'HG-3e-L21-bandoeng-tiers-monde.html',            mat:'Histoire', hint:'bandoeng tiers-monde' },
  // ── GÉOGRAPHIE ────────────────────────────────────────────
  { file:'GEO-3e-L01-terre-systeme-solaire.html',              mat:'Géographie', hint:'terre système solaire' },
  { file:'GEO-3e-L02-terre-potentiel-equilibres.html',         mat:'Géographie', hint:'potentiel équilibres' },
  { file:'GEO-3e-L03-surexploitation-ressources.html',         mat:'Géographie', hint:'surexploitation ressources' },
  { file:'GEO-3e-L04-consequences-climatiques.html',           mat:'Géographie', hint:'conséquences climatiques pollution' },
  { file:'GEO-3e-L05-inegalites-developpement.html',           mat:'Géographie', hint:'inégalités développement' },
  { file:'GEO-3e-L06-systemes-economiques.html',               mat:'Géographie', hint:'systèmes économiques capitalisme' },
  { file:'GEO-3e-L07-cooperation-bilaterale-multilaterale.html',mat:'Géographie', hint:'coopération bilatérale multilatérale' },
  { file:'GEO-3e-L08-formes-communication.html',               mat:'Géographie', hint:'formes problèmes communication' },
  { file:'GEO-3e-L09-planete-village.html',                    mat:'Géographie', hint:'planète village' },
];

// ─── HTTP helper ────────────────────────────────────────────
function req(method, urlStr, body, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const lib = u.protocol === 'https:' ? https : http;
    const bodyStr = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
      timeout: 30000,
    };
    const r = lib.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    r.on('error', reject);
    r.on('timeout', () => { r.destroy(); reject(new Error('timeout')); });
    if (bodyStr) r.write(bodyStr);
    r.end();
  });
}

// ─── Normalisation fuzzy matching ───────────────────────────
function norm(s) {
  return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]/g,' ').trim();
}
function score(titre, hint) {
  const t = norm(titre), words = norm(hint).split(/\s+/).filter(w=>w.length>2);
  return words.reduce((n,w) => n + (t.includes(w) ? 1 : 0), 0);
}
function findChapitre(chapitres, mat, hint) {
  const mNorm = norm(mat).split(' ')[0];
  const candidates = chapitres.filter(c => norm(c.matiereId?.nom||'').includes(mNorm));
  const pool = candidates.length ? candidates : chapitres;
  const scored = pool.map(c => ({ c, s: score(c.titre, hint) })).sort((a,b) => b.s - a.s);
  return scored[0]?.s > 0 ? scored[0].c : null;
}

// ─── Delay ──────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Extract <title> ────────────────────────────────────────
function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : 'Leçon sans titre';
}

// ─── Couleur console ────────────────────────────────────────
const G='\x1b[32m', R='\x1b[31m', Y='\x1b[33m', B='\x1b[36m', W='\x1b[37m', X='\x1b[0m';

// ─── MAIN ────────────────────────────────────────────────────
async function main() {
  console.log(`\n${B}═══════════════════════════════════════════${X}`);
  console.log(`${B}  🎓  Taté Upload — HG 3ème — Toutes leçons${X}`);
  console.log(`${B}═══════════════════════════════════════════${X}\n`);

  // 1. LOGIN
  process.stdout.write(`🔐  Connexion à ${CONFIG.apiBase}...`);
  let token;
  try {
    const r = await req('POST', `${CONFIG.apiBase}/auth/login`, {
      email: CONFIG.email,
      motDePasse: CONFIG.password
    });
    if (r.status === 200 && r.body.success) {
      token = r.body.data?.token || r.body.data?.accessToken;
      console.log(` ${G}✅  Connecté${X}`);
    } else {
      console.log(` ${R}❌  Échec login${X}`, r.body?.error || r.status);
      process.exit(1);
    }
  } catch(e) {
    console.log(` ${R}❌  Erreur réseau: ${e.message}${X}`);
    process.exit(1);
  }

  // 2. CHAPITRES
  process.stdout.write(`📚  Récupération des chapitres (niveau=3eme)...`);
  let chapitres;
  try {
    const r = await req('GET', `${CONFIG.apiBase}/chapitres?niveau=3eme`, null, token);
    if (r.status === 200 && r.body.success) {
      chapitres = r.body.data;
      console.log(` ${G}✅  ${chapitres.length} chapitres${X}`);
    } else {
      console.log(` ${R}❌${X}`, r.body?.error);
      process.exit(1);
    }
  } catch(e) {
    console.log(` ${R}❌  ${e.message}${X}`);
    process.exit(1);
  }

  // 3. UPLOAD
  console.log(`\n📤  Début de l'upload (${FICHIERS.length} fichiers)\n`);
  const stats = { ok:0, skip:0, err:0, already:0 };

  for (const entry of FICHIERS) {
    const filePath = path.join(CONFIG.dir, entry.file);
    if (!fs.existsSync(filePath)) {
      console.log(`${Y}⚠️   ${entry.file} — fichier introuvable${X}`);
      stats.skip++; continue;
    }

    const chapitre = findChapitre(chapitres, entry.mat, entry.hint);
    if (!chapitre) {
      console.log(`${Y}⚠️   ${entry.file} — chapitre non trouvé (${entry.mat}: "${entry.hint}")${X}`);
      stats.skip++; continue;
    }

    const html = fs.readFileSync(filePath, 'utf-8');
    const titre = extractTitle(html);
    process.stdout.write(`  📄  ${entry.file.padEnd(52)} → "${chapitre.titre.substring(0,35)}"...`);

    try {
      const r = await req('POST', `${CONFIG.apiBase}/lecons/creer-html`, {
        chapitreId: chapitre._id,
        contenuHTML: html,
        exercices: [],
        instructionsHTML: '',
        genererExos: false,
        dureeExercices: null,
      }, token);

      if (r.status === 201 && r.body.success) {
        const leconId = r.body.data._id;
        // Publier
        const pub = await req('PUT', `${CONFIG.apiBase}/lecons/${leconId}/statut`,
          { statut: 'publie' }, token);
        const pubOk = pub.status === 200 && pub.body.success;
        console.log(` ${G}✅  ${pubOk ? '🟢 publiée' : '⚪ créée'}${X}`);
        stats.ok++;
      } else if ((r.body?.error||'').toLowerCase().includes('exist') || r.status === 409) {
        console.log(` ${Y}⏭️  déjà existante${X}`);
        stats.already++;
      } else {
        console.log(` ${R}❌  ${r.status}: ${r.body?.error||'?'}${X}`);
        stats.err++;
      }
    } catch(e) {
      console.log(` ${R}❌  ${e.message}${X}`);
      stats.err++;
    }

    await sleep(CONFIG.delayMs);
  }

  // 4. RÉSUMÉ
  console.log(`\n${B}═══════════════════════════════════════════${X}`);
  console.log(`${B}  📊  RÉSUMÉ${X}`);
  console.log(`${B}═══════════════════════════════════════════${X}`);
  console.log(`  ${G}✅  Uploadées & publiées : ${stats.ok}${X}`);
  console.log(`  ${Y}⏭️   Déjà existantes      : ${stats.already}${X}`);
  console.log(`  ${Y}⚠️   Ignorées             : ${stats.skip}${X}`);
  console.log(`  ${R}❌  Erreurs              : ${stats.err}${X}`);
  console.log(`\n${G}✨  Terminé !${X}\n`);
}

main().catch(e => { console.error(`\n${R}💥  Erreur fatale: ${e.message}${X}`); process.exit(1); });
