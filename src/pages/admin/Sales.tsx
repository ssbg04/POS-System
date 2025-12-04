import { useState, useEffect } from "react";
import {
  Loader,
  Eye,
  Ban,
  RotateCcw,
  AlertCircle,
  Search,
  X,
  Printer,
  MoreHorizontal,
} from "lucide-react";
import {
  getSales,
  updateSaleStatus,
  type Sale,
} from "../../services/poss/sales";

const Sales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<"view" | "void" | "refund">(
    "view"
  );
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);

  // Dropdown State
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getSales();
      // Sort by date descending
      data.sort(
        (a, b) =>
          new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
      );
      setSales(data);
      setFilteredSales(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let result = sales;
    if (search) {
      result = result.filter(
        (s) =>
          s.id?.toLowerCase().includes(search.toLowerCase()) ||
          s.customer_name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }
    setFilteredSales(result);
  }, [search, statusFilter, sales]);

  const handleAction = (sale: Sale, type: "view" | "void" | "refund") => {
    setSelectedSale(sale);
    setActionType(type);
    setReason("");
    setShowModal(true);
    setActiveDropdown(null); // Close dropdown
  };

  const submitUpdate = async () => {
    if (!selectedSale || !selectedSale.id) return;
    setProcessing(true);
    try {
      const newStatus: "void" | "refunded" =
        actionType === "void" ? "void" : "refunded";

      await updateSaleStatus(selectedSale.id, newStatus, reason);

      const updatedSale: Sale = {
        ...selectedSale,
        status: newStatus,
        refund_reason: reason,
        refunded_at: new Date().toISOString(),
      };

      setSelectedSale(updatedSale);
      loadData();
      setActionType("view");
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "void":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "refunded":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (loading)
    return (
      <div className="p-10 flex justify-center">
        <Loader className="animate-spin text-blue-600" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Print Styles */}
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #printable-receipt, #printable-receipt * { visibility: visible; }
            #printable-receipt {
              display: block !important;
              position: fixed;
              left: 0;
              top: 0;
              width: 100%;
              height: 100%;
              margin: 0;
              background: white;
              color: black;
              font-family: monospace;
              padding: 20px;
              z-index: 99999;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print { display: none !important; }
          }
        `}
      </style>

      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Sales History
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Monitor transactions, refunds, and voided sales.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search ID or Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 p-2.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 p-2.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="void">Void</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden border border-slate-200 dark:border-slate-700 no-print pb-24 lg:pb-0">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-sm">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Transaction ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Total</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredSales.map((sale) => (
                <tr
                  key={sale.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition"
                >
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                    {new Date(sale.sale_date).toLocaleDateString()}
                    <div className="text-xs text-slate-400">
                      {new Date(sale.sale_date).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {sale.id?.slice(0, 8)}...
                  </td>
                  <td className="p-4 text-slate-800 dark:text-white font-medium">
                    {sale.customer_name || "Walk-in"}
                  </td>
                  <td className="p-4 text-slate-800 dark:text-white font-bold">
                    ₱{sale.total_amount.toFixed(2)}
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                    {sale.payment_type}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold uppercase ${getStatusColor(
                        sale.status
                      )}`}
                    >
                      {sale.status}
                    </span>
                  </td>
                  <td className="p-4 text-right relative">
                    {/* Action Dropdown Trigger */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(
                          // @ts-ignore
                          activeDropdown === sale.id ? null : sale.id
                        );
                      }}
                      className={`p-2 rounded-full transition ${
                        activeDropdown === sale.id
                          ? "bg-slate-200 dark:bg-slate-700"
                          : "hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      <MoreHorizontal
                        size={20}
                        className="text-slate-500 dark:text-slate-400"
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {activeDropdown === sale.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10 cursor-default"
                          onClick={() => setActiveDropdown(null)}
                        ></div>
                        <div className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="py-1">
                            <button
                              onClick={() => handleAction(sale, "view")}
                              className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                            >
                              <Eye size={16} className="text-blue-500" /> View
                              Details
                            </button>

                            {sale.status === "completed" && (
                              <>
                                <button
                                  onClick={() => handleAction(sale, "refund")}
                                  className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors border-t border-slate-100 dark:border-slate-700"
                                >
                                  <RotateCcw
                                    size={16}
                                    className="text-orange-500"
                                  />{" "}
                                  Process Refund
                                </button>
                                <button
                                  onClick={() => handleAction(sale, "void")}
                                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors border-t border-slate-100 dark:border-slate-700"
                                >
                                  <Ban size={16} /> Void Transaction
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-slate-500 dark:text-slate-400"
                  >
                    No sales found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail/Action Modal */}
      {showModal && selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 backdrop-blur-sm no-print">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {actionType === "view"
                  ? "Transaction Details"
                  : actionType === "void"
                  ? "Void Transaction"
                  : "Process Refund"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition"
              >
                <X className="text-slate-500 dark:text-slate-400" size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* VIEW DETAILS MODE */}
              {actionType === "view" ? (
                <div className="space-y-5">
                  {/* Header Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Transaction ID
                      </p>
                      <p
                        className="font-mono text-slate-800 dark:text-slate-200 truncate"
                        title={selectedSale.id}
                      >
                        {selectedSale.id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Date
                      </p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {new Date(selectedSale.sale_date).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Cashier
                      </p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {selectedSale.user_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Customer
                      </p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {selectedSale.customer_name || "Walk-in"}
                      </p>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">
                      Items Purchased
                    </h4>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                          <tr>
                            <th className="p-2 pl-3 font-medium">Product</th>
                            <th className="p-2 text-center font-medium">Qty</th>
                            <th className="p-2 text-right pr-3 font-medium">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {selectedSale.items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="p-2 pl-3 text-slate-800 dark:text-slate-200">
                                {item.product_name}
                              </td>
                              <td className="p-2 text-center text-slate-600 dark:text-slate-400">
                                {item.quantity}
                              </td>
                              <td className="p-2 text-right pr-3 text-slate-800 dark:text-slate-200">
                                ₱{item.total.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="space-y-2 text-sm border-t border-slate-200 dark:border-slate-700 pt-4">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>VAT Amount</span>
                      <span>₱{selectedSale.tax_amount.toFixed(2)}</span>
                    </div>
                    {selectedSale.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>Discount ({selectedSale.discount_type})</span>
                        <span>-₱{selectedSale.discount_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-lg font-bold text-slate-900 dark:text-white pt-2 border-t dark:border-slate-700 mt-2">
                      <span>Total Amount</span>
                      <span>₱{selectedSale.total_amount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 text-sm">
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-600 dark:text-slate-400">
                        Payment Method
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">
                        {selectedSale.payment_type}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-600 dark:text-slate-400">
                        Amount Tendered
                      </span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">
                        ₱{selectedSale.amount_tendered.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-blue-200 dark:border-blue-800 pt-2 mt-2">
                      <span className="text-slate-700 dark:text-slate-300">
                        Change Due
                      </span>
                      <span className="text-slate-900 dark:text-white">
                        ₱{selectedSale.change_due.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Status Footer */}
                  <div className="flex justify-center pt-2">
                    <div className="text-center w-full">
                      <div
                        className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold uppercase ${getStatusColor(
                          selectedSale.status
                        )}`}
                      >
                        {selectedSale.status}
                      </div>
                      {selectedSale.status !== "completed" && (
                        <div className="mt-3 text-xs text-left text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/50">
                          <div>
                            <strong>Reason:</strong>{" "}
                            {selectedSale.refund_reason}
                          </div>
                          <div className="mt-1">
                            <strong>Processed:</strong>{" "}
                            {selectedSale.refunded_at
                              ? new Date(
                                  selectedSale.refunded_at
                                ).toLocaleString()
                              : "N/A"}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* ACTION MODE (VOID/REFUND) */
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg text-sm flex gap-3 items-start border border-red-100 dark:border-red-900/50">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Warning: Irreversible Action</p>
                      <p className="mt-1 opacity-90">
                        You are about to mark transaction{" "}
                        <span className="font-mono">{selectedSale.id}</span> as{" "}
                        <strong>{actionType.toUpperCase()}</strong>. This will
                        update reports and cannot be undone.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Reason for {actionType}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition"
                      rows={3}
                      placeholder={`Please describe why this sale is being ${actionType}ed...`}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            {actionType !== "view" ? (
              <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={submitUpdate}
                  disabled={!reason.trim() || processing}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition shadow-sm"
                >
                  {processing && <Loader className="animate-spin" size={16} />}
                  Confirm {actionType === "void" ? "Void" : "Refund"}
                </button>
              </div>
            ) : (
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between bg-slate-50 dark:bg-slate-800/50">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition"
                >
                  <Printer size={16} /> Print Slip
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm font-medium"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden Print Receipt Template with Barcode */}
      {selectedSale && (
        <div id="printable-receipt" className="hidden">
          <div className="text-center mb-4 border-b border-black pb-2">
            <h1 className="text-xl font-bold uppercase">Store POS</h1>
            <p className="uppercase">
              {selectedSale.status === "completed"
                ? "Official Receipt"
                : `${selectedSale.status} SLIP`}
            </p>
            <p className="text-xs mt-1">
              {new Date(selectedSale.sale_date).toLocaleString()}
            </p>

            {/* Barcode Image */}
            <div className="my-2 flex justify-center">
              <img
                src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${selectedSale.id}&scale=2&height=10&includetext`}
                alt="Transaction Barcode"
                className="max-w-full"
              />
            </div>

            <p className="text-xs">Cashier: {selectedSale.user_name}</p>
            <p className="text-xs">Customer: {selectedSale.customer_name || Walk-in}</p>
          </div>

          <div className="space-y-1 mb-4 border-b border-black pb-2">
            {selectedSale.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span>
                  {item.quantity}x {item.product_name}
                </span>
                <span>{item.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>
                {(
                  selectedSale.total_amount -
                  selectedSale.tax_amount +
                  selectedSale.discount_amount
                ).toFixed(2)}
              </span>
            </div>
            {selectedSale.tax_amount > 0 && (
              <div className="flex justify-between">
                <span>VAT</span>
                <span>{selectedSale.tax_amount.toFixed(2)}</span>
              </div>
            )}
            {selectedSale.discount_amount > 0 && (
              <div className="flex justify-between">
                <span>Discount ({selectedSale.discount_type})</span>
                <span>-{selectedSale.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm border-t border-black pt-1 mt-1">
              <span>TOTAL</span>
              <span>{selectedSale.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span>Payment ({selectedSale.payment_type})</span>
              <span>{selectedSale.amount_tendered.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Change</span>
              <span>{selectedSale.change_due.toFixed(2)}</span>
            </div>
          </div>

          {selectedSale.status !== "completed" && (
            <div className="mt-4 text-center border border-black p-2">
              <p className="font-bold uppercase">
                *** {selectedSale.status} ***
              </p>
              <p className="text-xs">Reason: {selectedSale.refund_reason}</p>
              <p className="text-xs">
                Date:{" "}
                {selectedSale.refunded_at
                  ? new Date(selectedSale.refunded_at).toLocaleString()
                  : ""}
              </p>
            </div>
          )}

          <div className="text-center text-[10px] mt-4">
            <p>Thank you for your business!</p>
            {/* Support QR */}
        <div className="mt-2 border-t border-black pt-2 flex flex-col items-center">
          <p className="mb-1 font-bold">Need Help? Scan for Support</p>
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=https://crm-db-6f861.web.app/submit-ticket"
            alt="Support QR"
            className="w-16 h-16"
          />
        </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
