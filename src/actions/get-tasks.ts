import { Redis } from 'ioredis';
import { forEach, map, filter } from 'lodash';
import { deSerializeTask } from '../domain/deserialize-task';
import { Task } from '../domain/task';
import { getTaskKey } from '../utils/keys';
import { exec } from '../utils/redis';

export const getTasks = async ({
  queue,
  taskIds,
  client,
}: {
  queue: string;
  taskIds: string[];
  client: Redis;
}): Promise<Task[]> => {
  const multi = client.multi();
  forEach(taskIds, (taskId) => {
    multi.get(getTaskKey({ taskId, queue }));
  });
  const results = await exec(multi);
  const nonNullResults = filter(results, (result) => !!result) as string[];
  const tasks = map(nonNullResults, (taskString) =>
    deSerializeTask(taskString),
  );
  return tasks;
};
