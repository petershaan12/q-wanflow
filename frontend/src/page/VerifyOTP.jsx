import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { ShieldCheck, RefreshCw, ArrowLeft, Mail } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';

const VerifyOTPPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { verifyOTP, resendOTP } = useAuthStore();

    const email = location.state?.email;

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const inputRefs = useRef([]);

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (element, index) => {
        const value = element.value;
        if (isNaN(value)) return false;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Focus next input
        if (value !== '' && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && index > 0 && otp[index] === '') {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').slice(0, 6);
        if (!/^\d+$/.test(data)) return;

        const newOtp = [...otp];
        data.split('').forEach((char, idx) => {
            if (idx < 6) newOtp[idx] = char;
        });
        setOtp(newOtp);

        // Focus the last filled input or the first empty one
        const nextIndex = data.length < 6 ? data.length : 5;
        inputRefs.current[nextIndex].focus();
    };

    const handleVerify = async (e) => {
        if (e) e.preventDefault();
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setError('');
        setIsLoading(true);

        const result = await verifyOTP(email, otpCode);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;
        setError('');
        setCanResend(false);
        setTimer(60);
        const result = await resendOTP(email);
        if (!result.success) {
            setError(result.error);
            setCanResend(true);
        }
    };

    useEffect(() => {
        if (otp.every(v => v !== '') && otp.length === 6) {
            handleVerify();
        }
    }, [otp]);

    return (
        <AuthLayout
            title="Verify your email"
            subtitle={
                <div className="mt-2 text-base-content/50 text-sm">
                    Enter the code sent to <br />
                    <span className="text-base-content font-semibold">{email || 'your email'}</span>
                </div>
            }
            badgeText="Secure Activation"
            badgeIcon={ShieldCheck}
        >
            <div className="w-full flex flex-col items-center">

                {/* Error Alert */}
                {error && (
                    <div className="alert alert-error text-xs w-full rounded-xl py-3 flex items-start gap-2 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4 mt-0.5" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* OTP Inputs Grid */}
                <div className="flex gap-2 justify-center w-full mb-8" onPaste={handlePaste}>
                    {otp.map((data, index) => (
                        <input
                            key={index}
                            type="text"
                            inputMode="numeric"
                            maxLength="1"
                            className="input input-bordered input-primary w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-bold bg-base-200/50 focus:bg-base-100 rounded-xl transition-all shadow-sm"
                            value={data}
                            ref={(el) => (inputRefs.current[index] = el)}
                            onChange={(e) => handleChange(e.target, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                        />
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="w-full space-y-6">
                    <button
                        onClick={handleVerify}
                        disabled={isLoading || otp.some(v => v === '')}
                        className="btn btn-primary w-full rounded-xl h-12 normal-case text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
                    >
                        {isLoading ? <span className="loading loading-spinner loading-sm"></span> : 'Activate Account'}
                    </button>

                    <div className="text-center">
                        <p className="text-xs text-base-content/25 mb-3">
                            Didn't receive the code?
                        </p>
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={!canResend}
                            className={`group inline-flex items-center gap-2 px-6 py-2 rounded-xl transition-all text-xs font-bold uppercase tracking-widest ${canResend ? 'text-primary hover:bg-primary/5 active:scale-95' : 'text-base-content/10 cursor-not-allowed'}`}
                        >
                            <RefreshCw size={14} className={`${!canResend && timer > 0 ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                            {canResend ? 'Resend Code' : `Resend in ${timer}s`}
                        </button>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
};

export default VerifyOTPPage;
