import React, { Component } from 'react';

interface EBProps { children: React.ReactNode; fallback?: React.ReactNode; }
interface EBState { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<EBProps, EBState> {
  state: EBState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Nevaeh]', error, info.componentStack);
  }

  handleReset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)', padding: 24 }}>
          <div style={{ maxWidth: 480, width: '100%', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(127,29,29,0.1)', borderRadius: 12, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠</div>
            <h2 style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 16, marginBottom: 8 }}>
              Terjadi Kesalahan
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
              Komponen error. Data Anda aman di localStorage.
            </p>
            {this.state.error && (
              <pre style={{ textAlign: 'left', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgb(252,165,165)', background: 'var(--color-card-bg)', border: '1px solid var(--color-border-line)', borderRadius: 6, padding: 12, overflowX: 'auto', maxHeight: 120, marginBottom: 16 }}>
                {this.state.error.message}
              </pre>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={this.handleReset} style={{ padding: '8px 20px', background: 'var(--color-accent-highlight)', color: 'var(--color-background)', border: 'none', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase' }}>
                Coba Lagi
              </button>
              <button onClick={() => window.location.reload()} style={{ padding: '8px 20px', background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-line)', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-mono)', cursor: 'pointer', textTransform: 'uppercase' }}>
                Muat Ulang
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
