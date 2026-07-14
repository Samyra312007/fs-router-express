import type { Request, Response, NextFunction, RequestHandler } from 'express'

export interface Options {
  directory?: string
  extensions?: string[]
  additionalMethods?: string[]
}

export interface RouteFile {
  path: string
  name: string
  rel: string
}

export interface ParsedRoute {
  url: string
  filePath: string
  priority: number
}

export interface MiddlewareFile {
  url: string
  filePath: string
  depth: number
}

export interface ConfigFile {
  url: string
  filePath: string
  depth: number
}

export interface ScannerResult {
  files: RouteFile[]
  middleware: MiddlewareFile[]
  errors: ErrorFile[]
  configs: ConfigFile[]
}

export interface ErrorFile {
  url: string
  filePath: string
  depth: number
}

export interface RouteEntry {
  method: string
  url: string
  handlerFile: string
}

export type HttpMethod =
  | 'get'
  | 'post'
  | 'put'
  | 'patch'
  | 'delete'
  | 'options'
  | 'head'

export type MiddlewareHandler = (req: Request, res: Response, next: NextFunction) => void | Promise<void>

export interface RouteExports {
  GET?: RequestHandler
  POST?: RequestHandler
  PUT?: RequestHandler
  PATCH?: RequestHandler
  DELETE?: RequestHandler
  OPTIONS?: RequestHandler
  HEAD?: RequestHandler
  default?: RequestHandler | RequestHandler[] | Record<string, RequestHandler>
}
