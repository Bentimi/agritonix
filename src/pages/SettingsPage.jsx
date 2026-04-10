import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import {
    MdDarkMode, MdLightMode, MdSecurity, MdKey, MdBlock, MdWarning,
    MdPalette, MdCheck, MdPerson, MdArrowForward
} from 'react-icons/md';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { AnimatePresence } from 'framer-motion';
import { MdClose, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { useNavigate } from 'react-router';

const SettingsPage = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    // Change Password
    const [isChangingPw, setIsChangingPw] = useState(false);
    const [pwData, setPwData] = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
    const [isPwSaving, setIsPwSaving] = useState(false);

    // Deactivate
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [isDeactivateLoading, setIsDeactivateLoading] = useState(false);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (pwData.new_password !== pwData.confirm_password) { toast.error('Passwords do not match'); return; }
        if (pwData.new_password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        setIsPwSaving(true);
        try {
            const res = await api.put('/user/change-password', { current_password: pwData.current_password, new_password: pwData.new_password });
            if (res.data.status === 'success') {
                toast.success('Password changed successfully');
                setIsChangingPw(false);
                setPwData({ current_password: '', new_password: '', confirm_password: '' });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        }
        setIsPwSaving(false);
    };

    const handleDeactivate = async () => {
        setIsDeactivateLoading(true);
        try {
            const res = await api.patch(`/user/active-status/${user?.id}`);
            if (res.data.status === 'success') {
                toast.success('Account deactivated. Logging out...');
                setTimeout(() => { logout(); navigate('/signin'); }, 1500);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to deactivate');
            setIsDeactivateLoading(false);
            setIsDeactivating(false);
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 14 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
    };

    return (
        <DashboardLayout activeNav="settings">
            <motion.div
                initial="hidden" animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }}
                className="p-6 lg:p-10"
            >
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <motion.div variants={itemVariants} className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Settings</h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Manage your preferences and account settings</p>
                    </motion.div>

                    <div className="space-y-5">

                        {/* ── My Profile Link ── */}
                        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800/70 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center"><MdPerson /></div>
                                <div>
                                    <h2 className="font-bold text-gray-900 dark:text-white text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>Account</h2>
                                    <p className="text-xs text-gray-400 dark:text-slate-500">Your profile and personal information</p>
                                </div>
                            </div>
                            <div className="p-5">
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-900/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/5 transition-all group"
                                >
                                    <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-sm uppercase shrink-0">
                                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{user?.first_name} {user?.last_name}</p>
                                        <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{user?.email}</p>
                                        <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                            user?.role === 'admin' ? 'bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400'
                                            : user?.role === 'staff' ? 'bg-sky-100 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400'
                                            : 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                        }`}>{user?.role}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:gap-2.5 transition-all">
                                        View Profile <MdArrowForward size={16} />
                                    </div>
                                </button>
                            </div>
                        </motion.div>

                        {/* ── Appearance ── */}
                        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800/70 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/20 text-violet-600 flex items-center justify-center"><MdPalette /></div>
                                <div>
                                    <h2 className="font-bold text-gray-900 dark:text-white text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>Appearance</h2>
                                    <p className="text-xs text-gray-400 dark:text-slate-500">Customize how the dashboard looks</p>
                                </div>
                            </div>
                            <div className="p-6">
                                <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">Theme</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <ThemeOption
                                        label="Light Mode" icon={<MdLightMode className="text-xl text-amber-500" />}
                                        active={theme === 'light'} onClick={() => theme !== 'light' && toggleTheme()}
                                        preview="bg-gray-50 border-gray-200"
                                    />
                                    <ThemeOption
                                        label="Dark Mode" icon={<MdDarkMode className="text-xl text-blue-400" />}
                                        active={theme === 'dark'} onClick={() => theme !== 'dark' && toggleTheme()}
                                        preview="bg-slate-800 border-slate-600"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* ── Security ── */}
                        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800/70 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center"><MdSecurity /></div>
                                <div>
                                    <h2 className="font-bold text-gray-900 dark:text-white text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>Security</h2>
                                    <p className="text-xs text-gray-400 dark:text-slate-500">Manage your account security</p>
                                </div>
                            </div>
                            <div className="divide-y divide-gray-50 dark:divide-slate-800/50">
                                <SettingRow
                                    icon={<MdKey />} iconBg="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600"
                                    label="Change Password" description="Update your account password"
                                    action={
                                        <button onClick={() => setIsChangingPw(true)}
                                            className="text-xs font-semibold px-3 py-1.5 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 rounded-lg transition-all">
                                            Update
                                        </button>
                                    }
                                />
                                <SettingRow
                                    icon={<MdBlock />} iconBg="bg-red-100 dark:bg-red-900/20 text-red-500"
                                    label="Deactivate Account" description="Permanently restrict your access"
                                    action={
                                        <button onClick={() => setIsDeactivating(true)}
                                            className="text-xs font-semibold px-3 py-1.5 border border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all">
                                            Deactivate
                                        </button>
                                    }
                                />
                            </div>
                        </motion.div>

                        {/* ── About ── */}
                        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>Agritronix</p>
                                    <p className="text-xs text-gray-400 dark:text-slate-500">Farm Management System · v1.0.0</p>
                                </div>
                                <span className="ml-auto text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/15 px-2 py-1 rounded-lg uppercase tracking-wider">Stable</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Change Password Modal */}
            <AnimatePresence>
                {isChangingPw && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsChangingPw(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 border border-gray-100 dark:border-slate-800/70">
                            <div className="px-7 py-5 border-b border-gray-100 dark:border-slate-800/70 flex justify-between items-center">
                                <div>
                                    <h2 className="font-bold text-gray-900 dark:text-white text-base" style={{ fontFamily: "'Outfit', sans-serif" }}>Change Password</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">Enter your current and new password</p>
                                </div>
                                <button onClick={() => setIsChangingPw(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                                    <MdClose size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleChangePassword} className="p-7 space-y-4">
                                {[
                                    { key: 'current_password', label: 'Current Password', showKey: 'current' },
                                    { key: 'new_password', label: 'New Password', showKey: 'new' },
                                    { key: 'confirm_password', label: 'Confirm New Password', showKey: 'confirm' },
                                ].map(({ key, label, showKey }) => (
                                    <div key={key}>
                                        <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
                                        <div className="relative">
                                            <input type={showPw[showKey] ? 'text' : 'password'} required value={pwData[key]}
                                                onChange={(e) => setPwData({ ...pwData, [key]: e.target.value })}
                                                className="w-full px-4 py-2.5 pr-10 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" />
                                            <button type="button" onClick={() => setShowPw(s => ({ ...s, [showKey]: !s[showKey] }))}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                                {showPw[showKey] ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {pwData.new_password && pwData.confirm_password && pwData.new_password !== pwData.confirm_password && (
                                    <p className="text-xs text-red-500 font-medium flex items-center gap-1"><MdWarning size={12} /> Passwords do not match</p>
                                )}
                                <div className="pt-3 flex gap-3">
                                    <button type="button" onClick={() => setIsChangingPw(false)} className="flex-1 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all">Cancel</button>
                                    <button type="submit" disabled={isPwSaving} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50">
                                        {isPwSaving ? 'Saving...' : 'Update Password'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Deactivate Confirm Modal */}
            <AnimatePresence>
                {isDeactivating && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isDeactivateLoading && setIsDeactivating(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative z-10 border border-gray-100 dark:border-slate-800/70 p-7">
                            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/20 text-red-500 text-2xl mx-auto mb-4"><MdWarning /></div>
                            <h2 className="text-center font-bold text-gray-900 dark:text-white text-base mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>Deactivate Account?</h2>
                            <p className="text-center text-sm text-gray-500 dark:text-slate-400 mb-6">This will restrict your access immediately. You'll need an admin to reactivate.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setIsDeactivating(false)} disabled={isDeactivateLoading}
                                    className="flex-1 py-3 font-semibold text-xs uppercase tracking-wider text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50">Cancel</button>
                                <button onClick={handleDeactivate} disabled={isDeactivateLoading}
                                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50">
                                    {isDeactivateLoading ? 'Processing...' : 'Yes, Deactivate'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

// Sub-components
const SettingRow = ({ icon, iconBg, label, description, action }) => (
    <div className="flex items-center justify-between p-5 gap-4">
        <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${iconBg}`}>{icon}</div>
            <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">{description}</p>
            </div>
        </div>
        <div className="shrink-0">{action}</div>
    </div>
);

const ThemeOption = ({ label, icon, active, onClick, preview }) => (
    <button onClick={onClick}
        className={`relative p-4 rounded-xl border-2 transition-all text-left group ${active ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'}`}>
        <div className={`h-10 rounded-lg border mb-3 ${preview}`} />
        <div className="flex items-center gap-2">
            {icon}
            <span className="text-xs font-semibold text-gray-900 dark:text-white">{label}</span>
        </div>
        {active && (
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center">
                <MdCheck className="text-white text-[10px]" />
            </div>
        )}
    </button>
);

export default SettingsPage;
