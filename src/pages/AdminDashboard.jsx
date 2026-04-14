import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    MdSearch, MdEdit, MdVisibility, MdClose, MdSave, MdLock, MdWarning, MdPerson, MdEmail, MdPhone, MdBadge, MdSecurity, MdCalendarMonth, MdVerified, MdKey, MdBlock, MdToggleOn, MdToggleOff, MdAdminPanelSettings, MdPeople, MdInventory2
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

    if (authLoading) return <LoadingScreen />;

    const statCards = [
        { label: 'Admins', value: stats.admins, icon: <MdAdminPanelSettings />, accent: 'stat-accent-violet', iconBg: 'bg-violet-100 dark:bg-violet-900/20 text-violet-600' },
        { label: 'Staff', value: stats.staff, icon: <MdBadge />, accent: 'stat-accent-sky', iconBg: 'bg-sky-100 dark:bg-sky-900/20 text-sky-600' },
        { label: 'Users', value: stats.customers, icon: <MdPeople />, accent: 'stat-accent-emerald', iconBg: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600' },
        { label: 'Inventory', value: stats.inventory, icon: <MdInventory2 />, accent: 'stat-accent-amber', iconBg: 'bg-amber-100 dark:bg-amber-900/20 text-amber-600' },
    ];

    return (
        <DashboardLayout activeNav="dashboard">
            <div className="p-4 sm:p-6 lg:p-10 page-enter max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{fontFamily: "'Outfit', sans-serif"}}>
                            {getGreeting()}, {user?.first_name}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Here's what's happening with the farm today.</p>
                    </div>
                </div>
                {!loading && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs font-semibold text-gray-600 dark:text-slate-300 mb-6">
                        <MdPeople className="text-emerald-500" />
                        {filteredUsers.length} of {users.length} members
                    </span>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
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
                            <input type="text" placeholder="Search by name or email..."
                                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm w-full dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-400"
                            />
                            {searchTerm && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                    {filteredUsers.length} results
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800/70 overflow-hidden w-full">
                    <div className="table-wrapper">
                        <table className="w-full text-left min-w-[700px]">
                            <thead>
                                <tr className="bg-gray-50/60 dark:bg-slate-800/30 border-b border-gray-100 dark:border-slate-800/70">
                                    <th className="px-2 sm:px-4 py-2 text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Member</th>
                                    <th className="px-2 sm:px-3 py-2 text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Role</th>
                                    <th className="px-2 sm:px-3 py-2 text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                                    <th className="px-2 sm:px-3 py-2 text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-2 sm:px-4 py-3"><div className="flex items-center gap-2"><div className="w-6 h-6 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gray-200 dark:bg-slate-700 animate-pulse shrink-0" /><div className="min-w-0"><div className="h-2.5 w-16 sm:w-32 bg-gray-200 dark:bg-slate-700 rounded animate-pulse mb-1" /><div className="h-2 w-12 sm:w-24 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" /></div></div></td>
                                            <td className="px-2 sm:px-3 py-3"><div className="h-3 w-12 sm:w-16 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                                            <td className="px-2 sm:px-3 py-3"><div className="h-3 w-10 sm:w-14 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                                            <td className="px-2 sm:px-4 py-3 text-right"><div className="h-5 w-8 sm:w-16 bg-gray-200 dark:bg-slate-700 rounded-lg ml-auto animate-pulse" /></td>
                                        </tr>
                                    ))
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-2 sm:px-4 py-8 sm:py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                                                    <MdSearch className="text-2xl text-gray-300 dark:text-slate-600" />
                                                </div>
                                                <p className="text-sm font-semibold text-gray-400 dark:text-slate-500">No members found</p>
                                                <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">Try adjusting your search term</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.map((u, i) => (
                                    <tr key={u.id} className="table-row-hover group">
                                        {/* Member */}
                                        <td className="px-2 sm:px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-[9px] sm:text-[11px] uppercase shrink-0 ${
                                                    u.role === 'admin' ? 'bg-violet-100 dark:bg-violet-900/20 text-violet-600'
                                                    : u.role === 'staff' ? 'bg-sky-100 dark:bg-sky-900/20 text-sky-600'
                                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                                                }`}>
                                                    {u.first_name?.[0]}{u.last_name?.[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm truncate">{u.first_name} {u.last_name}</p>
                                                    <p className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-500 truncate hidden sm:block">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-2 sm:px-3 py-2">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider ${
                                                u.role === 'admin'
                                                    ? 'text-violet-600 bg-violet-50 dark:bg-violet-900/15 dark:text-violet-400'
                                                    : u.role === 'staff'
                                                        ? 'text-sky-600 bg-sky-50 dark:bg-sky-900/15 dark:text-sky-400'
                                                        : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/15 dark:text-emerald-400'
                                            }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-2 sm:px-3 py-2">
                                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${u.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                {u.active ? 'Active' : 'Locked'}
                                            </span>
                                        </td>
                                        {/* Actions */}
                                        <td className="px-2 sm:px-3 py-2 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Link to={`/admin/users/${u.id}`} className="p-1 text-gray-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/15 rounded transition-all border border-gray-200 dark:border-slate-700" title="View">
                                                    <MdVisibility size={10} />
                                                </Link>
                                                {(!user || user.role === 'admin' || (user.role === 'staff' && u.role === 'user')) ? (
                                                    <>
                                                        <button onClick={() => handleEditClick(u)}
                                                            className="p-1 text-gray-500 dark:text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/15 rounded transition-all border border-gray-200 dark:border-slate-700" title="Edit">
                                                            <MdEdit size={10} />
                                                        </button>
                                                        <button onClick={() => setConfirmStatusUser(u)}
                                                            className={`p-1 rounded transition-all border ${
                                                                u.active
                                                                ? 'text-red-500 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10'
                                                                : 'text-emerald-600 border-emerald-200 dark:border-emerald-900/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/10'
                                                            }`}
                                                            title={u.active ? 'Deactivate' : 'Activate'}>
                                                            {u.active ? <MdToggleOn size={12} /> : <MdToggleOff size={12} />}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="p-1 text-gray-300 dark:text-slate-600 border border-transparent" title="No permission"><MdEdit size={10} /></div>
                                                        <div className="p-1 text-gray-300 dark:text-slate-600 border border-transparent" title="No permission">{u.active ? <MdToggleOn size={12} /> : <MdToggleOff size={12} />}</div>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <ModalWrapper onClose={() => setIsEditModalOpen(false)}>
                        <ModalHeader title="Edit Member" subtitle={`${selectedUser?.first_name} ${selectedUser?.last_name}`} onClose={() => setIsEditModalOpen(false)} />
                        <form onSubmit={handleUpdate} className="p-7 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <FormField label="First Name" value={editData.first_name} onChange={(v) => setEditData({...editData, first_name: v})} required />
                                <FormField label="Last Name" value={editData.last_name} onChange={(v) => setEditData({...editData, last_name: v})} required />
                            </div>
                            <FormField label="Email Address" type="email" value={editData.email} onChange={(v) => setEditData({...editData, email: v})} required />
                            <FormField label="Phone Number" value={editData.phone_number} onChange={(v) => setEditData({...editData, phone_number: v})} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <FormSelect label="Gender" value={editData.gender} onChange={(v) => setEditData({...editData, gender: v})} options={[{ v: '', l: 'Select' }, { v: 'male', l: 'Male' }, { v: 'female', l: 'Female' }, { v: 'other', l: 'Other' }]} />
                                <FormSelect label="Marital Status" value={editData.marital_status} onChange={(v) => setEditData({...editData, marital_status: v})} options={[{ v: 'single', l: 'Single' }, { v: 'married', l: 'Married' }, { v: 'divorced', l: 'Divorced' }, { v: 'other', l: 'Other' }]} />
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
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all">
            <MdClose size={18} />
        </button>
    </div>
);

const FormField = ({ label, type = 'text', value, onChange, required = false, placeholder = '' }) => (
    <div>
        <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
        <input
            type={type} required={required} value={value} placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
        />
    </div>
);

const FormSelect = ({ label, value, onChange, options }) => (
    <div>
        <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
        <select value={value} onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all">
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
