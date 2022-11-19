import { Router } from 'express';
import { findCities } from '../controllers/cities';

const citiesRouter = Router();

citiesRouter.get('/', findCities);

export default citiesRouter;
