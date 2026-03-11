import React, { useState, useRef } from 'react';
import { Video, Sparkles, Volume2, Image } from 'lucide-react';
import { GenerateButton } from '../NodePrimitives';
import aiService from '../../../../services/aiService';
import AILoadingOverlay from '../AILoadingOverlay';

export const mergePromptParts = (...parts) => {
    const normalized = parts
        .flat()
        .map(part => (typeof part === 'string' ? part.trim() : ''))
        .filter(Boolean);
    return normalized.filter((part, index) => normalized.indexOf(part) === index).join('\n\n');
};

/**
 * Shared prompt helpers — given the node id, getEdges, getNodes,
 * returns the merged text from all connected text-prompt / negative-prompt edges.
 */
export const getLinkedText = (id, handleId, getEdges, getNodes) => {
    const currentEdges = getEdges();
    const currentNodes = getNodes();
    const sourceEdges = currentEdges.filter(e => e.target === id && e.targetHandle === handleId);
    return sourceEdges.map(edge => {
        const sourceNode = currentNodes.find(n => n.id === edge.source);
        if (!sourceNode) return '';
        return (
            sourceNode.data?.prompt ||
            sourceNode.data?.prompt_template ||
            sourceNode.data?.val ||
            sourceNode.data?.result ||
            sourceNode.data?.outputText ||
            sourceNode.data?.text ||
            ((sourceNode.type === 'wan_input' || sourceNode.type === 'input') && sourceNode.data?.assetType === 'text'
                ? sourceNode.data?.url
                : '') ||
            ''
        );
    }).filter(Boolean).join('\n\n');
};

/**
 * Get media URL from a connected node (image or video).
 */
export const getLinkedMediaUrl = (id, handleId, getEdges, getNodes) => {
    const edge = getEdges().find(e => e.target === id && e.targetHandle === handleId);
    if (!edge) return { image: '', video: '' };
    const sourceNode = getNodes().find(n => n.id === edge.source);
    if (!sourceNode) return { image: '', video: '' };

    // 1. Wan Image Nodes (T2I / Edit)
    if (sourceNode.type === 'wan_image_t2i' || sourceNode.type === 'wan_image_edit')
        return { image: sourceNode.data?.imageUrl || '', video: '' };

    // 2. Wan Video Nodes
    if (sourceNode.type?.startsWith('wan_video_'))
        return { image: '', video: sourceNode.data?.videoUrl || '' };

    // 3. Input Nodes (Manual upload/Library)
    if (sourceNode.type === 'wan_input' || sourceNode.type === 'input') {
        const type = sourceNode.data?.assetType;
        const url = sourceNode.data?.url || '';
        if (type === 'image') return { image: url, video: '' };
        if (type === 'video') return { image: '', video: url };
    }
    return { image: '', video: '' };
};

/**
 * Get audio URL from a connected node.
 */
export const getLinkedAudioUrl = (id, getEdges, getNodes) => {
    const edge = getEdges().find(e => e.target === id && e.targetHandle === 'ref-audio');
    if (!edge) return '';
    const sourceNode = getNodes().find(n => n.id === edge.source);
    if (!sourceNode) return '';
    if (sourceNode.type === 'text_to_speech') return sourceNode.data?.audioUrl || '';
    if ((sourceNode.type === 'wan_input' || sourceNode.type === 'input') && sourceNode.data?.assetType === 'audio')
        return sourceNode.data?.url || '';
    return '';
};

/**
 * Shared prompt textarea area.
 */
export const PromptArea = ({ prompt, setPrompt, upd, dark, placeholder, canEdit }) => (
    <div className="px-3 pt-2 pb-1 relative group/prompt">
        <textarea
            value={prompt}
            rows={3}
            onChange={e => { setPrompt(e.target.value); upd('prompt', e.target.value); }}
            onKeyDown={e => e.stopPropagation()}
            onWheel={e => e.stopPropagation()}
            readOnly={canEdit === false}
            placeholder={placeholder || 'Describe the video you want to generate...'}
            className={`nodrag nowheel w-full min-h-[88px] bg-transparent text-sm resize-y overflow-y-auto focus:outline-none leading-relaxed placeholder:opacity-30 font-medium ${dark ? 'text-white/80' : 'text-slate-700'}`}
        />
    </div>
);

