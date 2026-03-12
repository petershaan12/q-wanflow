import React, { memo, useState, useEffect } from 'react';
import { Position, useReactFlow, useEdges } from '@xyflow/react';
import { Video, Type, Image, Volume2, Film } from 'lucide-react';
import NodeBase from '../NodeBase';
import { NodeHandle, SelectPill, Toggle } from '../NodePrimitives';
import useThemeStore from '../../../../stores/themeStore';
import {
    mergePromptParts, getLinkedText, getLinkedMediaUrl, getLinkedAudioUrl,
    PromptArea, NegativePromptArea, VideoPreview,
    EnhanceButton, ControlsRow, ConnectionBadge,
    useVideoGeneration,
} from './WanVideoBase';

const MODELS = ['wan2.6-r2v', 'wan2.6-r2v-flash'];

const SIZE_MAP = {
    '16:9': { '720': '1280*720', '1080': '1920*1080' },
    '9:16': { '720': '720*1280', '1080': '1080*1920' },
    '4:3': { '720': '1088*832', '1080': '1632*1248' },
    '3:4': { '720': '832*1088', '1080': '1248*1632' },
    '1:1': { '720': '960*960', '1080': '1440*1440' },
};

const WanVideoR2V = memo(({ id, data, selected, showToast, onDeleteNode, canEdit }) => {
    const { setNodes, getNodes, getEdges } = useReactFlow();
    const edges = useEdges();
    const { darkMode: dark } = useThemeStore();

    const [prompt, setPrompt] = useState(data.prompt || '');
    const [negativePrompt, setNegativePrompt] = useState(data.negativePrompt || '');
    const [aspect, setAspect] = useState(data.aspectRatio || '16:9');
    const [duration, setDuration] = useState(data.duration || '5s');
    const [shotType, setShotType] = useState(data.shotType || 'single');
    const [audio, setAudio] = useState(data.audio !== undefined ? data.audio : true);
    const [model, setModel] = useState(data.model || 'wan2.6-r2v');
    const [referenceVideoUrl, setReferenceVideoUrl] = useState(data.referenceVideoUrl || '');
    const [referenceImageUrl, setReferenceImageUrl] = useState(data.referenceImageUrl || '');
    const [referenceAudioUrl, setReferenceAudioUrl] = useState(data.referenceAudioUrl || '');
    const [useNeg, setUseNeg] = useState(data.useNegativePrompt !== undefined ? data.useNegativePrompt : false);

    const {
        loadingStatus, loadingMessage, loadingProgress,
        enhancing, generating,
        upd, handleCancel, handleEnhance, handleGenerate, clearStatus,
    } = useVideoGeneration({ id, data, showToast, setNodes });

    // Sync connected media
    useEffect(() => {
        const { video } = getLinkedMediaUrl(id, 'ref-video', getEdges, getNodes);
        if (video !== referenceVideoUrl) { setReferenceVideoUrl(video); upd('referenceVideoUrl', video); }

        const { image } = getLinkedMediaUrl(id, 'ref-image', getEdges, getNodes);
        if (image !== referenceImageUrl) { setReferenceImageUrl(image); upd('referenceImageUrl', image); }

        const aud = getLinkedAudioUrl(id, getEdges, getNodes);
        if (aud !== referenceAudioUrl) { setReferenceAudioUrl(aud); upd('referenceAudioUrl', aud); }
    }, [edges]);

    const connectedPromptsCount = getEdges().filter(e => e.target === id && e.targetHandle === 'text-prompt').length;
    const hasVideo = !!referenceVideoUrl;

    const onGenerate = () => {
        if (!hasVideo) { showToast?.('error', 'Please connect a Reference Video first'); return; }
        const linkedPrompt = getLinkedText(id, 'text-prompt', getEdges, getNodes);
        const effectivePrompt = mergePromptParts(linkedPrompt, prompt);
        const effectiveNeg = useNeg ? (negativePrompt || undefined) : undefined;
        const size = SIZE_MAP[aspect]?.['720'] || '1280*720';

        const referenceUrls = [referenceVideoUrl];
        if (referenceImageUrl) referenceUrls.push(referenceImageUrl);

        handleGenerate({
            prompt: effectivePrompt,
            negative_prompt: effectiveNeg,
            model,
            size,
            duration,
            shot_type: shotType,
            audio,
            reference_urls: referenceUrls,
            audio_url: referenceAudioUrl || undefined,
        });
    };

    const aspectOpts = ['16:9', '9:16', '4:3', '3:4', '1:1'].map(v => ({ label: v, value: v }));
    const durationOpts = ['2s', '5s', '10s'].map(v => ({ label: v, value: v }));
    const shotOpts = [
        { label: 'Single', value: 'single' },
        { label: 'Long Shot', value: 'long shot' },
        { label: 'Medium Shot', value: 'medium shot' },
        { label: 'Close Up', value: 'close-up' },
        { label: 'Pan', value: 'pan' },
        { label: 'Tilt', value: 'tilt' },
    ];
    const modelOpts = MODELS.map(v => ({ label: v.replace('wan2.6-', '').replace('-flash', ' Flash'), value: v }));

    const aspectClass = {
        '16:9': 'aspect-video', '9:16': 'aspect-[9/16]',
        '4:3': 'aspect-[4/3]', '3:4': 'aspect-[3/4]', '1:1': 'aspect-square',
    }[aspect] || 'aspect-video';

    return (
        <div className="relative">
            <NodeHandle type="target" position={Position.Left} id="text-prompt" icon={Type} top="20%" label="Text Prompt" />
            <NodeHandle type="target" position={Position.Left} id="ref-video" icon={Film} top="45%" label="Reference Video (required)" />
            <NodeHandle type="target" position={Position.Left} id="ref-image" icon={Image} top="65%" label="Reference Image (optional)" />
            <NodeHandle type="target" position={Position.Left} id="ref-audio" icon={Volume2} top="85%" label="Reference Audio" />
            <NodeHandle type="source" position={Position.Right} id="output" icon={Video} top="50%" label="Video Output" />

            <NodeBase id={id} data={data} selected={selected} title="R2V · Reference to Video" icon={Video} minWidth={400} onDeleteNode={onDeleteNode} canEdit={canEdit}>
                {/* Reference video hint */}

                <VideoPreview
                    videoUrl={data.videoUrl}
                    modeBadge="R2V"
                    aspectClass={aspectClass}
                    loadingStatus={loadingStatus}
                    loadingMessage={loadingMessage}
                    loadingProgress={loadingProgress}
                    clearStatus={clearStatus}
                    dark={dark}
                />
                <PromptArea prompt={prompt} setPrompt={setPrompt} upd={upd} dark={dark} canEdit={canEdit} />
                {useNeg && <NegativePromptArea negativePrompt={negativePrompt} setNegativePrompt={setNegativePrompt} upd={upd} dark={dark} canEdit={canEdit} />}
                <ControlsRow dark={dark} generating={generating} onGenerate={onGenerate} onCancel={handleCancel} canEdit={canEdit}>
                    <EnhanceButton enhancing={enhancing} onClick={() => handleEnhance(prompt, setPrompt)} canEdit={canEdit} />
                    <SelectPill label={duration} options={durationOpts} value={duration} onChange={v => { setDuration(v); upd('duration', v); }} disabled={canEdit === false} />
                    <SelectPill label={aspect} options={aspectOpts} value={aspect} onChange={v => { setAspect(v); upd('aspectRatio', v); }} disabled={canEdit === false} />
                    <SelectPill label={shotType.toUpperCase()} options={shotOpts} value={shotType} onChange={v => { setShotType(v); upd('shotType', v); }} disabled={canEdit === false} />
                    <SelectPill label={modelOpts.find(o => o.value === model)?.label || model} options={modelOpts} value={model} onChange={v => { setModel(v); upd('model', v); }} disabled={canEdit === false} />
                    <div className="flex items-center px-1">
                        <Toggle value={audio} label="Audio" onChange={v => { setAudio(v); upd('audio', v); }} disabled={canEdit === false} />
                    </div>
                    <div className="flex items-center px-1">
                        <Toggle value={useNeg} label="Neg" onChange={v => { setUseNeg(v); upd('useNegativePrompt', v); }} disabled={canEdit === false} />
                    </div>
                    <ConnectionBadge
                        count={connectedPromptsCount}
                        audioLinked={!!referenceAudioUrl}
                        imageLinked={!!referenceImageUrl}
                        videoLinked={!!referenceVideoUrl}
                    />
                </ControlsRow>
            </NodeBase>
        </div>
    );
});

export default WanVideoR2V;
