import type { Request, Response, NextFunction } from 'express'

export default (req: Request, _res: Response, next: NextFunction) => {
  ;(req as any).mw = 'root'
  next()
}
