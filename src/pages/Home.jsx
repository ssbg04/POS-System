import { useState, useEffect } from "react";
import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Products from "../components/Products";
import Sales from "../components/Sales";
import Settings from "../components/Settings";
import Inventory from "../components/Inventory";
import Reports from "../components/Reports";
import Dashboard from "../components/Dashboard";

import { FaChevronLeft, FaChevronRight, FaBars } from "react-icons/fa";
import { menuItems } from "../components/menuItems";
import { LogoutIcon } from "../components/Icons";

const Home = () => {
    const { user, logout } = useAuthContext();
    const navigate = useNavigate();
    const [activeMenu, setActiveMenu] = useState("dashboard");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const renderContent = () => {
        switch (activeMenu) {
            case "inventory": return <Inventory />;
            case "products": return <Products />;
            case "reports": return <Reports />;
            case "sales": return <Sales />;
            case "settings": return <Settings />;
            default: return <Dashboard />;
        }
    };

    // Detect screen resize
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setIsMobile(width < 768);
            setIsTablet(width >= 768 && width < 1024);

            // Auto-close mobile sidebar on resize to larger screens
            if (width >= 768 && mobileOpen) {
                setMobileOpen(false);
            }

            // Only auto-collapse on tablet if not already manually set
            if (width >= 768 && width < 1024 && !sidebarCollapsed) {
                setSidebarCollapsed(true);
            }
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => window.removeEventListener("resize", handleResize);
    }, [mobileOpen]);

    const handleMenuClick = (menuId) => {
        setActiveMenu(menuId);
        if (isMobile) setMobileOpen(false);
    };

    const handleSidebarToggle = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    const getSidebarWidth = () => {
        if (isMobile) return "w-64";
        if (sidebarCollapsed) return "w-16";
        if (isTablet) return "w-20";
        return "w-64";
    };

    const getJustifyContent = () => {
        if (isMobile) return "start";
        if (sidebarCollapsed) return "center";
        return "start";
    };

    const sidebarClass = `
    d-flex flex-column bg-body-secondary transition-all overflow-hidden 
    ${getSidebarWidth()} 
    ${isMobile
            ? "position-fixed top-16 left-0 h-[calc(100%-4rem)] z-20" // <- start below header
            : "position-fixed top-0 left-0 h-100 z-10"
        }
    ${mobileOpen ? "translate-x-0" : isMobile ? "-translate-x-full" : ""}
`;


    const sidebarPixelWidth = () => {
        if (isMobile) return 0;
        if (sidebarCollapsed) return 64;   // 16 * 4px
        if (isTablet) return 80;           // 20 * 4px
        return 256;                        // 64 * 4px
    };



    return (
        <div className="d-flex h-screen overflow-hidden bg-body text-body">

            {/* Mobile Header */}
            {isMobile && (
                <div className="position-fixed top-0 left-0 right-0 h-16 bg-body-secondary z-20 d-flex align-items-center px-3 border-bottom">
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="btn btn-outline-secondary border-0 text-body"
                        aria-label="Toggle menu"
                    >
                        <FaBars size={20} />
                    </button>
                    <h1 className="ms-3 mb-0 fs-5 fw-bold text-body">
                        {menuItems.find(item => item.id === activeMenu)?.label || "Dashboard"}
                    </h1>
                </div>
            )}

            {/* Sidebar */}
            <div className={sidebarClass}>
                {!isMobile && (
                    <div className="p-3 d-flex justify-content-end">
                        <button
                            onClick={handleSidebarToggle}
                            className="btn btn-outline-secondary border-0 text-body transition-all"
                            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                            aria-label={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            {sidebarCollapsed ? <FaChevronRight size={16} /> : <FaChevronLeft size={16} />}
                        </button>
                    </div>
                )}

                {/* Menu Items */}
                <nav className="flex-column flex-grow-1 overflow-auto py-2 px-2">
                    {menuItems.map((item) => {
                        const isActive = activeMenu === item.id;
                        const justifyContent = getJustifyContent();

                        return (
                            <div key={item.id} className="mb-2">
                                <button
                                    onClick={() => handleMenuClick(item.id)}
                                    className={`w-100 d-flex align-items-center justify-content-${justifyContent} py-3 px-3 text-start transition-colors
                                        ${isActive
                                            ? "bg-primary text-white shadow-sm"
                                            : "text-body-emphasis hover:bg-body-tertiary hover:text-body-primary"
                                        }`}
                                    style={{
                                        borderRadius: "0.25rem", // minimal rounding
                                        transition: "all 0.2s ease",
                                    }}


                                    title={sidebarCollapsed ? item.label : ""}
                                >
                                    <item.icon
                                        size={20}
                                        className={`${isActive ? "text-white" : "text-primary"}`}
                                    />
                                    {(!sidebarCollapsed || isMobile) && (
                                        <span className="ms-3 fw-medium">{item.label}</span>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </nav>

                {/* User Info & Logout */}
                <div className="p-3 border-top border-secondary">
                    {user && !sidebarCollapsed && !isMobile && (
                        <div className="mb-3 text-center">
                            <div className="fw-medium text-truncate">{user.name || user.email}</div>
                            <small className="text-muted">{user.role}</small>
                        </div>
                    )}

                    <div
                        onClick={handleLogout}
                        className="d-flex align-items-center justify-content-center cursor-pointer text-danger hover-bg-danger hover-bg-opacity-10 transition-all"
                        style={{
                            width: sidebarCollapsed && !isMobile ? "48px" : "60px",
                            height: "48px",
                            borderRadius: "0.75rem",
                            transition: "all 0.2s ease",
                            margin: "0 auto"
                        }}
                        title="Logout"
                    >
                        <LogoutIcon size={sidebarCollapsed && !isMobile ? 24 : 28} />
                    </div>
                </div>
            </div>

            {/* Overlay for mobile */}
            {isMobile && mobileOpen && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 bg-black opacity-50 z-5"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Main Content */}
            <div
                className="flex-1 d-flex flex-column min-vw-0"
                style={{
                    marginLeft: isMobile ? 0 : sidebarPixelWidth(),
                    marginTop: isMobile ? "4rem" : 0
                }}
            >

                <main className="flex-grow-1 d-flex flex-column overflow-hidden">
                    {/* Content Header for Tablet/Desktop */}
                    {!isMobile && (
                        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                            <h1 className="h3 mb-0 fw-bold text-body">
                                {menuItems.find(item => item.id === activeMenu)?.label || "Dashboard"}
                            </h1>
                        </div>
                    )}

                    {/* Scrollable Content Area */}
                    <div className="flex-grow-1 overflow-auto position-relative">
                        <div className="h-100 overflow-auto">
                            {renderContent()}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Home;