// src/components/OrderSummary.jsx
import React, { useState, useEffect } from 'react';
import PaymentModal from './PaymentModal';
import { guardarPedido } from '../services/pedidosService';
import './css/OrderSummary.css';

const OrderSummary = ({ carrito, setCarrito, onClose, restaurante }) => {
    const [mostrarFormulario, setMostrarFormulario] = useState(true);
    const [mostrarPago, setMostrarPago] = useState(false);
    const [pedidoGuardado, setPedidoGuardado] = useState(null);
    const [guardandoPedido, setGuardandoPedido] = useState(false);
    
    const [formData, setFormData] = useState({
        nombre: '',
        celular: '',
        notasAdicionales: ''
    });

    useEffect(() => {
        const handleBackButton = (e) => {
            e.preventDefault();
            if (mostrarPago) {
                setMostrarPago(false);
                setMostrarFormulario(true);
            } else {
                onClose();
            }
        };
        window.history.pushState({ modal: 'orderSummary' }, '');
        window.addEventListener('popstate', handleBackButton);
        return () => {
            window.removeEventListener('popstate', handleBackButton);
        };
    }, [mostrarPago, onClose]);

    const totalItems = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0);
    const totalPrecio = carrito.reduce((sum, item) => sum + (item.precio * (item.cantidad || 1)), 0);
    const tiempoEstimado = Math.ceil(totalItems / 2) * 15;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRemoveItem = (index) => {
        setCarrito(prev => prev.filter((_, i) => i !== index));
    };

    const handleConfirmarPedido = async () => {
        if (!formData.nombre.trim()) {
            alert('Por favor ingresa tu nombre completo');
            return;
        }

        const celularRegex = /^[67]\d{7}$/;
        const celularLimpio = formData.celular.trim();

        if (!celularLimpio) {
            alert('Por favor ingresa tu número de celular');
            return;
        }

        if (!celularRegex.test(celularLimpio)) {
            alert('Número de celular inválido. Debe ser un número boliviano de 8 dígitos que empiece con 6 o 7.');
            return;
        }

        setGuardandoPedido(true);
        
        try {
            // REFINAMIENTO 1: El código de orden ahora se genera con el tiempo actual para evitar colisiones
            const codigoGenerado = `ORD-${new Date().getTime()}`;
            const hashGenerado = Math.floor(100000 + Math.random() * 900000).toString();

            const pedidoData = {
                action: 'guardarPedido', // Requerido por el nuevo script
                sheetId: restaurante.sheet_id || '1JIiS5ZFvgrLKrsYcag9FclwA30i7HBhxiSdAeEwIghY',
                codigo: codigoGenerado,
                hash: hashGenerado,
                pedido: {
                    restaurante_id: restaurante.id || 1,
                    cliente_nombre: formData.nombre,
                    cliente_celular: celularLimpio,
                    items: carrito.map(item => ({
                        nombre: item.nombre,
                        precio: item.precio,
                        cantidad: item.cantidad || 1,
                        guarnicion: item.guarnicion || null,
                        detalles: item.detalles || null,
                        subtotal: (item.precio * (item.cantidad || 1))
                    })),
                    total: totalPrecio,
                    notas: formData.notasAdicionales
                }
            };

            const resultado = await guardarPedido(pedidoData.sheetId, pedidoData);
            
            // REFINAMIENTO 2: Guardamos la respuesta que ya incluye el nro_pedido calculado por el script
            setPedidoGuardado(resultado);
            setMostrarFormulario(false);
            setMostrarPago(true);
        } catch (error) {
            console.error('Error guardando pedido:', error);
            alert('Hubo un problema al guardar el pedido.');
        } finally {
            setGuardandoPedido(false);
        }
    };

    const generarMensajeWhatsApp = () => {
        // REFINAMIENTO 3: Mensaje optimizado para el dueño del restaurante
        const nroOrden = pedidoGuardado?.nro_pedido ? `#${pedidoGuardado.nro_pedido}` : 'Pendiente';
        const hash = pedidoGuardado?.hash || '---';
        
        let mensaje = `*✅ NUEVO PEDIDO ${nroOrden}*\n`;
        mensaje += `*🔐 HASH:* ${hash}\n`;
        mensaje += `--------------------------\n`;
        mensaje += `*👤 Cliente:* ${formData.nombre}\n\n`;
        
        carrito.forEach((item, i) => {
            mensaje += `*${item.cantidad || 1}x ${item.nombre}*\n`;
            if (item.detalles) mensaje += `  📋 ${item.detalles}\n`;
            if (item.guarnicion) mensaje += `  🍚 Guarnición: ${item.guarnicion}\n`;
            mensaje += `\n`;
        });

        if (formData.notasAdicionales) {
            mensaje += `*📝 Notas:* ${formData.notasAdicionales}\n\n`;
        }

        mensaje += `*💰 TOTAL: Bs. ${totalPrecio.toFixed(2)}*\n`;
        mensaje += `*⏱️ Tiempo:* ${tiempoEstimado} min aprox.\n`;
        mensaje += `--------------------------\n`;
        mensaje += `_Adjunto comprobante de pago_`;

        return encodeURIComponent(mensaje);
    };

    const handlePagoCompletado = () => {
        const whatsappLink = `https://wa.me/591${restaurante.telefono}?text=${generarMensajeWhatsApp()}`;
        window.open(whatsappLink, '_blank');
        setCarrito([]);
        onClose();
    };

    if (carrito.length === 0) {
        return (
            <div className="order-summary-overlay" onClick={onClose}>
                <div className="order-summary-modal" onClick={(e) => e.stopPropagation()}>
                    <button className="modal-close-text" onClick={onClose}>← Volver al Menú</button>
                    <div className="empty-cart">
                        <h2>🛒 Carrito Vacío</h2>
                        <button onClick={onClose} className="btn-continue">Continuar Comprando</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="order-summary-overlay" onClick={onClose}>
            <div className="order-summary-modal large" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-text" onClick={onClose}>← Volver al Menú</button>

                {mostrarFormulario ? (
                    <>
                        <h2>📋 Resumen de tu Pedido</h2>
                        <div className="cart-items-list">
                            {carrito.map((item, index) => (
                                <div key={index} className="cart-item">
                                    <div className="cart-item-info">
                                        <h4>{item.nombre}</h4>
                                        {item.guarnicion && <p className="cart-item-guarnicion">🍚 {item.guarnicion}</p>}
                                        {item.detalles && <p className="cart-item-detalles">{item.detalles}</p>}
                                        <p className="cart-item-precio">Bs. {item.precio.toFixed(2)} c/u</p>
                                    </div>
                                    <div className="cart-item-controls">
                                        <p className="cart-item-cantidad">Cant: {item.cantidad || 1}</p>
                                        <p className="cart-item-subtotal">Bs. {(item.precio * (item.cantidad || 1)).toFixed(2)}</p>
                                        <button className="btn-remove-text" onClick={() => handleRemoveItem(index)}>🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="cart-total">
                            <span>TOTAL:</span>
                            <span>Bs. {totalPrecio.toFixed(2)}</span>
                        </div>

                        <div className="checkout-form">
                            <h3>📝 Confirmar Datos</h3>
                            <div className="form-group">
                                <label>Nombre Completo *</label>
                                <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder="Juan Pérez" required />
                            </div>
                            <div className="form-group">
                                <label>Celular *</label>
                                <input type="tel" name="celular" value={formData.celular} onChange={handleInputChange} placeholder="70123456" maxLength="8" required />
                            </div>
                            <div className="form-group">
                                <label>Notas Adicionales</label>
                                <textarea name="notasAdicionales" value={formData.notasAdicionales} onChange={handleInputChange} placeholder="Ej: Sin cebolla..." rows="2" />
                            </div>
                            <button className="btn-confirmar" onClick={handleConfirmarPedido} disabled={guardandoPedido}>
                                {guardandoPedido ? 'Procesando...' : 'Continuar al Pago'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2>💳 Método de Pago</h2>
                        <div className="payment-info">
                            <p className="tiempo-estimado">⏱️ Preparación: <strong>{tiempoEstimado} min</strong></p>
                            <p className="total-a-pagar">Total: <strong>Bs. {totalPrecio.toFixed(2)}</strong></p>
                        </div>
                        <PaymentModal 
                            isOpen={mostrarPago} 
                            onClose={() => { setMostrarPago(false); setMostrarFormulario(true); }} 
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