import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Utilisateur from '../models/utilisateur.js';
import Admin from '../models/admin.js';
import Employe from '../models/employe.js';
import { sendResetPasswordEmail } from '../../utils/email.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET manquant dans les variables d'environnement.");

function getErrorMessage(error) {
  if (error?.name === 'ValidationError')
    return Object.values(error.errors).map((e) => e.message).join(', ');
  if (error?.code === 11000) return 'Valeur deja utilisee (email ou mecano).';
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

export async function signupEmploye(req, res, next) {
  try {
    const { nom, prenom, mecano, localisation, email, role, telephone, MotDePasse, age } = req.body;
    const Model = role === 'admin' ? Admin : Employe;
    const utilisateur = await Model.create({ nom, prenom, mecano, localisation, email, role, telephone, MotDePasse, age });
    const token = setTokenCookie(res, utilisateur);
    return res.status(201).json({ message: 'Compte cree avec succes.', employe: utilisateur, token });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
}

export async function loginEmploye(req, res) {
  try {
    const { email, MotDePasse } = req.body;
    if (!email || !MotDePasse) return res.status(400).json({ error: 'Email et mot de passe requis.' });

    const utilisateur = await Utilisateur.findOne({ email: String(email).toLowerCase() }).select('+MotDePasse');
    if (!utilisateur) return res.status(401).json({ error: 'Identifiants invalides.' });

    const isMatch = await utilisateur.comparePassword(MotDePasse);
    if (!isMatch) return res.status(401).json({ error: 'Identifiants invalides.' });

    const token = setTokenCookie(res, utilisateur);
    return res.status(200).json({ message: 'Connexion reussie.', employe: utilisateur, token });
  } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}

export async function logoutEmploye(req, res) {
  res.clearCookie('token');
  return res.status(200).json({ message: 'Deconnexion reussie.' });
}

export async function getProfile(req, res) {
  try {
    const utilisateur = await Utilisateur.findById(req.employe._id);
    if (!utilisateur) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    return res.status(200).json({ employe: utilisateur });
  } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}

export async function updateProfile(req, res) {
  try {
    const utilisateur = await Utilisateur.findById(req.employe._id);
    if (!utilisateur) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    const champsAutorises = ['nom', 'prenom', 'email', 'telephone', 'localisation', 'age'];
    for (const champ of champsAutorises) {
      if (req.body[champ] !== undefined) utilisateur[champ] = req.body[champ];
    }
    if (req.body.MotDePasse) utilisateur.MotDePasse = req.body.MotDePasse;

    await utilisateur.save();
    return res.status(200).json({ message: 'Profil mis a jour avec succes.', employe: utilisateur });
  } catch (error) {
    return res.status(400).json({ error: getErrorMessage(error) });
  }
}

export async function verifyToken(req, res) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'Jeton manquant.' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const utilisateur = await Utilisateur.findById(decoded.id);
    if (!utilisateur) return res.status(401).json({ success: false, error: 'Compte introuvable.' });

    return res.status(200).json({ success: true, user: utilisateur });
  } catch (error) {
    if (error.name === 'TokenExpiredError')
      return res.status(401).json({ success: false, error: 'Session expiree.' });
    return res.status(401).json({ success: false, error: 'Jeton invalide.' });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requis.' });

    const utilisateur = await Utilisateur.findOne({ email: String(email).toLowerCase() });

    if (!utilisateur) {
      return res.status(200).json({ message: 'Si cet email est enregistre, un lien de reinitialisation a ete envoye.' });
    }

    const resetToken = utilisateur.createResetPasswordToken();
    await utilisateur.save({ validateBeforeSave: false });

    try {
      await sendResetPasswordEmail(utilisateur, resetToken);
    } catch (emailErr) {
      utilisateur.resetPasswordToken = undefined;
      utilisateur.resetPasswordExpires = undefined;
      await utilisateur.save({ validateBeforeSave: false });
      console.error('Erreur envoi email reset:', emailErr.message);
      return res.status(500).json({ error: "Erreur lors de l'envoi de l'email. Reessayez plus tard." });
    }

    return res.status(200).json({ message: 'Si cet email est enregistre, un lien de reinitialisation a ete envoye.' });
  } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}

export async function resetPassword(req, res) {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Le nouveau mot de passe est requis.' });
    }

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const utilisateur = await Utilisateur.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+MotDePasse +resetPasswordToken +resetPasswordExpires');

    if (!utilisateur) {
      return res.status(400).json({
        error: 'Le lien de reinitialisation est invalide ou a expire. Veuillez refaire une demande.',
      });
    }

    utilisateur.MotDePasse = password;
    utilisateur.resetPasswordToken = undefined;
    utilisateur.resetPasswordExpires = undefined;
    await utilisateur.save();

    const token = setTokenCookie(res, utilisateur);
    return res.status(200).json({
      message: 'Mot de passe reinitialise avec succes.',
      token,
      role: utilisateur.role,
    });
  } catch (error) {
    return res.status(400).json({ error: getErrorMessage(error) });
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
  resetPassword,
};

export default authController;