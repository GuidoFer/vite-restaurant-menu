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
        return () => window.removeEventListener('popstate', handleBackButton);
    }, [mostrarPago, onClose]);

    const totalPrecio = carrito.reduce((sum, item) => sum + (item.precio * (item.cantidad || 1)), 0);
    const totalItems = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0);
    const tiempoEstimado = Math.ceil(totalItems / 2) * 15;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRemoveItem = (index) => {
        setCarrito(prev => prev.filter((_, i) => i !== index));
    };

    // 1. Solo validación y cambio de vista
    const handleConfirmarPedido = () => {
        if (!formData.nombre.trim() || !formData.celular.trim()) {
            alert('Por favor completa tus datos');
            return;
        }
        setMostrarFormulario(false);
        setMostrarPago(true);
    };

    // 2. Generador de mensaje con LOGS
    const generarMensajeWhatsApp = (resultado) => {
        console.log("🔍 Analizando resultado para mensaje:", resultado);
        
        // Intentamos obtener el número de varias formas por si el script lo anida
        const nro = resultado?.nro_pedido || (resultado?.data && resultado.data.nro_pedido) || '---';
        const hash = resultado?.hash || (resultado?.data && resultado.data.hash) || '---';

        console.log(`📌 Nro detectado: ${nro}, Hash detectado: ${hash}`);
        
        let mensaje = `*💠 NUEVO PEDIDO #${nro}*\n`;
        mensaje += `*💠 HASH:* ${hash}\n`;
        mensaje += `--------------------------\n`;
        mensaje += `*💠 Cliente:* ${formData.nombre}\n`;
        mensaje += `*💠 Celular:* ${formData.celular.trim()}\n\n`;
        
        carrito.forEach((item) => {
            mensaje += `*${item.cantidad || 1}x ${item.nombre}*\n`;
            if (item.detalles) mensaje += `  💠 ${item.detalles}\n`;
            if (item.guarnicion) mensaje += `  💠 Guarnición: ${item.guarnicion}\n`;
            mensaje += `\n`;
        });

        if (formData.notasAdicionales) {
            mensaje += `*💠 Notas:* ${formData.notasAdicionales}\n\n`;
        }

        mensaje += `*💠 TOTAL: Bs. ${totalPrecio.toFixed(2)}*\n`;
        mensaje += `*💠 Tiempo:* ${tiempoEstimado} min aprox.\n`;
        mensaje += `--------------------------\n`;
        mensaje += `_Envíe este mensaje sin modificar nada._\n`;
        mensaje += `_Adjunte su pago QR y le confirmaremos su pedido._`;

        return encodeURIComponent(mensaje);
    };

    // 3. Proceso de guardado final al enviar
    const handlePagoCompletado = async () => {
        console.log("🚀 Iniciando guardado de pedido...");
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
            console.log("📡 Respuesta cruda del servidor:", respuesta);

            const textoMsg = generarMensajeWhatsApp(respuesta);
            const whatsappLink = `https://wa.me/591${restaurante.telefono}?text=${textoMsg}`;
            
            window.open(whatsappLink, '_blank');
            setCarrito([]);
            onClose();

        } catch (error) {
            console.error('❌ Error crítico en el proceso:', error);
            alert('Error al conectar con el servidor. El pedido no se guardó.');
        } finally {
            setGuardandoPedido(false);
        }
    };

    // ... (El resto del return se mantiene igual que tu código original)
    if (carrito.length === 0) return null; // Simplificado para brevedad

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
                        <div className="cart-total"><span>TOTAL:</span><span>Bs. {totalPrecio.toFixed(2)}</span></div>
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
                        </div>
                        <PaymentModal 
                            isOpen={mostrarPago} 
                            onClose={() => { setMostrarPago(false); setMostrarFormulario(true); }} 
                            onPaymentComplete={handlePagoCompletado} 
                        />
                        {guardandoPedido && (
                            <div className="procesando-bloque">
                                <p>⏳ Generando Orden #{new Date().getTime().toString().slice(-3)}...</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default OrderSummary;