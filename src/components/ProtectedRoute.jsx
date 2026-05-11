import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const accessToken = localStorage.getItem('access-token');
    const userRole = localStorage.getItem('role'); // Assuming role is stored in localStorage on login
    const location = useLocation();

    if (!accessToken) {
        // Redirect to login if not authenticated
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Redirect to chat if role not allowed (e.g. customer trying to access dashboard)
        return <Navigate to="/chat" replace />;
    }

    return children;
};

export default ProtectedRoute;
