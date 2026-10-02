import { Router } from 'express';
import { logController } from '../controllers/log.controller';
import { userAuthMiddleware } from '../middleware/user.middleware';
import { validate } from '../middleware/validate';
import { createLogSchema } from '../payloadSchema/log.schema';

const logRouter = Router();

logRouter.use(userAuthMiddleware);

logRouter.get('/', logController.getLogs);
logRouter.post('/', validate(createLogSchema), logController.createLog);
logRouter.delete('/', logController.clearLogs);

export default logRouter;
