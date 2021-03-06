import { Pipeline } from 'ioredis';
import { getTaskKey } from '../utils/keys';
import { serializeTask } from '../domain/tasks/serialize-task';
import { Task } from '../domain/tasks/task';

/**
 * @ignore
 */
export const persistTaskMulti = ({
  task,
  queue,
  multi,
}: {
  task: Task;
  queue: string;
  multi: Pipeline;
}) => {
  const taskKey = getTaskKey({ taskId: task.id, queue });
  multi.set(taskKey, serializeTask(task));
};
