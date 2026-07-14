export const GET = (req: any, res: any) => {
  res.json([{ id: 1 }, { id: 2 }])
}

export const POST = (req: any, res: any) => {
  res.status(201).json({ id: 3 })
}
