/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { createManager, createWorker } from 'conveyor-mq';
import Queue from 'bee-queue';

const redisConfig = { host: 'localhost', port: 6379 };

const countdown = (n = 1) => {
  let next: () => boolean;
  const done = new Promise((resolve) => {
    next = () => {
      n--;
      if (n < 0) return false;
      if (n === 0) resolve();
      return true;
    };
  });
  return { done, next: () => next() };
};

const benchmarks = {
  processTasks: [
    {
      name: 'Conveyor MQ',
      run: async ({
        numberOfTasks = 1000,
        concurrency = 1,
        handlerTimeout = 0,
      }) => {
        const queue = 'conveyor-mq';
        const manager = await createManager({
          queue,
          redisConfig,
        });
        await manager.enqueueTasks(
          Array.from({ length: numberOfTasks }).map((_, index) => ({
            data: index,
          })),
        );
        const { next, done } = countdown(numberOfTasks);
        const startTime = Date.now();
        const worker = await createWorker({
          queue,
          redisConfig,
          concurrency,
          handler: () => {
            return new Promise((resolve) => {
              setTimeout(() => {
                next();
                resolve('result');
              }, handlerTimeout);
            });
          },
        });
        await done;
        const endTime = Date.now();
        await worker.shutdown();
        return {
          startTime,
          endTime,
          name: 'Conveyor MQ',
        };
      },
    },
    {
      name: 'Bee Queue',
      run: async ({
        numberOfTasks = 1000,
        concurrency = 1,
        handlerTimeout = 0,
      }) => {
        const queue = new Queue('bee-queue');
        const ready = new Promise((resolve) => {
          queue.on('ready', () => {
            resolve();
          });
        });
        await ready;
        await Promise.all(
          Array.from({ length: numberOfTasks }).map(() => {
            return queue.createJob('i').save();
          }),
        );

        const { next, done } = countdown(numberOfTasks);
        const startTime = Date.now();
        queue.process(concurrency, () => {
          return new Promise((resolve) => {
            setTimeout(() => {
              next();
              resolve('result');
            }, handlerTimeout);
          });
        });

        await done;
        const endTime = Date.now();
        await queue.close();
        return {
          startTime,
          endTime,
          name: 'Bee Queue',
        };
      },
    },
  ],
};

const main = async () => {
  const concurrency = 20;
  const numberOfTasks = 1000;
  for (const benchmark of benchmarks.processTasks) {
    const { name, startTime, endTime } = await benchmark.run({
      concurrency,
      numberOfTasks,
      handlerTimeout: 50,
    });
    const time = endTime - startTime;
    console.log(
      `Ran ${numberOfTasks} tasks in ${name} with concurrency ${concurrency} in ${time} ms`,
    );
  }
};

main();
