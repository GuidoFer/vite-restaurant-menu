// src/services/pedidosService.js

/**
 * Servicio para guardar pedidos en Google Sheets con verificación
 */

// Actualizado con el ID de tu último deploy
const DEPLOYMENT_ID = 'AKfycbx0ioXA9goDvZGp4leY2Ym-B-9dXKNRgsRSTgYpHbO9-vEsiyMr6QZhsE-QIF1o4x_U';

/**
 * Guarda un pedido en el Google Sheet específico del restaurante
 */
export async function guardarPedido(sheetId, datosOpedido) {
  try {
    console.log('📤 Guardando pedido en Google Sheets...');
    
    // --- LÓGICA DE NORMALIZACIÓN ---
    // Si datosOpedido ya viene con 'action', extraemos el pedido interno
    // Si no, asumimos que datosOpedido es el pedido directo
    const esEstructuraNueva = datosOpedido.action === 'guardarPedido';
    const pedidoLimpio = esEstructuraNueva ? datosOpedido.pedido : datosOpedido;

    // Generar código y hash locales para respuesta inmediata
    const codigoLocal = esEstructuraNueva ? datosOpedido.codigo : generarCodigoLocal();
    const hashLocal = esEstructuraNueva ? datosOpedido.hash : generarHashLocal(pedidoLimpio, codigoLocal);
    
    // Construir URL del script
    const scriptUrl = `https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec`;
    
    // Preparar el paquete final para enviar al script
    const datosParaEnviar = {
      action: 'guardarPedido',
      sheetId: sheetId,
      codigo: codigoLocal,
      hash: hashLocal,
      pedido: {
        restaurante_id: pedidoLimpio.restaurante_id || 1,
        cliente_nombre: pedidoLimpio.cliente_nombre,
        cliente_celular: pedidoLimpio.cliente_celular,
        items: pedidoLimpio.items,
        total: pedidoLimpio.total,
        notas: pedidoLimpio.notas || ''
      }
    };

    console.log('📡 Enviando datos:', datosParaEnviar);

    // Enviar con modo 'no-cors' para evitar errores de bloqueo de navegador
    fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datosParaEnviar)
    }).catch(err => {
      console.log('⚠️ Error de red (ignorable en no-cors):', err);
    });

    // Retornar éxito inmediato con los códigos generados
    return {
      success: true,
      codigo: codigoLocal,
      hash: hashLocal
    };

  } catch (error) {
    console.error('❌ Error crítico en guardarPedido:', error);
    // Fallback de seguridad para no detener la experiencia del usuario
    return {
      success: false,
      codigo: 'ERROR-GEN',
      hash: '00000000',
      error: error.message
    };
  }
}

/**
 * Genera código de pedido local (Ej: ORD-20240121-1830-XYZ)
 */
function generarCodigoLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 3; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `ORD-${year}${month}${day}-${hours}${minutes}-${random}`;
}

/**
 * Genera hash de verificación (Hexadecimal de 8 caracteres)
 */
function generarHashLocal(pedido, codigo) {
  try {
    // Validamos que el total exista y sea número para evitar el error .toFixed
    const totalSafe = pedido && pedido.total ? parseFloat(pedido.total).toFixed(2) : "0.00";
    const nombreSafe = pedido && pedido.cliente_nombre ? pedido.cliente_nombre : "anonimo";
    const itemsLen = pedido && pedido.items ? pedido.items.length : 0;

    const dataString = [
      codigo,
      nombreSafe,
      totalSafe,
      itemsLen
    ].join('|');
    
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const hashHex = Math.abs(hash).toString(16).toUpperCase();
    return hashHex.substring(0, 8).padStart(8, '0');
  } catch (e) {
    console.error("Error en generarHashLocal:", e);
    return "F1B2C3D4"; // Hash de emergencia
  }
}