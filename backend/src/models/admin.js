import mongoose from 'mongoose';
import Utilisateur from './utilisateur.js';

/**
 * Discriminator "Admin" — hérite de Utilisateur.
 * Le rôle est forcé à "admin" à la création.
 * Pas de champs supplémentaires pour l'instant (extensible).
 */
const adminSchema = new mongoose.Schema({
  // Champs spécifiques aux admins si besoin (ex: permissions, département…)
});

// S'assure que role = 'admin' à chaque fois qu'un Admin est créé
adminSchema.pre('save', function (next) {
  this.role = 'admin';
  next();
});

const Admin = Utilisateur.discriminator('Admin', adminSchema);
export default Admin;