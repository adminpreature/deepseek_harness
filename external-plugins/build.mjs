/** Build pinned downstream plugins from checked-in source; no profile or network writes. */
import { build } from 'tsdown'
import { readFile, writeFile, mkdir, copyFile, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = dirname(fileURLToPath(import.meta.url))
const names = process.argv.slice(2)
for (const name of names.length ? names : ['dsh-skill-plaza', 'dsh-taskboard', 'dsh-prompt-manager', 'dsh-skills-manager']) {
  const cwd = resolve(root, name)
  const pkg = JSON.parse(await readFile(resolve(cwd, 'package.json'), 'utf8'))
  await rm(resolve(cwd, 'lib'), { recursive: true, force: true })
  await mkdir(resolve(cwd, 'lib'), { recursive: true })
  if (name === 'dsh-prompt-manager') {
    for (const entry of ['index', 'client']) await copyFile(resolve(cwd, `src/${entry}.js`), resolve(cwd, `lib/${entry}.js`))
    continue
  }
  if (name === 'dsh-skills-manager') {
    for (const entry of ['index', 'client', 'typert.host', 'typert.remote-client']) await copyFile(resolve(cwd, `src/legacy/${entry}.js`), resolve(cwd, `lib/${entry}.js`))
    continue
  } else {
    await build({ config: false, cwd, entry: { index: 'src/index.ts' }, format: 'esm', outDir: 'lib', clean: false, external: [/^@deepseek-ai\//], platform: 'node', outExtensions: () => ({ js: '.js' }), dts: false })
  }
  await build({ config: false, cwd, entry: { client: name === 'dsh-skill-plaza' ? 'src/client/index.tsx' : 'src/client/index.ts' }, format: 'cjs', outDir: 'lib', clean: false, external: [/^@deepseek-ai\//, /^react(?:-dom)?(?:\/.*)?$/], platform: 'browser', dts: false, minify: true, outExtensions: () => ({ js: '.cjs' }) })
  const body = await readFile(resolve(cwd, 'lib/client.cjs'), 'utf8')
  await writeFile(resolve(cwd, 'lib/client.js'), `window.__ModuleLoader__.load({id:${JSON.stringify(pkg.name)},factory:(require)=>{var module={exports:{}};var exports=module.exports;${body}\nreturn module.exports;}});\n`)
}
