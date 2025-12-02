import { useState, useEffect, useMemo } from "react";
import { getSales, type Sale } from "../../services/poss/sales";
import {
  Printer,
  TrendingUp,
  ShoppingBag,
  AlertOctagon,
  RotateCcw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  LabelList,
} from "recharts";

// --- Types ---
type TimeRange = "today" | "week" | "month" | "year" | "custom";

// --- Colors for Charts ---
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

// --- Timezone Helper ---
const getPHTime = (dateInput?: string | Date) => {
  const date = dateInput ? new Date(dateInput) : new Date();
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
};

const Reports = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  // @ts-ignore
  const [loading, setLoading] = useState(true);

  // Filter State
  const [timeRange, setTimeRange] = useState<TimeRange>("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // 1. Fetch Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getSales();
        setSales(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 2. Filter Logic (Timezone +8 Aware)
  useEffect(() => {
    // Get current time in PH
    const nowPH = getPHTime();

    let start = new Date(nowPH);
    let end = new Date(nowPH);

    // Reset to start of day (00:00:00) based on PH time
    const startOfDay = (d: Date) => {
      d.setHours(0, 0, 0, 0);
      return d;
    };

    switch (timeRange) {
      case "today":
        start = startOfDay(new Date(nowPH));
        break;
      case "week":
        // Get Monday of current week
        const day = nowPH.getDay(); // 0 is Sunday
        const diff = nowPH.getDate() - day + (day === 0 ? -6 : 1);
        start = startOfDay(new Date(nowPH.setDate(diff)));
        break;
      case "month":
        start = new Date(nowPH.getFullYear(), nowPH.getMonth(), 1);
        break;
      case "year":
        start = new Date(nowPH.getFullYear(), 0, 1);
        break;
      case "custom":
        if (customStart) start = startOfDay(new Date(customStart));
        if (customEnd) {
          end = new Date(customEnd);
          end.setHours(23, 59, 59, 999);
        }
        break;
    }

    const filtered = sales.filter((s) => {
      // Convert sale date to PH time for comparison
      const saleDate = getPHTime(s.sale_date);
      return saleDate >= start && saleDate <= end;
    });

    setFilteredSales(filtered);
  }, [sales, timeRange, customStart, customEnd]);

  // 3. Aggregations
  const stats = useMemo(() => {
    const completed = filteredSales.filter((s) => s.status === "completed");
    const voided = filteredSales.filter((s) => s.status === "void");
    const refunded = filteredSales.filter((s) => s.status === "refunded");

    return {
      totalOrders: completed.length,
      totalSales: completed.reduce((acc, curr) => acc + curr.total_amount, 0),
      totalRefund: refunded.reduce((acc, curr) => acc + curr.total_amount, 0),
      totalVoid: voided.reduce((acc, curr) => acc + curr.total_amount, 0),
    };
  }, [filteredSales]);

  // 4. Chart Data Preparation
  const chartData = useMemo(() => {
    // A. Sales Trend (Group by Date)
    const trendMap = new Map<
      string,
      { label: string; value: number; sortKey: number }
    >();

    filteredSales
      .filter((s) => s.status === "completed")
      .forEach((s) => {
        const date = new Date(s.sale_date); // UTC

        // Determine Grouping Key based on TimeRange
        let key = "";
        let label = "";
        let sortKey = 0;

        // Use PH Time for display logic
        const phDate = new Date(
          date.toLocaleString("en-US", { timeZone: "Asia/Manila" })
        );

        if (timeRange === "today") {
          // Group by Hour
          const hour = phDate.getHours();
          key = `${hour}:00`;
          label = `${hour % 12 || 12} ${hour >= 12 ? "PM" : "AM"}`;
          sortKey = phDate.setMinutes(0, 0, 0);
        } else {
          // Group by Day
          key = phDate.toLocaleDateString();
          label = phDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          const dayStart = new Date(phDate);
          dayStart.setHours(0, 0, 0, 0);
          sortKey = dayStart.getTime();
        }

        const current = trendMap.get(key) || { label, value: 0, sortKey };
        trendMap.set(key, {
          ...current,
          value: current.value + s.total_amount,
        });
      });

    // Convert to Array and SORT ASCENDING by sortKey
    const trendData = Array.from(trendMap.values())
      .sort((a, b) => a.sortKey - b.sortKey)
      .map((item) => ({ name: item.label, value: item.value }));

    // B. Payment Methods
    const paymentMap = new Map<string, number>();
    filteredSales
      .filter((s) => s.status === "completed")
      .forEach((s) => {
        paymentMap.set(
          s.payment_type,
          (paymentMap.get(s.payment_type) || 0) + 1
        );
      });
    const paymentData = Array.from(paymentMap, ([name, value]) => ({
      name,
      value,
    }));

    // C. Top Products
    const productMap = new Map<string, number>();
    filteredSales
      .filter((s) => s.status === "completed")
      .forEach((s) => {
        s.items.forEach((item) => {
          productMap.set(
            item.product_name,
            (productMap.get(item.product_name) || 0) + item.total
          );
        });
      });
    const topProductsData = Array.from(productMap, ([name, value]) => ({
      name,
      value,
    }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5

    return { trendData, paymentData, topProductsData };
  }, [filteredSales, timeRange]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 p-2">
      {/* Print Styles */}
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #report-content, #report-content * { visibility: visible; }
            #report-content { position: absolute; left: 0; top: 0; width: 100%; }
            .no-print { display: none !important; }
          }
        `}
      </style>

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Financial Reports
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Sales performance and business analytics.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 p-1">
            {(["today", "week", "month", "year"] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 text-sm rounded-md capitalize transition ${
                  timeRange === r
                    ? "bg-blue-600 text-white font-medium shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {r}
              </button>
            ))}
            <button
              onClick={() => setTimeRange("custom")}
              className={`px-3 py-1.5 text-sm rounded-md capitalize transition ${
                timeRange === "custom"
                  ? "bg-blue-600 text-white font-medium shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              Custom
            </button>
          </div>

          {timeRange === "custom" && (
            <div className="flex gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border dark:border-slate-700">
              <input
                type="date"
                className="p-1 text-sm border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                onChange={(e) => setCustomStart(e.target.value)}
              />
              <span className="self-center text-slate-400">-</span>
              <input
                type="date"
                className="p-1 text-sm border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {/* Report Content (Printable Area) */}
      <div id="report-content" className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total Orders
              </p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                {stats.totalOrders}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total Sales
              </p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                ₱{stats.totalSales.toLocaleString()}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-600 dark:text-orange-400">
              <RotateCcw size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total Refunds
              </p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                ₱{stats.totalRefund.toLocaleString()}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
              <AlertOctagon size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total Voided
              </p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                ₱{stats.totalVoid.toLocaleString()}
              </h3>
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Trend */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">
              Sales Trend
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.trendData}>
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
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickFormatter={(val) => `₱${val}`}
                  />
                  <RechartsTooltip
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
                    dataKey="value"
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
                    data={chartData.paymentData}
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
                    {chartData.paymentData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
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

        {/* Charts Row 2: Top Products */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">
            Top Selling Products (By Revenue)
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData.topProductsData}
                layout="vertical"
                margin={{ left: 20, right: 60 }}
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
                  width={120}
                  tick={{ fill: "#64748b", fontSize: 13 }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  formatter={(value: number) => [
                    `₱${value.toLocaleString()}`,
                    "Revenue",
                  ]}
                />
                <Bar
                  dataKey="value"
                  fill="#10b981"
                  radius={[0, 4, 4, 0]}
                  barSize={32}
                >
                  <LabelList
                    dataKey="value"
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
      </div>
    </div>
  );
};

export default Reports;
