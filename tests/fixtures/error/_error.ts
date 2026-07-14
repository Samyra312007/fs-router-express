import type { Request, Response, NextFunction } from 'express'

export default (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: err.message })
}
