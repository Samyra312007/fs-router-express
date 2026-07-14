export const GET = (_req: any, res: any) => {
  res.json({ section: 'root' })
}

export const POST = (_req: any, res: any) => {
  res.status(201).json({ posted: true })
}
