// src/components/CarritoButton.jsx
import React from 'react';
import './css/CarritoButton.css';

const CarritoButton = ({ itemCount, total, onClick }) => {
    if (itemCount === 0) return null;

    return (
        <button className="carrito-floating-button" onClick={onClick}>
            <div className="carrito-icon">
                🛒
                <span className="carrito-badge">{itemCount}</span>
            </div>
            <div className="carrito-info">
                <span className="carrito-text">Ver Carrito</span>
                <span className="carrito-total">Bs. {total.toFixed(2)}</span>
            </div>
        </button>
    );
};

export default CarritoButton;