import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../stores/authStore';
import Topbar from '../components/Topbar';
import { assetService } from '../services/assetService';
import {
    Plus, Trash2, Zap, Search,
    Sparkles, Workflow,
    Calendar, HardDrive
} from 'lucide-react';

import { DASHBOARD_THEMES } from '../utils/constants';

const WorkflowPage = () => {
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState(null);
    const [hasApiKey, setHasApiKey] = useState(false);
    const [checkingApiKey, setCheckingApiKey] = useState(true);
    const [themeId] = useState(() => localStorage.getItem('dashboard_theme') || 'nebula');
    const [storageInfo, setStorageInfo] = useState(null);
    const [storageLoading, setStorageLoading] = useState(false);
    const [workflowLimits, setWorkflowLimits] = useState(null);

    const navigate = useNavigate();
    const { user, token } = useAuthStore();

    const activeTheme = DASHBOARD_THEMES.find((t) => t.id === themeId) || DASHBOARD_THEMES[0];

    const isPro = user?.plan === 'pro';
    const canCreateWorkflow = hasApiKey && (workflowLimits?.can_create ?? true);
    const filteredWorkflows = workflows.filter((wf) =>
        (wf.name || '').toLowerCase().includes(search.toLowerCase())
    );

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        if (user && token) fetchWorkflows();
        else if (!token) navigate('/login');
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

    const fetchWorkflows = async () => {
        try {
            const [workflowsRes, limitsRes, storageRes] = await Promise.all([
                axios.get('/api/workflows/'),
                axios.get('/api/workflows/limits'),
                assetService.getStorageInfo().catch(() => null)
            ]);
            setWorkflows(workflowsRes.data);
            setWorkflowLimits(limitsRes.data);
            if (storageRes) setStorageInfo(storageRes);
        } catch (error) {
            console.error('Error fetching workflows:', error);
        } finally {
            setLoading(false);
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
            navigate(`/workflow/${response.data.id}`);
        } catch (error) {
            console.error('Error creating workflow:', error);
            showToast('error', 'Failed to create workflow');
        } finally {
            setCreating(false);
        }
    };

    const deleteWorkflow = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Delete this workflow?')) {
            try {
                await axios.delete(`/api/workflows/${id}`);
                setWorkflows(workflows.filter((wf) => wf.id !== id));
            } catch (error) {
                console.error('Error deleting workflow:', error);
                showToast('error', 'Failed to delete workflow');
            }
        }
    };

    return (
        <>
            <Topbar showDefaultSearch={false}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30" size={14} />
                    <input
                        type="text"
                        placeholder="Search workflows..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input input-sm bg-base-100 border-base-300 w-56 rounded-xl pl-9 text-xs font-medium"
                    />
                </div>
            </Topbar>
            <div className="p-6 max-w-[1600px] mx-auto">
                {/* Page Header */}
                <div className="mb-6 animate-fade-in flex flex-col">
                    <h1 className="text-2xl font-semibold text-base-content mb-1">My Workflows</h1>
                    <div className="flex flex-wrap items-center gap-3 text-base-content/40">
                        <span className="flex items-center gap-1.5"><Workflow size={14} />
                            {workflowLimits ? (
                                <>
                                    {workflowLimits.project_count} of {workflowLimits.project_limit_human} project{workflowLimits.project_count !== 1 ? 's' : ''}
                                    {workflowLimits.plan === 'free' && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${workflowLimits.project_count >= workflowLimits.project_limit ? 'bg-error/20 text-error' : 'bg-primary/10 text-primary'}`}>
                                            {workflowLimits.project_limit > 0 ? Math.round((workflowLimits.project_count / workflowLimits.project_limit) * 100) : 0}%
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span className="text-xs uppercase tracking-wider">
                                    {filteredWorkflows.length} project{filteredWorkflows.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </span>
                        {storageInfo && storageInfo.plan === 'free' && (
                            <span className="flex items-center gap-1.5"><HardDrive size={14} />
                                {storageInfo.storage_used_human} / {storageInfo.storage_limit_human}
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-3 opacity-30">
                        <span className="loading loading-ring loading-lg text-primary" />
                        <span className="text-sm font-bold tracking-[0.2em] uppercase">Loading...</span>
                    </div>
                ) : filteredWorkflows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-base-100 border-2 border-dashed border-base-300 rounded-2xl">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-5">
                            <Sparkles size={40} className="text-primary/40" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Build your first AI workflow</h3>
                        <p className="text-sm text-base-content/50 mb-6 max-w-xs text-center">Combine nodes, automate tasks, and unleash the power of AI.</p>
                        <button 
                            onClick={createNewWorkflow}
                            disabled={!canCreateWorkflow}
                            className={`btn rounded-xl gap-2 shadow-lg px-8 h-12 font-bold
                                ${canCreateWorkflow 
                                    ? 'btn-primary' 
                                    : 'btn-disabled opacity-70'}`}
                        >
                            <Plus size={20} /> {!hasApiKey ? 'No API Key' : !workflowLimits?.can_create ? 'Limit Reached' : 'Start Building'}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-fade-in">
                        {/* New Workflow Card */}
                        <div
                            onClick={!canCreateWorkflow ? undefined : createNewWorkflow}
                            className={`group card bg-base-100 border-2 border-dashed transition-all duration-300 cursor-pointer aspect-[5/3] flex flex-col items-center justify-center gap-3 rounded-2xl
                                ${canCreateWorkflow 
                                    ? 'border-base-300 hover:border-primary/50 hover:bg-primary/5' 
                                    : 'border-base-300/50 opacity-50 cursor-not-allowed'}`}
                        >
                            <div className={`w-12 h-12 rounded-xl border-2 border-dashed flex items-center justify-center transition-all group-hover:scale-110
                                ${canCreateWorkflow ? 'border-base-content/10 group-hover:border-primary/40 text-base-content/20 group-hover:text-primary' : 'border-base-content/20 text-base-content/30'}`}>
                                <Plus size={28} />
                            </div>
                            <span className="text-xs font-bold tracking-wider uppercase transition-colors text-base-content/40 group-hover:text-primary">New Project</span>
                            {!canCreateWorkflow && (
                                <span className="text-[9px] font-bold text-error uppercase tracking-wider mt-1">{!hasApiKey ? 'No API Key' : 'Limit Reached'}</span>
                            )}
                        </div>

                        {filteredWorkflows.map((wf) => (
                            <div
                                key={wf.id}
                                onClick={() => navigate(`/workflow/${wf.id}`)}
                                className="group card bg-base-100 border border-base-300 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 cursor-pointer aspect-[5/3] rounded-2xl overflow-hidden"
                            >
                                <div className="h-1/2 relative overflow-hidden">
                                    <img src={activeTheme.cover} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-all duration-300" />
                                    <Zap className="absolute right-4 bottom-4 opacity-20 text-white group-hover:opacity-40 transition-all duration-500" size={56} />
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={(e) => deleteWorkflow(wf.id, e)} className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-error transition-all bg-black/20 backdrop-blur-md rounded-lg">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 flex flex-col h-1/2 bg-base-100">
                                    <h3 className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1">{wf.name}</h3>
                                    <div className="mt-auto pt-3 flex items-center">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-base-content/30 uppercase">
                                            <Calendar size={11} /> {new Date(wf.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {toast && (
                <div className="toast toast-end toast-bottom z-[100]">
                    <div className={`alert text-xs font-bold rounded-lg shadow-xl ${toast.type === 'success' ? 'alert-success' : 'alert-error'}`}>{toast.msg}</div>
                </div>
            )}
        </>
    );
};

export default WorkflowPage;
