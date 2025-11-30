// 2025-11-30T12:00:00Z Created by Assistant: 移动端地图组件
import { useEffect, useRef, useState } from 'react';
import { Card, Toast, Button } from 'antd-mobile';
import { LocationFill } from 'antd-mobile-icons';

export interface MapMarker {
  id: string;
  position: { latitude: number; longitude: number };
  title?: string;
  color?: string;
}

export interface MapRoute {
  from: { latitude: number; longitude: number };
  to: { latitude: number; longitude: number };
}

interface MapViewProps {
  pickup?: { latitude?: number; longitude?: number; addressLine1?: string };
  delivery?: { latitude?: number; longitude?: number; addressLine1?: string };
  currentLocation?: { latitude: number; longitude: number };
  showRoute?: boolean;
  height?: string;
  onNavigate?: (location: { latitude: number; longitude: number }) => void;
}

export default function MapView({
  pickup,
  delivery,
  currentLocation,
  showRoute = false,
  height = '200px',
  onNavigate,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const googleMapsRef = useRef<any>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const routeRef = useRef<google.maps.Polyline | null>(null);

  // 获取 Google Maps API Key
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // 初始化 Google Maps
  useEffect(() => {
    if (!mapRef.current) return;

    // 如果没有 API Key，使用静态地图降级方案
    if (!apiKey) {
      setMapLoaded(false);
      setLoading(false);
      return;
    }

    // 检查是否已经加载 Google Maps 脚本
    if ((window as any).google?.maps) {
      initializeMap();
      return;
    }

    // 加载 Google Maps 脚本
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      googleMapsRef.current = (window as any).google;
      initializeMap();
    };

    script.onerror = () => {
      setError('无法加载 Google Maps');
      setLoading(false);
      setMapLoaded(false);
    };

    document.head.appendChild(script);

    return () => {
      // 清理地图实例
      if (mapInstanceRef.current) {
        // Google Maps 会自动清理
        mapInstanceRef.current = null;
      }
      markersRef.current = [];
      if (routeRef.current) {
        routeRef.current.setMap(null);
        routeRef.current = null;
      }
    };
  }, [apiKey]);

  // 初始化地图
  const initializeMap = () => {
    if (!mapRef.current || !googleMapsRef.current) return;

    try {
      // 计算地图中心点
      const center = calculateCenter();
      
      const map = new googleMapsRef.current.maps.Map(mapRef.current, {
        zoom: calculateZoom(),
        center: { lat: center.latitude, lng: center.longitude },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: 'greedy',
      });

      mapInstanceRef.current = map;

      // 添加标记
      addMarkers(map);
      
      // 添加路线（如果需要）
      if (showRoute && pickup && delivery && pickup.latitude && pickup.longitude && delivery.latitude && delivery.longitude) {
        addRoute(map);
      }

      setMapLoaded(true);
      setLoading(false);
    } catch (err: any) {
      console.error('地图初始化失败:', err);
      setError(err.message || '地图初始化失败');
      setLoading(false);
      setMapLoaded(false);
    }
  };

  // 计算地图中心点
  const calculateCenter = (): { latitude: number; longitude: number } => {
    const points: Array<{ latitude: number; longitude: number }> = [];
    
    if (pickup?.latitude && pickup?.longitude) {
      points.push({ latitude: pickup.latitude, longitude: pickup.longitude });
    }
    if (delivery?.latitude && delivery?.longitude) {
      points.push({ latitude: delivery.latitude, longitude: delivery.longitude });
    }
    if (currentLocation?.latitude && currentLocation?.longitude) {
      points.push(currentLocation);
    }

    if (points.length === 0) {
      return { latitude: 43.6532, longitude: -79.3832 }; // 默认多伦多
    }

    if (points.length === 1) {
      return points[0];
    }

    // 计算所有点的中心
    const avgLat = points.reduce((sum, p) => sum + p.latitude, 0) / points.length;
    const avgLng = points.reduce((sum, p) => sum + p.longitude, 0) / points.length;
    return { latitude: avgLat, longitude: avgLng };
  };

  // 计算合适的缩放级别
  const calculateZoom = (): number => {
    const points: Array<{ latitude: number; longitude: number }> = [];
    
    if (pickup?.latitude && pickup?.longitude) {
      points.push({ latitude: pickup.latitude, longitude: pickup.longitude });
    }
    if (delivery?.latitude && delivery?.longitude) {
      points.push({ latitude: delivery.latitude, longitude: delivery.longitude });
    }
    if (currentLocation?.latitude && currentLocation?.longitude) {
      points.push(currentLocation);
    }

    if (points.length <= 1) {
      return 13;
    }

    // 根据点之间的距离调整缩放级别
    const distances = points.map(p1 => 
      Math.min(...points.filter(p2 => p2 !== p1).map(p2 => 
        calculateDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude)
      ))
    );
    const maxDistance = Math.max(...distances);

    // 根据距离调整缩放级别
    if (maxDistance > 50000) return 8;  // 50km+
    if (maxDistance > 20000) return 9;  // 20-50km
    if (maxDistance > 10000) return 10; // 10-20km
    if (maxDistance > 5000) return 11;  // 5-10km
    if (maxDistance > 2000) return 12;  // 2-5km
    return 13; // < 2km
  };

  // 计算两点之间的距离（公里）
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // 地球半径（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 添加标记
  const addMarkers = (map: google.maps.Map) => {
    if (!googleMapsRef.current) return;

    // 清除现有标记
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // 添加提货地址标记
    if (pickup?.latitude && pickup?.longitude) {
      const marker = new googleMapsRef.current.maps.Marker({
        position: { lat: pickup.latitude, lng: pickup.longitude },
        map: map,
        title: '提货地址',
        icon: {
          path: googleMapsRef.current.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#1890ff',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        label: {
          text: 'P',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 'bold',
        },
      });
      markersRef.current.push(marker);
    }

    // 添加送达地址标记
    if (delivery?.latitude && delivery?.longitude) {
      const marker = new googleMapsRef.current.maps.Marker({
        position: { lat: delivery.latitude, lng: delivery.longitude },
        map: map,
        title: '送达地址',
        icon: {
          path: googleMapsRef.current.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#52c41a',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        label: {
          text: 'D',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 'bold',
        },
      });
      markersRef.current.push(marker);
    }

    // 添加当前位置标记
    if (currentLocation?.latitude && currentLocation?.longitude) {
      const marker = new googleMapsRef.current.maps.Marker({
        position: { lat: currentLocation.latitude, lng: currentLocation.longitude },
        map: map,
        title: '当前位置',
        icon: {
          path: googleMapsRef.current.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#ff4d4f',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });
      markersRef.current.push(marker);
    }
  };

  // 添加路线
  const addRoute = (map: google.maps.Map) => {
    if (!googleMapsRef.current || !pickup?.latitude || !pickup?.longitude || !delivery?.latitude || !delivery?.longitude) {
      return;
    }

    const directionsService = new googleMapsRef.current.maps.DirectionsService();
    const directionsRenderer = new googleMapsRef.current.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true, // 不显示默认标记
    });

    directionsService.route(
      {
        origin: { lat: pickup.latitude, lng: pickup.longitude },
        destination: { lat: delivery.latitude, lng: delivery.longitude },
        travelMode: googleMapsRef.current.maps.TravelMode.DRIVING,
      },
      (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);
        } else {
          console.warn('路线计算失败:', status);
        }
      }
    );
  };

  // 生成静态地图 URL（降级方案）
  const getStaticMapUrl = (): string => {
    const markers: string[] = [];
    
    if (pickup?.latitude && pickup?.longitude) {
      markers.push(`color:blue|label:P|${pickup.latitude},${pickup.longitude}`);
    }
    if (delivery?.latitude && delivery?.longitude) {
      markers.push(`color:green|label:D|${delivery.latitude},${delivery.longitude}`);
    }
    if (currentLocation?.latitude && currentLocation?.longitude) {
      markers.push(`color:red|label:●|${currentLocation.latitude},${currentLocation.longitude}`);
    }

    const center = calculateCenter();
    const markersParam = markers.join('&markers=');
    const size = '400x200';
    const zoom = calculateZoom();

    // 如果没有 API Key，使用无密钥的静态地图（功能受限）
    if (apiKey) {
      return `https://maps.googleapis.com/maps/api/staticmap?center=${center.latitude},${center.longitude}&zoom=${zoom}&size=${size}&markers=${markersParam}&key=${apiKey}`;
    }
    
    // 降级到 OpenStreetMap 静态地图
    return `https://www.openstreetmap.org/export/embed.html?bbox=${center.longitude - 0.01},${center.latitude - 0.01},${center.longitude + 0.01},${center.latitude + 0.01}&layer=mapnik`;
  };

  if (error) {
    return (
      <Card style={{ marginBottom: 12 }}>
        <div style={{ 
          height, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#f5f5f5',
          borderRadius: 8,
        }}>
          <LocationFill style={{ fontSize: 48, color: '#ccc', marginBottom: 8 }} />
          <p style={{ color: '#888', fontSize: 14 }}>地图加载失败</p>
          {pickup?.addressLine1 && (
            <p style={{ color: '#666', fontSize: 12, marginTop: 4 }}>{pickup.addressLine1}</p>
          )}
        </div>
      </Card>
    );
  }

  if (!mapLoaded && !apiKey) {
    // 使用静态地图降级方案
    return (
      <Card style={{ marginBottom: 12 }}>
        <div style={{ 
          height, 
          position: 'relative',
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          <img
            src={getStaticMapUrl()}
            alt="地图"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setError('地图加载失败')}
          />
          {pickup && onNavigate && (
            <Button
              size="mini"
              color="primary"
              fill="outline"
              style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
              }}
              onClick={() => onNavigate(pickup as any)}
            >
              导航
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: 12 }}>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: height,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      />
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.8)',
        }}>
          <p style={{ color: '#888' }}>加载地图中...</p>
        </div>
      )}
    </Card>
  );
}

