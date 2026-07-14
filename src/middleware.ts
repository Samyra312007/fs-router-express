import type { RequestHandler } from 'express'
import type { MiddlewareFile } from './types'

export async function loadMiddlewareModules(
  middlewareFiles: MiddlewareFile[],
): Promise<Map<string, RequestHandler[]>> {
  const map = new Map<string, RequestHandler[]>()

  for (const mw of middlewareFiles) {
    try {
      const mod = await import(mw.filePath)
      if (mod.default) {
        if (typeof mod.default === 'function') {
          map.set(mw.filePath, [mod.default as RequestHandler])
        } else if (Array.isArray(mod.default)) {
          map.set(mw.filePath, mod.default as RequestHandler[])
        }
      }
    } catch {
      continue
    }
  }

  return map
}

export function getMiddlewareForRoute(
  routeUrl: string,
  middlewareFiles: MiddlewareFile[],
  loadedMiddleware: Map<string, RequestHandler[]>,
): RequestHandler[] {
  const applicable = middlewareFiles.filter((mw) => {
    if (mw.url === '/') return true
    if (routeUrl === mw.url) return true
    return routeUrl.startsWith(mw.url + '/')
  })

  const chain: RequestHandler[] = []
  for (const mw of applicable) {
    const handlers = loadedMiddleware.get(mw.filePath)
    if (handlers) {
      chain.push(...handlers)
    }
  }

  return chain
}
