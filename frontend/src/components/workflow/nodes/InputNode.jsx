import React, { memo, useState } from 'react';
import { Position, useReactFlow } from '@xyflow/react';
import { Database, Globe, Image as ImageIcon, Video, FileText, Folder, Music } from 'lucide-react';
import NodeBase from './NodeBase';
import { NodeHandle, SelectPill } from './NodePrimitives';
import useThemeStore from '../../../stores/themeStore';
import { assetService } from '../../../services/assetService';
import { ChevronRight, Search, X } from 'lucide-react';

const InputNode = memo(({ id, data, selected, onDeleteNode, canEdit }) => {
    const { setNodes } = useReactFlow();
    const { darkMode } = useThemeStore();
    const [assetType, setAssetType] = useState(data.assetType || 'image');
    const [url, setUrl] = useState(data.url || '');
    const [showAssetPicker, setShowAssetPicker] = useState(false);
    const [assets, setAssets] = useState([]);
    const [assetLoading, setAssetLoading] = useState(false);
    const [assetSearch, setAssetSearch] = useState('');

    const upd = (k, v) =>
        setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, [k]: v } } : n));

    const typeOptions = [
        { label: 'Image', value: 'image' },
        { label: 'Video', value: 'video' },
        { label: 'Audio', value: 'audio' },
        { label: 'Text', value: 'text' },
        { label: 'File', value: 'file' },
    ];

    const TypeIcon = { image: ImageIcon, video: Video, audio: Music, text: FileText, file: Folder }[assetType] || Folder;

    const fetchAssets = async () => {
        setAssetLoading(true);
        try {
            const res = await assetService.getAssets();
            setAssets(res || []);
        } catch (err) {
            console.error('Picker error:', err);
        } finally {
            setAssetLoading(false);
        }
    };

    const togglePicker = (e) => {
        if (e) e.stopPropagation();
        if (!showAssetPicker) fetchAssets();
        setShowAssetPicker(!showAssetPicker);
    };

    const selectAsset = (asset) => {
        const resourceUrl = asset.content || asset.file_path;
        if (resourceUrl) {
            setUrl(resourceUrl);
            upd('url', resourceUrl);
            setShowAssetPicker(false);
        }
    };

    const filteredAssets = assets.filter(a => {
        // First, check if it matches the search query
        const matchesSearch = a.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
            a.type.toLowerCase().includes(assetSearch.toLowerCase());

        if (!matchesSearch) return false;
        if (assetType === 'text') return a.type === 'text' || a.type === 'doc';
        if (assetType === 'file') return true; // Show all for generic 'file'
        if (assetType === 'audio') return a.type === 'audio';
        if (assetType === 'video') return a.type === 'video';

        return a.type === assetType;
    });

    return (
        <div className="relative">
            <NodeHandle type="source" position={Position.Right} id="output" icon={Database} top="50%" label="Data" />

            <NodeBase id={id} data={data} selected={selected} title="Data Source" icon={Database} minWidth={400} minHeight={240} onDeleteNode={onDeleteNode} canEdit={canEdit}>
                {/* ── Top Section (Controls) ── */}
                <div className="flex-shrink-0">
                    <div className="px-3 pt-3 mb-3">
                        <div className="flex items-center justify-between">
                            <SelectPill
                                label={assetType}
                                options={typeOptions}
                                value={assetType}
                                onChange={v => { setAssetType(v); upd('assetType', v); }}
                                disabled={canEdit === false}
                            />
                            {canEdit !== false && (
                                <button
                                    onClick={(e) => togglePicker(e)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all
                                        ${showAssetPicker
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                                >
                                    <Folder size={12} />
                                    {showAssetPicker ? 'Close Assets' : 'From Assets'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Inline Asset Picker Panel */}
                    {showAssetPicker && (
                        <div className="px-3 mb-3">
                            <div className={`p-3 rounded-2xl border animate-in slide-in-from-top-2 duration-300
                                ${darkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                                <div className={`flex items-center gap-2 mb-3 px-2.5 py-1.5 rounded-xl border transition-all
                                    ${darkMode ? 'bg-black/30 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                                    <Search size={12} className="opacity-30" />
                                    <input
                                        placeholder="Search library..."
                                        className="bg-transparent text-[10px] w-full focus:outline-none placeholder:opacity-20"
                                        value={assetSearch}
                                        onChange={e => setAssetSearch(e.target.value)}
                                        onKeyDown={e => e.stopPropagation()}
                                    />
                                </div>

                                <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                    {assetLoading ? (
                                        <div className="py-8 text-center"><span className="loading loading-spinner loading-xs opacity-20" /></div>
                                    ) : filteredAssets.length === 0 ? (
                                        <div className="py-8 text-center text-[10px] opacity-30 italic">No assets found</div>
                                    ) : (
                                        filteredAssets.map(asset => (
                                            <button
                                                key={asset.id}
                                                onClick={() => selectAsset(asset)}
                                                className={`flex items-center justify-between w-full p-2 rounded-lg text-left transition-all
                                                    ${darkMode ? 'hover:bg-white/5' : 'hover:bg-white shadow-sm hover:shadow'}`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                        {asset.type === 'image' ? <ImageIcon size={10} className="text-primary" /> : asset.type === 'audio' ? <Music size={10} className="text-primary" /> : <FileText size={10} className="text-primary" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-medium truncate">{asset.name}</p>
                                                        <p className="text-xs opacity-40 uppercase">{asset.type}</p>
                                                    </div>
                                                </div>
                                                <ChevronRight size={10} className="opacity-20" />
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* URL Input */}
                    <div className="px-3 mb-3">
                        <div className={`group flex items-center gap-2 px-3 py-2.5 rounded-2xl border transition-all duration-300
                            ${darkMode
                                ? 'bg-black/30 border-white/5 focus-within:border-primary/50'
                                : 'bg-slate-50 border-slate-200 focus-within:border-primary/50 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-primary/5'}`}>
                            <Globe size={14} className="opacity-20 group-focus-within:opacity-100 group-focus-within:text-primary transition-all" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs opacity-30 group-focus-within:opacity-100 group-focus-within:text-primary transition-all mb-0.5">Asset URL / Source</p>
                                <input
                                    value={url}
                                    onChange={e => { setUrl(e.target.value); upd('url', e.target.value); }}
                                    onKeyDown={(e) => e.stopPropagation()}
                                    placeholder="Paste URL or select from assets…"
                                    readOnly={canEdit === false}
                                    className={`bg-transparent text-xs font-medium w-full focus:outline-none placeholder:opacity-20
                                        ${darkMode ? 'text-white' : 'text-slate-700'}`}
                                    onClick={e => e.stopPropagation()}
                                />
                            </div>
                            {canEdit !== false && url && (
                                <button onClick={() => { setUrl(''); upd('url', ''); }} className="p-1 hover:bg-error/10 rounded-md transition-colors group-hover:opacity-100 opacity-0">
                                    <X size={12} className="text-error" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Preview Area — flex-1 allows it to grow in the NodeBase flex container */}
                <div className="px-3 pb-3 flex-1 flex flex-col min-h-0">
                    <div className="relative group/preview overflow-hidden rounded-2xl flex-1 flex flex-col min-h-[120px]">
                        {(url && (assetType === 'image' || assetType === 'video' || assetType === 'audio' || url.match(/\.(jpeg|jpg|gif|png|webp)/i))) ? (
                            <div className={`w-full h-full border shadow-inner transition-all duration-500 overflow-hidden flex items-center justify-center flex-1 min-h-0
                                ${darkMode ? 'border-white/5 bg-black/60' : 'border-black/5 bg-slate-100'}`}>
                                {assetType === 'image' || url.match(/\.(jpeg|jpg|gif|png|webp)/i)
                                    ? <img src={url} alt="" className="w-full h-full object-contain block" />
                                    : assetType === 'audio'
                                        ? <audio src={url} controls className="w-full h-[100px] p-3" />
                                        : <video src={url} controls className="w-full h-full object-contain block" />
                                }
                            </div>
                        ) : (
                            <div className={`flex-1 min-h-[100px] border border-dashed flex items-center justify-center transition-all
                                ${darkMode ? 'border-white/10 text-white/5 bg-black/20' : 'border-slate-200 text-slate-300 bg-slate-50'}`}>
                                <div className="flex flex-col items-center gap-2">
                                    <TypeIcon size={24} strokeWidth={1.5} className="opacity-40" />
                                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Waiting for data</p>
                                </div>
                            </div>
                        )}

                        {/* Type Badge Overlay */}
                        <div className="absolute top-3 left-3">
                            <div className="badge badge-sm rounded-lg bg-black/60 backdrop-blur-md border-none text-[9px] text-white font-bold tracking-widest uppercase">
                                {assetType}
                            </div>
                        </div>
                    </div>
                </div>
            </NodeBase>
        </div>
    );
});

export default InputNode;
