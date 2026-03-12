import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
    Home, Workflow, Database, Plus,
    LogOut, Settings as SettingsIcon,
    ChevronUp, ChevronDown, PanelLeftClose, PanelLeftOpen,
    Sun, Moon, Shield, FolderPlus, Crown, Zap, Terminal
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useThemeStore from '../stores/themeStore';

const Sidebar = ({
    activeTab = 'dashboard',
    collapsed,
    setCollapsed,
    onCreateProject,
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const { darkMode, toggleDarkMode } = useThemeStore();
    const isAdmin = user?.email === 'peterhiku12@gmail.com';
    const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
    const [workflowCount, setWorkflowCount] = useState(0);

    const userName = user?.name || user?.email?.split('@')[0] || 'User';
    const userEmail = user?.email || '';
    const userInitial = userName[0].toUpperCase();
    const isPro = user?.plan === 'pro';
    const workflowLimit = isPro ? Infinity : 3;
    const showUpgradeNotif = !isPro && workflowCount >= workflowLimit;
    const remainingWorkflows = isPro ? Infinity : Math.max(workflowLimit - workflowCount, 0);

    useEffect(() => {
        const fetchWorkflowCount = async () => {
            try {
                const response = await axios.get('/api/workflows/');
                setWorkflowCount(response.data.length);
            } catch (error) {
                console.error('Error fetching workflows:', error);
            }
        };
        if (user) fetchWorkflowCount();
    }, [user]);

    const mainNav = [
        { icon: Home, label: 'Dashboard', active: location.pathname === '/dashboard', onClick: () => navigate('/dashboard') },
        { icon: Workflow, label: 'Workflows', active: location.pathname === '/workflows' || location.pathname.startsWith('/workflow'), onClick: () => navigate('/workflows') },
        { icon: Database, label: 'Assets', active: location.pathname === '/assets', onClick: () => navigate('/assets') },
    ];

    const adminNav = [
        { icon: Shield, label: 'Manage Users', active: location.pathname === '/admin', onClick: () => navigate('/admin') },
        { icon: Terminal, label: 'System Logs', active: location.pathname === '/admin/logs', onClick: () => navigate('/admin/logs') },
    ];

    const footerNav = [
        { icon: darkMode ? Sun : Moon, label: 'Appearance', onClick: toggleDarkMode },
        { icon: LogOut, label: 'Sign Out', active: location.pathname === '/logout', onClick: () => logout() },
    ];

    const AvatarBox = ({ initial, size = 4, type = 'user', src = null }) => {
        const bgClass = type === 'project'
            ? 'bg-gradient-to-br from-indigo-500 to-blue-600'
            : 'bg-gradient-to-br from-orange-400 to-rose-500';

        return (
            <div className={`w-${size} h-${size} rounded-md ${bgClass} flex items-center justify-center text-white font-medium text-xs flex-shrink-0 overflow-hidden`}>
                {src ? (
                    <img src={src} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    initial
                )}
            </div>
        );
    };

    if (collapsed) {
        return (
            <div className="w-16 bg-base-100 border-r border-base-300 flex flex-col items-center py-4 gap-4 z-20 flex-shrink-0 h-full transition-all duration-300">
                <button onClick={() => setCollapsed(false)} className="text-base-content/40 hover:text-base-content transition-colors mt-2">
                    <PanelLeftOpen size={15} />
                </button>
                <div className="flex flex-col w-full px-2 mt-1 gap-2">
                    {mainNav.map(({ icon: Icon, label, active, onClick }) => (
                        <button key={label} onClick={onClick} title={label} className={`btn btn-sm  w-10 mx-auto rounded-lg flex items-center justify-center transition-all ${active ? 'text-primary' : 'text-base-content/40  btn-ghost'}`}>
                            <Icon size={15} />
                        </button>
                    ))}
                </div>
                {isAdmin && (
                    <>
                        <div className="w-8 h-px bg-base-300 my-1" />
                        <div className="flex flex-col w-full px-2 gap-2">
                            {adminNav.map(({ icon: Icon, label, active, onClick }) => (
                                <button key={label} onClick={onClick} title={label} className={`btn btn-sm w-10 mx-auto rounded-lg flex items-center justify-center transition-all ${active ? 'text-primary' : 'text-base-content/40 btn-ghost'}`}>
                                    <Icon size={15} />
                                </button>
                            ))}
                        </div>
                    </>
                )}
                <div className="flex-1" />
                <div className="flex flex-col items-center gap-4">
                    {footerNav.map(({ icon: Icon, label, onClick, active }) => (
                        <button
                            key={label}
                            onClick={onClick}
                            title={label}
                            className={`btn btn-sm w-10 mx-auto rounded-lg flex items-center justify-center transition-all ${active ? 'text-primary' : (label === 'Sign Out' ? 'text-error/60 hover:text-error btn-ghost' : 'text-base-content/40 btn-ghost')}`}
                        >
                            <Icon size={16} />
                        </button>
                    ))}
                    <button onClick={() => navigate('/settings')} className="hover:scale-110 transition-transform mt-1">
                        <AvatarBox initial={userInitial} size={8} src={user?.profile_picture_url} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-[260px] bg-base-100 border-r border-base-300 flex flex-col z-20 flex-shrink-0 h-full overflow-hidden transition-all duration-300 font-sans">
            {/* Logo Row — aligned with topbar h-14 */}
            <div className="h-14 px-3 flex items-center justify-between border-b border-base-300/40 flex-shrink-0">
                <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/dashboard')}>
                    <img src="/qwen-flow.png" alt="logo" className="w-7 h-auto rounded-lg opacity-90" />
                    <span className="-ml-1 font-bold tracking-[0.2em] text-base-content text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Q-WAN<span className="opacity-40 font-light">FLOW</span>
                    </span>
                </div>
                <button onClick={() => setCollapsed(true)} className="text-base-content/40 hover:text-base-content transition-colors">
                    <PanelLeftClose size={18} />
                </button>
            </div>

            {/* Project Selector with Dropdown */}
            <div className="p-3">
                <div className="relative">
                    <button
                        onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg bg-base-100 border border-base-300 hover:bg-base-200/50 transition-all text-left group"
                    >
                        <AvatarBox initial="P" size={6} type="project" />
                        <span className="flex-1 text-sm font-medium ">Personal Project</span>
                        <ChevronDown size={14} className={`text-base-content/30 group-hover:text-base-content transition-all ${projectDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {projectDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-base-100 border border-base-300 rounded-lg shadow-2xl z-50 p-1.5 animate-fade-in">
                            <button className="w-full flex items-center gap-3 px-2 py-1 rounded-lg bg-base-200/50 text-sm font-medium text-base-content/70 mb-1">
                                <AvatarBox initial="P" size={6} type="project" />
                                Personal project
                            </button>
                            <div className="h-px bg-base-300/50 my-1" />
                            <button
                                onClick={() => {
                                    alert("Coming Soon! 🚀 (Feature 'Create New Project' is coming soon)");
                                    setProjectDropdownOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-all"
                            >
                                <FolderPlus size={16} strokeWidth={2} />
                                Create Project
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Nav */}
            <div className="flex-1 overflow-y-auto px-3 space-y-5 pb-6">
                {/* Navigation */}
                <div className="space-y-1">
                    {mainNav.map(({ icon: Icon, label, active, onClick }) => (
                        <button
                            key={label}
                            onClick={onClick}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${active ? 'bg-base-200 text-primary' : 'text-base-content hover:text-base-content hover:bg-base-200'}`}
                        >
                            <Icon size={18} strokeWidth={2} />
                            {label}
                        </button>
                    ))}
                </div>


                {/* Admin Section */}
                {isAdmin && (
                    <>
                        <div className="w-[80%] mx-auto h-[1px] bg-base-300/50" />
                        <div className="space-y-1">
                            <p className="px-3 text-xs font-medium text-base-content/30 mb-2">Admin</p>
                            {adminNav.map(({ icon: Icon, label, active, onClick }) => (
                                <button
                                    key={label}
                                    onClick={onClick}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${active ? 'bg-base-200 text-primary' : 'text-base-content hover:text-base-content hover:bg-base-200'}`}
                                >
                                    <Icon size={18} strokeWidth={2} />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Plan Notification */}
            {isPro ? (
                <div className="px-3 pb-3">
                    <div className="p-3.5 rounded-lg bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/20">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-yellow-500">You are on the Pro plan</p>
                        </div>
                        <p className="text-xs text-base-content/50 leading-relaxed">Enjoy unlimited workflows and priority processing.</p>
                    </div>
                </div>
            ) : showUpgradeNotif ? (
                <div className="px-3 pb-3">
                    <div className="p-3.5 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/15">
                        <div className="flex items-center gap-2 mb-1">
                            <Zap size={14} className="text-primary" />
                            <p className="text-sm font-bold text-primary">Workflow limit reached</p>
                        </div>
                        <p className="text-xs text-base-content/50 mb-2.5 leading-relaxed">Upgrade to Pro to create unlimited workflows.</p>
                        <button
                            onClick={() => navigate('/settings', { state: { section: 'billing' } })}
                            className="btn btn-primary btn-sm btn-block rounded-lg font-bold text-sm"
                        >
                            Upgrade Plan
                        </button>
                    </div>
                </div>
            ) : (
                <div className="px-3 pb-3">
                    <div className="p-3.5 rounded-lg bg-base-200/60 border border-base-300/60">
                        <p className="text-sm font-medium text-base-content/80 mb-0.5">Free plan usage</p>
                        <p className="text-xs text-base-content/50 leading-relaxed">
                            {workflowCount}/{workflowLimit} workflows used • {remainingWorkflows} left
                        </p>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="p-3 border-t border-base-300">
                <div className="dropdown dropdown-top w-full">
                    <label tabIndex={0} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-base-200 transition-all cursor-pointer group">
                        <AvatarBox initial={userInitial} size={8} src={user?.profile_picture_url} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium text-base-content">{userName}</p>
                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${user?.plan === 'pro' ? 'bg-yellow-500/15 text-yellow-500' : 'bg-base-200 text-base-content/40'}`}>
                                    {user?.plan === 'pro' ? 'PRO' : 'FREE'}
                                </span>
                            </div>
                            <p className="text-xs text-base-content/40 font-medium">{userEmail}</p>
                        </div>
                        <ChevronUp size={16} className="text-base-content/30 group-hover:text-base-content transition-colors" />
                    </label>
                    <ul tabIndex={0} className="dropdown-content z-[30] menu p-2 shadow-2xl bg-base-100 border border-base-300 w-full mb-2 rounded-lg gap-1">
                        <li>
                            <button onClick={() => navigate('/settings')} className="px-3 py-2.5 rounded-lg text-sm font-medium gap-3">
                                <SettingsIcon size={16} className="opacity-50" /> Settings
                            </button>
                        </li>
                        <div className="h-px bg-base-300 my-1 mx-2" />
                        <div className="px-2 pt-1 pb-2">
                            <p className="text-[11px] text-base-content/40 font-medium mb-1.5 px-1">Appearance</p>
                            <div className="grid grid-cols-2 p-0.5 rounded-lg bg-base-200/70">
                                <button
                                    onClick={() => darkMode && toggleDarkMode()}
                                    className={`h-8 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${!darkMode ? 'bg-base-100 text-base-content' : 'text-base-content/50 hover:text-base-content/80'}`}
                                >
                                    <Sun size={13} />
                                    Light
                                </button>
                                <button
                                    onClick={() => !darkMode && toggleDarkMode()}
                                    className={`h-8 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${darkMode ? 'bg-base-100 text-base-content' : 'text-base-content/50 hover:text-base-content/80'}`}
                                >
                                    <Moon size={13} />
                                    Dark
                                </button>
                            </div>
                        </div>
                        <li>
                            <button onClick={logout} className="px-3 py-2.5 rounded-lg text-sm font-medium gap-3 text-error">
                                <LogOut size={16} /> Sign Out
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </div >
    );
};

export default Sidebar;
