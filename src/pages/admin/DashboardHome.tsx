import { useState, useEffect, useMemo } from "react";
import {
  DollarSign,
  ShoppingBag,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Clock,
  AlertOctagon,
  RotateCcw,
  ArrowUpRight,
  Tag,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import { getSales, type Sale } from "../../services/poss/sales";
import { getProducts, type Product } from "../../services/ims/product";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

const DashboardHome = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesData, productsData] = await Promise.all([
          getSales(),
          getProducts(),
        ]);
        setSales(salesData);
        setProducts(productsData);
      } catch (error) {
        console.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Compute "Today's" Data
  const todayStats = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    // Filter Sales for Today
    const todaysSales = sales.filter((s) => {
      const saleDate = new Date(s.sale_date);
      return saleDate >= startOfDay;
    });

    const completedSales = todaysSales.filter((s) => s.status === "completed");
    const voidedSales = todaysSales.filter((s) => s.status === "void");
    const refundedSales = todaysSales.filter((s) => s.status === "refunded");

    // A. Summary Metrics
    const totalSalesAmount = completedSales.reduce(
      (sum, s) => sum + s.total_amount,
      0
    );
    const totalTransactions = completedSales.length;
    const totalItemsSold = completedSales.reduce(
      (sum, s) => sum + s.items.reduce((is, i) => is + i.quantity, 0),
      0
    );
    const averageOrderValue =
      totalTransactions > 0 ? totalSalesAmount / totalTransactions : 0;

    // B. Sales Trend (Hourly)
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i}:00`,
      sales: 0,
    }));

    completedSales.forEach((s) => {
      const hour = new Date(s.sale_date).getHours();
      if (hours[hour]) hours[hour].sales += s.total_amount;
    });

    // C. Best Selling Products & Category Performance
    const productMap = new Map<string, { qty: number; revenue: number }>();
    const categoryMap = new Map<string, { qty: number; revenue: number }>();

    // Helper: Map Product Name to Category using Product List
    const getCategory = (name: string) =>
      products.find((p) => p.name === name)?.category || "Uncategorized";

    completedSales.forEach((s) => {
      s.items.forEach((item) => {
        // Product Level
        const existingProd = productMap.get(item.product_name) || {
          qty: 0,
          revenue: 0,
        };
        productMap.set(item.product_name, {
          qty: existingProd.qty + item.quantity,
          revenue: existingProd.revenue + item.total,
        });

        // Category Level
        const cat = getCategory(item.product_name);
        const existingCat = categoryMap.get(cat) || { qty: 0, revenue: 0 };
        categoryMap.set(cat, {
          qty: existingCat.qty + item.quantity,
          revenue: existingCat.revenue + item.total,
        });
      });
    });

    const bestSellers = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    const categoryPerformance = Array.from(categoryMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    // D. Payment Methods
    const paymentMap = new Map<string, number>();
    completedSales.forEach((s) => {
      paymentMap.set(s.payment_type, (paymentMap.get(s.payment_type) || 0) + 1);
    });
    const paymentMethods = Array.from(paymentMap.entries()).map(
      ([name, value]) => ({ name, value })
    );

    // E. Alerts (Void/Refund)
    const alerts = [
      ...voidedSales.map((s) => ({
        type: "Void",
        time: s.sale_date,
        id: s.id,
        total: s.total_amount,
      })),
      ...refundedSales.map((s) => ({
        type: "Refund",
        time: s.refunded_at || s.sale_date,
        id: s.id,
        total: s.total_amount,
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // F. Recent Transactions
    const recentTransactions = [...todaysSales]
      .sort(
        (a, b) =>
          new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
      )
      .slice(0, 20); // Last 20

    return {
      totalSalesAmount,
      totalTransactions,
      totalItemsSold,
      averageOrderValue,
      hourlyTrend: hours,
      bestSellers,
      categoryPerformance,
      paymentMethods,
      alerts,
      recentTransactions,
    };
  }, [sales, products]);

  // 3. Compute Inventory Stats (Real-time based on fetched products)
  const inventoryStats = useMemo(() => {
    const lowStock = products.filter((p) => p.quantity <= p.minQuantity);
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + p.price * p.quantity,
      0
    );
    const totalSKUs = products.length;

    return { lowStock, totalInventoryValue, totalSKUs };
  }, [products]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Today's Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Real-time overview for {new Date().toLocaleDateString()}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-sm border dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Inventory Value
          </p>
          <p className="text-lg font-bold text-slate-800 dark:text-white">
            ₱{inventoryStats.totalInventoryValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Row 1: Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Total Sales
              </p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                ₱{todayStats.totalSalesAmount.toLocaleString()}
              </h3>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-green-600 dark:text-green-400">
            <ArrowUpRight size={14} className="mr-1" />
            <span>Today's Revenue</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Transactions
              </p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                {todayStats.totalTransactions}
              </h3>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
              <CreditCard size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500">
            <span>Avg Value: ₱{todayStats.averageOrderValue.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Items Sold
              </p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                {todayStats.totalItemsSold}
              </h3>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500">
            <span>Across all categories</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Low Stock Alerts
              </p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                {inventoryStats.lowStock.length}
              </h3>
            </div>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-orange-600">
            <span>Requires Attention</span>
          </div>
        </div>
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <Clock size={20} className="text-blue-500" /> Hourly Sales Trend
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={todayStats.hourlyTrend}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  interval={3}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number) => [
                    `₱${value.toLocaleString()}`,
                    "Sales",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorSales)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">
            Payment Methods
          </h3>
          <div className="h-72 w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={todayStats.paymentMethods}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  // @ts-ignore
                  label={({ name, percent }) =>
                    // @ts-ignore
                    `${(percent * 100).toFixed(0)}%`
                  } // Show % on chart
                >
                  {/* @ts-ignore */}
                  {todayStats.paymentMethods.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry: any) => (
                    <span className="text-slate-600 dark:text-slate-300 ml-1">
                      {value}: {entry.payload.value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Category & Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <Tag size={20} className="text-purple-500" /> Category Performance
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={todayStats.categoryPerformance}
                layout="vertical"
                margin={{ left: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#e2e8f0"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `₱${value.toLocaleString()}`,
                    "Revenue",
                  ]}
                />
                <Bar
                  dataKey="revenue"
                  fill="#8b5cf6"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                >
                  <LabelList
                    dataKey="revenue"
                    position="top"
                    // @ts-ignore
                    formatter={(val: number) => `₱${val.toLocaleString()}`}
                    style={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best Sellers */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-500" /> Best Selling
            Products
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2 text-center">Qty</th>
                  <th className="px-4 py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {todayStats.bestSellers.map((item, i) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30"
                  >
                    <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                      {item.name}
                    </td>
                    <td className="px-4 py-2 text-center text-slate-600 dark:text-slate-400">
                      {item.qty}
                    </td>
                    <td className="px-4 py-2 text-right text-slate-800 dark:text-slate-200">
                      ₱{item.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 4: Lists (Transactions, Alerts, Low Stock) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-96">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
            <h3 className="font-bold text-slate-800 dark:text-white">
              Recent Transactions
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            {todayStats.recentTransactions.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {todayStats.recentTransactions.map((sale) => (
                  <div
                    key={sale.id}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono text-xs text-slate-500">
                        {sale.id?.slice(0, 8)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(sale.sale_date).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                          sale.status === "completed"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {sale.status}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-white">
                        ₱{sale.total_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                No transactions yet
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-96">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-orange-50 dark:bg-orange-900/20">
            <h3 className="font-bold text-orange-800 dark:text-orange-200 flex items-center gap-2">
              <AlertTriangle size={18} /> Low Stock Alerts
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            {inventoryStats.lowStock.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {inventoryStats.lowStock.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-sm text-slate-800 dark:text-slate-200">
                        {prod.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Min: {prod.minQuantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-red-600 font-bold text-sm">
                        {prod.quantity} Left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                Inventory levels are healthy
              </div>
            )}
          </div>
        </div>

        {/* Operational Alerts (Refunds/Voids) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-96">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-red-50 dark:bg-red-900/20">
            <h3 className="font-bold text-red-800 dark:text-red-200 flex items-center gap-2">
              <AlertOctagon size={18} /> System Alerts
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            {todayStats.alerts.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {todayStats.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {alert.type === "Void" ? (
                          <AlertOctagon size={16} className="text-red-500" />
                        ) : (
                          <RotateCcw size={16} className="text-orange-500" />
                        )}
                        <span className="font-medium text-sm text-slate-800 dark:text-white">
                          {alert.type} Processed
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(alert.time || "").toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between items-center text-sm">
                      <span className="font-mono text-slate-500 text-xs">
                        ID: {alert.id?.slice(0, 8)}
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        -₱{alert.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                No operational alerts today
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
