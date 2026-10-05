import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import type { CreateTaskDTO, PriorityLevel, Task, UpdateTaskDTO } from '../../types';
import './TaskModal.css';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateTaskDTO | UpdateTaskDTO) => Promise<void>;
    initialTask?: Task | null;
    defaultDate?: string; // 'YYYY-MM-DD'
}

export function TaskModal({ isOpen, onClose, onSubmit, initialTask, defaultDate }: TaskModalProps) {
    const isEdit = Boolean(initialTask);
    const [topic, setTopic] = useState('');
    const [time, setTime] = useState('');
    const [loc, setLoc] = useState('');
    const [remarks, setRemarks] = useState('');
    const [pri, setPri] = useState<PriorityLevel>(3);
    const [assigner, setAssigner] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const pad = (n: number) => String(n).padStart(2, '0');

        if (initialTask) {
            setTopic(initialTask.topic || '');
            setLoc(initialTask.loc || '');
            setRemarks(initialTask.remarks || '');
            setPri(initialTask.pri || 3);
            setAssigner(initialTask.assigner || '');
            // Format time for datetime-local input
            const d = new Date(initialTask.time);
            const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            setTime(localIso);
        } else {
            // If defaultDate is provided, create initial datetime on that day
            let baseDate = new Date(Date.now() + 3600000);
            if (defaultDate) {
                const parts = defaultDate.split('-').map(Number);
                if (parts.length === 3 && !parts.some(isNaN)) {
                    const now = new Date();
                    baseDate = new Date(parts[0], parts[1] - 1, parts[2], now.getHours() + 1, now.getMinutes());
                }
            }
            const localIso = `${baseDate.getFullYear()}-${pad(baseDate.getMonth() + 1)}-${pad(baseDate.getDate())}T${pad(baseDate.getHours())}:${pad(baseDate.getMinutes())}`;
            setTopic('');
            setTime(localIso);
            setLoc('');
            setRemarks('');
            setPri(3);
            setAssigner('');
        }
        setError(null);
    }, [initialTask, isOpen, defaultDate]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!topic.trim()) {
            setError('Topic is required');
            return;
        }

        if (!time) {
            setError('Time is required');
            return;
        }

        setSubmitting(true);
        try {
            const isoTime = new Date(time).toISOString();
            await onSubmit({
                topic: topic.trim(),
                time: isoTime,
                loc: loc.trim(),
                remarks: remarks.trim(),
                pri,
                assigner: assigner.trim(),
            });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save task');
        } finally {
            setSubmitting(false);
        }
    };

    const priorities: Array<{
        level: PriorityLevel;
        title: string;
        emoji: string;
        desc: string;
        colorClass: string;
    }> = [
        { level: 1, title: 'P1 CRITICAL', emoji: '👹', desc: 'Hourly alerts + high adrenaline', colorClass: 'modal-pri-1' },
        { level: 2, title: 'P2 HIGH', emoji: '⚡', desc: 'Approaching deadline', colorClass: 'modal-pri-2' },
        { level: 3, title: 'P3 NORMAL', emoji: '🎯', desc: 'Standard workflow', colorClass: 'modal-pri-3' },
        { level: 4, title: 'P4 LOW', emoji: '🌿', desc: 'Backlog / leisure', colorClass: 'modal-pri-4' },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'Edit Task' : 'Add Task'}
            subtitle={isEdit ? 'Update details and priority urgency' : 'Add a task to start tracking and receiving hourly reminders'}
            maxWidth="600px"
        >
            <form onSubmit={handleSubmit} className="task-form">
                {error && <div className="modal-error-banner">{error}</div>}

                {/* Priority Selector */}
                <div className="form-group">
                    <label className="form-label">Urgency & Priority Mood</label>
                    <div className="priority-selector-grid">
                        {priorities.map((item) => (
                            <button
                                key={item.level}
                                type="button"
                                className={`pri-option-card ${item.colorClass} ${pri === item.level ? 'selected-pri' : ''}`}
                                onClick={() => setPri(item.level)}
                            >
                                <span className="pri-card-emoji">{item.emoji}</span>
                                <div className="pri-card-info">
                                    <span className="pri-card-title">{item.title}</span>
                                    <span className="pri-card-desc">{item.desc}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Topic */}
                <Input
                    label="Task Topic / Goal *"
                    placeholder="e.g. Deliver critical Q3 financial model to board"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    maxLength={80}
                    required
                />

                {/* Date & Time */}
                <div className="form-group">
                    <label className="form-label">Target Due Time *</label>
                    <input
                        type="datetime-local"
                        className="custom-datetime-input"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        required
                    />
                </div>

                {/* Location & Assigner in 2-col grid */}
                <div className="form-row-2">
                    <Input
                        label="Location (Optional)"
                        placeholder="e.g. Conference Room A / Zoom"
                        value={loc}
                        onChange={(e) => setLoc(e.target.value)}
                        maxLength={80}
                    />
                    <Input
                        label="Assigner (Optional)"
                        placeholder="e.g. VP Engineering"
                        value={assigner}
                        onChange={(e) => setAssigner(e.target.value)}
                        maxLength={60}
                    />
                </div>

                {/* Remarks */}
                <div className="form-group">
                    <label className="form-label">Remarks / Special Notes</label>
                    <textarea
                        className="custom-textarea"
                        placeholder="Additional context, action items, or prerequisites..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        maxLength={400}
                        rows={3}
                    />
                </div>

                {/* Submit Actions */}
                <div className="modal-actions-row">
                    <Button variant="ghost" type="button" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button variant={pri === 1 ? 'p1' : 'primary'} type="submit" loading={submitting}>
                        {isEdit ? 'Save Changes' : 'Add Task'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
