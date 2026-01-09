import { exec, execSync } from 'node:child_process';
import { createRequire } from 'node:module';

import { expect, test } from 'vitest';

import { compile } from './test-helpers';

const require = createRequire(import.meta.url);

test('dist', async () => {
  execSync('npm run build');

  await compile(new (require(import.meta.dirname + '/../../dist/index').default)());

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
