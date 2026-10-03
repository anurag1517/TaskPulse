import { useEffect, useState } from 'react';
import { logApi } from '../../api/log.api';
import type { DayWiseLog, LogPagination, LogStats } from '../../types';
import './LogDrawer.css';

interface LogDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LogDrawer({ isOpen, onClose }: LogDrawerProps) {
    const [days, setDays] = useState<DayWiseLog[]>([]);
    const [pagination, setPagination] = useState<LogPagination>({
        page: 1,
        limit: 3,
        totalDays: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
    });
    const [stats, setStats] = useState<LogStats | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [filterDate, setFilterDate] = useState<string>('');
    const [loading, setLoading] = useState(false);
    // Tab filter for each day card: { [dateKey]: 'all' | 'done' | 'pending' }
    const [dayFilters, setDayFilters] = useState<Record<string, 'all' | 'done' | 'pending'>>({});

    const fetchLogs = async (pageToFetch: number, dateToFilter: string = filterDate) => {
        setLoading(true);
        try {
            const res = await logApi.getLogs(pageToFetch, 3, dateToFilter);
            setDays(res.data);
            setPagination(res.pagination);
            setStats(res.stats);
            setCurrentPage(res.pagination.page);
        } catch (err) {
            console.error('Failed to load day-wise logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchLogs(currentPage, filterDate);
        }
    }, [isOpen, currentPage, filterDate]);

    const handleDateFilterChange = (newDate: string) => {
        setFilterDate(newDate);
        setCurrentPage(1);
    };

