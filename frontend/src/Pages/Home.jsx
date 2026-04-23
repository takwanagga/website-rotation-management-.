import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center text-white px-4">
          <h1 className="text-5xl font-bold mb-4">TransRoute</h1>
          <p className="text-xl mb-8">Gestion Intelligente des Transportations</p>
          <div className="flex gap-4 justify-center">
            <Link to="/login" className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition">
              Se Connecter
            </Link>
            <Link to="/signup" className="px-8 py-3 bg-blue-800 text-white rounded-lg font-semibold hover:bg-blue-900 transition border border-white">
              S'Inscrire
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
