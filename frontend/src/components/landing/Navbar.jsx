import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sun, Moon } from 'lucide-react';
import useThemeStore from '../../stores/themeStore';

const Navbar = () => {
    const navigate = useNavigate();
    const { darkMode, toggleDarkMode } = useThemeStore();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const container = document.querySelector('.landing-container');
            if (container) {
                setScrolled(container.scrollTop > 50);
            } else {
                setScrolled(window.scrollY > 50);
            }
        };

        const container = document.querySelector('.landing-container');
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        } else {
            window.addEventListener('scroll', handleScroll);
            return () => window.removeEventListener('scroll', handleScroll);
        }
    }, []);

    const handleScrollTo = (sectionId) => {
        if (window.location.pathname !== '/') {
            navigate('/' + sectionId);
        } else {
            const el = document.querySelector(sectionId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-5 px-4 pointer-events-none transition-opacity duration-300">
            <div
                className={`navbar w-full max-w-6xl rounded-2xl px-5 pointer-events-auto transition-all duration-300 border backdrop-blur-xl ${scrolled
                    ? 'bg-base-100/90 border-base-300/50 shadow-lg'
                    : 'bg-transparent border-transparent shadow-none'
                    }`}
            >
                <div className="navbar-start">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <img src="/qwen-flow.png" alt="logo" className="w-8 h-auto rounded-xl" />
                        <span className="font-black tracking-[0.2em] text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            Q-WAN<span className="opacity-30 font-light">FLOW</span>
                        </span>
                    </div>
                </div>

                <div className="navbar-center hidden md:flex">
                    <ul className="menu menu-horizontal gap-1 text-sm">
                        <li><button onClick={() => handleScrollTo('#features')} className="hover:text-primary transition-colors px-4 py-2">Features</button></li>
                        <li><button onClick={() => handleScrollTo('#pricing')} className="hover:text-primary transition-colors px-4 py-2">Pricing</button></li>
                        <li><button onClick={() => navigate('/support')} className="hover:text-primary transition-colors px-4 py-2">Support</button></li>
                    </ul>
                </div>

                <div className="navbar-end gap-2">
                    <button onClick={toggleDarkMode} className="btn btn-ghost btn-circle btn-sm">
                        {darkMode ? <Sun size={17} /> : <Moon size={17} />}
                    </button>
                    <button onClick={() => navigate('/login')} className="btn btn-primary btn-sm rounded-full gap-1.5 shadow-lg shadow-primary/30">
                        Get Started <ArrowRight size={13} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
