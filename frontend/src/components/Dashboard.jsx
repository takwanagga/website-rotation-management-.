import React, { useState } from 'react';
import './Dashboard.css';
import { useAuth } from '../context/AuthContext';
import EmployeeManagement from './EmployeeManagement';
import BusManagement from './BusManagement';
import LigneManagement from './LigneManagement';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState('employees');

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-navbar">
        <div className="navbar-brand">
          <h1>Gestion Bus</h1>
        </div>
        <ul className="nav-menu">
          <li>
            <button 
              className={`nav-button ${activeView === 'employees' ? 'active' : ''}`}
              onClick={() => setActiveView('employees')}
            >
              Employés
            </button>
          </li>
          <li>
            <button
              className={`nav-button ${activeView === 'buses' ? 'active' : ''}`}
              onClick={() => setActiveView('buses')}
            >
              Bus
            </button>
          </li>
          <li>
            <button
              className={`nav-button ${activeView === 'lignes' ? 'active' : ''}`}
              onClick={() => setActiveView('lignes')}
            >
              Lignes
            </button>
          </li>
        </ul>
        <div className="user-info">
          <span className="user-name">{user?.nom} {user?.prenom}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        {activeView === 'employees' && <EmployeeManagement />}
        {activeView === 'buses' && <BusManagement />}
        {activeView === 'lignes' && <LigneManagement />}
      </div>
    </div>
  );
};

export default Dashboard;
