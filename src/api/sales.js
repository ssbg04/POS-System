// api/sales.js
const BASE_URL = import.meta.env.VITE_API_URL_SALES;

export const salesAPI = {
  getSales: async (page = 1, limit = 10) => {
    try {
      const response = await fetch(
        `${BASE_URL}/get-sales?page=${page}&limit=${limit}`
      );

      if (!response.ok) {
        let errorMessage = `Failed to fetch sales: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = `Failed to fetch sales: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      console.error("Error fetching sales:", error);
      throw error;
    }
  },

  // In api/sales.js - createSale function
  // Remove total from the items when sending to the API
  createSale: async (saleData) => {
    try {
      // Remove total from items if present
      const sanitizedSaleData = {
        ...saleData,
        items: saleData.items.map(item => {
          const { total, ...itemWithoutTotal } = item;
          return itemWithoutTotal;
        })
      };

      const response = await fetch(`${BASE_URL}/create-sale`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sanitizedSaleData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API call failed:", error);
      throw error;
    }
  },

  voidSale: async (sale_id, user_id = null) => {
    try {
      const payload = user_id ? { user_id } : {};

      const response = await fetch(`${BASE_URL}/void-sale/${sale_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorMessage = `Failed to void sale: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = `Failed to void sale: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      console.error("Error voiding sale:", error);
      throw error;
    }
  },

  refundSale: async (sale_id, refundData) => {
    try {
      // Validate reason before making the API call
      const reason = refundData?.reason;
      const receipt = refundData?.receipt;
      const user_id = refundData?.user_id || null;

      if (!reason || typeof reason !== 'string') {
        throw new Error("Refund reason is required");
      }

      const trimmedReason = reason.trim();
      if (!trimmedReason) {
        throw new Error("Refund reason cannot be empty");
      }

      if (trimmedReason.length < 3) {
        throw new Error("Refund reason must be at least 3 characters long");
      }

      const payload = {
        reason: trimmedReason,
        receipt: receipt?.trim() || null,
        user_id: user_id
      };

      const response = await fetch(`${BASE_URL}/refund-sale/${sale_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Failed to refund sale: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error refunding sale:", error);
      throw error;
    }
  },

  // Get all sales without pagination (for exports, reports, etc.)
  getAllSales: async () => {
    try {
      let allSales = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(
          `${BASE_URL}/get-sales?page=${page}&limit=100`
        );

        if (!response.ok) {
          let errorMessage = `Failed to fetch sales: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            errorMessage = `Failed to fetch sales: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        allSales = [...allSales, ...data.sales];

        hasMore = data.pagination?.hasNext || false;
        page++;
      }

      return allSales;
    } catch (error) {
      console.error("Error fetching all sales:", error);
      throw error;
    }
  },

  // Get sales by date range
  getSalesByDateRange: async (startDate, endDate, page = 1, limit = 50) => {
    try {
      // Note: This would require a new endpoint in the Edge Function
      // For now, we'll filter client-side from all sales
      console.warn('getSalesByDateRange: Currently filters client-side. Consider implementing server-side filtering.');

      const allSales = await salesAPI.getAllSales();
      const filteredSales = allSales.filter(sale => {
        const saleDate = new Date(sale.sale_date);
        return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
      });

      // Implement client-side pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedSales = filteredSales.slice(startIndex, endIndex);

      return {
        sales: paginatedSales,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(filteredSales.length / limit),
          totalSales: filteredSales.length,
          hasNext: endIndex < filteredSales.length,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error("Error fetching sales by date range:", error);
      throw error;
    }
  },

  // Get sale by ID
  getSaleById: async (sale_id) => {
    try {
      // Since we don't have a direct endpoint, fetch all and filter
      const allSales = await salesAPI.getAllSales();
      const sale = allSales.find(s => s.sale_id === parseInt(sale_id));

      if (!sale) {
        throw new Error(`Sale with ID ${sale_id} not found`);
      }

      return sale;
    } catch (error) {
      console.error("Error fetching sale by ID:", error);
      throw error;
    }
  },

  // Get sales statistics
  getSalesStats: async () => {
    try {
      const allSales = await salesAPI.getAllSales();

      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const todaySales = allSales.filter(sale =>
        new Date(sale.sale_date) >= startOfToday && sale.status === 'completed'
      );
      const weekSales = allSales.filter(sale =>
        new Date(sale.sale_date) >= startOfWeek && sale.status === 'completed'
      );
      const monthSales = allSales.filter(sale =>
        new Date(sale.sale_date) >= startOfMonth && sale.status === 'completed'
      );

      return {
        totalSales: allSales.filter(s => s.status === 'completed').length,
        totalRevenue: allSales
          .filter(s => s.status === 'completed')
          .reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0),
        todaySales: todaySales.length,
        todayRevenue: todaySales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0),
        weekSales: weekSales.length,
        weekRevenue: weekSales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0),
        monthSales: monthSales.length,
        monthRevenue: monthSales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0),
        voidedSales: allSales.filter(s => s.status === 'voided').length,
        refundedSales: allSales.filter(s => s.status === 'refunded').length
      };
    } catch (error) {
      console.error("Error fetching sales stats:", error);
      throw error;
    }
  },

  // Optional: Get payment methods for reports (placeholder - would need backend implementation)
  getPaymentMethods: async (range = "month") => {
    try {
      // This is a placeholder - you would need to implement this in the Edge Function
      console.warn('getPaymentMethods: This endpoint needs backend implementation');

      const allSales = await salesAPI.getAllSales();
      const paymentMethods = allSales.reduce((acc, sale) => {
        if (sale.status === 'completed') {
          acc[sale.payment_type] = (acc[sale.payment_type] || 0) + 1;
        }
        return acc;
      }, {});

      return paymentMethods;
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      throw error;
    }
  },
};