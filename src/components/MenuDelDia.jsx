// src/components/MenuDelDia.jsx
import React, { useState } from 'react';
import './css/MenuDelDia.css';

const MenuDelDia = ({ menu, presas, guarniciones, onAddToOrder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tipoOrden, setTipoOrden] = useState('completo');
    const [segundoSeleccionado, setSegundoSeleccionado] = useState('');
    const [guarnicionSeleccionada, setGuarnicionSeleccionada] = useState('');

    const toggleAccordion = () => setIsOpen(!isOpen);

    // Obtener SOLO 2 segundos disponibles (segundo_1 y segundo_2)
    const segundosDisponibles = [
        { nombre: menu.segundo_1?.nombre, foto: menu.segundo_1?.foto_url },
        { nombre: menu.segundo_2?.nombre, foto: menu.segundo_2?.foto_url }
    ].filter(s => s.nombre); // Solo incluir los que tienen nombre

    // Convertir guarniciones a array de strings si vienen como objetos
    const guarnicionesDisponibles = guarniciones.map(g => 
        typeof g === 'string' ? g : g.nombre
    ).filter(Boolean);

    const getPrecio = () => {
        if (tipoOrden === 'completo') return menu.precios?.completo || 15;
        if (tipoOrden === 'sopa') return menu.precios?.sopa_suelta || 7;
        if (tipoOrden === 'segundo') return menu.precios?.segundo_suelto || 12;
        return 0;
    };

    const handleAddToOrder = () => {
        let nombre = '';
        let detalles = '';

        if (tipoOrden === 'completo') {
            nombre = 'Almuerzo Completo';
            detalles = `Sopa: ${menu.sopa?.nombre || 'Sopa del día'}, Segundo: ${segundoSeleccionado}, Guarnición: ${guarnicionSeleccionada}`;
        } else if (tipoOrden === 'sopa') {
            nombre = 'Sopa Suelta';
            detalles = menu.sopa?.nombre || 'Sopa del día';
        } else if (tipoOrden === 'segundo') {
            nombre = 'Segundo Suelto';
            detalles = `${segundoSeleccionado}, Guarnición: ${guarnicionSeleccionada}`;
        }

        onAddToOrder({
            id: `menu-${Date.now()}`,
            nombre,
            precio: getPrecio(),
            type: 'menu',
            detalles
        });

        // Limpiar selecciones después de añadir
        setSegundoSeleccionado('');
        setGuarnicionSeleccionada('');
    };

    const isDisabled = () => {
        if (tipoOrden === 'sopa') return false;
        return !segundoSeleccionado || !guarnicionSeleccionada;
    };

    return (
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

                    {/* SELECCIÓN DE TIPO DE ORDEN */}
                    <div className="tipo-orden-selector">
                        <h4>Selecciona tu orden:</h4>
                        <div className="tipo-buttons">
                            <button 
                                className={tipoOrden === 'completo' ? 'selected' : ''}
                                onClick={() => setTipoOrden('completo')}
                            >
                                Almuerzo Completo - Bs. {menu.precios?.completo || 15}
                            </button>
                            <button 
                                className={tipoOrden === 'sopa' ? 'selected' : ''}
                                onClick={() => setTipoOrden('sopa')}
                            >
                                Solo Sopa Suelta - Bs. {menu.precios?.sopa_suelta || 7}
                            </button>
                            <button 
                                className={tipoOrden === 'segundo' ? 'selected' : ''}
                                onClick={() => setTipoOrden('segundo')}
                            >
                                Solo Segundo Suelto - Bs. {menu.precios?.segundo_suelto || 12}
                            </button>
                        </div>
                    </div>

                    {/* SELECCIÓN DE SEGUNDO */}
                    {tipoOrden !== 'sopa' && segundosDisponibles.length > 0 && (
                        <div className="selector-opciones">
                            <h4>Selecciona el Segundo *</h4>
                            <div className="opciones-grid">
                                {segundosDisponibles.map((segundo, i) => (
                                    <button
                                        key={i}
                                        className={segundoSeleccionado === segundo.nombre ? 'selected' : ''}
                                        onClick={() => setSegundoSeleccionado(segundo.nombre)}
                                    >
                                        {segundo.nombre}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SELECCIÓN DE GUARNICIÓN */}
                    {tipoOrden !== 'sopa' && guarnicionesDisponibles.length > 0 && (
                        <div className="selector-opciones">
                            <h4>Selecciona la Guarnición *</h4>
                            <div className="opciones-grid">
                                {guarnicionesDisponibles.map((g, i) => (
                                    <button
                                        key={i}
                                        className={guarnicionSeleccionada === g ? 'selected' : ''}
                                        onClick={() => setGuarnicionSeleccionada(g)}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* BOTÓN DE AÑADIR */}
                    <button 
                        className="add-menu-btn"
                        onClick={handleAddToOrder}
                        disabled={isDisabled()}
                    >
                        + Añadir - Bs. {getPrecio().toFixed(2)}
                    </button>
                </div>
            )}
        </div>
    );
};

export default MenuDelDia;