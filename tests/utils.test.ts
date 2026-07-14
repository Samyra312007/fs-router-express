import { describe, it, expect } from 'vitest'
import {
  mergePaths,
  removeExtension,
  isDynamicSegment,
  isCatchAllSegment,
  convertDynamicSegments,
  calculatePriority,
  sortByPriority,
  isSpecialFile,
  getSpecialFileType,
  shouldIgnoreFile,
} from '../src/utils'

describe('mergePaths', () => {
  it('joins path segments', () => {
    expect(mergePaths('users', '[id]', 'posts')).toBe('/users/[id]/posts')
  })

  it('handles leading/trailing slashes', () => {
    expect(mergePaths('/users/', '/[id]')).toBe('/users/[id]')
  })

  it('returns root for empty input', () => {
    expect(mergePaths()).toBe('/')
  })

  it('filters empty segments', () => {
    expect(mergePaths('a', '', 'b')).toBe('/a/b')
  })
})

describe('removeExtension', () => {
  it('strips file extension', () => {
    expect(removeExtension('index.ts')).toBe('index')
    expect(removeExtension('[id].js')).toBe('[id]')
    expect(removeExtension('users.ts')).toBe('users')
  })

  it('returns name unchanged if no extension', () => {
    expect(removeExtension('index')).toBe('index')
  })
})

describe('isDynamicSegment', () => {
  it('detects [param] segments', () => {
    expect(isDynamicSegment('[id]')).toBe(true)
    expect(isDynamicSegment('[slug]')).toBe(true)
  })

  it('rejects non-dynamic segments', () => {
    expect(isDynamicSegment('id')).toBe(false)
    expect(isDynamicSegment('[...slug]')).toBe(false)
    expect(isDynamicSegment('index')).toBe(false)
  })
})

describe('isCatchAllSegment', () => {
  it('detects [...slug] segments', () => {
    expect(isCatchAllSegment('[...slug]')).toBe(true)
    expect(isCatchAllSegment('[...path]')).toBe(true)
  })

  it('rejects non-catch-all segments', () => {
    expect(isCatchAllSegment('[id]')).toBe(false)
    expect(isCatchAllSegment('slug')).toBe(false)
  })
})

describe('convertDynamicSegments', () => {
  it('converts [param] to :param', () => {
    expect(convertDynamicSegments('users/[id]')).toBe('/users/:id')
  })

  it('converts [...slug] to :slug(*)', () => {
    expect(convertDynamicSegments('[...slug]')).toBe('/:slug(*)')
  })

  it('leaves static paths unchanged', () => {
    expect(convertDynamicSegments('users/index')).toBe('/users/index')
  })

  it('handles root path', () => {
    expect(convertDynamicSegments('')).toBe('/')
  })
})

describe('calculatePriority', () => {
  it('static routes have lowest priority (higher number)', () => {
    const staticP = calculatePriority('/users')
    const dynamicP = calculatePriority('/users/:id')
    expect(staticP).toBeLessThan(dynamicP)
  })

  it('catch-all routes have highest priority', () => {
    const staticP = calculatePriority('/')
    const catchAllP = calculatePriority('/:slug(*)')
    expect(staticP).toBeLessThan(catchAllP)
  })

  it('deeper routes have higher priority', () => {
    const shallow = calculatePriority('/a')
    const deep = calculatePriority('/a/b')
    expect(shallow).toBeLessThan(deep)
  })
})

describe('sortByPriority', () => {
  it('sorts routes by priority ascending', () => {
    const routes = [
      { url: '/:slug(*)', filePath: '/a', priority: 1001 },
      { url: '/', filePath: '/b', priority: 1 },
      { url: '/users/:id', filePath: '/c', priority: 12 },
    ]
    const sorted = sortByPriority(routes)
    expect(sorted.map((r) => r.url)).toEqual(['/', '/users/:id', '/:slug(*)'])
  })
})

describe('isSpecialFile', () => {
  it('detects underscore-prefixed names', () => {
    expect(isSpecialFile('_middleware')).toBe(true)
    expect(isSpecialFile('_error')).toBe(true)
    expect(isSpecialFile('_config')).toBe(true)
  })

  it('rejects normal names', () => {
    expect(isSpecialFile('index')).toBe(false)
    expect(isSpecialFile('users')).toBe(false)
  })
})

describe('getSpecialFileType', () => {
  it('classifies _middleware', () => {
    expect(getSpecialFileType('_middleware')).toBe('middleware')
  })
  it('classifies _error', () => {
    expect(getSpecialFileType('_error')).toBe('error')
  })
  it('classifies _config', () => {
    expect(getSpecialFileType('_config')).toBe('config')
  })
  it('returns null for normal files', () => {
    expect(getSpecialFileType('index')).toBeNull()
    expect(getSpecialFileType('users')).toBeNull()
  })
})

describe('shouldIgnoreFile', () => {
  it('ignores .d.ts files', () => {
    expect(shouldIgnoreFile('types.d.ts')).toBe(true)
  })

  it('does not ignore regular .ts files', () => {
    expect(shouldIgnoreFile('index.ts')).toBe(false)
  })
})
