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

  createSale: async (saleData) => {
    try {
      const response = await fetch(`${BASE_URL}/create-sale`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        // Extract error message from response
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

  voidSale: async (sale_id) => {
    try {
      const response = await fetch(`${BASE_URL}/void-sale/${sale_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
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

  refundSale: async (sale_id) => {
    try {
      const response = await fetch(`${BASE_URL}/refund-sale/${sale_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorMessage = `Failed to refund sale: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = `Failed to refund sale: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      console.error("Error refunding sale:", error);
      throw error;
    }
  },

  // Optional: Add method to get payment methods for reports
  getPaymentMethods: async (range = "month") => {
    try {
      const response = await fetch(
        `${BASE_URL}/payment-methods?range=${range}`
      );

      if (!response.ok) {
        let errorMessage = `Failed to fetch payment methods: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = `Failed to fetch payment methods: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      throw error;
    }
  },
};
