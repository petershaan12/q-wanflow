import React from 'react';
import { Workflow } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle, image, badgeIcon: BadgeIcon, badgeText }) => {
    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
            <div className="flex w-full h-[90vh] max-w-6xl rounded-2xl overflow-hidden shadow-2xl">
                {/* ── Left Side: Brand & Illustration ── */}
                <div className="hidden lg:flex lg:w-3/5 relative flex-col">
                    <img
                        src={image || "https://images.unsplash.com/photo-1716637644831-e046c73be197?w=1200&auto=format&fit=crop&q=80"}
                        className="absolute inset-0 w-full h-full object-cover"
                        alt="Background"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/30 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    {/* Brand top-left */}
                    <div className="relative z-10 p-10">
                        <div className="flex items-center gap-2.5">
                            <img src="/qwen-flow.png" alt="logo" className="w-8 h-auto rounded-lg opacity-90" />
                            <span className="font-black tracking-[0.2em] text-white/90 text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                Q-WAN<span className="opacity-40 font-light">FLOW</span>
                            </span>
                        </div>
                    </div>

                    {/* Bottom copy */}
                    <div className="relative z-10 mt-auto p-10">
                        {badgeText && (
                            <div className="inline-flex items-center gap-2 badge badge-outline border-white/20 text-white/50 text-xs font-bold uppercase tracking-widest py-2.5 px-3 mb-5">
                                {BadgeIcon ? <BadgeIcon size={10} /> : <Workflow size={10} />} {badgeText}
                            </div>
                        )}
                        <h2 className="text-4xl font-black text-white leading-snug mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            Wire Qwen nodes.<br />
                            <span className="text-primary">Ship AI flows</span><br />
                            without code.
                        </h2>
                        <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                            Connect Qwen Max, Wan Video, and any Alibaba AI model as nodes — visually, in minutes.
                        </p>
                    </div>
                </div>

                {/* ── Right Side: Auth Content ── */}
                <div className="w-full lg:w-2/5 flex items-center justify-center bg-base-100 relative overflow-hidden">
                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

                    {/* Supported by logos - Top Right */}
                    <div className="absolute top-8 right-8 flex items-center gap-3 z-10">
                        <p className="text-base-content/20 text-xs font-medium">Supported by</p>
                        <div className="flex items-center gap-5 grayscale opacity-30 transition-all duration-500">
                            <img src="/AlibabaCloud.png" alt="Alibaba Cloud" className="h-4 object-contain" />
                            <img src="/CBNCloud.png" alt="CBN Cloud" className="h-6 object-contain" />
                        </div>
                    </div>

                    <div className="relative w-full max-w-sm px-8 flex flex-col items-center gap-6">
                        {/* Heading */}
                        <div className="text-center">
                            <h2 className="text-2xl font-bold">{title}</h2>
                            <p className="text-base-content/45 text-sm mt-1">{subtitle}</p>
                        </div>

                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
