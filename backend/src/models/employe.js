import mongoose from 'mongoose';
import Utilisateur from './utilisateur.js';

/**
 * Discriminator "Employe" — hérite de Utilisateur.
 * Ajoute uniquement les champs spécifiques aux chauffeurs / receveurs.
 * Stocké dans la MÊME collection MongoDB que les admins.
 */
const employeSchema = new mongoose.Schema({
  statut: {
    type: String,
    enum: ['en congé', 'actif', 'inactif'],
    default: 'actif',
  },
  congeDebut: { type: Date },
  congeFin:   { type: Date },
});

const Employe = Utilisateur.discriminator('Employe', employeSchema);
export default Employe;