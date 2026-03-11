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
const NodeBase = ({ id, data, selected, title, icon: Icon, children, minWidth = 320, minHeight = 200, onSaveNode, onDeleteNode, canEdit = true }) => {
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

    return (
        <div
            style={{ 
                width: data?.width || minWidth,
                height: data?.height ? data.height : 'auto',
                minHeight: minHeight,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
            className={`relative group rounded-2xl transition-all duration-200
        ${darkMode ? 'bg-[#0f0f12] border-white/10' : 'bg-white border-slate-200'} border shadow-2xl
        ${selected
                    ? 'ring-2 ring-primary border-primary/40'
                    : ''}
        ${data?.isLocked ? 'opacity-70' : ''}
      `}
        >
            <NodeResizer
                isVisible={selected && !data?.isLocked && canEdit !== false}
                minWidth={minWidth}
                minHeight={minHeight}
                onResize={(evt, params) => {
                    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, width: params.width, height: params.height } } : n));
                }}
                handleStyle={{
                    width: 20,
                    height: 20,
                    background: 'transparent',
                    border: 'none',
                }}
                lineStyle={{ borderColor: 'transparent' }}
            />
            <style>{`
                .react-flow__node-resizer__handle { display: none !important; }
                .react-flow__node-resizer__handle.bottom-right { 
                    display: block !important; 
                    right: 1px !important;
                    bottom: 1px !important;
                    width: 24px !important;
                    height: 24px !important;
                    cursor: nwse-resize !important;
                    background: #6366f1 !important;
                    /* Create an inset corner triangle that follows the node's curve */
                    clip-path: polygon(100% 0%, 100% 100%, 0% 100%) !important;
                    border-radius: 0 0 15px 0 !important;
                    opacity: 0.15;
                    transition: all 0.2s;
                    z-index: 40 !important;
                }
                .react-flow__node-resizer__handle.bottom-right:hover {
                    opacity: 0.8;
                    background: #6366f1 !important;
                }
                .react-flow__node-resizer__handle.bottom-right::after {
                    content: "";
                    position: absolute;
                    right: 3px;
                    bottom: 3px;
                    width: 10px;
                    height: 10px;
                    border-right: 2px solid white;
                    border-bottom: 2px solid white;
                    border-radius: 0 0 2px 0;
                    opacity: 0.5;
                }
            `}</style>

            {/* Lock badge */}
            {data?.isLocked && (
                <div className="absolute top-2 right-2 z-20 p-1 rounded-md bg-orange-500/10 text-orange-400">
                    <Lock size={10} />
                </div>
            )}

            {/* Title row */}
            <div className={`flex items-center justify-between gap-2 px-3 py-2.5 border-b flex-shrink-0 ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
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

            {/* Content — flex-1 allows children to fill resized height */}
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
                {children}
            </div>
        </div>
    );
};

export default NodeBase;
