import { v4 as uuid } from 'uuid';

export type RedisConfig = { host: string; port: number };

export const createUuid = () => {
  return uuid();
};

export const createTaskId = () => {
  return createUuid();
};

export const createWorkerId = () => {
  return createUuid();
};

export const sleep = async (n: number) => {
  await new Promise((r) => setTimeout(r, n));
};
