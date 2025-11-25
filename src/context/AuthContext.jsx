// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Load user from localStorage on mount
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem("user");
        return storedUser ? JSON.parse(storedUser) : null;
    });

    // Login — store in state + localStorage
    const login = (userData) => {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    // Logout — clear session
    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
    };

    // Optional: sync across tabs
    useEffect(() => {
        const syncLogout = (event) => {
            if (event.key === "user" && !event.newValue) {
                setUser(null);
            }
        };
        window.addEventListener("storage", syncLogout);
        return () => window.removeEventListener("storage", syncLogout);
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// ✅ This named export must stay consistent for Fast Refresh
export const useAuthContext = () => useContext(AuthContext);
