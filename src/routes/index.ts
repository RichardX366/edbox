import { Router } from 'express';
import authRouter from './auth';
import citiesRouter from './cities';

const baseRouter = Router();

baseRouter.get('/', (req, res) => {
  res.send('Everything works fine.');
});

baseRouter.use('/auth', authRouter);
baseRouter.use('/cities', citiesRouter);

export default baseRouter;
