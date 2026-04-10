import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAdd, MdClose, MdEdit, MdVisibility, MdInventory2, MdCategory, MdCheckCircle, MdPending, MdRemoveCircle, MdSearch, MdFilterList, MdStore } from 'react-icons/md';
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
    const [addProductModal, setAddProductModal] = useState(false);
    const [editProductModal, setEditProductModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [categoryModal, setCategoryModal] = useState(false);
    const [categoryForm, setCategoryForm] = useState({ name: '', editingId: null });
    const [categorySubmitting, setCategorySubmitting] = useState(false);
    const [categoriesList, setCategoriesList] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [descriptionModal, setDescriptionModal] = useState(false);
    const [selectedProductForDescription, setSelectedProductForDescription] = useState(null);
    const [descriptionForm, setDescriptionForm] = useState({
        description: '',
        images: [],
        photo: null,
        descriptionType: 'basic' // 'basic' or 'complex'
    });
    const [descriptionSubmitting, setDescriptionSubmitting] = useState(false);
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

    // API functions
    const handleAddProduct = async (formData) => {
        setSubmitting(true);
        try {
            const res = await api.post('/product/create', formData);
            if (res.data.status === 'success') {
                toast.success('Product created successfully');
                setAddProductModal(false);
                // Refresh products list
                const productsRes = await api.get('/product/all-products');
                if (productsRes.data.status === 'success') {
                    setProducts(productsRes.data.data || []);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create product');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditProduct = async (formData) => {
        setSubmitting(true);
        try {
            const res = await api.put(`/product/update/${selectedProduct.id}`, formData);
            if (res.data.status === 'success') {
                toast.success('Product updated successfully');
                setEditProductModal(false);
                setSelectedProduct(null);
                // Refresh products list
                const productsRes = await api.get('/product/all-products');
                if (productsRes.data.status === 'success') {
                    setProducts(productsRes.data.data || []);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update product');
        } finally {
            setSubmitting(false);
        }
    };

    const openEditModal = (product) => {
        setSelectedProduct(product);
        setEditProductModal(true);
    };

    // Category management functions
    const fetchCategoriesList = async () => {
        setCategoriesLoading(true);
        try {
            const res = await api.get('/product/categories');
            if (res.data.status === 'success') {
                setCategoriesList(res.data.data || []);
            }
        } catch (error) {
            toast.error('Failed to fetch categories');
        } finally {
            setCategoriesLoading(false);
        }
    };

    const handleCategorySubmit = async () => {
        if (!categoryForm.name.trim()) {
            toast.error('Category name is required');
            return;
        }

        setCategorySubmitting(true);
        try {
            if (categoryForm.editingId) {
                // Update category
                const res = await api.put(`/product/category/${categoryForm.editingId}`, { category: categoryForm.name });
                if (res.data.status === 'success') {
                    toast.success('Category updated successfully');
                    setCategoryForm({ name: '', editingId: null });
                    await fetchCategoriesList();
                }
            } else {
                // Create category
                const res = await api.post('/product/add-category', { category: categoryForm.name });
                if (res.data.status === 'success') {
                    toast.success('Category created successfully');
                    setCategoryForm({ name: '', editingId: null });
                    await fetchCategoriesList();
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save category');
        } finally {
            setCategorySubmitting(false);
        }
    };

    
    const openCategoryModal = async (category = null) => {
        if (category) {
            setCategoryForm({ name: category.category, editingId: category.id });
        } else {
            setCategoryForm({ name: '', editingId: null });
        }
        await fetchCategoriesList();
        setCategoryModal(true);
    };

    // Description modal functions
    const openDescriptionModal = (product) => {
        setSelectedProductForDescription(product);
        setDescriptionForm({
            description: product.description || '',
            images: [],
            photo: null,
            descriptionType: 'basic'
        });
        setDescriptionModal(true);
    };

    const handleDescriptionSubmit = async () => {
        if (!selectedProductForDescription) return;

        setDescriptionSubmitting(true);
        try {
            const submitData = new FormData();
            submitData.append('description', descriptionForm.description);
            
            // Add product photo if selected
            if (descriptionForm.photo) {
                submitData.append('photo', descriptionForm.photo);
            }
            
            // Add description images
            descriptionForm.images.forEach((image) => {
                submitData.append('photo', image);
            });

            const res = await api.post(`/product/description/${selectedProductForDescription.id}`, submitData);
            if (res.data.status === 'success') {
                toast.success('Product description updated successfully');
                setDescriptionModal(false);
                setSelectedProductForDescription(null);
                // Refresh products list
                const productsRes = await api.get('/product/all-products');
                if (productsRes.data.status === 'success') {
                    setProducts(productsRes.data.data || []);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update description');
        } finally {
            setDescriptionSubmitting(false);
        }
    };

    const handleDescriptionPhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setDescriptionForm(prev => ({
                ...prev,
                photo: file
            }));
        }
    };

    const handleDescriptionImagesChange = (e) => {
        const files = Array.from(e.target.files);
        setDescriptionForm(prev => ({
            ...prev,
            images: [...prev.images, ...files]
        }));
    };

    const removeDescriptionImage = (index) => {
        setDescriptionForm(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

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
                    <div className="flex gap-3">
                        <button onClick={() => openCategoryModal()} className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 transition-all">
                            <MdCategory size={18} /> Manage Categories
                        </button>
                        <button onClick={() => setAddProductModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all">
                            <MdAdd size={18} /> Add Product
                        </button>
                    </div>
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
                                                    {product.price ? `₦${Number(product.price).toLocaleString()}` : '—'}
                                                </p>
                                                {product.newPrice && (
                                                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                                        Sale: ₦{Number(product.newPrice).toLocaleString()}
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
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={() => setViewProduct(product)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 border border-gray-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-900/40 rounded-lg transition-all"
                                                    >
                                                        <MdVisibility size={14} /> View
                                                    </button>
                                                    <button
                                                        onClick={() => openDescriptionModal(product)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 border border-gray-200 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-900/40 rounded-lg transition-all"
                                                    >
                                                        <MdInventory2 size={14} /> Details
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(product)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 border border-gray-200 dark:border-slate-700 hover:border-sky-200 dark:hover:border-sky-900/40 rounded-lg transition-all"
                                                    >
                                                        <MdEdit size={14} /> Edit
                                                    </button>
                                                </div>
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
                                        <p className="font-bold text-gray-900 dark:text-white">{viewProduct.price ? `₦${Number(viewProduct.price).toLocaleString()}` : '—'}</p>
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

            {/* Add Product Modal */}
            <AnimatePresence>
                {addProductModal && (
                    <AddEditProductModal
                        isOpen={addProductModal}
                        onClose={() => setAddProductModal(false)}
                        onSubmit={handleAddProduct}
                        submitting={submitting}
                        mode="add"
                    />
                )}
            </AnimatePresence>

            {/* Edit Product Modal */}
            <AnimatePresence>
                {editProductModal && selectedProduct && (
                    <AddEditProductModal
                        isOpen={editProductModal}
                        onClose={() => {
                            setEditProductModal(false);
                            setSelectedProduct(null);
                        }}
                        onSubmit={handleEditProduct}
                        submitting={submitting}
                        mode="edit"
                        product={selectedProduct}
                    />
                )}
            </AnimatePresence>

            {/* Category Management Modal */}
            <AnimatePresence>
                {categoryModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setCategoryModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 border border-gray-100 dark:border-slate-800/70"
                        >
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                        Manage Categories
                                    </h2>
                                    <button
                                        onClick={() => setCategoryModal(false)}
                                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
                                    >
                                        <MdClose size={20} />
                                    </button>
                                </div>

                                {/* Add/Edit Form */}
                                <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
                                        {categoryForm.editingId ? 'Edit Category' : 'Add New Category'}
                                    </h3>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={categoryForm.name}
                                            onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                                            className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all"
                                            placeholder="Enter category name"
                                        />
                                        <button
                                            onClick={handleCategorySubmit}
                                            disabled={categorySubmitting || !categoryForm.name.trim()}
                                            className="px-6 py-2.5 bg-sky-600 text-white rounded-xl font-semibold text-sm hover:bg-sky-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {categorySubmitting ? 'Processing...' : categoryForm.editingId ? 'Update' : 'Add'}
                                        </button>
                                        {categoryForm.editingId && (
                                            <button
                                                onClick={() => setCategoryForm({ name: '', editingId: null })}
                                                className="px-6 py-2.5 bg-gray-500 text-white rounded-xl font-semibold text-sm hover:bg-gray-600 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Categories List */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
                                        Existing Categories
                                    </h3>
                                    {categoriesLoading ? (
                                        <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                                            Loading categories...
                                        </div>
                                    ) : categoriesList.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                                            No categories found. Add your first category above.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {categoriesList.map((category) => (
                                                <div
                                                    key={category.id}
                                                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/20 rounded-lg flex items-center justify-center">
                                                            <MdCategory size={16} className="text-sky-600 dark:text-sky-400" />
                                                        </div>
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            {category.category}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setCategoryForm({ name: category.category, editingId: category.id })}
                                                            className="p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-all"
                                                            title="Edit category"
                                                        >
                                                            <MdEdit size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Product Description & Images Modal */}
            <AnimatePresence>
                {descriptionModal && selectedProductForDescription && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setDescriptionModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 border border-gray-100 dark:border-slate-800/70"
                        >
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                            Product Details & Images
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                            {selectedProductForDescription.name}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setDescriptionModal(false)}
                                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
                                    >
                                        <MdClose size={20} />
                                    </button>
                                </div>

                                {/* Form */}
                                <div className="space-y-5">
                                    {/* Description Type Toggle */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
                                            Description Type
                                        </label>
                                        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => setDescriptionForm(prev => ({ ...prev, descriptionType: 'basic' }))}
                                                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                                                    descriptionForm.descriptionType === 'basic'
                                                        ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                                                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                                                }`}
                                            >
                                                Basic
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDescriptionForm(prev => ({ ...prev, descriptionType: 'complex' }))}
                                                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                                                    descriptionForm.descriptionType === 'complex'
                                                        ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                                                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                                                }`}
                                            >
                                                Complex
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                                            {descriptionForm.descriptionType === 'basic' 
                                                ? 'Simple text description for quick product overview' 
                                                : 'Detailed description with multiple images for comprehensive product information'}
                                        </p>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                            {descriptionForm.descriptionType === 'basic' ? 'Basic Description' : 'Complex Description'}
                                        </label>
                                        <textarea
                                            value={descriptionForm.description}
                                            onChange={(e) => setDescriptionForm(prev => ({ ...prev, description: e.target.value }))}
                                            rows={descriptionForm.descriptionType === 'basic' ? 3 : 6}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all resize-none"
                                            placeholder={descriptionForm.descriptionType === 'basic' 
                                                ? 'Enter a brief product description...' 
                                                : 'Enter a detailed product description with specifications, features, benefits...'}
                                        />
                                    </div>

                                    {/* Product Photo */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                            Product Photo
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleDescriptionPhotoChange}
                                                    className="hidden"
                                                />
                                                <MdAdd size={16} />
                                                Choose Photo
                                            </label>
                                            {descriptionForm.photo && (
                                                <span className="text-sm text-gray-600 dark:text-slate-400">
                                                    {descriptionForm.photo.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Additional Images - Only for Complex Descriptions */}
                                    {descriptionForm.descriptionType === 'complex' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                                Additional Images
                                            </label>
                                            <div className="space-y-3">
                                                <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={handleDescriptionImagesChange}
                                                        className="hidden"
                                                    />
                                                    <MdAdd size={16} />
                                                    Add Images
                                                </label>
                                                
                                                {descriptionForm.images.length > 0 && (
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                        {descriptionForm.images.map((image, index) => (
                                                            <div key={index} className="relative group">
                                                                <div className="aspect-square bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                                                                    <img
                                                                        src={URL.createObjectURL(image)}
                                                                        alt={`Description ${index + 1}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeDescriptionImage(index)}
                                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <MdClose size={12} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                                        <button
                                            onClick={() => setDescriptionModal(false)}
                                            disabled={descriptionSubmitting}
                                            className="flex-1 py-3 font-semibold text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDescriptionSubmit}
                                            disabled={descriptionSubmitting}
                                            className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-semibold text-sm hover:bg-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {descriptionSubmitting ? 'Processing...' : 'Update Details'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add/Edit Product Modal */}
            <AddEditProductModal
                isOpen={addProductModal || editProductModal}
                onClose={() => {
                    setAddProductModal(false);
                    setEditProductModal(false);
                    setSelectedProduct(null);
                }}
                onSubmit={addProductModal ? handleAddProduct : handleEditProduct}
                submitting={submitting}
                mode={addProductModal ? 'add' : 'edit'}
                product={selectedProduct}
            />

            {/* Category Management Modal */}
            <AnimatePresence>
                {categoryModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setCategoryModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 border border-gray-100 dark:border-slate-800/70"
                        >
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                        Manage Categories
                                    </h2>
                                    <button
                                        onClick={() => setCategoryModal(false)}
                                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
                                    >
                                        <MdClose size={20} />
                                    </button>
                                </div>

                                {/* Add/Edit Form */}
                                <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
                                        {categoryForm.editingId ? 'Edit Category' : 'Add New Category'}
                                    </h3>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={categoryForm.name}
                                            onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                                            className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all"
                                            placeholder="Enter category name"
                                        />
                                        <button
                                            onClick={handleCategorySubmit}
                                            disabled={categorySubmitting || !categoryForm.name.trim()}
                                            className="px-6 py-2.5 bg-sky-600 text-white rounded-xl font-semibold text-sm hover:bg-sky-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {categorySubmitting ? 'Processing...' : categoryForm.editingId ? 'Update' : 'Add'}
                                        </button>
                                        {categoryForm.editingId && (
                                            <button
                                                onClick={() => setCategoryForm({ name: '', editingId: null })}
                                                className="px-6 py-2.5 bg-gray-500 text-white rounded-xl font-semibold text-sm hover:bg-gray-600 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Categories List */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
                                        Existing Categories
                                    </h3>
                                    {categoriesLoading ? (
                                        <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                                            Loading categories...
                                        </div>
                                    ) : categoriesList.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                                            No categories found. Add your first category above.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {categoriesList.map((category) => (
                                                <div
                                                    key={category.id}
                                                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/20 rounded-lg flex items-center justify-center">
                                                            <MdCategory size={16} className="text-sky-600 dark:text-sky-400" />
                                                        </div>
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            {category.category}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setCategoryForm({ name: category.category, editingId: category.id })}
                                                            className="p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-all"
                                                            title="Edit category"
                                                        >
                                                            <MdEdit size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Product Description & Images Modal */}
            <AnimatePresence>
                {descriptionModal && selectedProductForDescription && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setDescriptionModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 border border-gray-100 dark:border-slate-800/70"
                        >
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                            Product Details
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                            {selectedProductForDescription.name}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setDescriptionModal(false)}
                                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
                                    >
                                        <MdClose size={20} />
                                    </button>
                                </div>

                                {/* Form */}
                                <div className="space-y-5">
                                    {/* Description Type Toggle */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
                                            Description Type
                                        </label>
                                        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => setDescriptionForm(prev => ({ ...prev, descriptionType: 'basic' }))}
                                                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                                                    descriptionForm.descriptionType === 'basic'
                                                        ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                                                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                                                }`}
                                            >
                                                Basic
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDescriptionForm(prev => ({ ...prev, descriptionType: 'complex' }))}
                                                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                                                    descriptionForm.descriptionType === 'complex'
                                                        ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                                                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                                                }`}
                                            >
                                                Complex
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                                            {descriptionForm.descriptionType === 'basic' 
                                                ? 'Simple text description for quick product overview' 
                                                : 'Detailed description with multiple images for comprehensive product information'}
                                        </p>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                            {descriptionForm.descriptionType === 'basic' ? 'Basic Description' : 'Complex Description'}
                                        </label>
                                        <textarea
                                            value={descriptionForm.description}
                                            onChange={(e) => setDescriptionForm(prev => ({ ...prev, description: e.target.value }))}
                                            rows={descriptionForm.descriptionType === 'basic' ? 3 : 6}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all resize-none"
                                            placeholder={descriptionForm.descriptionType === 'basic' 
                                                ? 'Enter a brief product description...' 
                                                : 'Enter a detailed product description with specifications, features, benefits...'}
                                        />
                                    </div>

                                    {/* Product Photo */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                            Product Photo
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleDescriptionPhotoChange}
                                                    className="hidden"
                                                />
                                                <MdAdd size={16} />
                                                Choose Photo
                                            </label>
                                            {descriptionForm.photo && (
                                                <span className="text-sm text-gray-600 dark:text-slate-400">
                                                    {descriptionForm.photo.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Additional Images - Only for Complex Descriptions */}
                                    {descriptionForm.descriptionType === 'complex' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                                Additional Images
                                            </label>
                                            <div className="space-y-3">
                                                <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={handleDescriptionImagesChange}
                                                        className="hidden"
                                                    />
                                                    <MdAdd size={16} />
                                                    Add Images
                                                </label>
                                                
                                                {descriptionForm.images.length > 0 && (
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                        {descriptionForm.images.map((image, index) => (
                                                            <div key={index} className="relative group">
                                                                <div className="aspect-square bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                                                                    <img
                                                                        src={URL.createObjectURL(image)}
                                                                        alt={`Description ${index + 1}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeDescriptionImage(index)}
                                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <MdClose size={12} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                                        <button
                                            onClick={() => setDescriptionModal(false)}
                                            disabled={descriptionSubmitting}
                                            className="flex-1 py-3 font-semibold text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDescriptionSubmit}
                                            disabled={descriptionSubmitting}
                                            className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-semibold text-sm hover:bg-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {descriptionSubmitting ? 'Processing...' : 'Update Details'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

// Add/Edit Product Modal Component
const AddEditProductModal = ({ isOpen, onClose, onSubmit, submitting, mode, product }) => {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        newPrice: '',
        quantity: '',
        categoryId: '',
        draft: false,
        status: 'pending'
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
                if (mode === 'edit' && product) {
                setFormData({
                    name: product.name || '',
                    price: product.price || '',
                    newPrice: product.newPrice || '',
                    quantity: product.quantity || '',
                    categoryId: product.categoryId || '',
                    draft: product.draft !== undefined ? product.draft : false,
                    status: product.approved || 'pending'
                });
            }
        }
    }, [isOpen, mode, product]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/product/categories');
            if (res.data.status === 'success') {
                setCategories(res.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const submitData = new FormData();
        submitData.append('name', formData.name);
        submitData.append('price', formData.price);
        if (formData.newPrice) submitData.append('newPrice', formData.newPrice);
        submitData.append('quantity', formData.quantity);
        submitData.append('categoryId', formData.categoryId);
        submitData.append('draft', formData.draft);
        
        // Add status for edit mode
        if (mode === 'edit') {
            submitData.append('approved', formData.status);
        }
        
        onSubmit(submitData);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 border border-gray-100 dark:border-slate-800/70"
            >
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                            {mode === 'add' ? 'Add New Product' : 'Edit Product'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
                        >
                            <MdClose size={20} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-5">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                    Product Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                    placeholder="Enter product name"
                                    required
                                />
                            </div>

                            {/* Price and New Price */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                        Price *
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                        New Price
                                    </label>
                                    <input
                                        type="number"
                                        name="newPrice"
                                        value={formData.newPrice}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            {/* Quantity and Category */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                        Quantity *
                                    </label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="0"
                                        min="0"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                        Category *
                                    </label>
                                    <select
                                        name="categoryId"
                                        value={formData.categoryId}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                        required
                                    >
                                        <option value="">Select category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.category}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Status - Only for Edit Mode */}
                            {mode === 'edit' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                        <option value="review">Under Review</option>
                                    </select>
                                </div>
                            )}

                            {/* Draft */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name="draft"
                                    id="draft"
                                    checked={formData.draft}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-emerald-600 border-gray-300 dark:border-slate-600 rounded focus:ring-emerald-500 dark:focus:ring-emerald-400 dark:ring-offset-slate-900"
                                />
                                <label htmlFor="draft" className="text-sm font-medium text-gray-700 dark:text-slate-300">
                                    Save as draft (not published)
                                </label>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="flex-1 py-3 font-semibold text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Processing...' : mode === 'add' ? 'Add Product' : 'Update Product'}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default ProductsPage;
