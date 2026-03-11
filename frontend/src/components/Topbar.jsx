import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Search, Menu, ChevronRight, HelpCircle
} from 'lucide-react';

const Topbar = ({ onMenuClick, breadcrumbs, children, showDefaultSearch = true, editable = false, onEdit, editLabel, canEdit }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const editInputRef = useRef(null);

    // Handle edit mode
    useEffect(() => {
        if (isEditing && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [isEditing]);

    const handleEditClick = () => {
        if (editable && canEdit !== false) {
            setEditValue(editLabel || 'Untitled');
            setIsEditing(true);
        }
    };

    const handleEditSave = () => {
        if (editable && onEdit && editValue.trim()) {
            onEdit(editValue.trim());
        }
        setIsEditing(false);
    };

    const handleEditCancel = () => {
        setIsEditing(false);
        setEditValue('');
    };

    const handleEditKeyDown = (e) => {
        if (e.key === 'Enter') handleEditSave();
    };

    // Auto-generate breadcrumbs from location if not provided
    const defaultBreadcrumbs = (() => {
        const path = location.pathname;
        const crumbs = [{ label: 'Personal project', onClick: () => navigate('/dashboard') }];

        if (path === '/dashboard') {
            crumbs.push({ label: 'Dashboard' });
        } else if (path === '/workflows') {
            crumbs.push({ label: 'Workflows' });
        } else if (path === '/assets') {
            crumbs.push({ label: 'Assets' });
        } else if (path === '/admin') {
            crumbs.push({ label: 'Admin', onClick: () => navigate('/admin') });
            crumbs.push({ label: 'Manage Users' });
        } else if (path === '/settings') {
            crumbs.push({ label: 'Settings' });
        }

        return crumbs;
    })();

    const activeBreadcrumbs = breadcrumbs || defaultBreadcrumbs;

    return (
        <header className="h-14 bg-base-100/90 backdrop-blur-xl border-b border-base-300/40 flex items-center justify-between px-4 sticky top-0 z-30">
            <div className="flex items-center gap-2 overflow-hidden">
                <button
                    onClick={onMenuClick}
                    className="btn btn-ghost btn-sm btn-square lg:hidden"
                >
                    <Menu size={20} />
                </button>

                <div className="flex items-center gap-2 lg:hidden mr-2">
                    <img src="/qwen-flow.png" alt="logo" className="w-6 h-6 rounded-lg" />
                    <span className="font-bold text-lg ">Q-WANFLOW</span>
                </div>

                {/* Breadcrumb */}
                <nav className="hidden lg:flex items-center gap-1.5 text-sm text-base-content/40 select-none overflow-hidden">
                    {activeBreadcrumbs.map((crumb, i) => {
                        const isLast = i === activeBreadcrumbs.length - 1;
                        const isEditable = editable && isLast && canEdit !== false;

                        return (
                            <React.Fragment key={i}>
                                {i > 0 && <ChevronRight size={11} className="opacity-30 flex-shrink-0" />}
                                {crumb.onClick && !isEditable ? (
                                    <button
                                        onClick={crumb.onClick}
                                        className="hover:text-base-content/70 transition-colors flex-shrink-0"
                                    >
                                        {crumb.label}
                                    </button>
                                ) : isEditable ? (
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {isEditing ? (
                                            <div className="flex items-center gap-1 bg-base-200/60 rounded-lg px-2 py-1 border border-primary/30">
                                                <input
                                                    ref={editInputRef}
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onKeyDown={handleEditKeyDown}
                                                    onBlur={handleEditSave}
                                                    className="bg-transparent text-sm font-semibold text-base-content outline-none w-32"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 hover:bg-base-200/60 rounded-lg px-2 py-0.5 cursor-pointer transition-colors" onClick={handleEditClick}>
                                                <span className="font-semibold text-base-content/70">{crumb.label}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <span className={`flex-shrink-0 ${isLast ? 'font-semibold text-base-content/70' : 'opacity-50'}`}>
                                        {crumb.label}
                                    </span>
                                )}
                            </React.Fragment>
                        );
                    })}
                </nav>
            </div>

            <div className="flex items-center gap-2">
                {children}
                {showDefaultSearch && (
                    <div className="flex items-center gap-2 bg-base-200/60 rounded-xl px-3 py-1.5 border border-base-300/40">
                        <Search size={14} className="text-base-content/40" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            disabled={canEdit === false}
                            className="bg-transparent text-sm w-44 outline-none placeholder:text-base-content/30 disabled:opacity-50"
                        />
                    </div>
                )}
            </div>
        </header>
    );
};

export default Topbar;
