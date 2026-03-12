import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Position, useReactFlow } from '@xyflow/react';
import { Volume2, Type, Play, Pause, Languages, Sparkles } from 'lucide-react';
import NodeBase from './NodeBase';
import { NodeHandle, SelectPill, GenerateButton } from './NodePrimitives';
import useThemeStore from '../../../stores/themeStore';
import aiService from '../../../services/aiService';
import AILoadingOverlay from './AILoadingOverlay';
import { useWorkflowContext } from '../../../context/WorkflowContext';
import { useDebouncedNodeUpdate } from '../../../hooks/useDebounce';

// Static options - moved outside component to prevent recreation on every render
const VOICE_OPTIONS = [
    { label: 'Momo (F)', value: 'Momo' },
    { label: 'Vivian (F)', value: 'Vivian' },
    { label: 'Moon (M)', value: 'Moon' },
    { label: 'Cherry (F)', value: 'Cherry' },
    { label: 'Coco (F)', value: 'Coco' },
    { label: 'Maji (M)', value: 'Maji' }
];

const LANG_OPTIONS = [
    { label: 'English', value: 'english' },
    { label: 'Chinese', value: 'chinese' },
    { label: 'Japanese', value: 'japanese' },
    { label: 'Korean', value: 'korean' },
    { label: 'French', value: 'french' },
    { label: 'Spanish', value: 'spanish' },
    { label: 'German', value: 'german' },
    { label: 'Italian', value: 'italian' },
    { label: 'Portuguese', value: 'portuguese' },
    { label: 'Russian', value: 'russian' },
];

