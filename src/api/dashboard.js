const BASE_URL = import.meta.env.VITE_API_URL_DASHBOARD;

export const dashboardAPI = {
    getDashboardStats: async (startDate, endDate) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await fetch(`${BASE_URL}/stats?${params.toString()}`);

        if (!response.ok) {
            throw new Error('Failed to fetch dashboard stats');
        }

        return await response.json();
    },

    getSalesTrend: async (days = 7) => {
        const response = await fetch(`${BASE_URL}/sales-trend?days=${days}`);

        if (!response.ok) {
            throw new Error('Failed to fetch sales trend');
        }

        return await response.json();
    }
};