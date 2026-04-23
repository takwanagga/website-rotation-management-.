import jwt from 'jsonwebtoken';
import Utilisateur from '../models/utilisateur.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET manquant dans les variables d'environnement.");
}

//  vérifie le token + cherche l'employé en DB 
export const authenticate = async (req, res, next) => {
  try {
    const cookieToken = req.cookies?.token;
    const authHeader = req.headers.authorization;
    const headerToken = authHeader?.split(' ')[1];
    const token = cookieToken || headerToken;

    console.log('Auth debug: cookie token exists:', !!cookieToken, '| header auth:', authHeader?.substring(0, 20) + '...');
    console.log('Auth debug: URL:', req.originalUrl, '| Method:', req.method);
    console.log('Auth debug: Final token exists:', !!token, '| token length:', token?.length);

    if (!token) {
      console.log('Auth debug: No token found, rejecting');
      return res.status(401).json({ message: 'Jeton manquant, accès refusé.' });
    }

    console.log('Auth debug: Verifying token with JWT_SECRET...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Auth debug: Token decoded, user ID:', decoded.id);

    const utilisateur = await Utilisateur.findById(decoded.id).select('-MotDePasse');
    console.log('Auth debug: User found:', !!utilisateur);

    if (!utilisateur) {
      console.log('Auth debug: User not found in DB');
      return res.status(401).json({ message: 'Compte introuvable ou supprimé.' });
    }
    req.employe = utilisateur;
    console.log('Auth debug: Auth successful for user:', utilisateur.email);
    next();

  } catch (error) {
    console.error('Auth middleware error:', error.name, error.message);
    console.error('Auth middleware: Token verification failed');
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