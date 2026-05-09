#!/usr/bin/env node
// ============================================================
// upload-lecons.js — Upload all HG 3ème HTML lessons to Taté API
// Usage:
//   node upload-lecons.js --token <JWT> [--url <API_BASE>] [--dry-run] [--file <filename>]
//
// Options:
//   --token   JWT bearer token (required)
//   --url     API base URL (default: https://api.tate.sn/api)
//   --dry-run Print what would be sent without actually uploading
//   --file    Upload only this filename (e.g. GEO-3e-L01-terre-systeme-solaire.html)
//   --list    List available chapitres from API and exit
//   --force   Re-upload even if a leçon already exists for this chapitre
// ============================================================

const fs   = require('fs');
const path = require('path');
const https = require('https');
const http  = require('http');
const url   = require('url');

// ─── Parse CLI args ───────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const TOKEN   = getArg('--token');
const API_URL = getArg('--url') || 'https://api.tate.sn/api';
const DRY_RUN = hasFlag('--dry-run');
const ONLY_FILE = getArg('--file');
const LIST_CHAPITRES = hasFlag('--list');
const FORCE = hasFlag('--force');

if (!TOKEN) {
  console.error('❌  --token <JWT> est requis');
  console.error('Usage: node upload-lecons.js --token <JWT> [--url <API>] [--dry-run] [--file <name>]');
  process.exit(1);
}

const DIR = __dirname;

// ─── Mapping: filename prefix → chapitre titre partiel ────────
// Ces titres permettent de retrouver le bon chapitre par recherche floue.
// Adapter si les titres dans la DB sont différents.
const FILE_TO_CHAPITRE_HINT = {
  // Histoire
  'HG-3e-L01': { matiere: 'Histoire', hint: 'découvertes scientifiques' },
  'HG-3e-L02': { matiere: 'Histoire', hint: 'capitalisme' },
  'HG-3e-L03': { matiere: 'Histoire', hint: 'doctrines sociales' },
  'HG-3e-L05': { matiere: 'Histoire', hint: 'missions' },
  'HG-3e-L06': { matiere: 'Histoire', hint: 'rivalités' },
  'HG-3e-L07': { matiere: 'Histoire', hint: 'résistances africaines' },
  'HG-3e-L08': { matiere: 'Histoire', hint: 'systèmes coloniaux' },
  'HG-3e-L10': { matiere: 'Histoire', hint: 'impérialisme japonais' },
  'HG-3e-L11': { matiere: 'Histoire', hint: 'impérialisme européen' },
  'HG-3e-L12': { matiere: 'Histoire', hint: 'impérialisme américain' },
  'HG-3e-L13': { matiere: 'Histoire', hint: 'révolutions chinoises' },
  'HG-3e-L14': { matiere: 'Histoire', hint: 'première guerre mondiale' },
  'HG-3e-L15': { matiere: 'Histoire', hint: 'révolution russe' },
  'HG-3e-L16': { matiere: 'Histoire', hint: 'crise' },
  'HG-3e-L17': { matiere: 'Histoire', hint: 'deuxième guerre mondiale' },
  'HG-3e-L18': { matiere: 'Histoire', hint: 'guerre froide' },
  'HG-3e-L19': { matiere: 'Histoire', hint: 'décolonisation' },
  'HG-3e-L20': { matiere: 'Histoire', hint: 'sénégal' },
  'HG-3e-L21': { matiere: 'Histoire', hint: 'bandoeng' },
  // Géographie
  'GEO-3e-L01': { matiere: 'Géographie', hint: 'terre' },
  'GEO-3e-L02': { matiere: 'Géographie', hint: 'potentiel' },
  'GEO-3e-L03': { matiere: 'Géographie', hint: 'surexploitation' },
  'GEO-3e-L04': { matiere: 'Géographie', hint: 'climatique' },
  'GEO-3e-L05': { matiere: 'Géographie', hint: 'inégalités' },
  'GEO-3e-L06': { matiere: 'Géographie', hint: 'systèmes économiques' },
  'GEO-3e-L07': { matiere: 'Géographie', hint: 'coopération' },
  'GEO-3e-L08': { matiere: 'Géographie', hint: 'communication' },
  'GEO-3e-L09': { matiere: 'Géographie', hint: 'village planétaire' },
};

