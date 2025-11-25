import { useState, useEffect } from "react";

export const useTheme = () => {
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "system");

    const applyTheme = (mode) => {
        const html = document.documentElement;

        // Tailwind dark mode
        if (mode === "dark") {
            html.classList.add("dark");
        } else {
            html.classList.remove("dark");
        }

        // Bootstrap 5 theme
        if (mode === "light" || mode === "dark") {
            html.setAttribute("data-bs-theme", mode);
        } else {
            const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            html.setAttribute("data-bs-theme", systemPrefersDark ? "dark" : "light");
        }
    };

    const updateTheme = (mode) => {
        setTheme(mode);
        localStorage.setItem("theme", mode);
        applyTheme(mode);
    };

    useEffect(() => {
        applyTheme(theme);
    }, []);

    useEffect(() => {
        if (theme !== "system") return;

        const listener = () => {
            applyTheme("system");
        };

        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        mq.addEventListener("change", listener);

        return () => mq.removeEventListener("change", listener);
    }, [theme]);

    return { theme, updateTheme };
};
