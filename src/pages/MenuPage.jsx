// src/pages/MenuPage.jsx (AJUSTADO)
import React from 'react';
import { useParams } from 'react-router-dom';
import useMenuData from '../hooks/useMenuData';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Menu from '../components/Menu';
import OpcionesList from '../components/OpcionesList';
import Footer from '../components/Footer';
import OrderButton from '../components/OrderButton';
import PaymentModal from '../components/PaymentModal';

function MenuPage() {
    const { slug } = useParams();
    const { data, loading, error } = useMenuData(slug);

    if (loading) {
        return <div className="loading-screen">Cargando menú...</div>;
    }

    if (error) {
        return <div className="error-screen">Error: {error}</div>;
    }

    if (!data || !data.restaurant) {
        return <div className="error-screen">No se pudo cargar la información del restaurante.</div>;
    }

    const { restaurant, categories, opciones, lastUpdate } = data;

    return (
        <div className="menu-page">
            <Navbar 
                restaurantName={restaurant.nombre} 
                lastUpdate={lastUpdate} 
            />
            <Hero 
                restaurantName={restaurant.nombre} 
            />
            
            <div className="main-content">
                {/* Bug 3: Pasamos la nueva propiedad 'categories' */}
                <Menu categories={categories} /> 
                <OpcionesList opciones={opciones} />
            </div>

            <Footer />
            {/* Componentes Flotantes */}
            <OrderButton phoneNumber={restaurant.telefono} />
            {/* Bug 4: Pasamos qr_url al PaymentModal */}
            <PaymentModal qrUrl={restaurant.qr_url} /> 
        </div>
    );
}

export default MenuPage;