import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ adminOnly = false }) => {
    const { user, loading, isAdmin, isStaff } = useAuth();
    const location = useLocation();

    if (loading) {
        return null;
    }

    if (!user) {
        return <Navigate to="/signin" state={{ from: location }} replace />;
    }

    if (adminOnly && (!isAdmin && !isStaff)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
