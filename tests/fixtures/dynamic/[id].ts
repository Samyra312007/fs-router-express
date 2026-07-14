export const GET = (req: any, res: any) => {
  res.json({ id: req.params.id })
}

export const PUT = (req: any, res: any) => {
  res.json({ updated: req.params.id })
}

export const DELETE = (req: any, res: any) => {
  res.status(204).send()
}
