import React, { useState } from 'react';
import { Send, CheckCircle, HelpCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import useThemeStore from '../stores/themeStore';
import Navbar from '../components/landing/Navbar';

const SupportPage = () => {
    const navigate = useNavigate();
    const { darkMode } = useThemeStore();
    const { user, contactSupport } = useAuthStore();
    
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.message) {
            setError('Please fill in all fields');
            return;
        }

        setIsSubmitting(true);
        setError('');

        const result = await contactSupport(formData.name, formData.email, formData.message);
        
        if (result.success) {
            setSubmitSuccess(true);
            setFormData(prev => ({ ...prev, message: '' }));
        } else {
            setError(result.error);
        }
        setIsSubmitting(false);
    };

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-[#060414] text-white' : 'bg-gray-50 text-gray-900'}`}>
            <Navbar />
            
            <div className="pt-32 pb-16 container mx-auto px-4 max-w-xl">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-xs font-bold text-base-content/40 hover:text-primary mb-8 transition-colors"
                >
                    <ArrowLeft size={16} /> Back
                </button>

                <div className="card bg-base-100 shadow-xl border border-base-300/50">
                    <div className="card-body p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <HelpCircle size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Support</h1>
                                <p className="text-sm opacity-50">How can we help you today?</p>
                            </div>
                        </div>

                        {submitSuccess ? (
                            <div className="py-10 text-center space-y-4 animate-in fade-in zoom-in duration-300">
                                <CheckCircle size={64} className="text-success mx-auto" />
                                <h2 className="text-xl font-bold">Terima kasih sudah menghubungi!</h2>
                                <p className="opacity-60 text-sm">Pesan Anda telah kami terima. Tim kami akan segera meninjau dan memberikan balasan melalui email.</p>
                                <button 
                                    onClick={() => setSubmitSuccess(false)}
                                    className="btn btn-outline btn-sm rounded-lg"
                                >
                                    Kirim pesan lain
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="alert alert-error text-xs py-2 rounded-lg">
                                        <span>{error}</span>
                                    </div>
                                )}
                                
                                <div className="form-control">
                                    <label className="label py-1">
                                        <span className="label-text font-semibold text-xs opacity-50 uppercase tracking-wider">Your Name</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="input input-bordered w-full rounded-lg bg-base-200/50 focus:bg-base-100"
                                        placeholder="Full Name"
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label py-1">
                                        <span className="label-text font-semibold text-xs opacity-50 uppercase tracking-wider">Email Address</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="input input-bordered w-full rounded-lg bg-base-200/50 focus:bg-base-100"
                                        placeholder="email@example.com"
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label py-1">
                                        <span className="label-text font-semibold text-xs opacity-50 uppercase tracking-wider">Message</span>
                                    </label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        rows="5"
                                        className="textarea textarea-bordered w-full rounded-lg bg-base-200/50 focus:bg-base-100 leading-relaxed"
                                        placeholder="What's on your mind?"
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn btn-primary w-full rounded-lg h-12 shadow-lg shadow-primary/20 font-bold"
                                >
                                    {isSubmitting ? <span className="loading loading-spinner"></span> : (
                                        <>
                                            <Send size={18} />
                                            Send Message
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-xs opacity-30 uppercase font-black tracking-[0.2em] mb-4">Supported By</p>
                    <div className="flex justify-center items-center gap-8 opacity-20 grayscale scale-90">
                        <img src="/AlibabaCloud.png" alt="Alibaba" className="h-4" />
                        <img src="/CBNCloud.png" alt="CBN" className="h-6" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportPage;
