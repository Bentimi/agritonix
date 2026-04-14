import React from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { MdErrorOutline, MdRefresh, MdShoppingCart, MdHelpOutline } from 'react-icons/md';

const PaymentFailedPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const reference = searchParams.get('reference') || searchParams.get('trxref');

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 max-w-md w-full text-center"
            >
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MdErrorOutline className="text-red-600 dark:text-red-400 text-4xl" />
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Payment Failed
                </h1>
                
                <p className="text-gray-600 dark:text-slate-400 mb-6">
                    We couldn't process your payment. Please try again or contact support if the issue persists.
                </p>

                {/* Info Card */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <MdHelpOutline className="text-red-500 dark:text-red-400 text-xl" />
                        <div className="text-left">
                            <p className="text-sm text-red-700 dark:text-red-300">
                                Common reasons:
                            </p>
                            <ul className="text-xs text-red-600 dark:text-red-400 list-disc list-inside mt-1">
                                <li>Insufficient funds</li>
                                <li>Card declined</li>
                                <li>Network timeout</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Reference Info */}
                {reference && (
                    <div className="text-xs text-gray-400 dark:text-slate-500 mb-4">
                        Ref: {reference}
                    </div>
                )}

                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/checkout')}
                        className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <MdRefresh size={20} />
                        Try Again
                    </button>
                    
                    <button
                        onClick={() => navigate('/cart')}
                        className="w-full py-3 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <MdShoppingCart size={20} />
                        Back to Cart
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentFailedPage;
