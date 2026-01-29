// src/components/PlatoModal.jsx
import React, { useState, useEffect } from 'react';
import './css/PlatoModal.css';

const PlatoModal = ({ plato, guarniciones, onClose, onAddToCart }) => {
    const [cantidad, setCantidad] = useState(1);
    const [guarnicionSeleccionada, setGuarnicionSeleccionada] = useState('');
    const [detalles, setDetalles] = useState(''); // ✅ Único añadido: Estado para capturar la nota

    // Manejar botón atrás cuando el modal está abierto
    useEffect(() => {
        if (!plato) return;

        const handleBackButton = (e) => {
            e.preventDefault();
            onClose();
        };

        // Agregar entrada al historial cuando se abre el modal
        window.history.pushState({ modal: 'plato' }, '');
        window.addEventListener('popstate', handleBackButton);

        return () => {
            window.removeEventListener('popstate', handleBackButton);
        };
    }, [plato, onClose]);

    if (!plato) return null;

    const necesitaGuarnicion = plato.necesita_guarnicion?.toLowerCase() === 'si';
    const precio = parseFloat(plato.precio);
    const total = precio * cantidad;

    // FILTRAR GUARNICIONES DISPONIBLES CON VALIDACIÓN DE MIXTO (Tu lógica original intacta)
    const filtrarGuarniciones = (guarniciones) => {
        if (!guarniciones || guarniciones.length === 0) return [];

        // Convertir a array de objetos normalizados
        const guarnicionesArray = guarniciones.map(g => {
            if (typeof g === 'string') {
                return { nombre: g, disponible: true };
            }
            
            // Normalizar disponible: puede ser boolean o string
            let disponible = false;
            if (g.disponible === true || g.disponible === 'SI' || g.disponible === 'si') {
                disponible = true;
            }
            
            return {
                nombre: g.nombre,
                disponible: disponible
            };
        });

        // Verificar si Arroz y Fideo están disponibles (para Mixto)
        const arrozDisponible = guarnicionesArray.some(g => 
            g.nombre === 'Arroz' && g.disponible === true
        );
        const fideoDisponible = guarnicionesArray.some(g => 
            g.nombre === 'Fideo' && g.disponible === true
        );

        // Filtrar guarniciones
        return guarnicionesArray.filter(g => {
            // Solo mostrar si está disponible
            if (!g.disponible) {
                return false;
            }

            // Si es Mixto, validar que Arroz Y Fideo estén disponibles
            if (g.nombre === 'Mixto') {
                return arrozDisponible && fideoDisponible;
            }

            return true;
        }).map(g => g.nombre);
    };

    const guarnicionesDisponibles = filtrarGuarniciones(guarniciones);

    const handleAdd = () => {
        if (necesitaGuarnicion && guarnicionesDisponibles.length === 0) {
            alert('No hay guarniciones disponibles en este momento');
            return;
        }

        if (necesitaGuarnicion && !guarnicionSeleccionada) {
            alert('Por favor selecciona una guarnición');
            return;
        }

        onAddToCart({
            id: `${plato.id}-${Date.now()}`,
            nombre: plato.nombre,
            precio: precio,
            cantidad: cantidad,
            guarnicion: guarnicionSeleccionada || null,
            detalles: detalles, // ✅ Único añadido: Se envía la nota al carrito
            type: 'extra'
        });

        onClose();
    };

    const incrementar = () => setCantidad(prev => prev + 1);
    const decrementar = () => setCantidad(prev => prev > 1 ? prev - 1 : 1);

    return (
        <div className="plato-modal-overlay" onClick={onClose}>
            <div className="plato-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✕</button>
                
                <h2>{plato.nombre}</h2>
                
                {plato.foto_url && (
                    <img src={plato.foto_url} alt={plato.nombre} className="modal-plato-imagen" />
                )}
                
                <p className="modal-precio">Bs. {precio.toFixed(2)}</p>
                
                {necesitaGuarnicion && (
                    <div className="modal-guarniciones">
                        <h4>Selecciona Guarnición:</h4>
                        {guarnicionesDisponibles.length > 0 ? (
                            <div className="guarniciones-radio">
                                {guarnicionesDisponibles.map((nombre, i) => (
                                    <label key={i} className="radio-label">
                                        <input
                                            type="radio"
                                            name="guarnicion"
                                            value={nombre}
                                            checked={guarnicionSeleccionada === nombre}
                                            onChange={(e) => setGuarnicionSeleccionada(e.target.value)}
                                        />
                                        <span>{nombre}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <p className="no-guarniciones-warning">
                                ⚠️ No hay guarniciones disponibles en este momento
                            </p>
                        )}
                    </div>
                )}
                
                <div className="modal-cantidad">
                    <h4>Cantidad:</h4>
                    <div className="cantidad-controls">
                        <button onClick={decrementar}>-</button>
                        <span>{cantidad}</span>
                        <button onClick={incrementar}>+</button>
                    </div>
                </div>

                {/* ✅ NUEVO BLOQUE: Input de texto para la Presa de Pollo */}
                <div className="modal-notas" style={{ marginTop: '15px', textAlign: 'left' }}>
                    <h4 style={{ marginBottom: '5px', fontSize: '1rem' }}>Instrucciones especiales:</h4>
                    <textarea
                        value={detalles}
                        onChange={(e) => setDetalles(e.target.value)}
                        placeholder="Ej: Presa: Pecho, sin ensalada..."
                        style={{
                            width: '100%',
                            borderRadius: '8px',
                            padding: '10px',
                            border: '1px solid #ddd',
                            fontSize: '0.9rem',
                            minHeight: '60px',
                            outline: 'none',
                            fontFamily: 'inherit',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>
                
                <button 
                    className="modal-add-button" 
                    onClick={handleAdd}
                    disabled={necesitaGuarnicion && guarnicionesDisponibles.length === 0}
                    style={{ marginTop: '20px' }}
                >
                    Agregar al Carrito - Bs. {total.toFixed(2)}
                </button>
            </div>
        </div>
    );
};

export default PlatoModal;