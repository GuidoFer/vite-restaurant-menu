// src/components/Footer.jsx
import React from 'react';
import './css/Footer.css'; // Asegúrate de crear este archivo CSS

function Footer() {
    // Puedes añadir información del restaurante aquí si la tienes.
    return (
        <footer className="app-footer">
            <p>&copy; {new Date().getFullYear()} Sistema de Menús Digitales.</p>
            <p>Hecho con ⚡ por [Tu Nombre/Compañía]</p>
        </footer>
    );
}

export default Footer;