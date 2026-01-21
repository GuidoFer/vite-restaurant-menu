import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import '../components/css/AdminDashboard.css';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx0ioXA9goDvZGp4leY2Ym-B-9dXKNRgsRSTgYpHbO9-vEsiyMr6QZhsE-QIF1o4x_U/exec"; 

const AdminDashboard = () => {
    const { sheetId } = useParams();
    const [pedidos, setPedidos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [cantidadAnterior, setCantidadAnterior] = useState(0);
    const [alarmaActiva, setAlarmaActiva] = useState(false); // Nuevo estado
    const primeraCarga = useRef(true);
    
    // Usamos useRef para el audio para poder pausarlo desde cualquier lugar
    const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2847/2847-preview.mp3'));

    useEffect(() => {
        audioRef.current.loop = true; // Hace que el sonido se repita sin fin
    }, []);

    const detenerAlarma = () => {
        setAlarmaActiva(false);
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    };

    const reproducirAlertaPersistente = () => {
        setAlarmaActiva(true);
        audioRef.current.play().catch(e => console.log("Interacción requerida para el audio"));
    };

    const obtenerPedidos = useCallback(async (mostrarCarga = true) => {
        if (mostrarCarga) setCargando(true);
        try {
            const cacheBuster = new Date().getTime();
            const response = await fetch(`${SCRIPT_URL}?get=pedidos&sheetId=${sheetId}&_=${cacheBuster}`);
            const result = await response.json();
            
            const hoy = new Date().toLocaleDateString('en-CA');

            const dataFiltrada = result.data.slice(1)
                .map(fila => {
                    let horaLimpia = fila[10];
                    if (horaLimpia && horaLimpia.toString().includes('T')) {
                        horaLimpia = horaLimpia.toString().split('T')[1].substring(0, 5);
                    }

                    return {
                        fechaRaw: fila[0],
                        codigo: fila[1],
                        hash: fila[2],
                        cliente: fila[4],
                        celular: fila[5],
                        items: fila[6], 
                        total: parseFloat(fila[7] || 0).toFixed(2),
                        notas: fila[8],
                        estado: fila[9],
                        hora: horaLimpia,
                        nroPedido: fila[11]
                    };
                })
                .filter(pedido => {
                    if (!pedido.fechaRaw) return false;
                    const fechaPedido = new Date(pedido.fechaRaw).toLocaleDateString('en-CA');
                    return fechaPedido === hoy;
                })
                .reverse();

            // Lógica de Alarma: Si hay pedidos nuevos y no es la primera carga
            if (!primeraCarga.current && dataFiltrada.length > cantidadAnterior) {
                reproducirAlertaPersistente();
            }

            setPedidos(dataFiltrada);
            setCantidadAnterior(dataFiltrada.length);
            primeraCarga.current = false;

        } catch (err) { 
            console.error("Error al obtener pedidos:", err); 
        } finally { 
            if (mostrarCarga) setCargando(false); 
        }
    }, [sheetId, cantidadAnterior]);

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
        setPedidos(prev => prev.map(p => p.codigo === codigo ? { ...p, estado: nuevoEstado } : p));

        try {
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ 
                    action: 'actualizarEstado', 
                    sheetId: sheetId, 
                    codigo: codigo, 
                    nuevoEstado: nuevoEstado 
                })
            });
            setTimeout(() => obtenerPedidos(false), 2000);
        } catch (err) { 
            console.error("Error al cambiar estado:", err);
            obtenerPedidos();
        }
    };

    const abrirWhatsApp = (pedido) => {
        const numero = pedido.celular.toString().replace(/\D/g, '');
        const mensaje = `Hola ${pedido.cliente}, confirmamos la recepción de tu pago para la Orden #${pedido.nroPedido || '---'}. ¡Ya lo estamos preparando! 👍`;
        window.open(`https://wa.me/591${numero}?text=${encodeURIComponent(mensaje)}`, '_blank');
    };

    useEffect(() => {
        obtenerPedidos();
        const interval = setInterval(() => obtenerPedidos(false), 15000);
        return () => clearInterval(interval);
    }, [obtenerPedidos]);

    if (cargando) return <div className="admin-centro">Cargando pedidos de cocina...</div>;

    return (
        <div className="admin-container">
            {/* BOTÓN DE PARADA DE EMERGENCIA - Solo aparece si la alarma está activa */}
            {alarmaActiva && (
                <div className="banner-alarma">
                    <button onClick={detenerAlarma} className="btn-detener-alarma">
                        🛑 SILENCIAR ALARMA - NUEVO PEDIDO
                    </button>
                </div>
            )}

            <header className="admin-header">
                <div className="header-info">
                    <h2>PANEL DE PEDIDOS</h2>
                    <span className="badge-fecha">{new Date().toLocaleDateString()}</span>
                </div>
                <button onClick={() => { detenerAlarma(); obtenerPedidos(); }} className="btn-refrescar">
                    🔄 Actualizar
                </button>
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
                                    <span className="admin-precio">Bs. {pedido.total}</span>
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