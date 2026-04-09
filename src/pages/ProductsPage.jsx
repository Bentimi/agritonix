import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MdSearch, MdInventory2, MdAdd, MdCheckCircle, MdPending, MdClose,
    MdStore, MdVisibility, MdCategory, MdFilterList
} from 'react-icons/md';
import DashboardLayout from '../components/DashboardLayout';

const STATUS_COLORS = {
    published: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/15 dark:text-emerald-400',
    draft: 'text-amber-600 bg-amber-50 dark:bg-amber-900/15 dark:text-amber-400',
    pending: 'text-sky-600 bg-sky-50 dark:bg-sky-900/15 dark:text-sky-400',
    rejected: 'text-red-600 bg-red-50 dark:bg-red-900/15 dark:text-red-400',
};

const ProductsPage = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewProduct, setViewProduct] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            if (!user) return;
            try {
                const res = await api.get('/product/all-products');
                if (res.data.status === 'success') setProducts(res.data.data || []);
            } catch (error) {
                toast.error('Failed to load products');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [user]);

    const filtered = useMemo(() => {
        let list = products;
        if (searchTerm) {
            list = list.filter(p =>
                p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (filterStatus !== 'all') {
            list = list.filter(p => p.status === filterStatus || p.publish_status === filterStatus);
        }
        return list;
    }, [products, searchTerm, filterStatus]);

    const stats = useMemo(() => ({
        total: products.length,
        published: products.filter(p => p.status === 'published' || p.publish_status === 'published').length,
        pending: products.filter(p => p.approval_status === 'pending' || p.status === 'pending').length,
        draft: products.filter(p => p.status === 'draft').length,
    }), [products]);

    const statCards = [
        { label: 'Total Products', value: stats.total, icon: <MdInventory2 />, accent: 'stat-accent-emerald', iconBg: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600' },
        { label: 'Published', value: stats.published, icon: <MdCheckCircle />, accent: 'stat-accent-sky', iconBg: 'bg-sky-100 dark:bg-sky-900/20 text-sky-600' },
        { label: 'Pending', value: stats.pending, icon: <MdPending />, accent: 'stat-accent-amber', iconBg: 'bg-amber-100 dark:bg-amber-900/20 text-amber-600' },
        { label: 'Drafts', value: stats.draft, icon: <MdStore />, accent: 'stat-accent-violet', iconBg: 'bg-violet-100 dark:bg-violet-900/20 text-violet-600' },
    ];

    return (
        <DashboardLayout activeNav="products">
            <div className="p-6 lg:p-10 page-enter">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Products</h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Manage farm inventory and product listings</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 gradient-bg text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all">
                        <MdAdd size={18} /> Add Product
                    </button>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {statCards.map((stat, i) => (
                        <motion.div key={stat.label}
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08, duration: 0.4, ease: 'easeOut' }}
                            className={`stat-accent ${stat.accent} bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800/70 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${stat.iconBg}`}>{stat.icon}</div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>{stat.value}</h3>
                            <p className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                    <div className="relative group flex-1">
                        <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input type="text" placeholder="Search products or categories..."
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm w-full dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-400"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <MdFilterList className="text-gray-400" />
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all">
                            <option value="all">All Status</option>
                            <option value="published">Published</option>
                            <option value="pending">Pending</option>
                            <option value="draft">Draft</option>
                        </select>
                    </div>
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 p-4">
                                <div className="skeleton h-40 w-full rounded-xl mb-4" />
                                <div className="skeleton h-4 w-3/4 mb-2" />
                                <div className="skeleton h-3 w-1/2 mb-3" />
                                <div className="skeleton h-3 w-1/3" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 p-16 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                            <MdInventory2 className="text-2xl text-gray-300 dark:text-slate-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-400 dark:text-slate-500">No products found</p>
                        <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">{searchTerm ? 'Try adjusting your search' : 'Add your first product'}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filtered.map((product, i) => (
                            <ProductCard key={product.id} product={product} index={i} onView={() => setViewProduct(product)} />
                        ))}
                    </div>
                )}
            </div>

            {/* Product Detail Modal */}
            <AnimatePresence>
                {viewProduct && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewProduct(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 border border-gray-100 dark:border-slate-800/70 max-h-[90vh] overflow-y-auto">
                            <div className="relative h-52 bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-slate-800 dark:to-slate-700">
                                {viewProduct.photo ? (
                                    <img src={viewProduct.photo} alt={viewProduct.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <MdInventory2 className="text-5xl text-gray-200 dark:text-slate-600" />
                                    </div>
                                )}
                                <button onClick={() => setViewProduct(null)}
                                    className="absolute top-3 right-3 p-2 bg-black/30 hover:bg-black/50 text-white rounded-xl transition-all backdrop-blur-sm">
                                    <MdClose size={18} />
                                </button>
                                {(viewProduct.status || viewProduct.publish_status) && (
                                    <span className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[viewProduct.status || viewProduct.publish_status] || STATUS_COLORS.draft}`}>
                                        {viewProduct.status || viewProduct.publish_status}
                                    </span>
                                )}
                            </div>
                            <div className="p-7">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>{viewProduct.name}</h2>
                                {viewProduct.category?.name && (
                                    <p className="text-xs text-gray-400 dark:text-slate-500 mb-4 flex items-center gap-1"><MdCategory size={12} /> {viewProduct.category.name}</p>
                                )}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Price</p>
                                        <p className="font-bold text-gray-900 dark:text-white text-lg">{viewProduct.price ? `GH₵ ${Number(viewProduct.price).toLocaleString()}` : '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Stock</p>
                                        <p className="font-bold text-gray-900 dark:text-white text-lg">{viewProduct.quantity ?? '—'}</p>
                                    </div>
                                </div>
                                {viewProduct.description && (
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Description</p>
                                        <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{viewProduct.description}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

const ProductCard = ({ product, index, onView }) => {
    const statusKey = product.status || product.publish_status || 'draft';
    const statusColor = STATUS_COLORS[statusKey] || STATUS_COLORS.draft;
    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.35, ease: 'easeOut' }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 overflow-hidden">
                {product.photo ? (
                    <img src={product.photo} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <MdInventory2 className="text-4xl text-gray-200 dark:text-slate-600" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                    <button onClick={onView} className="p-1.5 bg-white/90 dark:bg-slate-800/90 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-white transition-all shadow-sm" title="View Details">
                        <MdVisibility size={14} />
                    </button>
                </div>
            </div>
            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate flex-1" style={{ fontFamily: "'Outfit', sans-serif" }}>{product.name}</h3>
                    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${statusColor}`}>{statusKey}</span>
                </div>
                {product.category?.name && (
                    <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1 mb-2"><MdCategory size={11} /> {product.category.name}</p>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-slate-800">
                    <div className="flex items-center gap-0.5 text-gray-900 dark:text-white">
                        <span className="text-xs text-gray-400">GH₵</span>
                        <span className="font-bold text-sm ml-0.5">{product.price ? Number(product.price).toLocaleString() : '—'}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Qty: {product.quantity ?? '—'}</span>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductsPage;
