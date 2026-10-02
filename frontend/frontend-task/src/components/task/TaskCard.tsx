import type { Task, PriorityLevel } from '../../types';
import './TaskCard.css';

interface TaskCardProps {
    task: Task;
    onToggle: (id: number) => void;
    onEdit: (task: Task) => void;
    onDelete: (id: number) => void;
}

export function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
    const getPriorityConfig = (pri: PriorityLevel) => {
        switch (pri) {
            case 1:
                return {
                    label: 'P1 CRITICAL',
                    emoji: '👹',
                    className: 'task-p1',
                    badgeColor: 'var(--p1-base)',
                };
            case 2:
                return {
                    label: 'P2 HIGH',
                    emoji: '⚡',
                    className: 'task-p2',
                    badgeColor: 'var(--p2-base)',
                };
            case 3:
                return {
                    label: 'P3 NORMAL',
                    emoji: '🎯',
                    className: 'task-p3',
                    badgeColor: 'var(--p3-base)',
                };
            case 4:
            default:
                return {
                    label: 'P4 LOW',
                    emoji: '🌿',
                    className: 'task-p4',
                    badgeColor: 'var(--p4-base)',
                };
        }
    };

    const config = getPriorityConfig(task.pri);
    const taskDate = new Date(task.time);
    const isOverdue = !task.done && taskDate.getTime() < Date.now();

    return (
        <article className={`task-card ${config.className} ${task.done ? 'task-done' : ''}`}>
            {/* Header: Priority Badge + Mood Avatar */}
            <div className="task-card-header">
                <div className="task-mood-badge">
                    <span className="task-mood-emoji">{config.emoji}</span>
                    <span className="task-priority-tag">{config.label}</span>
                </div>

                <div className="task-header-right">
                    {!task.done && (
                        <span className="task-reminder-chip" title="Hourly push reminder is enabled for this task">
                            🔔 Hourly Alert
                        </span>
                    )}
                    <span className={`task-time-badge ${isOverdue ? 'time-overdue' : ''}`}>
                        {taskDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {taskDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* Main Topic & Checkbox */}
            <div className="task-card-main">
                <button
                    type="button"
                    className={`task-checkbox ${task.done ? 'checkbox-checked' : ''}`}
                    onClick={() => onToggle(task.id)}
                    aria-label={task.done ? 'Mark as incomplete' : 'Mark as completed'}
                >
                    {task.done ? '✓' : ''}
                </button>

                <div className="task-topic-content">
                    <h3 className="task-topic-text">{task.topic}</h3>
                    {task.remarks && <p className="task-remarks-text">{task.remarks}</p>}
                </div>
            </div>

            {/* Footer Metadata: Location & Assigner */}
            <div className="task-card-footer">
                <div className="task-meta-tags">
                    {task.loc && (
                        <span className="meta-chip meta-loc">
                            <span className="meta-icon">📍</span>
                            {task.loc}
                        </span>
                    )}
                    {task.assigner && (
                        <span className="meta-chip meta-assigner">
                            <span className="meta-icon">👤</span>
                            {task.assigner}
                        </span>
                    )}
                </div>

                <div className="task-card-actions">
                    <button
                        type="button"
                        className="card-action-btn edit-btn"
                        onClick={() => onEdit(task)}
                        title="Edit task"
                    >
                        ✏️
                    </button>
                    <button
                        type="button"
                        className="card-action-btn delete-btn"
                        onClick={() => onDelete(task.id)}
                        title="Delete task"
                    >
                        🗑️
                    </button>
                </div>
            </div>
        </article>
    );
}
