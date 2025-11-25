// client/src/api/reports.js
const BASE_URL = import.meta.env.VITE_API_URL_REPORTS; // Make sure you have this env variable

export const reportAPI = {
  getSummary: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/summary?${queryString}`);
    if (!response.ok) throw new Error("Failed to fetch summary");
    return response.json();
  },

  getSalesTrend: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/sales-trend?${queryString}`);
    if (!response.ok) throw new Error("Failed to fetch sales trend");
    return response.json();
  },

  getPaymentMethods: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/payment-methods?${queryString}`);
    if (!response.ok) throw new Error("Failed to fetch payment methods");
    return response.json();
  },

  getTopProducts: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/top-products?${queryString}`);
    if (!response.ok) throw new Error("Failed to fetch top products");
    return response.json();
  },
};
