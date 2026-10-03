import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';

// Catch unhandled promise rejections (async errors not caught by try/catch)
window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);
});

// Catch synchronous errors outside React tree
window.addEventListener('error', event => {
    const message = event.message || '';
    // Ignore known third-party dev noise
    if (message.includes('startTime') || message.includes('reportAllChanges')) {
        event.preventDefault();
        return;
    }
    console.error('Global error:', event.error);
});

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </StrictMode>
);
