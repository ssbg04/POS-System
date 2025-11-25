// components/CheckoutPanel.jsx
const CheckoutPanel = ({
    cart,
    customerName,
    paymentAmount,
    paymentMethod,
    discounts,
    subtotal,
    discount,
    tax,
    total,
    change,
    pwdDiscountRate,
    seniorDiscountRate,
    taxRate,
    onCustomerNameChange,
    onPaymentMethodChange,
    onDiscountChange,
    onOpenNumpad,
    onCheckout,
    getAppliedDiscountType
}) => {

    const payment = parseFloat(paymentAmount) || 0;
    const isPaymentSufficient = payment >= total;
    const isCashPaymentEntered = payment > 0;

    return (
        <div className="card">
            <div className="card-header bg-primary text-white">
                <h5 className="card-title mb-0">Checkout</h5>
            </div>

            <div className="card-body">
                {/* Customer Name */}
                <div className="mb-3">
                    <label className="form-label small">Customer Name (Optional)</label>
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        value={customerName}
                        onChange={(e) => onCustomerNameChange(e.target.value)}
                        placeholder="Enter customer name"
                    />
                </div>

                {/* Discounts */}
                <div className="mb-3">
                    <label className="form-label small">Apply Discount</label>
                    <div className="row g-2">
                        <div className="col-6">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={discounts.pwd}
                                    onChange={() => onDiscountChange('pwd')}
                                    id="pwd-discount"
                                />
                                <label className="form-check-label small" htmlFor="pwd-discount">
                                    PWD ({(pwdDiscountRate * 100).toFixed(0)}%)
                                </label>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={discounts.senior}
                                    onChange={() => onDiscountChange('senior')}
                                    id="senior-discount"
                                />
                                <label className="form-check-label small" htmlFor="senior-discount">
                                    Senior ({(seniorDiscountRate * 100).toFixed(0)}%)
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Totals */}
                <div className="mb-3">
                    <div className="list-group list-group-flush small">
                        <div className="list-group-item d-flex justify-content-between px-0">
                            <span>Subtotal:</span>
                            <span>₱{subtotal.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="list-group-item d-flex justify-content-between px-0 text-success">
                                <span>{getAppliedDiscountType()} Discount:</span>
                                <span>-₱{discount.toFixed(2)}</span>
                            </div>
                        )}
                        {tax > 0 && (
                            <div className="list-group-item d-flex justify-content-between px-0">
                                <span>Tax ({(taxRate * 100).toFixed(0)}%):</span>
                                <span>₱{tax.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="list-group-item d-flex justify-content-between px-0 fw-bold border-top">
                            <span>Total:</span>
                            <span className="text-primary">₱{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Method */}
                <div className="mb-3">
                    <label className="form-label small">Payment Method</label>
                    <select
                        className="form-select form-select-sm"
                        value={paymentMethod}
                        onChange={(e) => onPaymentMethodChange(e.target.value)}
                    >
                        <option value="cash">Cash</option>
                        <option value="gcash">GCash</option>
                        <option value="card">Card</option>
                    </select>
                </div>

                {/* Payment Amount */}
                <div className="mb-3">
                    <label className="form-label small">
                        {paymentMethod === 'cash' ? 'Amount Received' : 'Amount Due'}
                    </label>

                    {paymentMethod === 'cash' ? (
                        // Cash payment - show interactive button
                        <button
                            onClick={onOpenNumpad}
                            className={`btn w-100 text-start ${paymentAmount ? 'btn-outline-success' : 'btn-outline-primary'
                                } payment-amount-btn`}
                            type="button"
                        >
                            <div className="d-flex justify-content-between align-items-center">
                                <span>
                                    {paymentAmount
                                        ? `₱${payment.toFixed(2)}`
                                        : 'Tap to enter amount'
                                    }
                                </span>
                                <i className="bi bi-keyboard ms-2 text-muted"></i>
                            </div>
                        </button>
                    ) : (
                        // Non-cash payment - show static display
                        <div className="form-control form-control-sm bg-light">
                            ₱{total.toFixed(2)}
                        </div>
                    )}

                    {/* Payment validation message - only for cash */}
                    {paymentMethod === 'cash' && payment > 0 && !isPaymentSufficient && (
                        <div className="text-danger small mt-1">
                            ⚠️ Payment insufficient. Add ₱{(total - payment).toFixed(2)} more.
                        </div>
                    )}
                </div>

                {/* Change Display - only for cash */}
                {paymentMethod === 'cash' && payment > 0 && isPaymentSufficient && (
                    <div className="alert alert-success text-center py-2 mb-3">
                        <small className="fw-bold">Change: ₱{change.toFixed(2)}</small>
                    </div>
                )}

                {/* Complete Sale Button */}
                <button
                    onClick={onCheckout}
                    // --- ✅ FIXED DISABLED LOGIC HERE ✅ ---
                    disabled={
                        cart.length === 0 ||
                        (paymentMethod === 'cash' && (
                            !isCashPaymentEntered || // Must have payment entered
                            !isPaymentSufficient     // Payment must be sufficient
                        ))
                    }
                    // --- END FIXED DISABLED LOGIC ---
                    className="btn btn-success w-100 fw-bold py-2"
                >
                    COMPLETE SALE
                </button>
            </div>
        </div>
    );
};

export default CheckoutPanel;