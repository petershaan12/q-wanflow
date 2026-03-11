import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import {
    Key, Crown, Check, Camera, Save, User, Zap
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import Topbar from '../components/Topbar';
import { compressImage } from '../utils/imageUtils';

const SettingsPage = () => {
    const { user, token, setAuth } = useAuthStore();
    const fileInputRef = useRef(null);

    const location = useLocation();
    const [activeSection, setActiveSection] = useState(location.state?.section || 'account');
    const [qwenApiKey, setQwenApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [keySaved, setKeySaved] = useState(false);
    const [savingKey, setSavingKey] = useState(false);
    const [keyError, setKeyError] = useState('');
    const [keyConfigured, setKeyConfigured] = useState(false);
    const [maskedKeyPreview, setMaskedKeyPreview] = useState('');
    const [accountName, setAccountName] = useState('');
    const [profilePreview, setProfilePreview] = useState('');
    const [accountSaved, setAccountSaved] = useState(false);

    const userName = user?.name || 'User';
    const userEmail = user?.email || '';
    const userInitial = userName[0]?.toUpperCase() || 'U';
    const isPro = user?.plan === 'pro';

    useEffect(() => {
        setAccountName(user?.name || 'User');
        setProfilePreview(user?.profile_picture_url || '');
    }, []);

    useEffect(() => {
        const fetchKeyStatus = async () => {
            if (!token) return;
            try {
                const res = await axios.get('/api/ai/api-key');
                const configured = !!res.data?.configured;
                const maskedKey = res.data?.masked_key || '';
                setKeyConfigured(configured);
                setMaskedKeyPreview(maskedKey);
            } catch {
                setKeyConfigured(false);
                setMaskedKeyPreview('');
            }
        };
        fetchKeyStatus();
    }, [token]);

    useEffect(() => {
        setAccountName(user?.name || 'User');
        setProfilePreview(user?.profile_picture_url || '');
    }, [user?.name, user?.profile_picture_url]);

    const saveApiKey = async () => {
        const trimmed = qwenApiKey.trim();
        if (!trimmed) {
            setKeyError('API key cannot be empty.');
            return;
        }

        if (trimmed.includes('*')) {
            setKeyError('Please enter full API key, not masked key.');
            return;
        }

        setSavingKey(true);
        setKeyError('');
        try {
            await axios.post('/api/ai/api-key', { api_key: trimmed });
            localStorage.removeItem('qwen_api_key');
            const detailRes = await axios.get('/api/ai/api-key');
            const maskedKey = detailRes.data?.masked_key || '';
            setQwenApiKey('');
            setMaskedKeyPreview(maskedKey);
            setKeyConfigured(true);
            setKeySaved(true);
            setTimeout(() => setKeySaved(false), 2000);
        } catch (error) {
            const detail = error?.response?.data?.detail;
            setKeyError(typeof detail === 'string' ? detail : 'Failed to save API key to server.');
        } finally {
            setSavingKey(false);
        }
    };

    const onSelectAvatar = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // Upload file directly to backend
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await axios.post('/api/auth/me/profile-picture', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Set preview to the returned URL
            setProfilePreview(response.data.url);
        } catch (err) {
            console.error('Failed to upload avatar:', err);
            alert('Failed to upload avatar. Please try again.');
        }
    };

    const saveAccount = async () => {
        const trimmedName = accountName.trim();
        if (!trimmedName || !user) return;

        try {
            // Update backend with name only (profile picture already uploaded)
            await axios.put(`/api/users/${user.id}`, {
                name: trimmedName,
                profile_picture_url: profilePreview || null,
            });

            // Update auth store
            const updatedUser = {
                ...user,
                name: trimmedName,
                profile_picture_url: profilePreview || null,
            };
            setAuth(updatedUser, token);
            setAccountSaved(true);
            setTimeout(() => setAccountSaved(false), 1800);
        } catch (error) {
            console.error('Failed to save account:', error);
            const detail = error?.response?.data?.detail;
            alert(typeof detail === 'string' ? detail : 'Failed to save account changes.');
        }
    };

    const sections = [
        { id: 'account', label: 'Account', icon: User },
        { id: 'ai', label: 'AI Model', icon: Key },
        { id: 'billing', label: 'Billing', icon: Crown },
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'account':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-bold text-2xl">
                                    {profilePreview ? (
                                        <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                                    ) : userInitial}
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-base-100 border border-base-300 flex items-center justify-center text-base-content/70 hover:text-base-content"
                                    title="Change photo"
                                >
                                    <Camera size={14} />
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onSelectAvatar} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-base-content">{accountName}</h3>
                                <p className="text-sm text-base-content/50">{userEmail}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${isPro ? 'bg-yellow-500/15 text-yellow-500' : 'bg-base-200 text-base-content/40'}`}>
                                        {isPro ? 'PRO USER' : 'FREE USER'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-base-content/70">Full Name</label>
                                <input
                                    type="text"
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value)}
                                    className="input w-full bg-base-100 border-base-300 text-sm font-medium rounded-lg h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-base-content/70">Email Address</label>
                                <input type="text" value={userEmail} disabled className="input w-full bg-base-200/50 border-base-300 text-sm font-medium opacity-70 cursor-not-allowed rounded-lg h-11" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={saveAccount} className={`btn h-10 rounded-lg px-4 text-sm font-semibold ${accountSaved ? 'btn-success' : 'btn-primary'}`}>
                                <Save size={14} />
                                {accountSaved ? 'Saved' : 'Save Changes'}
                            </button>
                        </div>
                        <p className="text-sm text-base-content/50">Name and avatar are saved on this account session.</p>
                    </div>
                );
            case 'ai':
                return (
                    <div className="space-y-4 animate-fade-in">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-base-content/70">Qwen API Key (DashScope)</label>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type={showKey ? 'text' : 'password'}
                                        value={qwenApiKey}
                                        onChange={(e) => setQwenApiKey(e.target.value)}
                                        placeholder={keyConfigured && maskedKeyPreview
                                            ? `Configured: ${maskedKeyPreview} (paste new key to replace)`
                                            : 'sk-xxxxxxxxxxxxxxxxxxxxxxxx'}
                                        className="input w-full bg-base-100 border-base-300 text-sm font-mono pr-16 rounded-lg h-11"
                                    />
                                    <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary">
                                        {showKey ? 'HIDE' : 'SHOW'}
                                    </button>
                                </div>
                                <button onClick={saveApiKey} className={`btn px-4 rounded-lg font-semibold h-11 ${keySaved ? 'btn-success' : 'btn-primary'}`}>
                                    {savingKey ? 'SAVING...' : keySaved ? 'SAVED' : 'SAVE'}
                                </button>
                            </div>
                            {keyError && <p className="text-sm text-error">{keyError}</p>}
                            {keyConfigured && !keyError && (
                                <p className="text-sm text-success">API key is configured on server{maskedKeyPreview ? ` (${maskedKeyPreview})` : ''}.</p>
                            )}
                            <p className="text-sm text-base-content/50">
                                Get your API key from the <a href="https://dashscope.console.aliyun.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold">Alibaba Cloud Console</a>.
                            </p>
                        </div>
                    </div>
                );
            case 'billing':
                return (
                    <div className="animate-fade-in space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Free Plan */}
                            <div className={`p-5 rounded-lg border transition-all ${!isPro ? 'bg-base-100 border-primary shadow-md ring-1 ring-primary/30' : 'bg-base-200/50 border-base-300 opacity-60'}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-base-300 text-base-content/40 flex items-center justify-center">
                                        <Zap size={20} />
                                    </div>
                                    {!isPro && <span className="bg-primary text-white text-xs font-semibold px-2 py-1 rounded-md uppercase">Current</span>}
                                </div>
                                <h4 className="text-lg font-semibold">Free Plan</h4>
                                <p className="text-sm text-base-content/50 mt-1 mb-4">Perfect for short explorations</p>
                                <div className="space-y-2">
                                    {['3 Workflows', 'Standard Speed', 'Basic Nodes'].map(f => (
                                        <div key={f} className="flex items-center gap-2 text-sm font-medium">
                                            <Check size={14} className="text-success" /> {f}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xl font-bold mt-6">Free</p>
                            </div>

                            {/* Pro Plan */}
                            <div className={`p-5 rounded-lg border transition-all ${isPro ? 'bg-base-100 border-yellow-500/40 shadow-md ring-1 ring-yellow-500/20' : 'bg-base-200 border-base-300 hover:border-yellow-500/40 cursor-pointer group'}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`w-10 h-10 rounded-xl ${isPro ? 'bg-yellow-500 text-white' : 'bg-yellow-500/15 text-yellow-500 group-hover:bg-yellow-500 group-hover:text-black'} flex items-center justify-center transition-all`}>
                                        <Crown size={20} />
                                    </div>
                                    {isPro && <span className="bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded-md uppercase">Current</span>}
                                </div>
                                <h4 className="text-lg font-semibold">Pro Subscription</h4>
                                <p className="text-sm text-base-content/50 mt-1 mb-4">Unlimited AI performance</p>
                                <div className="space-y-2">
                                    {['Unlimited Workflows', 'Priority Processing', 'Advanced Nodes', 'Lifetime Access'].map(f => (
                                        <div key={f} className="flex items-center gap-2 text-sm font-medium">
                                            <Check size={14} className="text-success" /> {f}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 flex items-baseline gap-1">
                                    <span className="text-xl font-bold">Rp 50.000</span>
                                    <span className="text-xs font-semibold text-base-content/40 uppercase">Lifetime</span>
                                </div>
                                {!isPro && (
                                    <button className="btn btn-gold btn-block mt-4 rounded-lg font-bold h-10 gap-2"><Crown size={16} />Upgrade to Pro</button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <>
            <Topbar showDefaultSearch={false} />
            <div className="p-6 ">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-base-content">Settings</h1>
                    <p className="text-base text-base-content/50">Everything about your workspace.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Inner Sidebar */}
                    <div className="w-full md:w-56 space-y-2 flex-shrink-0">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-base font-medium transition-all ${activeSection === section.id
                                    ? 'bg-base-100 text-primary'
                                    : 'text-base-content/50 hover:bg-base-100 hover:text-base-content'
                                    }`}
                            >
                                <section.icon size={18} strokeWidth={2} />
                                {section.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-base-100 border border-base-300 rounded-lg p-6 min-h-[450px] shadow-sm">
                        <div className="mb-6 pb-4 border-b border-base-200">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-base-content/40">{activeSection}</h2>
                        </div>
                        {renderContent()}
                    </div>
                </div>
            </div>
        </>
    );
};

export default SettingsPage;
