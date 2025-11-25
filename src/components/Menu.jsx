// src/components/Menu.jsx (VERSIÓN FINAL DE ESTABILIDAD)
import React from 'react';
import './css/Menu.css'; 

/**
 * Componente principal que renderiza todas las categorías y platos del menú.
 */
function Menu({ menu, optionsList }) {
  
  // Verificación de seguridad: si 'menu' no es un array o está vacío, no renderizamos nada.
  if (!Array.isArray(menu) || menu.length === 0) {
      return <div className="menu-container">No hay elementos en el menú para mostrar.</div>;
  }

  return (
    <div className="menu-container">
      {menu.map((categoryObj, index) => (
        <section key={index} className="menu-category">
          <h2>{categoryObj.nombre}</h2>
          <div className="menu-items-list">
            
            {categoryObj.productos.map((plato) => (
              // Aseguramos que plato.id exista para la clave
              <div key={plato.id || plato.nombre} className={`menu-item ${!plato.disponible ? 'unavailable' : ''}`}>
                
                {/* 1. Foto del plato */}
                {plato.foto_url ? (
                  <img 
                    src={plato.foto_url} 
                    alt={plato.nombre} 
                    className="item-image"
                    loading="lazy"
                  />
                ) : (
                  <div className="item-image placeholder">
                    <span>{plato.nombre ? plato.nombre[0] : ''}</span> 
                  </div>
                )}

                {/* 2. Detalles del plato */}
                <div className="item-details">
                  <h3 className="item-name">{plato.nombre}</h3>
                  
                  {/* Corregido: Si no tienes descripción, la saltamos. */}
                  
                  {/* Precio: Verificamos que el precio sea un número válido antes de formatear */}
                  {(plato.precio || plato.precio === 0) && (
                      <p className="item-price">Bs. {parseFloat(plato.precio).toFixed(2)}</p>
                  )}
                  
                  {/* Etiqueta de No Disponible */}
                  {!plato.disponible && (
                    <span className="availability-tag">AGOTADO</span>
                  )}
                </div>
                
              </div>
            ))}
          </div>
        </section>
      ))}
      
      {/* Renderizado de Opciones */}
      {Object.keys(optionsList).length > 0 && (
          <section className="menu-category options-section">
              <h2>Opciones del Día</h2>
              <div className="options-list">
                  {Object.entries(optionsList).map(([type, options]) => (
                      <div key={type} className="option-group">
                          <h3>{type}</h3>
                          <p>{options
                              .filter(opt => opt.disponible)
                              .map(opt => opt.nombre)
                              .join(' | ')}</p>
                      </div>
                  ))}
              </div>
          </section>
      )}

    </div>
  );
}

export default Menu;  
