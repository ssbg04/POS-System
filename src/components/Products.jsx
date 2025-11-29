// pages/Products.jsx
import { useState } from "react";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";

const Products = () => {
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const itemsPerPage = 10;

    const { categories, loading: categoriesLoading } = useCategories();
    const { products, loading: productsLoading, error } = useProducts(search, selectedCategory);

    // Sorting function
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Sort products
    const sortedProducts = [...products].sort((a, b) => {
        if (!sortConfig.key) return 0;

        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle nested objects (like categories.name)
        if (sortConfig.key === 'category') {
            aValue = a.category || a.categories?.name || "Uncategorized";
            bValue = b.category || b.categories?.name || "Uncategorized";
        }

        // Handle numeric values
        if (sortConfig.key === 'price' || sortConfig.key === 'stock') {
            aValue = parseFloat(aValue) || 0;
            bValue = parseFloat(bValue) || 0;
        }

        // Handle string values
        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    // Pagination
    const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
    const paginatedProducts = sortedProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
    const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

    // Sort indicator component
    const SortIndicator = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) {
            return <span className="text-muted ms-1">↕</span>;
        }
        return (
            <span className="ms-1">
                {sortConfig.direction === 'asc' ? '↑' : '↓'}
            </span>
        );
    };

    return (
        <div className="d-flex flex-column bg-body text-body" style={{ height: '100vh', overflow: 'hidden' }}>
            {/* Header */}
            <div className="p-3 pb-0">
                <h1 className="h4 mb-3 fw-semibold">Products Management</h1>

                {/* Filters */}
                <div className="d-flex flex-column flex-sm-row gap-2">
                    <input
                        type="text"
                        className="form-control flex-grow-1"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ minWidth: '200px' }}
                    />
                    <select
                        className="form-select flex-shrink-0"
                        style={{ width: "auto", minWidth: "180px" }}
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        {categoriesLoading ? (
                            <option>Loading...</option>
                        ) : (
                            categories.filter(cat => cat !== "all").map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))
                        )}
                    </select>
                </div>
            </div>

            {/* Table Container */}
            <div className="card flex-grow-1 m-3 mt-2 d-flex flex-column overflow-hidden">
                {productsLoading ? (
                    <div className="d-flex justify-content-center align-items-center h-100 p-5">
                        <div className="text-center">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2 mb-0">Loading products...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="d-flex justify-content-center align-items-center h-100 p-5 text-danger">
                        <div className="text-center">
                            <i className="bi bi-exclamation-triangle-fill fs-1"></i>
                            <p className="mt-2 mb-0">Error: {error}</p>
                        </div>
                    </div>
                ) : sortedProducts.length === 0 ? (
                    <div className="d-flex justify-content-center align-items-center h-100 p-5">
                        <div className="text-center">
                            <i className="bi bi-inbox fs-1 text-muted"></i>
                            <p className="mt-2 mb-0">No products found.</p>
                        </div>
                    </div>
                ) : (
                    <div className="table-container  d-flex flex-column flex-grow-1 overflow-hidden">
                        <div className="table-responsive flex-grow-1" style={{
                            overflow: 'auto',
                            maxHeight: '100%'
                        }}>
                            <table className="table table-hover mb-0 align-middle" style={{ minWidth: '100%' }}>
                                <thead className="table-light position-sticky top-0" style={{ zIndex: 1 }}>
                                    <tr>
                                        {/* Name column */}
                                        <th
                                            scope="col"
                                            className="cursor-pointer"
                                            onClick={() => handleSort('name')}
                                            style={{
                                                cursor: 'pointer',
                                                minWidth: '150px',
                                                maxWidth: '200px'
                                            }}
                                        >
                                            <span className="d-none d-sm-inline">Name</span>
                                            <span className="d-inline d-sm-none">Product</span>
                                            <SortIndicator columnKey="name" />
                                        </th>
                                        {/* Barcode column */}
                                        <th
                                            scope="col"
                                            className="cursor-pointer"
                                            onClick={() => handleSort('barcode')}
                                            style={{
                                                cursor: 'pointer',
                                                minWidth: '120px',
                                                maxWidth: '150px'
                                            }}
                                        >
                                            Barcode <SortIndicator columnKey="barcode" />
                                        </th>
                                        {/* Category column */}
                                        <th
                                            scope="col"
                                            className="cursor-pointer"
                                            onClick={() => handleSort('category')}
                                            style={{
                                                cursor: 'pointer',
                                                minWidth: '120px',
                                                maxWidth: '150px'
                                            }}
                                        >
                                            <span className="d-none d-sm-inline">Category</span>
                                            <span className="d-inline d-sm-none">Cat</span>
                                            <SortIndicator columnKey="category" />
                                        </th>
                                        {/* Price column */}
                                        <th
                                            scope="col"
                                            className="cursor-pointer text-nowrap"
                                            onClick={() => handleSort('price')}
                                            style={{
                                                cursor: 'pointer',
                                                minWidth: '100px',
                                                maxWidth: '120px'
                                            }}
                                        >
                                            Price <SortIndicator columnKey="price" />
                                        </th>
                                        {/* Stock column */}
                                        <th
                                            scope="col"
                                            className="cursor-pointer"
                                            onClick={() => handleSort('stock')}
                                            style={{
                                                cursor: 'pointer',
                                                minWidth: '80px',
                                                maxWidth: '100px'
                                            }}
                                        >
                                            Stock <SortIndicator columnKey="stock" />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedProducts.map(product => (
                                        <tr key={product.product_id}>
                                            {/* Name cell */}
                                            <td
                                                className="fw-medium"
                                                style={{
                                                    minWidth: '150px',
                                                    maxWidth: '200px'
                                                }}
                                            >
                                                <div className="text-truncate" title={product.name}>
                                                    {product.name}
                                                </div>
                                            </td>
                                            {/* Barcode cell */}
                                            <td
                                                className="text-muted"
                                                style={{
                                                    minWidth: '120px',
                                                    maxWidth: '150px'
                                                }}
                                            >
                                                <div className="text-truncate" title={product.barcode}>
                                                    {product.barcode || "-"}
                                                </div>
                                            </td>
                                            {/* Category cell */}
                                            <td
                                                style={{
                                                    minWidth: '120px',
                                                    maxWidth: '150px'
                                                }}
                                            >
                                                <span className="badge bg-secondary text-truncate d-inline-block" style={{ maxWidth: '100%' }}>
                                                    {product.category || product.categories?.name || "Uncategorized"}
                                                </span>
                                            </td>
                                            {/* Price cell */}
                                            <td
                                                className="fw-bold text-success text-nowrap"
                                                style={{
                                                    minWidth: '100px',
                                                    maxWidth: '120px'
                                                }}
                                            >
                                                ₱{parseFloat(product.price).toFixed(2)}
                                            </td>
                                            {/* Stock cell */}
                                            <td
                                                style={{
                                                    minWidth: '80px',
                                                    maxWidth: '100px'
                                                }}
                                            >
                                                <span className={`badge ${product.stock > 10 ? 'bg-success' : product.stock > 0 ? 'bg-warning' : 'bg-danger'}`}>
                                                    {product.stock}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {sortedProducts.length > itemsPerPage && (
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center p-3 pt-0 gap-2 border-top">
                    <button
                        className="btn btn-outline-primary order-2 order-sm-1"
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span className="order-1 order-sm-2 text-center">Page {currentPage} of {totalPages}</span>
                    <button
                        className="btn btn-outline-primary order-3"
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default Products;