
import React, { useState, useEffect, useRef } from 'react';
import { calculatePrice, type PricingResult } from './services/pricingService';
import { createPlacesAutocomplete } from './services/mapsService';

export const PricingCalculator: React.FC = () => {
    const [pickup, setPickup] = useState<any>(null);
    const [delivery, setDelivery] = useState<any>(null);
    const [businessType, setBusinessType] = useState('STANDARD');
    const [waitingTime, setWaitingTime] = useState(0);
    const [result, setResult] = useState<PricingResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const pickupInputRef = useRef<HTMLInputElement>(null);
    const deliveryInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (pickupInputRef.current) {
            createPlacesAutocomplete(pickupInputRef.current, {
                onPlaceSelected: (place: google.maps.places.PlaceResult) => {
                    if (place.geometry && place.geometry.location) {
                        setPickup({
                            formattedAddress: place.formatted_address,
                            latitude: place.geometry.location.lat(),
                            longitude: place.geometry.location.lng()
                        });
                    }
                }
            });
        }
        if (deliveryInputRef.current) {
            createPlacesAutocomplete(deliveryInputRef.current, {
                onPlaceSelected: (place: google.maps.places.PlaceResult) => {
                    if (place.geometry && place.geometry.location) {
                        setDelivery({
                            formattedAddress: place.formatted_address,
                            latitude: place.geometry.location.lat(),
                            longitude: place.geometry.location.lng()
                        });
                    }
                }
            });
        }
    }, []);

    const handleCalculate = async () => {
        if (!pickup || !delivery) {
            setError('Please select both pickup and delivery addresses');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await calculatePrice({
                pickupAddress: pickup,
                deliveryAddress: delivery,
                businessType,
                waitingTimeLimit: waitingTime
            });
            setResult(res);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Calculation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Real-time Pricing Calculator</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-semibold mb-4">Shipment Details</h2>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Pickup Address</label>
                        <input
                            ref={pickupInputRef}
                            type="text"
                            className="w-full border rounded p-2"
                            placeholder="Enter pickup location"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Delivery Address</label>
                        <input
                            ref={deliveryInputRef}
                            type="text"
                            className="w-full border rounded p-2"
                            placeholder="Enter delivery location"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Business Type</label>
                        <select
                            value={businessType}
                            onChange={(e) => setBusinessType(e.target.value)}
                            className="w-full border rounded p-2"
                        >
                            <option value="STANDARD">Standard Delivery</option>
                            <option value="WASTE_COLLECTION">Waste Collection</option>
                            <option value="WAREHOUSE_TRANSFER">Warehouse Transfer</option>
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Waiting Time (min)</label>
                        <input
                            type="number"
                            value={waitingTime}
                            onChange={(e) => setWaitingTime(parseInt(e.target.value) || 0)}
                            className="w-full border rounded p-2"
                        />
                    </div>

                    <button
                        onClick={handleCalculate}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {loading ? 'Calculating...' : 'Get Price'}
                    </button>

                    {error && <p className="text-red-500 mt-2">{error}</p>}
                </div>

                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-semibold mb-4">Pricing Breakdown</h2>
                    {result ? (
                        <div>
                            <div className="text-3xl font-bold text-green-600 mb-2">
                                ${result.totalRevenue} {result.currency}
                            </div>
                            <div className="text-sm text-gray-600 mb-4">
                                Distance: {result.distance.toFixed(2)} km | Duration: {result.duration.toFixed(0)} min
                            </div>

                            <div className="space-y-2">
                                {result.breakdown.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between border-b pb-2">
                                        <div>
                                            <div className="font-medium">{item.componentName}</div>
                                            <div className="text-xs text-gray-500">{item.formula}</div>
                                        </div>
                                        <div className="font-medium">${item.amount.toFixed(2)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-400 text-center py-10">
                            Enter details to see pricing
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
