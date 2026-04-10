import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    MdSearch, MdEdit, MdVisibility, MdClose,
    MdPeople, MdAdminPanelSettings, MdBadge, MdInventory2
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
            marital_status: u.marital_status || 'single',
            role: u.role || 'user',
            active: u.active
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
            <div className="p-6 lg:p-10 page-enter">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{fontFamily: "'Outfit', sans-serif"}}>
                            {getGreeting()}, {user?.first_name}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Here's what's happening with the farm today.</p>
                    </div>
                    <div className="relative group w-full sm:w-auto">
                        <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search members..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm w-full sm:w-72 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
                        />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {statCards.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08, duration: 0.4, ease: 'easeOut' }}
                            className={`stat-accent ${stat.accent} bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800/70 hover:shadow-lg hover:shadow-gray-100/50 dark:hover:shadow-slate-900/50 hover:-translate-y-0.5 transition-all duration-300 cursor-default`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${stat.iconBg}`}>
                                    {stat.icon}
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white" style={{fontFamily: "'Outfit', sans-serif"}}>{stat.value}</h3>
                            <p className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Users Table */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 overflow-hidden"
                >
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800/70 flex justify-between items-center">
                        <div>
                            <h2 className="font-bold text-gray-900 dark:text-white text-base" style={{fontFamily: "'Outfit', sans-serif"}}>Active Members</h2>
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{users.length} total records</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {stats.active} Online
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/60 dark:bg-slate-800/30 border-b border-gray-100 dark:border-slate-800/70">
                                    <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Member</th>
                                    <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Role</th>
                                    <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="skeleton w-9 h-9 rounded-xl" /><div><div className="skeleton h-3.5 w-32 mb-2" /><div className="skeleton h-2.5 w-44" /></div></div></td>
                                            <td className="px-6 py-4"><div className="skeleton h-5 w-16 rounded-md" /></td>
                                            <td className="px-6 py-4"><div className="skeleton h-5 w-14 rounded-md" /></td>
                                            <td className="px-6 py-4"><div className="skeleton h-5 w-16 rounded-md ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-16 text-center">
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
                                    <motion.tr
                                        key={u.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="table-row-hover group"
                                    >
                                        <td className="px-6 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[11px] uppercase shrink-0 ${
                                                    u.role === 'admin'
                                                        ? 'bg-violet-100 dark:bg-violet-900/20 text-violet-600'
                                                        : u.role === 'staff'
                                                            ? 'bg-sky-100 dark:bg-sky-900/20 text-sky-600'
                                                            : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                                                }`}>
                                                    {u.first_name?.[0]}{u.last_name?.[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{u.first_name} {u.last_name}</p>
                                                    <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5">
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
                                        <td className="px-6 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${u.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                {u.active ? 'Active' : 'Locked'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-right">
                                            <div className="flex justify-end gap-1 group-hover:opacity-100 transition-opacity">
                                                <Link
                                                    to={`/admin/users/${u.id}`}
                                                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/15 rounded-lg transition-all"
                                                    title="View Profile"
                                                >
                                                    <MdVisibility size={16} />
                                                </Link>
                                                <button
                                                    onClick={() => handleEditClick(u)}
                                                    className="p-2 text-gray-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/15 rounded-lg transition-all"
                                                    title="Edit"
                                                >
                                                    <MdEdit size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setIsEditModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 border border-gray-100 dark:border-slate-800/70"
                        >
                            <div className="px-7 py-5 border-b border-gray-100 dark:border-slate-800/70 flex justify-between items-center">
                                <div>
                                    <h2 className="font-bold text-gray-900 dark:text-white text-base" style={{fontFamily: "'Outfit', sans-serif"}}>Edit Member</h2>
                                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{selectedUser?.first_name} {selectedUser?.last_name}</p>
                                </div>
                                <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                                    <MdClose size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleUpdate} className="p-7 space-y-5">
                                <div className="grid grid-cols-2 gap-3">
                                    <ModalInput label="First Name" value={editData.first_name} onChange={(v) => setEditData({...editData, first_name: v})} required />
                                    <ModalInput label="Last Name" value={editData.last_name} onChange={(v) => setEditData({...editData, last_name: v})} required />
                                </div>
                                <ModalInput label="Email Address" type="email" value={editData.email} onChange={(v) => setEditData({...editData, email: v})} required />
                                <div className="grid grid-cols-2 gap-3">
                                    <ModalInput label="Phone Number" value={editData.phone_number} onChange={(v) => setEditData({...editData, phone_number: v})} required />
                                    <ModalSelect label="Gender" value={editData.gender} onChange={(v) => setEditData({...editData, gender: v})} options={[{v: '', l: 'Select'}, {v: 'male', l: 'Male'}, {v: 'female', l: 'Female'}, {v: 'other', l: 'Other'}]} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <ModalSelect label="Marital Status" value={editData.marital_status} onChange={(v) => setEditData({...editData, marital_status: v})} options={[{v: 'single', l: 'Single'}, {v: 'married', l: 'Married'}, {v: 'divorced', l: 'Divorced'}, {v: 'other', l: 'Other'}]} />
                                    <ModalSelect label="Access Role" value={editData.role} onChange={(v) => setEditData({...editData, role: v})} options={[{v: 'user', l: 'Customer'}, {v: 'staff', l: 'Staff'}, {v: 'admin', l: 'Admin'}]} />
                                </div>

                                {/* Account Status Toggle */}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Account Status</label>
                                    <div className="flex rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 p-1">
                                        <button type="button" onClick={() => setEditData({...editData, active: true})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${editData.active ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}>Active</button>
                                        <button type="button" onClick={() => setEditData({...editData, active: false})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${!editData.active ? 'bg-red-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Restricted</button>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 text-gray-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={isUpdating} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all disabled:opacity-50">
                                        {isUpdating ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

// ─── Sub-components ─────────────────────────────────────────────

const ModalInput = ({ label, value, onChange, type = "text", required = false }) => (
    <div>
        <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
        <input
            type={type}
            required={required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-gray-300"
        />
    </div>
);

const ModalSelect = ({ label, value, onChange, options }) => (
    <div>
        <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
        <select
            required
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
        >
            {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
    </div>
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
