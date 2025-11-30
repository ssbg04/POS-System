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

        const user_id = user.user_id ?? user.id;

        if (!product_id || !action || quantity === undefined || !user_id) {
            throw new Error("Missing required fields for inventory log");
        }

        // For 'adjust', send the quantity exactly
        const payload = {
            product_id,
            user_id,
            action,
            quantity: action === "adjust" ? quantity : Math.abs(quantity),
            remarks
        };

        const created = await createInventoryLogAPI(payload);

        setLogs(prev => [created, ...prev]);
        return created;
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