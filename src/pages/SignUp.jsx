import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { MdEmail, MdLock, MdPerson, MdVisibility, MdVisibilityOff, MdCheckCircle } from 'react-icons/md';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const SignUp = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirm_password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [focused, setFocused] = useState('');

    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const passwordStrength = useMemo(() => {
        const p = formData.password;
        if (!p) return { score: 0, label: '', color: '' };
        let score = 0;
        if (p.length >= 6) score++;
        if (p.length >= 10) score++;
        if (/[A-Z]/.test(p)) score++;
        if (/[0-9]/.test(p)) score++;
        if (/[^A-Za-z0-9]/.test(p)) score++;
        if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
        if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
        if (score <= 3) return { score: 3, label: 'Good', color: 'bg-emerald-400' };
        return { score: 4, label: 'Strong', color: 'bg-emerald-600' };
    }, [formData.password]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirm_password) {
            toast.error('Passwords do not match');
            return;
        }
        setLoading(true);
        const { confirm_password, ...submitData } = formData;
        const result = await signup(submitData);
        if (result.success) {
            toast.success('Account created successfully!');
            setSuccess(true);
            setTimeout(() => navigate('/signin'), 2000);
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.15 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 14 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4 transition-colors duration-300">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-slate-900/50 p-10 text-center border border-gray-100 dark:border-slate-800"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="inline-flex items-center justify-center w-20 h-20 gradient-bg rounded-full mb-6 shadow-lg shadow-emerald-500/30"
                    >
                        <MdCheckCircle className="text-4xl text-white" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2" style={{fontFamily: "'Outfit', sans-serif"}}>Account Created!</h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm">Redirecting you to sign in...</p>
                    <div className="mt-6 w-full h-1 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 2, ease: 'linear' }}
                            className="h-full gradient-bg rounded-full"
                        />
                    </div>
                </motion.div>
            </div>
        );
    }

    const InputField = ({ name, label, type = 'text', icon: Icon, placeholder }) => (
        <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">{label}</label>
            <div className={`relative rounded-xl bg-gray-50 dark:bg-slate-800/60 border transition-all duration-200 ${focused === name ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-gray-200 dark:border-slate-700'}`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon className={`text-lg transition-colors duration-200 ${focused === name ? 'text-emerald-500' : 'text-gray-400'}`} />
                </div>
                <input
                    type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
                    name={name}
                    required
                    className="block w-full pl-10 pr-4 py-2.5 bg-transparent text-gray-900 dark:text-white text-sm rounded-xl outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    placeholder={placeholder}
                    value={formData[name]}
                    onChange={handleChange}
                    onFocus={() => setFocused(name)}
                    onBlur={() => setFocused('')}
                />
                {type === 'password' && name === 'password' && (
                    <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4 py-12 transition-colors duration-300">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-[440px] w-full relative z-10"
            >
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-slate-900/50 p-8 sm:p-10 border border-gray-100 dark:border-slate-800">
                    {/* Header */}
                    <motion.div variants={itemVariants} className="text-center mb-7">
                        <div className="inline-flex items-center justify-center w-14 h-14 gradient-bg rounded-2xl mb-5 shadow-lg shadow-emerald-500/20">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1" style={{fontFamily: "'Outfit', sans-serif"}}>Create Account</h1>
                        <p className="text-gray-500 dark:text-slate-400 text-sm">Join the Agritronix farm community</p>
                    </motion.div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                            <InputField name="first_name" label="First Name" icon={MdPerson} placeholder="John" />
                            <InputField name="last_name" label="Last Name" icon={MdPerson} placeholder="Doe" />
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <InputField name="email" label="Email Address" type="email" icon={MdEmail} placeholder="you@example.com" />
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <InputField name="password" label="Password" type="password" icon={MdLock} placeholder="Create a password" />
                        </motion.div>

                        {/* Password Strength */}
                        {formData.password && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1.5">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200 dark:bg-slate-700'}`} />
                                    ))}
                                </div>
                                <p className={`text-[10px] font-semibold uppercase tracking-wider ${passwordStrength.score <= 1 ? 'text-red-500' : passwordStrength.score <= 2 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                    {passwordStrength.label}
                                </p>
                            </motion.div>
                        )}

                        <motion.div variants={itemVariants}>
                            <InputField name="confirm_password" label="Confirm Password" type="password" icon={MdLock} placeholder="Repeat your password" />
                        </motion.div>

                        <motion.div variants={itemVariants} className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex items-center justify-center py-3.5 px-4 gradient-bg rounded-xl text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Creating account...</span>
                                    </div>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </motion.div>
                    </form>

                    <motion.p variants={itemVariants} className="mt-7 text-center text-sm text-gray-500 dark:text-slate-400">
                        Already have an account?{' '}
                        <Link to="/signin" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors">
                            Sign in
                        </Link>
                    </motion.p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default SignUp;
