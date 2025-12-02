// src/components/ErrorDisplay.jsx
import React from 'react';

const ErrorDisplay = ({ message }) => {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-red-600 mb-4">
                    Error al Cargar
                </h2>
                <p className="text-gray-700 mb-6">
                    {message || "No se pudo cargar la información del menú."}
                </p>
                <button 
                    onClick={() => window.location.reload()}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
                >
                    Reintentar
                </button>
            </div>
        </div>
    );
};

export default ErrorDisplay;