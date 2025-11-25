import { useState, useRef, useEffect } from "react";
import { useTheme } from "../hooks/useTheme";
import { IoSettingsSharp } from "react-icons/io5";

const ThemeSwitcherFloating = () => {
    const { theme, updateTheme } = useTheme();
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div
            ref={containerRef}
            className="position-fixed"
            style={{ top: "20px", right: "20px", zIndex: 9999 }}
        >
            {/* Floating Button */}
            <button
                className="btn btn-secondary rounded-circle shadow"
                style={{ width: 50, height: 50 }}
                onClick={() => setOpen(!open)}
            >
                <IoSettingsSharp size={22} />
            </button>

            {/* Dropdown Menu */}
            {open && (
                <div
                    className="card shadow"
                    style={{
                        width: "150px",
                        borderRadius: "10px",
                        position: "absolute",
                        top: "60px", // below the button
                        right: 0,
                    }}
                >
                    <div className="list-group list-group-flush">
                        <button
                            className={`list-group-item list-group-item-action ${theme === "light" ? "active" : ""
                                }`}
                            onClick={() => updateTheme("light")}
                        >
                            Light
                        </button>

                        <button
                            className={`list-group-item list-group-item-action ${theme === "dark" ? "active" : ""
                                }`}
                            onClick={() => updateTheme("dark")}
                        >
                            Dark
                        </button>

                        <button
                            className={`list-group-item list-group-item-action ${theme === "system" ? "active" : ""
                                }`}
                            onClick={() => updateTheme("system")}
                        >
                            System
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThemeSwitcherFloating;
