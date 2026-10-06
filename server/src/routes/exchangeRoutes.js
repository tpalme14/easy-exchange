import { Router } from 'express';
import * as exchangeController from '../controllers/exchangeController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.post('/', requireAuth, exchangeController.createExchange);
router.get('/sent', requireAuth, exchangeController.listSentExchanges);
router.get('/received', requireAuth, exchangeController.listReceivedExchanges);
router.get('/:id', requireAuth, exchangeController.getExchange);
router.post('/:id/accept', requireAuth, exchangeController.acceptExchange);
router.post('/:id/reject', requireAuth, exchangeController.rejectExchange);
router.post('/:id/cancel', requireAuth, exchangeController.cancelExchange);

export default router;
