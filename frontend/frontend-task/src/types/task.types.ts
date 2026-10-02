export type PriorityLevel = 1 | 2 | 3 | 4;

export interface Task {
    id: number;
    userId: number;
    topic: string;
    time: string; // ISO date string
    loc?: string | null;
    remarks?: string | null;
    pri: PriorityLevel;
    done: boolean;
    assigner?: string | null;
    lastRem?: number;
}

export interface CreateTaskDTO {
    topic: string;
    time: string; // ISO date string
    loc?: string;
    remarks?: string;
    pri?: PriorityLevel;
    done?: boolean;
    assigner?: string;
}

export interface UpdateTaskDTO {
    topic?: string;
    time?: string;
    loc?: string;
    remarks?: string;
    pri?: PriorityLevel;
    done?: boolean;
    assigner?: string;
}

export interface TaskFilterOptions {
    done?: boolean;
    pri?: PriorityLevel;
    search?: string;
}
