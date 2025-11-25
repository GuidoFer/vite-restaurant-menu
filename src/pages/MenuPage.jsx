// src/pages/MenuPage.jsx
import React from 'react';
import { useMenuData } from '../hooks/useMenuData';
import Menu from '../components/Menu';
import Navbar from '../components/Navbar';
import WhatsappButton from '../components/WhatsappButton';
import NotFound from './NotFound';


function MenuPage() {
    
    // Extracción de slug más robusta para producción:
    // Debe funcionar tanto para /demo-restaurant/ como para /demo-restaurant
    const urlParts = window.location.pathname.split('/').filter(part => part !== '');
    const slug = urlParts[urlParts.length - 1];

    // Obtener el estado del hook
    const { data, loading, error } = useMenuData(slug);

    // Si no hay slug en la URL (ej: solo localhost:5173), redirige al 404
    if (!slug) {
        return <NotFound message="🛑 Ruta Incompleta" />;
    }

    // --- FLUJO DE RENDERIZADO FINAL ---

    return (
        <div className="menu-page">
            
            {/* 1. Muestra LOADING mientras se carga, y solo si no hay datos previos */}
            {loading && !data && (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Cargando menú...</p>
                </div>
            )}
            
            {/* 2. Muestra ERROR si NO hay datos y NO está cargando. */}
            {error && !loading && !data && (
                <NotFound message={error} />
            )}

            {/* 3. Muestra el CONTENIDO DEL MENÚ si hay datos. */}
            {data && (
                <>
                    {/* Navbar */}
                    <Navbar
                        // CORRECCIÓN 1: Usar 'nombre' en lugar de 'name'
                        restaurantName={data.restaurant.nombre} 
                        // CORRECCIÓN 2: Mover 'lastUpdate' a la raíz del objeto 'data'
                        lastUpdate={data.lastUpdate} 
                    />
                    
                    {/* Menu */}
                    <Menu menu={data.menu} optionsList={data.optionsList} />

                    {/* WhatsApp */}
                    <WhatsappButton number={data.restaurant.telefono} /> 
                </>
            )}

        </div>
    );
}

export default MenuPage;