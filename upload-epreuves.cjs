#!/usr/bin/env node
// ============================================================
//  upload-epreuves.cjs — Taté · Upload épreuves BFEM HG 3ème
//  Lancer depuis tate-frontend :  node upload-epreuves.cjs
// ============================================================

const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');

const API   = 'https://tate-backend-gkdg.onrender.com/api';
const EMAIL = 'admin@tate.sn';
const PASS  = 'TateAdmin2024!';
const DIR   = path.join(__dirname, 'lecons-hg');
const DELAY = 600;

// ── Épreuves à uploader ──────────────────────────────────────
const EPREUVES = [
  // ── HISTOIRE ──────────────────────────────────────────────
  {
    f:           'BFEM-HG-S1-revolution-industrielle.html',
    type:        'BFEM',
    matiere:     'Histoire',
    niveau:      '3eme',
    annee:       2024,
    session:     'Normale',
    titre:       'La Révolution industrielle et ses mutations',
    duree:       '1h30',
    coefficient: 2,
  },
  {
    f:           'BFEM-HG-S2-imperialisme-afrique.html',
    type:        'BFEM',
    matiere:     'Histoire',
    niveau:      '3eme',
    annee:       2024,
    session:     'Normale',
    titre:       "L'impérialisme européen en Afrique",
    duree:       '1h30',
    coefficient: 2,
  },
  {
    f:           'BFEM-HG-S3-imperialisme-monde.html',
    type:        'BFEM',
    matiere:     'Histoire',
    niveau:      '3eme',
    annee:       2024,
    session:     'Remplacement',
    titre:       "L'impérialisme dans le monde (Asie, Amérique, Japon)",
    duree:       '1h30',
    coefficient: 2,
  },
  {
    f:           'BFEM-HG-S4-conflits-revolutions.html',
    type:        'BFEM',
    matiere:     'Histoire',
    niveau:      '3eme',
    annee:       2023,
    session:     'Normale',
    titre:       'Conflits et révolutions : Chine, Doctrine Truman',
    duree:       '1h30',
    coefficient: 2,
  },
  {
    f:           'BFEM-HG-S5-decolonisation.html',
    type:        'BFEM',
    matiere:     'Histoire',
    niveau:      '3eme',
    annee:       2023,
    session:     'Remplacement',
    titre:       'Décolonisation et Guerre Froide',
    duree:       '1h30',
    coefficient: 2,
  },
  {
    f:           'BFEM-HG-S6-premiere-guerre-mondiale.html',
    type:        'BFEM',
    matiere:     'Histoire',
    niveau:      '3eme',
    annee:       2022,
    session:     'Normale',
    titre:       'La Première Guerre Mondiale (1914–1918)',
    duree:       '1h30',
    coefficient: 2,
  },
  {
    f:           'BFEM-HG-S7-deuxieme-guerre-mondiale-crise.html',
    type:        'BFEM',
    matiere:     'Histoire',
    niveau:      '3eme',
    annee:       2022,
    session:     'Remplacement',
    titre:       'La Crise des années 30 et la Deuxième Guerre Mondiale',
    duree:       '1h30',
    coefficient: 2,
  },
  {
    f:           'BFEM-HG-S8-senegal-independance-tiers-monde.html',
    type:        'BFEM',
    matiere:     'Histoire',
    niveau:      '3eme',
    annee:       2021,
    session:     'Normale',
    titre:       'Le Sénégal indépendant et le Tiers-Monde',
    duree:       '1h30',
    coefficient: 2,
  },
  // ── GÉOGRAPHIE ────────────────────────────────────────────
  {
    f:           'BFEM-GEO-S1-rechauffement-climatique.html',
    type:        'BFEM',
    matiere:     'Géographie',
    niveau:      '3eme',
    annee:       2024,
    session:     'Normale',
    titre:       'Réchauffement climatique et développement durable',
    duree:       '1h30',
    coefficient: 2,
  },
  {
    f:           'BFEM-GEO-S2-developpement-systemes-economiques.html',
    type:        'BFEM',
    matiere:     'Géographie',
    niveau:      '3eme',
    annee:       2024,
    session:     'Remplacement',
    titre:       'Développement et systèmes économiques',
    duree:       '1h30',
    coefficient: 2,
  },
  {
    f:           'BFEM-GEO-S3-communication-APD.html',
    type:        'BFEM',
    matiere:     'Géographie',
    niveau:      '3eme',
    annee:       2023,
    session:     'Normale',
    titre:       "Communication et coopération internationale (APD)",
    duree:       '1h30',
    coefficient: 2,
  },
  {
    f:           'BFEM-GEO-S4-ressources-surexploitation.html',
    type:        'BFEM',
    matiere:     'Géographie',
    niveau:      '3eme',
    annee:       2023,
    session:     'Remplacement',
    titre:       'Les ressources naturelles et leur surexploitation',
    duree:       '1h30',
    coefficient: 2,
  },
  {
    f:           'BFEM-GEO-S5-inegalites-developpement.html',
    type:        'BFEM',
    matiere:     'Géographie',
    niveau:      '3eme',
    annee:       2022,
    session:     'Normale',
    titre:       'Les inégalités de développement dans le monde',
    duree:       '1h30',
    coefficient: 2,
  },
  {
    f:           'BFEM-GEO-S6-mondialisation-planete-village.html',
    type:        'BFEM',
    matiere:     'Géographie',
    niveau:      '3eme',
    annee:       2022,
    session:     'Remplacement',
    titre:       'La mondialisation et la planète village',
    duree:       '1h30',
    coefficient: 2,
  },
];

