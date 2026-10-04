import { useAuth } from '../../context/AuthContext';
import { Mascot } from './Mascot';
import { Button } from './Button';
import type { PriorityLevel } from '../../types';
import './DashboardSidebar.css';

interface DashboardSidebarProps {
    p1Count: number;
    counts: {
        all: number;
        p1: number;
        p2: number;
        p3: number;
        p4: number;
        done: number;
    };
    activeFilter: 'all' | PriorityLevel | 'done';
    onSelectFilter: (filter: 'all' | PriorityLevel | 'done') => void;
    onOpenCreateTask: () => void;
    onOpenLogs: () => void;
    onOpenBacklog?: () => void;
    onEnablePush?: () => void;
    pushEnabled?: boolean;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

export function DashboardSidebar({
    p1Count,
    counts,
    activeFilter,
    onSelectFilter,
    onOpenCreateTask,
    onOpenLogs,
    onOpenBacklog,
    onEnablePush,
    pushEnabled = false,
    isCollapsed,
    onToggleCollapse,
}: DashboardSidebarProps) {
    const { user, logout } = useAuth();

    return (
        <aside className={`dashboard-desktop-sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Header Brand & Collapse Toggle */}
            <div className="desk-sidebar-header">
                {!isCollapsed && (
                    <div className="desk-brand-group">
                        <span className="desk-brand-flame">🔥</span>
                        <div className="desk-brand-names">
                            <span className="desk-brand-title">TaskPulse</span>
                            <span className="desk-brand-subtitle">High Urgency Engine</span>
                        </div>
                    </div>
                )}
                {isCollapsed && <span className="desk-brand-flame-mini">🔥</span>}

                <button
                    type="button"
                    className="desk-collapse-btn"
                    onClick={onToggleCollapse}
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? '❯' : '❮'}
                </button>
            </div>

            {/* Reactive Mascot Widget */}
            {!isCollapsed && (
                <div className="desk-sidebar-mascot-card">
                    <div className="mascot-frame">
                        <Mascot
                            mood={p1Count > 0 ? 'p1_angry' : 'idle'}
                            size={44}
                        />
                    </div>
                    <div className="mascot-status-text">
                        <span className="mascot-status-title">
                            {p1Count > 0 ? `${p1Count} P1 Must-Do` : 'Zero Blockers'}
                        </span>
                        <span className="mascot-status-desc">
                            {p1Count > 0 ? 'Immediate focus required' : 'Everything under control'}
                        </span>
                    </div>
                </div>
            )}

            {/* Quick Action Button */}
            <div className="desk-sidebar-action">
                <Button
                    variant="p1"
                    size="md"
                    onClick={onOpenCreateTask}
                    icon="➕"
                    style={{ width: '100%', justifyContent: isCollapsed ? 'center' : 'flex-start' }}
                    title="Create New Task"
                >
                    {!isCollapsed && 'New Task'}
                </Button>
            </div>

            {/* Navigation / Priority Views */}
            <div className="desk-sidebar-nav">
                {!isCollapsed && <span className="desk-nav-header">PRIORITY VIEWS</span>}

                <nav className="desk-nav-items">
                    <button
                        type="button"
                        className={`desk-nav-btn ${activeFilter === 'all' ? 'nav-selected' : ''}`}
                        onClick={() => onSelectFilter('all')}
                        title="All Active Tasks"
                    >
                        <span className="nav-btn-icon">📋</span>
                        {!isCollapsed && <span className="nav-btn-label">All Active</span>}
                        {!isCollapsed && <span className="nav-badge">{counts.all}</span>}
                    </button>

                    <button
                        type="button"
                        className={`desk-nav-btn nav-p1-btn ${activeFilter === 1 ? 'nav-selected' : ''}`}
                        onClick={() => onSelectFilter(1)}
                        title="P1 Critical Tasks"
                    >
                        <span className="nav-btn-icon">👹</span>
                        {!isCollapsed && <span className="nav-btn-label">P1 Critical</span>}
                        {!isCollapsed && <span className="nav-badge badge-p1">{counts.p1}</span>}
                    </button>

                    <button
                        type="button"
                        className={`desk-nav-btn nav-p2-btn ${activeFilter === 2 ? 'nav-selected' : ''}`}
                        onClick={() => onSelectFilter(2)}
                        title="P2 High Urgency Tasks"
                    >
                        <span className="nav-btn-icon">⚡</span>
                        {!isCollapsed && <span className="nav-btn-label">P2 High Urgency</span>}
                        {!isCollapsed && <span className="nav-badge">{counts.p2}</span>}
                    </button>

                    <button
                        type="button"
                        className={`desk-nav-btn nav-p3-btn ${activeFilter === 3 ? 'nav-selected' : ''}`}
                        onClick={() => onSelectFilter(3)}
                        title="P3 Normal Flow Tasks"
                    >
                        <span className="nav-btn-icon">🎯</span>
                        {!isCollapsed && <span className="nav-btn-label">P3 Normal Flow</span>}
                        {!isCollapsed && <span className="nav-badge">{counts.p3}</span>}
                    </button>

                    <button
                        type="button"
                        className={`desk-nav-btn nav-p4-btn ${activeFilter === 4 ? 'nav-selected' : ''}`}
                        onClick={() => onSelectFilter(4)}
                        title="P4 Low / Zen Tasks"
                    >
                        <span className="nav-btn-icon">🌿</span>
                        {!isCollapsed && <span className="nav-btn-label">P4 Low / Zen</span>}
                        {!isCollapsed && <span className="nav-badge">{counts.p4}</span>}
                    </button>

                    <button
                        type="button"
                        className={`desk-nav-btn ${activeFilter === 'done' ? 'nav-selected' : ''}`}
                        onClick={() => onSelectFilter('done')}
                        title="Completed Archive"
                    >
                        <span className="nav-btn-icon">✅</span>
                        {!isCollapsed && <span className="nav-btn-label">Completed</span>}
                        {!isCollapsed && <span className="nav-badge">{counts.done}</span>}
                    </button>
                </nav>
            </div>

            {/* Quick Shortcuts */}
            <div className="desk-sidebar-shortcuts">
                {!isCollapsed && <span className="desk-nav-header">SYSTEM</span>}

                {onOpenBacklog && (
                    <button
                        type="button"
                        className="desk-shortcut-btn"
                        onClick={onOpenBacklog}
                        title="View Task Backlog"
                    >
                        <span className="nav-btn-icon">📋</span>
                        {!isCollapsed && <span className="nav-btn-label">Task Backlog</span>}
                    </button>
                )}

                <button
                    type="button"
                    className="desk-shortcut-btn"
                    onClick={onOpenLogs}
                    title="View Daily Activity Logs"
                >
                    <span className="nav-btn-icon">📜</span>
                    {!isCollapsed && <span className="nav-btn-label">Daily Activity Logs</span>}
                </button>

                {onEnablePush && (
                    <button
                        type="button"
                        className={`desk-shortcut-btn ${pushEnabled ? 'push-active-desk' : ''}`}
                        onClick={onEnablePush}
                        title={pushEnabled ? 'Hourly Push Reminders Active' : 'Enable Mobile Push Alerts'}
                    >
                        <span className="nav-btn-icon">{pushEnabled ? '🔔' : '🔕'}</span>
                        {!isCollapsed && (
                            <div className="desk-push-details">
                                <span className="desk-push-title">
                                    {pushEnabled ? 'Push Alerts ON' : 'Enable Alerts'}
                                </span>
                                <span className="desk-push-sub">Hourly lockscreen pings</span>
                            </div>
                        )}
                    </button>
                )}
            </div>

            {/* User Profile Footer */}
            <div className="desk-sidebar-footer">
                <div className="desk-user-row">
                    <div className="desk-user-avatar">
                        {user?.name ? user.name[0].toUpperCase() : user?.email[0].toUpperCase()}
                    </div>
                    {!isCollapsed && (
                        <div className="desk-user-info">
                            <span className="desk-user-name">{user?.name || 'TaskPulse User'}</span>
                            <span className="desk-user-email">{user?.email}</span>
                        </div>
                    )}
                </div>

                {!isCollapsed && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={logout}
                        style={{ width: '100%', marginTop: '8px' }}
                    >
                        Sign Out
                    </Button>
                )}
            </div>
        </aside>
    );
}
