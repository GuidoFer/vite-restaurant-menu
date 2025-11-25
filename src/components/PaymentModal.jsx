// src/components/PaymentModal.jsx
import React from 'react';
import './css/PaymentModal.css'; // Asegúrate de crear este archivo CSS

/**
 * Modal flotante para mostrar el código QR de pago.
 * @param {string} qrUrl - URL del código QR.
 */
function PaymentModal({ qrUrl }) {
    // Si no hay URL, no se renderiza nada.
    if (!qrUrl) return null; 

    const handleDownload = () => {
        // Simple función para descargar la imagen
        fetch(qrUrl)
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(new Blob([blob]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'codigo_qr_pago.png');
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
            });
    };

    return (
        <div className="payment-modal">
            <div className="payment-content">
                <h3>Opciones de Pago QR</h3>
                <p>Escanea para realizar el pago de tu pedido.</p>
                
                <img src={qrUrl} alt="Código QR de Pago" className="qr-image" />
                
                <button 
                    onClick={handleDownload} 
                    className="download-button"
                >
                    Descargar QR
                </button>
            </div>
        </div>
    );
}

export default PaymentModal;