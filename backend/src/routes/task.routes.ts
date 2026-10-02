import { Router } from 'express';
import { taskController } from '../controllers/task.controller';
import { userAuthMiddleware } from '../middleware/user.middleware';
import { validate } from '../middleware/validate';
import {
    createTaskSchema,
    updateTaskSchema,
    toggleTaskSchema,
} from '../payloadSchema/task.schema';

const taskRouter = Router();

taskRouter.get('/', userAuthMiddleware, taskController.getTasks);
taskRouter.post('/', userAuthMiddleware, validate(createTaskSchema), taskController.createTask);
taskRouter.get('/:id', userAuthMiddleware, taskController.getTaskById);
taskRouter.patch('/:id', userAuthMiddleware, validate(updateTaskSchema), taskController.updateTask);
taskRouter.patch('/:id/toggle', userAuthMiddleware, validate(toggleTaskSchema), taskController.toggleTask);
taskRouter.delete('/:id', userAuthMiddleware, taskController.deleteTask);

export default taskRouter;