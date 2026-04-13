import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import api from '../services/api';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { MdShoppingCart, MdRemove, MdAdd, MdDelete, MdArrowBack, MdStore } from 'react-icons/md';

const CartPage = () => {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Load cart from database on mount
    useEffect(() => {
        const fetchCart = async () => {
            try {
                const response = await api.get('/product/cart');
                console.log('Cart API response:', response.data);
                if (response.data.status === 'success') {
                    const cartData = response.data.data;
                    // Backend returns { cart: cartItems, totalPrice, totalItems }
                    if (cartData && cartData.cart && Array.isArray(cartData.cart)) {
                        setCart(cartData.cart);
                    } else {
                        setCart([]);
                    }
                } else {
                    setCart([]);
                }
            } catch (error) {
                console.error('Error loading cart:', error);
                if (error.response?.status !== 404) {
                    setCart([]);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchCart();
    }, []);

    const getStock = (product) => {
        return product.stock || 
               product.quantity || 
               product.inventory || 
               product.available_quantity || 
               product.stock_quantity || 
               product.availableStock || 
               0;
    };

    const updateQuantity = async (productId, newQuantity) => {
        if (newQuantity < 1) {
            return;
        }
        
        try {
            const response = await api.put(`/product/edit-cart-item/${productId}`, {
                quantity: newQuantity
            });

            if (response.data.status === 'success') {
                // Refresh cart from database
                const cartResponse = await api.get('/product/cart');
                if (cartResponse.data.status === 'success') {
                    const cartData = cartResponse.data.data;
                    if (cartData && cartData.cart && Array.isArray(cartData.cart)) {
                        setCart(cartData.cart);
                    } else {
                        setCart([]);
                    }
                }
            } else {
                toast.error(response.data.message || 'Failed to update quantity');
            }
        } catch (error) {
            console.error('Error updating cart quantity:', error);
            toast.error('Failed to update quantity');
        }
    };

    const removeFromCart = async (productId) => {
        try {
            const response = await api.delete(`/product/delete-cart-item/${productId}`);
            if (response.data.status === 'success') {
                // Refresh cart from database
                const cartResponse = await api.get('/product/cart');
                if (cartResponse.data.status === 'success') {
                    const cartData = cartResponse.data.data;
                    if (cartData && cartData.cart && Array.isArray(cartData.cart)) {
                        setCart(cartData.cart);
                    } else {
                        setCart([]);
                    }
                }
                toast.success('Item removed from cart');
            } else {
                toast.error(response.data.message || 'Failed to remove item');
            }
        } catch (error) {
            console.error('Error removing from cart:', error);
            toast.error('Failed to remove item');
        }
    };

    const clearCart = async () => {
        try {
            // Remove all items one by one since there's no clear endpoint
            const promises = cart.map(item => api.delete(`/product/delete-cart-item/${item.id}`));
            await Promise.all(promises);
            
            setCart([]);
            toast.success('Cart cleared');
        } catch (error) {
            console.error('Error clearing cart:', error);
            toast.error('Failed to clear cart');
        }
    };

    const getCartTotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getCartItemsCount = () => {
        return cart.length;
    };

    const handleCheckout = () => {
        if (cart.length === 0) {
            toast.error('Your cart is empty');
            return;
        }
        toast.success('Proceeding to checkout...');
        // TODO: Implement checkout logic
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center animate-pulse">
                        <MdShoppingCart className="text-white text-2xl" />
                    </div>
                    <p className="text-sm font-medium text-gray-400 dark:text-slate-500">Loading cart...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/products')}
                                className="p-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <MdArrowBack size={20} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                    Shopping Cart
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-slate-400">
                                    {getCartItemsCount()} {getCartItemsCount() === 1 ? 'item' : 'items'} in your cart
                                </p>
                            </div>
                        </div>
                        {cart.length > 0 && (
                            <button
                                onClick={clearCart}
                                className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                            >
                                Clear Cart
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {cart.length === 0 ? (
                    <div className="text-center py-16">
                        <MdShoppingCart className="text-6xl text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Your cart is empty</h3>
                        <p className="text-gray-600 dark:text-slate-400 mb-6">Add some products to get started!</p>
                        <button
                            onClick={() => navigate('/products')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                        >
                            <MdStore size={20} />
                            Continue Shopping
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-slate-800">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cart Items</h2>
                                </div>
                                <div className="divide-y divide-gray-200 dark:divide-slate-800">
                                    {cart.map((item, index) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05, duration: 0.3 }}
                                            className="p-6"
                                        >
                                            <div className="flex gap-4">
                                                {/* Product Image */}
                                                <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                                                    {item.product?.photo || item.photo ? (
                                                        <img
                                                            src={item.product?.photo || item.photo}
                                                            alt={item.product?.name || item.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <MdStore className="text-2xl text-gray-300 dark:text-slate-600" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Product Details */}
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                                {item.product?.name || item.name}
                                                            </h3>
                                                            <p className="text-sm text-gray-600 dark:text-slate-400">
                                                                ₦{Number(item.price).toLocaleString()} each
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-slate-500">
                                                                Stock available: {getStock(item.product || item)}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="text-red-500 hover:text-red-600 p-1"
                                                        >
                                                            <MdDelete size={18} />
                                                        </button>
                                                    </div>

                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm text-gray-600 dark:text-slate-400">Quantity:</span>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                disabled={item.quantity <= 1}
                                                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                                    item.quantity <= 1 
                                                                    ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed'
                                                                    : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                                                                }`}
                                                            >
                                                                <MdRemove size={16} />
                                                            </button>
                                                            <span className="w-12 text-center font-medium">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600 flex items-center justify-center"
                                                            >
                                                                <MdAdd size={16} />
                                                            </button>
                                                        </div>
                                                        <span className="text-sm font-semibold text-gray-900 dark:text-white ml-auto">
                                                            ₦{(item.price * item.quantity).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6 sticky top-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>
                                
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-slate-400">Subtotal</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            ₦{getCartTotal().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-slate-400">Shipping</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            Calculated at checkout
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-slate-400">Tax</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            Calculated at checkout
                                        </span>
                                    </div>
                                    <div className="border-t border-gray-200 dark:border-slate-700 pt-3">
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                                            <span className="font-bold text-lg text-emerald-600">
                                                ₦{getCartTotal().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                                >
                                    Proceed to Checkout
                                </button>

                                <button
                                    onClick={() => navigate('/products')}
                                    className="w-full mt-3 py-3 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartPage;
