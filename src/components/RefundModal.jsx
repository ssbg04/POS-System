import { useState, useMemo } from "react";
import { Modal, Button, Table, Spinner, Form, Alert } from "react-bootstrap";

const RefundModal = ({ show, onClose, sales, loading, onRefund }) => {
    const [selectedSaleId, setSelectedSaleId] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [searchId, setSearchId] = useState("");
    const [reason, setReason] = useState("");
    const [receipt, setReceipt] = useState("");
    const [validationError, setValidationError] = useState("");
    const [printIframe, setPrintIframe] = useState(null);

    // Common refund reasons
    const commonReasons = [
        "Customer changed mind",
        "Product defective/damaged",
        "Wrong product received",
        "Product not as described",
        "Duplicate purchase",
        "Price mismatch",
        "Customer dissatisfaction",
        "Cancelled order",
        "Returned item",
        "Overcharged amount"
    ];

    const filteredSales = useMemo(() => {
        if (!searchId.trim()) return sales;
        return sales.filter(sale =>
            sale.sale_id.toString().includes(searchId.trim())
        );
    }, [sales, searchId]);

    const selectedSale = useMemo(() => {
        return sales.find(sale => sale.sale_id === selectedSaleId);
    }, [sales, selectedSaleId]);

    const handleRefundClick = async () => {
        if (!selectedSaleId) return;

        const trimmedReason = reason.trim();

        // Validate reason
        if (!trimmedReason) {
            setValidationError("Please provide a reason for the refund");
            return;
        }

        if (trimmedReason.length < 5) {
            setValidationError("Reason must be at least 5 characters long");
            return;
        }

        try {
            setProcessing(true);
            setValidationError("");
            await onRefund(selectedSaleId, trimmedReason, receipt.trim() || null);

            // Print receipt immediately after successful refund
            printReceipt(selectedSale, trimmedReason, receipt.trim() || null);

            // Reset form and close after a short delay
            setTimeout(() => {
                setSelectedSaleId(null);
                setReason("");
                setReceipt("");
                setValidationError("");
                setSearchId("");
                setProcessing(false);
                onClose();
            }, 1500);

        } catch (err) {
            console.error("Refund error:", err);
            setValidationError(err.message || "Failed to refund sale");
            setProcessing(false);
        }
    };

    const printReceipt = (sale, refundReason, refundReceipt) => {
        const receiptWindow = window.open('', '_blank', 'width=300,height=600');
        const receiptNumber = refundReceipt || `REF-${sale.sale_id}-${Date.now().toString().slice(-4)}`;
        const refundDate = new Date().toISOString();

        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP'
            }).format(amount);
        };

        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString('en-PH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        receiptWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Refund Receipt</title>
                <style>
                    body {
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                        width: 80mm;
                        margin: 0;
                        padding: 10px;
                        background: white;
                    }
                    .receipt {
                        width: 100%;
                    }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .text-left { text-align: left; }
                    .bold { font-weight: bold; }
                    .underline { border-bottom: 1px dashed #000; margin: 2px 0; }
                    .divider { border-top: 1px dashed #000; margin: 5px 0; }
                    .double-divider { border-top: 2px solid #000; margin: 8px 0; }
                    .item-row { display: flex; justify-content: space-between; margin: 1px 0; }
                    .refund-header { 
                        background: #ffebee; 
                        padding: 5px; 
                        text-align: center; 
                        border: 1px solid #f44336;
                        margin: 5px 0;
                    }
                    .reason-box {
                        border: 1px dashed #000;
                        padding: 5px;
                        margin: 5px 0;
                        background: #fff3cd;
                    }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 2px 0; }
                    .items-table th { border-bottom: 1px solid #000; }
                    .items-table td { border-bottom: 1px dotted #ccc; }
                    @media print {
                        body { margin: 0; padding: 10px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <!-- Store Header -->
                    <div class="text-center">
                        <div class="bold" style="font-size: 14px;">YOUR STORE NAME</div>
                        <div>Store Address Line 1</div>
                        <div>Store Address Line 2</div>
                        <div>Contact: +63 XXX-XXXX-XXX</div>
                        <div class="double-divider"></div>
                        <div class="refund-header bold" style="font-size: 13px;">
                            ⚠️ REFUND RECEIPT ⚠️
                        </div>
                    </div>

                    <!-- Refund Details -->
                    <div class="item-row">
                        <div class="text-left">
                            <div class="bold">Refund #: ${receiptNumber}</div>
                            <div>Date: ${formatDate(refundDate)}</div>
                        </div>
                    </div>

                    <div class="divider"></div>

                    <!-- Original Sale Info -->
                    <div class="bold">Original Sale:</div>
                    <div class="item-row">
                        <div>Sale #: ${sale.sale_id}</div>
                        <div>${formatDate(sale.sale_date)}</div>
                    </div>
                    <div class="item-row">
                        <div>Cashier: ${sale.users?.full_name || 'N/A'}</div>
                        <div>Customer: ${sale.customer_name || 'Walk-in'}</div>
                    </div>

                    <div class="divider"></div>

                    <!-- Refund Reason -->
                    <div class="reason-box">
                        <div class="bold">REFUND REASON:</div>
                        <div>${refundReason}</div>
                    </div>

                    <!-- Items Refunded -->
                    <div class="bold">ITEMS REFUNDED:</div>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th class="text-left">Item</th>
                                <th class="text-center">Qty</th>
                                <th class="text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sale.sale_items?.map(item => `
                                <tr>
                                    <td class="text-left">${item.products?.name}</td>
                                    <td class="text-center">${item.quantity}</td>
                                    <td class="text-right">${formatCurrency(item.price * item.quantity)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="divider"></div>

                    <!-- Financial Summary -->
                    <div class="bold">REFUND SUMMARY:</div>
                    <div class="item-row">
                        <div>Subtotal:</div>
                        <div>${formatCurrency(sale.total_amount + (sale.discount_amount || 0) - (sale.tax_amount || 0))}</div>
                    </div>
                    ${sale.discount_amount > 0 ? `
                    <div class="item-row">
                        <div>Discount:</div>
                        <div>-${formatCurrency(sale.discount_amount)}</div>
                    </div>
                    ` : ''}
                    ${sale.tax_amount > 0 ? `
                    <div class="item-row">
                        <div>Tax:</div>
                        <div>${formatCurrency(sale.tax_amount)}</div>
                    </div>
                    ` : ''}
                    <div class="item-row double-divider">
                        <div class="bold">TOTAL REFUND:</div>
                        <div class="bold">${formatCurrency(sale.total_amount)}</div>
                    </div>
                    <div class="item-row">
                        <div>Payment Method:</div>
                        <div class="bold">${sale.payment_type?.toUpperCase()}</div>
                    </div>

                    <div class="double-divider"></div>

                    <!-- Footer -->
                    <div class="text-center">
                        <div>Thank you for your business!</div>
                        <div style="font-size: 10px; margin-top: 5px;">
                            This receipt serves as proof of refund<br>
                            For inquiries, contact store management<br>
                            Generated: ${formatDate(refundDate)}
                        </div>
                    </div>

                    <!-- Print Button -->
                    <div class="text-center no-print" style="margin-top: 15px;">
                        <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            🖨️ Print Receipt
                        </button>
                        <br><br>
                        <button onclick="window.close()" style="padding: 8px 16px; font-size: 12px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            Close Window
                        </button>
                    </div>
                </div>

                <script>
                    // Auto-print after a short delay
                    setTimeout(() => {
                        window.print();
                    }, 500);
                    
                    // Close window after print (if possible)
                    window.onafterprint = function() {
                        setTimeout(() => {
                            window.close();
                        }, 1000);
                    };
                </script>
            </body>
            </html>
        `);

        receiptWindow.document.close();
    };

    const handleClose = () => {
        setSelectedSaleId(null);
        setReason("");
        setReceipt("");
        setValidationError("");
        setSearchId("");
        onClose();
    };

    const handleReasonChange = (e) => {
        setReason(e.target.value);
        if (validationError) {
            setValidationError("");
        }
    };

    const handleCommonReasonClick = (commonReason) => {
        setReason(commonReason);
    };

    const isFormValid = selectedSaleId && reason.trim().length >= 5;

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Refund Sale</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {validationError && (
                    <Alert variant="danger" className="mb-3">
                        {validationError}
                    </Alert>
                )}

                <Form.Group className="mb-3">
                    <Form.Label>Search by Sale ID</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Enter sale ID..."
                        value={searchId}
                        onChange={e => setSearchId(e.target.value)}
                    />
                </Form.Group>

                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                    {loading ? (
                        <div className="d-flex justify-content-center py-3">
                            <Spinner animation="border" />
                        </div>
                    ) : filteredSales.length === 0 ? (
                        <p>No sales found.</p>
                    ) : (
                        <Table striped bordered hover size="sm">
                            <thead>
                                <tr>
                                    <th>Select</th>
                                    <th>Sale ID</th>
                                    <th>Date</th>
                                    <th>Total Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSales.map(sale => (
                                    <tr key={sale.sale_id}>
                                        <td>
                                            <input
                                                type="radio"
                                                name="selectedSale"
                                                value={sale.sale_id}
                                                checked={selectedSaleId === sale.sale_id}
                                                onChange={() => setSelectedSaleId(sale.sale_id)}
                                                disabled={sale.status !== "completed"}
                                            />
                                        </td>
                                        <td>{sale.sale_id}</td>
                                        <td>{new Date(sale.sale_date).toLocaleString()}</td>
                                        <td>₱{sale.total_amount.toFixed(2)}</td>
                                        <td>{sale.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </div>

                {selectedSale && (
                    <div className="border p-3 mt-3 bg-light rounded">
                        <h6 className="fw-bold">Selected Sale Details</h6>
                        <div className="row small">
                            <div className="col-6">
                                <strong>Sale ID:</strong> #{selectedSale.sale_id}
                            </div>
                            <div className="col-6">
                                <strong>Date:</strong> {new Date(selectedSale.sale_date).toLocaleString()}
                            </div>
                            <div className="col-6">
                                <strong>Customer:</strong> {selectedSale.customer_name || 'Walk-in'}
                            </div>
                            <div className="col-6">
                                <strong>Cashier:</strong> {selectedSale.users?.full_name || 'N/A'}
                            </div>
                            <div className="col-12 mt-1">
                                <strong>Total Amount:</strong> ₱{selectedSale.total_amount?.toFixed(2)}
                            </div>
                        </div>
                    </div>
                )}

                <Form.Group className="mt-3">
                    <Form.Label>
                        Refund Reason <span className="text-danger">*</span>
                        {reason.trim() && (
                            <small className={`ms-2 ${reason.trim().length < 5 ? 'text-danger' : 'text-success'}`}>
                                ({reason.trim().length}/5 min)
                            </small>
                        )}
                    </Form.Label>

                    {/* Common Reasons Quick Select */}
                    <div className="mb-2">
                        <small className="text-muted d-block mb-1">Common reasons:</small>
                        <div className="d-flex flex-wrap gap-1">
                            {commonReasons.map((commonReason, index) => (
                                <Button
                                    key={index}
                                    variant="outline-secondary"
                                    size="sm"
                                    className="mb-1"
                                    onClick={() => handleCommonReasonClick(commonReason)}
                                >
                                    {commonReason}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Enter detailed reason for refund (minimum 5 characters)..."
                        value={reason}
                        onChange={handleReasonChange}
                        isInvalid={validationError && validationError.includes("Reason")}
                    />
                    <Form.Text className="text-muted">
                        Please provide a clear and detailed reason for the refund.
                    </Form.Text>
                </Form.Group>

                <Form.Group className="mt-2">
                    <Form.Label>Refund Receipt Number (optional)</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Enter receipt number or leave blank to auto-generate"
                        value={receipt}
                        onChange={e => setReceipt(e.target.value)}
                    />
                    <Form.Text className="text-muted">
                        Auto-generated: REF-{selectedSaleId}-XXXX
                    </Form.Text>
                </Form.Group>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} disabled={processing}>
                    Cancel
                </Button>
                <Button
                    variant="danger"
                    onClick={handleRefundClick}
                    disabled={!isFormValid || processing}
                >
                    {processing ? (
                        <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Processing & Printing...
                        </>
                    ) : (
                        "🖨️ Process Refund & Print"
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default RefundModal;