/**
 * Shared negative prompt section.
 */
export const NegativePromptArea = ({ negativePrompt, setNegativePrompt, upd, dark, canEdit }) => (
    <div className={`px-3 pt-1 pb-2 border-t ${dark ? 'border-white/[0.04]' : 'border-black/[0.04]'}`}>
        <div className="flex items-center gap-1.5 mb-1 opacity-30">
            <Sparkles size={9} />
            <span className="text-[9px] font-black uppercase tracking-widest">Negative Prompt</span>
        </div>
        <textarea
            value={negativePrompt}
            rows={2}
            onChange={e => { setNegativePrompt(e.target.value); upd('negativePrompt', e.target.value); }}
            onKeyDown={e => e.stopPropagation()}
            onWheel={e => e.stopPropagation()}
            readOnly={canEdit === false}
            placeholder="What you DON'T want in the video..."
            className={`nodrag nowheel w-full min-h-[44px] bg-transparent text-[11px] resize-y overflow-y-auto focus:outline-none leading-relaxed placeholder:opacity-30 font-medium ${dark ? 'text-white/50' : 'text-slate-400'}`}
        />
    </div>
);

/**
 * Shared video preview.
 */
export const VideoPreview = ({ videoUrl, modeBadge, aspectClass, loadingStatus, loadingMessage, loadingProgress, clearStatus, dark }) => (
    <div className={`mx-3 mt-1 rounded-xl overflow-hidden flex items-center justify-center relative transition-all duration-300 ${dark ? 'bg-[#121212]' : 'bg-white'}`}>
        <div className={`w-full h-full flex items-center justify-center transition-opacity duration-300 ${loadingStatus === 'generating' || loadingStatus === 'enhancing' ? 'opacity-0 invisible' : 'opacity-100'}`}>
            {videoUrl
                ? <video src={videoUrl} className="w-full h-auto max-h-[380px] object-contain block transition-all duration-500" controls />
                : <div className={`flex items-center justify-center w-full ${aspectClass}`}>
                    <Video size={36} strokeWidth={1} className={dark ? 'text-white/10' : 'text-black/10'} />
                </div>
            }
        </div>
        {modeBadge && (
            <span className={`absolute top-2 left-2 text-[10px] font-black px-1.5 py-0.5 rounded-md transition-opacity duration-300 ${dark ? 'bg-black/50 text-white/40' : 'bg-white/80 text-slate-500'} ${loadingStatus === 'generating' || loadingStatus === 'enhancing' ? 'opacity-0 invisible' : 'opacity-100'}`}>
                {modeBadge}
            </span>
        )}
        <AILoadingOverlay
            type="video"
            status={loadingStatus}
            message={loadingMessage}
            progress={loadingProgress}
            onClear={clearStatus}
        />
    </div>
);

/**
 * Shared Enhance prompt button.
 */
export const EnhanceButton = ({ enhancing, onClick, canEdit }) => {
    if (canEdit === false) return null;
    return (
        <button
            onClick={onClick}
            disabled={enhancing}
            className="flex items-center gap-1 text-xs font-bold px-2 py-1.5 rounded-lg transition-all bg-base-100 border border-base-300/40 text-base-content/80 shadow-sm hover:opacity-100"
        >
            <Sparkles size={10} className={enhancing ? 'animate-pulse text-indigo-400' : ''} />
            {enhancing ? 'Enhancing...' : 'Enhance'}
        </button>
    );
};

/**
 * Shared controls row (bottom toolbar with pills + generate button).
 */
