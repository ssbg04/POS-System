// components/SleepMode.jsx
import React, { useState, useEffect, useCallback } from "react";

const SleepMode = ({
    isActive = false,
    onActivate,
    onDeactivate,
    timeoutDuration = 300000, // 5 minutes default
    showOverlay = true
}) => {
    const [timeoutId, setTimeoutId] = useState(null);
    const [isSleepMode, setIsSleepMode] = useState(isActive);
    const [countdown, setCountdown] = useState(null);

    // Reset sleep mode timer
    const resetTimer = useCallback(() => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(null);
        }

        if (isSleepMode) {
            handleDeactivate();
            return;
        }

        const id = setTimeout(() => {
            handleActivate();
        }, timeoutDuration);

        setTimeoutId(id);
    }, [timeoutDuration, isSleepMode]);

    // Handle user activity
    const handleUserActivity = useCallback(() => {
        resetTimer();
    }, [resetTimer]);

    // Activate sleep mode
    const handleActivate = () => {
        setIsSleepMode(true);
        setCountdown(null);
        if (onActivate) onActivate();
    };

    // Deactivate sleep mode
    const handleDeactivate = () => {
        setIsSleepMode(false);
        setCountdown(null);
        if (onDeactivate) onDeactivate();
        resetTimer(); // Restart the timer
    };

    // Start countdown before sleep mode
    const startCountdown = useCallback(() => {
        let seconds = 10; // 10 second countdown
        setCountdown(seconds);

        const countdownInterval = setInterval(() => {
            seconds -= 1;
            setCountdown(seconds);

            if (seconds <= 0) {
                clearInterval(countdownInterval);
                handleActivate();
            }
        }, 1000);

        return countdownInterval;
    }, []);

    // Set up event listeners for user activity
    useEffect(() => {
        const events = [
            'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click',
            'keydown', 'wheel', 'touchmove'
        ];

        events.forEach(event => {
            document.addEventListener(event, handleUserActivity, { passive: true });
        });

        // Initial timer setup
        resetTimer();

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleUserActivity);
            });
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [handleUserActivity, resetTimer]);

    // Manual activation/deactivation
    const toggleSleepMode = () => {
        if (isSleepMode) {
            handleDeactivate();
        } else {
            startCountdown();
        }
    };

    // Handle overlay click to wake up
    const handleOverlayClick = () => {
        handleDeactivate();
    };

    // If not active and no countdown, don't render anything
    if (!isSleepMode && !countdown) {
        return null;
    }

    return (
        <>
            {/* Countdown Overlay */}
            {countdown && (
                <div className="sleep-mode-overlay countdown-overlay d-flex align-items-center justify-content-center">
                    <div className="sleep-mode-content text-center text-white">
                        <div className="sleep-mode-icon mb-4">
                            <i className="bi bi-moon display-1"></i>
                        </div>
                        <h2 className="mb-3">Sleep Mode Activating</h2>
                        <div className="countdown-display mb-4">
                            <div className="countdown-number display-1 fw-bold">
                                {countdown}
                            </div>
                            <div className="countdown-label">seconds</div>
                        </div>
                        <p className="lead mb-4">
                            Touch screen or press any key to cancel
                        </p>
                        <button
                            className="btn btn-light btn-lg px-4"
                            onClick={handleDeactivate}
                        >
                            Cancel Sleep Mode
                        </button>
                    </div>
                </div>
            )}

            {/* Sleep Mode Overlay */}
            {isSleepMode && showOverlay && (
                <div
                    className="sleep-mode-overlay d-flex align-items-center justify-content-center"
                    onClick={handleOverlayClick}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="sleep-mode-content text-center text-white">
                        <div className="sleep-mode-icon mb-4">
                            <i className="bi bi-moon-stars display-1"></i>
                        </div>
                        <h1 className="display-4 fw-bold mb-3">Sleep Mode</h1>
                        <p className="lead mb-4">
                            Touch screen or press any key to wake up
                        </p>
                        <div className="sleep-mode-info">
                            <div className="current-time display-6 fw-light mb-2">
                                {new Date().toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                            <div className="current-date fs-5 opacity-75">
                                {new Date().toLocaleDateString([], {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>
                        </div>
                        <div className="sleep-mode-footer mt-5">
                            <small className="opacity-50">
                                {user?.store_name || 'POS System'} - Ready to serve
                            </small>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SleepMode;