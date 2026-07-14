export const GET = (req: any, res: any) => {
  res.json({ slug: req.params[0] })
}
