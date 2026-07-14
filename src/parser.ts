import path from 'node:path'
import type { RouteFile, ParsedRoute } from './types'
import { SPECIAL_FILES } from './config.defaults'
import { removeExtension, convertDynamicSegments, calculatePriority, sortByPriority } from './utils'

export function parseRoutes(files: RouteFile[]): ParsedRoute[] {
  const routes: ParsedRoute[] = []

  for (const file of files) {
    const parsed = path.parse(file.rel)
    const segments = parsed.dir
      .split('/')
      .filter(Boolean)
    const name = removeExtension(parsed.base)

    let url: string

    if (name === SPECIAL_FILES.INDEX) {
      url = segments.length === 0 ? '/' : `/${segments.join('/')}`
    } else {
      url = `/${[...segments, name].join('/')}`
    }

    url = convertDynamicSegments(url)

    routes.push({
      url,
      filePath: file.path + '/' + file.name,
      priority: calculatePriority(url),
    })
  }

  return sortByPriority(routes)
}
