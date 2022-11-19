import express, { NextFunction, Request, Response } from 'express';
import logger from 'morgan';
import { config as initEnv } from 'dotenv';
import cors from 'cors';
import { Prisma, PrismaClient } from '@prisma/client';
import 'express-async-errors';

initEnv();
export const app = express();
export const prisma = new PrismaClient();

import './types';
import baseRouter from './routes';
import { stringQuery } from './middleware/stringQuery';

app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(
  express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }),
);
app.use(stringQuery);
app.use(cors());
app.use(baseRouter);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2014') {
      return res
        .status(400)
        .send(
          'Sorry, you cannot delete this as there are things connected to it. If you want to, you will need to delete the connected things first.',
        );
    }
  }
  console.error(err.stack);
  return res.status(400).send(err.message);
});

app.listen(process.env.PORT || 3005, () =>
  console.log(
    `🚀 Server ready at: http://localhost:${process.env.PORT || 3005}`,
  ),
);
