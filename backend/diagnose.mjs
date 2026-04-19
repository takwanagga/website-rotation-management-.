// ══════════════════════════════════════════════════════════
// diagnose.mjs  —  Script de diagnostic TransRoute
// Exécuter depuis le dossier backend/ :
//   node diagnose.mjs
// ══════════════════════════════════════════════════════════
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = process.env.CONNECTION_STRING || 'mongodb://localhost:27017/storegamesdb';
const TEST_EMAIL = 'malek@gmail.com';
const TEST_PASSWORD = 'Admin@1234';

console.log('\n🔍 ══════════ DIAGNOSTIC TRANSROUTE ══════════\n');

// ── 1. Test connexion MongoDB ─────────────────────────────
console.log('1️⃣  Test connexion MongoDB...');
try {
  await mongoose.connect(MONGO_URI);
  console.log('   ✅ MongoDB connecté :', MONGO_URI);
} catch (err) {
  console.error('   ❌ ERREUR MongoDB :', err.message);
  console.error('   👉 Vérifiez que MongoDB est démarré (mongod)');
  process.exit(1);
}

const db = mongoose.connection.db;
const collections = await db.listCollections().toArray();
console.log('   📦 Collections :', collections.map(c => c.name).join(', ') || '(aucune)');

// ── 2. Chercher le compte admin ───────────────────────────
console.log('\n2️⃣  Recherche du compte admin...');
const collection = db.collection('employes'); // nom de la collection dans utilisateur.js
const allDocs = await collection.find({}).toArray();
console.log('   📄 Total documents dans "employes" :', allDocs.length);

if (allDocs.length > 0) {
  console.log('   📋 Documents trouvés :');
  allDocs.forEach((doc, i) => {
    console.log(`      [${i+1}] email: ${doc.email} | role: ${doc.role} | __type: ${doc.__type} | mecano: ${doc.mecano}`);
  });
}

const admin = await collection.findOne({ email: TEST_EMAIL });
if (!admin) {
  console.log(`\n   ❌ PROBLÈME : Aucun compte avec email "${TEST_EMAIL}" trouvé !`);
  console.log('   👉 Le compte admin n\'existe pas. Créez-le via Postman.');
} else {
  console.log(`\n   ✅ Compte trouvé : email=${admin.email} | role=${admin.role} | __type=${admin.__type}`);

  // ── 3. Test mot de passe ─────────────────────────────────
  console.log('\n3️⃣  Test du mot de passe...');
  if (!admin.MotDePasse) {
    console.log('   ❌ PROBLÈME : Le champ MotDePasse est vide/manquant !');
    console.log('   👉 Le mot de passe n\'a pas été hashé lors de la création.');
  } else {
    console.log('   🔐 Hash trouvé :', admin.MotDePasse.substring(0, 20) + '...');
    const match = await bcrypt.compare(TEST_PASSWORD, admin.MotDePasse);
    if (match) {
      console.log('   ✅ Mot de passe correct !');
      if (admin.role !== 'admin') {
        console.log(`\n   ❌ PROBLÈME : Le rôle est "${admin.role}" et non "admin" !`);
        console.log('   👉 Mettez à jour le rôle en base :');
        console.log(`      db.employes.updateOne({email:"${TEST_EMAIL}"}, {$set:{role:"admin", __type:"Admin"}})`);
      } else {
        console.log('\n   ✅ Tout est correct côté base de données.');
        console.log('   👉 Le problème vient du backend (serveur non démarré ou mauvais port).');
      }
    } else {
      console.log(`   ❌ PROBLÈME : Mot de passe "${TEST_PASSWORD}" incorrect !`);
      console.log('   👉 Le hash en base ne correspond pas. Recréez le compte.');
    }
  }
}

// ── 4. Vérifier la variable JWT_SECRET ───────────────────
console.log('\n4️⃣  Vérification JWT_SECRET...');
if (!process.env.JWT_SECRET) {
  console.log('   ❌ PROBLÈME : JWT_SECRET manquant dans .env !');
} else {
  console.log('   ✅ JWT_SECRET présent');
}

// ── 5. Vérifier le PORT ───────────────────────────────────
console.log('\n5️⃣  Vérification PORT...');
console.log('   PORT =', process.env.PORT || '❌ non défini dans .env');

// ── 6. Créer admin si manquant ────────────────────────────
if (!admin) {
  console.log('\n6️⃣  Tentative de création du compte admin...');
  try {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!regex.test(TEST_PASSWORD)) {
      console.log('   ❌ Le mot de passe ne respecte pas les règles de sécurité !');
      console.log('   👉 Utilisez un mot de passe avec majuscule, minuscule, chiffre et caractère spécial.');
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(TEST_PASSWORD, salt);
      const result = await collection.insertOne({
        nom: 'Admin',
        prenom: 'Malek',
        mecano: 'ADM001',
        email: TEST_EMAIL,
        role: 'admin',
        __type: 'Admin',
        MotDePasse: hashedPassword,
        telephone: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      if (result.insertedId) {
        console.log('   ✅ Compte admin créé directement en base !');
        console.log('   👉 Essayez maintenant de vous connecter avec :');
        console.log(`      Email    : ${TEST_EMAIL}`);
        console.log(`      Password : ${TEST_PASSWORD}`);
      }
    }
  } catch (err) {
    console.log('   ❌ Erreur création :', err.message);
    if (err.code === 11000) {
      console.log('   👉 Duplicate key — un document avec le même email ou mecano existe déjà (peut-être avec un autre email).');
    }
  }
}

console.log('\n══════════════════════════════════════════════\n');
await mongoose.disconnect();
process.exit(0);
