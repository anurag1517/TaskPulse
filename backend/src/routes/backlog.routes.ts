import { Router } from 'express';
import { backlogController } from '../controllers/backlog.controller';
import { userAuthMiddleware } from '../middleware/user.middleware';

const backlogRouter = Router();

backlogRouter.use(userAuthMiddleware);

backlogRouter.get('/', backlogController.getBacklog);
backlogRouter.post('/:id/move-to-today', backlogController.moveToToday);

export default backlogRouter;
