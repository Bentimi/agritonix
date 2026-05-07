import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MdReceipt, MdCheckCircle, MdPending, MdError, MdLocalShipping, MdStore } from 'react-icons/md';

const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
        case 'successful':
            return { color: 'text-emerald-500', label: 'Successful' };
        case 'pending':
            return { color: 'text-amber-500', label: 'Pending' };
        case 'processing':
            return { color: 'text-blue-500', label: 'Processing' };
        case 'failed':
            return { color: 'text-red-500', label: 'Failed' };
        default:
            return { color: 'text-gray-500', label: status || 'Unknown' };
    }
};

/**
 * ReceiptModal — shared between OrdersPage and PaymentSuccessPage.
 *
 * Props:
 *   order    – the order object (with .carts, .txRef, .total_price, etc.)
 *   onClose  – called when the user clicks backdrop or Close button
 */
const ReceiptModal = ({ order, onClose }) => {
    if (!order) return null;

    const statusCfg = getStatusConfig(order.status);

    const modalContent = (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 print-receipt-section">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm print:hidden"
                    onClick={onClose}
                />

                {/* Modal card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-xl print:shadow-none relative z-10 flex flex-col max-h-[90vh] print-receipt-card"
                >
                    {/* ── Scrollable receipt body ── */}
                    <div className="flex-1 overflow-y-auto hide-scrollbar p-8 border-b-4 border-emerald-600 print:border-none receipt-scroll-container">

                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <MdStore size={32} />
                            </div>
                            <h2
                                className="text-2xl font-black text-gray-900 dark:text-white tracking-widest uppercase mb-1"
                                style={{ fontFamily: "'Outfit', sans-serif" }}
                            >
                                Agritronix
                            </h2>
                            <p className="text-xs text-gray-400 dark:text-slate-500 font-medium tracking-[0.2em] uppercase">
                                Purchase Receipt
                            </p>
                        </div>

                        {/* Order meta */}
                        <div className="grid grid-cols-2 gap-4 mb-6 text-sm border-y border-dashed border-gray-200 dark:border-slate-700 py-4">
                            <div>
                                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Receipt No.</p>
                                <p className="font-bold text-gray-900 dark:text-white break-all">{order.txRef || order.id}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Date</p>
                                <p className="font-bold text-gray-900 dark:text-white">
                                    {new Date(order.orderedDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Status</p>
                                <p className={`font-bold ${statusCfg.color}`}>{statusCfg.label}</p>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 dark:border-slate-800 pb-2">
                                Items
                            </h3>
                            <div className="space-y-3">
                                {order.carts?.map((cartItem) => (
                                    <div key={cartItem.id} className="flex items-center gap-3 text-sm py-2">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 dark:border-slate-700 print:border-gray-300">
                                            {cartItem.product?.photo ? (
                                                <img
                                                    src={cartItem.product.photo}
                                                    alt={cartItem.product.name}
                                                    crossOrigin="anonymous"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <MdStore className="text-xl text-gray-400 print:text-gray-500" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 dark:text-white print:text-black line-clamp-1">
                                                {cartItem.product?.name || 'Unknown Product'}
                                            </p>
                                            <p className="text-xs text-gray-500 print:text-gray-600">
                                                {cartItem.quantity} x NGN {Number(cartItem.price).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="font-bold text-gray-900 dark:text-white print:text-black text-right pl-2 shrink-0">
                                            NGN {Number(cartItem.total_price).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="border-t-2 border-dashed border-gray-200 dark:border-slate-700 pt-4 space-y-2 text-sm text-gray-600 dark:text-slate-400">
                            <div className="flex justify-between">
                                <span className="font-medium">Subtotal</span>
                                <span className="font-bold text-gray-900 dark:text-white">
                                    NGN {Number(order.carts?.reduce((sum, item) => sum + Number(item.total_price), 0) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            {(order.taxFee != null || order.tax_fee != null) && (
                                <div className="flex justify-between">
                                    <span className="font-medium">Tax Fee (7.5%)</span>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        NGN {Number(order.taxFee || order.tax_fee).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between font-black text-gray-900 dark:text-white text-xl pt-4 mt-2 border-t border-gray-100 dark:border-slate-800 print:border-black">
                                <span className="uppercase tracking-widest text-xs">Total Amount</span>
                                <span className="text-emerald-600 print:text-black">
                                    NGN {Number(order.total_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        {/* Verification timestamp */}
                        {(order.verified_at || order.verifiedAt) && (
                            <div className="mt-8 text-center text-xs text-gray-400 dark:text-slate-500">
                                <p className="flex items-center justify-center gap-1">
                                    <MdCheckCircle className="text-emerald-500 print:text-black" />
                                    Payment Verified
                                </p>
                                <p>
                                    {new Date(order.verified_at || order.verifiedAt).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ── Action bar ── */}
                    <div className="p-4 bg-gray-50/60 dark:bg-slate-800/40 flex gap-3 print:hidden rounded-b-2xl shrink-0">
                        <button
                            onClick={() => window.print()}
                            className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            <MdReceipt size={17} />
                            Print Receipt
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-semibold rounded-xl transition-colors text-sm hover:bg-gray-50 dark:hover:bg-slate-700"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default ReceiptModal;
