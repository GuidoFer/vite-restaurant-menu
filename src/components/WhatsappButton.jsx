// src/components/WhatsappButton.jsx
import React from 'react';
import './css/WhatsappButton.css'; // Importaremos el CSS en la Tarea 8.2

/**
 * Componente de botón flotante de WhatsApp.
 * Genera el enlace dinámico con el número del restaurante y un mensaje inicial.
 */
function WhatsappButton({ phoneNumber, restaurantName }) {
  // El mensaje inicial al restaurante
  const initialMessage = `Hola ${restaurantName}, quisiera hacer un pedido de su menú.`;
  
  // Codificar el mensaje para la URL
  const encodedMessage = encodeURIComponent(initialMessage);
  
  // Generar la URL de WhatsApp (asumiendo que phoneNumber es formato local, ej: 77712345)
  // Usamos el código de Bolivia (+591)
  const whatsappUrl = `https://wa.me/591${phoneNumber}?text=${encodedMessage}`;

  return (
    <a 
      href={whatsappUrl} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="whatsapp-button"
      title={`Pedir por WhatsApp a ${restaurantName}`}
    >
      {/* Icono de WhatsApp */}
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path fill="currentColor" d="M12.04 2C7.39 2 3.59 5.8 3.59 10.45c0 1.95.63 3.82 1.83 5.37L4 20l4.24-1.12c1.47.8 3.16 1.22 4.16 1.22 4.65 0 8.45-3.8 8.45-8.45C20.49 5.8 16.69 2 12.04 2zM17.15 15.64c-.19.46-.72.63-1.15.5-1.55-.54-2.88-1.28-3.79-2.02-.91-.74-1.42-1.57-1.42-2.3 0-.62.24-1.07.56-1.39s.75-.48 1.1-.48c.28 0 .47.02.66.07.19.05.41.14.64.33.24.19.33.4.45.61.12.21.2.45.33.68s.22.46.33.7.19.64.19.89c0 .24-.07.47-.19.72s-.33.51-.55.72c-.22.21-.4.44-.64.66s-.46.4-.7.6c-.24.2-.47.34-.7.43-.24.1-.48.16-.7.16s-.47-.07-.66-.14c-.19-.07-.4-.19-.66-.37-.24-.18-.47-.4-.68-.66s-.4-.57-.61-.92c-.21-.35-.4-.78-.54-1.28-.14-.5-.22-1.05-.22-1.68 0-1.4.38-2.6.94-3.6.56-1 1.34-1.78 2.27-2.35.93-.57 1.92-.85 2.97-.85 1.58 0 2.82.5 3.73 1.51.91 1.01 1.36 2.37 1.36 3.96 0 2.3-.9 3.83-2.19 4.88-.95.77-2.14 1.15-3.39 1.15-.31 0-.61-.02-.89-.07z"/>
      </svg>
      <span>Pedir por WhatsApp</span>
    </a>
  );
}

export default WhatsappButton;