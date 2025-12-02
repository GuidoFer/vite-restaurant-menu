// src/components/OpcionesList.jsx
import React from 'react';
import './css/OpcionesList.css';

/**
 * Componente para seleccionar opciones (presas, guarniciones, bebidas)
 * @param {string} title - Título de la sección
 * @param {array} options - Array de strings con las opciones
 * @param {string} selectedOption - Opción actualmente seleccionada
 * @param {function} onSelect - Callback cuando se selecciona una opción
 * @param {boolean} required - Si la selección es obligatoria
 */
const OpcionesList = ({ title, options, selectedOption, onSelect, required = false }) => {
    if (!options || options.length === 0) {
        return null;
    }

    return (
        <div className="opciones-list-container">
            <h4 className="opciones-list-title">
                {title}
                {required && <span className="required-indicator"> *</span>}
            </h4>
            <div className="opciones-buttons-grid">
                {options.map((opcion, index) => {
                    const opcionNombre = typeof opcion === 'string' ? opcion : opcion.nombre;
                    const isSelected = selectedOption === opcionNombre;
                    
                    return (
                        <button
                            key={index}
                            className={`opcion-button ${isSelected ? 'selected' : ''}`}
                            onClick={() => onSelect(opcionNombre)}
                        >
                            {opcionNombre}
                            {isSelected && <span className="check-icon">✓</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default OpcionesList;