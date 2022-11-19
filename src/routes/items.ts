import { Router } from 'express';
import {
  createItem,
  addPicture,
  deleteItem,
  deletePicture,
  requestItem,
  updateItem,
  findItems,
  uploadPicture,
  makePrimary,
} from '../controllers/items';

const itemsRouter = Router();

itemsRouter.get('/', findItems);
itemsRouter.post('/', createItem);
itemsRouter.put('/:id', updateItem);
itemsRouter.delete('/:id', deleteItem);
itemsRouter.post('/request/:id', requestItem);
itemsRouter.post('/picture/:id', addPicture);
itemsRouter.delete('/picture/:id', deletePicture);
itemsRouter.post('/picture', uploadPicture);
itemsRouter.put('/picture/primary/:id', makePrimary);

export default itemsRouter;