export const ControlsRow = ({ dark, children, generating, onGenerate, onCancel, canEdit }) => (
    <div className={`flex items-center gap-1.5 px-3 py-2 border-t flex-wrap ${dark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
        <div className="flex gap-1.5 max-w-[270px] flex-wrap items-center">
            {children}
        </div>
        <div className="ml-auto">
            {canEdit !== false && <GenerateButton onClick={onGenerate} isGenerating={generating} onCancel={onCancel} />}
        </div>
    </div>
);

/**
 * Badge shown when external prompts or audio are connected.
 */
export const ConnectionBadge = ({ count, audioLinked, imageLinked, videoLinked }) => (
    <>
        {count > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/5 border border-primary/10 animate-fade-in w-fit">
                <Sparkles size={10} className="text-primary animate-pulse" />
                <span className="text-[10px] font-bold text-primary/70 uppercase tracking-tight truncate">
                    {count} Ext Prompt{count > 1 ? 's' : ''}
                </span>
            </div>
        )}
        {imageLinked && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-500/5 border border-indigo-500/10 animate-fade-in w-fit">
                <Image size={10} className="text-indigo-500 animate-pulse" />
                <span className="text-[10px] font-bold text-indigo-500/70 uppercase tracking-tight">Img</span>
            </div>
        )}
        {videoLinked && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/5 border border-amber-500/10 animate-fade-in w-fit">
                <Video size={10} className="text-amber-500 animate-pulse" />
                <span className="text-[10px] font-bold text-amber-500/70 uppercase tracking-tight">Vid</span>
            </div>
        )}
        {audioLinked && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-500/5 border border-green-500/10 animate-fade-in w-fit">
                <Volume2 size={10} className="text-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-500/70 uppercase tracking-tight">Audio</span>
            </div>
        )}
    </>
);

/**
 * useVideoGeneration — shared loading state + generate/enhance logic.
 */
export const useVideoGeneration = ({ id, data, showToast, setNodes }) => {
    const [loadingStatus, setLoadingStatus] = useState('initial');
    const [loadingMessage, setLoadingMessage] = useState('');
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [enhancing, setEnhancing] = useState(false);
    const [generating, setGenerating] = useState(false);
    const abortControllerRef = useRef(null);

    const upd = (k, v) =>
        setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, [k]: v } } : n));

    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setGenerating(false);
        setLoadingStatus('initial');
        setLoadingMessage('');
        setLoadingProgress(0);
        showToast?.('info', 'Generation canceled');
    };

    const handleEnhance = async (prompt, setPrompt) => {
        if (!prompt.trim() || enhancing) return;
        setEnhancing(true);
        setLoadingStatus('enhancing');
        setLoadingMessage('Enhancing prompt with AI...');
        setLoadingProgress(30);
        try {
            const enhanced = await aiService.enhancePrompt(prompt);
            const normalized = (enhanced || '').trim();
            if (!normalized) throw new Error('Enhance result is empty.');
            setPrompt(normalized);
            upd('prompt', normalized);
            setLoadingStatus('success');
            setLoadingMessage('Prompt enhanced successfully!');
            showToast?.('success', 'Prompt enhanced!');
            setTimeout(() => setLoadingStatus('initial'), 2000);
        } catch (err) {
            setLoadingStatus('error');
            setLoadingMessage(err.message || 'Failed to enhance prompt');
            showToast?.('error', err.message || 'Failed to enhance prompt');
        } finally {
            setEnhancing(false);
        }
    };

    const handleGenerate = async (payload) => {
        if (!payload.prompt?.trim() || generating) return;
        setGenerating(true);
        setLoadingStatus('generating');
        setLoadingMessage('Starting video generation...');
        setLoadingProgress(10);
        try {
            setLoadingMessage('Connecting to Wan API...');
            setLoadingProgress(20);
            abortControllerRef.current = new AbortController();
            const result = await aiService.generateVideo(payload, { signal: abortControllerRef.current.signal });
            setLoadingMessage('Finalizing video...');
            setLoadingProgress(90);
            if (result.video_url) {
                upd('videoUrl', result.video_url);
                setLoadingStatus('success');
                setLoadingMessage('Video generated successfully!');
                setLoadingProgress(100);
                showToast?.('success', 'Video generated successfully!');
                setTimeout(() => setLoadingStatus('initial'), 3000);
            }
        } catch (err) {
            if (err.isCanceled) return;
            setLoadingStatus('error');
            setLoadingMessage(err.message || 'Failed to generate video.');
            showToast?.('error', err.message || 'Failed to generate video.');
        } finally {
            abortControllerRef.current = null;
            setGenerating(false);
        }
    };

    const clearStatus = () => setLoadingStatus('initial');

    return {
        loadingStatus, loadingMessage, loadingProgress,
        enhancing, generating,
        upd, handleCancel, handleEnhance, handleGenerate, clearStatus,
    };
};
