import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getRestaurantBySlug } from '../services/restaurantesService'; 
import '../components/css/AdminDashboard.css';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwn10DGmEntPVk-ojtj4q3WH4cy_BnF7RiCJ0dHvOnZnfeyQtsAe-5fi_yKOyfIMO0/exec"; 

const AdminDashboard = () => {
    const { slug } = useParams(); 
    const [sheetId, setSheetId] = useState(null); 
    const [nombreRestaurante, setNombreRestaurante] = useState("");
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null); 
    
    const [pedidos, setPedidos] = useState([]);
    const [cantidadAnterior, setCantidadAnterior] = useState(0);
    const [alarmaActiva, setAlarmaActiva] = useState(false);
    const primeraCarga = useRef(true);
    
    const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2847/2847-preview.mp3'));

    useEffect(() => {
        const handleBackButton = (e) => {
            e.preventDefault();
            const confirmar = window.confirm("¿Seguro que desea salir del panel de pedidos?");
            if (confirmar) {
                window.removeEventListener('popstate', handleBackButton);
                window.history.back();
            } else {
                window.history.pushState(null, '', window.location.pathname);
            }
        };
        window.history.pushState(null, '', window.location.pathname);
        window.addEventListener('popstate', handleBackButton);
        return () => window.removeEventListener('popstate', handleBackButton);
    }, []);

    useEffect(() => {
        async function resolverSlug() {
            try {
                if (!slug) {
                    setError("Falta el slug en la URL");
                    setCargando(false);
                    return;
                }
                const restaurante = await getRestaurantBySlug(slug);
                setSheetId(restaurante.sheetId);
                setNombreRestaurante(restaurante.nombre);
            } catch (err) {
                console.error('Error:', err);
                setError(`Restaurante "${slug}" no encontrado`);
            }
        }
        resolverSlug();
    }, [slug]);

    useEffect(() => {
        audioRef.current.loop = true;
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
        if (!sheetId) return; 

        if (mostrarCarga) setCargando(true);
        try {
            const cacheBuster = new Date().getTime();
            const response = await fetch(`${SCRIPT_URL}?get=pedidos&sheetId=${sheetId}&_=${cacheBuster}`);
            const result = await response.json();
            
            const hoyBolivia = new Date(new Date().toLocaleString("en-US", {timeZone: "America/La_Paz"}));
            const diaHoy = hoyBolivia.getDate();
            const mesHoy = hoyBolivia.getMonth() + 1;
            const anioHoy = hoyBolivia.getFullYear();

            const dataFiltrada = result.data.slice(1)
                .map((fila) => {
                    const fechaRaw = fila[0] ? fila[0].toString() : "";
                    let esDeHoy = false;
                    try {
                        let d, m, a;
                        if (fechaRaw.includes('T')) {
                            const soloFecha = fechaRaw.split('T')[0]; 
                            const partes = soloFecha.split('-');
                            a = parseInt(partes[0]); m = parseInt(partes[1]); d = parseInt(partes[2]);
                        } else if (fechaRaw.includes('/')) {
                            const soloFecha = fechaRaw.split(' ')[0];
                            const partes = soloFecha.split('/');
                            d = parseInt(partes[0]); m = parseInt(partes[1]); a = parseInt(partes[2]);
                        }
                        esDeHoy = (d === diaHoy && m === mesHoy && a === anioHoy);
                    } catch (e) {}

                    return {
                        fechaRaw, esDeHoy, codigo: fila[1], hash: fila[2],
                        cliente: fila[4], celular: fila[5], items: fila[6], 
                        total: parseFloat(fila[7] || 0).toFixed(2),
                        notas: fila[8], estado: fila[9], hora: fila[10] || "--:--",
                        nroPedido: fila[11]
                    };
                })
                .filter(pedido => pedido.esDeHoy)
                .sort((a, b) => {
                    const esEliminadoA = a.estado === 'ELIMINADO' ? 1 : 0;
                    const esEliminadoB = b.estado === 'ELIMINADO' ? 1 : 0;
                    
                    if (esEliminadoA !== esEliminadoB) {
                        return esEliminadoA - esEliminadoB;
                    }
                    
                    return parseInt(b.nroPedido || 0) - parseInt(a.nroPedido || 0);
                });

            if (!primeraCarga.current && dataFiltrada.length > cantidadAnterior) {
                reproducirAlertaPersistente();
            }

            setPedidos(dataFiltrada);
            setCantidadAnterior(dataFiltrada.length);
            primeraCarga.current = false;

        } catch (err) { 
            console.error("Error crítico:", err); 
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
        } catch (e) { return <div className="error-json">Error al leer productos</div>; }
    };

    const cambiarEstado = async (codigo, estadoActual) => {
        const nuevoEstado = estadoActual === 'PENDIENTE' ? 'ENTREGADO' : 'PENDIENTE';
        setPedidos(prev => prev.map(p => p.codigo === codigo ? { ...p, estado: nuevoEstado } : p));
        try {
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ action: 'actualizarEstado', sheetId, codigo, nuevoEstado })
            });
            setTimeout(() => obtenerPedidos(false), 2000);
        } catch (err) { obtenerPedidos(); }
    };

    const confirmarPago = async (codigo) => {
        setPedidos(prev => prev.map(p => 
            p.codigo === codigo ? { ...p, estado: 'PENDIENTE' } : p
        ));
        try {
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ action: 'actualizarEstado', sheetId, codigo, nuevoEstado: 'PENDIENTE' })
            });
            setTimeout(() => obtenerPedidos(false), 2000);
        } catch (err) { obtenerPedidos(); }
    };

    const eliminarPedido = async (codigo) => {
        const confirmar = window.confirm("¿Está seguro de eliminar este pedido? Esta acción no se puede deshacer.");
        if (!confirmar) return;

        setPedidos(prev => prev.map(p => 
            p.codigo === codigo ? { ...p, estado: 'ELIMINADO' } : p
        ));
        
        try {
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ action: 'actualizarEstado', sheetId, codigo, nuevoEstado: 'ELIMINADO' })
            });
            setTimeout(() => obtenerPedidos(false), 2000);
        } catch (err) { 
            console.error("Error al eliminar:", err);
            obtenerPedidos(); 
        }
    };

    const restaurarPedido = async (codigo) => {
        const confirmar = window.confirm("¿Desea restaurar este pedido a PENDIENTE DE PAGO?");
        if (!confirmar) return;
        setPedidos(prev => prev.map(p => 
            p.codigo === codigo ? { ...p, estado: 'PENDIENTE_PAGO' } : p
        ));
        try {
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ action: 'actualizarEstado', sheetId, codigo, nuevoEstado: 'PENDIENTE_PAGO' })
            });
            setTimeout(() => obtenerPedidos(false), 2000);
        } catch (err) { 
            console.error("Error al restaurar:", err);
            obtenerPedidos(); 
        }
    };

    const recordarPago = (pedido) => {
        const numero = pedido.celular.toString().replace(/\D/g, '');
        const mensaje = `Hola ${pedido.cliente}, recibimos tu pedido #${pedido.nroPedido || '---'}. Tu pedido está en cola, pero por favor envía el comprobante de pago por este medio para que comencemos a prepararlo. ¡Gracias!`;
        window.open(`https://wa.me/591${numero}?text=${encodeURIComponent(mensaje)}`, '_blank');
    };

    const confirmarPreparacion = (pedido) => {
        const numero = pedido.celular.toString().replace(/\D/g, '');
        const mensaje = `Hola ${pedido.cliente}, confirmamos la recepción de tu pago para la Orden #${pedido.nroPedido || '---'}. ¡Ya lo estamos preparando! 👍`;
        window.open(`https://wa.me/591${numero}?text=${encodeURIComponent(mensaje)}`, '_blank');
    };

    useEffect(() => {
        if (sheetId) {
            obtenerPedidos();
            const interval = setInterval(() => obtenerPedidos(false), 15000);
            return () => clearInterval(interval);
        }
    }, [obtenerPedidos, sheetId]);

    if (cargando && !sheetId) return <div className="admin-centro">Cargando restaurante...</div>;
    if (error) return <div className="admin-centro">{error}</div>;
    if (!sheetId) return <div className="admin-centro">Restaurante no encontrado</div>;
    if (cargando) return <div className="admin-centro">Cargando pedidos de cocina...</div>;

    return (
        <div className="admin-container">
            {alarmaActiva && (
                <div className="banner-alarma">
                    <button onClick={detenerAlarma} className="btn-detener-alarma">
                        🛑 SILENCIAR ALARMA - NUEVO PEDIDO
                    </button>
                </div>
            )}

            <header className="admin-header">
                <div className="header-info">
                    <h2><span className="texto-panel">PANEL:</span> {nombreRestaurante.toUpperCase()}</h2>
                    <span className="badge-fecha">{new Date().toLocaleDateString()}</span>
                </div>
                
                {/* ✅ MODIFICACIÓN: Botones agrupados */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button 
                        onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${sheetId}`, '_blank')} 
                        className="btn-abrir-sheet"
                    >
                        📊 Abrir Panel
                    </button>
                    
                    <button onClick={() => { 
                        audioRef.current.play().then(() => { audioRef.current.pause(); audioRef.current.currentTime = 0; }).catch(e => {});
                        detenerAlarma(); obtenerPedidos(); 
                    }} className="btn-refrescar">
                        🔄 Actualizar
                    </button>
                </div>
            </header>

            <div className="admin-lista">
                {pedidos.length === 0 ? (
                    <div className="admin-centro-vacio"><p>No hay pedidos registrados para hoy todavía.</p></div>
                ) : (
                    pedidos.map((pedido) => (
                        <div key={pedido.codigo} className={`admin-card ${pedido.estado}`}>
                            
                            {pedido.estado === 'PENDIENTE_PAGO' && (
                                <div className="status-banner-pago-wrapper">
                                    <div className="status-banner-pago pulsating-banner">
                                        ⚠️ PENDIENTE DE PAGO
                                    </div>
                                </div>
                            )}

                            {pedido.estado === 'ELIMINADO' && (
                                <div className="status-banner-eliminado">
                                    ❌ PEDIDO ELIMINADO
                                </div>
                            )}

                            <div className="card-content-wrapper">
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

                                    {pedido.estado === 'ELIMINADO' ? (
                                        <div className="admin-acciones-grid" style={{ gridTemplateColumns: '1fr' }}>
                                            <button onClick={() => restaurarPedido(pedido.codigo)} className="btn-restaurar">
                                                ♻️ RESTAURAR PEDIDO
                                            </button>
                                        </div>
                                    ) : pedido.estado === 'PENDIENTE_PAGO' ? (
                                        <>
                                            <div className="admin-acciones-grid" style={{ gridTemplateColumns: '1fr' }}>
                                                <button onClick={() => confirmarPago(pedido.codigo)} className="btn-pago-verificado">
                                                    ✅ PAGO VERIFICADO
                                                </button>
                                            </div>
                                            <div className="admin-acciones-grid" style={{ marginTop: '10px' }}>
                                                <button onClick={() => recordarPago(pedido)} className="btn-whatsapp-small">
                                                    💬 Recordar
                                                </button>
                                                <button onClick={() => eliminarPedido(pedido.codigo)} className="btn-eliminar">
                                                    🗑️ Eliminar
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="admin-acciones-grid">
                                            <button onClick={() => confirmarPreparacion(pedido)} className="btn-whatsapp">
                                                Pago OK 👍
                                            </button>
                                            <button 
                                                onClick={() => cambiarEstado(pedido.codigo, pedido.estado)} 
                                                className={`btn-estado-v2 ${pedido.estado}`}
                                            >
                                                {pedido.estado === 'PENDIENTE' ? 'Despachar' : '✓ Entregado'}
                                            </button>
                                        </div>
                                    )}
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