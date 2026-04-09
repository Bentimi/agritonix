import React from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { useAuth } from './context/AuthContext';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import AdminDashboard from './pages/AdminDashboard';
import UsersPage from './pages/UsersPage';
import UserView from './pages/UserView';
import ProfilePage from './pages/ProfilePage';
import ProductsPage from './pages/ProductsPage';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
    const { user } = useAuth();

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/signin" element={!user ? <SignIn /> : <Navigate to="/" />} />
            <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/" />} />

            {/* Protected Routes — all authenticated users */}
            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} />} />
                <Route path="/dashboard" element={
                    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4">
                        <div className="text-center p-10 bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-slate-900/50 max-w-md border border-gray-100 dark:border-slate-800">
                            <div className="inline-flex items-center justify-center w-16 h-16 gradient-bg rounded-2xl mb-5 shadow-lg shadow-emerald-500/20">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                Welcome, {user?.first_name}!
                            </h1>
                            <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">Your farm management dashboard.</p>
                            <button
                                onClick={() => window.location.href = '/profile'}
                                className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm hover:text-emerald-700 transition-colors"
                            >
                                View My Profile →
                            </button>
                        </div>
                    </div>
                } />
                {/* Profile — available to ALL authenticated users */}
                <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Admin-Only Routes */}
            <Route element={<ProtectedRoute adminOnly />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<UsersPage tab="users" />} />
                <Route path="/admin/users/roles" element={<UsersPage tab="roles" />} />
                <Route path="/admin/users/status" element={<UsersPage tab="status" />} />
                <Route path="/admin/users/:id" element={<UserView />} />
                <Route path="/admin/products" element={<ProductsPage />} />
                <Route path="/admin/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default App;