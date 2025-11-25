// src/hooks/useAuth.js
import { useState } from 'react';
import { authEmployee } from '../api/auth.js';
import { useAuthContext } from '../context/AuthContext.jsx';

export const useAuth = () => {
    const { login: setUserContext } = useAuthContext();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Login function
    const login = async (username, password) => {
        setLoading(true);
        setError(null);
        try {
            const data = await authEmployee(username, password); // returns user from API
            setEmployee(data); // optional if you want to keep in hook
            const userData = {
                user_id: data.user_id,
                username: data.username,
                full_name: data.full_name,
                role: data.role,
            };
            setUserContext(userData); // important: return user for Login page
            return data;
        } catch (err) {
            setError(err.response?.data?.message || err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { employee, loading, error, login };
};
