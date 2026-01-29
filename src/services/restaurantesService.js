// src/services/restaurantesService.js

const CONTROL_SHEET_ID = '1JIiS5ZFvgrLKrsYcag9FclwA30i7HBhxiSdAeEwIghY';

// ⚠️ REEMPLAZA ESTE ID con el nuevo que te dé Google al "Implementar" el script corregido
const DEPLOYMENT_ID = 'AKfycbwn10DGmEntPVk-ojtj4q3WH4cy_BnF7RiCJ0dHvOnZnfeyQtsAe-5fi_yKOyfIMO0';

/**
 * Busca un restaurante en la hoja maestra utilizando su slug amigable.
 * Ahora el script de Google hace el trabajo pesado y devuelve el resultado directo.
 */
export async function getRestaurantBySlug(slug) {
  try {
    // Construimos la URL enviando el parámetro slug al script
    const scriptUrl = `https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec`;
    const url = `${scriptUrl}?sheetId=${CONTROL_SHEET_ID}&slug=${slug}`;
    
    console.log(`🌐 Consultando restaurante: ${slug}`);
    
    const response = await fetch(url);
    const result = await response.json();
    
    // Si el script de Google devuelve un error (ej: slug no encontrado)
    if (result.error) {
      throw new Error(result.error);
    }

    // Retornamos los datos que el script ya filtró por nosotros
    return {
      sheetId: result.sheetId,
      nombre: result.nombre || 'Restaurante',
      // Agregamos valores por defecto si el script no los envía aún
      telefono: result.telefono || '',
      ubicacion: result.ubicacion || '',
      qr_url: result.qr_url || ''
    };

  } catch (error) {
    console.error('❌ Error en restaurantesService:', error.message);
    throw error;
  }
}