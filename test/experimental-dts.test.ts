import { test } from 'vitest'
import { getTestName, run } from './utils.js'

test('custom outExtension works with experimentalDts', async ({
  expect,
  task,
}) => {
  const { outFiles } = await run(
    getTestName(),
    {
      'src/types.ts': `export type Person = { name: string }`,
      'src/index.ts': `export const foo = [1, 2, 3]\nexport type { Person } from './types'`,
      'tsup.config.ts': `export default {
        name: '${task.name}',
        entry: { index: 'src/index.ts' },
        format: ['esm', 'cjs'],
        experimentalDts: true,
        outExtension({ format }) {
          return {
            js: format === 'cjs' ? '.cjs' : '.mjs',
            dts: format === 'cjs' ? '.d.cts' : '.d.mts',
          }
        },
      }`,
      'package.json': JSON.stringify(
        {
          name: 'custom-dts-output-extension-with-experimental-dts',
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
            moduleResolution: 'Bundler',
            module: 'ESNext',
            strict: true,
            skipLibCheck: true,
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
    '_tsup-dts-rollup.d.mts',
    'index.cjs',
    'index.d.cts',
    'index.d.mts',
    'index.mjs',
  ])
})
