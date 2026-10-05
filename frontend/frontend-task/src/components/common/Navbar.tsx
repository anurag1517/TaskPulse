import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from './Button';
import './Navbar.css';

interface NavbarProps {
    p1Count: number;
    onOpenLogs: () => void;
    onOpenBacklog?: () => void;
    onOpenCreateTask: () => void;
    onOpenSidebar?: () => void;
    onEnablePush?: () => void;
    pushEnabled?: boolean;
    onSelectP1?: () => void;
}

export function Navbar({
    p1Count,
    onOpenLogs,
    onOpenBacklog,
    onOpenCreateTask,
    onOpenSidebar,
    onEnablePush,
    pushEnabled = false,
    onSelectP1,
}: NavbarProps) {
    const { user, logout } = useAuth();
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await logout();
        } finally {
            setLoggingOut(false);
        }
    };

    return (
        <header className="navbar-container">
            <div className="navbar-inner">
                {/* Left: Mobile Menu Trigger + Brand */}
                <div className="navbar-left-group">
                    {onOpenSidebar && (
                        <button
                            type="button"
                            className="mobile-menu-trigger"
                            onClick={onOpenSidebar}
                            aria-label="Open navigation menu"
                        >
                            <span className="hamburger-line" />
                            <span className="hamburger-line" />
                            <span className="hamburger-line" />
                        </button>
                    )}

                    <div className="navbar-brand">
                        <div className="brand-logo-icon">🔥</div>
                        <div className="brand-text">
                            <span className="brand-title">Declutter</span>
                        </div>
                    </div>
                </div>

                {/* Threat Meter / Chaos Indicator (Desktop/Tablet) */}
                <div className={`chaos-meter-badge ${p1Count > 0 ? 'threat-high' : 'threat-calm'}`}>
                    <span className="threat-icon">{p1Count > 0 ? '👹' : '😎'}</span>
                    <div className="threat-info">
                        <span className="threat-label">
                            {p1Count > 0 ? `${p1Count} URGENT P1` : 'ALL CLEAR'}
                        </span>
                        <span className="threat-desc">
                            {p1Count > 0 ? 'Immediate action required' : 'System running smooth'}
                        </span>
                    </div>
                </div>

                {/* Mobile Right Cluster (iPhone 15 & Android header) */}
                <div className="navbar-mobile-cluster">
                    <button
                        type="button"
                        className={`mobile-urgency-chip ${p1Count > 0 ? 'chip-urgent' : 'chip-calm'}`}
                        onClick={onSelectP1 || onOpenSidebar}
                        title={p1Count > 0 ? 'View P1 Urgent Tasks' : 'All Tasks Calm'}
                        aria-label="Filter priority 1 tasks"
                    >
                        <span className="mobile-urgency-emoji">{p1Count > 0 ? '👹' : '😎'}</span>
                        <span className="mobile-urgency-num">{p1Count}</span>
                    </button>

                    {onEnablePush && (
                        <button
                            type="button"
                            className={`mobile-push-badge-btn ${pushEnabled ? 'push-on' : ''}`}
                            onClick={onEnablePush}
                            aria-label={pushEnabled ? 'Push notifications active' : 'Enable push notifications'}
                        >
                            {pushEnabled ? '🔔' : '🔕'}
                        </button>
                    )}

                    {onOpenSidebar && (
                        <button
                            type="button"
                            className="mobile-user-avatar"
                            onClick={onOpenSidebar}
                            aria-label="Open user menu"
                        >
                            {user?.name ? user.name[0].toUpperCase() : user?.email[0].toUpperCase()}
                        </button>
                    )}
                </div>

                {/* Desktop Actions */}
                <div className="navbar-actions">
                    {onEnablePush && (
                        <button
                            className={`push-toggle-btn ${pushEnabled ? 'push-active' : ''}`}
                            onClick={onEnablePush}
                            title={pushEnabled ? 'Mobile push reminders active' : 'Enable mobile push reminders'}
                        >
                            <span>{pushEnabled ? '🔔 Hourly Alerts ON' : '🔕 Enable Reminders'}</span>
                        </button>
                    )}

                    {onOpenBacklog && (
                        <Button variant="secondary" size="sm" onClick={onOpenBacklog} icon="📋">
                            Backlog
                        </Button>
                    )}

                    <Button variant="secondary" size="sm" onClick={onOpenLogs} icon="📜">
                        Daily Logs
                    </Button>

                    <Button variant="p1" size="sm" onClick={onOpenCreateTask} icon="➕">
                        Add Task
                    </Button>

                    {/* User profile & Logout */}
                    <div className="user-profile-menu">
                        <div className="user-avatar" title={user?.email}>
                            {user?.name ? user.name[0].toUpperCase() : user?.email[0].toUpperCase()}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            loading={loggingOut}
                            title="Sign out"
                        >
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
