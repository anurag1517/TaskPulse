import { z } from 'zod';

export const createLogSchema = z.object({
    msg: z.string().trim().min(1, 'Log message is required'),
    icon: z.string().trim().max(10).optional().default('📝'),
});

export type CreateLogInput = z.infer<typeof createLogSchema>;
