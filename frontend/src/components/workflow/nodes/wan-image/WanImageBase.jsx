import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Sparkles, Plus, Trash2 } from 'lucide-react';
import useThemeStore from '../../../../stores/themeStore';
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

        const data = sourceNode.data || {};
        // Try all common text/content fields
        return (
            data.prompt ||
            data.prompt_template ||
            data.val ||
            data.result ||
            data.outputText ||
            data.text ||
            data.content ||
            (data.assetType === 'text' ? data.url : '') ||
            ''
        );
    }).filter(Boolean).join('\n\n');
};

/**
 * Get image URL from a connected node.
 */
export const getLinkedImageUrl = (id, handleId, getEdges, getNodes) => {
    const edge = getEdges().find(e => e.target === id && e.targetHandle === handleId);
    if (!edge) return '';
    const sourceNode = getNodes().find(n => n.id === edge.source);
    if (!sourceNode) return '';

    const data = sourceNode.data || {};
    // 1. Direct image field
    if (data.imageUrl) return data.imageUrl;
    if (data.url && (data.assetType === 'image' || data.url.match(/\.(jpeg|jpg|png|bmp)/i))) return data.url;

    // 2. Fallback to generic URL/Content if it looks like an image
    const potentialUrl = data.url || data.content || data.val || '';
    if (typeof potentialUrl === 'string' && potentialUrl.match(/\.(jpeg|jpg|png|bmp)/i)) {
        return potentialUrl;
    }

    // 3. Some nodes might store the output image in 'result' (e.g. specialized AI nodes)
    if (data.result && typeof data.result === 'string' && data.result.startsWith('http')) {
        return data.result;
    }

    return '';
};

/**
 * Image Preview Section.
 */
export const ImagePreview = ({ imageUrl, modeBadge, aspectClass, loadingStatus, loadingMessage, loadingProgress, clearStatus, dark }) => (
    <div className={`mx-3 mt-1 rounded-xl overflow-hidden flex items-center justify-center relative transition-all duration-300 ${dark ? 'bg-[#121212]' : 'bg-white'}`}>
        <div className={`w-full h-full flex items-center justify-center transition-all duration-300 ${loadingStatus === 'generating' || loadingStatus === 'enhancing' ? 'opacity-0 invisible' : 'opacity-100'}`}>
            {imageUrl
                ? <img src={imageUrl} alt="Generated" className="w-full h-auto max-h-[500px] object-contain block transition-all duration-500" />
                : <div className={`flex items-center justify-center w-full ${aspectClass}`}>
                    <ImageIcon size={36} strokeWidth={1} className={dark ? 'text-white/10' : 'text-black/10'} />
                </div>
            }
        </div>
        {modeBadge && imageUrl && (
            <span className={`absolute top-2 left-2 text-[10px] font-black px-1.5 py-0.5 rounded-md transition-opacity duration-300 ${dark ? 'bg-black/50 text-white/40' : 'bg-white/80 text-slate-500'} ${loadingStatus === 'generating' || loadingStatus === 'enhancing' ? 'opacity-0 invisible' : 'opacity-100'}`}>
                {modeBadge}
            </span>
        )}
        <AILoadingOverlay
            type="image"
            status={loadingStatus}
            message={loadingMessage}
            progress={loadingProgress}
            onClear={clearStatus}
        />
    </div>
);

/**
 * Prompt Textarea Area.
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
            placeholder={placeholder || 'Describe the image you want to generate...'}
            className={`nodrag nowheel w-full min-h-[88px] bg-transparent text-sm resize-y overflow-y-auto focus:outline-none leading-relaxed placeholder:opacity-30 font-medium ${dark ? 'text-white/80' : 'text-slate-700'}`}
        />
    </div>
);

/**
 * Negative Prompt Section.
 */
export const NegativePromptArea = ({ negativePrompt, setNegativePrompt, upd, dark, canEdit }) => (
    <div className={`px-3 pt-1 pb-2 border-t ${dark ? 'border-white/[0.04]' : 'border-black/[0.04]'}`}>
        <div className="flex items-center gap-1.5 mb-1 opacity-20">
            <Sparkles size={9} />
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">Negative Prompt</span>
        </div>
        <textarea
            value={negativePrompt}
            rows={2}
            onChange={e => { setNegativePrompt(e.target.value); upd('negativePrompt', e.target.value); }}
            onKeyDown={e => e.stopPropagation()}
            onWheel={e => e.stopPropagation()}
            readOnly={canEdit === false}
            placeholder="Low quality, blurry, etc..."
            className={`nodrag nowheel w-full min-h-[44px] bg-transparent text-[11px] resize-y overflow-y-auto focus:outline-none leading-relaxed placeholder:opacity-20 font-medium ${dark ? 'text-white/40' : 'text-slate-400'}`}
        />
    </div>
);

/**
 * Hook for Image Generation Logic.
 */
export const useImageGeneration = ({ id, data, showToast, setNodes }) => {
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
        setLoadingMessage('Starting image generation...');
        setLoadingProgress(10);
        try {
            setLoadingMessage('Connecting to Wan API...');
            setLoadingProgress(20);
            abortControllerRef.current = new AbortController();
            const result = await aiService.generateImage(payload, { signal: abortControllerRef.current.signal });
            setLoadingMessage('Finalizing image...');
            setLoadingProgress(90);
            if (result.image_url) {
                upd('imageUrl', result.image_url);
                setLoadingStatus('success');
                setLoadingMessage('Image generated successfully!');
                setLoadingProgress(100);
                showToast?.('success', 'Image generated successfully!');
                setTimeout(() => setLoadingStatus('initial'), 3000);
            }
        } catch (err) {
            if (err.isCanceled) return;
            setLoadingStatus('error');
            setLoadingMessage(err.message || 'Failed to generate image.');
            showToast?.('error', err.message || 'Failed to generate image.');
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
