'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="card" style={{ margin: '2rem auto', maxWidth: 600, borderLeft: '4px solid var(--ruby)' }}>
          <h2 style={{ color: 'var(--ruby)', marginBottom: '1rem' }}>Pipeline Error</h2>
          <p>An unexpected error occurred during the data transformation.</p>
          <pre style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '4px', overflowX: 'auto', fontSize: '0.85rem', margin: '1rem 0' }}>
            {this.state.error?.message}
          </pre>
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            Reload Pipeline
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
