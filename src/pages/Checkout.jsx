import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { useSales } from "../hooks/useSales";
import { useSettings } from "../hooks/useSettings";
import { useCart } from "../context/CartContext";
import { useNumpad } from "../hooks/useNumpad";
import {
    calculateSubtotal,
    calculateDiscount,
    calculateTax,
    calculateTotal,
    calculateChange,
    getAppliedDiscountType
} from "../utils/posCalculations";
import POSHeader from "../components/POSHeader";
import CheckoutPanel from "../components/CheckoutPanel";
import Receipt from "../components/Receipt";
import Numpad from "../components/Numpad";

// Component for showing errors instead of the deprecated alert()
const ErrorModal = ({ message, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <h3 className="text-xl font-bold text-red-600 mb-4">Error</h3>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end">
            <button
                onClick={onClose}
                className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition duration-150"
            >
                Close
            </button>
        </div>
    </div>
);

const Checkout = () => {
    const [discounts, setDiscounts] = useState({ pwd: false, senior: false });
    const [customerName, setCustomerName] = useState("");
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [showReceipt, setShowReceipt] = useState(false);
    const [completedSale, setCompletedSale] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    const { user, logout } = useAuthContext();
    const navigate = useNavigate();
    const { createSale } = useSales();
    const { settings } = useSettings();

    // Use cart from context
    const { cart, clearCart } = useCart();

    const {
        showNumpad,
        numpadValue,
        numpadTarget,
        openNumpad,
        handleNumpadInput,
        applyNumpadValue,
        closeNumpad
    } = useNumpad();

    const pwdDiscountRate = settings?.pwd_discount_rate || 0.20;
    const seniorDiscountRate = settings?.senior_discount_rate || 0.20;
    const taxRate = settings?.tax_rate || 0.12;

    // Calculations (Used for client-side display and validation only)
    const subtotal = calculateSubtotal(cart);
    const rawDiscount = calculateDiscount(subtotal, discounts, pwdDiscountRate, seniorDiscountRate);
    const discount = Math.round(rawDiscount * 100) / 100;
    const tax = calculateTax(subtotal, discount, taxRate, discounts);
    const rawTotal = calculateTotal(subtotal, discount, tax);
    const total = Math.round(rawTotal * 100) / 100;
    const change = calculateChange(total, parseFloat(paymentAmount) || 0);

    // Handlers
    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handlePrintReceipt = () => {
        window.print();
    };

    const handleCloseReceipt = () => {
        setShowReceipt(false);
        setCompletedSale(null);
        navigate("/pos");
    };

    const handleSleepMode = () => {
        console.log("Sleep mode activated");
    };

    const handleBackToPOS = () => {
        navigate("/pos");
    };

    const handleDiscountChange = (type) => {
        setDiscounts(prev => ({
            pwd: type === 'pwd' ? !prev.pwd : false,
            senior: type === 'senior' ? !prev.senior : false
        }));
    };

    const handleApplyNumpad = () => {
        if (numpadTarget === 'payment') setPaymentAmount(numpadValue);
        applyNumpadValue();
    };

    const handleOpenNumpad = () => {
        openNumpad('payment', paymentAmount || '');
    };

    const handleCompleteSale = async () => {
        // Validate cart
        if (cart.length === 0) {
            setErrorMessage('Cart is empty. Please add items to cart before checkout.');
            return;
        }

        // Calculate what the backend will calculate
        const backendSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const backendDiscount = calculateDiscount(backendSubtotal, discounts, pwdDiscountRate, seniorDiscountRate);
        const backendTax = calculateTax(backendSubtotal, backendDiscount, taxRate, discounts);
        const backendTotal = calculateTotal(backendSubtotal, backendDiscount, backendTax);

        // --- Payment Validation ---
        let finalPaymentAmount = parseFloat(paymentAmount) || 0;
        finalPaymentAmount = Math.round(finalPaymentAmount * 100) / 100;

        if (paymentMethod === 'cash') {
            if (finalPaymentAmount < total) {
                const shortfall = total - finalPaymentAmount;
                setErrorMessage(`Insufficient payment! Total is ₱${total.toFixed(2)} but payment is only ₱${finalPaymentAmount.toFixed(2)}. Please add ₱${shortfall.toFixed(2)} more.`);
                return;
            }

            if (finalPaymentAmount <= 0) {
                setErrorMessage('Please enter a valid cash payment amount.');
                return;
            }
        }

        // Get the user ID - FIXED: Use the actual user ID from context
        const userId = user?.user_id || user?.id;

        if (!userId) {
            setErrorMessage('Error: User ID not found. Please contact administrator.');
            return;
        }

        const appliedDiscountType = getAppliedDiscountType(discounts);

        // Determine the amount tendered based on payment method
        let amountToSend = paymentMethod === 'cash' ? finalPaymentAmount : total;
        amountToSend = Math.round(amountToSend * 100) / 100;

        // FIXED: Send proper user data structure
        const serverPayload = {
            user_id: userId, // Just send the user ID, let backend populate user data
            items: cart.map(item => ({
                product_id: item.product_id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity
            })),
            payment_type: paymentMethod,
            amount_tendered: amountToSend,
            discount_type: appliedDiscountType,
            discount_amount: Math.round(discount * 100) / 100,
            customer_name: customerName || null,
            total: Math.round(total * 100) / 100,
            tax_amount: Math.round(tax * 100) / 100,
            change_due: paymentMethod === 'cash' ? Math.round(change * 100) / 100 : 0,
            // Include user info for receipt generation
            user: {
                id: userId,
                full_name: user?.full_name || user?.name || 'Cashier'
            }
        };

        try {
            console.log('Attempting to create sale with payload:', serverPayload);
            const result = await createSale(serverPayload, userId);

            // FIXED: Ensure the returned sale has proper user data
            if (result && !result.users) {
                result.users = {
                    full_name: user?.full_name || user?.name || 'Cashier'
                };
            }

            setCompletedSale(result);
            setShowReceipt(true);
            clearCart();
            setPaymentAmount("");
            setPaymentMethod("cash");
            setDiscounts({ pwd: false, senior: false });
            setCustomerName("");

        } catch (error) {
            console.error('Sale creation failed with details:', {
                error,
                message: error.message,
                response: error.response,
                stack: error.stack
            });

            const errorMessage = error.message.includes('Failed to fetch')
                ? 'Cannot connect to server. Please check your internet connection.'
                : error.message || 'Unknown error occurred';

            setErrorMessage(`Sale failed: ${errorMessage}`);
        }
    }

    if (showReceipt && completedSale) {
        return (
            <div className="pos-container">
                <POSHeader
                    user={user}
                    onLogout={handleLogout}
                    onSleepMode={handleSleepMode}
                />
                <div className="pos-main-content p-3">
                    <Receipt
                        sale={completedSale}
                        settings={settings}
                        onPrint={handlePrintReceipt}
                        onClose={handleCloseReceipt}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="pos-container">
            {/* Header */}
            <POSHeader
                user={user}
                onLogout={handleLogout}
                onSleepMode={handleSleepMode}
            />

            {/* Main Content */}
            <div className="pos-main-content p-3">
                <div className="row g-3">
                    {/* Cart Items */}
                    <div className="col-12 col-lg-8">
                        <div className="card">
                            <div className="card-header bg-primary text-white">
                                <div className="d-flex align-items-center justify-content-between">
                                    <h5 className="card-title mb-0">Order Summary</h5>
                                    <button
                                        className="btn btn-sm btn-light"
                                        onClick={handleBackToPOS}
                                    >
                                        ← Back to POS
                                    </button>
                                </div>
                            </div>
                            <div className="card-body">
                                {cart.length === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-muted">No items in cart</p>
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleBackToPOS}
                                        >
                                            Add Products
                                        </button>
                                    </div>
                                ) : (
                                    <div className="list-group">
                                        {cart.map(item => (
                                            <div key={item.product_id} className="list-group-item">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <h6 className="mb-1">{item.name}</h6>
                                                        <small className="text-muted">₱{item.price.toFixed(2)} × {item.quantity}</small>
                                                    </div>
                                                    <span className="fw-bold text-primary">
                                                        ₱{(item.price * item.quantity).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Checkout Panel */}
                    <div className="col-12 col-lg-4">
                        <CheckoutPanel
                            cart={cart}
                            customerName={customerName}
                            paymentAmount={paymentAmount}
                            paymentMethod={paymentMethod}
                            discounts={discounts}
                            subtotal={subtotal}
                            discount={discount}
                            tax={tax}
                            total={total}
                            change={change}
                            pwdDiscountRate={pwdDiscountRate}
                            seniorDiscountRate={seniorDiscountRate}
                            taxRate={taxRate}
                            onCustomerNameChange={setCustomerName}
                            onPaymentMethodChange={setPaymentMethod}
                            onDiscountChange={handleDiscountChange}
                            onOpenNumpad={handleOpenNumpad}
                            onCheckout={handleCompleteSale}
                            getAppliedDiscountType={() => getAppliedDiscountType(discounts)}
                        />
                    </div>
                </div>
            </div>

            {/* Numpad Modal - Simplified */}
            {showNumpad && (
                <Numpad
                    numpadValue={numpadValue}
                    onInput={handleNumpadInput}
                    onApply={handleApplyNumpad}
                    onClose={closeNumpad}
                />
            )}

            {/* Error Modal */}
            {errorMessage && (
                <ErrorModal
                    message={errorMessage}
                    onClose={() => setErrorMessage(null)}
                />
            )}
        </div>
    );
};

export default Checkout;