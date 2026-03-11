import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import './index.css'
import useAuthStore from './stores/authStore'

// Configure axios
axios.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const GOOGLE_CLIENT_ID = "134435104764-o2ao5shhctl8llb7u897iddfs4lfd42r.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <App />
        </GoogleOAuthProvider>
    </React.StrictMode>,
)
