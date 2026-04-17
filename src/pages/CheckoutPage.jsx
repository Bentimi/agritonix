import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import api from '../services/api';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { MdArrowBack, MdShoppingCart, MdStore, MdPayment, MdLock, MdChevronLeft, MdChevronRight } from 'react-icons/md';

const CheckoutPage = () => {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creatingPayment, setCreatingPayment] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(4);
    const navigate = useNavigate();

    // Load cart from database on mount
    useEffect(() => {
        const fetchCart = async () => {
            try {
                const response = await api.get('/product/cart');
                if (response.data.status === 'success') {
                    const cartData = response.data.data;
                    if (cartData && cartData.cart && Array.isArray(cartData.cart) && cartData.cart.length > 0) {
                        setCart(cartData.cart);
                    } else {
                        toast.error('Your cart is empty');
                        navigate('/cart');
                    }
                } else {
                    navigate('/cart');
                }
            } catch (error) {
                console.error('Error loading cart:', error);
                toast.error('Failed to load cart');
                navigate('/cart');
            } finally {
                setLoading(false);
            }
        };
        fetchCart();
    }, [navigate]);

    const getCartTotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getTax = () => {
        return getCartTotal() * 0.075;
    };

    const getOrderTotal = () => {
        return getCartTotal() + getTax();
    };

    const totalPages = Math.ceil(cart.length / pageSize);
    const paginatedItems = cart.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handlePayNow = async () => {
        if (cart.length === 0) {
            toast.error('Your cart is empty');
            return;
        }

        setCreatingPayment(true);
        try {
            const amount = getOrderTotal();
            
            // Call the payment link creation endpoint
            const response = await api.post('/payment/create-payment-link', {
                // amount: amount,
                // currency: 'NGN',
                // description: `Order for ${cart.length} item(s)`,
                url: `${window.location.origin}/payment/pending`,
            });
            console.log(response.data)
            if (response.data.status === 'success' && response.data.data?.link) {
                toast.success('Redirecting to secure payment...');
                // Redirect to payment gateway
                window.location.href = response.data.data;
            } else {
                toast.error(response.data.message || 'Failed to create payment link');
            }
        } catch (error) {
            console.error('Error creating payment link:', error);
            toast.error(error.response?.data?.message || 'Failed to initiate payment. Please try again.');
        } finally {
            setCreatingPayment(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center animate-pulse">
                        <MdShoppingCart className="text-white text-2xl" />
                    </div>
                    <p className="text-sm font-medium text-gray-400 dark:text-slate-500">Loading checkout...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/cart')}
                            className="p-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <MdArrowBack size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                Checkout
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-slate-400">
                                Secure payment
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6"
                >
                    {/* Payment Security Badge */}
                    <div className="flex items-center justify-center gap-2 mb-6 text-gray-900 dark:text-white">
                        <MdLock className="text-emerald-600" size={20} />
                        <span className="text-sm font-medium">Secure SSL Encrypted Payment</span>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Order Summary</h2>
                        {totalPages > 1 && (
                            <div className="flex items-center gap-1">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                    className="p-1 text-gray-400 hover:text-emerald-600 disabled:opacity-30">
                                    <MdChevronLeft size={18} />
                                </button>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                                    {currentPage}/{totalPages}
                                </span>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                    className="p-1 text-gray-400 hover:text-emerald-600 disabled:opacity-30">
                                    <MdChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Cart Items Preview */}
                    <div className="space-y-3 mb-6">
                        {paginatedItems.map((item) => (
                            <div key={item.id} className="flex gap-3 text-gray-900 dark:text-white">
                                <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                                    {item.product?.photo || item.photo ? (
                                        <img
                                            src={item.product?.photo || item.photo}
                                            alt={item.product?.name || item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <MdStore className="text-lg text-gray-300 dark:text-slate-600" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">
                                        {item.product?.name || item.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                                        {item.quantity} × NGN {Number(item.price).toLocaleString()}
                                    </p>
                                </div>
                                <p className="text-sm font-bold">
                                    NGN {(item.price * item.quantity).toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-200 dark:border-slate-700 pt-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-slate-400 font-medium">Subtotal</span>
                            <span className="font-bold text-gray-900 dark:text-white text-lg">
                                NGN {getCartTotal().toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-slate-400 font-medium">Tax (7.5%)</span>
                            <span className="font-bold text-gray-900 dark:text-white text-lg">
                                NGN {getTax().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="border-t border-gray-200 dark:border-slate-700 pt-3">
                            <div className="flex justify-between">
                                <span className="font-bold text-gray-900 dark:text-white text-lg">Total</span>
                                <span className="font-black text-2xl text-emerald-600">
                                    NGN {getOrderTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handlePayNow}
                        disabled={creatingPayment || cart.length === 0}
                        className="w-full mt-6 py-4 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                    >
                        {creatingPayment ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <MdPayment size={22} />
                                Pay Now NGN {getOrderTotal().toLocaleString()}
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => navigate('/cart')}
                        className="w-full mt-4 py-3 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white font-bold text-sm transition-colors uppercase tracking-widest"
                    >
                        Back to Cart
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default CheckoutPage;
