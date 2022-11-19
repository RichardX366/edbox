import { RequestHandler } from 'express';
import { prisma } from '..';

export const logIn: RequestHandler = async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
    include: { items: { include: { pictures: true, city: true } }, city: true },
  });
  if (user.password === password) return res.json(user);
  throw 'Wrong password';
};

export const signUp: RequestHandler = async (req, res) => {
  res.json(
    await prisma.user.create({
      data: { ...req.body, city: { connect: { name: req.body.city } } },
      include: { items: true, city: true },
    }),
  );
};
