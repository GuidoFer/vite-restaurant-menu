// src/components/Navbar.jsx
import React from 'react';
import './css/Navbar.css'; // Importaremos el CSS en la Tarea 8.2

/**
 * Componente de barra de navegación superior.
 * Muestra el nombre del restaurante y la hora de la última actualización.
 */
function Navbar({ restaurantName, lastUpdate }) {
  // Formatear la hora de la última actualización
  const time = new Date(lastUpdate).toLocaleTimeString('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        {/* Usaremos un icono simple como logo temporal */}
        <span role="img" aria-label="restaurante">🍽️</span> 
        <h1>{restaurantName}</h1>
      </div>
      <div className="navbar-info">
        <small>Actualizado: {time}</small>
        {/* Aquí podríamos poner un botón de compartir en el futuro */}
      </div>
    </nav>
  );
}

export default Navbar;