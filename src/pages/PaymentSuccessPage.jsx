import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { MdCheckCircle, MdShoppingBag, MdHome } from 'react-icons/md';
import { toast } from 'react-toastify';
import api from '../services/api';

const PaymentSuccessPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const verifyPayment = async () => {
            const reference = searchParams.get('reference') || searchParams.get('trxref') || searchParams.get('tx_ref');
            
            if (reference) {
                try {
                    const response = await api.get(`/payment/verify?reference=${reference}`);
                    if (response.data.status === 'success') {
                        toast.success('Payment verified successfully!');
                    }
                } catch (error) {
                    console.error('Payment verification error:', error);
                }
            }
        };

        verifyPayment();
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 max-w-md w-full text-center"
            >
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MdCheckCircle className="text-emerald-600 dark:text-emerald-400 text-4xl" />
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Payment Successful!
                </h1>
                
                <p className="text-gray-600 dark:text-slate-400 mb-8">
                    Thank you for your purchase. Your order has been confirmed and will be processed shortly.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/products')}
                        className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <MdShoppingBag size={20} />
                        Continue Shopping
                    </button>
                    
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full py-3 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <MdHome size={20} />
                        Go to Dashboard
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentSuccessPage;
