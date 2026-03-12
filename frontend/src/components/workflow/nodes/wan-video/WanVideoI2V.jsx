import React, { memo, useState, useEffect } from 'react';
import { Position, useReactFlow, useEdges } from '@xyflow/react';
import { Video, Type, Image, Volume2 } from 'lucide-react';
import NodeBase from '../NodeBase';
import { NodeHandle, SelectPill, Toggle } from '../NodePrimitives';
import useThemeStore from '../../../../stores/themeStore';
import {
    mergePromptParts, getLinkedText, getLinkedMediaUrl, getLinkedAudioUrl,
    PromptArea, NegativePromptArea, VideoPreview,
    EnhanceButton, ControlsRow, ConnectionBadge,
    useVideoGeneration,
} from './WanVideoBase';

const MODELS = ['wan2.6-i2v', 'wan2.6-i2v-flash', 'wan2.5-i2v-preview'];

const WanVideoI2V = memo(({ id, data, selected, showToast, onDeleteNode, canEdit }) => {
    const { setNodes, getNodes, getEdges } = useReactFlow();
    const edges = useEdges();
    const { darkMode: dark } = useThemeStore();
    const [prompt, setPrompt] = useState(data.prompt || '');
    const [negativePrompt, setNegativePrompt] = useState(data.negativePrompt || '');
    const [resolution, setResolution] = useState(data.resolution || '720P');
    const [duration, setDuration] = useState(data.duration || '5');
    const [audio, setAudio] = useState(data.audio !== undefined ? data.audio : true);
    const [model, setModel] = useState(data.model || 'wan2.6-i2v');
    const [shotType, setShotType] = useState(data.shot_type || 'single');
    const [referenceImageUrl, setReferenceImageUrl] = useState(data.referenceImageUrl || '');
    const [referenceAudioUrl, setReferenceAudioUrl] = useState(data.referenceAudioUrl || '');
    const [useNeg, setUseNeg] = useState(data.useNegativePrompt !== undefined ? data.useNegativePrompt : false);

    const {
        loadingStatus, loadingMessage, loadingProgress,
        enhancing, generating,
        upd, handleCancel, handleEnhance, handleGenerate, clearStatus,
    } = useVideoGeneration({ id, data, showToast, setNodes });

    // Sync connected image and audio
    useEffect(() => {
        const { image } = getLinkedMediaUrl(id, 'ref-image', getEdges, getNodes);
        if (image !== referenceImageUrl) { setReferenceImageUrl(image); upd('referenceImageUrl', image); }

        const audio = getLinkedAudioUrl(id, getEdges, getNodes);
        if (audio !== referenceAudioUrl) { setReferenceAudioUrl(audio); upd('referenceAudioUrl', audio); }
    }, [edges]);

    const connectedPromptsCount = getEdges().filter(e => e.target === id && e.targetHandle === 'text-prompt').length;
    const hasImage = !!referenceImageUrl;

    const onGenerate = () => {
        if (!hasImage) { showToast?.('error', 'Please connect a reference image first'); return; }
        const linkedPrompt = getLinkedText(id, 'text-prompt', getEdges, getNodes);
        const effectivePrompt = mergePromptParts(linkedPrompt, prompt);
        const effectiveNeg = useNeg ? (negativePrompt || undefined) : undefined;
        handleGenerate({
            prompt: effectivePrompt,
            negative_prompt: effectiveNeg,
            model,
            resolution,
            duration,
            shot_type: shotType,
            audio: model.includes('wan2.6') ? audio : undefined,
            reference_image_url: referenceImageUrl,
            audio_url: referenceAudioUrl || undefined,
        });
    };

    const resolutionOpts = ['720', '1080'].map(v => ({ label: v, value: v + 'P' }));
    const durationOpts = ['2s', '3s', '5s'].map(v => ({ label: v, value: v }));
    const modelOpts = MODELS.map(v => ({ label: v.replace('wan2.6-i2v', 'i2v').replace('wan2.5-', '(2.5) ').replace('-preview', '').replace('-flash', ' Flash'), value: v }));
    const shotOpts = [
        { label: 'Single', value: 'single' },
        { label: 'Multiple', value: 'multi' },
    ];

    return (
        <div className="relative">
            <NodeHandle type="target" position={Position.Left} id="text-prompt" icon={Type} top="25%" label="Text Prompt" />
            <NodeHandle type="target" position={Position.Left} id="ref-image" icon={Image} top="55%" label="Reference Image (required)" />
            <NodeHandle type="target" position={Position.Left} id="ref-audio" icon={Volume2} top="80%" label="Reference Audio" />
            <NodeHandle type="source" position={Position.Right} id="output" icon={Video} top="50%" label="Video Output" />

            <NodeBase id={id} data={data} selected={selected} title="I2V · Image to Video" icon={Video} minWidth={400} onDeleteNode={onDeleteNode} canEdit={canEdit}>
                {/* Reference image thumbnail */}

                <VideoPreview
                    videoUrl={data.videoUrl}
                    modeBadge="I2V"
                    aspectClass="aspect-video"
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
                    <SelectPill label={shotType.toUpperCase()} options={shotOpts} value={shotType} onChange={v => { setShotType(v); upd('shot_type', v); }} disabled={canEdit === false} />
                    <SelectPill label={duration} options={durationOpts} value={duration} onChange={v => { setDuration(v); upd('duration', v); }} disabled={canEdit === false} />
                    <SelectPill
                        label={resolutionOpts.find(o => o.value === resolution)?.label || resolution}
                        options={resolutionOpts}
                        value={resolution}
                        onChange={v => { setResolution(v); upd('resolution', v); }}
                        disabled={canEdit === false}
                    />
                    <SelectPill label={modelOpts.find(o => o.value === model)?.label || model} options={modelOpts} value={model} onChange={v => { setModel(v); upd('model', v); }} disabled={canEdit === false} />
                    {model.includes('wan2.6') && (
                        <div className="flex items-center px-1">
                            <Toggle value={audio} label="Audio" onChange={v => { setAudio(v); upd('audio', v); }} />
                        </div>
                    )}
                    <div className="flex items-center px-1">
                        <Toggle value={useNeg} label="Neg" onChange={v => { setUseNeg(v); upd('useNegativePrompt', v); }} />
                    </div>
                    <ConnectionBadge count={connectedPromptsCount} audioLinked={!!referenceAudioUrl} imageLinked={!!referenceImageUrl} />
                </ControlsRow>
            </NodeBase>
        </div>
    );
});

export default WanVideoI2V;
