import mongoose from 'mongoose';
import Utilisateur from './utilisateur.js';

/**
 * Discriminator "Admin" — hérite de Utilisateur.
 * Le rôle est forcé à "admin" via la valeur par défaut du schéma.
 * ✅ Pas de pre-save hook → évite le conflit "next is not a function" avec Mongoose 9
 *    qui se produit quand un parent a un middleware async et l'enfant un middleware callback.
 */
const adminSchema = new mongoose.Schema({
  // Champs spécifiques aux admins si besoin (ex: permissions, département…)
});

const Admin = Utilisateur.discriminator('Admin', adminSchema);
export default Admin;