import React from 'react';
import { Pencil, Copy, Trash2 } from 'lucide-react';
import useThemeStore from '../../../stores/themeStore';

const NodeContextMenu = ({ menu, setMenu, renameNode, duplicateNode, deleteNode }) => {
    const { darkMode } = useThemeStore();

    if (!menu) return null;

    return (
        <div
            style={{ top: menu.top, left: menu.left }}
            className={`fixed z-[100] w-32 p-1 rounded-2xl border shadow-2xl animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl
                ${darkMode ? 'bg-black/60 border-white/10 shadow-black' : 'bg-white/80 border-slate-200 shadow-slate-200'}`}
            onClick={() => setMenu(null)}
        >
            <div className="px-2 py-1.5 mb-1">
                <p className="text-xs font-medium opacity-30">Node Actions</p>
            </div>
            <button
                onClick={() => { renameNode(menu.id); setMenu(null); }}
                className={`flex items-center gap-3 w-full px-2 py-2 rounded-xl text-left text-xs font-semibold transition-all
                    ${darkMode ? 'hover:bg-white/10 text-white/70' : 'hover:bg-slate-100 text-slate-600'}`}
            >
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary"><Pencil size={14} /></div>
                Rename
            </button>
            <button
                onClick={() => { duplicateNode(menu.id); setMenu(null); }}
                className={`flex items-center gap-3 w-full px-2 py-2 rounded-xl text-left text-xs font-semibold transition-all
                    ${darkMode ? 'hover:bg-white/10 text-white/70' : 'hover:bg-slate-100 text-slate-600'}`}
            >
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400"><Copy size={14} /></div>
                Duplicate
            </button>
            <div className={`my-1 border-t ${darkMode ? 'border-white/5' : 'border-slate-100'}`} />
            <button
                onClick={() => { deleteNode(menu.id); setMenu(null); }}
                className={`flex items-center gap-3 w-full px-2 py-2 rounded-xl text-left text-xs font-semibold transition-all text-error
                    ${darkMode ? 'hover:bg-error/10' : 'hover:bg-error/5'}`}
            >
                <div className="p-1.5 rounded-lg bg-error/10 text-error"><Trash2 size={14} /></div>
                Delete
            </button>
        </div>
    );
};

export default NodeContextMenu;
