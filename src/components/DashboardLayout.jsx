import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MdDashboard, MdPeople, MdInventory, MdSettings, MdLogout,
    MdMenu, MdClose, MdDarkMode, MdLightMode, MdKeyboardArrowRight,
    MdPerson
} from 'react-icons/md';

const DashboardLayout = ({ children, activeNav }) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isAdmin = user?.role === 'admin';

    const isNavActive = (key) => {
        if (activeNav) return key === activeNav;
        const path = location.pathname;
        if (key === 'dashboard') return isAdmin ? path === '/admin' : path === '/dashboard';
        if (key === 'users') return path.startsWith('/admin/users');
        if (key === 'products') return path === '/admin/products';
        if (key === 'settings') return isAdmin ? path === '/admin/settings' : path === '/settings';
        if (key === 'profile') return path === '/profile';
        return false;
    };

    const isSubActive = (subPath) => {
        if (activeNav) {
            if (activeNav === 'users' && subPath === '/admin/users') return true;
            if (activeNav === 'roles' && subPath === '/admin/users/roles') return true;
            if (activeNav === 'status' && subPath === '/admin/users/status') return true;
            return false;
        }
        return location.pathname === subPath;
    };

    const dashboardLink = isAdmin ? '/admin' : '/dashboard';
    const settingsLink = isAdmin ? '/admin/settings' : '/settings';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex">
            {/* Mobile Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`w-[260px] bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800/70 flex flex-col fixed inset-y-0 z-50 transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                {/* Logo */}
                <div className="px-6 pt-8 pb-6">
                    <div className="flex items-center justify-between">
                        <Link to={dashboardLink} className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <div>
                                <span className="font-bold text-lg text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>Agritronix</span>
                                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium -mt-0.5">Farm Management</p>
                            </div>
                        </Link>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                            <MdClose size={20} />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="px-4 flex-1 overflow-y-auto">
                    <p className="text-[10px] font-bold text-gray-300 dark:text-slate-600 uppercase tracking-widest px-3 mb-3">Menu</p>
                    <div className="space-y-1">
                        {/* Dashboard */}
                        <NavLink to={dashboardLink} icon={<MdDashboard />} label="Dashboard" active={isNavActive('dashboard')} onClick={() => setSidebarOpen(false)} />

                        {/* Users — only for admins */}
                        {isAdmin && (
                            <NavLink to="/admin/users" icon={<MdPeople />} label="Users" active={isNavActive('users') || isNavActive('roles') || isNavActive('status')} onClick={() => setSidebarOpen(false)} />
                        )}

                        {/* Products — only for admin */}
                        {isAdmin && (
                            <NavLink to="/admin/products" icon={<MdInventory />} label="Products" active={isNavActive('products')} onClick={() => setSidebarOpen(false)} />
                        )}

                        {/* My Profile — for all users */}
                        <NavLink to="/profile" icon={<MdPerson />} label="My Profile" active={isNavActive('profile')} onClick={() => setSidebarOpen(false)} />

                        {/* Settings — for all users */}
                        <NavLink to={settingsLink} icon={<MdSettings />} label="Settings" active={isNavActive('settings')} onClick={() => setSidebarOpen(false)} />
                    </div>
                </nav>

                {/* Bottom Section */}
                <div className="p-4 mx-4 mb-4 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800/60">
                    <button
                        onClick={toggleTheme}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white text-[13px] font-medium transition-all mb-2"
                    >
                        <span className="text-lg">{theme === 'light' ? <MdDarkMode /> : <MdLightMode />}</span>
                        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                    </button>

                    <button
                        onClick={logout}
                        className="flex items-center gap-2.5 w-full px-3 py-2 mb-2 rounded-xl text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 text-[13px] font-medium transition-all"
                    >
                        <MdLogout className="text-lg" /> Sign Out
                    </button>

                    {/* User profile card */}
                    <button
                        onClick={() => { navigate('/profile'); setSidebarOpen(false); }}
                        className="flex items-center gap-3 px-3 py-2 w-full rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all group"
                        title="My Profile"
                    >
                        <div className="avatar-ring">
                            <div className="w-9 h-9 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase">
                                {user?.first_name?.[0]}{user?.last_name?.[0]}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.first_name} {user?.last_name}</p>
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">{user?.role}</p>
                        </div>
                        <MdPerson className="text-gray-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors text-base" />
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen">
                {/* Mobile Header */}
                <header className="lg:hidden bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800/70 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <MdMenu size={22} />
                    </button>
                    <span className="font-bold text-gray-900 dark:text-white text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>Agritronix</span>
                    <button onClick={() => navigate('/profile')} className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-[10px] uppercase hover:bg-emerald-700 transition-all">
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

// ─── Nav Components ──────────────────────────

const NavLink = ({ to, icon, label, active, onClick }) => (
    <Link to={to} onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group relative ${
            active
                ? 'bg-emerald-600 text-white'
                : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/60 hover:text-gray-900 dark:hover:text-white'
        }`}
    >
        <span className={`text-lg ${active ? 'text-white' : 'text-gray-400 dark:text-slate-500 group-hover:text-emerald-500'} transition-colors`}>{icon}</span>
        {label}
        {active && <MdKeyboardArrowRight className="ml-auto text-white/60" />}
    </Link>
);

const SubNavLink = ({ to, icon, label, active, onClick }) => (
    <Link to={to} onClick={onClick}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 ${
            active
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 font-semibold'
                : 'text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/40'
        }`}
    >
        <span className="text-base">{icon}</span>
        {label}
    </Link>
);

export default DashboardLayout;