// ─── HTTP helper ───────────────────────────────────────────────
function apiRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(API_URL + endpoint);
    const lib = parsed.protocol === 'https:' ? https : http;
    const bodyStr = body ? JSON.stringify(body) : null;

    const options = {
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type':  'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ─── Normalize string for fuzzy matching ──────────────────────
function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // remove accents
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreMatch(chapitreTitre, hint) {
  const normTitre = normalize(chapitreTitre);
  const words = normalize(hint).split(' ');
  let score = 0;
  for (const w of words) {
    if (w.length > 2 && normTitre.includes(w)) score++;
  }
  return score;
}

// ─── Find chapitreId from fetched list ────────────────────────
function findChapitre(chapitres, hint, matiereName) {
  const normMat = normalize(matiereName);
  const candidates = chapitres.filter(c => {
    const mNom = c.matiereId?.nom || c.matiereNom || '';
    return normalize(mNom).includes(normMat.split(' ')[0]);
  });

  if (candidates.length === 0) {
    // fallback: search all chapitres
    const scored = chapitres.map(c => ({ c, score: scoreMatch(c.titre, hint) }));
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.score > 0 ? scored[0].c : null;
  }

  const scored = candidates.map(c => ({ c, score: scoreMatch(c.titre, hint) }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.score > 0 ? scored[0].c : null;
}

// ─── Extract <title> from HTML ─────────────────────────────────
function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : 'Leçon sans titre';
}

// ─── Main ──────────────────────────────────────────────────────
async function main() {
  console.log(`\n🎓  Taté — Upload leçons HG 3ème`);
  console.log(`📡  API: ${API_URL}`);
  if (DRY_RUN) console.log(`🔍  Mode DRY-RUN (aucun envoi réel)\n`);

  // 1. Fetch all chapitres (niveau=3eme)
  console.log('⏳  Récupération des chapitres depuis l\'API...');
  const resp = await apiRequest('GET', '/chapitres?niveau=3eme');

  if (resp.status !== 200 || !resp.body.success) {
    console.error('❌  Impossible de récupérer les chapitres:', resp.body);
    process.exit(1);
  }

  const chapitres = resp.body.data;
  console.log(`✅  ${chapitres.length} chapitres trouvés pour la 3ème\n`);

  if (LIST_CHAPITRES) {
    console.log('=== CHAPITRES DISPONIBLES ===');
    for (const c of chapitres) {
      const mat = c.matiereId?.nom || '?';
      console.log(`  [${mat}] ${c.titre} → _id: ${c._id}`);
    }
    return;
  }

  // 2. Get list of HTML files to upload
  let files = fs.readdirSync(DIR)
    .filter(f => f.endsWith('.html') && (f.startsWith('HG-3e-') || f.startsWith('GEO-3e-')))
    .sort();

  if (ONLY_FILE) {
    files = files.filter(f => f === ONLY_FILE || f.startsWith(ONLY_FILE));
    if (files.length === 0) {
      console.error(`❌  Fichier "${ONLY_FILE}" introuvable dans ${DIR}`);
      process.exit(1);
    }
  }

  console.log(`📁  ${files.length} fichier(s) à traiter\n`);

  // 3. Process each file
  const results = { ok: [], skip: [], error: [] };

  for (const filename of files) {
    const prefix = filename.replace(/^((?:HG|GEO)-3e-L\d+).*/, '$1');
    const hint_obj = FILE_TO_CHAPITRE_HINT[prefix];

    if (!hint_obj) {
      console.warn(`⚠️  ${filename} — aucun hint configuré, skip`);
      results.skip.push({ file: filename, reason: 'no hint' });
      continue;
    }

    // Find matching chapitre
    const chapitre = findChapitre(chapitres, hint_obj.hint, hint_obj.matiere);
    if (!chapitre) {
      console.warn(`⚠️  ${filename} — aucun chapitre trouvé pour "${hint_obj.hint}" (${hint_obj.matiere})`);
      results.skip.push({ file: filename, reason: 'chapitre non trouvé' });
      continue;
    }

    const chapitreId = chapitre._id;
    const filePath = path.join(DIR, filename);
    const contenuHTML = fs.readFileSync(filePath, 'utf-8');
    const titre = extractTitle(contenuHTML);

    console.log(`📤  ${filename}`);
    console.log(`    ↳ Chapitre: "${chapitre.titre}" [${chapitreId}]`);
    console.log(`    ↳ Titre leçon: ${titre}`);

    if (DRY_RUN) {
      console.log(`    ↳ [DRY-RUN] POST /lecons/creer-html — ${Math.round(contenuHTML.length / 1024)}Ko\n`);
      results.ok.push({ file: filename, chapitreId, dry: true });
      continue;
    }

    // Upload
    try {
      const uploadResp = await apiRequest('POST', '/lecons/creer-html', {
        chapitreId,
        contenuHTML,
        exercices: [],
        instructionsHTML: '',
        genererExos: false,
        dureeExercices: null,
      });

      if (uploadResp.status === 201 && uploadResp.body.success) {
        const leconId = uploadResp.body.data._id;
        console.log(`    ✅  Créée — _id: ${leconId}`);

        // Auto-validate (publish)
        const valResp = await apiRequest('PUT', `/lecons/${leconId}/statut`, {
          statut: 'publie'
        });
        if (valResp.status === 200 && valResp.body.success) {
          console.log(`    🟢  Publiée\n`);
        } else {
          console.warn(`    ⚠️  Upload OK mais publication échouée:`, valResp.body?.error || valResp.status);
          console.log('');
        }

        results.ok.push({ file: filename, chapitreId, leconId });
      } else if (uploadResp.status === 409 || (uploadResp.body?.error || '').includes('existe')) {
        if (FORCE) {
          console.warn(`    ⚠️  Leçon déjà existante — use --force to overwrite (NYI)\n`);
        } else {
          console.log(`    ⏭️  Leçon déjà existante pour ce chapitre (skip)\n`);
        }
        results.skip.push({ file: filename, chapitreId, reason: 'déjà existante' });
      } else {
        console.error(`    ❌  Erreur ${uploadResp.status}:`, uploadResp.body?.error || uploadResp.body);
        console.log('');
        results.error.push({ file: filename, chapitreId, error: uploadResp.body?.error });
      }
    } catch (e) {
      console.error(`    ❌  Exception:`, e.message);
      results.error.push({ file: filename, error: e.message });
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 300));
  }

  // 4. Summary
  console.log('\n═══════════════════════════════════════');
  console.log('📊  RÉSUMÉ');
  console.log('═══════════════════════════════════════');
  console.log(`  ✅  Uploadées : ${results.ok.length}`);
  console.log(`  ⏭️  Ignorées  : ${results.skip.length}`);
  console.log(`  ❌  Erreurs   : ${results.error.length}`);

  if (results.error.length > 0) {
    console.log('\n  Erreurs détaillées:');
    for (const e of results.error) {
      console.log(`    • ${e.file}: ${e.error}`);
    }
  }
  if (results.skip.length > 0) {
    console.log('\n  Fichiers ignorés:');
    for (const s of results.skip) {
      console.log(`    • ${s.file}: ${s.reason}`);
    }
  }

  console.log('\n✨  Terminé.\n');
}

main().catch(e => {
  console.error('💥  Erreur fatale:', e);
  process.exit(1);
});
