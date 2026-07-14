import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { walkDir } from '../src/scanner'
import { parseRoutes } from '../src/parser'
import { sortByPriority } from '../src/utils'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, 'fixtures')

describe('parseRoutes', () => {
  it('parses basic routes into Express paths', () => {
    const scanned = walkDir(path.join(fixturesDir, 'basic'))
    const routes = parseRoutes(scanned.files)

    expect(routes).toHaveLength(2)
    const urls = routes.map((r) => r.url).sort()
    expect(urls).toEqual(['/', '/users'])
  })

  it('parses dynamic [param] routes', () => {
    const scanned = walkDir(path.join(fixturesDir, 'dynamic'))
    const routes = parseRoutes(scanned.files)

    const urls = routes.map((r) => r.url).sort()
    expect(urls).toContain('/')
    expect(urls).toContain('/:id')
  })

  it('parses catch-all [...slug] routes', () => {
    const scanned = walkDir(path.join(fixturesDir, 'catch-all'))
    const routes = parseRoutes(scanned.files)

    expect(routes).toHaveLength(1)
    expect(routes[0].url).toBe('/:slug(*)')
  })

  it('prioritizes routes correctly (static before dynamic before catch-all)', () => {
    const scanned = walkDir(path.join(fixturesDir, 'dynamic'))
    const routes = parseRoutes(scanned.files)

    const sorted = sortByPriority(routes)
    expect(sorted[0].url).toBe('/')
    expect(sorted[1].url).toBe('/:id')
  })

  it('assigns correct filePath for each route', () => {
    const scanned = walkDir(path.join(fixturesDir, 'basic'))
    const routes = parseRoutes(scanned.files)

    for (const route of routes) {
      expect(route.filePath).toContain(route.url === '/' ? 'index.ts' : 'users.ts')
    }
  })

  it('handles middleware files — does not include as routes', () => {
    const scanned = walkDir(path.join(fixturesDir, 'middleware'))
    const routes = parseRoutes(scanned.files)

    const urls = routes.map((r) => r.url)
    expect(urls).not.toContain('/_middleware')
    expect(urls).toContain('/')
  })

  it('returns empty array for empty input', () => {
    const routes = parseRoutes([])
    expect(routes).toHaveLength(0)
  })
})
