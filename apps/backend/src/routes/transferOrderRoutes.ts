import { Router } from 'express';
import * as TransferOrderController from '../controllers/TransferOrderController';

const router = Router();

// Transfer Order CRUD
router.get('/', TransferOrderController.getTransferOrders);
router.post('/', TransferOrderController.createTransferOrder);
router.get('/:id', TransferOrderController.getTransferOrderById);
router.put('/:id', TransferOrderController.updateTransferOrder);
router.delete('/:id', TransferOrderController.deleteTransferOrder);

// Lines
router.post('/:id/lines', TransferOrderController.saveTransferOrderLines);

// Waybill generation
router.post('/:id/generate-waybills', TransferOrderController.generateWaybills);

// Partners sub-routes (also accessible at /api/transfer-orders/partners)
router.get('/partners/list', TransferOrderController.getPartners);
router.post('/partners', TransferOrderController.createPartner);
router.put('/partners/:id', TransferOrderController.updatePartner);

export default router;
