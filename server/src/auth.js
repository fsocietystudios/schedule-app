export function bearerAuth(req, res, next) {
  const required = process.env.API_TOKEN;
  if (!required) return next();
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (token !== required) return res.status(401).json({ error: 'Unauthorized' });
  next();
}
