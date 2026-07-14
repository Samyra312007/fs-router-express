import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { walkDir } from '../src/scanner'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, 'fixtures')

describe('walkDir', () => {
  it('scans basic routes', () => {
    const result = walkDir(path.join(fixturesDir, 'basic'))
    expect(result.files).toHaveLength(2)
    expect(result.middleware).toHaveLength(0)
    expect(result.errors).toHaveLength(0)
    expect(result.configs).toHaveLength(0)

    const names = result.files.map((f) => f.name).sort()
    expect(names).toEqual(['index.ts', 'users.ts'])
  })

  it('scans dynamic routes including [param] files', () => {
    const result = walkDir(path.join(fixturesDir, 'dynamic'))
    expect(result.files).toHaveLength(2)
    const names = result.files.map((f) => f.name).sort()
    expect(names).toEqual(['[id].ts', 'index.ts'])
  })

  it('scans catch-all routes', () => {
    const result = walkDir(path.join(fixturesDir, 'catch-all'))
    expect(result.files).toHaveLength(1)
    expect(result.files[0].name).toBe('[...slug].ts')
  })

  it('scans middleware files separately', () => {
    const result = walkDir(path.join(fixturesDir, 'middleware'))

    const fileNames = result.files.map((f) => f.name).sort()
    expect(fileNames).toEqual(['index.ts', 'index.ts'])

    expect(result.middleware).toHaveLength(2)
    const mwUrls = result.middleware.map((m) => m.url).sort()
    expect(mwUrls).toEqual(['/', '/users'])
  })

  it('scans error files separately', () => {
    const result = walkDir(path.join(fixturesDir, 'error'))

    const fileNames = result.files.map((f) => f.name).sort()
    expect(fileNames).toEqual(['[id].ts', 'index.ts'])

    expect(result.errors).toHaveLength(2)
    const errUrls = result.errors.map((e) => e.url).sort()
    expect(errUrls).toEqual(['/', '/users'])
  })

  it('returns empty result for non-existent directory', () => {
    const result = walkDir(path.join(fixturesDir, 'does-not-exist'))
    expect(result.files).toHaveLength(0)
    expect(result.middleware).toHaveLength(0)
    expect(result.errors).toHaveLength(0)
    expect(result.configs).toHaveLength(0)
  })

  it('scans nested directory structures with correct rel paths', () => {
    const result = walkDir(path.join(fixturesDir, 'dynamic'))
    const rels = result.files.map((f) => f.rel).sort()
    expect(rels).toContain('[id].ts')
    expect(rels).toContain('index.ts')
  })
})
