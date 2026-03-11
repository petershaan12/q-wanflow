import React, { useState } from 'react';
import {
    User, Mail, Shield, Bell, Cloud,
    Github, Linkedin, Save, Camera, CreditCard
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const ProfilePage = () => {
    const { user } = useAuthStore();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(false);

    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
        bio: 'AI Workflow Enthusiast & Full Stack Developer',
        location: 'Jakarta, Indonesia',
        website: 'https://petershaan.dev'
    });

    const handleSave = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            // Logic would go here
        }, 1000);
    };

    return (
        <div className="flex h-screen bg-base-200 overflow-hidden">
            <Sidebar
                activeTab="profile"
                collapsed={sidebarCollapsed}
                setCollapsed={setSidebarCollapsed}
            />

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <Topbar title="Profile Settings" onMenuClick={() => setSidebarCollapsed(false)} />

                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row gap-8 items-center bg-base-100 p-8 rounded-3xl border border-base-300/50 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                            <div className="relative group">
                                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-accent p-1 shadow-lg">
                                    <div className="w-full h-full rounded-[20px] bg-base-100 flex items-center justify-center overflow-hidden">
                                        {user?.profile_picture_url ? (
                                            <img
                                                src={user.profile_picture_url}
                                                alt={profile.name || 'User'}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <img
                                                src={`https://ui-avatars.com/api/?name=${profile.name}&background=random&size=200`}
                                                alt={profile.name || 'User'}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                </div>
                                <button className="absolute -bottom-2 -right-2 btn btn-circle btn-primary btn-sm shadow-xl">
                                    <Camera size={14} />
                                </button>
                            </div>

                            <div className="text-center md:text-left space-y-2">
                                <h2 className="text-3xl font-bold ">{profile.name || 'User Name'}</h2>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-base-content/50 font-medium">
                                    <span className="flex items-center gap-1.5"><Mail size={14} /> {profile.email}</span>
                                    <span className="flex items-center gap-1.5"><Shield size={14} /> Administrator</span>
                                </div>
                                <div className="pt-2">
                                    <span className="badge badge-primary py-3 px-4 font-bold text-xs uppercase tracking-widest bg-yellow-500/15 text-yellow-500 border-none">
                                        Pro Lifetime Member
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Main Settings Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Form */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="card bg-base-100 border border-base-300/50 shadow-sm rounded-3xl">
                                    <div className="card-body p-8">
                                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                            <User size={18} className="text-primary" /> Personal Information
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-bold text-xs uppercase tracking-wide opacity-50">Full Name</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={profile.name}
                                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                    className="input input-bordered bg-base-200/50 border-base-300 focus:bg-base-100 transition-all rounded-xl"
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-bold text-xs uppercase tracking-wide opacity-50">Email Address</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    disabled
                                                    value={profile.email}
                                                    className="input input-bordered bg-base-200/50 border-base-300 opacity-60 rounded-xl"
                                                />
                                            </div>
                                            <div className="form-control md:col-span-2">
                                                <label className="label">
                                                    <span className="label-text font-bold text-xs uppercase tracking-wide opacity-50">Bio / About Me</span>
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={profile.bio}
                                                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                                    className="textarea textarea-bordered bg-base-200/50 border-base-300 focus:bg-base-100 transition-all rounded-xl"
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-bold text-xs uppercase tracking-wide opacity-50">Location</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={profile.location}
                                                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                                    className="input input-bordered bg-base-200/50 border-base-300 focus:bg-base-100 transition-all rounded-xl"
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-bold text-xs uppercase tracking-wide opacity-50">Website</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={profile.website}
                                                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                                                    className="input input-bordered bg-base-200/50 border-base-300 focus:bg-base-100 transition-all rounded-xl"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-8">
                                            <button
                                                onClick={handleSave}
                                                disabled={loading}
                                                className="btn btn-primary rounded-xl btn-sm gap-2"
                                            >
                                                {loading && <span className="loading loading-spinner loading-xs"></span>}
                                                <Save size={16} /> Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="card bg-base-100 border border-base-300/50 shadow-sm rounded-3xl">
                                    <div className="card-body p-8">
                                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                            <CreditCard size={18} className="text-primary" /> Billing & Subscription
                                        </h3>
                                        <div className="flex items-center justify-between p-6 bg-primary/5 rounded-2xl border border-primary/10">
                                            <div>
                                                <p className="font-bold text-lg">Pro Lifetime Plan</p>
                                                <p className="text-xs opacity-60">Everything unlimited, forever.</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold">Rp 50.000</p>
                                                <p className="text-xs uppercase font-bold tracking-widest opacity-40">One-time paid</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Cards */}
                            <div className="space-y-6">
                                <div className="card bg-base-100 border border-base-300/50 shadow-sm rounded-3xl">
                                    <div className="card-body p-8">
                                        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                                            <Shield size={16} className="text-primary" /> Security
                                        </h3>
                                        <div className="space-y-4">
                                            <button className="btn btn-ghost btn-sm btn-block justify-start rounded-xl text-xs gap-3">
                                                <span className="w-1.5 h-1.5 rounded-full bg-success"></span> Two-Factor Auth
                                                <span className="ml-auto opacity-40">Enabled</span>
                                            </button>
                                            <button className="btn btn-ghost btn-sm btn-block justify-start rounded-xl text-xs gap-3">
                                                <span className="w-1.5 h-1.5 rounded-full bg-warning"></span> Login Sessions
                                                <span className="ml-auto opacity-40">3 Active</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="card bg-base-100 border border-base-300/50 shadow-sm rounded-3xl">
                                    <div className="card-body p-8">
                                        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                                            <Cloud size={16} className="text-primary" /> Connected Accounts
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <Github size={18} className="opacity-60" />
                                                <span className="text-xs font-medium">GitHub</span>
                                                <div className="ml-auto badge badge-outline badge-xs opacity-40">Not linked</div>
                                            </div>
                                            <div className="flex items-center gap-3 text-primary">
                                                <Cloud size={18} />
                                                <span className="text-xs font-bold">Google Cloud</span>
                                                <div className="ml-auto badge badge-primary badge-xs">Connected</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ProfilePage;
