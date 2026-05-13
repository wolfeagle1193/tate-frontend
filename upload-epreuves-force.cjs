#!/usr/bin/env node
// ============================================================
//  upload-epreuves-force.cjs — Taté · Mise à jour FORCÉE des épreuves BFEM
//  ✅  Si l'épreuve existe déjà → met à jour contenuHTML + force publie:true
//  ✅  Si l'épreuve n'existe pas → la crée et la publie
//  ⚠️  Le PATCH /publier TOGGLE — ce script l'évite pour les existantes
//  Lancer depuis tate-frontend : node upload-epreuves-force.cjs
// ============================================================

const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');

const API   = process.env.API_URL || 'https://tate-backend-gkdg.onrender.com/api';
const EMAIL = 'admin@tate.sn';
const PASS  = 'TateAdmin2024!';
const DIR   = path.join(__dirname, 'lecons-hg');
const DELAY = 600; // ms entre chaque requête

// Couleurs terminal
const G='\x1b[32m', R='\x1b[31m', Y='\x1b[33m', B='\x1b[36m', W='\x1b[1m', X='\x1b[0m', M='\x1b[35m';

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

// ── HTTP helper ──────────────────────────────────────────────
function req(method, url, body, token) {
  return new Promise((resolve, reject) => {
    const u   = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const bs  = body ? JSON.stringify(body) : null;
    const r   = lib.request({
      hostname: u.hostname,
      port:     u.port || (u.protocol === 'https:' ? 443 : 80),
      path:     u.pathname + u.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
        ...(bs    ? { 'Content-Length': Buffer.byteLength(bs) } : {})
      },
      timeout: 60000
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ s: res.statusCode, b: JSON.parse(d) }); }
        catch { resolve({ s: res.statusCode, b: d }); }
      });
    });
    r.on('error', reject);
    r.on('timeout', () => { r.destroy(); reject(new Error('timeout')); });
    if (bs) r.write(bs);
    r.end();
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Normalise un titre pour comparaison ─────────────────────
function normTitre(s) {
  return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]/g,' ').replace(/\s+/g,' ').trim();
}
function titresProches(a, b) {
  const na = normTitre(a), nb = normTitre(b);
  if (na === nb) return true;
  // Chevauchement de mots significatifs
  const wa = new Set(na.split(' ').filter(w => w.length > 3));
  const wb = nb.split(' ').filter(w => w.length > 3);
  const communs = wb.filter(w => wa.has(w)).length;
  return communs >= Math.min(3, Math.floor(Math.min(wa.size, wb.length) * 0.6));
}

