import { RedisClient } from 'redis';
import { map, forEach, zipWith } from 'lodash';
import { getTaskAcknowledgedKey } from '../utils/keys';

export const areTasksStalled = async ({
  taskIds,
  queue,
  client,
}: {
  taskIds: string[];
  queue: string;
  client: RedisClient;
}) => {
  const taskAcknowledgeKeys = map(taskIds, (taskId) =>
    getTaskAcknowledgedKey({ taskId, queue }),
  );
  const multi = client.multi();
  forEach(taskAcknowledgeKeys, (key) => {
    multi.exists(key);
  });
  const promise = new Promise((resolve, reject) => {
    multi.exec((err, result) => (err ? reject(err) : resolve(result)));
  }) as Promise<number[]>;
  const results = await promise;
  return zipWith(taskIds, results, (taskId, result) => ({
    taskId,
    isStalled: result === 0,
  }));
};
