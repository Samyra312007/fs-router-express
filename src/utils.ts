import path from 'node:path'
import type { ParsedRoute } from './types'
import { IGNORE_PREFIX, SPECIAL_FILES, VALID_EXTENSIONS } from './config.defaults'

export function mergePaths(...parts: string[]): string {
  return (
    '/' +
    parts
      .map((p) => p.replace(/^\/|\/$/g, ''))
      .filter((p) => p !== '')
      .join('/')
  )
}

export function removeExtension(filename: string): string {
  const ext = path.extname(filename)
  return ext ? filename.slice(0, -ext.length) : filename
}

export function isDynamicSegment(segment: string): boolean {
  return /^\[[^.[]+?\]$/.test(segment)
}

export function isCatchAllSegment(segment: string): boolean {
  return /^\[\.\.\..+?\]$/.test(segment)
}

export function convertDynamicSegments(filePath: string): string {
  const segments = filePath.split('/')
  const converted = segments.map((seg) => {
    if (isCatchAllSegment(seg)) {
      const paramName = seg.replace(/^\[\.\.\.(.+?)\]$/, '$1')
      return `:${paramName}(*)`
    }
    if (isDynamicSegment(seg)) {
      const paramName = seg.replace(/^\[(.+?)\]$/, '$1')
      return `:${paramName}`
    }
    return seg
  })
  return mergePaths(...converted)
}

export function calculatePriority(url: string): number {
  const depth = url.match(/\//g)?.length ?? 0
  const paramCount = url.match(/\/:/g)?.length ?? 0
  const hasCatchAll = url.includes('(*)') ? 1000 : 0
  return depth + paramCount * 10 + hasCatchAll
}

export function sortByPriority(routes: ParsedRoute[]): ParsedRoute[] {
  return [...routes].sort((a, b) => a.priority - b.priority)
}

export function isSpecialFile(name: string): boolean {
  return name.startsWith(IGNORE_PREFIX)
}

export function getSpecialFileType(
  name: string,
): 'middleware' | 'error' | 'config' | null {
  if (name === SPECIAL_FILES.MIDDLEWARE) return 'middleware'
  if (name === SPECIAL_FILES.ERROR) return 'error'
  if (name === SPECIAL_FILES.CONFIG) return 'config'
  return null
}

export function isValidExtension(ext: string, allowedExtensions?: readonly string[]): boolean {
  const exts = allowedExtensions ?? VALID_EXTENSIONS
  return exts.includes(ext.toLowerCase() as typeof VALID_EXTENSIONS[number])
}

export function shouldIgnoreFile(name: string): boolean {
  const lower = name.toLowerCase()
  for (const suffix of ['.d.ts']) {
    if (lower.endsWith(suffix)) return true
  }
  return false
}
