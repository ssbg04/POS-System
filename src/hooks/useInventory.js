import { useAuthContext } from "../context/AuthContext";
import { createInventoryLogAPI, getInventoryLogsAPI } from "../api/inventory";
import { useState, useEffect } from "react";

export const useInventory = (initialProductId = null) => {
    const { user } = useAuthContext();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchLogs = async (product_id = initialProductId) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getInventoryLogsAPI(product_id);
            setLogs(data || []);
            return data;
        } catch (err) {
            setError(err.message || "Failed to fetch inventory logs");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const addLog = async ({ product_id, action, quantity, remarks }) => {
        if (!user || (user.user_id === undefined && user.id === undefined)) {
            throw new Error("User not logged in");
        }

        const user_id = user.user_id ?? user.id; // support both keys

        // Validate
        if (!product_id || !action || !quantity || !user_id) {
            throw new Error("Missing required fields for inventory log");
        }

        try {
            const payload = { product_id, user_id, action, quantity, remarks };
            const created = await createInventoryLogAPI(payload);

            // update local logs cache
            setLogs(prev => [created, ...prev]);
            return created;
        } catch (err) {
            console.error("addLog error", err);
            throw err;
        }
    };

    const updateInventory = (...args) => addLog(...args);

    useEffect(() => {
        // initial load if initialProductId present (or always load logs)
        fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialProductId]);

    return { logs, addLog, loading, error, fetchLogs, updateInventory };
};
export default useInventory;