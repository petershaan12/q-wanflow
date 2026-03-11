import React, { useState, useRef, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Send, X, Check, RotateCcw, Trash2 } from 'lucide-react';
import useAuthStore from '../../../stores/authStore';
import useThemeStore from '../../../stores/themeStore';

const UserAvatar = ({ userObj, className = "w-full h-full" }) => {
    if (userObj?.profile_picture_url) {
        return (
            <img
                src={userObj.profile_picture_url}
                alt="Avatar"
                className={`${className} object-cover`}
            />
        );
    }
    const nameStr = userObj?.name || 'User';
    const init = nameStr.charAt(0).toUpperCase();
    return (
        <div className={`${className} bg-gradient-to-br from-orange-400 to-rose-500 text-white flex items-center justify-center font-bold`}>
            {init}
        </div>
    );
};
const CommentNode = ({ id, data, selected, onSaveNode, onDeleteNode, canEdit }) => {
    const { setNodes } = useReactFlow();
    const { user } = useAuthStore();
    const { darkMode } = useThemeStore();
    const [text, setText] = useState('');
    const [replyText, setReplyText] = useState('');
    const textareaRef = useRef(null);

    // Common styling
    const glassStyle = darkMode
        ? "bg-[#1e1e1e]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
        : "bg-white/95 backdrop-blur-xl border border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.08)]";
    const comments = data.comments || [];
    const firstUser = comments[0]?.user || data.user || user || { name: 'User' };

    const getRelativeTime = useCallback((timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return '';

        const diffMs = Date.now() - date.getTime();
        const hours = Math.floor(diffMs / 3600000);
        if (hours < 1) return 'now';
        return `${hours}h ago`;
    }, []);

    const patchNodeData = useCallback((changes, persist = true) => {
        setNodes((nds) => nds.map((node) => (
            node.id === id ? { ...node, data: { ...node.data, ...changes } } : node
        )));
        if (persist) {
            onSaveNode?.(id, changes);
        }
    }, [setNodes, id, onSaveNode]);

    const submitReply = useCallback(() => {
        if (!replyText.trim()) return;
        const newComment = { user, text: replyText.trim(), timestamp: new Date().toISOString() };
        const nextComments = [...comments, newComment];
        data.onChange?.({ comments: nextComments });
        patchNodeData({ comments: nextComments });
        setReplyText('');
    }, [replyText, user, comments, data, patchNodeData]);

    const deleteComment = useCallback((indexToDelete) => {
        const nextComments = comments.filter((_, index) => index !== indexToDelete);
        data.onChange?.({ comments: nextComments });
        patchNodeData({ comments: nextComments });
    }, [comments, data, patchNodeData]);

    const deleteMe = useCallback((e) => {
        e.stopPropagation();
        if (onDeleteNode) {
            onDeleteNode(id);
            return;
        }
        setNodes((nds) => nds.filter((node) => node.id !== id));
    }, [setNodes, id, onDeleteNode]);

    const closeMe = useCallback((e) => {
        e.stopPropagation();
        setNodes((nds) => nds.map((node) => node.id === id ? { ...node, selected: false } : node));
    }, [setNodes, id]);

    if (data.isPending) {
        return (
            <div className={`flex items-start gap-4 animate-in fade-in zoom-in-95 duration-200`}>
                {/* Pin / Avatar */}
                <div className="relative group">
                    <div className="w-11 h-11 rounded-full border-2 border-primary overflow-hidden bg-base-300 shadow-lg">
                        <UserAvatar userObj={user} />
                    </div>
                </div>

                {/* Wide Input Box */}
                <div className={`w-[360px] rounded-3xl p-1.5 ${glassStyle} flex items-center gap-2 group transition-all`}>
                    <textarea
                        ref={textareaRef}
                        autoFocus
                        className={`flex-1 bg-transparent px-5 py-4 pb-4 text-sm outline-none resize-none min-h-[52px] max-h-[140px] font-medium leading-relaxed ${darkMode ? 'text-white placeholder:text-white/30' : 'text-slate-800 placeholder:text-slate-400'}`}
                        placeholder="Add a comment..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (!text.trim()) return;
                                const newComment = { user, text: text.trim(), timestamp: new Date().toISOString() };
                                patchNodeData({
                                    comments: [newComment],
                                    isPending: false,
                                    label: text.trim().substring(0, 20) + '...'
                                });
                                if (data.onSubmit) data.onSubmit(text);
                            }
                            if (e.key === 'Escape') {
                                if (data.onCancel) data.onCancel();
                            }
                        }}
                    />
                    <button
                        onClick={() => {
                            if (!text.trim()) return;
                            const newComment = { user, text: text.trim(), timestamp: new Date().toISOString() };
                            patchNodeData({
                                comments: [newComment],
                                isPending: false,
                                label: text.trim().substring(0, 20) + '...'
                            });
                            if (data.onSubmit) data.onSubmit(text);
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${text.trim()
                            ? (darkMode ? 'bg-white text-black' : 'bg-slate-900 text-white')
                            : (darkMode ? 'bg-white/10 text-white/20' : 'bg-black/5 text-slate-300')
                            } active:scale-95`}
                    >
                        <Send size={16} fill={text.trim() ? "currentColor" : "none"} />
                    </button>
                </div>
            </div>
        );
    }

    // Figma-like avatar bullet pin
    return (
        <div className={`group relative cursor-pointer transition-all duration-200 ${selected ? 'scale-110' : ''}`}>
            <div className={`w-10 h-10 rounded-full border-2 overflow-hidden shadow-lg ${data.isResolved
                ? (darkMode ? 'border-white/20' : 'border-slate-300') + " opacity-50"
                : 'border-primary'
                }`}>
                <UserAvatar userObj={firstUser} />
            </div>


            {comments.length > 1 && (
                <div className={`absolute -top-2 -left-2 text-primary-content text-xs font-bold px-1.5 py-0.5 rounded-full shadow-lg ${data.isResolved ? 'bg-slate-400' : 'bg-primary'}`}>
                    {comments.length}
                </div>
            )}

            {selected && (
                <div className={`absolute left-12 top-0 w-[400px] rounded-2xl overflow-hidden z-50 ${glassStyle}`}>
                    <div className="p-3 flex items-center justify-between">
                        <span className={`text-sm font-semibold ${darkMode ? 'text-white/80' : 'text-slate-700'}`}>Comments</span>
                        <div className="flex items-center gap-1">
                            {data.isResolved && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-success/15 text-success border border-success/30 mr-1">
                                    Solved
                                </span>
                            )}
                            {data.isResolved ? (
                                <button
                                    onClick={() => {
                                        data.onChange?.({ isResolved: false });
                                        patchNodeData({ isResolved: false });
                                    }}
                                    className="p-1 rounded hover:bg-black/5"
                                    title="Reopen"
                                >
                                    <RotateCcw size={14} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        data.onChange?.({ isResolved: true });
                                        patchNodeData({ isResolved: true });
                                    }}
                                    className="p-1 rounded hover:text-green-500"
                                    title="Resolve"
                                >
                                    <Check size={14} />
                                </button>
                            )}
                            {(canEdit !== false || firstUser?.id === user?.id) && (
                                <button onClick={deleteMe} className="p-1 rounded hover:text-red-500" title="Delete">
                                    <Trash2 size={14} />
                                </button>
                            )}
                            <button onClick={closeMe} className="p-1 rounded hover:text-red-500" title="Close">
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto p-3 space-y-3">
                        {comments.length === 0 ? (
                            <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>No messages yet.</p>
                        ) : comments.map((c, i) => (
                            <div key={i} className="flex gap-2">
                                <div className="w-8 h-8 rounded-full rounded-full overflow-hidden flex-shrink-0">
                                    <UserAvatar userObj={c.user} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className={`text-sm font-semibold ${darkMode ? 'text-white/80' : 'text-slate-700'}`}>{c.user?.name}</p>
                                        {c.timestamp && (
                                            <span className={`text-[11px] ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                                                {getRelativeTime(c.timestamp)}
                                            </span>
                                        )}
                                        {(canEdit !== false || c.user?.id === user?.id) && (
                                            <button
                                                onClick={() => deleteComment(i)}
                                                className="ml-auto p-1 rounded hover:text-red-500"
                                                title="Delete comment"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                    <p className={`text-xs ${darkMode ? 'text-white/60' : 'text-slate-600'}`}>{c.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-2">
                        <div className={`w-full h-10 pl-3 pr-1 rounded-full flex items-center gap-2 ${darkMode ? 'bg-white/10' : 'bg-slate-100'}`}>
                            <input
                                type="text"
                                value={replyText}
                                placeholder="Add a comment..."
                                className={`flex-1 bg-transparent text-xs outline-none ${darkMode ? 'text-white placeholder:text-white/30' : 'text-slate-700 placeholder:text-slate-400'}`}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        submitReply();
                                    }
                                }}
                            />
                            <button
                                onClick={submitReply}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${replyText.trim()
                                    ? (darkMode ? 'bg-white text-black' : 'bg-slate-900 text-white')
                                    : (darkMode ? 'bg-white/10 text-white/30' : 'bg-slate-300 text-slate-500')
                                    }`}
                                title="Submit comment"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommentNode;
