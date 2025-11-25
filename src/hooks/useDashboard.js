import { useState, useEffect } from "react";
import { dashboardAPI } from "../api/dashboard";

export const useDashboard = (refreshInterval = 30000) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async (startDate, endDate) => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardAPI.getDashboardStats(startDate, endDate);
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboard = () => {
    fetchDashboardData();
  };

  // Auto-refresh
  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(fetchDashboardData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return {
    dashboardData,
    loading,
    error,
    refreshDashboard,
    fetchDashboardData,
  };
};
