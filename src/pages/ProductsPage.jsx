import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAdd, MdClose, MdEdit, MdVisibility, MdInventory2, MdCategory, MdCheckCircle, MdPending, MdRemoveCircle, MdSearch, MdFilterList, MdStore, MdChevronLeft, MdChevronRight } from 'react-icons/md';
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
    const [categorySearchTerm, setCategorySearchTerm] = useState('');
    const [categoryPage, setCategoryPage] = useState(1);
    const categoryPageSize = 8;
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
    const categorySearchDebounceRef = useRef(null);

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

    // Category filtering and pagination
    const filteredCategories = useMemo(() => {
        let list = categoriesList;
        if (categorySearchTerm) {
            list = list.filter(cat => cat.category?.toLowerCase().includes(categorySearchTerm.toLowerCase()));
        }
        return list;
    }, [categoriesList, categorySearchTerm]);

    const totalCategoryPages = Math.ceil(filteredCategories.length / categoryPageSize);
    const paginatedCategories = useMemo(() => 
        filteredCategories.slice((categoryPage - 1) * categoryPageSize, categoryPage * categoryPageSize),
    [filteredCategories, categoryPage]);

    useEffect(() => { setCategoryPage(1); }, [categorySearchTerm]);

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
        setCategorySearchTerm('');
        setCategoryPage(1);
        await fetchCategoriesList();
        setCategoryModal(true);
    };

    const closeCategoryModal = () => {
        setCategoryModal(false);
        setCategoryForm({ name: '', editingId: null });
        setCategorySearchTerm('');
        setCategoryPage(1);
    };

    // Description modal functions
    const openDescriptionModal = (product) => {
        setSelectedProductForDescription(product);
        // Load existing description if available
        const existingDescription = product.descriptions?.[0];
        setDescriptionForm({
            description: existingDescription?.description || '',
            images: [],
            retainedImages: existingDescription?.photo || [],
            photo: null,
            descriptionType: existingDescription?.photo?.length > 0 ? 'complex' : 'basic'
        });
        setDescriptionModal(true);
    };

    const closeDescriptionModal = () => {
        setDescriptionModal(false);
        setSelectedProductForDescription(null);
        setDescriptionForm({
            description: '',
            images: [],
            retainedImages: [],
            photo: null,
            descriptionType: 'basic'
        });
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
            
            // Add all images (photo + additional images) as photo array
            const allImages = [];
            if (descriptionForm.photo) {
                allImages.push(descriptionForm.photo);
            }
            allImages.push(...descriptionForm.images);
            
            allImages.forEach((image) => {
                submitData.append('photo', image);
            });
            
            // Append retained photos
            submitData.append('retainedImages', JSON.stringify(descriptionForm.retainedImages));

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

    const removeRetainedImage = (index) => {
        setDescriptionForm(prev => ({
            ...prev,
            retainedImages: prev.retainedImages.filter((_, i) => i !== index)
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
        <>
            <DashboardLayout activeNav="products">
            <div className="p-4 sm:p-6 lg:p-10 page-enter max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Products</h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Manage farm inventory and product listings</p>
                    </div>
                    <div className="flex gap-2 sm:gap-3 ml-auto">
                        <button onClick={() => openCategoryModal()} className="flex items-center gap-2 px-2 sm:px-4 py-2 bg-sky-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-sky-700 transition-all whitespace-nowrap">
                            <MdCategory className="size-3.5 sm:size-5" /> 
                            <span className="hidden sm:inline">Category</span>
                            <span className="sm:hidden">Cat</span>
                        </button>
                        
                        <button onClick={() => setAddProductModal(true)} className="flex items-center gap-2 px-2 sm:px-4 py-2 lg:py-2.5 bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-emerald-700 transition-all whitespace-nowrap">
                            <MdAdd className="size-4 sm:size-5" /> 
                            <span className="hidden sm:inline">Add Product</span>
                            <span className="sm:hidden">Add</span>
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    {statCards.map((s, i) => (
                        <motion.div key={s.label}
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07, duration: 0.35, ease: 'easeOut' }}
                            className={`stat-accent ${s.accent} stat-card bg-white dark:bg-slate-900 px-3 sm:px-4 py-3 sm:py-4 rounded-xl border border-gray-100 dark:border-slate-800/70 relative`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className="stat-label">{s.label}</span>
                                <div className="stat-icon" style={{ opacity: 0.8 }}>{s.icon}</div>
                            </div>
                            <span className="stat-value">{s.value}</span>
                        </motion.div>
                    ))}
                </div>

                {/* Controls */}
                <div className="flex flex-col lg:flex-row gap-3 mb-5">
                    <div className="flex-1 flex gap-2">
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
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800/70 overflow-hidden">
                    <div className="table-wrapper">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/60 dark:bg-slate-800/30 border-b border-gray-100 dark:border-slate-800/70">
                                    <th className="px-2 sm:px-4 py-2 text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Product</th>
                                    <th className="px-2 sm:px-4 py-2 text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest hidden sm:table-cell">Category</th>
                                    <th className="px-2 sm:px-4 py-2 text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Price</th>
                                    <th className="px-2 sm:px-4 py-2 text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest hidden sm:table-cell">Stock</th>
                                    <th className="px-2 sm:px-4 py-2 text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                                    <th className="px-2 sm:px-4 py-2 text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-3 sm:px-6 py-3"><div className="flex items-center gap-2 sm:gap-3"><div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gray-200 dark:bg-slate-700 animate-pulse shrink-0" /><div className="min-w-0"><div className="h-3 w-20 sm:w-32 bg-gray-200 dark:bg-slate-700 rounded animate-pulse mb-1" /><div className="h-2 w-16 sm:w-20 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" /></div></div></td>
                                            <td className="px-3 sm:px-6 py-3"><div className="h-3 w-16 sm:w-24 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                                            <td className="px-3 sm:px-6 py-3"><div className="h-3 w-14 sm:w-20 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                                            <td className="px-3 sm:px-6 py-3"><div className="h-3 w-8 sm:w-12 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                                            <td className="px-3 sm:px-6 py-3"><div className="h-4 w-12 sm:w-16 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                                            <td className="px-3 sm:px-6 py-3 text-right"><div className="h-6 w-12 sm:w-16 bg-gray-200 dark:bg-slate-700 rounded-lg ml-auto animate-pulse" /></td>
                                        </tr>
                                    ))
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-2 sm:px-4 py-8 sm:py-12 text-center">
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
                                                <td className="px-2 sm:px-4 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gray-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                                                            {product.photo
                                                                ? <img src={product.photo} alt={product.name} className="w-full h-full object-cover" />
                                                                : <MdInventory2 className="text-gray-300 dark:text-slate-600 text-xs sm:text-sm" />
                                                            }
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-gray-900 dark:text-white text-xs truncate">{product.name || '—'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Category */}
                                                <td className="px-2 sm:px-4 py-2 hidden sm:table-cell">
                                                    <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-300">
                                                        <MdCategory className="text-gray-400 text-xs" />
                                                        <span className="truncate max-w-[60px]">{product.category?.category || '—'}</span>
                                                    </span>
                                                </td>
                                                {/* Price */}
                                                <td className="px-2 sm:px-4 py-2">
                                                    <p className="font-semibold text-gray-900 dark:text-white text-xs">
                                                        {product.price ? `₦${Number(product.price).toLocaleString()}` : '—'}
                                                    </p>
                                                </td>
                                                {/* Stock */}
                                                <td className="px-2 sm:px-4 py-2 hidden sm:table-cell">
                                                    <span className={`font-semibold text-xs ${product.quantity === 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                                        {product.quantity ?? '—'}
                                                    </span>
                                                </td>
                                                {/* Status */}
                                                <td className="px-2 sm:px-4 py-2">
                                                    <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md text-[8px] sm:text-[9px] uppercase font-bold tracking-wider ${STATUS_COLORS[statusKey] || STATUS_COLORS.pending}`}>
                                                        {statusKey}
                                                    </span>
                                                </td>
                                                {/* Actions */}
                                                <td className="px-2 sm:px-4 py-2 text-right">
                                                    <div className="flex justify-end gap-0.5">
                                                        <button
                                                            onClick={() => setViewProduct(product)}
                                                            className="p-1 text-gray-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/15 rounded transition-all"
                                                            title="View"
                                                        >
                                                            <MdVisibility size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => openEditModal(product)}
                                                            className="p-1 text-gray-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/15 rounded transition-all"
                                                            title="Edit"
                                                        >
                                                            <MdEdit size={12} />
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
                        <div className="px-2 sm:px-4 py-2 sm:py-3 border-t border-gray-100 dark:border-slate-800/70 flex flex-col sm:flex-row items-center justify-between gap-2">
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
        </DashboardLayout>

            {/* Product Detail Modal */}
            <AnimatePresence>
                {viewProduct && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewProduct(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 border border-gray-100 dark:border-slate-800/70 max-h-[90vh] overflow-y-auto hide-scrollbar">

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
                                        <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed max-h-32 overflow-y-auto hide-scrollbar pr-2 custom-scrollbar">{viewProduct.description}</p>
                                    </div>
                                )}
                                
                                {viewProduct.descriptions && viewProduct.descriptions[0]?.photo?.length > 0 && (
                                    <div className="mt-5">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Gallery</p>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto hide-scrollbar pr-1">
                                            {viewProduct.descriptions[0].photo.map((imgUrl, i) => (
                                                <div key={i} className="aspect-square bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
                                                    <img src={imgUrl} alt={`Gallery ${i+1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                                                </div>
                                            ))}
                                        </div>
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
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto hide-scrollbar relative z-10 border border-gray-100 dark:border-slate-800/70"
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
                                            className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                            placeholder="Enter category name"
                                        />
                                        <button
                                            onClick={handleCategorySubmit}
                                            disabled={categorySubmitting || !categoryForm.name.trim()}
                                            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {categorySubmitting ? 'Processing...' : categoryForm.editingId ? 'Update' : 'Add'}
                                        </button>
                                        {categoryForm.editingId && (
                                            <button
                                                onClick={() => setCategoryForm({ name: '', editingId: null })}
                                                className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Categories List */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                                            Existing Categories
                                        </h3>
                                        <span className="text-xs text-gray-500 dark:text-slate-400">
                                            {filteredCategories.length} total
                                        </span>
                                    </div>
                                    
                                    {/* Search */}
                                    <div className="relative mb-4">
                                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search categories..."
                                            defaultValue={categorySearchTerm}
                                            onChange={(e) => {
                                                clearTimeout(categorySearchDebounceRef.current);
                                                categorySearchDebounceRef.current = setTimeout(() => {
                                                    setCategorySearchTerm(e.target.value);
                                                    setCategoryPage(1);
                                                }, 300);
                                            }}
                                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                        />
                                    </div>

                                    {categoriesLoading ? (
                                        <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                                            Loading categories...
                                        </div>
                                    ) : filteredCategories.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                                            {categorySearchTerm ? 'No categories match your search.' : 'No categories found. Add your first category above.'}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-2 max-h-64 overflow-y-auto hide-scrollbar">
                                                {paginatedCategories.map((category) => (
                                                <div
                                                    key={category.id}
                                                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                                                            <MdCategory size={16} className="text-emerald-600 dark:text-emerald-400" />
                                                        </div>
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            {category.category}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setCategoryForm({ name: category.category, editingId: category.id })}
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                                                            title="Edit category"
                                                        >
                                                            <MdEdit size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            </div>
                                            
                                            {/* Pagination */}
                                            {totalCategoryPages > 1 && (
                                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                                                    <button
                                                        onClick={() => setCategoryPage(p => Math.max(1, p - 1))}
                                                        disabled={categoryPage === 1}
                                                        className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                    >
                                                        Previous
                                                    </button>
                                                    <span className="text-sm text-gray-500 dark:text-slate-400">
                                                        Page {categoryPage} of {totalCategoryPages}
                                                    </span>
                                                    <button
                                                        onClick={() => setCategoryPage(p => Math.min(totalCategoryPages, p + 1))}
                                                        disabled={categoryPage === totalCategoryPages}
                                                        className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                            )}
                                        </>
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
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto hide-scrollbar relative z-10 border border-gray-100 dark:border-slate-800/70"
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
                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                            Description Details
                                        </label>
                                        <textarea
                                            value={descriptionForm.description}
                                            onChange={(e) => setDescriptionForm(prev => ({ ...prev, description: e.target.value }))}
                                            rows={6}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all resize-none"
                                            placeholder="Enter a detailed product description with specifications, features, benefits..."
                                        />
                                    </div>


                                    {/* Additional Images */}
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
                                            
                                            {(descriptionForm.images.length > 0 || descriptionForm.retainedImages.length > 0) && (
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                                                    {descriptionForm.retainedImages.map((imgUrl, index) => (
                                                        <div key={`retained-${index}`} className="relative group">
                                                            <div className="aspect-square bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                                                                <img
                                                                    src={imgUrl}
                                                                    alt={`Saved ${index + 1}`}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeRetainedImage(index)}
                                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <MdClose size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {descriptionForm.images.map((image, index) => (
                                                        <div key={`new-${index}`} className="relative group">
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

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                                        <button
                                            onClick={() => setDescriptionModal(false)}
                                            disabled={descriptionSubmitting}
                                            className="flex-1 py-3 font-semibold text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDescriptionSubmit}
                                            disabled={descriptionSubmitting}
                                            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
        </>
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
        coverDescription: '',
        draft: false,
        status: 'pending'
    });
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
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
                    coverDescription: product.description || '',
                    draft: product.draft !== undefined ? product.draft : false,
                    status: product.approved || 'pending'
                });
                // Set existing image preview for edit mode
                setImagePreview(product.photo || null);
            } else {
                // Reset form for add mode
                setFormData({
                    name: '',
                    price: '',
                    newPrice: '',
                    quantity: '',
                    categoryId: '',
                    coverDescription: '',
                    draft: false,
                    status: 'pending'
                });
                setSelectedImage(null);
                setImagePreview(null);
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
        submitData.append('coverDescription', formData.coverDescription);
        submitData.append('draft', formData.draft);

        // Add image if selected
        if (selectedImage) {
            submitData.append('photo', selectedImage);
        }

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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(mode === 'edit' ? (product?.photo || null) : null);
    };

    const handleUpdateProductImage = async () => {
        if (!selectedImage || !product?.id) return;
        setSubmitting(true);
        try {
            const imageData = new FormData();
            imageData.append('photo', selectedImage);
            const res = await api.patch(`/product/${product.id}`, imageData);
            if (res.data.status === 'success') {
                toast.success('Product image updated successfully');
                const updatedProduct = res.data.data.product || res.data.data;
                setSelectedImage(null);
                setImagePreview(updatedProduct.photo || null);
                setSelectedProduct(updatedProduct);
                const productsRes = await api.get('/product/all-products');
                if (productsRes.data.status === 'success') {
                    setProducts(productsRes.data.data || []);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update product image');
        } finally {
            setSubmitting(false);
        }
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
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto hide-scrollbar relative z-10 border border-gray-100 dark:border-slate-800/70"
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
                                    disabled={submitting}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all disabled:bg-gray-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
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
                                        disabled={submitting}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all disabled:bg-gray-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
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
                                        disabled={submitting}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all disabled:bg-gray-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
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
                                        disabled={submitting}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all disabled:bg-gray-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
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
                                        disabled={submitting}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all disabled:bg-gray-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
                                        required
                                    >
                                        <option value="">Select category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.category}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Cover Description */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                    Cover Description
                                </label>
                                <textarea
                                    name="coverDescription"
                                    value={formData.coverDescription}
                                    onChange={handleChange}
                                    disabled={submitting}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all resize-none disabled:bg-gray-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
                                    placeholder="Enter a description for the product cover image..."
                                />
                            </div>

                            {/* Product Image Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                    Product Image
                                </label>
                                <div className="space-y-3">
                                    {/* Image Preview */}
                                    {imagePreview && (
                                        <div className="relative inline-block">
                                            <img
                                                src={imagePreview}
                                                alt="Product preview"
                                                className="w-32 h-32 object-cover rounded-xl border border-gray-200 dark:border-slate-700"
                                            />
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                                disabled={submitting}
                                            >
                                                <MdClose size={14} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Image Upload */}
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                                                <MdAdd size={16} />
                                                {imagePreview ? 'Change Image' : 'Choose Image'}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    disabled={submitting}
                                                    className="hidden"
                                                />
                                            </label>
                                            {selectedImage && (
                                                <span className="text-sm text-gray-600 dark:text-slate-400">
                                                    {selectedImage.name}
                                                </span>
                                            )}
                                        </div>

                                    </div>
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
                                        disabled={submitting}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all disabled:bg-gray-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                        <option value="review">Under Review</option>
                                    </select>
                                </div>
                            )}

                            {/* Draft - Only for Edit Mode */}
                            {mode === 'edit' && (
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        name="draft"
                                        id="draft"
                                        checked={formData.draft}
                                        onChange={handleChange}
                                        disabled={submitting}
                                        className="w-4 h-4 text-emerald-600 border-gray-300 dark:border-slate-600 rounded focus:ring-emerald-500 dark:focus:ring-emerald-400 dark:ring-offset-slate-900 disabled:opacity-50"
                                    />
                                    <label htmlFor="draft" className="text-sm font-medium text-gray-700 dark:text-slate-300">
                                        Save as draft (not published)
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="flex-1 py-3 font-semibold text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all disabled:opacity-50"
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
