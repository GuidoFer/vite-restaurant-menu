// src/services/pedidosService.js

/**
 * Servicio para guardar pedidos en Google Sheets con verificación
 * Soporta arquitectura multi-tenant (cada restaurante tiene su propio Sheet)
 */

const DEPLOYMENT_ID = 'AKfycbxBkdYkjogErnobdVTDZq92JtL8xjbhbmBD5IQLweThf4rjPKdMk8e6RDQZk1rVPVr9';

/**
 * Guarda un pedido en el Google Sheet específico del restaurante
 * @param {string} sheetId - ID del Google Sheet del restaurante
 * @param {Object} pedido - Datos del pedido
 * @returns {Promise<Object>} - Código y hash de verificación
 */
export async function guardarPedido(sheetId, pedido) {
  try {
    console.log('📤 Guardando pedido en Google Sheets...');
    console.log('📊 Sheet ID:', sheetId);
    console.log('📋 Pedido:', pedido);
    
    // Generar código y hash ANTES de enviar
    const codigoLocal = generarCodigoLocal();
    const hashLocal = generarHashLocal(pedido, codigoLocal);
    
    console.log('📋 Código generado:', codigoLocal);
    console.log('🔐 Hash generado:', hashLocal);
    
    // Construir URL del script desplegado
    const scriptUrl = `https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec`;
    
    // Preparar datos del pedido (INCLUIR código y hash generados localmente)
    const datosParaEnviar = {
      action: 'guardarPedido',
      sheetId: sheetId,
      codigo: codigoLocal,  // ← Enviar código generado
      hash: hashLocal,      // ← Enviar hash generado
      pedido: {
        restaurante_id: pedido.restaurante_id || 1,
        cliente_nombre: pedido.cliente_nombre,
        cliente_celular: pedido.cliente_celular,
        items: pedido.items,
        total: pedido.total,
        notas: pedido.notas || ''
      }
    };

    // NUEVO: Enviar con fetch modo 'no-cors' (fire and forget)
    fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors', // Esto evita el preflight OPTIONS
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datosParaEnviar)
    }).catch(err => {
      console.log('⚠️ Error al enviar (pero no bloqueamos):', err);
    });

    console.log('📡 Pedido enviado en segundo plano');
    console.log('✅ Pedido procesado (usando códigos locales)');

    // Retornar inmediatamente con códigos locales
    return {
      success: true,
      codigo: codigoLocal,
      hash: hashLocal
    };

  } catch (error) {
    console.error('❌ Error guardando pedido:', error);
    
    // Fallback: generar código local
    const codigoLocal = generarCodigoLocal();
    const hashLocal = generarHashLocal(pedido, codigoLocal);
    
    console.log('⚠️ Usando códigos de respaldo');
    
    return {
      success: false,
      codigo: codigoLocal,
      hash: hashLocal,
      error: error.message
    };
  }
}

/**
 * Genera código de pedido local
 */
function generarCodigoLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  // Generar 3 caracteres aleatorios
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 3; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `ORD-${year}${month}${day}-${hours}${minutes}-${random}`;
}

/**
 * Genera hash de verificación simple
 */
function generarHashLocal(pedido, codigo) {
  const dataString = [
    codigo,
    pedido.cliente_nombre,
    pedido.total.toFixed(2),
    pedido.items.length
  ].join('|');
  
  // Hash simple usando algoritmo básico
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convertir a hex y tomar primeros 8 caracteres
  const hashHex = Math.abs(hash).toString(16).toUpperCase();
  return hashHex.substring(0, 8).padStart(8, '0');
}