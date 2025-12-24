// src/hooks/useMenuData.js
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getRestaurantData } from '../services/sheetsApi.js';

// 🚨 CRÍTICO: Reemplaza con el ID largo de tu Hoja de Google
const SHEET_ID = '1JIiS5ZFvgrLKrsYcag9FclwA30i7HBhxiSdAeEwIghY'; 

const useMenuData = () => {
    const { slug } = useParams();
    const [restaurant, setRestaurant] = useState(null);
    const [menuExtras, setMenuExtras] = useState({});
    const [menuDelDia, setMenuDelDia] = useState(null); 
    const [opciones, setOpciones] = useState({ guarniciones: [], presas: [] });
    const [visibilidad, setVisibilidad] = useState({ 
        mostrarAlmuerzo: true, 
        mostrarExtras: true, 
        tipo_servicio: 'ambos' 
    });
    const [lastUpdate, setLastUpdate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        if (!slug) {
            setError('404 - Menú No Encontrado');
            setLoading(false);
            return;
        }

        if (SHEET_ID === 'TU_ID_LARGO_DE_HOJA_AQUÍ' || !SHEET_ID) {
            setError('ERROR: Falta configurar el SHEET_ID en useMenuData.js');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await getRestaurantData(SHEET_ID, slug);

            if (data.error) {
                setError(data.error);
                setLoading(false);
                return;
            }

            const { 
                restaurant, 
                menuExtras, 
                menuDelDia, 
                opciones, 
                lastUpdate, 
                visibilidad 
            } = data;

            // ✅ AGREGAR sheet_id al objeto restaurant
            const restaurantWithSheetId = {
                ...restaurant,
                sheet_id: SHEET_ID // Agregar el ID del Sheet
            };

            setRestaurant(restaurantWithSheetId);
            setMenuExtras(menuExtras);
            setMenuDelDia(menuDelDia);
            setOpciones(opciones);
            setLastUpdate(lastUpdate);
            setVisibilidad(visibilidad); 

        } catch (err) {
            console.error("Fallo al cargar datos del menú:", err);
            setError('Fallo de conexión o error desconocido.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 60000); 
        return () => clearInterval(intervalId);
    }, [slug]);

    return {
        restaurant,
        menuExtras,
        menuDelDia,
        opciones,
        visibilidad,
        lastUpdate,
        loading,
        error,
        refetch: fetchData 
    };
};

export default useMenuData;