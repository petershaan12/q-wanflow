import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { ZOOM_PRESETS } from './EditorConstants';

const ZoomControls = ({ zoom, onZoomIn, onZoomOut, onZoomSet, onFitView }) => {
    const [showPresets, setShowPresets] = useState(false);
    const zoomPercent = Math.round(zoom * 100);
    const presetsRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (presetsRef.current && !presetsRef.current.contains(event.target)) {
                setShowPresets(false);
            }
        };
        if (showPresets) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showPresets]);

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-base-100/95 backdrop-blur-xl border border-base-300/40 rounded-xl p-1 shadow-2xl shadow-black/10">
            <button onClick={onZoomOut} className="w-5 h-5 rounded-md flex items-center justify-center text-base-content/50 hover:text-base-content hover:bg-base-200/70">
                <ZoomOut size={14} />
            </button>
            <div className="relative">
                <button onClick={() => setShowPresets(!showPresets)} className="h-7 px-2 rounded-md flex items-center justify-center text-xs font-bold text-base-content/70 hover:bg-base-200/70 min-w-[44px]">
                    {zoomPercent}%
                </button>
                {showPresets && (
                    <div ref={presetsRef} className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-base-100 border border-base-300/40 rounded shadow-2xl p-1 min-w-[72px]">
                        {ZOOM_PRESETS.map((p) => (
                            <button
                                key={p}
                                onClick={() => { onZoomSet(p / 100); setShowPresets(false); }}
                                className={`w-full px-2.5 py-1 rounded-md text-xs font-semibold text-left transition-all ${zoomPercent === p ? 'bg-primary/10 text-primary' : 'text-base-content/60 hover:bg-base-200/70'}`}
                            >
                                {p}%
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <button onClick={onZoomIn} className="w-5 h-5 rounded-md flex items-center justify-center text-base-content/50 hover:text-base-content hover:bg-base-200/70">
                <ZoomIn size={14} />
            </button>
            <div className="w-px h-4 bg-base-300/40" />
            <button onClick={onFitView} className="w-5 h-5 rounded-md flex items-center justify-center text-base-content/50 hover:text-base-content hover:bg-base-200/70">
                <Maximize size={13} />
            </button>
        </div>
    );
};

export default ZoomControls;
