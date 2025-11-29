import { useState, useEffect } from 'react';
import { salesAPI } from '../api/sales';

export const useSales = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);

    const fetchAllSales = async () => {
        try {
            setLoading(true);
            setError(null);

            const allSales = await salesAPI.getAllSales();
            setSales(allSales);
            return allSales;
        } catch (err) {
            console.error('Error fetching all sales:', err);
            setError(err.message || 'Failed to fetch sales');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch sales with pagination
     * @param {number} page - Page number (default: 1)
     * @param {number} limit - Items per page (default: 10)
     */
    const fetchSales = async (page = 1, limit = 10) => {
        try {
            setLoading(true);
            setError(null);

            const response = await salesAPI.getSales(page, limit);
            setSales(response.sales);
            return response;
        } catch (err) {
            console.error('Error fetching sales:', err);
            setError(err.message || 'Failed to fetch sales');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch sales by date range
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @param {number} page - Page number (default: 1)
     * @param {number} limit - Items per page (default: 50)
     */
    const fetchSalesByDateRange = async (startDate, endDate, page = 1, limit = 50) => {
        try {
            setLoading(true);
            setError(null);

            const response = await salesAPI.getSalesByDateRange(startDate, endDate, page, limit);
            setSales(response.sales);
            return response;
        } catch (err) {
            console.error('Error fetching sales by date range:', err);
            setError(err.message || 'Failed to fetch sales');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch a single sale by ID
     * @param {number|string} sale_id - ID of the sale to fetch
     */
    const fetchSaleById = async (sale_id) => {
        try {
            setLoading(true);
            setError(null);

            const sale = await salesAPI.getSaleById(sale_id);
            return sale;
        } catch (err) {
            console.error('Error fetching sale by ID:', err);
            setError(err.message || 'Failed to fetch sale');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch sales statistics
     */
    const fetchSalesStats = async () => {
        try {
            setLoading(true);
            setError(null);

            const statsData = await salesAPI.getSalesStats();
            setStats(statsData);
            return statsData;
        } catch (err) {
            console.error('Error fetching sales stats:', err);
            setError(err.message || 'Failed to fetch sales statistics');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Void a sale
     * @param {number|string} sale_id - ID of the sale to void
     * @param {string} user_id - Optional user ID for audit tracking
     */
    const voidSale = async (sale_id, user_id = null) => {
        try {
            setLoading(true);
            setError(null);

            const result = await salesAPI.voidSale(sale_id, user_id);

            // Update local sales state
            const id = Number(sale_id);
            setSales(prev =>
                prev.map(sale =>
                    sale.sale_id === id
                        ? {
                            ...sale,
                            status: 'voided',
                            voided_at: new Date().toISOString()
                        }
                        : sale
                )
            );

            // Update stats if available
            if (stats) {
                const saleToVoid = sales.find(s => s.sale_id === id);
                setStats(prev => ({
                    ...prev,
                    voidedSales: (prev.voidedSales || 0) + 1,
                    totalSales: Math.max(0, (prev.totalSales || 0) - 1),
                    totalRevenue: Math.max(0, (prev.totalRevenue || 0) - (saleToVoid?.total_amount || 0)),
                    // Update period revenues if this sale falls within those periods
                    ...(isSaleInPeriod(saleToVoid, 'today') && {
                        todaySales: Math.max(0, (prev.todaySales || 0) - 1),
                        todayRevenue: Math.max(0, (prev.todayRevenue || 0) - (saleToVoid?.total_amount || 0))
                    }),
                    ...(isSaleInPeriod(saleToVoid, 'week') && {
                        weekSales: Math.max(0, (prev.weekSales || 0) - 1),
                        weekRevenue: Math.max(0, (prev.weekRevenue || 0) - (saleToVoid?.total_amount || 0))
                    }),
                    ...(isSaleInPeriod(saleToVoid, 'month') && {
                        monthSales: Math.max(0, (prev.monthSales || 0) - 1),
                        monthRevenue: Math.max(0, (prev.monthRevenue || 0) - (saleToVoid?.total_amount || 0))
                    })
                }));
            }

            return result;
        } catch (err) {
            console.error('Void error:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Refund a sale
     * @param {number|string} sale_id - ID of the sale to refund
     * @param {string} reason - Reason for refund
     * @param {string} receipt - Optional refund receipt number
     * @param {string} user_id - Optional user ID for audit tracking
     */
    const refundSale = async (sale_id, reason, receipt, user_id = null) => {
        try {
            setLoading(true);
            setError(null);

            const safeReceipt = receipt?.trim() || null;

            const result = await salesAPI.refundSale(sale_id, {
                reason: reason,
                receipt: safeReceipt,
                user_id: user_id
            });

            // Update local sales state
            const id = Number(sale_id);
            setSales(prev =>
                prev.map(sale =>
                    sale.sale_id === id
                        ? {
                            ...sale,
                            status: 'refunded',
                            refund_reason: reason.trim(),
                            refund_receipt: safeReceipt,
                            refunded_at: new Date().toISOString(),
                            refunded_by: user_id
                        }
                        : sale
                )
            );

            // Update stats if available
            if (stats) {
                const saleToRefund = sales.find(s => s.sale_id === id);
                setStats(prev => ({
                    ...prev,
                    refundedSales: (prev.refundedSales || 0) + 1,
                    totalSales: Math.max(0, (prev.totalSales || 0) - 1),
                    totalRevenue: Math.max(0, (prev.totalRevenue || 0) - (saleToRefund?.total_amount || 0)),
                    // Update period revenues if this sale falls within those periods
                    ...(isSaleInPeriod(saleToRefund, 'today') && {
                        todaySales: Math.max(0, (prev.todaySales || 0) - 1),
                        todayRevenue: Math.max(0, (prev.todayRevenue || 0) - (saleToRefund?.total_amount || 0))
                    }),
                    ...(isSaleInPeriod(saleToRefund, 'week') && {
                        weekSales: Math.max(0, (prev.weekSales || 0) - 1),
                        weekRevenue: Math.max(0, (prev.weekRevenue || 0) - (saleToRefund?.total_amount || 0))
                    }),
                    ...(isSaleInPeriod(saleToRefund, 'month') && {
                        monthSales: Math.max(0, (prev.monthSales || 0) - 1),
                        monthRevenue: Math.max(0, (prev.monthRevenue || 0) - (saleToRefund?.total_amount || 0))
                    })
                }));
            }

            return result;
        } catch (err) {
            console.error('Refund error:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Create a new sale
     * @param {Object} saleData - Sale data including items, user_id, etc.
     */
    const createSale = async (saleData) => {
        try {
            setLoading(true);
            setError(null);

            const result = await salesAPI.createSale(saleData);

            // Add new sale to local state
            setSales(prev => [result, ...prev]);

            // Update stats if available
            if (stats) {
                const saleDate = new Date(result.sale_date);
                const now = new Date();
                const isToday = saleDate.toDateString() === now.toDateString();
                const isThisWeek = getWeekNumber(saleDate) === getWeekNumber(now);
                const isThisMonth = saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();

                setStats(prev => ({
                    ...prev,
                    totalSales: (prev.totalSales || 0) + 1,
                    totalRevenue: (prev.totalRevenue || 0) + parseFloat(result.total_amount),
                    ...(isToday && {
                        todaySales: (prev.todaySales || 0) + 1,
                        todayRevenue: (prev.todayRevenue || 0) + parseFloat(result.total_amount)
                    }),
                    ...(isThisWeek && {
                        weekSales: (prev.weekSales || 0) + 1,
                        weekRevenue: (prev.weekRevenue || 0) + parseFloat(result.total_amount)
                    }),
                    ...(isThisMonth && {
                        monthSales: (prev.monthSales || 0) + 1,
                        monthRevenue: (prev.monthRevenue || 0) + parseFloat(result.total_amount)
                    })
                }));
            }

            return result;
        } catch (err) {
            console.error('Create sale error:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Get payment methods report
     * @param {string} range - Time range for report (default: "month")
     */
    const getPaymentMethods = async (range = "month") => {
        try {
            setLoading(true);
            setError(null);

            const result = await salesAPI.getPaymentMethods(range);
            return result;
        } catch (err) {
            console.error('Payment methods error:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Search sales by customer name or sale ID
     * @param {string} query - Search query
     */
    const searchSales = async (query) => {
        try {
            setLoading(true);
            setError(null);

            if (!query.trim()) {
                await fetchAllSales();
                return;
            }

            const allSales = await salesAPI.getAllSales();
            const filteredSales = allSales.filter(sale =>
                sale.customer_name?.toLowerCase().includes(query.toLowerCase()) ||
                sale.sale_id.toString().includes(query)
            );

            setSales(filteredSales);
            return filteredSales;
        } catch (err) {
            console.error('Search sales error:', err);
            setError(err.message || 'Failed to search sales');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Filter sales by status
     * @param {string} status - Status to filter by
     */
    const filterSalesByStatus = async (status) => {
        try {
            setLoading(true);
            setError(null);

            if (!status) {
                await fetchAllSales();
                return;
            }

            const allSales = await salesAPI.getAllSales();
            const filteredSales = allSales.filter(sale => sale.status === status);
            setSales(filteredSales);
            return filteredSales;
        } catch (err) {
            console.error('Filter sales error:', err);
            setError(err.message || 'Failed to filter sales');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Export sales data
     * @param {string} format - Export format ('csv' or 'json')
     * @param {string} startDate - Optional start date for filtering
     * @param {string} endDate - Optional end date for filtering
     */
    const exportSales = async (format = 'json', startDate = null, endDate = null) => {
        try {
            setLoading(true);
            setError(null);

            let salesToExport = sales;

            // If date range provided, fetch filtered sales
            if (startDate && endDate) {
                const response = await salesAPI.getSalesByDateRange(startDate, endDate, 1, 10000);
                salesToExport = response.sales;
            }

            if (format === 'csv') {
                // Convert to CSV
                const headers = ['Sale ID', 'Date', 'Customer', 'Payment Type', 'Status', 'Total Amount', 'Cashier'];
                const csvData = salesToExport.map(sale => [
                    sale.sale_id,
                    new Date(sale.sale_date).toLocaleDateString(),
                    sale.customer_name || 'Walk-in',
                    sale.payment_type,
                    sale.status,
                    sale.total_amount,
                    sale.users?.full_name || 'N/A'
                ]);

                const csvContent = [
                    headers.join(','),
                    ...csvData.map(row => row.join(','))
                ].join('\n');

                return csvContent;
            } else {
                // Return as JSON
                return JSON.stringify(salesToExport, null, 2);
            }
        } catch (err) {
            console.error('Export sales error:', err);
            setError(err.message || 'Failed to export sales');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Helper function to check if sale is in period
    const isSaleInPeriod = (sale, period) => {
        if (!sale) return false;

        const saleDate = new Date(sale.sale_date);
        const now = new Date();

        switch (period) {
            case 'today':
                return saleDate.toDateString() === now.toDateString();
            case 'week':
                return getWeekNumber(saleDate) === getWeekNumber(now);
            case 'month':
                return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
            default:
                return false;
        }
    };

    // Helper function to get week number
    const getWeekNumber = (date) => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    // Clear error state
    const clearError = () => setError(null);

    // Reset sales to initial state
    const resetSales = () => {
        setSales([]);
        setStats(null);
        setError(null);
    };

    // Refresh stats when sales change
    useEffect(() => {
        if (sales.length > 0) {
            fetchSalesStats().catch(console.error);
        }
    }, [sales.length]);

    // Initial data fetch
    useEffect(() => {
        fetchAllSales();
    }, []);

    return {
        // State
        sales,
        loading,
        error,
        stats,

        // Data fetching
        fetchAllSales,
        fetchSales,
        fetchSalesByDateRange,
        fetchSaleById,
        fetchSalesStats,

        // Sales operations
        createSale,
        voidSale,
        refundSale,

        // Search and filtering
        searchSales,
        filterSalesByStatus,

        // Reports and exports
        getPaymentMethods,
        exportSales,

        // Utilities
        clearError,
        resetSales
    };
};