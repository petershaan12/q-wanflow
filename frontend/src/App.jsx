import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useThemeStore from './stores/themeStore';
import LandingPage from './page/LandingPage';
import Login from './page/Login';
import Register from './page/Register';
import VerifyOTP from './page/VerifyOTP';
import DashboardPage from './page/DashboardPage';
import WorkflowPage from './page/WorkflowPage';
import WorkflowEditorPage from './page/WorkflowEditorPage';
import AssetPage from './page/AssetPage';
import AdminPage from './page/AdminPage';
import SettingsPage from './page/SettingsPage';
import SupportPage from './page/SupportPage';
import SharedWorkflowHandler from './page/SharedWorkflowHandler';
import DashboardRoute from './components/DashboardRoute';
import useAuthStore from './stores/authStore';

function App() {
    const { darkMode } = useThemeStore();

    const { user } = useAuthStore();
    const isAdmin = user?.email === 'peterhiku12@gmail.com';

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkMode ? 'qwendark' : 'qwenlight');
    }, [darkMode]);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />
                <Route path="/dashboard" element={<DashboardRoute><DashboardPage /></DashboardRoute>} />
                <Route path="/workflows" element={<DashboardRoute><WorkflowPage /></DashboardRoute>} />
                <Route
                    path="/workflow/:id"
                    element={
                        <DashboardRoute collapsed={true}>
                            <WorkflowEditorPage />
                        </DashboardRoute>
                    }
                />
                <Route 
                    path="/share/:shareId" 
                    element={
                        <DashboardRoute>
                            <SharedWorkflowHandler />
                        </DashboardRoute>
                    } 
                />
                <Route path="/assets" element={<DashboardRoute><AssetPage /></DashboardRoute>} />
                <Route
                    path="/admin"
                    element={
                        isAdmin ? (
                            <DashboardRoute><AdminPage /></DashboardRoute>
                        ) : (
                            <Navigate to="/dashboard" replace />
                        )
                    }
                />
                <Route path="/settings" element={<DashboardRoute><SettingsPage /></DashboardRoute>} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
