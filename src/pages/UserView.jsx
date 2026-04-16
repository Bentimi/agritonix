import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import api from '../services/api';
import {
    MdArrowBack, MdEdit, MdClose, MdEmail, MdPhone,
    MdBadge, MdSecurity, MdCalendarMonth, MdVerified, MdSave
} from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';

const UserView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { updateUserProfile } = useAuth();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get(`/user/${id}`);
                if (response.data.status === 'success') {
                    setUser(response.data.data);
                }
            } catch (error) {
                toast.error('Failed to load user profile');
                navigate('/admin');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [id, navigate]);

    const openEditModal = () => {
        setEditData({
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            email: user?.email || '',
            phone_number: user?.phone_number || '',
            gender: user?.gender || '',
            marital_status: user?.marital_status || 'single'
        });
        setIsEditing(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const result = await updateUserProfile(id, editData);
            if (result.success) {
                toast.success('Profile updated successfully');
                setUser(result.user);
                setIsEditing(false);
                // Re-fetch to get fresh data
                const response = await api.get(`/user/${id}`);
                if (response.data.status === 'success') {
                    setUser(response.data.data);
                }
            } else {
                toast.error(result.message || 'Update failed');
            }
        } catch (error) {
            toast.error('Failed to update profile');
        }
        setIsSaving(false);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
    };

    if (loading) {
        return (
            <DashboardLayout activeNav="users">
                <div className="p-6 lg:p-10">
                    <div className="max-w-4xl mx-auto space-y-5">
                        <div className="skeleton h-8 w-40" />
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 p-8">
                            <div className="flex items-center gap-5">
                                <div className="skeleton w-20 h-20 rounded-2xl" />
                                <div className="flex-1 space-y-3">
                                    <div className="skeleton h-5 w-48" />
                                    <div className="skeleton h-3 w-64" />
                                    <div className="flex gap-2">
                                        <div className="skeleton h-6 w-20 rounded-lg" />
                                        <div className="skeleton h-6 w-16 rounded-lg" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <div className="skeleton h-64 rounded-2xl" />
                            <div className="skeleton h-64 rounded-2xl" />
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout activeNav="users">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="p-4 sm:p-6 lg:p-10"
            >
                <div className="max-w-4xl mx-auto">
                    {/* Top Bar */}
                    <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => navigate('/admin')}
                            className="flex items-center gap-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium text-sm group"
                        >
                            <MdArrowBack className="group-hover:-translate-x-0.5 transition-transform" />
                            Back to Directory
                        </button>
                        <button
                            onClick={openEditModal}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all"
                        >
                            <MdEdit size={16} />
                            Edit Profile
                        </button>
                    </motion.div>

                    {/* Profile Header */}
                    <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 p-8 mb-5">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            {/* Avatar */}
                            <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0">
                                {user?.first_name?.[0]}{user?.last_name?.[0]}
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center sm:text-left">
                                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                    <h1 className="text-xl font-bold text-gray-900 dark:text-white" style={{fontFamily: "'Outfit', sans-serif"}}>
                                        {user?.first_name} {user?.last_name}
                                    </h1>
                                    {user?.active && <MdVerified className="text-emerald-500 text-lg" />}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                                    {user?.username} • Joined {new Date(user?.date_joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </p>

                                {/* Badges */}
                                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                        user?.active
                                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/15 dark:text-emerald-400'
                                            : 'bg-red-50 text-red-600 dark:bg-red-900/15 dark:text-red-400'
                                    }`}>
                                        ● {user?.active ? 'Active' : 'Locked'}
                                    </span>
                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                        user?.role === 'admin'
                                            ? 'bg-violet-50 text-violet-600 dark:bg-violet-900/15 dark:text-violet-400'
                                            : user?.role === 'staff'
                                                ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/15 dark:text-sky-400'
                                                : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400'
                                    }`}>
                                        {user?.role}
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

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Personal Information */}
                        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 p-7">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-slate-800/50">
                                <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/20 text-violet-600 flex items-center justify-center text-lg">
                                    <MdBadge />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider" style={{fontFamily: "'Outfit', sans-serif"}}>Personal Info</h3>
                            </div>
                            <div className="space-y-5">
                                <InfoRow label="Full Name" value={`${user?.first_name} ${user?.last_name}`} />
                                <InfoRow label="Username" value={user?.username} />
                                <InfoRow label="Gender" value={user?.gender || 'Not specified'} capitalize />
                                <InfoRow label="Marital Status" value={user?.marital_status || 'Not specified'} capitalize />
                            </div>
                        </motion.div>

                        {/* Contact Information */}
                        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 p-7">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-slate-800/50">
                                <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-900/20 text-sky-600 flex items-center justify-center text-lg">
                                    <MdEmail />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider" style={{fontFamily: "'Outfit', sans-serif"}}>Contact</h3>
                            </div>
                            <div className="space-y-5">
                                <InfoRow label="Email Address" value={user?.email} icon={<MdEmail className="text-gray-400 text-sm" />} />
                                <InfoRow label="Phone Number" value={user?.phone_number || 'Not linked'} icon={<MdPhone className="text-gray-400 text-sm" />} muted={!user?.phone_number} />
                            </div>
                        </motion.div>

                        {/* Security & Access */}
                        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 p-7">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-slate-800/50">
                                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center text-lg">
                                    <MdSecurity />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider" style={{fontFamily: "'Outfit', sans-serif"}}>Security</h3>
                            </div>
                            <div className="space-y-5">
                                <InfoRow label="Access Role" value={user?.role} capitalize />
                                <InfoRow label="Status" value={user?.active ? 'Verified & Active' : 'Restricted'} status={user?.active ? 'active' : 'locked'} />
                            </div>
                        </motion.div>

                        {/* Timeline */}
                        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800/70 p-7">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-slate-800/50">
                                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center text-lg">
                                    <MdCalendarMonth />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider" style={{fontFamily: "'Outfit', sans-serif"}}>Activity</h3>
                            </div>
                            <div className="space-y-0">
                                <TimelineItem
                                    label="Account Created"
                                    date={new Date(user?.date_joined).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                                    dotColor="bg-emerald-500"
                                    hasLine={!!user?.last_login}
                                />
                                {user?.last_login && (
                                    <TimelineItem
                                        label="Last Login"
                                        date={new Date(user.last_login).toLocaleString()}
                                        dotColor="bg-sky-500"
                                        hasLine={false}
                                    />
                                )}
                                {!user?.last_login && (
                                    <p className="text-xs text-gray-400 dark:text-slate-500 italic mt-3">No login activity recorded</p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {isEditing && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setIsEditing(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 border border-gray-100 dark:border-slate-800/70"
                        >
                            {/* Modal Header */}
                            <div className="px-7 py-5 border-b border-gray-100 dark:border-slate-800/70 flex justify-between items-center">
                                <div>
                                    <h2 className="font-bold text-gray-900 dark:text-white text-base" style={{fontFamily: "'Outfit', sans-serif"}}>Edit Profile</h2>
                                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{user?.first_name} {user?.last_name}</p>
                                </div>
                                <button onClick={() => setIsEditing(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                                    <MdClose size={18} />
                                </button>
                            </div>

                            {/* Modal Form */}
                            <form onSubmit={handleSave} className="p-7 space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <FormField label="First Name" value={editData.first_name} onChange={(v) => setEditData({...editData, first_name: v})} required />
                                    <FormField label="Last Name" value={editData.last_name} onChange={(v) => setEditData({...editData, last_name: v})} required />
                                </div>
                                <FormField label="Email Address" type="email" value={editData.email} onChange={(v) => setEditData({...editData, email: v})} required />
                                <FormField label="Phone Number" value={editData.phone_number} onChange={(v) => setEditData({...editData, phone_number: v})} required placeholder="+233 XX XXX XXXX" />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Gender</label>
                                        <select
                                            required
                                            value={editData.gender}
                                            onChange={(e) => setEditData({...editData, gender: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                                        >
                                            <option value="">Select gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Marital Status</label>
                                        <select
                                            required
                                            value={editData.marital_status}
                                            onChange={(e) => setEditData({...editData, marital_status: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                                        >
                                            <option value="single">Single</option>
                                            <option value="married">Married</option>
                                            <option value="divorced">Divorced</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 py-3 text-gray-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <>
                                                <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <MdSave size={14} />
                                                Save Changes
                                            </>
                                        )}
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

const InfoRow = ({ label, value, capitalize = false, muted = false, mono = false, status, icon }) => (
    <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">{label}</label>
            <div className="flex items-center gap-1.5">
                {icon}
                {status && (
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-0.5 ${status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                )}
                <p className={`font-semibold text-sm truncate ${
                    muted ? 'text-gray-400 dark:text-slate-500 italic' : 'text-gray-900 dark:text-white'
                } ${capitalize ? 'capitalize' : ''} ${mono ? 'font-mono text-xs' : ''}`}>
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

const FormField = ({ label, value, onChange, type = 'text', required = false, placeholder = '' }) => (
    <div>
        <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
        <input
            type={type}
            required={required}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-gray-300"
        />
    </div>
);

export default UserView;
