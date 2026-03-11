import React, { memo, useState } from 'react';
import { Position, useReactFlow } from '@xyflow/react';
import { Type, Sparkles } from 'lucide-react';
import NodeBase from './NodeBase';
import { NodeHandle } from './NodePrimitives';
import useThemeStore from '../../../stores/themeStore';
import aiService from '../../../services/aiService';

const PromptNode = memo(({ id, data, selected, onSaveNode, showToast, onDeleteNode, canEdit }) => {
    const { setNodes } = useReactFlow();
    const { darkMode } = useThemeStore();
    const [val, setVal] = useState(data.prompt_template || '');
    const [enhancing, setEnhancing] = useState(false);

    const handleChange = (e) => {
        const v = e.target.value;
        setVal(v);
        setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, prompt_template: v } } : n));
    };

    const handleEnhance = async () => {
        if (!val.trim() || enhancing) return;
        setEnhancing(true);
        try {
            const enhanced = await aiService.enhancePrompt(val);
            const normalized = (enhanced || '').trim();
            if (!normalized) {
                throw new Error('Enhance result is empty. Prompt lama tetap dipakai.');
            }
            setVal(normalized);
            setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, prompt_template: normalized } } : n));
            showToast?.('success', 'Prompt enhanced');
        } catch (err) {
            console.error('Failed to enhance prompt:', err);
            showToast?.('error', err.message || 'Failed to enhance prompt');
        } finally {
            setEnhancing(false);
        }
    };

    return (
        <div className="relative">
            <NodeHandle type="source" position={Position.Right} id="output" icon={Type} top="50%" label="Text" />

            <NodeBase id={id} data={data} selected={selected} title="Prompt" icon={Type} minWidth={400} minHeight={160} onSaveNode={onSaveNode} onDeleteNode={onDeleteNode} canEdit={canEdit}>
                <div className="px-3 py-2 flex-1 flex flex-col min-h-0">
                    <textarea
                        value={val}
                        onChange={handleChange}
                        onKeyDown={(e) => e.stopPropagation()}
                        onWheel={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        readOnly={canEdit === false}
                        className={`nodrag nowheel w-full h-full min-h-0 bg-transparent text-sm resize-none overflow-y-auto focus:outline-none leading-relaxed placeholder:opacity-30 font-medium
              ${darkMode ? 'text-white/80' : 'text-slate-700'}`}
                        placeholder={`Try "Happy dog with sunglasses and floating ring"`}
                    />
                </div>
                <div className={`flex items-center justify-between px-3 py-2 border-t
          ${darkMode ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                    {canEdit !== false ? (
                        <button
                            onClick={handleEnhance}
                            disabled={enhancing}
                            className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg transition-colors
                            bg-base-100 border border-base-300/40 text-base-content/80 shadow-sm ${enhancing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Sparkles size={9} className={enhancing ? 'animate-pulse' : ''} />
                            {enhancing ? 'Enhancing...' : 'Enhance'}
                        </button>
                    ) : <div />}
                    <span className={`text-xs font-bold tabular-nums ${darkMode ? 'text-white/15' : 'text-slate-300'}`}>
                        {val.length} / 2000
                    </span>
                </div>
            </NodeBase>
        </div>
    );
});

export default PromptNode;
