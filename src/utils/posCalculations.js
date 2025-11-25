// utils/posCalculations.js
export const calculateSubtotal = (cart) => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
};

export const calculateDiscount = (subtotal, discounts, pwdDiscountRate, seniorDiscountRate) => {
    if (discounts.pwd) return subtotal * pwdDiscountRate;
    if (discounts.senior) return subtotal * seniorDiscountRate;
    return 0;
};

export const getAppliedDiscountType = (discounts) => {
    if (discounts.pwd) return "PWD";
    if (discounts.senior) return "Senior Citizen";
    return null;
};

// FIXED: Always calculate tax, don't set to 0 for discounts
export const calculateTax = (subtotal, discount, taxRate, discounts) => {
    // Remove the condition that sets tax to 0 for discounts
    // Tax should always be calculated on the taxable amount (subtotal - discount)
    return (subtotal - discount) * taxRate;
};

export const calculateTotal = (subtotal, discount, tax) => {
    return (subtotal - discount) + tax;
};

export const calculateChange = (total, paymentAmount) => {
    const payment = parseFloat(paymentAmount) || 0;
    return payment - total;
};