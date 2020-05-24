import { Redis, Pipeline } from 'ioredis';
import { map } from 'lodash';
import { serializeTask } from '../domain/tasks/serialize-task';
import {
  getTaskKey,
  getQueuedListKey,
  getQueueTaskQueuedChannel,
} from '../utils/keys';
import { exec, callLuaScript } from '../utils/redis';
import { createTaskId } from '../utils/general';
import { Task } from '../domain/tasks/task';
import { TaskStatuses } from '../domain/tasks/task-statuses';
import { EventTypes } from '../domain/events/event-types';
import { ScriptNames } from '../lua';

/**
 * @ignore
 */
export const enqueueTasksMulti = async ({
  tasks,
  queue,
  multi,
}: {
  tasks: Partial<Task>[];
  queue: string;
  multi: Pipeline;
}): Promise<Task[]> => {
  const tasksToQueue: Task[] = map(tasks, (task) => ({
    ...task,
    id: task.id || createTaskId(),
    createdAt: task.createdAt || new Date(),
    queuedAt: new Date(),
    processingStartedAt: undefined,
    processingEndedAt: undefined,
    status: TaskStatuses.Queued,
    retries: task.retries || 0,
    errorRetries: task.errorRetries || 0,
    errorRetryLimit:
      task.errorRetryLimit === undefined ? 0 : task.errorRetryLimit,
    stallRetries: task.stallRetries || 0,
    stallRetryLimit:
      task.stallRetryLimit === undefined ? 1 : task.stallRetryLimit,
  }));
  await Promise.all(
    map(tasksToQueue, async (task) => {
      const taskKey = getTaskKey({ taskId: task.id, queue });
      const taskString = serializeTask(task);
      return callLuaScript({
        client: multi,
        script: ScriptNames.enqueueTask,
        args: [
          taskKey,
          taskString,
          getQueuedListKey({ queue }),
          getQueueTaskQueuedChannel({ queue }),
          EventTypes.TaskQueued,
          new Date().toISOString(),
          task.id,
        ],
      });
    }),
  );
  return tasksToQueue;
};

/**
 * @ignore
 */
export const enqueueTasks = async ({
  tasks,
  queue,
  client,
}: {
  tasks: Partial<Task>[];
  queue: string;
  client: Redis;
}): Promise<Task[]> => {
  const multi = client.multi();
  const tasksToQueue = await enqueueTasksMulti({ tasks, queue, multi });
  await exec(multi);
  return tasksToQueue;
};
