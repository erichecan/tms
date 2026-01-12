
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';

const API_URL = API_BASE_URL;

export interface PricingRequest {
    pickupAddress: {
        formattedAddress: string;
        latitude: number;
        longitude: number;
    };
    deliveryAddress: {
        formattedAddress: string;
        latitude: number;
        longitude: number;
    };
    businessType: string;
    waitingTimeLimit?: number;
}

export interface PricingResult {
    totalRevenue: number;
    breakdown: Array<{
        componentName: string;
        amount: number;
        formula: string;
    }>;
    distance: number;
    duration: number;
    currency: string;
}

export const calculatePrice = async (data: PricingRequest): Promise<PricingResult> => {
    const response = await axios.post(`${API_URL}/pricing/calculate`, data);
    return response.data;
};
