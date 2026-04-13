import jwt from 'jsonwebtoken';
import Employe from '../models/employe.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET manquant dans les variables d'environnement.");
}

//  vérifie le token + cherche l'employé en DB 
export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Jeton manquant, accès refusé.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const employe = await Employe.findById(decoded.id).select('-MotDePasse');

    if (!employe) {
      return res.status(401).json({ message: 'Compte introuvable ou supprimé.' });
    }
    req.employe = employe;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expirée, reconnectez-vous.' });
    }
    return res.status(401).json({ message: 'Jeton invalide.' });
  }
};

//  vérifie le rôle après authenticate 
export const authorize = (...roles) => {
  const allowed = roles.flat();

  return (req, res, next) => {
    if (!req.employe) {
      return res.status(401).json({ message: 'Non authentifié.' });
    }

    if (!allowed.includes(req.employe.role)) {
      return res.status(403).json({
        message: `Accès refusé. Rôle requis : ${allowed.join(' ou ')}.`
      });
    }

    next();
  };
};

export const adminOnly = [authenticate, authorize('admin')];
export const chauffeurReceveurOnly = [authenticate, authorize('chauffeur', 'receveur')];
export const tousLesRoles = [authenticate, authorize('admin', 'chauffeur', 'receveur')];