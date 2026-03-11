import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Sparkles, ArrowRight, LayoutGrid, Database, Wand2,
    Code2, Globe, MessageSquare, Sun, Moon,
    Linkedin, Youtube, Github, Cpu, CheckCircle2, Workflow
} from 'lucide-react';
import useThemeStore from '../stores/themeStore';
import Typewriter from 'typewriter-effect';

/* ─── Data ──────────────────────────────────────────────── */
const FEATURES = [
    {
        title: 'Visual Node Editor',
        desc: 'Drag, drop, and wire Qwen model nodes together. Build complex AI pipelines visually — no code, just connect.',
        icon: LayoutGrid,
    },
    {
        title: 'Ready-to-use Qwen Nodes',
        desc: 'Qwen Max, Qwen VL, Wan Image, and more — plug any Alibaba AI model as a node into your flow in seconds.',
        icon: Wand2,
    },
    {
        title: 'Flow Asset Manager',
        desc: 'Every node output is saved automatically. Browse, reuse, and export results from your flows in one place.',
        icon: Database,
    },
];

const TEMPLATES = [
    {
        title: 'Content Node Flow',
        desc: 'Wire a Qwen Max node to a formatter node — auto-generate blog posts and social copy end-to-end.',
        icon: MessageSquare,
        tags: ['Qwen Max', 'Node Flow'],
    },
    {
        title: 'Doc Analysis Flow',
        desc: 'Connect a PDF reader node to a Qwen VL node for instant document understanding and extraction.',
        icon: Database,
        tags: ['Qwen VL', 'OCR Node'],
    },
    {
        title: 'Video Gen Flow',
        desc: 'Chain prompt nodes to a Wan Video node and generate AI videos from text in one click.',
        icon: Globe,
        tags: ['Wan Video', 'Node Flow'],
    },
];

/* ─── Gradient Background ──────────────────────────────── */
const GradientBg = ({ darkMode }) => {
    return (
        <div
            className="fixed inset-0 -z-50 pointer-events-none transition-colors duration-700"
            style={{
                background: darkMode
                    ? 'radial-gradient(circle at 20% 20%, #1a0f3a 0%, #0f0a26 40%, #020108 100%)'
                    : 'radial-gradient(circle at 20% 20%, #f8fafc 0%, #f1f5f9 40%, #e2e8f0 100%)'
            }}
        />
    );
};

/* ─── Component ─────────────────────────────────────────── */
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

