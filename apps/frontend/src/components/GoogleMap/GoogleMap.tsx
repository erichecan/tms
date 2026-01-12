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
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const routesRef = useRef<google.maps.Polyline[]>([]);

    useEffect(() => {
        const initMap = async () => {
            try {
                setLoading(true);
                setError(null);

                // Dynamic import to avoid SSR issues if any, and circular dependencies

                // This will define window.google
                // Note: mapsService.initialize() doesn't exist in the new service file I created.
                // It exports ensureMapsLoaded indirectly via exported functions.
                // However, I need to load the API first.
                // I can use `loadGoogleMaps` from lib directly or expose a init function in service.
                // But `mapsService` doesn't export `ensureMapsLoaded`.
                // Let's use `loadGoogleMaps` from lib for simplicity here or import it.
                const { loadGoogleMaps } = await import('../../lib/googleMapsLoader');
                const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

                await loadGoogleMaps(API_KEY);

                if (mapRef.current && window.google && window.google.maps) {
                    const mapInstance = new window.google.maps.Map(mapRef.current, {
                        center,
                        zoom,
                        mapTypeId: 'roadmap',
                        styles: [
                            {
                                featureType: 'poi',
                                elementType: 'labels',
                                stylers: [{ visibility: 'off' }],
                            },
                        ],
                    });

                    setMap(mapInstance);
                } else {
                    console.warn('⚠️ [GoogleMap Component] Cannot create map instance');
                }
            } catch (err: any) {
                console.error('❌ [GoogleMap Component] Google Maps failed to load:', err);
                setError(err?.message || 'Map failed to load');
            } finally {
                setLoading(false);
            }
        };

        initMap();
    }, []); // Run once on mount

    // Update markers
    useEffect(() => {
        if (!map || !window.google || !window.google.maps) return;

        // Clear existing
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // Add new
        markers.forEach(markerData => {
            const marker = new window.google.maps.Marker({
                position: markerData.position,
                map,
                title: markerData.title,
                // icon can be customized
            });

            if (markerData.info) {
                const infoWindow = new window.google.maps.InfoWindow({
                    content: markerData.info,
                });

                marker.addListener('click', () => {
                    infoWindow.open(map, marker);
                    onMarkerClick?.(markerData.id);
                });
            }

            markersRef.current.push(marker);
        });
    }, [map, markers, onMarkerClick]);

    // Update routes
    useEffect(() => {
        if (!map || !window.google || !window.google.maps) return;

        // Clear existing
        routesRef.current.forEach(route => route.setMap(null));
        routesRef.current = [];

        // Add new
        routes.forEach(routeData => {
            const polyline = new window.google.maps.Polyline({
                path: [routeData.from, routeData.to],
                geodesic: true,
                strokeColor: routeData.color || '#FF0000',
                strokeOpacity: 1.0,
                strokeWeight: 3,
                map,
            });

            routesRef.current.push(polyline);
        });
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
