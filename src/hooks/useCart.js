// hooks/useCart.js
import { useState } from 'react';

export const useCart = () => {
    const [cart, setCart] = useState([]);

    const addToCart = (product, quantity = 1) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.product_id === product.product_id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.product_id === product.product_id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                return [...prevCart, { ...product, quantity, price: product.price }];
            }
        });
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.product_id !== productId));
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) return;
        setCart(prevCart =>
            prevCart.map(item =>
                item.product_id === productId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    return {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        setCart
    };
};