// src/components/PaymentModal.jsx
import React, { useState, useEffect } from 'react';
import './css/PaymentModal.css';

/**
 * Modal flotante para mostrar el código QR de pago.
 */
function PaymentModal({ isOpen, onClose, onPaymentComplete, googleSheetUrl, isSubmitting }) {
  const QR_BACKUP = "https://i.ibb.co/b5trLpdS/QR-prueba.jpg";
  
  const [qrUrl, setQrUrl] = useState(QR_BACKUP);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingBackup, setUsingBackup] = useState(false);

  useEffect(() => {
    if (isOpen && googleSheetUrl) {
      fetchQRFromSheet();
    } else if (isOpen && !googleSheetUrl) {
      setUsingBackup(true);
    }
  }, [isOpen, googleSheetUrl]);

  const fetchQRFromSheet = async () => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(googleSheetUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error('Error al cargar datos del Sheet');
      const data = await response.json();
      const qrFromSheet = data?.restaurante?.qr_url || data?.qr_url;
      if (qrFromSheet && qrFromSheet !== '' && !qrFromSheet.includes('placeholder')) {
        setQrUrl(qrFromSheet);
        setUsingBackup(false);
      } else {
        throw new Error('QR no encontrado en Sheet');
      }
    } catch (err) {
      setQrUrl(QR_BACKUP);
      setUsingBackup(true);
      setError('Usando QR de respaldo');
    } finally {
      setLoading(false);
    }
  };

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
      alert('No se pudo descargar el QR. Intenta con captura de pantalla.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="payment-content">
          <h3>Opciones de Pago</h3>
          
          {loading ? (
            <div className="loading-spinner"><p>Cargando QR...</p></div>
          ) : (
            <>
              <p>Escanea el código QR para realizar el pago de tu pedido.</p>
              
              {usingBackup && (
                <div className="warning-banner">⚠️ Modo sin conexión - QR de respaldo</div>
              )}

              <div className="qr-container">
                <img src={qrUrl} alt="QR de Pago" className="qr-image" />
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
                  disabled={isSubmitting}
                >
                  📥 Descargar QR
                </button>
                
                <button 
                  onClick={() => {
                    if (!isSubmitting && onPaymentComplete) {
                      onPaymentComplete();
                    }
                  }} 
                  className={`continue-button payment-complete-button ${isSubmitting ? 'disabled' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "⏳ Enviando pedido..." : "✅ He Realizado el Pago - Enviar Pedido"}
                </button>
              </div>

              {error && <p className="error-message">{error}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;