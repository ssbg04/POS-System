import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_URL_INVENTORY;

export const getInventoryLogsAPI = async (product_id) => {
    const res = await axios.get({ BASE_URL, params: { product_id } });
    return res.data;
};

export const createInventoryLogAPI = async (log) => {
    const res = await axios.post(BASE_URL, log);
    return res.data;
};