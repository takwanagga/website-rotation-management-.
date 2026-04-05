import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { signupEmployee } from "../lib/api";
import toast, { Toaster } from 'react-hot-toast';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    mecano: '',
    localisation: '',
    email: '',
    role: 'chauffeur',
    telephone: '',
    age: '',
    MotDePasse: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const passwordRequirements = [
    { label: 'Au moins 8 caractères', regex: /.{8,}/ },
    { label: '1 lettre majuscule', regex: /[A-Z]/ },
    { label: '1 lettre minuscule', regex: /[a-z]/ },
    { label: '1 chiffre', regex: /\d/ },
    { label: '1 caractère spécial', regex: /[\W_]/ }
  ];

  const checkPasswordRequirements = (password) => {
    return passwordRequirements.map(req => ({
      ...req,
      met: req.regex.test(password)
    }));
  };

  const [passwordChecks, setPasswordChecks] = useState(checkPasswordRequirements(''));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'MotDePasse') {
      setPasswordChecks(checkPasswordRequirements(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (formData.MotDePasse !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    // Check if all requirements are met
    const allRequirementsMet = passwordChecks.every(check => check.met);
    if (!allRequirementsMet) {
      setError('Le mot de passe ne respecte pas tous les critères requis');
      setIsLoading(false);
      return;
    }

    try {
      await signupEmployee({
        nom: formData.nom,
        prenom: formData.prenom,
        mecano: formData.mecano,
        localisation: formData.localisation,
        email: formData.email,
        role: formData.role,
        telephone: formData.telephone,
        age: formData.age ? parseInt(formData.age) : undefined,
        MotDePasse: formData.MotDePasse,
      });
      <Toaster />
      alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
      toast.success('Inscription réussie !')
       
      navigate("/login");
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Erreur lors de l\'inscription. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const allRequirementsMet = passwordChecks.every(check => check.met);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">TransRoute</h1>
          <p className="text-lg text-gray-600">Bienvenue</p>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Inscription</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom:</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                onChange={handleChange}
                  required
                disabled={isLoading}
                placeholder="Entrez votre nom"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
                />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prénom:</label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                onChange={handleChange}
                  required
                disabled={isLoading}
                placeholder="Entrez votre prénom"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
                />
              </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mécano:</label>
              <input
                type="text"
                name="mecano"
                value={formData.mecano}
              onChange={handleChange}
                required
              disabled={isLoading}
              placeholder="Entrez votre numéro mécano"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
              />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Localisation:</label>
            <input
              type="text"
              name="localisation"
              value={formData.localisation}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Entrez votre localisation"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
              onChange={handleChange}
                required
              disabled={isLoading}
              placeholder="Entrez votre email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
              />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rôle:</label>
              <select
                name="role"
                value={formData.role}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
              >
                <option value="chauffeur">Chauffeur</option>
                <option value="receveur">Receveur</option>
              <option value="admin">Admin</option>
              </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone:</label>
            <input
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Entrez votre numéro de téléphone (8 chiffres)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Âge:</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="18"
                max="65"
                disabled={isLoading}
                placeholder="Entrez votre âge"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe:</label>
              <input
                type="password"
                name="MotDePasse"
                value={formData.MotDePasse}
              onChange={handleChange}
                required
              disabled={isLoading}
              placeholder="Entrez votre mot de passe"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
            />
            
            {formData.MotDePasse && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs font-semibold text-gray-700 mb-2">Critères du mot de passe:</p>
                <ul className="space-y-1">
                  {passwordChecks.map((check, index) => (
                    <li key={index} className={`text-xs flex items-center ${check.met ? 'text-green-600' : 'text-gray-400'}`}>
                      <span className={`mr-2 ${check.met ? 'text-green-500' : 'text-gray-300'}`}>✓</span>
                      {check.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe:</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
              onChange={handleChange}
                required
              disabled={isLoading}
              placeholder="Confirmez votre mot de passe"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
              />
          </div>

              <button
                type="submit"
            disabled={isLoading || !allRequirementsMet}
            className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
              >
            {isLoading ? 'Inscription en cours...' : 'S\'inscrire'}
              </button>
            </form>

        <div className="text-center mt-6">
          <Link to="/login" className="text-blue-600 hover:underline text-sm">
            Retour à la connexion
              </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
