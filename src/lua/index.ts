import fs from 'fs';
import util from 'util';
import path from 'path';
import { Redis } from 'ioredis';
import { map } from 'lodash';

const readFile = util.promisify(fs.readFile);

export const loadScripts = async ({ client }: { client: Redis }) => {
  const commandDefinitions = [
    {
      name: 'takeTask',
      filePath: './take-task.lua',
      numberOfKeys: 8,
    },
    {
      name: 'markTaskProcessing',
      filePath: './mark-task-processing.lua',
      numberOfKeys: 7,
    },
  ];
  await Promise.all(
    map(commandDefinitions, async ({ name, filePath, numberOfKeys }) => {
      const script = await readFile(path.join(__dirname, filePath), 'utf8');
      client.defineCommand(name, {
        numberOfKeys,
        lua: script,
      });
    }),
  );
  return client;
};