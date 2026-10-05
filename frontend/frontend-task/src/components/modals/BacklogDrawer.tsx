import { useEffect, useState, useCallback } from 'react';
import { backlogApi } from '../../api/backlog.api';
import { taskApi } from '../../api/task.api';
import type { DayWiseBacklog, BacklogPagination, BacklogStats, BacklogTask, Task } from '../../types';
import './BacklogDrawer.css';

interface BacklogDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onTaskUpdated?: () => void;
    onEditTask?: (task: Task) => void;
}

export function BacklogDrawer({ isOpen, onClose, onTaskUpdated, onEditTask }: BacklogDrawerProps) {
    const [days, setDays] = useState<DayWiseBacklog[]>([]);
    const [pagination, setPagination] = useState<BacklogPagination>({
        page: 1,
        limit: 3,
        totalDays: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
    });
    const [stats, setStats] = useState<BacklogStats | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [filterDate, setFilterDate] = useState<string>('');
    const [scope, setScope] = useState<'all' | 'overdue' | 'upcoming'>('all');
    const [loading, setLoading] = useState(false);
    const [actionTaskId, setActionTaskId] = useState<number | null>(null);
    // Tab filter for each day card: { [dateKey]: 'all' | 'p1' | 'other' }
    const [dayFilters, setDayFilters] = useState<Record<string, 'all' | 'p1' | 'other'>>({});

    const fetchBacklog = useCallback(async (
        pageToFetch: number,
        dateToFilter: string = filterDate,
        scopeToFilter: 'all' | 'overdue' | 'upcoming' = scope
    ) => {
        setLoading(true);
        try {
            const res = await backlogApi.getBacklog(pageToFetch, 3, dateToFilter, scopeToFilter);
            setDays(res.data);
            setPagination(res.pagination);
            setStats(res.stats);
            setCurrentPage(res.pagination.page);
        } catch (err) {
            console.error('Failed to load day-wise backlog:', err);
        } finally {
            setLoading(false);
        }
    }, [filterDate, scope]);

    useEffect(() => {
        if (isOpen) {
            fetchBacklog(currentPage, filterDate, scope);
        }
    }, [isOpen, currentPage, filterDate, scope, fetchBacklog]);

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleDateFilterChange = (newDate: string) => {
        setFilterDate(newDate);
        setCurrentPage(1);
    };

    const handleClearDateFilter = () => {
        setFilterDate('');
        setCurrentPage(1);
    };

    const handleScopeChange = (newScope: 'all' | 'overdue' | 'upcoming') => {
        setScope(newScope);
        setCurrentPage(1);
    };

    const handlePrevPage = () => {
        if (pagination.hasPrevPage && !loading) {
            setCurrentPage((prev) => Math.max(1, prev - 1));
        }
    };

    const handleNextPage = () => {
        if (pagination.hasNextPage && !loading) {
            setCurrentPage((prev) => prev + 1);
        }
    };

    const setFilterForDay = (dateKey: string, filter: 'all' | 'p1' | 'other') => {
        setDayFilters((prev) => ({
            ...prev,
            [dateKey]: filter,
        }));
    };

    const handleCompleteTask = async (task: BacklogTask) => {
        setActionTaskId(task.id);
        try {
            await taskApi.toggleTask(task.id, true);
            // Re-fetch backlog to update counts and remove completed task
            await fetchBacklog(currentPage, filterDate, scope);
            onTaskUpdated?.();
        } catch (err) {
            console.error('Failed to complete backlog task:', err);
        } finally {
            setActionTaskId(null);
        }
    };

    const handleMoveToToday = async (task: BacklogTask) => {
        setActionTaskId(task.id);
        try {
            await backlogApi.moveToToday(task.id);
            await fetchBacklog(currentPage, filterDate, scope);
            onTaskUpdated?.();
        } catch (err) {
            console.error('Failed to move task to today:', err);
        } finally {
            setActionTaskId(null);
        }
    };

    if (!isOpen) return null;

    const overallEmoji = stats && stats.overdueCount > 0 ? '🚨' : stats && stats.totalBacklog > 0 ? '📋' : '✨';

    return (
        <div className="drawer-backdrop" onClick={onClose}>
            <aside className="drawer-panel backlog-panel" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="drawer-header">
                    <div>
                        <div className="drawer-title-row">
                            <span className="drawer-emoji-title">{overallEmoji}</span>
                            <h2 className="drawer-title">Task Backlog</h2>
                        </div>
                        <p className="drawer-subtitle">
                            Overdue pending tasks organized date-by-date with quick reschedule to today.
                        </p>
                    </div>
                    <button className="drawer-close-btn" onClick={onClose} aria-label="Close drawer">
                        ✕
                    </button>
                </div>

                {/* Backlog Stats Strip */}
                {stats && (
                    <div className="backlog-stats-strip">
                        <div className="backlog-pill-row">
                            <div className="backlog-metric-chip chip-total">
                                <span className="chip-icon">📋</span>
                                <span className="chip-label">Overdue Tasks:</span>
                                <strong className="chip-val">{stats.totalBacklog}</strong>
                            </div>
                            {stats.p1Count > 0 && (
                                <div className="backlog-metric-chip chip-p1">
                                    <span className="chip-icon">👹</span>
                                    <span className="chip-label">P1 Urgent:</span>
                                    <strong className="chip-val">{stats.p1Count}</strong>
                                </div>
                            )}
                            {stats.p2Count > 0 && (
                                <div className="backlog-metric-chip chip-p2">
                                    <span className="chip-icon">⚡</span>
                                    <span className="chip-label">P2 High:</span>
                                    <strong className="chip-val">{stats.p2Count}</strong>
                                </div>
                            )}
                            <div className="backlog-metric-chip chip-overdue">
                                <span className="chip-icon">⚠️</span>
                                <span className="chip-label">Days Overdue:</span>
                                <strong className="chip-val">{pagination.totalDays}</strong>
                            </div>
                        </div>
                    </div>
                )}

                {/* Scope Filter Tabs & Date Filter */}
                <div className="drawer-filter-bar backlog-filter-bar">
                    <div className="backlog-scope-tabs">
                        <button
                            type="button"
                            className={`scope-tab-btn ${scope === 'all' ? 'active' : ''}`}
                            onClick={() => handleScopeChange('all')}
                        >
                            ⚠️ All Overdue ({stats?.totalBacklog ?? 0})
                        </button>
                    </div>

                    <div className="drawer-date-picker-group">
                        <label className="drawer-date-label">
                            <span className="date-icon">📅</span>
                            <span className="date-text">Date:</span>
                            <input
                                type="date"
                                className="drawer-date-input"
                                value={filterDate}
                                onChange={(e) => handleDateFilterChange(e.target.value)}
                            />
                        </label>
                        {filterDate && (
                            <button
                                type="button"
                                className="drawer-clear-filter-btn"
                                onClick={handleClearDateFilter}
                                title="Reset date filter"
                            >
                                ✕ Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Pagination Toolbar */}
                <div className="drawer-actions-bar">
                    <span className="log-count-tag">
                        {filterDate
                            ? `📅 1 Selected Day (${pagination.totalDays} match)`
                            : `📅 ${pagination.totalDays} ${pagination.totalDays === 1 ? 'Day' : 'Days'} with Pending Tasks`}
                    </span>
                    {pagination.totalPages > 1 && (
                        <div className="pagination-controls">
                            <button
                                type="button"
                                className="page-nav-btn"
                                onClick={handlePrevPage}
                                disabled={!pagination.hasPrevPage || loading}
                                title="Previous Days"
                            >
                                ◀ Prev
                            </button>
                            <span className="page-indicator">
                                Page {pagination.page} / {pagination.totalPages}
                            </span>
                            <button
                                type="button"
                                className="page-nav-btn"
                                onClick={handleNextPage}
                                disabled={!pagination.hasNextPage || loading}
                                title="Next Days"
                            >
                                Next ▶
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="drawer-body">
                    {loading ? (
                        <div className="drawer-loading">
                            <span className="spinner" />
                            <p>Loading date-wise task backlog...</p>
                        </div>
                    ) : days.length === 0 ? (
                        <div className="drawer-empty-state">
                            <span className="empty-icon">🎉</span>
                            <h4>Zero Backlog!</h4>
                            <p>
                                {filterDate
                                    ? `No overdue tasks found for ${filterDate}.`
                                    : 'No overdue tasks found! You are completely caught up.'}
                            </p>
                        </div>
                    ) : (
                        <div className="day-logs-list">
                            {days.map((day) => {
                                const currentFilter = dayFilters[day.date] || 'all';
                                const filteredTasks = day.tasks.filter((t) => {
                                    if (currentFilter === 'p1') return t.pri === 1;
                                    if (currentFilter === 'other') return t.pri !== 1;
                                    return true;
                                });

                                return (
                                    <div
                                        key={day.date}
                                        className={`day-card backlog-day-card ${day.isOverdue ? 'card-overdue' : day.isToday ? 'card-today' : 'card-upcoming'}`}
                                    >
                                        {/* Day Card Header */}
                                        <div className="day-card-header">
                                            <div className="day-card-left">
                                                <div className="backlog-day-title-row">
                                                    <h3 className="day-date-title">{day.displayDate}</h3>
                                                    {day.isOverdue && (
                                                        <span className="day-tag-overdue">⚠️ Overdue</span>
                                                    )}
                                                    {day.isToday && (
                                                        <span className="day-tag-today">⚡ Today</span>
                                                    )}
                                                    {day.isFuture && (
                                                        <span className="day-tag-upcoming">📅 Upcoming</span>
                                                    )}
                                                </div>
                                                <span className="day-summary-caption">
                                                    {day.totalTasks} {day.totalTasks === 1 ? 'task' : 'tasks'} pending
                                                    {day.p1Count > 0 ? ` • ${day.p1Count} Critical P1` : ''}
                                                </span>
                                            </div>

                                            {/* Priority Summary Pill */}
                                            <div className="backlog-day-status-badge">
                                                <span className="status-badge-emoji">{day.emoji}</span>
                                                <span className="status-badge-text">{day.statusLabel}</span>
                                            </div>
                                        </div>

                                        {/* Filter Tabs for Day: All / P1 / P2-P4 */}
                                        {day.p1Count > 0 && day.totalTasks > day.p1Count && (
                                            <div className="day-filter-tabs">
                                                <button
                                                    type="button"
                                                    className={`day-tab-btn ${currentFilter === 'all' ? 'active' : ''}`}
                                                    onClick={() => setFilterForDay(day.date, 'all')}
                                                >
                                                    All ({day.totalTasks})
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`day-tab-btn ${currentFilter === 'p1' ? 'active' : ''}`}
                                                    onClick={() => setFilterForDay(day.date, 'p1')}
                                                >
                                                    👹 P1 ({day.p1Count})
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`day-tab-btn ${currentFilter === 'other' ? 'active' : ''}`}
                                                    onClick={() => setFilterForDay(day.date, 'other')}
                                                >
                                                    Other ({day.totalTasks - day.p1Count})
                                                </button>
                                            </div>
                                        )}

                                        {/* Task Items List */}
                                        <div className="day-tasks-container">
                                            {filteredTasks.map((task) => {
                                                const taskTime = new Date(task.time);
                                                const formattedTime = taskTime.toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                });
                                                const isActioning = actionTaskId === task.id;

                                                return (
                                                    <div
                                                        key={task.id}
                                                        className={`task-row-item backlog-task-row pri-${task.pri}`}
                                                    >
                                                        {/* Complete Checkbox */}
                                                        <button
                                                            type="button"
                                                            className="backlog-checkbox-btn"
                                                            onClick={() => handleCompleteTask(task)}
                                                            disabled={isActioning}
                                                            title="Mark as completed"
                                                            aria-label={`Mark task ${task.topic} as completed`}
                                                        >
                                                            {isActioning ? (
                                                                <span className="spinner-mini" />
                                                            ) : (
                                                                <span className="checkbox-empty" />
                                                            )}
                                                        </button>

                                                        {/* Task Details */}
                                                        <div className="task-row-details">
                                                            <span className="task-row-topic">{task.topic}</span>
                                                            <div className="task-row-meta">
                                                                <span className={`priority-tag p${task.pri}`}>
                                                                    P{task.pri}
                                                                </span>
                                                                <span className="task-row-time">
                                                                    ⏰ {formattedTime}
                                                                </span>
                                                                {task.loc && (
                                                                    <span className="task-row-loc">
                                                                        📍 {task.loc}
                                                                    </span>
                                                                )}
                                                                {task.assigner && (
                                                                    <span className="task-row-assigner">
                                                                        👤 {task.assigner}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {task.remarks && (
                                                                <p className="task-row-remarks">
                                                                    💬 {task.remarks}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="backlog-task-actions">
                                                            {day.isOverdue && (
                                                                <button
                                                                    type="button"
                                                                    className="btn-move-today"
                                                                    onClick={() => handleMoveToToday(task)}
                                                                    disabled={isActioning}
                                                                    title="Reschedule to Today"
                                                                >
                                                                    ⚡ Move to Today
                                                                </button>
                                                            )}
                                                            {onEditTask && (
                                                                <button
                                                                    type="button"
                                                                    className="btn-edit-backlog"
                                                                    onClick={() => onEditTask(task as unknown as Task)}
                                                                    disabled={isActioning}
                                                                    title="Edit Task"
                                                                >
                                                                    ✏️
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Bottom Pagination for convenience */}
                {pagination.totalPages > 1 && !loading && (
                    <div className="drawer-footer-pagination">
                        <button
                            type="button"
                            className="page-nav-btn"
                            onClick={handlePrevPage}
                            disabled={!pagination.hasPrevPage}
                        >
                            ◀ Previous Days
                        </button>
                        <span className="page-indicator">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <button
                            type="button"
                            className="page-nav-btn"
                            onClick={handleNextPage}
                            disabled={!pagination.hasNextPage}
                        >
                            Next Days ▶
                        </button>
                    </div>
                )}
            </aside>
        </div>
    );
}
