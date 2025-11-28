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
import { Dropdown } from "react-bootstrap";

const POSHeader = ({ user, onLogout, onSleepMode, isSleepModeActive = false }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [userManuallyExited, setUserManuallyExited] = useState(false);
    const { theme, updateTheme } = useTheme();
    const { settings } = useSettings();

    const isDarkMode =
        theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const fullscreen = !!document.fullscreenElement;
            setIsFullscreen(fullscreen);
            if (!fullscreen && settings?.fullscreen_mode === 'on' && !userManuallyExited) {
                setUserManuallyExited(true);
            }
        };

        if (settings?.fullscreen_mode === 'on' && !userManuallyExited) {
            enterFullscreen();
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [settings, userManuallyExited]);

    const enterFullscreen = () => {
        const el = document.documentElement;
        if (el.requestFullscreen) el.requestFullscreen().catch(console.log);
        setUserManuallyExited(false);
    };

    const exitFullscreen = () => {
        if (document.exitFullscreen) document.exitFullscreen();
        if (settings?.fullscreen_mode === 'on') setUserManuallyExited(true);
    };

    const handleToggleFullscreen = () => {
        isFullscreen ? exitFullscreen() : enterFullscreen();
    };

    const fullscreenButtonIcon = isFullscreen ? <FaCompress className="me-1" /> : <FaExpand className="me-1" />;

    return (
        <header className="navbar bg-body border-bottom py-1 px-2 d-flex justify-content-between align-items-center flex-wrap">
            {/* Brand */}
            <div className="navbar-brand py-0">
                <span className="h5 mb-0 fw-bold text-primary">POS</span>
            </div>

            {/* User / Actions Dropdown */}
            <Dropdown align="end">
                <Dropdown.Toggle variant="secondary" size="sm" className="d-flex align-items-center gap-1">
                    <FaUser size={12} /> <span className="small">{user?.full_name}</span>
                </Dropdown.Toggle>

                <Dropdown.Menu>

                    {/* Fullscreen */}
                    <Dropdown.Item onClick={handleToggleFullscreen}>
                        {fullscreenButtonIcon} Fullscreen
                    </Dropdown.Item>

                    {/* Sleep */}
                    <Dropdown.Item onClick={onSleepMode}>
                        <FaSleep className="me-1" /> Sleep Mode
                    </Dropdown.Item>

                    {/* Theme Submenu */}
                    <Dropdown drop="end" as="div" className="dropdown-submenu">
                        <Dropdown.Toggle as="a" className="dropdown-item d-flex justify-content-between align-items-center">
                            {isDarkMode ? <FaMoon className="me-1" /> : <FaSun className="me-1" />}
                            Theme
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={() => updateTheme("light")}>
                                <FaSun className="me-1" /> Light
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => updateTheme("dark")}>
                                <FaMoon className="me-1" /> Dark
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => updateTheme("system")}>
                                ⚙️ System
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>

                    <Dropdown.Divider />

                    {/* Logout */}
                    <Dropdown.Item className="text-danger" onClick={onLogout}>
                        <FaSignOutAlt className="me-1" /> Logout
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        </header>
    );
};

export default POSHeader;
