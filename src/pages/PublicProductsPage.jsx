import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import api from '../services/api';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { MdSearch, MdFilterList, MdStore, MdCategory, MdAttachMoney, MdChevronLeft, MdChevronRight, MdStar, MdShoppingCart, MdClose, MdShoppingBasket } from 'react-icons/md';

const PublicProductsPage = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [sortBy, setSortBy] = useState('name');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchParams, setSearchParams] = useSearchParams();
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const cartRef = useRef(null);

    // Load cart from database on mount
    useEffect(() => {
        const fetchCart = async () => {
            try {
                const response = await api.get('/product/cart');
                // console.log('Cart API response:', response.data);
                if (response.data.status === 'success') {
                    const cartData = response.data.data;
                    // console.log('Cart data type:', typeof cartData, cartData);
                    // Backend returns { cart: cartItems, totalPrice, totalItems }
                    if (cartData && cartData.cart && Array.isArray(cartData.cart)) {
                        setCart(cartData.cart);
                    } else {
                        setCart([]);
                    }
                } else {
                    setCart([]);
                }
            } catch (error) {
                console.error('Error loading cart:', error);
                // Don't set cart to empty on 404, as empty cart is valid
                if (error.response?.status !== 404) {
                    setCart([]);
                }
            }
        };
        fetchCart();
    }, []);

    const productsPerPage = 12;

    // Close cart dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (cartRef.current && !cartRef.current.contains(event.target)) {
                setShowCart(false);
            }
        };

        if (showCart) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCart]);

    // Fetch products and categories
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch verified products from the correct endpoint
                const productsRes = await api.get('/product/verified-products');
                if (productsRes.data.status === 'success') {
                    
                    setProducts(productsRes.data.data);
                }

                // Fetch categories
                const categoriesRes = await api.get('/product/categories');
                if (categoriesRes.data.status === 'success') {
                    setCategories(categoriesRes.data.data);
                }
            } catch (error) {
                toast.error('Failed to load products');
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Update URL params when filters change
    useEffect(() => {
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (selectedCategory) params.set('category', selectedCategory);
        if (priceRange.min) params.set('min', priceRange.min);
        if (priceRange.max) params.set('max', priceRange.max);
        if (sortBy !== 'name') params.set('sort', sortBy);
        if (currentPage > 1) params.set('page', currentPage);
        
        setSearchParams(params);
    }, [searchTerm, selectedCategory, priceRange, sortBy, currentPage, setSearchParams]);

    // Initialize filters from URL params
    useEffect(() => {
        const params = Object.fromEntries(searchParams);
        if (params.search) setSearchTerm(params.search);
        if (params.category) setSelectedCategory(params.category);
        if (params.min) setPriceRange(prev => ({ ...prev, min: params.min }));
        if (params.max) setPriceRange(prev => ({ ...prev, max: params.max }));
        if (params.sort) setSortBy(params.sort);
        if (params.page) setCurrentPage(parseInt(params.page));
    }, [searchParams]);

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        let filtered = products.filter(product => {

            if (!product) return false;
            return true; // All products from verified-products endpoint are valid
        });

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(product =>
                product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Category filter
        if (selectedCategory) {
            filtered = filtered.filter(product =>
                product.category?.category === selectedCategory
            );
        }

        // Price range filter
        if (priceRange.min) {
            filtered = filtered.filter(product =>
                product.price >= parseFloat(priceRange.min)
            );
        }
        if (priceRange.max) {
            filtered = filtered.filter(product =>
                product.price <= parseFloat(priceRange.max)
            );
        }

        // Sort products
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'name':
                default:
                    return a.name?.localeCompare(b.name);
            }
        });

        return filtered;
    }, [products, searchTerm, selectedCategory, priceRange, sortBy]);

    // Pagination
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * productsPerPage;
        return filteredProducts.slice(startIndex, startIndex + productsPerPage);
    }, [filteredProducts, currentPage]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategory('');
        setPriceRange({ min: '', max: '' });
        setSortBy('name');
        setCurrentPage(1);
    };

    const addToCart = async (product, quantity = 1) => {
        const stock = getStock(product);
        if (stock <= 0) {
            toast.error('Product is out of stock');
            return;
        }

        if (quantity > stock) {
            toast.error(`Cannot add more than available stock (${stock})`);
            return;
        }

        try {
            console.log('Adding to cart:', { productId: product.id, quantity });
            
            // Use the correct backend endpoint with /product prefix
            const response = await api.post(`/product/add-to-cart/${product.id}`, {
                quantity: quantity
            });

            if (response.data.status === 'success') {
                // Refresh cart from database
                const cartResponse = await api.get('/product/cart');
                if (cartResponse.data.status === 'success') {
                    const cartData = cartResponse.data.data;
                    if (cartData && cartData.cart && Array.isArray(cartData.cart)) {
                        setCart(cartData.cart);
                    } else {
                        setCart([]);
                    }
                }
                toast.success(`${quantity} ${product.name} added to cart!`);
            } else {
                toast.error(response.data.message || 'Failed to add to cart');
            }
        } catch (error) {
            console.error('Error adding to cart:', error.response?.status, error.response?.data);
            console.error('Full error:', error);
            toast.error('Failed to add to cart');
        }
    };

    const removeFromCart = async (productId) => {
        try {
            // Use the correct backend endpoint with /product prefix
            const response = await api.delete(`/product/delete-cart-item/${productId}`);
            
            if (response.data.status === 'success') {
                // Refresh cart from database
                const cartResponse = await api.get('/product/cart');
                if (cartResponse.data.status === 'success') {
                    const cartData = cartResponse.data.data;
                    if (cartData && cartData.cart && Array.isArray(cartData.cart)) {
                        setCart(cartData.cart);
                    } else {
                        setCart([]);
                    }
                }
                toast.success('Item removed from cart');
            } else {
                toast.error(response.data.message || 'Failed to remove item');
            }
        } catch (error) {
            console.error('Error removing from cart:', error);
            toast.error('Failed to remove item');
        }
    };

    const updateQuantity = async (productId, newQuantity) => {
        if (newQuantity <= 0) {
            await removeFromCart(productId);
            return;
        }
        
        try {
            // Use the correct backend endpoint with /product prefix
            const response = await api.put(`/product/edit-cart-item/${productId}`, {
                quantity: newQuantity
            });

            if (response.data.status === 'success') {
                // Refresh cart from database
                const cartResponse = await api.get('/product/cart');
                if (cartResponse.data.status === 'success') {
                    const cartData = cartResponse.data.data;
                    if (cartData && cartData.cart && Array.isArray(cartData.cart)) {
                        setCart(cartData.cart);
                    } else {
                        setCart([]);
                    }
                }
            } else {
                toast.error(response.data.message || 'Failed to update quantity');
            }
        } catch (error) {
            // console.error('Error updating cart quantity:', error);
            toast.error('Failed to update quantity');
        }
    };

    const getCartTotal = () => {
        if (!Array.isArray(cart)) {
            return 0;
        }
        return cart.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0);
    };

    const getCartItemsCount = () => {
        if (!Array.isArray(cart)) {
            return 0;
        }
        return cart.length;
    };

    const getStock = (product) => {
        // Try different possible field names for stock/quantity
        return product.stock || 
               product.quantity || 
               product.inventory || 
               product.available_quantity || 
               product.stock_quantity || 
               0;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center animate-pulse">
                        <MdStore className="text-white text-2xl" />
                    </div>
                    <p className="text-sm font-medium text-gray-400 dark:text-slate-500">Loading products...</p>
                </div>
            </div>
        );
    }

    return (
            <div className="p-4 sm:p-6 lg:p-10 page-enter max-w-7xl mx-auto">
                {/* Header with Cart */}
                <div className="flex justify-between items-center mb-8">
                    <div className="text-center flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                            Farm Products
                        </h1>
                        <p className="text-gray-600 dark:text-slate-400">
                            Discover fresh, quality products from our farm
                        </p>
                    </div>
                    
                    {/* Cart Button */}
                    <div className="relative" ref={cartRef}>
                        <button
                            onClick={() => {
                                console.log('Cart button clicked, current state:', showCart);
                                setShowCart(!showCart);
                            }}
                            className="relative p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors z-40"
                        >
                            <MdShoppingCart size={20} />
                            {getCartItemsCount() > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    {getCartItemsCount()}
                                </span>
                            )}
                        </button>
                        
                        {/* Cart Dropdown */}
                        {showCart && (
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 z-[60] overflow-hidden">
                                <div className="p-4 border-b border-gray-200 dark:border-slate-800">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Shopping Cart</h3>
                                </div>
                                
                                {cart.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 dark:text-slate-400">
                                        <MdShoppingCart size={48} className="mx-auto mb-2 opacity-50" />
                                        <p>Your cart is empty</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="max-h-64 overflow-y-auto">
                                            {cart.map((item) => (
                                                <div key={item.id} className="p-4 border-b border-gray-100 dark:border-slate-800 last:border-b-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">{item.product?.name || item.name}</h4>
                                                            <p className="text-gray-500 dark:text-slate-400 text-xs">₦{item.price} each</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                className="w-6 h-6 rounded bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                className="w-6 h-6 rounded bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="text-red-500 hover:text-red-600"
                                                        >
                                                            <MdClose size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-4 border-t border-gray-200 dark:border-slate-800">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
                                                <span className="font-bold text-lg text-emerald-600">₦{getCartTotal().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                            </div>
                                            <button
                                                onClick={() => navigate('/cart')}
                                                className="w-full py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors mb-2"
                                            >
                                                View Cart
                                            </button>
                                            <button className="w-full py-2 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors">
                                                Checkout
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="max-w-7xl mx-auto">
                {/* Search and Filters */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row gap-4 mb-6">
                        {/* Search Bar */}
                        <div className="flex-1">
                            <div className="relative">
                                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Sort Dropdown */}
                        <select
                            value={sortBy}
                            onChange={(e) => {
                                setSortBy(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                        >
                            <option value="name">Sort by Name</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                        </select>
                    </div>

                    {/* Filter Options */}
                    <div className="flex flex-wrap gap-4 items-center">
                        {/* Category Filter */}
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-sm dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                        >
                            <option value="">All Categories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.category}>
                                    {category.category}
                                </option>
                            ))}
                        </select>

                        {/* Price Range */}
                        <div className="flex items-center gap-2">
                            <MdAttachMoney className="text-gray-400" />
                            <input
                                type="number"
                                placeholder="Min"
                                value={priceRange.min}
                                onChange={(e) => {
                                    setPriceRange(prev => ({ ...prev, min: e.target.value }));
                                    setCurrentPage(1);
                                }}
                                className="w-20 px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-sm dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={priceRange.max}
                                onChange={(e) => {
                                    setPriceRange(prev => ({ ...prev, max: e.target.value }));
                                    setCurrentPage(1);
                                }}
                                className="w-20 px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-sm dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                            />
                        </div>

                        {/* Clear Filters */}
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>

                    {/* Results Count */}
                    <div className="mt-4 text-sm text-gray-600 dark:text-slate-400">
                        Showing {paginatedProducts.length} of {filteredProducts.length} products
                    </div>
                </div>

                {/* Products Grid */}
                {paginatedProducts.length === 0 ? (
                    <div className="text-center py-16">
                        <MdStore className="text-6xl text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No products found</h3>
                        <p className="text-gray-600 dark:text-slate-400">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                        {paginatedProducts.map((product, index) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.3 }}
                                className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-shadow duration-300"
                            >
                                {/* Product Image */}
                                <div className="aspect-square bg-gray-100 dark:bg-slate-800 relative overflow-hidden">
                                    {product.photo ? (
                                        <img
                                            src={product.photo}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <MdStore className="text-4xl text-gray-300 dark:text-slate-600" />
                                        </div>
                                    )}
                                    {getStock(product) <= 0 && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                            <span className="text-white font-semibold">Out of Stock</span>
                                        </div>
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="p-4">
                                    <div className="mb-2">
                                        {product.category?.category && (
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 mb-1">
                                                <MdCategory size={12} />
                                                {product.category.category}
                                            </span>
                                        )}
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
                                            {product.name}
                                        </h3>
                                    </div>

                                    <p className="text-gray-600 dark:text-slate-400 text-xs mb-3 line-clamp-2">
                                        {product.description || 'No description available'}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <span className="text-emerald-600 font-bold" style={{ fontSize: '18px' }}>₦</span>
                                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                                {product.price}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                                            <span>Stock:</span>
                                            <span className={getStock(product) > 0 ? 'text-emerald-600' : 'text-red-500'}>
                                                {getStock(product)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Quantity and Add to Cart */}
                                    <div className="mt-3 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600 dark:text-slate-400">Qty:</span>
                                            <input
                                                type="number"
                                                min="1"
                                                max={getStock(product)}
                                                defaultValue="1"
                                                id={`quantity-${product.id}`}
                                                className="w-16 px-2 py-1 text-sm border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                            />
                                            <span className="text-xs text-gray-500 dark:text-slate-500">
                                                (Max: {getStock(product)})
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const quantityInput = document.getElementById(`quantity-${product.id}`);
                                                const quantity = parseInt(quantityInput.value) || 1;
                                                addToCart(product, quantity);
                                            }}
                                            disabled={getStock(product) <= 0}
                                            className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
                                                getStock(product) > 0
                                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                    : 'bg-gray-200 dark:bg-slate-700 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            {getStock(product) > 0 ? (
                                                <>
                                                    <MdShoppingCart size={16} className="inline mr-1" />
                                                    Add to Cart
                                                </>
                                            ) : (
                                                'Out of Stock'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <MdChevronLeft size={20} />
                        </button>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                        currentPage === pageNum
                                            ? 'bg-emerald-600 text-white'
                                            : 'border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <MdChevronRight size={20} />
                        </button>
                    </div>
                )}
                </div>
            </div>
    );
};

export default PublicProductsPage;
