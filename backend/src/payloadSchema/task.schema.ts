import { z } from 'zod';

export const createTaskSchema = z.object({
    topic: z.string().trim().min(1, 'Topic is required').max(80, 'Topic must be at most 80 characters'),
    time: z.string().datetime({ message: 'Invalid ISO date string for time' }).or(z.date()).transform((val) => new Date(val)),
    loc: z.string().trim().max(80, 'Location must be at most 80 characters').optional().default(''),
    remarks: z.string().trim().max(400, 'Remarks must be at most 400 characters').optional().default(''),
    pri: z.number().int().min(1, 'Priority must be between 1 and 4').max(4, 'Priority must be between 1 and 4').optional().default(3),
    done: z.boolean().optional().default(false),
    assigner: z.string().trim().max(60, 'Assigner must be at most 60 characters').optional().default(''),
});

export const updateTaskSchema = z.object({
    topic: z.string().trim().min(1, 'Topic cannot be empty').max(80, 'Topic must be at most 80 characters').optional(),
    time: z.string().datetime({ message: 'Invalid ISO date string for time' }).or(z.date()).transform((val) => new Date(val)).optional(),
    loc: z.string().trim().max(80, 'Location must be at most 80 characters').optional(),
    remarks: z.string().trim().max(400, 'Remarks must be at most 400 characters').optional(),
    pri: z.number().int().min(1).max(4).optional(),
    done: z.boolean().optional(),
    assigner: z.string().trim().max(60, 'Assigner must be at most 60 characters').optional(),
});

export const toggleTaskSchema = z.object({
    done: z.boolean().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ToggleTaskInput = z.infer<typeof toggleTaskSchema>;
