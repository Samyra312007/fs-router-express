export const GET = (_req: any, res: any) => {
  res.json({ users: 'list' })
}

export const POST = (_req: any, res: any) => {
  res.status(201).json({ created: true })
}

export const PUT = (_req: any, res: any) => {
  res.json({ updated: true })
}
