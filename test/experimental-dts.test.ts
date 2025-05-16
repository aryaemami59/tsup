import * as childProcess from 'node:child_process'
import * as path from 'node:path'
import { promisify } from 'node:util'
import { test } from 'vitest'
import type { Options } from '../src/index.js'
import { getTestName, run } from './utils.js'

const exec = promisify(childProcess.exec)

test.for([
  { moduleResolution: 'NodeNext', moduleKind: 'NodeNext' },
  { moduleResolution: 'Node16', moduleKind: 'Node16' },
  { moduleResolution: 'Bundler', moduleKind: 'ESNext' },
  { moduleResolution: 'Bundler', moduleKind: 'Preserve' },
  { moduleResolution: 'Node10', moduleKind: 'ESNext' },
  { moduleResolution: 'Node10', moduleKind: 'CommonJS' },
  { moduleResolution: 'Node', moduleKind: 'ESNext' },
  { moduleResolution: 'Node', moduleKind: 'CommonJS' },
] as const)(
  "experimentalDts works with TypeScript's $moduleResolution module resolution and module set to $moduleKind",
  async ({ moduleResolution, moduleKind }, { expect, task }) => {
    const { getFileContent, outFiles } = await run(
      getTestName(),
      {
        'src/types.ts': `export type Person = { name: string }`,
        'src/index.ts': `export const foo = [1, 2, 3]\nexport type { Person } from './types.js'`,
        'tsup.config.ts': `export default ${JSON.stringify(
          {
            name: task.name,
            entry: { index: 'src/index.ts' },
            format: ['esm', 'cjs'],
            experimentalDts: true,
          } satisfies Options,
          null,
          2,
        )}`,
        'package.json': JSON.stringify(
          {
            name: 'testing-experimental-dts',
            description: task.name,
            type: 'module',
          },
          null,
          2,
        ),
        'tsconfig.json': JSON.stringify(
          {
            compilerOptions: {
              module: moduleKind,
              moduleResolution,
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
      // '_tsup-dts-rollup.d.cts',
      // '_tsup-dts-rollup.d.ts',
      'index.cjs',
      'index.d.cts',
      'index.d.ts',
      'index.js',
    ])

    const indexDtsContent = `export declare const foo: number[];\n\nexport declare type Person = {\n    name: string;\n};\n\nexport { }\n`

    expect(await getFileContent('dist/index.d.ts')).toStrictEqual(
      indexDtsContent,
    )

    expect(await getFileContent('dist/index.d.cts')).toStrictEqual(
      indexDtsContent,
    )
  },
)

test('experimentalDts works when `entry` is set to an array', async ({
  expect,
  task,
}) => {
  const { getFileContent, outFiles, outDir } = await run(
    getTestName(),
    {
      'src/types.ts': `export type Person = { name: string }`,
      'src/index.ts': `export const foo = [1, 2, 3]\nexport type { Person } from './types.js'`,
      'tsup.config.ts': `export default ${JSON.stringify(
        {
          name: task.name,
          entry: ['src/index.ts'],
          format: ['esm', 'cjs'],
          experimentalDts: true,
        } satisfies Options,
        null,
        2,
      )}`,
      'package.json': JSON.stringify(
        {
          name: 'testing-experimental-dts-entry-array',
          description: task.name,
          type: 'module',
          version: '0.0.1',
          main: 'dist/index.js',
          types: 'dist/index.d.ts',
          exports: {
            '.': {
              import: {
                types: './dist/index.d.ts',
                default: './dist/index.js',
              },
              require: {
                types: './dist/index.d.cts',
                default: './dist/index.cjs',
              },
            },

            './package.json': './package.json',
          },
          files: ['dist'],
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
    // '_tsup-dts-rollup.d.cts',
    // '_tsup-dts-rollup.d.ts',
    'index.cjs',
    'index.d.cts',
    'index.d.ts',
    'index.js',
  ])

  const indexDtsContent = `export declare const foo: number[];\n\nexport declare type Person = {\n    name: string;\n};\n\nexport { }\n`

  expect(await getFileContent('dist/index.d.ts')).toStrictEqual(indexDtsContent)

  expect(await getFileContent('dist/index.d.cts')).toStrictEqual(
    indexDtsContent,
  )

  await expect(
    exec('npx -y @arethetypeswrong/cli -P', {
      cwd: path.dirname(outDir),
    }),
  ).resolves.not.toThrow()
})

test('experimentalDts works when `entry` is set to an array of globs', async ({
  expect,
  task,
}) => {
  const { getFileContent, outFiles } = await run(
    getTestName(),
    {
      'src/types.ts': `export type Person = { name: string }`,
      'src/index.ts': `export const foo = [1, 2, 3]\nexport type { Person } from './types.js'`,
      'tsup.config.ts': `export default ${JSON.stringify(
        {
          name: task.name,
          entry: ['src/**/*.ts'],
          format: ['esm', 'cjs'],
          experimentalDts: true,
        } satisfies Options,
        null,
        2,
      )}`,
      'package.json': JSON.stringify(
        {
          name: 'entry-array-of-globs',
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
    // '_tsup-dts-rollup.d.cts',
    // '_tsup-dts-rollup.d.ts',
    'index.cjs',
    'index.d.cts',
    'index.d.ts',
    'index.js',
    'types.cjs',
    'types.d.cts',
    'types.d.ts',
    'types.js',
  ])

  const indexDtsContent = `export declare const foo: number[];\n\nexport declare type Person = {\n    name: string;\n};\n\nexport { }\n`

  const typesDtsContent = `export declare type Person = {\n    name: string;\n};\n\nexport { }\n`

  expect(await getFileContent('dist/index.d.ts')).toStrictEqual(indexDtsContent)

  expect(await getFileContent('dist/index.d.cts')).toStrictEqual(
    indexDtsContent,
  )

  expect(await getFileContent('dist/types.d.ts')).toStrictEqual(typesDtsContent)

  expect(await getFileContent('dist/types.d.cts')).toStrictEqual(
    typesDtsContent,
  )
})

test('experimentalDts.entry can work independent from `options.entry`', async ({
  expect,
  task,
}) => {
  const { getFileContent, outFiles } = await run(
    getTestName(),
    {
      'src/types.ts': `export type Person = { name: string }`,
      'src/index.ts': `export const foo = [1, 2, 3]\nexport type { Person } from './types.js'`,
      'tsup.config.ts': `export default ${JSON.stringify(
        {
          name: task.name,
          entry: ['src/**/*.ts'],
          format: ['esm', 'cjs'],
          experimentalDts: { entry: { index: 'src/index.ts' } },
        } satisfies Options,
        null,
        2,
      )}`,
      'package.json': JSON.stringify(
        {
          name: 'testing-experimental-dts-entry-can-work-independent',
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
    // '_tsup-dts-rollup.d.cts',
    // '_tsup-dts-rollup.d.ts',
    'index.cjs',
    'index.d.cts',
    'index.d.ts',
    'index.js',
    'types.cjs',
    'types.js',
  ])

  const indexDtsContent = `export declare const foo: number[];\n\nexport declare type Person = {\n    name: string;\n};\n\nexport { }\n`

  expect(await getFileContent('dist/index.d.ts')).toStrictEqual(indexDtsContent)

  expect(await getFileContent('dist/index.d.cts')).toStrictEqual(
    indexDtsContent,
  )
})

test('experimentalDts.entry can be an array of globs', async ({
  expect,
  task,
}) => {
  const { getFileContent, outFiles } = await run(
    getTestName(),
    {
      'src/types.ts': `export type Person = { name: string }`,
      'src/index.ts': `export const foo = [1, 2, 3]\nexport type { Person } from './types.js'`,
      'tsup.config.ts': `export default ${JSON.stringify(
        {
          name: task.name,
          entry: { index: 'src/index.ts' },
          format: ['esm', 'cjs'],
          experimentalDts: { entry: ['src/**/*.ts'] },
        } satisfies Options,
        null,
        2,
      )}`,
      'package.json': JSON.stringify(
        {
          name: 'testing-experimental-dts-entry-array-of-globs',
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
    // '_tsup-dts-rollup.d.cts',
    // '_tsup-dts-rollup.d.ts',
    'index.cjs',
    'index.d.cts',
    'index.d.ts',
    'index.js',
    'types.d.cts',
    'types.d.ts',
  ])

  const indexDtsContent = `export declare const foo: number[];\n\nexport declare type Person = {\n    name: string;\n};\n\nexport { }\n`

  expect(await getFileContent('dist/index.d.ts')).toStrictEqual(indexDtsContent)

  expect(await getFileContent('dist/index.d.cts')).toStrictEqual(
    indexDtsContent,
  )
})

test('experimentalDts can be a string', async ({ expect, task }) => {
  const { getFileContent, outFiles } = await run(
    getTestName(),
    {
      'src/types.ts': `export type Person = { name: string }`,
      'src/index.ts': `export const foo = [1, 2, 3]\nexport type { Person } from './types.js'`,
      'tsup.config.ts': `export default ${JSON.stringify(
        {
          name: task.name,
          entry: ['src/**/*.ts'],
          format: ['esm', 'cjs'],
          experimentalDts: 'src/index.ts',
        } satisfies Options,
        null,
        2,
      )}`,
      'package.json': JSON.stringify(
        {
          name: 'testing-experimental-dts-can-be-a-string',
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
    // '_tsup-dts-rollup.d.cts',
    // '_tsup-dts-rollup.d.ts',
    'index.cjs',
    'index.d.cts',
    'index.d.ts',
    'index.js',
    'types.cjs',
    'types.js',
  ])

  const indexDtsContent = `export declare const foo: number[];\n\nexport declare type Person = {\n    name: string;\n};\n\nexport { }\n`

  expect(await getFileContent('dist/index.d.ts')).toStrictEqual(indexDtsContent)

  expect(await getFileContent('dist/index.d.cts')).toStrictEqual(
    indexDtsContent,
  )
})

test('experimentalDts can be a string of glob pattern', async ({
  expect,
  task,
}) => {
  const { getFileContent, outFiles } = await run(
    getTestName(),
    {
      'src/types.ts': `export type Person = { name: string }`,
      'src/index.ts': `export const foo = [1, 2, 3]\nexport type { Person } from './types.js'`,
      'tsup.config.ts': `export default ${JSON.stringify(
        {
          name: task.name,
          entry: { index: 'src/index.ts' },
          format: ['esm', 'cjs'],
          experimentalDts: 'src/**/*.ts',
        } satisfies Options,
        null,
        2,
      )}`,
      'package.json': JSON.stringify(
        {
          name: 'testing-experimental-dts-can-be-a-string-of-glob-pattern',
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
    // '_tsup-dts-rollup.d.cts',
    // '_tsup-dts-rollup.d.ts',
    'index.cjs',
    'index.d.cts',
    'index.d.ts',
    'index.js',
    'types.d.cts',
    'types.d.ts',
  ])

  const indexDtsContent = `export declare const foo: number[];\n\nexport declare type Person = {\n    name: string;\n};\n\nexport { }\n`

  expect(await getFileContent('dist/index.d.ts')).toStrictEqual(indexDtsContent)

  expect(await getFileContent('dist/index.d.cts')).toStrictEqual(
    indexDtsContent,
  )
})

test('experimentalDts.entry can be a string of glob pattern', async ({
  expect,
  task,
}) => {
  const { getFileContent, outFiles } = await run(
    getTestName(),
    {
      'src/types.ts': `export type Person = { name: string }`,
      'src/index.ts': `export const foo = [1, 2, 3]\nexport type { Person } from './types.js'`,
      'tsup.config.ts': `export default ${JSON.stringify(
        {
          name: task.name,
          entry: { index: 'src/index.ts' },
          format: ['esm', 'cjs'],
          experimentalDts: { entry: 'src/**/*.ts' },
        } satisfies Options,
        null,
        2,
      )}`,
      'package.json': JSON.stringify(
        {
          name: 'testing-experimental-dts-entry-can-be-a-string-of-glob-pattern',
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
    // '_tsup-dts-rollup.d.cts',
    // '_tsup-dts-rollup.d.ts',
    'index.cjs',
    'index.d.cts',
    'index.d.ts',
    'index.js',
    'types.d.cts',
    'types.d.ts',
  ])

  const indexDtsContent = `export declare const foo: number[];\n\nexport declare type Person = {\n    name: string;\n};\n\nexport { }\n`

  expect(await getFileContent('dist/index.d.ts')).toStrictEqual(indexDtsContent)

  expect(await getFileContent('dist/index.d.cts')).toStrictEqual(
    indexDtsContent,
  )
})

test('Removal of _tsup-dts-rollup does not break multiple-entrypoint packages', async ({
  expect,
  task,
}) => {
  const { getFileContent, outFiles } = await run(
    getTestName(),
    {
      'src/types.ts': `export type Person = { name: string }`,
      'src/index.ts': `export const foo = [1, 2, 3]\nexport type { Person } from './types.js'`,
      'tsup.config.ts': `export default ${JSON.stringify(
        {
          name: task.name,
          entry: { index: 'src/index.ts' },
          format: ['esm', 'cjs'],
          experimentalDts: { entry: 'src/**/*.ts' },
        } satisfies Options,
        null,
        2,
      )}`,
      'package.json': JSON.stringify(
        {
          name: 'testing-experimental-dts-entry-can-be-a-string-of-glob-pattern',
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
    'index.cjs',
    'index.d.cts',
    'index.d.ts',
    'index.js',
    'types.d.cts',
    'types.d.ts',
  ])

  const indexDtsContent = `export declare const foo: number[];\n\nexport declare type Person = {\n    name: string;\n};\n\nexport { }\n`

  expect(await getFileContent('dist/index.d.ts')).toStrictEqual(indexDtsContent)

  expect(await getFileContent('dist/index.d.cts')).toStrictEqual(
    indexDtsContent,
  )
})
