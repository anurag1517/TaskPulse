import { Request, Response, NextFunction } from 'express';
import { pushService } from '../services/push.service';
import { PushSubscriptionInput } from '../payloadSchema/push.schema';

class PushController {
    subscribe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.id;
            const input: PushSubscriptionInput = req.body;

            const subscription = await pushService.subscribe(
                userId,
                input.endpoint,
                input.keys.p256dh,
                input.keys.auth
            );

            res.status(201).json({
                success: true,
                message: 'Push subscription registered successfully',
                data: subscription,
            });
        } catch (error) {
            next(error);
        }
    };

    unsubscribe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.id;
            const { endpoint } = req.body;

            if (!endpoint || typeof endpoint !== 'string') {
                res.status(400).json({ error: 'Endpoint is required' });
                return;
            }

            const result = await pushService.unsubscribe(userId, endpoint);

            res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    };

    getPublicKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.status(200).json({
                success: true,
                publicKey: process.env.VAPID_PUBLIC_KEY || '',
            });
        } catch (error) {
            next(error);
        }
    };
}

export const pushController = new PushController();
