import Employe from "../models/employe.js";

function getErrorMessage(error) {
  if (error?.name === "ValidationError") {
    return Object.values(error.errors)
      .map((err) => err.message)
      .join(", ");
  }
  if (error?.code === 11000) {
    return "Valeur déjà utilisée (email ou mécano).";
  }
  return error?.message || "Une erreur est survenue.";
}

// ajouter un employé (admin uniquement) 
export async function ajouterEmploye(req, res) {
  try {
    const { nom, prenom, mecano, localisation, email, role, telephone, MotDePasse, age } =
      req.body;

    const employe = await Employe.create({
      nom,
      prenom,
      mecano,
      localisation,
      email,
      role,
      telephone,
      MotDePasse,
      age,
    });

    return res.status(201).json({ message: "Employé ajouté avec succès.", employe });
  } catch (error) {
    return res.status(400).json({ error: getErrorMessage(error) });
  }
}

//modifier un employé
export async function modifierEmploye(req, res) {
  try {
    const { MotDePasse, statut, ...rest } = req.body;

    const employe = await Employe.findById(req.params.id);
    if (!employe) {
      return res.status(404).json({ error: "Employé non trouvé." });
    }

    Object.assign(employe, rest);

    if (statut !== undefined) {
      employe.statut = statut;
    }

    if (MotDePasse) {
      employe.MotDePasse = MotDePasse;
    }

    await employe.save();

    return res.status(200).json({ message: "Employé modifié avec succès.", employe });
  } catch (error) {
    return res.status(400).json({ error: getErrorMessage(error) });
  }
}

//supprimer un employé
export async function supprimerEmploye(req, res) {
  try {
    const employe = await Employe.findByIdAndDelete(req.params.id);
    if (!employe) {
      return res.status(404).json({ error: "Employé non trouvé." });
    }
    return res.status(200).json({ message: "Employé supprimé avec succès.", employe });
  } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}

// Lister tous les employés (admin, chauffeur, receveur)
export async function listerEmploye(req, res) {
  try {
    const employes = await Employe.find().sort({ createdAt: -1 });
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