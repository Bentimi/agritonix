import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MdSearch, MdInventory2, MdAdd, MdCheckCircle, MdPending, MdClose,
    MdStore, MdVisibility, MdCategory, MdFilterList, MdChevronLeft, MdChevronRight
} from 'react-icons/md';
import DashboardLayout from '../components/DashboardLayout';

const STATUS_COLORS = {
    approved: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/15 dark:text-emerald-400',
    pending:  'text-amber-600 bg-amber-50 dark:bg-amber-900/15 dark:text-amber-400',
    rejected: 'text-red-600 bg-red-50 dark:bg-red-900/15 dark:text-red-400',
    review:   'text-sky-600 bg-sky-50 dark:bg-sky-900/15 dark:text-sky-400',
};

const ProductsPage = () => {
    const { user } = useAuth();
    const [products, setProducts]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewProduct, setViewProduct]   = useState(null);
    const [currentPage, setCurrentPage]   = useState(1);
    const pageSize = 10;

    useEffect(() => {
        const fetchProducts = async () => {
            if (!user) return;
            try {
                const res = await api.get('/product/all-products');
                if (res.data.status === 'success') setProducts(res.data.data || []);
            } catch {
                toast.error('Failed to load products');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [user]);

    const filtered = useMemo(() => {
        let list = products;
        if (searchTerm) list = list.filter(p =>
            p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category?.category?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filterStatus !== 'all') list = list.filter(p => (p.approved || '').toLowerCase() === filterStatus);
        return list;
    }, [products, searchTerm, filterStatus]);

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginated  = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus]);

    const stats = useMemo(() => ({
        total:    products.length,
        approved: products.filter(p => p.approved === 'approved').length,
        pending:  products.filter(p => p.approved === 'pending').length,
        rejected: products.filter(p => p.approved === 'rejected').length,
    }), [products]);

    const statCards = [
        { label: 'Total',    value: stats.total,    iconBg: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600', icon: <MdInventory2 />,   accent: 'stat-accent-emerald' },
        { label: 'Approved', value: stats.approved, iconBg: 'bg-sky-100 dark:bg-sky-900/20 text-sky-600',             icon: <MdCheckCircle />,  accent: 'stat-accent-sky' },
        { label: 'Pending',  value: stats.pending,  iconBg: 'bg-amber-100 dark:bg-amber-900/20 text-amber-600',       icon: <MdPending />,      accent: 'stat-accent-amber' },
        { label: 'Rejected', value: stats.rejected, iconBg: 'bg-red-100 dark:bg-red-900/20 text-red-500',             icon: <MdStore />,        accent: 'stat-accent-violet' },
    ];

    const getPageNumbers = () => {
        const pages = [], maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end   = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    return (
        <DashboardLayout activeNav="products">
            <div className="p-6 lg:p-10 page-enter">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Products</h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Manage farm inventory and product listings</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all">
                        <MdAdd size={18} /> Add Product
                    </button>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {statCards.map((s, i) => (
                        <motion.div key={s.label}
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07, duration: 0.35, ease: 'easeOut' }}
                            className={`stat-accent ${s.accent} bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800/70`}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-3 ${s.iconBg}`}>{s.icon}</div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>{s.value}</h3>
                            <p className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{s.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                    <div className="relative group flex-1">
                        <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input type="text" placeholder="Search by name or category..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm w-full dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-400"
                        />
                        {searchTerm && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                {filtered.length} results
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <MdFilterList className="text-gray-400" />
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                            className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all">
                            <option value="all">All Status</option>
                            <option value="approved">Approved</option>
                            <option value="pending">Pending</option>
                            <option value="rejected">Rejected</option>
                            <option value="review">Under Review</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/60 dark:bg-slate-800/30 border-b border-gray-100 dark:border-slate-800/70">
                                    <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Product</th>
                                    <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Category</th>
                                    <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Price</th>
                                    <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Stock</th>
                                    <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="skeleton w-10 h-10 rounded-xl" /><div><div className="skeleton h-3.5 w-32 mb-2" /><div className="skeleton h-2.5 w-20" /></div></div></td>
                                            <td className="px-6 py-4"><div className="skeleton h-4 w-24 rounded-md" /></td>
                                            <td className="px-6 py-4"><div className="skeleton h-4 w-20 rounded-md" /></td>
                                            <td className="px-6 py-4"><div className="skeleton h-4 w-12 rounded-md" /></td>
                                            <td className="px-6 py-4"><div className="skeleton h-5 w-16 rounded-md" /></td>
                                            <td className="px-6 py-4 text-right"><div className="skeleton h-7 w-16 rounded-lg ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                                                    <MdInventory2 className="text-2xl text-gray-300 dark:text-slate-600" />
                                                </div>
                                                <p className="text-sm font-semibold text-gray-400 dark:text-slate-500">No products found</p>
                                                <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">{searchTerm ? 'Try adjusting your search' : 'Add your first product'}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginated.map((product, i) => {
                                    const statusKey = (product.approved || 'pending').toLowerCase();
                                    return (
                                        <tr key={product.id} className="table-row-hover">
                                            {/* Product */}
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                                                        {product.photo
                                                            ? <img src={product.photo} alt={product.name} className="w-full h-full object-cover" />
                                                            : <MdInventory2 className="text-gray-300 dark:text-slate-600 text-lg" />
                                                        }
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{product.name || '—'}</p>
                                                        <p className="text-xs text-gray-400 dark:text-slate-500 truncate">
                                                            {product.draft ? 'Draft' : 'Published'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Category */}
                                            <td className="px-6 py-3.5">
                                                <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-slate-300">
                                                    <MdCategory className="text-gray-400 text-xs" />
                                                    {product.category?.category || '—'}
                                                </span>
                                            </td>
                                            {/* Price */}
                                            <td className="px-6 py-3.5">
                                                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                                    {product.price ? `GH₵ ${Number(product.price).toLocaleString()}` : '—'}
                                                </p>
                                                {product.newPrice && (
                                                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                                        Sale: GH₵ {Number(product.newPrice).toLocaleString()}
                                                    </p>
                                                )}
                                            </td>
                                            {/* Stock */}
                                            <td className="px-6 py-3.5">
                                                <span className={`font-semibold text-sm ${product.quantity === 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                                    {product.quantity ?? '—'}
                                                </span>
                                            </td>
                                            {/* Status */}
                                            <td className="px-6 py-3.5">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider ${STATUS_COLORS[statusKey] || STATUS_COLORS.pending}`}>
                                                    {statusKey}
                                                </span>
                                            </td>
                                            {/* Actions */}
                                            <td className="px-6 py-3.5 text-right">
                                                <button
                                                    onClick={() => setViewProduct(product)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 border border-gray-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-900/40 rounded-lg transition-all"
                                                >
                                                    <MdVisibility size={14} /> View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && filtered.length > pageSize && (
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800/70 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <p className="text-xs text-gray-400 dark:text-slate-500">
                                Showing <span className="font-semibold text-gray-600 dark:text-slate-300">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-semibold text-gray-600 dark:text-slate-300">{Math.min(currentPage * pageSize, filtered.length)}</span> of <span className="font-semibold text-gray-600 dark:text-slate-300">{filtered.length}</span> products
                            </p>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                    className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                                    <MdChevronLeft size={18} />
                                </button>
                                {getPageNumbers().map(page => (
                                    <button key={page} onClick={() => setCurrentPage(page)}
                                        className={`min-w-[32px] h-8 rounded-lg text-xs font-bold transition-all ${currentPage === page ? 'bg-emerald-600 text-white' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}>
                                        {page}
                                    </button>
                                ))}
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}
                                    className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                                    <MdChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
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

                            {/* Image / Header */}
                            <div className="relative h-52 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700">
                                {viewProduct.photo
                                    ? <img src={viewProduct.photo} alt={viewProduct.name} className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center"><MdInventory2 className="text-5xl text-gray-200 dark:text-slate-600" /></div>
                                }
                                <button onClick={() => setViewProduct(null)}
                                    className="absolute top-3 right-3 p-2 bg-black/30 hover:bg-black/50 text-white rounded-xl transition-all backdrop-blur-sm">
                                    <MdClose size={18} />
                                </button>
                                <span className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[(viewProduct.approved || 'pending').toLowerCase()] || STATUS_COLORS.pending}`}>
                                    {viewProduct.approved || 'pending'}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="p-7">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>{viewProduct.name}</h2>
                                {viewProduct.category?.category && (
                                    <p className="text-xs text-gray-400 dark:text-slate-500 mb-5 flex items-center gap-1"><MdCategory size={12} /> {viewProduct.category.category}</p>
                                )}
                                <div className="grid grid-cols-3 gap-4 mb-5">
                                    <div className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-3">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Price</p>
                                        <p className="font-bold text-gray-900 dark:text-white">{viewProduct.price ? `GH₵ ${Number(viewProduct.price).toLocaleString()}` : '—'}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-3">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Stock</p>
                                        <p className={`font-bold ${viewProduct.quantity === 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{viewProduct.quantity ?? '—'}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-3">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Draft</p>
                                        <p className="font-bold text-gray-900 dark:text-white">{viewProduct.draft ? 'Yes' : 'No'}</p>
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

export default ProductsPage;
