import React, { memo, useState, useEffect } from 'react';
import { Position, useReactFlow, useEdges } from '@xyflow/react';
import { Image as ImageIcon, Type, Sparkles, Copy, Plus, Trash2 } from 'lucide-react';
import NodeBase from '../NodeBase';
import { NodeHandle, SelectPill, Stepper, GenerateButton, Toggle } from '../NodePrimitives';
import useThemeStore from '../../../../stores/themeStore';
import {
    mergePromptParts, getLinkedText, getLinkedImageUrl,
    ImagePreview, PromptArea, NegativePromptArea,
    useImageGeneration
} from './WanImageBase';

const WanImageEdit = memo(({ id, data, selected, showToast, onDeleteNode, canEdit }) => {
    const { setNodes, getNodes, getEdges } = useReactFlow();
    const edges = useEdges();
    const { darkMode: dark } = useThemeStore();

    const [prompt, setPrompt] = useState(data.prompt || '');
    const [negativePrompt, setNegativePrompt] = useState(data.negativePrompt || '');
    const [size, setSize] = useState(data.size || '1K');
    const [n, setN] = useState(data.count || 1);
    const [images, setImages] = useState(data.imageUrls || []);
    const [useNeg, setUseNeg] = useState(data.useNegativePrompt !== undefined ? data.useNegativePrompt : false);

    const {
        loadingStatus, loadingMessage, loadingProgress,
        enhancing, generating,
        upd, handleCancel, handleEnhance, handleGenerate, clearStatus
    } = useImageGeneration({ id, data, showToast, setNodes });

    // Sync 4 reference image handles
    useEffect(() => {
        const nextImages = [];
        for (let i = 1; i <= 4; i++) {
            const url = getLinkedImageUrl(id, `ref-image-${i}`, getEdges, getNodes);
            if (url) nextImages.push(url);
        }

        // Deep compare
        if (JSON.stringify(nextImages) !== JSON.stringify(images)) {
            setImages(nextImages);
            upd('imageUrls', nextImages);
        }
    }, [edges]);

    const connectedPromptsCount = getEdges().filter(e => e.target === id && e.targetHandle === 'text-prompt').length;
    const hasImage = images.length > 0;

    const onGenerate = () => {
        if (!hasImage) {
            showToast?.('error', 'Please connect at least one reference image to edit');
            return;
        }
        const linkedPrompt = getLinkedText(id, 'text-prompt', getEdges, getNodes);
        const effectivePrompt = mergePromptParts(linkedPrompt, prompt);

        handleGenerate({
            prompt: effectivePrompt,
            negative_prompt: useNeg ? (negativePrompt || undefined) : undefined,
            model: 'wan2.6-image',
            size,
            n,
            reference_image_urls: images,
            enable_interleave: false,
            mode: 'edit'
        });
    };

    const sizeOpts = ['1K', '2K'].map(v => ({ label: v, value: v }));

    return (
        <div className="relative">
            <NodeHandle type="target" position={Position.Left} id="text-prompt" icon={Type} top="15%" label="Text Prompt" />
            <NodeHandle type="target" position={Position.Left} id="ref-image-1" icon={ImageIcon} top="35%" label="Ref Image 1 (Required)" />
            <NodeHandle type="target" position={Position.Left} id="ref-image-2" icon={ImageIcon} top="50%" label="Ref Image 2" />
            <NodeHandle type="target" position={Position.Left} id="ref-image-3" icon={ImageIcon} top="65%" label="Ref Image 3" />
            <NodeHandle type="target" position={Position.Left} id="ref-image-4" icon={ImageIcon} top="80%" label="Ref Image 4" />

            <NodeHandle type="source" position={Position.Right} id="output" icon={ImageIcon} top="50%" label="Image Output" />

            <NodeBase id={id} data={data} selected={selected} title="Image Edit · Multi-Ref" icon={ImageIcon} minWidth={400} onDeleteNode={onDeleteNode} canEdit={canEdit}>

                {/* Reference Images Row */}
                <div className="mx-3 mt-2 flex gap-1.5 h-16">
                    {[1, 2, 3, 4].map((i) => {
                        const url = images[i - 1];
                        return (
                            <div key={i} className={`flex-1 rounded-lg border flex items-center justify-center overflow-hidden transition-all duration-300 ${url ? 'border-primary/40 bg-black shadow-inner' : 'border-dashed border-base-300/30 bg-base-200/20 opacity-40'}`}>
                                {url
                                    ? <img src={url} alt={`ref-${i}`} className="w-full h-full object-cover" />
                                    : <div className="text-[10px] font-black opacity-30 tracking-tighter">#{i}</div>
                                }
                            </div>
                        );
                    })}
                </div>
                {!hasImage && (
                    <div className="mx-3 mt-1 px-3 py-1 rounded bg-warning/5 border border-warning/10 text-[9px] font-bold text-warning/60 text-center uppercase tracking-widest animate-pulse">
                        ← Connect a Ref Image to start editing
                    </div>
                )}

                <ImagePreview
                    imageUrl={data.imageUrl}
                    modeBadge="EDIT"
                    aspectClass="aspect-square"
                    loadingStatus={loadingStatus}
                    loadingMessage={loadingMessage}
                    loadingProgress={loadingProgress}
                    clearStatus={clearStatus}
                    dark={dark}
                />

                <PromptArea
                    prompt={prompt} setPrompt={setPrompt} upd={upd} dark={dark}
                    placeholder="Describe how to edit or combine these images..." canEdit={canEdit}
                />
                {useNeg && <NegativePromptArea negativePrompt={negativePrompt} setNegativePrompt={setNegativePrompt} upd={upd} dark={dark} canEdit={canEdit} />}

                <div className={`flex items-center gap-1.5 px-3 py-2 border-t flex-wrap ${dark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                    <div className="flex gap-1.5 max-w-[270px] flex-wrap items-center">
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
                        <SelectPill label={size} options={sizeOpts} value={size} onChange={v => { setSize(v); upd('size', v); }} disabled={canEdit === false} />
                        <Stepper value={n} min={1} max={4} prefix="x" onChange={v => { setN(v); upd('count', v); }} disabled={canEdit === false} />
                        <div className="flex items-center px-1">
                            <Toggle value={useNeg} label="Neg" onChange={v => { setUseNeg(v); upd('useNegativePrompt', v); }} disabled={canEdit === false} />
                        </div>

                        {connectedPromptsCount > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/5 border border-primary/10 animate-fade-in w-fit">
                                <Sparkles size={10} className="text-primary animate-pulse" />
                                <span className="text-[10px] font-bold text-primary/70 uppercase tracking-tight truncate">
                                    {connectedPromptsCount} Ext Prompt
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

export default WanImageEdit;
