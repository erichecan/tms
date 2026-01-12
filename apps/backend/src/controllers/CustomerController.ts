import { Request, Response } from 'express';
import { customerService } from '../services/CustomerService';

export const getCustomers = async (req: Request, res: Response) => {
    try {
        const customers = await customerService.getAll();
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
};

export const getCustomerById = async (req: Request, res: Response) => {
    try {
        const customer = await customerService.getById(req.params.id);
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
};

export const createCustomer = async (req: Request, res: Response) => {
    try {
        const newCustomer = await customerService.create(req.body);
        res.status(201).json(newCustomer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create customer' });
    }
};

export const updateCustomer = async (req: Request, res: Response) => {
    try {
        const updated = await customerService.update(req.params.id, req.body);
        if (!updated) return res.status(404).json({ error: 'Customer not found' });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update customer' });
    }
};

export const deleteCustomer = async (req: Request, res: Response) => {
    try {
        const success = await customerService.delete(req.params.id);
        if (!success) return res.status(404).json({ error: 'Customer not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete customer' });
    }
};
