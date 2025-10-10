import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Card, Spin } from 'antd';

// 临时声明 google，避免缺少类型定义导致的编译错误。建议安装 @types/google.maps 后移除此声明。
declare const google: any;

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

        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          throw new Error('缺少 VITE_GOOGLE_MAPS_API_KEY 配置');
        }
        const loader = new Loader({
          apiKey,
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
        setError('地图加载失败，请检查API密钥配置');
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
            请在环境变量中设置 VITE_GOOGLE_MAPS_API_KEY 并刷新页面
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
