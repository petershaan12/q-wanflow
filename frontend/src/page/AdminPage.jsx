import React, { useState, useEffect } from 'react';
import {
    Users, Search, Trash2,
    UserPlus, ShieldCheck, Mail, Calendar,
    ChevronRight, MoreVertical, Crown, Zap
} from 'lucide-react';
import { userService } from '../services/userService';
import Topbar from '../components/Topbar';
import useAuthStore from '../stores/authStore';

const AdminPage = () => {
    const { user: currentUser, token, setAuth } = useAuthStore();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const userData = await userService.getUsers();
            setUsers(userData);
        } catch (err) {
            console.error('Error loading admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    const upgrade = async (userId) => {
        try {
            await userService.updateUserPlan(userId, 'pro');
            fetchData();
            // If updating self, update the global store as well
            if (currentUser && currentUser.id === userId) {
                setAuth({ ...currentUser, plan: 'pro' }, token);
            }
        } catch (err) {
            alert('Failed to upgrade user');
        }
    };

    const downgrade = async (userId) => {
        try {
            await userService.updateUserPlan(userId, 'free');
            fetchData();
            // If updating self, update the global store as well
            if (currentUser && currentUser.id === userId) {
                setAuth({ ...currentUser, plan: 'free' }, token);
            }
        } catch (err) {
            alert('Failed to downgrade user');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await userService.deleteUser(userId);
                fetchData();
            } catch (err) {
                alert('Failed to delete user');
            }
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <Topbar showDefaultSearch={false}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30" size={14} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="input input-sm bg-base-100 pl-9 pr-4 rounded-xl w-56 text-xs font-medium border border-base-300"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </Topbar>
            <div className="p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-fade-in">
                    <div>
                        <h1 className="text-2xl font-semibold flex items-center gap-3">
                            User Management
                        </h1>
                        <p className="text-sm text-base-content/50">
                            Oversee your organization and manage user access.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="btn btn-primary btn-sm h-10 rounded-xl gap-2 font-bold px-5 shadow-lg shadow-primary/20">
                            <UserPlus size={16} /> Add User
                        </button>
                    </div>
                </div>

                {/* Table Card */}
                <div className="bg-base-100 border border-base-300 shadow-sm rounded-xl overflow-hidden animate-fade-in">
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="p-24 flex flex-col items-center justify-center gap-3">
                                <span className="loading loading-ring loading-lg text-primary"></span>
                                <span className="text-sm font-medium text-base-content/40">Loading users...</span>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-24">
                                <Users size={48} className="mx-auto mb-4 text-base-content/20" />
                                <p className="text-lg font-bold">No users found</p>
                                <p className="text-sm text-base-content/50">Try adjusting your search filters.</p>
                            </div>
                        ) : (
                            <table className="table">
                                <thead>
                                    <tr className="bg-base-200/40 border-b border-base-300">
                                        <th className=" font-semibold text-base-content/40">Account</th>
                                        <th className="font-semibold text-base-content/40 text-center">Subscription</th>
                                        <th className="font-semibold text-base-content/40">Role</th>
                                        <th className=" text-right text-base-content/40 font-semibold tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-base-200/30 transition-colors border-b border-base-300">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    {user.profile_picture_url ? (
                                                        <img
                                                            src={user.profile_picture_url}
                                                            alt={user.name || 'User'}
                                                            className="w-10 h-10 rounded-xl object-cover shadow-sm"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center font-bold text-white text-sm shadow-sm">
                                                            {user.name?.[0]?.toUpperCase() || 'U'}
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm">{user.name || 'Anonymous'}</span>
                                                        <span className="text-xs text-base-content/50 flex items-center gap-1">
                                                            <Mail size={11} /> {user.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className={`badge badge-sm border-none rounded-lg p-3 uppercase text-xs ${user.plan === 'pro' ? 'bg-yellow-500/15 text-yellow-500' : 'bg-base-200 text-base-content/50'}`}>
                                                    {user.plan === 'pro' ? 'PRO' : 'FREE'}
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck size={14} className={user.role === 'admin' ? 'text-primary' : 'text-base-content/30'} />
                                                    <span className="text-xs font-semibold text-base-content/60 uppercase">{user.role || 'Member'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {user.plan === 'pro' ? (
                                                        <button
                                                            onClick={() => downgrade(user.id)}
                                                            className="btn btn-xs btn-ghost hover:bg-base-200 text-base-content/40 hover:text-base-content font-semibold rounded-lg h-8 px-3"
                                                        >
                                                            Downgrade
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => upgrade(user.id)}
                                                            className="btn btn-xs btn-gold font-bold rounded-lg h-8 px-3 gap-1 hover:shadow-md transition-all"
                                                        >
                                                            <Crown size={12} />
                                                            Upgrade
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-error hover:bg-error/10 transition-all"
                                                        title="Delete user"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="mt-4 text-xs text-base-content/50">
                    <p>Displaying {filteredUsers.length} total users</p>
                </div>
            </div>
        </div >
    );
};

export default AdminPage;
