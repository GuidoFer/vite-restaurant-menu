// src/components/OpcionesList.jsx
import React from 'react';
import './css/OpcionesList.css'; // Asegúrate de crear este archivo CSS

/**
 * Muestra las guarniciones y presas disponibles.
 * @param {object} opciones - Objeto con {guarniciones: [...], presas: [...]}
 */
function OpcionesList({ opciones }) {
    if (!opciones) return null;

    return (
        <section className="opciones-container">
            <h3>Complementos y Extras</h3>

            {/* Lista de Guarniciones */}
            {opciones.guarniciones && opciones.guarniciones.length > 0 && (
                <div className="opciones-section">
                    <h4>Guarniciones Disponibles</h4>
                    <ul>
                        {opciones.guarniciones.map(opcion => (
                            <li 
                                key={opcion.id} 
                                className={!opcion.disponible ? 'unavailable-opcion' : ''}
                            >
                                {opcion.nombre}
                                {!opcion.disponible && <span> (Agotado)</span>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {/* Lista de Presas */}
            {opciones.presas && opciones.presas.length > 0 && (
                <div className="opciones-section">
                    <h4>Presas y Piezas</h4>
                    <ul>
                        {opciones.presas.map(opcion => (
                            <li 
                                key={opcion.id} 
                                className={!opcion.disponible ? 'unavailable-opcion' : ''}
                            >
                                {opcion.nombre}
                                {!opcion.disponible && <span> (Agotado)</span>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {(opciones.guarniciones?.length === 0 && opciones.presas?.length === 0) && (
                <p className="no-opciones">No hay complementos adicionales disponibles.</p>
            )}
        </section>
    );
}

export default OpcionesList;