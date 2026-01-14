import { Request, Response } from 'express';
import { customerService } from '../services/CustomerService';

export const getCustomers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;

        const result = await customerService.getAll({ page, limit, search });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
};

export const getCustomerById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const customer = await customerService.getById(id as string);
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
        const { id } = req.params;
        const updated = await customerService.update(id as string, req.body);
        if (!updated) return res.status(404).json({ error: 'Customer not found' });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update customer' });
    }
};

export const deleteCustomer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const success = await customerService.delete(id as string);
        if (!success) return res.status(404).json({ error: 'Customer not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete customer' });
    }
};
