import type { ErrorRequestHandler } from 'express'
import type { ErrorFile } from './types'

export async function loadErrorHandlerModules(
  errorFiles: ErrorFile[],
): Promise<Map<string, ErrorRequestHandler>> {
  const map = new Map<string, ErrorRequestHandler>()

  for (const ef of errorFiles) {
    try {
      const mod = await import(ef.filePath)
      if (mod.default && typeof mod.default === 'function') {
        map.set(ef.filePath, mod.default as ErrorRequestHandler)
      }
    } catch {
      continue
    }
  }

  return map
}
