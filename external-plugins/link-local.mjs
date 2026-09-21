/** Resolve external plugin peers to this fixed checkout, never a second npm Harness runtime. */
import { readdir, readFile, mkdir, symlink, lstat, realpath } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
const root = dirname(fileURLToPath(import.meta.url))
const repo = resolve(root, '..')
const workspaces = new Map()
for (const groupEntry of await readdir(resolve(repo, 'packages'), { withFileTypes: true })) {
  if (!groupEntry.isDirectory()) continue
  const group = groupEntry.name
  for (const entry of await readdir(resolve(repo, 'packages', group), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const dir = resolve(repo, 'packages', group, entry.name)
    try { workspaces.set(JSON.parse(await readFile(resolve(dir, 'package.json'), 'utf8')).name, dir) }
    catch (error) { if (error.code !== 'ENOENT') throw error }
  }
}
for (const entry of await readdir(resolve(repo, 'vendor'), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  const dir = resolve(repo, 'vendor', entry.name)
  try { workspaces.set(JSON.parse(await readFile(resolve(dir, 'package.json'), 'utf8')).name, dir) }
  catch (error) { if (error.code !== 'ENOENT') throw error }
}
for (const dir of await readdir(root, { withFileTypes: true })) {
  if (!dir.isDirectory() || !dir.name.startsWith('dsh-')) continue
  const base = resolve(root, dir.name)
  const pkg = JSON.parse(await readFile(resolve(base, 'package.json'), 'utf8'))
  for (const name of Object.keys({ ...pkg.peerDependencies, ...pkg.dependencies, ...pkg.devDependencies })) {
    let target = workspaces.get(name)
    if (!target) {
      const resolver = createRequire(resolve(['react', 'react-dom', '@types/react', '@types/react-dom'].includes(name) ? repo + '/apps/web' : root, 'package.json'))
      target = dirname(resolver.resolve(name + '/package.json'))
    }
    const installed = JSON.parse(await readFile(resolve(target, 'package.json'), 'utf8'))
    const expected = { ...pkg.peerDependencies, ...pkg.dependencies, ...pkg.devDependencies }[name]
    if (installed.version !== expected) throw new Error(`${name}: expected ${expected}, found ${installed.version}`)
    const link = resolve(base, 'node_modules', name)
    try { await lstat(link); if (await realpath(link) !== await realpath(target)) throw new Error(`Refusing to overwrite ${link}`); continue }
    catch (error) { if (error.code !== 'ENOENT') throw error }
    await mkdir(dirname(link), { recursive: true })
    await symlink(target, link, 'dir')
  }
}
