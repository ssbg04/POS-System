import { useState, useEffect } from "react";
import { Search, Filter, Loader, AlertCircle, ScanBarcode } from "lucide-react";
import { getProducts, type Product } from "../../services/ims/product";

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getProducts();
        if (isMounted) setProducts(data);
      } catch (err) {
        if (isMounted)
          setError("Failed to load products. Please check your connection.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter Logic
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Unique Categories
  const categories = [
    "All",
    ...Array.from(new Set(products.map((p) => p.category))).filter(Boolean),
  ];

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center p-10 h-64">
        <Loader className="animate-spin text-blue-600 mb-2" size={32} />
        <p className="text-slate-500 dark:text-slate-400">
          Loading inventory...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center p-10 h-64 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900">
        <AlertCircle size={32} className="mb-2" />
        <p className="font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded shadow text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div>
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Product Management
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Manage inventory levels and prices
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-blue-500 w-full sm:w-48 appearance-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Barcode
                </th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Name
                </th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Category
                </th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Price
                </th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Stock
                </th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Sold
                </th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => (
                  <tr
                    key={product.id || index}
                    className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono text-xs">
                        <ScanBarcode size={16} />
                        {product.barcode}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-800 dark:text-white">
                      {product.name}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">
                        {product.category}
                      </span>
                    </td>
                    <td className="p-4 text-slate-800 dark:text-slate-300">
                      ₱{product.price}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            product.quantity <= product.minQuantity
                              ? "text-red-500"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {product.quantity}
                        </span>
                        {product.quantity <= product.minQuantity && (
                          <span className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">
                            Low
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      {product.sold}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.status === "Active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-slate-500 dark:text-slate-400"
                  >
                    No products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Products;
