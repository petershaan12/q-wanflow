import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { NODE_PALETTE } from './EditorConstants';
import useThemeStore from '../../../stores/themeStore';

const MaterialPanel = ({ isOpen, onClose, onDragStart, onInsertNode }) => {
    const [search, setSearch] = useState('');
    const { darkMode } = useThemeStore();

    if (!isOpen) return null;

    const filtered = NODE_PALETTE.filter(n =>
        n.name.toLowerCase().includes(search.toLowerCase()) ||
        n.desc.toLowerCase().includes(search.toLowerCase())
    );

    const basics = filtered.filter(n => n.category === 'basics');
    const media = filtered.filter(n => n.category === 'media');

    return (
        <div className="absolute left-20 top-1/2 -translate-y-1/2 z-50 w-64">
            <div className={`border rounded-xl shadow-2xl overflow-hidden animate-fade-in 
                ${darkMode ? 'bg-[#121217] border-white/5' : 'bg-white border-slate-200'}`}>

                <div className={`p-2.5 border-b ${darkMode ? 'border-white/5' : 'border-base-300/30'}`}>
                    <div className="flex items-center gap-2 bg-base-200/60 rounded-lg px-2.5 py-1.5">
                        <Search size={14} className="text-base-content/30" />
                        <input
                            autoFocus
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search..."
                            className="bg-transparent text-xs font-medium w-full outline-none placeholder:text-base-content/30"
                        />
                    </div>
                </div>

                <div className="max-h-[440px] overflow-y-auto py-1 custom-scrollbar">
                    {filtered.length === 0 ? (
                        <div className="py-8 text-center opacity-30 text-xs italic">No nodes found</div>
                    ) : (
                        <>
                            {basics.length > 0 && (
                                <>
                                    <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-base-content/40">Basics</p>
                                    {basics.map((node) => {
                                        const Icon = node.icon;
                                        return (
                                            <div
                                                key={node.type}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, node.type)}
                                                onClick={() => onInsertNode(node.type)}
                                                className="flex items-center gap-3 px-3 py-2 mx-1.5 rounded-lg hover:bg-base-200/70 cursor-pointer transition-all group"
                                            >
                                                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-sm border border-current/20 flex-shrink-0 ${node.color}`}>
                                                    <Icon size={14} strokeWidth={2} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-bold text-base-content/80 group-hover:text-base-content truncate">{node.name}</span>
                                                    <span className="text-[9px] opacity-40 truncate">{node.desc}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                            {media.length > 0 && (
                                <>
                                    <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-base-content/40">Media & AI</p>
                                    {media.map((node) => {
                                        const Icon = node.icon;
                                        return (
                                            <div
                                                key={node.type}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, node.type)}
                                                onClick={() => onInsertNode(node.type)}
                                                className="flex items-center gap-3 px-3 py-2 mx-1.5 rounded-lg hover:bg-base-200/70 cursor-pointer transition-all group"
                                            >
                                                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-sm border border-current/20 flex-shrink-0 ${node.color}`}>
                                                    <Icon size={14} strokeWidth={2} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-bold text-base-content/80 group-hover:text-base-content truncate">{node.name}</span>
                                                    <span className="text-[9px] opacity-40 truncate">{node.desc}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MaterialPanel;
