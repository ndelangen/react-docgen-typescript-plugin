import { exec } from 'node:child_process';

import { expect, test } from 'vitest';

import ReactDocgenTypeScriptPlugin from '../plugin';
import { compile } from './test-helpers';

test('source', async () => {
  await compile(new ReactDocgenTypeScriptPlugin());

  const process = exec('node --experimental-strip-types src/__tests__/check.ts');

  const out = await new Promise<string>((resolve) => {
    let data = '';
    process.stdout?.on('data', (d) => {
      data += d?.toString() ?? '';
    });
    process.stdout?.on('end', () => {
      resolve(data);
    });
  });

  expect(JSON.parse(out)).toMatchSnapshot();
}, 9000);
