import { RequestHandler } from 'express';
import { prisma } from '..';

export const findCities: RequestHandler = async (req, res) => {
  const query = req.stringQuery.query || '';
  res.json(
    await prisma.city.findMany({
      where: {
        OR: [{ name: { contains: query } }, { zipCodes: { contains: query } }],
      },
      take: 10,
    }),
  );
};
