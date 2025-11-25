// components/Numpad.jsx
import React from 'react';
import { useTheme } from "../hooks/useTheme";

const Numpad = ({ numpadValue, onInput, onApply, onClose }) => {
    const { theme } = useTheme();
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const numbers = [
        { value: '1', label: '1' },
        { value: '2', label: '2' },
        { value: '3', label: '3' },
        { value: '4', label: '4' },
        { value: '5', label: '5' },
        { value: '6', label: '6' },
        { value: '7', label: '7' },
        { value: '8', label: '8' },
        { value: '9', label: '9' },
        { value: '.', label: '.' },
        { value: '0', label: '0' },
        { value: 'clear', label: 'C', variant: 'warning' }
    ];

    const handleInput = (input) => {
        onInput(input);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={handleBackdropClick}
        >
            <div className="modal-dialog modal-dialog-centered">
                <div className={`modal-content ${isDarkMode ? 'bg-dark text-light' : ''}`}>
                    {/* Header */}
                    <div className={`modal-header ${isDarkMode ? 'border-secondary' : ''}`}>
                        <h5 className="modal-title fw-semibold">
                            Enter Amount
                        </h5>
                        <button
                            type="button"
                            className={`btn-close ${isDarkMode ? 'btn-close-white' : ''}`}
                            onClick={onClose}
                            aria-label="Close"
                        />
                    </div>

                    {/* Display */}
                    <div className="modal-body">
                        <div className="text-center mb-4">
                            <div
                                className={`form-control fs-3 fw-bold font-monospace text-center ${isDarkMode ? 'bg-dark text-light border-secondary' : ''
                                    }`}
                                style={{
                                    minHeight: '70px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                ₱{numpadValue || '0'}
                            </div>
                        </div>

                        {/* Number Grid */}
                        <div className="row g-2 mb-3">
                            {numbers.map((num) => (
                                <div key={num.value} className="col-4">
                                    <button
                                        type="button"
                                        className={`btn w-100 py-3 fw-bold ${num.variant === 'warning'
                                                ? 'btn-warning'
                                                : isDarkMode
                                                    ? 'btn-outline-light'
                                                    : 'btn-outline-dark'
                                            } numpad-btn`}
                                        onClick={() => handleInput(num.value)}
                                    >
                                        {num.label}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="row g-2">
                            <div className="col-6">
                                <button
                                    type="button"
                                    className={`btn w-100 py-3 fw-semibold ${isDarkMode ? 'btn-outline-danger' : 'btn-outline-danger'
                                        }`}
                                    onClick={() => handleInput('backspace')}
                                >
                                    <i className="bi bi-backspace me-2"></i>
                                    Backspace
                                </button>
                            </div>
                            <div className="col-6">
                                <button
                                    type="button"
                                    className="btn btn-success w-100 py-3 fw-semibold"
                                    onClick={onApply}
                                >
                                    <i className="bi bi-check-lg me-2"></i>
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={`modal-footer ${isDarkMode ? 'border-secondary' : ''}`}>
                        <button
                            type="button"
                            className={`btn ${isDarkMode ? 'btn-outline-light' : 'btn-outline-secondary'}`}
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Numpad;