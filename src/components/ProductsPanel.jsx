import { useState } from "react";
import { FaSearch, FaBarcode, FaTags, FaExclamationTriangle } from "react-icons/fa";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";

const ProductsPanel = ({ deviceType, onAddToCart }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [visibleCount, setVisibleCount] = useState(8); // initially show 8 products

    const { categories } = useCategories();
    const { products, loading: productsLoading } = useProducts(searchTerm, selectedCategory);

    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 8); // load 8 more each time
    };

    const visibleProducts = products.slice(0, visibleCount);
    const hasMore = visibleCount < products.length;

    return (
        <div className="card h-100">
            {/* Header */}
            <div className="card-header border-bottom">
                <div className="d-flex align-items-center">
                    <FaTags className="text-primary me-2" />
                    <h5 className="card-title mb-0 fw-semibold">Products</h5>
                    {!productsLoading && <span className="badge bg-primary ms-2">{products.length}</span>}
                </div>
            </div>

            <div className="card-body d-flex flex-column p-3">
                {/* Search & Filter */}
                <div className="row g-2 mb-3">
                    <div className="col-12 col-md-8">
                        <div className="input-group input-group-sm">
                            <span className="input-group-text"><FaSearch /></span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-12 col-md-4">
                        <div className="input-group input-group-sm">
                            <span className="input-group-text"><FaTags /></span>
                            <select
                                className="form-select"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="all">All Categories</option>
                                {categories.filter(cat => cat !== "all").map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="flex-grow-1 overflow-auto" style={{ maxHeight: "calc(100% - 60px)" }}>
                    {productsLoading && visibleProducts.length === 0 ? (
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
                    ) : visibleProducts.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="rounded-circle bg-body-secondary p-4 d-inline-flex mb-3">
                                <FaSearch className="text-body-tertiary fs-2" />
                            </div>
                            <h5 className="text-body-secondary">No products found</h5>
                            <p className="text-body-tertiary small">Try adjusting your search or category filter</p>
                        </div>
                    ) : (
                        <div className={`row ${getGridClass()} g-2`}>
                            {visibleProducts.map((product) => {
                                const isOutOfStock = product.stock <= 0;
                                const isLowStock = product.stock > 0 && product.stock < 10;

                                return (
                                    <div key={product.product_id} className="col">
                                        <button
                                            className={`card h-100 w-100 text-start p-2 border-0 ${isOutOfStock
                                                    ? 'bg-body-secondary text-muted'
                                                    : 'product-card bg-body'
                                                }`}
                                            onClick={() => !isOutOfStock && onAddToCart(product)}
                                            disabled={isOutOfStock}
                                            style={{
                                                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                                opacity: isOutOfStock ? 0.7 : 1,
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div className="card-body p-2 d-flex flex-column justify-content-between">
                                                <h6 className={`card-title mb-2 text-truncate small ${isOutOfStock ? 'text-muted' : 'fw-semibold'
                                                    }`} title={product.name}>
                                                    {product.name}
                                                </h6>
                                                <div className="d-flex flex-column gap-1">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <span className={`fw-bold small ${isOutOfStock ? 'text-muted' : 'text-primary'
                                                            }`}>
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
                                                    {product.barcode && (
                                                        <div className="d-flex align-items-center gap-1">
                                                            <FaBarcode className="text-body-tertiary small" />
                                                            <small className="text-truncate text-body-tertiary">
                                                                {product.barcode}
                                                            </small>
                                                        </div>
                                                    )}
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

                    {/* Load More */}
                    {hasMore && !productsLoading && (
                        <div className="text-center mt-2">
                            <button className="btn btn-outline-primary btn-sm" onClick={handleLoadMore}>
                                Load More
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    function getGridClass() {
        switch (deviceType) {
            case "mobile": return "row-cols-2";
            case "tablet": return "row-cols-3";
            default: return "row-cols-2 row-cols-md-3 row-cols-lg-4";
        }
    }
};

export default ProductsPanel;