const LandingPage = () => {
    const navigate = useNavigate();
    const { darkMode, toggleDarkMode } = useThemeStore();
    const [scrolled, setScrolled] = useState(false);

    const handleScroll = (e) => setScrolled(e.currentTarget.scrollTop > 50);

    // Badge styling responsive to dark/light mode
    const badgeClass = darkMode
        ? 'badge badge-outline gap-1.5 mb-6 py-3 px-4 text-xs tracking-wider backdrop-blur bg-white/10 border-white/20 text-white/60 items-center animate-fade-in'
        : 'badge badge-outline gap-1.5 mb-6 py-3 px-4 text-xs tracking-wider backdrop-blur bg-black/5 border-black/15 text-black/60 items-center animate-fade-in';

    return (
        <>
            {/* ── Gradient Background ── */}
            <GradientBg darkMode={darkMode} />

            <div
                onScroll={handleScroll}
                className="h-screen overflow-y-auto overflow-x-hidden font-sans selection:bg-primary/20 landing-container text-base-content relative"
                style={{ zIndex: 1 }}
            >
                <Navbar />

                {/* ── Hero ── */}
                <main className="pt-36 flex flex-col items-center text-center px-4">
                    <div className={badgeClass}>
                        <span className="text-primary">✦</span> New: Visual Node Editor for Qwen AI
                    </div>

                    <h1
                        className="text-4xl md:text-6xl font-black leading-tight max-w-4xl mb-6 flex flex-wrap justify-center gap-x-3"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                        Build Qwen Node Flows
                        <span className="text-primary min-w-[200px] inline-block opacity-80">
                            <Typewriter options={{
                                strings: ['Visually', 'Without Code', 'In Minutes'],
                                autoStart: true, loop: true, delay: 80, deleteSpeed: 40,
                            }} />
                        </span>
                    </h1>

                    <p className="text-base-content/60 text-lg max-w-xl mb-10 leading-relaxed">
                        Connect Qwen Max, Wan Video, and any Alibaba AI model as nodes. Wire them together, run the flow — no code needed.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 mb-20">
                        <button onClick={() => navigate('/workflow')} className="btn btn-primary rounded-full gap-2 shadow-lg shadow-primary/30">
                            <Workflow size={16} /> Open Node Editor
                        </button>
                        <button onClick={() => navigate('/workflow')} className="btn btn-outline rounded-full gap-2">
                            <Code2 size={16} /> Browse Templates
                        </button>
                    </div>

                    {/* Demo Video — with glow behind it like Reflect */}
                    <div className="relative w-full max-w-5xl">
                        {/* Purple glow behind the iframe */}
                        <div
                            className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                            style={{
                                top: '30%',
                                width: '80%',
                                height: '180px',
                                background: 'radial-gradient(ellipse at 50% 50%, rgba(124,92,252,0.65) 0%, rgba(80,50,200,0.30) 45%, transparent 72%)',
                                filter: 'blur(32px)',
                                zIndex: 0,
                                animation: 'qwenGlowPulse 4s ease-in-out infinite',
                            }}
                        />
                        <style>{`
                            @keyframes qwenGlowPulse {
                                0%,100% { opacity: 0.85; transform: translateX(-50%) scaleX(1); }
                                50%      { opacity: 1;    transform: translateX(-50%) scaleX(1.05); }
                            }
                        `}</style>

                        {/* The iframe card */}
                        <div
                            className="relative rounded-2xl overflow-hidden"
                            style={{
                                zIndex: 1,
                                border: '1px solid rgba(255,255,255,0.08)',
                                background: 'rgba(10,7,24,0.82)',
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 32px 70px rgba(0,0,0,0.75), 0 0 100px rgba(110,60,255,0.18)',
                            }}
                        >
                            {/* Browser bar */}
                            <div
                                className="flex items-center gap-2 px-4"
                                style={{
                                    height: '40px',
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                    background: 'rgba(255,255,255,0.02)',
                                }}
                            >
                                <div className="flex gap-1.5">
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
                                </div>
                                <div
                                    className="flex-1 flex items-center justify-center mx-3"
                                    style={{
                                        height: '22px', borderRadius: '5px',
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.07)',
                                    }}
                                >
                                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.22)', fontFamily: 'monospace' }}>
                                        app.q-wanflow.network
                                    </span>
                                </div>
                            </div>

                            {/* YouTube iframe */}
                            <div className="aspect-video bg-black">
                                <iframe
                                    className="w-full h-full"
                                    src="https://www.youtube.com/embed/ktDogWm7Hac?autoplay=1&mute=1&loop=1&playlist=ktDogWm7Hac&controls=0&modestbranding=1&rel=0"
                                    title="QwenFlow Demo"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    </div>

                    {/* Partner Logos */}
                    <div className="mt-24 w-full max-w-4xl">
                        <p className="text-base-content/30 text-xs font-bold uppercase tracking-[0.25em] mb-10">
                            Powered by <span className="text-primary">Alibaba Cloud</span> Infrastructure
                        </p>
                        <div className="flex flex-wrap justify-center items-center gap-16">
                            <img src="/AlibabaCloud.png" alt="Alibaba Cloud" className="h-9 object-contain grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
                            <img src="/CBNCloud.png" alt="CBN Cloud" className="h-12 object-contain grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
                        </div>
                    </div>

                    {/* ── Features ── */}
                    <section className="w-full max-w-6xl text-left mt-28 px-4" id="features">
                        <div className={badgeClass}>Features</div>
                        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                            <h2 className="text-3xl font-bold max-w-lg leading-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                Powerful <span className="text-primary">Qwen node flows</span>, built visually
                            </h2>
                            <button onClick={() => navigate('/workflow')} className="btn btn-primary btn-sm rounded-full gap-2 shadow-lg shadow-primary/20 shrink-0">
                                <Sparkles size={13} /> New Flow
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {FEATURES.map(({ title, desc, icon: Icon }, i) => (
                                <div key={i} className="card bg-base-100/60 backdrop-blur border border-base-300/40 hover:border-primary/40 transition-all group">
                                    <div className="card-body gap-4">
                                        <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                            <Icon size={22} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base mb-2">{title}</h3>
                                            <p className="text-base-content/55 text-sm leading-relaxed">{desc}</p>
                                        </div>
                                        <button onClick={() => navigate('/workflow')} className="btn btn-ghost btn-xs text-primary gap-1 self-start px-0 mt-auto">
                                            <ArrowRight size={12} /> Try this node
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── Templates ── */}
                    <section className="w-full max-w-6xl text-center mt-28 px-4">
                        <div className={badgeClass}>Templates</div>
                        <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            Start from a <span className="text-primary">node flow template</span>
                        </h2>
                        <p className="text-base-content/55 text-base max-w-xl mx-auto mb-12">
                            Pre-wired Qwen flows ready to run — just add your API key and go.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {TEMPLATES.map(({ title, desc, icon: Icon, tags }, i) => (
                                <div key={i} className="card bg-base-100/60 backdrop-blur border border-base-300/40 hover:border-primary/40 transition-all text-left cursor-pointer" onClick={() => navigate('/workflow')}>
                                    <div className="card-body gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                            <Icon size={18} />
                                        </div>
                                        <h3 className="font-bold text-base">{title}</h3>
                                        <p className="text-base-content/55 text-sm leading-relaxed">{desc}</p>
                                        <div className="flex gap-2 flex-wrap pt-1">
                                            {tags.map((t) => (
                                                <span key={t} className="badge badge-sm badge-outline badge-primary">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── Pricing ── */}
                    <section className="w-full max-w-3xl text-center mt-28 px-4 mx-auto" id="pricing">
                        <div className={badgeClass}>Pricing</div>
                        <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            Simple, transparent <span className="text-primary">pricing</span>
                        </h2>
                        <p className="text-base-content/50 text-sm max-w-sm mx-auto mb-12">
                            One-time payment. Unlimited flows, unlimited nodes — forever.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                            {/* Free */}
                            <div className="card bg-base-100/60 backdrop-blur border border-base-300/40">
                                <div className="card-body gap-5">
                                    <div>
                                        <h3 className="text-xl font-bold">Free</h3>
                                        <p className="text-3xl font-black mt-1">Rp 0 <span className="text-sm font-normal text-base-content/40">/ forever</span></p>
                                    </div>
                                    <ul className="space-y-3">
                                        {['Qwen Node Editor', '3 Active Flows', 'Basic Node Library'].map(f => (
                                            <li key={f} className="flex items-center gap-3 text-sm">
                                                <CheckCircle2 size={15} className="text-base-content/30 shrink-0" /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <button onClick={() => navigate('/workflow')} className="btn btn-outline btn-block rounded-xl">
                                        Start Building
                                    </button>
                                </div>
                            </div>

                            {/* Pro */}
                            <div className="card border border-primary/30 bg-gradient-to-br from-primary/10 to-base-100/60 backdrop-blur shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-primary text-primary-content text-xs font-black px-3 py-1 tracking-widest uppercase rounded-bl-xl">
                                    LIFETIME
                                </div>
                                <div className="card-body gap-5">
                                    <div>
                                        <h3 className="text-xl font-bold">Pro</h3>
                                        <p className="text-3xl font-black mt-1">Rp 50.000 <span className="text-sm font-normal text-base-content/40">/ once</span></p>
                                    </div>
                                    <ul className="space-y-3">
                                        {['Unlimited Flows & Nodes', 'All Qwen Model Nodes', 'Priority GPU Access', 'Dedicated Support'].map(f => (
                                            <li key={f} className="flex items-center gap-3 text-sm">
                                                <CheckCircle2 size={15} className="text-primary shrink-0" /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <button
                                        onClick={() => window.open('https://api.whatsapp.com/send?phone=6289529882952', '_blank')}
                                        className="btn btn-primary btn-block rounded-xl shadow-lg shadow-primary/30"
                                    >
                                        Get Lifetime Access
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <Footer />
            </div>
        </>
    );
};

export default LandingPage;