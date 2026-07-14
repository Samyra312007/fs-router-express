import { describe, it, expect } from 'vitest'
import type { RequestHandler } from 'express'
import type { MiddlewareFile } from '../src/types'
import { getMiddlewareForRoute } from '../src/middleware'

const mw1: RequestHandler = (_req, _res, next) => next()
const mw2: RequestHandler = (_req, _res, next) => next()
const mw3: RequestHandler = (_req, _res, next) => next()

const middlewareFiles: MiddlewareFile[] = [
  { url: '/', filePath: '/root/mw', depth: 0 },
  { url: '/users', filePath: '/users/mw', depth: 1 },
  { url: '/admin', filePath: '/admin/mw', depth: 1 },
  { url: '/users/settings', filePath: '/users/settings/mw', depth: 2 },
]

const loaded = new Map<string, RequestHandler[]>([
  ['/root/mw', [mw1]],
  ['/users/mw', [mw2]],
  ['/admin/mw', [mw3]],
  ['/users/settings/mw', [mw2, mw3]],
])

describe('getMiddlewareForRoute', () => {
  it('returns root middleware for root route', () => {
    const chain = getMiddlewareForRoute('/', middlewareFiles, loaded)
    expect(chain).toHaveLength(1)
  })

  it('applies root + scoped middleware for sub-routes', () => {
    const chain = getMiddlewareForRoute('/users', middlewareFiles, loaded)
    expect(chain).toHaveLength(2)
  })

  it('applies middleware from all ancestor paths', () => {
    const chain = getMiddlewareForRoute('/users/settings', middlewareFiles, loaded)
    expect(chain).toHaveLength(4)
  })

  it('does not include middleware from unrelated paths', () => {
    const chain = getMiddlewareForRoute('/products', middlewareFiles, loaded)
    expect(chain).toHaveLength(1)
    expect(chain).toEqual([mw1])
  })

  it('returns empty array for no matching middleware', () => {
    const chain = getMiddlewareForRoute('/other', [], loaded)
    expect(chain).toHaveLength(0)
  })

  it('applies root + parent middleware for deep nested routes', () => {
    const chain = getMiddlewareForRoute('/users/profile/settings', middlewareFiles, loaded)
    expect(chain).toHaveLength(2)
  })
})
