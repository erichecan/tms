import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Card, Spin, message } from 'antd';

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
  center = { lat: 39.9042, lng: 116.4074 }, // 默认北京
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

        // 2025-01-27 17:15:00 使用模拟的Google Maps API Key
        const loader = new Loader({
          apiKey: 'AIzaSyBvOkBw-1234567890abcdefghijklmnop', // 模拟API Key
          version: 'weekly',
          libraries: ['geometry', 'places'],
        });

        const { Map } = await loader.importLibrary('maps');
        
        if (mapRef.current) {
          const mapInstance = new Map(mapRef.current, {
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
        }
      } catch (err) {
        console.error('Google Maps加载失败:', err);
        setError('地图加载失败，使用模拟数据');
        // 2025-01-27 17:15:00 模拟地图加载成功
        setMap(null);
      } finally {
        setLoading(false);
      }
    };

    initMap();
  }, []);

  // 更新标记
  useEffect(() => {
    if (!map) return;

    // 清除现有标记
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // 添加新标记
    markers.forEach(markerData => {
      const marker = new google.maps.Marker({
        position: markerData.position,
        map,
        title: markerData.title,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new google.maps.Size(32, 32),
        },
      });

      if (markerData.info) {
        const infoWindow = new google.maps.InfoWindow({
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

  // 更新路线
  useEffect(() => {
    if (!map) return;

    // 清除现有路线
    routesRef.current.forEach(route => route.setMap(null));
    routesRef.current = [];

    // 添加新路线
    routes.forEach(routeData => {
      const polyline = new google.maps.Polyline({
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

  // 更新地图中心
  useEffect(() => {
    if (map) {
      map.setCenter(center);
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);

  if (loading) {
    return (
      <Card style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#666' }}>正在加载地图...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
          <div style={{ color: '#666' }}>{error}</div>
          <div style={{ color: '#999', fontSize: '12px', marginTop: '8px' }}>
            模拟地图数据：显示 {markers.length} 个标记点
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height,
        borderRadius: '8px',
        border: '1px solid #d9d9d9',
      }}
    />
  );
};

export default GoogleMap;
