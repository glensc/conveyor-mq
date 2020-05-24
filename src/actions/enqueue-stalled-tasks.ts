import { Redis } from 'ioredis';
import { map } from 'lodash';
import { serializeTask } from '../domain/tasks/serialize-task';
import {
  getTaskKey,
  getQueuedListKey,
  getProcessingListKey,
  getStallingHashKey,
  getQueuePausedKey,
  getQueueTaskQueuedChannel,
  getPausedListKey,
} from '../utils/keys';
import { exec, callLuaScript } from '../utils/redis';
import { Task } from '../domain/tasks/task';
import { TaskStatuses } from '../domain/tasks/task-statuses';
import { ScriptNames } from '../lua';
import { EventTypes } from '../domain/events/event-types';

/**
 * @ignore
 */
export const enqueueStalledTasks = async ({
  queue,
  tasks,
  client,
}: {
  queue: string;
  tasks: Task[];
  client: Redis;
}): Promise<Task[]> => {
  const tasksToQueue: Task[] = map(tasks, (task) => ({
    ...task,
    queuedOn: new Date(),
    processingStartedOn: undefined,
    processingEndedOn: undefined,
    status: TaskStatuses.Queued,
    retries: (task.retries || 0) + 1,
    stallRetries: (task.stallRetries || 0) + 1,
  }));
  const processingListKey = getProcessingListKey({ queue });
  const multi = client.multi();
  map(tasksToQueue, async (task) => {
    const taskKey = getTaskKey({ taskId: task.id, queue });
    const taskString = serializeTask(task);
    multi.lrem(processingListKey, 1, task.id);
    multi.hdel(getStallingHashKey({ queue }), task.id);
    await callLuaScript({
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
        getQueuePausedKey({ queue }),
        getPausedListKey({ queue }),
      ],
    });
  });
  await exec(multi);
  return tasksToQueue;
};