// ── Couleurs ─────────────────────────────────────────────────
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
      }, timeout: 60000
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
const sleep = ms => new Promise(r=>setTimeout(r,ms));

// ── MAIN ─────────────────────────────────────────────────────
async function main() {
  console.log(`\n${B}${W}══════════════════════════════════════════════${X}`);
  console.log(`${B}${W}   📝  Taté Upload — Épreuves BFEM HG 3ème    ${X}`);
  console.log(`${B}${W}══════════════════════════════════════════════${X}\n`);

  // 1. LOGIN
  process.stdout.write('🔐  Connexion admin...');
  const lr = await req('POST', `${API}/auth/login`, { email:EMAIL, password:PASS });
  const token = lr.b?.data?.token || lr.b?.data?.accessToken;
  if (!token) { console.log(`\n${R}❌  Login échoué: ${lr.b?.error||lr.s}${X}`); process.exit(1); }
  console.log(` ${G}✅  OK${X}`);

  // 2. UPLOAD
  console.log(`\n📤  Upload de ${EPREUVES.length} épreuves...\n`);
  let ok=0, skip=0, err=0, exist=0;

  for (const ep of EPREUVES) {
    const fp = path.join(DIR, ep.f);
    const label = ep.titre.padEnd(52);
    process.stdout.write(`  📄  ${label}`);

    if (!fs.existsSync(fp)) {
      console.log(` ${Y}⚠️  fichier manquant${X}`); skip++; continue;
    }

    try {
      const contenuHTML = fs.readFileSync(fp, 'utf-8');
      const body = {
        type:        ep.type,
        matiere:     ep.matiere,
        niveau:      ep.niveau,
        annee:       ep.annee,
        session:     ep.session,
        titre:       ep.titre,
        duree:       ep.duree,
        coefficient: ep.coefficient,
        contenuHTML,
        enonce:      '',
        questions:   [],
        publie:      false,
      };

      const r = await req('POST', `${API}/epreuves`, body, token);

      if ((r.s === 201 || r.s === 200) && (r.b?.success || r.b?.data?._id)) {
        const id = r.b?.data?._id || r.b?._id;
        // Publier
        if (id) {
          const pub = await req('PATCH', `${API}/epreuves/${id}/publier`, {}, token);
          const pubOk = pub.s === 200 && pub.b?.success;
          console.log(` ${G}✅  ${pubOk ? 'publiée' : 'créée'}${X}`);
        } else {
          console.log(` ${G}✅  créée${X}`);
        }
        ok++;
      } else if (r.s===409 || (r.b?.error||r.b?.message||'').toLowerCase().includes('exist')) {
        console.log(` ${Y}⏭️  déjà existante${X}`); exist++;
      } else {
        console.log(` ${R}❌  ${r.s}: ${JSON.stringify(r.b?.error||r.b?.message||r.b).substring(0,80)}${X}`); err++;
      }
    } catch(e) {
      console.log(` ${R}❌  ${e.message}${X}`); err++;
    }
    await sleep(DELAY);
  }

  // 3. BILAN
  console.log(`\n${B}══════════════════════════════════════════════${X}`);
  console.log(`  ${G}✅  Publiées      : ${ok}${X}`);
  console.log(`  ${Y}⏭️   Déjà là       : ${exist}${X}`);
  console.log(`  ${Y}⚠️   Fichiers manq : ${skip}${X}`);
  console.log(`  ${R}❌  Erreurs       : ${err}${X}`);
  console.log(`\n${G}${W}✨  Terminé !${X}\n`);
}

main().catch(e => { console.error(`\n${R}💥  ${e.message}${X}`); process.exit(1); });
