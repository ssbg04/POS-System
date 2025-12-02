import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getProducts,
  updateProductStock,
  type Product,
} from "../services/ims/product";
import { createSale, type Sale } from "../services/poss/sales";
import { createTicket } from "../services/crm/support"; // Import ticket service
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  Smartphone,
  Loader,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  X,
  Printer, // New icons
} from "lucide-react";

interface CartItem extends Product {
  cartQty: number;
}

const POSDashboard = () => {
  const { logout, user } = useAuth();

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [taxRate, setTaxRate] = useState(12); // Store as percentage (e.g., 12 for 12%)

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isCartCollapsed, setIsCartCollapsed] = useState(true); // For mobile
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Support Modal State
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [ticketData, setTicketData] = useState({
    subject: "",
    description: "",
    severity: "Medium",
  });
  const [ticketSending, setTicketSending] = useState(false);

  // Receipt Modal State
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  // Transaction State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountType, setDiscountType] = useState<"None" | "Senior" | "PWD">(
    "None"
  );
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amountTendered, setAmountTendered] = useState<string>("");
  const [customerName, setCustomerName] = useState("");

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Calculations ---
  const totals = useMemo(() => {
    // 1. Gross Total (Price displayed on product)
    const grossTotal = cart.reduce(
      (sum, item) => sum + item.price * item.cartQty,
      0
    );

    // 2. Extract VAT using Dynamic Rate (taxRate / 100)
    // Formula: Price = Net + Tax. Here we calculate Tax = Price * (taxRate/100)
    const currentTaxRate = taxRate / 100;
    const vatAmountRaw = grossTotal * currentTaxRate;
    const vatableSales = grossTotal - vatAmountRaw; // This is the Base Price

    let finalTax = 0;
    let discountAmount = 0;
    let grandTotal = 0;

    if (discountType === "None") {
      // Regular: Customer pays Gross (Base + Tax)
      finalTax = vatAmountRaw;
      grandTotal = grossTotal;
    } else {
      // Senior/PWD: VAT Exempt + 20% Discount on Base Price
      finalTax = 0; // Exempt
      discountAmount = vatableSales * 0.2;
      grandTotal = vatableSales - discountAmount;
    }

    return {
      grossTotal,
      vatableSales,
      vatAmount: finalTax,
      discountAmount,
      grandTotal,
    };
  }, [cart, discountType, taxRate]);

  // --- Digital Payment Auto-Fill ---
  useEffect(() => {
    const isDigital = ["GCash", "Card", "QRPh"].includes(paymentMethod);
    if (isDigital) {
      // Automatically set tendered to exact total for digital payments
      setAmountTendered(totals.grandTotal.toFixed(2));
    } else {
      // Clear for cash to allow manual input
      setAmountTendered("");
    }
  }, [paymentMethod, totals.grandTotal]);

  const changeDue = (Number(amountTendered) || 0) - totals.grandTotal;
  const isPaymentDigital = ["GCash", "Card", "QRPh"].includes(paymentMethod);

  // --- Actions ---
  const addToCart = (product: Product) => {
    // Check Stock Availability
    const currentInCart = cart.find((p) => p.id === product.id)?.cartQty || 0;
    if (currentInCart + 1 > product.quantity) {
      return alert(`Insufficient stock! Only ${product.quantity} available.`);
    }

    setCart((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      if (existing) {
        return prev.map((p) =>
          p.id === product.id ? { ...p, cartQty: p.cartQty + 1 } : p
        );
      }
      return [...prev, { ...product, cartQty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.cartQty + delta;
            // Check stock limit when increasing
            if (delta > 0 && newQty > item.quantity) {
              alert(`Cannot add more. Only ${item.quantity} in stock.`);
              return item;
            }
            return { ...item, cartQty: Math.max(0, newQty) };
          }
          return item;
        })
        .filter((item) => item.cartQty > 0)
    );
  };

  const clearCart = () => {
    setCart([]);
    setAmountTendered("");
    setDiscountType("None");
    setCustomerName("");
    setSuccess(false);
    setPaymentMethod("Cash");
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Cart is empty");
    // Allow equal payment for digital, strictly greater or equal for cash
    if ((Number(amountTendered) || 0) < totals.grandTotal - 0.01)
      return alert("Insufficient payment"); // -0.01 for floating point tolerance

    setProcessing(true);

    try {
      // 1. Create Sale Record
      const saleData: Sale = {
        customer_name: customerName || null,
        user_name: user?.name || "Unknown Cashier",
        amount_tendered: Number(amountTendered),
        total_amount: totals.grandTotal,
        tax_amount: totals.vatAmount,
        discount_amount: totals.discountAmount,
        change_due: changeDue,
        refund_reason: null,
        refunded_at: null,
        payment_type: paymentMethod,
        sale_date: new Date().toISOString(),
        status: "completed",
        discount_type: discountType,
        items: cart.map((item) => ({
          product_name: item.name,
          quantity: item.cartQty,
          price: item.price,
          total: item.price * item.cartQty,
        })),
      };

      await createSale(saleData);

      // 2. Update Inventory (Deduct Qty, Add Sold)
      await Promise.all(
        cart.map((item) => {
          const remainingStock = item.quantity - item.cartQty;
          const newSold = item.sold + item.cartQty;
          return updateProductStock(item.id, remainingStock, newSold);
        })
      );

      // 3. Success Feedback & Receipt Trigger
      setSuccess(true);
      setLastSale(saleData);

      // Delay clear slightly to show success checkmark, then show receipt
      setTimeout(async () => {
        setSuccess(false);
        setShowReceipt(true); // Open Receipt Modal
        clearCart();
        await loadData();
      }, 1500);
    } catch (error) {
      alert("Transaction failed. Please try again.");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSending(true);
    try {
      await createTicket({
        task: "POS Issue",
        subject: ticketData.subject,
        description: ticketData.description,
        requester_email: user?.email || "cashier@pos.com",
        issue_category: "Software",
        severity: ticketData.severity,
      });
      alert("Ticket created successfully!");
      setShowSupportModal(false);
      setTicketData({ subject: "", description: "", severity: "Medium" });
    } catch (err) {
      alert("Failed to submit ticket.");
    } finally {
      setTicketSending(false);
    }
  };

  // --- Filtering ---
  const filteredProducts = products.filter((p) => {
    const matchName = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat =
      selectedCategory === "All" || p.category === selectedCategory;
    return matchName && matchCat;
  });

  const categories = [
    "All",
    ...Array.from(new Set(products.map((p) => p.category))).filter(Boolean),
  ];

  return (
    <div className="h-screen bg-slate-100 dark:bg-slate-900 flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Print Styles */}
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #receipt-modal, #receipt-modal * { visibility: visible; }
            #receipt-modal { 
              position: absolute; 
              left: 0; 
              top: 0; 
              width: 100%; 
              height: auto; 
              background: white; 
              color: black;
              z-index: 9999;
              display: block !important;
            }
            #receipt-content {
              box-shadow: none !important;
              border: none !important;
              max-width: 100% !important;
              width: 300px !important; /* Receipt Width */
              margin: 0 auto;
            }
            .no-print { display: none !important; }
          }
        `}
      </style>

      {/* LEFT: Product Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden no-print">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 p-4 border-b dark:border-slate-700 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              POS Terminal
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cashier: {user?.name}
            </p>
          </div>
          <div className="flex gap-4 items-center">
            {/* Support not in scope */}
            {/* <button
              onClick={() => setShowSupportModal(true)}
              className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 cursor-not-allowed text-sm font-medium"
              disabled
            >
              <LifeBuoy size={18} /> Report Issue
            </button> */}
            <button
              onClick={logout}
              className="text-red-600 hover:underline text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 space-y-4 shrink-0">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 p-3 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border dark:border-slate-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 pt-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-24 md:pb-4">
          {loading ? (
            <p className="col-span-full text-center p-10 text-slate-500">
              Loading products...
            </p>
          ) : (
            filteredProducts.map((product) => {
              const isLowStock = product.quantity <= product.minQuantity;
              const isOutOfStock = product.quantity === 0;
              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && addToCart(product)}
                  className={`
                bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border transition flex flex-col justify-between h-40 relative group
                ${
                  isOutOfStock
                    ? "opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-700"
                    : "hover:shadow-md cursor-pointer active:scale-95 border-transparent dark:border-slate-700"
                }
                ${
                  isLowStock && !isOutOfStock
                    ? "border-orange-300 dark:border-orange-500/50 ring-1 ring-orange-100 dark:ring-orange-900/20"
                    : ""
                }
              `}
                >
                  <div className="absolute top-2 right-2 flex gap-1">
                    {isOutOfStock && (
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[10px] font-bold px-2 py-1 rounded-full">
                        OUT OF STOCK
                      </span>
                    )}
                    {isLowStock && !isOutOfStock && (
                      <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <AlertTriangle size={10} /> LOW
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white line-clamp-2 leading-tight pr-14 text-sm">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {product.category}
                    </p>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        In Stock
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          isLowStock
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {product.quantity}{" "}
                        <span className="text-slate-400 text-[10px]">
                          (Min: {product.minQuantity})
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        ₱{product.price}
                      </span>
                      <div
                        className={`
                      p-1.5 rounded-lg transition
                      ${
                        isOutOfStock
                          ? "bg-slate-100 dark:bg-slate-700 text-slate-400"
                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white"
                      }
                    `}
                      >
                        <Plus size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Cart Panel (Collapsible on Mobile) */}
      <div
        className={`
        bg-white dark:bg-slate-800 border-l dark:border-slate-700 flex flex-col shadow-2xl z-20
        fixed md:relative bottom-0 left-0 right-0 md:w-96 
        transition-all duration-300 ease-in-out no-print
        ${isCartCollapsed ? "h-20 md:h-full" : "h-[85vh] md:h-full"}
      `}
      >
        {/* Mobile Handle */}
        <div
          onClick={() => setIsCartCollapsed(!isCartCollapsed)}
          className="md:hidden h-20 bg-slate-900 text-white flex items-center justify-between px-6 cursor-pointer shrink-0"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-full relative">
              <ShoppingCart size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            </div>
            <div className="font-bold">
              Total: ₱{totals.grandTotal.toFixed(2)}
            </div>
          </div>
          {isCartCollapsed ? <ChevronUp /> : <ChevronDown />}
        </div>

        {/* Cart Header (Desktop) */}
        <div className="hidden md:flex p-4 border-b dark:border-slate-700 justify-between items-center shrink-0">
          <h2 className="font-bold text-lg text-slate-800 dark:text-white">
            Current Order
          </h2>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {cart.length} Items
          </span>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-50">
              <ShoppingCart size={48} />
              <p>No items selected</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center group"
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-800 dark:text-white text-sm">
                    {item.name}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    ₱{item.price} x {item.cartQty}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-l-lg transition"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">
                      {item.cartQty}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-r-lg transition"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => updateQty(item.id, -100)}
                    className="text-slate-400 hover:text-red-500 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Section */}
        <div className="border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Customer (Optional)"
              className="col-span-2 p-2 text-sm border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />

            <select
              className="p-2 text-sm border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as any)}
            >
              <option value="None">No Discount</option>
              <option value="Senior">Senior Citizen</option>
              <option value="PWD">PWD</option>
            </select>

            <select
              className="p-2 text-sm border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="Cash">Cash</option>
              <option value="GCash">GCash</option>
              <option value="Card">Card</option>
              <option value="QRPh">QRPh</option>
            </select>

            {/* Dynamic Tax Input */}
            <div className="col-span-2 flex items-center gap-2">
              <label className="text-xs text-slate-500 whitespace-nowrap">
                Tax Rate %:
              </label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full p-2 text-sm border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex gap-2 text-slate-400 justify-center pb-2">
            <Banknote
              className={paymentMethod === "Cash" ? "text-green-600" : ""}
              size={20}
            />
            <Smartphone
              className={paymentMethod === "GCash" ? "text-blue-600" : ""}
              size={20}
            />
            <CreditCard
              className={paymentMethod === "Card" ? "text-orange-600" : ""}
              size={20}
            />
            <QrCode
              className={paymentMethod === "QRPh" ? "text-purple-600" : ""}
              size={20}
            />
          </div>

          <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Gross Total</span>
              <span>₱{totals.grossTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Vatable Sales (Base)</span>
              <span>₱{totals.vatableSales.toFixed(2)}</span>
            </div>
            {discountType === "None" ? (
              <div className="flex justify-between text-xs">
                <span>VAT ({taxRate}%)</span>
                <span>₱{totals.vatAmount.toFixed(2)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-green-600">
                <span>VAT Exempt + 20% Discount</span>
                <span>-₱{totals.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xl text-slate-800 dark:text-white border-t pt-2 dark:border-slate-600">
              <span>Total Due</span>
              <span>₱{totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
              ₱
            </span>
            <input
              type="number"
              placeholder="Amount Tendered"
              className={`w-full pl-8 p-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 outline-none font-bold text-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                isPaymentDigital
                  ? "bg-slate-100 cursor-not-allowed text-slate-500"
                  : ""
              }`}
              value={amountTendered}
              onChange={(e) =>
                !isPaymentDigital && setAmountTendered(e.target.value)
              }
              readOnly={isPaymentDigital}
            />
          </div>
          {Number(amountTendered) > 0 && (
            <div className="flex justify-between text-sm font-medium text-black dark:text-white/60">
              <span>Change Due:</span>
              <span
                className={changeDue < 0 ? "text-red-500" : "text-green-600"}
              >
                ₱{changeDue.toFixed(2)}
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={clearCart}
              className="py-3 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg font-semibold transition"
            >
              Clear
            </button>
            <button
              onClick={handleCheckout}
              disabled={processing || cart.length === 0 || changeDue < -0.01}
              className={`py-3 rounded-lg font-bold text-white flex justify-center items-center gap-2 transition ${
                success ? "bg-green-600" : "bg-blue-600 hover:bg-blue-700"
              } disabled:bg-slate-300 disabled:cursor-not-allowed dark:disabled:bg-slate-700`}
            >
              {processing ? (
                <Loader className="animate-spin" />
              ) : success ? (
                <CheckCircle />
              ) : (
                "Checkout"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Support Ticket Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in duration-200 no-print">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Report an Issue
              </h3>
              <button onClick={() => setShowSupportModal(false)}>
                <X className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">
                  Subject
                </label>
                <input
                  required
                  className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={ticketData.subject}
                  onChange={(e) =>
                    setTicketData({ ...ticketData, subject: e.target.value })
                  }
                  placeholder="e.g., Scanner not working"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">
                  Severity
                </label>
                <select
                  className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={ticketData.severity}
                  onChange={(e) =>
                    setTicketData({ ...ticketData, severity: e.target.value })
                  }
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  required
                  rows={4}
                  className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={ticketData.description}
                  onChange={(e) =>
                    setTicketData({
                      ...ticketData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe the issue..."
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ticketSending}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {ticketSending ? "Sending..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal (Printable) */}
      {showReceipt && lastSale && (
        <div
          id="receipt-modal"
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm"
        >
          <div
            id="receipt-content"
            className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full font-mono text-sm text-black"
          >
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold uppercase">Store POS</h2>
              <p>Official Receipt</p>
              <p className="text-xs mt-1">
                {new Date(lastSale.sale_date).toLocaleString()}
              </p>
              <p className="text-xs">Cashier: {lastSale.user_name}</p>
              <p className="text-xs">Customer: {lastSale.customer_name}</p>
            </div>

            <div className="border-t border-b border-black py-2 mb-2 space-y-1">
              {lastSale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>
                    {item.quantity}x {item.product_name}
                  </span>
                  <span>{item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>
                  {(
                    lastSale.total_amount -
                    lastSale.tax_amount +
                    lastSale.discount_amount
                  ).toFixed(2)}
                </span>
              </div>
              {lastSale.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span>VAT ({taxRate}%)</span>
                  <span>{lastSale.tax_amount.toFixed(2)}</span>
                </div>
              )}
              {lastSale.discount_amount > 0 && (
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>-{lastSale.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t border-black pt-2 mt-2">
                <span>TOTAL</span>
                <span>{lastSale.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1">
                <span>Payment ({lastSale.payment_type})</span>
                <span>{lastSale.amount_tendered.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Change</span>
                <span>{lastSale.change_due.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center text-xs space-y-2 no-print">
              <button
                onClick={handlePrintReceipt}
                className="w-full bg-slate-800 text-white py-2 rounded font-bold flex items-center justify-center gap-2"
              >
                <Printer size={16} /> Print Receipt
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="w-full text-slate-500 hover:underline"
              >
                Close
              </button>
            </div>

            <div className="text-center text-[10px] mt-4 hidden print:block">
              <p>Thank you for your purchase!</p>
              <p>This serves as your official receipt.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSDashboard;
