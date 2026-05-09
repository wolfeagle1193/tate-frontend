// ============================================================
// creer-parent.cjs
// Crée le compte parent toubibadiouf@gmail.com et le lie
// à ses deux enfants : Karim Diouf (CM1) et Amina Diouf (3ème)
// ============================================================
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const MONGO_URI = 'mongodb+srv://tate_school:UCY0NJMuUIoGpSDU@cluster0.ywgxfxk.mongodb.net/?appName=Cluster0';

// ── Schéma minimal User (pour éviter de tout importer) ──────
const userSchema = new mongoose.Schema({
  nom:          String,
  email:        { type: String, lowercase: true, trim: true },
  passwordHash: String,
  role:         String,
  niveau:       String,
  enfants:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  parentId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  parentEmail:  { type: String, default: null },
  actif:        { type: Boolean, default: true },
  abonnement:   { type: String, default: 'gratuit' },
  streak:       { type: Number, default: 0 },
  lastActivity: { type: Date, default: Date.now },
  chapitresValides: [],
  statutCompte: { type: String, default: 'actif' },
}, { timestamps: true, strict: false });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connecté à MongoDB');

  // ── 1. Chercher les deux enfants ──────────────────────────
  const enfants = await User.find({
    role: 'eleve',
    nom:  { $regex: /diouf/i },
  }).select('_id nom niveau parentId parentEmail');

  if (enfants.length === 0) {
    console.log('❌ Aucun élève Diouf trouvé en base.');
    await mongoose.disconnect();
    return;
  }

  console.log('\n📋 Élèves Diouf trouvés :');
  enfants.forEach(e => console.log(`   - ${e.nom} (${e.niveau || '—'}) → _id: ${e._id}  parentId actuel: ${e.parentId || 'aucun'}`));

  // Identifier Karim (CM1) et Amina (3ème)
  const karim = enfants.find(e =>
    /karim/i.test(e.nom) && (e.niveau === 'CM1' || !e.niveau)
  ) || enfants.find(e => /karim/i.test(e.nom));

  const amina = enfants.find(e =>
    /amina/i.test(e.nom) && (e.niveau === '3eme' || !e.niveau)
  ) || enfants.find(e => /amina/i.test(e.nom));

  if (!karim) { console.log('\n❌ Karim Diouf introuvable. Vérifiez le nom exact en base.'); }
  if (!amina) { console.log('\n❌ Amina Diouf introuvable. Vérifiez le nom exact en base.');  }

  const enfantsIds = [karim?._id, amina?._id].filter(Boolean);
  if (enfantsIds.length === 0) {
    console.log('\n❌ Aucun enfant identifié. Arrêt.');
    await mongoose.disconnect();
    return;
  }

  // ── 2. Créer ou mettre à jour le compte parent ────────────
  const email = 'toubibadiouf@gmail.com';
  const passwordHash = await bcrypt.hash('toubibadiouf', 12);

  let parent = await User.findOne({ email });

  if (parent) {
    console.log(`\n⚠️  Compte parent ${email} existe déjà — mise à jour des liens.`);
    // Mettre à jour le mot de passe et les enfants
    parent.passwordHash = passwordHash;
    parent.enfants      = enfantsIds;
    parent.role         = 'parent';
    parent.actif        = true;
    await parent.save();
    console.log('   ✅ Mot de passe mis à jour');
  } else {
    parent = await User.create({
      nom:          'Diouf (Parent)',
      email,
      passwordHash,
      role:         'parent',
      enfants:      enfantsIds,
      actif:        true,
      abonnement:   'gratuit',
      statutCompte: 'actif',
    });
    console.log(`\n✅ Compte parent créé : ${email}`);
  }

  console.log(`   _id parent : ${parent._id}`);

  // ── 3. Lier parentId sur chaque enfant ───────────────────
  if (karim) {
    await User.findByIdAndUpdate(karim._id, {
      parentId:    parent._id,
      parentEmail: email,
    });
    console.log(`\n🔗 Karim Diouf (${karim.niveau}) → lié au parent ✅`);
  }

  if (amina) {
    await User.findByIdAndUpdate(amina._id, {
      parentId:    parent._id,
      parentEmail: email,
    });
    console.log(`🔗 Amina Diouf (${amina.niveau}) → liée au parent ✅`);
  }

  // ── 4. Vérification finale ────────────────────────────────
  const parentVerif = await User.findById(parent._id).select('nom email enfants role');
  console.log('\n📊 Vérification finale :');
  console.log(`   Parent  : ${parentVerif.email} (role: ${parentVerif.role})`);
  console.log(`   Enfants : ${parentVerif.enfants.map(String).join(', ')}`);

  await mongoose.disconnect();
  console.log('\n✅ Terminé. Le parent peut se connecter avec :');
  console.log('   Email    : toubibadiouf@gmail.com');
  console.log('   Mot de passe : toubibadiouf');
}

main().catch(e => {
  console.error('❌ Erreur :', e.message);
  process.exit(1);
});
