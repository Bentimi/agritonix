import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdReceipt, MdCheckCircle, MdPending, MdError, MdLocalShipping, MdChevronLeft, MdChevronRight, MdOutlineRefresh } from 'react-icons/md';
import api from '../services/api';
import { toast } from 'react-toastify';
import ReceiptModal from '../components/ReceiptModal';

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize] = useState(10);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const fetchOrders = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/order/my-orders?page=${page}&pageSize=${pageSize}`);
            if (response.data.status === 'success') {
                setOrders(response.data.data.orders);
                setTotalPages(response.data.data.pagination.totalPages || 1);
            } else {
                toast.error(response.data.message || 'Failed to loaded orders');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Could not load your orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders(currentPage);
    }, [currentPage]);

    const getStatusConfig = (status) => {
        switch (status?.toLowerCase()) {
            case 'successful':
                return { color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: <MdCheckCircle />, label: 'Successful' };
            case 'pending':
                return { color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: <MdPending />, label: 'Pending' };
            case 'processing':
                return { color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: <MdLocalShipping />, label: 'Processing' };
            case 'failed':
                return { color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', icon: <MdError />, label: 'Failed' };
            default:
                return { color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800', icon: <MdReceipt />, label: status || 'Unknown' };
        }
    };

    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setIsDetailsModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                            <MdReceipt className="text-emerald-600" />
                            My Orders
                        </h1>
                        <p className="text-gray-600 dark:text-slate-400 text-sm mt-1">Track and manage your recent purchases</p>
                    </div>
                    <button
                        onClick={() => fetchOrders(currentPage)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-sm w-fit"
                    >
                        <MdOutlineRefresh size={18} />
                        Refresh
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center animate-pulse mb-4">
                        <MdReceipt className="text-white text-2xl" />
                    </div>
                    <p className="text-gray-500 dark:text-slate-400 font-medium">Loading your orders...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/60 p-12 text-center">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MdReceipt className="text-4xl text-gray-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>No orders yet</h3>
                    <p className="text-gray-500 dark:text-slate-400 mb-6 max-w-md mx-auto">You haven't placed any orders yet. Browse our products and make your first purchase!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order, index) => {
                        const status = getStatusConfig(order.status);
                        const itemCount = order.carts?.length || 0;
                        const itemsPreview = order.carts?.slice(0, 3).map(cart => cart.product?.name).filter(Boolean).join(', ');
                        
                        return (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleViewDetails(order)}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/80 p-5 sm:p-6 hover:shadow-lg hover:border-emerald-500/30 transition-all cursor-pointer group"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${status.bg} ${status.color}`}>
                                                {status.icon}
                                                {status.label}
                                            </span>
                                            <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
                                                {new Date(order.orderedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                            Order #{order.txRef || order.id.slice(0, 8)}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-1">
                                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between md:flex-col md:items-end gap-2 border-t md:border-t-0 md:border-l border-gray-100 dark:border-slate-800 pt-3 md:pt-0 md:pl-6 text-right">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-slate-500 uppercase font-semibold tracking-wider mb-0.5">Total Amount</p>
                                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                                NGN {Number(order.total_price).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-800 text-gray-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-500 flex items-center justify-center transition-colors">
                                            <MdChevronRight size={20} />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8 pt-8 border-t border-gray-200 dark:border-slate-800">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-xl text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
                            >
                                <MdChevronLeft size={24} />
                            </button>
                            <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-xl text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
                            >
                                <MdChevronRight size={24} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Order Details Modal — shared ReceiptModal component */}
            {isDetailsModalOpen && selectedOrder && (
                <ReceiptModal
                    order={selectedOrder}
                    onClose={() => setIsDetailsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default OrdersPage;
