import React, { memo, useState } from 'react';
import { Position, useReactFlow, useEdges } from '@xyflow/react';
import { Image as ImageIcon, Type, Sparkles } from 'lucide-react';
import NodeBase from '../NodeBase';
import { NodeHandle, SelectPill, GenerateButton, Toggle } from '../NodePrimitives';
import useThemeStore from '../../../../stores/themeStore';
import {
    mergePromptParts, getLinkedText,
    ImagePreview, PromptArea, NegativePromptArea,
    useImageGeneration
} from './WanImageBase';

const MODELS = ['wan2.6-t2i', 'wan2.2-t2i-flash'];

const WanImageT2I = memo(({ id, data, selected, showToast, onDeleteNode, canEdit }) => {
    const { getNodes, getEdges, setNodes } = useReactFlow();
    const edges = useEdges();
    const { darkMode: dark } = useThemeStore();

    const [prompt, setPrompt] = useState(data.prompt || '');
    const [negativePrompt, setNegativePrompt] = useState(data.negativePrompt || '');
    const [aspect, setAspect] = useState(data.aspectRatio || '1:1');
    const [model, setModel] = useState(data.model || 'wan2.6-t2i');
    const [useNeg, setUseNeg] = useState(data.useNegativePrompt !== undefined ? data.useNegativePrompt : false);

    const {
        loadingStatus, loadingMessage, loadingProgress,
        enhancing, generating,
        upd, handleCancel, handleEnhance, handleGenerate, clearStatus
    } = useImageGeneration({ id, data, showToast, setNodes });

    const connectedPromptsCount = edges.filter(e => e.target === id && e.targetHandle === 'text-prompt').length;

    const onGenerate = () => {
        const linkedPrompt = getLinkedText(id, 'text-prompt', getEdges, getNodes);
        const effectivePrompt = mergePromptParts(linkedPrompt, prompt);

        handleGenerate({
            prompt: effectivePrompt,
            negative_prompt: useNeg ? (negativePrompt || undefined) : undefined,
            model,
            aspect_ratio: aspect,
            mode: 't2i'
        });
    };

    const aspectOpts = ['1:1', '16:9', '9:16', '4:3', '3:4', '2:3', '3:2'].map(v => ({ label: v, value: v }));
    const modelOpts = MODELS.map(v => ({ label: v.replace('wan2.6-', '').replace('wan2.2-', ''), value: v }));
    const aspectClass = {
        '1:1': 'aspect-square', '16:9': 'aspect-video',
        '9:16': 'aspect-[9/16]', '4:3': 'aspect-[4/3]',
        '3:4': 'aspect-[3/4]', '2:3': 'aspect-[2/3]', '3:2': 'aspect-[3/2]',
    }[aspect] || 'aspect-square';

    return (
        <div className="relative">
            <NodeHandle type="target" position={Position.Left} id="text-prompt" icon={Type} top="50%" label="Text Prompt" />
            <NodeHandle type="source" position={Position.Right} id="output" icon={ImageIcon} top="50%" label="Image Output" />

            <NodeBase id={id} data={data} selected={selected} title="T2I · Text to Image" icon={ImageIcon} minWidth={400} onDeleteNode={onDeleteNode} canEdit={canEdit}>
                <ImagePreview
                    imageUrl={data.imageUrl}
                    modeBadge="T2I"
                    aspectClass={aspectClass}
                    loadingStatus={loadingStatus}
                    loadingMessage={loadingMessage}
                    loadingProgress={loadingProgress}
                    clearStatus={clearStatus}
                    dark={dark}
                />

                <PromptArea prompt={prompt} setPrompt={setPrompt} upd={upd} dark={dark} canEdit={canEdit} />
                {useNeg && <NegativePromptArea negativePrompt={negativePrompt} setNegativePrompt={setNegativePrompt} upd={upd} dark={dark} canEdit={canEdit} />}

                <div className={`flex items-center gap-1.5 px-3 py-2 border-t ${dark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                    <div className="flex gap-1.5 flex-wrap flex-1">
                        {canEdit !== false && (
                            <button
                                onClick={() => handleEnhance(prompt, setPrompt)}
                                disabled={enhancing}
                                className={`flex items-center gap-1 text-xs font-bold px-2 py-1.5 rounded-lg transition-all bg-base-100 border border-base-300/40 text-base-content/80 shadow-sm hover:opacity-100`}
                            >
                                <Sparkles size={10} className={enhancing ? 'animate-pulse text-indigo-400' : ''} />
                                {enhancing ? 'Enhancing...' : 'Enhance'}
                            </button>
                        )}
                        <SelectPill label={aspect} options={aspectOpts} value={aspect} onChange={v => { setAspect(v); upd('aspectRatio', v); }} disabled={canEdit === false} />
                        <SelectPill label={model.replace('wan2.6-', '').replace('wan2.2-', '')} options={modelOpts} value={model} onChange={v => { setModel(v); upd('model', v); }} disabled={canEdit === false} />
                        <div className="flex items-center px-1">
                            <Toggle value={useNeg} label="Neg" onChange={v => { setUseNeg(v); upd('useNegativePrompt', v); }} disabled={canEdit === false} />
                        </div>

                        {connectedPromptsCount > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/5 border border-primary/10 animate-fade-in w-fit">
                                <Sparkles size={10} className="text-primary animate-pulse" />
                                <span className="text-[10px] font-bold text-primary/70 uppercase tracking-tight truncate">
                                    {connectedPromptsCount} Ext Prompt{connectedPromptsCount > 1 ? 's' : ''}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="ml-auto">
                        {canEdit !== false && <GenerateButton onClick={onGenerate} isGenerating={generating} onCancel={handleCancel} />}
                    </div>
                </div>
            </NodeBase>
        </div>
    );
});

export default WanImageT2I;
