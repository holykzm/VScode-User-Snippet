import { NextApiRequest, NextApiResponse } from 'next';

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  res.status(429).json({ message: 'Too Many Requests' });
};

export default handler;