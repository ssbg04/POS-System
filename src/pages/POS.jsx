// pages/POS.jsx
import { useState, useRef } from "react";
import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../hooks/useSettings";
import { useDeviceDetection } from "../hooks/useDeviceDetection";
import { useCart } from "../context/CartContext";
import { useNumpad } from "../hooks/useNumpad";
import POSHeader from "../components/POSHeader";
import ProductsPanel from "../components/ProductsPanel";
import CartSummary from "../components/CartSummary";
import Numpad from "../components/Numpad";
import RefundModal from "../components/RefundModal";
import { useSales } from "../hooks/useSales";

const POS = () => {
    const [reloadProducts, setReloadProducts] = useState(false);
    const [barcodeInput, setBarcodeInput] = useState("");
    const barcodeInputRef = useRef(null);
    const [showCart, setShowCart] = useState(false);
    const { sales, loading, refundSale } = useSales();
    const [showRefundModal, setShowRefundModal] = useState(false);

    const toggleCart = () => {
        setShowCart(!showCart);
    };

    const { user, logout } = useAuthContext();
    const navigate = useNavigate();
    const { settings } = useSettings();

    const { deviceType, isFullscreen } = useDeviceDetection(settings?.fullscreen_mode || "auto");

    // Use cart from context
    const { cart, addToCart, removeFromCart, updateQuantity, clearCart } = useCart();

    const handleRefund = () => {
        setShowRefundModal(true);
    };

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

    // Fixed refund handler
    const handleRefundSale = async (sale_id, reason, receipt) => {
        try {
            await refundSale(sale_id, reason, receipt, user?.user_id);
            // Success message will be handled by the RefundModal
            return Promise.resolve();
        } catch (error) {
            console.error("Refund failed:", error);
            throw error; // Re-throw to let RefundModal handle the error
        }
    };

    return (
        <div className="pos-container">
            {/* Header */}
            <POSHeader
                user={user}
                onLogout={handleLogout}
                onSleepMode={handleSleepMode}
                onRefund={handleRefund}
            />

            <RefundModal
                show={showRefundModal}
                onClose={() => setShowRefundModal(false)}
                sales={sales}
                loading={loading}
                onRefund={handleRefundSale}
            />

            {/* Main Content */}
            <div className="pos-main-content d-flex flex-column flex-lg-row p-3 gap-3">
                {/* Products Panel */}
                <div className={`${deviceType === 'mobile' && showCart ? 'd-none' : 'flex-grow-1 d-flex flex-column overflow-hidden'}`}>
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

                {/* Cart Summary - Mobile Toggle Button */}
                {deviceType === 'mobile' && (
                    <div className="cart-toggle-button position-fixed bottom-0 start-0 end-0 p-2 bg-primary text-white text-center d-lg-none"
                        onClick={toggleCart}
                        style={{ zIndex: 99 }}>
                        {showCart ? 'Show Products' : `Cart (${cart.length})`}
                    </div>
                )}

                {/* Cart Summary Sidebar */}
                <div className={`flex-shrink-0 d-flex flex-column overflow-hidden 
                    ${deviceType === 'mobile' ? (showCart ? 'd-block' : 'd-none') : ''}`}
                    style={{
                        width: '100%',
                        maxWidth: deviceType === 'mobile' ? '100%' : '320px'
                    }}>
                    <CartSummary
                        cart={cart}
                        onRemoveFromCart={removeFromCart}
                        onUpdateQuantity={updateQuantity}
                        onClearCart={clearCart}
                        onProceedToCheckout={handleProceedToCheckout}
                        onBackToProducts={deviceType === 'mobile' ? toggleCart : undefined}
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