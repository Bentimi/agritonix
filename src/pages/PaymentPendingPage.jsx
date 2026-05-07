import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { MdAccessTime, MdError, MdRefresh, MdShieldMoon } from 'react-icons/md';
import api from '../services/api';

const MAX_ATTEMPTS  = 12;   // 12 × 5 s = 60 s total
const REFRESH_AFTER =  3;   // enable Refresh button after this many checks

const PaymentPendingPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [status, setStatus]                 = useState('processing');
    const [error, setError]                   = useState(null);
    const [attemptCount, setAttemptCount]     = useState(0);
    const [refreshEnabled, setRefreshEnabled] = useState(false);
    const [countdown, setCountdown]           = useState(REFRESH_AFTER * 5);

    const intervalRef  = useRef(null);
    const countdownRef = useRef(null);
    const attemptRef   = useRef(0);

    const reference     = searchParams.get('reference') || searchParams.get('trxref');
    const txRef         = searchParams.get('tx_ref');
    const transactionId = searchParams.get('transaction_id');
    const orderId       = searchParams.get('order_id');
    const paymentStatus = searchParams.get('status');

    const redirectByStatus = useCallback((orderStatus, queryParam) => {
        const s = (orderStatus || '').toLowerCase();
        if (s === 'successful' || s === 'success' || s === 'paid') {
            navigate(`/payment/success?${queryParam}`);
        } else if (s === 'failed' || s === 'failure' || s === 'declined') {
            navigate(`/payment/failed?${queryParam}`);
        } else if (s === 'cancelled' || s === 'canceled') {
            navigate(`/payment/failed?${queryParam}&reason=cancelled`);
        } else {
            navigate('/orders');
        }
    }, [navigate]);

    const checkOrderStatus = useCallback(async () => {
        attemptRef.current += 1;
        const attempt = attemptRef.current;
        setAttemptCount(attempt);
        setStatus('checking');

        try {
            let queryParam;
            if (reference)          queryParam = `reference=${reference}`;
            else if (txRef)         queryParam = `tx_ref=${txRef}`;
            else if (transactionId) queryParam = `transaction_id=${transactionId}`;
            else                    queryParam = `order_id=${orderId}`;

            const txIdSuffix = (transactionId && !queryParam.startsWith('transaction_id='))
                ? `&transaction_id=${transactionId}`
                : '';

            const response = await api.get(`/payment/status?${queryParam}${txIdSuffix}`);

            if (response.data.status === 'success') {
                const orderStatus = (
                    response.data.data?.order_status ||
                    response.data.data?.status       ||
                    response.data.data?.payment_status || ''
                ).toLowerCase();

                if (orderStatus && orderStatus !== 'pending' && orderStatus !== 'processing') {
                    clearInterval(intervalRef.current);
                    clearInterval(countdownRef.current);
                    redirectByStatus(orderStatus, queryParam);
                    return;
                }
            }
        } catch (err) {
            console.error('Error checking order status:', err);
        }

        if (attempt >= MAX_ATTEMPTS) {
            clearInterval(intervalRef.current);
            clearInterval(countdownRef.current);
            setError('We could not confirm your payment automatically. Please check your orders or contact support.');
            setStatus('timed_out');
            setRefreshEnabled(true);
        } else {
            setStatus('processing');
            if (attempt >= REFRESH_AFTER) setRefreshEnabled(true);
        }
    }, [reference, txRef, transactionId, orderId, redirectByStatus]);

    // Countdown timer
    useEffect(() => {
        if (refreshEnabled) return;
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) { clearInterval(countdownRef.current); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(countdownRef.current);
    }, [refreshEnabled]);

    // Bootstrap
    useEffect(() => {
        if (paymentStatus === 'successful' || paymentStatus === 'success') {
            const qp = reference ? `reference=${reference}` : txRef ? `tx_ref=${txRef}` : `tx_ref=${searchParams.get('tx_ref')}`;
            navigate(`/payment/success?${qp}`);
            return;
        }
        if (!reference && !txRef && !transactionId && !orderId) {
            navigate('/cart');
            return;
        }
        checkOrderStatus();
        intervalRef.current = setInterval(checkOrderStatus, 5000);
        return () => {
            clearInterval(intervalRef.current);
            clearInterval(countdownRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isTimedOut = status === 'timed_out';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-8 sm:p-10 max-w-sm w-full text-center shadow-2xl shadow-gray-200/60 dark:shadow-black/40"
            >
                {/* Icon */}
                <div className="relative w-24 h-24 mx-auto mb-7">
                    {!isTimedOut && (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-0 rounded-full border-[3px] border-amber-100 dark:border-amber-900/40 border-t-amber-500 dark:border-t-amber-400"
                        />
                    )}
                    <div className={`absolute inset-2 rounded-full flex items-center justify-center ${isTimedOut ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                        {isTimedOut
                            ? <MdError className="text-red-500 dark:text-red-400 text-3xl" />
                            : <MdAccessTime className="text-amber-600 dark:text-amber-400 text-3xl" />
                        }
                    </div>
                </div>

                {/* Heading */}
                <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                    {isTimedOut ? 'Verification Timed Out' : 'Confirming Payment'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-7 leading-relaxed">
                    {isTimedOut
                        ? 'Your payment may still be processed. Check your email or orders page.'
                        : 'Please keep this window open. We\'re verifying your payment automatically.'}
                </p>

                {/* Pulse dots — only while actively confirming */}
                {!isTimedOut && (
                    <div className="flex items-center justify-center gap-1.5 mb-7">
                        {[0, 1, 2].map(i => (
                            <motion.span
                                key={i}
                                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18 }}
                                className="w-2 h-2 bg-amber-400 dark:bg-amber-500 rounded-full block"
                            />
                        ))}
                        <span className="ml-2 text-xs text-gray-400 dark:text-slate-500">
                            {status === 'checking' ? 'Checking…' : 'Waiting for confirmation…'}
                        </span>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-2xl p-4 mb-6 text-left"
                    >
                        <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{error}</p>
                    </motion.div>
                )}

                {/* Refresh button */}
                <motion.button
                    onClick={() => window.location.reload()}
                    disabled={!refreshEnabled}
                    whileHover={refreshEnabled ? { scale: 1.02 } : {}}
                    whileTap={refreshEnabled ? { scale: 0.97 } : {}}
                    className={`w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                        refreshEnabled
                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200 dark:shadow-amber-900/40 cursor-pointer'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed'
                    }`}
                >
                    <MdRefresh size={16} className={refreshEnabled && status === 'checking' ? 'animate-spin' : ''} />
                    {refreshEnabled ? 'Refresh Now' : `Refresh in ${countdown}s`}
                </motion.button>

                {/* Security note */}
                <p className="mt-5 text-xs text-gray-400 dark:text-slate-600 flex items-center justify-center gap-1">
                    <MdShieldMoon size={13} />
                    Secured by Flutterwave
                </p>
            </motion.div>
        </div>
    );
};

export default PaymentPendingPage;
