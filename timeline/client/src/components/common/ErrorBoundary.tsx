
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    name?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Uncaught error in ${this.props.name || 'Component'}:`, error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={{
                    padding: '20px',
                    margin: '20px',
                    border: '1px solid #fee2e2',
                    borderRadius: '8px',
                    background: '#fef2f2',
                    color: '#991b1b',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 600 }}>
                        <AlertCircle size={24} />
                        Visualization Error
                    </div>
                    <p style={{ margin: 0, textAlign: 'center', color: '#b91c1c' }}>
                        Something went wrong in the <strong>{this.props.name || 'visualization'}</strong>.
                    </p>
                    <div style={{
                        fontSize: '0.9rem',
                        fontFamily: 'monospace',
                        background: 'rgba(255,255,255,0.5)',
                        padding: '8px',
                        borderRadius: '4px',
                        maxWidth: '100%',
                        overflowX: 'auto'
                    }}>
                        {this.state.error?.message}
                    </div>
                    <button
                        onClick={this.handleRetry}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            marginTop: '8px'
                        }}
                    >
                        <RefreshCw size={16} /> Retry
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
