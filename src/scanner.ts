import fs from 'node:fs'
import path from 'node:path'
import type { RouteFile, MiddlewareFile, ErrorFile, ConfigFile, ScannerResult } from './types'
import { IGNORE_PREFIX, SPECIAL_FILES, VALID_EXTENSIONS } from './config.defaults'
import { isSpecialFile, getSpecialFileType, shouldIgnoreFile } from './utils'

const SKIP_DIRS = new Set(['node_modules', '.git'])

function isHidden(entry: string): boolean {
  return entry.startsWith('.')
}

function isAllowedExtension(name: string): boolean {
  const ext = path.extname(name).toLowerCase()
  return (VALID_EXTENSIONS as readonly string[]).includes(ext)
}

export function walkDir(
  dirPath: string,
  basePath: string = '',
): ScannerResult {
  const files: RouteFile[] = []
  const middleware: MiddlewareFile[] = []
  const errors: ErrorFile[] = []
  const configs: ConfigFile[] = []

  let entries: string[]
  try {
    entries = fs.readdirSync(dirPath)
  } catch {
    return { files, middleware, errors, configs }
  }

  for (const entry of entries) {
    if (isHidden(entry) || SKIP_DIRS.has(entry)) continue

    const fullPath = path.join(dirPath, entry)
    const relPath = basePath ? `${basePath}/${entry}` : entry
    let stat: fs.Stats

    try {
      stat = fs.statSync(fullPath)
    } catch {
      continue
    }

    if (stat.isDirectory()) {
      const child = walkDir(fullPath, relPath)
      files.push(...child.files)
      middleware.push(...child.middleware)
      errors.push(...child.errors)
      configs.push(...child.configs)
    } else if (stat.isFile()) {
      const nameWithoutExt = path.basename(entry, path.extname(entry))

      if (!isAllowedExtension(entry) || shouldIgnoreFile(entry)) continue

      if (nameWithoutExt.startsWith(IGNORE_PREFIX)) {
        const type = getSpecialFileType(nameWithoutExt)
        const parentDir = basePath ? `/${basePath}` : '/'

        if (type === 'middleware') {
          middleware.push({ url: parentDir, filePath: fullPath, depth: basePath.split('/').filter(Boolean).length })
        } else if (type === 'error') {
          errors.push({ url: parentDir, filePath: fullPath, depth: basePath.split('/').filter(Boolean).length })
        } else if (type === 'config') {
          configs.push({ url: parentDir, filePath: fullPath, depth: basePath.split('/').filter(Boolean).length })
        }
      } else {
        files.push({
          path: dirPath,
          name: entry,
          rel: relPath,
        })
      }
    }
  }

  return { files, middleware, errors, configs }
}
