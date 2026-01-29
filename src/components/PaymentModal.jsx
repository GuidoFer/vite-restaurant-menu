// src/components/PaymentModal.jsx
import React, { useState, useEffect } from 'react';
import './css/PaymentModal.css';

/**
 * Modal flotante para mostrar el código QR de pago.
 */
function PaymentModal({ isOpen, onClose, onPaymentComplete, qrUrl, restaurante, isSubmitting }) {
  const QR_BACKUP = "https://i.ibb.co/b5trLpdS/QR-prueba.jpg";
  
  const [currentQrUrl, setCurrentQrUrl] = useState(QR_BACKUP);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingBackup, setUsingBackup] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      // Si recibimos el qrUrl del restaurante, lo usamos
      if (qrUrl && qrUrl !== '' && !qrUrl.includes('placeholder')) {
        setCurrentQrUrl(qrUrl);
        setUsingBackup(false);
        setError(null);
      } else {
        // Si no hay QR específico, usamos el backup
        setCurrentQrUrl(QR_BACKUP);
        setUsingBackup(true);
        setError('Usando QR de respaldo');
      }
      setLoading(false);
    }
  }, [isOpen, qrUrl]);

  const handleDownload = async () => {
    try {
      const response = await fetch(currentQrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `codigo_qr_${restaurante?.nombre || 'pago'}.png`);
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
                <img src={currentQrUrl} alt="QR de Pago" className="qr-image" />
              </div>

              <div className="payment-info">
                {/* Ahora el titular es dinámico basado en el nombre del restaurante */}
                <p><strong>Banco:</strong> Transferencia QR</p>
                <p><strong>Titular:</strong> {restaurante?.nombre || 'Demo Restaurant'}</p>
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