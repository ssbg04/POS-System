import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL_AUTH;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer HAHAHA`,
  },
});

export const authEmployee = async (username, password) => {
  const res = await apiClient.post("/", { username, password });
  return res.data;
};
