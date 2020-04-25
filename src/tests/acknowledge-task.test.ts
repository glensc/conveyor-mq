/* eslint-disable @typescript-eslint/no-non-null-assertion */
import redis from 'redis';
import { isTaskStalled } from '../actions/is-task-stalled';
import { acknowledgeTask } from '../actions/acknowledge-task';
import { flushAll, quit } from '../utils/redis';
import { sleep, createUuid } from '../utils/general';

describe('acknowledgeTask', () => {
  const client = redis.createClient({ host: '127.0.0.1', port: 9004 });
  const queue = createUuid();

  beforeEach(async () => {
    await flushAll({ client });
  });

  afterAll(async () => {
    await quit({ client });
  });

  it('acknowledgeTask acknowledges task', async () => {
    const task = { id: 'b', data: 'c' };
    expect(await isTaskStalled({ taskId: task.id, queue, client })).toBe(true);
    await acknowledgeTask({ taskId: task.id, queue, client, ttl: 50 });
    expect(await isTaskStalled({ taskId: task.id, queue, client })).toBe(false);
    await sleep(50);
    expect(await isTaskStalled({ taskId: task.id, queue, client })).toBe(true);
  });
});
