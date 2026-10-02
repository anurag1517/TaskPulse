import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';

function AppContent() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                background: 'var(--bg-deep)',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-heading)',
            }}>
                <span style={{ fontSize: '2.5rem', animation: 'flicker 1.2s infinite alternate' }}>🔥</span>
                <span className="spinner" style={{ width: '28px', height: '28px', borderWidth: '3px' }} />
                <p style={{ fontWeight: 600, letterSpacing: '0.05em', fontSize: '0.9rem' }}>INITIALIZING TASKPULSE...</p>
            </div>
        );
    }

    return user ? <DashboardPage /> : <AuthPage />;
}

export function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
