import { useState } from "react";
import { FaSearch, FaBarcode, FaTags, FaExclamationTriangle } from "react-icons/fa";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";

const ProductsPanel = ({ deviceType, onAddToCart }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");

    const { categories, loading: categoriesLoading } = useCategories();
    const { products, loading: productsLoading } = useProducts(searchTerm, selectedCategory);

    // Get theme from data-bs-theme attribute
    const getCurrentTheme = () => {
        if (typeof document !== 'undefined') {
            return document.documentElement.getAttribute('data-bs-theme') || 'light';
        }
        return 'light';
    };

    const isDarkMode = getCurrentTheme() === 'dark';

    return (
        <div className="card h-100">
            {/* Header */}
            <div className="card-header border-bottom">
                <div className="d-flex align-items-center">
                    <FaTags className="text-primary me-2" />
                    <h5 className="card-title mb-0 fw-semibold">Products</h5>
                    {!productsLoading && (
                        <span className="badge bg-primary ms-2">
                            {products.length}
                        </span>
                    )}
                </div>
            </div>

            <div className="card-body d-flex flex-column p-3">
                {/* Search & Filter Controls */}
                <div className="row g-2 mb-3">
                    {/* Search Input */}
                    <div className="col-12 col-md-8">
                        <div className="input-group input-group-sm">
                            <span className="input-group-text">
                                <FaSearch />
                            </span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search products by name or barcode..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="col-12 col-md-4">
                        <div className="input-group input-group-sm">
                            <span className="input-group-text">
                                <FaTags />
                            </span>
                            <select
                                className="form-select"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="all">All Categories</option>
                                {categories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="flex-grow-1 overflow-hidden">
                    {productsLoading && products.length === 0 ? (
                        // Loading Skeleton
                        <div className={`row ${getGridClass()} g-2`}>
                            {Array.from({ length: 8 }).map((_, index) => (
                                <div key={index} className="col">
                                    <div className="card placeholder-glow">
                                        <div className="card-body p-2">
                                            <div className="placeholder mb-2" style={{ height: '16px' }}></div>
                                            <div className="placeholder w-75" style={{ height: '14px' }}></div>
                                            <div className="placeholder w-50 mt-1" style={{ height: '12px' }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        // Empty State
                        <div className="text-center py-5">
                            <div className="rounded-circle bg-light p-4 d-inline-flex mb-3">
                                <FaSearch className="text-muted fs-2" />
                            </div>
                            <h5 className="text-muted">No products found</h5>
                            <p className="text-muted small">
                                Try adjusting your search or category filter
                            </p>
                        </div>
                    ) : (
                        // Products Grid
                        <div className={`row ${getGridClass()} g-2 overflow-auto`} style={{ maxHeight: '100%' }}>
                            {products.map((product) => {
                                const isOutOfStock = product.stock <= 0;
                                const isLowStock = product.stock > 0 && product.stock < 10;

                                return (
                                    <div key={product.product_id} className="col">
                                        <button
                                            className={`card h-100 w-100 text-start p-2 border-0 ${isOutOfStock
                                                    ? 'bg-light text-muted'
                                                    : 'product-card'
                                                }`}
                                            onClick={() => !isOutOfStock && onAddToCart(product)}
                                            disabled={isOutOfStock}
                                            style={{
                                                cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            <div className="card-body p-2 d-flex flex-column justify-content-between">
                                                {/* Product Name */}
                                                <h6 className="card-title mb-2 text-truncate small fw-semibold">
                                                    {product.name}
                                                </h6>

                                                {/* Product Details */}
                                                <div className="d-flex flex-column gap-1">
                                                    {/* Price and Stock */}
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <span className="fw-bold text-primary small">
                                                            ₱{product.price.toFixed(2)}
                                                        </span>
                                                        <span className={`badge ${isOutOfStock
                                                                ? 'bg-danger'
                                                                : isLowStock
                                                                    ? 'bg-warning text-dark'
                                                                    : 'bg-success'
                                                            } small`}>
                                                            {isOutOfStock ? 'Out' : product.stock}
                                                        </span>
                                                    </div>

                                                    {/* Barcode */}
                                                    {product.barcode && (
                                                        <div className="d-flex align-items-center gap-1">
                                                            <FaBarcode className="text-muted small" />
                                                            <small className="text-truncate text-muted">
                                                                {product.barcode}
                                                            </small>
                                                        </div>
                                                    )}

                                                    {/* Low Stock Warning */}
                                                    {isLowStock && product.stock < 5 && (
                                                        <div className="d-flex align-items-center gap-1">
                                                            <FaExclamationTriangle className="text-warning small" />
                                                            <small className="text-warning">Low Stock</small>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Loading Indicator */}
            {productsLoading && products.length > 0 && (
                <div className="card-footer text-center py-2">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <small className="text-muted ms-2">
                        Loading more products...
                    </small>
                </div>
            )}
        </div>
    );

    // Bootstrap responsive grid classes
    function getGridClass() {
        switch (deviceType) {
            case "mobile":
                return "row-cols-2";
            case "tablet":
                return "row-cols-3";
            default:
                return "row-cols-2 row-cols-md-3 row-cols-lg-4";
        }
    }
};

export default ProductsPanel;