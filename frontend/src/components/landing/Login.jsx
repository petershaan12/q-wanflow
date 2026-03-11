import React, { useEffect, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import useAuthStore from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Workflow, Zap } from 'lucide-react';

const LoginPage = () => {
    const { login, user } = useAuthStore();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) navigate('/dashboard');
    }, [user, navigate]);

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true);
            const result = await login(tokenResponse.access_token);
            if (result.success) navigate('/dashboard');
            else {
                setError(result.error);
                setIsLoading(false);
            }
        },
        onError: () => {
            setError('Google Login Failed');
            setIsLoading(false);
        },
    });

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
            <div className="flex w-full h-[90vh] max-w-6xl rounded-3xl overflow-hidden shadow-2xl">
                <div className="hidden lg:flex lg:w-3/5 relative flex-col">
                    <img
                        src="https://images.unsplash.com/photo-1716637644831-e046c73be197?w=1200&auto=format&fit=crop&q=80"
                        className="absolute inset-0 w-full h-full object-cover"
                        alt="AI background"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/30 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    {/* Brand top-left */}
                    <div className="relative z-10 p-10">
                        <div className="flex items-center gap-2.5">
                            <img src="/qwen-flow.png" alt="logo" className="w-8 h-auto rounded-xl opacity-90" />
                            <span className="font-black tracking-[0.2em] text-white/90 text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                Q-WAN<span className="opacity-40 font-light">FLOW</span>
                            </span>
                        </div>
                    </div>

                    {/* Bottom copy */}
                    <div className="relative z-10 mt-auto p-10">
                        <div className="inline-flex items-center gap-2 badge badge-outline border-white/20 text-white/50 text-xs font-bold uppercase tracking-widest py-2.5 px-3 mb-5">
                            <Workflow size={10} /> Visual Node Editor
                        </div>
                        <h2 className="text-4xl font-black text-white leading-snug mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            Wire Qwen nodes.<br />
                            <span className="text-primary">Ship AI flows</span><br />
                            without code.
                        </h2>
                        <p className="text-white/50 text-sm leading-relaxed max-w-xs mb-8">
                            Connect Qwen Max, Wan Video, and any Alibaba AI model as nodes — visually, in minutes.
                        </p>
                    </div>
                </div>

                {/* ── Right: Login ── */}
                <div className="w-full lg:w-2/5 flex items-center justify-center bg-base-100 relative overflow-hidden">
                    {/* Background Accents for Premium Feel */}
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
                    <div className="relative w-full max-w-sm px-8 flex flex-col items-center gap-7">

                        {/* Heading */}
                        <div className="text-center">
                            <h2 className="text-2xl font-bold ">Welcome back</h2>
                            <p className="text-base-content/45 text-sm mt-1">Sign in to your node flow workspace</p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="alert alert-error text-sm w-full rounded-2xl py-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Custom Google Login Button */}
                        <div className="w-full">
                            <button
                                onClick={() => handleGoogleLogin()}
                                disabled={isLoading}
                                className="w-full h-14 rounded-full bg-base-100 border border-base-content/10 hover:border-base-content/20 hover:bg-base-200/50 transition-all duration-300 flex items-center justify-center gap-4 group shadow-sm active:scale-[0.98] disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <span className="loading loading-spinner loading-sm opacity-40"></span>
                                ) : (
                                    <>
                                        <div className="w-6 h-6 flex items-center justify-center">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                <path
                                                    fill="currentColor"
                                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                    style={{ fill: '#4285F4' }}
                                                />
                                                <path
                                                    fill="currentColor"
                                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                    style={{ fill: '#34A853' }}
                                                />
                                                <path
                                                    fill="currentColor"
                                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                    style={{ fill: '#FBBC05' }}
                                                />
                                                <path
                                                    fill="currentColor"
                                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                    style={{ fill: '#EA4335' }}
                                                />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-bold text-base-content/80 group-hover:text-base-content transition-colors">Sign in with Google</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Footer note */}
                        <p className="text-xs text-base-content/25 text-center leading-relaxed">
                            By signing in, you agree to our{' '}
                            <a href="#" className="text-primary font-bold hover:text-base-content/50 transition-colors">Terms</a>
                            {' '}and{' '}
                            <a href="#" className="text-primary font-bold hover:text-base-content/50 transition-colors">Privacy Policy</a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;