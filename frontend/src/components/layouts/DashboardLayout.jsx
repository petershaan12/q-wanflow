import React, { useEffect, useState } from 'react';
import Sidebar from '../Sidebar';

const DashboardLayout = ({ children, activeTab, collapsed, hideSidebar = false, hideTopbar = false, topbarProps = {} }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(collapsed);
    useEffect(() => {
        setSidebarCollapsed(Boolean(collapsed));
    }, [collapsed]);


    return (
        <div className="flex h-screen bg-base-200 overflow-hidden">
            {!hideSidebar && (
                <Sidebar
                    activeTab={activeTab}
                    collapsed={sidebarCollapsed}
                    setCollapsed={setSidebarCollapsed}
                />
            )}

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
