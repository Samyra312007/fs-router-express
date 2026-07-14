export const GET = (_req: any, res: any) => {
  res.json({ id: _req.params.id })
}
