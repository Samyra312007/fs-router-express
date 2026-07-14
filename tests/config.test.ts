import { describe, it, expect } from 'vitest'
import type { ConfigFile } from '../src/types'
import { getEffectiveConfig } from '../src/config'
import type { DirectoryConfig } from '../src/config'

const configs = new Map<string, DirectoryConfig>([
  ['/', { methods: ['GET'] }],
  ['/users', { methods: ['GET', 'POST'] }],
  ['/admin', { methods: ['DELETE'] }],
])

describe('getEffectiveConfig', () => {
  it('returns root config for root route', () => {
    const config = getEffectiveConfig('/', configs)
    expect(config.methods).toEqual(['GET'])
  })

  it('inherits parent config for sub-routes', () => {
    const config = getEffectiveConfig('/users', configs)
    expect(config.methods).toEqual(['GET', 'POST'])
  })

  it('uses nearest ancestor config for deep routes', () => {
    const config = getEffectiveConfig('/users/123', configs)
    expect(config.methods).toEqual(['GET', 'POST'])
  })

  it('applies root config when no specific child config exists', () => {
    const config = getEffectiveConfig('/products', configs)
    expect(config.methods).toEqual(['GET'])
  })

  it('returns empty config when no configs loaded', () => {
    const config = getEffectiveConfig('/test', new Map())
    expect(config.methods).toBeUndefined()
  })

  it('child config overrides parent for same property', () => {
    const nested = new Map<string, DirectoryConfig>([
      ['/', { methods: ['GET'], mergeParams: false }],
      ['/api', { methods: ['POST'], mergeParams: true }],
    ])
    const config = getEffectiveConfig('/api/v1', nested)
    expect(config.methods).toEqual(['POST'])
    expect(config.mergeParams).toBe(true)
  })
})
