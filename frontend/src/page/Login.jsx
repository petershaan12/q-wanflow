import React, { useEffect, useState } from 'react';
import useAuthStore from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

const LoginPage = () => {
    const { login, user } = useAuthStore();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) navigate('/dashboard');
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(email, password);
        if (result.success) {
            navigate('/dashboard');
        } else {
            if (result.needsVerification) {
                navigate('/verify-otp', { state: { email } });
            } else {
                setError(result.error);
            }
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout 
            title="Welcome back" 
            subtitle="Sign in to your node flow workspace"
            badgeText="Visual Node Editor"
        >
            {/* Error */}
            {error && (
                <div className="alert alert-error text-xs w-full rounded-xl py-3 flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4 mt-0.5" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div className="form-control">
                    <label className="label py-1">
                        <span className="label-text text-xs font-medium text-base-content/40">Email Address</span>
                    </label>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        className="input input-bordered w-full rounded-xl bg-base-200/50 border-base-content/5 focus:border-primary/30 transition-all font-medium"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-control">
                    <label className="label py-1">
                        <span className="label-text text-xs font-medium text-base-content/40">Password</span>
                    </label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        className="input input-bordered w-full rounded-xl bg-base-200/50 border-base-content/5 focus:border-primary/30 transition-all font-medium"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary w-full rounded-xl h-12 normal-case text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
                >
                    {isLoading ? <span className="loading loading-spinner loading-sm"></span> : 'Sign In'}
                </button>
            </form>

            {/* Sign up link */}
            <p className="text-sm text-base-content/50">
                Don't have an account?{' '}
                <button 
                    onClick={() => navigate('/register')}
                    className="text-primary font-bold hover:underline"
                >
                    Register now
                </button>
            </p>
        </AuthLayout>
    );
};

export default LoginPage;