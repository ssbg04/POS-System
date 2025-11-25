// pages/POS.jsx
import { useState, useRef } from "react";
import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../hooks/useSettings";
import { useDeviceDetection } from "../hooks/useDeviceDetection";
import { useCart } from "../context/CartContext"; // Updated import
import { useNumpad } from "../hooks/useNumpad";
import POSHeader from "../components/POSHeader";
import ProductsPanel from "../components/ProductsPanel";
import CartSummary from "../components/CartSummary";
import Numpad from "../components/Numpad";

const POS = () => {
    const [reloadProducts, setReloadProducts] = useState(false);
    const [barcodeInput, setBarcodeInput] = useState("");
    const barcodeInputRef = useRef(null);

    const { user, logout } = useAuthContext();
    const navigate = useNavigate();
    const { settings } = useSettings();

    const { deviceType, isFullscreen } = useDeviceDetection(settings?.fullscreen_mode || "auto");

    // Use cart from context
    const { cart, addToCart, removeFromCart, updateQuantity, clearCart } = useCart();

    const {
        showNumpad,
        numpadValue,
        numpadTarget,
        openNumpad,
        handleNumpadInput,
        applyNumpadValue,
        closeNumpad
    } = useNumpad();

    // Handlers
    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleSleepMode = () => {
        console.log("Sleep mode activated");
    };

    const handleBarcodeSubmit = (e) => {
        e.preventDefault();
        if (barcodeInput.trim()) {
            // Barcode search implementation
            console.log("Barcode search:", barcodeInput);
            setBarcodeInput("");
        }
    };

    const handleApplyNumpad = () => {
        applyNumpadValue();
    };

    const handleProceedToCheckout = () => {
        if (cart.length > 0) {
            navigate("/checkout");
        }
    };

    return (
        <div className="pos-container">
            {/* Header */}
            <POSHeader
                user={user}
                onLogout={handleLogout}
                onSleepMode={handleSleepMode}
            />

            {/* Main Content */}
            <div className="pos-main-content d-flex flex-column flex-lg-row p-3 gap-3">
                {/* Products Panel */}
                <div className="flex-grow-1 d-flex flex-column overflow-hidden">
                    <ProductsPanel
                        deviceType={deviceType}
                        barcodeInput={barcodeInput}
                        onBarcodeChange={setBarcodeInput}
                        onBarcodeSubmit={handleBarcodeSubmit}
                        onAddToCart={addToCart}
                        barcodeInputRef={barcodeInputRef}
                        reload={reloadProducts}
                    />
                </div>

                {/* Cart Summary Sidebar */}
                <div className="flex-shrink-0 d-flex flex-column overflow-hidden" style={{ width: '100%', maxWidth: '320px' }}>
                    <CartSummary
                        cart={cart}
                        onRemoveFromCart={removeFromCart}
                        onUpdateQuantity={updateQuantity}
                        onClearCart={clearCart}
                        onProceedToCheckout={handleProceedToCheckout}
                    />
                </div>
            </div>

            {/* Numpad Modal */}
            {showNumpad && (
                <div className="numpad-modal show slide-up">
                    <Numpad
                        numpadValue={numpadValue}
                        onInput={handleNumpadInput}
                        onApply={handleApplyNumpad}
                        onClose={closeNumpad}
                    />
                </div>
            )}
        </div>
    );
};

export default POS;