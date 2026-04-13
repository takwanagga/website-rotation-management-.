import jwt from "jsonwebtoken";
import Employe from "../models/employe.js";

const JWT_SECRET = process.env.JWT_SECRET;

//  Bloque au démarrage si JWT_SECRET manque — pas de fallback dangereux
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET manquant dans les variables d'environnement.");
}

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

// Créer et poser le token dans un cookie httpOnly 
function setTokenCookie(res, employe) {
  const token = jwt.sign(
    { id: employe._id.toString(), role: employe.role, email: employe.email },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS en prod uniquement
    sameSite: "strict",
    maxAge: 8 * 60 * 60 * 1000,
  });
}

// creation de compte
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

    setTokenCookie(res, employe);

    return res.status(201).json({ message: "Compte créé avec succès.", employe });
  } catch (error) {
    return res.status(400).json({ error: getErrorMessage(error) });
  }
}

// connection 
export async function loginEmploye(req, res) {
  try {
    const { email, MotDePasse } = req.body;

    if (!email || !MotDePasse) {
      return res.status(400).json({ error: "Email et mot de passe requis." });
    }

    const employe = await Employe.findOne({ email: String(email).toLowerCase() }).select("+MotDePasse");

    if (!employe) {
      return res.status(401).json({ error: "Identifiants invalides." });
    }

    const isMatch = await employe.comparePassword(MotDePasse);
    if (!isMatch) {
      return res.status(401).json({ error: "Identifiants invalides." });
    }

    setTokenCookie(res, employe);

    return res.status(200).json({ message: "Connexion réussie.", employe });
  } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}

// deconnection
export async function logoutEmploye(req, res) {
  res.clearCookie("token");
  return res.status(200).json({ message: "Déconnexion réussie." });
}

// récupérer le profil de l'employé connecté
export async function getProfile(req, res) {
  try {
    const employe = await Employe.findById(req.employe._id);

    if (!employe) {
      return res.status(404).json({ error: "Employé introuvable." });
    }

    return res.status(200).json({ employe });
  } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}

// mettre à jour le profil de l'employé connecté
export async function updateProfile(req, res) {
  try {
    const employe = await Employe.findById(req.employe._id);

    if (!employe) {
      return res.status(404).json({ error: "Employé introuvable." });
    }

    // Champs modifiables par l'employé lui-même
    const champsAutorisés = ["nom", "prenom", "telephone", "localisation", "age"];

    for (const champ of champsAutorisés) {
      if (req.body[champ] !== undefined) {
        employe[champ] = req.body[champ];
      }
    }

    // Changement de mot de passe (optionnel)
    if (req.body.MotDePasse) {
      employe.MotDePasse = req.body.MotDePasse;
    }

    await employe.save();

    return res.status(200).json({ message: "Profil mis à jour avec succès.", employe });
  } catch (error) {
    return res.status(400).json({ error: getErrorMessage(error) });
  }
}

// mot de passe oublié 
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email requis." });
    }

    const employe = await Employe.findOne({ email: String(email).toLowerCase() });

    if (!employe) {
      return res.status(200).json({ message: "Si cet email existe, un lien de réinitialisation a été envoyé." });
    }

    const resetToken = jwt.sign(
      { id: employe._id.toString(), email: employe.email, type: "reset" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({ message: "Lien de réinitialisation généré." });
  } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}

export const authController = {
  signupEmploye,
  loginEmploye,
  logoutEmploye,
  getProfile,
  updateProfile,
  forgotPassword,
};

export default authController;