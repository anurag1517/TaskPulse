import { Router } from 'express';
import { pushController } from '../controllers/push.controller';
import { userAuthMiddleware } from '../middleware/user.middleware';
import { validate } from '../middleware/validate';
import { pushSubscriptionSchema } from '../payloadSchema/push.schema';

const pushRouter = Router();

pushRouter.get('/public-key', pushController.getPublicKey);
pushRouter.post('/subscribe', userAuthMiddleware, validate(pushSubscriptionSchema), pushController.subscribe);
pushRouter.post('/unsubscribe', userAuthMiddleware, pushController.unsubscribe);

export default pushRouter;
