/* eslint-disable @typescript-eslint/no-non-null-assertion */
import redis from 'redis';
import { map } from 'lodash';
import { flushAll, quit } from '../utils/redis';
import { createUuid } from '../utils/general';
import { putTask } from '../actions/put-task';
import { getTasks } from '../actions/get-tasks';

describe('getTasks', () => {
  const client = redis.createClient({ host: '127.0.0.1', port: 9004 });
  const queue = createUuid();

  beforeEach(async () => {
    await flushAll({ client });
  });

  afterAll(async () => {
    await quit({ client });
  });

  it('getTasks gets tasks', async () => {
    const puttedTasks = await Promise.all(
      map(Array.from({ length: 10 }), async (i, index) => {
        return putTask({
          queue,
          task: { id: `task ${index}`, data: 'some-data' },
          client,
        });
      }),
    );
    const tasks = await getTasks({
      queue,
      taskIds: map(puttedTasks, (task) => task.id),
      client,
    });
    expect(tasks.length).toBe(10);
  });
});
