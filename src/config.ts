import type { ConfigFile } from './types'

export interface DirectoryConfig {
  methods?: string[]
  mergeParams?: boolean
}

export async function loadConfigFiles(
  configFiles: ConfigFile[],
): Promise<Map<string, DirectoryConfig>> {
  const map = new Map<string, DirectoryConfig>()

  for (const cf of configFiles) {
    try {
      const mod = await import(cf.filePath)
      const raw = mod.config ?? mod.default ?? {}
      if (typeof raw === 'object' && raw !== null) {
        const config: DirectoryConfig = {}
        const rawAny = raw as Record<string, unknown>
        if (Array.isArray(rawAny.methods)) {
          config.methods = rawAny.methods.map((m: string) => m.toUpperCase())
        }
        if (typeof rawAny.mergeParams === 'boolean') {
          config.mergeParams = rawAny.mergeParams
        }
        map.set(cf.url, config)
      }
    } catch {
      continue
    }
  }

  return map
}

export function getEffectiveConfig(
  routeUrl: string,
  loadedConfigs: Map<string, DirectoryConfig>,
): DirectoryConfig {
  const applicable: { url: string; config: DirectoryConfig }[] = []

  for (const [url, config] of loadedConfigs) {
    if (url === '/') {
      applicable.push({ url, config })
    } else if (routeUrl === url || routeUrl.startsWith(url + '/')) {
      applicable.push({ url, config })
    }
  }

  applicable.sort((a, b) => a.url.split('/').filter(Boolean).length - b.url.split('/').filter(Boolean).length)

  const merged: DirectoryConfig = {}
  for (const { config } of applicable) {
    if (config.methods) merged.methods = config.methods
    if (config.mergeParams !== undefined) merged.mergeParams = config.mergeParams
  }

  return merged
}
