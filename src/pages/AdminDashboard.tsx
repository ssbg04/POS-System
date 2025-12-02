import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  BookOpen,
} from "lucide-react";

// Import separated components
import DashboardHome from "./admin/DashboardHome";
import Products from "./admin/Products";
import Sales from "./admin/Sales";
import Reports from "./admin/Reports";
import Support from "./admin/Support";
import Guide from "./admin/Guide";

const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    { id: "products", label: "Products", icon: <Package size={20} /> },
    { id: "sales", label: "Sales", icon: <ShoppingCart size={20} /> },
    { id: "reports", label: "Reports", icon: <BarChart size={20} /> },
    // { id: "support", label: "Support", icon: <LifeBuoy size={20} /> },
    { id: "guide", label: "System Guide", icon: <BookOpen size={20} /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardHome />;
      case "products":
        return <Products />;
      case "sales":
        return <Sales />;
      case "reports":
        return <Reports />;
      case "support":
        return <Support />;
      case "guide":
        return <Guide />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-slate-900 transition-colors duration-300 flex flex-col md:flex-row overflow-x-hidden">
      {/* Mobile Header with Dropdown */}
      <div className="md:hidden bg-white dark:bg-slate-800 shadow p-4 flex justify-between items-center relative z-20">
        <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <User size={20} className="text-blue-600" />
          <span className="truncate max-w-[150px]">{user?.name}</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 shadow-lg border-t dark:border-slate-700 flex flex-col p-2 animate-in slide-in-from-top-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  activeTab === item.id
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
            <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
            <button
              onClick={logout}
              className="flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-left"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Desktop Sidebar (Collapsible) */}
      <aside
        className={`hidden md:flex flex-col bg-white dark:bg-slate-800 shadow-xl z-10 transition-all duration-300 border-r border-slate-200 dark:border-slate-700 ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 h-16">
          {!isSidebarCollapsed && (
            <span className="font-bold text-xl text-slate-800 dark:text-white truncate">
              AdminPanel
            </span>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 mx-auto md:mx-0"
          >
            {isSidebarCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors group relative ${
                activeTab === item.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              } ${isSidebarCollapsed ? "justify-center" : ""}`}
              title={isSidebarCollapsed ? "" : item.label}
            >
              {item.icon}
              {!isSidebarCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}

              {/* Tooltip for collapsed mode */}
              {isSidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div
            className={`flex items-center gap-3 ${
              isSidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-10 h-10 min-w-[2.5rem] rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <User size={20} />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p
                  className="text-sm font-medium text-slate-800 dark:text-white truncate"
                  title={user?.name}
                >
                  {user?.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">
                  {user?.role}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className={`mt-4 w-full flex items-center gap-2 p-2 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${
              isSidebarCollapsed ? "justify-center" : ""
            }`}
            title="Logout"
          >
            <LogOut size={20} />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-auto h-[calc(100vh-64px)] md:h-screen bg-slate-100 dark:bg-slate-900">
        {/* Desktop Header */}
        <header className="bg-white dark:bg-slate-800 shadow-sm p-6 mb-6 hidden md:flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white capitalize flex items-center gap-2">
            {menuItems.find((i) => i.id === activeTab)?.icon}
            {activeTab}
          </h1>
          <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
            Last login: {new Date().toLocaleDateString()}
          </div>
        </header>

        <div className="p-4 md:p-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 min-h-[500px] p-6 animate-in fade-in duration-500">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
