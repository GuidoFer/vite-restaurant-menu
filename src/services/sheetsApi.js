// CÓDIGO COMPLETO PARA src/services/sheetsApi.js
// POR FAVOR, COPIA TODO ESTE CONTENIDO Y REEMPLAZA TU ARCHIVO src/services/sheetsApi.js
import { fetchGoogleSheet } from './googleSheets.js';

// Esta función es responsable de leer todas las hojas de cálculo relevantes
// y procesar los datos para determinar la visibilidad, el horario y el menú.
/**
 * Obtiene y procesa todos los datos del menú para un restaurante específico.
 * @param {string} sheetId - El ID de la hoja de cálculo de Google.
 * @param {string} restaurantSlug - El slug del restaurante (ej: 'demo-restaurant').
 * @returns {Promise<Object>} Un objeto con los datos del restaurante o un objeto de error.
 */
export async function getRestaurantData(sheetId, restaurantSlug) {
    if (!sheetId || !restaurantSlug) {
        return { error: 'Sheet ID o Slug de restaurante no proporcionado.' };
    }
    
    try {
        // fetchGoogleSheet es responsable de obtener los datos de todas las hojas:
        // [0:Restaurantes, 1:Platos, 2:Opciones, 3:MenuDia, 4:Visibilidad]
        const sheetData = await fetchGoogleSheet(sheetId);

        // 🚨 CAMBIO 4: Se esperan al menos 5 hojas
        if (!Array.isArray(sheetData) || sheetData.length < 5) { 
             throw new Error('Datos incompletos: fetchGoogleSheet falló o devolvió datos inválidos (se esperaban al menos 5 hojas).');
        }

        // ----------------------------------------------------
        // 1. Procesar Restaurantes (Hoja 0)
        // ----------------------------------------------------
        const restaurantData = sheetData[0] || [];
        const restaurantRow = restaurantData.slice(1).find(row => {
            const slug = row[1]?.toString().toLowerCase().trim();
            return slug === restaurantSlug.toLowerCase().trim();
        });
        
        if (!restaurantRow) {
            throw new Error(`Restaurante '${restaurantSlug}' no encontrado en la Hoja 'Restaurantes'.`);
        }
        
        // Desestructuración de los datos principales del restaurante (A-I)
        const [rawId, nameSlug, nombre, telefono, ubicacion, qr_url, email, tipo_servicio, precio_almuerzo] = restaurantRow;
        const id = rawId?.toString() || ''; 

        // ----------------------------------------------------
        // 2. Procesar Opciones (Hoja 2) - Guarniciones, Presas, Bebidas
        // ----------------------------------------------------
        const opcionesData = sheetData[2] || [];
        // Limpiamos headers de espacios en blanco
        const opcionesHeaders = opcionesData.length ? opcionesData[0].map(h => h.toLowerCase().trim()) : []; 
        const opcionesAgrupadas = {
            presas: [], 
            guarniciones: [],
            bebidas: []
        };
        
        opcionesData.slice(1)
            .filter(row => row[1]?.toString() === id) // Filtrar por rest_id
            .forEach(row => {
                const opcion = {};
                opcionesHeaders.forEach((header, index) => {
                    opcion[header] = row[index];
                });
                
                const tipo = opcion.tipo?.toLowerCase() || '';
                const item = {
                    nombre: opcion.nombre || '',
                    disponible: opcion.disponible?.toLowerCase() === 'si' 
                };
                
                if (tipo === 'guarnicion') {
                    opcionesAgrupadas.guarniciones.push(item);
                } else if (tipo === 'presa') {
                    opcionesAgrupadas.presas.push(item);
                } else if (tipo === 'bebida') {
                    opcionesAgrupadas.bebidas.push(item);
                }
            });

        // ----------------------------------------------------
        // 🚨 CAMBIO 5: Procesar Visibilidad (Hoja 4)
        // ----------------------------------------------------
        // Lee los estados de visibilidad y el horario activo para el restaurante actual.
        const visibilityData = sheetData[4] || []; // Hoja 4
        const visibilityHeaders = visibilityData.length ? visibilityData[0].map(h => h.toLowerCase().trim()) : [];
        const visibilityRow = visibilityData.slice(1).find(row => row[0]?.toString().trim() === id);
        
        let mostrarAlmuerzo = false; 
        let mostrarExtras = false;    
        let horarioActual = 'medio_dia'; // Valor por defecto
        
        if (visibilityRow) {
            const visibilityMap = {};
            visibilityHeaders.forEach((header, index) => {
                visibilityMap[header] = visibilityRow[index];
            });
                
            // Convertir 'Si' a true, cualquier otra cosa a false
            mostrarAlmuerzo = visibilityMap.mostrar_almuerzo?.toLowerCase() === 'si';
            mostrarExtras = visibilityMap.mostrar_extras?.toLowerCase() === 'si';
            // Horario actual, por defecto 'medio_dia' si el valor es inválido o vacío
            // Solo acepta 'noche', cualquier otro valor será 'medio_dia'
            horarioActual = (visibilityMap.horario_actual?.toLowerCase() === 'noche' ? 'noche' : 'medio_dia');
        }

        // ----------------------------------------------------
        // 🚨 CAMBIO 6: Procesar Platos (Hoja 1) - Con Horario
        // ----------------------------------------------------
        // Clasifica todos los platos A La Carta en objetos separados por horario ('medio_dia' / 'noche').
        const platosData = sheetData[1] || [];
        const platosHeaders = platosData.length ? platosData[0].map(h => h.toLowerCase().trim()) : [];
        
        const menuPorHorario = {
            medio_dia: {}, // Contiene Platos Extras para el horario de almuerzo
            noche: {}      // Contiene Platos Extras para el horario de cena/noche
        };
        
        const restIdIndex = platosHeaders.indexOf('rest_id');
        
        platosData.slice(1)
            .filter(row => (row[restIdIndex]?.toString() || '').trim() === id) // Filtrar por rest_id
            .forEach(row => {
                const plato = {};
                platosHeaders.forEach((header, index) => {
                    plato[header] = row[index];
                });
                
                const categoria = plato.categoria?.toLowerCase() || 'otros';
                // La columna 'horario' define cuándo está disponible el plato
                const horario = plato.horario?.toLowerCase() || 'ambos'; 
                const disponible = plato.disponible?.toLowerCase() === 'si';
                
                // Si la columna 'disponible' no es 'si', se ignora el plato
                if (!disponible) return; 

                // --- Clasificación por Horario ---
                
                // 1. Agregar a medio_dia si el horario es 'medio_dia' o 'ambos'
                if (horario === 'medio_dia' || horario === 'ambos') {
                    if (!menuPorHorario.medio_dia[categoria]) {
                        menuPorHorario.medio_dia[categoria] = [];
                    }
                    plato.precio = parseFloat(plato.precio) || 0; 
                    plato.id = plato.id || Math.random().toString(36).substring(7); // Asegurar ID si falta
                    menuPorHorario.medio_dia[categoria].push(plato);
                }
                
                // 2. Agregar a noche si el horario es 'noche' o 'ambos'
                if (horario === 'noche' || horario === 'ambos') {
                    if (!menuPorHorario.noche[categoria]) {
                        menuPorHorario.noche[categoria] = [];
                    }
                    plato.precio = parseFloat(plato.precio) || 0; 
                    plato.id = plato.id || Math.random().toString(36).substring(7); // Asegurar ID si falta
                    menuPorHorario.noche[categoria].push(plato);
                }
            });

        // ----------------------------------------------------
        // 3. Procesar Menu del Día (Hoja 3)
        // ----------------------------------------------------
        const menuDiaData = sheetData[3] || [];
        const menuDiaHeaders = menuDiaData.length ? menuDiaData[0].map(h => h?.toLowerCase().trim() || '') : []; 
        
        // --- CÁLCULO DEL DÍA (Usando 'America/La_Paz' para coincidir con la hora de actualización) ---
        const now = new Date();
        const todayIndex = now.toLocaleDateString('en-US', { timeZone: 'America/La_Paz', weekday: 'long' });                 
        const dayMap = {
            'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
            'thursday': 4, 'friday': 5, 'saturday': 6
        };
        // Obtener el día numérico (0=Domingo, 6=Sábado) para la búsqueda
        const numericDay = dayMap[todayIndex.toLowerCase()] ?? now.getDay(); 
        
        // --- BÚSQUEDA DEL MENU DEL DÍA ---
        const menuDelDiaRow = menuDiaData.slice(1).find(row => {
            // Limpiamos los IDs y días para asegurar la coincidencia
            const itemRestId = (row[0]?.toString() || '').replace(/\s+/g, '').trim(); 
            const itemDia = (row[1]?.toString() || '').replace(/\s+/g, '').trim();    
            const cleanId = (id?.toString() || '').replace(/\s+/g, '').trim();
            
            // Compara el ID del restaurante y el número de día
            return itemRestId === cleanId && itemDia === numericDay.toString(); 
        });

        // --- MAPEO DE RESULTADO ---
        let menuDelDia = null;
        if (menuDelDiaRow) {
            const rowMap = {};
            menuDiaHeaders.forEach((header, index) => {
                rowMap[header] = menuDelDiaRow[index];
            });
            
            menuDelDia = {
                // Mapeo de Sopa y Segundos
                sopa: { nombre: rowMap.sopa || 'No disponible', foto_url: rowMap.foto_sopa || '' },
                segundo_1: { nombre: rowMap.segundo_1 || '', foto_url: rowMap.foto_s1 || '' },
                segundo_2: { nombre: rowMap.segundo_2 || '', foto_url: rowMap.foto_s2 || '' },
                segundo_3: { nombre: rowMap.segundo_3 || '', foto_url: rowMap.foto_s3 || '' },
                postre: { nombre: rowMap.postre || '' },
                
                // Precios (viene de Restaurantes!I para completo, y de MenuDia para sueltos)
                precios: {
                    completo: parseFloat(precio_almuerzo) || 0, 
                    sopa_suelta: parseFloat(rowMap.precio_sopa_suelta) || 0,
                    segundo_suelto: parseFloat(rowMap.precio_segundo_suelto) || 0
                }
            };
        } else {
            console.log('❌ NO se encontró menu del dia para rest_id=' + id + ', dia=' + numericDay);
        }
        
        // ----------------------------------------------------
        // 🚨 CAMBIO 7: Resultado final
        // ----------------------------------------------------
        // Seleccionar el menú de extras según el horario actual definido en la Hoja Visibilidad
        const menuExtras = menuPorHorario[horarioActual] || {};

        return {
            restaurant: { id, nombre, qr_url, ubicacion, telefono, tipo_servicio },
            menuExtras: menuExtras, 
            menuDelDia: menuDelDia,             
            opciones: opcionesAgrupadas,
            lastUpdate: new Date().toLocaleTimeString('es-BO', { timeZone: 'America/La_Paz' }),
            visibilidad: { 
                mostrarAlmuerzo, 
                mostrarExtras, 
                tipo_servicio, 
                horarioActual // Se exporta 'medio_dia' o 'noche'
            }
        };
        
    } catch (error) {
        console.error('Error FATAL en sheetsApi (Procesamiento de datos):', error);
        return { error: error.message || 'Fallo al conectar con la API o error de formato de datos.' };
    }
}