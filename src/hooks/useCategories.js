import { useState, useEffect } from 'react';
import { fetchCategories } from '../api/categories';

export const useCategories = () => {
    const [categories, setCategories] = useState(["all"]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getCategories = async () => {
            try {
                const categoryNames = await fetchCategories();
                setCategories(["all", ...categoryNames]);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        getCategories();
    }, []);

    return { categories, loading, error };
};
