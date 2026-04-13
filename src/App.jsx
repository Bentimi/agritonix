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
import UserDashboard from './pages/UserDashboard';
import PublicProductsPage from './pages/PublicProductsPage';
import CartPage from './pages/CartPage';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
    const { user } = useAuth();

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={!user ? <Navigate to="/signin" /> : <Navigate to={user?.role === 'admin' ? '/admin' : '/products'} />} />
            <Route path="/signin" element={!user ? <SignIn /> : <Navigate to="/" />} />
            <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/" />} />

            {/* Protected Routes — all authenticated users */}
            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/products" element={
                    <DashboardLayout activeNav="products">
                        <PublicProductsPage />
                    </DashboardLayout>
                } />
                <Route path="/cart" element={
                    <DashboardLayout activeNav="cart">
                        <CartPage />
                    </DashboardLayout>
                } />
                {/* Profile — available to ALL authenticated users */}
                <Route path="/profile" element={<ProfilePage />} />
                {/* Settings — available to ALL authenticated users */}
                <Route path="/settings" element={<SettingsPage />} />
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