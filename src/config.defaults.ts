export const VALID_EXTENSIONS = ['.ts', '.js', '.mjs'] as const

export const IGNORE_PREFIX = '_'

export const IGNORE_SUFFIXES = ['.d.ts'] as const

export const METHOD_EXPORTS = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
] as const

export const SPECIAL_FILES = {
  MIDDLEWARE: '_middleware',
  ERROR: '_error',
  CONFIG: '_config',
  INDEX: 'index',
} as const

export const DEFAULT_DIRECTORY = 'routes'
