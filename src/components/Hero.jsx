// src/components/Hero.jsx
import React from 'react';
import './css/Hero.css'; // Asegúrate de crear este archivo CSS

function Hero({ restaurantName }) {
    return (
        <header className="hero-section">
            <h1>{restaurantName}</h1>
            <p>¡Bienvenido! Revisa nuestro delicioso menú.</p>
        </header>
    );
}

export default Hero;