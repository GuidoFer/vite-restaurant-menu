// src/pages/MenuPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Phone, Clock, Facebook, Instagram, Youtube } from 'lucide-react';
import { getRestaurantData } from '../services/sheetsApi';
import { getGuarnicionesDisponibles } from '../utils/menuUtils';

import PlatosExtras from '../components/PlatosExtras';
import MenuDelDia from '../components/MenuDelDia';
import FooterInfo from '../components/FooterInfo';
import Header from '../components/Header';
import OrderSummary from '../components/OrderSummary';
import ErrorDisplay from '../components/ErrorDisplay';
import CarritoButton from '../components/CarritoButton';
import Toast from '../components/Toast';

const MenuPage = () => {
    const { sheetId, restaurantSlug } = useParams();

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

    // Estado del carrito
    const [carrito, setCarrito] = useState([]);
    const [mostrarResumen, setMostrarResumen] = useState(false);

    // Estados para Toast
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);

    // Estados para Hero
    const [isOpen, setIsOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Actualizar hora cada minuto
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    // Verificar si está abierto basado en tipo de servicio
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
        if (!sheetId || !restaurantSlug) {
            setError("Falta el ID de la hoja o el slug del restaurante en la URL.");
            setIsLoading(false);
            return;
        }

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

    // Función para agregar al carrito con notificación
    const handleAddToCart = (item) => {
        setCarrito(prev => [...prev, item]);
        
        // Mostrar toast
        const cantidad = item.cantidad || 1;
        const cantidadTexto = cantidad === 1 ? '' : `${cantidad} `;
        setToastMessage(`✅ Se añadió ${cantidadTexto}${item.nombre} al carrito`);
        setShowToast(true);
    };

    // Formatear hora de actualización
    const formatUpdateTime = () => {
        const hours = currentTime.getHours().toString().padStart(2, '0');
        const minutes = currentTime.getMinutes().toString().padStart(2, '0');
        return `Hoy ${hours}:${minutes}`;
    };

    // Obtener horario según tipo de servicio
    const getSchedule = () => {
        if (!data) return '';
        const tipoServicio = data.tipo_servicio || 'almuerzo';
        
        if (tipoServicio === 'almuerzo') return 'Lun-Dom: 11:00 - 15:00';
        if (tipoServicio === 'cena') return 'Lun-Dom: 18:00 - 22:00';
        return 'Lun-Dom: 11:00 - 15:00 y 18:00 - 22:00';
    };

    // Calcular totales del carrito
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
            {/* ==================== HERO SECTION ==================== */}
            <div className="bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 text-white py-8 px-4 shadow-lg">
                <div className="max-w-4xl mx-auto">
                    {/* Nombre del Restaurante */}
                    <h1 className="text-4xl md:text-5xl font-bold text-center mb-6" style={{
                        animation: 'fadeIn 0.6s ease-out'
                    }}>
                        🍽️ {data.nombre}
                    </h1>
                    
                    {/* Badges informativos */}
                    <div className="flex flex-wrap justify-center gap-3 mb-4">
                        {/* Estado: Abierto/Cerrado */}
                        <div className={`px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 transition-all duration-300 ${
                            isOpen 
                                ? 'bg-green-500 shadow-lg' 
                                : 'bg-gray-500 opacity-80'
                        }`} style={isOpen ? {
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                        } : {}}>
                            <span className={`w-3 h-3 rounded-full ${isOpen ? 'bg-white' : 'bg-gray-300'}`}></span>
                            {isOpen ? 'Abierto Ahora' : 'Cerrado'}
                        </div>

                        {/* Última actualización */}
                        <div className="px-4 py-2 rounded-full bg-white bg-opacity-20 backdrop-blur-sm font-medium text-sm flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Actualizado: {formatUpdateTime()}
                        </div>
                    </div>

                    {/* Información de contacto */}
                    <div className="flex flex-wrap justify-center gap-3">
                        {/* Horario */}
                        <button className="px-4 py-2 rounded-full bg-white bg-opacity-10 backdrop-blur-sm hover:bg-white hover:bg-opacity-20 transition-all duration-300 font-medium text-sm flex items-center gap-2 border border-white border-opacity-30">
                            <Clock className="w-4 h-4" />
                            {getSchedule()}
                        </button>

                        {/* Dirección */}
                        <div className="px-4 py-2 rounded-full bg-white bg-opacity-10 backdrop-blur-sm font-medium text-sm flex items-center gap-2 border border-white border-opacity-30">
                            <span className="font-semibold">Dir:</span>
                            <span>{data.ubicacion}</span>
                        </div>

                        {/* Teléfono */}
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

            {/* ==================== SECCIÓN DE ACORDEONES ==================== */}
            <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* 1. MENÚ DEL ALMUERZO */}
                {visibilidad.mostrarAlmuerzo && data.menuDelDia && (
                    <MenuDelDia
                        menu={data.menuDelDia}
                        presas={data.opciones.presas}
                        guarniciones={guarnicionesDisponibles}
                        onAddToOrder={handleAddToCart}
                    />
                )}

                {/* 2. PLATOS EXTRAS - MEDIO DÍA */}
                {visibilidad.mostrarExtras && hayPlatosExtrasDia && (
                    <PlatosExtras
                        menuExtras={menuExtrasDia}
                        horarioActual="medio_dia"
                        onAddToCart={handleAddToCart}
                        guarniciones={guarnicionesDisponibles}
                        theme="dia"
                    />
                )}

                {/* 3. PLATOS EXTRAS - NOCHE */}
                {visibilidad.mostrarExtrasNoche && hayPlatosExtrasNoche && (
                    <PlatosExtras
                        menuExtras={menuExtrasNoche}
                        horarioActual="noche"
                        onAddToCart={handleAddToCart}
                        guarniciones={guarnicionesDisponibles}
                        theme="noche"
                    />
                )}
            </div>

            {/* ==================== SECCIÓN INFERIOR: Ubicación y Redes ==================== */}
            <div className="bg-orange-50 py-12 px-4 mt-8">
                <div className="max-w-4xl mx-auto">
                    {/* Botón de ubicación */}
                    <div className="text-center mb-8">
                        <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(data.ubicacion)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                            style={{
                                transform: 'scale(1)',
                                transition: 'transform 0.3s ease, shadow 0.3s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <MapPin className="w-6 h-6" />
                            Ver Ubicación en el Mapa
                        </a>
                    </div>

                    {/* Redes sociales */}
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">Síguenos en Redes</h3>
                        <div className="flex justify-center gap-4">
                            <a
                                href="#"
                                className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-lg transition-transform duration-300"
                                style={{ transform: 'scale(1)' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                aria-label="Facebook"
                            >
                                <Facebook className="w-6 h-6" />
                            </a>
                            <a
                                href="#"
                                className="w-12 h-12 flex items-center justify-center bg-pink-600 text-white rounded-full shadow-lg transition-transform duration-300"
                                style={{ transform: 'scale(1)' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                aria-label="Instagram"
                            >
                                <Instagram className="w-6 h-6" />
                            </a>
                            <a
                                href="#"
                                className="w-12 h-12 flex items-center justify-center bg-red-600 text-white rounded-full shadow-lg transition-transform duration-300"
                                style={{ transform: 'scale(1)' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                aria-label="YouTube"
                            >
                                <Youtube className="w-6 h-6" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* ==================== FOOTER ==================== */}
            <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                        {/* Columna 1: Info del Restaurante */}
                        <div>
                            <h4 className="font-bold text-lg mb-3">{data.nombre}</h4>
                            <p className="text-gray-400 text-sm">
                                Comida casera con el sabor de siempre
                            </p>
                        </div>

                        {/* Columna 2: Horarios */}
                        <div>
                            <h4 className="font-bold text-lg mb-3">Horarios</h4>
                            <p className="text-gray-400 text-sm">
                                {getSchedule()}
                            </p>
                        </div>

                        {/* Columna 3: Contacto */}
                        <div>
                            <h4 className="font-bold text-lg mb-3">Contacto</h4>
                            <p className="text-gray-400 text-sm flex items-center gap-2 mb-2">
                                <Phone className="w-4 h-4" />
                                {data.telefono}
                            </p>
                            <p className="text-gray-400 text-sm flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {data.ubicacion}
                            </p>
                        </div>
                    </div>

                    {/* Copyright y Powered by */}
                    <div className="border-t border-gray-700 pt-6 text-center">
                        <p className="text-gray-400 text-sm mb-3">
                            © 2024 {data.nombre}. Todos los derechos reservados.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
                            <span>Powered by</span>
                            <a 
                                href="https://wa.me/59160605127" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-orange-400 hover:text-orange-300 font-semibold transition-colors"
                            >
                                SIA (Soluciones con IA)
                            </a>
                            <span>•</span>
                            <a 
                                href="https://wa.me/59160605127" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-gray-300 transition-colors"
                            >
                                📱 606 05127
                            </a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* ==================== COMPONENTES FLOTANTES ==================== */}
            {/* Botón flotante del carrito */}
            <CarritoButton
                itemCount={totalItems}
                total={totalPrecio}
                onClick={() => setMostrarResumen(true)}
            />

            {/* Modal de resumen */}
            {mostrarResumen && (
                <OrderSummary
                    carrito={carrito}
                    setCarrito={setCarrito}
                    onClose={() => setMostrarResumen(false)}
                    restaurante={data}
                />
            )}

            {/* Toast de notificación */}
            {showToast && (
                <Toast 
                    message={toastMessage} 
                    onClose={() => setShowToast(false)} 
                />
            )}

            {/* Estilos para animaciones */}
            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: .8;
                    }
                }
            `}</style>
        </div>
    );
};

export default MenuPage;