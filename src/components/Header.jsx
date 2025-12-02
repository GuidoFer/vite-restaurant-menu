// src/components/Header.jsx
import React from 'react';

const Header = ({ restaurant, lastUpdate, tipoServicio }) => {
    return (
        <header className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    {restaurant.nombre}
                </h1>
                {restaurant.ubicacion && (
                    <p className="text-gray-600 mb-2">
                        📍 {restaurant.ubicacion}
                    </p>
                )}
                {restaurant.telefono && (
                    <p className="text-gray-600 mb-2">
                        📞 {restaurant.telefono}
                    </p>
                )}
                {tipoServicio && (
                    <span className="inline-block bg-green-100 text-green-800 px-4 py-1 rounded-full text-sm font-semibold mb-2">
                        {tipoServicio}
                    </span>
                )}
                {lastUpdate && (
                    <p className="text-xs text-gray-400 mt-2">
                        Última actualización: {lastUpdate}
                    </p>
                )}
            </div>
        </header>
    );
};

export default Header;