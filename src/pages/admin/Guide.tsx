import { useState } from "react";
import {
  Search,
  BookOpen,
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart,
  LifeBuoy,
  Eye,
  RotateCcw,
  Ban,
  Printer,
  AlertTriangle,
} from "lucide-react";

const Guide = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // --- Guide Data ---
  const iconGlossary = [
    {
      icon: <LayoutDashboard size={20} />,
      name: "Dashboard",
      desc: "View real-time stats and alerts.",
    },
    {
      icon: <Package size={20} />,
      name: "Products",
      desc: "Manage inventory and pricing.",
    },
    {
      icon: <ShoppingCart size={20} />,
      name: "Sales/POS",
      desc: "Process transactions.",
    },
    {
      icon: <BarChart size={20} />,
      name: "Reports",
      desc: "View financial analytics.",
    },
    {
      icon: <LifeBuoy size={20} />,
      name: "Support",
      desc: "Submit tickets for system issues.",
    },
    {
      icon: <Eye size={20} className="text-blue-500" />,
      name: "View Details",
      desc: "Open full receipt details.",
    },
    {
      icon: <RotateCcw size={20} className="text-orange-500" />,
      name: "Refund",
      desc: "Return items to stock and refund cash.",
    },
    {
      icon: <Ban size={20} className="text-red-500" />,
      name: "Void",
      desc: "Cancel a transaction (no stock return).",
    },
    {
      icon: <AlertTriangle size={20} className="text-orange-500" />,
      name: "Low Stock",
      desc: "Item quantity is below minimum level.",
    },
  ];

  const guideSections = [
    {
      title: "POS Terminal (Cashier)",
      category: "Operations",
      content: (
        <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
          <li>
            <strong>Adding Items:</strong> Click a product card on the left to
            add it to the cart. Click multiple times to increase quantity.
          </li>
          <li>
            <strong>Searching:</strong> Use the search bar to find products by
            name or category.
          </li>
          <li>
            <strong>Discounts:</strong> Select <em>Senior</em> or <em>PWD</em>{" "}
            from the dropdown to apply a 20% discount and remove VAT.
          </li>
          <li>
            <strong>Payment:</strong> Choose Cash, GCash, Card, or QRPh. Enter
            the amount tendered to calculate change.
          </li>
          <li>
            <strong>Stock Check:</strong> The system prevents adding items if
            inventory is zero.
          </li>
        </ul>
      ),
    },
    {
      title: "Sales Management",
      category: "Admin",
      content: (
        <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
          <li>
            <strong>View History:</strong> Go to the Sales tab to see a list of
            all transactions sorted by date.
          </li>
          <li>
            <strong>Void vs Refund:</strong>
            <ul className="list-circle pl-5 mt-1 text-sm">
              <li>
                <span className="text-red-500 font-bold">Void:</span> Cancels a
                mistake immediately. Does not affect inventory metrics usually,
                but stops revenue counting.
              </li>
              <li>
                <span className="text-orange-500 font-bold">Refund:</span>{" "}
                Returns items. Use this when a customer returns a product. Stock
                is added back.
              </li>
            </ul>
          </li>
          <li>
            <strong>Receipts:</strong> Click the{" "}
            <Eye size={14} className="inline text-blue-500" /> icon to see the
            breakdown of items, tax, and discounts.
          </li>
        </ul>
      ),
    },
    {
      title: "Reports & Analytics",
      category: "Admin",
      content: (
        <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
          <li>
            <strong>Time Filters:</strong> Switch between Today, This Week,
            Month, or Custom Date ranges. Note that charts update automatically.
          </li>
          <li>
            <strong>Printing:</strong> Click the{" "}
            <Printer size={14} className="inline" /> Print button to generate a
            clean, ink-friendly report. The sidebar and buttons will be hidden.
          </li>
          <li>
            <strong>Graphs:</strong>
            <ul className="list-circle pl-5 mt-1 text-sm">
              <li>
                <strong>Sales Trend:</strong> Shows revenue flow over time.
              </li>
              <li>
                <strong>Top Products:</strong> Identifies your best-selling
                items by revenue.
              </li>
            </ul>
          </li>
        </ul>
      ),
    },
    {
      title: "Inventory & Products",
      category: "Admin",
      content: (
        <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
          <li>
            <strong>Stock Levels:</strong> Products show their current quantity.{" "}
            <span className="text-orange-500">Orange borders</span> indicate low
            stock.
          </li>
          <li>
            <strong>Barcodes:</strong> Every product has a unique generated
            barcode visible in the table.
          </li>
          <li>
            <strong>Updates:</strong> Stock is automatically deducted when a
            sale is completed in the POS.
          </li>
        </ul>
      ),
    },
  ];

  // --- Filtering ---
  const filteredSections = guideSections.filter(
    (section) =>
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredIcons = iconGlossary.filter(
    (icon) =>
      icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      icon.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="text-blue-600" /> System Guide
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Documentation and help for using the POS system.
          </p>
        </div>
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search guide (e.g., 'Refund', 'Icons')..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Icon Glossary */}
      {filteredIcons.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-bold text-slate-800 dark:text-white">
              Icon Glossary
            </h3>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIcons.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
              >
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                  {item.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-800 dark:text-white">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 gap-6">
        {filteredSections.map((section, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-blue-50/50 dark:bg-blue-900/10">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {section.title}
              </h3>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                {section.category}
              </span>
            </div>
            <div className="p-6">{section.content}</div>
          </div>
        ))}

        {filteredSections.length === 0 && filteredIcons.length === 0 && (
          <div className="text-center p-10 text-slate-500">
            <p>No results found for "{searchTerm}". Try a different keyword.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Guide;