// ── MAIN ─────────────────────────────────────────────────────
async function main() {
  console.log(`\n${B}${W}══════════════════════════════════════════════════════${X}`);
  console.log(`${B}${W}   🔄  Taté — Mise à jour FORCÉE des épreuves BFEM   ${X}`);
  console.log(`${B}${W}══════════════════════════════════════════════════════${X}\n`);

  if (!require('fs').existsSync(DIR)) {
    console.error(`${R}❌  Dossier "lecons-hg" introuvable dans : ${__dirname}${X}`);
    process.exit(1);
  }

  // ── 1. LOGIN ─────────────────────────────────────────────────
  process.stdout.write('🔐  Connexion admin...');
  const lr = await req('POST', `${API}/auth/login`, { email: EMAIL, password: PASS });
  const token = lr.b?.data?.token || lr.b?.data?.accessToken;
  if (!token) {
    console.log(`\n${R}❌  Login échoué : ${lr.b?.error || lr.s}${X}`);
    process.exit(1);
  }
  console.log(` ${G}✅  OK${X}`);

  // ── 2. RÉCUPÈRE TOUTES LES ÉPREUVES EXISTANTES ──────────────
  process.stdout.write('📋  Chargement des épreuves existantes...');
  let existingEpreuves = [];
  try {
    // Admin voit tout (publie:true et false)
    const r = await req('GET', `${API}/epreuves`, null, token);
    const data = r.b?.data || r.b?.epreuves || (Array.isArray(r.b) ? r.b : []);
    existingEpreuves = data;
    console.log(` ${G}✅  ${existingEpreuves.length} épreuve(s) en base${X}`);
  } catch(e) {
    console.log(` ${Y}⚠️  Impossible de charger : ${e.message}${X}`);
  }

  // Map titre → épreuve pour recherche rapide
  function findExisting(ep) {
    return existingEpreuves.find(e =>
      titresProches(e.titre, ep.titre) &&
      e.matiere === ep.matiere &&
      e.niveau  === ep.niveau
    );
  }

  // ── 3. TRAITEMENT ────────────────────────────────────────────
  console.log(`\n📤  Traitement de ${EPREUVES.length} épreuves...\n`);
  let created = 0, updated = 0, skipped = 0, errors = 0;

  for (const ep of EPREUVES) {
    const fp    = path.join(DIR, ep.f);
    const label = ep.titre.padEnd(54);
    process.stdout.write(`  📄  ${label}`);

    if (!fs.existsSync(fp)) {
      console.log(` ${Y}⚠️  fichier HTML manquant${X}`);
      skipped++; continue;
    }

    try {
      const contenuHTML = fs.readFileSync(fp, 'utf-8');
      const existing    = findExisting(ep);

      if (existing) {
        // ── Cas 1 : épreuve existante → PUT pour mettre à jour ─
        const id  = existing._id;
        const up  = await req('PUT', `${API}/epreuves/${id}`, {
          type:        ep.type,
          matiere:     ep.matiere,
          niveau:      ep.niveau,
          annee:       ep.annee,
          session:     ep.session,
          titre:       ep.titre,
          duree:       ep.duree,
          coefficient: ep.coefficient,
          contenuHTML,
          publie:      true,   // force publiée directement
          enonce:      existing.enonce || '',
          questions:   existing.questions || [],
        }, token);

        if (up.s === 200 && (up.b?.success || up.b?.data)) {
          // Vérifie que publie est bien true
          const current = up.b?.data;
          if (current && !current.publie) {
            // Si le PUT n'a pas suffi, tente le PATCH (toggle) uniquement si publie === false
            await req('PATCH', `${API}/epreuves/${id}/publier`, {}, token);
          }
          console.log(` ${M}🔄  mise à jour + publiée${X}`);
          updated++;
        } else {
          console.log(` ${R}❌  PUT ${up.s} : ${JSON.stringify(up.b?.error||up.b?.message||'').substring(0,60)}${X}`);
          errors++;
        }

      } else {
        // ── Cas 2 : épreuve absente → POST + PATCH publier ────
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
          publie:      false,  // on commence à false, on toggle ensuite
        };

        const r = await req('POST', `${API}/epreuves`, body, token);

        if ((r.s === 201 || r.s === 200) && (r.b?.success || r.b?.data?._id)) {
          const id = r.b?.data?._id || r.b?._id;
          if (id) {
            // PATCH toggle → passe de false à true
            const pub = await req('PATCH', `${API}/epreuves/${id}/publier`, {}, token);
            const pubOk = pub.s === 200;
            console.log(` ${G}✅  créée ${pubOk ? '+ publiée' : '(publication échouée)'}${X}`);
          } else {
            console.log(` ${G}✅  créée (id manquant, non publiée)${X}`);
          }
          created++;
        } else if (r.s === 409 || (r.b?.error||r.b?.message||'').toLowerCase().includes('exist')) {
          // Existe mais pas trouvée par notre recherche de titre
          console.log(` ${Y}⚠️  conflit 409 — titre légèrement différent en base${X}`);
          skipped++;
        } else {
          console.log(` ${R}❌  POST ${r.s} : ${JSON.stringify(r.b?.error||r.b?.message||r.b).substring(0,60)}${X}`);
          errors++;
        }
      }
    } catch(e) {
      console.log(` ${R}❌  ${e.message}${X}`);
      errors++;
    }
    await sleep(DELAY);
  }

  // ── 4. BILAN ─────────────────────────────────────────────────
  console.log(`\n${B}${W}══════════════════════════════════════════════════════${X}`);
  console.log(`  ${G}✅  Créées        : ${created}${X}`);
  console.log(`  ${M}🔄  Mises à jour  : ${updated}${X}`);
  console.log(`  ${Y}⚠️   Ignorées      : ${skipped}${X}`);
  console.log(`  ${R}❌  Erreurs       : ${errors}${X}`);
  const total = created + updated;
  console.log(`\n  ${total === EPREUVES.length ? G : Y}📊  ${total}/${EPREUVES.length} épreuves traitées avec succès${X}`);

  if (skipped > 0) {
    console.log(`\n${Y}💡  Conseil pour les conflits 409 :${X}`);
    console.log(`   Allez dans le dashboard admin → Épreuves → trouvez l'épreuve`);
    console.log(`   et copiez son titre EXACT pour l'ajuster dans ce script.${X}`);
  }

  console.log(`\n${G}${W}✨  Terminé !${X}\n`);
}

main().catch(e => { console.error(`\n${R}💥  ${e.message}${X}`); process.exit(1); });
