import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {FaCalendarDay, FaCogs, FaTachometerAlt, FaUsers, FaBus, FaRoute, FaSignOutAlt, FaBars, FaTimes} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const AdminSidebar = () =>{
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const closeSidebar = () => {
        setIsOpen(false);
    };

  return (
        <>
            {/* Mobile Menu Button */}
            <button 
                onClick={toggleSidebar}
                className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white p-2 rounded-lg"
            >
                {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <div className={`w-64 bg-slate-900 text-white h-screen flex flex-col fixed z-40 transform transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Logo */}
                <div className="p-6 border-b border-slate-700">
                   <h3 className="text-2xl font-bold text-blue-400">TransRoute</h3>  
        </div>

                {/* Navigation Links */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <NavLink 
                        to="/admin-dashboard"
                        onClick={closeSidebar}
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                        <FaTachometerAlt size={20}/>
                  <span>Tableau de Bord</span>
                </NavLink>

                    <NavLink 
                        to="/employees"
                        onClick={closeSidebar}
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                        <FaUsers size={20}/>
                        <span>Employés</span>
                </NavLink>

                    <NavLink 
                        to="/buses"
                        onClick={closeSidebar}
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                        <FaBus size={20}/>
                  <span>Bus</span>
                </NavLink>

                    <NavLink 
                        to="/lignes"
                        onClick={closeSidebar}
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                        <FaRoute size={20}/>
                        <span>Lignes</span>
                </NavLink>

                    <NavLink 
                        to="/planning"
                        onClick={closeSidebar}
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                        <FaCalendarDay size={20}/>
                        <span>Planning</span>
                </NavLink>

                    <NavLink 
                        to="/settings"
                        onClick={closeSidebar}
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                        <FaCogs size={20}/>
                        <span>Paramètres</span>
                </NavLink>
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-slate-700">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition text-white"
                    >
                        <FaSignOutAlt size={20}/>
                        <span>Déconnexion</span>
                    </button>
          </div>
        </div>
        </>
    )
}

export default AdminSidebar;