import { Router } from 'express';
import citiesRouter from './cities';

const baseRouter = Router();

baseRouter.get('/', (req, res) => {
  res.send('Everything works fine.');
});

baseRouter.use('/cities', citiesRouter);

export default baseRouter;
