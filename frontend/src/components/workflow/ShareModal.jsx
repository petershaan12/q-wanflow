import React, { useState } from 'react';
import { X, Copy, ChevronDown, Check, User as UserIcon } from 'lucide-react';
import useAuthStore from '../../stores/authStore';

const ShareModal = ({ isOpen, onClose, shareId, sharePermission, onUpdatePermission }) => {
    const { user } = useAuthStore();
    const [copied, setCopied] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    if (!isOpen) return null;

    const shareUrl = `${window.location.origin}/share/${shareId}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const permissions = [
        { id: 'view', label: 'Can view', description: 'Anyone with the link can view' },
        { id: 'edit', label: 'Can edit', description: 'Anyone with the link can edit' },
        { id: 'private', label: 'Private', description: 'Only you can access' }
    ];

    const currentPerm = permissions.find(p => p.id === sharePermission) || (sharePermission === 'private' ? permissions[2] : permissions[0]);

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-base-300/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-base-100 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 border border-base-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-2">
                    <h3 className="text-xl font-bold text-base-content">Share this space</h3>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 pb-6 space-y-6">
                    <p className="text-sm text-base-content/60">
                        To collaborate in a space, you can use shared projects with a Teams plan or invite others with an invite link.
                    </p>

                    <div className="space-y-4">
                        <div className="relative flex items-center w-full">
                            <input
                                type="text"
                                readOnly
                                value={shareUrl}
                                className="input input-bordered input-md w-full pr-36 focus:outline-none"
                            />
                            <div className="absolute right-1 top-1 bottom-1 flex items-center">
                                <div className="relative h-full flex items-center">
                                    <button
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className="btn btn-sm btn-ghost gap-1 font-semibold"
                                    >
                                        {currentPerm.label}
                                        <ChevronDown size={14} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showDropdown && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
                                            <ul className="absolute right-0 top-full mt-2 w-32 menu bg-base-100 border border-base-300 rounded-box shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                                {permissions.map((p) => (
                                                    <li key={p.id}>
                                                        <button
                                                            onClick={() => {
                                                                onUpdatePermission(p.id);
                                                                setShowDropdown(false);
                                                            }}
                                                            className={`flex items-center justify-between font-medium ${sharePermission === p.id ? 'active' : ''}`}
                                                        >
                                                            <span>{p.label}</span>
                                                            {sharePermission === p.id && <Check size={16} />}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCopy}
                            className={`btn w-full font-bold shadow-lg ${copied ? 'btn-success text-white' : 'btn-primary'}`}
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                            {copied ? 'Copied Link' : 'Copy invite link'}
                        </button>
                    </div>

                    <div className="pt-6 mt-6 border-t border-base-300">
                        <h4 className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-4">People with access</h4>
                        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-base-200 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="avatar">
                                    <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center border border-base-300">
                                        {user?.profile_picture_url ? (
                                            <img src={user.profile_picture_url} alt={user.name} />
                                        ) : (
                                            <UserIcon size={20} className="text-base-content/40 mt-2 ml-2" />
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm text-base-content">{user?.name} (you)</span>
                                    <span className="text-xs text-base-content/60">{user?.email}</span>
                                </div>
                            </div>
                            <span className="badge badge-ghost text-xs font-semibold">Owner</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
