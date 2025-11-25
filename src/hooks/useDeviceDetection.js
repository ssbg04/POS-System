// hooks/useDeviceDetection.js
import { useState, useEffect } from 'react';

export const useDeviceDetection = () => {
    const [deviceType, setDeviceType] = useState("desktop");
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const width = window.innerWidth;
        if (width <= 768) setDeviceType("mobile");
        else if (width <= 1024) setDeviceType("tablet");
        else setDeviceType("desktop");

        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    return { deviceType, isFullscreen, toggleFullscreen };
};