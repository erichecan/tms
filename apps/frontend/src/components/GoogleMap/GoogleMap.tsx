// ============================================================================
// Google地图组件
// 创建时间: 2026-01-09
// 说明: 此组件包含Google Maps API集成功能
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
// Spin component is not available in the current codebase without Ant Design?
// Looking at TrackingPage.tsx, it seems to use raw JSX/CSS or maybe a different UI library.
// But the legacy code used Ant Design. I should check if 'antd' is available. 
// If not, I should use a simple loading indicator.
// TrackingPage.tsx does not import Ant Design. It uses lucide-react icons.
// I will use a simple div for loading/error states to be safe, or check package.json again.
// package.json does not list 'antd'. So I should remove 'antd' imports.

// import { Card, Spin } from 'antd'; // Removed

interface GoogleMapProps {
    center?: { lat: number; lng: number };
    zoom?: number;
    markers?: Array<{
        id: string;
        position: { lat: number; lng: number };
        title?: string;
        info?: string;
    }>;
    routes?: Array<{
        from: { lat: number; lng: number };
        to: { lat: number; lng: number };
        color?: string;
    }>;
    height?: string;
    onMarkerClick?: (markerId: string) => void;
}

const GoogleMap: React.FC<GoogleMapProps> = ({
    center = { lat: 39.9042, lng: 116.4074 }, // Default
    zoom = 10,
    markers = [],
    routes = [],
    height = '400px',
    onMarkerClick,
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const markersRef = useRef<any[]>([]);
    const routesRef = useRef<any[]>([]);

    useEffect(() => {
        const initMap = async () => {
            try {
                setLoading(true);
                setError(null);

                const { loadGoogleMaps, importLibrary } = await import('../../lib/googleMapsLoader');
                const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

                await loadGoogleMaps(API_KEY);
                const { Map } = await importLibrary('maps');

                if (mapRef.current) {
                    const mapInstance = new Map(mapRef.current, {
                        center,
                        zoom,
                        mapTypeId: 'roadmap',
                        disableDefaultUI: false, // Ensure UI elements are visible if needed
                        styles: [
                            {
                                featureType: 'poi',
                                elementType: 'labels',
                                stylers: [{ visibility: 'off' }],
                            },
                        ],
                    });

                    setMap(mapInstance);
                }
            } catch (err: any) {
                console.error('❌ [GoogleMap Component] Google Maps failed to load:', err);
                setError(err?.message || 'Map failed to load');
            } finally {
                setLoading(false);
            }
        };

        initMap();
    }, []);

    // Update markers
    useEffect(() => {
        if (!map) return;

        const updateMarkers = async () => {
            const { importLibrary } = await import('../../lib/googleMapsLoader');
            // Use Marker for now as it's easier, or AdvancedMarkerElement if mapId is set
            const { Marker, InfoWindow } = await importLibrary('maps');

            // Clear existing
            markersRef.current.forEach(marker => marker.setMap(null));
            markersRef.current = [];

            // Add new
            markers.forEach(markerData => {
                const marker = new Marker({
                    position: markerData.position,
                    map,
                    title: markerData.title,
                });

                if (markerData.info) {
                    const infoWindow = new InfoWindow({
                        content: markerData.info,
                    });

                    marker.addListener('click', () => {
                        infoWindow.open(map, marker);
                        onMarkerClick?.(markerData.id);
                    });
                }

                markersRef.current.push(marker);
            });
        };

        updateMarkers();
    }, [map, markers, onMarkerClick]);

    // Update routes
    useEffect(() => {
        if (!map) return;

        const updateRoutes = async () => {
            const { importLibrary } = await import('../../lib/googleMapsLoader');
            const { Polyline } = await importLibrary('maps');

            // Clear existing
            routesRef.current.forEach(route => route.setMap(null));
            routesRef.current = [];

            // Add new
            routes.forEach(routeData => {
                const polyline = new Polyline({
                    path: [routeData.from, routeData.to],
                    geodesic: true,
                    strokeColor: routeData.color || '#FF0000',
                    strokeOpacity: 1.0,
                    strokeWeight: 3,
                    map,
                });

                routesRef.current.push(polyline);
            });
        };

        updateRoutes();
    }, [map, routes]);

    // Update center/zoom
    useEffect(() => {
        if (map) {
            map.setCenter(center);
            map.setZoom(zoom);
        }
    }, [map, center, zoom]);

    if (loading) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0', borderRadius: '8px' }}>
                <div>Loading Map...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0', borderRadius: '8px' }}>
                <div style={{ textAlign: 'center', color: 'red' }}>
                    <div>Error loading map</div>
                    <div style={{ fontSize: '12px' }}>{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={mapRef}
            style={{
                width: '100%',
                height,
                borderRadius: '16px', // Match TrackingPage style
                border: '1px solid #d9d9d9',
            }}
        />
    );
};

export default GoogleMap;
