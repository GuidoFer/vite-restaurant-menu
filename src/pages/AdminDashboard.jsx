import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import '../components/css/AdminDashboard.css';

// Asegúrate de usar el link del ÚLTIMO deploy que hiciste con el script integrado
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx0ioXA9goDvZGp4leY2Ym-B-9dXKNRgsRSTgYpHbO9-vEsiyMr6QZhsE-QIF1o4x_U/exec"; 

const AdminDashboard = () => {
    const { sheetId } = useParams();
    const [pedidos, setPedidos] = useState([]);
    const [cargando, setCargando] = useState(true);

    const obtenerPedidos = useCallback(async (mostrarCarga = true) => {
        if (mostrarCarga) setCargando(true);
        try {
            // Añadimos un timestamp para saltar el caché de Google
            const cacheBuster = new Date().getTime();
            const response = await fetch(`${SCRIPT_URL}?get=pedidos&sheetId=${sheetId}&_=${cacheBuster}`);
            const result = await response.json();
            
            // Obtenemos la fecha de hoy en formato local para comparar (Bolivia)
            const hoy = new Date().toLocaleDateString('en-CA');

            const dataFiltrada = result.data.slice(1)
                .map(fila => ({
                    fechaRaw: fila[0],
                    codigo: fila[1],
                    hash: fila[2],
                    cliente: fila[4],
                    celular: fila[5],
                    items: fila[6], 
                    total: fila[7],
                    notas: fila[8],
                    estado: fila[9],
                    hora: fila[10],
                    nroPedido: fila[11] // Columna L
                }))
                .filter(pedido => {
                    // Solo pedidos de hoy para no saturar la cocina
                    const fechaPedido = new Date(pedido.fechaRaw).toLocaleDateString('en-CA');
                    return fechaPedido === hoy;
                })
                .reverse(); // El más nuevo arriba

            setPedidos(dataFiltrada);
        } catch (err) { 
            console.error("Error al obtener pedidos:", err); 
        } finally { 
            if (mostrarCarga) setCargando(false); 
        }
    }, [sheetId]);

    const renderItems = (itemsRaw) => {
        try {
            const parsed = JSON.parse(itemsRaw);
            return parsed.map((item, index) => {
                const cant = parseInt(item.cantidad || 1);
                const precioUnit = parseFloat(item.precio || 0);
                const subtotal = item.subtotal || (cant * precioUnit);

                return (
                    <div key={index} className="item-linea-contenedor">
                        <div className="item-linea">
                            <span><strong className="item-cant">{cant}x</strong> {item.nombre}</span>
                            <span className="item-precio">Bs. {parseFloat(subtotal).toFixed(2)}</span>
                        </div>
                        {/* DETALLES CRÍTICOS PARA LA COCINA */}
                        {(item.detalles || item.guarnicion) && (
                            <div className="item-detalles-cocina">
                                {item.detalles && <div>📋 {item.detalles}</div>}
                                {item.guarnicion && <div>🍚 Guarnición: {item.guarnicion}</div>}
                            </div>
                        )}
                    </div>
                );
            });
        } catch (e) { 
            return <div className="error-json">Error al leer productos</div>; 
        }
    };

    const cambiarEstado = async (codigo, estadoActual) => {
        const nuevoEstado = estadoActual === 'PENDIENTE' ? 'ENTREGADO' : 'PENDIENTE';
        
        // Actualización optimista en la interfaz para que sea instantáneo
        setPedidos(prev => prev.map(p => p.codigo === codigo ? { ...p, estado: nuevoEstado } : p));

        try {
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Google Apps Script requiere no-cors o redirección
                body: JSON.stringify({ 
                    action: 'actualizarEstado', 
                    sheetId: sheetId, 
                    codigo: codigo, 
                    nuevoEstado: nuevoEstado 
                })
            });
            // Refrescar silenciosamente después de un momento
            setTimeout(() => obtenerPedidos(false), 2000);
        } catch (err) { 
            console.error("Error al cambiar estado:", err);
            obtenerPedidos(); // Si falla, revertir a los datos del server
        }
    };

    const abrirWhatsApp = (pedido) => {
        const numero = pedido.celular.toString().replace(/\D/g, '');
        const mensaje = `Hola ${pedido.cliente}, confirmamos la recepción de tu pago para la Orden #${pedido.nroPedido || '---'}. ¡Ya lo estamos preparando! 👍`;
        window.open(`https://wa.me/591${numero}?text=${encodeURIComponent(mensaje)}`, '_blank');
    };

    useEffect(() => {
        obtenerPedidos();
        const interval = setInterval(() => obtenerPedidos(false), 30000); // Auto-refresco cada 30 seg
        return () => clearInterval(interval);
    }, [obtenerPedidos]);

    if (cargando) return <div className="admin-centro">Cargando pedidos de cocina...</div>;

    return (
        <div className="admin-container">
            <header className="admin-header">
                <div className="header-info">
                    <h2>PANEL DE PEDIDOS</h2>
                    <span className="badge-fecha">{new Date().toLocaleDateString()}</span>
                </div>
                <button onClick={() => obtenerPedidos()} className="btn-refrescar">🔄 Actualizar</button>
            </header>

            <div className="admin-lista">
                {pedidos.length === 0 ? (
                    <div className="admin-centro-vacio">
                        <p>No hay pedidos registrados para hoy todavía.</p>
                    </div>
                ) : (
                    pedidos.map((pedido) => (
                        <div key={pedido.codigo} className={`admin-card ${pedido.estado}`}>
                            <div className="card-top-admin">
                                <span className="admin-id-corto">ORDEN: #{pedido.nroPedido || '---'}</span>
                                <span className="admin-hash-badge">HASH: {pedido.hash}</span>
                            </div>

                            <div className="card-body">
                                <div className="admin-fila-espaciada">
                                    <div className="admin-cliente">{pedido.cliente}</div>
                                    <div className="admin-hora">{pedido.hora}</div>
                                </div>
                                
                                <div className="pedido-detalle">
                                    {renderItems(pedido.items)}
                                    {pedido.notas && (
                                        <div className="admin-notas-global">
                                            <strong>Nota del cliente:</strong> {pedido.notas}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="card-footer-admin">
                                <div className="admin-total-container">
                                    <span className="label-total">TOTAL:</span>
                                    <span className="admin-precio">Bs. {parseFloat(pedido.total).toFixed(2)}</span>
                                </div>
                                <div className="admin-acciones-grid">
                                    <button onClick={() => abrirWhatsApp(pedido)} className="btn-whatsapp">
                                        Pago OK 👍
                                    </button>
                                    <button 
                                        onClick={() => cambiarEstado(pedido.codigo, pedido.estado)} 
                                        className={`btn-estado-v2 ${pedido.estado}`}
                                    >
                                        {pedido.estado === 'PENDIENTE' ? 'Despachar' : '✓ Entregado'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;