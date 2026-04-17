import jwt from 'jsonwebtoken';
import Utilisateur from '../models/utilisateur.js';
import Admin from '../models/admin.js';
import Employe from '../models/employe.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET manquant dans les variables d'environnement.");

function getErrorMessage(error) {
  if (error?.name === 'ValidationError')
    return Object.values(error.errors).map((e) => e.message).join(', ');
  if (error?.code === 11000) return 'Valeur déjà utilisée (email ou mécano).';
  return error?.message || 'Une erreur est survenue.';
}

function setTokenCookie(res, utilisateur) {
  const token = jwt.sign(
    { id: utilisateur._id.toString(), role: utilisateur.role, email: utilisateur.email },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000,
  });
  return token;
}

// ── Inscription ───────────────────────────────────────────────────────────────
export async function signupEmploye(req, res) {
  try {
    const { nom, prenom, mecano, localisation, email, role, telephone, MotDePasse, age } = req.body;

    // Choisit le bon discriminator selon le rôle
    const Model = role === 'admin' ? Admin : Employe;
    const utilisateur = await Model.create({ nom, prenom, mecano, localisation, email, role, telephone, MotDePasse, age });

    const token = setTokenCookie(res, utilisateur);
    return res.status(201).json({ message: 'Compte créé avec succès.', employe: utilisateur, token });
  } catch (error) {
    return res.status(400).json({ error: getErrorMessage(error) });
  }
}

// ── Connexion ─────────────────────────────────────────────────────────────────
export async function loginEmploye(req, res) {
  try {
    const { email, MotDePasse } = req.body;
    if (!email || !MotDePasse) return res.status(400).json({ error: 'Email et mot de passe requis.' });

    // findOne sur le modèle de base → cherche dans toute la collection
    const utilisateur = await Utilisateur.findOne({ email: String(email).toLowerCase() }).select('+MotDePasse');
    if (!utilisateur) return res.status(401).json({ error: 'Identifiants invalides.' });

    const isMatch = await utilisateur.comparePassword(MotDePasse);
    if (!isMatch) return res.status(401).json({ error: 'Identifiants invalides.' });

    const token = setTokenCookie(res, utilisateur);
    return res.status(200).json({ message: 'Connexion réussie.', employe: utilisateur, token });
  } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}

// ── Déconnexion ───────────────────────────────────────────────────────────────
export async function logoutEmploye(req, res) {
  res.clearCookie('token');
  return res.status(200).json({ message: 'Déconnexion réussie.' });
}

// ── Profil ────────────────────────────────────────────────────────────────────
export async function getProfile(req, res) {
  try {
    const utilisateur = await Utilisateur.findById(req.employe._id);
    if (!utilisateur) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    return res.status(200).json({ employe: utilisateur });
  } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}

// ── Mise à jour du profil ─────────────────────────────────────────────────────
export async function updateProfile(req, res) {
  try {
    const utilisateur = await Utilisateur.findById(req.employe._id);
    if (!utilisateur) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    const champsAutorisés = ['nom', 'prenom', 'email', 'telephone', 'localisation', 'age'];
    for (const champ of champsAutorisés) {
      if (req.body[champ] !== undefined) utilisateur[champ] = req.body[champ];
    }
    if (req.body.MotDePasse) utilisateur.MotDePasse = req.body.MotDePasse;

    await utilisateur.save();
    return res.status(200).json({ message: 'Profil mis à jour avec succès.', employe: utilisateur });
  } catch (error) {
    return res.status(400).json({ error: getErrorMessage(error) });
  }
}

// ── Vérification du token ─────────────────────────────────────────────────────
export async function verifyToken(req, res) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'Jeton manquant.' });

    const decoded = jwt.verify(token, JWT_SECRET);
    // findById sur Utilisateur → trouve admin ET employe dans la même collection
    const utilisateur = await Utilisateur.findById(decoded.id);
    if (!utilisateur) return res.status(401).json({ success: false, error: 'Compte introuvable.' });

    return res.status(200).json({ success: true, user: utilisateur });
  } catch (error) {
    if (error.name === 'TokenExpiredError')
      return res.status(401).json({ success: false, error: 'Session expirée.' });
    return res.status(401).json({ success: false, error: 'Jeton invalide.' });
  }
}

// ── Mot de passe oublié ───────────────────────────────────────────────────────
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requis.' });

    const utilisateur = await Utilisateur.findOne({ email: String(email).toLowerCase() });
    if (!utilisateur)
      return res.status(200).json({ message: "Si cet email existe, un lien de réinitialisation a été envoyé." });

    return res.status(200).json({ message: 'Lien de réinitialisation généré.' });
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
  verifyToken,
  forgotPassword,
};

export default authController;