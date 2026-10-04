export interface BacklogTask {
    id: number;
    topic: string;
    pri: number;
    time: string; // ISO date string
    loc?: string | null;
    remarks?: string | null;
    done: boolean;
    assigner?: string | null;
}

export interface DayWiseBacklog {
    date: string;
    displayDate: string;
    isOverdue: boolean;
    isToday: boolean;
    isFuture: boolean;
    totalTasks: number;
    p1Count: number;
    p2Count: number;
    p3Count: number;
    p4Count: number;
    emoji: string;
    statusLabel: string;
    tasks: BacklogTask[];
}

export interface BacklogPagination {
    page: number;
    limit: number;
    totalDays: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface BacklogStats {
    totalBacklog: number;
    overdueCount: number;
    todayCount: number;
    futureCount: number;
    p1Count: number;
    p2Count: number;
    p3Count: number;
    p4Count: number;
}

export interface DayWiseBacklogResponse {
    success: boolean;
    pagination: BacklogPagination;
    data: DayWiseBacklog[];
    stats: BacklogStats;
}
