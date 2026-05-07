import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { MdCheckCircle, MdShoppingBag, MdHome, MdReceipt } from 'react-icons/md';
import { toast } from 'react-toastify';
import api from '../services/api';
import ReceiptModal from '../components/ReceiptModal';

const PaymentSuccessPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [order, setOrder]               = useState(null);
    const [loadingOrder, setLoadingOrder] = useState(false);
    const [showReceipt, setShowReceipt]   = useState(false);

    const txRef         = searchParams.get('tx_ref') || searchParams.get('reference') || searchParams.get('trxref');
    const transactionId = searchParams.get('transaction_id');

    const fetchOrder = useCallback(async () => {
        if (!txRef) return;
        setLoadingOrder(true);
        try {
            const ordersRes = await api.get('/order/my-orders?page=1&pageSize=20');
            const orders = ordersRes.data?.data?.orders || [];
            const matched = orders.find(o => o.txRef === txRef);
            if (matched) setOrder(matched);
        } catch (e) {
            console.error('Failed to fetch order for receipt:', e);
        } finally {
            setLoadingOrder(false);
        }
    }, [txRef]);

    useEffect(() => {
        const verifyAndFetch = async () => {
            // ── Active fallback: trigger backend DB verification in case
            //    the Flutterwave webhook hasn't fired yet. This marks the
            //    order successful + cart items checked:true so the cart
            //    appears empty when the user navigates to /cart.
            if (txRef) {
                try {
                    const params = new URLSearchParams({ tx_ref: txRef });
                    if (transactionId) params.append('transaction_id', transactionId);
                    await api.get(`/payment/status?${params.toString()}`);
                } catch (e) {
                    // Non-fatal — continue to show success UI regardless
                    console.warn('PaymentSuccessPage: status check failed:', e.message);
                }
            }
            fetchOrder();
        };

        verifyAndFetch();
        toast.success('Payment confirmed successfully!', { toastId: 'payment-success' });
    }, [fetchOrder, txRef, transactionId]);

    return (
        <>
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
                {loadingOrder && !order ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
                        <p className="text-sm font-medium text-gray-400 animate-pulse uppercase tracking-widest">
                            Confirming Payment...
                        </p>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-8 sm:p-10 max-w-sm w-full text-center"
                    >
                        {/* Animated check icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
                            className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-7"
                        >
                            <MdCheckCircle className="text-emerald-600 dark:text-emerald-400 text-5xl" />
                        </motion.div>

                        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                            Payment Successful!
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-8 leading-relaxed">
                            Your order has been confirmed. We'll start processing it right away.
                        </p>

                        <div className="flex flex-col gap-3">
                            {/* View Receipt */}
                            <button
                                onClick={() => setShowReceipt(true)}
                                disabled={loadingOrder || !order}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-sm transition-colors"
                            >
                                <MdReceipt size={18} />
                                {loadingOrder ? 'Loading receipt…' : !order ? 'Receipt unavailable' : 'View Receipt'}
                            </button>

                            {/* Continue Shopping */}
                            <button
                                onClick={() => navigate('/products')}
                                className="w-full py-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-semibold rounded-2xl flex items-center justify-center gap-2 text-sm transition-colors border border-gray-200 dark:border-slate-700"
                            >
                                <MdShoppingBag size={18} />
                                Continue Shopping
                            </button>

                            {/* Dashboard */}
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full py-2.5 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 font-medium flex items-center justify-center gap-2 text-sm transition-colors"
                            >
                                <MdHome size={17} />
                                Go to Dashboard
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Shared receipt modal — identical to the one on OrdersPage */}
            {showReceipt && order && (
                <ReceiptModal
                    order={order}
                    onClose={() => setShowReceipt(false)}
                />
            )}
        </>
    );
};

export default PaymentSuccessPage;
