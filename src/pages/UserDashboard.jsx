import React from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
    MdPerson, MdSettings, MdKey, MdCalendarMonth,
    MdVerified, MdArrowForward, MdInventory, MdSecurity
} from 'react-icons/md';
import DashboardLayout from '../components/DashboardLayout';

const UserDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
    };

    const roleCfg = {
        admin: { bg: 'bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400', label: 'Admin' },
        staff: { bg: 'bg-sky-100 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400', label: 'Staff' },
        user: { bg: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400', label: 'Member' },
    };
    const roleStyle = roleCfg[user?.role] || roleCfg.user;

    const quickActions = [
        {
            icon: <MdPerson />,
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600',
            title: 'My Profile',
            description: 'View and edit your personal information',
            action: () => navigate('/profile'),
        },
        {
            icon: <MdKey />,
            iconBg: 'bg-amber-100 dark:bg-amber-900/20 text-amber-600',
            title: 'Change Password',
            description: 'Update your account password',
            action: () => navigate('/settings'),
        },
        {
            icon: <MdSettings />,
            iconBg: 'bg-sky-100 dark:bg-sky-900/20 text-sky-600',
            title: 'Settings',
            description: 'Manage preferences and security',
            action: () => navigate('/settings'),
        },
        {
            icon: <MdSecurity />,
            iconBg: 'bg-violet-100 dark:bg-violet-900/20 text-violet-600',
            title: 'Account Security',
            description: 'Review your account status and access',
            action: () => navigate('/profile'),
        },
    ];

    return (
        <DashboardLayout activeNav="dashboard">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="p-4 sm:p-6 lg:p-10"
            >
                <div className="max-w-4xl mx-auto">
                    {/* Welcome Header */}
                    <motion.div variants={itemVariants} className="mb-8">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                Welcome back, {user?.first_name}!
                            </h1>
                            {user?.active && <MdVerified className="text-emerald-500 text-xl" />}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                            Here's your account overview. Manage your profile and settings from here.
                        </p>
                    </motion.div>

                    {/* Profile Summary Card */}
                    <motion.div variants={itemVariants} className="relative bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 p-7 mb-6 overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600 rounded-t-2xl" />
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                                <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white">
                                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                                </div>
                                {user?.active && (
                                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                        <MdVerified className="text-white text-[10px]" />
                                    </span>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center sm:text-left">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                    {user?.first_name} {user?.last_name}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">
                                    @{user?.username} · {user?.email}
                                </p>
                                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${roleStyle.bg}`}>
                                        {roleStyle.label}
                                    </span>
                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${user?.active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/15 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/15 dark:text-red-400'}`}>
                                        ● {user?.active ? 'Active' : 'Locked'}
                                    </span>
                                    {user?.last_login && (
                                        <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 flex items-center gap-1">
                                            <MdCalendarMonth className="text-xs" />
                                            Last login: {new Date(user.last_login).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* View Profile Button */}
                            <button
                                onClick={() => navigate('/profile')}
                                className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all"
                            >
                                View Profile <MdArrowForward size={16} />
                            </button>
                        </div>
                    </motion.div>

                    {/* Quick Actions Grid */}
                    <motion.div variants={itemVariants} className="mb-2">
                        <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-1">Quick Actions</h3>
                    </motion.div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {quickActions.map((action, i) => (
                            <motion.button
                                key={i}
                                variants={itemVariants}
                                onClick={action.action}
                                className="group text-left bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 p-6 hover:border-emerald-200 dark:hover:border-emerald-900/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${action.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                                        {action.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                            {action.title}
                                        </h4>
                                        <p className="text-xs text-gray-400 dark:text-slate-500">
                                            {action.description}
                                        </p>
                                    </div>
                                    <MdArrowForward className="text-gray-300 dark:text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all mt-1" />
                                </div>
                            </motion.button>
                        ))}
                    </div>

                    {/* Account Info Footer */}
                    <motion.div variants={itemVariants} className="mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-900 dark:text-white text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>Agritronix</p>
                                <p className="text-xs text-gray-400 dark:text-slate-500">
                                    Member since {user?.date_joined ? new Date(user.date_joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                                </p>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/15 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                {roleStyle.label}
                            </span>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </DashboardLayout>
    );
};

export default UserDashboard;
