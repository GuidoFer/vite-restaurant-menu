// src/components/FooterInfo.jsx
import React from 'react';

const FooterInfo = ({ restaurant }) => {
    return (
        <footer className="w-full bg-gray-800 text-white py-8 mt-12">
            <div className="max-w-4xl mx-auto px-4 text-center">
                <h3 className="text-xl font-bold mb-4">
                    {restaurant.nombre}
                </h3>
                
                <div className="space-y-2 mb-6">
                    {restaurant.ubicacion && (
                        <p className="text-gray-300">
                            📍 {restaurant.ubicacion}
                        </p>
                    )}
                    {restaurant.telefono && (
                        <p className="text-gray-300">
                            📞 {restaurant.telefono}
                        </p>
                    )}
                </div>

                <div className="border-t border-gray-700 pt-4">
                    <p className="text-sm text-gray-400">
                        © {new Date().getFullYear()} {restaurant.nombre}. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default FooterInfo;