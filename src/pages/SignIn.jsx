import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const SignIn = () => {
    const [credentials, setCredentials] = useState({ credential: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await login(credentials);
        if (result.success) {
            toast.success('Login successful!');
            navigate(from, { replace: true });
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.2 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4 py-12 transition-colors duration-300">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-[420px] w-full relative z-10"
            >
                {/* Card */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-slate-900/50 p-8 sm:p-10 border border-gray-100 dark:border-slate-800">
                    {/* Header */}
                    <motion.div variants={itemVariants} className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-600 rounded-2xl mb-5">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1" style={{fontFamily: "'Outfit', sans-serif"}}>Welcome back</h1>
                        <p className="text-gray-500 dark:text-slate-400 text-sm">Sign in to your Agritronix account</p>
                    </motion.div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <motion.div variants={itemVariants}>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-2 uppercase tracking-wider">Email or Username</label>
                            <div className={`relative rounded-xl bg-gray-50 dark:bg-slate-800/60 border transition-all duration-200 ${focused === 'credential' ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-gray-200 dark:border-slate-700'}`}>
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <MdEmail className={`text-lg transition-colors duration-200 ${focused === 'credential' ? 'text-emerald-500' : 'text-gray-400'}`} />
                                </div>
                                <input
                                    type="text"
                                    name="credential"
                                    required
                                    className="block w-full pl-11 pr-4 py-3 bg-transparent text-gray-900 dark:text-white text-sm rounded-xl outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
                                    placeholder="Enter your email or username"
                                    value={credentials.credential}
                                    onChange={handleChange}
                                    onFocus={() => setFocused('credential')}
                                    onBlur={() => setFocused('')}
                                    disabled={loading}
                                />
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider">Password</label>
                            </div>
                            <div className={`relative rounded-xl bg-gray-50 dark:bg-slate-800/60 border transition-all duration-200 ${focused === 'password' ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-gray-200 dark:border-slate-700'}`}>
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <MdLock className={`text-lg transition-colors duration-200 ${focused === 'password' ? 'text-emerald-500' : 'text-gray-400'}`} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    required
                                    className="block w-full pl-11 pr-12 py-3 bg-transparent text-gray-900 dark:text-white text-sm rounded-xl outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
                                    placeholder="Enter your password"
                                    value={credentials.password}
                                    onChange={handleChange}
                                    onFocus={() => setFocused('password')}
                                    onBlur={() => setFocused('')}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                                </button>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex items-center justify-center py-3.5 px-4 bg-emerald-600 rounded-xl text-sm font-bold text-white hover:bg-emerald-700 transition-all duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Signing in...</span>
                                    </div>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </motion.div>
                    </form>

                    <motion.p variants={itemVariants} className="mt-8 text-center text-sm text-gray-500 dark:text-slate-400">
                        Don't have an account?{' '}
                        <Link to="/signup" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors">
                            Sign Up
                        </Link>
                    </motion.p>
                </motion.div>

                {/* Footer */}
                <motion.p variants={itemVariants} className="mt-8 text-center text-xs text-gray-400 dark:text-slate-600">
                    &copy; 2026 Agritronix. All rights reserved.
                </motion.p>
            </motion.div>
        </div>
    );
};

export default SignIn;
