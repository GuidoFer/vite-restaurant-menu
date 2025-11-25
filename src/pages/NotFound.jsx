// src/pages/NotFound.jsx
import React from 'react';

function NotFound() {
  return (
    <div className="not-found-container">
      <h1>❌ 404 - Menú No Encontrado</h1>
      <p>Lo sentimos, la dirección del restaurante que buscas no existe o el enlace está mal escrito.</p>
      <p>Por favor, verifica la URL o contacta con el restaurante.</p>
      <style jsx>{`
        .not-found-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          text-align: center;
          padding: 20px;
          background-color: #f8f8f8;
        }
        h1 {
          color: #dc3545;
          margin-bottom: 15px;
        }
        p {
          color: #6c757d;
          max-width: 400px;
        }
      `}</style>
    </div>
  );
}

export default NotFound;