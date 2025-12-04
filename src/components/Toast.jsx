// src/components/Toast.jsx
import React, { useEffect } from 'react';
import './css/Toast.css';

const Toast = ({ message, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className="toast-container">
            <div className="toast-content">
                <span className="toast-icon">✓</span>
                <span className="toast-message">{message}</span>
            </div>
        </div>
    );
};

export default Toast;