// src/components/MenuDelDia.jsx
import React, { useState, forwardRef, useImperativeHandle } from 'react';
import AlmuerzoModal from './AlmuerzoModal';
import './css/MenuDelDia.css';

const MenuDelDia = forwardRef(({ menu, presas, guarniciones, onAddToOrder }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, tipo: null });

    // Exponer funciones al componente padre mediante ref
    useImperativeHandle(ref, () => ({
        isOpen: isOpen,
        closeAccordion: () => setIsOpen(false),
        openAccordion: () => setIsOpen(true)
    }));

    const toggleAccordion = () => setIsOpen(!isOpen);

    // Obtener SOLO 2 segundos disponibles (segundo_1 y segundo_2)
    const segundosDisponibles = [
        { nombre: menu.segundo_1?.nombre, foto: menu.segundo_1?.foto_url },
        { nombre: menu.segundo_2?.nombre, foto: menu.segundo_2?.foto_url }
    ].filter(s => s.nombre);

    const handleSopaSuelta = () => {
        onAddToOrder({
            id: `menu-sopa-${Date.now()}`,
            nombre: 'Sopa Suelta',
            precio: menu.precios?.sopa_suelta || 7,
            cantidad: 1,
            type: 'menu',
            detalles: menu.sopa?.nombre || 'Sopa del día'
        });
    };

    const handleOpenModal = (tipo) => {
        setModalConfig({ isOpen: true, tipo });
    };

    const handleCloseModal = () => {
        setModalConfig({ isOpen: false, tipo: null });
    };

    return (
        <>
            <div className="menu-del-dia-container">
                <button 
                    className={`accordion-header ${isOpen ? 'active' : ''}`}
                    onClick={toggleAccordion}
                >
                    <h2>🍽️ Menú del Almuerzo</h2>
                    <div className="accordion-action">
                        <span className="accordion-text">{isOpen ? 'Ocultar Menú' : 'Mostrar Menú'}</span>
                        <span className="accordion-icon">{isOpen ? '▼' : '▶'}</span>
                    </div>
                </button>

                {isOpen && (
                    <div className="accordion-content">
                        {/* SECCIÓN DE FOTOS */}
                        <div className="menu-visual">
                            {/* SOPA */}
                            <div className="plato-card">
                                <img 
                                    src={menu.sopa?.foto_url || 'https://via.placeholder.com/300x200'} 
                                    alt={menu.sopa?.nombre || 'Sopa'} 
                                    className="plato-imagen"
                                />
                                <div className="plato-nombre">{menu.sopa?.nombre || 'Sopa del día'}</div>
                            </div>

                            {/* SEGUNDOS (SOLO 2) */}
                            {segundosDisponibles.map((segundo, i) => (
                                <div key={i} className="plato-card">
                                    <img 
                                        src={segundo.foto || 'https://via.placeholder.com/300x200'} 
                                        alt={segundo.nombre} 
                                        className="plato-imagen"
                                    />
                                    <div className="plato-nombre">{segundo.nombre}</div>
                                </div>
                            ))}
                        </div>

                        {/* Postre (solo texto) */}
                        {menu.postre?.nombre && (
                            <div className="postre-info">
                                🍰 Postre incluido: {menu.postre.nombre}
                            </div>
                        )}

                        {/* BOTONES DE TIPO DE ORDEN */}
                        <div className="tipo-orden-selector">
                            <h4>Selecciona tu orden:</h4>
                            <div className="tipo-buttons">
                                <button 
                                    className="tipo-btn-card"
                                    onClick={() => handleOpenModal('completo')}
                                >
                                    <div className="tipo-btn-emoji">🍽️</div>
                                    <div className="tipo-btn-title">Almuerzo Completo</div>
                                    <div className="tipo-btn-price">Bs. {menu.precios?.completo || 15}</div>
                                    <div className="tipo-btn-desc">Sopa + Segundo + Postre</div>
                                </button>

                                <button 
                                    className="tipo-btn-card"
                                    onClick={handleSopaSuelta}
                                >
                                    <div className="tipo-btn-emoji">🍲</div>
                                    <div className="tipo-btn-title">Solo Sopa Suelta</div>
                                    <div className="tipo-btn-price">Bs. {menu.precios?.sopa_suelta || 7}</div>
                                    <div className="tipo-btn-desc">{menu.sopa?.nombre || 'Sopa del día'}</div>
                                </button>

                                <button 
                                    className="tipo-btn-card"
                                    onClick={() => handleOpenModal('segundo')}
                                >
                                    <div className="tipo-btn-emoji">🍖</div>
                                    <div className="tipo-btn-title">Solo Segundo Suelto</div>
                                    <div className="tipo-btn-price">Bs. {menu.precios?.segundo_suelto || 12}</div>
                                    <div className="tipo-btn-desc">Segundo + Guarnición</div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL REUTILIZABLE */}
            <AlmuerzoModal
                isOpen={modalConfig.isOpen}
                onClose={handleCloseModal}
                tipo={modalConfig.tipo}
                menu={menu}
                guarniciones={guarniciones}
                onAddToOrder={onAddToOrder}
            />
        </>
    );
});

MenuDelDia.displayName = 'MenuDelDia';

export default MenuDelDia;