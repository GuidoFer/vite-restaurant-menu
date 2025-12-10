// src/components/PlatosExtras.jsx
import React, { useState, forwardRef, useImperativeHandle } from 'react';
import PlatoModal from './PlatoModal';
import './css/PlatosExtras.css';

const PlatosExtras = forwardRef(({ menuExtras, horarioActual, onAddToCart, guarniciones, theme = 'dia' }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [platoSeleccionado, setPlatoSeleccionado] = useState(null);

    // Exponer funciones al componente padre mediante ref
    useImperativeHandle(ref, () => ({
        isOpen: isOpen,
        closeAccordion: () => setIsOpen(false),
        openAccordion: () => setIsOpen(true)
    }));

    const toggleAccordion = () => setIsOpen(!isOpen);

    const categorias = Object.keys(menuExtras);
    
    if (categorias.length === 0) {
        return null;
    }

    // Títulos según tema
    const titulo = theme === 'noche' 
        ? '🌙 Nuestro Menú - Noche' 
        : '🍽️ Platos Extras - Medio Día';

    const handleOpenModal = (plato) => {
        setPlatoSeleccionado(plato);
    };

    const handleCloseModal = () => {
        setPlatoSeleccionado(null);
    };

    return (
        <>
            <div className={`platos-extras-container ${theme === 'noche' ? 'noche-theme' : ''}`}>
                <button 
                    className={`accordion-header ${isOpen ? 'active' : ''}`}
                    onClick={toggleAccordion}
                >
                    <h2>{titulo}</h2>
                    <div className="accordion-action">
                        <span className="accordion-text">{isOpen ? 'Ocultar Menú' : 'Mostrar Menú'}</span>
                        <span className="accordion-icon">{isOpen ? '▼' : '▶'}</span>
                    </div>
                </button>

                {isOpen && (
                    <div className="accordion-content">
                        {categorias.map((categoria) => (
                            <div key={categoria} className="categoria-section">
                                <h3 className="categoria-titulo">
                                    {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                                </h3>
                                <div className="platos-list">
                                    {menuExtras[categoria].map((plato) => {
                                        const disponible = plato.disponible?.toLowerCase() === 'si';

                                        return (
                                            <div 
                                                key={plato.id} 
                                                className={`plato-extra-item ${!disponible ? 'agotado' : ''}`}
                                            >
                                                {plato.foto_url && (
                                                    <div className="plato-imagen-container">
                                                        <img 
                                                            src={plato.foto_url} 
                                                            alt={plato.nombre}
                                                            className="plato-imagen"
                                                        />
                                                        {!disponible && (
                                                            <div className="overlay-agotado">
                                                                <span>AGOTADO</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="plato-extra-info">
                                                    <h4>{plato.nombre}</h4>
                                                    <p className="plato-precio">Bs. {parseFloat(plato.precio).toFixed(2)}</p>
                                                </div>

                                                <button
                                                    className="add-plato-btn"
                                                    onClick={() => handleOpenModal(plato)}
                                                    disabled={!disponible}
                                                >
                                                    {disponible ? '+ Añadir' : 'AGOTADO'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {platoSeleccionado && (
                <PlatoModal
                    plato={platoSeleccionado}
                    guarniciones={guarniciones}
                    onClose={handleCloseModal}
                    onAddToCart={onAddToCart}
                />
            )}
        </>
    );
});

PlatosExtras.displayName = 'PlatosExtras';

export default PlatosExtras;