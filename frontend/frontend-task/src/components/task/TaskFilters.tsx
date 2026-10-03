import type { PriorityLevel } from '../../types';
import './TaskFilters.css';

interface TaskFiltersProps {
    activeFilter: 'all' | PriorityLevel | 'done';
    onFilterChange: (filter: 'all' | PriorityLevel | 'done') => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    counts: {
        all: number;
        p1: number;
        p2: number;
        p3: number;
        p4: number;
        done: number;
    };
    allLabel?: string;
}

export function TaskFilters({
    activeFilter,
    onFilterChange,
    searchQuery,
    onSearchChange,
    counts,
    allLabel,
}: TaskFiltersProps) {
    const filterOptions: Array<{
        id: 'all' | PriorityLevel | 'done';
        label: string;
        emoji: string;
        count: number;
        badgeClass: string;
    }> = [
        { id: 'all', label: allLabel || 'All Tasks', emoji: '⚡', count: counts.all, badgeClass: 'badge-all' },
        { id: 1, label: 'P1 Urgent', emoji: '👹', count: counts.p1, badgeClass: 'badge-p1' },
        { id: 2, label: 'P2 High', emoji: '⚡', count: counts.p2, badgeClass: 'badge-p2' },
        { id: 3, label: 'P3 Focus', emoji: '🎯', count: counts.p3, badgeClass: 'badge-p3' },
        { id: 4, label: 'P4 Zen', emoji: '🌿', count: counts.p4, badgeClass: 'badge-p4' },
        { id: 'done', label: 'Completed', emoji: '✅', count: counts.done, badgeClass: 'badge-done' },
    ];

    return (
        <section className="filters-section">
            {/* Search Input */}
            <div className="search-bar-wrapper">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search by topic, location, remarks, or assigner..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
                {searchQuery && (
                    <button
                        type="button"
                        className="clear-search-btn"
                        onClick={() => onSearchChange('')}
                        aria-label="Clear search"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Filter Pills */}
            <div className="filter-pills-row">
                {filterOptions.map((opt) => {
                    const isActive = activeFilter === opt.id;
                    return (
                        <button
                            key={String(opt.id)}
                            type="button"
                            className={`filter-pill ${opt.badgeClass} ${isActive ? 'active-pill' : ''}`}
                            onClick={() => onFilterChange(opt.id)}
                        >
                            <span className="pill-emoji">{opt.emoji}</span>
                            <span className="pill-label">{opt.label}</span>
                            <span className="pill-count">{opt.count}</span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
