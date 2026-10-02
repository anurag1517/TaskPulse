export interface TaskLog {
    id: number;
    userId: number;
    ts: number;
    icon?: string | null;
    msg?: string | null;
}
