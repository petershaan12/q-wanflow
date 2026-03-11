import React from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { TOOLS } from './EditorConstants';

const EditorToolbar = ({ activeTool, setActiveTool, onUndo, onRedo, canUndo, canRedo, canEdit }) => {
    return (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-0.5 bg-base-100/95 backdrop-blur-xl border border-base-300/40 rounded-2xl p-2 shadow-2xl shadow-black/10">
            {TOOLS.filter(t => canEdit !== false || ['select', 'hand', 'comment'].includes(t.id)).map((tool) => (
                <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    title={tool.label}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${activeTool === tool.id
                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                        : 'text-base-content/50 hover:text-base-content hover:bg-base-200/70'
                        }`}
                >
                    <tool.icon size={16} strokeWidth={activeTool === tool.id ? 2.5 : 1.8} />
                </button>
            ))}

            {canEdit !== false && (
                <>
                    <div className="h-px bg-base-300/40 mx-1 my-0.5" />

                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${canUndo ? 'text-base-content/50 hover:text-base-content hover:bg-base-200/70' : 'text-base-content/15 cursor-not-allowed'}`}
                    >
                        <Undo2 size={16} />
                    </button>
                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${canRedo ? 'text-base-content/50 hover:text-base-content hover:bg-base-200/70' : 'text-base-content/15 cursor-not-allowed'}`}
                    >
                        <Redo2 size={16} />
                    </button>
                </>
            )}
        </div>
    );
};

export default EditorToolbar;
