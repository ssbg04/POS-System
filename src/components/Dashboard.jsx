import React, { useEffect } from "react";
import { useDashboard } from "../hooks/useDashboard";
import { useTheme } from "../hooks/useTheme";

function Dashboard() {
  const { updateTheme } = useTheme();
  const { dashboardData, loading, error, refreshDashboard } = useDashboard();

  useEffect(() => {
    if (dashboardData?.dark_mode) {
      updateTheme(dashboardData.dark_mode);
    }
  }, [dashboardData, updateTheme]);

  // Show loading state
  if (loading) {
    return (
      <div className="h-100 d-flex flex-column">
        <div className="flex-1 p-3 p-md-4 p-lg-5">
          <div className="row g-3 g-md-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="col-12 col-sm-6 col-lg-4">
                <div className="bg-body-tertiary shadow border border-secondary p-4 rounded-3 h-100">
                  <div className="placeholder-glow">
                    <h5 className="placeholder col-6"></h5>
                    <p className="placeholder col-8"></p>
                    <p className="placeholder col-4"></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-100 d-flex flex-column">
        <div className="flex-1 p-3 p-md-4 p-lg-5">
          <div className="alert alert-danger">
            <h4>Error Loading Dashboard</h4>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={refreshDashboard}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Extract data with fallbacks
  const todaySales = dashboardData?.todaySales || {
    amount: 0,
    change: 0,
    currency: "₱",
  };
  const orders = dashboardData?.orders || { total: 0, pending: 0 };
  const inventory = dashboardData?.inventory || { lowStock: 0, outOfStock: 0 };
  const paymentMethods = dashboardData?.paymentMethods || {
    cash: 0,
    card: 0,
    digital: 0,
  };
  const customers = dashboardData?.customers || { served: 0, today: 0 };
  const topProducts = dashboardData?.topProducts || [];
  const metrics = dashboardData?.metrics || {
    averageTransaction: 0,
    returns: 0,
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₱${amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${value > 0 ? "+" : ""}${Math.round(value)}%`;
  };

  return (
    <div className="h-100 d-flex flex-column">
      {/* Refresh Button */}
      <div className="d-flex justify-content-end p-3">
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={refreshDashboard}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      <div className="flex-1 p-3 p-md-4 p-lg-5">
        <div className="row g-3 g-md-4">
          {/* Rectangle - Today's Sales */}
          <div className="col-12 col-lg-8">
            <div className="bg-body-tertiary shadow border border-secondary p-4 rounded-3 h-100">
              <h3 className="h4 fw-semibold mb-2 text-body">Today's Sales</h3>
              <p className="display-6 fw-bold text-success mb-1">
                {formatCurrency(todaySales.amount)}
              </p>
              <p
                className={`small mb-0 ${
                  todaySales.change >= 0 ? "text-success" : "text-danger"
                }`}
              >
                {todaySales.change >= 0 ? "↑" : "↓"}{" "}
                {formatPercentage(todaySales.change)} from yesterday
              </p>
            </div>
          </div>

          {/* Square - Today's Orders */}
          <div className="col-12 col-sm-6 col-lg-4">
            <div className="bg-body-tertiary shadow border border-secondary p-4 rounded-3 h-100 d-flex flex-column justify-content-center">
              <h3 className="h5 fw-semibold mb-2 text-body">Today's Orders</h3>
              <p className="h1 fw-bold text-primary mb-1">{orders.total}</p>
              <p className="text-body-secondary small mb-0">
                {orders.pending > 0
                  ? `${orders.pending} pending orders`
                  : "All orders completed"}
              </p>
            </div>
          </div>

          {/* Square - Low Stock */}
          <div className="col-12 col-sm-6 col-lg-4">
            <div className="bg-body-tertiary shadow border border-secondary p-4 rounded-3 h-100 d-flex flex-column justify-content-center">
              <h3 className="h5 fw-semibold mb-2 text-body">Low Stock Items</h3>
              <p className="h1 fw-bold text-warning mb-1">
                {inventory.lowStock}
              </p>
              <p className="text-body-secondary small mb-0">
                {inventory.outOfStock > 0
                  ? `${inventory.outOfStock} out of stock`
                  : "Need restocking"}
              </p>
            </div>
          </div>

          {/* Rectangle - Payment Methods */}
          <div className="col-12 col-sm-6 col-lg-8">
            <div className="bg-body-tertiary shadow border border-secondary p-4 rounded-3 h-100">
              <h3 className="h5 fw-semibold mb-3 text-body">Payment Methods</h3>
              <div className="row text-center">
                <div className="col-4">
                  <p className="h5 fw-bold text-success mb-1">
                    {Math.round(paymentMethods.cash)}%
                  </p>
                  <p className="text-body-secondary small mb-0">Cash</p>
                </div>
                <div className="col-4">
                  <p className="h5 fw-bold text-primary mb-1">
                    {Math.round(paymentMethods.card)}%
                  </p>
                  <p className="text-body-secondary small mb-0">Card</p>
                </div>
                <div className="col-4">
                  <p className="h5 fw-bold text-info mb-1">
                    {Math.round(paymentMethods.digital)}%
                  </p>
                  <p className="text-body-secondary small mb-0">Digital</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="progress" style={{ height: "8px" }}>
                  <div
                    className="progress-bar bg-success"
                    style={{ width: `${paymentMethods.cash}%` }}
                  ></div>
                  <div
                    className="progress-bar bg-primary"
                    style={{ width: `${paymentMethods.card}%` }}
                  ></div>
                  <div
                    className="progress-bar bg-info"
                    style={{ width: `${paymentMethods.digital}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Square - Customers */}
          <div className="col-12 col-sm-6 col-lg-4">
            <div className="bg-body-tertiary shadow border border-secondary p-4 rounded-3 h-100 d-flex flex-column justify-content-center">
              <h3 className="h5 fw-semibold mb-2 text-body">
                Customers Served
              </h3>
              <p className="h1 fw-bold text-info mb-1">{customers.served}</p>
              <p className="text-body-secondary small mb-0">Today</p>
            </div>
          </div>

          {/* Rectangle - Top Products */}
          <div className="col-12 col-lg-8">
            <div className="bg-body-tertiary shadow border border-secondary p-4 rounded-3 h-100">
              <h3 className="h5 fw-semibold mb-3 text-body">Top Products</h3>
              <div className="row text-center">
                {topProducts.length > 0 ? (
                  topProducts.slice(0, 3).map((product, index) => (
                    <div key={product.name} className="col-4">
                      <p
                        className="h4 fw-bold mb-1"
                        style={{
                          color:
                            index === 0
                              ? "#ffc107"
                              : index === 1
                              ? "#dc3545"
                              : "#198754",
                        }}
                      >
                        {product.quantity}
                      </p>
                      <p className="text-body-secondary small mb-0">
                        {product.name.length > 12
                          ? `${product.name.substring(0, 12)}...`
                          : product.name}
                      </p>
                    </div>
                  ))
                ) : (
                  // Fallback when no top products data
                  <>
                    <div className="col-4">
                      <p className="h4 fw-bold text-warning mb-1">0</p>
                      <p className="text-body-secondary small mb-0">No sales</p>
                    </div>
                    <div className="col-4">
                      <p className="h4 fw-bold text-danger mb-1">0</p>
                      <p className="text-body-secondary small mb-0">No sales</p>
                    </div>
                    <div className="col-4">
                      <p className="h4 fw-bold text-success mb-1">0</p>
                      <p className="text-body-secondary small mb-0">No sales</p>
                    </div>
                  </>
                )}
              </div>
              {topProducts.length > 0 && (
                <div className="mt-3">
                  <small className="text-muted">
                    Top: {topProducts[0]?.name} ({topProducts[0]?.quantity}{" "}
                    sold)
                  </small>
                </div>
              )}
            </div>
          </div>

          {/* Square - Avg Transaction */}
          <div className="col-12 col-sm-6 col-lg-4">
            <div className="bg-body-tertiary shadow border border-secondary p-4 rounded-3 h-100 d-flex flex-column justify-content-center">
              <h3 className="h5 fw-semibold mb-2 text-body">
                Avg. Transaction
              </h3>
              <p className="h1 fw-bold text-primary mb-1">
                {formatCurrency(metrics.averageTransaction)}
              </p>
              <p className="text-body-secondary small mb-0">Per customer</p>
            </div>
          </div>

          {/* Square - Returns */}
          <div className="col-12 col-sm-6 col-lg-4">
            <div className="bg-body-tertiary shadow border border-secondary p-4 rounded-3 h-100 d-flex flex-column justify-content-center">
              <h3 className="h5 fw-semibold mb-2 text-body">Returns</h3>
              <p className="h1 fw-bold text-danger mb-1">{metrics.returns}</p>
              <p className="text-body-secondary small mb-0">Today</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
