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
    const categoryPageSize = 4;
    const [descriptionModal, setDescriptionModal] = useState(false);
    const [selectedProductForDescription, setSelectedProductForDescription] = useState(null);
    const [descriptionForm, setDescriptionForm] = useState({
        description: '',
        images: [],
        retainedImages: [] // URLs of existing images to keep
    });
    const [descriptionSubmitting, setDescriptionSubmitting] = useState(false);
    const [existingDescriptions, setExistingDescriptions] = useState([]);
    const [editingDescriptionId, setEditingDescriptionId] = useState(null);
    const [pageSize, setPageSize] = useState(10);
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
            console.error('Failed to fetch categories:', error);
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


    // Description modal functions
    const openDescriptionModal = (product) => {
        setSelectedProductForDescription(product);
        setExistingDescriptions(product.descriptions || []);
        setEditingDescriptionId(null);
        setDescriptionForm({
            description: '',
            images: [],
            retainedImages: []
        });
        setDescriptionModal(true);
    };


    const startEditDescription = (desc) => {
        setEditingDescriptionId(desc.id);
        setDescriptionForm({
            description: desc.description || '',
            images: [], // New files to upload
            retainedImages: desc.photo || [] // Existing images to keep
        });
    };

    const cancelEditDescription = () => {
        setEditingDescriptionId(null);
        setDescriptionForm({
            description: '',
            images: [],
            retainedImages: []
        });
    };

    const removeRetainedImage = (imageUrl) => {
        setDescriptionForm(prev => ({
            ...prev,
            retainedImages: prev.retainedImages.filter(url => url !== imageUrl)
        }));
    };

    const handleDescriptionSubmit = async () => {
        if (!selectedProductForDescription) return;

        setDescriptionSubmitting(true);
        try {
            const submitData = new FormData();
            submitData.append('description', descriptionForm.description);
            
            // Add retained images (existing images to keep)
            if (descriptionForm.retainedImages && descriptionForm.retainedImages.length > 0) {
                submitData.append('retainedImages', JSON.stringify(descriptionForm.retainedImages));
            } else {
                submitData.append('retainedImages', JSON.stringify([]));
            }
            
            // Add new description images
            descriptionForm.images.forEach((image) => {
                submitData.append('images', image);
            });

            let res;
            if (editingDescriptionId) {
                // Update existing description
                res = await api.put(`/product/description/${selectedProductForDescription.id}/${editingDescriptionId}`, submitData);
            } else {
                // Create new description
                res = await api.post(`/product/description/${selectedProductForDescription.id}`, submitData);
            }
            
            if (res.data.status === 'success') {
                toast.success(editingDescriptionId ? 'Description updated successfully' : 'Description added successfully');
                // Reset form and refresh
                setEditingDescriptionId(null);
                setDescriptionForm({
                    description: '',
                    images: [],
                    retainedImages: []
                });
                // Refresh products list
                const productsRes = await api.get('/product/all-products');
                if (productsRes.data.status === 'success') {
                    setProducts(productsRes.data.data || []);
                    // Update existing descriptions
                    const updatedProduct = productsRes.data.data.find(p => p.id === selectedProductForDescription.id);
                    if (updatedProduct) {
                        setExistingDescriptions(updatedProduct.descriptions || []);
                    }
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update description');
        } finally {
            setDescriptionSubmitting(false);
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
                        {user?.role === 'admin' && (
                            <button onClick={() => openCategoryModal()} className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 transition-all">
                                <MdCategory size={18} /> Manage Categories
                            </button>
                        )}
                        <button onClick={() => setAddProductModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all">
                            <MdAdd size={18} /> Add Product
                        </button>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
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
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <MdFilterList className="text-gray-400" />
                                <select 
                                    value={filterStatus} 
                                    onChange={e => setFilterStatus(e.target.value)}
                                    className="px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-300 outline-none focus:border-emerald-500 transition-all font-medium"
                                >
                                    <option value="all">All Status</option>
                                    <option value="approved">Approved</option>
                                    <option value="pending">Pending</option>
                                    <option value="review">Review</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">View</span>
                                <select 
                                    value={pageSize} 
                                    onChange={(e) => setPageSize(Number(e.target.value))}
                                    className="px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-300 outline-none focus:border-emerald-500 transition-all"
                                >
                                    <option value={10}>10 Items</option>
                                    <option value={20}>20 Items</option>
                                    <option value={50}>50 Items</option>
                                    <option value={100}>100 Items</option>
                                </select>
                            </div>
                        </div>
                    </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800/70 overflow-hidden w-[25rem] md:w-[55rem] lg:w-full">
                    <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                        <table className="w-full text-left" style={{ minWidth: '800px' }}>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            <td><div className="flex items-center gap-3"><div className="skeleton w-10 h-10 rounded-xl" /><div><div className="skeleton h-3.5 w-32 mb-2" /><div className="skeleton h-2.5 w-20" /></div></div></td>
                                            <td><div className="skeleton h-4 w-24 rounded-md" /></td>
                                            <td><div className="skeleton h-4 w-20 rounded-md" /></td>
                                            <td><div className="skeleton h-4 w-12 rounded-md" /></td>
                                            <td><div className="skeleton h-5 w-16 rounded-md" /></td>
                                            <td className="text-right"><div className="skeleton h-7 w-16 rounded-lg ml-auto" /></td>
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
                                    ) : paginated.map((product) => {
                                        const statusKey = (product.approved || 'pending').toLowerCase();
                                        return (
                                            <tr key={product.id}>
                                                {/* Product */}
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                                                            {product.photo
                                                                ? <img src={product.photo} alt={product.name} className="w-full h-full object-cover" />
                                                                : <MdInventory2 className="text-gray-300 dark:text-slate-600 text-lg" />
                                                            }
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{product.name || '—'}</p>
                                                                {product.descriptions && product.descriptions.length > 0 && (
                                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full" title="Has description" />
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-400 dark:text-slate-500 truncate">
                                                                {product.draft ? 'Draft' : 'Published'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Category */}
                                                <td>
                                                    <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-slate-300">
                                                        <MdCategory className="text-gray-400 text-xs" />
                                                        {product.category?.category || '—'}
                                                    </span>
                                                </td>
                                                {/* Price */}
                                                <td>
                                                    {product.newPrice ? (
                                                        <div className="flex flex-col gap-0.5">
                                                            <p className="text-[10px] text-gray-400 dark:text-slate-500 line-through">
                                                                ₦{Number(product.price).toLocaleString()}
                                                            </p>
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="font-bold text-emerald-600 dark:text-emerald-500 text-sm">
                                                                    ₦{Number(product.newPrice).toLocaleString()}
                                                                </p>
                                                                {Number(product.price) > Number(product.newPrice) && (
                                                                    <span className="text-[9px] font-bold text-white bg-red-500 px-1 py-0.5 rounded">
                                                                        -{Math.round(((product.price - product.newPrice) / product.price) * 100)}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                                            {product.price ? `₦${Number(product.price).toLocaleString()}` : '—'}
                                                        </p>
                                                    )}
                                                </td>
                                                {/* Stock */}
                                                <td>
                                                    <span className={`font-semibold text-sm ${product.quantity === 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                                        {product.quantity ?? '—'}
                                                    </span>
                                                </td>
                                                {/* Status */}
                                                <td>
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider ${STATUS_COLORS[statusKey] || STATUS_COLORS.pending}`}>
                                                        {statusKey}
                                                    </span>
                                                </td>
                                                {/* Actions */}
                                                <td className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <button
                                                            onClick={() => setViewProduct(product)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 border border-gray-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-900/40 rounded-lg transition-all"
                                                        >
                                                            <MdVisibility size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => openDescriptionModal(product)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 border border-gray-200 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-900/40 rounded-lg transition-all"
                                                        >
                                                            <MdInventory2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => openEditModal(product)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 border border-gray-200 dark:border-slate-700 hover:border-sky-200 dark:hover:border-sky-900/40 rounded-lg transition-all"
                                                        >
                                                            <MdEdit size={14} />
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
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800/70 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest hidden sm:block">
                                Showing <span className="text-gray-900 dark:text-white">{(currentPage - 1) * pageSize + 1}</span> to <span className="text-gray-900 dark:text-white">{Math.min(currentPage * pageSize, filtered.length)}</span> of <span className="text-gray-900 dark:text-white">{filtered.length}</span> products
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest sm:hidden">
                                <span className="text-gray-900 dark:text-white">{filtered.length} Total</span>
                            </p>

                            <div className="flex items-center gap-1.5 self-center sm:self-auto">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 text-gray-400 hover:text-emerald-600 disabled:opacity-30 transition-all font-bold"
                                >
                                    <MdChevronLeft size={20} />
                                </button>
                                <div className="flex gap-1">
                                    {getPageNumbers().map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`min-w-[32px] h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === page ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="p-1.5 text-gray-400 hover:text-emerald-600 disabled:opacity-30 transition-all font-bold"
                                >
                                    <MdChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Product Detail Modal */}
            <AnimatePresence>
                {viewProduct && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewProduct(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden relative z-10 border border-white/20 dark:border-slate-700/50 max-h-[90vh] flex flex-col md:flex-row">
                            
                            {/* Close Button - absolute positioning over the whole modal */}
                            <button onClick={() => setViewProduct(null)}
                                className="absolute top-4 right-4 z-20 p-2.5 bg-white/80 hover:bg-white text-gray-700 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-gray-300 rounded-2xl transition-all backdrop-blur-md shadow-sm border border-white/50 dark:border-slate-700">
                                <MdClose size={20} />
                            </button>

                            {/* Left Side: Product Image View */}
                            <div className="w-full md:w-2/5 md:min-w-[320px] relative bg-gray-50 dark:bg-slate-800/30 flex flex-col shrink-0 border-b md:border-b-0 md:border-r border-gray-100 dark:border-slate-800/70">
                                <div className="h-64 md:h-full w-full relative">
                                    {viewProduct.photo ? (
                                        <div className="w-full h-full relative group">
                                            <img src={viewProduct.photo} alt={viewProduct.name} className="w-full h-full object-cover" />
                                            {/* Gradient overlay for mobile only text visibility if needed */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent md:hidden" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 dark:text-slate-600">
                                            <MdInventory2 className="text-7xl mb-3 opacity-50" />
                                            <span className="text-sm font-medium">No Image Available</span>
                                        </div>
                                    )}
                                    
                                    {/* Mobile Status Badge inside image */}
                                    <div className="absolute bottom-4 left-4 md:hidden">
                                        <span className={`inline-flex px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${STATUS_COLORS[(viewProduct.approved || 'pending').toLowerCase()] || STATUS_COLORS.pending}`}>
                                            {viewProduct.approved || 'pending'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Product Details */}
                            <div className="flex flex-col flex-1 overflow-y-auto hide-scrollbar p-6 md:p-8 bg-white dark:bg-slate-900">
                                
                                {/* Header Info */}
                                <div className="mb-6 pr-12">
                                    <div className="flex flex-wrap items-center gap-2.5 mb-3">
                                        <span className={`hidden md:inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[(viewProduct.approved || 'pending').toLowerCase()] || STATUS_COLORS.pending}`}>
                                            {viewProduct.approved || 'pending'}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 px-2.5 py-1 rounded-lg">
                                            <MdCategory size={14} />
                                            {viewProduct.category?.category || 'Uncategorized'}
                                        </span>
                                        {viewProduct.draft && (
                                            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 px-2.5 py-1 rounded-lg">
                                                Draft
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                        {viewProduct.name}
                                    </h2>
                                </div>
                                
                                {/* Key Stats Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-gray-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-gray-100 dark:border-slate-800/70 relative overflow-hidden group">
                                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full blur-2xl group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/40 transition-colors" />
                                        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Price</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                            {viewProduct.price ? `₦${Number(viewProduct.price).toLocaleString()}` : '—'}
                                        </p>
                                        {viewProduct.newPrice && (
                                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-500 mt-1.5 flex items-center gap-1">
                                                SALE: ₦{Number(viewProduct.newPrice).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-gray-100 dark:border-slate-800/70 relative overflow-hidden group">
                                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-sky-100 dark:bg-sky-900/20 rounded-full blur-2xl group-hover:bg-sky-200 dark:group-hover:bg-sky-900/40 transition-colors" />
                                        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Inventory Stock</p>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className={`text-2xl font-bold ${viewProduct.quantity === 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                                                {viewProduct.quantity ?? '—'}
                                            </span>
                                            <span className="text-sm font-semibold text-gray-400 dark:text-slate-500">items</span>
                                        </div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mt-1.5">
                                            {viewProduct.quantity === 0 ? 'Currently out of stock' : 'Available to order'}
                                        </p>
                                    </div>
                                </div>

                                {/* Main Description */}
                                <div className="mb-8">
                                    <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <MdInventory2 className="text-emerald-500" /> Description
                                    </h3>
                                    {viewProduct.description ? (
                                        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-slate-400 leading-relaxed bg-gray-50/50 dark:bg-slate-800/20 p-5 rounded-2xl border border-gray-100 dark:border-slate-800/50">
                                            {viewProduct.description}
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50/50 dark:bg-slate-800/20 p-5 rounded-2xl border border-gray-100 dark:border-slate-800/50">
                                            <p className="text-sm text-gray-400 dark:text-slate-500 italic">No description provided for this product.</p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Additional Descriptions with Images */}
                                {viewProduct.descriptions && viewProduct.descriptions.length > 0 && (
                                    <div className="pt-6 border-t border-gray-100 dark:border-slate-800/70">
                                        <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <MdStore className="text-sky-500" /> Additional Information
                                        </h3>
                                        <div className="space-y-4">
                                            {viewProduct.descriptions.map((desc, index) => (
                                                <div key={desc.id || index} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700/60 overflow-hidden shadow-sm">
                                                    {desc.description && (
                                                        <div className="p-4 border-b border-gray-100 dark:border-slate-800/60">
                                                            <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{desc.description}</p>
                                                        </div>
                                                    )}
                                                    {desc.photo && desc.photo.length > 0 && (
                                                        <div className="p-4 bg-gray-50/80 dark:bg-slate-800/40">
                                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                                {desc.photo.map((imgUrl, imgIndex) => (
                                                                    <a key={imgIndex} href={imgUrl} target="_blank" rel="noopener noreferrer" className="block aspect-square bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors group">
                                                                        <img 
                                                                            src={imgUrl} 
                                                                            alt={`Detail ${imgIndex + 1}`}
                                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                                        />
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
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


            {/* Category Management Modal */}
            <AnimatePresence>
                {categoryModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto hide-scrollbar">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
                            onClick={() => setCategoryModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/20 dark:border-slate-800/50"
                        >
                            {/* Minimalist Professional Header */}
                            <div className="relative p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                                            <MdCategory className="text-emerald-600 dark:text-white text-3xl" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                                Categories
                                            </h2>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Inventory Management</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setCategoryModal(false)}
                                        className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl transition-all border border-slate-200 dark:border-slate-700 shadow-sm group"
                                    >
                                        <MdClose size={22} className="group-hover:rotate-90 transition-transform duration-300" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                                {/* Action Form */}
                                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
                                        {categoryForm.editingId ? 'Modify Category' : 'Create New Category'}
                                    </h3>
                                    <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={categoryForm.name}
                                                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="Enter category name..."
                                                disabled={categorySubmitting}
                                                className="w-full px-5 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium disabled:opacity-50"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleCategorySubmit}
                                                disabled={categorySubmitting || !categoryForm.name.trim()}
                                                className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                {categorySubmitting ? '...' : categoryForm.editingId ? 'Update' : 'Add'}
                                            </button>
                                            {categoryForm.editingId && (
                                                <button
                                                    onClick={() => setCategoryForm({ name: '', editingId: null })}
                                                    className="p-3.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                                                >
                                                    <MdClose size={20} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Categories Insight & List */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Inventory</h3>
                                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black">{filteredCategories.length}</span>
                                        </div>
                                        <div className="relative w-48">
                                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="text"
                                                placeholder="Filter list..."
                                                defaultValue={categorySearchTerm}
                                                onChange={(e) => {
                                                    clearTimeout(categorySearchDebounceRef.current);
                                                    categorySearchDebounceRef.current = setTimeout(() => {
                                                        setCategorySearchTerm(e.target.value);
                                                        setCategoryPage(1);
                                                    }, 300);
                                                }}
                                                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                            />
                                        </div>
                                    </div>

                                    {categoriesLoading ? (
                                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                                            <div className="w-10 h-10 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin" />
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Synchronizing Data</p>
                                        </div>
                                    ) : filteredCategories.length === 0 ? (
                                        <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center">
                                            <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-600 mx-auto mb-4 border border-slate-100 dark:border-slate-700/50">
                                                <MdCategory size={32} />
                                            </div>
                                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Discovery Failed</p>
                                            <p className="text-xs text-slate-400 mt-1">Try a different search term or add a new category.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 hide-scrollbar">
                                            {paginatedCategories.map((category) => (
                                                <motion.div
                                                    layout
                                                    key={category.id}
                                                    className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-colors border border-slate-100 dark:border-slate-700">
                                                            <MdCategory className="text-slate-400 group-hover:text-emerald-500 transition-colors" size={18} />
                                                        </div>
                                                        <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
                                                            {category.category}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => setCategoryForm({ name: category.category, editingId: category.id })}
                                                        className="p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 rounded-xl transition-all border border-slate-100 dark:border-slate-700 shadow-sm"
                                                        title="Refine category"
                                                    >
                                                        <MdEdit size={16} />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Advanced Pagination */}
                                    {totalCategoryPages > 1 && (
                                        <div className="flex items-center justify-center gap-2 pt-4">
                                            <button
                                                onClick={() => setCategoryPage(p => Math.max(1, p - 1))}
                                                disabled={categoryPage === 1}
                                                className="p-2 text-slate-400 hover:text-emerald-600 disabled:opacity-30 transition-colors"
                                            >
                                                <MdChevronLeft size={24} />
                                            </button>
                                            <div className="flex gap-1.5">
                                                {[...Array(totalCategoryPages)].map((_, i) => (
                                                    <button
                                                        key={i + 1}
                                                        onClick={() => setCategoryPage(i + 1)}
                                                        className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${categoryPage === i + 1 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                                    >
                                                        {i + 1}
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setCategoryPage(p => Math.min(totalCategoryPages, p + 1))}
                                                disabled={categoryPage === totalCategoryPages}
                                                className="p-2 text-slate-400 hover:text-emerald-600 disabled:opacity-30 transition-colors"
                                            >
                                                <MdChevronRight size={24} />
                                            </button>
                                        </div>
                                    )}
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

            {/* Product Narrative Archive Modal */}
            <AnimatePresence>
                {descriptionModal && selectedProductForDescription && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto hide-scrollbar">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
                            onClick={() => setDescriptionModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800/50 flex flex-col max-h-[90vh]"
                        >
                            {/* Minimalist Professional Header */}
                            <div className="relative p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center border border-emerald-100 dark:border-emerald-800/50">
                                            <MdInventory2 className="text-emerald-600 dark:text-emerald-400 text-3xl" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                                {existingDescriptions.length > 0 ? 'Narrative Archive' : 'Add Narrative'}
                                            </h2>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                                {selectedProductForDescription.name}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setDescriptionModal(false)}
                                        className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl transition-all border border-slate-200 dark:border-slate-700"
                                    >
                                        <MdClose size={22} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 hide-scrollbar">
                                {/* Create/Edit Narrative Section */}
                                {(existingDescriptions.length === 0 || editingDescriptionId) && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/50"
                                    >
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                                            {editingDescriptionId ? 'Modify Narrative' : 'New Narrative'}
                                        </h3>
                                        
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Narrative Text</label>
                                                <textarea
                                                    value={descriptionForm.description}
                                                    onChange={(e) => setDescriptionForm(prev => ({ ...prev, description: e.target.value }))}
                                                    rows={5}
                                                    disabled={descriptionSubmitting}
                                                    className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium resize-none disabled:opacity-50"
                                                    placeholder="Enter product description and details..."
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Visual Gallery</label>
                                                
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    {/* Upload Trigger */}
                                                    <label className="aspect-square bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50/30 hover:border-emerald-500/50 transition-all group">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            onChange={handleDescriptionImagesChange}
                                                            className="hidden"
                                                            disabled={descriptionSubmitting}
                                                        />
                                                        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-emerald-500 group-hover:scale-110 transition-all mb-1">
                                                            <MdAdd size={24} />
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase">Enrich</span>
                                                    </label>

                                                    {/* Retained Images */}
                                                    {editingDescriptionId && descriptionForm.retainedImages.map((imageUrl, index) => (
                                                        <div key={`retained-${index}`} className="relative group aspect-square">
                                                            <img
                                                                src={imageUrl}
                                                                alt={`Current ${index + 1}`}
                                                                className="w-full h-full object-cover rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeRetainedImage(imageUrl)}
                                                                disabled={descriptionSubmitting}
                                                                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 disabled:opacity-50"
                                                            >
                                                                <MdClose size={14} />
                                                            </button>
                                                        </div>
                                                    ))}

                                                    {/* New Images */}
                                                    {descriptionForm.images.map((image, index) => (
                                                        <div key={`new-${index}`} className="relative group aspect-square">
                                                            <img
                                                                src={URL.createObjectURL(image)}
                                                                alt={`New ${index + 1}`}
                                                                className="w-full h-full object-cover rounded-2xl border-2 border-emerald-500 shadow-sm ring-4 ring-emerald-500/10"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeDescriptionImage(index)}
                                                                disabled={descriptionSubmitting}
                                                                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 disabled:opacity-50"
                                                            >
                                                                <MdClose size={14} />
                                                            </button>
                                                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded-md uppercase">New</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-2">
                                            <button
                                                onClick={handleDescriptionSubmit}
                                                disabled={descriptionSubmitting || !descriptionForm.description.trim()}
                                                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                {descriptionSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                                                {editingDescriptionId ? 'Save Changes' : 'Confirm Narrative'}
                                            </button>
                                            {editingDescriptionId && (
                                            <button
                                                    onClick={cancelEditDescription}
                                                    disabled={descriptionSubmitting}
                                                    className="px-6 py-4 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-sm hover:bg-slate-300 transition-all disabled:opacity-50"
                                                >
                                                    Discard
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Archived Narratives Section */}
                                {existingDescriptions.length > 0 && !editingDescriptionId && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between px-2">
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Archived Narratives</h3>
                                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full text-[10px] font-black">{existingDescriptions.length} ENTRY</span>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            {existingDescriptions.map((desc) => (
                                                <motion.div 
                                                    layout
                                                    key={desc.id} 
                                                    className="bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700 overflow-hidden hover:border-emerald-500/40 transition-all group"
                                                >
                                                    <div className="p-6">
                                                        <div className="flex items-start justify-between gap-6 mb-4">
                                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed flex-1">
                                                                {desc.description}
                                                            </p>
                                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => startEditDescription(desc)}
                                                                    className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100 dark:border-emerald-800/50"
                                                                    title="Edit Narrative"
                                                                >
                                                                    <MdEdit size={16} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {desc.photo && desc.photo.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50 dark:border-slate-700/50">
                                                                {desc.photo.map((imgUrl, imgIndex) => (
                                                                    <div key={imgIndex} className="w-14 h-14 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                                                                        <img
                                                                            src={imgUrl}
                                                                            alt={`${imgIndex + 1}`}
                                                                            className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer"
                                                                            onClick={() => window.open(imgUrl, '_blank')}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            {!editingDescriptionId && (
                                <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
                                    <button
                                        onClick={() => setDescriptionModal(false)}
                                        className="px-8 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 transition-all"
                                    >
                                        Close Portal
                                    </button>
                                </div>
                            )}
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
        description: '',
        draft: false,
        status: 'pending'
    });
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            if (mode === 'edit' && product) {
                setFormData({
                    name: product.name || '',
                    price: product.price || '',
                    newPrice: product.newPrice || '',
                    quantity: product.quantity || '',
                    categoryId: product.categoryId || product.category?.id || '',
                    description: product.description || '',
                    draft: product.draft !== undefined ? product.draft : false,
                    status: product.approved || 'pending'
                });
                setImagePreview(product.photo || null);
            } else {
                setFormData({
                    name: '',
                    price: '',
                    newPrice: '',
                    quantity: '',
                    categoryId: '',
                    description: '',
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
        submitData.append('description', formData.description);
        submitData.append('draft', formData.draft);

        if (selectedImage) {
            submitData.append('photo', selectedImage);
        }

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
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(mode === 'edit' ? (product?.photo || null) : null);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto hide-scrollbar">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 40 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl overflow-y-auto lg:overflow-hidden border border-slate-200 dark:border-slate-800/50 flex flex-col lg:flex-row lg:min-h-[600px] max-h-[95vh] sm:max-h-[90vh] custom-scrollbar"
                >
                    {/* Professional Header - Absolute on Top */}
                    <div className="absolute top-6 right-6 z-20">
                        <button
                            onClick={onClose}
                            className="p-3 bg-white/10 hover:bg-white/20 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 text-slate-800 dark:text-white rounded-2xl transition-all backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50"
                        >
                            <MdClose size={22} />
                        </button>
                    </div>

                    {/* Left Panel: Visual Experience & Context (col-span-5) */}
                    <div className="lg:w-5/12 relative bg-slate-50 dark:bg-slate-800/30 overflow-hidden flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 shrink-0 lg:shrink">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5" />
                        
                        <div className="p-5 sm:p-8 relative z-10 flex-1 flex flex-col">
                            <div className="mb-10">
                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full mb-3 inline-block border border-emerald-500/20">
                                    Catalog Manager
                                </span>
                                <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                    {mode === 'add' ? 'New Product' : 'Edit Listing'}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 font-medium">
                                    {mode === 'add' ? 'Bring your harvest to the global marketplace.' : 'Excellence requires constant refinement.'}
                                </p>
                            </div>

                            {/* Image Showcase */}
                            <div className="relative group flex-1 flex flex-col">
                                <div className={`lg:flex-1 aspect-video lg:aspect-auto min-h-[200px] lg:min-h-[300px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all relative overflow-hidden bg-white dark:bg-slate-900 ${imagePreview ? 'border-emerald-500/50' : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400 group-hover:bg-emerald-50/10'}`}>
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} className="w-full h-full object-cover" alt="Product" />
                                            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                                                <div className="flex items-center justify-center gap-3">
                                                    <label className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl cursor-pointer backdrop-blur-md transition-all border border-white/20 text-xs font-black uppercase flex items-center gap-2">
                                                        <MdEdit size={16} />
                                                        Update
                                                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={submitting} />
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={removeImage}
                                                        disabled={submitting}
                                                        className="px-5 py-2.5 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-xl backdrop-blur-md transition-all border border-red-500/30 text-xs font-black uppercase flex items-center gap-2 disabled:opacity-50"
                                                    >
                                                        <MdClose size={16} />
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer transition-all">
                                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-4 border border-slate-100 dark:border-slate-700 group-hover:scale-110 group-hover:text-emerald-500 transition-all">
                                                <MdAdd size={32} />
                                            </div>
                                            <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Showcase Image</span>
                                            <span className="text-xs text-slate-400 mt-2">Tap to select professional file</span>
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={submitting} />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Structured Form (col-span-7) */}
                    <div className="lg:w-7/12 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
                        <form onSubmit={handleSubmit} id="product-form" className="flex-1 flex flex-col lg:overflow-hidden">
                            <div className="flex-1 lg:overflow-y-auto p-5 sm:p-8 custom-scrollbar space-y-8">
                                {/* Section: Attributes */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-0.5 flex-1 bg-slate-100 dark:bg-slate-800" />
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Core Attributes</h4>
                                        <div className="h-0.5 flex-1 bg-slate-100 dark:bg-slate-800" />
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight ml-1">Identity</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                placeholder="e.g. Organic Highland Wheat"
                                                disabled={submitting}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-semibold disabled:opacity-50"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight ml-1">Classification</label>
                                                <div className="relative">
                                                    <select
                                                        name="categoryId"
                                                        value={formData.categoryId}
                                                        onChange={handleChange}
                                                        required
                                                        disabled={submitting}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-semibold appearance-none disabled:opacity-50"
                                                    >
                                                        <option value="">Choose Category</option>
                                                        {categories.map(cat => (
                                                            <option key={cat.id} value={cat.id}>{cat.category}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight ml-1">Units Available</label>
                                                <input
                                                    type="number"
                                                    name="quantity"
                                                    value={formData.quantity}
                                                    onChange={handleChange}
                                                    required
                                                    min="0"
                                                    disabled={submitting}
                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-semibold disabled:opacity-50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Value */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-0.5 flex-1 bg-slate-100 dark:bg-slate-800" />
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Value Definition</h4>
                                        <div className="h-0.5 flex-1 bg-slate-100 dark:bg-slate-800" />
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight ml-1">Standard Price</label>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 font-black">₦</span>
                                                <input
                                                    type="number"
                                                    name="price"
                                                    value={formData.price}
                                                    onChange={handleChange}
                                                    required
                                                    min="0"
                                                    step="0.01"
                                                    disabled={submitting}
                                                    className="w-full pl-10 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-semibold disabled:opacity-50"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight ml-1">Promotional Rate</label>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-500 font-black">₦</span>
                                                <input
                                                    type="number"
                                                    name="newPrice"
                                                    value={formData.newPrice}
                                                    onChange={handleChange}
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="Optional"
                                                    disabled={submitting}
                                                    className="w-full pl-10 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-semibold disabled:opacity-50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Narrative */}
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight ml-1">Details & Narrative</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows="5"
                                        placeholder="Communicate the quality, origin, and characteristics of your product..."
                                        disabled={submitting}
                                        className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-medium leading-relaxed resize-none disabled:opacity-50"
                                    />
                                </div>

                                {/* Section: Control */}
                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center gap-4 px-2">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id="draft-checkbox"
                                                name="draft"
                                                checked={formData.draft}
                                                onChange={handleChange}
                                                disabled={submitting}
                                                className="w-5 h-5 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all disabled:opacity-50"
                                            />
                                            <label htmlFor="draft-checkbox" className="text-sm font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
                                                Save as Draft
                                            </label>
                                        </div>
                                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-2" />
                                        <p className="text-[10px] text-slate-400 font-medium italic">Draft products are only visible to management.</p>
                                    </div>

                                    {mode === 'edit' && (
                                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-emerald-500 border border-slate-100 dark:border-slate-800">
                                                    <MdVisibility size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Public Status</p>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Currently {formData.status.toUpperCase()}</p>
                                                </div>
                                            </div>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleChange}
                                                disabled={submitting}
                                                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase text-slate-600 dark:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="approved">Approved</option>
                                                <option value="rejected">Rejected</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                        {/* Sticky Action Bar */}
                        <div className="p-5 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full sm:w-auto px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-black transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 active:scale-95"
                            >
                                {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                                {mode === 'add' ? 'Publish Portfolio' : 'Synchronize Product'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </motion.div>
    </div>
        </AnimatePresence>
    );
};

export default ProductsPage;
