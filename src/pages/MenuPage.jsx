// src/pages/MenuPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getRestaurantData } from '../services/sheetsApi';
import { getGuarnicionesDisponibles } from '../utils/menuUtils';

import PlatosExtras from '../components/PlatosExtras';
import MenuDelDia from '../components/MenuDelDia';
import FooterInfo from '../components/FooterInfo';
import Header from '../components/Header';
import OrderSummary from '../components/OrderSummary';
import ErrorDisplay from '../components/ErrorDisplay';
import CarritoButton from '../components/CarritoButton';

const MenuPage = () => {
    const { sheetId, restaurantSlug } = useParams();

    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [menuExtras, setMenuExtras] = useState({});
    const [visibilidad, setVisibilidad] = useState({
        mostrarAlmuerzo: true,
        mostrarExtras: false,
        horarioActual: 'medio_dia'
    });

    // NUEVO: Estado del carrito
    const [carrito, setCarrito] = useState([]);
    const [mostrarResumen, setMostrarResumen] = useState(false);

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
                setMenuExtras(result.menuExtras);
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

    // NUEVA función para agregar al carrito
    const handleAddToCart = (item) => {
        setCarrito(prev => [...prev, item]);
    };

    // Calcular totales del carrito
    const totalItems = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0);
    const totalPrecio = carrito.reduce((sum, item) => sum + (item.precio * (item.cantidad || 1)), 0);

    if (isLoading) {
        return <div className="text-center p-10 text-xl font-bold text-gray-700">Cargando menú...</div>;
    }

    if (error || !data) {
        return <ErrorDisplay message={error} />;
    }

    const guarnicionesDisponibles = getGuarnicionesDisponibles(data.opciones.guarniciones);
    const hayPlatosExtras = Object.keys(menuExtras).length > 0;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center">
            <div className="w-full max-w-4xl p-4 sm:p-6 lg:p-8">
                <Header
                    restaurant={data}
                    lastUpdate={data.lastUpdate}
                    tipoServicio={data.tipo_servicio}
                />

                {visibilidad.mostrarAlmuerzo && data.menuDelDia && (
                    <MenuDelDia
                        menu={data.menuDelDia}
                        presas={data.opciones.presas}
                        guarniciones={guarnicionesDisponibles}
                        onAddToOrder={handleAddToCart}
                    />
                )}

                {visibilidad.mostrarExtras && hayPlatosExtras && (
                    <PlatosExtras
                        menuExtras={menuExtras}
                        horarioActual={visibilidad.horarioActual}
                        onAddToCart={handleAddToCart}
                        guarniciones={guarnicionesDisponibles}
                    />
                )}
            </div>

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

            <FooterInfo restaurant={data} />
        </div>
    );
};

export default MenuPage;