// src/hooks/useMenuData.js
import { useState, useEffect, useCallback } from 'react';
import { getRestaurantData } from '../services/sheetsApi';

/**
 * Custom Hook para gestionar el estado de la aplicación y la auto-actualización.
 */
export function useMenuData(slug) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // TAREA 28: Implementación de Política de Retención de Datos
    const fetchData = useCallback(async () => {
        // 1. Mostrar loading solo si NO hay datos previos (carga inicial)
        if (!data) {
            setLoading(true);
            setError(null);
        }
        
        try {
            const result = await getRestaurantData(slug);
            
            if (result && result.error) {
                // ERROR DE CARGA O REFRESH FALLIDO
                
                // Si NO hay datos previos (carga inicial fallida), registramos el error
                if (!data) {
                    setError(result.error);
                    setData(null);
                } else {
                    // Si hay datos previos (refresh fallido), NO los borramos.
                    // Esto evita el "Error de conexión" visible y el crash.
                    console.error("Refresh fallido. Mostrando datos antiguos.");
                }
                
            } else if (result) {
                // ÉXITO: Siempre actualizamos el estado con los nuevos datos
                setError(null); 
                setData(result);
                
            } else {
                // Error de conexión o API (retorno null en sheetsApi)
                if (!data) {
                    setError("Error de conexión con la API o datos no válidos.");
                    setData(null);
                }
            }
        } catch (err) {
            console.error("Hook Fetch Error:", err);
            // Captura errores de red que no fueron manejados por sheetsApi
            if (!data) {
                setError("Ocurrió un error inesperado al cargar los datos.");
                setData(null);
            }
        } finally {
            // Ocultar loading solo si NO hay datos previos
            if (!data) setLoading(false);
        }
    }, [slug, data]); // 'data' es necesario para la lógica de retención en fetchData


    // 1. useEffect: Carga Inicial
    // TAREA 47: Dependencia estabilizada.
    useEffect(() => {
        if (slug) {
            fetchData();
        }
    }, [slug, fetchData]);


    // 2. useEffect: Auto-refresh cada 60 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            console.log("Auto-refresh de datos...");
            fetchData();
        }, 60000); 

        return () => clearInterval(interval);
    }, [fetchData]);


    return {
        data,
        loading,
        error,
        lastUpdate: data?.lastUpdate
    };
}