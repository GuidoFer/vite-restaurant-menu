// src/components/OrderSummary.jsx - VERSIÓN PRODUCCIÓN
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

    const totalPrecio = carrito.reduce((sum, item) => sum + (item.precio * (item.cantidad || 1)), 0);
    const totalItems = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0);

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
            const subtotal = cantidad * item.precio;

            mensaje += `✅ *${cantidad}x ${item.nombre}*\n`;
            if (item.sopa) mensaje += `   • Sopa: ${item.sopa}\n`;
            if (item.segundo) mensaje += `   • Segundo: ${item.segundo}\n`;
            if (item.presa) mensaje += `   • Presa: ${item.presa}\n`;
            if (item.guarnicion) mensaje += `   • Guarnición: ${item.guarnicion}\n`;
            if (item.detalles) mensaje += `   💬 Notas: ${item.detalles}\n`;
            mensaje += `   _Subtotal: Bs. ${subtotal.toFixed(2)}_\n\n`;
        });

        if (formData.notasAdicionales) {
            mensaje += `*📌 NOTAS GENERALES:*\n${formData.notasAdicionales}\n\n`;
        }

        mensaje += `--------------------------\n`;
        mensaje += `*💰 TOTAL A PAGAR: Bs. ${totalPrecio.toFixed(2)}*\n`;
        mensaje += `*⏱️ Tiempo estimado:* ${tiempoTexto} aprox.\n`;
        mensaje += `--------------------------\n`;
        mensaje += `_Envíe este mensaje sin modificar nada._\n`;
        mensaje += `_Adjunte su pago QR y le preparamos su pedido._`;

        return encodeURIComponent(mensaje);
    };

    const handlePagoCompletado = async () => {
        if (guardandoPedido) return;

        if (!restaurante.sheet_id) {
            alert('Error: No se encontró configuración de destino para el restaurante.');
            return;
        }

        setGuardandoPedido(true);

        try {
            const codigoGenerado = `ORD-${new Date().getTime()}`;
            const hashGenerado = Math.floor(100000 + Math.random() * 900000).toString();

            const pedidoData = {
                action: 'guardarPedido',
                sheetId: restaurante.sheet_id,
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
                        sopa: item.sopa || null,
                        segundo: item.segundo || null,
                        presa: item.presa || null,
                        guarnicion: item.guarnicion || null,
                        detalles: item.detalles || null,
                        subtotal: (item.precio * (item.cantidad || 1))
                    })),
                    total: totalPrecio,
                    notas: formData.notasAdicionales
                }
            };

            const respuesta = await guardarPedido(pedidoData.sheetId, pedidoData);
            const linkWhatsApp = `https://wa.me/591${restaurante.telefono}?text=${generarMensajeWhatsApp(respuesta)}`;
            window.open(linkWhatsApp, '_blank');
            
            setCarrito([]);
            onClose();

        } catch (error) {
            console.error('Error al guardar pedido:', error);
            alert('Error al conectar con el servidor. Intente nuevamente.');
            setGuardandoPedido(false);
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
                                        <div className="item-order-details">
                                            {item.sopa && <p>🥣 Sopa: {item.sopa}</p>}
                                            {item.segundo && <p>🍛 Segundo: {item.segundo}</p>}
                                            {item.presa && <p>🍗 Presa: {item.presa}</p>}
                                            {item.guarnicion && <p>🍚 Guarnición: {item.guarnicion}</p>}
                                            {item.detalles && <p className="item-obs">📝 {item.detalles}</p>}
                                        </div>
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
                            <div className="form-group">
                                <label>Notas para el restaurante (opcional)</label>
                                <textarea name="notasAdicionales" value={formData.notasAdicionales} onChange={handleInputChange} placeholder="Ejm. Bien cocido la carne, mas llajua, sin sopa" rows="2"></textarea>
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
                            qrUrl={restaurante.qr_url}
                            restaurante={restaurante}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default OrderSummary;