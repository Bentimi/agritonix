import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { MdAccessTime, MdHourglassEmpty, MdRefresh } from 'react-icons/md';
import api from '../services/api';

const PaymentPendingPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('processing');
    const [error, setError] = useState(null);
    
    const reference = searchParams.get('reference') || searchParams.get('trxref') || searchParams.get('tx_ref') || searchParams.get('transaction_id');
    const orderId = searchParams.get('order_id');
    const paymentStatus = searchParams.get('status');

    useEffect(() => {
        const allParams = Object.fromEntries(searchParams.entries());
        console.log('PaymentPending URL params:', allParams);
        
        // If payment already successful, go to success page
        if (paymentStatus === 'successful' || paymentStatus === 'success') {
            const queryParam = reference ? `reference=${reference}` : `tx_ref=${searchParams.get('tx_ref')}`;
            navigate(`/payment/success?${queryParam}`);
            return;
        }
        
        if (!reference && !orderId) {
            navigate('/cart');
            return;
        }

        let checkInterval;
        let currentAttempt = 0;

        const checkOrderStatus = async () => {
            currentAttempt++;
            setStatus('checking');
            
            try {
                const queryParam = reference ? `reference=${reference}` : `order_id=${orderId}`;
                const response = await api.get(`/payment/status?${queryParam}`);
                
                if (response.data.status === 'success') {
                    const orderStatus = response.data.data?.order_status || response.data.data?.status;
                    
                    if (orderStatus === 'successful' || orderStatus === 'success') {
                        clearInterval(checkInterval);
                        navigate(`/payment/success?${queryParam}`);
                        return;
                    } else if (orderStatus === 'failed') {
                        clearInterval(checkInterval);
                        navigate(`/payment/failed?${queryParam}`);
                        return;
                    }
                }
            } catch (err) {
                console.error('Error checking order status:', err);
                // Fail silently, retry on next interval unless maxed out
            }

            if (currentAttempt >= 10) {
                clearInterval(checkInterval);
                setError('Payment verification timed out. Please check your orders page.');
                setStatus('timed_out');
            } else {
                setStatus('processing');
            }
        };

        checkOrderStatus();
        checkInterval = setInterval(checkOrderStatus, 5000);

        return () => {
            clearInterval(checkInterval);
        };
    }, [reference, orderId, paymentStatus, searchParams, navigate]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 max-w-md w-full text-center"
            >
                <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-4 border-amber-200 dark:border-amber-800 border-t-amber-600 dark:border-t-amber-400"
                    />
                    <MdAccessTime className="text-amber-600 dark:text-amber-400 text-3xl relative z-10" />
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Processing Payment
                </h1>
                
                <p className="text-gray-600 dark:text-slate-400 mb-6">
                    Please wait while we confirm your payment. This may take a few moments.
                </p>

                <div className="mb-6">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="flex items-center gap-1">
                            {[...Array(3)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                                    className="w-2 h-2 bg-amber-500 rounded-full"
                                />
                            ))}
                        </div>
                        <span className="text-sm text-gray-500 dark:text-slate-400 ml-2">
                            {status === 'checking' ? 'Checking...' : status === 'timed_out' ? 'Timed Out' : 'Processing...'}
                        </span>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <MdHourglassEmpty className="text-gray-400 dark:text-slate-500 text-xl" />
                        <div className="text-left">
                            <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                                Do not close this window
                            </p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                Your payment is being verified automatically
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4"
                    >
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </motion.div>
                )}

                <button
                    onClick={() => window.location.reload()}
                    className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 text-sm flex items-center justify-center gap-2 mx-auto transition-colors"
                >
                    <MdRefresh size={16} />
                    Refresh Page
                </button>
            </motion.div>
        </div>
    );
};

export default PaymentPendingPage;
