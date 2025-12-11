// src/components/OrderSummary.jsx
import React, { useState, useEffect } from 'react';
import PaymentModal from './PaymentModal';
import './css/OrderSummary.css';

const OrderSummary = ({ carrito, setCarrito, onClose, restaurante }) => {
    const [mostrarFormulario, setMostrarFormulario] = useState(true);
    const [mostrarPago, setMostrarPago] = useState(false);
    
    const [formData, setFormData] = useState({
        nombre: '',
        celular: '',
        notasAdicionales: ''
    });

    // Manejar botón atrás cuando el modal está abierto
    useEffect(() => {
        const handleBackButton = (e) => {
            e.preventDefault();
            
            // Si está en la pantalla de pago, volver al formulario
            if (mostrarPago) {
                setMostrarPago(false);
                setMostrarFormulario(true);
            } else {
                // Si está en el formulario, cerrar el modal
                onClose();
            }
        };

        // Agregar entrada al historial cuando se abre el modal
        window.history.pushState({ modal: 'orderSummary' }, '');
        window.addEventListener('popstate', handleBackButton);

        return () => {
            window.removeEventListener('popstate', handleBackButton);
        };
    }, [mostrarPago, onClose]);

    // Calcular totales
    const totalItems = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0);
    const totalPrecio = carrito.reduce((sum, item) => sum + (item.precio * (item.cantidad || 1)), 0);

    // Tiempo estimado: 15 min por cada 2 platos
    const tiempoEstimado = Math.ceil(totalItems / 2) * 15;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRemoveItem = (index) => {
        setCarrito(prev => prev.filter((_, i) => i !== index));
    };

    const handleConfirmarPedido = () => {
        // Validar nombre
        if (!formData.nombre.trim()) {
            alert('Por favor ingresa tu nombre completo');
            return;
        }

        // Validar celular boliviano: debe empezar con 6 o 7 y tener 8 dígitos
        const celularRegex = /^[67]\d{7}$/;
        const celularLimpio = formData.celular.trim();

        if (!celularLimpio) {
            alert('Por favor ingresa tu número de celular');
            return;
        }

        if (!celularRegex.test(celularLimpio)) {
            alert('Número de celular inválido. Debe ser un número boliviano de 8 dígitos que empiece con 6 o 7.\nEjemplo: 70123456 o 60123456');
            return;
        }

        setMostrarFormulario(false);
        setMostrarPago(true);
    };

    // Generar número de pedido único: YYYYMMDD-HHMM-XXX
    const generarNumeroPedido = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const random = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
        
        return `${year}${month}${day}-${hours}${minutes}-${random}`;
    };

    const generarMensajeWhatsApp = () => {
        const numeroPedido = generarNumeroPedido();
        
        let mensaje = `*🍽️ NUEVO PEDIDO - ${restaurante.nombre}*\n\n`;
        mensaje += `*📋 Nº Pedido:* ${numeroPedido}\n`;
        mensaje += `*👤 Cliente:* ${formData.nombre}\n`;
        mensaje += `*📱 Celular:* ${formData.celular}\n\n`;
        mensaje += `*PEDIDO:*\n`;
        
        carrito.forEach((item, i) => {
            mensaje += `${i + 1}. ${item.nombre} x${item.cantidad || 1}\n`;
            if (item.guarnicion) {
                mensaje += `   🍚 Guarnición: ${item.guarnicion}\n`;
            }
            if (item.detalles) {
                mensaje += `   ${item.detalles}\n`;
            }
            mensaje += `   Bs. ${(item.precio * (item.cantidad || 1)).toFixed(2)}\n\n`;
        });

        if (formData.notasAdicionales) {
            mensaje += `*📝 Notas:* ${formData.notasAdicionales}\n\n`;
        }

        mensaje += `*💰 TOTAL: Bs. ${totalPrecio.toFixed(2)}*\n`;
        mensaje += `*⏱️ Tiempo estimado: ${tiempoEstimado} minutos*`;

        return encodeURIComponent(mensaje);
    };

    const handlePagoCompletado = () => {
        const whatsappLink = `https://wa.me/591${restaurante.telefono}?text=${generarMensajeWhatsApp()}`;
        window.open(whatsappLink, '_blank');
        
        // Limpiar carrito y cerrar
        setCarrito([]);
        onClose();
    };

    if (carrito.length === 0) {
        return (
            <div className="order-summary-overlay" onClick={onClose}>
                <div className="order-summary-modal" onClick={(e) => e.stopPropagation()}>
                    <button className="modal-close-text" onClick={onClose}>
                        ← Volver al Menú
                    </button>
                    <div className="empty-cart">
                        <h2>🛒 Carrito Vacío</h2>
                        <p>No has agregado ningún plato todavía</p>
                        <button onClick={onClose} className="btn-continue">
                            Continuar Comprando
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="order-summary-overlay" onClick={onClose}>
            <div className="order-summary-modal large" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-text" onClick={onClose}>
                    ← Volver al Menú
                </button>

                {mostrarFormulario ? (
                    <>
                        <h2>📋 Resumen de tu Pedido</h2>

                        {/* Lista de items */}
                        <div className="cart-items-list">
                            {carrito.map((item, index) => (
                                <div key={index} className="cart-item">
                                    <div className="cart-item-info">
                                        <h4>{item.nombre}</h4>
                                        {item.guarnicion && (
                                            <p className="cart-item-guarnicion">🍚 {item.guarnicion}</p>
                                        )}
                                        {item.detalles && (
                                            <p className="cart-item-detalles">{item.detalles}</p>
                                        )}
                                        <p className="cart-item-precio">Bs. {item.precio.toFixed(2)} c/u</p>
                                    </div>

                                    <div className="cart-item-controls">
                                        <p className="cart-item-cantidad">
                                            Cantidad: {item.cantidad || 1}
                                        </p>
                                        <p className="cart-item-subtotal">
                                            Bs. {(item.precio * (item.cantidad || 1)).toFixed(2)}
                                        </p>
                                        <button 
                                            className="btn-remove-text"
                                            onClick={() => handleRemoveItem(index)}
                                        >
                                            🗑️ Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="cart-total">
                            <span>TOTAL:</span>
                            <span>Bs. {totalPrecio.toFixed(2)}</span>
                        </div>

                        {/* Formulario */}
                        <div className="checkout-form">
                            <h3>📝 Confirmar Pedido</h3>
                            
                            <div className="form-group">
                                <label>Nombre Completo *</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                    placeholder="Ej: Juan Pérez"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Celular *</label>
                                <input
                                    type="tel"
                                    name="celular"
                                    value={formData.celular}
                                    onChange={handleInputChange}
                                    placeholder="Ej: 70123456 (sin 591)"
                                    maxLength="8"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Notas Adicionales (opcional)</label>
                                <textarea
                                    name="notasAdicionales"
                                    value={formData.notasAdicionales}
                                    onChange={handleInputChange}
                                    placeholder="Ej: Bien cocido, sin cebolla, para llevar en 30 min..."
                                    rows="3"
                                />
                            </div>

                            <button 
                                className="btn-confirmar"
                                onClick={handleConfirmarPedido}
                            >
                                Continuar al Pago
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2>💳 Método de Pago</h2>
                        <div className="payment-info">
                            <p className="tiempo-estimado">
                                ⏱️ Tiempo estimado de preparación: <strong>{tiempoEstimado} minutos</strong>
                            </p>
                            <p className="total-a-pagar">
                                Total a pagar: <strong>Bs. {totalPrecio.toFixed(2)}</strong>
                            </p>
                        </div>

                        <PaymentModal 
                            isOpen={mostrarPago}
                            onClose={() => {
                                setMostrarPago(false);
                                setMostrarFormulario(true);
                            }}
                            onPaymentComplete={handlePagoCompletado}
                            googleSheetUrl={null}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default OrderSummary;