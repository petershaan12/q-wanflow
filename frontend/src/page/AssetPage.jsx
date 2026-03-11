import React, { useState, useEffect, useRef } from 'react';
import {
    Package, Search, Grid, List,
    MoreVertical, Download, ExternalLink, Trash2,
    FileText, Image as ImageIcon, Video, Music, Code,
    Clock, Plus, Tag, HardDrive, AlertCircle
} from 'lucide-react';
import { assetService } from '../services/assetService';
import Topbar from '../components/Topbar';

const AssetPage = () => {
    const [viewMode, setViewMode] = useState('grid');
    const [loading, setLoading] = useState(true);
    const [assets, setAssets] = useState([]);
    const [search, setSearch] = useState('');
    const [renamingId, setRenamingId] = useState(null);
    const [tempName, setTempName] = useState('');
    const [storageInfo, setStorageInfo] = useState(null);
    const [storageLoading, setStorageLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const data = await assetService.getAssets();
            setAssets(data || []);
        } catch (err) {
            console.error('Error fetching assets:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStorageInfo = async () => {
        try {
            setStorageLoading(true);
            const info = await assetService.getStorageInfo();
            setStorageInfo(info);
        } catch (err) {
            console.error('Error fetching storage info:', err);
        } finally {
            setStorageLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
        fetchStorageInfo();
    }, []);

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            await assetService.uploadAsset(file);
            await fetchAssets();
            await fetchStorageInfo();
            // Optional: add a success toast here
        } catch (err) {
            console.error('Error uploading asset:', err);
            alert(err.response?.data?.detail || 'Failed to upload asset');
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const openAssetInNewTab = (asset) => {
        const resourceUrl = asset.content || asset.file_path;
        if (!resourceUrl) return;
        window.open(resourceUrl, '_blank', 'noopener,noreferrer');
    };

    const downloadAsset = async (asset) => {
        const resourceUrl = asset.content || asset.file_path;
        const fallbackName = `${asset.name || 'asset'}.${asset.type === 'prompt_template' ? 'txt' : 'bin'}`;

        if (asset.type === 'prompt_template' && asset.content) {
            const blob = new Blob([asset.content], { type: 'text/plain;charset=utf-8' });
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fallbackName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(blobUrl);
            return;
        }

        if (!resourceUrl) return;

        try {
            const response = await fetch(resourceUrl);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fallbackName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            const link = document.createElement('a');
            link.href = resourceUrl;
            link.download = fallbackName;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            link.remove();
        }
    };

    const renameAsset = (asset) => {
        setTempName(asset.name);
        setRenamingId(asset.id);
    };

    const submitRename = async (asset) => {
        const trimmedName = tempName.trim();
        if (!trimmedName || trimmedName === asset.name) {
            setRenamingId(null);
            return;
        }

        try {
            await assetService.updateAsset(asset.id, {
                name: trimmedName,
                type: asset.type,
                content: asset.content || '',
                file_path: asset.file_path || null,
            });
            fetchAssets();
        } catch (err) {
            console.error('Error renaming asset:', err);
        } finally {
            setRenamingId(null);
        }
    };

    const deleteAsset = async (asset) => {
        if (!window.confirm(`Delete asset "${asset.name}"?`)) return;
        try {
            await assetService.deleteAsset(asset.id);
            fetchAssets();
        } catch (err) {
            console.error('Error deleting asset:', err);
        }
    };

    const filtered = (assets || []).filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.type.toLowerCase().includes(search.toLowerCase())
    );

    const getIcon = (type) => {
        switch (type) {
            case 'image': return <ImageIcon size={20} />;
            case 'video': return <Video size={20} />;
            case 'audio': return <Music size={20} />;
            case 'prompt_template': return <FileText size={20} />;
            case 'code': return <Code size={20} />;
            default: return <Package size={20} />;
        }
    };

    return (
        <div>
            <Topbar showDefaultSearch={false}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30" size={14} />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input input-sm bg-base-100 border-base-300 w-56 rounded-xl pl-9 text-xs font-medium"
                    />
                </div>
            </Topbar>
            <div className="p-6 max-w-7xl mx-auto">
                {/* Header */}
                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 animate-fade-in">
                    <div className="space-y-3">
                        <h1 className="text-2xl font-semibold">Media Assets</h1>
                        <div className="space-y-2">
                            <div className="flex items-center gap-4 text-sm opacity-30">
                                <span className="flex items-center gap-1.5"><HardDrive size={12} /> 
                                    {storageLoading ? (
                                        <span className="loading loading-spinner loading-xs opacity-30" />
                                    ) : storageInfo ? (
                                        <>
                                            {storageInfo.storage_used_human} / {storageInfo.storage_limit_human}
                                            {storageInfo.plan === 'free' && (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 ${storageInfo.storage_percent > 90 ? 'bg-error/20 text-error' : 'bg-primary/10 text-primary'}`}>
                                                    {storageInfo.storage_percent.toFixed(1)}%
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        '0 GB / 1 GB'
                                    )}
                                </span>
                                <span className="flex items-center gap-1.5"><Package size={12} /> {assets.length} items</span>
                            </div>
                            
                            {/* Storage Progress Bar */}
                            {storageInfo && storageInfo.plan === 'free' && (
                                <div className="w-full h-1.5 bg-base-300 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ${storageInfo.storage_percent > 90 ? 'bg-error' : 'bg-primary'}`}
                                        style={{ width: `${Math.min(storageInfo.storage_percent, 100)}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center bg-base-100 rounded-xl p-0.5 border border-base-300 shadow-sm">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-base-content/30 hover:text-base-content/60'}`}
                            >
                                <Grid size={15} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-base-content/30 hover:text-base-content/60'}`}
                            >
                                <List size={15} />
                            </button>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <button 
                            onClick={handleUploadClick}
                            disabled={uploading}
                            className="btn btn-primary btn-sm h-10 rounded-xl gap-2 font-bold shadow-lg shadow-primary/20 px-5"
                        >
                            {uploading ? <span className="loading loading-spinner loading-sm"></span> : <Plus size={16} />} 
                            {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 opacity-30 gap-4">
                        <span className="loading loading-ring loading-lg text-primary"></span>
                        <p className="text-xs font-bold uppercase tracking-widest">Scanning library...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-base-100/30 rounded-3xl border border-dashed border-base-300 animate-fade-in">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-6">
                            <Package size={40} strokeWidth={1.5} className="text-primary/40" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No assets found</h3>
                        <p className="text-sm text-base-content/40 max-w-xs text-center px-4">
                            Try searching for something else or upload new files to your library.
                        </p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-fade-in">
                        {filtered.map((asset, i) => (
                            <div key={asset.id} className="group card bg-base-100 border border-base-300 shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all duration-300 rounded-2xl" style={{ animationDelay: `${i * 30}ms` }}>
                                <div className="aspect-square bg-base-200 relative flex items-center justify-center overflow-hidden rounded-t-2xl">
                                    {asset.type === 'image' && asset.content ? (
                                        <img src={asset.content} alt={asset.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                    ) : (
                                        <div className="opacity-20 group-hover:scale-110 transition-all duration-700">
                                            {getIcon(asset.type)}
                                        </div>
                                    )}

                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                        <button onClick={() => downloadAsset(asset)} className="w-10 h-10 hover:bg-primary rounded-2xl text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all" title="Download"><Download size={20} /></button>
                                    </div>

                                    <div className="absolute top-2.5 left-2.5">
                                        <div className="badge badge-sm bg-black/60 backdrop-blur-md border-none text-white text-[9px] font-bold tracking-widest uppercase py-1 px-2 rounded-md">
                                            {asset.type}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 pr-6">
                                            {renamingId === asset.id ? (
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={tempName}
                                                    onChange={(e) => setTempName(e.target.value)}
                                                    onBlur={() => submitRename(asset)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') submitRename(asset);
                                                        if (e.key === 'Escape') setRenamingId(null);
                                                        e.stopPropagation();
                                                    }}
                                                    className="input input-xs input-primary w-full bg-base-200 font-bold rounded-md"
                                                />
                                            ) : (
                                                <h3
                                                    className="text-xs font-bold group-hover:text-primary transition-colors truncate cursor-pointer select-none"
                                                    title="Double click to rename"
                                                    onDoubleClick={() => renameAsset(asset)}
                                                >
                                                    {asset.name}
                                                </h3>
                                            )}
                                            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold opacity-30 uppercase tracking-tighter">
                                                <Clock size={10} /> {new Date(asset.created_at || Date.now()).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteAsset(asset)}
                                            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-error/10 text-base-content/20 hover:text-error transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm overflow-hidden animate-fade-in">
                        <table className="table">
                            <thead>
                                <tr className="bg-base-200/40 border-b border-base-300">
                                    <th className="px-6 py-4 font-semibold text-base-content/40">Asset</th>
                                    <th className="py-4 font-semibold text-base-content/40">Type</th>
                                    <th className="py-4 font-semibold text-base-content/40">Created</th>
                                    <th className="py-4 font-semibold text-base-content/40">Size</th>
                                    <th className="px-6 py-4 text-right text-base-content/40 font-semibold tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((asset) => (
                                    <tr key={asset.id} className="hover:bg-base-200/30 transition-colors border-b border-base-300">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shadow-sm border border-primary/10">
                                                    {getIcon(asset.type)}
                                                </div>
                                                {renamingId === asset.id ? (
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={tempName}
                                                        onChange={(e) => setTempName(e.target.value)}
                                                        onBlur={() => submitRename(asset)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') submitRename(asset);
                                                            if (e.key === 'Escape') setRenamingId(null);
                                                            e.stopPropagation();
                                                        }}
                                                        className="input input-xs input-primary w-full max-w-[200px] font-bold rounded-md"
                                                    />
                                                ) : (
                                                    <div onDoubleClick={() => renameAsset(asset)} title="Double click to rename" className="cursor-pointer flex flex-col">
                                                        <span className="font-bold text-sm tracking-tight group-hover:text-primary transition-all">{asset.name}</span>
                                                        <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest italic">{asset.type}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <span className={`badge badge-sm border-none rounded-lg p-3 uppercase text-[10px] font-bold ${asset.type === 'prompt_template' ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/50'}`}>
                                                {asset.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="py-4 text-xs font-bold opacity-30 uppercase tracking-tighter">
                                            {new Date(asset.created_at || Date.now()).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 text-xs font-bold opacity-30 uppercase tracking-tighter">240 KB</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <button onClick={() => downloadAsset(asset)} className="w-8 h-8 flex items-center justify-center rounded-lg text-primary hover:bg-primary/20 transition-all shadow-sm" title="Download"><Download size={14} /></button>
                                                <button onClick={() => deleteAsset(asset)} className="w-8 h-8 flex items-center justify-center rounded-lg text-error hover:text-error hover:bg-error/10 transition-all" title="Delete"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssetPage;
