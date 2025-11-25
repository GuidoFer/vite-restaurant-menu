// src/services/sheetsApi.js (CORREGIDO Y OPTIMIZADO)

const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// URL base para la API de Google Sheets
const BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values`;

/**
 * Función principal que obtiene, filtra y mapea todos los datos del menú.
 */
export async function getRestaurantData(slug) {
    try {
        // --- Paso 1: Búsqueda del Restaurante ---
        const RESTAURANTS_RANGE = 'Restaurantes!A2:F';
        const urlRestaurants = `${BASE_URL}/${RESTAURANTS_RANGE}?key=${API_KEY}`;
        const restaurantResponse = await fetch(urlRestaurants);

        if (!restaurantResponse.ok) {
            throw new Error(`Error al buscar Restaurante (HTTP ${restaurantResponse.status})`);
        }

        const restaurantData = await restaurantResponse.json();
        
        // Corregido: Validación de values y limpieza de slug
        const restaurantRow = restaurantData.values?.find(row => 
            (row[1] || '').toString().trim() === slug.toString().trim()
        );

        if (!restaurantRow) {
            return { error: `Restaurante '${slug}' no encontrado` };
        }

        const [ id, foundSlug, nombre, telefono, ubicacion, qr_url ] = restaurantRow;
        
        const restaurant = {
            id: parseInt(id),
            slug: foundSlug,
            nombre,
            telefono,
            ubicacion,
            qr_url
        };
        
        // ID del restaurante como string limpio para filtros
        const restId = restaurant.id.toString().trim();

       // --- Paso 2: Fetch de Platos y Opciones ---

        const PLATES_RANGE = 'Platos!A2:G'; 
        const OPTIONS_RANGE = 'Opciones!A2:E'; 

        const platesResponse = await fetch(`${BASE_URL}/${PLATES_RANGE}?key=${API_KEY}`);
        const optionsResponse = await fetch(`${BASE_URL}/${OPTIONS_RANGE}?key=${API_KEY}`);

        if (!platesResponse.ok || !optionsResponse.ok) {
            throw new Error('Error al buscar Platos u Opciones');
        }

        const platosData = await platesResponse.json();
        const opcionesData = await optionsResponse.json();
        
        // --- Paso 3: Transformación y Mapeo de Datos (Platos) ---
        
        // Bug 1: AGREGAR FILTRO POR restId y mapeo seguro
        const platos = platosData.values
            ?.filter(row => (row[1] || '').toString().trim() === restId) 
            .map(row => ({
                id: row[0],
                categoria: row[2],
                nombre: row[3],
                precio: parseFloat(row[4] || 0), 
                disponible: row[5] === 'SI',
                imagen_url: row[6] || null
            })) || [];

        // Bug 3: Organizar platos por categorías
        const categoriesMap = {};
        platos.forEach(plato => {
            if (!categoriesMap[plato.categoria]) {
                categoriesMap[plato.categoria] = [];
            }
            categoriesMap[plato.categoria].push({
                id: plato.id,
                name: plato.nombre,
                // Usar toFixed(2) para asegurar el formato Bs. XX.00
                price: `Bs. ${plato.precio.toFixed(2)}`, 
                available: plato.disponible,
                imagen_url: plato.imagen_url
            });
        });
        const categories = Object.keys(categoriesMap).map(cat => ({
            name: cat,
            items: categoriesMap[cat]
        }));


        // --- Paso 4: Transformación y Mapeo de Datos (Opciones) ---
        
        // Bug 2: AGREGAR FILTRO POR restId
        const opcionesRaw = opcionesData.values
            ?.filter(row => (row[1] || '').toString().trim() === restId) 
            .map(row => ({
                id: row[0],
                tipo: row[2],
                nombre: row[3],
                disponible: row[4] === 'SI'
            })) || [];

        // Bug 4: Organizar opciones por tipo
        const opciones = {
            guarniciones: opcionesRaw.filter(opt => opt.tipo?.toLowerCase() === 'guarnicion'),
            presas: opcionesRaw.filter(opt => opt.tipo?.toLowerCase() === 'presa')
        };

        // --- Retorno Final (Estructura validada) ---
        return {
            restaurant,
            categories,
            opciones,
            lastUpdate: new Date().toISOString() 
        };

    } catch (error) {
        console.error('Error en getRestaurantData:', error);
        return null;
    }
}