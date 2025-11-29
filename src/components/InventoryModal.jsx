// components/InventoryModal.jsx
import { useState } from "react";
import { useInventory } from "../hooks/useInventory";
import { useAuthContext } from "../context/AuthContext";

const InventoryModal = ({ product, action, onClose, onInventoryUpdated }) => {
    // Set initial quantity based on action
    const getInitialQuantity = () => {
        switch (action) {
            case 'adjust': return product.stock; // Start with current stock for adjust
            default: return 1;
        }
    };

    const [quantity, setQuantity] = useState(getInitialQuantity());
    const [remarks, setRemarks] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const { addLog } = useInventory();
    const { user } = useAuthContext();

    // components/InventoryModal.jsx - FIXED handleSubmit function
    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (submitting) return;

        if (!user || (user.user_id === undefined && user.id === undefined)) {
            alert("User not logged in");
            return;
        }

        const qty = Number(quantity);
        if (isNaN(qty)) {
            alert("Enter a valid number");
            return;
        }

        // Compute relative change to stock
        let change = 0;
        let valid = true;

        if (action === "add") {
            if (qty < 1) {
                alert("Quantity must be at least 1");
                valid = false;
            }
            change = qty; // add increases stock
        }

        if (action === "remove") {
            if (qty < 1) {
                alert("Quantity must be at least 1");
                valid = false;
            }
            change = -qty; // remove decreases stock
        }

        if (action === "adjust") {
            if (qty < 0) {
                alert("Stock level cannot be negative");
                valid = false;
            }
            change = qty - product.stock; // adjust = newStock - oldStock
        }

        if (!valid) return;

        setSubmitting(true);

        try {
            await addLog({
                product_id: product.product_id,
                user_id: user.user_id || user.id,
                action,
                quantity: change,   // always relative change
                remarks
            });

            if (typeof onInventoryUpdated === "function") {
                await onInventoryUpdated();
            } else {
                onClose();
            }

        } catch (err) {
            console.error("Inventory update failed:", err);
            alert("Failed to update inventory: " + (err.response?.data?.error || err.message));
        } finally {
            setSubmitting(false);
        }
    };


    // Handle Enter key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !submitting) {
            handleSubmit();
        }
    };

    // Get action-specific details
    const getActionDetails = () => {
        const actionTitles = {
            add: "Add Stock",
            remove: "Remove Stock",
            adjust: "Adjust Stock Level"
        };

        const buttonTexts = {
            add: "Add Stock",
            remove: "Remove Stock",
            adjust: "Update Stock"
        };

        const placeholders = {
            add: "Enter quantity to add...",
            remove: "Enter quantity to remove...",
            adjust: "Enter new stock level..."
        };

        const labels = {
            add: "Quantity to Add",
            remove: "Quantity to Remove",
            adjust: "New Stock Level"
        };

        return {
            title: actionTitles[action] || "Inventory Action",
            buttonText: buttonTexts[action] || "Submit",
            placeholder: placeholders[action] || "Enter quantity...",
            label: labels[action] || "Quantity"
        };
    };

    const { title, buttonText, placeholder, label } = getActionDetails();

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{title}</h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                            disabled={submitting}
                        ></button>
                    </div>

                    <div className="modal-body">
                        {user ? (
                            <p className="text-muted small mb-3">
                                Logged in as: <strong>{user.username || user.full_name || 'User'}</strong>
                            </p>
                        ) : (
                            <p className="text-danger small mb-3">⚠️ Not logged in</p>
                        )}

                        <div className="mb-3">
                            <label className="form-label fw-bold">Product</label>
                            <p className="mb-2">{product.name}</p>
                            <div className="d-flex gap-3 text-muted small">
                                <span>Current Stock: <strong>{product.stock}</strong></span>
                                <span>Price: <strong>₱{parseFloat(product.price).toFixed(2)}</strong></span>
                            </div>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="quantity" className="form-label">
                                {label}
                                {action === 'adjust' && (
                                    <span className="text-muted"> (Current: {product.stock})</span>
                                )}
                            </label>
                            <input
                                type="number"
                                id="quantity"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                min={action === 'adjust' ? 0 : 1}
                                className="form-control"
                                placeholder={placeholder}
                                disabled={submitting}
                                onKeyPress={handleKeyPress}
                                autoFocus
                            />
                            {action === 'adjust' && (
                                <div className="form-text">
                                    Set the exact stock level. The system will calculate the difference automatically.
                                </div>
                            )}
                        </div>

                        <div className="mb-3">
                            <label htmlFor="remarks" className="form-label">Remarks (optional)</label>
                            <textarea
                                id="remarks"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder={`Reason for ${action}...`}
                                className="form-control"
                                rows="3"
                                disabled={submitting}
                                onKeyPress={handleKeyPress}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className={`btn ${action === 'remove' ? 'btn-danger' : 'btn-primary'}`}
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    Processing...
                                </>
                            ) : (
                                buttonText
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryModal;