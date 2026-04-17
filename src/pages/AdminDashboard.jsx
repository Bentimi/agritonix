import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    MdSearch, MdEdit, MdVisibility, MdClose, MdSave, MdLock, MdWarning, MdPerson, MdEmail, MdPhone, MdBadge, MdSecurity, MdCalendarMonth, MdVerified, MdKey, MdBlock, MdToggleOn, MdToggleOff, MdAdminPanelSettings, MdPeople, MdInventory2, MdChevronLeft, MdChevronRight, MdArrowForward, MdAnalytics, MdSettings
} from 'react-icons/md';
import { useNavigate, Link } from 'react-router';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';

const AdminDashboard = () => {
    const { user, loading: authLoading, updateUserProfile } = useAuth();
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const navigate = useNavigate();

    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editData, setEditData] = useState({});
    const [isUpdating, setIsUpdating] = useState(false);

    // Account Status Modal State
    const [confirmStatusUser, setConfirmStatusUser] = useState(null);
    const [statusLoading, setStatusLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const [usersRes, productsRes] = await Promise.all([
                    api.get('/user/all-users'),
                    api.get('/product/all-products')
                ]);
                if (usersRes.data.status === 'success') setUsers(usersRes.data.data);
                if (productsRes.data.status === 'success') setProducts(productsRes.data.data);
            } catch (error) {
                console.error('Fetch error:', error);
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const filteredUsers = useMemo(() => {
        return users.filter(u =>
            `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.username?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const totalPages = Math.ceil(filteredUsers.length / pageSize);
    const paginatedUsers = useMemo(() => {
        return filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    }, [filteredUsers, currentPage, pageSize]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, pageSize]);

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    const stats = useMemo(() => ({
        total: users.length,
        staff: users.filter(u => u.role === 'staff').length,
        customers: users.filter(u => u.role === 'user').length,
        admins: users.filter(u => u.role === 'admin').length,
        active: users.filter(u => u.active).length,
        inventory: products.length
    }), [users, products]);

    const handleEditClick = (u) => {
        setSelectedUser(u);
        setEditData({
            first_name: u.first_name || '',
            last_name: u.last_name || '',
            email: u.email || '',
            phone_number: u.phone_number || '',
            gender: u.gender || '',
            marital_status: u.marital_status || 'single'
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        const result = await updateUserProfile(selectedUser.id, editData);
        if (result.success) {
            toast.success('Member records updated');
            setIsEditModalOpen(false);
            const refresh = await api.get('/user/all-users');
            if (refresh.data.status === 'success') setUsers(refresh.data.data);
        } else {
            toast.error(result.message);
        }
        setIsUpdating(false);
    };

    const handleStatusToggleConfirm = async () => {
        if (!confirmStatusUser) return;
        setStatusLoading(true);
        try {
            const res = await api.patch(`/user/active-status/${confirmStatusUser.id}`);
            if (res.data.status === 'success') {
                toast.success('Account status updated');
                setUsers(prev => prev.map(u => u.id === confirmStatusUser.id ? { ...u, active: !u.active } : u));
                setConfirmStatusUser(null);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
        setStatusLoading(false);
    };
    // Time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
    };

    const quickActions = [
        {
            icon: <MdPeople />,
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600',
            title: 'Manage Users',
            description: 'Check members and update roles',
            action: () => navigate('/admin/users'),
        },
        {
            icon: <MdInventory2 />,
            iconBg: 'bg-amber-100 dark:bg-amber-900/20 text-amber-600',
            title: 'Inventory Control',
            description: 'Update products and prices',
            action: () => navigate('/admin/products'),
        },
        {
            icon: <MdSettings />,
            iconBg: 'bg-sky-100 dark:bg-sky-900/20 text-sky-600',
            title: 'System Settings',
            description: 'Adjust platform preferences',
            action: () => navigate('/settings'),
        },
        {
            icon: <MdAnalytics />,
            iconBg: 'bg-violet-100 dark:bg-violet-900/20 text-violet-600',
            title: 'Store Front',
            description: 'View the live products page',
            action: () => navigate('/products'),
        },
    ];

    if (authLoading) return <LoadingScreen />;

    const statCards = [
        { label: 'Admins', value: stats.admins, icon: <MdAdminPanelSettings />, accent: 'stat-accent-violet', iconBg: 'bg-violet-100 dark:bg-violet-900/20 text-violet-600' },
        { label: 'Staff', value: stats.staff, icon: <MdBadge />, accent: 'stat-accent-sky', iconBg: 'bg-sky-100 dark:bg-sky-900/20 text-sky-600' },
        { label: 'Users', value: stats.customers, icon: <MdPeople />, accent: 'stat-accent-emerald', iconBg: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600' },
        { label: 'Inventory', value: stats.inventory, icon: <MdInventory2 />, accent: 'stat-accent-amber', iconBg: 'bg-amber-100 dark:bg-amber-900/20 text-amber-600' },
    ];

    return (
        <DashboardLayout activeNav="dashboard">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="p-4 sm:p-6 lg:p-10 page-enter max-w-7xl mx-auto"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                {getGreeting()}, {user?.first_name}!
                            </h1>
                            <MdVerified className="text-emerald-500 text-xl" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Here's a snapshot of the Agritronix platform today.</p>
                    </div>
                </motion.div>

                {/* Hero Summary Card */}
                <motion.div variants={itemVariants} className="relative bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 p-7 mb-8 overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-violet-600 rounded-t-2xl" />
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow-lg shadow-violet-500/20">
                            <MdAdminPanelSettings />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                Administrator Control Center
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 max-w-2xl">
                                System status is healthy. You have full oversight of all members, staff permissions, and farm inventory. Use the tools below to manage your growing operation.
                            </p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/15 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    {stats.active} Active Members
                                </span>
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 dark:bg-sky-900/15 text-sky-600 dark:text-sky-400 rounded-lg">
                                    <MdBadge /> {stats.staff} Staff On Duty
                                </span>
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 dark:bg-violet-900/15 text-violet-600 dark:text-violet-400 rounded-lg">
                                    <MdAdminPanelSettings /> System Roles Locked
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Section Title */}
                <motion.div variants={itemVariants} className="mb-4 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] px-1">Quick Management</h3>
                </motion.div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    {quickActions.map((action, i) => (
                        <motion.button
                            key={i}
                            variants={itemVariants}
                            onClick={action.action}
                            className="group text-left bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 p-5 hover:border-emerald-200 dark:hover:border-emerald-900/40 transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${action.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                                    {action.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 dark:text-white text-xs mb-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                        {action.title}
                                    </h4>
                                    <p className="text-[10px] leading-tight text-gray-400 dark:text-slate-500">
                                        {action.description}
                                    </p>
                                </div>
                                <MdArrowForward className="text-gray-300 dark:text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all mt-1" />
                            </div>
                        </motion.button>
                    ))}
                </div>

                {/* Section Title */}
                <motion.div variants={itemVariants} className="mb-4">
                    <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] px-1">Platform Vital Stats</h3>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    {statCards.map((s, i) => (
                        <motion.div key={s.label}
                            variants={itemVariants}
                            className={`stat-accent ${s.accent} stat-card bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800/70 relative overflow-hidden group hover:shadow-lg transition-all duration-300`}>
                            <div className="flex justify-between items-start mb-3">
                                <span className="stat-label text-gray-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">{s.label}</span>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${s.iconBg} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                                    {s.icon}
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="stat-value text-3xl font-black text-slate-800 dark:text-white leading-none">{s.value}</span>
                                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 px-1.5 py-0.5 rounded uppercase">Live</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* User Management Section */}
                <motion.div variants={itemVariants} className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] px-1">User Management</h3>
                    <div className="flex gap-2">
                        {searchTerm && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-100 dark:border-emerald-800 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                <MdPeople /> {filteredUsers.length} matches
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 text-[10px] font-bold text-gray-400 dark:text-slate-500">
                            Total: {users.length}
                        </span>
                    </div>
                </motion.div>

                {/* Table Controls Container */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-t-2xl border-x border-t border-gray-100 dark:border-slate-800/70 p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="relative group flex-1">
                            <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input type="text" placeholder="Filter members by name, email or username..."
                                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700 rounded-xl text-sm w-full dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-400"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Rows per page</span>
                            <select 
                                value={pageSize} 
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-600 dark:text-slate-300 outline-none focus:border-emerald-500 transition-all"
                            >
                                <option value={5}>5 Items</option>
                                <option value={10}>10 Items</option>
                                <option value={25}>25 Items</option>
                                <option value={50}>50 Items</option>
                            </select>
                        </div>
                    </div>
                </motion.div>

                {/* Table Wrapper */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-b-2xl border border-gray-100 dark:border-slate-800/70 shadow-lg overflow-hidden flex flex-col mb-10 w-[32rem] md:w-[55rem] lg:w-full mt-3">
                    <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                        <table className="w-full text-left border-separate border-spacing-0" style={{ minWidth: '700px' }}>
            <thead>
                <tr className="bg-gray-50/80 dark:bg-slate-800/50 backdrop-blur-md">
                    {/* 'sticky top-0' keeps the header visible while scrolling data */}
                    <th className="sticky top-0 z-10 px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-800 bg-inherit">
                        Member
                    </th>
                    <th className="sticky top-0 z-10 px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-800 bg-inherit w-1">
                        Role
                    </th>
                    <th className="sticky top-0 z-10 px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-800 bg-inherit w-1">
                        Status
                    </th>
                    <th className="sticky top-0 z-10 px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-800 text-right bg-inherit w-1">
                        Actions
                    </th>
                </tr>
            </thead>

            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                {loading ? (
                    [...Array(6)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                            <td className="px-6 py-4"><div className="flex gap-3 items-center"><div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800" /><div className="space-y-2"><div className="h-2 w-24 bg-gray-100 dark:bg-slate-800 rounded" /><div className="h-2 w-32 bg-gray-50 dark:bg-slate-800/50 rounded" /></div></div></td>
                            <td className="px-4 py-4"><div className="h-4 w-12 bg-gray-100 dark:bg-slate-800 rounded" /></td>
                            <td className="px-4 py-4"><div className="h-4 w-12 bg-gray-100 dark:bg-slate-800 rounded" /></td>
                            <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 dark:bg-slate-800 rounded ml-auto" /></td>
                        </tr>
                    ))
                ) : filteredUsers.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center justify-center">
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                                    <MdSearch className="text-2xl text-gray-300 dark:text-slate-600" />
                                </div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">No members found</h3>
                            </div>
                        </td>
                    </tr>
                ) : (
                    paginatedUsers.map((u) => (
                        <tr key={u.id} className="group hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-all">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm ring-1 ring-inset ${
                                        u.role === 'admin' 
                                            ? 'bg-violet-50 text-violet-600 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20' 
                                            : 'bg-gray-50 text-gray-600 ring-gray-100 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700'
                                    }`}>
                                        {u.first_name?.[0]}{u.last_name?.[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate tracking-tight leading-none mb-1">
                                            {u.first_name} {u.last_name}
                                        </p>
                                        <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate leading-none">
                                            {u.email}
                                        </p>
                                    </div>
                                </div>
                            </td>

                            <td className="px-4 py-4 whitespace-nowrap w-1">
                                <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800 text-gray-600 dark:text-slate-400">
                                    {u.role}
                                </span>
                            </td>

                            <td className="px-4 py-4 whitespace-nowrap w-1">
                                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${
                                    u.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                                }`}>
                                    <span className={`h-2 w-2 rounded-full ${u.active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                    {u.active ? 'Active' : 'Locked'}
                                </div>
                            </td>

                            <td className="px-6 py-4 text-right w-1">
                                <div className="flex justify-end items-center gap-1 sm:group-hover:opacity-100 transition-opacity">
                                    <Link to={`/admin/users/${u.id}`} className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors">
                                        <MdVisibility size={18} />
                                    </Link>
                                    <button onClick={() => handleEditClick(u)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                                        <MdEdit size={18} />
                                    </button>
                                    <button onClick={() => setConfirmStatusUser(u)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                        {u.active ? <MdToggleOn size={22} className="text-emerald-500" /> : <MdToggleOff size={22} />}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>

    {/* Footer / Pagination: Sticky to bottom of the card */}
    {!loading && filteredUsers.length > pageSize && (
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                Showing <span className="font-bold text-gray-900 dark:text-white">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-bold text-gray-900 dark:text-white">{Math.min(currentPage * pageSize, filteredUsers.length)}</span> of <span className="font-bold text-gray-900 dark:text-white">{filteredUsers.length}</span>
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-400 hover:text-gray-900 disabled:opacity-20"
                >
                    <MdChevronLeft size={20} />
                </button>
                
                <div className="flex items-center gap-1">
                    {getPageNumbers().map(page => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`min-w-[32px] h-8 rounded-lg text-[11px] font-bold transition-all ${
                                currentPage === page 
                                ? 'bg-gray-900 text-white dark:bg-white dark:text-slate-900 shadow-lg shadow-gray-200 dark:shadow-none' 
                                : 'text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800'
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 text-gray-400 hover:text-gray-900 disabled:opacity-20"
                >
                    <MdChevronRight size={20} />
                </button>
            </div>
        </div>
    )}
            </motion.div>

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <ModalWrapper onClose={() => setIsEditModalOpen(false)}>
                        <ModalHeader title="Edit Member" subtitle={`${selectedUser?.first_name} ${selectedUser?.last_name}`} onClose={() => setIsEditModalOpen(false)} />
                        <form onSubmit={handleUpdate} className="p-7 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <FormField label="First Name" value={editData.first_name} onChange={(v) => setEditData({...editData, first_name: v})} required disabled={isUpdating} />
                                <FormField label="Last Name" value={editData.last_name} onChange={(v) => setEditData({...editData, last_name: v})} required disabled={isUpdating} />
                            </div>
                            <FormField label="Email Address" type="email" value={editData.email} onChange={(v) => setEditData({...editData, email: v})} required disabled={isUpdating} />
                            <FormField label="Phone Number" value={editData.phone_number} onChange={(v) => setEditData({...editData, phone_number: v})} disabled={isUpdating} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <FormSelect label="Gender" value={editData.gender} onChange={(v) => setEditData({...editData, gender: v})} options={[{ v: '', l: 'Select' }, { v: 'male', l: 'Male' }, { v: 'female', l: 'Female' }, { v: 'other', l: 'Other' }]} disabled={isUpdating} />
                                <FormSelect label="Marital Status" value={editData.marital_status} onChange={(v) => setEditData({...editData, marital_status: v})} options={[{ v: 'single', l: 'Single' }, { v: 'married', l: 'Married' }, { v: 'divorced', l: 'Divorced' }, { v: 'other', l: 'Other' }]} disabled={isUpdating} />
                            </div>

                            <div className="pt-3 flex gap-3">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 text-gray-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all">Cancel</button>
                                <button type="submit" disabled={isUpdating} className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all disabled:opacity-50">
                                    {isUpdating ? <SpinIcon /> : <MdSave size={14} />}
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </ModalWrapper>
                )}
            </AnimatePresence>

            {/* ── Confirm Status Toggle Modal ── */}
            <AnimatePresence>
                {confirmStatusUser && (
                    <ModalWrapper onClose={() => !statusLoading && setConfirmStatusUser(null)}>
                        <div className="p-7">
                            {/* Icon */}
                            <div className={`flex items-center justify-center w-14 h-14 rounded-2xl text-2xl mx-auto mb-4 ${confirmStatusUser.active ? 'bg-red-100 dark:bg-red-900/20 text-red-500' : 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600'}`}>
                                <MdWarning />
                            </div>
                            <h2 className="text-center font-bold text-gray-900 dark:text-white text-base mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                {confirmStatusUser.active ? 'Deactivate Account?' : 'Activate Account?'}
                            </h2>
                            {/* User info */}
                            <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl p-3 mb-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] uppercase ${
                                    confirmStatusUser.role === 'admin' ? 'bg-violet-100 dark:bg-violet-900/20 text-violet-600'
                                    : confirmStatusUser.role === 'staff' ? 'bg-sky-100 dark:bg-sky-900/20 text-sky-600'
                                    : 'bg-gray-200 dark:bg-slate-700 text-gray-500'
                                }`}>
                                    {confirmStatusUser.first_name?.[0]}{confirmStatusUser.last_name?.[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{confirmStatusUser.first_name} {confirmStatusUser.last_name}</p>
                                    <p className="text-xs text-gray-400 dark:text-slate-500">{confirmStatusUser.email}</p>
                                </div>
                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ml-auto ${confirmStatusUser.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${confirmStatusUser.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    {confirmStatusUser.active ? 'Active' : 'Locked'}
                                </span>
                            </div>
                            <p className="text-center text-sm text-gray-500 dark:text-slate-400 mb-6">
                                {confirmStatusUser.active
                                    ? 'This will immediately restrict their access to the platform.'
                                    : 'This will restore their access to the platform.'}
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setConfirmStatusUser(null)} disabled={statusLoading}
                                    className="flex-1 py-3 font-semibold text-xs uppercase tracking-wider text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all disabled:opacity-50">
                                    Cancel
                                </button>
                                <button onClick={handleStatusToggleConfirm} disabled={statusLoading}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 ${confirmStatusUser.active ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                                    {statusLoading ? <SpinIcon /> : null}
                                    {statusLoading ? 'Processing...' : confirmStatusUser.active ? 'Yes, Deactivate' : 'Yes, Activate'}
                                </button>
                            </div>
                        </div>
                    </ModalWrapper>
                )}
            </AnimatePresence>

            {/* Account Info Footer */}
            <motion.div variants={itemVariants} className="mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 p-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-gray-900 dark:text-white text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>Agritronix Control</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">
                            Administrator Management Interface · Farm Management System v1.0.0
                        </p>
                    </div>
                    {/* <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/15 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                        Active Oversight
                    </span> */}
                </div>
            </motion.div>
        </motion.div>
    </DashboardLayout>
);
};

// ─── Shared Sub-components ──────────────────────────────────────────

const ModalWrapper = ({ children, onClose }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
        />
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 border border-gray-100 dark:border-slate-800/70"
        >
            {children}
        </motion.div>
    </div>
);

const ModalHeader = ({ title, subtitle, onClose }) => (
    <div className="px-7 py-5 border-b border-gray-100 dark:border-slate-800/70 flex justify-between items-center">
        <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-base" style={{ fontFamily: "'Outfit', sans-serif" }}>{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all group">
            <MdClose size={18} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
    </div>
);

const FormField = ({ label, type = 'text', value, onChange, required = false, placeholder = '', disabled = false }) => (
    <div>
        <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
        <input
            type={type} required={required} value={value} placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
    </div>
);

const FormSelect = ({ label, value, onChange, options, disabled = false }) => (
    <div>
        <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
        <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
    </div>
);

const SpinIcon = () => (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
);

const LoadingScreen = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center animate-pulse">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                </svg>
            </div>
            <p className="text-sm font-medium text-gray-400 dark:text-slate-500">Loading dashboard...</p>
        </div>
    </div>
);

export default AdminDashboard;
