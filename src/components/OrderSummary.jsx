// src/components/OrderSummary.jsx
import React, { useState, useEffect } from 'react';
import PaymentModal from './PaymentModal';
import { guardarPedido } from '../services/pedidosService';
import './css/OrderSummary.css';

const OrderSummary = ({ carrito, setCarrito, onClose, restaurante }) => {
    const [mostrarFormulario, setMostrarFormulario] = useState(true);
    const [mostrarPago, setMostrarPago] = useState(false);
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
        return () => window.removeEventListener('popstate', handleBackButton);
    }, [mostrarPago, onClose]);

    // --- CÁLCULOS DE TOTALES Y TIEMPOS ---
    const totalPrecio = carrito.reduce((sum, item) => sum + (item.precio * (item.cantidad || 1)), 0);
    const totalItems = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0);

    // Lógica de rangos según cantidad de productos (p)
    const obtenerTiempoTexto = (p) => {
        if (p <= 2) return "10 min";
        if (p > 2 && p <= 4) return "15 min";
        if (p > 4 && p <= 7) return "25 min";
        if (p > 7 && p <= 10) return "35 min";
        if (p > 10) return "más de 45 min";
        return "30 min";
    };

    const tiempoTexto = obtenerTiempoTexto(totalItems);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRemoveItem = (index) => {
        setCarrito(prev => prev.filter((_, i) => i !== index));
    };

    const handleConfirmarPedido = () => {
        if (!formData.nombre.trim() || !formData.celular.trim()) {
            alert('Por favor completa tus datos');
            return;
        }
        setMostrarFormulario(false);
        setMostrarPago(true);
    };

    // --- GENERADOR DE MENSAJE WHATSAPP ---
    const generarMensajeWhatsApp = (resultado) => {
        const nro = resultado?.nro_pedido || '---';
        const hash = resultado?.hash || '---';
        
        let mensaje = `*💠 NUEVO PEDIDO #${nro}*\n`;
        mensaje += `*💠 HASH:* ${hash}\n`;
        mensaje += `--------------------------\n`;
        mensaje += `*💠 Cliente:* ${formData.nombre}\n`;
        mensaje += `*💠 Celular:* ${formData.celular.trim()}\n\n`;
        
        mensaje += `*📝 DETALLE DEL PEDIDO:*\n`;
        
        carrito.forEach((item) => {
            const cantidad = item.cantidad || 1;
            const precioUnit = item.precio;
            const subtotal = cantidad * precioUnit;

            mensaje += `✅ *${cantidad}x ${item.nombre}*\n`;
            mensaje += `   _Precio: Bs. ${precioUnit.toFixed(2)} c/u_\n`;
            mensaje += `   *Subtotal: Bs. ${subtotal.toFixed(2)}*\n`;

            if (item.guarnicion) mensaje += `   🍚 Guarnición: ${item.guarnicion}\n`;
            if (item.detalles) mensaje += `   💬 Detalle: ${item.detalles}\n`;
            mensaje += `\n`;
        });

        if (formData.notasAdicionales) {
            mensaje += `*📌 NOTAS ADICIONALES:*\n`;
            mensaje += `${formData.notasAdicionales}\n\n`;
        }

        mensaje += `--------------------------\n`;
        mensaje += `*💰 TOTAL A PAGAR: Bs. ${totalPrecio.toFixed(2)}*\n`;
        mensaje += `*⏱️ Tiempo estimado:* ${tiempoTexto} aprox.\n`;
        mensaje += `--------------------------\n`;
        mensaje += `_Envíe este mensaje sin modificar nada._\n`;
        mensaje += `_Adjunte su pago QR y le preparamos su pedido._`;

        return encodeURIComponent(mensaje);
    };

    // --- PROCESO DE GUARDADO Y ENVÍO ---
    const handlePagoCompletado = async () => {
        if (guardandoPedido) return; // Bloqueo de seguridad nivel lógico

        setGuardandoPedido(true);
        try {
            const codigoGenerado = `ORD-${new Date().getTime()}`;
            const hashGenerado = Math.floor(100000 + Math.random() * 900000).toString();

            const pedidoData = {
                action: 'guardarPedido',
                sheetId: restaurante.sheet_id || '1JIiS5ZFvgrLKrsYcag9FclwA30i7HBhxiSdAeEwIghY',
                codigo: codigoGenerado,
                hash: hashGenerado,
                pedido: {
                    restaurante_id: restaurante.id || 1,
                    cliente_nombre: formData.nombre,
                    cliente_celular: formData.celular.trim(),
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

            const respuesta = await guardarPedido(pedidoData.sheetId, pedidoData);
            
            // Abrir WhatsApp con el link generado
            const linkWhatsApp = `https://wa.me/591${restaurante.telefono}?text=${generarMensajeWhatsApp(respuesta)}`;
            window.open(linkWhatsApp, '_blank');
            
            // Limpiar y cerrar
            setCarrito([]);
            onClose();

        } catch (error) {
            console.error('❌ Error crítico:', error);
            alert('Error al conectar con el servidor. Intente nuevamente.');
            setGuardandoPedido(false); // Liberar botón solo si falló el envío
        }
    };

    if (carrito.length === 0) return null;

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
                                        <p className="cart-item-precio">Bs. {item.precio.toFixed(2)} c/u</p>
                                    </div>
                                    <div className="cart-item-controls">
                                        <p className="cart-item-cantidad">Cant: {item.cantidad || 1}</p>
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
                                <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Celular *</label>
                                <input type="tel" name="celular" value={formData.celular} onChange={handleInputChange} maxLength="8" required />
                            </div>
                            <button className="btn-confirmar" onClick={handleConfirmarPedido}>Continuar al Pago</button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2>💳 Método de Pago</h2>
                        <div className="payment-info">
                            <p className="total-a-pagar">Total: <strong>Bs. {totalPrecio.toFixed(2)}</strong></p>
                            <p className="tiempo-estimado-ui">⏱️ Entrega estimada: {tiempoTexto}</p>
                        </div>
                        <PaymentModal 
                            isOpen={mostrarPago} 
                            onClose={() => { if(!guardandoPedido) { setMostrarPago(false); setMostrarFormulario(true); } }} 
                            onPaymentComplete={handlePagoCompletado} 
                            isSubmitting={guardandoPedido}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default OrderSummary;