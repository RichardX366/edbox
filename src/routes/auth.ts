import { Router } from 'express';
import { logIn, signUp } from '../controllers/auth';

const authRouter = Router();

authRouter.post('/login', logIn);
authRouter.post('/signUp', signUp);

export default authRouter;
