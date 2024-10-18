import { test } from 'vitest'
import type { Options } from '../src/index.js'
import { getTestName, run } from './utils.js'

test('experimentalDts.only works', async ({ expect, task }) => {
  const { outFiles } = await run(
    getTestName(),
    {
      'src/types.ts': `export type Person = { name: string }`,
      'src/index.ts': `export const foo = [1, 2, 3]\nexport type { Person } from './types.js'`,
      'tsup.config.ts': `export default ${JSON.stringify(
        {
          name: task.name,
          entry: { index: 'src/index.ts' },
          format: ['esm', 'cjs'],
          experimentalDts: { only: true },
        } satisfies Options,
        null,
        2,
      )}`,
      'package.json': JSON.stringify(
        {
          name: 'experimental-dts-only-works',
          description: task.name,
          type: 'module',
        },
        null,
        2,
      ),
      'tsconfig.json': JSON.stringify(
        {
          compilerOptions: {
            outDir: './dist',
            rootDir: './src',
            skipLibCheck: true,
            strict: true,
          },
          include: ['src'],
        },
        null,
        2,
      ),
    },
    {
      entry: [],
    },
  )

  expect(outFiles).toStrictEqual([
    '_tsup-dts-rollup.d.cts',
    '_tsup-dts-rollup.d.ts',
    'index.d.cts',
    'index.d.ts',
  ])
})

test('experimental-dts-only cli option works', async ({ expect, task }) => {
  const { outFiles } = await run(
    getTestName(),
    {
      'src/types.ts': `export type Person = { name: string }`,
      'src/index.ts': `export const foo = [1, 2, 3]\nexport type { Person } from './types.js'`,
      'tsup.config.ts': `export default ${JSON.stringify(
        {
          name: task.name,
          format: ['esm', 'cjs'],
        } satisfies Options,
        null,
        2,
      )}`,
      'package.json': JSON.stringify(
        {
          name: 'experimental-dts-only-cli-works',
          description: task.name,
          type: 'module',
        },
        null,
        2,
      ),
      'tsconfig.json': JSON.stringify(
        {
          compilerOptions: {
            outDir: './dist',
            rootDir: './src',
            skipLibCheck: true,
            strict: true,
          },
          include: ['src'],
        },
        null,
        2,
      ),
    },
    {
      entry: ['./src/index.ts'],
      flags: ['--experimental-dts-only'],
    },
  )

  expect(outFiles).toStrictEqual([
    '_tsup-dts-rollup.d.cts',
    '_tsup-dts-rollup.d.ts',
    'index.d.cts',
    'index.d.ts',
  ])
})
