import { db } from '../db';
import { Customer } from '../types';

export const customerService = {
    getAll: async (): Promise<Customer[]> => {
        return db.customers || [];
    },

    getById: async (id: string): Promise<Customer | undefined> => {
        return db.customers?.find(c => c.id === id);
    },

    create: async (data: Omit<Customer, 'id' | 'created_at' | 'status'>): Promise<Customer> => {
        const newCustomer: Customer = {
            id: `C-${Date.now()}`,
            ...data,
            status: 'ACTIVE',
            created_at: new Date().toISOString(),
            creditLimit: data.creditLimit || 0
        };
        db.customers.push(newCustomer);
        return newCustomer;
    },

    update: async (id: string, data: Partial<Customer>): Promise<Customer | null> => {
        const index = db.customers.findIndex(c => c.id === id);
        if (index === -1) return null;

        db.customers[index] = { ...db.customers[index], ...data };
        return db.customers[index];
    },

    delete: async (id: string): Promise<boolean> => {
        const index = db.customers.findIndex(c => c.id === id);
        if (index === -1) return false;

        db.customers.splice(index, 1);
        return true;
    }
};
