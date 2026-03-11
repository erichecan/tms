import { Router } from 'express';
import * as ContainerController from '../controllers/ContainerController';

const router = Router();

// Container CRUD
router.get('/', ContainerController.getContainers);
router.post('/', ContainerController.createContainer);
router.get('/:id', ContainerController.getContainerById);
router.put('/:id', ContainerController.updateContainer);
router.delete('/:id', ContainerController.deleteContainer);

// Container Items
router.post('/:id/items', ContainerController.addContainerItem);
router.put('/items/:id', ContainerController.updateContainerItem);
router.delete('/items/:id', ContainerController.deleteContainerItem);

// Delivery Appointments
router.post('/items/:itemId/appointments', ContainerController.createAppointment);
router.put('/appointments/:id', ContainerController.updateAppointment);

// Batch operations
router.post('/:id/generate-waybills', ContainerController.generateWaybills);

export default router;
