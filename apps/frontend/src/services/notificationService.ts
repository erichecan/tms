import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';

const API_URL = API_BASE_URL;

export interface Notification {
    id: string;
    user_id: string;
    type: 'ALERT' | 'INFO' | 'SUCCESS' | 'WARNING';
    title: string;
    content: string;
    is_read: boolean;
    created_at: string;
    data?: any;
}

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const notificationService = {
    getNotifications: async (userId?: string): Promise<Notification[]> => {
        const query = userId ? `?userId=${userId}` : '';
        const response = await axios.get(`${API_URL}/notifications${query}`, { headers: getHeaders() });
        return response.data;
    },

    markAsRead: async (id: string): Promise<void> => {
        await axios.put(`${API_URL}/notifications/${id}/read`, {}, { headers: getHeaders() });
    }
};
