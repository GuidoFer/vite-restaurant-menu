// src/components/OrderButton.jsx (CÓDIGO COMPLETO CORREGIDO)
import React from 'react';
// CORRECCIÓN 1: Importa el archivo CSS con el nombre correcto
import './css/OrderButton.css'; 

/**
 * Botón flotante para iniciar un pedido por WhatsApp.
 * @param {string} phoneNumber - Número de teléfono del restaurante.
 * @param {string} restaurantName - Nombre del restaurante.
 */
// CORRECCIÓN 2: El nombre de la función coincide con el nombre del archivo
function OrderButton({ phoneNumber, restaurantName }) {
    // Definimos el mensaje inicial y el prefijo de Bolivia (591)
    const initialMessage = `Hola ${restaurantName}, quisiera hacer un pedido de su menú.`;
    
    // Construcción del link de WhatsApp
    const whatsappLink = `https://wa.me/591${phoneNumber}?text=${encodeURIComponent(initialMessage)}`; 
    
    return (
        <a 
            href={whatsappLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="order-button-floating"
        >
            Realizar Pedido por WhatsApp
        </a>
    );
}

// CORRECCIÓN 3: Exporta el componente con el nombre correcto
export default OrderButton;