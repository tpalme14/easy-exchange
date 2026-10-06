import { Router } from 'express';
import * as bookController from '../controllers/bookController.js';
import { optionalAuth, requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.get('/', optionalAuth, bookController.listBooks);
router.post('/', requireAuth, bookController.createBook);
router.get('/:id', optionalAuth, bookController.getBook);
router.put('/:id', requireAuth, bookController.updateBook);
router.delete('/:id', requireAuth, bookController.deleteBook);

export default router;
