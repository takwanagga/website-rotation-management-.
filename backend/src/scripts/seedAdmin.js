import Admin from '../models/admin.js';
import Utilisateur from '../models/utilisateur.js';

const DEFAULT_ADMIN_EMAIL = 'admin@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'Admin@1234';

export async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase().trim();
  const password = process.env.ADMIN_DEFAULT_PASSWORD || DEFAULT_ADMIN_PASSWORD;

  const existing = await Utilisateur.findOne({ email });
  if (existing) {
    console.log(`Admin seed: compte ${email} deja present.`);
    return;
  }

  await Admin.create({
    nom: 'Admin',
    prenom: 'TransRoute',
    mecano: 'ADMIN001',
    localisation: 'Tunis',
    email,
    role: 'admin',
    telephone: '',
    MotDePasse: password,
    age: 30,
  });

  console.log(`Admin seed: compte ${email} cree.`);
}
