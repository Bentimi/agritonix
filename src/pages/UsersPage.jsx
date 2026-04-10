import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    MdSearch, MdVisibility, MdChevronLeft, MdChevronRight,
    MdAdminPanelSettings, MdToggleOn, MdToggleOff, MdCheck,
    MdWarning, MdClose, MdPeople, MdFilterList, MdGroup, MdSupervisorAccount, MdWork, MdPerson, MdCheckCircle
} from 'react-icons/md';
import { Link } from 'react-router';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';

const UsersPage = () => {
    const { user: authUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [filterRole, setFilterRole] = useState('all');

    // Role assignment
    const [roleEditing, setRoleEditing] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [roleLoading, setRoleLoading] = useState(false);

    // Confirm status modal
    const [confirmUser, setConfirmUser] = useState(null);
    const [statusLoading, setStatusLoading] = useState(false);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => { setDebouncedSearch(searchTerm); setCurrentPage(1); }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch users - improved with better error handling
    useEffect(() => {
        const fetchUsers = async () => {
            if (!authUser) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const res = await api.get('/user/all-users');
                if (res.data?.status === 'success' && Array.isArray(res.data.data)) {
                    setUsers(res.data.data);
                } else {
                    toast.error('Invalid data format received');
                    setUsers([]);
                }
            } catch (error) {
                console.error('Failed to load users:', error);
                toast.error(error.response?.data?.message || 'Failed to load users');
                setUsers([]);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [authUser]);

    const filteredUsers = useMemo(() => {
        let filtered = users.filter(u =>
            `${u.first_name} ${u.last_name}`.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            u.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            u.username?.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
        if (filterRole !== 'all') {
            filtered = filtered.filter(u => u.role === filterRole);
        }
        return filtered;
    }, [users, debouncedSearch, filterRole]);

    const totalPages = Math.ceil(filteredUsers.length / pageSize);
    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredUsers.slice(start, start + pageSize);
    }, [filteredUsers, currentPage, pageSize]);

    useEffect(() => { setCurrentPage(1); }, [pageSize]);

    const handleRoleAssign = async (userId) => {
        if (!selectedRole) return;
        setRoleLoading(true);
        try {
            const res = await api.put(`/user/role/${userId}`, { role: selectedRole });
            if (res.data.status === 'success') {
                toast.success('Role updated successfully');
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: selectedRole } : u));
                setRoleEditing(null);
                setSelectedRole('');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update role');
        }
        setRoleLoading(false);
    };

    const handleStatusToggleConfirm = async () => {
        if (!confirmUser) return;
        setStatusLoading(true);
        try {
            const res = await api.patch(`/user/active-status/${confirmUser.id}`);
            if (res.data.status === 'success') {
                toast.success('Account status updated');
                setUsers(prev => prev.map(u => u.id === confirmUser.id ? { ...u, active: !u.active } : u));
                setConfirmUser(null);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
        setStatusLoading(false);
    };

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
        admin: users.filter(u => u.role === 'admin').length,
        staff: users.filter(u => u.role === 'staff').length,
        customer: users.filter(u => u.role === 'user').length,
        active: users.filter(u => u.active).length,
        locked: users.filter(u => !u.active).length,
    }), [users]);

    const statCards = [
        { label: 'Total', value: stats.total, iconBg: 'bg-gray-100 dark:bg-gray-900/20 text-gray-600', icon: <MdGroup />, accent: 'stat-accent-gray' },
        { label: 'Admin', value: stats.admin, iconBg: 'bg-violet-100 dark:bg-violet-900/20 text-violet-600', icon: <MdSupervisorAccount />, accent: 'stat-accent-violet' },
        { label: 'Staff', value: stats.staff, iconBg: 'bg-sky-100 dark:bg-sky-900/20 text-sky-600', icon: <MdWork />, accent: 'stat-accent-sky' },
        { label: 'Customer', value: stats.customer, iconBg: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600', icon: <MdPerson />, accent: 'stat-accent-emerald' },
        { label: 'Active', value: stats.active, iconBg: 'bg-emerald-50 dark:bg-emerald-900/15 text-emerald-600', icon: <MdCheckCircle />, accent: 'stat-accent-emerald' },
    ];

    return (
        <DashboardLayout activeNav="users">
            <div className="p-6 lg:p-10 page-enter">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>All Users</h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">View and manage all registered members</p>
                    </div>
                    {!loading && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs font-semibold text-gray-600 dark:text-slate-300">
                            <MdPeople className="text-emerald-500" />
                            {filteredUsers.length} of {users.length} members
                        </span>
                    )}
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative group flex-1">
                        <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input type="text" placeholder="Search by name, email, or username..."
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm w-full dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
                        />
                        {searchTerm && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                {filteredUsers.length} results
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <MdFilterList className="text-gray-400" />
                        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
                            className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all">
                            <option value="all">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="staff">Staff</option>
                            <option value="user">Customer</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">Per page</label>
                        <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}
                            className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all">
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/60 dark:bg-slate-800/30 border-b border-gray-100 dark:border-slate-800/70">
                                    <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Member</th>
                                    <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Role</th>
                                    <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Manage</th>
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
                                            <td className="px-6 py-4"><div className="skeleton h-5 w-24 rounded-md" /></td>
                                            <td className="px-6 py-4"><div className="skeleton h-5 w-16 rounded-md ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : paginatedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                                                    <MdSearch className="text-2xl text-gray-300 dark:text-slate-600" />
                                                </div>
                                                <p className="text-sm font-semibold text-gray-400 dark:text-slate-500">No members found</p>
                                                <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">Try adjusting your search term</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedUsers.map((u) => (
                                    <tr key={u.id} className="table-row-hover group">
                                        {/* Member */}
                                        <td className="px-6 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[11px] uppercase shrink-0 ${
                                                    u.role === 'admin' ? 'bg-violet-100 dark:bg-violet-900/20 text-violet-600'
                                                    : u.role === 'staff' ? 'bg-sky-100 dark:bg-sky-900/20 text-sky-600'
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
                                        <td className="px-6 py-3.5"><RoleBadge role={u.role} /></td>
                                        <td className="px-6 py-3.5"><StatusBadge active={u.active} /></td>
                                        {/* Role Management */}
                                        <td className="px-6 py-3.5">
                                            {roleEditing === u.id ? (
                                                <div className="flex items-center gap-2">
                                                    <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}
                                                        className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all">
                                                        <option value="">Select role</option>
                                                        <option value="user">Customer</option>
                                                        <option value="staff">Staff</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                    <button onClick={() => handleRoleAssign(u.id)} disabled={!selectedRole || roleLoading}
                                                        className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-40">
                                                        {roleLoading ? <SpinIcon /> : <MdCheck size={14} />}
                                                    </button>
                                                    <button onClick={() => { setRoleEditing(null); setSelectedRole(''); }} className="text-xs text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => { setRoleEditing(u.id); setSelectedRole(u.role); }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-lg transition-all border border-gray-200 dark:border-slate-700">
                                                    <MdAdminPanelSettings size={14} /> Change Role
                                                </button>
                                            )}
                                        </td>
                                        {/* Actions */}
                                        <td className="px-6 py-3.5 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Link to={`/admin/users/${u.id}`} className="p-2 text-gray-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/15 rounded-lg transition-all border border-gray-200 dark:border-slate-700" title="View">
                                                    <MdVisibility size={16} />
                                                </Link>
                                                <button onClick={() => setConfirmUser(u)}
                                                    className={`p-2 rounded-lg transition-all border ${
                                                        u.active
                                                        ? 'text-red-500 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10'
                                                        : 'text-emerald-600 border-emerald-200 dark:border-emerald-900/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/10'
                                                    }`}
                                                    title={u.active ? 'Deactivate' : 'Activate'}>
                                                    {u.active ? <MdToggleOn size={18} /> : <MdToggleOff size={18} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && filteredUsers.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800/70 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <p className="text-xs text-gray-400 dark:text-slate-500">
                                Showing <span className="font-semibold text-gray-600 dark:text-slate-300">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-semibold text-gray-600 dark:text-slate-300">{Math.min(currentPage * pageSize, filteredUsers.length)}</span> of <span className="font-semibold text-gray-600 dark:text-slate-300">{filteredUsers.length}</span> members
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

            {/* ── Confirm Status Toggle Modal ── */}
            <AnimatePresence>
                {confirmUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => !statusLoading && setConfirmUser(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative z-10 border border-gray-100 dark:border-slate-800/70 p-7">
                            {/* Icon */}
                            <div className={`flex items-center justify-center w-14 h-14 rounded-2xl text-2xl mx-auto mb-4 ${confirmUser.active ? 'bg-red-100 dark:bg-red-900/20 text-red-500' : 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600'}`}>
                                <MdWarning />
                            </div>
                            <h2 className="text-center font-bold text-gray-900 dark:text-white text-base mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                {confirmUser.active ? 'Deactivate Account?' : 'Activate Account?'}
                            </h2>
                            {/* User info */}
                            <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl p-3 mb-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] uppercase ${
                                    confirmUser.role === 'admin' ? 'bg-violet-100 dark:bg-violet-900/20 text-violet-600'
                                    : confirmUser.role === 'staff' ? 'bg-sky-100 dark:bg-sky-900/20 text-sky-600'
                                    : 'bg-gray-200 dark:bg-slate-700 text-gray-500'
                                }`}>
                                    {confirmUser.first_name?.[0]}{confirmUser.last_name?.[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{confirmUser.first_name} {confirmUser.last_name}</p>
                                    <p className="text-xs text-gray-400 dark:text-slate-500">{confirmUser.email}</p>
                                </div>
                                <StatusBadge active={confirmUser.active} className="ml-auto shrink-0" />
                            </div>
                            <p className="text-center text-sm text-gray-500 dark:text-slate-400 mb-6">
                                {confirmUser.active
                                    ? 'This will immediately restrict their access to the platform.'
                                    : 'This will restore their access to the platform.'}
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setConfirmUser(null)} disabled={statusLoading}
                                    className="flex-1 py-3 font-semibold text-xs uppercase tracking-wider text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50">
                                    Cancel
                                </button>
                                <button onClick={handleStatusToggleConfirm} disabled={statusLoading}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 ${confirmUser.active ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                                    {statusLoading ? <SpinIcon /> : null}
                                    {statusLoading ? 'Processing...' : confirmUser.active ? 'Yes, Deactivate' : 'Yes, Activate'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

// ─── Badges & Helpers ─────────────────────────

const RoleBadge = ({ role }) => (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider ${
        role === 'admin' ? 'text-violet-600 bg-violet-50 dark:bg-violet-900/15 dark:text-violet-400'
        : role === 'staff' ? 'text-sky-600 bg-sky-50 dark:bg-sky-900/15 dark:text-sky-400'
        : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/15 dark:text-emerald-400'
    }`}>{role}</span>
);

const StatusBadge = ({ active }) => (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-500'}`} />
        {active ? 'Active' : 'Locked'}
    </span>
);

const SpinIcon = () => (
    <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
);


export default UsersPage;
