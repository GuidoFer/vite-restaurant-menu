// src/services/sheetsApi.js - CÓDIGO COMPLETO
import { fetchGoogleSheet } from './googleSheets.js';

export async function getRestaurantData(sheetId, restaurantSlug) {
    if (!sheetId || !restaurantSlug) {
        return { error: 'Sheet ID o Slug de restaurante no proporcionado.' };
    }
    
    try {
        const sheetData = await fetchGoogleSheet(sheetId);

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
        
        const [rawId, nameSlug, nombre, telefono, ubicacion, qr_url, email, tipo_servicio, precio_almuerzo] = restaurantRow;
        const id = rawId?.toString() || ''; 

        // ----------------------------------------------------
        // 2. Procesar Opciones (Hoja 2)
        // ----------------------------------------------------
        const opcionesData = sheetData[2] || [];
        const opcionesHeaders = opcionesData.length ? opcionesData[0].map(h => h.toLowerCase().trim()) : []; 
        const opcionesAgrupadas = {
            presas: [], 
            guarniciones: [],
            bebidas: []
        };
        
        opcionesData.slice(1)
            .filter(row => row[1]?.toString() === id)
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
        // 3. Procesar Visibilidad (Hoja 4) - CON EXTRAS NOCHE
        // ----------------------------------------------------
        const visibilityData = sheetData[4] || []; 
        const visibilityHeaders = visibilityData.length ? visibilityData[0].map(h => h.toLowerCase().trim()) : [];
        const visibilityRow = visibilityData.slice(1).find(row => row[0]?.toString().trim() === id);
        
        let mostrarAlmuerzo = false; 
        let mostrarExtras = false;
        let mostrarExtrasNoche = false; // NUEVO
        let horarioActual = 'medio_dia';
        
        if (visibilityRow) {
            const visibilityMap = {};
            visibilityHeaders.forEach((header, index) => {
                visibilityMap[header] = visibilityRow[index];
            });
                
            mostrarAlmuerzo = visibilityMap.mostrar_almuerzo?.toLowerCase() === 'si';
            mostrarExtras = visibilityMap.mostrar_extras?.toLowerCase() === 'si';
            mostrarExtrasNoche = visibilityMap.mostrar_extras_noche?.toLowerCase() === 'si'; // NUEVO
            horarioActual = (visibilityMap.horario_actual?.toLowerCase() === 'noche' ? 'noche' : 'medio_dia');
        }

        // ----------------------------------------------------
        // 4. Procesar Platos (Hoja 1) - Con Horario
        // ----------------------------------------------------
        const platosData = sheetData[1] || [];
        const platosHeaders = platosData.length ? platosData[0].map(h => h.toLowerCase().trim()) : [];
        
        const menuPorHorario = {
            medio_dia: {},
            noche: {}
        };
        
        const restIdIndex = platosHeaders.indexOf('rest_id');
        
        platosData.slice(1)
            .filter(row => (row[restIdIndex]?.toString() || '').trim() === id)
            .forEach(row => {
                const plato = {};
                platosHeaders.forEach((header, index) => {
                    plato[header] = row[index];
                });
                
                const categoria = plato.categoria?.toLowerCase() || 'otros';
                const horario = plato.horario?.toLowerCase() || 'ambos'; 
                const disponible = plato.disponible?.toLowerCase() === 'si';
                
                if (!disponible) return; 

                if (horario === 'medio_dia' || horario === 'ambos') {
                    if (!menuPorHorario.medio_dia[categoria]) {
                        menuPorHorario.medio_dia[categoria] = [];
                    }
                    plato.precio = parseFloat(plato.precio) || 0; 
                    plato.id = plato.id || Math.random().toString(36).substring(7);
                    menuPorHorario.medio_dia[categoria].push(plato);
                }
                
                if (horario === 'noche' || horario === 'ambos') {
                    if (!menuPorHorario.noche[categoria]) {
                        menuPorHorario.noche[categoria] = [];
                    }
                    plato.precio = parseFloat(plato.precio) || 0; 
                    plato.id = plato.id || Math.random().toString(36).substring(7);
                    menuPorHorario.noche[categoria].push(plato);
                }
            });

        // ----------------------------------------------------
        // 5. Procesar Menu del Día (Hoja 3)
        // ----------------------------------------------------
        const menuDiaData = sheetData[3] || [];
        const menuDiaHeaders = menuDiaData.length ? menuDiaData[0].map(h => h?.toLowerCase().trim() || '') : []; 
        
        const now = new Date();
        const todayIndex = now.toLocaleDateString('en-US', { timeZone: 'America/La_Paz', weekday: 'long' });                 
        const dayMap = {
            'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
            'thursday': 4, 'friday': 5, 'saturday': 6
        };
        const numericDay = dayMap[todayIndex.toLowerCase()] ?? now.getDay(); 
        
        const menuDelDiaRow = menuDiaData.slice(1).find(row => {
            const itemRestId = (row[0]?.toString() || '').replace(/\s+/g, '').trim(); 
            const itemDia = (row[1]?.toString() || '').replace(/\s+/g, '').trim();    
            const cleanId = (id?.toString() || '').replace(/\s+/g, '').trim();
            
            return itemRestId === cleanId && itemDia === numericDay.toString(); 
        });

        let menuDelDia = null;
        if (menuDelDiaRow) {
            const rowMap = {};
            menuDiaHeaders.forEach((header, index) => {
                rowMap[header] = menuDelDiaRow[index];
            });
            
            menuDelDia = {
                sopa: { nombre: rowMap.sopa || 'No disponible', foto_url: rowMap.foto_sopa || '' },
                segundo_1: { nombre: rowMap.segundo_1 || '', foto_url: rowMap.foto_s1 || '' },
                segundo_2: { nombre: rowMap.segundo_2 || '', foto_url: rowMap.foto_s2 || '' },
                segundo_3: { nombre: rowMap.segundo_3 || '', foto_url: rowMap.foto_s3 || '' },
                postre: { nombre: rowMap.postre || '' },
                
                precios: {
                    completo: parseFloat(precio_almuerzo) || 0, 
                    sopa_suelta: parseFloat(rowMap.precio_sopa_suelta) || 0,
                    segundo_suelto: parseFloat(rowMap.precio_segundo_suelto) || 0
                }
            };
        }
        
        // ----------------------------------------------------
        // 6. RETURN FINAL - CON AMBOS MENÚS SEPARADOS
        // ----------------------------------------------------
        return {
            restaurant: { id, nombre, qr_url, ubicacion, telefono, tipo_servicio },
            menuExtrasDia: menuPorHorario.medio_dia, // SEPARADO
            menuExtrasNoche: menuPorHorario.noche,   // SEPARADO
            menuDelDia: menuDelDia,             
            opciones: opcionesAgrupadas,
            lastUpdate: new Date().toLocaleTimeString('es-BO', { timeZone: 'America/La_Paz' }),
            visibilidad: { 
                mostrarAlmuerzo, 
                mostrarExtras,
                mostrarExtrasNoche, // NUEVO
                tipo_servicio, 
                horarioActual
            }
        };
        
    } catch (error) {
        console.error('Error FATAL en sheetsApi (Procesamiento de datos):', error);
        return { error: error.message || 'Fallo al conectar con la API o error de formato de datos.' };
    }
}