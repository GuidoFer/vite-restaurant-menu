// src/services/pedidosService.js

const DEPLOYMENT_ID = 'AKfycbxCIg_qwgEZquhKRE72d7pdwTCgvUxp5KQMKnKB2FgKkE4FPzqbV-JPjHHA9mAD19bW';

export async function guardarPedido(sheetId, datosOpedido) {
  try {
    console.log('📤 Guardando pedido en Google Sheets...');
    
    const esEstructuraNueva = datosOpedido.action === 'guardarPedido';
    const pedidoLimpio = esEstructuraNueva ? datosOpedido.pedido : datosOpedido;

    const codigoLocal = esEstructuraNueva ? datosOpedido.codigo : generarCodigoLocal();
    const hashLocal = esEstructuraNueva ? datosOpedido.hash : generarHashLocal(pedidoLimpio, codigoLocal);
    
    const scriptUrl = `https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec`;
    
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

    // ✅ CAMBIO: Quitar no-cors y usar text/plain
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(datosParaEnviar)
    });

    const resultado = await response.json();
    console.log('✅ Respuesta completa:', resultado);

    return {
      success: resultado.success || true,
      codigo: resultado.codigo || codigoLocal,
      hash: resultado.hash || hashLocal,
      nro_pedido: resultado.nro_pedido || '---'
    };

  } catch (error) {
    console.error('❌ Error:', error);
    return {
      success: false,
      codigo: 'ERROR-GEN',
      hash: '00000000',
      nro_pedido: '---',
      error: error.message
    };
  }
}

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

function generarHashLocal(pedido, codigo) {
  try {
    const totalSafe = pedido && pedido.total ? parseFloat(pedido.total).toFixed(2) : "0.00";
    const nombreSafe = pedido && pedido.cliente_nombre ? pedido.cliente_nombre : "anonimo";
    const itemsLen = pedido && pedido.items ? pedido.items.length : 0;

    const dataString = [codigo, nombreSafe, totalSafe, itemsLen].join('|');
    
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
    return "F1B2C3D4";
  }
}