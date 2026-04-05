import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export const authenticate = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Jeton manquant, accès refusé.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Jeton invalide ou expiré.' });
  }
};

/**
 * Accepte authorize("admin") ou authorize(["admin"]) — les rôles passés en tableau imbriqué sont aplatis.
 */
export const authorize = (...roles) => {
  const allowed = roles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié.' });
    }

    if (allowed.length && !allowed.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé : droits insuffisants.' });
    }

    next();
  };
};
