import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { MdEdit, MdClose, MdSave, MdLock, MdWarning, MdPerson, MdEmail, MdPhone, MdBadge, MdSecurity, MdCalendarMonth, MdVerified, MdKey, MdBlock, MdVisibilityOff, MdVisibility, MdCheck } from 'react-icons/md';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';

const ProfilePage = () => {
    const { user, updateUserProfile, logout } = useAuth();
    const navigate = useNavigate();

    // Edit Profile State
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    // Change Password State
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    const [isPasswordSaving, setIsPasswordSaving] = useState(false);

    // Deactivate Account State
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [isDeactivateLoading, setIsDeactivateLoading] = useState(false);

    const openEditModal = () => {
        setEditData({
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            email: user?.email || '',
            phone_number: user?.phone_number || '',
            gender: user?.gender || '',
            marital_status: user?.marital_status || 'single',
        });
        setIsEditing(true);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const result = await updateUserProfile(user.id, editData);
        if (result?.success) {
            toast.success('Profile updated successfully');
            setIsEditing(false);
        } else {
            toast.error(result?.message || 'Update failed');
        }
        setIsSaving(false);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.error('New passwords do not match');
            return;
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])/;
        if (passwordData.new_password.length < 8) {
            toast.error('New password must be at least 8 characters');
            return;
        }
        if (!passwordRegex.test(passwordData.new_password)) {
            toast.error('New password must include uppercase, lowercase, number, and a special character (!@#$%^&*)');
            return;
        }
        setIsPasswordSaving(true);
        try {
            const res = await api.put('/user/change-password', {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password,
            });
            if (res.data.status === 'success') {
                toast.success('Password changed successfully');
                setIsChangingPassword(false);
                setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        }
        setIsPasswordSaving(false);
    };

    const handleDeactivateAccount = async () => {
        setIsDeactivateLoading(true);
        try {
            const res = await api.patch(`/user/active-status/${user.id}`);
            if (res.data.status === 'success') {
                toast.success('Account deactivated. Logging out...');
                setTimeout(() => {
                    logout();
                    navigate('/signin');
                }, 1500);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to deactivate account');
            setIsDeactivateLoading(false);
            setIsDeactivating(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 14 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
    };

    const roleCfg = {
        admin: { bg: 'bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400', label: 'Admin' },
        staff: { bg: 'bg-sky-100 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400', label: 'Staff' },
        user: { bg: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400', label: 'Member' },
    };
    const roleStyle = roleCfg[user?.role] || roleCfg.user;

    return (
        <DashboardLayout activeNav="profile">
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-4 sm:p-6 lg:p-10 page-enter max-w-7xl mx-auto">
                {/* Header */}
                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                My Profile
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Manage your personal information and account security</p>
                        </div>
                    </motion.div>

                    {/* Profile Hero Card */}
                    <motion.div variants={itemVariants} className="relative bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 p-5 sm:p-8 mb-6 overflow-hidden">
                        {/* Decorative gradient strip */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600 rounded-t-2xl" />
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                                <div className="w-24 h-24 bg-emerald-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white">
                                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                                </div>
                                {user?.active && (
                                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                        <MdVerified className="text-white text-[10px]" />
                                    </span>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center sm:text-left min-w-0">
                                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                            {user?.first_name} {user?.last_name}
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                                            {user?.username} · Joined {user?.date_joined ? new Date(user.date_joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={openEditModal}
                                        className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all"
                                    >
                                        <MdEdit size={12} /> Edit Account
                                    </button>
                                </div>
                                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4 sm:mt-3">
                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${roleStyle.bg}`}>
                                        {roleStyle.label}
                                    </span>
                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${user?.active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/15 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/15 dark:text-red-400'}`}>
                                        ● {user?.active ? 'Active' : 'Locked'}
                                    </span>
                                    {user?.gender && (
                                        <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 capitalize">
                                            {user.gender}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                        {/* Personal Info */}
                        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 p-7">
                            <SectionHeader icon={<MdBadge />} iconBg="bg-violet-100 dark:bg-violet-900/20 text-violet-600" title="Personal Info" />
                            <div className="space-y-5">
                                <InfoRow label="Full Name" value={`${user?.first_name} ${user?.last_name}`} />
                                <InfoRow label="Username" value={`${user?.username}`} />
                                <InfoRow label="Gender" value={user?.gender || 'Not specified'} capitalize />
                                <InfoRow label="Marital Status" value={user?.marital_status || 'Not specified'} capitalize />
                            </div>
                        </motion.div>

                        {/* Contact */}
                        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 p-7">
                            <SectionHeader icon={<MdEmail />} iconBg="bg-sky-100 dark:bg-sky-900/20 text-sky-600" title="Contact" />
                            <div className="space-y-5">
                                <InfoRow label="Email Address" value={user?.email} />
                                <InfoRow label="Phone Number" value={user?.phone_number || 'Not linked'} muted={!user?.phone_number} />
                            </div>
                        </motion.div>

                        {/* Security */}
                        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 p-7">
                            <SectionHeader icon={<MdSecurity />} iconBg="bg-amber-100 dark:bg-amber-900/20 text-amber-600" title="Security & Access" />
                            <div className="space-y-5 mb-6">
                                <InfoRow label="Access Role" value={user?.role} capitalize />
                                <InfoRow label="Status" value={user?.active ? 'Verified & Active' : 'Restricted'} status={user?.active ? 'active' : 'locked'} />
                            </div>
                            <button
                                onClick={() => setIsChangingPassword(true)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-xl text-sm font-semibold transition-all"
                            >
                                <MdKey size={16} /> Change Password
                            </button>
                        </motion.div>

                        {/* Activity */}
                        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 p-7">
                            <SectionHeader icon={<MdCalendarMonth />} iconBg="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600" title="Activity" />
                            <div className="space-y-0 mb-6">
                                <TimelineItem
                                    label="Account Created"
                                    date={user?.date_joined ? new Date(user.date_joined).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                                    dotColor="bg-emerald-500"
                                    hasLine={!!user?.last_login}
                                />
                                {user?.last_login ? (
                                    <TimelineItem label="Last Login" date={new Date(user.last_login).toLocaleString()} dotColor="bg-sky-500" hasLine={false} />
                                ) : (
                                    <p className="text-xs text-gray-400 dark:text-slate-500 italic mt-3">No login activity recorded</p>
                                )}
                            </div>

                            {/* Danger Zone */}
                            <div className="border border-red-200 dark:border-red-900/30 rounded-xl p-4 bg-red-50/50 dark:bg-red-900/10">
                                <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Danger Zone</p>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">Deactivating removes your access immediately.</p>
                                <button
                                    onClick={() => setIsDeactivating(true)}
                                    className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all"
                                >
                                    <MdBlock size={14} /> Deactivate Account
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* ── Edit Profile Modal ── */}
            <AnimatePresence>
                {isEditing && (
                    <ModalWrapper onClose={() => setIsEditing(false)}>
                        <ModalHeader title="Edit Profile" subtitle={`${user?.first_name} ${user?.last_name}`} onClose={() => setIsEditing(false)} />
                        <form onSubmit={handleSaveProfile} className="p-7 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <FormField label="First Name" value={editData.first_name} onChange={(v) => setEditData({ ...editData, first_name: v })} required disabled={isSaving} />
                                <FormField label="Last Name" value={editData.last_name} onChange={(v) => setEditData({ ...editData, last_name: v })} required disabled={isSaving} />
                            </div>
                            <FormField label="Email Address" type="email" value={editData.email} onChange={(v) => setEditData({ ...editData, email: v })} required disabled={isSaving} />
                            <FormField label="Phone Number" value={editData.phone_number} onChange={(v) => setEditData({ ...editData, phone_number: v })} disabled={isSaving} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <FormSelect label="Gender" value={editData.gender} onChange={(v) => setEditData({ ...editData, gender: v })} options={[{ v: '', l: 'Select' }, { v: 'male', l: 'Male' }, { v: 'female', l: 'Female' }, { v: 'other', l: 'Other' }]} disabled={isSaving} />
                                <FormSelect label="Marital Status" value={editData.marital_status} onChange={(v) => setEditData({ ...editData, marital_status: v })} options={[{ v: 'single', l: 'Single' }, { v: 'married', l: 'Married' }, { v: 'divorced', l: 'Divorced' }, { v: 'other', l: 'Other' }]} disabled={isSaving} />
                            </div>
                            <div className="pt-3 flex gap-3">
                                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 text-gray-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all">Cancel</button>
                                <button type="submit" disabled={isSaving} className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all disabled:opacity-50">
                                    {isSaving ? <SpinIcon /> : <MdSave size={14} />}
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </ModalWrapper>
                )}
            </AnimatePresence>

            {/* ── Change Password Modal ── */}
            <AnimatePresence>
                {isChangingPassword && (
                    <ModalWrapper onClose={() => { setIsChangingPassword(false); setPasswordData({ current_password: '', new_password: '', confirm_password: '' }); }}>
                        <ModalHeader title="Change Password" subtitle="Enter your current and new password" onClose={() => setIsChangingPassword(false)} />
                        <form onSubmit={handleChangePassword} className="p-7 space-y-4">
                            <PasswordField
                                label="Current Password"
                                value={passwordData.current_password}
                                onChange={(v) => setPasswordData({ ...passwordData, current_password: v })}
                                show={showPasswords.current}
                                onToggle={() => setShowPasswords(s => ({ ...s, current: !s.current }))}
                                disabled={isPasswordSaving}
                            />
                            <PasswordField
                                label="New Password"
                                value={passwordData.new_password}
                                onChange={(v) => setPasswordData({ ...passwordData, new_password: v })}
                                show={showPasswords.new}
                                onToggle={() => setShowPasswords(s => ({ ...s, new: !s.new }))}
                                disabled={isPasswordSaving}
                            />
                            {passwordData.new_password && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-2 gap-y-1.5 gap-x-4 px-1 py-1">
                                    <ValidationItem label="8+ Characters" isValid={passwordData.new_password.length >= 8} />
                                    <ValidationItem label="Uppercase" isValid={/[A-Z]/.test(passwordData.new_password)} />
                                    <ValidationItem label="Lowercase" isValid={/[a-z]/.test(passwordData.new_password)} />
                                    <ValidationItem label="Number" isValid={/[0-9]/.test(passwordData.new_password)} />
                                    <ValidationItem label="Special Symbol" isValid={/[!@#\$%\^&\*]/.test(passwordData.new_password)} />
                                </motion.div>
                            )}
                            <PasswordField
                                label="Confirm New Password"
                                value={passwordData.confirm_password}
                                onChange={(v) => setPasswordData({ ...passwordData, confirm_password: v })}
                                show={showPasswords.confirm}
                                onToggle={() => setShowPasswords(s => ({ ...s, confirm: !s.confirm }))}
                                disabled={isPasswordSaving}
                            />
                            {passwordData.new_password && passwordData.confirm_password && passwordData.new_password !== passwordData.confirm_password && (
                                <p className="text-xs text-red-500 font-medium flex items-center gap-1"><MdWarning size={12} /> Passwords do not match</p>
                            )}
                            <div className="pt-3 flex gap-4">
                                <button type="button" onClick={() => setIsChangingPassword(false)} disabled={isPasswordSaving} className="flex-1 py-4 text-gray-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl transition-all border border-transparent hover:border-gray-200 dark:hover:border-slate-700 disabled:opacity-50">Cancel</button>
                                <button type="submit" disabled={isPasswordSaving} className="flex-[1.5] flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50">
                                    {isPasswordSaving ? <SpinIcon /> : <MdLock size={14} />}
                                    {isPasswordSaving ? 'Processing...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </ModalWrapper>
                )}
            </AnimatePresence>

            {/* ── Deactivate Confirm Modal ── */}
            <AnimatePresence>
                {isDeactivating && (
                    <ModalWrapper onClose={() => !isDeactivateLoading && setIsDeactivating(false)}>
                        <div className="p-7">
                            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/20 text-red-500 text-2xl mx-auto mb-4">
                                <MdWarning />
                            </div>
                            <h2 className="text-center font-bold text-gray-900 dark:text-white text-base mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                Deactivate Your Account?
                            </h2>
                            <p className="text-center text-sm text-gray-500 dark:text-slate-400 mb-6">
                                This will immediately restrict your access. You'll be logged out and will need an admin to reactivate your account.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsDeactivating(false)}
                                    disabled={isDeactivateLoading}
                                    className="flex-1 py-3 font-semibold text-xs uppercase tracking-wider text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeactivateAccount}
                                    disabled={isDeactivateLoading}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                                >
                                    {isDeactivateLoading ? <SpinIcon /> : <MdBlock size={14} />}
                                    {isDeactivateLoading ? 'Processing...' : 'Yes, Deactivate'}
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
            className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden relative z-10 border border-gray-100 dark:border-slate-800/70"
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

const SectionHeader = ({ icon, iconBg, title }) => (
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-slate-800/50">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${iconBg}`}>{icon}</div>
        <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider" style={{ fontFamily: "'Outfit', sans-serif" }}>{title}</h3>
    </div>
);

const InfoRow = ({ label, value, capitalize = false, muted = false, mono = false, status }) => (
    <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">{label}</label>
            <div className="flex items-center gap-1.5">
                {status && <span className={`inline-block w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />}
                <p className={`font-semibold text-sm truncate ${muted ? 'text-gray-400 dark:text-slate-500 italic' : 'text-gray-900 dark:text-white'} ${capitalize ? 'capitalize' : ''} ${mono ? 'font-mono text-xs' : ''}`}>
                    {value}
                </p>
            </div>
        </div>
    </div>
);

const TimelineItem = ({ label, date, dotColor, hasLine }) => (
    <div className="flex items-start gap-3">
        <div className="flex flex-col items-center pt-1">
            <div className={`w-2.5 h-2.5 rounded-full ${dotColor} shrink-0`} />
            {hasLine && <div className="w-px h-8 bg-gray-200 dark:bg-slate-700" />}
        </div>
        <div className="pb-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{date}</p>
        </div>
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

const PasswordField = ({ label, value, onChange, show, onToggle, disabled = false }) => (
    <div>
        <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
        <div className="relative">
            <input
                type={show ? 'text' : 'password'} required value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-full px-4 py-2.5 pr-10 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button type="button" onClick={onToggle} disabled={disabled} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50">
                {show ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}
            </button>
        </div>
    </div>
);

const SpinIcon = () => (
    <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
);

const ValidationItem = ({ label, isValid }) => (
    <div className={`flex items-center gap-1.5 transition-colors duration-300 ${isValid ? 'text-emerald-500' : 'text-gray-400 dark:text-slate-500'}`}>
        {isValid ? <MdCheck size={12} className="shrink-0" /> : <div className="w-1.5 h-1.5 rounded-full border border-current shrink-0" />}
        <span className="text-[10px] font-bold uppercase tracking-tight leading-none">{label}</span>
    </div>
);

export default ProfilePage;
