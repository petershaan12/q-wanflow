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

        const data = sourceNode.data || {};
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
 * Get media URL(s) from connected nodes (image or video).
 * If multiple nodes are connected to the same handle, returns an array.
 */
export const getLinkedMediaUrls = (id, handleId, getEdges, getNodes) => {
    const connectedEdges = getEdges().filter(e => e.target === id && e.targetHandle === handleId);
    if (!connectedEdges.length) return { images: [], videos: [] };

    const results = { images: [], videos: [] };

    connectedEdges.forEach(edge => {
        const sourceNode = getNodes().find(n => n.id === edge.source);
        if (!sourceNode) return;

        const data = sourceNode.data || {};

        // Helper to push to results based on URL format or assetType
        const addUrl = (url, typeHint) => {
            if (!url || typeof url !== 'string') return;
            if (typeHint === 'image' || url.match(/\.(jpeg|jpg|png|bmp)/i)) {
                results.images.push(url);
            } else if (typeHint === 'video' || url.match(/\.(mp4)/i)) {
                results.videos.push(url);
            }
        };

        // 1. Array of URLs (if source is another multi-output node)
        if (Array.isArray(data.imageUrls)) data.imageUrls.forEach(u => addUrl(u, 'image'));
        if (Array.isArray(data.videoUrls)) data.videoUrls.forEach(u => addUrl(u, 'video'));
        if (Array.isArray(data.reference_urls)) {
            data.reference_urls.forEach(u => addUrl(u));
        }

        // 2. Direct single fields
        if (data.imageUrl) addUrl(data.imageUrl, 'image');
        if (data.videoUrl) addUrl(data.videoUrl, 'video');
        if (data.url) addUrl(data.url, data.assetType);
        
        // 3. Fallback for generic Input nodes if other fields are missing
        if (!data.imageUrl && !data.videoUrl && !data.url) {
            // Some nodes might store their primary payload in 'val' or 'content'
            if (data.val) addUrl(data.val, data.assetType);
            if (data.content) addUrl(data.content, data.assetType);
        }
    });

    return results;
};

/**
 * Legacy compatibility or single-url extractor
 */
export const getLinkedMediaUrl = (id, handleId, getEdges, getNodes) => {
    const urls = getLinkedMediaUrls(id, handleId, getEdges, getNodes);
    return {
        image: urls.images[0] || '',
        video: urls.videos[0] || ''
    };
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

export const VideoPreview = ({ videoUrl, modeBadge, aspectClass, loadingStatus, loadingMessage, loadingProgress, clearStatus, dark }) => {
    const [hasError, setHasError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Reset error state when videoUrl changes
    React.useEffect(() => {
        setHasError(false);
    }, [videoUrl]);

    return (
        <div 
            className={`mx-3 mt-1 rounded-xl overflow-hidden flex items-center justify-center relative transition-all duration-300 group/vid ${dark ? 'bg-[#0a0a0a]' : 'bg-white'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`w-full h-full flex items-center justify-center transition-opacity duration-300 ${loadingStatus === 'generating' || loadingStatus === 'enhancing' ? 'opacity-0 invisible' : 'opacity-100'}`}>
                {videoUrl && !hasError ? (
                    <div className="relative w-full h-full">
                        <video 
                            key={videoUrl}
                            src={videoUrl} 
                            className="w-full h-auto max-h-[380px] object-contain block transition-all duration-500" 
                            controls 
                            autoPlay
                            muted
                            loop
                            playsInline
                            onError={() => setHasError(true)}
                        />
                        {/* Hover Overlay for direct link */}
                        <div className={`absolute top-2 right-2 flex gap-2 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                            <a 
                                href={videoUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg backdrop-blur-md transition-all border border-white/10"
                                title="Open original video"
                            >
                                <Video size={14} />
                            </a>
                        </div>
                    </div>
                ) : videoUrl && hasError ? (
                    <div className={`flex flex-col items-center justify-center w-full px-8 text-center bg-gradient-to-b ${dark ? 'from-amber-500/5 to-transparent' : 'from-amber-500/[0.03] to-transparent'} ${aspectClass}`}>
                        <div className="relative mb-4">
                            <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full"></div>
                            <div className={`relative p-4 rounded-2xl border ${dark ? 'bg-[#121212] border-white/5' : 'bg-white border-black/5'} shadow-xl`}>
                                <Video size={32} className="text-amber-500" />
                            </div>
                        </div>
                        
                        <div className="space-y-1 mb-5">
                            <h4 className={`text-xs font-black uppercase tracking-widest ${dark ? 'text-white' : 'text-slate-900'}`}>Video Generated</h4>
                            <p className={`text-[10px] font-medium leading-relaxed max-w-[200px] ${dark ? 'text-white/40' : 'text-slate-400'}`}>
                                This video is too heavy for in-browser preview. You can view the original file directly.
                            </p>
                        </div>

                        <a 
                            href={videoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-xs h-9 px-5 rounded-xl btn-primary border-none font-bold gap-2 shadow-lg shadow-primary/20"
                        >
                            <Video size={14} />
                            View Full Video
                        </a>
                    </div>
                ) : (
                    <div className={`flex items-center justify-center w-full ${aspectClass}`}>
                        <Video size={36} strokeWidth={1} className={dark ? 'text-white/10' : 'text-black/10'} />
                    </div>
                )}
            </div>

            {modeBadge && !hasError && (
                <span className={`absolute top-2 left-2 text-[10px] font-black px-1.5 py-0.5 rounded-md transition-opacity duration-300 backdrop-blur-md ${dark ? 'bg-black/50 text-white/40 border border-white/5' : 'bg-white/80 text-slate-500 border border-black/5'} ${loadingStatus === 'generating' || loadingStatus === 'enhancing' ? 'opacity-0 invisible' : 'opacity-100'}`}>
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
};

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
export const ConnectionBadge = ({ count, audioLinked, imageLinked, videoLinked }) => {
    const imgCount = typeof imageLinked === 'number' ? imageLinked : (imageLinked ? 1 : 0);
    const vidCount = typeof videoLinked === 'number' ? videoLinked : (videoLinked ? 1 : 0);
    
    return (
        <>
            {count > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/5 border border-primary/10 animate-fade-in w-fit">
                    <Sparkles size={10} className="text-primary animate-pulse" />
                    <span className="text-[10px] font-bold text-primary/70 uppercase tracking-tight truncate">
                        {count} Ext Prompt{count > 1 ? 's' : ''}
                    </span>
                </div>
            )}
            {imgCount > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-500/5 border border-indigo-500/10 animate-fade-in w-fit">
                    <Image size={10} className="text-indigo-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-indigo-500/70 uppercase tracking-tight">
                        {imgCount > 1 ? `${imgCount} ` : ''}Img
                    </span>
                </div>
            )}
            {vidCount > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/5 border border-amber-500/10 animate-fade-in w-fit">
                    <Video size={10} className="text-amber-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-amber-500/70 uppercase tracking-tight">
                        {vidCount > 1 ? `${vidCount} ` : ''}Vid
                    </span>
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
};

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
