import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };

type State = { hasError: boolean; error: Error | null };

/**
 * Catches render errors anywhere in the tree below and shows a friendly message
 * instead of a blank white page.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div
                    className="min-h-screen flex items-center justify-center p-6"
                    style={{ backgroundColor: '#fafaf9' }}
                >
                    <div
                        className="bg-white rounded-2xl p-8 border border-stone-200/60 max-w-md w-full text-center"
                        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                    >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-50">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-stone-900 mb-2 tracking-tight">
                            Something went wrong
                        </h2>
                        <p className="text-sm text-stone-500 mb-6">
                            An unexpected error occurred. Please try refreshing the page.
                        </p>
                        {this.state.error && (
                            <p className="text-xs text-stone-400 font-mono mb-6 break-words">
                                {this.state.error.message}
                            </p>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={this.handleGoHome}
                                className="flex-1 px-4 py-3 rounded-xl font-medium transition-colors"
                                style={{ backgroundColor: '#f5f4f1', color: '#78716c' }}
                            >
                                Go Home
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="flex-1 px-4 py-3 rounded-xl font-medium text-white transition-all duration-200 active:scale-95"
                                style={{
                                    background: 'linear-gradient(135deg, #5b8c7a, #6d9e8a)',
                                    boxShadow: '0 2px 8px rgba(91,140,122,0.2)',
                                }}
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
