import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Handle, Position } from '@xyflow/react';
import { ChevronDown, Play, Square } from 'lucide-react';
import useThemeStore from '../../../stores/themeStore';

export const NodeHandle = ({ type, position, id, icon: Icon, top, label }) => {
    const { darkMode } = useThemeStore();
    const [showTip, setShowTip] = useState(false);
    const [tipPos, setTipPos] = useState({ x: 0, y: 0 });
    const ref = useRef(null);

    const onEnter = () => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        setTipPos({ x: r.left + r.width / 2, y: r.bottom + 6 });
        setShowTip(true);
    };

    return (
        <>
            <Handle
                ref={ref}
                type={type}
                position={position}
                id={id}
                style={{ top }}
                onMouseEnter={onEnter}
                onMouseLeave={() => setShowTip(false)}
                className={`w-7 h-7 rounded-full border border-base-100 flex items-center justify-center transition-all z-50
                           ${type === 'target' ? '!left-[-16px]' : '!right-[-16px]'}
                        bg-base-100`}
            >
                {Icon && (
                    <Icon size={10} />
                )}
            </Handle>

            {label && showTip && typeof document !== 'undefined' &&
                ReactDOM.createPortal(
                    <div
                        className={`fixed z-[99999] pointer-events-none select-none
              px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap
             bg-base-100 border border-base-100`}
                        style={{ left: tipPos.x, top: tipPos.y, transform: 'translateX(-50%)' }}
                    >
                        {label}
                    </div>,
                    document.body
                )
            }
        </>
    );
};

/**
 * SelectPill — inline dropdown pill with portal menu (never clipped by node).
 */
export const SelectPill = ({ icon: Icon, label, options, value, onChange, disabled }) => {
    const { darkMode } = useThemeStore();
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const btnRef = useRef(null);
    const menuRef = useRef(null);

    const toggle = () => {
        if (disabled) return;
        if (!open && btnRef.current) {
            const r = btnRef.current.getBoundingClientRect();
            setPos({ x: r.left, y: r.bottom + 4 });
        }
        setOpen(o => !o);
    };

    useEffect(() => {
        if (!open) return;
        const close = (e) => {
            if (btnRef.current && !btnRef.current.contains(e.target) &&
                menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        window.addEventListener('mousedown', close, { capture: true });
        return () => window.removeEventListener('mousedown', close, { capture: true });
    }, [open]);

    return (
        <>
            <button
                ref={btnRef}
                onClick={toggle}
                disabled={disabled}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-bold transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed bg-base-200 border-base-300' : 'bg-base-100 border-base-300/40'}`}
            >
                {Icon && <Icon size={10} />}
                <span className="truncate max-w-[60px]">{label}</span>
                <ChevronDown size={8} className={`transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && typeof document !== 'undefined' &&
                ReactDOM.createPortal(
                    <div
                        ref={menuRef}
                        className={`fixed z-[99999] p-1 rounded-xl border shadow-2xl w-max animate-in fade-in zoom-in-95 duration-100
                                    bg-base-100 border border-base-300/40`}
                        style={{ left: pos.x, top: pos.y }}
                    >
                        {options.map(opt => {
                            const v = opt.value ?? opt;
                            const l = opt.label ?? opt;
                            const isDisabled = Boolean(opt.disabled);
                            return (
                                <button
                                    key={v}
                                    onClick={() => {
                                        if (isDisabled) return;
                                        onChange(v);
                                        setOpen(false);
                                    }}
                                    disabled={isDisabled}
                                    className={`w-auto text-left px-2 py-1.5 rounded-lg font-medium text-xs transition-colors truncate
                    ${v === value
                                            ? 'bg-indigo-500/15 text-indigo-400'
                                            : isDisabled
                                                ? 'text-base-content/25 cursor-not-allowed'
                                                : 'text-base-content/50 hover:bg-base-200'}`}
                                >
                                    {l}
                                </button>
                            );
                        })}
                    </div>,
                    document.body
                )
            }
        </>
    );
};

/**
 * Toggle — simple on/off switch.
 */
export const Toggle = ({ value, onChange, label }) => {
    const { darkMode } = useThemeStore();
    return (
        <button onClick={() => onChange(!value)} className="flex items-center gap-1.5">
            <div
                className={`relative transition-colors rounded-full flex-shrink-0`}
                style={{ width: 28, height: 16, background: value ? '#6366f1' : darkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}
            >
                <div
                    className="absolute top-[2px] w-3 h-3 rounded-full bg-white shadow transition-all"
                    style={{ left: value ? 13 : 2 }}
                />
            </div>
            {label && (
                <span className={`text-xs font-bold uppercase tracking-wider
          ${value ? 'text-indigo-400' : darkMode ? 'text-white/25' : 'text-slate-300'}`}>
                    {label}
                </span>
            )}
        </button>
    );
};

/**
 * GenerateButton — primary action button.
 */
export const GenerateButton = ({ label = 'Generate', onClick, isGenerating = false, onCancel }) => {
    return (
        <button
            onClick={(e) => {
                if (isGenerating && onCancel) {
                    onCancel(e);
                } else if (!isGenerating && onClick) {
                    onClick(e);
                }
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 active:scale-95 shadow-lg
        bg-base-100 border border-base-300/40 shadow-sm ${isGenerating ? 'text-error hover:bg-error/10 border-error/20 animate-pulse' : 'text-base-content/80'}`}
        >
            {isGenerating ? (
                <Square size={12} fill="currentColor" />
            ) : (
                <Play size={14} fill="currentColor" />
            )}
        </button>
    );
};

/**
 * Stepper — -/value/+ counter.
 */
export const Stepper = ({ value, onChange, min = 1, max = 99, prefix = '', suffix = '', disabled = false }) => {
    const { darkMode } = useThemeStore();
    return (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold bg-base-100 border-base-300/40 shadow-sm
            ${disabled ? 'opacity-40 grayscale-[0.5] cursor-help' : ''}`}>
            <button
                onClick={() => !disabled && onChange(Math.max(min, value - 1))}
                className={`opacity-50 hover:opacity-100 transition-opacity ${disabled ? 'pointer-events-none' : ''}`}
                disabled={disabled}
            >−</button>
            <span className="tabular-nums px-1 min-w-[2.5ch] text-center">{prefix}{value}{suffix}</span>
            <button
                onClick={() => !disabled && onChange(Math.min(max, value + 1))}
                className={`opacity-50 hover:opacity-100 transition-opacity ${disabled ? 'pointer-events-none' : ''}`}
                disabled={disabled}
            >+</button>
        </div>
    );
};
