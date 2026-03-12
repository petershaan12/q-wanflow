import React, { useState, useEffect } from 'react';
import { useReactFlow, NodeResizer } from '@xyflow/react';
import axios from 'axios';
import { Trash2, Lock } from 'lucide-react';
import useThemeStore from '../../../stores/themeStore';

/**
 * NodeBase — thin card shell used by every node.
 * - rename on double-click header
 * - delete button on hover
 * - lock indicator
 * - NO overflow:hidden anywhere (dropdowns must escape freely)
 */
const NodeBase = ({ id, data, selected, title, icon: Icon, children, minWidth = 320, minHeight = 200, onSaveNode, onDeleteNode, canEdit = true, hideHeader = false, rounded = 'rounded-2xl' }) => {
    const { setNodes, getNode } = useReactFlow();
    const { darkMode } = useThemeStore();
    const [isEditing, setIsEditing] = useState(false);
    const [tempLabel, setTempLabel] = useState(data?.label || title);

    useEffect(() => {
        setTempLabel(data?.label || title);
    }, [data?.label, title]);

    useEffect(() => {
        if (data?.startRename) {
            setIsEditing(true);
            setNodes(nds =>
                nds.map(n => n.id === id ? { ...n, data: { ...n.data, startRename: false } } : n)
            );
        }
    }, [data?.startRename]);

    const deleteMe = (e) => {
        e.stopPropagation();
        if (data?.isLocked) return;
        if (onDeleteNode) {
            onDeleteNode(id);
            return;
        }
        setNodes(nds => nds.filter(n => n.id !== id));
    };

    const commitRename = async () => {
        setIsEditing(false);
        const label = tempLabel.trim() || (data?.label || title);
        setTempLabel(label);
        setNodes(nds =>
            nds.map(n => n.id === id ? { ...n, data: { ...n.data, label } } : n)
        );

        // Save to backend. Some node wrappers don't pass onSaveNode,
        // so keep a direct fallback to ensure rename always persists.
        if (onSaveNode) {
            onSaveNode(id, { label });
            return;
        }

        const node = getNode(id);
        const isPersisted = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id));
        if (!node || !isPersisted) return;

        try {
            await axios.put(`/api/nodes/${id}`, {
                type: node.type,
                position_x: Math.round(node.position?.x ?? 0),
                position_y: Math.round(node.position?.y ?? 0),
                config: { ...(node.data || {}), label },
            });
        } catch (err) {
            console.error('Error saving node label:', err);
        }
    };

    const baseClasses = `relative group transition-all duration-200 ${rounded} overflow-visible`;
    const themeClasses = darkMode ? 'bg-[#0f0f12] border-white/10' : 'bg-white border-slate-200';
    const borderClasses = 'border shadow-2xl';
    const selectionClasses = selected ? 'ring-2 ring-primary border-primary/40' : '';
    const lockedClasses = data?.isLocked ? 'opacity-70' : '';

    return (
        <div
            style={{
                width: data?.width || minWidth,
                height: data?.height ? data.height : 'auto',
                minHeight: minHeight,
                display: 'flex',
                flexDirection: 'column',
            }}
            className={`${baseClasses} ${themeClasses} ${borderClasses} ${selectionClasses} ${lockedClasses}`}
        >
            {/* Inner background - prevents bleeding for standard nodes */}
            <div className={`absolute inset-0 ${rounded} pointer-events-none z-[-1] ${darkMode ? 'bg-[#0f0f12]' : 'bg-white'}`} />

            {/* Lock badge */}
            {data?.isLocked && (
                <div className="absolute top-2 right-2 z-20 p-1 rounded-md bg-orange-500/10 text-orange-400">
                    <Lock size={10} />
                </div>
            )}

            {/* Title row */}
            {!hideHeader && (
                <div className={`flex items-center justify-between gap-2 px-3 py-2.5 border-b flex-shrink-0 z-10 ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-2 min-w-0">
                        {Icon && (
                            <Icon size={13} className={darkMode ? 'text-white/30 flex-shrink-0' : 'text-black/30 flex-shrink-0'} />
                        )}
                        {isEditing ? (
                            <input
                                autoFocus
                                value={tempLabel}
                                onChange={e => setTempLabel(e.target.value)}
                                onKeyDown={e => {
                                    e.stopPropagation();
                                    if (e.key === 'Enter') commitRename();
                                }}
                                onBlur={commitRename}
                                className={`bg-transparent text-xs font-semibold border-b border-primary/40 focus:outline-none w-full
                    ${darkMode ? 'text-white' : 'text-slate-800'}`}
                            />
                        ) : (
                            <span
                                onDoubleClick={() => canEdit !== false && setIsEditing(true)}
                                title="Double-click to rename"
                                className={`text-xs font-semibold truncate cursor-text
                    ${darkMode ? 'text-white/50' : 'text-slate-500'}`}
                            >
                                {data?.label || title}
                            </span>
                        )}
                    </div>
                    {!data?.isLocked && canEdit !== false && (
                        <button
                            onClick={deleteMe}
                            className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all
                  bg-base-100 border border-base-300/40 text-base-content/80 shadow-sm `}
                        >
                            <Trash2 size={11} />
                        </button>
                    )}
                </div>
            )}

            {/* Content — flex-1 allows children to fill resized height */}
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar relative z-0">
                {hideHeader && !data?.isLocked && canEdit !== false && (
                    <button
                        onClick={deleteMe}
                        className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all z-20
                        bg-black/5 hover:bg-black/10 text-slate-500 hover:text-red-500`}
                    >
                        <Trash2 size={12} />
                    </button>
                )}
                {children}
            </div>

            <NodeResizer
                isVisible={selected && !data?.isLocked && canEdit !== false}
                minWidth={minWidth}
                minHeight={minHeight}
                onResize={(evt, params) => {
                    const changes = { width: params.width, height: params.height };
                    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...changes } } : n));
                    if (onSaveNode) onSaveNode(id, changes);
                }}
            />

            <style>{`
                /* Hide the indigo boundary lines */
                .react-flow__node-resizer__line {
                    display: none !important;
                }
                
                /* Completely hide all visual resize handles/dots across all React Flow versions */
                .react-flow__resize-control,
                .react-flow__node-resizer__handle,
                .react-flow__resize-control.handle {
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    min-width: 0 !important;
                    min-height: 0 !important;
                }
                
                /* Hide all handles except bottom-right visually */
                .react-flow__resize-control:not(.bottom):not(.right),
                .react-flow__node-resizer__handle:not(.bottom-right) {
                    display: none !important;
                    pointer-events: none !important;
                }

                /* Make the bottom-right handle a large invisible hit area */
                .react-flow__resize-control.bottom.right,
                .react-flow__node-resizer__handle.bottom-right,
                .react-flow__resize-control.handle.bottom.right {
                    display: block !important;
                    width: 60px !important;
                    height: 60px !important;
                    right: -10px !important;
                    bottom: -10px !important;
                    background: transparent !important;
                    border: none !important;
                    cursor: nwse-resize !important;
                    z-index: 9999 !important;
                    pointer-events: all !important;
                }

                /* Show a very subtle indigo indicator only on hover so users know where to pull */
                .react-flow__resize-control.bottom.right:hover::after,
                .react-flow__node-resizer__handle.bottom-right:hover::after,
                .react-flow__resize-control.handle.bottom.right:hover::after {
                    content: "";
                    position: absolute;
                    right: 15px;
                    bottom: 15px;
                    width: 15px;
                    height: 15px;
                    border-right: 2px solid #6366f1;
                    border-bottom: 2px solid #6366f1;
                    opacity: 0.6;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
};

export default NodeBase;
