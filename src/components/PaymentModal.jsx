// src/components/PaymentModal.jsx
import React, { useState, useEffect } from 'react';
import './css/PaymentModal.css';

/**
 * Modal flotante para mostrar el código QR de pago.
 * Implementación híbrida: intenta leer del Sheet, usa backup si falla.
 * 
 * @param {boolean} isOpen - Controla si el modal está visible
 * @param {function} onClose - Función para cerrar el modal
 * @param {function} onPaymentComplete - Función que se ejecuta al confirmar pago
 * @param {string} googleSheetUrl - URL del Google Sheet (opcional)
 */
function PaymentModal({ isOpen, onClose, onPaymentComplete, googleSheetUrl }) {
  // URL HARDCODEADA - BACKUP (siempre funciona sin conexión)
  const QR_BACKUP = "https://i.ibb.co/b5trLpdS/QR-prueba.jpg";
  
  const [qrUrl, setQrUrl] = useState(QR_BACKUP);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingBackup, setUsingBackup] = useState(false);

  // Intentar cargar QR desde Google Sheet al abrir el modal
  useEffect(() => {
    if (isOpen && googleSheetUrl) {
      fetchQRFromSheet();
    } else if (isOpen && !googleSheetUrl) {
      // Si no hay URL del sheet, usar backup inmediatamente
      setUsingBackup(true);
    }
  }, [isOpen, googleSheetUrl]);

  /**
   * Intenta obtener la URL del QR desde Google Sheet
   */
  const fetchQRFromSheet = async () => {
    setLoading(true);
    setError(null);

    try {
      // Timeout de 5 segundos para evitar esperas largas
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(googleSheetUrl, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Error al cargar datos del Sheet');
      }

      const data = await response.json();
      
      // Buscar el QR en la respuesta (ajusta según tu estructura de datos)
      const qrFromSheet = data?.restaurante?.qr_url || data?.qr_url;

      if (qrFromSheet && qrFromSheet !== '' && !qrFromSheet.includes('placeholder')) {
        setQrUrl(qrFromSheet);
        setUsingBackup(false);
        console.log('✅ QR cargado desde Google Sheet');
      } else {
        throw new Error('QR no encontrado en Sheet');
      }

    } catch (err) {
      console.warn('⚠️ No se pudo cargar QR del Sheet, usando backup:', err.message);
      setQrUrl(QR_BACKUP);
      setUsingBackup(true);
      setError('Usando QR de respaldo (sin conexión)');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Descarga la imagen del QR
   */
  const handleDownload = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'codigo_qr_pago.png');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar QR:', err);
      alert('No se pudo descargar el QR. Intenta con captura de pantalla.');
    }
  };

  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="payment-content">
          <h3>Opciones de Pago</h3>
          
          {loading ? (
            <div className="loading-spinner">
              <p>Cargando QR...</p>
            </div>
          ) : (
            <>
              <p>Escanea el código QR para realizar el pago de tu pedido.</p>
              
              {usingBackup && (
                <div className="warning-banner">
                  ⚠️ Modo sin conexión - Usando QR de respaldo
                </div>
              )}

              <div className="qr-container">
                <img 
                  src={qrUrl} 
                  alt="Código QR de Pago" 
                  className="qr-image"
                  onError={() => {
                    console.error('Error al cargar imagen del QR');
                    setQrUrl(QR_BACKUP);
                    setUsingBackup(true);
                  }}
                />
              </div>

              <div className="payment-info">
                <p><strong>Banco:</strong> Banco Nacional</p>
                <p><strong>Titular:</strong> Demo Restaurant</p>
                <p className="info-note">Envía el comprobante al confirmar</p>
              </div>

              <div className="button-group">
                <button 
                  onClick={handleDownload} 
                  className="download-button"
                >
                  📥 Descargar QR
                </button>
                
                <button 
                  onClick={() => {
                    if (onPaymentComplete) {
                      onPaymentComplete();
                    } else {
                      onClose();
                    }
                  }} 
                  className="continue-button payment-complete-button"
                >
                  ✅ He Realizado el Pago - Enviar Pedido
                </button>
              </div>

              {error && (
                <p className="error-message">{error}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;