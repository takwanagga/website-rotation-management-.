// frontend/src/Pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AtSign, ArrowLeft, CheckCircle } from 'lucide-react';
import axiosInstance from '../api/axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await axiosInstance.post('/auth/forgot-password', { email });
      // On affiche toujours le succès (même si l'email n'existe pas → sécurité)
      setSent(true);
    } catch (err) {
      // En cas d'erreur serveur réelle (500)
      setError(
        err.response?.data?.error ||
          "Une erreur s'est produite. Veuillez réessayer."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Écran de confirmation ────────────────────────────────────────────────────
  if (sent) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Email envoyé !</h2>
          <p className="text-gray-500 text-sm mb-1">
            Si l'adresse <strong>{email}</strong> est enregistrée dans notre système,
            vous recevrez un email avec un lien de réinitialisation.
          </p>
          <p className="text-gray-400 text-xs mt-3 mb-6">
            Le lien est valable <strong>1 heure</strong>. Pensez à vérifier vos spams.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => { setSent(false); setEmail(''); }}
              className="w-full py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              Utiliser une autre adresse
            </button>
            <Link
              to="/login"
              className="block w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition text-center"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Formulaire ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 px-8 pt-10 pb-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <AtSign className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Mot de passe oublié</h1>
          <p className="text-indigo-200 text-sm text-center">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        <div className="px-6 pt-6 pb-8">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Adresse email
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="votre@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent disabled:opacity-60 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Envoi en cours…
                </>
              ) : (
                'Envoyer le lien de réinitialisation'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;