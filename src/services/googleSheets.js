// src/services/googleSheets.js
// 🚨 CRÍTICO: Reemplaza con la URL de ejecución de tu script de Google Apps Script
const GOOGLE_SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbxCIg_qwgEZquhKRE72d7pdwTCgvUxp5KQMKnKB2FgKkE4FPzqbV-JPjHHA9mAD19bW/exec'; 

/**
 * Obtiene todos los datos de las hojas de Google Sheets.
 * @param {string} sheetId - El ID de la hoja de cálculo de Google.
 */
export async function fetchGoogleSheet(sheetId) {
    if (!sheetId) {
        return null;
    }

    try {
        const url = `${GOOGLE_SHEETS_API_URL}?sheetId=${sheetId}`;
        console.log(`Intentando conectar a la API con la URL: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Fallo en la respuesta de la red: ${response.status} ${response.statusText}`);
        }

        const rawText = await response.text(); 
        let data;

        try {
            // Intenta parsear el JSON
            data = JSON.parse(rawText);
        } catch (jsonError) {
            console.error('ERROR DE PARSING JSON: La respuesta no es JSON válido.', rawText);
            throw new Error('La respuesta de la API no es JSON válido.');
        }

        if (data.error) {
            throw new Error(`Error de la API: ${data.error}`);
        }

        // Retorna el array de hojas
        return data.data; 

    } catch (error) {
        console.error('Error final en fetchGoogleSheet:', error);
        return null;
    }
}