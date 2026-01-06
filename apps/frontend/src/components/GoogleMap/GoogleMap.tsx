// ============================================================================
// Google地图组件 - 二期开发功能
// 创建时间: 2025-10-10
// 状态: 已注释，二期恢复
// 说明: 此组件包含Google Maps API集成功能，在一期版本中暂时不使用
// 二期恢复时，请取消注释并确保API密钥配置正确
// ============================================================================

/// <reference types="google.maps" />
import React, { useEffect, useRef, useState } from 'react';
import { Card, Spin } from 'antd';

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
  // 2025-11-24T18:15:00Z Updated by Assistant: 修复类型，使用 google.maps.Map 而不是 any
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const routesRef = useRef<google.maps.Polyline[]>([]);

  // 1. Resource Loading Effect
  useEffect(() => {
    const loadMapScript = async () => {
      try {
        setLoading(true);
        setError(null);

        const mapsServiceInstance = (await import('../../services/mapsService')).default;
        await mapsServiceInstance.initialize();

        // Only stop loading. Do NOT try to init map here.
        // The re-render will create the div, populating mapRef.
        setLoading(false);
      } catch (err: any) {
        console.warn('⚠️ [GoogleMap Component] Google Maps加载失败:', err.message);
        setLoading(false); // Stop loading even on error so we don't get stuck
      }
    };

    loadMapScript();
  }, []);

  // 2. Map Instance Initialization Effect
  useEffect(() => {
    // Wait until loading is done (div is rendered) and map doesn't exist yet
    if (loading || map || !mapRef.current || !window.google?.maps) {
      if (!loading && !window.google?.maps) {
        console.warn('⚠️ [GoogleMap Component] Loading finished but API not ready');
      }
      return;
    }

    try {
      console.log('🚀 [GoogleMap Component] 开始初始化地图实例...');
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
      console.log('✅ [GoogleMap Component] 地图实例创建成功');
    } catch (err) {
      console.error('❌ [GoogleMap Component] 地图实例创建失败:', err);
    }
  }, [loading, map, center, zoom]);

  // 更新标记 - 2025-10-10 17:36:00 使用window.google.maps
  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    // 清除现有标记
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // 添加新标记
    markers.forEach(markerData => {
      const marker = new window.google.maps.Marker({
        position: markerData.position,
        map,
        title: markerData.title,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(32, 32),
        },
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

  // 更新路线 - 2025-10-10 17:36:00 使用window.google.maps
  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    // 清除现有路线
    routesRef.current.forEach(route => route.setMap(null));
    routesRef.current = [];

    // 添加新路线
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
