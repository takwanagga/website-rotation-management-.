import React, { useState } from 'react';
import './Login.css';
import ForgotPassword from './ForgotPassword';
import Signup from './Signup';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/employe/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      // Handle successful login: store token and redirect (simple)
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.employe || {}));
        alert('Connexion réussie');
        // TODO: replace with app routing/redirect to dashboard
        window.location.reload();
      } else {
        console.log('Login successful (no token):', data);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setShowSignup(false);
    setError('');
  };

  const handleShowSignup = () => {
    setShowSignup(true);
  };

  if (showForgotPassword) {
    return <ForgotPassword onBackToLogin={handleBackToLogin} />;
  }

  if (showSignup) {
    return <Signup onBackToLogin={handleBackToLogin} />;
  }

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="app-header">
          <h1 className="app-name">TransRoute</h1>
          <p className="welcome-message">Bienvenue</p>
        </div>
        <h2>Connexion</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Entrez votre email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Mot de passe:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Entrez votre mot de passe"
            />
          </div>
          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>
        <div className="form-footer">
          <div className="forgot-password">
            <button type="button" onClick={handleForgotPassword} className="forgot-btn">
              Mot de passe oublié ?
            </button>
          </div>
          <div className="signup-section">
            <p>Pas encore de compte ?</p>
            <button type="button" onClick={handleShowSignup} className="signup-btn">
              S'inscrire
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;