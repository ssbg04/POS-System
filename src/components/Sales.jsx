// components/Sales.jsx
import { useState } from "react";
import { useSales } from "../hooks/useSales";
import { useAuthContext } from "../context/AuthContext";

const Sales = () => {
    const { user } = useAuthContext();
    const { sales, loading, error, pagination, goToPage, voidSale, refundSale } = useSales();
    const [selectedSale, setSelectedSale] = useState(null);
    const [actionModal, setActionModal] = useState({ show: false, type: '', sale: null });

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

    const handleVoid = async (sale) => {
        try {
            await voidSale(sale.sale_id);
            setActionModal({ show: false, type: '', sale: null });
            goToPage(pagination.currentPage);
        } catch (err) {
            console.error('Failed to void sale:', err);
        }
    };

    const handleRefund = async (sale) => {
        try {
            await refundSale(sale.sale_id);
            setActionModal({ show: false, type: '', sale: null });
            goToPage(pagination.currentPage);
        } catch (err) {
            console.error('Failed to refund sale:', err);
        }
    };

    const openActionModal = (type, sale) => {
        setActionModal({ show: true, type, sale });
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

    const renderPagination = () => {
        if (pagination.totalPages <= 1) return null;

        return (
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center p-3 border-top">
                <div className="mb-2 mb-sm-0">
                    <p className="text-muted small mb-0">
                        Showing <strong>{(pagination.currentPage - 1) * 10 + 1}</strong> to{' '}
                        <strong>{Math.min(pagination.currentPage * 10, pagination.totalSales)}</strong> of{' '}
                        <strong>{pagination.totalSales}</strong> results
                    </p>
                </div>
                <div className="d-flex gap-2 align-items-center">
                    <button
                        onClick={() => goToPage(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className="btn btn-outline-primary btn-sm"
                    >
                        Previous
                    </button>
                    <span className="text-muted small">
                        Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => goToPage(pagination.currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="btn btn-outline-primary btn-sm"
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center h-100 p-5">
            <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 mb-0">Loading sales...</p>
            </div>
        </div>
    );

    if (error) return (
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
            </div>

            {/* Table Container */}
            <div className="card flex-grow-1 m-3 mt-2 d-flex flex-column overflow-hidden">
                <div className="card-body p-0 d-flex flex-column flex-grow-1">
                    <div className="table-responsive flex-grow-1">
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
                                {sales.map((sale) => (
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
                    </div>

                    {sales.length === 0 && (
                        <div className="d-flex justify-content-center align-items-center p-5 flex-grow-1">
                            <div className="text-center">
                                <i className="bi bi-receipt fs-1 text-muted"></i>
                                <p className="mt-2 mb-0 text-muted">No sales transactions found.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {renderPagination()}
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
                                </div>

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
                                                <p className="fw-bold fs-5 text-success mb-0">
                                                    ₱{selectedSale.total_amount?.toFixed(2)}
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
                                                    <td className="text-end fw-bold">{formatCurrency(item.total)}</td>
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

            {/* Void/Refund Confirmation Modal */}
            {actionModal.show && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {actionModal.type === 'void' ? 'Confirm Void' : 'Confirm Refund'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setActionModal({ show: false, type: '', sale: null })}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p className="mb-0">
                                    Are you sure you want to {actionModal.type} sale #{actionModal.sale.sale_id}?
                                    {actionModal.type === 'void' && ' This action cannot be undone.'}
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className={`btn ${actionModal.type === 'void' ? 'btn-danger' : 'btn-warning'}`}
                                    onClick={() => actionModal.type === 'void'
                                        ? handleVoid(actionModal.sale)
                                        : handleRefund(actionModal.sale)
                                    }
                                >
                                    Yes, {actionModal.type === 'void' ? 'Void' : 'Refund'}
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
        </div>
    );
};

export default Sales;