const TextToSpeechNode = memo(({ id, data, selected }) => {
    const { setNodes, getNodes, getEdges } = useReactFlow();
    const { darkMode } = useThemeStore();
    const { canEdit, showToast, deleteNode: onDeleteNode } = useWorkflowContext();

    const [prompt, setPrompt] = useState(data.prompt || '');
    const [voice, setVoice] = useState(data.voice || 'Momo');
    const [language, setLanguage] = useState(data.language || 'english');
    const [enhancing, setEnhancing] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('initial');
    const [audioUrl, setAudioUrl] = useState(data.audioUrl || '');
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const audioRef = useRef(null);
    const abortControllerRef = useRef(null);

    const formatTime = (s) => {
        if (isNaN(s)) return '0:00';
        const mins = Math.floor(s / 60);
        const secs = Math.floor(s % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        if (audioRef.current) audioRef.current.currentTime = time;
    };

    // Debounced update for text input
    const debouncedUpdate = useDebouncedNodeUpdate(setNodes, id, 150);

    // Direct update for non-text fields (selections, etc.)
    const upd = useCallback((k, v) =>
        setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, [k]: v } } : n)),
        [setNodes, id]);

    const getLatestLinkedPrompt = () => {
        const currentEdges = getEdges();
        const currentNodes = getNodes();
        const sourceEdges = currentEdges.filter(e => e.target === id && e.targetHandle === 'text-prompt');
        return sourceEdges.map(edge => {
            const sourceNode = currentNodes.find(n => n.id === edge.source);
            if (!sourceNode) return '';
            return sourceNode.data?.prompt ||
                sourceNode.data?.prompt_template ||
                sourceNode.data?.val ||
                sourceNode.data?.result ||
                sourceNode.data?.outputText ||
                sourceNode.data?.text ||
                ((sourceNode.type === 'wan_input' || sourceNode.type === 'input') && sourceNode.data?.assetType === 'text' ? sourceNode.data?.url : '') ||
                '';
        }).filter(Boolean).join('\n\n');
    };

    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setGenerating(false);
        setLoadingStatus('initial');
        showToast?.('info', 'Generation canceled');
    };

    const handleEnhance = async () => {
        if (!prompt.trim() || enhancing) return;
        setEnhancing(true);
        setLoadingStatus('enhancing');
        try {
            const enhanced = await aiService.enhancePrompt(prompt);
            const normalized = (enhanced || '').trim();
            if (normalized) {
                setPrompt(normalized);
                upd('prompt', normalized);
                setLoadingStatus('success');
                showToast?.('success', 'Prompt enhanced!');
                setTimeout(() => setLoadingStatus('initial'), 2000);
            }
        } catch (err) {
            setLoadingStatus('error');
            showToast?.('error', err.message || 'Failed to enhance prompt');
        } finally {
            setEnhancing(false);
        }
    };

    const handleGenerate = async () => {
        const linkedPrompt = getLatestLinkedPrompt();
        const finalPrompt = linkedPrompt || prompt;
        if (!finalPrompt.trim()) {
            showToast?.('error', 'Please enter some text or connect a prompt node.');
            return;
        }
        if (generating) return;

        setGenerating(true);
        setLoadingStatus('generating');

        abortControllerRef.current = new AbortController();

        try {
            const result = await aiService.generateSpeech({
                prompt: finalPrompt,
                voice: voice,
                model: 'qwen3-tts-flash',
                language: language
            }, { signal: abortControllerRef.current.signal });

            if (result.audio_url) {
                setAudioUrl(result.audio_url);
                upd('audioUrl', result.audio_url);
                setLoadingStatus('success');
                showToast?.('success', 'Speech generated!');
                setTimeout(() => setLoadingStatus('initial'), 2000);
            }
        } catch (err) {
            if (err.isCanceled) return;
            setLoadingStatus('error');
            const msg = err.message || 'Generation failed';
            showToast?.('error', msg);
        } finally {
            setGenerating(false);
            abortControllerRef.current = null;
        }
    };

    const togglePlay = () => {
        if (!audioUrl) return;
        if (playing) {
            audioRef.current?.pause();
        } else {
            audioRef.current?.play();
        }
    };

    // Debounced handler for prompt text input
    const handlePromptChange = useCallback((e) => {
        const v = e.target.value;
        setPrompt(v);
        debouncedUpdate('prompt', v);
    }, [debouncedUpdate]);

    return (
        <div className="relative">
            <NodeHandle type="target" position={Position.Left} id="text-prompt" icon={Type} top="50%" label="Text Input" />
            <NodeHandle type="source" position={Position.Right} id="audio-output" icon={Volume2} top="50%" label="Audio Output" />

            <NodeBase id={id} data={data} selected={selected} title="Speech Generator" icon={Volume2} minWidth={340} onDeleteNode={onDeleteNode} canEdit={canEdit}>
                <div className={`mx-3 mt-1 rounded-xl overflow-hidden relative transition-all duration-300 min-h-[100px] flex flex-col justify-center ${darkMode ? 'bg-[#121212]' : 'bg-white'}`}>
                    <div className={`p-4 flex flex-col gap-3 ${loadingStatus === 'generating' || loadingStatus === 'enhancing' ? 'opacity-0 invisible' : 'opacity-100'}`}>
                        {/* Status & Info */}
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                                <span className={`text-[9px] font-black uppercase tracking-wider ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
                                    {audioUrl ? 'Ready to Play' : 'Empty'}
                                </span>
                                <span className={`text-xs font-bold truncate max-w-[150px] ${darkMode ? 'text-white/80' : 'text-slate-700'}`}>
                                    {VOICE_OPTIONS.find(v => v.value === voice)?.label || voice}
                                </span>
                            </div>
                            <button
                                onClick={togglePlay}
                                disabled={!audioUrl}
                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md ${!audioUrl ? 'opacity-20 cursor-not-allowed' :
                                    darkMode ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-primary text-white hover:scale-105'
                                    }`}
                            >
                                {playing ? <Pause size={16} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                            </button>
                        </div>

                        {/* Seek Bar & Times */}
                        <div className="flex flex-col gap-1.5">
                            <input
                                type="range"
                                min={0}
                                max={duration || 0}
                                step={0.1}
                                value={currentTime}
                                onChange={handleSeek}
                                disabled={!audioUrl}
                                className={`nodrag nowheel w-full h-1 rounded-lg appearance-none cursor-pointer transition-all
                                    ${darkMode ? 'bg-white/10' : 'bg-black/5'} 
                                    accent-primary hover:accent-primary-focus`}
                                style={{
                                    background: audioUrl ? `linear-gradient(to right, #6366f1 0%, #6366f1 ${(currentTime / (duration || 1)) * 100}%, ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'} ${(currentTime / (duration || 1)) * 100}%, ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'} 100%)` : ''
                                }}
                            />
                            <div className="flex items-center justify-between text-[10px] font-bold tabular-nums opacity-40">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>
                    </div>

                    <audio
                        ref={audioRef}
                        src={audioUrl}
                        onEnded={() => setPlaying(false)}
                        onPause={() => setPlaying(false)}
                        onPlay={() => setPlaying(true)}
                        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                        onLoadedMetadata={(e) => setDuration(e.target.duration)}
                    />

                    <AILoadingOverlay status={loadingStatus} type="audio" size="small" />
                </div>

                <div className="px-3 pt-2 pb-1">
                    <textarea
                        value={prompt}
                        rows={3}
                        onChange={handlePromptChange}
                        onKeyDown={(e) => e.stopPropagation()}
                        placeholder="Enter text to synthesize..."
                        readOnly={canEdit === false}
                        className={`nodrag nowheel w-full min-h-[80px] bg-transparent text-sm resize-y focus:outline-none placeholder:opacity-30 font-medium ${darkMode ? 'text-white/80' : 'text-slate-700'}`}
                    />
                </div>

                <div className={`flex items-center gap-1.5 px-3 py-2 border-t flex-wrap ${darkMode ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                    <div className="flex gap-1.5 max-w-[240px] flex-wrap">
                        {canEdit !== false && (
                            <button
                                onClick={handleEnhance}
                                disabled={enhancing}
                                className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg transition-all
                                    bg-base-100 border border-base-300/40 text-base-content/80 shadow-sm`}
                            >
                                <Sparkles size={9} className={enhancing ? 'animate-pulse' : ''} />
                                {enhancing ? 'Enhancing...' : 'Enhance'}
                            </button>
                        )}
                        <SelectPill
                            label={<div className="flex items-center gap-1"><Languages size={10} />{LANG_OPTIONS.find(l => l.value === language)?.label}</div>}
                            options={LANG_OPTIONS}
                            value={language}
                            onChange={v => { setLanguage(v); upd('language', v); }}
                            disabled={canEdit === false}
                        />
                        <SelectPill
                            label={VOICE_OPTIONS.find(v => v.value === voice)?.label || 'Voice'}
                            options={VOICE_OPTIONS}
                            value={voice}
                            onChange={v => { setVoice(v); upd('voice', v); }}
                            disabled={canEdit === false}
                        />
                        {getEdges().filter(e => e.target === id && e.targetHandle === 'text-prompt').length > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/5 border border-primary/10 animate-fade-in w-fit">
                                <Sparkles size={10} className="text-primary animate-pulse" />
                                <span className="text-[10px] font-bold text-primary/70 uppercase tracking-tight truncate">
                                    Using {getEdges().filter(e => e.target === id && e.targetHandle === 'text-prompt').length} External Prompt{getEdges().filter(e => e.target === id && e.targetHandle === 'text-prompt').length > 1 ? 's' : ''}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="ml-auto">
                        {canEdit !== false && <GenerateButton onClick={handleGenerate} isGenerating={generating} onCancel={handleCancel} />}
                    </div>
                </div>
            </NodeBase>
        </div>
    );
});

export default TextToSpeechNode;
