#!/usr/bin/env node
// ============================================================
//  upload-lecons-force.cjs — Taté · Mise à jour FORCÉE + DÉDUPLICATION
//  ✅  Si plusieurs leçons existent pour un chapitre → supprime les doublons
//  ✅  Mise à jour du contenu HTML de la leçon gardée
//  ✅  Si aucune leçon → la crée et la publie
//  Lancer depuis tate-frontend : node upload-lecons-force.cjs
// ============================================================

const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');

const API   = process.env.API_URL || 'https://tate-backend-gkdg.onrender.com/api';
const EMAIL = 'admin@tate.sn';
const PASS  = 'TateAdmin2024!';
const DIR   = path.join(__dirname, 'lecons-hg');
const DELAY = 500; // ms entre chaque requête

// Couleurs terminal
const C = { g:'\x1b[32m', r:'\x1b[31m', y:'\x1b[33m', b:'\x1b[36m', x:'\x1b[0m', w:'\x1b[1m', m:'\x1b[35m' };

// ─── Mapping fichier → matière + mots-clés chapitre ─────────
// Champs :
//   f  = nom du fichier HTML
//   m  = matière ('Histoire' ou 'Géographie')
//   k  = mots-clés pour trouver le chapitre en DB
//   t  = titre exact du chapitre à CRÉER si introuvable en DB
//   o  = ordre du chapitre (numéro de position dans le programme)
const LECONS = [
  // ── HISTOIRE ────────────────────────────────────────────────
  { f:'HG-3e-L01-decouvertes-scientifiques.html',              m:'Histoire',   k:'découvertes scientifiques mutations',      t:'Les découvertes scientifiques et les mutations du XIXe siècle',           o:1  },
  { f:'HG-3e-L02-capitalisme-mutations-sociales.html',         m:'Histoire',   k:'capitalisme mutations sociales',           t:'Le capitalisme et ses mutations sociales',                                 o:2  },
  { f:'HG-3e-L03-doctrines-sociales.html',                     m:'Histoire',   k:'doctrines sociales syndicalisme',          t:'Les doctrines sociales : le syndicalisme et le socialisme',                o:3  },
  { f:'HG-3e-L04-imperialisme-causes-acteurs.html',            m:'Histoire',   k:'impérialisme causes acteurs coloniale',    t:"L'impérialisme : définition, causes et acteurs",                           o:4  },
  { f:'HG-3e-L05-missions-explorations.html',                  m:'Histoire',   k:'missions explorations',                   t:'Les missions et les explorations en Afrique',                              o:5  },
  { f:'HG-3e-L06-rivalites-berlin.html',                       m:'Histoire',   k:'rivalités berlin coloniales',              t:'Les rivalités coloniales et la Conférence de Berlin',                      o:6  },
  { f:'HG-3e-L07-resistances-africaines.html',                 m:'Histoire',   k:'résistances africaines',                  t:'Les résistances africaines à la colonisation',                             o:7  },
  { f:'HG-3e-L08-systemes-coloniaux.html',                     m:'Histoire',   k:'systèmes coloniaux',                      t:'Les systèmes coloniaux en Afrique',                                        o:8  },
  { f:'HG-3e-L09-consequences-colonialisme.html',              m:'Histoire',   k:'conséquences colonialisme effets',         t:'Les conséquences du colonialisme en Afrique et en Asie',                   o:9  },
  { f:'HG-3e-L10-imperialisme-japonais.html',                  m:'Histoire',   k:'impérialisme japonais',                   t:"L'impérialisme japonais",                                                  o:10 },
  { f:'HG-3e-L11-imperialisme-europeen-asie.html',             m:'Histoire',   k:'impérialisme européen asie',              t:"L'impérialisme européen en Asie",                                           o:11 },
  { f:'HG-3e-L12-imperialisme-americain.html',                 m:'Histoire',   k:'impérialisme américain',                  t:"L'impérialisme américain",                                                  o:12 },
  { f:'HG-3e-L13-revolutions-chinoises.html',                  m:'Histoire',   k:'révolutions chinoises mao',               t:'Les révolutions chinoises',                                                o:13 },
  { f:'HG-3e-L14-premiere-guerre-mondiale.html',               m:'Histoire',   k:'première guerre mondiale',                t:'La Première Guerre Mondiale (1914-1918)',                                   o:14 },
  { f:'HG-3e-L15-revolution-russe.html',                       m:'Histoire',   k:'révolution russe',                        t:'La Révolution russe de 1917',                                               o:15 },
  { f:'HG-3e-L16-crise-annees-trente.html',                    m:'Histoire',   k:'crise années trente',                     t:'La crise des années trente',                                               o:16 },
  { f:'HG-3e-L17-deuxieme-guerre-mondiale.html',               m:'Histoire',   k:'deuxième seconde guerre mondiale',        t:'La Deuxième Guerre Mondiale (1939-1945)',                                   o:17 },
  { f:'HG-3e-L18-guerre-froide.html',                          m:'Histoire',   k:'guerre froide relations est-ouest',       t:'La Guerre froide et les relations Est-Ouest',                               o:18 },
  { f:'HG-3e-L19-causes-formes-decolonisation.html',           m:'Histoire',   k:'décolonisation causes formes',            t:'Les causes et les formes de la décolonisation',                            o:19 },
  { f:'HG-3e-L20-senegal-vie-politique-1944-1962.html',        m:'Histoire',   k:'sénégal vie politique',                   t:'Le Sénégal : vie politique de 1944 à 1962',                                o:20 },
  { f:'HG-3e-L21-bandoeng-tiers-monde.html',                   m:'Histoire',   k:'bandoeng tiers monde',                   t:'Bandoeng et le Tiers-Monde',                                               o:21 },
  // ── GÉOGRAPHIE ──────────────────────────────────────────────
  { f:'GEO-3e-L01-terre-systeme-solaire.html',                 m:'Géographie', k:'terre système solaire',                   t:'La Terre dans le système solaire',                                          o:1  },
  { f:'GEO-3e-L02-terre-potentiel-equilibres.html',            m:'Géographie', k:'potentiel équilibres',                    t:'La Terre : potentiel et équilibres naturels',                               o:2  },
  { f:'GEO-3e-L03-surexploitation-ressources.html',            m:'Géographie', k:'surexploitation ressources',              t:'La surexploitation des ressources naturelles',                              o:3  },
  { f:'GEO-3e-L04-consequences-climatiques.html',              m:'Géographie', k:'conséquences climatiques pollution',      t:'Les conséquences climatiques et la pollution',                              o:4  },
  { f:'GEO-3e-L05-inegalites-developpement.html',              m:'Géographie', k:'inégalités développement',                t:'Les inégalités de développement dans le monde',                            o:5  },
  { f:'GEO-3e-L06-systemes-economiques.html',                  m:'Géographie', k:'systèmes économiques capitalisme socialisme', t:'Les systèmes économiques : capitalisme et socialisme',                 o:6  },
  { f:'GEO-3e-L07-cooperation-bilaterale-multilaterale.html',  m:'Géographie', k:'coopération bilatérale multilatérale',   t:'La coopération internationale : bilatérale et multilatérale',              o:7  },
  { f:'GEO-3e-L08-formes-communication.html',                  m:'Géographie', k:'formes communication',                   t:'Les formes de communication dans le monde',                                 o:8  },
  { f:'GEO-3e-L09-planete-village.html',                       m:'Géographie', k:'planète village',                        t:'La planète village : mondialisation et interconnexion',                     o:9  },
];

