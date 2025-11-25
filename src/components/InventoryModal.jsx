// components/InventoryModal.jsx
import { useState } from "react";
import { useInventory } from "../hooks/useInventory";
import { useAuthContext } from "../context/AuthContext";

const InventoryModal = ({ product, action, onClose, onInventoryUpdated }) => {
    const [quantity, setQuantity] = useState(1);
    const [remarks, setRemarks] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const { addLog } = useInventory();
    const { user } = useAuthContext();

    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (submitting) return;

        if (!user || (user.user_id === undefined && user.id === undefined)) {
            alert("User not logged in");
            return;
        }
        if (!quantity || Number(quantity) < 1) {
            alert("Please enter a valid quantity (>= 1)");
            return;
        }

        setSubmitting(true);

        try {
            await addLog({
                product_id: product.product_id,
                user_id: user.user_id,
                action,
                quantity: Number(quantity),
                remarks,
            });

            if (typeof onInventoryUpdated === "function") {
                await onInventoryUpdated();
            }

            onClose();

        } catch (err) {
            console.error("Inventory update failed:", err);
            alert("Failed to update inventory: " + (err.response?.data?.error || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            {action.charAt(0).toUpperCase() + action.slice(1)} Inventory
                        </h5>
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
                                Logged in as: <strong>{user.username}</strong>
                            </p>
                        ) : (
                            <p className="text-danger small mb-3">⚠️ Not logged in</p>
                        )}

                        <p className="mb-3">
                            <strong>Product:</strong> {product.name}
                        </p>

                        <div className="mb-3">
                            <label htmlFor="quantity" className="form-label">Quantity</label>
                            <input
                                type="number"
                                id="quantity"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                min={1}
                                className="form-control"
                                placeholder="Enter quantity"
                                disabled={submitting}
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="remarks" className="form-label">Remarks (optional)</label>
                            <textarea
                                id="remarks"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Enter remarks"
                                className="form-control"
                                rows="3"
                                disabled={submitting}
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
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    Submitting...
                                </>
                            ) : (
                                'Submit'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryModal;