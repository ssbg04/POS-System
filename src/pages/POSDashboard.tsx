import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "../context/AuthContext";
import {
  getProducts,
  updateProductStock,
  type Product,
} from "../services/ims/product";
import {
  createSale,
  type Sale,
  getSales,
  updateSaleStatus,
} from "../services/poss/sales";
import { BrowserMultiFormatReader } from "@zxing/library";
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
  Printer,
  RotateCcw,
  Camera,
  LogOut,
} from "lucide-react";

interface CartItem extends Product {
  cartQty: number;
}

const POSDashboard = () => {
  const { logout, user } = useAuth();

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [taxRate, setTaxRate] = useState(12);

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isCartCollapsed, setIsCartCollapsed] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundSearch, setRefundSearch] = useState("");
  const [foundSales, setFoundSales] = useState<Sale[]>([]);
  const [selectedRefundSale, setSelectedRefundSale] = useState<Sale | null>(
    null
  );
  const [refundReason, setRefundReason] = useState("");
  const [refundProcessing, setRefundProcessing] = useState(false);

  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<any>(null);

  // Receipt Modal State
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [receiptTitle, setReceiptTitle] = useState("Official Receipt");

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

  // --- Fetch Sales for Refund Modal on Open ---
  useEffect(() => {
    if (showRefundModal) {
      // Reset
      setSelectedRefundSale(null);
      setRefundReason("");
      setRefundSearch("");

      const fetchRefundableSales = async () => {
        setRefundProcessing(true);
        try {
          const allSales = await getSales();
          const refundable = allSales
            .filter((s) => s.status === "completed")
            .sort(
              (a, b) =>
                new Date(b.sale_date).getTime() -
                new Date(a.sale_date).getTime()
            );

          setFoundSales(refundable);
        } catch (err) {
          console.error("Error loading sales for refund:", err);
        } finally {
          setRefundProcessing(false);
        }
      };
      fetchRefundableSales();
    }
    // Cleanup scanner when modal closes
    return () => {
      stopScanner();
    };
  }, [showRefundModal]);

  // --- ZXing Scanner Logic ---
  const startScanner = async () => {
    setIsScanning(true);
    setCameraLoading(true);
    const codeReader = new BrowserMultiFormatReader();
    try {
      const videoInputDevices = await codeReader.listVideoInputDevices();
      if (videoInputDevices.length === 0)
        throw new Error("No camera found on this device.");

      const selectedDeviceId =
        videoInputDevices.find(
          (device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("environment")
        )?.deviceId || videoInputDevices[0].deviceId;

      if (!videoRef.current) return;

      const controls = await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        // @ts-ignore
        (result, err) => {
          if (result) {
            setRefundSearch(result.getText());
            // @ts-ignore
            controls.stop();
            controlsRef.current = null;
            setIsScanning(false);
            setCameraLoading(false);
          }
        }
      );
      controlsRef.current = controls;
      setCameraLoading(false);
    } catch (err: any) {
      console.error("Scanner Error:", err);
      setIsScanning(false);
      setCameraLoading(false);
      alert("Error accessing camera: " + err.message);
    }
  };

  const stopScanner = () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    setIsScanning(false);
    setCameraLoading(false);
  };

  // --- Calculations ---
  const totals = useMemo(() => {
    const grossTotal = cart.reduce(
      (sum, item) => sum + item.price * item.cartQty,
      0
    );
    const currentTaxRate = taxRate / 100;
    const vatAmountRaw = grossTotal * currentTaxRate;
    const vatableSales = grossTotal - vatAmountRaw;

    let finalTax = 0;
    let discountAmount = 0;
    let grandTotal = 0;

    if (discountType === "None") {
      finalTax = vatAmountRaw;
      grandTotal = grossTotal;
    } else {
      finalTax = 0;
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
      setAmountTendered(totals.grandTotal.toFixed(2));
    } else {
      setAmountTendered("");
    }
  }, [paymentMethod, totals.grandTotal]);

  const changeDue = (Number(amountTendered) || 0) - totals.grandTotal;
  const isPaymentDigital = ["GCash", "Card", "QRPh"].includes(paymentMethod);

  // --- Actions ---
  const addToCart = (product: Product) => {
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
    if ((Number(amountTendered) || 0) < totals.grandTotal - 0.01)
      return alert("Insufficient payment");

    setProcessing(true);

    try {
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

      await Promise.all(
        cart.map((item) => {
          const remainingStock = item.quantity - item.cartQty;
          const newSold = item.sold + item.cartQty;
          return updateProductStock(item.id, remainingStock, newSold);
        })
      );

      setSuccess(true);
      setLastSale(saleData);
      setReceiptTitle("OFFICIAL RECEIPT");

      setTimeout(async () => {
        setSuccess(false);
        setShowReceipt(true);
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

  // --- Refund Logic ---
  const handleSearchRefund = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setRefundProcessing(true);
    try {
      const allSales = await getSales();
      const searchTermLower = refundSearch.toLowerCase();

      const matches = allSales.filter(
        (s) =>
          (s.id?.toLowerCase().includes(searchTermLower) ||
            (s.customer_name &&
              s.customer_name.toLowerCase().includes(searchTermLower))) &&
          s.status === "completed"
      );

      matches.sort(
        (a, b) =>
          new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
      );

      setFoundSales(matches);
      if (matches.length === 0 && refundSearch) {
        alert("No completed transactions found matching your criteria.");
      }
    } catch (err) {
      console.error(err);
      alert("Error searching sales.");
    } finally {
      setRefundProcessing(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!selectedRefundSale || !selectedRefundSale.id || !refundReason) return;
    setRefundProcessing(true);
    try {
      const now = new Date().toISOString();
      await updateSaleStatus(selectedRefundSale.id, "refunded", refundReason);

      // Update local object to show in print slip
      const updatedSale = {
        ...selectedRefundSale,
        status: "refunded",
        refund_reason: refundReason,
        refunded_at: now,
      };
      // @ts-ignore
      setLastSale(updatedSale);
      setReceiptTitle("REFUND SLIP");

      // Switch Views: Close Search Modal, Open Receipt Modal
      setShowRefundModal(false);
      setShowReceipt(true);
    } catch (err) {
      alert("Failed to process refund.");
    } finally {
      setRefundProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

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

  // Shared Receipt Component
  const renderReceiptContent = (sale: any, title: string) => (
    <div
      id="receipt-content"
      className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full font-mono text-sm text-black mx-auto border border-gray-200"
    >
      <div className="text-center mb-4 border-b border-black pb-2">
        <h2 className="text-xl font-bold uppercase">Store POS</h2>
        <p className="uppercase font-bold text-lg">{title}</p>
        <p className="text-xs mt-1">
          {new Date(sale.sale_date).toLocaleString()}
        </p>
        <p className="text-xs">Txn ID: {sale.id}</p>
        <p className="text-xs">Cashier: {sale.user_name}</p>
        {sale.customer_name && (
          <p className="text-xs">Customer: {sale.customer_name}</p>
        )}
      </div>

      <div className="border-b border-black py-2 mb-2 space-y-1">
        {sale.items.map((item: any, idx: number) => (
          <div key={idx} className="flex justify-between text-xs">
            <span>
              {item.quantity}x {item.product_name}
            </span>
            <span>{item.total.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="space-y-1 mb-4 text-xs">
        {/* Breakdown */}
        <div className="flex justify-between">
          <span>Subtotal (Net)</span>
          <span>
            {(
              sale.total_amount -
              (sale.tax_amount || 0) +
              (sale.discount_amount || 0)
            ).toFixed(2)}
          </span>
        </div>

        {sale.tax_amount > 0 && (
          <div className="flex justify-between">
            <span>VAT Amount</span>
            <span>{sale.tax_amount.toFixed(2)}</span>
          </div>
        )}

        {sale.discount_amount > 0 && (
          <div className="flex justify-between text-red-600 print:text-black">
            <span>Discount ({sale.discount_type})</span>
            <span>-{sale.discount_amount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between font-bold text-sm border-t border-black pt-2 mt-2">
          <span>TOTAL</span>
          <span>{sale.total_amount.toFixed(2)}</span>
        </div>

        <div className="flex justify-between pt-2 border-t border-dashed border-black mt-2">
          <span>Amount Tendered ({sale.payment_type})</span>
          <span>
            {sale.amount_tendered
              ? sale.amount_tendered.toFixed(2)
              : sale.total_amount.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between font-bold">
          <span>Change Due</span>
          <span>{sale.change_due ? sale.change_due.toFixed(2) : "0.00"}</span>
        </div>
      </div>

      {/* Refund Details if applicable */}
      {sale.status === "refunded" && (
        <div className="mt-4 text-center border border-black p-2">
          <p className="font-bold uppercase">*** REFUNDED ***</p>
          <p className="text-xs">Reason: {sale.refund_reason}</p>
          <p className="text-xs">
            Date:{" "}
            {sale.refunded_at
              ? new Date(sale.refunded_at).toLocaleString()
              : ""}
          </p>
        </div>
      )}

      <div className="text-center text-[10px] mt-4">
        <p className="mb-2">Thank you for your business!</p>

        {/* Support QR */}
        <div className="mt-2 border-t border-black pt-2 flex flex-col items-center">
          <p className="mb-1 font-bold">Scan for Support</p>
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=https://crm-db-6f861.web.app/submit-ticket"
            alt="Support QR"
            className="w-16 h-16"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-slate-100 dark:bg-slate-900 flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Print Styles */}
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #receipt-modal, #receipt-modal * { visibility: visible; }
            #receipt-modal { 
              position: fixed; 
              left: 0; 
              top: 0; 
              width: 100%; 
              height: 100%; 
              background: white; 
              color: black;
              z-index: 9999;
              display: flex !important;
              align-items: flex-start;
              justify-content: center;
              padding-top: 20px;
            }
            #receipt-content {
              box-shadow: none !important;
              border: none !important;
              max-width: 100% !important;
              width: 300px !important;
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
          <div className="flex gap-3 items-center">
            {/* Refund Button */}
            <button
              onClick={() => setShowRefundModal(true)}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors
          bg-orange-50 text-orange-600 border border-orange-200
          hover:bg-orange-100
          dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700 dark:hover:bg-orange-800
        `}
            >
              <RotateCcw size={18} /> Refund
            </button>

            <button
              onClick={logout}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors
          bg-red-50 text-red-600 border border-red-200
          hover:bg-red-100
          dark:bg-red-900 dark:text-red-300 dark:border-red-700 dark:hover:bg-red-800
        `}
            >
              <LogOut size={18} /> Logout
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

      {/* RIGHT: Cart Panel */}
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

        {/* Cart Header */}
        <div className="hidden md:flex p-4 border-b dark:border-slate-700 justify-between items-center shrink-0">
          <h2 className="font-bold text-lg text-slate-800 dark:text-white">
            Current Order
          </h2>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {cart.length} Items
          </span>
        </div>

        {/* Cart Items */}
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
            <div className="flex justify-between text-sm font-medium">
              <span>Change Due:</span>
              <span
                className={changeDue < 0 ? "text-red-500" : "text-green-600"}
              >
                ₱{changeDue.toFixed(2)}
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="grid grid-cols-2 gap-3 pt-2">
  {/* CLEAR BUTTON */}
  <button
    onClick={clearCart}
    className="py-3 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition dark:bg-red-700 dark:hover:bg-red-800"
  >
    Clear
  </button>

  {/* CHECKOUT BUTTON */}
  <button
    onClick={handleCheckout}
    disabled={processing || cart.length === 0 || changeDue < -0.01}
    className={`py-3 rounded-lg font-bold text-white flex justify-center items-center gap-2 transition
      ${
        success
          ? "bg-green-600"
          : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
      }
      disabled:bg-slate-300 disabled:cursor-not-allowed dark:disabled:bg-slate-700`}
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
      </div>

      {/* Refund Modal (NEW with Scanner) */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in duration-200 no-print">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                Refund Transaction
              </h3>
              <button
                onClick={() => setShowRefundModal(false)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition"
              >
                <X className="text-slate-500 dark:text-slate-400" size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* Scanner Video Overlay */}
              {isScanning && (
                <div className="relative w-full h-48 bg-black rounded-lg overflow-hidden mb-4 border border-slate-700">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover opacity-80"
                    onLoadedMetadata={() => {
                      /* maybe set a loaded state? */
                    }}
                  />

                  {/* Loading / Permission Prompt Hint */}
                  {cameraLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                      <div className="text-center p-4">
                        <Loader className="animate-spin text-blue-500 mx-auto mb-2" />
                        <p className="text-white text-xs">
                          Requesting Camera Access...
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Visual Scanner Guide */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-64 h-32 border-2 border-white/50 rounded-lg relative">
                      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div>
                    </div>
                    <p className="text-white text-xs mt-2 bg-black/50 px-2 py-1 rounded">
                      Align Code 128 Barcode
                    </p>
                  </div>

                  <button
                    onClick={stopScanner}
                    className="absolute top-2 right-2 bg-white/20 hover:bg-white/40 text-white p-1 rounded-full z-20 transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Search Bar */}
              <form onSubmit={handleSearchRefund} className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  placeholder="Enter Transaction ID..."
                  value={refundSearch}
                  onChange={(e) => setRefundSearch(e.target.value)}
                />

                {/* Scanner Button */}
                <button
                  type="button"
                  onClick={startScanner}
                  className="bg-slate-700 text-white px-3 rounded hover:bg-slate-600 flex items-center"
                  title="Scan Barcode"
                >
                  <Camera size={18} />
                </button>

                <button
                  type="submit"
                  disabled={refundProcessing}
                  className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {refundProcessing ? (
                    <Loader className="animate-spin" size={16} />
                  ) : (
                    <Search size={18} />
                  )}
                </button>
              </form>

              {/* Search Results Table */}
              {foundSales.length > 0 && !selectedRefundSale ? (
                <div className="border rounded dark:border-slate-700 overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-sm text-left dark:text-white">
                    <thead className="bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 sticky top-0">
                      <tr>
                        <th className="p-2">ID</th>
                        <th className="p-2">Total</th>
                        <th className="p-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {foundSales.map((sale) => (
                        <tr
                          key={sale.id}
                          className="border-t dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        >
                          <td className="p-2 font-mono text-xs">
                            {sale.id?.slice(0, 8)}...
                          </td>
                          <td className="p-2 font-bold">
                            ₱{sale.total_amount.toFixed(2)}
                          </td>
                          <td className="p-2 text-right">
                            <button
                              onClick={() => setSelectedRefundSale(sale)}
                              className="text-orange-600 hover:underline font-medium"
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                !selectedRefundSale &&
                !refundProcessing && (
                  <p className="text-center text-slate-500 py-4 dark:text-slate-400">
                    {foundSales.length === 0
                      ? "No refundable transactions found."
                      : ""}
                  </p>
                )
              )}

              {/* Processing Refund Form */}
              {selectedRefundSale && (
                <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center text-sm border-b pb-2 dark:border-slate-700">
                    <span className="font-bold dark:text-white">
                      Transaction: {selectedRefundSale.id?.slice(0, 8)}
                    </span>
                    <button
                      onClick={() => setSelectedRefundSale(null)}
                      className="text-blue-500 text-xs hover:underline"
                    >
                      Change
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">
                      Reason for Refund
                    </label>
                    <textarea
                      className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      rows={3}
                      placeholder="e.g., Customer returned item..."
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleProcessRefund}
                      disabled={!refundReason || refundProcessing}
                      className="bg-orange-600 text-white px-4 py-2 rounded font-medium hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {refundProcessing && (
                        <Loader className="animate-spin" size={16} />
                      )}{" "}
                      Confirm Refund
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal (Printable) */}
      {showReceipt && lastSale && (
        <div
          id="receipt-modal"
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm"
        >
          <div className="relative">
            {renderReceiptContent(lastSale, receiptTitle)}
            <div className="text-center text-xs space-y-2 no-print mt-4 bg-white p-2 rounded">
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
          </div>
        </div>
      )}
    </div>
  );
};

export default POSDashboard;

