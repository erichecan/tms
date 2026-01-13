
import axios from 'axios';
import {
    AddressInfo,
    LogisticsRouteRequest,
    LogisticsRouteResponse,
    GoogleMapsApiConfig,
    MapsApiError,
    CostBreakdown
} from '../types';

export class MapsApiService {
    private config: GoogleMapsApiConfig;
    private cache: Map<string, any> = new Map();

    constructor(apiKey: string) {
        this.config = {
            apiKey,
            baseUrl: 'https://maps.googleapis.com/maps/api',
            cacheConfig: {
                geocodingTtl: 24 * 60 * 60 * 1000,
                directionsTtl: 60 * 60 * 1000,
            }
        };
    }

    // Geocoding
    async geocodeAddress(address: string): Promise<AddressInfo> {
        const cacheKey = `geocode:${address}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt) return cached.result;

        try {
            const response = await axios.get<any>(`${this.config.baseUrl}/geocode/json`, {
                params: {
                    address,
                    key: this.config.apiKey,
                },
            });

            if (response.data.status === 'OK' && response.data.results.length > 0) {
                const result = response.data.results[0];
                const addressInfo: AddressInfo = {
                    formattedAddress: result.formatted_address,
                    latitude: result.geometry.location.lat,
                    longitude: result.geometry.location.lng,
                    placeId: result.place_id,
                };

                this.cache.set(cacheKey, {
                    result: addressInfo,
                    expiresAt: Date.now() + this.config.cacheConfig.geocodingTtl,
                });

                return addressInfo;
            } else {
                throw new Error(`Geocoding failed: ${response.data.status}`);
            }
        } catch (error: any) {
            console.error('Geocoding Error', error.message);
            throw error;
        }
    }

    // Distance Matrix (Simplified for single pair)
    async getDistance(origin: AddressInfo, destination: AddressInfo): Promise<{ distance: number; duration: number }> {
        const cacheKey = `dist:${origin.latitude},${origin.longitude}-${destination.latitude},${destination.longitude}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt) return cached.result;

        try {
            const response = await axios.get<any>(`${this.config.baseUrl}/distancematrix/json`, {
                params: {
                    origins: `${origin.latitude},${origin.longitude}`,
                    destinations: `${destination.latitude},${destination.longitude}`,
                    key: this.config.apiKey,
                    units: 'metric'
                }
            });

            if (response.data.status === 'OK') {
                const element = response.data.rows[0].elements[0];
                if (element.status === 'OK') {
                    const result = {
                        distance: element.distance.value / 1000, // km
                        duration: element.duration.value / 60 // minutes
                    };
                    this.cache.set(cacheKey, {
                        result,
                        expiresAt: Date.now() + this.config.cacheConfig.directionsTtl
                    });
                    return result;
                }
            }
            throw new Error('Distance Matrix failed');
        } catch (error: any) {
            console.error('Distance Matrix Error', error.message);
            throw error;
        }
    }

    clearCache() {
        this.cache.clear();
    }

    async calculateDispatchMatrix(request: any): Promise<any> {
        // Stub for build compatibility
        throw new Error('Not implemented');
    }

    async reverseGeocode(lat: number, lng: number): Promise<any> {
        return { formattedAddress: 'Stub Address' };
    }

    async calculateLogisticsRoute(request: any): Promise<any> {
        return {
            distance: 10,
            duration: 15,
            geometry: '',
            legs: []
        };
    }

    getUsageStats(): any {
        return {
            geocoding: 0,
            directions: 0,
            distanceMatrix: 0,
            places: 0
        };
    }
}

export const mapsApiService = new MapsApiService(process.env.GOOGLE_MAPS_API_KEY || '');
