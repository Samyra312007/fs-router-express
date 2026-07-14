export const GET = (_req: any, res: any) => res.json({ id: _req.params.id })
export const DELETE = (_req: any, res: any) => res.status(204).send()