// ─── Helpers ─────────────────────────────────────────────────
function norm(s) {
  return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]/g,' ').trim();
}
function matchScore(titre, keywords) {
  const t = norm(titre);
  return norm(keywords).split(/\s+/).filter(w=>w.length>2).reduce((n,w)=>n+(t.includes(w)?1:0),0);
}
function findChap(chapitres, mat, kw) {
  const m = norm(mat).split(' ')[0];
  const pool = chapitres.filter(c=>norm(c.matiereId?.nom||'').includes(m));
  const src  = pool.length ? pool : chapitres;
  const ranked = src.map(c=>({c, s:matchScore(c.titre, kw)})).sort((a,b)=>b.s-a.s);
  return ranked[0]?.s > 0 ? ranked[0].c : null;
}
function apiReq(method, url, body, token) {
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
        ...(token ? {'Authorization': `Bearer ${token}`} : {}),
        ...(bs    ? {'Content-Length': Buffer.byteLength(bs)} : {})
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

// ─── MAIN ────────────────────────────────────────────────────
async function main() {
  console.log(`\n${C.b}${C.w}═══════════════════════════════════════════════════════════${C.x}`);
  console.log(`${C.b}${C.w}   🔄  Taté — Mise à jour FORCÉE + DÉDUPLICATION leçons   ${C.x}`);
  console.log(`${C.b}${C.w}═══════════════════════════════════════════════════════════${C.x}\n`);

  if (!fs.existsSync(DIR)) {
    console.error(`${C.r}❌  Dossier "lecons-hg" introuvable : ${__dirname}${C.x}`);
    process.exit(1);
  }

  // ── 1. LOGIN ─────────────────────────────────────────────────
  process.stdout.write(`🔐  Connexion admin...`);
  let token;
  try {
    const r = await apiReq('POST', `${API}/auth/login`, { email: EMAIL, password: PASS });
    token = r.b?.data?.token || r.b?.data?.accessToken;
    if (!token) throw new Error(r.b?.error || `HTTP ${r.s}`);
    console.log(` ${C.g}✅  OK${C.x}`);
  } catch(e) {
    console.log(`\n${C.r}❌  Login échoué : ${e.message}${C.x}`);
    process.exit(1);
  }

  // ── 2. CHAPITRES ─────────────────────────────────────────────
  process.stdout.write(`📚  Chargement des chapitres 3ème...`);
  let chapitres;
  try {
    const r = await apiReq('GET', `${API}/chapitres?niveau=3eme`, null, token);
    chapitres = r.b?.data;
    if (!chapitres?.length) throw new Error(r.b?.error || 'aucun chapitre');
    console.log(` ${C.g}✅  ${chapitres.length} chapitres${C.x}`);
  } catch(e) {
    console.log(`\n${C.r}❌  ${e.message}${C.x}`);
    process.exit(1);
  }

  // ── 3. TOUTES LES LEÇONS EXISTANTES ──────────────────────────
  // On construit une map chapitreId → [lecon1, lecon2, ...] pour détecter les doublons
  process.stdout.write(`🗂️   Chargement de toutes les leçons existantes...`);
  const leconsByChap = {}; // chapitreId → tableau de leçons

  async function fetchLecons(url) {
    try {
      const r = await apiReq('GET', url, null, token);
      const data = r.b?.data || r.b?.lecons || (Array.isArray(r.b) ? r.b : null);
      if (data?.length) {
        data.forEach(l => {
          const cid = l.chapitreId?._id || l.chapitreId;
          if (!cid) return;
          if (!leconsByChap[cid]) leconsByChap[cid] = [];
          // Éviter les vrais doublons dans la map (même _id)
          if (!leconsByChap[cid].find(x => x._id === l._id)) {
            leconsByChap[cid].push(l);
          }
        });
      }
    } catch(e) { /* ignoré */ }
  }

  await fetchLecons(`${API}/lecons`);
  await fetchLecons(`${API}/lecons?statut=publie`);
  await fetchLecons(`${API}/lecons?statut=brouillon`);

  const totalExist = Object.values(leconsByChap).reduce((n, arr) => n + arr.length, 0);
  const chapAvecDoublons = Object.entries(leconsByChap).filter(([, arr]) => arr.length > 1);
  console.log(` ${C.g}✅  ${totalExist} leçon(s) en base${C.x}`);
  if (chapAvecDoublons.length > 0) {
    console.log(`  ${C.y}⚠️  ${chapAvecDoublons.length} chapitre(s) avec doublons détectés${C.x}`);
  }

  // ── 4. TRAITEMENT ────────────────────────────────────────────
  console.log(`\n📤  Traitement de ${LECONS.length} leçons...\n`);
  let created = 0, updated = 0, deduped = 0, skipped = 0, errors = 0;

  for (const entry of LECONS) {
    const fp    = path.join(DIR, entry.f);
    const label = entry.f.replace('.html','').padEnd(55);

    if (!fs.existsSync(fp)) {
      console.log(`${C.y}⚠️  ${label} — fichier manquant${C.x}`);
      skipped++; continue;
    }

    let chap = findChap(chapitres, entry.m, entry.k);

    // ── Chapitre introuvable → le créer si le champ `t` (titre) est défini ──
    if (!chap && entry.t) {
      process.stdout.write(`  🆕  ${label}`);
      try {
        // Récupérer le matiereId depuis un chapitre existant de la même matière
        const m = norm(entry.m).split(' ')[0];
        const ref = chapitres.find(c => norm(c.matiereId?.nom||'').includes(m));
        const matiereId = ref?.matiereId?._id || ref?.matiereId;
        if (!matiereId) throw new Error(`matiereId introuvable pour ${entry.m}`);

        const cr = await apiReq('POST', `${API}/chapitres`, {
          titre:       entry.t,
          matiereId:   matiereId,
          niveau:      '3eme',
          ordre:       entry.o || 99,
          objectif:    `Comprendre et analyser : ${entry.t}`,
          description: entry.t,
          duree:       '2h',
        }, token);

        if ((cr.s === 201 || cr.s === 200) && (cr.b?.success || cr.b?.data?._id)) {
          chap = cr.b.data;
          chapitres.push(chap); // ajouter à la liste locale pour les prochaines itérations
          console.log(` ${C.g}📌  chapitre créé${C.x}`);
          process.stdout.write(`  📄  ${label}`);
        } else {
          console.log(` ${C.r}❌  échec création chapitre ${cr.s}: ${JSON.stringify(cr.b?.error||cr.b?.message||'').substring(0,60)}${C.x}`);
          skipped++; continue;
        }
      } catch(e) {
        console.log(` ${C.r}❌  ${e.message}${C.x}`);
        skipped++; continue;
      }
    } else if (!chap) {
      console.log(`${C.y}⚠️  ${label} — chapitre non trouvé en DB (pas de titre défini pour création)${C.x}`);
      skipped++; continue;
    }

    process.stdout.write(`  📄  ${label}`);

    try {
      const html     = fs.readFileSync(fp, 'utf-8');
      const existing = leconsByChap[chap._id] || [];

      if (existing.length > 1) {
        // ── Cas A : DOUBLONS → garder le plus récent, supprimer les autres ──
        // Trier par date de création (plus récent en premier)
        const sorted = [...existing].sort((a, b) => {
          const da = new Date(a.createdAt || a.updatedAt || 0);
          const db = new Date(b.createdAt || b.updatedAt || 0);
          return db - da;
        });

        const toKeep   = sorted[0];
        const toDelete = sorted.slice(1);

        // Supprimer les doublons
        let deleted = 0;
        for (const dup of toDelete) {
          const dr = await apiReq('DELETE', `${API}/lecons/${dup._id}`, null, token);
          if (dr.s === 200 || dr.s === 204) deleted++;
          await sleep(200);
        }

        // Mettre à jour la leçon gardée
        const up = await apiReq('PATCH', `${API}/lecons/${toKeep._id}/contenu`, { contenuHTML: html }, token);
        if (up.s === 200 && up.b?.success) {
          await apiReq('PUT', `${API}/lecons/${toKeep._id}/statut`, { statut: 'publie' }, token);
          console.log(` ${C.m}🧹  dédupliqué (${deleted} supprimé) + mis à jour${C.x}`);
          deduped++; updated++;
        } else {
          // Fallback PUT complet
          await apiReq('PUT', `${API}/lecons/${toKeep._id}`, { contenuHTML: html, statut: 'publie' }, token);
          await apiReq('PUT', `${API}/lecons/${toKeep._id}/statut`, { statut: 'publie' }, token);
          console.log(` ${C.m}🧹  dédupliqué (${deleted} supprimé) + mis à jour (fallback)${C.x}`);
          deduped++; updated++;
        }

      } else if (existing.length === 1) {
        // ── Cas B : UNE SEULE leçon → mise à jour simple ──
        const lid = existing[0]._id;
        const up  = await apiReq('PATCH', `${API}/lecons/${lid}/contenu`, { contenuHTML: html }, token);

        if (up.s === 200 && up.b?.success) {
          await apiReq('PUT', `${API}/lecons/${lid}/statut`, { statut: 'publie' }, token);
          console.log(` ${C.m}🔄  mis à jour${C.x}`);
          updated++;
        } else {
          // Fallback : PUT complet
          const up2 = await apiReq('PUT', `${API}/lecons/${lid}`, { contenuHTML: html, statut: 'publie' }, token);
          if (up2.s === 200) {
            await apiReq('PUT', `${API}/lecons/${lid}/statut`, { statut: 'publie' }, token);
            console.log(` ${C.m}🔄  mis à jour (fallback)${C.x}`);
            updated++;
          } else {
            console.log(` ${C.r}❌  échec update ${up.s}: ${JSON.stringify(up.b?.error||up.b).substring(0,50)}${C.x}`);
            errors++;
          }
        }

      } else {
        // ── Cas C : AUCUNE leçon → création ──
        const r = await apiReq('POST', `${API}/lecons/creer-html`, {
          chapitreId:       chap._id,
          contenuHTML:      html,
          exercices:        [],
          instructionsHTML: '',
          genererExos:      false,
          dureeExercices:   null
        }, token);

        if ((r.s === 201 || r.s === 200) && r.b?.success) {
          const lid = r.b.data._id;
          await apiReq('PUT', `${API}/lecons/${lid}/statut`, { statut: 'publie' }, token);
          console.log(` ${C.g}✅  créée + publiée${C.x}`);
          created++;
        } else if (r.s === 409) {
          // Existe mais pas dans notre map — récupérer l'ID via l'erreur si possible
          const existingId = r.b?.data?._id || r.b?.existingId;
          if (existingId) {
            await apiReq('PATCH', `${API}/lecons/${existingId}/contenu`, { contenuHTML: html }, token);
            await apiReq('PUT', `${API}/lecons/${existingId}/statut`, { statut: 'publie' }, token);
            console.log(` ${C.y}⚠️  conflit 409 → récupérée et mise à jour${C.x}`);
            updated++;
          } else {
            console.log(` ${C.y}⚠️  conflit 409 — leçon en DB mais ID inconnu (relancer le script)${C.x}`);
            skipped++;
          }
        } else {
          console.log(` ${C.r}❌  ${r.s}: ${JSON.stringify(r.b?.error||r.b?.message||r.b).substring(0,60)}${C.x}`);
          errors++;
        }
      }
    } catch(e) {
      console.log(` ${C.r}❌  ${e.message}${C.x}`);
      errors++;
    }
    await sleep(DELAY);
  }

  // ── 5. BILAN ─────────────────────────────────────────────────
  console.log(`\n${C.b}${C.w}═══════════════════════════════════════════════════════════${C.x}`);
  console.log(`  ${C.g}✅  Créées          : ${created}${C.x}`);
  console.log(`  ${C.m}🔄  Mises à jour    : ${updated - deduped}${C.x}`);
  console.log(`  ${C.m}🧹  Dédupliquées    : ${deduped}${C.x}`);
  console.log(`  ${C.y}⚠️   Ignorées        : ${skipped}${C.x}`);
  console.log(`  ${C.r}❌  Erreurs         : ${errors}${C.x}`);
  const total = created + updated;
  console.log(`\n  ${total === LECONS.length ? C.g : C.y}📊  ${total}/${LECONS.length} leçons traitées avec succès${C.x}`);

  if (skipped > 0) {
    console.log(`\n${C.y}💡  Pour les leçons ignorées, vérifier que leurs chapitres`);
    console.log(`   existent bien en DB et que les mots-clés correspondent.${C.x}`);
  }
  console.log(`\n${C.g}${C.w}✨  Terminé !${C.x}\n`);
}

main().catch(e => { console.error(`\n${C.r}💥  ${e.message}${C.x}`); process.exit(1); });
