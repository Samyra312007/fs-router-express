import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { Router, type RequestHandler, type ErrorRequestHandler } from 'express'
import { walkDir } from './scanner'
import { parseRoutes } from './parser'
import { loadMiddlewareModules, getMiddlewareForRoute } from './middleware'
import { loadErrorHandlerModules } from './error'
import { loadConfigFiles, getEffectiveConfig } from './config'
import { DEFAULT_DIRECTORY, METHOD_EXPORTS } from './config.defaults'
import type { Options, RouteEntry } from './types'

const METHOD_MAP: Record<string, string> = {
  GET: 'get',
  POST: 'post',
  PUT: 'put',
  PATCH: 'patch',
  DELETE: 'delete',
  OPTIONS: 'options',
  HEAD: 'head',
}

let _routeEntries: RouteEntry[] = []

export function listRoutes(): RouteEntry[] {
  return _routeEntries
}

export async function buildRouter(options: Options = {}): Promise<Router> {
  const directory = options.directory ?? path.join(process.cwd(), DEFAULT_DIRECTORY)
  const allMethods = [...METHOD_EXPORTS, ...(options.additionalMethods ?? [])]

  const scanned = walkDir(directory)
  const routes = parseRoutes(scanned.files)

  const sortedMiddleware = [...scanned.middleware].sort((a, b) => a.depth - b.depth)
  const sortedErrors = [...scanned.errors].sort((a, b) => b.depth - a.depth)

  const loadedMiddleware = await loadMiddlewareModules(sortedMiddleware)
  const loadedErrors = await loadErrorHandlerModules(sortedErrors)
  const loadedConfigs = await loadConfigFiles(scanned.configs)

  const router = Router()
  const entries: RouteEntry[] = []

  for (const route of routes) {
    let mod: Record<string, unknown>
    try {
      mod = await import(pathToFileURL(route.filePath).href)
    } catch {
      continue
    }

    const effectiveConfig = getEffectiveConfig(route.url, loadedConfigs)
    const allowedMethods = effectiveConfig.methods
      ? allMethods.filter((m) => effectiveConfig.methods!.includes(m.toUpperCase()))
      : allMethods

    const mwChain = getMiddlewareForRoute(route.url, sortedMiddleware, loadedMiddleware)

    for (const method of allowedMethods) {
      const key = method.toUpperCase()
      const handler = mod[key] as RequestHandler | undefined
      if (!handler) continue

      const httpMethod = METHOD_MAP[key]
      if (httpMethod) {
        ;(router as any)[httpMethod](route.url, ...mwChain, handler)
      } else {
        router.all(route.url, ...mwChain, handler)
      }
      entries.push({ method: key, url: route.url, handlerFile: route.filePath })
    }

    const defaultExport = mod.default
    if (defaultExport) {
      let allowedDefault = false
      if (!effectiveConfig.methods) {
        allowedDefault = true
      } else {
        allowedDefault = effectiveConfig.methods.includes('ALL')
      }

      if (allowedDefault) {
        if (typeof defaultExport === 'function') {
          router.all(route.url, ...mwChain, defaultExport as RequestHandler)
          entries.push({ method: 'ALL', url: route.url, handlerFile: route.filePath })
        } else if (Array.isArray(defaultExport)) {
          router.all(route.url, ...mwChain, ...(defaultExport as RequestHandler[]))
          entries.push({ method: 'ALL', url: route.url, handlerFile: route.filePath })
        } else if (typeof defaultExport === 'object' && defaultExport !== null) {
          for (const method of allowedMethods) {
            const key = method.toUpperCase()
            const handler = (defaultExport as Record<string, unknown>)[key] as RequestHandler | undefined
            if (!handler) continue
            const httpMethod = METHOD_MAP[key]
            if (httpMethod) {
              ;(router as any)[httpMethod](route.url, ...mwChain, handler)
            } else {
              router.all(route.url, ...mwChain, handler)
            }
            entries.push({ method: key, url: route.url, handlerFile: route.filePath })
          }
        }
      }
    }
  }

  for (const ef of sortedErrors) {
    const handler = loadedErrors.get(ef.filePath)
    if (handler) {
      if (ef.url === '/') {
        router.use(handler)
      } else {
        router.use(ef.url, handler as any)
      }
    }
  }

  _routeEntries = entries
  return router
}

export async function createRouter(
  app: { use: (...args: any[]) => any },
  options?: Options,
): Promise<void> {
  const r = await buildRouter(options)
  app.use(r)
}

export async function router(options?: Options): Promise<Router> {
  return buildRouter(options)
}
