// components/CartSummary.jsx
import { FaShoppingCart, FaTrash, FaArrowRight, FaMinus, FaPlus } from "react-icons/fa";

const CartSummary = ({
    cart,
    onRemoveFromCart,
    onUpdateQuantity,
    onClearCart,
    onProceedToCheckout,
    onBackToProducts,
    onOpenNumpad,
    canCheckout = true
}) => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueItemsCount = cart.length;

    const handleQuantityClick = (productId, currentQuantity) => {
        if (onOpenNumpad) {
            onOpenNumpad(currentQuantity.toString(), 'quantity', (newValue) => {
                const quantity = parseInt(newValue) || 1;
                if (quantity > 0) {
                    onUpdateQuantity(productId, quantity);
                }
            });
        }
    };

    const handleDecrease = (productId, currentQuantity) => {
        if (currentQuantity > 1) {
            onUpdateQuantity(productId, currentQuantity - 1);
        } else {
            onRemoveFromCart(productId);
        }
    };

    const handleIncrease = (productId, currentQuantity, stock) => {
        if (!stock || currentQuantity < stock) {
            onUpdateQuantity(productId, currentQuantity + 1);
        }
    };

    const getStockStatus = (item) => {
        if (!item.stock) return null;
        if (item.quantity >= item.stock) return 'out-of-stock';
        if (item.quantity > item.stock * 0.8) return 'low-stock';
        return null;
    };

    // Use bg-body and text-body for theme compatibility instead of hardcoded colors like 'bg-white'
    // Use theme-aware background for the header, like bg-body-tertiary
    return (
        <div className="card h-100 shadow-sm bg-body text-body">
            {/* Header - Use theme-aware background */}
            <div className="card-header bg-body-tertiary py-2 border-bottom">
                <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                        {/* Use icon-muted for a subtle icon color */}
                        <FaShoppingCart className="me-2 icon-muted" />
                        <h5 className="card-title mb-0 fs-6">Cart Summary</h5>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        {/* Use theme-compatible badge colors (e.g., secondary) */}
                        <span className="badge bg-secondary text-white fs-7 stock-badge">
                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="card-body d-flex flex-column p-0">
                {cart.length === 0 ? (
                    <div className="text-center py-5 px-3">
                        {/* Use icon-muted for a subtle color compatible with both themes */}
                        <FaShoppingCart className="display-4 icon-muted mb-3 opacity-50" />
                        <p className="text-muted mb-1 fw-medium">Your cart is empty</p>
                        <small className="text-muted">Add products to get started</small>
                    </div>
                ) : (
                    <>
                        <div className="flex-grow-1 overflow-auto products-scrollable" style={{ maxHeight: '400px' }}>
                            {/* Use custom .cart-item class for theme-specific list styling */}
                            <div className="list-group list-group-flush">
                                {cart.map(item => {
                                    const stockStatus = getStockStatus(item);
                                    const itemTotal = item.price * item.quantity;

                                    return (
                                        <div key={`${item.product_id}-${item.quantity}`}
                                            className="cart-item border-0 px-3 py-2"> {/* Apply theme-specific cart-item styles */}
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div className="flex-grow-1 me-2">
                                                    <div className="d-flex justify-content-between align-items-start mb-1">
                                                        <h6 className="card-title mb-0 small fw-bold text-truncate me-2"
                                                            style={{ maxWidth: '120px' }}
                                                            title={item.name}>
                                                            {item.name}
                                                        </h6>
                                                        {/* Use theme primary color for prices */}
                                                        <span className="text-primary fw-bold small">
                                                            ₱{itemTotal.toFixed(2)}
                                                        </span>
                                                    </div>

                                                    {/* Use theme-aware alert classes for stock warnings */}
                                                    {stockStatus === 'out-of-stock' && (
                                                        <div className="alert alert-danger p-1 mb-1 small" role="alert">
                                                            <small>Only {item.stock} in stock</small>
                                                        </div>
                                                    )}
                                                    {stockStatus === 'low-stock' && (
                                                        <div className="alert alert-warning p-1 mb-1 small" role="alert">
                                                            <small>Low stock: {item.stock} remaining</small>
                                                        </div>
                                                    )}

                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <span className="text-muted small">
                                                            ₱{item.price.toFixed(2)} each
                                                        </span>
                                                        <div className="d-flex align-items-center gap-1">
                                                            <button
                                                                onClick={() => handleDecrease(item.product_id, item.quantity)}
                                                                className="btn btn-sm btn-outline-secondary p-0 d-flex align-items-center justify-content-center quantity-btn"
                                                                title="Decrease quantity"
                                                            >
                                                                <FaMinus size={10} />
                                                            </button>

                                                            {/* Use theme primary color for quantity button */}
                                                            <button
                                                                onClick={() => handleQuantityClick(item.product_id, item.quantity)}
                                                                className="btn btn-sm btn-outline-primary mx-1 px-2 py-0 quantity-btn"
                                                                style={{ minWidth: '40px' }}
                                                                title="Click to enter quantity"
                                                            >
                                                                <span className="small fw-bold">{item.quantity}</span>
                                                            </button>

                                                            <button
                                                                onClick={() => handleIncrease(item.product_id, item.quantity, item.stock)}
                                                                className="btn btn-sm btn-outline-secondary p-0 d-flex align-items-center justify-content-center quantity-btn"
                                                                disabled={item.stock && item.quantity >= item.stock}
                                                                title="Increase quantity"
                                                            >
                                                                <FaPlus size={10} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => onRemoveFromCart(item.product_id)}
                                                    className="btn btn-sm btn-outline-danger p-1 d-flex align-items-center justify-content-center ms-2 quantity-btn"
                                                    title="Remove from cart"
                                                >
                                                    <FaTrash size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Use .checkout-totals and bg-body-tertiary for theme compatibility */}
                        <div className="checkout-totals p-3 bg-body-tertiary">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="text-muted small">Unique Products ({uniqueItemsCount}):</span>
                                <span className="text-muted small">{itemCount} items</span>
                            </div>

                            {/* Use theme primary color for total */}
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <span className="fw-bold fs-5">Subtotal:</span>
                                <span className="fw-bold text-primary fs-4">₱{subtotal.toFixed(2)}</span>
                            </div>

                            <div className="d-flex gap-2">
                                {/* Use theme danger color for clear cart */}
                                <button
                                    onClick={() => {
                                        const confirmClear = window.confirm(
                                            "Are you sure you want to clear the entire cart?"
                                        );
                                        if (confirmClear) {
                                            onClearCart();
                                        }
                                    }}
                                    className="btn btn-danger flex-fill d-flex align-items-center justify-content-center clear-all-btn"
                                    disabled={cart.length === 0}
                                    title="Clear all items from cart"
                                >
                                    <FaTrash className="me-1" />
                                    Clear All
                                </button>



                                {/* Use theme success color for checkout */}
                                <button
                                    onClick={onProceedToCheckout}
                                    className="btn btn-success flex-fill d-flex align-items-center justify-content-center complete-sale-btn"
                                    disabled={!canCheckout || cart.length === 0}
                                    title="Proceed to checkout"
                                >
                                    Checkout
                                    <FaArrowRight className="ms-1" />
                                </button>
                            </div>

                            <div className="mt-2 text-center">
                                <small className="text-muted">
                                    {uniqueItemsCount} unique {uniqueItemsCount === 1 ? 'product' : 'products'}
                                </small>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CartSummary;