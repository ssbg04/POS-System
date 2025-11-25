// hooks/useProducts.js
import { useState, useEffect } from 'react'; // Add this import
import { productsAPI } from '../api/products';

export const useProducts = (search = "", category = "all", reload = false) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            try {
                setLoading(true);
                setError(null);
                const productsData = await productsAPI.getProducts(search, category);
                setProducts(productsData || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [search, category, reload]);

    return { products, loading, error };
};