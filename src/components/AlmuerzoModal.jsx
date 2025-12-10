// src/components/AlmuerzoModal.jsx
import React, { useState, useEffect } from 'react';
import './css/AlmuerzoModal.css';

const AlmuerzoModal = ({ isOpen, onClose, tipo, menu, guarniciones, onAddToOrder }) => {
    const [segundoSeleccionado, setSegundoSeleccionado] = useState('');
    const [guarnicionSeleccionada, setGuarnicionSeleccionada] = useState('');
    const [cantidad, setCantidad] = useState(1);

    // Manejar botón atrás cuando el modal está abierto
    useEffect(() => {
        if (!isOpen) return;

        const handleBackButton = (e) => {
            e.preventDefault();
            handleClose();
        };

        // Agregar entrada al historial cuando se abre el modal
        window.history.pushState({ modal: 'almuerzo' }, '');
        window.addEventListener('popstate', handleBackButton);

        return () => {
            window.removeEventListener('popstate', handleBackButton);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Obtener los 2 segundos disponibles
    const segundosDisponibles = [
        { nombre: menu.segundo_1?.nombre, foto: menu.segundo_1?.foto_url },
        { nombre: menu.segundo_2?.nombre, foto: menu.segundo_2?.foto_url }
    ].filter(s => s.nombre);

    // Convertir guarniciones a array de strings
    const guarnicionesDisponibles = guarniciones.map(g => 
        typeof g === 'string' ? g : g.nombre
    ).filter(Boolean);

    // Obtener precio según tipo
    const precioUnitario = tipo === 'completo' 
        ? (menu.precios?.completo || 15)
        : (menu.precios?.segundo_suelto || 12);

    const precioTotal = precioUnitario * cantidad;

    const incrementar = () => {
        if (cantidad < 10) setCantidad(prev => prev + 1);
    };

    const decrementar = () => {
        if (cantidad > 1) setCantidad(prev => prev - 1);
    };

    const handleAgregar = () => {
        if (!segundoSeleccionado) {
            alert('Por favor selecciona un segundo');
            return;
        }
        if (!guarnicionSeleccionada) {
            alert('Por favor selecciona una guarnición');
            return;
        }

        let nombre = '';
        let detalles = '';

        if (tipo === 'completo') {
            nombre = 'Almuerzo Completo';
            detalles = `Sopa: ${menu.sopa?.nombre || 'Sopa del día'}, Segundo: ${segundoSeleccionado}, Guarnición: ${guarnicionSeleccionada}`;
            if (menu.postre?.nombre) {
                detalles += `, Postre: ${menu.postre.nombre}`;
            }
        } else {
            nombre = 'Segundo Suelto';
            detalles = `${segundoSeleccionado}, Guarnición: ${guarnicionSeleccionada}`;
        }

        onAddToOrder({
            id: `menu-${Date.now()}`,
            nombre,
            precio: precioUnitario,
            cantidad: cantidad,
            type: 'menu',
            detalles
        });

        // Cerrar modal y resetear
        handleClose();
    };

    const handleClose = () => {
        setSegundoSeleccionado('');
        setGuarnicionSeleccionada('');
        setCantidad(1);
        onClose();
    };

    return (
        <div className="almuerzo-modal-overlay" onClick={handleClose}>
            <div className="almuerzo-modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Botón cerrar */}
                <button className="almuerzo-modal-close" onClick={handleClose}>
                    ✕
                </button>

                {/* Título */}
                <h2 className="almuerzo-modal-title">
                    {tipo === 'completo' ? '🍽️ Almuerzo Completo' : '🍖 Segundo Suelto'}
                </h2>

                {/* Sopa (solo para completo) */}
                {tipo === 'completo' && (
                    <div className="almuerzo-modal-sopa-info">
                        ✓ Sopa: <strong>{menu.sopa?.nombre || 'Sopa del día'}</strong>
                    </div>
                )}

                {/* Postre (solo para completo) */}
                {tipo === 'completo' && menu.postre?.nombre && (
                    <div className="almuerzo-modal-postre-info">
                        ℹ️ Incluye postre: <strong>{menu.postre.nombre}</strong>
                    </div>
                )}

                {/* Selección de Segundo */}
                <div className="almuerzo-modal-section">
                    <h3>Elige tu Segundo *</h3>
                    <div className="almuerzo-segundos-grid">
                        {segundosDisponibles.map((segundo, i) => (
                            <div
                                key={i}
                                className={`almuerzo-segundo-card ${
                                    segundoSeleccionado === segundo.nombre ? 'selected' : ''
                                }`}
                                onClick={() => setSegundoSeleccionado(segundo.nombre)}
                            >
                                <img 
                                    src={segundo.foto || 'https://via.placeholder.com/200x150'} 
                                    alt={segundo.nombre}
                                    className="almuerzo-segundo-imagen"
                                />
                                <div className="almuerzo-segundo-nombre">
                                    {segundo.nombre}
                                </div>
                                {segundoSeleccionado === segundo.nombre && (
                                    <div className="almuerzo-check-icon">✓</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Selección de Guarnición */}
                <div className="almuerzo-modal-section">
                    <h3>Elige Guarnición *</h3>
                    <div className="almuerzo-guarniciones-grid">
                        {guarnicionesDisponibles.map((g, i) => (
                            <button
                                key={i}
                                className={`almuerzo-guarnicion-btn ${
                                    guarnicionSeleccionada === g ? 'selected' : ''
                                }`}
                                onClick={() => setGuarnicionSeleccionada(g)}
                            >
                                {g}
                                {guarnicionSeleccionada === g && ' ✓'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Selector de Cantidad */}
                <div className="almuerzo-modal-section">
                    <h3>Cantidad</h3>
                    <div className="almuerzo-cantidad-controls">
                        <button 
                            className="almuerzo-cantidad-btn"
                            onClick={decrementar}
                            disabled={cantidad <= 1}
                        >
                            −
                        </button>
                        <span className="almuerzo-cantidad-value">{cantidad}</span>
                        <button 
                            className="almuerzo-cantidad-btn"
                            onClick={incrementar}
                            disabled={cantidad >= 10}
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Botón Añadir */}
                <button 
                    className="almuerzo-add-btn"
                    onClick={handleAgregar}
                >
                    Añadir al Carrito - Bs. {precioTotal.toFixed(2)}
                </button>
            </div>
        </div>
    );
};

export default AlmuerzoModal;