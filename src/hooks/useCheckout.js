import { useState } from 'react';

/**
 * Helper function to round a number to two decimal places for currency accuracy.
 * @param {number} value
 * @returns {number}
 */
const roundToTwoDecimals = (value) => {
    return Math.round(value * 100) / 100;
};

export const useCheckout = (createSale, user) => {
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [customerName, setCustomerName] = useState("");

    const handleCheckout = async (cart, discounts, calculateTotal, calculateDiscount, getAppliedDiscountType) => {
        // Ensure calculations use the correctly rounded total from the POS component's logic
        const total = roundToTwoDecimals(calculateTotal());

        let finalPaymentAmount = parseFloat(paymentAmount) || 0;
        let changeDue = 0;

        // 1. Handle Payment Logic
        if (paymentMethod === 'cash') {
            // Round the tendered amount before comparison
            finalPaymentAmount = roundToTwoDecimals(finalPaymentAmount);

            changeDue = finalPaymentAmount - total;

            // Use a small tolerance for safe comparison in case of tiny floating point errors
            const COMPARISON_TOLERANCE = 0.001;

            if (changeDue < -COMPARISON_TOLERANCE) {
                // Replaced forbidden alert() with console.error()
                console.error("Payment amount is insufficient. Required:", total.toFixed(2), "Tendered:", finalPaymentAmount.toFixed(2));
                return false;
            }

            // Ensure change is also cleanly rounded
            changeDue = roundToTwoDecimals(changeDue);

        } else {
            // For non-cash payments (Card/GCash), the amount tendered is exactly the total
            finalPaymentAmount = total;
            changeDue = 0;
            // No need to set state here, as the POS component handles setting paymentAmount=total 
            // when paymentMethod changes to non-cash, ensuring the UI is correct.
        }

        try {
            const saleData = {
                user_id: user.user_id,
                items: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    // Ensure the price sent to the server is also correctly rounded
                    price: roundToTwoDecimals(item.price)
                })),
                payment_type: paymentMethod,
                // Send the final, rounded amounts
                amount_tendered: finalPaymentAmount,
                change_due: changeDue,
                discount_type: getAppliedDiscountType(discounts),
                // Ensure discount amount is rounded as well
                discount_amount: roundToTwoDecimals(calculateDiscount()),
                customer_name: customerName.trim() || null
            };

            await createSale(saleData);
            return true;
        } catch (error) {
            console.error("Checkout error: Failed to complete sale", error);
            // Replaced forbidden alert() with console.error()
            return false;
        }
    };

    const resetCheckout = () => {
        setPaymentAmount("");
        setCustomerName("");
        // Note: paymentMethod is intentionally left alone, assuming user might prefer to keep the last method (e.g., 'cash')
    };

    return {
        paymentAmount,
        setPaymentAmount,
        paymentMethod,
        setPaymentMethod,
        customerName,
        setCustomerName,
        handleCheckout,
        resetCheckout
    };
};