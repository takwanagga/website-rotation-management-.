import jwt from "jsonwebtoken";
import Employe from "../models/employe.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

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

function buildToken(employe) {
  return jwt.sign(
    { id: employe._id.toString(), role: employe.role, email: employe.email },
    JWT_SECRET,
    { expiresIn: "8h" }
  );
    }

export async function signupEmploye(req, res) {
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
    const token = buildToken(employe);
    return res.status(201).json({ token, employe });
    } catch (error) {
    return res.status(400).json({ error: getErrorMessage(error) });
    }
}

export async function loginEmploye(req, res) {
    try {
        const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis." });
    }
    const employe = await Employe.findOne({ email: String(email).toLowerCase() });
        if (!employe) {
      return res.status(401).json({ error: "Identifiants invalides." });
        }
    const isMatch = await employe.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Identifiants invalides." });
        }
    const token = buildToken(employe);
    return res.status(200).json({ token, employe });
    } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error) });
    }
}

export async function getCurrentUser(req, res) {
  try {
    const employe = await Employe.findById(req.user.id).select("-MotDePasse");
    if (!employe) {
      return res.status(404).json({ success: false, message: "Utilisateur introuvable." });
    }
    const plain = employe.toObject();
    return res.status(200).json({
      success: true,
      user: {
        ...plain,
        id: plain._id?.toString(),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: getErrorMessage(error) });
  }
}

export async function ajouterEmploye(req, res) {
  return signupEmploye(req, res);
}

export async function modifierEmploye(req, res) {
    try {  
    const { MotDePasse, statut, ...rest } = req.body;

    const updatedEmploye = await Employe.findById(req.params.id); // ← corrigé
    if (!updatedEmploye) {
        return res.status(404).json({ error: "Employé non trouvé" });
    }

    // Appliquer les champs classiques
    Object.assign(updatedEmploye, rest);

    // Appliquer le statut explicitement
    if (statut !== undefined) {
      updatedEmploye.statut = statut; // ← ajouté
    }

    // Appliquer le mot de passe seulement s'il est fourni
    if (MotDePasse) {
      updatedEmploye.MotDePasse = MotDePasse;
    }

    await updatedEmploye.save();
    return res.status(200).json({
      message: "Employé modifié avec succès",
      employe: updatedEmploye,
    });
    } catch (error) {
    return res.status(400).json({ error: getErrorMessage(error) });
    }
}

export async function supprimerEmploye(req, res) {
    try {
        const deletedEmploye = await Employe.findByIdAndDelete(req.params.id);
    if (!deletedEmploye) {
         return res.status(404).json({ error: "Employé non trouvé" });
    }
    return res.status(200).json({ message: "Employé supprimé avec succès", employe: deletedEmploye });
    } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error) });
    }
}

export async function listerEmploye(req, res) {
    try {
    const employes = await Employe.find().sort({ createdAt: -1 });
    return res.status(200).json(employes);
    } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error) });
    }
}

export async function forgotPassword(req, res) {
    try {
        const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }
    const employe = await Employe.findOne({ email: String(email).toLowerCase() });
        if (!employe) {
      return res.status(200).json({ message: "If that email exists, reset instructions were sent." });
        }
        const resetToken = jwt.sign(
      { id: employe._id.toString(), email: employe.email, type: "reset" },
      JWT_SECRET,
      { expiresIn: "1h" }
        );
    return res.status(200).json({ message: "Reset token generated", resetToken });
    } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error) });
        }
}


export default {
    signupEmploye,
    loginEmploye,
  getCurrentUser,
  ajouterEmploye,
    modifierEmploye,
    supprimerEmploye,
    listerEmploye,
    forgotPassword,
};