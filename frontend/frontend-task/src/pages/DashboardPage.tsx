import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { taskApi } from '../api/task.api';
import { pushApi } from '../api/push.api';
import type { Task, PriorityLevel, CreateTaskDTO, UpdateTaskDTO } from '../types';
import { Navbar } from '../components/common/Navbar';
import { MobileSidebar } from '../components/common/MobileSidebar';
import { TaskCard } from '../components/task/TaskCard';
import { TaskFilters } from '../components/task/TaskFilters';
import { TaskModal } from '../components/modals/TaskModal';
import { LogDrawer } from '../components/modals/LogDrawer';
import { BacklogDrawer } from '../components/modals/BacklogDrawer';
import { Button } from '../components/common/Button';
import { useIsMobile } from '../hooks/useMediaQuery';
import { playUrgentAlertChime } from '../utils/audio';
import './DashboardPage.css';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function getTodayString(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function DashboardPage() {
    const isMobile = useIsMobile(768);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | PriorityLevel | 'done'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);
    const [isBacklogDrawerOpen, setIsBacklogDrawerOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [pushStatusMessage, setPushStatusMessage] = useState<string | null>(null);
    const [urgentAlertToast, setUrgentAlertToast] = useState<{ title: string; body?: string } | null>(null);

    const loadTasks = useCallback(async () => {
        setLoading(true);
        try {
            const tzOffset = new Date().getTimezoneOffset();
            const res = await taskApi.getTasks({
                tzOffset,
            });
            setTasks(res.data);
        } catch (err) {
            console.error('Failed to load tasks:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    // Check if browser push notification permission is granted
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
            setPushEnabled(true);
        }
    }, []);

    // Midnight rollover check: automatically re-fetch if day changes while tab is open
    const currentDayRef = useRef<string>(getTodayString());
    useEffect(() => {
        const interval = setInterval(() => {
            const nowDay = getTodayString();
            if (nowDay !== currentDayRef.current) {
                currentDayRef.current = nowDay;
                loadTasks();
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [loadTasks]);

    // Re-sync on visibility change (e.g. user unlocks laptop or returns to tab)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const nowDay = getTodayString();
                if (nowDay !== currentDayRef.current) {
                    currentDayRef.current = nowDay;
                }
                loadTasks();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [loadTasks]);

    // Filter and compute statistics
    const counts = useMemo(() => {
        const p1 = tasks.filter((t) => !t.done && t.pri === 1).length;
        const p2 = tasks.filter((t) => !t.done && t.pri === 2).length;
        const p3 = tasks.filter((t) => !t.done && t.pri === 3).length;
        const p4 = tasks.filter((t) => !t.done && t.pri === 4).length;
        const done = tasks.filter((t) => t.done).length;
        return { all: tasks.length, p1, p2, p3, p4, done };
    }, [tasks]);

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            // Priority/Status filter
            if (activeFilter === 'done' && !task.done) return false;
            if (activeFilter !== 'all' && activeFilter !== 'done') {
                if (task.done || task.pri !== activeFilter) return false;
            }

            // Search text filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchTopic = task.topic.toLowerCase().includes(query);
                const matchLoc = task.loc?.toLowerCase().includes(query);
                const matchRemarks = task.remarks?.toLowerCase().includes(query);
                const matchAssigner = task.assigner?.toLowerCase().includes(query);
                return matchTopic || matchLoc || matchRemarks || matchAssigner;
            }

            return true;
        });
    }, [tasks, activeFilter, searchQuery]);

    // Handlers
    const handleToggleTask = async (id: number) => {
        // Optimistic UI update
        setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
        );

        try {
            const res = await taskApi.toggleTask(id);
            setTasks((prev) =>
                prev.map((t) => (t.id === id ? res.data : t))
            );
        } catch (err) {
            console.error('Failed to toggle task:', err);
            loadTasks(); // rollback on failure
        }
    };

    const dispatchNativeNotification = useCallback((title: string, body?: string) => {
        try {
            const options: NotificationOptions = {
                icon: '/icon-192.png',
                tag: 'taskpulse-' + Date.now(),
            };
            if (body) {
                options.body = body;
            }
            const n = new Notification(title, options);
            n.onclick = () => {
                window.focus();
                n.close();
            };
        } catch {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then((reg) => {
                    const options: NotificationOptions = {
                        icon: '/icon-192.png',
                        tag: 'taskpulse-' + Date.now(),
                    };
                    if (body) {
                        options.body = body;
                    }
                    reg.showNotification(title, options);
                }).catch((err) => console.error('SW notification error:', err));
            }
        }
    }, []);

    const showDesktopNotification = useCallback((title: string, body?: string) => {
        // 1. Play high-tech radar alert chime through laptop speakers
        playUrgentAlertChime();

        // 2. Display high-urgency glowing in-app HUD banner
        setUrgentAlertToast({ title, body });
        setTimeout(() => setUrgentAlertToast(null), 8000);

        // 3. Dispatch native OS notification if available
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            dispatchNativeNotification(title, body);
        } else if (Notification.permission === 'default') {
            Notification.requestPermission().then((perm) => {
                if (perm === 'granted') {
                    setPushEnabled(true);
                    dispatchNativeNotification(title, body);
                }
            });
        } else if (Notification.permission === 'denied') {
            setPushStatusMessage('⚠️ Notifications are blocked in your browser. Click the tune icon in the URL bar to allow.');
            setTimeout(() => setPushStatusMessage(null), 7000);
        }
    }, [dispatchNativeNotification]);

    // Live Ticker: Alert user whenever any task is ending soon (within 15 mins) or deadline arrived
    const alertedDeadlinesRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        const checkUpcomingDeadlines = () => {
            const now = Date.now();
            tasks.forEach((t) => {
                if (t.done) return;
                const dueMs = new Date(t.time).getTime();
                const diffMins = Math.round((dueMs - now) / 60000);

                // Alert if ending within 15 minutes, or overdue by up to 10 minutes
                if (diffMins <= 15 && diffMins >= -10) {
                    const alertKey = `${t.id}-${diffMins <= 0 ? 'overdue' : 'approaching'}`;
                    if (!alertedDeadlinesRef.current.has(alertKey)) {
                        alertedDeadlinesRef.current.add(alertKey);
                        showDesktopNotification(
                            diffMins > 0 ? `⏰ Task Ending Soon: "${t.topic}"` : `🚨 Task Deadline Reached: "${t.topic}"`,
                            diffMins > 0
                                ? `Due in ${diffMins} minutes! Scheduled for ${new Date(t.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                : `This task was due at ${new Date(t.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}!`
                        );
                    }
                }
            });
        };

        checkUpcomingDeadlines();
        const interval = setInterval(checkUpcomingDeadlines, 20000);
        return () => clearInterval(interval);
    }, [tasks, showDesktopNotification]);

    const handleCreateOrUpdateTask = async (data: CreateTaskDTO | UpdateTaskDTO) => {
        if (editingTask) {
            await taskApi.updateTask(editingTask.id, data);
        } else {
            await taskApi.createTask(data as CreateTaskDTO);

            // If a critical P1 task was just created, alert the laptop screen immediately!
            if (data.pri === 1) {
                showDesktopNotification(
                    `🚨 Critical P1: ${data.topic}`,
                    data.loc ? `Pending at ${data.loc}. Action required!` : 'Immediate attention required!'
                );
            }
        }
        await loadTasks();
        setEditingTask(null);
    };

    const handleDeleteTask = async (id: number) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        setTasks((prev) => prev.filter((t) => t.id !== id));
        try {
            await taskApi.deleteTask(id);
            await loadTasks();
        } catch (err) {
            console.error('Failed to delete task:', err);
            loadTasks();
        }
    };

    const handleEnablePush = async () => {
        if (!('Notification' in window)) {
            alert('Push notifications are not supported in this browser.');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                setPushEnabled(true);
                setPushStatusMessage('🔔 Notifications active on this device!');
                setTimeout(() => setPushStatusMessage(null), 5000);

                // Immediately fire a tactile test notification to the laptop screen
                showDesktopNotification('🔥 TaskPulse Notifications Active!');

                // Register ServiceWorker PushSubscription with backend
                try {
                    if ('serviceWorker' in navigator) {
                        const reg = await navigator.serviceWorker.ready;
                        const keyRes = await pushApi.getPublicKey();
                        if (keyRes.publicKey) {
                            const sub = await reg.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: urlBase64ToUint8Array(keyRes.publicKey) as unknown as BufferSource,
                            });
                            const subJson = sub.toJSON();
                            if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
                                await pushApi.subscribe({
                                    endpoint: subJson.endpoint,
                                    keys: {
                                        p256dh: subJson.keys.p256dh,
                                        auth: subJson.keys.auth,
                                    },
                                });
                            }
                        }
                    }
                } catch (pushErr) {
                    console.log('Web push background registration info:', pushErr);
                }
            } else {
                setPushEnabled(false);
                alert('Notification permission was denied. Please allow notifications in your browser address bar (lock icon) and macOS System Settings.');
            }
        } catch (err) {
            console.error('Error requesting push permission:', err);
        }
    };

    return (
        <div className="dashboard-container">
            {/* Ambient Aurora Glow */}
            <div className="app-background">
                <div className="aurora-mesh aurora-1" />
                <div className="aurora-mesh aurora-2" />
                <div className="aurora-mesh aurora-3" />
            </div>

            {/* Top Navigation with Mobile Sidebar trigger */}
            <Navbar
                p1Count={counts.p1}
                onOpenLogs={() => setIsLogDrawerOpen(true)}
                onOpenBacklog={() => setIsBacklogDrawerOpen(true)}
                onOpenCreateTask={() => {
                    setEditingTask(null);
                    setIsTaskModalOpen(true);
                }}
                onOpenSidebar={isMobile ? () => setIsSidebarOpen(true) : undefined}
                onEnablePush={handleEnablePush}
                pushEnabled={pushEnabled}
                onSelectP1={() => setActiveFilter(1)}
            />

            <div className="dashboard-app-layout">
                <div className="dashboard-workspace">
                    {/* Floating Side Quick-Tab for Phone Screens (iPhone 15 & Android only) */}
                    {isMobile && (
                        <button
                            type="button"
                            className="mobile-side-edge-trigger"
                            onClick={() => setIsSidebarOpen(true)}
                            aria-label="Open side menu"
                            title="Open side menu"
                        >
                            <span className="edge-trigger-icon">☰</span>
                            <span className="edge-trigger-text">Side</span>
                            {counts.p1 > 0 && <span className="edge-trigger-badge">{counts.p1}</span>}
                        </button>
                    )}

                    <main className="dashboard-main-content">
                        {/* High-Urgency Floating In-App Toast HUD */}
                        {urgentAlertToast && (
                            <div className="in-app-urgent-toast" role="alert">
                                <div className="toast-left-group">
                                    <span className="toast-flame-icon">🔥</span>
                                    <div className="toast-content-text">
                                        <span className="toast-title">{urgentAlertToast.title}</span>
                                        {urgentAlertToast.body && <span className="toast-body">{urgentAlertToast.body}</span>}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="toast-dismiss-btn"
                                    onClick={() => setUrgentAlertToast(null)}
                                    aria-label="Dismiss alert"
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        {/* Push Notification Banner Toast */}
                        {pushStatusMessage && (
                            <div className="push-status-toast">
                                <span>{pushStatusMessage}</span>
                            </div>
                        )}

                        {/* Threat Banner Alert if P1 tasks exist */}
                        {counts.p1 > 0 && (
                            <div className="threat-alert-banner">
                                <span className="threat-flame-icon">🚨</span>
                                <div className="threat-banner-text">
                                    <strong>{counts.p1} Critical P1 {counts.p1 === 1 ? 'Task Requires' : 'Tasks Require'} Immediate Action!</strong>
                                </div>
                                <div className="threat-banner-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <Button
                                        variant="p1"
                                        size="sm"
                                        onClick={() => setActiveFilter(1)}
                                    >
                                        View P1 Tasks (👹 {counts.p1})
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Metrics Stats Row */}
                        <div className="metrics-grid">
                            <div className="metric-card metric-all" onClick={() => setActiveFilter('all')}>
                                <span className="metric-icon">📋</span>
                                <div className="metric-info">
                                    <span className="metric-value">{counts.all}</span>
                                    <span className="metric-label">Today's Tasks</span>
                                </div>
                            </div>

                            <div className="metric-card metric-p1" onClick={() => setActiveFilter(1)}>
                                <span className="metric-icon">👹</span>
                                <div className="metric-info">
                                    <span className="metric-value">{counts.p1}</span>
                                    <span className="metric-label">P1 Urgent</span>
                                </div>
                            </div>

                            <div className="metric-card metric-p2" onClick={() => setActiveFilter(2)}>
                                <span className="metric-icon">⚡</span>
                                <div className="metric-info">
                                    <span className="metric-value">{counts.p2}</span>
                                    <span className="metric-label">P2 High</span>
                                </div>
                            </div>

                            <div className="metric-card metric-done" onClick={() => setActiveFilter('done')}>
                                <span className="metric-icon">✅</span>
                                <div className="metric-info">
                                    <span className="metric-value">{counts.done}</span>
                                    <span className="metric-label">Completed</span>
                                </div>
                            </div>
                        </div>

                        {/* Filters & Search */}
                        <TaskFilters
                            activeFilter={activeFilter}
                            onFilterChange={setActiveFilter}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            counts={counts}
                        />

                        {/* Tasks Grid */}
                        {loading ? (
                            <div className="dashboard-loading-state">
                                <span className="spinner" />
                                <p>Syncing tasks with cloud database...</p>
                            </div>
                        ) : filteredTasks.length === 0 ? (
                            <div className="empty-tasks-view">
                                <span className="empty-tasks-emoji">
                                    {activeFilter === 'done' ? '🏆' : activeFilter === 1 ? '😎' : '🚀'}
                                </span>
                                <h3>
                                    {activeFilter === 'done'
                                        ? 'No completed tasks today'
                                        : activeFilter === 1
                                        ? 'Zero P1 critical alerts today! System Zen.'
                                        : 'No tasks scheduled for today'}
                                </h3>
                                <p>
                                    Create tasks for today to begin tracking. Past days are preserved in your Daily Task Log.
                                </p>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <Button
                                        variant="primary"
                                        onClick={() => {
                                            setEditingTask(null);
                                            setIsTaskModalOpen(true);
                                        }}
                                        icon="➕"
                                    >
                                        Create Task
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setIsLogDrawerOpen(true)}
                                        icon="📖"
                                    >
                                        Daily Task Log
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setIsBacklogDrawerOpen(true)}
                                        icon="📋"
                                    >
                                        Task Backlog
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="tasks-grid">
                                {filteredTasks.map((task) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        onToggle={handleToggleTask}
                                        onEdit={(t) => {
                                            setEditingTask(t);
                                            setIsTaskModalOpen(true);
                                        }}
                                        onDelete={handleDeleteTask}
                                    />
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Mobile Bottom Dock Bar (iPhone 15 & Android only) */}
            {isMobile && (
                <nav className="mobile-bottom-dock" aria-label="Mobile navigation dock">
                    <button
                        type="button"
                        className={`dock-tab ${activeFilter === 'all' && !isBacklogDrawerOpen && !isLogDrawerOpen ? 'dock-active' : ''}`}
                        onClick={() => setActiveFilter('all')}
                    >
                        <span className="dock-icon">🎯</span>
                        <span className="dock-label">Tasks</span>
                    </button>

                    <button
                        type="button"
                        className={`dock-tab ${isBacklogDrawerOpen ? 'dock-active' : ''}`}
                        onClick={() => setIsBacklogDrawerOpen(true)}
                    >
                        <span className="dock-icon">📋</span>
                        <span className="dock-label">Backlog</span>
                    </button>

                    {/* Center Glowing Action Button */}
                    <div className="dock-fab-wrapper">
                        <button
                            type="button"
                            className="dock-fab-btn"
                            onClick={() => {
                                setEditingTask(null);
                                setIsTaskModalOpen(true);
                            }}
                            aria-label="Create new task"
                        >
                            ➕
                        </button>
                    </div>

                    <button
                        type="button"
                        className={`dock-tab ${isLogDrawerOpen ? 'dock-active' : ''}`}
                        onClick={() => setIsLogDrawerOpen(true)}
                    >
                        <span className="dock-icon">📜</span>
                        <span className="dock-label">Logs</span>
                    </button>

                    <button
                        type="button"
                        className={`dock-tab ${isSidebarOpen ? 'dock-active' : ''}`}
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <span className="dock-icon">☰</span>
                        <span className="dock-label">Menu</span>
                    </button>
                </nav>
            )}

            {/* Slide-out Mobile Sidebar (Phone Screens only) */}
            {isMobile && (
                <MobileSidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    p1Count={counts.p1}
                    counts={counts}
                    activeFilter={activeFilter}
                    onSelectFilter={setActiveFilter}
                    onOpenCreateTask={() => {
                        setEditingTask(null);
                        setIsTaskModalOpen(true);
                    }}
                    onOpenLogs={() => setIsLogDrawerOpen(true)}
                    onOpenBacklog={() => setIsBacklogDrawerOpen(true)}
                    onEnablePush={handleEnablePush}
                    pushEnabled={pushEnabled}
                />
            )}

            {/* Create / Edit Modal */}
            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => {
                    setIsTaskModalOpen(false);
                    setEditingTask(null);
                }}
                onSubmit={handleCreateOrUpdateTask}
                initialTask={editingTask}
            />

            {/* Daily Log Drawer */}
            <LogDrawer
                isOpen={isLogDrawerOpen}
                onClose={() => setIsLogDrawerOpen(false)}
            />

            {/* Task Backlog Drawer */}
            <BacklogDrawer
                isOpen={isBacklogDrawerOpen}
                onClose={() => setIsBacklogDrawerOpen(false)}
                onTaskUpdated={loadTasks}
                onEditTask={(t) => {
                    setEditingTask(t);
                    setIsBacklogDrawerOpen(false);
                    setIsTaskModalOpen(true);
                }}
            />
        </div>
    );
}
