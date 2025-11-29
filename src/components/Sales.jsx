// components/Sales.jsx
import { useState, useEffect, useCallback } from "react";
import { useSales } from "../hooks/useSales";
import { useAuthContext } from "../context/AuthContext";
import RefundModal from "./RefundModal";

const Sales = () => {
    const { user } = useAuthContext();
    const { sales, loading, error, fetchAllSales, voidSale, refundSale } = useSales();
    const [selectedSale, setSelectedSale] = useState(null);
    const [actionModal, setActionModal] = useState({ show: false, type: '', sale: null });
    const [refundModal, setRefundModal] = useState({ show: false, sale: null });
    const [displayedSales, setDisplayedSales] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Configuration for lazy loading
    const ITEMS_PER_LOAD = 20;
    const SCROLL_THRESHOLD = 100; // pixels from bottom

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    };

    // Load initial data
    useEffect(() => {
        if (sales.length > 0) {
            const initialSales = sales.slice(0, ITEMS_PER_LOAD);
            setDisplayedSales(initialSales);
            setHasMore(sales.length > ITEMS_PER_LOAD);
        }
    }, [sales]);

    // Load more data function
    const loadMoreSales = useCallback(() => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);

        setTimeout(() => {
            const currentLength = displayedSales.length;
            const nextSales = sales.slice(currentLength, currentLength + ITEMS_PER_LOAD);

            setDisplayedSales(prev => [...prev, ...nextSales]);
            setHasMore(currentLength + ITEMS_PER_LOAD < sales.length);
            setLoadingMore(false);
        }, 300); // Small delay for better UX
    }, [displayedSales.length, sales, hasMore, loadingMore]);

    // Scroll event handler
    useEffect(() => {
        const handleScroll = () => {
            if (loadingMore || !hasMore) return;

            const scrollContainer = document.querySelector('.sales-table-container');
            if (!scrollContainer) return;

            const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

            if (distanceFromBottom < SCROLL_THRESHOLD) {
                loadMoreSales();
            }
        };

        const scrollContainer = document.querySelector('.sales-table-container');
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll);
            return () => scrollContainer.removeEventListener('scroll', handleScroll);
        }
    }, [loadMoreSales, hasMore, loadingMore]);

    // Keyboard shortcut for load more (Spacebar)
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.code === 'Space' && hasMore && !loadingMore) {
                e.preventDefault();
                loadMoreSales();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [loadMoreSales, hasMore, loadingMore]);

    const handleVoid = async (sale) => {
        try {
            await voidSale(sale.sale_id, user?.user_id);
            setActionModal({ show: false, type: '', sale: null });
            await fetchAllSales(); // Refresh the sales list
        } catch (err) {
            console.error('Failed to void sale:', err);
        }
    };

    const handleRefund = async (sale, reason, receipt) => {
        try {
            await refundSale(sale.sale_id, reason, receipt, user?.user_id);
            setRefundModal({ show: false, sale: null });
            await fetchAllSales(); // Refresh the sales list
        } catch (err) {
            console.error('Failed to refund sale:', err);
            throw err; // Re-throw to let RefundModal handle the error
        }
    };

    const openActionModal = (type, sale) => {
        if (type === 'refund') {
            setRefundModal({ show: true, sale });
        } else {
            setActionModal({ show: true, type, sale });
        }
    };

    const getStatusBadge = (status) => {
        const statusStyles = {
            completed: 'bg-success text-white',
            voided: 'bg-danger text-white',
            refunded: 'bg-warning text-dark'
        };

        return (
            <span className={`badge ${statusStyles[status] || 'bg-secondary'}`}>
                {status?.toUpperCase()}
            </span>
        );
    };

    const getPaymentBadge = (paymentType) => {
        const paymentStyles = {
            gcash: 'bg-success text-white',
            card: 'bg-primary text-white',
            cash: 'bg-secondary text-white'
        };

        return (
            <span className={`badge ${paymentStyles[paymentType] || 'bg-secondary'}`}>
                {paymentType?.toUpperCase()}
            </span>
        );
    };

    // Reset lazy loading when sales data changes
    useEffect(() => {
        setDisplayedSales([]);
        setHasMore(true);
    }, [sales]);

    if (loading && displayedSales.length === 0) return (
        <div className="d-flex justify-content-center align-items-center h-100 p-5">
            <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 mb-0">Loading sales...</p>
            </div>
        </div>
    );

    if (error && displayedSales.length === 0) return (
        <div className="d-flex justify-content-center align-items-center h-100 p-5">
            <div className="alert alert-danger text-center">
                <strong>Error:</strong> {error}
            </div>
        </div>
    );

    return (
        <div className="d-flex flex-column bg-body text-body h-100">
            {/* Header */}
            <div className="p-3 pb-0">
                <h1 className="h4 mb-3 fw-semibold">Sales Transactions</h1>
                <div className="d-flex justify-content-between align-items-center">
                    <p className="text-muted mb-0">
                        Showing {displayedSales.length} of {sales.length} sale{sales.length !== 1 ? 's' : ''}
                        {hasMore && !loadingMore && (
                            <span className="text-info ms-2">• Scroll down to load more</span>
                        )}
                    </p>
                    <div className="d-flex gap-2">
                        {hasMore && !loadingMore && (
                            <button
                                className="btn btn-outline-info btn-sm"
                                onClick={loadMoreSales}
                                title="Load more sales (Spacebar)"
                            >
                                Load More
                            </button>
                        )}
                        <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={fetchAllSales}
                            disabled={loading}
                        >
                            {loading ? 'Refreshing...' : 'Refresh All'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="mobile-pagination-sticky card flex-grow-1 m-3 mt-2 d-flex flex-column overflow-hidden">
                <div className="card-body p-0 d-flex flex-column flex-grow-1">
                    <div
                        className="table-responsive flex-grow-1 sales-table-container"
                        style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
                    >
                        <table className="table table-hover mb-0 align-middle" style={{ minWidth: '800px' }}>
                            <thead className="table-light position-sticky top-0" style={{ zIndex: 1 }}>
                                <tr>
                                    {/* Sale ID - hidden on mobile, visible on tablet and up */}
                                    <th
                                        scope="col"
                                        className="d-none d-md-table-cell"
                                        style={{ minWidth: '100px' }}
                                    >
                                        Sale ID
                                    </th>
                                    {/* Customer - always visible */}
                                    <th
                                        scope="col"
                                        style={{ minWidth: '120px' }}
                                    >
                                        Customer
                                    </th>
                                    {/* Date & Time - hidden on mobile, visible on large screens */}
                                    <th
                                        scope="col"
                                        className="d-none d-lg-table-cell"
                                        style={{ minWidth: '150px' }}
                                    >
                                        Date & Time
                                    </th>
                                    {/* Cashier - hidden on mobile, visible on extra large screens */}
                                    <th
                                        scope="col"
                                        className="d-none d-xl-table-cell"
                                        style={{ minWidth: '120px' }}
                                    >
                                        Cashier
                                    </th>
                                    {/* Payment - always visible */}
                                    <th
                                        scope="col"
                                        style={{ minWidth: '100px' }}
                                    >
                                        Payment
                                    </th>
                                    {/* Status - always visible */}
                                    <th
                                        scope="col"
                                        style={{ minWidth: '100px' }}
                                    >
                                        Status
                                    </th>
                                    {/* Total - always visible */}
                                    <th
                                        scope="col"
                                        style={{ minWidth: '100px' }}
                                    >
                                        Total
                                    </th>
                                    {/* Actions - always visible */}
                                    <th
                                        scope="col"
                                        style={{ minWidth: '150px' }}
                                    >
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedSales.map((sale) => (
                                    <tr key={sale.sale_id}>
                                        {/* Sale ID */}
                                        <td className="d-none d-md-table-cell fw-medium">
                                            #{sale.sale_id}
                                        </td>
                                        {/* Customer */}
                                        <td>
                                            <div className="d-flex flex-column">
                                                {sale.customer_name ? (
                                                    <span className="fw-medium text-primary text-truncate" style={{ maxWidth: '120px' }}>
                                                        {sale.customer_name}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted">Walk-in</span>
                                                )}
                                                {/* Mobile-only date */}
                                                <small className="d-lg-none text-muted mt-1">
                                                    {new Date(sale.sale_date).toLocaleDateString()}
                                                </small>
                                            </div>
                                        </td>
                                        {/* Date & Time */}
                                        <td className="d-none d-lg-table-cell text-muted small">
                                            {formatDate(sale.sale_date)}
                                        </td>
                                        {/* Cashier */}
                                        <td className="d-none d-xl-table-cell text-muted">
                                            <div className="text-truncate" style={{ maxWidth: '120px' }}>
                                                {sale.users?.full_name || 'N/A'}
                                            </div>
                                        </td>
                                        {/* Payment */}
                                        <td>
                                            {getPaymentBadge(sale.payment_type)}
                                        </td>
                                        {/* Status */}
                                        <td>
                                            {getStatusBadge(sale.status)}
                                        </td>
                                        {/* Total */}
                                        <td className="fw-bold text-success text-nowrap">
                                            {formatCurrency(sale.total_amount)}
                                        </td>
                                        {/* Actions */}
                                        <td>
                                            <div className="d-flex gap-1 flex-wrap">
                                                <button
                                                    onClick={() => setSelectedSale(sale)}
                                                    className="btn btn-primary btn-sm"
                                                >
                                                    <span className="d-none d-sm-inline">View</span>
                                                    <span className="d-inline d-sm-none">👁️</span>
                                                </button>
                                                {sale.status === 'completed' && (
                                                    <>
                                                        <button
                                                            onClick={() => openActionModal('void', sale)}
                                                            className="btn btn-danger btn-sm"
                                                        >
                                                            <span className="d-none d-sm-inline">Void</span>
                                                            <span className="d-inline d-sm-none">❌</span>
                                                        </button>
                                                        <button
                                                            onClick={() => openActionModal('refund', sale)}
                                                            className="btn btn-warning btn-sm"
                                                        >
                                                            <span className="d-none d-sm-inline">Refund</span>
                                                            <span className="d-inline d-sm-none">↩️</span>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Loading More Indicator */}
                        {loadingMore && (
                            <div className="text-center py-3">
                                <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                                    <span className="visually-hidden">Loading more...</span>
                                </div>
                                <span className="text-muted">Loading more sales...</span>
                            </div>
                        )}

                        {/* End of List Indicator */}
                        {!hasMore && displayedSales.length > 0 && (
                            <div className="text-center py-3 border-top">
                                <span className="text-muted">
                                    <i className="bi bi-check-circle text-success me-2"></i>
                                    All {sales.length} sales loaded
                                </span>
                            </div>
                        )}
                    </div>

                    {displayedSales.length === 0 && !loading && (
                        <div className="d-flex justify-content-center align-items-center p-5 flex-grow-1">
                            <div className="text-center">
                                <i className="bi bi-receipt fs-1 text-muted"></i>
                                <p className="mt-2 mb-0 text-muted">No sales transactions found.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sale Details Modal */}
            {selectedSale && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Sale Details #{selectedSale.sale_id}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setSelectedSale(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {/* Sale Information */}
                                <div className="row g-3 mb-4">
                                    <div className="col-12 col-sm-6 col-md-4">
                                        <label className="form-label text-muted small mb-1">Date & Time</label>
                                        <p className="fw-medium mb-0 small">{formatDate(selectedSale.sale_date)}</p>
                                    </div>
                                    <div className="col-12 col-sm-6 col-md-4">
                                        <label className="form-label text-muted small mb-1">Cashier</label>
                                        <p className="fw-medium mb-0 small">{selectedSale.users?.full_name || 'N/A'}</p>
                                    </div>
                                    <div className="col-12 col-sm-6 col-md-4">
                                        <label className="form-label text-muted small mb-1">Customer Name</label>
                                        <p className="fw-medium mb-0 small">
                                            {selectedSale.customer_name || (
                                                <span className="text-muted">Walk-in Customer</span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="col-12 col-sm-6 col-md-4">
                                        <label className="form-label text-muted small mb-1">Payment Method</label>
                                        <p className="mb-0">{getPaymentBadge(selectedSale.payment_type)}</p>
                                    </div>
                                    <div className="col-12 col-sm-6 col-md-4">
                                        <label className="form-label text-muted small mb-1">Status</label>
                                        <p className="mb-0">{getStatusBadge(selectedSale.status)}</p>
                                    </div>
                                    {selectedSale.refunded_at && (
                                        <div className="col-12 col-sm-6 col-md-4">
                                            <label className="form-label text-muted small mb-1">Refunded At</label>
                                            <p className="fw-medium mb-0 small">{formatDate(selectedSale.refunded_at)}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Refund Information - Only show if sale is refunded */}
                                {selectedSale.status === 'refunded' && (
                                    <div className="card mb-4 border-warning">
                                        <div className="card-header bg-warning bg-opacity-10">
                                            <h6 className="card-title mb-0 text-warning">
                                                <i className="bi bi-arrow-counterclockwise me-2"></i>
                                                Refund Information
                                            </h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="row g-3">
                                                <div className="col-12">
                                                    <label className="form-label text-muted small mb-1">Refund Reason</label>
                                                    <p className="fw-medium mb-0">
                                                        {selectedSale.refund_reason || 'No reason provided'}
                                                    </p>
                                                </div>
                                                {selectedSale.refund_receipt && (
                                                    <div className="col-12 col-sm-6">
                                                        <label className="form-label text-muted small mb-1">Refund Receipt</label>
                                                        <p className="fw-medium mb-0">{selectedSale.refund_receipt}</p>
                                                    </div>
                                                )}
                                                {selectedSale.refunded_at && (
                                                    <div className="col-12 col-sm-6">
                                                        <label className="form-label text-muted small mb-1">Refund Date</label>
                                                        <p className="fw-medium mb-0">{formatDate(selectedSale.refunded_at)}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Financial Summary */}
                                <div className="card mb-4">
                                    <div className="card-header">
                                        <h6 className="card-title mb-0">Financial Summary</h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="row g-2">
                                            <div className="col-12 col-sm-6">
                                                <small className="text-muted">Subtotal:</small>
                                                <p className="fw-medium mb-0">
                                                    ₱{(selectedSale.total_amount + (selectedSale.discount_amount || 0) - (selectedSale.tax_amount || 0)).toFixed(2)}
                                                </p>
                                            </div>
                                            {selectedSale.discount_amount > 0 && (
                                                <div className="col-12 col-sm-6">
                                                    <small className="text-muted">Discount:</small>
                                                    <p className="fw-medium text-success mb-0">
                                                        -₱{selectedSale.discount_amount?.toFixed(2)}
                                                    </p>
                                                </div>
                                            )}
                                            {selectedSale.tax_amount > 0 && (
                                                <div className="col-12 col-sm-6">
                                                    <small className="text-muted">Tax:</small>
                                                    <p className="fw-medium mb-0">
                                                        ₱{selectedSale.tax_amount?.toFixed(2)}
                                                    </p>
                                                </div>
                                            )}
                                            <div className="col-12 border-top pt-2 mt-2">
                                                <small className="text-muted">Total Amount:</small>
                                                <p className={`fw-bold fs-5 mb-0 ${selectedSale.status === 'refunded' ? 'text-warning' : 'text-success'
                                                    }`}>
                                                    ₱{selectedSale.total_amount?.toFixed(2)}
                                                    {selectedSale.status === 'refunded' && (
                                                        <span className="badge bg-warning text-dark ms-2">REFUNDED</span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="col-12 col-sm-6">
                                                <small className="text-muted">Amount Tendered:</small>
                                                <p className="fw-medium mb-0">
                                                    ₱{selectedSale.amount_tendered?.toFixed(2)}
                                                </p>
                                            </div>
                                            {selectedSale.change_due > 0 && (
                                                <div className="col-12 col-sm-6">
                                                    <small className="text-muted">Change Due:</small>
                                                    <p className="fw-medium text-success mb-0">
                                                        ₱{selectedSale.change_due?.toFixed(2)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <h6 className="fw-bold mb-3">Items Purchased</h6>
                                <div className="table-responsive">
                                    <table className="table table-sm">
                                        <thead className="table-light">
                                            <tr>
                                                <th style={{ minWidth: '150px' }}>Product</th>
                                                <th className="text-center" style={{ minWidth: '80px' }}>Qty</th>
                                                <th className="text-end" style={{ minWidth: '100px' }}>Price</th>
                                                <th className="text-end" style={{ minWidth: '100px' }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedSale.sale_items?.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="fw-medium text-truncate" style={{ maxWidth: '200px' }}>
                                                        {item.products?.name}
                                                    </td>
                                                    <td className="text-center">{item.quantity}</td>
                                                    <td className="text-end">{formatCurrency(item.price)}</td>
                                                    <td className="text-end fw-bold">{formatCurrency(item.price * item.quantity)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setSelectedSale(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Void Confirmation Modal */}
            {actionModal.show && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    Confirm Void
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setActionModal({ show: false, type: '', sale: null })}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p className="mb-0">
                                    Are you sure you want to void sale #{actionModal.sale.sale_id}?
                                    This action cannot be undone.
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={() => handleVoid(actionModal.sale)}
                                >
                                    Yes, Void
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setActionModal({ show: false, type: '', sale: null })}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Refund Modal */}
            <RefundModal
                show={refundModal.show}
                onClose={() => setRefundModal({ show: false, sale: null })}
                sales={refundModal.sale ? [refundModal.sale] : []}
                loading={loading}
                onRefund={(sale_id, reason, receipt) =>
                    handleRefund(refundModal.sale, reason, receipt)
                }
            />
        </div>
    );
};

export default Sales;