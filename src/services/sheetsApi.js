// src/services/sheetsApi.js

const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// URL base para la API de Google Sheets
const BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values`;

/**
 * Función principal que obtiene, filtra y mapea todos los datos del menú para un restaurante específico.
 * @param {string} slug - El slug del restaurante (ej: 'demo-restaurant').
 * @returns {object|null} Objeto con la estructura final {restaurant, menu, optionsList} o null en caso de error.
 */
export async function getRestaurantData(slug) {
    console.log('Intentando obtener datos para slug:', slug);

    try {
        // --- Paso 1: Búsqueda del Restaurante (A2:F) ---
        const RESTAURANTS_RANGE = 'Restaurantes!A2:F'; 
        const urlRestaurants = `${BASE_URL}/${RESTAURANTS_RANGE}?key=${API_KEY}`;

        const response = await fetch(urlRestaurants);
        if (!response.ok) {
            throw new Error(`Error al buscar Restaurante (HTTP ${response.status})`);
        }

        const data = await response.json();
        const restaurantsRows = data.values || [];
        const restaurantRow = restaurantsRows.find(row => row[1] === slug);

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

       // --- Paso 2: Fetch de Platos y Opciones ---

        // Rango de la hoja Platos: A2:G (7 columnas)
        const PLATES_RANGE = 'Platos!A2:G'; 
        const OPTIONS_RANGE = 'Opciones!A2:E'; 

        const urlPlates = `${BASE_URL}/${PLATES_RANGE}?key=${API_KEY}`;
        const urlOptions = `${BASE_URL}/${OPTIONS_RANGE}?key=${API_KEY}`;

        const platesResponse = await fetch(urlPlates);
        if (!platesResponse.ok) {
            throw new Error(`Error al buscar Platos (HTTP ${platesResponse.status})`);
        }
        const platesData = await platesResponse.json();

        const optionsResponse = await fetch(urlOptions);
        if (!optionsResponse.ok) {
            throw new Error(`Error al buscar Opciones (HTTP ${optionsResponse.status})`);
        }
        const optionsData = await optionsResponse.json();

        const allPlates = platesData.values || [];
        const allOptions = optionsData.values || [];

        // Valor de ID que estamos buscando (siempre string y limpio)
        const rest_id_target = restaurant.id.toString().trim();

        // **CORRECCIÓN FINAL:** Filtramos aplicando toString() y trim() al valor de la hoja antes de comparar
        const platesRows = allPlates.filter(row => 
            (row[1] !== undefined ? row[1].toString().trim() : '') === rest_id_target
        );
        const optionsRows = allOptions.filter(row => 
            (row[1] !== undefined ? row[1].toString().trim() : '') === rest_id_target
        );

        // --- Paso 3: Transformación y Mapeo de Datos (Platos) ---

        const menuByCategory = platesRows.reduce((acc, row) => {
            // [id, rest_id, categoria, nombre, precio, disponible, foto_url] - 7 COLUMNAS
            // Corregimos la desestructuración de la fila para evitar el desfase
            const [
                id, // Columna A
                rest_id_col, // Columna B (Se lee, pero no se usa después de este punto)
                categoria, // Columna C
                nombre, // Columna D
                precio, // Columna E
                disponible, // Columna F
                foto_url    // Columna G
            ] = row;

            const plato = {
                id: parseInt(id),
                nombre,
                // Establecemos la descripción como null/vacío para que Menu.jsx no falle.
                descripcion: null, 
                precio: parseFloat(precio || 0), 
                disponible: disponible === 'SI', 
                foto_url: foto_url || null
            };

            // Agrupar por categoría
            if (!acc[categoria]) {
                acc[categoria] = [];
            }
            acc[categoria].push(plato);

            return acc;
        }, {});
        
        // Transformar el Objeto de Menú a un Array de Categorías
        const menu = Object.entries(menuByCategory).map(([categoria, productos]) => ({
            nombre: categoria,
            productos: productos
        }));


        // --- Paso 4: Transformación y Mapeo de Datos (Opciones) ---

        const optionsList = optionsRows.reduce((acc, row) => {
            const [
                id,
                , // saltar rest_id
                tipo,
                nombre,
                disponible
            ] = row;

            const opcion = {
                id: parseInt(id),
                nombre,
                disponible: disponible === 'SI',
            };

            if (!acc[tipo]) {
                acc[tipo] = [];
            }
            acc[tipo].push(opcion);

            return acc;
        }, {});

        // --- Retorno Final ---
        return {
            restaurant,
            menu, 
            optionsList,
            lastUpdate: new Date().toISOString() 
        };

    } catch (error) {
        console.error('Error en getRestaurantData:', error);
        return null;
    }
}