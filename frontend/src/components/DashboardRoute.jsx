import React from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';

const DashboardRoute = ({ children, activeTab, collapsed, hideSidebar = false, hideTopbar = false, topbarProps = {} }) => {
    const location = useLocation();

    // Auto-detect activeTab from pathname if not provided
    const detectedTab = activeTab || (() => {
        const path = location.pathname;
        if (path === '/dashboard') return 'dashboard';
        if (path.startsWith('/workflow')) return 'workflows';
        if (path === '/assets') return 'assets';
        if (path === '/admin') return 'admin';
        if (path === '/settings') return 'settings';
        return 'dashboard';
    })();

    return (
        <ProtectedRoute>
            <DashboardLayout
                activeTab={detectedTab}
                collapsed={collapsed}
                hideSidebar={hideSidebar}
                hideTopbar={hideTopbar}
                topbarProps={topbarProps}
            >
                {children}
            </DashboardLayout>
        </ProtectedRoute>
    );
};

export default DashboardRoute;
