import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../stores/authStore';
import { assetService } from '../services/assetService';
import {
    Plus, Zap, Calendar, Sparkles, ArrowRight, Workflow,
    FolderOpen, AlertTriangle, X, HardDrive
} from 'lucide-react';
import { DASHBOARD_THEMES } from '../utils/constants';

const DashboardPage = () => {
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showApiWarning, setShowApiWarning] = useState(true);
    const [toast, setToast] = useState(null);
    const [hasApiKey, setHasApiKey] = useState(false);
    const [checkingApiKey, setCheckingApiKey] = useState(true);
    const [themeId, setThemeId] = useState(() => localStorage.getItem('dashboard_theme') || 'nebula');
    const [storageInfo, setStorageInfo] = useState(null);
    const [storageLoading, setStorageLoading] = useState(false);
    const [workflowLimits, setWorkflowLimits] = useState(null);
    const [recentWorkflows, setRecentWorkflows] = useState([]);
    const [recentWorkflowId, setRecentWorkflowId] = useState(() => localStorage.getItem('recent_workflow_id') || null);
    const navigate = useNavigate();
    const { user, token } = useAuthStore();

    const userName = user?.name || user?.email?.split('@')[0] || 'User';
    const isPro = user?.plan === 'pro';
    const activeTheme = DASHBOARD_THEMES.find((t) => t.id === themeId) || DASHBOARD_THEMES[0];
    const canCreateWorkflow = hasApiKey &&
        (!storageInfo || storageInfo.can_upload !== false) &&
        (!workflowLimits || workflowLimits.can_create !== false);

    // Get recent workflow from localStorage and add to recent workflows list
    useEffect(() => {
        if (recentWorkflowId && workflows.length > 0) {
            const recentWorkflow = workflows.find(w => w.id === recentWorkflowId);
            if (recentWorkflow) {
                setRecentWorkflows([recentWorkflow, ...workflows.filter(w => w.id !== recentWorkflowId)].slice(0, 4));
            }
        } else {
            setRecentWorkflows(workflows.slice(0, 4));
        }
    }, [recentWorkflowId, workflows]);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    };

    const greeting = (() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    })();

    useEffect(() => {
        if (user && token) {
            fetchWorkflows();
            fetchStorageInfo();
        } else if (!token) navigate('/login');
    }, [user, token, navigate]);

    useEffect(() => {
        const fetchApiKeyStatus = async () => {
            if (!token) return;
            setCheckingApiKey(true);
            try {
                const res = await axios.get('/api/ai/api-key/status');
                setHasApiKey(!!res.data?.configured);
            } catch {
                setHasApiKey(false);
            } finally {
                setCheckingApiKey(false);
            }
        };
        fetchApiKeyStatus();
    }, [token]);

    useEffect(() => {
        localStorage.setItem('dashboard_theme', themeId);
    }, [themeId]);

    const fetchWorkflows = async () => {
        try {
            const response = await axios.get('/api/workflows/');
            const sortedWorkflows = (response.data || []).sort((a, b) =>
                new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
            );
            setWorkflows(sortedWorkflows);
        } catch (error) {
            console.error('Error fetching workflows:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStorageInfo = async () => {
        try {
            setStorageLoading(true);
            const [storageRes, limitsRes] = await Promise.all([
                assetService.getStorageInfo().catch(() => null),
                axios.get('/api/workflows/limits').catch(() => null)
            ]);
            if (storageRes) setStorageInfo(storageRes);
            if (limitsRes) setWorkflowLimits(limitsRes.data);
        } catch (err) {
            console.error('Error fetching storage info:', err);
        } finally {
            setStorageLoading(false);
        }
    };

    const createNewWorkflow = async () => {
        if (checkingApiKey) {
            showToast('error', 'Checking API key status...');
            return;
        }

        if (!hasApiKey) {
            showToast('error', 'Please setup your Qwen API key in Settings first!');
            navigate('/settings');
            return;
        }

        // Check storage limit first
        if (storageInfo && !storageInfo.can_upload) {
            showToast('error', `Storage limit reached! ${storageInfo.storage_used_human} / ${storageInfo.storage_limit_human}. Upgrade to Pro for unlimited storage.`);
            navigate('/assets');
            return;
        }

        // Check project limit
        if (workflowLimits && !workflowLimits.can_create) {
            showToast('error', `Project limit reached! You have ${workflowLimits.project_count} of ${workflowLimits.project_limit_human} projects. Upgrade to Pro for unlimited projects!`);
            navigate('/settings');
            return;
        }

        setCreating(true);
        try {
            const response = await axios.post('/api/workflows/', {
                name: 'Untitled Workflow',
                description: 'A new AI workflow',
            });
            // Update recent workflow
            setRecentWorkflowId(response.data.id);
            localStorage.setItem('recent_workflow_id', response.data.id);
            // Refresh workflows list
            fetchWorkflows();
            navigate(`/workflow/${response.data.id}`);
        } catch (error) {
            console.error('Error creating workflow:', error);
            showToast('error', 'Failed to create project');
        } finally {
            setCreating(false);
        }
    };

    const recentWorkflowsList = (recentWorkflows || []).slice(0, 4);

    const quickActions = [
        {
            icon: Plus,
            label: 'New Project',
            desc: 'Start with a blank canvas',
            onClick: createNewWorkflow,
            disabled: !canCreateWorkflow,
            color: 'from-blue-500/10 to-indigo-500/10 border-blue-500/20'
        },
        { icon: FolderOpen, label: 'Asset Library', desc: 'Manage your AI media', onClick: () => navigate('/assets'), color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20' },
        { icon: Workflow, label: 'My Projects', desc: 'Explore your workspace', onClick: () => navigate('/workflows'), color: 'from-purple-500/10 to-pink-500/10 border-purple-500/20' },
    ];

    return (
        <div className="min-h-full">
            {/* Hero Section */}
            <div className={`relative bg-gradient-to-br ${activeTheme.heroGradient} border-b border-base-300`}>
                <img
                    src={activeTheme.cover}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-[0.5] pointer-events-none"
                />
                <div className="absolute inset-0 bg-base-100/45 pointer-events-none" />
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 z-10 relative">
                        <div className="flex-1">
                            <h1
                                className="text-4xl font-bold text-base-content mb-3 leading-tight"
                                style={{ fontFamily: 'Montserrat, sans-serif' }}
                            >
                                {greeting}, {userName} 👋
                            </h1>
                            <p className="text-base text-base-content max-w-xl">
                                Create powerful AI workflows with Qwen and Wan. Build, automate, and scale your ideas.
                            </p>
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                {DASHBOARD_THEMES.map((theme) => (
                                    <button
                                        key={theme.id}
                                        onClick={() => setThemeId(theme.id)}
                                        className={`px-3 h-8 rounded-md text-xs font-semibold border transition-all ${themeId === theme.id
                                            ? 'bg-base-100 text-base-content border-base-300'
                                            : 'bg-base-100/60 text-base-content/60 border-base-300/60 hover:text-base-content'
                                            }`}
                                    >
                                        {theme.name}
                                    </button>
                                ))}
                                {/* Storage Info Badge */}
                                {storageInfo && storageInfo.plan === 'free' && (
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs border ${storageInfo.storage_percent > 90 ? 'bg-error/10 border-error/30 text-error' : 'bg-primary/10 border-primary/30 text-primary'}`}>
                                        <HardDrive size={12} />
                                        {storageInfo.storage_used_human} / {storageInfo.storage_limit_human}
                                        <span className="w-16 h-1 bg-current/20 rounded-full overflow-hidden ml-1">
                                            <div className="h-full bg-current" style={{ width: `${Math.min(storageInfo.storage_percent, 100)}%` }} />
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="max-w-7xl mx-auto px-6 py-8">

                {/* API Key Warning */}
                {!hasApiKey && showApiWarning && (
                    <div className="mb-6 animate-fade-in">
                        <div className="bg-warning/10 border border-warning/30 rounded-xl p-3 flex items-center gap-3">
                            <AlertTriangle size={18} className="text-warning flex-shrink-0" />
                            <p className="text-sm font-medium text-base-content/80 flex-1">Setup your Qwen API key to start creating workflows</p>
                            <button onClick={() => navigate('/settings')} className="btn btn-warning btn-xs rounded-lg font-bold h-8 px-3">
                                Setup
                            </button>
                            <button onClick={() => setShowApiWarning(false)} className="text-base-content/40 hover:text-base-content">
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Project Limit Warning */}
                {!isPro && workflowLimits && !workflowLimits.can_create && (
                    <div className="mb-6 animate-fade-in">
                        <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex items-center gap-3">
                            <Zap size={18} className="text-primary flex-shrink-0" />
                            <p className="text-sm font-medium text-base-content/80 flex-1">You've reached {workflowLimits.project_count} of {workflowLimits.project_limit_human} projects limit. Upgrade to Pro!</p>
                            <button
                                onClick={() => navigate('/settings', { state: { section: 'billing' } })}
                                className="btn btn-primary btn-xs rounded-lg font-bold h-8 px-3"
                            >
                                Upgrade
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                    {quickActions.map((action, i) => (
                        <button
                            key={i}
                            onClick={action.disabled ? undefined : action.onClick}
                            disabled={action.disabled}
                            className={`group relative bg-base-100 border border-base-300 rounded-xl p-3 text-left transition-all duration-300
                                    ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/40 hover:shadow-lg'}`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
                                        ${action.disabled ? 'bg-base-200 text-base-content/30' : 'bg-primary/10 group-hover:bg-primary/20'}`}>
                                    <action.icon size={22} className={action.disabled ? 'text-base-content/30' : 'text-primary'} />
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-semibold transition-colors ${action.disabled ? 'text-base-content/30' : 'group-hover:text-primary'}`}>{action.label}</h3>
                                    <p className="text-sm text-base-content/60">{action.desc}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Recent Workflows */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-base-content">Recent Workflow</h2>
                        {workflows.length > 0 && (
                            <button
                                onClick={() => navigate('/workflows')}
                                className="text-sm font-semibold text-primary hover:text-primary/80 transition-all flex items-center gap-2"
                            >
                                View all <ArrowRight size={16} />
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-base-100 rounded-xl border border-base-300">
                            <span className="loading loading-ring loading-lg text-primary" />
                            <span className="text-sm font-medium text-base-content/40">Loading workflows...</span>
                        </div>
                    ) : recentWorkflowsList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-6 bg-base-100 rounded-xl border-2 border-dashed border-base-300">
                            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Sparkles size={36} className="text-primary" />
                            </div>
                            <div className="text-center max-w-md">
                                <h3 className="text-xl font-bold mb-2">Start building your first project</h3>
                                <p className="text-sm text-base-content/60 mb-6">
                                    Combine AI nodes to create powerful automation projects
                                </p>
                                <button
                                    onClick={createNewWorkflow}
                                    disabled={!hasApiKey || (workflowLimits && !workflowLimits.can_create)}
                                    className={`btn rounded-xl gap-2 px-6 h-12 font-bold
                                            ${workflowLimits && !workflowLimits.can_create ? 'btn-disabled opacity-70' : 'btn-primary'}`}
                                >
                                    <Plus size={20} /> {workflowLimits && !workflowLimits.can_create ? 'Limit Reached' : 'Create Project'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {recentWorkflowsList.map((wf) => (
                                <div
                                    key={wf.id}
                                    onClick={() => navigate(`/workflow/${wf.id}`)}
                                    className="group card bg-base-100 border border-base-300 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 cursor-pointer aspect-[5/3] rounded-2xl overflow-hidden"
                                >
                                    <div className="h-1/2 relative overflow-hidden">
                                        <img src={activeTheme.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-all" />
                                        <Zap className="absolute right-4 bottom-4 opacity-[0.08] group-hover:opacity-[0.15] transition-all" size={56} />
                                    </div>
                                    <div className="p-4 flex flex-col h-1/2 bg-base-100">
                                        <h3 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">{wf.name}</h3>
                                        <div className="mt-auto pt-3 flex items-center">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-base-content/30 uppercase">
                                                <Calendar size={11} />
                                                <span>{new Date(wf.updated_at || wf.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {toast && (
                <div className="toast toast-end toast-bottom z-[100]">
                    <div className={`alert text-xs font-bold rounded-lg shadow-xl ${toast.type === 'success' ? 'alert-success' : 'alert-error'}`}>{toast.msg}</div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
