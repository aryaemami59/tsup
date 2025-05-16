import * as childProcess from 'node:child_process'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { promisify } from 'node:util'
import { test } from 'vitest'
import type { Options } from '../src/index.js'
import { getTestName, run } from './utils.js'

const execFile = promisify(childProcess.execFile)

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
          devDependencies: {
            '@arethetypeswrong/cli': '*',
          },
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
  ])

  const indexDtsContent = `export declare const foo: number[];\n\nexport declare type Person = {\n    name: string;\n};\n\nexport { }\n`

  expect(await getFileContent('dist/index.d.ts')).toStrictEqual(indexDtsContent)

  expect(await getFileContent('dist/index.d.cts')).toStrictEqual(
    indexDtsContent,
  )

  const cwd = path.dirname(outDir)

  expect(
    execFile('pnpm', ['install'], {
      cwd,
      shell: true,
    }),
  ).resolves.not.toThrow()

  const promiseWithChild = execFile('pnpm', ['pack'], {
    cwd,
    shell: true,
  })

  await expect(promiseWithChild).resolves.not.toThrow()

  const { stdout } = await promiseWithChild

  const packedName = stdout.trim().split('\n').pop()

  if (!packedName) {
    throw new Error('No package name found')
  }

  await expect(
    execFile('npx', ['@arethetypeswrong/cli', packedName], {
      cwd,
      shell: true,
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

test('removal of _tsup-dts-rollup does not break multiple-entrypoint packages', async ({
  expect,
  task,
}) => {
  const testName = getTestName().toLowerCase()

  const { getFileContent, outFiles } = await run(
    testName,
    {
      'src/types.ts': `export type Person = { name: string }`,
      'src/index.ts': `export const foo = [1, 2, 3]\nexport type { Person } from './types.js'`,
      'tsup.config.ts': `export default ${JSON.stringify(
        {
          name: testName,
          entry: { index: 'src/index.ts' },
          format: ['esm', 'cjs'],
          experimentalDts: { entry: 'src/**/*.ts' },
        } satisfies Options,
        null,
        2,
      )}`,
      'package.json': JSON.stringify(
        {
          name: testName,
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

test(
  'removal of _tsup-dts-rollup does not break multiple-entrypoint packages1',
  { todo: false },
  async ({ expect, task }) => {
    const testName = getTestName().toLowerCase()

    const folderPath = path.resolve(
      'test/.cache/check-bundled-type-definitions',
    )

    await fs.mkdir(
      path.resolve('test/.cache/check-bundled-type-definitions/my-lib'),
      { recursive: true },
    )

    const files: Record<string, string> = {
      'my-lib/src/foo.ts': `export { SharedClass } from './internal.js'`,
      'my-lib/src/bar.ts': `export { SharedClass } from './internal.js'`,
      'my-lib/src/internal.ts': `export class SharedClass {}`,
      'my-lib/src/index.ts': `export * from './foo.js'\nexport * from './bar.js'`,
      'my-lib/tsup.config.ts': `export default ${JSON.stringify(
        {
          name: testName,
          entry: {
            index: 'src/index.ts',
            foo: 'src/foo.ts',
            bar: 'src/bar.ts',
          },
          splitting: false,
          format: ['esm', 'cjs'],
          experimentalDts: true,
        } satisfies Options,
        null,
        2,
      )}`,
      'my-lib/package.json': JSON.stringify(
        {
          name: 'my-lib',
          description: task.name,
          type: 'module',
          version: '1.0.0',
          files: ['dist'],
          main: 'dist/index.js',
          types: 'dist/index.d.ts',
          exports: {
            './package.json': './package.json',
            '.': {
              import: {
                types: './dist/index.d.ts',
                default: './dist/index.js',
              },
              default: {
                types: './dist/index.d.cts',
                default: './dist/index.cjs',
              },
            },
            './foo': {
              import: {
                types: './dist/foo.d.ts',
                default: './dist/foo.js',
              },
              default: {
                types: './dist/foo.d.cts',
                default: './dist/foo.cjs',
              },
            },
            './bar': {
              import: {
                types: './dist/bar.d.ts',
                default: './dist/bar.js',
              },
              default: {
                types: './dist/bar.d.cts',
                default: './dist/bar.cjs',
              },
            },
          },
        },
        null,
        2,
      ),
      'consuming-library/package.json': JSON.stringify(
        {
          name: 'consuming-library',
          description: 'Consumes my-lib to check its bundled type definitions',
          type: 'module',
          dependencies: {
            'my-lib': 'file:../my-lib/my-lib-1.0.0.tgz',
          },
        },
        null,
        2,
      ),
      'my-lib/tsconfig.json': JSON.stringify(
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
      'consuming-library/tsconfig.json': JSON.stringify(
        {
          compilerOptions: {
            outDir: './dist',
            rootDir: './src',
            declaration: true,
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            noEmitOnError: true,
            skipLibCheck: true,
            strict: true,
          },
          include: ['src'],
        },
        null,
        2,
      ),
      'consuming-library/src/index.ts': `import { type SharedClass as Bar } from 'my-lib/bar'\nimport { SharedClass as Foo } from 'my-lib/foo'\nexport const foo: Foo = new Foo()\nexport const bar: Bar = foo`,
    }

    await Promise.all(
      Object.keys(files).map(async (name) => {
        const filePath = path.resolve(folderPath, name)
        const parentDir = path.dirname(filePath)
        await fs.mkdir(parentDir, { recursive: true })
        return fs.writeFile(filePath, files[name], 'utf8')
      }),
    )

    await expect(
      execFile('node', [path.join(__dirname, '..', 'dist', 'cli-default.js')], {
        cwd: 'test/.cache/check-bundled-type-definitions/my-lib',
        shell: true,
      }),
    ).resolves.not.toThrow()

    await expect(
      execFile('pnpm', ['pack'], {
        cwd: 'test/.cache/check-bundled-type-definitions/my-lib',
        shell: true,
      }),
    ).resolves.not.toThrow()

    await expect(
      execFile('pnpm', ['install'], {
        cwd: 'test/.cache/check-bundled-type-definitions/consuming-library',
        shell: true,
      }),
    ).resolves.not.toThrow()

    await expect(
      execFile('tsc', ['-p', 'tsconfig.json'], {
        cwd: 'test/.cache/check-bundled-type-definitions/consuming-library',
        shell: true,
      }),
    ).resolves.not.toThrow()
  },
)

test(
  'removal of _tsup-dts-rollup does not break multiple-entrypoint packages2',
  { todo: true },
  async ({ expect, task }) => {
    const testName = getTestName().toLowerCase()

    const folderPath = path.join(
      __dirname,
      '.cache',
      'check-bundled-type-definitions',
    )

    await fs.mkdir(path.join(folderPath, 'my-lib'), { recursive: true })

    const files: Record<string, string> = {
      'my-lib/src/foo.ts': `export * from './internal.js'`,
      'my-lib/src/bar.ts': `export * from './internal.js'`,
      'my-lib/src/internal.ts': `export const sharedSymbol = Symbol('shared')\nexport class SharedClass {\nsymbol: typeof sharedSymbol = sharedSymbol}`,
      'my-lib/src/index.ts': `export * from './foo.js'\nexport * from './bar.js'\nexport type Person = { name: string }`,
      'my-lib/tsup.config.ts': `export default ${JSON.stringify(
        {
          name: testName,
          entry: ['./src/index.ts', './src/foo.ts', './src/bar.ts'],
          splitting: false,
          format: ['esm', 'cjs'],
          experimentalDts: true,
        } satisfies Options,
        null,
        2,
      )}`,
      'my-lib/package.json': JSON.stringify(
        {
          name: 'my-lib',
          description: task.name,
          type: 'module',
          version: '1.0.0',
          files: ['dist'],
          main: 'dist/index.js',
          types: 'dist/index.d.ts',
          exports: {
            './package.json': './package.json',
            '.': {
              import: {
                types: './dist/index.d.ts',
                default: './dist/index.js',
              },
              default: {
                types: './dist/index.d.cts',
                default: './dist/index.cjs',
              },
            },
            './foo': {
              import: {
                types: './dist/foo.d.ts',
                default: './dist/foo.js',
              },
              default: {
                types: './dist/foo.d.cts',
                default: './dist/foo.cjs',
              },
            },
            './bar': {
              import: {
                types: './dist/bar.d.ts',
                default: './dist/bar.js',
              },
              default: {
                types: './dist/bar.d.cts',
                default: './dist/bar.cjs',
              },
            },
          },
          typesVersions: {
            '*': {
              foo: ['./dist/foo.d.ts'],
              bar: ['./dist/bar.d.ts'],
            },
          },
        },
        null,
        2,
      ),
      'my-lib/tsconfig.json': JSON.stringify(
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

      'consuming-library/package.json': JSON.stringify(
        {
          name: 'consuming-library',
          description: 'Consumes my-lib to check its bundled type definitions',
          type: 'module',
          dependencies: {
            'my-lib': 'file:../my-lib/my-lib-1.0.0.tgz',
          },
        },
        null,
        2,
      ),
      'consuming-library/tsconfig.json': JSON.stringify(
        {
          compilerOptions: {
            outDir: './dist',
            rootDir: './src',
            declaration: true,
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            noEmitOnError: true,
            skipLibCheck: true,
            strict: true,
          },
          include: ['src'],
        },
        null,
        2,
      ),
      'consuming-library/src/index.ts': `import { type SharedClass as Bar } from 'my-lib/bar'\nimport { SharedClass as Foo } from 'my-lib/foo'\nexport const foo: Foo = new Foo()\nexport const bar: Bar = foo`,
    }

    await Promise.all(
      Object.keys(files).map(async (name) => {
        const filePath = path.join(folderPath, name)
        const parentDir = path.dirname(filePath)
        await fs.mkdir(parentDir, { recursive: true })
        return fs.writeFile(filePath, files[name], { encoding: 'utf8' })
      }),
    )

    const processPromise = execFile(
      'node',
      [path.join(__dirname, '..', 'dist', 'cli-default.js')],
      {
        cwd: 'test/.cache/check-bundled-type-definitions/my-lib',
        shell: true,
      },
    )

    await expect(processPromise).resolves.not.toThrow()

    console.log((await processPromise).stdout)

    await expect(
      execFile('pnpm', ['pack'], {
        cwd: 'test/.cache/check-bundled-type-definitions/my-lib',
        shell: true,
      }),
    ).resolves.not.toThrow()

    await expect(
      execFile('pnpm', ['install'], {
        cwd: 'test/.cache/check-bundled-type-definitions/consuming-library',
        shell: true,
      }),
    ).resolves.not.toThrow()

    await expect(
      execFile('tsc', ['-p', 'tsconfig.json'], {
        cwd: 'test/.cache/check-bundled-type-definitions/consuming-library',
        shell: true,
      }),
    ).resolves.not.toThrow()

    await expect(
      execFile(
        'rm -rf dist && tsc -p tsconfig.json --module ESNext --moduleResolution Bundler',
        {
          cwd: 'test/.cache/check-bundled-type-definitions/consuming-library',
          shell: true,
        },
      ),
    ).resolves.not.toThrow()

    await expect(
      execFile('rm', ['-rf', 'dist'], {
        cwd: 'test/.cache/check-bundled-type-definitions/consuming-library',
        shell: true,
      }),
    ).resolves.not.toThrow()

    await expect(
      execFile(
        'tsc',
        [
          '-p',
          'tsconfig.json',
          '--module',
          'ESNext',
          '--moduleResolution',
          'Node10',
        ],
        {
          cwd: 'test/.cache/check-bundled-type-definitions/consuming-library',
          shell: true,
        },
      ),
    ).resolves.not.toThrow()
  },
)

test('TS compiler runs once for multiple entry points', async ({
  expect,
  task,
}) => {
  const testName = getTestName().toLowerCase()

  const { getFileContent, outFiles } = await run(
    testName,
    {
      'src/types.ts': `export type Person = { name: string }`,
      'src/index.ts': `export const foo = [1, 2, 3]\nexport type { Person } from './types.js'`,
      'tsup.config.ts': `export default ${JSON.stringify(
        {
          name: testName,
          entry: { index: 'src/index.ts', types: 'src/types.ts' },
          format: ['esm', 'cjs'],
          experimentalDts: true,
        } satisfies Options,
        null,
        2,
      )}`,
      'package.json': JSON.stringify(
        {
          name: testName,
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
    'types.cjs',
    'types.d.cts',
    'types.d.ts',
    'types.js',
  ])

  const indexDtsContent = `export declare const foo: number[];\n\nexport declare type Person = {\n    name: string;\n};\n\nexport { }\n`

  expect(await getFileContent('dist/index.d.ts')).toStrictEqual(indexDtsContent)

  expect(await getFileContent('dist/index.d.cts')).toStrictEqual(
    indexDtsContent,
  )
})
