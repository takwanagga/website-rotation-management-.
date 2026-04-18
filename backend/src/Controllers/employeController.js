// backend/src/Controllers/employeController.js
import Employe from '../models/employe.js';
import Admin from '../models/admin.js';
import Utilisateur from '../models/utilisateur.js';
// ✅ Chemin corrigé : depuis src/Controllers/ → utils/ se trouve 2 niveaux au-dessus
import { sendEmployeeCredentials } from '../../utils/email.js';

function getErrorMessage(error) {
  if (error?.name === 'ValidationError') {
    return Object.values(error.errors).map((e) => e.message).join(', ');
  }
  if (error?.code === 11000) return 'Valeur déjà utilisée (email ou mécano).';
  return error?.message || 'Une erreur est survenue.';
}

// ── Ajouter un employé ou un admin ────────────────────────────────────────────
export async function ajouterEmploye(req, res) {
  try {
    const { nom, prenom, mecano, localisation, email, role, telephone, MotDePasse, age } = req.body;

    let utilisateur;

    if (role === 'admin') {
      utilisateur = await Admin.create({ nom, prenom, mecano, localisation, email, role, telephone, MotDePasse, age });
    } else {
      utilisateur = await Employe.create({ nom, prenom, mecano, localisation, email, role, telephone, MotDePasse, age });
    }

    // Envoie les identifiants par email (ne bloque pas si l'email échoue)
    try {
      await sendEmployeeCredentials(email, MotDePasse);
    } catch (emailErr) {
      console.error('⚠️  Envoi email identifiants échoué:', emailErr.message);
      // On continue quand même — l'employé est bien créé
    }

    return res.status(201).json({ message: 'Employé ajouté avec succès.', employe: utilisateur });
  } catch (error) {
    return res.status(400).json({ error: getErrorMessage(error) });
  }
}

// ── Modifier un employé ───────────────────────────────────────────────────────
export async function modifierEmploye(req, res) {
  try {
    const { MotDePasse, statut, congeDebut, congeFin, ...rest } = req.body;

    const utilisateur = await Utilisateur.findById(req.params.id).select('+MotDePasse');
    if (!utilisateur) return res.status(404).json({ error: 'Employé non trouvé.' });

    Object.assign(utilisateur, rest);
    if (statut !== undefined) utilisateur.statut = statut;
    if (congeDebut !== undefined) utilisateur.congeDebut = congeDebut || null;
    if (congeFin !== undefined) utilisateur.congeFin = congeFin || null;
    if (MotDePasse) utilisateur.MotDePasse = MotDePasse;

    await utilisateur.save();

    return res.status(200).json({ message: 'Employé modifié avec succès.', employe: utilisateur });
  } catch (error) {
    return res.status(400).json({ error: getErrorMessage(error) });
  }
}

// ── Supprimer un employé ──────────────────────────────────────────────────────
export async function supprimerEmploye(req, res) {
  try {
    const utilisateur = await Utilisateur.findByIdAndDelete(req.params.id);
    if (!utilisateur) return res.status(404).json({ error: 'Employé non trouvé.' });
    return res.status(200).json({ message: 'Employé supprimé avec succès.', employe: utilisateur });
  } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}

// ── Lister tous les employés (gestion automatique des congés expirés) ─────────
export async function listerEmploye(req, res) {
  try {
    let employes = await Employe.find().sort({ createdAt: -1 });
    const now = new Date();
    let updated = false;

    for (const emp of employes) {
      if (emp.statut === 'en congé' && emp.congeFin && new Date(emp.congeFin) < now) {
        emp.statut = 'actif';
        emp.congeDebut = undefined;
        emp.congeFin = undefined;
        await emp.save();
        updated = true;
      }
    }

    if (updated) employes = await Employe.find().sort({ createdAt: -1 });

    return res.status(200).json(employes);
  } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}

export const employeController = {
  ajouterEmploye,
  modifierEmploye,
  supprimerEmploye,
  listerEmploye,
};

export default employeController;