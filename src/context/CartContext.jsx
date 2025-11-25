// context/CartContext.jsx
import { createContext, useContext, useReducer } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_TO_CART':
            const existingItem = state.items.find(item => item.product_id === action.payload.product_id);
            if (existingItem) {
                return {
                    ...state,
                    items: state.items.map(item =>
                        item.product_id === action.payload.product_id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    )
                };
            }
            return {
                ...state,
                items: [...state.items, { ...action.payload, quantity: 1 }]
            };

        case 'REMOVE_FROM_CART':
            return {
                ...state,
                items: state.items.filter(item => item.product_id !== action.payload)
            };

        case 'UPDATE_QUANTITY':
            return {
                ...state,
                items: state.items.map(item =>
                    item.product_id === action.payload.productId
                        ? { ...item, quantity: action.payload.quantity }
                        : item
                )
            };

        case 'CLEAR_CART':
            return {
                ...state,
                items: []
            };

        default:
            return state;
    }
};

export const CartProvider = ({ children }) => {
    const [cart, dispatch] = useReducer(cartReducer, { items: [] });

    const addToCart = (product) => {
        dispatch({ type: 'ADD_TO_CART', payload: product });
    };

    const removeFromCart = (productId) => {
        dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
        }
    };

    const clearCart = () => {
        dispatch({ type: 'CLEAR_CART' });
    };

    return (
        <CartContext.Provider value={{
            cart: cart.items,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};