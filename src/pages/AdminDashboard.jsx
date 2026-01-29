// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getRestaurantBySlug } from '../services/restaurantesService'; // ✅ NUEVO
import '../components/css/AdminDashboard.css';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwn10DGmEntPVk-ojtj4q3WH4cy_BnF7RiCJ0dHvOnZnfeyQtsAe-5fi_yKOyfIMO0/exec"; 

const AdminDashboard = () => {
    const { slug } = useParams(); // ✅ CAMBIO: Captura slug en lugar de sheetId
    const [sheetId, setSheetId] = useState(null); // ✅ NUEVO: Estado para el ID resuelto
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null); // ✅ NUEVO: Para manejar errores de slug
    
    const [pedidos, setPedidos] = useState([]);
    const [cantidadAnterior, setCantidadAnterior] = useState(0);
    const [alarmaActiva, setAlarmaActiva] = useState(false);
    const primeraCarga = useRef(true);
    
    const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2847/2847-preview.mp3'));

    // ✅ NUEVO: Resolver slug a sheetId al cargar el componente
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
            } catch (err) {
                console.error('Error:', err);
                setError(`Restaurante "${slug}" no encontrado`);
            } finally {
                // No quitamos cargando aquí porque obtenerPedidos lo hará después
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

    // ✅ MODIFICADO: Ahora depende de sheetId
    const obtenerPedidos = useCallback(async (mostrarCarga = true) => {
        if (!sheetId) return; // ✅ Esperar a que se resuelva el slug

        if (mostrarCarga) setCargando(true);
        try {
            const cacheBuster = new Date().getTime();
            const response = await fetch(`${SCRIPT_URL}?get=pedidos&sheetId=${sheetId}&_=${cacheBuster}`);
            const result = await response.json();
            
            // 1. Fecha de hoy en Bolivia
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
                            a = parseInt(partes[0]);
                            m = parseInt(partes[1]);
                            d = parseInt(partes[2]);
                        } else if (fechaRaw.includes('/')) {
                            const soloFecha = fechaRaw.split(' ')[0];
                            const partes = soloFecha.split('/');
                            d = parseInt(partes[0]);
                            m = parseInt(partes[1]);
                            a = parseInt(partes[2]);
                        }

                        esDeHoy = (d === diaHoy && m === mesHoy && a === anioHoy);
                    } catch (e) {
                        console.error("Error procesando fecha:", fechaRaw);
                    }

                    return {
                        fechaRaw,
                        esDeHoy,
                        codigo: fila[1],
                        hash: fila[2],
                        cliente: fila[4],
                        celular: fila[5],
                        items: fila[6], 
                        total: parseFloat(fila[7] || 0).toFixed(2),
                        notas: fila[8],
                        estado: fila[9],
                        hora: fila[10] || "--:--",
                        nroPedido: fila[11]
                    };
                })
                .filter(pedido => pedido.esDeHoy)
                .reverse();

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
    }, [sheetId, cantidadAnterior]); // ✅ sheetId agregado como dependencia

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
        if (sheetId) {
            obtenerPedidos();
            const interval = setInterval(() => obtenerPedidos(false), 15000);
            return () => clearInterval(interval);
        }
    }, [obtenerPedidos, sheetId]);

    // ✅ MANEJO DE ESTADOS DE CARGA Y ERROR
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
                    <h2>PANEL DE PEDIDOS</h2>
                    <span className="badge-fecha">{new Date().toLocaleDateString()}</span>
                </div>
                
                <button onClick={() => { 
                    audioRef.current.play().then(() => {
                        audioRef.current.pause(); 
                        audioRef.current.currentTime = 0;
                    }).catch(e => console.log("Permiso de sonido activado"));
                    
                    detenerAlarma(); 
                    obtenerPedidos(); 
                }} className="btn-refrescar">
                    🔄 Actualizar y Activar Sonido
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