import React, { useState } from 'react';
import './Signup.css';

const Signup = ({ onBackToLogin }) => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    mecano: '',
    localisation: '',
    email: '',
    role: 'chauffeur',
    telephone: '',
    MotDePasse: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation
    if (formData.MotDePasse !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/employe/ajouter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: formData.nom,
          prenom: formData.prenom,
          mecano: formData.mecano,
          localisation: formData.localisation,
          email: formData.email,
          role: formData.role,
          telephone: formData.telephone,
          MotDePasse: formData.MotDePasse
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'inscription');
      }

      await response.json();
      alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
      onBackToLogin();
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'inscription. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-form">
        <div className="app-header">
          <h1 className="app-name">TransRoute</h1>
          <p className="welcome-message">Bienvenue</p>
        </div>
        <h2>Inscription</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nom">Nom:</label>
              <input
                type="text"
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="Entrez votre nom"
              />
            </div>
            <div className="form-group">
              <label htmlFor="prenom">Prénom:</label>
              <input
                type="text"
                id="prenom"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="Entrez votre prénom"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="mecano">Mécano:</label>
            <input
              type="text"
              id="mecano"
              name="mecano"
              value={formData.mecano}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="Entrez votre numéro mécano"
            />
          </div>
          <div className="form-group">
            <label htmlFor="localisation">Localisation:</label>
            <input
              type="text"
              id="localisation"
              name="localisation"
              value={formData.localisation}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Entrez votre localisation"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="Entrez votre email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="role">Rôle:</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="chauffeur">Chauffeur</option>
              <option value="receveur">Receveur</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="telephone">Téléphone:</label>
            <input
              type="tel"
              id="telephone"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Entrez votre numéro de téléphone"
            />
          </div>
          <div className="form-group">
            <label htmlFor="MotDePasse">Mot de passe:</label>
            <input
              type="password"
              id="MotDePasse"
              name="MotDePasse"
              value={formData.MotDePasse}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="Entrez votre mot de passe"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le mot de passe:</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="Confirmez votre mot de passe"
            />
          </div>
          <button type="submit" className="signup-btn" disabled={isLoading}>
            {isLoading ? 'Inscription en cours...' : 'S\'inscrire'}
          </button>
        </form>
        <div className="back-to-login">
          <button type="button" onClick={onBackToLogin} className="back-btn">
            Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;