import React, { useState, useEffect, useRef } from 'react';
import { Terminal, RefreshCw, Trash2, Download, Search, AlertCircle } from 'lucide-react';
import { userService } from '../services/userService';
import Topbar from '../components/Topbar';
import useThemeStore from '../stores/themeStore';

const AdminLogsPage = () => {
    const { darkMode } = useThemeStore();
    const [logs, setLogs] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lineCount, setLineCount] = useState(200);
    const [search, setSearch] = useState('');
    const logContainerRef = useRef(null);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const data = await userService.getLogs(lineCount);
            setLogs(data.logs);
            setError(null);
        } catch (err) {
            console.error('Error fetching logs:', err);
            setError('Failed to load logs. Please check your connection and admin permissions.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [lineCount]);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([logs], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `app_${new Date().toISOString().split('T')[0]}.log`;
        document.body.appendChild(element);
        element.click();
    };

    return (
        <div className="flex flex-col h-full bg-base-200/30">
            <Topbar showDefaultSearch={false}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30" size={14} />
                    <input
                        type="text"
                        placeholder="Search system logs..."
                        className="input input-sm bg-base-100 pl-9 pr-4 rounded-xl w-56 text-xs font-medium border border-base-300"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </Topbar>

            <div className="flex-1 p-6 flex flex-col gap-4 overflow-hidden">
                <div className="flex items-center justify-between gap-4 bg-base-100 p-4 rounded-xl border border-base-300 shadow-sm animate-fade-in">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/40">Depth</span>
                            <select
                                className="select select-sm select-bordered h-9 bg-base-200/50 hover:bg-base-200 rounded-xl text-[11px] font-semibold transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/20"
                                value={lineCount}
                                onChange={(e) => setLineCount(Number(e.target.value))}
                            >
                                <option value={100}>100 Entries</option>
                                <option value={200}>200 Entries</option>
                                <option value={500}>500 Entries</option>
                                <option value={1000}>1000 Entries</option>
                                <option value={0}>Full History</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchLogs}
                            className={`btn btn-sm h-9 px-4 rounded-xl bg-base-200/50 hover:bg-base-200 border border-base-300/30 text-base-content/60 font-semibold gap-2 transition-all ${loading ? 'btn-disabled opacity-50' : ''}`}
                            disabled={loading}
                        >
                            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                            Sync
                        </button>
                        <button
                            onClick={handleDownload}
                            className="btn btn-sm h-9 px-4 rounded-xl btn-primary gap-2 font-bold shadow-lg shadow-primary/10 border-none transition-all"
                        >
                            <Download size={13} />
                            Export
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-error rounded-xl shadow-lg animate-fade-in">
                        <AlertCircle size={18} />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                <div className={`flex-1 ${darkMode ? 'bg-[#0a0a0a]' : 'bg-[#fcfcfc]'} rounded-xl border ${darkMode ? 'border-white/5' : 'border-black/[0.08]'} shadow-2xl overflow-hidden flex flex-col relative group animate-fade-in delay-100`}>
                    {/* Terminal Header */}
                    <div className={`${darkMode ? 'bg-white/[0.03] border-white/[0.03]' : 'bg-black/[0.02] border-black/[0.05]'} border-b px-4 py-2 flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
                            <span className={`ml-2 text-[11px] font-mono font-medium ${darkMode ? 'text-white/30' : 'text-black/30'} uppercase tracking-widest`}>app.log</span>
                        </div>
                        <div className={`text-[10px] font-mono ${darkMode ? 'text-white/20' : 'text-black/20'} font-medium`}>
                            UTF-8 • LINUX
                        </div>
                    </div>

                    <div
                        ref={logContainerRef}
                        className="flex-1 overflow-auto p-4 font-mono text-[12px] leading-relaxed selection:bg-primary/30 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                    >
                        {logs ? (
                            <pre className={`${darkMode ? 'text-white/90' : 'text-slate-700'} whitespace-pre-wrap break-all`}>
                                {logs.split('\n')
                                    .filter(line => !search || line.toLowerCase().includes(search.toLowerCase()))
                                    .map((line, i) => {
                                        if (!line.trim()) return <br key={i} />;

                                        // Basic color coding for log levels
                                        let colorClass = darkMode ? "text-white/70" : "text-slate-600";
                                        if (line.includes('ERROR') || line.includes('CRITICAL')) colorClass = "text-red-500 font-bold";
                                        else if (line.includes('WARNING')) colorClass = "text-amber-500 font-bold";
                                        else if (line.includes('INFO')) colorClass = "text-blue-500 font-bold";
                                        else if (line.includes('DEBUG')) colorClass = darkMode ? "text-white/30 italic" : "text-slate-400 italic";

                                        return (
                                            <div key={i} className={`hover:bg-primary/5 transition-colors px-1 rounded ${colorClass}`}>
                                                <span className={`${darkMode ? 'text-white/10' : 'text-black/10'} mr-3 select-none`}>{i + 1}</span>
                                                {line}
                                            </div>
                                        );
                                    })}
                            </pre>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center gap-4 text-white/20">
                                <Terminal size={48} strokeWidth={1} />
                                <p className="text-sm font-medium">No log entries found</p>
                            </div>
                        )}

                        {loading && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                                <span className="loading loading-spinner loading-md text-primary"></span>
                            </div>
                        )}
                    </div>

                    {/* Terminal Footer */}
                    <div className={`${darkMode ? 'bg-white/5 border-white/5' : 'bg-black/[0.02] border-black/[0.05]'} border-t px-4 py-2 flex items-center justify-between`}>
                        <div className={`text-[10px] font-mono ${darkMode ? 'text-white/20' : 'text-black/20'} truncate max-w-[70%] font-medium`}>
                            $ tail -f backend/logs/app.log {search ? `| grep "${search}"` : ''}
                        </div>
                        <div className={`text-[10px] font-mono ${darkMode ? 'text-white/20' : 'text-black/20'} uppercase font-medium`}>
                            {logs ? logs.split('\n').filter(line => !search || line.toLowerCase().includes(search.toLowerCase())).length : 0} Lines
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogsPage;
