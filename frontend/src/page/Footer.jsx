import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Linkedin, Youtube, Github } from 'lucide-react';

const Footer = () => {
    const navigate = useNavigate();

    return (
        <footer className="mt-32 border-t border-base-300 bg-base-200">
            <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
                {/* Brand */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <img src="/qwen-flow.png" alt="logo" className="w-8 h-auto rounded-xl" />
                        <span className="font-black tracking-[0.2em] text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            Q-WAN<span className="opacity-30 font-light">FLOW</span>
                        </span>
                    </div>
                    <p className="text-sm text-base-content/50 leading-relaxed">
                        A visual node editor for building AI workflows with Qwen and Alibaba Cloud models — no code required.
                    </p>
                    <div className="flex gap-4 mt-1">
                        <a href="https://linkedin.com/in/petershaan12" className="text-base-content/40 hover:text-primary transition-colors"><Linkedin size={17} /></a>
                        <a href="https://youtube.com/@petershaan_" className="text-base-content/40 hover:text-error transition-colors"><Youtube size={17} /></a>
                        <a href="https://github.com/petershaan" className="text-base-content/40 hover:text-base-content transition-colors"><Github size={17} /></a>
                    </div>
                </div>

                {/* Product Links */}
                <div className="flex flex-col gap-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-base-content/30 mb-2">Product</p>
                    {[
                        { label: 'Features', href: '/#features' },
                        { label: 'Templates', href: '/#features' },
                        { label: 'Pricing', href: '/#pricing' },
                        { label: 'Workflow Editor', href: '/workflow' },
                    ].map(({ label, href }) => (
                        <a key={label} href={href} className="text-sm text-base-content/50 hover:text-primary transition-colors w-fit">{label}</a>
                    ))}
                </div>

                {/* Developer */}
                <div className="flex flex-col gap-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-base-content/30 mb-2">Developer</p>
                    <a href="https://petershaan.net" target="_blank" rel="noopener noreferrer" className="text-sm text-base-content/50 hover:text-primary transition-colors w-fit">
                        Peter Shaan
                    </a>
                    <button onClick={() => navigate('/support')} className="text-sm text-base-content/50 hover:text-primary transition-colors w-fit text-left">Contact & Support</button>
                    <p className="text-xs text-base-content/25 mt-2">&copy; 2026 Q-WanFlow. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
