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
    directions?: {
        origin: string;
        destination: string;
    };
    height?: string;
    onMarkerClick?: (markerId: string) => void;
}

const GoogleMap: React.FC<GoogleMapProps> = ({
    center = { lat: 39.9042, lng: 116.4074 }, // Default
    zoom = 10,
    markers = [],
    routes = [],
    directions,
    height = '400px',
    onMarkerClick,
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const markersRef = useRef<any[]>([]);
    const routesRef = useRef<any[]>([]);
    const directionsRendererRef = useRef<any>(null);

    useEffect(() => {
        const initMap = async () => {
            try {
                setLoading(true);
                setError(null);

                const { loadGoogleMaps, importLibrary } = await import('../../lib/googleMapsLoader');
                const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
                console.log('🗺️ [GoogleMap] Init with Key length:', API_KEY.length);

                await loadGoogleMaps(API_KEY);
                const { Map } = await importLibrary('maps');
                console.log('🗺️ [GoogleMap] Maps Library loaded');

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
                    console.log('🗺️ [GoogleMap] Map Instance created', mapInstance);
                } else {
                    console.error('🗺️ [GoogleMap] mapRef is null!');
                }
            } catch (err: any) {
                console.error('❌ [GoogleMap Component] Google Maps failed to load:', err);
                setError(err?.message || 'Map failed to load');
            } finally {
                setLoading(false);
            }
        };

        if (!map) {
            initMap();
        }
    }, [map]); // Add map dependency to prevent re-init if already exists

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

    // Update manual routes (polylines)
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

    // Handle Directions (Projected Route)
    useEffect(() => {
        console.log('🗺️ [GoogleMap] Directions Effect triggered', { map: !!map, directions });
        if (!map || !directions || !directions.origin || !directions.destination) {
            if (map && (!directions || !directions.origin)) console.warn('🗺️ [GoogleMap] Missing directions data', directions);
            return;
        }

        const renderDirections = async () => {
            console.log('🗺️ [GoogleMap] Rendering Directions function start...');
            try {
                const { importLibrary } = await import('../../lib/googleMapsLoader');
                const { DirectionsService, DirectionsRenderer } = await importLibrary('routes') as any;

                if (!directionsRendererRef.current) {
                    directionsRendererRef.current = new DirectionsRenderer({
                        map,
                        suppressMarkers: false, // Let it show A/B markers
                        polylineOptions: {
                            strokeColor: '#0080FF', // Primary Blue
                            strokeWeight: 5,
                            strokeOpacity: 0.8
                        }
                    });
                }

                const directionsService = new DirectionsService();
                console.log('🗺️ [GoogleMap] Requesting Route:', directions);

                directionsService.route(
                    {
                        origin: directions.origin,
                        destination: directions.destination,
                        travelMode: 'DRIVING',
                    },
                    (result: any, status: any) => {
                        console.log('🗺️ [GoogleMap] Directions Response:', status, result);
                        if (status === 'OK') {
                            directionsRendererRef.current.setDirections(result);
                        } else {
                            console.error(`Directions request failed due to ${status}`);
                            setError(`Route failed: ${status}`);
                        }
                    }
                );

            } catch (e) {
                console.error("Failed to load routes library or render directions", e);
            }
        };

        renderDirections();

    }, [map, directions]);


    // Update center/zoom
    useEffect(() => {
        if (map && !directions) { // Only manually set center if directions aren't controlling the view
            map.setCenter(center);
            map.setZoom(zoom);
        }
    }, [map, center, zoom, directions]);

    // Timeout for loading to prevent infinite spinner
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading && !error) {
                setLoading(false);
                setError('Map loading timed out. Check API Key or Network.');
            }
        }, 10000); // 10s timeout
        return () => clearTimeout(timer);
    }, [loading, error]);

    if (loading) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0', borderRadius: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 24, height: 24, border: '3px solid #ccc', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 8 }}></div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Loading Map...</div>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0', borderRadius: '16px' }}>
                <div style={{ textAlign: 'center', color: '#EF4444', padding: '12px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>Map Error</div>
                    <div style={{ fontSize: '11px', opacity: 0.8 }}>{error}</div>
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
                borderRadius: '16px',
                border: '1px solid var(--glass-border, #e2e8f0)',
                position: 'relative', // Ensure map controls are positioned correctly
                overflow: 'hidden'
            }}
        />
    );
};

export default GoogleMap;
