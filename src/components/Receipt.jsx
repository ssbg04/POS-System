// components/Receipt.jsx
const Receipt = ({ sale, settings, onPrint, onClose }) => {
    if (!sale) {
        return <div>No sale data available</div>;
    }

    return (
        <div className="receipt-container">
            <div className="receipt-content">
                {/* Receipt header */}
                <div className="text-center mb-3">
                    <h4>{settings?.business_name || 'Your Business'}</h4>
                    <p className="mb-1">{settings?.address || 'Business Address'}</p>
                    <p className="mb-1">Tel: {settings?.phone || 'N/A'}</p>
                </div>

                {/* Sale info */}
                <div className="receipt-details">
                    <div className="d-flex justify-content-between">
                        <span>Receipt #:</span>
                        <span>{sale.sale_id || 'N/A'}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                        <span>Date:</span>
                        <span>{new Date(sale.sale_date || Date.now()).toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                        <span>Cashier:</span>
                        <span>{sale.users?.full_name || 'N/A'}</span>
                    </div>
                </div>

                <hr />

                {/* Items */}
                <div className="receipt-items">
                    {sale.sale_items?.map((item, index) => (
                        <div key={index} className="receipt-item mb-2">
                            <div className="d-flex justify-content-between">
                                <span className="fw-bold">{item.products?.name || 'Product'}</span>
                                <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between text-muted small">
                                <span>{item.quantity} x ₱{item.price?.toFixed(2)}</span>
                                <span>#{item.product_id}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <hr />

                {/* Totals */}
                <div className="receipt-totals">
                    <div className="d-flex justify-content-between">
                        <span>Subtotal:</span>
                        <span>₱{sale.total_amount?.toFixed(2)}</span>
                    </div>
                    {sale.discount_amount > 0 && (
                        <div className="d-flex justify-content-between text-success">
                            <span>Discount ({sale.discount_type}):</span>
                            <span>-₱{sale.discount_amount?.toFixed(2)}</span>
                        </div>
                    )}
                    {sale.tax_amount > 0 && (
                        <div className="d-flex justify-content-between">
                            <span>Tax:</span>
                            <span>₱{sale.tax_amount?.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="d-flex justify-content-between fw-bold mt-2">
                        <span>TOTAL:</span>
                        <span>₱{sale.total_amount?.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                        <span>Payment:</span>
                        <span>{sale.payment_type?.toUpperCase()}</span>
                    </div>
                    {sale.payment_type === 'cash' && (
                        <>
                            <div className="d-flex justify-content-between">
                                <span>Amount Tendered:</span>
                                <span>₱{sale.amount_tendered?.toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span>Change:</span>
                                <span>₱{sale.change_due?.toFixed(2)}</span>
                            </div>
                        </>
                    )}
                </div>

                <hr />

                {/* Footer */}
                <div className="text-center mt-3">
                    <p className="small text-muted">Thank you for your purchase!</p>
                    <p className="small text-muted">{sale.customer_name ? `Customer: ${sale.customer_name}` : ''}</p>
                </div>
            </div>

            {/* Actions */}
            <div className="receipt-actions mt-3">
                <button onClick={onPrint} className="btn btn-primary me-2">
                    Print Receipt
                </button>
                <button onClick={onClose} className="btn btn-secondary">
                    Close
                </button>
            </div>
        </div>
    );
};

export default Receipt;