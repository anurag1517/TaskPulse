import { useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from './Button';
import type { PriorityLevel } from '../../types';
import './MobileSidebar.css';

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
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
}

export function MobileSidebar({
    isOpen,
    onClose,
    p1Count,
    counts,
    activeFilter,
    onSelectFilter,
    onOpenCreateTask,
    onOpenLogs,
    onOpenBacklog,
    onEnablePush,
    pushEnabled = false,
}: MobileSidebarProps) {
    const { user, logout } = useAuth();
    const touchStartX = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const currentX = e.touches[0].clientX;
        const diffX = currentX - touchStartX.current;
        // If swiping left by more than 50px, close sidebar
        if (diffX < -50) {
            onClose();
            touchStartX.current = null;
        }
    };

    const handleTouchEnd = () => {
        touchStartX.current = null;
    };

    if (!isOpen) return null;

    return (
        <div className="mobile-sidebar-backdrop" onClick={onClose}>
            <aside
                className="mobile-sidebar-panel"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Header */}
                <div className="mobile-sidebar-header">
                    <div className="sidebar-user-card">
                        <div className="sidebar-avatar">
                            {user?.name ? user.name[0].toUpperCase() : user?.email[0].toUpperCase()}
                        </div>
                        <div className="sidebar-user-details">
                            <span className="sidebar-user-name">{user?.name || 'TaskPulse User'}</span>
                            <span className="sidebar-user-email">{user?.email}</span>
                        </div>
                    </div>
                    <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
                        ✕
                    </button>
                </div>

                {/* Threat Meter inside sidebar */}
                <div className="sidebar-threat-section">
                    <div className={`sidebar-threat-card ${p1Count > 0 ? 'threat-card-urgent' : 'threat-card-calm'}`}>
                        <span className="sidebar-threat-icon">{p1Count > 0 ? '👹' : '😎'}</span>
                        <div className="sidebar-threat-content">
                            <span className="sidebar-threat-title">
                                {p1Count > 0 ? `${p1Count} P1 URGENT TASKS` : 'ALL TASKS CALM'}
                            </span>
                            <span className="sidebar-threat-sub">
                                {p1Count > 0 ? 'Immediate focus required' : 'Zero critical blockers'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Navigation / Priority Filter list */}
                <div className="sidebar-nav-section">
                    <span className="sidebar-section-title">PRIORITY VIEWS</span>
                    <nav className="sidebar-nav-list">
                        <button
                            type="button"
                            className={`sidebar-nav-item ${activeFilter === 'all' ? 'nav-active' : ''}`}
                            onClick={() => {
                                onSelectFilter('all');
                                onClose();
                            }}
                        >
                            <span className="nav-item-icon">📋</span>
                            <span className="nav-item-label">All Active Tasks</span>
                            <span className="nav-item-count">{counts.all}</span>
                        </button>

                        <button
                            type="button"
                            className={`sidebar-nav-item nav-p1 ${activeFilter === 1 ? 'nav-active' : ''}`}
                            onClick={() => {
                                onSelectFilter(1);
                                onClose();
                            }}
                        >
                            <span className="nav-item-icon">👹</span>
                            <span className="nav-item-label">P1 Critical Must-Do</span>
                            <span className="nav-item-count p1-count-chip">{counts.p1}</span>
                        </button>

                        <button
                            type="button"
                            className={`sidebar-nav-item nav-p2 ${activeFilter === 2 ? 'nav-active' : ''}`}
                            onClick={() => {
                                onSelectFilter(2);
                                onClose();
                            }}
                        >
                            <span className="nav-item-icon">⚡</span>
                            <span className="nav-item-label">P2 High Urgency</span>
                            <span className="nav-item-count">{counts.p2}</span>
                        </button>

                        <button
                            type="button"
                            className={`sidebar-nav-item nav-p3 ${activeFilter === 3 ? 'nav-active' : ''}`}
                            onClick={() => {
                                onSelectFilter(3);
                                onClose();
                            }}
                        >
                            <span className="nav-item-icon">🎯</span>
                            <span className="nav-item-label">P3 Normal Flow</span>
                            <span className="nav-item-count">{counts.p3}</span>
                        </button>

                        <button
                            type="button"
                            className={`sidebar-nav-item nav-p4 ${activeFilter === 4 ? 'nav-active' : ''}`}
                            onClick={() => {
                                onSelectFilter(4);
                                onClose();
                            }}
                        >
                            <span className="nav-item-icon">🌿</span>
                            <span className="nav-item-label">P4 Low / Zen</span>
                            <span className="nav-item-count">{counts.p4}</span>
                        </button>

                        <button
                            type="button"
                            className={`sidebar-nav-item ${activeFilter === 'done' ? 'nav-active' : ''}`}
                            onClick={() => {
                                onSelectFilter('done');
                                onClose();
                            }}
                        >
                            <span className="nav-item-icon">✅</span>
                            <span className="nav-item-label">Completed Archive</span>
                            <span className="nav-item-count">{counts.done}</span>
                        </button>
                    </nav>
                </div>

                {/* Primary Actions */}
                <div className="sidebar-actions-section">
                    <span className="sidebar-section-title">SHORTCUTS</span>

                    <Button
                        variant="p1"
                        size="md"
                        onClick={() => {
                            onClose();
                            onOpenCreateTask();
                        }}
                        icon="➕"
                        style={{ width: '100%' }}
                    >
                        Create New Task
                    </Button>

                    {onOpenBacklog && (
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={() => {
                                onClose();
                                onOpenBacklog();
                            }}
                            icon="📋"
                            style={{ width: '100%' }}
                        >
                            Task Backlog
                        </Button>
                    )}

                    <Button
                        variant="secondary"
                        size="md"
                        onClick={() => {
                            onClose();
                            onOpenLogs();
                        }}
                        icon="📜"
                        style={{ width: '100%' }}
                    >
                        View Daily Logs
                    </Button>

                    {onEnablePush && (
                        <button
                            type="button"
                            className={`sidebar-push-btn ${pushEnabled ? 'push-on' : ''}`}
                            onClick={onEnablePush}
                        >
                            <span className="push-btn-icon">{pushEnabled ? '🔔' : '🔕'}</span>
                            <div className="push-btn-text">
                                <span className="push-btn-title">
                                    {pushEnabled ? 'Hourly Push Alerts Active' : 'Enable Mobile Push Alerts'}
                                </span>
                                <span className="push-btn-desc">
                                    {pushEnabled ? 'Delivering to lockscreen' : 'Tap to receive hourly alerts'}
                                </span>
                            </div>
                        </button>
                    )}
                </div>

                {/* Footer Sign out */}
                <div className="sidebar-footer">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={logout}
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        Sign Out of TaskPulse
                    </Button>
                </div>
            </aside>
        </div>
    );
}
