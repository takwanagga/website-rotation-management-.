import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du lien de réinitialisation');
      }

      setMessage('Email de réinitialisation envoyé. Veuillez vérifier votre boîte de réception.');
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'envoi du lien. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Réinitialiser le mot de passe</h2>
        <p className="text-center text-gray-600 text-sm mb-6">
          Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email:
            </label>
                  <input
                    type="email"
              id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
              disabled={isLoading}
              placeholder="Entrez votre email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
                  />
          </div>

                  <button
                    type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
                  >
            {isLoading ? 'Envoi en cours...' : 'Renvoyer le lien'}
                  </button>
                </form>

        <div className="text-center mt-6">
          <p className="text-gray-600 mb-2">Vous avez un compte ?</p>
          <Link to="/login" className="text-blue-600 hover:underline text-sm">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
