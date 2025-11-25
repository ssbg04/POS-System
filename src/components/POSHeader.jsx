import { useState, useEffect } from 'react';
import {
    FaSun,
    FaMoon,
    FaExpand,
    FaCompress,
    FaUser,
    FaSignOutAlt,
    FaMoon as FaSleep
} from "react-icons/fa";
import { useTheme } from "../hooks/useTheme";
import { useSettings } from "../hooks/useSettings";

const POSHeader = ({
    user,
    onLogout,
    onSleepMode
}) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [userManuallyExited, setUserManuallyExited] = useState(false);
    const { theme, updateTheme } = useTheme();
    const { settings } = useSettings();

    const isDarkMode =
        theme === "dark" ||
        (theme === "system" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);

    // Handle fullscreen based on settings
    useEffect(() => {
        const handleFullscreenChange = () => {
            const fullscreen = !!document.fullscreenElement;
            setIsFullscreen(fullscreen);

            // If user manually exits fullscreen when mode is "on", set flag
            if (!fullscreen && settings?.fullscreen_mode === 'on' && !userManuallyExited) {
                setUserManuallyExited(true);
            }
        };

        // Set initial fullscreen state based on settings
        const fullscreenMode = settings?.fullscreen_mode || 'auto';

        if (fullscreenMode === 'on' && !userManuallyExited) {
            // Only auto-enter fullscreen if user hasn't manually exited
            enterFullscreen();
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [settings, userManuallyExited]);

    const enterFullscreen = () => {
        const element = document.documentElement;
        if (element.requestFullscreen) {
            element.requestFullscreen().catch(err => {
                console.log('Error attempting to enable fullscreen:', err);
            });
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
        setUserManuallyExited(false);
    };

    const exitFullscreen = () => {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }

        // Set flag when user manually exits
        if (settings?.fullscreen_mode === 'on') {
            setUserManuallyExited(true);
        }
    };

    const handleToggleFullscreen = () => {
        const fullscreenMode = settings?.fullscreen_mode || 'auto';

        if (fullscreenMode === 'auto') {
            // Manual toggle for auto mode
            if (isFullscreen) {
                exitFullscreen();
            } else {
                enterFullscreen();
            }
        } else if (fullscreenMode === 'on') {
            // If setting is 'on', toggle between enter and exit
            if (isFullscreen) {
                exitFullscreen();
            } else {
                enterFullscreen();
            }
        } else if (fullscreenMode === 'off') {
            // If setting is 'off', only allow entering (though it might not work)
            enterFullscreen();
        }
    };

    const getFullscreenButtonText = () => {
        const fullscreenMode = settings?.fullscreen_mode || 'auto';

        if (fullscreenMode === 'on') {
            // For "on" mode, show current state since user can toggle
            return isFullscreen
                ? { text: "Exit Fullscreen", icon: <FaCompress className="me-1" /> }
                : { text: "Enter Fullscreen", icon: <FaExpand className="me-1" /> };
        } else if (fullscreenMode === 'off') {
            return { text: "Enter Fullscreen", icon: <FaExpand className="me-1" /> };
        } else {
            // Auto mode
            return isFullscreen
                ? { text: "Exit Fullscreen", icon: <FaCompress className="me-1" /> }
                : { text: "Enter Fullscreen", icon: <FaExpand className="me-1" /> };
        }
    };

    const isFullscreenToggleEnabled = () => {
        const fullscreenMode = settings?.fullscreen_mode || 'auto';

        if (fullscreenMode === 'off') {
            // Can always try to enter fullscreen in "off" mode
            return true;
        }
        // For "on" and "auto" modes, always enabled since user can toggle
        return true;
    };

    const getFullscreenModeDisplay = () => {
        const fullscreenMode = settings?.fullscreen_mode || 'auto';

        switch (fullscreenMode) {
            case 'on':
                return {
                    text: userManuallyExited ? 'Always On (Overridden)' : 'Always On',
                    class: userManuallyExited ? 'text-warning' : 'text-success'
                };
            case 'off':
                return { text: 'Always Off', class: 'text-muted' };
            case 'auto':
                return { text: 'Auto', class: 'text-info' };
            default:
                return { text: 'Auto', class: 'text-info' };
        }
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const fullscreenButtonInfo = getFullscreenButtonText();
    const fullscreenModeInfo = getFullscreenModeDisplay();
    const isToggleEnabled = isFullscreenToggleEnabled();

    return (
        <header className="navbar navbar-expand-lg bg-body border-bottom py-1">
            <div className="container-fluid">

                {/* Brand - Compact */}
                <div className="navbar-brand py-0">
                    <span className="h5 mb-0 fw-bold text-primary">POS</span>
                </div>

                {/* Desktop User Dropdown ONLY */}
                <div className="d-none d-lg-flex align-items-center ms-auto">
                    <div className="dropdown">
                        <button
                            className="btn btn-outline-secondary btn-sm dropdown-toggle d-flex align-items-center gap-1 py-1 px-2"
                            data-bs-toggle="dropdown"
                        >
                            <FaUser size={12} />
                            <span className="small">{user?.full_name}</span>
                        </button>

                        <ul className="dropdown-menu dropdown-menu-end">

                            {/* Desktop: Fullscreen */}
                            <li>
                                <button
                                    className="dropdown-item py-2 small"
                                    onClick={handleToggleFullscreen}
                                    disabled={!isToggleEnabled}
                                >
                                    {fullscreenButtonInfo.icon}
                                    {fullscreenButtonInfo.text}
                                </button>
                            </li>

                            {/* Desktop: Theme Options */}
                            <li>
                                <button
                                    className="dropdown-item py-2 small"
                                    onClick={() => updateTheme(isDarkMode ? "light" : "dark")}
                                >
                                    {isDarkMode ? <FaSun className="me-1" /> : <FaMoon className="me-1" />}
                                    Toggle Theme
                                </button>
                            </li>

                            <li>
                                <button className="dropdown-item py-2 small" onClick={() => updateTheme("system")}>
                                    ⚙️ System
                                </button>
                            </li>

                            <li><hr className="dropdown-divider my-1" /></li>

                            {/* Sleep Mode */}
                            <li>
                                <button className="dropdown-item py-2 small" onClick={onSleepMode}>
                                    <FaSleep className="me-1" />
                                    Sleep Mode
                                </button>
                            </li>

                            <li><hr className="dropdown-divider my-1" /></li>

                            {/* Logout */}
                            <li>
                                <button className="dropdown-item text-danger py-2 small" onClick={onLogout}>
                                    <FaSignOutAlt className="me-1" />
                                    Logout
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Mobile Toggler - Compact */}
                <button
                    className="navbar-toggler d-lg-none border-0 py-1"
                    type="button"
                    onClick={toggleMobileMenu}
                >
                    <span className="navbar-toggler-icon" style={{ width: '1rem', height: '1rem' }}></span>
                </button>

                {/* Mobile Menu */}
                <div className={`collapse navbar-collapse d-lg-none ${isMobileMenuOpen ? "show" : ""}`}>
                    <div className="navbar-nav">

                        {/* Mobile Quick Actions */}
                        <div className="p-2 border-bottom">
                            <div className="d-flex gap-1">
                                <button
                                    onClick={handleToggleFullscreen}
                                    className="btn btn-outline-secondary btn-sm flex-fill py-1"
                                    disabled={!isToggleEnabled}
                                >
                                    {isFullscreen ? <FaCompress size={12} /> : <FaExpand size={12} />}
                                </button>

                                <button
                                    onClick={() =>
                                        updateTheme(isDarkMode ? "light" : "dark")
                                    }
                                    className="btn btn-outline-secondary btn-sm flex-fill py-1"
                                >
                                    {isDarkMode ? <FaSun size={12} /> : <FaMoon size={12} />}
                                </button>

                                <button
                                    onClick={onSleepMode}
                                    className="btn btn-outline-secondary btn-sm flex-fill py-1"
                                >
                                    <FaSleep size={12} />
                                </button>
                            </div>
                        </div>

                        {/* Mobile Theme Options */}
                        <div className="p-2 border-bottom">
                            <small className="text-muted d-block mb-1">THEME</small>
                            <div className="d-flex gap-1">
                                <button
                                    className={`btn btn-sm flex-fill py-1 ${theme === "light" ? "btn-primary" : "btn-outline-secondary"
                                        }`}
                                    onClick={() => updateTheme("light")}
                                >
                                    <span className="small">Light</span>
                                </button>

                                <button
                                    className={`btn btn-sm flex-fill py-1 ${theme === "dark" ? "btn-dark" : "btn-outline-secondary"
                                        }`}
                                    onClick={() => updateTheme("dark")}
                                >
                                    <span className="small">Dark</span>
                                </button>

                                <button
                                    className={`btn btn-sm flex-fill py-1 ${theme === "system" ? "btn-info" : "btn-outline-secondary"
                                        }`}
                                    onClick={() => updateTheme("system")}
                                >
                                    <span className="small">System</span>
                                </button>
                            </div>
                        </div>

                        {/* Fullscreen Mode Info */}
                        <div className="p-2 border-bottom">
                            <small className="text-muted d-block mb-1">FULLSCREEN</small>
                            <div>
                                <small className={fullscreenModeInfo.class}>
                                    {fullscreenModeInfo.text}
                                </small>
                            </div>
                        </div>

                        {/* Mobile User + Logout */}
                        <div className="p-2">
                            <div className="d-flex align-items-center gap-1 mb-2">
                                <FaUser size={12} />
                                <span className="small">{user?.full_name}</span>
                            </div>

                            <button
                                className="btn btn-danger btn-sm w-100 py-1"
                                onClick={onLogout}
                            >
                                <FaSignOutAlt className="me-1" size={12} />
                                <span className="small">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default POSHeader;