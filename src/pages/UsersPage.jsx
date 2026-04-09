import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    MdSearch, MdVisibility, MdEdit, MdChevronLeft, MdChevronRight,
    MdAdminPanelSettings, MdToggleOn, MdToggleOff, MdCheck
} from 'react-icons/md';
import { Link } from 'react-router';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';

const UsersPage = ({ tab = 'users' }) => {
    const { user: authUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Role assignment
    const [roleEditing, setRoleEditing] = useState(null); // user id being edited
    const [selectedRole, setSelectedRole] = useState('');
    const [roleLoading, setRoleLoading] = useState(false);

    // Status toggle
    const [statusLoading, setStatusLoading] = useState(null); // user id being toggled

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1); // reset to page 1 on search
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch users
    useEffect(() => {
        const fetchUsers = async () => {
            if (!authUser) return;
            try {
                const res = await api.get('/user/all-users');
                if (res.data.status === 'success') setUsers(res.data.data);
            } catch (error) {
                toast.error('Failed to load users');
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [authUser]);

    // Filter users based on debounced search
    const filteredUsers = useMemo(() => {
        return users.filter(u =>
            `${u.first_name} ${u.last_name}`.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            u.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            u.username?.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [users, debouncedSearch]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredUsers.length / pageSize);
    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredUsers.slice(start, start + pageSize);
    }, [filteredUsers, currentPage, pageSize]);

    // Reset page when page size changes
    useEffect(() => {
        setCurrentPage(1);
    }, [pageSize]);

    // Role assignment handler
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

    // Status toggle handler
    const handleStatusToggle = async (userId) => {
        setStatusLoading(userId);
        try {
            const res = await api.patch(`/user/active-status/${userId}`);
            if (res.data.status === 'success') {
                toast.success('Account status updated');
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: !u.active } : u));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
        setStatusLoading(null);
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

    const tabTitles = {
        users: 'All Users',
        roles: 'Assign Roles',
        status: 'Account Status'
    };

    const tabDescriptions = {
        users: 'View and manage all registered members',
        roles: 'Assign access roles to team members',
        status: 'Manage account activation and restrictions'
    };

    return (
        <DashboardLayout activeNav={tab === 'users' ? 'users' : tab === 'roles' ? 'roles' : 'status'}>
            <div className="p-6 lg:p-10 page-enter">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{fontFamily: "'Outfit', sans-serif"}}>
                            {tabTitles[tab]}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{tabDescriptions[tab]}</p>
                    </div>
                </div>

                {/* Controls Bar */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    {/* Search */}
                    <div className="relative group flex-1">
                        <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or username..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm w-full dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
                        />
                        {searchTerm && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                {filteredUsers.length} results
                            </span>
                        )}
                    </div>

                    {/* Page Size Selector */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">Per page</label>
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                        >
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
                                    {tab === 'users' && <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Role</th>}
                                    {tab === 'users' && <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Status</th>}
                                    {tab === 'roles' && <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Current Role</th>}
                                    {tab === 'roles' && <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Assign Role</th>}
                                    {tab === 'status' && <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Current Status</th>}
                                    {tab === 'status' && <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Action</th>}
                                    {tab === 'users' && <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                                {loading ? (
                                    [...Array(pageSize > 5 ? 5 : pageSize)].map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="skeleton w-9 h-9 rounded-xl" /><div><div className="skeleton h-3.5 w-32 mb-2" /><div className="skeleton h-2.5 w-44" /></div></div></td>
                                            <td className="px-6 py-4"><div className="skeleton h-5 w-16 rounded-md" /></td>
                                            <td className="px-6 py-4"><div className="skeleton h-5 w-14 rounded-md" /></td>
                                            {(tab === 'users') && <td className="px-6 py-4"><div className="skeleton h-5 w-16 rounded-md ml-auto" /></td>}
                                        </tr>
                                    ))
                                ) : paginatedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={tab === 'users' ? 4 : 3} className="px-6 py-16 text-center">
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
                                        {/* Member Column (shared) */}
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

                                        {/* ALL USERS TAB */}
                                        {tab === 'users' && (
                                            <>
                                                <td className="px-6 py-3.5">
                                                    <RoleBadge role={u.role} />
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <StatusBadge active={u.active} />
                                                </td>
                                                <td className="px-6 py-3.5 text-right">
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link to={`/admin/users/${u.id}`} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/15 rounded-lg transition-all" title="View">
                                                            <MdVisibility size={16} />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </>
                                        )}

                                        {/* ASSIGN ROLE TAB */}
                                        {tab === 'roles' && (
                                            <>
                                                <td className="px-6 py-3.5">
                                                    <RoleBadge role={u.role} />
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    {roleEditing === u.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                value={selectedRole}
                                                                onChange={(e) => setSelectedRole(e.target.value)}
                                                                className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
                                                            >
                                                                <option value="">Select role</option>
                                                                <option value="user">Customer</option>
                                                                <option value="staff">Staff</option>
                                                                <option value="admin">Admin</option>
                                                            </select>
                                                            <button
                                                                onClick={() => handleRoleAssign(u.id)}
                                                                disabled={!selectedRole || roleLoading}
                                                                className="p-1.5 gradient-bg text-white rounded-lg hover:shadow-md transition-all disabled:opacity-40"
                                                            >
                                                                {roleLoading ? (
                                                                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                                                ) : (
                                                                    <MdCheck size={14} />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => { setRoleEditing(null); setSelectedRole(''); }}
                                                                className="text-xs text-gray-400 hover:text-gray-600 font-medium"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => { setRoleEditing(u.id); setSelectedRole(u.role); }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-lg transition-all"
                                                        >
                                                            <MdAdminPanelSettings size={14} />
                                                            Change Role
                                                        </button>
                                                    )}
                                                </td>
                                            </>
                                        )}

                                        {/* ACCOUNT STATUS TAB */}
                                        {tab === 'status' && (
                                            <>
                                                <td className="px-6 py-3.5">
                                                    <StatusBadge active={u.active} />
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <button
                                                        onClick={() => handleStatusToggle(u.id)}
                                                        disabled={statusLoading === u.id}
                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                            u.active
                                                                ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10'
                                                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10'
                                                        } disabled:opacity-40`}
                                                    >
                                                        {statusLoading === u.id ? (
                                                            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                                        ) : u.active ? (
                                                            <MdToggleOff size={16} />
                                                        ) : (
                                                            <MdToggleOn size={16} />
                                                        )}
                                                        {u.active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {!loading && filteredUsers.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800/70 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <p className="text-xs text-gray-400 dark:text-slate-500">
                                Showing <span className="font-semibold text-gray-600 dark:text-slate-300">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-semibold text-gray-600 dark:text-slate-300">{Math.min(currentPage * pageSize, filteredUsers.length)}</span> of <span className="font-semibold text-gray-600 dark:text-slate-300">{filteredUsers.length}</span> members
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <MdChevronLeft size={18} />
                                </button>
                                {getPageNumbers().map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`min-w-[32px] h-8 rounded-lg text-xs font-bold transition-all ${
                                            currentPage === page
                                                ? 'gradient-bg text-white shadow-sm'
                                                : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <MdChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

// ─── Badges ─────────────────────────────────

const RoleBadge = ({ role }) => (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider ${
        role === 'admin' ? 'text-violet-600 bg-violet-50 dark:bg-violet-900/15 dark:text-violet-400'
        : role === 'staff' ? 'text-sky-600 bg-sky-50 dark:bg-sky-900/15 dark:text-sky-400'
        : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/15 dark:text-emerald-400'
    }`}>
        {role}
    </span>
);

const StatusBadge = ({ active }) => (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-500'}`} />
        {active ? 'Active' : 'Locked'}
    </span>
);

export default UsersPage;
