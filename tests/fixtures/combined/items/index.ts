export const GET = (_req: any, res: any) => res.json({ items: 'all' })
export const POST = (_req: any, res: any) => res.status(201).json({ created: true })
