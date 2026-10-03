export interface DayLogTask {
    id: number;
    topic: string;
    pri: number;
    time: string;
    loc?: string | null;
    remarks?: string | null;
    done: boolean;
    assigner?: string | null;
}

export interface DayWiseLog {
    date: string;
    displayDate: string;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    percentage: number;
    emoji: string;
    statusLabel: string;
    tasks: DayLogTask[];
}

export interface LogPagination {
    page: number;
    limit: number;
    totalDays: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface LogStats {
    totalTasksAllTime: number;
    totalCompletedAllTime: number;
    overallPercentage: number;
}

export interface DayWiseLogResponse {
    success: boolean;
    pagination: LogPagination;
    data: DayWiseLog[];
    stats: LogStats;
}

// Keep legacy type for safety
export interface TaskLog {
    id: number;
    userId: number;
    ts: number;
    icon?: string | null;
    msg?: string | null;
}
