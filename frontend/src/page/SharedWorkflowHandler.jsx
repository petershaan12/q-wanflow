import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workflowService } from '../services/workflowService';

const SharedWorkflowHandler = () => {
    const { shareId } = useParams();
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAndRedirect = async () => {
            try {
                const workflow = await workflowService.getWorkflowByShareId(shareId);
                navigate(`/workflow/${workflow.id}`, { replace: true });
            } catch (err) {
                console.error("Failed to load shared workflow:", err);
                setError(err.response?.data?.detail || "Failed to load shared workflow. It might be private or deleted.");
            }
        };

        if (shareId) {
            fetchAndRedirect();
        }
    }, [shareId, navigate]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-base-100 p-4">
                <div className="bg-base-200 border border-base-300 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
                    <div className="w-16 h-16 bg-error/10 text-error rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-3 text-base-content">Access Denied</h2>
                    <p className="text-base-content/60 mb-8">{error}</p>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="btn btn-primary w-full shadow-lg"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-base-100">
            <span className="loading loading-bars text-primary w-12 mb-6"></span>
            <p className="text-base-content/60 font-medium">Opening shared workspace...</p>
        </div>
    );
};

export default SharedWorkflowHandler;
