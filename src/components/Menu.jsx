// src/components/Menu.jsx (AJUSTADO)
import React from 'react';
import './css/Menu.css'; 
// Importa el componente del modal si lo tienes aquí, o asegúrate de que esté en MenuPage.jsx

/**
 * Componente principal que renderiza todas las categorías y platos del menú.
 * @param {Array} categories - Array de categorías con la estructura {name: '...', items: [...]}
 */
function Menu({ categories }) {
  
    // Verificación de seguridad
    if (!Array.isArray(categories) || categories.length === 0) {
        return <div className="menu-container">No hay elementos en el menú para mostrar.</div>;
    }

    return (
        <div className="menu-container">
            {categories.map((categoryObj, index) => (
                <section key={index} className="menu-category">
                    <h2>{categoryObj.name}</h2>
                    <div className="menu-items-list">
                        
                        {categoryObj.items.map((item) => (
                            // Usamos item.id para la key
                            <div 
                                key={item.id || item.name} 
                                // Lógica de "Agotado" con la clase CSS 'unavailable'
                                className={`menu-item ${!item.available ? 'unavailable' : ''}`}
                            >
                                
                                {/* 1. Foto del plato */}
                                {item.imagen_url ? (
                                    <img 
                                        src={item.imagen_url} 
                                        alt={item.name} 
                                        className="item-image"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="item-image placeholder">
                                        <span>{item.name ? item.name[0] : '...'}</span> 
                                    </div>
                                )}
                                
                                {/* Overlay de Agotado (Visual) */}
                                {!item.available && (
                                    <div className="overlay-unavailable">
                                        <span>AGOTADO</span>
                                    </div>
                                )}

                                {/* 2. Detalles del plato */}
                                <div className="item-details">
                                    <h3 className="item-name">{item.name}</h3>
                                    <p className="item-price">{item.price}</p>
                                    
                                    {/* Aquí iría la descripción si existiera */}
                                </div>
                                
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}

export default Menu;