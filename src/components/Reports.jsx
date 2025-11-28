import { useState, useRef, useEffect } from "react";
import { useSummary, useSalesTrend, usePaymentMethods, useTopProducts } from "../hooks/useReports";
import { Bar, Pie } from "react-chartjs-2";
import 'chart.js/auto';
import { useReactToPrint } from 'react-to-print';

const Reports = () => {
    const [range, setRange] = useState('month');
    const [error, setError] = useState(null);
    const contentRef = useRef(null);

    // Add error boundaries for each hook
    const { data: summary, loading: loadingSummary, error: summaryError } = useSummary(range);
    const { data: salesTrend, loading: loadingSalesTrend, error: salesTrendError } = useSalesTrend(range);
    const { data: paymentMethods, loading: loadingPaymentMethods, error: paymentMethodsError } = usePaymentMethods(range);
    const { data: topProducts, loading: loadingTopProducts, error: topProductsError } = useTopProducts(range);

    // Check for errors on component mount and data changes
    useEffect(() => {
        const errors = [summaryError, salesTrendError, paymentMethodsError, topProductsError].filter(Boolean);
        if (errors.length > 0) {
            console.error('Reports component errors:', errors);
            setError(errors[0]); // Show the first error
        } else {
            setError(null);
        }
    }, [summaryError, salesTrendError, paymentMethodsError, topProductsError]);

    const handlePrint = useReactToPrint({
        contentRef,
        onBeforePrint: async () => {
            window.__chartImages = convertChartsToImages();
        },
        onAfterPrint: async () => {
            restoreCharts(window.__chartImages);
        }
    });

    const convertChartsToImages = () => {
        const canvases = document.querySelectorAll("canvas");
        const images = [];

        canvases.forEach((canvas) => {
            const dataURL = canvas.toDataURL("image/png");
            const img = document.createElement("img");
            img.src = dataURL;
            img.style.width = canvas.style.width;
            img.style.height = canvas.style.height;

            canvas.style.display = "none";
            canvas.parentNode.insertBefore(img, canvas);

            images.push({ canvas, img });
        });

        return images;
    };

    const restoreCharts = (images) => {
        images.forEach(({ canvas, img }) => {
            img.remove();
            canvas.style.display = "";
        });
    };

    // Safe data access with fallbacks
    const safeSalesTrendData = salesTrend?.data || [];
    const safePaymentMethodsData = paymentMethods?.data || [];
    const safeTopProductsData = topProducts?.data || [];

    // Get appropriate time labels based on range
    const getTimeLabels = () => {
        if (!safeSalesTrendData.length) return [];

        return safeSalesTrendData.map((item, index) => {
            try {
                switch (range) {
                    case 'today':
                        try {
                            if (typeof item.label === 'string' && item.label.includes(':')) {
                                const [hours, minutes] = item.label.split(':');
                                const hour = parseInt(hours);
                                return hour === 0 ? '12 AM' :
                                    hour === 12 ? '12 PM' :
                                        hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
                            } else {
                                const hour = new Date(item.label).getHours();
                                return hour === 0 ? '12 AM' :
                                    hour === 12 ? '12 PM' :
                                        hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
                            }
                        } catch (err) {
                            return item.label || 'Unknown Time';
                        }

                    case 'week':
                        try {
                            if (['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].includes(item.label)) {
                                return item.label;
                            }

                            if (typeof item.label === 'string' && item.label.includes('-')) {
                                const date = new Date(item.label);
                                if (!isNaN(date.getTime())) {
                                    return date.toLocaleDateString('en-US', { weekday: 'short' });
                                }
                            }

                            return item.label || 'Unknown';
                        } catch (err) {
                            return 'Error';
                        }

                    case 'month':
                        try {
                            if (typeof item.label === 'string' && item.label.startsWith('Week')) {
                                return item.label;
                            }

                            if (item.label && typeof item.label === 'object' && item.label.label) {
                                return item.label.label;
                            }

                            return item.label || `Week ${index + 1}`;
                        } catch (err) {
                            return `Week ${index + 1}`;
                        }

                    case 'quarter':
                        try {
                            if (typeof item.label === 'string' && item.label.startsWith('W')) {
                                return item.label;
                            }

                            const periodLabels = ['W1-3', 'W4-6', 'W7-9', 'W10-13'];
                            return periodLabels[index] || `Period ${index + 1}`;
                        } catch (err) {
                            const periodLabels = ['W1-3', 'W4-6', 'W7-9', 'W10-13'];
                            return periodLabels[index] || `Period ${index + 1}`;
                        }

                    default:
                        return item.label || 'Unknown';
                }
            } catch (err) {
                return 'Error';
            }
        });
    };

    // Temporary fallback for quarter data
    useEffect(() => {
        if (range === 'quarter' && safeSalesTrendData.length === 0 && !loadingSalesTrend) {
            console.log('⚠️ No quarter data received, using fallback data');
        }
    }, [range, safeSalesTrendData, loadingSalesTrend]);

    // Theme-compatible chart options with dynamic configurations
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 15
                }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return `₱${(context.parsed.y || 0).toLocaleString()}`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    maxRotation: 45
                },
                title: {
                    display: true,
                    text: getXAxisTitle()
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                title: {
                    display: true,
                    text: 'Sales Amount (₱)'
                },
                ticks: {
                    callback: function (value) {
                        return '₱' + (value || 0).toLocaleString();
                    }
                }
            }
        }
    };

    function getXAxisTitle() {
        switch (range) {
            case 'today': return 'Time of Day';
            case 'week': return 'Day of Week';
            case 'month': return 'Weeks of Month';
            case 'quarter': return '3-Week Periods';
            case 'year': return 'Months';
            default: return 'Time Period';
        }
    }

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    usePointStyle: true,
                    padding: 15
                }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        try {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => (a || 0) + (b || 0), 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ₱${value.toLocaleString()} (${percentage}%)`;
                        } catch (err) {
                            return 'Error calculating values';
                        }
                    }
                }
            }
        }
    };

    // In the salesChartData section, add validation:
    const salesChartData = {
        labels: getTimeLabels().filter(label => label && label !== 'Invalid Date'),
        datasets: [{
            label: 'Sales Amount',
            data: safeSalesTrendData.length > 0 ?
                safeSalesTrendData.map(d => d.total || 0).slice(0, getTimeLabels().length) :
                [],
            backgroundColor: 'rgba(13, 110, 253, 0.8)',
            borderColor: 'rgba(13, 110, 253, 1)',
            borderWidth: 1,
            borderRadius: 4
        }]
    };

    const paymentChartData = {
        labels: safePaymentMethodsData.map(d => {
            try {
                const type = d.payment_type?.toLowerCase() || 'unknown';
                return type.charAt(0).toUpperCase() + type.slice(1);
            } catch (err) {
                return 'Unknown';
            }
        }),
        datasets: [{
            data: safePaymentMethodsData.map(d => d.amount || 0),
            backgroundColor: [
                'rgba(13, 110, 253, 0.8)',  // Blue - Cash
                'rgba(25, 135, 84, 0.8)',   // Green - Card
                'rgba(255, 193, 7, 0.8)',   // Yellow - GCash
                'rgba(220, 53, 69, 0.8)',   // Red - Other
                'rgba(108, 117, 125, 0.8)'  // Gray - Unknown
            ],
            borderColor: 'rgba(255, 255, 255, 0.8)',
            borderWidth: 2
        }]
    };

    // Loading states with range-specific messages
    const getLoadingMessage = (type) => {
        const rangeNames = {
            today: 'today',
            week: 'this week',
            month: 'this month',
            quarter: 'this quarter',
            year: 'this year'
        };

        return `Loading ${type} for ${rangeNames[range]}...`;
    };

    // If there's a critical error, show error page
    if (error) {
        return (
            <div className="d-flex flex-column bg-body text-body h-100 p-4">
                <div className="alert alert-danger">
                    <h4>Error Loading Reports</h4>
                    <p>{error}</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => window.location.reload()}
                    >
                        Reload Page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="d-flex flex-column bg-body text-body h-100 overflow-hidden">
            {/* Header and Controls */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 p-3 border-bottom">
                <div>
                    <h1 className="h3 mb-1 fw-bold">Reports & Analytics</h1>
                    <p className="text-muted mb-0">Sales performance and insights</p>
                </div>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                    <select
                        value={range}
                        onChange={(e) => setRange(e.target.value)}
                        className="form-select"
                        style={{ width: 'auto', minWidth: '160px' }}
                    >
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                        <option value="year">This Year</option>
                    </select>
                    <button
                        onClick={handlePrint}
                        className="btn btn-outline-primary"
                    >
                        📄 Print Report
                    </button>
                </div>
            </div>

            {/* Range Info Banner */}
            <div className="alert alert-info mx-3 mt-3 mb-0 py-2">
                <small>
                    <strong>Viewing:</strong> {range === 'today' ? "Today's data by hour" :
                        range === 'week' ? "This week's data by day" :
                            range === 'month' ? "This month's data by week" :
                                range === 'quarter' ? "This quarter's data by 3-week periods" :
                                    "This year's data by month"}
                </small>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-grow-1 overflow-auto">
                {/* Printable Content */}
                <div ref={contentRef} className="print p-3">
                    {/* Print Header - Only visible when printing */}
                    <div className="d-none d-print-block text-center mb-4">
                        <h2>Sales Report - {range.charAt(0).toUpperCase() + range.slice(1)}</h2>
                        <p className="text-muted">
                            {range === 'today' ? new Date().toLocaleDateString() :
                                range === 'week' ? `Week of ${new Date().toLocaleDateString()}` :
                                    range === 'month' ? new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) :
                                        range === 'quarter' ? `Q${Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()}` :
                                            `Year ${new Date().getFullYear()}`}
                        </p>
                        <hr />
                    </div>

                    {/* Summary Cards */}
                    <div className="row g-3 mb-4">
                        {[
                            {
                                label: 'Total Orders',
                                value: (summary?.total_orders || 0).toLocaleString(),
                                bg: 'bg-primary',
                                icon: '📦'
                            },
                            {
                                label: 'Total Sales',
                                value: `₱${(summary?.total_sales || 0).toLocaleString()}`,
                                bg: 'bg-success',
                                icon: '💰'
                            },
                            {
                                label: 'Total Refunds',
                                value: `₱${(summary?.total_refunds || 0).toLocaleString()}`,
                                bg: 'bg-warning',
                                icon: '↩️'
                            }
                        ].map((card, idx) => (
                            <div key={idx} className="col-12 col-sm-6 col-md-4">
                                <div className="card h-100">
                                    <div className={`card-body text-white ${card.bg}`}>
                                        <div className="d-flex align-items-center">
                                            <span className="fs-2 me-3">{card.icon}</span>
                                            <div>
                                                <h6 className="card-title mb-1">{card.label}</h6>
                                                <h4 className="mb-0">
                                                    {loadingSummary ? (
                                                        <div className="spinner-border spinner-border-sm" role="status">
                                                            <span className="visually-hidden">Loading...</span>
                                                        </div>
                                                    ) : (
                                                        card.value
                                                    )}
                                                </h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Charts Section */}
                    <div className="row g-4 mb-4">
                        {/* Sales Trend Chart */}
                        <div className="col-12 col-xl-8">
                            <div className="card h-100">
                                <div className="card-header d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                                    <h5 className="card-title mb-0">Sales Trend</h5>
                                    <span className="badge bg-info">
                                        {range === 'today' ? 'By Hour' :
                                            range === 'week' ? 'By Day' :
                                                range === 'month' ? 'By Week' :
                                                    range === 'quarter' ? 'By 3 Weeks' :
                                                        'By Month'}
                                    </span>
                                </div>
                                <div className="card-body">
                                    <div style={{ height: '300px', minHeight: '250px' }}>
                                        {loadingSalesTrend ? (
                                            <div className="d-flex justify-content-center align-items-center h-100">
                                                <div className="text-center">
                                                    <div className="spinner-border text-primary" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                    <p className="mt-2 mb-0">
                                                        {range === 'today' ? 'Loading hourly sales data...' : getLoadingMessage('sales trend')}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : safeSalesTrendData.length === 0 ? (
                                            <div className="d-flex justify-content-center align-items-center h-100">
                                                <p className="text-muted">No sales data available for the selected period</p>
                                            </div>
                                        ) : (
                                            <Bar data={salesChartData} options={chartOptions} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Methods Chart */}
                        <div className="col-12 col-xl-4">
                            <div className="card h-100">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">Payment Methods</h5>
                                </div>
                                <div className="card-body">
                                    <div style={{ height: '300px', minHeight: '250px' }}>
                                        {loadingPaymentMethods ? (
                                            <div className="d-flex justify-content-center align-items-center h-100">
                                                <div className="text-center">
                                                    <div className="spinner-border text-primary" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                    <p className="mt-2 mb-0">{getLoadingMessage('payment methods')}</p>
                                                </div>
                                            </div>
                                        ) : safePaymentMethodsData.length === 0 ? (
                                            <div className="d-flex justify-content-center align-items-center h-100">
                                                <p className="text-muted">No payment data available</p>
                                            </div>
                                        ) : (
                                            <Pie data={paymentChartData} options={pieChartOptions} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Products Table */}
                    <div className="card">
                        <div className="card-header d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                            <h5 className="card-title mb-0">Top Products</h5>
                            <span className="badge bg-secondary">
                                {range === 'today' ? 'Today' :
                                    range === 'week' ? 'This Week' :
                                        range === 'month' ? 'This Month' :
                                            range === 'quarter' ? 'This Quarter' :
                                                'This Year'}
                            </span>
                        </div>
                        <div className="card-body p-0">
                            {loadingTopProducts ? (
                                <div className="d-flex justify-content-center align-items-center p-5">
                                    <div className="text-center">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-2 mb-0">{getLoadingMessage('top products')}</p>
                                    </div>
                                </div>
                            ) : safeTopProductsData.length === 0 ? (
                                <div className="d-flex justify-content-center align-items-center p-5">
                                    <p className="text-muted">No products found for the selected period.</p>
                                </div>
                            ) : (
                                <div className="table-responsive" style={{ maxHeight: '400px', overflow: 'auto' }}>
                                    <table className="table table-hover mb-0" style={{ minWidth: '500px' }}>
                                        <thead className="table-light position-sticky top-0" style={{ zIndex: 1 }}>
                                            <tr>
                                                <th style={{ minWidth: '50px' }}>#</th>
                                                <th style={{ minWidth: '150px' }}>Product Name</th>
                                                <th className="text-center" style={{ minWidth: '120px' }}>Quantity Sold</th>
                                                <th className="text-end" style={{ minWidth: '120px' }}>Total Sales</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {safeTopProductsData.map((p, index) => (
                                                <tr key={p.product_id || index}>
                                                    <td className="fw-bold">{index + 1}</td>
                                                    <td className="fw-medium text-truncate" style={{ maxWidth: '200px' }} title={p.name || 'Unknown Product'}>
                                                        {p.name || 'Unknown Product'}
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-primary">{(p.qty || 0).toLocaleString()}</span>
                                                    </td>
                                                    <td className="text-end fw-bold text-success">
                                                        ₱{(p.amount || 0).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;