import React, { useState } from 'react';
import useAuthStore from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';

const RegisterPage = () => {
    const { register } = useAuthStore();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await register(email, password, name);
        if (result.success) {
            navigate('/verify-otp', { state: { email } });
        } else {
            setError(result.error);
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Create Account"
            subtitle="Join the visual AI revolution"
            badgeText="Fast Registration"
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

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div className="form-control">
                    <label className="label py-1">
                        <span className="label-text text-xs font-medium text-base-content/40">Full Name</span>
                    </label>
                    <div className="relative group">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/20 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="John Doe"
                            className="input input-bordered w-full pl-11 rounded-xl bg-base-200/50 border-base-content/5 focus:border-primary/30 transition-all font-medium"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <div className="form-control">
                    <label className="label py-1">
                        <span className="label-text text-xs font-medium text-base-content/40">Email Address</span>
                    </label>
                    <div className="relative group">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/20 group-focus-within:text-primary transition-colors" />
                        <input
                            type="email"
                            placeholder="john@example.com"
                            className="input input-bordered w-full pl-11 rounded-xl bg-base-200/50 border-base-content/5 focus:border-primary/30 transition-all font-medium"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <div className="form-control">
                    <label className="label py-1">
                        <span className="label-text text-xs font-medium text-base-content/40">Password</span>
                    </label>
                    <div className="relative group">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/20 group-focus-within:text-primary transition-colors" />
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="input input-bordered w-full pl-11 rounded-xl bg-base-200/50 border-base-content/5 focus:border-primary/30 transition-all font-medium"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary w-full rounded-xl h-12 normal-case text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 mt-2"
                >
                    {isLoading ? <span className="loading loading-spinner loading-sm"></span> : 'Create Account'}
                </button>
            </form>

            {/* Login link */}
            <p className="text-sm text-base-content/50 mt-4">
                Already have an account?{' '}
                <button
                    onClick={() => navigate('/login')}
                    className="text-primary font-bold hover:underline"
                >
                    Sign in
                </button>
            </p>
        </AuthLayout>
    );
};

export default RegisterPage;
