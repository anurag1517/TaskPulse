import { useEffect, useState } from 'react';
import { logApi } from '../../api/log.api';
import type { TaskLog } from '../../types';
import { Button } from '../common/Button';
import './LogDrawer.css';

interface LogDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LogDrawer({ isOpen, onClose }: LogDrawerProps) {
    const [logs, setLogs] = useState<TaskLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [clearing, setClearing] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await logApi.getLogs();
            setLogs(res.data);
        } catch (err) {
            console.error('Failed to load logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchLogs();
        }
    }, [isOpen]);

    const handleClearLogs = async () => {
        if (!confirm('Are you sure you want to clear your daily activity history?')) return;
        setClearing(true);
        try {
            await logApi.clearLogs();
            setLogs([]);
        } catch (err) {
            console.error('Failed to clear logs:', err);
        } finally {
            setClearing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="drawer-backdrop" onClick={onClose}>
            <aside className="drawer-panel" onClick={(e) => e.stopPropagation()}>
                <div className="drawer-header">
                    <div>
                        <h2 className="drawer-title">📜 Daily Activity Log</h2>
                        <p className="drawer-subtitle">
                            Automated timeline of task milestones, status updates, and hourly reminders.
                        </p>
                    </div>
                    <button className="drawer-close-btn" onClick={onClose} aria-label="Close drawer">
                        ✕
                    </button>
                </div>

                <div className="drawer-actions-bar">
                    <span className="log-count-tag">{logs.length} logged events</span>
                    {logs.length > 0 && (
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleClearLogs}
                            loading={clearing}
                        >
                            Clear History
                        </Button>
                    )}
                </div>

                <div className="drawer-body">
                    {loading ? (
                        <div className="drawer-loading">
                            <span className="spinner" />
                            <p>Loading activity trail...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="drawer-empty-state">
                            <span className="empty-icon">📭</span>
                            <h4>No activity logged yet</h4>
                            <p>Create tasks or trigger reminders to see your live audit trail here.</p>
                        </div>
                    ) : (
                        <div className="timeline-container">
                            {logs.map((log) => {
                                const logDate = new Date(log.ts);
                                return (
                                    <div key={log.id} className="timeline-item">
                                        <div className="timeline-icon-bubble">{log.icon || '📝'}</div>
                                        <div className="timeline-content">
                                            <p className="timeline-msg">{log.msg}</p>
                                            <span className="timeline-time">
                                                {logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                                                {logDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}