    const handleClearDateFilter = () => {
        setFilterDate('');
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

    const setFilterForDay = (dateKey: string, filter: 'all' | 'done' | 'pending') => {
        setDayFilters((prev) => ({
            ...prev,
            [dateKey]: filter,
        }));
    };

    if (!isOpen) return null;

    const overallEmoji = stats
        ? stats.overallPercentage === 100
            ? '🏆'
            : stats.overallPercentage >= 70
            ? '🔥'
            : stats.overallPercentage >= 40
            ? '⚡'
            : '🎯'
        : '🎯';

    return (
        <div className="drawer-backdrop" onClick={onClose}>
            <aside className="drawer-panel" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="drawer-header">
                    <div>
                        <div className="drawer-title-row">
                            <span className="drawer-emoji-title">{overallEmoji}</span>
                            <h2 className="drawer-title">Daily Task Logs</h2>
                        </div>
                        <p className="drawer-subtitle">
                            Tasks done so far organized day-by-day with completion rates & progress.
                        </p>
                    </div>
                    <button className="drawer-close-btn" onClick={onClose} aria-label="Close drawer">
                        ✕
                    </button>
                </div>

                {/* Lifetime Overall Stats Strip */}
                {stats && stats.totalTasksAllTime > 0 && (
                    <div className="drawer-stats-strip">
                        <div className="stats-meter-group">
                            <div className="stats-meter-header">
                                <span className="stats-meter-label">Overall Completion</span>
                                <span className="stats-meter-val">
                                    {stats.totalCompletedAllTime} / {stats.totalTasksAllTime} tasks ({stats.overallPercentage}%)
                                </span>
                            </div>
                            <div className="stats-meter-track">
                                <div
                                    className="stats-meter-fill"
                                    style={{ width: `${stats.overallPercentage}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Server-side Date Filter Bar */}
                <div className="drawer-filter-bar">
                    <div className="drawer-date-picker-group">
                        <label className="drawer-date-label">
                            <span className="date-icon">📅</span>
                            <span className="date-text">Filter by Date:</span>
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
                                title="Reset to all days"
                            >
                                ✕ Reset to 3 Days
                            </button>
                        )}
                    </div>

                    <div className="drawer-view-mode-hint">
                        {filterDate ? (
                            <span className="view-mode-badge filter-active">
                                🎯 Filtered Date: {filterDate}
                            </span>
                        ) : (
                            <span className="view-mode-badge">
                                Showing 3 days per view • Page {pagination.page} of {pagination.totalPages}
                            </span>
                        )}
                    </div>
                </div>

                {/* Server-side Pagination Toolbar */}
                <div className="drawer-actions-bar">
                    <span className="log-count-tag">
                        {filterDate
                            ? `📅 1 Selected Day (${pagination.totalDays} match)`
                            : `📅 ${pagination.totalDays} ${pagination.totalDays === 1 ? 'Day' : 'Days'} Recorded (3 per page)`}
                    </span>
                    {pagination.totalPages > 1 && (
                        <div className="pagination-controls">
                            <button
                                type="button"
                                className="page-nav-btn"
                                onClick={handlePrevPage}
                                disabled={!pagination.hasPrevPage || loading}
                                title="Previous 3 Days"
                            >
                                ◀ Prev 3 Days
                            </button>
                            <span className="page-indicator">
                                Page {pagination.page} / {pagination.totalPages}
                            </span>
                            <button
                                type="button"
                                className="page-nav-btn"
                                onClick={handleNextPage}
                                disabled={!pagination.hasNextPage || loading}
                                title="Next 3 Days"
                            >
                                Next 3 Days ▶
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="drawer-body">
                    {loading ? (
                        <div className="drawer-loading">
                            <span className="spinner" />
                            <p>Loading day-wise task history...</p>
                        </div>
                    ) : days.length === 0 ? (
                        <div className="drawer-empty-state">
                            <span className="empty-icon">📭</span>
                            <h4>No tasks logged yet</h4>
                            <p>
                                Tasks created on your dashboard will appear here day by day,
                                showing tasks completed so far and your daily score!
                            </p>
                        </div>
                    ) : (
                        <div className="day-logs-list">
                            {days.map((day) => {
                                const currentFilter = dayFilters[day.date] || 'all';
                                const filteredTasks = day.tasks.filter((t) => {
                                    if (currentFilter === 'done') return t.done;
                                    if (currentFilter === 'pending') return !t.done;
                                    return true;
                                });

                                return (
                                    <div key={day.date} className="day-card">
                                        {/* Day Card Header */}
                                        <div className="day-card-header">
                                            <div className="day-card-left">
                                                <h3 className="day-date-title">{day.displayDate}</h3>
                                                <span className="day-summary-caption">
                                                    {day.completedTasks} of {day.totalTasks} completed
                                                </span>
                                            </div>

                                            {/* Score Pill with Cool Emoji & Percentage */}
                                            <div
                                                className={`day-score-pill ${
                                                    day.percentage === 100
                                                        ? 'score-perfect'
                                                        : day.percentage >= 60
                                                        ? 'score-high'
                                                        : day.percentage >= 30
                                                        ? 'score-mid'
                                                        : 'score-low'
                                                }`}
                                            >
                                                <span className="score-emoji">{day.emoji}</span>
                                                <span className="score-pct">{day.percentage}%</span>
                                            </div>
                                        </div>

                                        {/* Daily Progress Bar */}
                                        <div className="day-progress-track">
                                            <div
                                                className={`day-progress-bar ${
                                                    day.percentage === 100
                                                        ? 'bar-perfect'
                                                        : day.percentage >= 60
                                                        ? 'bar-high'
                                                        : 'bar-standard'
                                                }`}
                                                style={{ width: `${day.percentage}%` }}
                                            />
                                        </div>

                                        {/* Status Message */}
                                        <div className="day-status-indicator">
                                            <span className="status-label-text">{day.statusLabel}</span>
                                        </div>

                                        {/* Filter Tabs for Day: All / Done / Pending */}
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
                                                className={`day-tab-btn ${currentFilter === 'done' ? 'active' : ''}`}
                                                onClick={() => setFilterForDay(day.date, 'done')}
                                            >
                                                ✅ Done ({day.completedTasks})
                                            </button>
                                            <button
                                                type="button"
                                                className={`day-tab-btn ${currentFilter === 'pending' ? 'active' : ''}`}
                                                onClick={() => setFilterForDay(day.date, 'pending')}
                                            >
                                                ⏳ Pending ({day.pendingTasks})
                                            </button>
                                        </div>

                                        {/* Task Items List */}
                                        <div className="day-tasks-container">
                                            {filteredTasks.length === 0 ? (
                                                <div className="day-empty-tasks">
                                                    <span>No {currentFilter} tasks for this day</span>
                                                </div>
                                            ) : (
                                                filteredTasks.map((task) => {
                                                    const taskTime = new Date(task.time);
                                                    const formattedTime = taskTime.toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    });

                                                    return (
                                                        <div
                                                            key={task.id}
                                                            className={`task-row-item ${task.done ? 'task-row-done' : 'task-row-pending'}`}
                                                        >
                                                            <div className="task-row-status-icon">
                                                                {task.done ? '✅' : '⭕'}
                                                            </div>
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
                                                                </div>
                                                            </div>
                                                            <div className="task-row-badge">
                                                                {task.done ? (
                                                                    <span className="done-pill">Completed</span>
                                                                ) : (
                                                                    <span className="pending-pill">Pending</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Bottom Pagination for convenience when list is long */}
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
