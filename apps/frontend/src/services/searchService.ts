import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';

const API_URL = API_BASE_URL;

interface SearchResult {
    id: string;
    title: string;
    subtitle: string;
    type: 'waybill' | 'customer' | 'driver';
    link: string;
}

export const searchService = {
    search: async (query: string): Promise<SearchResult[]> => {
        if (!query || query.length < 2) return [];
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await axios.get(`${API_URL}/search/global?q=${encodeURIComponent(query)}`, { headers });
        return response.data;
    }
};
