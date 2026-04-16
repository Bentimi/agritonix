import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import api from '../services/api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { MdShoppingCart, MdRemove, MdAdd, MdDelete, MdArrowBack, MdStore, MdChevronLeft, MdChevronRight, MdClose, MdWarning, MdInfo, MdShoppingBasket, MdStar, MdCategory } from 'react-icons/md';

const CartPage = () => {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5);
    const navigate = useNavigate();

    // Modal States
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);
    const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
    const [storyProduct, setStoryProduct] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

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

    const updateQuantity = async (cartItemId, newQuantity) => {
        if (newQuantity <= 0) {
            await removeFromCart(cartItemId);
            return;
        }
        
        try {
            const response = await api.put(`/product/edit-cart-item/${cartItemId}`, {
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

    const confirmRemoveFromCart = (item) => {
        setItemToDelete(item);
        setIsDeleteModalOpen(true);
    };

    const removeFromCart = async (cartItemId) => {
        try {
            const response = await api.delete(`/product/delete-cart-item/${cartItemId}`);
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

    const handleRemoveItem = async () => {
        if (!itemToDelete) return;
        setIsProcessing(true);
        try {
            await removeFromCart(itemToDelete.id);
        } finally {
            setIsProcessing(false);
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const confirmClearCart = () => {
        setIsClearModalOpen(true);
    };

    const handleClearCart = async () => {
        setIsProcessing(true);
        try {
            const promises = cart.map(item => api.delete(`/product/delete-cart-item/${item.id}`));
            await Promise.all(promises);
            
            setCart([]);
            toast.success('Cart cleared');
        } catch (error) {
            console.error('Error clearing cart:', error);
            toast.error('Failed to clear cart');
        } finally {
            setIsProcessing(false);
            setIsClearModalOpen(false);
        }
    };

    const getCartTotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getCartItemsCount = () => {
        return cart.length;
    };

    const totalPages = Math.ceil(cart.length / pageSize);
    const paginatedItems = cart.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleCheckout = () => {
        if (cart.length === 0) {
            toast.error('Your cart is empty');
            return;
        }
        navigate('/checkout');
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
                                onClick={confirmClearCart}
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
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/80 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cart Items</h2>
                                    {totalPages > 1 && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Page</span>
                                            <div className="flex gap-1">
                                                {[...Array(totalPages)].map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setCurrentPage(i + 1)}
                                                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 hover:bg-gray-200'}`}
                                                    >
                                                        {i + 1}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="divide-y divide-gray-200 dark:divide-slate-800">
                                    {paginatedItems.map((item, index) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05, duration: 0.3 }}
                                            className="p-6 text-gray-900 dark:text-white"
                                        >
                                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                                {/* Product Image */}
                                                <div className="w-full sm:w-32 h-48 sm:h-32 bg-gray-100 dark:bg-slate-800 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100 dark:border-slate-800">
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
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setStoryProduct(item.product || item);
                                                                    setIsStoryModalOpen(true);
                                                                }}
                                                                className="text-emerald-500 hover:text-emerald-600 p-1 flex items-center justify-center transition-colors bg-emerald-50 dark:bg-emerald-900/20 rounded-lg w-8 h-8"
                                                                title="Product Story"
                                                            >
                                                                <MdInfo size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => confirmRemoveFromCart(item)}
                                                                className="text-red-500 hover:text-red-600 p-1 flex items-center justify-center transition-colors bg-red-50 dark:bg-red-900/20 rounded-lg w-8 h-8"
                                                                title="Remove Item"
                                                            >
                                                                <MdDelete size={18} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Quantity Controls */}
                                                    <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-50 dark:border-slate-800/50">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Quantity</span>
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
                                                    </div>
                                                    <div className="text-right ml-auto sm:ml-0">
                                                        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Subtotal</p>
                                                        <p className="font-bold text-lg text-emerald-600 dark:text-emerald-500">
                                                            ₦{(item.price * item.quantity).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                    ))}
                                </div>
                                {totalPages > 1 && (
                                    <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-800 flex justify-center">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="p-1 text-gray-400 hover:text-emerald-600 disabled:opacity-30"
                                            >
                                                <MdChevronLeft size={20} />
                                            </button>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4">
                                                Page {currentPage} of {totalPages}
                                            </p>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                className="p-1 text-gray-400 hover:text-emerald-600 disabled:opacity-30"
                                            >
                                                <MdChevronRight size={20} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 sticky top-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>
                                
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-slate-400">Subtotal</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            ₦{getCartTotal().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
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
                                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
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

            {/* Delete Item Confirmation Modal */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => !isProcessing && setIsDeleteModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden relative z-10"
                        >
                            <div className="p-6">
                                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                                    <MdWarning className="text-2xl text-red-600 dark:text-red-500" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                    Remove Item
                                </h3>
                                <p className="text-gray-600 dark:text-slate-400 text-center text-sm mb-6">
                                    Are you sure you want to remove <span className="font-semibold text-gray-900 dark:text-white">{itemToDelete?.product?.name || itemToDelete?.name}</span> from your cart?
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        disabled={isProcessing}
                                        className="py-2.5 px-4 rounded-xl font-semibold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleRemoveItem}
                                        disabled={isProcessing}
                                        className="py-2.5 px-4 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {isProcessing ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            'Remove'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Clear Cart Confirmation Modal */}
            <AnimatePresence>
                {isClearModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => !isProcessing && setIsClearModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden relative z-10"
                        >
                            <div className="p-6">
                                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                                    <MdWarning className="text-2xl text-red-600 dark:text-red-500" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                    Clear Cart
                                </h3>
                                <p className="text-gray-600 dark:text-slate-400 text-center text-sm mb-6">
                                    Are you sure you want to remove all items from your cart? This action cannot be undone.
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setIsClearModalOpen(false)}
                                        disabled={isProcessing}
                                        className="py-2.5 px-4 rounded-xl font-semibold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleClearCart}
                                        disabled={isProcessing}
                                        className="py-2.5 px-4 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {isProcessing ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            'Clear All'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Product Story Modal (Narrative View) */}
            <AnimatePresence>
                {isStoryModalOpen && storyProduct && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setIsStoryModalOpen(false);
                                setStoryProduct(null);
                            }}
                            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-6xl max-h-[90vh] md:overflow-hidden overflow-y-auto custom-scrollbar flex flex-col md:flex-row border border-white/20 dark:border-slate-800/50"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => {
                                    setIsStoryModalOpen(false);
                                    setStoryProduct(null);
                                }}
                                className="absolute top-6 right-6 z-[110] p-3 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl transition-all border border-gray-200 dark:border-slate-700 hover:scale-110 active:scale-95 flex items-center justify-center group"
                            >
                                <MdClose size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                            </button>

                            {/* Left Side: Product Showcase */}
                            <div className="w-full md:w-[40%] bg-slate-50 dark:bg-slate-950/40 md:border-r border-b md:border-b-0 border-slate-100 dark:border-slate-800 p-8 md:p-12 md:overflow-y-auto custom-scrollbar flex flex-col">
                                <div className="space-y-8">
                                    {/* Brand/Category Tag */}
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                                            <MdStore className="text-white text-xl" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Certified Product</span>
                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">{storyProduct.category?.category || 'General'}</span>
                                        </div>
                                    </div>

                                    {/* Main Image */}
                                    <div className="aspect-[4/3] rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-900 group">
                                        {storyProduct.photo ? (
                                            <img src={storyProduct.photo} alt={storyProduct.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center opacity-20">
                                                <MdShoppingBasket size={80} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Title & Price */}
                                    <div className="space-y-4">
                                        <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                            {storyProduct.name}
                                        </h2>
                                        <div className="flex items-baseline gap-2">
                                            {storyProduct.newPrice ? (
                                                <>
                                                    <span className="text-4xl font-black text-emerald-600 dark:text-emerald-500">₦{Number(storyProduct.newPrice).toLocaleString()}</span>
                                                    <span className="text-lg text-slate-400 line-through font-bold">₦{Number(storyProduct.price).toLocaleString()}</span>
                                                    {Number(storyProduct.price) > Number(storyProduct.newPrice) && (
                                                        <span className="ml-2 text-sm font-bold text-white bg-red-500 px-2 py-1 rounded-lg">
                                                            -{Math.round(((storyProduct.price - storyProduct.newPrice) / storyProduct.price) * 100)}%
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-4xl font-black text-emerald-600 dark:text-emerald-500">₦{Number(storyProduct.price).toLocaleString()}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Summary Description */}
                                    <div className="p-6 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Quick Overview</h3>
                                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium italic">
                                            "{storyProduct.description || 'No quick description available for this item.'}"
                                        </p>
                                    </div>

                                    {/* Stock Indicator */}
                                    <div className="flex items-center justify-between p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/20">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                <MdCategory size={18} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Inventory Status</span>
                                        </div>
                                        <span className={`text-sm font-black ${getStock(storyProduct) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {getStock(storyProduct) > 0 ? `${getStock(storyProduct)} Available` : 'Sold Out'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Immersive Story (Narratives) */}
                            <div className="flex-1 bg-white dark:bg-slate-900 md:overflow-y-auto custom-scrollbar">
                                <div className="p-8 md:p-16 space-y-20">
                                    {/* Section Header */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-0.5 w-12 bg-emerald-600 dark:bg-emerald-500" />
                                            <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.4em]">The Product Narrative</h3>
                                        </div>
                                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight">
                                            Everything has <br /> a <span className="text-emerald-600 italic">story to tell.</span>
                                        </h2>
                                    </div>

                                    {/* Narratives List */}
                                    {!storyProduct.descriptions || storyProduct.descriptions.length === 0 ? (
                                        <div className="py-20 text-center space-y-6">
                                            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto opacity-40">
                                                <MdStar size={40} className="text-slate-300 dark:text-slate-600" />
                                            </div>
                                            <div className="max-w-xs mx-auto">
                                                <p className="text-slate-400 dark:text-slate-500 text-sm font-medium italic">
                                                    "A simple product, yet essential. No detailed stories have been added by our staff yet, but its quality speaks for itself."
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-24 pb-10">
                                            {storyProduct.descriptions.map((desc, idx) => (
                                                <div key={desc.id || idx} className="space-y-10 group">
                                                    {/* Narrative Image Gallery */}
                                                    {desc.photo && desc.photo.length > 0 && (
                                                        <div className={`grid gap-4 ${desc.photo.length === 1 ? 'grid-cols-1' : desc.photo.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
                                                            {desc.photo.map((img, i) => (
                                                                <div 
                                                                    key={i} 
                                                                    className={`relative rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 transition-all duration-500 hover:-translate-y-2 ${
                                                                        desc.photo.length === 1 ? 'aspect-video' : 'aspect-square'
                                                                    }`}
                                                                >
                                                                    <img src={img} alt={`Story visual ${i + 1}`} className="w-full h-full object-cover" />
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Narrative Text */}
                                                    <div className="relative pl-12">
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-600 to-transparent rounded-full opacity-20" />
                                                        <div className="absolute -left-3 top-0 w-7 h-7 bg-white dark:bg-slate-800 border-4 border-emerald-600 dark:border-emerald-500 rounded-full flex items-center justify-center">
                                                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500">{idx + 1}</span>
                                                        </div>
                                                        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 font-medium leading-[1.8] first-letter:text-5xl first-letter:font-black first-letter:text-emerald-600 first-letter:mr-3 first-letter:float-left">
                                                            {desc.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Satisfaction Guarantee */}
                                            <div className="pt-10">
                                                <div className="p-10 bg-gradient-to-br from-emerald-600/5 to-transparent dark:from-emerald-600/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 space-y-6">
                                                    <MdStar className="text-emerald-500 text-3xl" />
                                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">Our Quality Guarantee</h3>
                                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                                        Every product from our farm is harvested with care and undergoes rigorous quality checks. The stories you read above reflect the journey of this product from our soil to your table.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CartPage;
