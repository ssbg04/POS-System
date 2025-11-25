import { useState, useEffect } from 'react';
import { reportAPI } from '../api/reports';

export function useSummary(range = 'month', extraParams = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        reportAPI.getSummary({ range, ...extraParams })
            .then(res => setData(res))
            .catch(err => setError(err))
            .finally(() => setLoading(false));
    }, [range, JSON.stringify(extraParams)]);

    return { data, loading, error };
}

export function useSalesTrend(range = 'year', extraParams = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        reportAPI.getSalesTrend({ range, ...extraParams })
            .then(res => setData(res))
            .catch(err => setError(err))
            .finally(() => setLoading(false));
    }, [range, JSON.stringify(extraParams)]);

    return { data, loading, error };
}

export function usePaymentMethods(range = 'month', extraParams = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        reportAPI.getPaymentMethods({ range, ...extraParams })
            .then(res => setData(res))
            .catch(err => setError(err))
            .finally(() => setLoading(false));
    }, [range, JSON.stringify(extraParams)]);

    return { data, loading, error };
}

export function useTopProducts(range = 'month', extraParams = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        reportAPI.getTopProducts({ range, ...extraParams })
            .then(res => setData(res))
            .catch(err => setError(err))
            .finally(() => setLoading(false));
    }, [range, JSON.stringify(extraParams)]);

    return { data, loading, error };
}
