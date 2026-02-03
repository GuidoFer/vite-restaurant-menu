// src/pages/MenuPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Clock, Facebook, Instagram, Youtube, UserPlus, MessageCircle, AlertTriangle } from 'lucide-react'; 
import { getRestaurantData } from '../services/sheetsApi';
import { getGuarnicionesDisponibles } from '../utils/menuUtils';
import { getRestaurantBySlug } from '../services/restaurantesService'; 

import PlatosExtras from '../components/PlatosExtras';
import MenuDelDia from '../components/MenuDelDia';
import FooterInfo from '../components/FooterInfo';
import Header from '../components/Header';
import OrderSummary from '../components/OrderSummary';
import ErrorDisplay from '../components/ErrorDisplay';
import CarritoButton from '../components/CarritoButton';
import Toast from '../components/Toast';

const MenuPage = () => {
    const { slug } = useParams(); 
    const navigate = useNavigate();

    const [sheetId, setSheetId] = useState(null); 
    const [restaurantSlug, setRestaurantSlug] = useState(null); 
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [menuExtrasDia, setMenuExtrasDia] = useState({});
    const [menuExtrasNoche, setMenuExtrasNoche] = useState({});
    const [visibilidad, setVisibilidad] = useState({
        mostrarAlmuerzo: true,
        mostrarExtras: false,
        mostrarExtrasNoche: false,
        horarioActual: 'medio_dia'
    });

    const [carrito, setCarrito] = useState([]);
    const [mostrarResumen, setMostrarResumen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const menuDelDiaRef = useRef(null);
    const platosExtrasDiaRef = useRef(null);
    const platosExtrasNocheRef = useRef(null);
    const [mostrarDialogoSalida, setMostrarDialogoSalida] = useState(false);

    // ✅ LÓGICA DE ESTADO (PAUSA/CIERRE)
    const estadoServicio = data?.estado || 'ABIERTO';
    const estaBloqueado = estadoServicio !== 'ABIERTO';

    const agendarRestaurante = () => {
        if (!data) return;
        const nro = data.telefono;
        const nombre = data.nombre;
        const mensaje = `Hola *${nombre}*,Te agregare a mis contactos para ver el menu diario y hacer mis pedidos.  ✨`;
        const url = `https://wa.me/591${nro}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
        setToastMessage('📲 Abriendo WhatsApp... ¡Dale a enviar para agendar!');
        setShowToast(true);
    };

    useEffect(() => {
        async function resolverSlug() {
            if (!slug) {
                setError("Falta el slug del restaurante en la URL");
                setIsLoading(false);
                return;
            }
            try {
                const restaurante = await getRestaurantBySlug(slug);
                setSheetId(restaurante.sheetId);
                setRestaurantSlug(slug);
            } catch (err) {
                setError(`Restaurante "${slug}" no encontrado`);
                setIsLoading(false);
            }
        }
        resolverSlug();
    }, [slug]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!data) return;
        
        const hour = currentTime.getHours();
        const minute = currentTime.getMinutes();
        const timeInMinutes = hour * 60 + minute;

        let open = false;
        const tipoServicio = data.tipo_servicio || 'almuerzo';
        
        if (tipoServicio === 'almuerzo') {
            open = timeInMinutes >= 11 * 60 && timeInMinutes < 15 * 60;
        } else if (tipoServicio === 'cena') {
            open = timeInMinutes >= 18 * 60 && timeInMinutes < 22 * 60;
        } else if (tipoServicio === 'ambos') {
            open = (timeInMinutes >= 11 * 60 && timeInMinutes < 15 * 60) ||
                   (timeInMinutes >= 18 * 60 && timeInMinutes < 22 * 60);
        }
        setIsOpen(open);
    }, [currentTime, data]);

    const loadData = useCallback(async () => {
        if (!sheetId || !restaurantSlug) return; 

        setIsLoading(true);
        setError(null);

        try {
            const result = await getRestaurantData(sheetId, restaurantSlug);

            if (result.error) {
                setError(result.error);
                setData(null);
            } else {
                setData({
                    ...result.restaurant,
                    menuDelDia: result.menuDelDia,
                    opciones: result.opciones,
                    lastUpdate: result.lastUpdate
                });
                setVisibilidad(result.visibilidad);
                setMenuExtrasDia(result.menuExtrasDia);
                setMenuExtrasNoche(result.menuExtrasNoche);
            }
        } catch (e) {
            setError("Fallo al cargar los datos del restaurante: " + e.message);
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [sheetId, restaurantSlug]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        const handleBackButton = (e) => {
            e.preventDefault();
            if (mostrarResumen) { setMostrarResumen(false); return; }
            if (mostrarDialogoSalida) { setMostrarDialogoSalida(false); return; }
            const hayModalAbierto = document.querySelector('.almuerzo-modal-overlay, .plato-modal-overlay');
            if (hayModalAbierto) return;
            const menuDelDiaAbierto = menuDelDiaRef.current?.isOpen;
            const platosExtrasDiaAbierto = platosExtrasDiaRef.current?.isOpen;
            const platosExtrasNocheAbierto = platosExtrasNocheRef.current?.isOpen;
            const hayAcordeones = menuDelDiaAbierto || platosExtrasDiaAbierto || platosExtrasNocheAbierto;
            if (hayAcordeones) {
                if (menuDelDiaRef.current?.closeAccordion) menuDelDiaRef.current.closeAccordion();
                if (platosExtrasDiaRef.current?.closeAccordion) platosExtrasDiaRef.current.closeAccordion();
                if (platosExtrasNocheRef.current?.closeAccordion) platosExtrasNocheRef.current.closeAccordion();
                return;
            }
            setMostrarDialogoSalida(true);
        };
        window.history.pushState(null, '', window.location.pathname);
        window.addEventListener('popstate', handleBackButton);
        return () => window.removeEventListener('popstate', handleBackButton);
    }, [mostrarResumen, mostrarDialogoSalida]);

    const handleConfirmarSalida = () => {
        window.history.back();
    };

    const handleAddToCart = (item) => {
        if (estaBloqueado) return; // Seguridad extra
        setCarrito(prev => [...prev, item]);
        const cantidad = item.cantidad || 1;
        const cantidadTexto = cantidad === 1 ? '' : `${cantidad} `;
        setToastMessage(`✅ Se añadió ${cantidadTexto}${item.nombre} al carrito`);
        setShowToast(true);
    };

    const formatUpdateTime = () => {
        const hours = currentTime.getHours().toString().padStart(2, '0');
        const minutes = currentTime.getMinutes().toString().padStart(2, '0');
        return `Hoy ${hours}:${minutes}`;
    };

    const getSchedule = () => {
        return data?.horario_display || 'Horario no disponible';
    };

    const totalItems = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0);
    const totalPrecio = carrito.reduce((sum, item) => sum + (item.precio * (item.cantidad || 1)), 0);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-xl font-bold text-gray-700">Cargando menú...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return <ErrorDisplay message={error} />;
    }

    const guarnicionesDisponibles = getGuarnicionesDisponibles(data.opciones.guarniciones);
    const hayPlatosExtrasDia = Object.keys(menuExtrasDia).length > 0;
    const hayPlatosExtrasNoche = Object.keys(menuExtrasNoche).length > 0;

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
            <div className="bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 text-white py-8 px-4 shadow-lg">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
                        🍽️ {data.nombre}
                    </h1>
                    
                    <div className="flex flex-wrap justify-center gap-3 mb-4">
                        <div className={`px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 transition-all duration-300 ${
                            isOpen && !estaBloqueado ? 'bg-green-500 shadow-lg' : 'bg-gray-500 opacity-80'
                        }`}>
                            <span className={`w-3 h-3 rounded-full ${isOpen && !estaBloqueado ? 'bg-white' : 'bg-gray-300'}`}></span>
                            {(isOpen && !estaBloqueado) ? 'Abierto Ahora' : 'Cerrado / Pausado'}
                        </div>

                        <button 
                            onClick={agendarRestaurante}
                            className="px-4 py-2 rounded-full bg-white text-orange-600 font-bold text-sm flex items-center gap-2 shadow-md hover:bg-orange-50 transition-all active:scale-95"
                        >
                            <MessageCircle className="w-4 h-4" />
                            Registrar Nro.WhatsApp
                        </button>

                        <div className="px-4 py-2 rounded-full bg-white bg-opacity-20 backdrop-blur-sm font-medium text-sm flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Actualizado: {formatUpdateTime()}
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3">
                        <button className="px-4 py-2 rounded-full bg-white bg-opacity-10 backdrop-blur-sm hover:bg-white hover:bg-opacity-20 transition-all duration-300 font-medium text-sm flex items-center gap-2 border border-white border-opacity-30">
                            <Clock className="w-4 h-4" />
                            {getSchedule()}
                        </button>

                        <div className="px-4 py-2 rounded-full bg-white bg-opacity-10 backdrop-blur-sm font-medium text-sm flex items-center gap-2 border border-white border-opacity-30">
                            <span className="font-semibold">Dir:</span>
                            <span>{data.ubicacion}</span>
                        </div>

                        <a 
                            href={`tel:+591${data.telefono}`}
                            className="px-4 py-2 rounded-full bg-white bg-opacity-10 backdrop-blur-sm hover:bg-white hover:bg-opacity-20 transition-all duration-300 font-medium text-sm flex items-center gap-2 border border-white border-opacity-30"
                        >
                            <Phone className="w-4 h-4" />
                            {data.telefono}
                        </a>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                
                {/* ✅ BANNER DE ESTADO DINÁMICO */}
                {estaBloqueado && (
                    <div className={`mb-6 p-4 rounded-2xl flex items-center gap-4 text-white shadow-xl animate-bounce-subtle ${
                        estadoServicio === 'PAUSADO' ? 'bg-yellow-500' : 'bg-red-600'
                    }`}>
                        <AlertTriangle className="w-10 h-10 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-lg">
                                {estadoServicio === 'PAUSADO' ? 'Saturación Temporal' : 'Servicio Cerrado'}
                            </h3>
                            <p className="text-sm opacity-90">
                                {estadoServicio === 'PAUSADO' 
                                    ? "Estamos atendiendo muchos pedidos. El menú se habilitará en unos minutos." 
                                    : "Lo sentimos, ya no recibimos pedidos por el día de hoy."}
                            </p>
                        </div>
                    </div>
                )}

                {visibilidad.mostrarAlmuerzo && data.menuDelDia && (
                    <div className={estaBloqueado ? "pointer-events-none opacity-60 grayscale-[0.5]" : ""}>
                        <MenuDelDia
                            ref={menuDelDiaRef}
                            menu={data.menuDelDia}
                            presas={data.opciones.presas}
                            guarniciones={guarnicionesDisponibles}
                            onAddToOrder={handleAddToCart}
                        />
                    </div>
                )}

                {visibilidad.mostrarExtras && hayPlatosExtrasDia && (
                    <div className={estaBloqueado ? "pointer-events-none opacity-60 grayscale-[0.5]" : ""}>
                        <PlatosExtras
                            ref={platosExtrasDiaRef}
                            menuExtras={menuExtrasDia}
                            horarioActual="medio_dia"
                            onAddToCart={handleAddToCart}
                            guarniciones={guarnicionesDisponibles}
                            theme="dia"
                        />
                    </div>
                )}

                {visibilidad.mostrarExtrasNoche && hayPlatosExtrasNoche && (
                    <div className={estaBloqueado ? "pointer-events-none opacity-60 grayscale-[0.5]" : ""}>
                        <PlatosExtras
                            ref={platosExtrasNocheRef}
                            menuExtras={menuExtrasNoche}
                            horarioActual="noche"
                            onAddToCart={handleAddToCart}
                            guarniciones={guarnicionesDisponibles}
                            theme="noche"
                        />
                    </div>
                )}
            </div>

            <div className="bg-orange-50 py-12 px-4 mt-8">
                <div className="max-w-4xl mx-auto text-center">
                    <button 
                        onClick={agendarRestaurante}
                        className="mb-8 inline-flex items-center gap-3 px-8 py-4 bg-green-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:bg-green-600 transition-all active:scale-95"
                    >
                        <MessageCircle className="w-6 h-6" />
                        Registrar Numero del Restaurante
                    </button>

                    <div className="mb-8">
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.ubicacion)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            <MapPin className="w-6 h-6" />
                            Ver Ubicación en el Mapa
                        </a>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Síguenos en Redes</h3>
                    <div className="flex justify-center gap-4">
                        <a href="#" className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-lg"><Facebook className="w-6 h-6" /></a>
                        <a href="#" className="w-12 h-12 flex items-center justify-center bg-pink-600 text-white rounded-full shadow-lg"><Instagram className="w-6 h-6" /></a>
                        <a href="#" className="w-12 h-12 flex items-center justify-center bg-red-600 text-white rounded-full shadow-lg"><Youtube className="w-6 h-6" /></a>
                    </div>
                </div>
            </div>

            <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-8 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="grid md:grid-cols-3 gap-6 mb-6 text-left">
                        <div>
                            <h4 className="font-bold text-lg mb-3">{data.nombre}</h4>
                            <p className="text-gray-400 text-sm">Comida casera con el sabor de siempre</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-3">Horarios</h4>
                            <p className="text-gray-400 text-sm">{getSchedule()}</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-3">Contacto</h4>
                            <p className="text-gray-400 text-sm flex items-center gap-2 mb-2"><Phone className="w-4 h-4" />{data.telefono}</p>
                            <p className="text-gray-400 text-sm flex items-center gap-2"><MapPin className="w-4 h-4" />{data.ubicacion}</p>
                        </div>
                    </div>
                    <div className="border-t border-gray-700 pt-6">
                        <p className="text-gray-400 text-sm mb-3">© 2026 {data.nombre}. Todos los derechos reservados.</p>
                        <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
                            <span>Powered by</span>
                            <a href="https://wa.me/59160605127" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 font-semibold">SIA (Soluciones con IA)</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* ✅ OCULTAR CARRITO SI ESTÁ BLOQUEADO */}
            {!estaBloqueado && (
                <CarritoButton itemCount={totalItems} total={totalPrecio} onClick={() => setMostrarResumen(true)} />
            )}

            {mostrarResumen && (
                <OrderSummary
                    carrito={carrito}
                    setCarrito={setCarrito}
                    onClose={() => setMostrarResumen(false)}
                    restaurante={data}
                />
            )}

            {showToast && <Toast message={toastMessage} onClose={() => setShowToast(false)} />}

            {mostrarDialogoSalida && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-in">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-3xl">👋</span></div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">¿Deseas salir del menú?</h3>
                            <p className="text-gray-600 text-sm">Volverás a la página anterior</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setMostrarDialogoSalida(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold">Cancelar</button>
                            <button onClick={handleConfirmarSalida} className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl font-semibold">Salir</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .8; } }
                @keyframes scale-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
                .animate-scale-in { animation: scale-in 0.2s ease-out; }
                .animate-bounce-subtle { animation: bounce-subtle 2s infinite ease-in-out; }
            `}</style>
        </div>
    );
};

export default MenuPage;