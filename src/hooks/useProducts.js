// hooks/useProducts.js
import { useState, useEffect, useCallback } from 'react';
import { productsAPI } from '../api/products';

export const useProducts = (search = "", category = "all", reload = false) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reloadTrigger, setReloadTrigger] = useState(0);

    const fetchProducts = useCallback(async () => {
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
    }, [search, category]);

    // Add this refresh function
    const refreshProducts = useCallback(async () => {
        await fetchProducts();
    }, [fetchProducts]);

    // Manual refresh trigger
    const triggerRefresh = useCallback(() => {
        setReloadTrigger(prev => prev + 1);
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchProducts();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [fetchProducts, reloadTrigger]); // Add reloadTrigger to dependencies

    return {
        products,
        loading,
        error,
        refreshProducts, // Export the refresh function
        triggerRefresh   // Alternative refresh method
    };
};