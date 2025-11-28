import { useState, useEffect } from 'react';
import { salesAPI } from '../api/sales';

export const useSales = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalSales: 0,
        hasNext: false,
        hasPrev: false
    });

    const fetchSales = async (page = 1, limit = 10) => {
        try {
            setLoading(true);
            setError(null);
            const response = await salesAPI.getSales(page, limit);
            setSales(response.sales || []);
            setPagination(response.pagination || {
                currentPage: page,
                totalPages: 1,
                totalSales: 0,
                hasNext: false,
                hasPrev: false
            });
        } catch (err) {
            setError(err.message);
            console.error('Error fetching sales:', err);
        } finally {
            setLoading(false);
        }
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= pagination.totalPages) {
            fetchSales(page);
        }
    };

    const createSale = async (saleData, userId) => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔧 createSale hook called with:', { saleData, userId });

            // Validate required data
            if (!userId) {
                throw new Error('User ID is required');
            }

            if (!saleData.items || !Array.isArray(saleData.items) || saleData.items.length === 0) {
                throw new Error('Sale items are required');
            }

            // Validate each item
            for (const item of saleData.items) {
                if (!item.product_id) {
                    throw new Error('All items must have a product_id');
                }
                if (!item.quantity || item.quantity <= 0) {
                    throw new Error('All items must have a valid quantity greater than 0');
                }
                if (!item.price && item.price !== 0) {
                    throw new Error('All items must have a price');
                }
            }

            // FIXED: Proper user data structure
            // Get user info from saleData if available, otherwise use minimal structure
            const userInfo = saleData.user || {
                id: userId,
                full_name: 'Cashier' // Fallback name
            };

            // Prepare API payload - MATCH THE BACKEND EXPECTED FORMAT
            const apiPayload = {
                user_id: userId,
                // FIXED: Send proper user data for receipt generation
                user: userInfo,
                items: saleData.items.map(item => ({
                    product_id: item.product_id,
                    quantity: parseInt(item.quantity, 10),
                    price: parseFloat(item.price),
                    name: item.name, // Include product name for receipt
                    total: item.total || (parseFloat(item.price) * parseInt(item.quantity, 10))
                })),
                payment_type: saleData.payment_type || 'cash',
                amount_tendered: parseFloat(saleData.amount_tendered) || 0,
                discount_type: saleData.discount_type || null,
                discount_amount: parseFloat(saleData.discount_amount) || 0,
                customer_name: saleData.customer_name || null,
                total: parseFloat(saleData.total) || 0,
                tax_amount: parseFloat(saleData.tax_amount) || 0,
                change_due: parseFloat(saleData.change_due) || 0
            };

            // Validate payment
            if (apiPayload.payment_type === 'cash' && apiPayload.amount_tendered <= 0) {
                throw new Error('Cash payment requires a valid amount tendered');
            }

            console.log('📤 Sending to API:', apiPayload);

            const newSale = await salesAPI.createSale(apiPayload);

            console.log('✅ Sale created successfully:', newSale);

            // FIXED: Ensure the returned sale has proper user data
            if (newSale && !newSale.users && !newSale.user) {
                newSale.users = {
                    full_name: userInfo.full_name || 'Cashier'
                };
            }

            // Refresh sales list
            await fetchSales(1);

            return newSale;

        } catch (err) {
            console.error('❌ Sale creation error:', err);

            // Provide more specific error messages
            let errorMessage = err.message;

            if (err.response) {
                // Handle HTTP error responses
                errorMessage = err.response.data?.error || err.response.statusText || `HTTP ${err.response.status}`;
            } else if (err.request) {
                // Handle network errors
                errorMessage = 'Network error: Cannot connect to server';
            }

            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const voidSale = async (sale_id) => {
        try {
            setLoading(true);
            setError(null);

            if (!sale_id) {
                throw new Error('Sale ID is required');
            }

            const result = await salesAPI.voidSale(sale_id);

            // Update local state
            setSales(prev => prev.map(sale =>
                sale.sale_id === parseInt(sale_id)
                    ? { ...sale, status: 'voided' }
                    : sale
            ));

            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const refundSale = async (sale_id) => {
        try {
            setLoading(true);
            setError(null);

            if (!sale_id) {
                throw new Error('Sale ID is required');
            }

            const result = await salesAPI.refundSale(sale_id);

            // Update local state
            setSales(prev => prev.map(sale =>
                sale.sale_id === parseInt(sale_id)
                    ? { ...sale, status: 'refunded' }
                    : sale
            ));

            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Clear error manually
    const clearError = () => setError(null);

    // Refresh sales data
    const refreshSales = () => fetchSales(pagination.currentPage);

    useEffect(() => {
        fetchSales();
    }, []);

    return {
        sales,
        loading,
        error,
        pagination,
        fetchSales,
        goToPage,
        createSale,
        voidSale,
        refundSale,
        clearError,
        refreshSales
    };
};