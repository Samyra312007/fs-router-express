export const GET = (req: any, res: any) => {
  res.json({ ok: true })
}

export const POST = (req: any, res: any) => {
  res.status(201).json({ created: true })
}
