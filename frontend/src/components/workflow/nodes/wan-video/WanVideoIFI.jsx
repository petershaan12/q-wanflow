import React, { memo, useState, useEffect } from 'react';
import { Position, useReactFlow, useEdges } from '@xyflow/react';
import { Video, Type, Image } from 'lucide-react';
import NodeBase from '../NodeBase';
import { NodeHandle, SelectPill, Toggle } from '../NodePrimitives';
import useThemeStore from '../../../../stores/themeStore';
import {
    mergePromptParts, getLinkedText,
    PromptArea, NegativePromptArea, VideoPreview,
    EnhanceButton, ControlsRow, ConnectionBadge,
    useVideoGeneration,
} from './WanVideoBase';

const MODELS = ['wan2.2-kf2v-flash', 'wan2.1-kf2v-plus'];

const WanVideoIFI = memo(({ id, data, selected, showToast, onDeleteNode, canEdit }) => {
    const { setNodes, getNodes, getEdges } = useReactFlow();
    const edges = useEdges();
    const { darkMode: dark } = useThemeStore();

    const [prompt, setPrompt] = useState(data.prompt || '');
    const [negativePrompt, setNegativePrompt] = useState(data.negativePrompt || '');
    const [resolution, setResolution] = useState(() => {
        const val = data.resolution || '720P';
        return val.toString().toUpperCase().endsWith('P') ? val : `${val}P`;
    });
    const [duration, setDuration] = useState(data.duration || '5s');
    const [model, setModel] = useState(data.model || 'wan2.2-kf2v-flash');
    const [firstFrameUrl, setFirstFrameUrl] = useState(data.firstFrameUrl || '');
    const [lastFrameUrl, setLastFrameUrl] = useState(data.lastFrameUrl || '');
    const [useNeg, setUseNeg] = useState(data.useNegativePrompt !== undefined ? data.useNegativePrompt : false);

    const {
        loadingStatus, loadingMessage, loadingProgress,
        enhancing, generating,
        upd, handleCancel, handleEnhance, handleGenerate, clearStatus,
    } = useVideoGeneration({ id, data, showToast, setNodes });

    // Resolution options depend on model
    const resolutionOpts = model === 'wan2.2-kf2v-flash'
        ? ['480', '720', '1080'].map(v => ({ label: v + 'p', value: v + 'P' }))
        : [{ label: '720p', value: '720P' }];

    const durationOpts = ['2s', '5s', '10s'].map(v => ({ label: v, value: v }));

    // Ensure resolution is valid for selected model
    useEffect(() => {
        if (model === 'wan2.1-kf2v-plus' && resolution !== '720P') {
            setResolution('720P');
            upd('resolution', '720P');
        }
    }, [model]);

    // Sync connected first/last frame images
    useEffect(() => {
        const firstEdge = getEdges().find(e => e.target === id && e.targetHandle === 'first-frame');
        if (firstEdge) {
            const node = getNodes().find(n => n.id === firstEdge.source);
            if (node) {
                const url = node.data?.imageUrl || node.data?.url || '';
                if (url !== firstFrameUrl) { setFirstFrameUrl(url); upd('firstFrameUrl', url); }
            }
        } else if (firstFrameUrl) {
            setFirstFrameUrl(''); upd('firstFrameUrl', '');
        }

        const lastEdge = getEdges().find(e => e.target === id && e.targetHandle === 'last-frame');
        if (lastEdge) {
            const node = getNodes().find(n => n.id === lastEdge.source);
            if (node) {
                const url = node.data?.imageUrl || node.data?.url || '';
                if (url !== lastFrameUrl) { setLastFrameUrl(url); upd('lastFrameUrl', url); }
            }
        } else if (lastFrameUrl) {
            setLastFrameUrl(''); upd('lastFrameUrl', '');
        }
    }, [edges]);

    const connectedPromptsCount = getEdges().filter(e => e.target === id && e.targetHandle === 'text-prompt').length;

    const onGenerate = () => {
        if (!firstFrameUrl && !lastFrameUrl) {
            showToast?.('error', 'Please connect at least a First Frame or Last Frame image');
            return;
        }
        const linkedPrompt = getLinkedText(id, 'text-prompt', getEdges, getNodes);
        const effectivePrompt = mergePromptParts(linkedPrompt, prompt);
        const effectiveNeg = useNeg ? (negativePrompt || undefined) : undefined;

        handleGenerate({
            prompt: effectivePrompt,
            negative_prompt: effectiveNeg,
            model,
            resolution: resolution.endsWith('P') ? resolution : `${resolution}P`,
            duration,
            first_frame_url: firstFrameUrl || undefined,
            last_frame_url: lastFrameUrl || undefined,
            // no duration for KF2V
        });
    };

    const modelOpts = MODELS.map(v => ({
        label: v === 'wan2.2-kf2v-flash' ? 'KF2V Flash' : 'KF2V Plus',
        value: v,
    }));

    const hasBoth = !!firstFrameUrl && !!lastFrameUrl;

    return (
        <div className="relative">
            <NodeHandle type="target" position={Position.Left} id="text-prompt" icon={Type} top="25%" label="Text Prompt" />
            <NodeHandle type="target" position={Position.Left} id="first-frame" icon={Image} top="55%" label="First Frame Image (required)" />
            <NodeHandle type="target" position={Position.Left} id="last-frame" icon={Image} top="80%" label="Last Frame Image (required)" />
            <NodeHandle type="source" position={Position.Right} id="output" icon={Video} top="50%" label="Video Output" />

            <NodeBase id={id} data={data} selected={selected} title="IFI · First & Last Frame to Video" icon={Video} minWidth={400} onDeleteNode={onDeleteNode} canEdit={canEdit}>


                <VideoPreview
                    videoUrl={data.videoUrl}
                    modeBadge="IFI"
                    aspectClass="aspect-video"
                    loadingStatus={loadingStatus}
                    loadingMessage={loadingMessage}
                    loadingProgress={loadingProgress}
                    clearStatus={clearStatus}
                    dark={dark}
                />
                <PromptArea prompt={prompt} setPrompt={setPrompt} upd={upd} dark={dark} placeholder="Describe what happens between first and last frame..." canEdit={canEdit} />
                {useNeg && <NegativePromptArea negativePrompt={negativePrompt} setNegativePrompt={setNegativePrompt} upd={upd} dark={dark} canEdit={canEdit} />}
                <ControlsRow dark={dark} generating={generating} onGenerate={onGenerate} onCancel={handleCancel} canEdit={canEdit}>
                    <EnhanceButton enhancing={enhancing} onClick={() => handleEnhance(prompt, setPrompt)} canEdit={canEdit} />
                    <SelectPill label={duration} options={durationOpts} value={duration} onChange={v => { setDuration(v); upd('duration', v); }} disabled={canEdit === false} />
                    <SelectPill
                        label={resolutionOpts.find(o => o.value === resolution)?.label || resolution}
                        options={resolutionOpts}
                        value={resolution}
                        onChange={v => { setResolution(v); upd('resolution', v); }}
                        disabled={canEdit === false}
                    />
                    <SelectPill label={modelOpts.find(o => o.value === model)?.label || model} options={modelOpts} value={model} onChange={v => { setModel(v); upd('model', v); }} disabled={canEdit === false} />
                    <div className="flex items-center px-1">
                        <Toggle value={useNeg} label="Neg" onChange={v => { setUseNeg(v); upd('useNegativePrompt', v); }} disabled={canEdit === false} />
                    </div>
                    <ConnectionBadge count={connectedPromptsCount} audioLinked={false} imageLinked={!!firstFrameUrl || !!lastFrameUrl} />
                </ControlsRow>
            </NodeBase>
        </div>
    );
});

export default WanVideoIFI;
